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
    constructor({ client, dataCube, subscribeTimeoutMs = 30000 } = {}) {
        super()
        if (!client) throw new Error('CorkyFeed: `client` is required')
        if (!dataCube) throw new Error('CorkyFeed: `dataCube` is required')
        this.client = client
        this.dc = dataCube

        // Safety net: if the gateway never sends historical_complete NOR an
        // error (a silent hang — e.g. a stuck/unhealthy runtime), fail the
        // subscribe after this long so the UI shows a clean error instead of
        // spinning forever. 0/null disables. (The gateway usually DOES send a
        // 'timed out waiting for historical candles' error itself.)
        this.subscribeTimeoutMs = subscribeTimeoutMs

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
        const { venue, symbol, timeframe, indicators, range, views } = opts
        const onStatus = handlers.onStatus || (() => {})
        const onError = handlers.onError || (() => {})

        const subscription_id = this._nextSubscriptionId()

        // Per-subscription routing state.
        const handle = {
            subscription_id,
            timeframe,
            chunks: [],            // accumulated historical_chunk events
            history_complete: false,
            // FULL built structure (candles + EVERY indicator overlay). This is
            // the source of truth live updates are applied to so that a series
            // toggled on later shows up-to-date data. Only the candles (and
            // toggled-on overlays) are ever pushed to the DataCube.
            built: null,           // {chart,onchart,offchart,timeframe}
            liveView: null,        // === built (applyLiveUpdate target)
            views: views || null,      // display_label → { kind, view } (descriptor views)
            enabledKinds: new Set(),   // indicator kinds currently shown in the DC
            enabledLayers: new Set(),  // per-layer ids currently shown (view.layers)
            addedOverlays: new Set(),  // overlay objects currently added to the DC
            lastSeqBySub: {},      // per-sub last sequence (out-of-order guard)
            unsubFanout: null,     // detach the client.onSubscription listener
        }
        this._subs.set(subscription_id, handle)

        // Route every event for this subscription (lifecycle + history + live).
        handle.unsubFanout = this.client.onSubscription(subscription_id, ({ event }) => {
            this._onSubscriptionEvent(handle, event, onStatus, onError)
        })

        let timer = null
        try {
            // Kick off the flow. The client resolves this on historical_complete
            // (errors reject); the actual history → DataCube push happens in the
            // event handler so history is assembled exactly once.
            const flow = this.client.subscribeCandles({
                subscription_id,
                venue, symbol, timeframe,
                // The candle-state already MAINTAINS its indicator set (via
                // upsert/patch). On subscribe we only flag include_indicators so
                // the rows carry those indicators. We deliberately do NOT forward
                // the UI display-labels (e.g. "SMA(20)") as the wire `indicators`
                // filter — that is not the gateway's expected shape and makes the
                // historical request hang. `opts.indicators` stays a UI concern.
                include_indicators: indicators != null ? true : undefined,
                range,
            })
            // Race a timeout so a silent gateway/runtime hang surfaces cleanly.
            if (this.subscribeTimeoutMs > 0) {
                const guard = new Promise((_, reject) => {
                    timer = setTimeout(() => {
                        const e = new Error(
                            `Timed out after ${this.subscribeTimeoutMs / 1000}s waiting for ` +
                            `historical candles (${venue}:${symbol} ${timeframe}). ` +
                            `The gateway/runtime may be unhealthy.`)
                        e.code = 'subscribe_timeout'
                        e.retryable = true
                        reject(e)
                    }, this.subscribeTimeoutMs)
                })
                await Promise.race([flow, guard])
            } else {
                await flow
            }
        } catch (err) {
            // Clean up routing on failure/timeout (don't leak the per-sub
            // fan-out listener or the _subs entry — the recurring teardown bug).
            if (handle.unsubFanout) handle.unsubFanout()
            this._subs.delete(subscription_id)
            onError(err)
            throw err
        } finally {
            if (timer) clearTimeout(timer)
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

    // History → DataCube (once). Assembles chunks, builds the FULL trading-vue
    // structure (candles + EVERY indicator overlay) and RETAINS it on the
    // handle as the live source of truth — but pushes only the CANDLES to the
    // DataCube. Indicator overlays start hidden (candles-only default) and are
    // added/removed client-side by setIndicatorEnabled().
    _finishHistory(handle) {
        if (handle.history_complete) return
        handle.history_complete = true

        const rows = assembleChunks(handle.chunks)
        const built = buildChartData(rows, { timeframe: handle.timeframe, views: handle.views })
        // Tag the FULL structure with the timeframe so applyLiveUpdate's single-
        // tf invariant works when it mutates `built` directly.
        built.timeframe = handle.timeframe

        const dc = this.dc
        // Ensure the data skeleton exists (headless DataCube doesn't run
        // init_data() until mount — calling it here is side-effect-free apart
        // from creating chart/onchart/offchart + the invalidation store).
        if (typeof dc.init_data === 'function' && !dc.data.chart) dc.init_data()

        // Reset the indicator panes to the candles-only baseline. The shared
        // DataCube is reused across selects; without this, overlays a user
        // toggled on for a PREVIOUS timeframe stay orphaned here (not in the new
        // handle.built, so live ticks never refresh them) and keep rendering the
        // old series on the new chart. The new handle starts with empty
        // enabledKinds/addedOverlays, so this keeps DC ↔ handle in sync.
        if (dc.data.onchart) dc.data.onchart.length = 0
        if (dc.data.offchart) dc.data.offchart.length = 0
        // If the user had DETACHED volume into an offchart pane, the wipe above
        // removed that pane — but the candle-pane copy is hidden (showVolume=
        // false). Restore it so volume doesn't vanish entirely on a tf re-select
        // (the detach preference resets to the default 'attached' on each load).
        if (dc.data.chart && dc.data.chart.settings) dc.data.chart.settings.showVolume = true
        if (typeof dc.update_ids === 'function') dc.update_ids()

        // Push candles via the public data API. `set` replaces the series, but
        // we want the DataCube's chart.data to be the SAME array object as
        // built.chart.data so live upserts (which mutate built.chart.data) are
        // visible to the chart in place. `set('chart.data', arr)` assigns the
        // array by reference, satisfying that.
        dc.data.chart.type = built.chart.type
        dc.set('chart.data', built.chart.data)
        // Tag the chart-data object with the timeframe (single-tf invariant for
        // applyLiveUpdate — foreign-tf live rows are dropped).
        dc.data.chart.tf = handle.timeframe

        // RETAIN the full built structure as the live model. `liveView === built`
        // so applyLiveUpdate keeps EVERY indicator series fresh (enabled or not)
        // and, because each enabled overlay added to the DataCube is the SAME
        // object as in `built` (we push the built overlay objects directly in
        // setIndicatorEnabled), its `.data` updates in place.
        handle.built = built
        handle.liveView = built
        handle.enabledKinds = new Set()
        handle.addedOverlays = new Set()

        // Signal a redraw for the freshly-loaded history (candles only).
        dc.touchData()
    }

    // ── selective indicator overlays (client-side toggle) ───────────────────

    /**
     * Show/hide every overlay of a given indicator KIND in the DataCube,
     * WITHOUT re-subscribing — the data is already loaded and kept fresh on
     * `handle.built`. Idempotent.
     *
     * on  → dc.add(pane, ov) for each handle.built overlay whose
     *       settings.corkyKind === kind that isn't already added (the SAME
     *       overlay object, so live upserts mutate it in place); track the
     *       added overlay for later removal.
     * off → dc.del(ov.id) for each tracked overlay of that kind.
     *
     * @param {object} handle - the subscribe() handle.
     * @param {string} kind   - indicator kind (e.g. 'MACD'); matched against
     *                          settings.corkyKind.
     * @param {boolean} on    - enable (show) or disable (hide).
     * @returns {boolean} whether this kind actually has overlays in the loaded
     *   data (so the caller knows whether the toggle was meaningful).
     */
    setIndicatorEnabled(handle, kind, on) {
        if (!handle || !handle.built) return false
        const dc = this.dc
        const built = handle.built
        const overlays = [...built.onchart, ...built.offchart]
            .filter(ov => ov.settings && ov.settings.corkyKind === kind)

        // For view-driven overlays, auto-add ONLY visible_by_default layers; a
        // hidden view layer is opt-in via setLayerEnabled. Fallback overlays
        // (no corkyView) always add (legacy plot-every-output behaviour).
        const autoVisible = (ov) =>
            !ov.settings.corkyView || ov.settings.corkyVisibleDefault !== false

        let changed = false
        if (on) {
            for (const ov of built.onchart) {
                if (ov.settings && ov.settings.corkyKind === kind && autoVisible(ov) &&
                    !handle.addedOverlays.has(ov)) {
                    dc.add('onchart', ov)   // assigns ov.id, appends by reference
                    handle.addedOverlays.add(ov)
                    if (ov.settings.corkyLayerId) handle.enabledLayers.add(ov.settings.corkyLayerId)
                    changed = true
                }
            }
            for (const ov of built.offchart) {
                if (ov.settings && ov.settings.corkyKind === kind && autoVisible(ov) &&
                    !handle.addedOverlays.has(ov)) {
                    dc.add('offchart', ov)
                    handle.addedOverlays.add(ov)
                    if (ov.settings.corkyLayerId) handle.enabledLayers.add(ov.settings.corkyLayerId)
                    changed = true
                }
            }
            if (overlays.length) handle.enabledKinds.add(kind)
        } else {
            for (const ov of overlays) {
                if (handle.addedOverlays.has(ov)) {
                    this._removeOverlay(dc, ov)
                    handle.addedOverlays.delete(ov)
                    changed = true
                }
            }
            handle.enabledKinds.delete(kind)
        }

        if (changed) dc.touchData()
        return overlays.length > 0
    }

    /**
     * Show/hide a single view LAYER (for opt-in of hidden layers like TL/TH/
     * diagnostics). Matches built overlays by settings.corkyLayerId and add/
     * removes them by object identity (NOT dc.del — substring-id hazard).
     * @returns {boolean} whether any overlay matched the layer.
     */
    setLayerEnabled(handle, layerId, on) {
        if (!handle || !handle.built || !layerId) return false
        const dc = this.dc
        const built = handle.built
        let changed = false
        let matched = false
        if (on) {
            for (const pane of ['onchart', 'offchart']) {
                for (const ov of built[pane]) {
                    if (ov.settings && ov.settings.corkyLayerId === layerId) {
                        matched = true
                        if (!handle.addedOverlays.has(ov)) {
                            dc.add(pane, ov)
                            handle.addedOverlays.add(ov)
                            changed = true
                        }
                    }
                }
            }
            if (matched) handle.enabledLayers.add(layerId)
        } else {
            for (const pane of ['onchart', 'offchart']) {
                for (const ov of built[pane]) {
                    if (ov.settings && ov.settings.corkyLayerId === layerId) {
                        matched = true
                        if (handle.addedOverlays.has(ov)) {
                            this._removeOverlay(dc, ov)
                            handle.addedOverlays.delete(ov)
                            changed = true
                        }
                    }
                }
            }
            handle.enabledLayers.delete(layerId)
        }
        if (changed) dc.touchData()
        return matched
    }

    // Remove one overlay by OBJECT IDENTITY. We must NOT use dc.del(ov.id):
    // querySearch matches ids by SUBSTRING (`x.id.includes(path)`), so deleting
    // e.g. 'onchart.Splines1' would ALSO delete 'onchart.Splines10/11/12' —
    // and macd/bbands/kc/stoch all map to the 'Splines' overlay type, so this
    // collision is reachable. Splice the exact object, then renumber ids via
    // the DataCube's public update_ids().
    _removeOverlay(dc, ov) {
        for (const pane of ['onchart', 'offchart']) {
            const arr = dc.data[pane]
            const i = arr ? arr.indexOf(ov) : -1
            if (i !== -1) {
                arr.splice(i, 1)
                if (typeof dc.update_ids === 'function') dc.update_ids()
                return
            }
        }
    }

    /** Indicator kinds currently shown in the DataCube for a handle. */
    enabledKinds(handle) {
        return handle && handle.enabledKinds
            ? new Set(handle.enabledKinds) : new Set()
    }

    // One live tick → in-place upsert + invalidate. Duplicate / out-of-order
    // sequences are dropped by applyLiveUpdate (no redraw signalled then).
    _applyLive(handle, event, onStatus) {
        if (!handle.liveView) {
            // live before history-complete: ignore
            this._debugLive(event, { applied: false, reason: 'before-history' }, handle)
            return
        }
        const res = applyLiveUpdate(handle.liveView, event, handle.lastSeqBySub)
        this._debugLive(event, res, handle)
        if (res.applied) {
            this.dc.touchData()
            onStatus({
                phase: 'live',
                subscription_id: handle.subscription_id,
                sequence: res.sequence,
            })
        }
    }

    // Diagnostic for the "current candle drawn once, never updated" report.
    // Opt-in (zero cost otherwise): set `window.__CORKY_DEBUG = true` in the
    // browser console, then watch the live stream. Each live_update logs its
    // sequence, candle ts/close, and whether it was APPLIED or dropped (and
    // why). If intra-candle ticks log `dropped: stale-sequence`, the gateway's
    // `sequence` isn't per-message monotonic; if they never log at all, the
    // gateway isn't sending intra-candle ticks (cadence, not a frontend bug).
    _debugLive(event, res, handle) {
        const dbg = typeof window !== 'undefined' && window.__CORKY_DEBUG
        if (!dbg) return
        const c = event && event.row && event.row.candle
        // eslint-disable-next-line no-console
        console.log('[corky live]', {
            seq: event && event.sequence,
            ts: c && c.timestamp_ms,
            close: c && c.close,
            tf: event && event.row && event.row.timeframe,
            applied: !!(res && res.applied),
            reason: res && res.reason,
            lastSeq: handle && handle.lastSeqBySub
                ? handle.lastSeqBySub[handle.subscription_id] : undefined,
        })
    }

    // ── unsubscribe / destroy ────────────────────────────────────────────────

    // Release a handle's retained model so no overlays/ids leak after teardown.
    // (Does NOT touch the DataCube — the caller decides whether the DC is reset
    // or reused by the next subscription.)
    _clearHandle(h) {
        if (!h) return
        h.built = null
        h.liveView = null
        if (h.enabledKinds) h.enabledKinds.clear()
        if (h.addedOverlays) h.addedOverlays.clear()
    }

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
        this._clearHandle(h)
        this._subs.delete(id)
        await this.client.unsubscribe(id)
    }

    /** Unsubscribe every stream and close the client. */
    destroy() {
        const ids = [...this._subs.keys()]
        for (const id of ids) {
            const h = this._subs.get(id)
            if (h && h.unsubFanout) h.unsubFanout()
            this._clearHandle(h)
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
