// CorkyFeed — a FeedSource backed by a CorkyClient that drives a DataCube.
//
// This is the C3 integration layer: it stitches the FOUNDATION pieces together
//   CorkyClient  (transport: requests / replies / live fan-out)
//   corky-ingest (pure transforms: assembleChunks → buildChartData → applyLiveUpdate)
//   DataCube     (the chart's reactive data model + render-invalidation signal)
// behind the FeedSource contract the UI consumes.
//
// Lifecycle of one subscription:
//   1. accumulate `historical_chunk` events until `historical_complete`,
//   2. assembleChunks → buildChartData → push the FULL {chart,onchart,offchart}
//      into the DataCube via its PUBLIC API (set/add), tagged with the
//      timeframe for the single-tf live invariant,
//   3. route `live_update` events through applyLiveUpdate against the
//      DataCube's OWN (in-place) arrays, then signal a redraw with touchData()
//      — never rebuilding the structure per tick (the same merge+invalidate
//      discipline the existing ws-manager live path uses).

import { CorkyClient } from './corky-client.js'
import { assembleChunks, buildChartData, applyLiveUpdate } from './corky-ingest.js'
import { FeedSource } from './feed-source.js'

export class CorkyFeed extends FeedSource {

    /**
     * @param {object} cfg
     * @param {import('./corky-client.js').CorkyClient} cfg.client - a connected
     *   (or connectable) CorkyClient. Injectable so tests pass a stub/fake.
     * @param {import('../datacube.js').default} cfg.dataCube - the DataCube to
     *   drive. Injectable so tests pass a real headless DataCube.
     */
    constructor({ client, dataCube } = {}) {
        super()
        if (!client) throw new Error('CorkyFeed: `client` is required')
        if (!dataCube) throw new Error('CorkyFeed: `dataCube` is required')
        this.client = client
        this.dc = dataCube

        // Deterministic subscription_id minting (counter + prefix; no randomness
        // / wall-clock), mirroring CorkyClient's request_id discipline.
        this._subCounter = 0

        // subscription_id → handle (the live routing state for that stream).
        this._subs = new Map()
    }

    _nextSubscriptionId() {
        this._subCounter += 1
        return `corky-feed-sub-${this._subCounter}`
    }

    // ── discover ───────────────────────────────────────────────────────────

    /**
     * List the candle-state catalog (venues/symbols/timeframes/indicators)
     * the UI renders. Delegates to the client's list_candle_states command.
     *
     * @param {string} [venue] - optional venue filter.
     * @returns {Promise<any[]>} the `states[]` descriptor array.
     */
    async discover(venue) {
        return this.client.listCandleStates(venue)
    }

    // ── subscribe ──────────────────────────────────────────────────────────

    /**
     * Subscribe to one venue/symbol/timeframe stream and drive the DataCube.
     *
     * @param {{ venue: string, symbol: string, timeframe: string,
     *           indicators?: string[], range?: any }} opts
     * @param {{ onStatus?: (s: any) => void, onError?: (e: any) => void }} [handlers]
     * @returns {Promise<object>} a handle (carries the subscription_id).
     */
    async subscribe(opts = {}, handlers = {}) {
        const { venue, symbol, timeframe, indicators, range } = opts
        const onStatus = handlers.onStatus || (() => {})
        const onError = handlers.onError || (() => {})

        const subscription_id = this._nextSubscriptionId()

        // Per-subscription routing state.
        const handle = {
            subscription_id,
            timeframe,
            chunks: [],            // accumulated historical_chunk events
            history_complete: false,
            liveView: null,        // {chart,onchart,offchart,timeframe} → DC-owned arrays
            lastSeqBySub: {},      // per-sub last sequence (out-of-order guard)
            unsubFanout: null,     // detach the client.onSubscription listener
        }
        this._subs.set(subscription_id, handle)

        // Route every event for this subscription (lifecycle + history + live).
        handle.unsubFanout = this.client.onSubscription(subscription_id, ({ event }) => {
            this._onSubscriptionEvent(handle, event, onStatus, onError)
        })

        try {
            // Kick off the flow. The client resolves this on historical_complete
            // (errors reject); the actual history → DataCube push happens in the
            // event handler so history is assembled exactly once.
            await this.client.subscribeCandles({
                subscription_id,
                venue, symbol, timeframe,
                indicators,
                include_indicators: indicators != null ? true : undefined,
                range,
            })
        } catch (err) {
            onError(err)
            throw err
        }

        return handle
    }

