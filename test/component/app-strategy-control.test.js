// @vitest-environment jsdom
//
// App.vue Phase-3 DIRECT-CONTROL handlers, via App.methods bound to a fake `this`
// (no mount) — same technique as app-strategy.test.js. The GATE:
//
//   1. a control intent produces the correct feed call AND the exact request
//      envelope on the wire (matched against the *.request.json fixtures) —
//      driven through the REAL CorkyStrategyFeed → CorkyClient → FakeSocket stack;
//   2. controls are gated on a control session — with none, the handler no-ops
//      (nothing is sent) and reports the missing session;
//   3. a control send NEVER mutates local strategy/order state — the runtime set
//      only changes on the next subscription full-replacement (reconciliation).
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'
import DataCube from '../../src/helpers/datacube.js'
import { CorkyStrategyFeed } from '../../src/helpers/feed/corky-strategy-feed.js'
import { CorkyClient } from '../../src/helpers/feed/corky-client.js'

import cancelReq from '../fixtures/corky/strategy/examples/cancel-strategy-ticker-orders.request.json'
import pauseReq from '../fixtures/corky/strategy/examples/pause-strategy-ticker.request.json'
import adoptOneReq from '../fixtures/corky/strategy/examples/adopt-strategy-position.request.json'
import adoptManyReq from '../fixtures/corky/strategy/examples/adopt-strategy-positions.request.json'

const M = App.methods

// ── real client over a fake socket (records outbound frames) ──────────────────
class FakeSocket {
  constructor(url) {
    this.url = url
    this.sent = []
    this.onopen = this.onmessage = this.onerror = this.onclose = null
    FakeSocket.instances.push(this)
  }
  send(raw) { this.sent.push(JSON.parse(raw)) }
  close() { if (this.onclose) this.onclose({ code: 1000 }) }
  open() { if (this.onopen) this.onopen({}) }
  push(envelope) { if (this.onmessage) this.onmessage({ data: JSON.stringify(envelope) }) }
  static reset() { FakeSocket.instances = [] }
}
FakeSocket.instances = []
const sock = () => FakeSocket.instances[FakeSocket.instances.length - 1]
const ack = (request_id) => ({ schema_version: 1, request_id, event: { type: 'control_ack', outcome: 'accepted' } })

// Bind the strategy control methods (+ their deps) to a fake App instance holding
// a REAL feed, a discovered runtime set, and an available control session.
function mkCtx(feed, runtimeId) {
  const ctx = {
    strategyFeed: feed,
    strategy: {
      runtimes: [{
        runtime_id: runtimeId, strategy: 'ema_regime_breakout_v8', state: 'Ready',
        runtime_control_available: true, ticker_allocations: [], ticker_orders: [],
      }],
      selectedRuntimeId: runtimeId, decisions: [], overlays: {}, streaming: true, loading: false, error: null,
      control: { available: true, pending: false, awaiting: false, error: null },
    },
  }
  for (const m of ['_strategyControl', 'strategyCancelTickerOrders', 'strategyPauseTicker', 'strategyResumeTicker',
    'strategyUnlockTicker', 'strategyAdoptPosition', 'strategyAdoptPositions', '_strategyErr',
    '_strategyApplyUpdate', '_strategyUpsertRuntimes']) {
    ctx[m] = M[m]
  }
  return ctx
}

function mkRealFeed() {
  FakeSocket.reset()
  const client = new CorkyClient({ url: 'ws://fake/corky', socketFactory: (u) => new FakeSocket(u), backoff: false })
  client.connect()
  sock().open()
  return new CorkyStrategyFeed({ client })
}

beforeEach(() => FakeSocket.reset())

