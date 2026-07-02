// CorkyClient — protocol client for the Corky chart-client-interface v1 WS
// gateway (corky.chart-client-interface, schema_version 1).
//
// Speaks the JSON-over-WebSocket contract documented in
//   docs/protocol/chart-client-interface.v1.json
//   docs/schemas/chart-feed/v1/*.schema.json
//
// Responsibilities (this is the FOUNDATION layer — no chart wiring here):
//   - own the socket lifecycle (connect / close / bounded reconnect),
//   - build well-formed client requests with unique request_ids,
//   - correlate replies back to their request (request_id ↔ Promise),
//   - fan live_update events out by subscription_id,
//   - surface every event via a mitt emitter for observers.
//
// The socket is INJECTABLE (`socketFactory`) so tests drive a fake socket and
// never touch the network. All ids are deterministic (counter + prefix); no
// randomness or wall-clock is used to mint them.

import mitt from 'mitt'

// ── error catalog ────────────────────────────────────────────────────────────
// Mirror of `known_error_codes` from the v1 protocol doc. Maps an error code to
// whether the client may sensibly retry the originating request.
export const KNOWN_ERROR_CODES = {
    unsupported_schema_version: { retryable: false },
    invalid_request_json:       { retryable: false },
    state_not_found:            { retryable: false },
    runtime_not_found:          { retryable: true },
    invalid_control_command:    { retryable: false },
    control_response_timeout:   { retryable: true },
    control_receive_error:      { retryable: true },
    historical_query_failed:    { retryable: false },
    // The gateway accepted the subscription but the runtime's CONTROL session
    // (gateway↔runtime control channel) is missing/stale — the runtime is up in
    // the catalog but can't serve the stream. Transient: it recovers when the
    // runtime re-establishes its control channel, so retry (the chart self-heals).
    runtime_control_rejected:   { retryable: true },
    control_session_required:   { retryable: false },   // no/stale control session → re-establish before retrying
    // auth-position flows. Audit/history unavailability is usually transient
    // (disk read, REST window, runtime still loading its snapshot) → retry and
    // keep the last good UI state. A non-stateful socket can't carry streams; the
    // caller falls back to one-shot list, so don't churn retries on it.
    auth_position_history_unavailable: { retryable: true },
    auth_position_audit_unavailable:   { retryable: true },
    stateful_websocket_required:       { retryable: false },
    // backtest / strategy read flows. Artifacts may still be writing → not-ready
    // is retryable; the rest are deterministic client/config errors. store
    // unavailability is transient (read backend hiccup) → retry.
    backtest_artifacts_disabled:  { retryable: false },
    strategy_not_found:           { retryable: false },
    backtest_not_found:           { retryable: false },
    backtest_artifact_not_ready:  { retryable: true },
    invalid_backtest_request:     { retryable: false },
    backtest_artifact_invalid:    { retryable: false },
    backtest_store_unavailable:   { retryable: true },
}

// Resolve whether an error is retryable. The wire `retryable` flag wins when
// present (the gateway is authoritative); otherwise fall back to the catalog,
// defaulting unknown codes to non-retryable.
export function isRetryable(code, wireRetryable) {
    if (typeof wireRetryable === 'boolean') return wireRetryable
    const entry = KNOWN_ERROR_CODES[code]
    return entry ? entry.retryable : false
}

// The schema version this client speaks. Both directions are pinned to 1.
const SCHEMA_VERSION = 1

// Terminal event types per command — the event that resolves a pending request.
// (Streaming subscribes are special-cased; see _route.)
const TERMINAL_EVENT = {
    list_candle_states:         'candle_states',
    unsubscribe:                'control_ack',
    upsert_candle_state:        'control_ack',
    patch_candle_state:         'control_ack',
    list_auth_positions:        'auth_positions',
    list_auth_position_history: 'auth_position_history',
    get_auth_position_audit:    'auth_position_audit',
    // strategy / backtest read flows (one-shot)
    list_strategies:             'strategies',
    get_strategy:                'strategy',
    list_backtest_runs:          'backtest_runs',
    get_backtest_run:            'backtest_run',
    get_backtest_progress:       'backtest_progress',
    get_backtest_chart_overlays: 'backtest_chart_overlays',
    get_backtest_report_overlays:'backtest_report_overlays',
    // strategy-runtime read flows (one-shot). The event.type ≠ the payload
    // FIELD it carries (see _resultFor): e.g. get_strategy_runtime → event
    // type 'strategy_runtime' → event.runtime.
    list_strategy_runtimes:      'strategy_runtimes',
    get_strategy_runtime:        'strategy_runtime',
    get_strategy_ticker:         'strategy_ticker',
    list_strategy_decisions:     'strategy_decisions',
    get_strategy_chart_overlays: 'strategy_chart_overlays',
    // strategy DIRECT-CONTROL mutations. Each resolves on the gateway control_ack;
    // the runtime performs the real safety/cancel/ledger/auth reconciliation.
    pause_strategy_ticker:         'control_ack',
    resume_strategy_ticker:        'control_ack',
    unlock_strategy_ticker:        'control_ack',
    adopt_strategy_position:       'control_ack',
    adopt_strategy_positions:      'control_ack',
    cancel_strategy_ticker_orders: 'control_ack',
}

