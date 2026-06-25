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
}
const RUN = { run_id: 'r1', strategy: 'ema', venue: 'BITFINEX', symbols: ['tBTCUSD'], trade_timeframe: '1h', status: 'completed', metrics: {} }

function mkCtx() {
  const ctx = {
    backtests: { strategies: [], runs: [], filters: { strategy: '', symbol: '', status: '' }, selectedRun: null, detail: {}, loading: false, error: null },
    corkyCurrent: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' },
    chart: { data: { onchart: [], offchart: [] }, add(s, o) { this.data[s].push(o) }, update_ids() {}, touchData() {} },
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
    'btSelectRun', '_btSubscribeProgress', '_btStopProgress', 'btPlotRun', 'btSelectTrade',
    '_btSpan', '_tfToMs', '_removeBacktestOverlays', 'syncBacktestOverlays', '_btErr', '_btSetDetail']) {
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
})

describe('btPlotRun + syncBacktestOverlays', () => {
  test('fetches the report, sets _btPlot, navigates with a start_end window', async () => {
    await ctx.btPlotRun(RUN)
    expect(ctx._btPlot).toMatchObject({ runId: 'r1', symbol: 'tBTCUSD', timeframe: '1h' })
    expect(ctx.backtests.detail.report).toBe(REPORT)
    const [opts] = ctx.corkySelect.mock.calls[0]
    expect(opts).toMatchObject({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' })
    expect(opts.range.type).toBe('start_end')
    expect(ctx._corkyPendingRange).toEqual({ start: 0, end: 7200000 })
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
    ctx.corkyCurrent = { venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '1h' }
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
  test('navigates centered on the trade (±200 bars)', async () => {
    ctx._btPlot = { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', report: REPORT }
    await ctx.btSelectTrade(REPORT.trades[0])
    const [opts] = ctx.corkySelect.mock.calls[0]
    const H = 3600000
    expect(opts.range).toEqual({ type: 'start_end', start_ms: 3600000 - 200 * H, end_ms: 3600000 + 200 * H })
  })
})
