// @vitest-environment jsdom
//
// Clicking a position: fetch the audit FIRST, derive the chart window from the
// actual TRADE/fee timestamps (NOT the row's opened/closed, which can be 0/
// missing), subscribe with a range covering it, then plot. Exercised against
// App's own methods with fakes (no full mount).
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

// 2 trades, Dec-2024-ish (real timestamps), with a ledger funding fee.
const auditBundle = {
  position: { opened_at_ms: 1730683960000, closed_at_ms: 1733964907000, updated_at_ms: 1733964907000 },
  trades: [
    { execution_timestamp_ms: 1730683960181, amount: '0.2', price: '69012', fee: '-1.4', fee_currency: 'USD' },
    { execution_timestamp_ms: 1733964906796, amount: '-0.2', price: '100660', fee: '-50.33', fee_currency: 'USD' },
  ],
  fees: [{ fee_id: 1, timestamp_ms: 1733964906000, currency: 'USD', amount: '-0.02', balance: '0', kind: 'margin_funding', description: 'fund', source: 'x' }],
}
const TRADE_MIN = 1730683960181
const TRADE_MAX = 1733964906796

const M = App.methods
const pos = {
  venue: 'BITFINEX', account_id: 'primary-account', symbol: 'tTESTBTC:TESTUSD',
  position_id: 178155229, opened_at_ms: 1730683960000, closed_at_ms: 1733964907000,
}

function mkCtx() {
  const ctx = {
    corkyStates: [{ venue: 'BITFINEX', symbol: 'tTESTBTC:TESTUSD', available_timeframes: ['1m', '1h', '1D'] }],
    corkyCurrent: { timeframe: '1h', symbol: 'tTESTBTC:TESTUSD' },
    positionsFeed: { streamingSupported: true, getAudit: vi.fn(async () => auditBundle), subscribeAudit: vi.fn(), unsubscribe: vi.fn() },
    chart: { data: { onchart: [], offchart: [], chart: { data: [] } }, add(s, o) { this.data[s].push(o) }, update_ids() {}, touchData() {} },
    corkySelect: vi.fn(),
    corkyDiscover: vi.fn(),
    $nextTick: (fn) => fn && fn(),
    $refs: { tradingVue: { refreshOffchartOverlays: vi.fn(), setRange: vi.fn(), resetChart: vi.fn() } },
  }
  for (const m of ['onPositionSelect', '_plotWindow', '_startPositionAuditStream', '_stopPositionAuditStream',
    'syncPositionOverlays', '_removePositionOverlays', '_computePositionSeries']) {
    ctx[m] = M[m]
  }
  return ctx
}

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('onPositionSelect → audit-first, trade-derived window', () => {
  test('fetches the audit before subscribing, then subscribes with the chosen tf', async () => {
    await ctx.onPositionSelect(pos)
    expect(ctx.positionsFeed.getAudit).toHaveBeenCalledWith({
      venue: 'BITFINEX', account_id: 'primary-account', symbol: 'tTESTBTC:TESTUSD', position_id: 178155229,
    })
    expect(ctx.corkySelect).toHaveBeenCalledTimes(1)
    const arg = ctx.corkySelect.mock.calls[0][0]
    expect(arg.symbol).toBe('tTESTBTC:TESTUSD')
    expect(arg.timeframe).toBe('1h')          // current tf kept (offered)
  })

  test('subscribes with a start_end range that covers the TRADE timestamps', async () => {
    await ctx.onPositionSelect(pos)
    const arg = ctx.corkySelect.mock.calls[0][0]
    expect(arg.range.type).toBe('start_end')
    expect(arg.range.start_ms).toBeLessThan(TRADE_MIN)
    expect(arg.range.end_ms).toBeGreaterThan(TRADE_MAX)
  })

  test('sets a provisional plot synchronously, fills window + series after the audit', async () => {
    const p = ctx.onPositionSelect(pos)
    expect(ctx.positionPlot).toBeTruthy()
    expect(ctx.positionPlot.window).toBeNull()   // provisional, pre-audit
    await p
    expect(ctx.positionPlot.window.start).toBeLessThanOrEqual(TRADE_MIN)
    expect(ctx.positionPlot.window.end).toBeGreaterThanOrEqual(TRADE_MAX)
    expect(ctx.positionPlot.series.markers).toHaveLength(2)
  })

  test('plots the trades markers (default toggle) on the price pane', async () => {
    await ctx.onPositionSelect(pos)
    const trades = ctx.chart.data.onchart.find((o) => o.settings && o.settings.$positionOverlay)
    expect(trades.type).toBe('Trades')
  })

  test('REGRESSION: opened_at_ms=0 (open position) → window from trades, NOT 1970→now', async () => {
    const openZero = { ...pos, opened_at_ms: 0, closed_at_ms: null }
    await ctx.onPositionSelect(openZero)
    const arg = ctx.corkySelect.mock.calls[0][0]
    // window must hug the Dec-2024 trades, never start at the epoch
    expect(ctx.positionPlot.window.start).toBeGreaterThan(1700000000000)
    expect(arg.range.start_ms).toBeGreaterThan(1700000000000)
    expect(arg.range.start_ms).toBeLessThan(TRADE_MIN)
    expect(arg.range.end_ms).toBeGreaterThan(TRADE_MAX)
    expect(ctx.positionsFeed.subscribeAudit).toHaveBeenCalledTimes(1)   // open → live stream
  })

  test('_plotWindow enforces a minimum span for a single-trade position', () => {
    const single = { trades: [{ execution_timestamp_ms: 1733964906796, amount: '0.1' }] }
    const w = ctx._plotWindow({ closed_at_ms: null }, single)
    expect(w.end - w.start).toBeGreaterThanOrEqual(12 * 60 * 60 * 1000)
    expect((w.start + w.end) / 2).toBe(1733964906796)   // centred on the trade
  })

  test('a CLOSED position does not open a live audit stream', async () => {
    await ctx.onPositionSelect(pos)
    expect(ctx.positionsFeed.subscribeAudit).not.toHaveBeenCalled()
  })
})