// Subscription-stream event types: carry a subscription_id and (usually) a null
// request_id, so they fan out by subscription_id rather than request correlation.
// `live_update` resolves nothing here (candle subscribes settle on
// historical_complete); the auth-position/audit streams have no separate accept
// event, so their FIRST update resolves the originating subscribe request.
const STREAM_EVENT_TYPES = new Set([
    'live_update',
    'auth_positions_update',
    'auth_position_audit_update',
    // backtest progress stream: full event list each update, by subscription_id
    // + increasing sequence; no separate accept event, so the FIRST update
    // resolves the originating subscribe (mirrors the auth-position streams).
    'backtest_progress_update',
    // strategy-runtime stream: FULL REPLACEMENT runtime set each update, by
    // subscription_id + increasing sequence; no separate accept event, so the
    // FIRST update resolves the originating subscribe (same model as above).
    'strategy_runtime_update',
])

export class CorkyError extends Error {
    constructor(code, message, retryable) {
        super(message || code)
        this.name = 'CorkyError'
        this.code = code
        this.retryable = retryable
    }
}

export class CorkyClient {

    constructor({ url, socketFactory, backoff } = {}) {
        if (!url) throw new Error('CorkyClient: `url` is required')
        this.url = url

        // Injectable so tests pass a FakeSocket; production opens a real WS.
        this._socketFactory = socketFactory || (() => new WebSocket(url))

        // Bounded reconnect backoff. Injectable/disable-able for tests:
        //   { base, factor, max, maxRetries }  or  false to disable entirely.
        this._backoffCfg = backoff === false
            ? null
            : Object.assign({ base: 250, factor: 2, max: 10_000, maxRetries: 6 }, backoff)

        // Event fan-out. `on(type, cb)` subscribes to a given event type;
        // `on('*', cb)` (mitt wildcard) sees every event.
        this._emitter = mitt()

        // request_id → { resolve, reject, command, settled }
        this._pending = new Map()
        // subscription_id → Set<cb> for live_update streaming.
        this._subscribers = new Map()

        // Deterministic id generation (no randomness / wall-clock).
        this._reqCounter = 0

        this._socket = null
        this._closedByUser = false
        this._retries = 0
        this._reconnectTimer = null
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    connect() {
        this._closedByUser = false
        // A fresh connect() is a fresh backoff budget: without this, an explicit
        // reconnect after exhaustion would instantly re-exhaust on the first
        // failure (and _reconnectPossible would keep rejecting sends).
        this._retries = 0
        // Cancel a pending backoff attempt so two sockets can't coexist; detach
        // the old socket's handlers so its eventual onclose can't fail the new
        // socket's pending requests.
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer)
            this._reconnectTimer = null
        }
        if (this._socket) {
            this._socket.onopen = null
            this._socket.onmessage = null
            this._socket.onerror = null
            this._socket.onclose = null
            try { this._socket.close() } catch (_) { /* already gone */ }
        }
        this._open()
        return this
    }

    /** True when no socket is open/opening and no reconnect is pending —
     *  i.e. only an explicit connect() can revive this client. */
    isDead() {
        if (this._reconnectTimer) return false
        const s = this._socket
        return !s || s.readyState === 2 /* CLOSING */ || s.readyState === 3 /* CLOSED */
    }

    _open() {
        const sock = this._socketFactory(this.url)
        this._socket = sock

        sock.onopen = () => {
            this._retries = 0
            // Flush frames queued while the socket was still CONNECTING.
            const queued = this._sendQueue || []
            this._sendQueue = []
            for (const data of queued) {
                try { sock.send(data) } catch (_) { /* socket died mid-flush */ }
            }
            this._emitter.emit('open')
        }
        sock.onmessage = (ev) => this._handleMessage(ev)
        sock.onerror = (err) => this._emitter.emit('socket-error', err)
        sock.onclose = (ev) => this._handleClose(ev)
    }

    close() {
        this._closedByUser = true
        // Drop queued-but-unsent frames NOW: their requests are failed below,
        // and a close()→connect() cycle must not replay stale frames.
        this._sendQueue = []
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer)
            this._reconnectTimer = null
        }
        if (this._socket) {
            try { this._socket.close() } catch (_) { /* already gone */ }
        }
        this._failAllPending(new CorkyError('client_closed', 'client closed', false))
    }

    _handleClose(ev) {
        this._emitter.emit('close', ev)
        // Drop any frames queued-but-unsent: their requests are failed below,
        // and a reconnected socket must not replay stale frames.
        this._sendQueue = []
        if (this._closedByUser) return
        // A non-user drop abandons any in-flight request/response: the new
        // socket has no memory of them. Fail them with a RETRYABLE error so
        // awaiters don't hang forever (streaming subscriptions live on the
        // emitter and are unaffected by this).
        this._failAllPending(new CorkyError('connection_lost', 'socket closed before response', true))
        if (!this._backoffCfg) return
        this._scheduleReconnect()
    }

    // True while the socket may still come back: backoff is enabled, the user
    // hasn't closed us, and we haven't burned through maxRetries. Used by _send
    // to decide whether a frame for a dead socket should be queued (a reconnect
    // will flush it in onopen) or rejected outright.
    _reconnectPossible() {
        if (this._closedByUser || !this._backoffCfg) return false
        // A pending reconnect timer means an attempt IS still coming (even the
        // final one — _scheduleReconnect increments _retries before arming the
        // timer, so comparing the counter alone rejected sends during the last
        // window that could have been queued and flushed on open).
        return this._reconnectTimer != null ||
            this._retries < this._backoffCfg.maxRetries
    }

    _scheduleReconnect() {
        const cfg = this._backoffCfg
        if (this._retries >= cfg.maxRetries) {
            this._emitter.emit('reconnect-exhausted', { retries: this._retries })
            // Backoff is spent: no socket is coming back. Fail every still-pending
            // request (and drop queued-but-unsent frames) so awaiters reject
            // instead of hanging forever.
            this._sendQueue = []
            this._failAllPending(
                new CorkyError('reconnect_exhausted', 'reconnect attempts exhausted', false),
            )
            return
        }
        const delay = Math.min(cfg.max, cfg.base * Math.pow(cfg.factor, this._retries))
        this._retries += 1
        this._emitter.emit('reconnecting', { attempt: this._retries, delay })
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null
            if (this._closedByUser) return
            this._open()
        }, delay)
    }

    // ── observers ────────────────────────────────────────────────────────────

    // Subscribe to a gateway event type (e.g. 'live_update', 'error') or '*'.
    on(type, cb) { this._emitter.on(type, cb); return () => this._emitter.off(type, cb) }
    off(type, cb) { this._emitter.off(type, cb) }

    // Stream live_update events for a specific subscription_id. Returns an
    // unsubscribe function.
    onSubscription(subscription_id, cb) {
        let set = this._subscribers.get(subscription_id)
        if (!set) { set = new Set(); this._subscribers.set(subscription_id, set) }
        set.add(cb)
        return () => {
            const s = this._subscribers.get(subscription_id)
            if (!s) return
            s.delete(cb)
            if (s.size === 0) this._subscribers.delete(subscription_id)
        }
    }

    // ── typed senders ────────────────────────────────────────────────────────

    listCandleStates(venue) {
        const command = { type: 'list_candle_states' }
        if (venue != null) command.venue = venue
        return this._request(command)
    }

    // Streaming: resolves on historical_complete (or the subscription_accepted
    // fallback if no history). `onEvent` (opts.onEvent) — when provided — also
    // receives the lifecycle/historical/live events for this subscription, in
    // arrival order. The subscription_id is registered for live fan-out too.
    subscribeCandles(opts = {}) {
        const {
            subscription_id, venue, symbol, timeframe,
            target_runtime_id, funding_period, range,
            include_indicators, indicators, chunk_rows,
            ack_mode, historical_format,
            onEvent,
        } = opts
        if (!subscription_id) throw new Error('subscribeCandles: subscription_id is required')

        const command = { type: 'subscribe_candles', subscription_id, venue, symbol, timeframe }
        if (target_runtime_id != null) command.target_runtime_id = target_runtime_id
        if (funding_period != null) command.funding_period = funding_period
        if (range != null) command.range = range
        if (include_indicators != null) command.include_indicators = include_indicators
        if (indicators != null) command.indicators = indicators
        if (chunk_rows != null) command.chunk_rows = chunk_rows
        // Optional perf modes (back-compat: omitted ⇒ gateway uses the old shapes).
        // 'summary' → lightweight subscription_accepted_summary; 'columnar' →
        // compact historical_chunk_columnar. Live updates are unaffected.
        if (ack_mode != null) command.ack_mode = ack_mode
        if (historical_format != null) command.historical_format = historical_format

        return this._request(command, { subscription_id, onEvent })
    }

    unsubscribe(subscription_id) {
        if (!subscription_id) throw new Error('unsubscribe: subscription_id is required')
        return this._request({ type: 'unsubscribe', subscription_id })
    }

    // ── historical indicator search ──────────────────────────────────────────
    // Search is a STREAM keyed by `search_id` (NOT subscription_id): the gateway
    // emits search_accepted → search_progress* → search_match* → one terminal
    // (search_complete / search_cancelled / search_failed / error). Those events
    // carry `event.search_id` and (per the contract) request_id: null, so they
    // are NOT request-correlated and NOT in STREAM_EVENT_TYPES — callers observe
    // them via on('search_*') and route by search_id (see CorkySearchFeed). These
    // senders therefore just fire the frame (no pending-terminal correlation);
    // _send still queues while CONNECTING and throws only when truly unsendable.
    searchCandles(query) {
        if (!query || !query.search_id) throw new Error('searchCandles: query.search_id is required')
        const request_id = this._nextRequestId()
        this._send({ schema_version: SCHEMA_VERSION, request_id, command: { type: 'search_candles', query } })
        return request_id
    }

    cancelSearch(search_id) {
        if (!search_id) throw new Error('cancelSearch: search_id is required')
        const request_id = this._nextRequestId()
        this._send({ schema_version: SCHEMA_VERSION, request_id, command: { type: 'cancel_search', search_id } })
        return request_id
    }

    upsertCandleState(opts = {}) {
        const { venue, symbol, timeframes, target_runtime_id, funding_period, indicators, buffer } = opts
        const command = { type: 'upsert_candle_state', venue, symbol, timeframes: timeframes || [] }
        if (target_runtime_id != null) command.target_runtime_id = target_runtime_id
        if (funding_period != null) command.funding_period = funding_period
        if (indicators != null) command.indicators = indicators
        if (buffer != null) command.buffer = buffer
        return this._request(command)
    }

    patchCandleState(opts = {}) {
        const { venue, symbol, timeframes, target_runtime_id, funding_period, indicators, buffer } = opts
        const command = { type: 'patch_candle_state', venue, symbol }
        if (target_runtime_id != null) command.target_runtime_id = target_runtime_id
        if (funding_period != null) command.funding_period = funding_period
        if (timeframes != null) command.timeframes = timeframes
        if (indicators != null) command.indicators = indicators
        if (buffer != null) command.buffer = buffer
        return this._request(command)
    }

    // ── auth-position senders ──────────────────────────────────────────────────
    // Read-only private-account positions. One-shot list/history/audit resolve on
    // their terminal event; the two subscribe_* stream a full replacement set and
    // resolve on their first update (see STREAM_EVENT_TYPES / _route).

    /** One-shot snapshot. Resolves with the `auth_positions` event. */
    listAuthPositions(opts = {}) {
        const { venue, account_id, symbol, include_historical } = opts
        const command = { type: 'list_auth_positions' }
        if (venue != null) command.venue = venue
        if (account_id != null) command.account_id = account_id
        if (symbol != null) command.symbol = symbol
        if (include_historical != null) command.include_historical = include_historical
        return this._request(command)
    }

    /** Paged closed-position history. Resolves with the `auth_position_history` event. */
    listAuthPositionHistory(opts = {}) {
        const { venue, account_id, symbol, limit, cursor } = opts
        if (!venue || !account_id) {
            throw new Error('listAuthPositionHistory: venue and account_id are required')
        }
        const command = { type: 'list_auth_position_history', venue, account_id }
        if (symbol != null) command.symbol = symbol
        if (limit != null) command.limit = limit
        if (cursor != null) command.cursor = cursor
        return this._request(command)
    }

    /** One-shot audit bundle. Resolves with the `auth_position_audit` event. */
    getAuthPositionAudit(opts = {}) {
        const { venue, account_id, symbol, position_id, include_orders, include_trades } = opts
        if (!venue || !account_id || !symbol || position_id == null) {
            throw new Error('getAuthPositionAudit: venue, account_id, symbol, position_id are required')
        }
        const command = { type: 'get_auth_position_audit', venue, account_id, symbol, position_id }
        if (include_orders != null) command.include_orders = include_orders
        if (include_trades != null) command.include_trades = include_trades
        return this._request(command)
    }

    /**
     * Stream position snapshots. Resolves with the FIRST `auth_positions_update`;
     * register `onSubscription(subscription_id, cb)` (or pass `onEvent`) for the
     * ongoing full-replacement updates.
     */
    subscribeAuthPositions(opts = {}) {
        const { subscription_id, venue, account_id, symbol, include_historical, onEvent } = opts
        if (!subscription_id) throw new Error('subscribeAuthPositions: subscription_id is required')
        const command = { type: 'subscribe_auth_positions', subscription_id }
        if (venue != null) command.venue = venue
        if (account_id != null) command.account_id = account_id
        if (symbol != null) command.symbol = symbol
        if (include_historical != null) command.include_historical = include_historical
        return this._request(command, { subscription_id, onEvent })
    }

    /**
     * Stream the audit bundle for one position. Resolves with the FIRST
     * `auth_position_audit_update`; register `onSubscription` for ongoing updates.
     */
    subscribeAuthPositionAudit(opts = {}) {
        const { subscription_id, venue, account_id, symbol, position_id, include_orders, include_trades, onEvent } = opts
        if (!subscription_id) throw new Error('subscribeAuthPositionAudit: subscription_id is required')
        if (!venue || !account_id || !symbol || position_id == null) {
            throw new Error('subscribeAuthPositionAudit: venue, account_id, symbol, position_id are required')
        }
        const command = { type: 'subscribe_auth_position_audit', subscription_id, venue, account_id, symbol, position_id }
        if (include_orders != null) command.include_orders = include_orders
        if (include_trades != null) command.include_trades = include_trades
        return this._request(command, { subscription_id, onEvent })
    }

    // ── strategy / backtest senders (read-only, one-shot) ───────────────────────
    // All resolve on their terminal event (see TERMINAL_EVENT); a backtest read
    // failure arrives as a normal `error` event and rejects the promise.

    /** List available strategies → resolves the `strategies` array. */
    listStrategies() { return this._request({ type: 'list_strategies' }) }

    /** Inspect one strategy → resolves the `strategy` descriptor. */
    getStrategy(strategy) {
        if (!strategy) throw new Error('getStrategy: strategy is required')
        return this._request({ type: 'get_strategy', strategy })
    }

    /** List backtest runs (all filters optional) → resolves the `runs` array. */
    listBacktestRuns(opts = {}) {
        const { strategy, symbol, venue, status } = opts
        const command = { type: 'list_backtest_runs' }
        if (strategy != null) command.strategy = strategy
        if (symbol != null) command.symbol = symbol
        if (venue != null) command.venue = venue
        if (status != null) command.status = status
        return this._request(command)
    }

    /** Raw artifact for a run → resolves the pass-through `artifact` JSON. Pass
     *  { compact:true } to get plan/scenario/optimization/rankings/parameters/
     *  metrics with heavy report arrays (fills/ledger/equity/period_returns/
     *  rejected_orders) replaced by *_count fields — bounded, so it won't hit the
     *  `backtest_artifact_too_large` error a full read raises on long sweeps. */
    getBacktestRun(run_id, opts = {}) {
        if (!run_id) throw new Error('getBacktestRun: run_id is required')
        const command = { type: 'get_backtest_run', run_id }
        if (opts.compact != null) command.compact = opts.compact
        return this._request(command)
    }

    /** One-shot progress snapshot → resolves the `events` list. */
    getBacktestProgress(run_id) {
        if (!run_id) throw new Error('getBacktestProgress: run_id is required')
        return this._request({ type: 'get_backtest_progress', run_id })
    }

    /**
     * Stream live progress. Resolves with the FIRST `backtest_progress_update`;
     * register `onSubscription(subscription_id, …)` for ongoing updates (apply by
     * increasing `sequence`; each update carries the FULL current event list).
     */
    subscribeBacktestProgress(opts = {}) {
        const { subscription_id, run_id, onEvent } = opts
        if (!subscription_id) throw new Error('subscribeBacktestProgress: subscription_id is required')
        if (!run_id) throw new Error('subscribeBacktestProgress: run_id is required')
        return this._request(
            { type: 'subscribe_backtest_progress', subscription_id, run_id },
            { subscription_id, onEvent })
    }

    /** Trade chart overlays (per chart_window) → resolves the full event. Pass
     *  start_ms/end_ms to return only trades inside that visible window. */
    getBacktestChartOverlays(opts = {}) {
        const { run_id, timeframe, before_bars, after_bars, start_ms, end_ms, run_index, fold_index } = opts
        if (!run_id) throw new Error('getBacktestChartOverlays: run_id is required')
        const command = { type: 'get_backtest_chart_overlays', run_id }
        if (timeframe != null) command.timeframe = timeframe
        if (before_bars != null) command.before_bars = before_bars
        if (after_bars != null) command.after_bars = after_bars
        if (start_ms != null) command.start_ms = start_ms
        if (end_ms != null) command.end_ms = end_ms
        if (run_index != null) command.run_index = run_index
        if (fold_index != null) command.fold_index = fold_index
        return this._request(command)
    }

    /** Normalized report/account overlays → resolves the full event. Pass
     *  start_ms/end_ms to window and max_points to downsample equity_curve. */
    getBacktestReportOverlays(opts = {}) {
        const { run_id, start_ms, end_ms, max_points, run_index, fold_index } = opts
        if (!run_id) throw new Error('getBacktestReportOverlays: run_id is required')
        const command = { type: 'get_backtest_report_overlays', run_id }
        if (start_ms != null) command.start_ms = start_ms
        if (end_ms != null) command.end_ms = end_ms
        if (max_points != null) command.max_points = max_points
        if (run_index != null) command.run_index = run_index
        if (fold_index != null) command.fold_index = fold_index
        return this._request(command)
    }

    // ── strategy-runtime senders (read-only) ─────────────────────────────────────
    // One-shot reads resolve on their terminal event's named field (see
    // _resultFor). The runtime subscription streams `strategy_runtime_update`
    // (a FULL REPLACEMENT set applied by increasing sequence) and resolves on
    // its FIRST update — same model as the auth-position / backtest streams.

    /** List strategy runtimes → resolves the `runtimes` array. */
    listStrategyRuntimes() { return this._request({ type: 'list_strategy_runtimes' }) }

    /** Inspect one runtime → resolves the `runtime` object. */
    getStrategyRuntime(runtime_id) {
        if (!runtime_id) throw new Error('getStrategyRuntime: runtime_id is required')
        return this._request({ type: 'get_strategy_runtime', runtime_id })
    }

    /** Inspect one ticker within a runtime → resolves the `ticker` object. */
    getStrategyTicker(runtime_id, ticker_id) {
        if (!runtime_id || !ticker_id) {
            throw new Error('getStrategyTicker: runtime_id and ticker_id are required')
        }
        return this._request({ type: 'get_strategy_ticker', runtime_id, ticker_id })
    }

    /** Recent decisions for a runtime → resolves the `decisions` array. Optional
     *  { ticker_id } filters to one ticker; { limit } caps the count. */
    listStrategyDecisions(runtime_id, opts = {}) {
        if (!runtime_id) throw new Error('listStrategyDecisions: runtime_id is required')
        const command = { type: 'list_strategy_decisions', runtime_id }
        if (opts.ticker_id != null) command.ticker_id = opts.ticker_id
        if (opts.limit != null) command.limit = opts.limit
        return this._request(command)
    }

    /** Strategy chart overlays (decision/fill/order/allocation markers) →
     *  resolves the `overlays` array. Optional { timeframe, start_ms, end_ms }
     *  window the result. */
    getStrategyChartOverlays(runtime_id, ticker_id, opts = {}) {
        if (!runtime_id || !ticker_id) {
            throw new Error('getStrategyChartOverlays: runtime_id and ticker_id are required')
        }
        const command = { type: 'get_strategy_chart_overlays', runtime_id, ticker_id }
        if (opts.timeframe != null) command.timeframe = opts.timeframe
        if (opts.start_ms != null) command.start_ms = opts.start_ms
        if (opts.end_ms != null) command.end_ms = opts.end_ms
        return this._request(command)
    }

    /**
     * Stream runtime snapshots. Resolves with the FIRST `strategy_runtime_update`;
     * register `onSubscription(subscription_id, …)` (or pass `onEvent`) for the
     * ongoing FULL-REPLACEMENT updates (apply by increasing `sequence`). Scope the
     * stream by `runtime_id` OR `strategy` (at least one is required).
     */
    subscribeStrategyRuntime(opts = {}) {
        const { subscription_id, runtime_id, strategy, onEvent } = opts
        if (!subscription_id) throw new Error('subscribeStrategyRuntime: subscription_id is required')
        if (runtime_id == null && strategy == null) {
            throw new Error('subscribeStrategyRuntime: runtime_id or strategy is required')
        }
        const command = { type: 'subscribe_strategy_runtime', subscription_id }
        if (runtime_id != null) command.runtime_id = runtime_id
        if (strategy != null) command.strategy = strategy
        return this._request(command, { subscription_id, onEvent })
    }

    // ── strategy DIRECT-CONTROL senders (MUTATE a live runtime) ──────────────────
    // These forward an audited operator action to an observed strategy runtime over
    // direct control (control_session_required). Each REQUIRES a visible operator
    // `reason` and resolves on the gateway `control_ack`. `target_runtime_id` echoes
    // the discovered runtime id (the runtime-targeting rule) and is forwarded when
    // provided. NOTHING is mutated locally on ack — the caller waits for the
    // runtime/auth reconciliation (subscription full-replacement) to reflect it.

    // Shared framing/guards for the per-ticker controls (pause/resume/cancel/unlock):
    // all need runtime_id + ticker_id + reason, and optionally strategy_instance_id
    // and target_runtime_id.
    _strategyTickerControl(type, name, opts = {}) {
        const { runtime_id, ticker_id, reason, strategy_instance_id, target_runtime_id } = opts
        if (!runtime_id) throw new Error(`${name}: runtime_id is required`)
        if (!ticker_id) throw new Error(`${name}: ticker_id is required`)
        if (!reason) throw new Error(`${name}: reason is required`)
        const command = { type, runtime_id, ticker_id, reason }
        if (strategy_instance_id != null) command.strategy_instance_id = strategy_instance_id
        if (target_runtime_id != null) command.target_runtime_id = target_runtime_id
        return command
    }

    /** Pause one strategy ticker. Requires { runtime_id, ticker_id, reason }. */
    pauseStrategyTicker(opts = {}) {
        return this._request(this._strategyTickerControl('pause_strategy_ticker', 'pauseStrategyTicker', opts))
    }

    /** Resume one paused strategy ticker. Requires { runtime_id, ticker_id, reason }. */
    resumeStrategyTicker(opts = {}) {
        return this._request(this._strategyTickerControl('resume_strategy_ticker', 'resumeStrategyTicker', opts))
    }

    /** Cancel active/submitted strategy-owned orders on one ticker. Requires
     *  { runtime_id, ticker_id, reason } — the reason is a visible operator input. */
    cancelStrategyTickerOrders(opts = {}) {
        return this._request(this._strategyTickerControl('cancel_strategy_ticker_orders', 'cancelStrategyTickerOrders', opts))
    }

    /** Unlock one bust/capital-shortfall-locked ticker with a positive new
     *  allocation. Requires { runtime_id, ticker_id, reason, new_allocation:{
     *  currency, amount } } — `amount` is a DECIMAL STRING forwarded verbatim. */
    unlockStrategyTicker(opts = {}) {
        const command = this._strategyTickerControl('unlock_strategy_ticker', 'unlockStrategyTicker', opts)
        const na = opts.new_allocation
        if (!na || na.currency == null || na.amount == null) {
            throw new Error('unlockStrategyTicker: new_allocation.currency and new_allocation.amount are required')
        }
        command.new_allocation = { currency: na.currency, amount: na.amount }
        return this._request(command)
    }

    /** Adopt one exact pre-existing auth position. Requires { runtime_id,
     *  ticker_id, position_id, reason }. */
    adoptStrategyPosition(opts = {}) {
        const { runtime_id, ticker_id, position_id, reason, strategy_instance_id, target_runtime_id } = opts
        if (!runtime_id) throw new Error('adoptStrategyPosition: runtime_id is required')
        if (!ticker_id) throw new Error('adoptStrategyPosition: ticker_id is required')
        if (position_id == null) throw new Error('adoptStrategyPosition: position_id is required')
        if (!reason) throw new Error('adoptStrategyPosition: reason is required')
        const command = { type: 'adopt_strategy_position', runtime_id, ticker_id, position_id, reason }
        if (strategy_instance_id != null) command.strategy_instance_id = strategy_instance_id
        if (target_runtime_id != null) command.target_runtime_id = target_runtime_id
        return this._request(command)
    }

    /** Adopt an explicitly named batch of pre-existing auth positions. Requires
     *  { runtime_id, positions:[{ ticker_id, position_id }], reason }. */
    adoptStrategyPositions(opts = {}) {
        const { runtime_id, positions, reason, strategy_instance_id, target_runtime_id } = opts
        if (!runtime_id) throw new Error('adoptStrategyPositions: runtime_id is required')
        if (!Array.isArray(positions) || positions.length === 0) {
            throw new Error('adoptStrategyPositions: positions[] is required')
        }
        for (const p of positions) {
            if (!p || !p.ticker_id || p.position_id == null) {
                throw new Error('adoptStrategyPositions: each position requires ticker_id and position_id')
            }
        }
        if (!reason) throw new Error('adoptStrategyPositions: reason is required')
        const command = {
            type: 'adopt_strategy_positions', runtime_id,
            positions: positions.map((p) => ({ ticker_id: p.ticker_id, position_id: p.position_id })),
            reason,
        }
        if (strategy_instance_id != null) command.strategy_instance_id = strategy_instance_id
        if (target_runtime_id != null) command.target_runtime_id = target_runtime_id
        return this._request(command)
    }

    // ── outbound plumbing ──────────────────────────────────────────────────────

    _nextRequestId() {
        this._reqCounter += 1
        return `corky-req-${this._reqCounter}`
    }

    _request(command, meta = {}) {
        const request_id = this._nextRequestId()
        const frame = { schema_version: SCHEMA_VERSION, request_id, command }

        return new Promise((resolve, reject) => {
            this._pending.set(request_id, {
                resolve, reject, command,
                subscription_id: meta.subscription_id,
                onEvent: meta.onEvent,
                settled: false,
            })
            try {
                this._send(frame)
            } catch (err) {
                this._pending.delete(request_id)
                reject(err)
            }
        })
    }

    _send(frame) {
        if (!this._socket) throw new Error('CorkyClient: not connected (call connect())')
        const data = JSON.stringify(frame)
        // WebSocket.readyState: 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED.
        // Only OPEN can take a frame: calling .send() in CONNECTING throws, and
        // in CLOSING/CLOSED the spec SILENTLY DISCARDS the frame — which would
        // strand the request promise forever. So for any non-OPEN state we QUEUE
        // the frame and let onopen flush it once a (re)connected socket opens.
        //   - CONNECTING: the imminent onopen flushes it (a caller can fire a
        //     request right after connect(), as App.vue does).
        //   - CLOSING/CLOSED: a pending/scheduled reconnect's onopen flushes it —
        //     but only if a reconnect is actually coming. If reconnect is disabled
        //     or already exhausted, no socket will reopen, so THROW instead and
        //     let _request convert it into a promise rejection (don't hang).
        // Test fake sockets have no readyState (undefined) → treated as OPEN.
        const rs = this._socket.readyState
        if (rs != null && rs !== 1) {
            if (rs !== 0 && !this._reconnectPossible()) {
                throw new CorkyError(
                    'not_connected',
                    'socket is closing/closed and no reconnect is pending',
                    true,
                )
            }
            (this._sendQueue || (this._sendQueue = [])).push(data)
            return
        }
        this._socket.send(data)
    }

    // ── inbound plumbing ───────────────────────────────────────────────────────

    _handleMessage(ev) {
        let envelope
        try {
            envelope = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
        } catch (err) {
            this._emitter.emit('parse-error', { error: err, raw: ev && ev.data })
            return
        }
        this._route(envelope)
    }

    _route(envelope) {
        if (!envelope || typeof envelope !== 'object' || !envelope.event) {
            this._emitter.emit('parse-error', { error: new Error('malformed envelope'), raw: envelope })
            return
        }

        // schema_version guard — reject anything that isn't v1. Defaults to 1
        // when omitted (per contract), so only an explicit mismatch is rejected.
        const ver = envelope.schema_version == null ? SCHEMA_VERSION : envelope.schema_version
        if (ver !== SCHEMA_VERSION) {
            const err = new CorkyError(
                'unsupported_schema_version',
                `unsupported schema_version ${ver}`,
                false,
            )
            this._emitter.emit('schema-error', { error: err, envelope })
            const pend = envelope.request_id != null ? this._pending.get(envelope.request_id) : null
            if (pend) this._settleReject(envelope.request_id, err)
            return
        }

        const { request_id } = envelope
        const event = envelope.event
        const type = event.type

        // Always emit on the type channel and the wildcard for observers.
        this._emitter.emit(type, { request_id, event })

        // Subscription-stream events may carry a null request_id — correlate by
        // subscription_id. The auth-position/audit streams have no separate accept
        // event, so the FIRST stream update resolves the originating subscribe
        // request (and is delivered to its onEvent). `live_update` resolves nothing
        // here — candle subscribes settle on historical_complete, which always
        // precedes any live_update.
        if (STREAM_EVENT_TYPES.has(type)) {
            if (type !== 'live_update' && event.subscription_id != null) {
                const sub = this._pendingBySubscription(event.subscription_id)
                if (sub) {
                    if (sub.onEvent) {
                        try { sub.onEvent({ request_id, event }) } catch (_) { /* observer threw; ignore */ }
                    }
                    this._settleResolve(sub.request_id, event)
                }
            }
            this._fanOutSubscription(event.subscription_id, { request_id, event })
            return
        }

        const pend = request_id != null ? this._pending.get(request_id) : null

        // Feed streaming subscribe observers their per-subscription events.
        if (pend && pend.onEvent && pend.subscription_id != null
            && event.subscription_id === pend.subscription_id) {
            try { pend.onEvent({ request_id, event }) } catch (_) { /* observer threw; ignore */ }
        }
        if (pend && pend.subscription_id != null && event.subscription_id === pend.subscription_id) {
            this._fanOutSubscription(event.subscription_id, { request_id, event })
        } else if (event.subscription_id != null) {
            // Subscription-scoped events arriving AFTER the originating request
            // settled (historical_complete deleted the pend) — most importantly
            // a mid-stream `error` when the runtime dies while the socket stays
            // up. Without this fan-out the stream died silently: the UI kept
            // saying "Live" and the feed's error handler never fired.
            this._fanOutSubscription(event.subscription_id, { request_id, event })
        }

        if (type === 'error') {
            const retryable = isRetryable(event.code, event.retryable)
            const err = new CorkyError(event.code, event.message, retryable)
            this._emitter.emit('corky-error', { request_id, event, retryable })
            if (pend) this._settleReject(request_id, err)
            return
        }

        if (!pend) return

        // Streaming subscribe resolves on historical_complete; if a subscription
        // is rejected before any history, subscription_accepted is the only
        // positive signal — but errors handle that path, so we wait for complete.
        if (pend.command.type === 'subscribe_candles') {
            if (type === 'historical_complete') {
                this._settleResolve(request_id, event)
            }
            return
        }

        // Non-streaming commands resolve on their terminal event type.
        const terminal = TERMINAL_EVENT[pend.command.type]
        if (terminal && type === terminal) {
            this._settleResolve(request_id, this._resultFor(type, event))
        }
    }

    _resultFor(type, event) {
        // Return the most useful payload slice for each terminal event.
        if (type === 'candle_states') return event.states
        if (type === 'strategies') return event.strategies
        if (type === 'strategy') return event.strategy
        if (type === 'backtest_runs') return event.runs
        // strategy-runtime reads: each returns its named payload slice (the
        // event type differs from the field it carries — see TERMINAL_EVENT).
        if (type === 'strategy_runtimes') return event.runtimes
        if (type === 'strategy_runtime') return event.runtime
        if (type === 'strategy_ticker') return event.ticker
        if (type === 'strategy_decisions') return event.decisions
        if (type === 'strategy_chart_overlays') return event.overlays
        // backtest_run keeps {run_id, artifact}; progress/overlays keep the full
        // event (callers read .events / .overlays / .trades / series_descriptors).
        return event
    }

    _fanOutSubscription(subscription_id, payload) {
        const set = this._subscribers.get(subscription_id)
        if (!set) return
        for (const cb of set) {
            try { cb(payload) } catch (_) { /* subscriber threw; isolate */ }
        }
    }

    // Find an unsettled pending request by its subscription_id (auth-position
    // stream updates carry no request_id to correlate with). Returns the minimal
    // slice needed to resolve/deliver, or null.
    _pendingBySubscription(subscription_id) {
        for (const [request_id, pend] of this._pending) {
            if (!pend.settled && pend.subscription_id === subscription_id) {
                return { request_id, onEvent: pend.onEvent }
            }
        }
        return null
    }

    _settleResolve(request_id, value) {
        const pend = this._pending.get(request_id)
        if (!pend || pend.settled) return
        pend.settled = true
        this._pending.delete(request_id)
        pend.resolve(value)
    }

    _settleReject(request_id, err) {
        const pend = this._pending.get(request_id)
        if (!pend || pend.settled) return
        pend.settled = true
        this._pending.delete(request_id)
        pend.reject(err)
    }

    _failAllPending(err) {
        for (const [request_id, pend] of this._pending) {
            if (pend.settled) continue
            pend.settled = true
            pend.reject(err)
        }
        this._pending.clear()
    }
}

export default CorkyClient
