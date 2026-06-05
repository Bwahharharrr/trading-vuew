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
    list_candle_states:   'candle_states',
    unsubscribe:          'control_ack',
    upsert_candle_state:  'control_ack',
    patch_candle_state:   'control_ack',
}

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
        this._open()
        return this
    }

    _open() {
        const sock = this._socketFactory(this.url)
        this._socket = sock

        sock.onopen = () => {
            this._retries = 0
            this._emitter.emit('open')
        }
        sock.onmessage = (ev) => this._handleMessage(ev)
        sock.onerror = (err) => this._emitter.emit('socket-error', err)
        sock.onclose = (ev) => this._handleClose(ev)
    }

    close() {
        this._closedByUser = true
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
        if (this._closedByUser) return
        // A non-user drop abandons any in-flight request/response: the new
        // socket has no memory of them. Fail them with a RETRYABLE error so
        // awaiters don't hang forever (streaming subscriptions live on the
        // emitter and are unaffected by this).
        this._failAllPending(new CorkyError('connection_lost', 'socket closed before response', true))
        if (!this._backoffCfg) return
        this._scheduleReconnect()
    }

    _scheduleReconnect() {
        const cfg = this._backoffCfg
        if (this._retries >= cfg.maxRetries) {
            this._emitter.emit('reconnect-exhausted', { retries: this._retries })
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

        return this._request(command, { subscription_id, onEvent })
    }

    unsubscribe(subscription_id) {
        if (!subscription_id) throw new Error('unsubscribe: subscription_id is required')
        return this._request({ type: 'unsubscribe', subscription_id })
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
        this._socket.send(JSON.stringify(frame))
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

        // Live updates may carry a null request_id — fan out by subscription_id.
        if (type === 'live_update') {
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
        return event
    }

    _fanOutSubscription(subscription_id, payload) {
        const set = this._subscribers.get(subscription_id)
        if (!set) return
        for (const cb of set) {
            try { cb(payload) } catch (_) { /* subscriber threw; isolate */ }
        }
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
