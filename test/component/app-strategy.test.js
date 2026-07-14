// @vitest-environment jsdom
//
// App.vue strategy-runtime handlers + chart integration, via App.methods bound to
// a fake `this` (no mount) — same technique as app-backtests.test.js. Covers the
// Phase-3 gate: subscription FULL-REPLACEMENT apply (by increasing sequence),
// runtime selection (keeps others selectable), and on-chart overlay sync add/remove.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods
const DEFAULT_ID = 'v8-tail-repair-live-main'
const OTHER_ID = 'v8-tail-repair-status-main'

const ADA = 'tTESTADA:TESTUSD'
const ADA_TID = 'BITFINEX:tTESTADA:TESTUSD'
const BTC = 'tTESTBTC:TESTUSD'
const BTC_TID = 'BITFINEX:tTESTBTC:TESTUSD'

// Two runtimes, same strategy — both carry the two tickers (mirrors the fixtures).
const mkRuntime = (id, over = {}) => ({
  runtime_id: id, strategy: 'ema_regime_breakout_v8', mode: id === DEFAULT_ID ? 'live' : 'shadow_live',
  state: 'Ready', allocation_strategy_status: 'active',
  runtime_control_available: true,
  ticker_allocations: [{ ticker_id: ADA_TID }, { ticker_id: BTC_TID }],
  ticker_orders: [{ ticker_id: ADA_TID }, { ticker_id: BTC_TID }],
  ...over,
})

// ADA overlays: one of each kind + a manual control-audit row (kind decision but
// source strategy_control_audit → must plot as a distinct `control` layer).
const OV_ADA = [
  { timestamp_ms: 1000, kind: 'decision', source: 'strategy_decision_audit', symbol: ADA, label: 'd' },
  { timestamp_ms: 2000, kind: 'fill', source: 'strategy_order_journal', symbol: ADA, label: 'f' },
  { timestamp_ms: 3000, kind: 'order', source: 'strategy_runtime_snapshot', symbol: ADA, label: 'o' },
  { timestamp_ms: 4000, kind: 'allocation', source: 'strategy_runtime_snapshot', symbol: ADA, label: 'a' },
  { timestamp_ms: 5000, kind: 'decision', source: 'strategy_control_audit', symbol: ADA, label: 'ctrl' },
]
// Uniform OHLC so the anchored y is deterministic: high=12 (above), low=8 (below).
const CANDLES = [1000, 2000, 3000, 4000, 5000].map((t) => [t, 10, 12, 8, 11, 100])

