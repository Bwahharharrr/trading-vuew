// @vitest-environment jsdom
//
// App._corkyHistoryLoader — the gateway lazy-history loader the chart calls when
// the user pans LEFT past the earliest loaded candle. Exercised against a fake
// `this` (no mount), the same technique as the other App handler tests.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods
const H = 3600000

function mkCtx(rows = [[1000, 1, 2, 0.5, 1.5, 10]]) {
  const ctx = {
    corkyCurrent: { venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h' },
    _corkyGen: 1,
    corkyFeed: { fetchHistory: vi.fn(async () => rows) },
  }
  ctx._corkyHistoryLoader = M._corkyHistoryLoader
  ctx._tfToMs = M._tfToMs
  return ctx
}

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('_corkyHistoryLoader', () => {
  test('fetches the panned older window and returns the rows', async () => {
    const out = await ctx._corkyHistoryLoader([5000 * 1, 9000 * 1])   // small window (< cap)
    expect(out).toEqual([[1000, 1, 2, 0.5, 1.5, 10]])
    expect(ctx.corkyFeed.fetchHistory).toHaveBeenCalledWith(
      expect.objectContaining({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h', start_ms: 5000, end_ms: 9000 }))
  })

  test('caps the backfill window to 1000 bars for a far pan', async () => {
    const end = 100000 * H
    await ctx._corkyHistoryLoader([0, end])           // would be 100000 bars → clamp to last 1000
    const [opts] = ctx.corkyFeed.fetchHistory.mock.calls[0]
    expect(opts.start_ms).toBe(end - 1000 * H)        // clamped
    expect(opts.end_ms).toBe(end)
  })

  test('drops the result if the stream switched mid-fetch (staleness)', async () => {
    ctx.corkyFeed.fetchHistory = vi.fn(async () => { ctx._corkyGen = 2; return [[1000, 1, 2, 0.5, 1.5, 10]] })
    const out = await ctx._corkyHistoryLoader([0, 9000])
    expect(out).toEqual([])                            // gen changed → discard
  })

  test('no-ops without a charted stream or with a non-positive window', async () => {
    ctx.corkyCurrent = null
    expect(await ctx._corkyHistoryLoader([0, 9000])).toEqual([])
    ctx.corkyCurrent = { venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h' }
    expect(await ctx._corkyHistoryLoader([9000, 9000])).toEqual([])
    expect(ctx.corkyFeed.fetchHistory).not.toHaveBeenCalled()
  })
})

describe('_corkyHistoryLoader — backtest overlay extension', () => {
  function btCtx() {
    const c = mkCtx([[1000, 1, 2, 0.5, 1.5, 10]])
    c._btPlot = {
      runId: 'r1', venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h',
      report: {
        equity_curve: [{ timestamp_ms: 9000, equity: '110' }],
        trades: [{ timestamp_ms: 9000, side: 'Sell', price: '41000' }],
        series_descriptors: [{ id: 'backtest_equity' }],
      },
    }
    c.backtestsFeed = {
      getReportOverlays: vi.fn(async () => ({
        equity_curve: [{ timestamp_ms: 3000, equity: '100' }, { timestamp_ms: 9000, equity: '110' }],
        trades: [{ timestamp_ms: 3000, side: 'Buy', price: '40000' }],
      })),
    }
    c.syncBacktestOverlays = vi.fn()
    c._btMergeReportWindow = M._btMergeReportWindow
    return c
  }

  test('fetches the report window, merges it into _btPlot.report, re-syncs overlays', async () => {
    const c = btCtx()
    const rows = await c._corkyHistoryLoader([2000, 9000])
    expect(rows).toEqual([[1000, 1, 2, 0.5, 1.5, 10]])               // candles still returned
    expect(c.backtestsFeed.getReportOverlays).toHaveBeenCalledWith(
      expect.objectContaining({ run_id: 'r1', start_ms: 2000, end_ms: 9000, max_points: 2000 }))
    // older equity point (3000) merged in ahead of the existing one (9000)
    expect(c._btPlot.report.equity_curve.map((p) => p.timestamp_ms)).toEqual([3000, 9000])
    expect(c._btPlot.report.trades.map((t) => t.timestamp_ms)).toEqual([3000, 9000])
    expect(c._btPlot.report.series_descriptors).toBeTruthy()         // descriptors preserved
    await new Promise((r) => setTimeout(r, 0))                        // let the post-merge re-sync fire
    expect(c.syncBacktestOverlays).toHaveBeenCalled()
  })

  test('does not fetch the report when no backtest is plotted for this stream', async () => {
    const c = btCtx()
    c._btPlot.symbol = 'tETHUSD'                                      // different symbol → not active
    await c._corkyHistoryLoader([2000, 9000])
    expect(c.backtestsFeed.getReportOverlays).not.toHaveBeenCalled()
    expect(c.syncBacktestOverlays).not.toHaveBeenCalled()
  })

  test('_btMergeReportWindow dedupes by timestamp (newer wins) and sorts ascending', () => {
    const out = M._btMergeReportWindow(
      { equity_curve: [{ timestamp_ms: 9000, equity: '110' }], trades: [], foo: 'keep' },
      { equity_curve: [{ timestamp_ms: 3000, equity: '100' }, { timestamp_ms: 9000, equity: '999' }], trades: [] })
    // 3000 from the added window; 9000 replaced by the added value (newer wins)
    expect(out.equity_curve.map((p) => [p.timestamp_ms, p.equity])).toEqual([[3000, '100'], [9000, '999']])
    expect(out.foo).toBe('keep')   // descriptors / period_returns preserved from base
  })
})
