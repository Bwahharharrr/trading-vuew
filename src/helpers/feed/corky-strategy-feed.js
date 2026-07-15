// CorkyStrategyFeed — orchestration over a CorkyClient for the READ-ONLY
// strategy-runtime interface (list runtimes, inspect a runtime / ticker, list
// decisions, immutable operations, chart overlays) plus live runtime/operations
// subscriptions.
//
// Read surface only: this feed never touches the candle DataCube (strategy state
// is NOT chart data) — it exposes plain promises + a runtime stream, and the UI
// owns presentation. Money / quantity fields stay DECIMAL STRINGS throughout
// (never float-parsed here — see corky-strategy-transforms.js).
//
// Streaming model (matches the gateway): each `strategy_runtime_update` is a FULL
// REPLACEMENT of the runtime set, applied per subscription by strictly increasing
// `sequence`. There is no session resume across a socket drop, so the active
// subscription is re-issued on reconnect (sequence resets to 1). Deterministic
// subscription_id minting (counter + prefix; no randomness / wall-clock), mirroring
// CorkyBacktestsFeed / CorkyPositionsFeed.

export class CorkyStrategyFeed {
  constructor({ client } = {}) {
    if (!client) throw new Error('CorkyStrategyFeed: `client` is required')
    this.client = client

    this._subCounter = 0
    this._subs = new Map()   // subscription_id → handle
    this.streamingSupported = true

    // Re-issue the active subscription on reconnect (no session resume). Guarded:
    // test fakes may not implement on(). Cleaned up in destroy().
    this._offClientEvents = []
    if (typeof this.client.on === 'function') {
      this._offClientEvents.push(this.client.on('open', () => this._onClientOpen()))
    }
    this._everOpened = false
  }

  _nextSubscriptionId(prefix = 'strategy-runtime') {
    this._subCounter += 1
    return `${prefix}-${this._subCounter}`
  }

  // ── one-shot reads ──────────────────────────────────────────────────────────

  /** All strategy runtimes. Resolves the `runtimes` array. */
  listRuntimes() { return this.client.listStrategyRuntimes() }

  /** One runtime's full snapshot. Resolves the `runtime` object. */
  getRuntime(runtime_id) { return this.client.getStrategyRuntime(runtime_id) }

  /** One ticker within a runtime. Resolves the `ticker` object. */
  getTicker(runtime_id, ticker_id) { return this.client.getStrategyTicker(runtime_id, ticker_id) }

  /** Recent decisions for a runtime. Resolves the `decisions` array. */
  listDecisions(runtime_id, opts = {}) { return this.client.listStrategyDecisions(runtime_id, opts) }

  /** Cursor-bound immutable operations page for a runtime. */
  listOperations(runtime_id, opts = {}) { return this.client.listStrategyOperations(runtime_id, opts) }

  /** Server-computed money/valuation projection; decimal strings stay intact. */
  getMoney(runtime_id) { return this.client.getStrategyMoney(runtime_id) }

  /** Chart overlays (decision/fill/order/allocation markers). Resolves `overlays`. */
  getChartOverlays(runtime_id, ticker_id, opts = {}) {
    return this.client.getStrategyChartOverlays(runtime_id, ticker_id, opts)
  }

  /** Read-only allocation-policy comparison, returned exactly as projected. */
  compareAllocationPolicies(runtime_id, opts = {}) {
    return this.client.compareStrategyAllocationPolicies(runtime_id, opts)
  }

  /** Revision-bound administrative preview; does not mutate runtime state. */
  previewOperation(opts = {}) { return this.client.previewStrategyOperation(opts) }

  /** Apply an exact preview after the operator supplies its required statement. */
  approveOperation(preview, approval_statement) {
    return this.client.approveStrategyOperation(preview, approval_statement)
  }

  // ── direct-control mutations (thin passthrough over the client) ───────────────
  // MUTATE a live runtime — gated by an available control session; each requires a
  // visible operator `reason` and echoes the discovered runtime id as
  // `target_runtime_id` (runtime-targeting) when provided. On ack, do NOT mutate
  // local state — wait for the subscription full-replacement to reconcile.

  /** Pause one ticker. opts: { runtime_id, ticker_id, reason, strategy_instance_id?, target_runtime_id? }. */
  pauseTicker(opts = {}) { return this.client.pauseStrategyTicker(opts) }

  /** Resume one paused ticker. Same opts shape as pauseTicker. */
  resumeTicker(opts = {}) { return this.client.resumeStrategyTicker(opts) }