// ── intent → wire envelope (matches the request fixtures through the real stack) ──
describe('control intents produce the exact request envelopes (fixture match, real feed+client)', () => {
  test('cancel → cancel_strategy_ticker_orders command == cancel-strategy-ticker-orders.request.json', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, cancelReq.command.runtime_id)
    const { runtime_id, ticker_id, reason } = cancelReq.command
    const p = ctx.strategyCancelTickerOrders({ runtime_id, ticker_id, reason })
    // exact outbound framing — no target_runtime_id / strategy_instance_id leak
    expect(sock().sent[0].command).toEqual(cancelReq.command)
    expect(sock().sent[0].schema_version).toBe(1)
    sock().push(ack(sock().sent[0].request_id))
    await p
    expect(ctx.strategy.control.pending).toBe(false)
    expect(ctx.strategy.control.awaiting).toBe(cancelReq.command.runtime_id)   // awaiting THIS runtime's reconciliation
  })

  test('pause → pause_strategy_ticker command == pause-strategy-ticker.request.json', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, pauseReq.command.runtime_id)
    const { runtime_id, ticker_id, reason } = pauseReq.command
    const p = ctx.strategyPauseTicker({ runtime_id, ticker_id, reason })
    expect(sock().sent[0].command).toEqual(pauseReq.command)
    sock().push(ack(sock().sent[0].request_id)); await p
  })

  test('adopt one → adopt_strategy_position command == adopt-strategy-position.request.json', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, adoptOneReq.command.runtime_id)
    const { runtime_id, ticker_id, position_id, reason } = adoptOneReq.command
    const p = ctx.strategyAdoptPosition({ runtime_id, ticker_id, position_id, reason })
    expect(sock().sent[0].command).toEqual(adoptOneReq.command)
    sock().push(ack(sock().sent[0].request_id)); await p
  })

  test('adopt many → adopt_strategy_positions command == adopt-strategy-positions.request.json (batch + instance id)', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, adoptManyReq.command.runtime_id)
    const { runtime_id, strategy_instance_id, positions, reason } = adoptManyReq.command
    const p = ctx.strategyAdoptPositions({ runtime_id, strategy_instance_id, positions, reason })
    expect(sock().sent[0].command).toEqual(adoptManyReq.command)
    sock().push(ack(sock().sent[0].request_id)); await p
  })
})

// ── correct feed calls (with a recording fake feed) ───────────────────────────
describe('control handlers delegate to the matching feed control method', () => {
  const mkFakeFeed = () => ({
    calls: [],
    cancelTickerOrders(o) { this.calls.push(['cancelTickerOrders', o]); return Promise.resolve({ type: 'control_ack' }) },
    pauseTicker(o) { this.calls.push(['pauseTicker', o]); return Promise.resolve({ type: 'control_ack' }) },
    resumeTicker(o) { this.calls.push(['resumeTicker', o]); return Promise.resolve({ type: 'control_ack' }) },
    unlockTicker(o) { this.calls.push(['unlockTicker', o]); return Promise.resolve({ type: 'control_ack' }) },
    adoptPosition(o) { this.calls.push(['adoptPosition', o]); return Promise.resolve({ type: 'control_ack' }) },
    adoptPositions(o) { this.calls.push(['adoptPositions', o]); return Promise.resolve({ type: 'control_ack' }) },
  })

  test('each intent forwards its payload verbatim to the right feed method', async () => {
    const feed = mkFakeFeed()
    const ctx = mkCtx(feed, 'strategy-runtime-v8-test')
    await ctx.strategyCancelTickerOrders({ runtime_id: 'strategy-runtime-v8-test', ticker_id: 'tk', reason: 'r' })
    await ctx.strategyPauseTicker({ runtime_id: 'strategy-runtime-v8-test', ticker_id: 'tk', reason: 'p' })
    expect(feed.calls).toContainEqual(['cancelTickerOrders', { runtime_id: 'strategy-runtime-v8-test', ticker_id: 'tk', reason: 'r' }])
    expect(feed.calls).toContainEqual(['pauseTicker', { runtime_id: 'strategy-runtime-v8-test', ticker_id: 'tk', reason: 'p' }])
  })
})

describe('runtime capability gate', () => {
  test('does not send merely because the client socket is connected', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, pauseReq.command.runtime_id)
    ctx.strategy.runtimes[0].runtime_control_available = false
    ctx.strategy.runtimes[0].runtime_control_reason = 'origin observer is capability-fenced'
    const { runtime_id, ticker_id, reason } = pauseReq.command
    await ctx.strategyPauseTicker({ runtime_id, ticker_id, reason })
    expect(sock().sent).toHaveLength(0)
    expect(ctx.strategy.control.error).toContain('origin observer is capability-fenced')
  })
})