function mkCtx() {
  const ctx = {
    strategy: {
      runtimes: [], selectedRuntimeId: DEFAULT_ID, decisions: [], overlays: {},
      streaming: false, loading: false, error: null,
      operations: {
        events: [], lifecycleIntervals: [], projectionRevision: null,
        nextCursor: null, resumeCursor: null, loading: false, error: null, live: false,
      },
      overlayVisibility: {
        decision: true, fill: true, order: true, allocation: true, control: true, lifecycle: true,
      },
      money: { data: null, loading: false, error: null },
    },
    _strategySub: null,
    _strategyOperationsSub: null,
    _strategyLastSeq: -Infinity,
    corkyCurrent: { venue: 'bitfinex', symbol: ADA, timeframe: '1m' },
    chart: {
      data: { onchart: [], offchart: [], chart: { data: CANDLES.slice() } },
      add(s, o) { this.data[s].push(o) }, update_ids() {}, touchData() {},
    },
    strategyFeed: {
      streamingSupported: true,
      listRuntimes: vi.fn(async () => [mkRuntime(DEFAULT_ID), mkRuntime(OTHER_ID)]),
      getRuntime: vi.fn(async (id) => mkRuntime(id)),
      getTicker: vi.fn(async (id, tid) => ({ ticker_id: tid, symbol: tid.split(':').slice(1).join(':') })),
      listDecisions: vi.fn(async (id, opts) => [{ ticker_id: opts.ticker_id, symbol: opts.ticker_id.split(':').slice(1).join(':'), decision_ts_ms: 1000, outcome: 'ok' }]),
      listOperations: vi.fn(async (id, opts) => ({
        runtime_id: id, projection_revision: 'rev-1', events: [], lifecycle_intervals: [],
        next_cursor: null, resume_cursor: 'resume-1', opts,
      })),
      getMoney: vi.fn(async (id) => ({
        runtime_id: id, generated_at_ms: 5000, projection_revision: 'money-rev',
        authority_scope: 'wallet_local', totals: { observed_balance: '10000.0000000000000000001' },
        wallets: [], ticker_allocations: [], funding: [],
      })),
      getChartOverlays: vi.fn(async (id, tid) => (tid === ADA_TID ? OV_ADA.slice() : [])),
      subscribeRuntime: vi.fn((opts, handlers) => {
        ctx._subHandlers = handlers; ctx._subArgs = opts
        return { subscription_id: opts.subscription_id, args: opts }
      }),
      subscribeOperations: vi.fn((opts, handlers) => {
        ctx._opsHandlers = handlers; ctx._opsArgs = opts
        return { subscription_id: opts.subscription_id, args: opts }
      }),
      unsubscribe: vi.fn(),
      destroy: vi.fn(),
    },
  }
  for (const m of ['strategyOpen', '_strategyLoadRuntime', 'strategySelectRuntime', 'strategyRefresh',
    '_strategySubscribe', '_strategyStopSubscribe', '_strategyApplyUpdate', '_strategyUpsertRuntimes',
    '_strategyResetOperations', '_strategyApplyOperationsPage', 'strategyLoadMoreOperations',
    '_strategyLoadChartOverlays', 'strategyToggleOverlay',
    '_removeStrategyOverlays', '_strategyCandlePriceAt', 'syncStrategyOverlays', '_strategyErr',
    '_strategyDefaultRuntimeId', '_strategyTickerIds', '_loadedCandleRange']) {
    ctx[m] = M[m]
  }
  return ctx
}

const stratOv = (ctx) => ctx.chart.data.onchart.filter((o) => o.settings && o.settings.$strategyOverlay)
const byName = (ctx, name) => ctx.chart.data.onchart.find((o) => o.name === name)
const flush = () => new Promise((r) => setTimeout(r, 0))

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('strategyOpen', () => {
  test('lists runtimes, defaults the selection, loads detail, subscribes', async () => {
    await ctx.strategyOpen()
    expect(ctx.strategy.runtimes.map((r) => r.runtime_id)).toEqual([DEFAULT_ID, OTHER_ID])
    expect(ctx.strategy.selectedRuntimeId).toBe(DEFAULT_ID)
    // Overlay read is scoped to the ACTUAL chart ticker/timeframe/loaded window.
    expect(ctx.strategyFeed.getChartOverlays).toHaveBeenCalledWith(DEFAULT_ID, ADA_TID, {
      timeframe: '1m', start_ms: 1000, end_ms: 5000,
    })
    expect(ctx.strategyFeed.getChartOverlays).toHaveBeenCalledTimes(1)
    // Decisions from both tickers merged.
    expect(ctx.strategy.decisions).toHaveLength(2)
    expect(ctx.strategy.overlays[ADA_TID]).toHaveLength(5)
    expect(ctx.strategyFeed.listOperations).toHaveBeenCalledWith(DEFAULT_ID, { limit: 100 })
    expect(ctx.strategy.operations.resumeCursor).toBe('resume-1')
    expect(ctx.strategyFeed.getMoney).toHaveBeenCalledWith(DEFAULT_ID)
    expect(ctx.strategy.money.data.totals.observed_balance).toBe('10000.0000000000000000001')
    // Live subscription started, scoped to the default live runtime.
    expect(ctx.strategyFeed.subscribeRuntime).toHaveBeenCalled()
    expect(ctx._subArgs).toMatchObject({ subscription_id: 'strategy-runtime', runtime_id: DEFAULT_ID })
    expect(ctx._opsArgs).toMatchObject({ subscription_id: 'strategy-operations', runtime_id: DEFAULT_ID, cursor: 'resume-1' })
    expect(ctx.strategy.streaming).toBe(true)
    expect(ctx.strategy.loading).toBe(false)
  })

  test('falls back to the first runtime when the default is absent', async () => {
    ctx.strategyFeed.listRuntimes = vi.fn(async () => [mkRuntime(OTHER_ID)])
    await ctx.strategyOpen()
    expect(ctx.strategy.selectedRuntimeId).toBe(OTHER_ID)
    expect(ctx._subArgs.runtime_id).toBe(OTHER_ID)
  })

  test('a read failure surfaces a clean error, not a hang', async () => {
    ctx.strategyFeed.listRuntimes = vi.fn(async () => { throw new Error('socket closed') })
    await ctx.strategyOpen()
    expect(ctx.strategy.error).toBe('socket closed')
    expect(ctx.strategy.loading).toBe(false)
  })

  test('does not double-subscribe on refresh', async () => {
    await ctx.strategyOpen()
    await ctx.strategyRefresh()
    expect(ctx.strategyFeed.subscribeRuntime).toHaveBeenCalledTimes(1)
    expect(ctx.strategyFeed.subscribeOperations).toHaveBeenCalledTimes(1)
  })
})

