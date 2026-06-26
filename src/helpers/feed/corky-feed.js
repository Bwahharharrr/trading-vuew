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
import { assembleChunks, buildChartData, applyLiveUpdate, columnarChunkToRows, rowToOhlcv } from './corky-ingest.js'
import { FeedSource } from './feed-source.js'

// Case-insensitive indicator-kind equality. The wire/UI may carry a display
// label ('SMA(20)') while overlays tag the bare kind ('sma'); kindOf/resolveView
// already normalise this way, so toggles must match the same way or hit nothing.
function kindEq(a, b) {
    return String(a).toLowerCase() === String(b).toLowerCase()
}

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
        // / wall-clock), mirroring CorkyClient's request_id discipline. The
        // per-instance _feedId disambiguates concurrent feeds sharing one client.
        this._feedId = (CorkyFeed._seq = (CorkyFeed._seq || 0) + 1)
        this._subCounter = 0

        // subscription_id → handle (the live routing state for that stream).
        this._subs = new Map()

        // subscription_id of the most-recent subscribe() — the only stream allowed
        // to mutate the DataCube. Guards against a superseded in-flight subscribe's
        // late historical_complete clobbering a newer selection (mid-load re-select).
        this._activeSubId = null

        // Wire connection-lifecycle events so a reconnect resubscribes (the gateway
        // has no session resume — without this the feed goes silently stale after a
        // drop) and an exhausted reconnect surfaces as an error instead of a freeze.
        // Guarded: test fakes may not implement on(). off-handles cleaned in destroy.
        this._offClientEvents = []
        if (typeof this.client.on === 'function') {
            this._offClientEvents.push(
                this.client.on('open', () => this._onClientOpen()),
                this.client.on('reconnect-exhausted', (e) => this._onReconnectExhausted(e)),
            )
        }
        // True until the FIRST socket open: the initial connect's 'open' must NOT
        // trigger a resubscribe (there is nothing to resubscribe yet).
        this._everOpened = false
    }

    _nextSubscriptionId() {
        this._subCounter += 1
        // Prefix with a per-instance feed id so MULTIPLE concurrent feeds over the
        // SAME client (one CorkyFeed per chart tab) never mint colliding
        // subscription_ids — the client fans live_update out by subscription_id,
        // so a collision would cross-wire two tabs' streams.
        return `corky-feed-${this._feedId}-sub-${this._subCounter}`
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

    /**
     * One-shot historical candle fetch for a fixed [start_ms, end_ms] window —
     * powers the chart's lazy "load older candles on pan-left" loader. Runs on
     * its OWN subscription id (NEVER the active live stream, and not registered
     * in `_subs`, so a concurrent re-select can't tear it down or be torn down by
     * it), collects the historical chunks, unsubscribes the live tail, and
     * returns ascending OHLCV rows. Candles only (no indicators) and no DataCube
     * side effects — the caller merges the rows into chart.data.
     *
     * @returns {Promise<Array<[number,number,number,number,number,number]>>}
     */
    async fetchHistory({ venue, symbol, timeframe, start_ms, end_ms, chunk_rows = 500 } = {}) {
        if (!venue || !symbol || !timeframe) return []
        if (!(Number(end_ms) > Number(start_ms))) return []
        const subscription_id = `${this._nextSubscriptionId()}-backfill`
        const chunks = []
        try {
            await this.client.subscribeCandles({
                subscription_id, venue, symbol, timeframe,
                range: { type: 'start_end', start_ms, end_ms },
                include_indicators: false, chunk_rows,
                ack_mode: 'summary', historical_format: 'columnar',
                onEvent: ({ event }) => {
                    if (!event) return
                    if (event.type === 'historical_chunk') chunks.push(event)
                    else if (event.type === 'historical_chunk_columnar') {
                        chunks.push(columnarChunkToRows(event, timeframe))
                    }
                },
            })
        } finally {
            // We only wanted the fixed window — stop any live tail the gateway
            // starts after history (best-effort; the request already resolved).
            Promise.resolve(this.client.unsubscribe(subscription_id)).catch(() => {})
        }
        return assembleChunks(chunks).map(rowToOhlcv).filter((r) => Number.isFinite(r[0]))
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
        const {
            venue, symbol, timeframe, indicators, range, views, enabled,
            target_runtime_id, chunk_rows,
            // Optimized chart-load path by DEFAULT (the gateway is back-compat and
            // this feed accepts both the old and new response shapes). 'summary'
            // skips resending the full state descriptor; 'columnar' ships compact
            // historical chunks. Callers can override per subscribe.
            ack_mode = 'summary', historical_format = 'columnar',
        } = opts
        const onStatus = handlers.onStatus || (() => {})
        const onError = handlers.onError || (() => {})

        // Single active subscription: supersede any still-loading prior stream so
        // a mid-load re-select can neither double-subscribe nor let the abandoned
        // selection's late historical_complete clobber the chart. Detaching its
        // fan-out stops its events routing; unsubscribe stops the gateway stream.
        // (Completed subscriptions are the caller's to unsubscribe() explicitly.)
        for (const [sid, h] of this._subs) {
            if (h.history_complete) continue
            if (h.unsubFanout) h.unsubFanout()
            this._subs.delete(sid)
            Promise.resolve(this.client.unsubscribe(sid)).catch(() => {})
        }

        const subscription_id = this._nextSubscriptionId()
        this._activeSubId = subscription_id

        // Per-subscription routing state.
        const handle = {
            subscription_id,
            timeframe,
            // Everything needed to RE-issue this subscribe on reconnect (the gateway
            // forgets the subscription on a drop). include_indicators mirrors the
            // subscribeCandles call below; opts.indicators stays a UI concern.
            subscribeArgs: {
                venue, symbol, timeframe,
                include_indicators: indicators != null ? true : undefined,
                range,
                chunk_rows,          // gateway chunk size (position windows use 500)
                target_runtime_id,   // re-targeted on reconnect re-issue (spread below)
                ack_mode, historical_format, // preserved across reconnect re-issue
            },
            onStatus, onError,     // retained so reconnect/exhaustion can report
            subscribePending: true, // original subscribe() still awaiting (cleared in finally)
            chunks: [],            // accumulated historical_chunk events
            history_complete: false,
            liveAnnounced: false,  // onStatus({phase:'live'}) is emitted ONCE (perf)
            hiddenLayers: new Set(), // layer ids the user explicitly hid (not resurrected)
            // FULL built structure (candles + EVERY indicator overlay). This is
            // the source of truth live updates are applied to so that a series
            // toggled on later shows up-to-date data. Only the candles (and
            // toggled-on overlays) are ever pushed to the DataCube.
            built: null,           // {chart,onchart,offchart,timeframe}
            liveView: null,        // === built (applyLiveUpdate target)
            views: views || null,      // display_label → { kind, view } (descriptor views)
            enabled: enabled || null,  // { kinds:[{display_label,kind}], layers:[layerId] } to re-apply
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
                target_runtime_id,   // own the runtime from discovery (preferred pattern)
                // The candle-state already MAINTAINS its indicator set (via
                // upsert/patch). On subscribe we only flag include_indicators so
                // the rows carry those indicators. We deliberately do NOT forward
                // the UI display-labels (e.g. "SMA(20)") as the wire `indicators`
                // filter — that is not the gateway's expected shape and makes the
                // historical request hang. `opts.indicators` stays a UI concern.
                include_indicators: indicators != null ? true : undefined,
                range,
                chunk_rows,
                ack_mode, historical_format,
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
            // Tell the gateway to drop the subscription too: on a timeout (or any
            // error after the command was sent) the gateway may be alive-but-slow
            // and would otherwise stream a fan-out nobody consumes for the session.
            Promise.resolve(this.client.unsubscribe(subscription_id)).catch(() => {})
            // SUPERSEDED subscribe (the user re-selected mid-load): its late
            // failure — typically the 30s timeout of the abandoned stream — must
            // stay QUIET. Reporting it would clobber the live selection's error
            // state, and rethrowing a retryable error made App's retry scheduler
            // re-select the ABANDONED symbol, silently reverting the user's pick.
            if (subscription_id !== this._activeSubId) {
                err.superseded = true
                return null
            }
            onError(err)
            throw err
        } finally {
            handle.subscribePending = false
            if (timer) clearTimeout(timer)
        }

        return handle
    }

    // Route one per-subscription event to the right stage.
    _onSubscriptionEvent(handle, event, onStatus, onError) {
        if (!event || !event.type) return
        switch (event.type) {
            // Both accept shapes settle the same way (the request still resolves on
            // historical_complete). 'summary' omits the full descriptor — we read
            // descriptor metadata from discovery, so nothing else is needed here.
            case 'subscription_accepted':
            case 'subscription_accepted_summary':
                onStatus({ phase: 'accepted', subscription_id: handle.subscription_id })
                break
            // Row chunks and columnar chunks feed the SAME pipeline: a columnar
            // chunk is reconstructed into the row-chunk shape, then handled
            // identically (assembleChunks → buildChartData).
            case 'historical_chunk':
            case 'historical_chunk_columnar': {
                // Ignore late chunks once history is built: they have no consumer
                // and would only grow handle.chunks unboundedly (memory leak).
                if (handle.history_complete) break
                const chunk = event.type === 'historical_chunk_columnar'
                    ? columnarChunkToRows(event, handle.timeframe)
                    : event
                handle.chunks.push(chunk)
                onStatus({
                    phase: 'history',
                    subscription_id: handle.subscription_id,
                    chunk_index: event.chunk_index,
                })
                break
            }
            case 'historical_complete':
                if (this._finishHistory(handle, onError)) {
                    onStatus({ phase: 'history-complete', subscription_id: handle.subscription_id })
                }
                break
            case 'live_update':
                this._applyLive(handle, event, onStatus, onError)
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
    // @returns {boolean} whether history was (re)built this call — false if it
    //   was a no-op (already complete) or skipped (superseded / build failed), so
    //   the caller only emits 'history-complete' on a genuine build.
    _finishHistory(handle, onError = () => {}) {
        if (handle.history_complete) return false
        // A superseded in-flight subscription (newer selection took over) must
        // NEVER touch the DataCube — its late historical_complete would clobber
        // the newer chart. Detaching the fan-out usually prevents this; this is
        // defense in depth for an event already queued before detach.
        if (!this._subs.has(handle.subscription_id) ||
            handle.subscription_id !== this._activeSubId) return false

        let built
        try {
            const rows = assembleChunks(handle.chunks)
            built = buildChartData(rows, { timeframe: handle.timeframe, views: handle.views })
        } catch (err) {
            // A single malformed row used to throw here BEFORE history_complete was
            // set, silently blocking all reprocessing AND every live update (a
            // permanently blank chart with no error). Surface it and leave
            // history_complete false so a resubscribe can retry cleanly.
            onError(err)
            return false
        }
        // Build succeeded: NOW mark complete (so a thrown build above doesn't wedge
        // the stream) and release the raw chunk payload (consumed once; retaining
        // it leaks ~the full wire history for the session).
        handle.history_complete = true
        handle.chunks.length = 0
        handle.liveAnnounced = false
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
        handle.enabledLayers = new Set()
        handle.addedOverlays = new Set()

        // Re-apply the caller's persisted enabled indicators + hidden layers.
        // A tf-switch tears down the old handle and wipes the DC overlays above,
        // so without this the user's shown indicators/layers vanish on every
        // timeframe change. Idempotent + a no-op for kinds/layers absent here.
        this._reapplyEnabled(handle)

        // Signal a redraw for the freshly-loaded history.
        dc.touchData()
        return true
    }

    // Re-apply handle.enabled = { kinds:[{kind}], layers:[layerId],
    // hiddenLayers:[layerId] } onto the freshly-built data (used after a
    // tf-switch rebuild and on reload-restore).
    _reapplyEnabled(handle) {
        const en = handle.enabled
        if (!en) return
        // Seed explicit hides FIRST so setIndicatorEnabled's autoVisible skips
        // them — otherwise a reload/tf-switch resurrects a default-visible layer
        // the user closed (e.g. the MACD bull-strength pane's [x]).
        if (!handle.hiddenLayers) handle.hiddenLayers = new Set()
        for (const id of (en.hiddenLayers || [])) handle.hiddenLayers.add(id)
        for (const k of (en.kinds || [])) {
            // Pass display_label as the unique instance so a tf-switch restores
            // SCMR and SCMR(INV) to their OWN colouring (not the collapsed kind).
            if (k && k.kind) this.setIndicatorEnabled(handle, k.kind, true, k.display_label || null)
        }
        for (const layerId of (en.layers || [])) {
            this.setLayerEnabled(handle, layerId, true)
        }
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
     * @param {string} [instance] - the UNIQUE indicator instance = its
     *   display_label (e.g. 'SCMR' vs 'SCMR(INV)'). `kindOf` collapses these two
     *   to the same 'SCMR', which would let one's candle colouring overwrite the
     *   other; pass the display_label so candle colour is keyed by the distinct
     *   instance. Optional — omitted callers fall back to kind matching.
     * @returns {boolean} whether this kind actually has overlays in the loaded
     *   data (so the caller knows whether the toggle was meaningful).
     */
    setIndicatorEnabled(handle, kind, on, instance = null) {
        if (!handle || !handle.built) return false
        if (!handle.hiddenLayers) handle.hiddenLayers = new Set()
        const dc = this.dc
        const built = handle.built
        // Match kind case-INSENSITIVELY: kindOf/resolveView/_applyCandleColor all
        // tolerate the display-label wire form ('SMA(20)' → 'SMA'), so an exact
        // === would silently match zero overlays for that form.
        // Match this kind's overlays, SCOPED to the unique INSTANCE when given.
        // Two instances of the same kind (SCMR + SCMR(INV) both report corkyKind
        // 'SCMR') share layer ids, so a kind-only match toggled BOTH siblings'
        // line/marker/diagnostic overlays — enabling SCMR also drew SCMR(INV)'s
        // reversal markers, and disabling SCMR(INV) tore down SCMR's. (The
        // candle_color path and setLayerEnabled already scope this way.) Fallback
        // overlays carry no corkyInstance → kind match (legacy single-instance).
        const matchOv = (ov) => ov.settings && kindEq(ov.settings.corkyKind, kind) &&
            (instance == null || ov.settings.corkyInstance == null ||
                ov.settings.corkyInstance === instance)
        const overlays = [...built.onchart, ...built.offchart].filter(matchOv)

        // For view-driven overlays, auto-add ONLY visible_by_default layers that
        // the user has not explicitly hidden; a hidden view layer is opt-in via
        // setLayerEnabled, and a layer turned off must not be resurrected by a
        // kind off→on cycle or a tf-switch reapply. Fallback overlays (no
        // corkyView) always add (legacy plot-every-output behaviour).
        // Hidden check tolerates BOTH key forms: instance-scoped corkyKey
        // ('SCMR(INV)#trade_lines', the form setLayerEnabled now writes) and the
        // legacy bare layer id from older persisted sessions.
        const autoVisible = (ov) =>
            (!ov.settings.corkyView || ov.settings.corkyVisibleDefault !== false) &&
            !(ov.settings.corkyKey && handle.hiddenLayers.has(ov.settings.corkyKey)) &&
            !(ov.settings.corkyLayerId && handle.hiddenLayers.has(ov.settings.corkyLayerId))

        let changed = false
        if (on) {
            for (const pane of ['onchart', 'offchart']) {
                for (const ov of built[pane]) {
                    if (matchOv(ov) && autoVisible(ov) &&
                        !handle.addedOverlays.has(ov)) {
                        this._addOverlay(dc, pane, ov)
                        handle.addedOverlays.add(ov)
                        if (ov.settings.corkyLayerId) {
                            handle.enabledLayers.add(ov.settings.corkyKey || ov.settings.corkyLayerId)
                        }
                        changed = true
                    }
                }
            }
            if (overlays.length) handle.enabledKinds.add(kind)
        } else {
            for (const ov of overlays) {
                if (handle.addedOverlays.has(ov)) {
                    this._removeOverlay(dc, ov)
                    handle.addedOverlays.delete(ov)
                    if (ov.settings.corkyLayerId) {
                        handle.enabledLayers.delete(ov.settings.corkyKey || ov.settings.corkyLayerId)
                        handle.enabledLayers.delete(ov.settings.corkyLayerId) // legacy form
                    }
                    changed = true
                }
            }
            handle.enabledKinds.delete(kind)
        }

        // Apply / clear candle colouring for THIS instance (candle_color layers
        // are not overlays — they stamp the candle colour slot, gated on enable so
        // the candles-only default stays plain red/green). Keyed by the unique
        // instance so SCMR and SCMR(INV) — which share kind 'SCMR' and the layer
        // id 'scmr_candle_color' — don't collapse onto one another.
        const hadCandleColor = this._applyCandleColor(handle, kind, on, instance)
        if (hadCandleColor) changed = true

        if (changed) { this._normalizeOffchartGrids(handle); dc.touchData() }
        return overlays.length > 0 || hadCandleColor
    }

    // Stamp (on) / clear (off) the candle colour slot (index 6) for an indicator's
    // candle_color layers, using the build-time _candleColor metadata. Tracks
    // built._candleColorActive (by UNIQUE instanceKey) so applyLiveUpdate only
    // re-stamps enabled instances.
    // @param {string} [instance] unique instance (display_label) to scope to;
    //   without it, falls back to (collapsible) kind matching.
    // @returns {boolean} whether this instance/kind had any candle_color layer.
    _applyCandleColor(handle, kind, on, instance = null) {
        const built = handle && handle.built
        const cc = (built && built._candleColor) || []
        // Select THIS indicator's candle_color entries by the UNIQUE instance
        // (display_label) when given — kindOf collapses SCMR / SCMR(INV) to the
        // same 'SCMR', so kind matching would pick BOTH and one would overwrite
        // the other. Fall back to kind for callers that don't pass an instance.
        const kl = String(kind).toLowerCase()
        let entries = instance != null
            ? cc.filter((e) => e.instanceKey === instance)
            : []
        // Fall back to kind matching when the instance matched nothing (rows may
        // key instances differently from display_label, e.g. 'sma:20' vs
        // 'SMA(20)'). Safe: instances that DO match by key (SCMR/SCMR(INV))
        // never reach this fallback, so the collapse can't come back.
        if (!entries.length) entries = cc.filter((e) => String(e.kind).toLowerCase() === kl)
        if (!entries.length) return false
        const data = built.chart.data || []
        const active = built._candleColorActive || (built._candleColorActive = new Set())
        // Update the active set (keyed by UNIQUE instanceKey) FIRST, then recompute
        // slot 6 from EVERY remaining active instance. Recomputing (rather than
        // blanking only this instance's stamps) keeps a second active candle_color
        // instance's colours intact when one of two is toggled off.
        for (const e of entries) { if (on) active.add(e.instanceKey); else active.delete(e.instanceKey) }
        const activeEntries = cc.filter((e) => active.has(e.instanceKey))
        for (const c of data) {
            const ts = c[0]
            let color = null
            for (const e of activeEntries) { const v = e.byTs.get(ts); if (v != null) color = v }
            if (color != null) { while (c.length < 9) c.push(''); c[6] = color }
            else if (c.length >= 7 && c[6] !== '') { c[6] = '' }
        }
        return true
    }

    /**
     * Show/hide a single view LAYER (for opt-in of hidden layers like TL/TH/
     * diagnostics). Matches built overlays by settings.corkyLayerId and add/
     * removes them by object identity (NOT dc.del — substring-id hazard).
     * @returns {boolean} whether any overlay matched the layer.
     */
    setLayerEnabled(handle, layerId, on, instance = null) {
        if (!handle || !handle.built || !layerId) return false
        if (!handle.hiddenLayers) handle.hiddenLayers = new Set()
        // Accept a SCOPED key ('SCMR(INV)#trade_lines') passed as layerId — the
        // form the enabled/hidden sets persist — and split it back out.
        if (instance == null && typeof layerId === 'string' && layerId.includes('#')) {
            const i = layerId.indexOf('#')
            instance = layerId.slice(0, i)
            layerId = layerId.slice(i + 1)
        }
        // Match by layer id AND (when known) the indicator INSTANCE. Instances of
        // the same kind share layer ids (SCMR and SCMR(INV) both declare
        // 'scmr_candle_color', 'trade_lines', …) — an unscoped match toggled the
        // sibling instance's layers too, and an unscoped hiddenLayers entry kept
        // BOTH suppressed across tf-switch/reload.
        const matches = (ov) => ov.settings &&
            ov.settings.corkyLayerId === layerId &&
            (instance == null || ov.settings.corkyInstance === instance)
        // Track membership by the scoped key when the instance is known.
        const key = instance != null ? `${instance}#${layerId}` : layerId
        const dc = this.dc
        const built = handle.built
        let changed = false
        let matched = false
        if (on) {
            for (const pane of ['onchart', 'offchart']) {
                for (const ov of built[pane]) {
                    if (matches(ov)) {
                        matched = true
                        if (!handle.addedOverlays.has(ov)) {
                            this._addOverlay(dc, pane, ov)
                            handle.addedOverlays.add(ov)
                            changed = true
                        }
                    }
                }
            }
            if (matched) {
                handle.enabledLayers.add(key)
                // re-shown: drop the explicit-hide memory (scoped + legacy bare)
                handle.hiddenLayers.delete(key)
                handle.hiddenLayers.delete(layerId)
            }
        } else {
            for (const pane of ['onchart', 'offchart']) {
                for (const ov of built[pane]) {
                    if (matches(ov)) {
                        matched = true
                        if (handle.addedOverlays.has(ov)) {
                            this._removeOverlay(dc, ov)
                            handle.addedOverlays.delete(ov)
                            changed = true
                        }
                    }
                }
            }
            handle.enabledLayers.delete(key)
            handle.enabledLayers.delete(layerId)
            // Remember an explicit hide so setIndicatorEnabled's autoVisible (and a
            // tf-switch reapply) doesn't bring this visible_by_default layer back.
            if (matched) handle.hiddenLayers.add(key)
        }
        if (changed) { this._normalizeOffchartGrids(handle); dc.touchData() }
        return matched
    }

    // Add one overlay to a pane by REFERENCE (same object as in handle.built so
    // live upserts mutate it in place). Forces settings.display = true: an overlay
    // present in the DataCube is, by this design, a VISIBLE overlay — build time
    // bakes display=false into hidden-by-default layers, which would otherwise be
    // added but never drawn (Chart.vue/canvas-context skip display===false).
    _addOverlay(dc, pane, ov) {
        if (ov.settings) ov.settings.display = true
        dc.add(pane, ov) // assigns ov.id, appends by reference
    }

    // Re-establish the offchart pane-grid invariant after any add/remove. Section
    // .vue resolves grid `id`'s anchor POSITIONALLY (offchart[id-1]) and merges
    // siblings by grid.id, so anchors must occupy the first N slots in pane order
    // and each sibling's grid.id must equal its anchor's 1-based index. Build sets
    // this up, but incremental toggles append in user order with stale build-time
    // grid.ids — orphaning siblings or merging them into the wrong pane. We rebuild
    // order + grid.ids from the stable pane tags (corkyPaneName/corkyPaneAnchor),
    // pulling in any missing anchor so a sibling never renders without its grid.
    _normalizeOffchartGrids(handle) {
        const dc = this.dc
        const arr = dc.data && dc.data.offchart
        if (!arr) return

        // Only gateway-built data carries pane tags. Without ANY tag there is
        // nothing of ours to normalize — and rewriting would be DESTRUCTIVE:
        // foreign/fallback overlays using trading-vue's public grid:{id} pane-
        // merge would get promoted to their own panes (grid deleted). Leave
        // untagged data exactly as the caller arranged it.
        if (!arr.some((o) => o && o.settings && o.settings.corkyPaneName != null)) return

        // NB: we do NOT force the pane's BUILD-TIME anchor to be present. When a
        // multi-line pane's anchor LINE is hidden but a sibling remains, step 2
        // below PROMOTES a present sibling to anchor (strips its grid.id), so the
        // grid still renders without resurrecting the user-hidden line. The old
        // "re-add the missing anchor" pass coupled sibling toggles to the anchor:
        // enabling a sibling (e.g. CRUP bull_box_nested_count) re-added the hidden
        // anchor line (bullcount) AND re-flagged it enabled, and every attempt to
        // hide the anchor was instantly undone (normalize re-added it while a
        // sibling was present) — the anchor became un-deselectable.
        if (!arr.length) { if (typeof dc.update_ids === 'function') dc.update_ids(); return }

        // 1. Group by pane (first-appearance order). Overlays without a pane tag
        //    are standalone single-overlay panes (each its own anchor) so non-corky
        //    offchart overlays keep working.
        const order = []
        const panes = new Map()
        let solo = 0
        for (const ov of arr) {
            const s = ov.settings || {}
            let key, isAnchor
            if (s.corkyPaneName != null) { key = 'p:' + s.corkyPaneName; isAnchor = !!s.corkyPaneAnchor }
            else { key = 's:' + (solo++); isAnchor = !ov.grid }
            let rec = panes.get(key)
            if (!rec) { rec = { anchor: null, sibs: [] }; panes.set(key, rec); order.push(key) }
            if (isAnchor && !rec.anchor) rec.anchor = ov
            else rec.sibs.push(ov)
        }

        // 2. Rebuild: anchors first (pane order), then siblings with grid.id set to
        //    the pane's 1-based offchart-grid index. A pane whose build-time anchor
        //    line is hidden (or any pane with no anchor present) promotes its first
        //    present sibling — so the grid renders without resurrecting a hidden
        //    line. When the original anchor is later re-enabled it reclaims the
        //    anchor slot (it carries corkyPaneAnchor) and the promoted sibling
        //    goes back to a grid.id.
        const anchors = []; const sibs = []
        let gid = 0
        for (const key of order) {
            const rec = panes.get(key)
            let anchor = rec.anchor
            let paneSibs = rec.sibs
            if (!anchor) { anchor = paneSibs[0]; paneSibs = paneSibs.slice(1) }
            if (!anchor) continue
            gid += 1
            delete anchor.grid // an anchor spawns the grid — it must carry NO grid.id
            anchors.push(anchor)
            for (const s of paneSibs) { s.grid = { id: gid }; sibs.push(s) }
        }
        arr.splice(0, arr.length, ...anchors, ...sibs)
        if (typeof dc.update_ids === 'function') dc.update_ids()
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
    _applyLive(handle, event, onStatus, onError = () => {}) {
        if (!handle.liveView) {
            // live before history-complete: ignore
            this._debugLive(event, { applied: false, reason: 'before-history' }, handle)
            return
        }
        // A superseded stream must not mutate the active chart's DataCube.
        if (handle.subscription_id !== this._activeSubId) return
        let res
        try {
            res = applyLiveUpdate(handle.liveView, event, handle.lastSeqBySub)
        } catch (err) {
            // A malformed live row used to throw into the client's blanket
            // catch(){} and vanish; surface it so the UI can react.
            onError(err)
            return
        }
        this._debugLive(event, res, handle)
        if (res.applied) {
            this.dc.touchData()
            // Emit the 'live' phase ONCE (on the first applied tick), not per tick:
            // a fresh status object every tick re-renders the whole discovery panel
            // for a progress bar that's only visible during loading.
            if (!handle.liveAnnounced) {
                handle.liveAnnounced = true
                onStatus({
                    phase: 'live',
                    subscription_id: handle.subscription_id,
                    sequence: res.sequence,
                })
            }
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

    // ── reconnect ─────────────────────────────────────────────────────────────

    // A socket (re)opened. The first open is the initial connect (nothing to do);
    // a later open is a reconnect — the gateway has NO session resume, so re-issue
    // subscribe_candles for each live stream and let the existing fan-out reload
    // it (history rebuild + enabled/hidden replay). Without this the chart freezes
    // at the last candle while still claiming "Live".
    _onClientOpen() {
        if (!this._everOpened) { this._everOpened = true; return }
        for (const handle of this._subs.values()) {
            // Skip only handles whose ORIGINAL subscribe() is still awaiting —
            // that flow handles its own failure (cleanup + onError + rethrow).
            // The old `!history_complete` skip also matched handles whose
            // PREVIOUS re-issue failed or was cut by another drop (re-issues
            // reset history_complete to false first) — those were then skipped
            // by every later reconnect too: a permanently wedged stream frozen
            // at the last candle while claiming "Live".
            if (handle.subscribePending) continue
            this._reissue(handle)
        }
    }

    // Re-issue one stream's subscribe after a reconnect (the gateway has no
    // session resume). Failure reports through onError but leaves the handle
    // ELIGIBLE for the next reconnect's sweep; a hung re-issue is timed out for
    // the same reason (the original subscribe's guard doesn't cover re-issues).
    _reissue(handle) {
        handle.history_complete = false        // allow a fresh history rebuild
        handle.chunks = []
        handle.lastSeqBySub = {}
        const flow = Promise.resolve(this.client.subscribeCandles({
            subscription_id: handle.subscription_id,
            ...handle.subscribeArgs,
        }))
        const guarded = this.subscribeTimeoutMs > 0
            ? Promise.race([flow, new Promise((_, reject) => {
                setTimeout(() => {
                    const e = new Error('reconnect re-subscribe timed out')
                    e.code = 'subscribe_timeout'
                    e.retryable = true
                    reject(e)
                }, this.subscribeTimeoutMs)
            })])
            : flow
        guarded.catch((err) => { if (handle.onError) handle.onError(err) })
    }

    // Backoff gave up: the feed is dead. Surface it through every stream's onError
    // so the UI stops showing "Live" and reports the disconnect (the events used to
    // be emitted into the void — nothing listened).
    _onReconnectExhausted(info) {
        const err = new Error('Corky feed disconnected: reconnect attempts exhausted')
        err.code = 'reconnect_exhausted'
        // Retryable: the App's Retry paths now revive a dead client via
        // client.connect() (which resets the backoff budget), so the panel must
        // keep its Retry button instead of presenting a dead end.
        err.retryable = true
        err.info = info
        for (const handle of this._subs.values()) {
            if (handle.onError) handle.onError(err)
        }
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
        if (h.enabledLayers) h.enabledLayers.clear()
        if (h.hiddenLayers) h.hiddenLayers.clear()
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
        if (id === this._activeSubId) this._activeSubId = null
        await this.client.unsubscribe(id)
    }

    /** Unsubscribe every stream and close the client. */
    destroy() {
        // Detach the connection-lifecycle listeners we registered in the ctor so
        // a torn-down feed doesn't keep resubscribing on the shared client.
        for (const off of this._offClientEvents) { try { off() } catch (_) { /* ignore */ } }
        this._offClientEvents = []
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
