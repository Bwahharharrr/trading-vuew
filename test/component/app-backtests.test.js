// @vitest-environment jsdom
//
// App.vue backtest handlers + chart integration, via App.methods bound to a fake
// `this` (no mount) — same technique as search-run / search-signal-marker tests.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods

const REPORT = {
  type: 'backtest_report_overlays', run_id: 'r1', venue: 'BITFINEX', trade_timeframe: '1h',
  trades: [
    { symbol: 'tBTCUSD', timestamp_ms: 3600000, side: 'Buy', quantity: '0.25', price: '40000' },
    { symbol: 'tBTCUSD', timestamp_ms: 7200000, side: 'Sell', quantity: '0.25', price: '41000' },
  ],
  price_levels: [],
  equity_curve: [
    { timestamp_ms: 0, equity: '10000', cash: '10000', position_quantity: '0', drawdown: '0' },
    { timestamp_ms: 7200000, equity: '10250', cash: '10250', position_quantity: '0', drawdown: '5.5' },
  ],
  period_returns: [],
  series_descriptors: [
    { id: 'backtest_equity', display_name: 'Equity', kind: 'line', fields: ['equity'], target: { surface: 'pane', pane: 'Backtest' }, style: {}, visible_by_default: true },
    { id: 'backtest_drawdown', display_name: 'Drawdown', kind: 'histogram', fields: ['drawdown'], target: { surface: 'pane', pane: 'Backtest DD' }, style: {}, visible_by_default: true },
  ],
  metric_descriptors: [
    { name: 'ending_equity', unit: 'currency', precision: 2, description: 'Final account equity' },
  ],
}
const RUN = {
  run_id: 'r1', strategy: 'ema', venue: 'BITFINEX', symbols: ['tBTCUSD'], trade_timeframe: '1h',
  status: 'completed', started_at_ms: 3600000, completed_at_ms: 7200000, metrics: { ending_equity: '10250' },
}