describe('subscription full-replacement apply (by increasing sequence)', () => {
  beforeEach(async () => { await ctx.strategyOpen() })

  test('an in-order update upserts the covered runtime; others stay selectable', () => {
    const updated = mkRuntime(DEFAULT_ID, { state: 'Ready', last_decision_ms: 999 })
    ctx._subHandlers.onData([updated], { sequence: 1 })
    const ids = ctx.strategy.runtimes.map((r) => r.runtime_id)
    expect(ids).toEqual([DEFAULT_ID, OTHER_ID])                       // both still present
    expect(ctx.strategy.runtimes[0].last_decision_ms).toBe(999)       // subscribed row replaced
  })

  test('applies every feed-delivered update — the feed owns the sequence guard, so a post-reconnect low sequence still applies (no App watermark that could freeze live updates)', () => {
    // The FEED drops stale/duplicate sequences and RESETS its watermark on
    // reconnect, so the App keeps no sequence guard of its own. Regression: an
    // App-level watermark left at the pre-disconnect high would silently freeze
    // live updates after any socket drop (the fresh stream restarts at seq 1).
    ctx._subHandlers.onData([mkRuntime(DEFAULT_ID, { last_decision_ms: 5 })])
    expect(ctx.strategy.runtimes[0].last_decision_ms).toBe(5)
    // Simulate the post-reconnect delivery the feed makes after resetting: a
    // fresh full-replacement snapshot. It MUST apply (would freeze under a guard).
    ctx._subHandlers.onData([mkRuntime(DEFAULT_ID, { last_decision_ms: 1 })])
    expect(ctx.strategy.runtimes[0].last_decision_ms).toBe(1)
  })

  test('a full set carrying both runtimes replaces both wholesale', () => {
    ctx._subHandlers.onData([mkRuntime(DEFAULT_ID, { last_decision_ms: 7 }), mkRuntime(OTHER_ID, { last_decision_ms: 8 })], { sequence: 1 })
    expect(ctx.strategy.runtimes.map((r) => r.last_decision_ms)).toEqual([7, 8])
    expect(ctx.strategy.runtimes).toHaveLength(2)
  })

  test('onError drops the live flag but keeps the last-good set', () => {
    ctx._subHandlers.onData([mkRuntime(DEFAULT_ID)], { sequence: 1 })
    ctx._subHandlers.onError(new Error('sub gone'), { lastGood: ctx.strategy.runtimes })
    expect(ctx.strategy.streaming).toBe(false)
    expect(ctx.strategy.runtimes).toHaveLength(2)
  })
})