  /** Unlock one locked ticker with a positive new allocation. opts adds
   *  { new_allocation: { currency, amount } } (amount is a decimal string). */
  unlockTicker(opts = {}) { return this.client.unlockStrategyTicker(opts) }

  /** Adopt one exact pre-existing auth position. opts: { runtime_id, ticker_id, position_id, reason, … }. */
  adoptPosition(opts = {}) { return this.client.adoptStrategyPosition(opts) }

  /** Adopt a named batch of pre-existing auth positions. opts: { runtime_id, positions:[{ticker_id,position_id}], reason, … }. */
  adoptPositions(opts = {}) { return this.client.adoptStrategyPositions(opts) }

  /** Cancel active/submitted orders on one ticker (reason is a visible operator input). */
  cancelTickerOrders(opts = {}) { return this.client.cancelStrategyTickerOrders(opts) }

  // ── streaming runtime snapshots ───────────────────────────────────────────────

  /**
   * Stream the runtime set. `handlers.onData(runtimes, { sequence })` fires on
   * every (in-order) FULL-REPLACEMENT update; `handlers.onError(err, { lastGood })`
   * on a subscribe failure. Omit filters for the authoritative catalog, or scope
   * with `opts.runtime_id` / `opts.strategy` for a narrower diagnostic stream.
   * Returns a handle for unsubscribe().
   */
  subscribeRuntime(opts = {}, handlers = {}) {
    const subscription_id = opts.subscription_id || this._nextSubscriptionId()
    const handle = {
      subscription_id,
      kind: 'runtime',
      // request args minus subscription_id (added at issue time)
      args: { ...opts, subscription_id },
      onData: handlers.onData,
      onError: handlers.onError,
      lastSeq: -Infinity,   // strictly-increasing sequence guard
      lastGood: null,       // last good runtimes list (kept on error)
      closed: false,
    }
    this._subs.set(subscription_id, handle)
    // Register fan-out BEFORE issuing so the first update can't race past us.
    handle.unFanout = this.client.onSubscription(
      subscription_id, (payload) => this._onUpdate(handle, payload))
    this._issue(handle)
    return handle
  }

  /** Stream immutable operation pages for one runtime. The latest published
   *  resume_cursor is retained on the handle and used after reconnect. */
  subscribeOperations(opts = {}, handlers = {}) {
    const subscription_id = opts.subscription_id || this._nextSubscriptionId('strategy-operations')
    const handle = {
      subscription_id,
      kind: 'operations',
      args: { ...opts, subscription_id },
      onData: handlers.onData,
      onError: handlers.onError,
      lastSeq: -Infinity,
      lastGood: null,
      closed: false,
    }
    this._subs.set(subscription_id, handle)
    handle.unFanout = this.client.onSubscription(
      subscription_id, (payload) => this._onUpdate(handle, payload))
    this._issue(handle)
    return handle
  }

  // Send (or re-send) the subscribe frame. Data (including the first update)
  // arrives via the fan-out listener, so the promise's resolution is ignored — we
  // only care about its rejection (subscribe refused, e.g. a non-stateful socket).
  // Surface both a synchronous throw and an async rejection through _onSubError.
  _issue(handle) {
    try {
      const p = handle.kind === 'operations'
        ? this.client.subscribeStrategyOperations({ ...handle.args })
        : this.client.subscribeStrategyRuntime({ ...handle.args })
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

    // Strictly-increasing sequence: drop stale / duplicate / reconnect replay.
    const seq = event.sequence
    if (typeof seq === 'number') {
      if (seq <= handle.lastSeq) return
      handle.lastSeq = seq
    }
    const data = handle.kind === 'operations'
      ? (event.page || { events: [], lifecycle_intervals: [] })
      : (Array.isArray(event.runtimes) ? event.runtimes : [])
    handle.lastGood = data
    if (handle.kind === 'operations' && data.resume_cursor != null) {
      handle.args.cursor = data.resume_cursor
    }
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

  /** Stop a stream: detach fan-out, tell the gateway, forget it. */
  unsubscribe(handle) {
    if (!handle) return
    handle.closed = true
    if (handle.unFanout) { handle.unFanout(); handle.unFanout = null }
    this._subs.delete(handle.subscription_id)
    // Best-effort: swallow a sync throw AND the request promise's rejection.
    try {
      const p = this.client.unsubscribe(handle.subscription_id)
      if (p && typeof p.catch === 'function') p.catch(() => { /* closing anyway */ })
    } catch (_) { /* best-effort */ }
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

  /** Alias for destroy() — matches the dispose()/destroy() lifecycle contract. */
  dispose() { this.destroy() }
}

export default CorkyStrategyFeed
