// CorkyPositionsFeed — orchestration over a CorkyClient for the read-only
// auth-position interface (open/historical lists, cursor-paged history, and the
// per-position audit bundle), plus the two streaming subscriptions.
//
// Deliberately decoupled from the candle CorkyFeed and the DataCube: positions
// are NOT chart data, so they never touch the chart's reactive store. The feed
// exposes plain promises + callback handles; the UI owns presentation.
//
// Streaming model (matches the gateway): each `auth_positions_update` /
// `auth_position_audit_update` is a FULL REPLACEMENT, applied per subscription by
// strictly increasing `sequence`. There is no per-subscription resume across a
// socket drop, so we re-issue active subscriptions on reconnect (sequence resets).
// If the gateway rejects a subscribe with `stateful_websocket_required`, streaming
// is marked unsupported so the UI can fall back to one-shot list + polling.

import {
  parsePositions, parseHistory, parseAudit,
} from './corky-positions.js'

export class CorkyPositionsFeed {
  constructor({ client } = {}) {
    if (!client) throw new Error('CorkyPositionsFeed: `client` is required')
    this.client = client

    // Deterministic subscription_id minting (counter + prefix; no randomness /
    // wall-clock), mirroring CorkyClient / CorkyFeed discipline.
    this._subCounter = 0

    // subscription_id → handle (live routing state for that stream).
    this._subs = new Map()

    // Cleared to false the moment the gateway rejects a subscribe because the
    // socket isn't stateful; the UI checks this to fall back to list + polling.
    this.streamingSupported = true

    // Re-issue active subscriptions on reconnect (no session resume). Guarded:
    // test fakes may not implement on(). Handles cleaned up in destroy().
    this._offClientEvents = []
    if (typeof this.client.on === 'function') {
      this._offClientEvents.push(this.client.on('open', () => this._onClientOpen()))
    }
    this._everOpened = false
  }

  _nextSubscriptionId(prefix) {
    this._subCounter += 1
    return `${prefix}-${this._subCounter}`
  }

  // ── one-shot reads ──────────────────────────────────────────────────────────

  /** Snapshot of OPEN positions. Resolves `{ positions, current, historical }`. */
  async listOpen({ venue, account_id, symbol, include_historical = false } = {}) {
    const ev = await this.client.listAuthPositions({ venue, account_id, symbol, include_historical })
    return parsePositions(ev)
  }

  /**
   * One page of CLOSED-position history. Resolves
   * `{ positions, next_cursor, total_count }`; pass `next_cursor` back as `cursor`
   * for the next page (opaque — never construct it yourself).
   */
  async listHistory({ venue, account_id, symbol, limit, cursor } = {}) {
    const ev = await this.client.listAuthPositionHistory({ venue, account_id, symbol, limit, cursor })
    return parseHistory(ev)
  }

  /** One-shot audit bundle for a selected position. Resolves the bundle (or null). */
  async getAudit({ venue, account_id, symbol, position_id, include_orders, include_trades } = {}) {
    const ev = await this.client.getAuthPositionAudit({
      venue, account_id, symbol, position_id, include_orders, include_trades,
    })
    return parseAudit(ev)
  }

  // ── streaming ───────────────────────────────────────────────────────────────

  /**
   * Stream OPEN positions. `handlers.onData({ positions, current, historical })`
   * fires on every (in-order) full-replacement update; `handlers.onError(err,
   * { lastGood })` on a subscribe failure. Returns a handle for unsubscribe().
   */
  subscribeOpen(opts = {}, handlers = {}) {
    return this._subscribe('subscribeAuthPositions', 'auth-positions', opts, handlers, parsePositions)
  }

  /**
   * Stream the audit bundle for one position. `handlers.onData(audit)` per update;
   * `handlers.onError(err, { lastGood })` on failure. Returns a handle.
   */
  subscribeAudit(opts = {}, handlers = {}) {
    return this._subscribe('subscribeAuthPositionAudit', 'auth-position-audit', opts, handlers, parseAudit)
  }

  _subscribe(method, prefix, opts, handlers, parse) {
    const subscription_id = opts.subscription_id || this._nextSubscriptionId(prefix)
    const handle = {
      subscription_id, method, parse,
      // request args minus subscription_id (added at issue time)
      args: { ...opts, subscription_id },
      onData: handlers.onData,
      onError: handlers.onError,
      lastSeq: -Infinity,   // strictly-increasing sequence guard
      lastGood: null,       // last successfully-parsed payload (kept on error)
      closed: false,
    }
    this._subs.set(subscription_id, handle)
    // Register fan-out BEFORE issuing so the first update can't race past us.
    handle.unFanout = this.client.onSubscription(
      subscription_id, (payload) => this._onUpdate(handle, payload))
    this._issue(handle)
    return handle
  }

  // Send (or re-send) the subscribe frame. Data arrives via the fan-out listener
  // (including the first update); the promise resolution is therefore ignored —
  // we only care about its rejection (subscribe refused, e.g. a non-stateful
  // socket). Issue synchronously so the call is observable immediately; surface
  // both synchronous throws and async rejections through _onSubError.
  _issue(handle) {
    try {
      const p = this.client[handle.method]({ ...handle.args })
      if (p && typeof p.catch === 'function') p.catch((err) => this._onSubError(handle, err))
    } catch (err) {
      this._onSubError(handle, err)
    }
  }

  _onUpdate(handle, payload) {
    if (handle.closed) return
    const event = payload && payload.event
    if (!event) return
    if (event.type === 'error') { this._onSubError(handle, event); return }

    // Strictly-increasing sequence: drop stale / duplicate (e.g. the first update
    // delivered to both onEvent and fan-out, or a reconnect replay).
    const seq = event.sequence
    if (typeof seq === 'number') {
      if (seq <= handle.lastSeq) return
      handle.lastSeq = seq
    }

    const data = handle.parse(event)
    handle.lastGood = data
    if (handle.onData) {
      try { handle.onData(data, { sequence: seq }) } catch (_) { /* consumer threw; isolate */ }
    }
  }

  _onSubError(handle, err) {
    if (handle.closed) return
    if (err && err.code === 'stateful_websocket_required') this.streamingSupported = false
    if (handle.onError) {
      try { handle.onError(err, { lastGood: handle.lastGood }) } catch (_) { /* isolate */ }
    }
  }

  /** Stop a streaming subscription: detach fan-out, tell the gateway, forget it. */
  unsubscribe(handle) {
    if (!handle) return
    handle.closed = true
    if (handle.unFanout) { handle.unFanout(); handle.unFanout = null }
    this._subs.delete(handle.subscription_id)
    try { this.client.unsubscribe(handle.subscription_id) } catch (_) { /* best-effort */ }
  }

  // Reconnect: the gateway has no session resume, so re-issue every active
  // subscription (the fan-out registry survives the drop). Reset the sequence
  // guard — the fresh stream restarts at sequence 1.
  _onClientOpen() {
    if (!this._everOpened) { this._everOpened = true; return }
    for (const handle of this._subs.values()) {
      handle.lastSeq = -Infinity
      this._issue(handle)
    }
  }

  /** Tear down: unsubscribe everything and detach connection listeners. */
  destroy() {
    for (const handle of Array.from(this._subs.values())) this.unsubscribe(handle)
    for (const off of this._offClientEvents) { try { off() } catch (_) { /* ignore */ } }
    this._offClientEvents = []
  }
}

export default CorkyPositionsFeed