describe('runtime selection', () => {
  beforeEach(async () => { await ctx.strategyOpen() })

  test('selecting another runtime re-selects + reloads its detail; both stay selectable', async () => {
    ctx.strategyFeed.getRuntime.mockClear()
    ctx.strategySelectRuntime(OTHER_ID)
    expect(ctx.strategy.selectedRuntimeId).toBe(OTHER_ID)
    await flush()
    expect(ctx.strategyFeed.getRuntime).toHaveBeenCalledWith(OTHER_ID)
    expect(ctx.strategy.runtimes.map((r) => r.runtime_id)).toEqual([DEFAULT_ID, OTHER_ID])
    expect(ctx.strategyFeed.unsubscribe).toHaveBeenCalledTimes(2)
    expect(ctx._subArgs.runtime_id).toBe(OTHER_ID)
    expect(ctx._opsArgs.runtime_id).toBe(OTHER_ID)
  })

  test('re-selecting the SAME runtime is a no-op', async () => {
    ctx.strategyFeed.getRuntime.mockClear()
    ctx.strategySelectRuntime(DEFAULT_ID)
    await flush()
    expect(ctx.strategyFeed.getRuntime).not.toHaveBeenCalled()
  })
})

describe('selected-runtime immutable operations', () => {
  beforeEach(async () => { await ctx.strategyOpen() })

  test('merges live pages by event_id and preserves gateway lifecycle intervals', () => {
    ctx._opsHandlers.onData({
      runtime_id: DEFAULT_ID,
      projection_revision: 'rev-2',
      resume_cursor: 'resume-2',
      events: [
        { event_id: 'e1', ts_ms: 2, source: 'order', kind: 'submitted', payload: {} },
        { event_id: 'e2', ts_ms: 3, source: 'order', kind: 'filled', payload: {} },
      ],
      lifecycle_intervals: [{ state: 'degraded', start_ms: 1, source: 'gateway', reason: 'stale auth' }],
    })
    ctx._opsHandlers.onData({
      runtime_id: DEFAULT_ID,
      projection_revision: 'rev-3',
      resume_cursor: 'resume-3',
      events: [{ event_id: 'e2', ts_ms: 3, source: 'order', kind: 'filled', payload: {} }],
      lifecycle_intervals: [{ state: 'degraded', start_ms: 1, source: 'gateway', reason: 'stale auth' }],
    })
    expect(ctx.strategy.operations.events.map((event) => event.event_id)).toEqual(['e2', 'e1'])
    expect(ctx.strategy.operations.lifecycleIntervals).toHaveLength(1)
    expect(ctx.strategy.operations.lifecycleIntervals[0].reason).toBe('stale auth')
    expect(ctx.strategy.operations.projectionRevision).toBe('rev-3')
    expect(ctx.strategy.operations.resumeCursor).toBe('resume-3')
    expect(ctx.strategy.operations.live).toBe(true)
  })

  test('ignores a late page for a previously selected runtime', () => {
    ctx.strategy.selectedRuntimeId = OTHER_ID
    ctx._strategyApplyOperationsPage({
      runtime_id: DEFAULT_ID, projection_revision: 'stale',
      events: [{ event_id: 'wrong', ts_ms: 1, source: 'x', kind: 'x', payload: {} }],
      lifecycle_intervals: [],
    })
    expect(ctx.strategy.operations.events).toHaveLength(0)
  })

  test('loads older operations with the exact opaque next cursor', async () => {
    ctx.strategy.operations.nextCursor = 'opaque-next'
    ctx.strategyFeed.listOperations = vi.fn(async (runtimeId, opts) => ({
      runtime_id: runtimeId, projection_revision: 'rev-old', next_cursor: null,
      events: [{ event_id: 'old', ts_ms: 1, source: 'ledger', kind: 'delta', payload: {} }],
      lifecycle_intervals: [],
      opts,
    }))
    await ctx.strategyLoadMoreOperations()
    expect(ctx.strategyFeed.listOperations).toHaveBeenCalledWith(DEFAULT_ID, {
      limit: 100, cursor: 'opaque-next',
    })
    expect(ctx.strategy.operations.events[0].event_id).toBe('old')
    expect(ctx.strategy.operations.nextCursor).toBeNull()
  })
})