function mkCtx() {
  const ctx = {
    backtests: { strategies: [], runs: [], filters: { strategy: '', symbol: '', status: '' }, selectedRun: null, detail: {}, loading: false, error: null },
    // Discovery reports the venue LOWERCASE (run.venue is UPPERCASE) — the
    // canonical-venue fix must reconcile them so enabled indicators survive.
    corkyCurrent: { venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h' },
    corkyStates: [{ venue: 'bitfinex', symbol: 'tBTCUSD', available_timeframes: ['1h'] }],
    $refs: { tradingVue: { setRange: vi.fn() } },
    chart: { data: { onchart: [], offchart: [], chart: { data: [] } }, add(s, o) { this.data[s].push(o) }, update_ids() {}, touchData() {} },
    backtestsFeed: {
      streamingSupported: true,
      listStrategies: vi.fn(async () => [{ name: 'ema', display_name: 'EMA' }]),
      getStrategy: vi.fn(async (n) => ({ name: n, parameters: [{ name: 'p' }] })),
      listRuns: vi.fn(async () => [RUN]),
      getProgress: vi.fn(async () => [{ kind: 'completed', completed_steps: 1, total_steps: 1 }]),
      getReportOverlays: vi.fn(async () => REPORT),
      subscribeProgress: vi.fn(() => ({ subscription_id: 'backtest-progress' })),
      unsubscribe: vi.fn(),
    },
    corkySelect: vi.fn(),
    _ensureCandleState: vi.fn(async () => true),
  }
  for (const m of ['btLoadStrategies', 'btUpdateFilter', 'btInspectStrategy', 'btListRuns',
    'btSelectRun', 'btCloseDetail', '_btLoadOverview', '_btSubscribeProgress', '_btStopProgress', 'btPlotRun', 'btSelectTrade',
    '_btPlotWindow', '_tfToMs', '_removeBacktestOverlays', 'syncBacktestOverlays', '_btErr', '_btSetDetail',
    '_canonicalVenue', '_loadedCandleRange']) {
    ctx[m] = M[m]
  }
  return ctx
}

const offSeries = (ctx) => ctx.chart.data.offchart.filter((o) => o.settings && o.settings.$backtestOverlay)
const tradesOv = (ctx) => ctx.chart.data.onchart.find((o) => o.settings && o.settings.$backtestOverlay)

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('strategy + run loading', () => {
  test('btLoadStrategies fills the catalog', async () => {
    await ctx.btLoadStrategies()
    expect(ctx.backtests.strategies).toHaveLength(1)
    expect(ctx.backtests.loading).toBe(false)
  })
  test('btListRuns passes only set filters', async () => {
    ctx.backtests.filters = { strategy: 'ema', symbol: ' tBTCUSD ', status: '' }
    await ctx.btListRuns()
    expect(ctx.backtestsFeed.listRuns).toHaveBeenCalledWith({ strategy: 'ema', symbol: 'tBTCUSD' })
    expect(ctx.backtests.runs).toHaveLength(1)
  })
  test('btInspectStrategy merges the fuller descriptor', async () => {
    ctx.backtests.strategies = [{ name: 'ema', display_name: 'EMA' }]
    await ctx.btInspectStrategy('ema')
    expect(ctx.backtests.strategies[0].parameters).toHaveLength(1)
  })
})

describe('auto-load runs on opening the Backtests tab', () => {
  function tabCtx() {
    const c = {
      positionsActiveTab: 'open', backtests: { runs: [], loading: false },
      backtestsFeed: { listRuns: vi.fn(async () => []) },
      _ensureHistoryLoaded: vi.fn(), _positionsSyncStreams: vi.fn(), saveStateToStorage: vi.fn(),
      btListRuns: vi.fn(),
    }
    c.setPositionsTab = M.setPositionsTab
    return c
  }
  test('switching to backtests loads all runs once', () => {
    const c = tabCtx()
    c.setPositionsTab('backtests')
    expect(c.btListRuns).toHaveBeenCalledTimes(1)
  })
  test('does not reload if runs already present', () => {
    const c = tabCtx(); c.backtests.runs = [{ run_id: 'r1' }]
    c.setPositionsTab('backtests')
    expect(c.btListRuns).not.toHaveBeenCalled()
  })
  test('other tabs do not trigger a run load', () => {
    const c = tabCtx()
    c.setPositionsTab('open')
    expect(c.btListRuns).not.toHaveBeenCalled()
  })
})

describe('btSelectRun progress', () => {
  test('completed run → one-shot progress, no live subscribe', async () => {
    await ctx.btSelectRun(RUN)
    expect(ctx.backtests.detail.progress).toHaveLength(1)
    expect(ctx.backtestsFeed.subscribeProgress).not.toHaveBeenCalled()
  })
  test('running run → subscribes for live progress', async () => {
    await ctx.btSelectRun({ ...RUN, status: 'running' })
    expect(ctx.backtestsFeed.subscribeProgress).toHaveBeenCalled()
  })
  test('selecting a run opens its Run-Details tab', async () => {
    await ctx.btSelectRun(RUN)
    expect(ctx.backtests.selectedRun).toBe(RUN)
    expect(ctx.positionsActiveTab).toBe('bt-detail')
  })
})

describe('btCloseDetail', () => {
  test('clears the selection + returns to the runs list', () => {
    ctx.backtests.selectedRun = RUN
    ctx.positionsActiveTab = 'bt-detail'
    ctx.btCloseDetail()
    expect(ctx.backtests.selectedRun).toBe(null)
    expect(ctx.positionsActiveTab).toBe('backtests')
  })
  test('leaves the active tab alone when it is not the detail tab', () => {
    ctx.backtests.selectedRun = RUN
    ctx.positionsActiveTab = 'open'
    ctx.btCloseDetail()
    expect(ctx.backtests.selectedRun).toBe(null)
    expect(ctx.positionsActiveTab).toBe('open')
  })
})

describe('btPlotRun + syncBacktestOverlays', () => {
  beforeEach(() => { ctx.backtests.selectedRun = RUN })   // a run is selected before plotting
  test('fetches a WINDOWED report, sets _btPlot, navigates with the CANONICAL venue', async () => {
    await ctx.btPlotRun(RUN)   // RUN.venue is 'BITFINEX'
    expect(ctx._btPlot).toMatchObject({ runId: 'r1', venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h' })
    expect(ctx._btPlot.report).toBe(REPORT)   // windowed report lives on _btPlot (chart), not detail
    // fetched WINDOWED + downsampled (not the whole run)
    expect(ctx.backtestsFeed.getReportOverlays).toHaveBeenCalledWith(
      { run_id: 'r1', start_ms: 3600000, end_ms: 7200000, max_points: 2000 })
    const [opts] = ctx.corkySelect.mock.calls[0]
    expect(opts).toMatchObject({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h' })  // canonical → indicators persist
    expect(opts.range.type).toBe('start_end')
    expect(ctx._corkyPendingRange).toEqual({ start: 3600000, end: 7200000 })   // short run → whole span
  })

  test('clamps the window for a multi-year run to the last 1000 bars', async () => {
    const H = 3600000
    const longRun = { ...RUN, started_at_ms: 0, completed_at_ms: 5000 * H }   // 5000 bars > 1000
    ctx.backtests.selectedRun = longRun
    await ctx.btPlotRun(longRun)
    expect(ctx._corkyPendingRange).toEqual({ start: 5000 * H - 1000 * H, end: 5000 * H })
    // and the windowed report request used the clamped bounds
    expect(ctx.backtestsFeed.getReportOverlays).toHaveBeenCalledWith(
      { run_id: 'r1', start_ms: 4000 * H, end_ms: 5000 * H, max_points: 2000 })
  })

  test('syncBacktestOverlays adds descriptor-driven offchart series + trade markers', async () => {
    await ctx.btPlotRun(RUN)
    ctx.syncBacktestOverlays()
    const series = offSeries(ctx)
    expect(series.map((o) => o.name)).toEqual(['Equity', 'Drawdown'])
    expect(series[0].type).toBe('Spline')
    expect(series[1].type).toBe('Histogram')
    expect(series[0].data).toEqual([[0, 10000], [7200000, 10250]])
    const tr = tradesOv(ctx)
    expect(tr.type).toBe('Trades')
    expect(tr.data).toEqual([[3600000, 1, 40000, 'Buy 0.25'], [7200000, 0, 41000, 'Sell 0.25']])
    expect(ctx.backtests.detail.plottedRunId).toBe('r1')
  })

  test('syncBacktestOverlays is a no-op for a foreign charted symbol', async () => {
    await ctx.btPlotRun(RUN)
    ctx.corkyCurrent = { venue: 'bitfinex', symbol: 'tETHUSD', timeframe: '1h' }
    ctx.syncBacktestOverlays()
    expect(offSeries(ctx)).toHaveLength(0)
  })

  test('re-sync replaces (no duplication)', async () => {
    await ctx.btPlotRun(RUN)
    ctx.syncBacktestOverlays()
    ctx.syncBacktestOverlays()
    expect(offSeries(ctx)).toHaveLength(2)
  })
})

describe('btSelectTrade', () => {
  test('loads a ±200-bar window when the trade is OUTSIDE the loaded candles', async () => {
    ctx._btPlot = { venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h', report: REPORT }
    // no candles loaded → can't jump instantly → loads a window
    await ctx.btSelectTrade(REPORT.trades[0])
    const [opts] = ctx.corkySelect.mock.calls[0]
    const H = 3600000
    expect(opts.range).toEqual({ type: 'start_end', start_ms: 3600000 - 200 * H, end_ms: 3600000 + 200 * H })
  })

  test('INSTANT: re-ranges (no reload) when the trade is within the loaded candles', async () => {
    ctx._btPlot = { venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h', report: REPORT }
    // candles loaded spanning the trade ts (3600000)
    ctx.chart.data.chart.data = [[0, 1, 1, 1, 1, 1], [3600000, 1, 1, 1, 1, 1], [7200000, 1, 1, 1, 1, 1]]
    await ctx.btSelectTrade(REPORT.trades[0])
    expect(ctx.corkySelect).not.toHaveBeenCalled()        // no reload
    const H = 3600000
    expect(ctx.$refs.tradingVue.setRange).toHaveBeenCalledWith(3600000 - 60 * H, 3600000 + 60 * H)
  })
})