// ── gated on a control session ────────────────────────────────────────────────
describe('controls are gated on an available control session', () => {
  test('with no session the handler sends NOTHING and reports the missing session', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, cancelReq.command.runtime_id)
    ctx.strategy.control.available = false           // session dropped
    const before = sock().sent.length
    await ctx.strategyCancelTickerOrders({ ...cancelReq.command })
    expect(sock().sent.length).toBe(before)          // no frame emitted
    expect(ctx.strategy.control.error).toMatch(/no strategy control session/i)
  })

  test('an unknown runtime (not in the discovered set) is refused before sending', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, cancelReq.command.runtime_id)
    const before = sock().sent.length
    await ctx.strategyCancelTickerOrders({ runtime_id: 'ghost-runtime', ticker_id: 'tk', reason: 'r' })
    expect(sock().sent.length).toBe(before)
    expect(ctx.strategy.control.error).toMatch(/unknown runtime/i)
  })

  test('capital-committing controls (unlock/adopt) are BLOCKED on a mismatched-lineage runtime; halt controls pass', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, 'strategy-runtime-status-matrix')
    ctx.strategy.runtimes[0].lineage_status = 'mismatch'   // not verified running
    const p = ctx.strategy.runtimes[0]
    const args = { runtime_id: 'strategy-runtime-status-matrix', ticker_id: 'BITFINEX:tX:TESTUSD', reason: 'x' }
    // capital-committing → blocked before any send (socket stays empty).
    await ctx.strategyUnlockTicker({ ...args, new_allocation: { currency: 'TESTUSD', amount: '1' } })
    await ctx.strategyAdoptPosition({ ...args, position_id: 1 })
    expect(sock().sent).toHaveLength(0)
    expect(ctx.strategy.control.error.toLowerCase()).toContain('not verified')
    // halt/safety (pause) still reaches the wire.
    const pr = ctx.strategyPauseTicker(args)
    expect(sock().sent).toHaveLength(1)
    expect(sock().sent[0].command.type).toBe('pause_strategy_ticker')
    sock().push(ack(sock().sent[0].request_id)); await pr
  })

  test('a control_session_required rejection drops the control surface (canonical gateway code)', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, cancelReq.command.runtime_id)
    const { runtime_id, ticker_id, reason } = cancelReq.command
    const p = ctx.strategyCancelTickerOrders({ runtime_id, ticker_id, reason })
    sock().push({
      schema_version: 1, request_id: sock().sent[0].request_id,
      event: { type: 'error', code: 'control_session_required', message: 'missing or stale runtime control session', retryable: false },
    })
    await p
    expect(ctx.strategy.control.available).toBe(false)   // hide controls until a fresh session
    expect(ctx.strategy.control.pending).toBe(false)
    expect(ctx.strategy.control.error).toContain('control session')
  })
})

// ── no local mutation — reconcile only via the subscription full-replacement ──
describe('a control send never mutates local strategy state (reconciliation only)', () => {
  test('the runtime set is untouched by the send; it changes only on the next subscription update', async () => {
    const feed = mkRealFeed()
    const ctx = mkCtx(feed, cancelReq.command.runtime_id)
    ctx.strategy.runtimes = [{
      runtime_id: cancelReq.command.runtime_id, state: 'Ready', last_decision_ms: 100,
      runtime_control_available: true,
      ticker_orders: [{ ticker_id: cancelReq.command.ticker_id, orders_submitted_nonterminal: 1 }],
    }]
    const snapshot = JSON.parse(JSON.stringify(ctx.strategy.runtimes))
    const { runtime_id, ticker_id, reason } = cancelReq.command
    const p = ctx.strategyCancelTickerOrders({ runtime_id, ticker_id, reason })
    sock().push(ack(sock().sent[0].request_id))
    await p
    // The submitted-order blocker is STILL present locally — the ack did not clear it.
    expect(ctx.strategy.runtimes).toEqual(snapshot)
    expect(ctx.strategy.runtimes[0].ticker_orders[0].orders_submitted_nonterminal).toBe(1)
    // Only the reconciliation update (subscription full-replacement) changes state.
    ctx._strategyApplyUpdate([{ runtime_id, state: 'Ready', last_decision_ms: 200, ticker_orders: [{ ticker_id, orders_submitted_nonterminal: 0 }] }])
    expect(ctx.strategy.runtimes[0].ticker_orders[0].orders_submitted_nonterminal).toBe(0)
    expect(ctx.strategy.runtimes[0].last_decision_ms).toBe(200)
    expect(ctx.strategy.control.awaiting).toBe(null)   // the update for THIS runtime cleared the hint
  })
})