describe('syncStrategyOverlays (on-chart markers)', () => {
  beforeEach(async () => { await ctx.strategyOpen() })

  test('adds one Markers overlay per class (decision/fill/order/allocation/control), anchored to candles', () => {
    ctx.syncStrategyOverlays()
    const ov = stratOv(ctx)
    expect(ov.map((o) => o.name).sort()).toEqual(
      ['Strategy allocation', 'Strategy control', 'Strategy decision', 'Strategy fill', 'Strategy order'])
    expect(ov.every((o) => o.type === 'Markers')).toBe(true)
    // Anchored to the owning candle's high (above) / low (below), label preserved.
    expect(byName(ctx, 'Strategy decision').data).toEqual([[1000, 12, 'd']])
    expect(byName(ctx, 'Strategy fill').data).toEqual([[2000, 8, 'f']])
    expect(byName(ctx, 'Strategy order').data).toEqual([[3000, 12, 'o']])
    expect(byName(ctx, 'Strategy allocation').data).toEqual([[4000, 8, 'a']])
    // The control-audit row plots as its own distinct layer (source, not kind).
    expect(byName(ctx, 'Strategy control').data).toEqual([[5000, 12, 'ctrl']])
    expect(byName(ctx, 'Strategy control').settings.color).toBe('#f5c518')
    expect(byName(ctx, 'Strategy control').settings.$strategyProvenance[0]).toMatchObject({
      source: 'strategy_control_audit', label: 'ctrl',
    })
  })

  test('re-sync replaces (no duplication)', () => {
    ctx.syncStrategyOverlays()
    ctx.syncStrategyOverlays()
    expect(stratOv(ctx)).toHaveLength(5)
  })

  test('no-op for a foreign charted symbol', () => {
    ctx.corkyCurrent = { venue: 'bitfinex', symbol: BTC, timeframe: '1m' }
    ctx.syncStrategyOverlays()
    expect(stratOv(ctx)).toHaveLength(0)
  })

  test('clears the overlays when the strategy set empties', () => {
    ctx.syncStrategyOverlays()
    expect(stratOv(ctx)).toHaveLength(5)
    ctx.strategy.overlays = {}
    ctx.syncStrategyOverlays()
    expect(stratOv(ctx)).toHaveLength(0)
  })

  test('skips markers with no covering candle (clipped to the loaded window)', () => {
    ctx.chart.data.chart.data = [[3000, 10, 12, 8, 11, 100]]   // only one candle
    ctx.syncStrategyOverlays()
    // decision@1000 / fill@2000 are before the first candle → clipped out; the
    // order@3000 rides the sole candle; 4000/5000 are past the loaded window.
    const names = stratOv(ctx).map((o) => o.name)
    expect(names).toEqual(['Strategy order'])
  })

  test('renders published lifecycle intervals as background Zones and can hide each layer', () => {
    ctx.strategy.operations.lifecycleIntervals = [{
      state: 'degraded', start_ms: 1500, end_ms: 4500,
      source: 'gateway', reason: 'auth reconciliation stale',
    }]
    ctx.syncStrategyOverlays()
    const lifecycle = byName(ctx, 'Strategy lifecycle')
    expect(lifecycle.type).toBe('Zones')
    expect(lifecycle.data).toEqual([[1500, 8, 12, 4500, 'rgba(229,65,80,0.10)']])
    expect(lifecycle.settings.$strategyProvenance[0].reason).toBe('auth reconciliation stale')
    ctx.strategyToggleOverlay({ kind: 'fill', enabled: false })
    expect(byName(ctx, 'Strategy fill')).toBeUndefined()
    expect(byName(ctx, 'Strategy lifecycle')).toBeTruthy()
    ctx.strategyToggleOverlay({ kind: 'lifecycle', enabled: false })
    expect(byName(ctx, 'Strategy lifecycle')).toBeUndefined()
  })
})

describe('_strategyTickerIds', () => {
  test('dedupes allocations + orders, preserving order', () => {
    expect(M._strategyTickerIds(mkRuntime(DEFAULT_ID))).toEqual([ADA_TID, BTC_TID])
  })
  test('empty runtime → no tickers', () => {
    expect(M._strategyTickerIds({})).toEqual([])
  })
})