    // Route one per-subscription event to the right stage.
    _onSubscriptionEvent(handle, event, onStatus, onError) {
        if (!event || !event.type) return
        switch (event.type) {
            case 'subscription_accepted':
                onStatus({ phase: 'accepted', subscription_id: handle.subscription_id })
                break
            case 'historical_chunk':
                handle.chunks.push(event)
                onStatus({
                    phase: 'history',
                    subscription_id: handle.subscription_id,
                    chunk_index: event.chunk_index,
                })
                break
            case 'historical_complete':
                this._finishHistory(handle)
                onStatus({ phase: 'history-complete', subscription_id: handle.subscription_id })
                break
            case 'live_update':
                this._applyLive(handle, event, onStatus)
                break
            case 'error':
                onError(event)
                break
            // Other lifecycle events (e.g. heartbeats) are ignored here.
        }
    }

    // History → DataCube (once). Assembles chunks, builds the trading-vue
    // structure, pushes it through the DataCube's PUBLIC API, then captures
    // references to the DC-OWNED arrays so live updates mutate them in place.
    _finishHistory(handle) {
        if (handle.history_complete) return
        handle.history_complete = true

        const rows = assembleChunks(handle.chunks)
        const built = buildChartData(rows, { timeframe: handle.timeframe })

        const dc = this.dc
        // Ensure the data skeleton exists (headless DataCube doesn't run
        // init_data() until mount — calling it here is side-effect-free apart
        // from creating chart/onchart/offchart + the invalidation store).
        if (typeof dc.init_data === 'function' && !dc.data.chart) dc.init_data()

        // Push candles via the public data API. `set` replaces the series.
        dc.data.chart.type = built.chart.type
        dc.set('chart.data', built.chart.data)
        // Tag the chart-data object with the timeframe (single-tf invariant for
        // applyLiveUpdate — foreign-tf live rows are dropped).
        dc.data.chart.tf = handle.timeframe

        // Add each overlay to its pane. `add` assigns ids + appends to the live
        // onchart/offchart arrays the DataCube owns.
        for (const ov of built.onchart) dc.add('onchart', ov)
        for (const ov of built.offchart) dc.add('offchart', ov)

        // Build a LIVE VIEW that points at the DataCube's OWN arrays/overlays so
        // applyLiveUpdate mutates the live model in place (no per-tick rebuild).
        handle.liveView = {
            timeframe: handle.timeframe,
            chart: dc.data.chart,           // { type, data:[...] } — the live OHLCV array
            onchart: dc.data.onchart,       // live overlay objects (with .settings.corkyKey)
            offchart: dc.data.offchart,
        }

        // Signal a redraw for the freshly-loaded history.
        dc.touchData()
    }

    // One live tick → in-place upsert + invalidate. Duplicate / out-of-order
    // sequences are dropped by applyLiveUpdate (no redraw signalled then).
    _applyLive(handle, event, onStatus) {
        if (!handle.liveView) return // live before history-complete: ignore
        const res = applyLiveUpdate(handle.liveView, event, handle.lastSeqBySub)
        if (res.applied) {
            this.dc.touchData()
            onStatus({
                phase: 'live',
                subscription_id: handle.subscription_id,
                sequence: res.sequence,
            })
        }
    }

    // ── unsubscribe / destroy ────────────────────────────────────────────────

    /**
     * Stop a stream and release its routing.
     * @param {object|string} handle - the handle from subscribe(), or a raw id.
     * @returns {Promise<void>}
     */
    async unsubscribe(handle) {
        const id = typeof handle === 'string' ? handle : (handle && handle.subscription_id)
        if (!id) return
        const h = this._subs.get(id)
        if (h && h.unsubFanout) h.unsubFanout()
        this._subs.delete(id)
        await this.client.unsubscribe(id)
    }

    /** Unsubscribe every stream and close the client. */
    destroy() {
        const ids = [...this._subs.keys()]
        for (const id of ids) {
            const h = this._subs.get(id)
            if (h && h.unsubFanout) h.unsubFanout()
            // Fire-and-forget the unsubscribe command; we're tearing down.
            // unsubscribe() is async and the client.close() below rejects any
            // in-flight request, so attach a no-op catch to avoid an unhandled
            // rejection (the sync try/catch alone would NOT catch that).
            Promise.resolve(this.client.unsubscribe(id)).catch(() => {})
        }
        this._subs.clear()
        if (typeof this.client.close === 'function') this.client.close()
    }
}

export default CorkyFeed