describe('strategyOpenLineageRun — jump to the verified universe backtest run + candidate', () => {
  function navCtx(runs) {
    const ctx = {
      backtests: { runs: runs || [], filters: {}, loading: false, error: null, clickHistory: [], detail: {} },
      backtestsFeed: {
        listRuns: vi.fn(async () => runs || []),
        getRun: vi.fn(async (id) => ({ run_id: id, status: 'completed' })),
      },
      setPositionsTab: vi.fn(),
      btListRuns: vi.fn(async () => {}),
      btSelectRun: vi.fn(async () => {}),
      btSelectCandidate: vi.fn(async () => {}),
    }
    ctx.strategyOpenLineageRun = M.strategyOpenLineageRun
    return ctx
  }

  test('switches to the Backtests tab, opens the run FROM THE LOADED LIST, and drills into the candidate', async () => {
    const run = { run_id: 'universe-v8-tail-repair-20260630', status: 'completed' }
    const ctx = navCtx([run])
    await ctx.strategyOpenLineageRun({ run_id: run.run_id, run_index: 0 })
    expect(ctx.setPositionsTab).toHaveBeenCalledWith('backtests')
    expect(ctx.btSelectRun).toHaveBeenCalledWith(run)     // found in the list, not re-fetched
    expect(ctx.backtestsFeed.getRun).not.toHaveBeenCalled()
    expect(ctx.btSelectCandidate).toHaveBeenCalledWith(0)
  })

  test('fetches the run by id when it is not in the unfiltered catalog', async () => {
    const ctx = navCtx([])   // unfiltered list still empty → exact artifact fallback
    await ctx.strategyOpenLineageRun({ run_id: 'universe-x', run_index: 3 })
    expect(ctx.backtestsFeed.listRuns).toHaveBeenCalledWith({})
    expect(ctx.backtestsFeed.getRun).toHaveBeenCalledWith('universe-x', { compact: true })
    expect(ctx.btSelectRun).toHaveBeenCalledWith(expect.objectContaining({ run_id: 'universe-x' }))
    expect(ctx.btSelectCandidate).toHaveBeenCalledWith(3)
  })

  test('no run_index → opens the run without selecting a candidate; no run_id → no-op', async () => {
    const ctx = navCtx([{ run_id: 'r', status: 'completed' }])
    await ctx.strategyOpenLineageRun({ run_id: 'r' })
    expect(ctx.btSelectRun).toHaveBeenCalled()
    expect(ctx.btSelectCandidate).not.toHaveBeenCalled()
    const ctx2 = navCtx([])
    await ctx2.strategyOpenLineageRun({})
    expect(ctx2.setPositionsTab).not.toHaveBeenCalled()
  })

  test('ignores current run filters and opens a lineage run from the unfiltered catalog', async () => {
    const hidden = { run_id: 'universe-hidden', status: 'completed' }
    const ctx = navCtx([])
    ctx.backtests.filters = { strategy: 'another_strategy' }
    ctx.backtestsFeed.listRuns.mockResolvedValue([hidden])
    await ctx.strategyOpenLineageRun({ run_id: hidden.run_id, run_index: 7 })
    expect(ctx.btSelectRun).toHaveBeenCalledWith(hidden)
    expect(ctx.backtests.runs[0]).toBe(hidden)
    expect(ctx.backtestsFeed.getRun).not.toHaveBeenCalled()
  })
})

describe('strategy balance tab — strategy-scoped history and timeframe reload', () => {
  test('opens/reuses a balance tab, loads history, and reloads the selected timeframe', async () => {
    const state = {
      runtimeId: 'rt-v8', strategyName: 'EMA V8', timeframe: '1h',
      history: null, loading: false, error: null, requestSequence: 0,
    }
    const tab = { id: 'balance-tab', kind: 'strategy_balance', strategyBalance: state, chart: null }
    const feed = {
      getBalanceHistory: vi.fn(async (runtimeId, opts) => ({
        runtime_id: runtimeId, timeframe: opts.timeframe, starting_balance: '1000', points: [],
      })),
    }
    const ctx = {
      strategyFeed: feed,
      activeTab: tab,
      activeChartTabId: 'balance-tab',
      DataCubeClass: DataCube,
      onTabCubeReplaced: vi.fn((target, dc) => { target.chart = dc }),
      $nextTick: (fn) => { if (fn) fn(); return Promise.resolve() },
      $refs: { tradingVue: { resetChart: vi.fn() } },
      createStrategyBalanceTab: vi.fn(() => tab),
      _strategyErr: M._strategyErr,
    }
    ctx._loadStrategyBalance = M._loadStrategyBalance
    ctx.strategyViewBalance = M.strategyViewBalance
    ctx.strategyBalanceTimeframeChanged = M.strategyBalanceTimeframeChanged

    await ctx.strategyViewBalance({ runtime_id: 'rt-v8', strategy_name: 'EMA V8' })
    expect(ctx.createStrategyBalanceTab).toHaveBeenCalledWith({ runtimeId: 'rt-v8', strategyName: 'EMA V8' })
    expect(state.history).toMatchObject({ runtime_id: 'rt-v8', timeframe: '1h' })
    expect(state.loading).toBe(false)
    expect(ctx.onTabCubeReplaced).toHaveBeenCalledTimes(1)
    expect(tab.chart.data.chart.type).toBe('Spline')
    expect(ctx.$refs.tradingVue.resetChart).toHaveBeenCalledTimes(1)

    await ctx.strategyBalanceTimeframeChanged('1D')
    expect(state.timeframe).toBe('1D')
    expect(feed.getBalanceHistory).toHaveBeenLastCalledWith('rt-v8', { timeframe: '1D' })
    expect(state.history.timeframe).toBe('1D')
    expect(ctx.onTabCubeReplaced).toHaveBeenCalledTimes(2)
  })
})
