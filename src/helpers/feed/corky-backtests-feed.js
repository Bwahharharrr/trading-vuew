// CorkyBacktestsFeed — orchestration over a CorkyClient for the READ-ONLY
// strategy + backtest interface (list/inspect strategies, list/inspect runs,
// one-shot + streaming progress, chart/report overlays).
//
// Read surface only: the chart app never calls the legacy runner HTTP artifact
// API — all reads come through the chart-feed gateway WebSocket. Backtest data
// is NOT chart data, so this feed never touches the candle DataCube; it exposes
// plain promises + a progress stream, and the UI owns presentation. Money /
// quantity fields stay DECIMAL STRINGS throughout (never float-parsed here).
//
// Streaming model (matches the gateway): each `backtest_progress_update` carries
// the FULL current progress-event list, applied per subscription by strictly
// increasing `sequence`. There is no session resume across a socket drop, so we
// re-issue the active subscription on reconnect (sequence resets).

export class CorkyBacktestsFeed {
  constructor({ client } = {}) {
    if (!client) throw new Error('CorkyBacktestsFeed: `client` is required')
    this.client = client

    // Deterministic subscription_id minting (counter + prefix; no randomness /
    // wall-clock), mirroring the other feeds.
    this._subCounter = 0
    this._subs = new Map()   // subscription_id → handle
    this.streamingSupported = true

    // Re-issue the active progress subscription on reconnect (no session resume).
    this._offClientEvents = []
    if (typeof this.client.on === 'function') {
      this._offClientEvents.push(this.client.on('open', () => this._onClientOpen()))
    }
    this._everOpened = false
  }

  _nextSubscriptionId(prefix = 'backtest-progress') {
    this._subCounter += 1
    return `${prefix}-${this._subCounter}`
  }

  // ── one-shot reads ──────────────────────────────────────────────────────────

  /** Available strategies. Resolves `ChartStrategyDescriptor[]`. */
  listStrategies() { return this.client.listStrategies() }

  /** One strategy's descriptor. Resolves `ChartStrategyDescriptor`. */
  getStrategy(strategy) { return this.client.getStrategy(strategy) }

  /** Backtest runs (all filters optional). Resolves `ChartBacktestRunSummary[]`. */
  listRuns(filters = {}) { return this.client.listBacktestRuns(filters) }

  /** Raw pass-through artifact for a run. Resolves `{ run_id, artifact }`. */
  getRun(run_id) { return this.client.getBacktestRun(run_id) }

  /** One-shot progress snapshot. Resolves the progress-event list (`[]` if none). */
  async getProgress(run_id) {
    const ev = await this.client.getBacktestProgress(run_id)
    return (ev && ev.events) || []
  }

  /** Per-trade chart windows + markers. Resolves the full overlays event. */
  getChartOverlays(opts = {}) { return this.client.getBacktestChartOverlays(opts) }

  /** Normalized report/account overlays. Resolves the full overlays event. */
  getReportOverlays(opts = {}) { return this.client.getBacktestReportOverlays(opts) }

  // ── streaming progress ──────────────────────────────────────────────────────

  /**
   * Stream live progress for a run. `handlers.onData(events, { sequence, run_id })`
   * fires on every (in-order) full-replacement update; `handlers.onError(err,
   * { lastGood })` on a subscribe failure. Returns a handle for unsubscribe().
   */
  subscribeProgress(opts = {}, handlers = {}) {
    const subscription_id = opts.subscription_id || this._nextSubscriptionId()
    const handle = {
      subscription_id,
      run_id: opts.run_id,
      args: { ...opts, subscription_id },
      onData: handlers.onData,
      onError: handlers.onError,
      lastSeq: -Infinity,   // strictly-increasing sequence guard
      lastGood: null,       // last good events list (kept on error)
      closed: false,
    }
    this._subs.set(subscription_id, handle)
    // Register fan-out BEFORE issuing so the first update can't race past us.
    handle.unFanout = this.client.onSubscription(
      subscription_id, (payload) => this._onUpdate(handle, payload))
    this._issue(handle)
    return handle
  }

  _issue(handle) {
    try {
      const p = this.client.subscribeBacktestProgress({ ...handle.args })
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

    const seq = event.sequence
    if (typeof seq === 'number') {
      if (seq <= handle.lastSeq) return   // stale / duplicate / reconnect replay
      handle.lastSeq = seq
    }
    const events = Array.isArray(event.events) ? event.events : []
    handle.lastGood = events
    if (handle.onData) {
      try { handle.onData(events, { sequence: seq, run_id: event.run_id }) } catch (_) { /* isolate */ }
    }
  }

  _onSubError(handle, err) {
    if (handle.closed) return
    if (err && err.code === 'stateful_websocket_required') this.streamingSupported = false
    if (handle.onError) {
      try { handle.onError(err, { lastGood: handle.lastGood }) } catch (_) { /* isolate */ }
    }
  }

  /** Stop a progress stream: detach fan-out, tell the gateway, forget it. */
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

  _onClientOpen() {
    if (!this._everOpened) { this._everOpened = true; return }
    for (const handle of this._subs.values()) {
      handle.lastSeq = -Infinity   // fresh stream restarts at sequence 1
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

export default CorkyBacktestsFeed
