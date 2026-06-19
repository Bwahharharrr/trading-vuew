// @vitest-environment jsdom
//
// Phase C: clicking a position subscribes with a candle range covering the
// position window, then (once the audit resolves) derives + plots the series.
// Exercised against App's own methods with fakes (no full mount).
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const auditBundle = {
  position: { opened_at_ms: 1730683960000, closed_at_ms: 1733964907000, updated_at_ms: 1733964907000 },
  trades: [
    { execution_timestamp_ms: 1730683960181, amount: '0.01015975', price: '69012', fee: '-1.4', fee_currency: 'TESTUSD' },
    { execution_timestamp_ms: 1733964906796, amount: '-0.25', price: '100660', fee: '-50.33', fee_currency: 'TESTUSD' },
  ],
}

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
    openAudit: vi.fn(),
    $nextTick: (fn) => fn && fn(),
    $refs: { tradingVue: { refreshOffchartOverlays: vi.fn(), setRange: vi.fn(), resetChart: vi.fn() } },
  }
  for (const m of ['onPositionSelect', '_loadPositionAudit', '_startPositionAuditStream', '_stopPositionAuditStream',
    'syncPositionOverlays', '_removePositionOverlays', '_computePositionSeries']) {
    ctx[m] = M[m]
  }
  return ctx
}

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('onPositionSelect → ranged subscribe + plot', () => {
  test('subscribes with a start_end range covering the position window + chosen tf', async () => {
    await ctx.onPositionSelect(pos)
    expect(ctx.corkySelect).toHaveBeenCalledTimes(1)
    const arg = ctx.corkySelect.mock.calls[0][0]
    expect(arg.venue).toBe('BITFINEX')
    expect(arg.symbol).toBe('tTESTBTC:TESTUSD')
    expect(arg.timeframe).toBe('1h')          // current tf kept (offered)
    expect(arg.range.type).toBe('start_end')
    // range padded around [opened, closed]
    expect(arg.range.start_ms).toBeLessThan(pos.opened_at_ms)
    expect(arg.range.end_ms).toBeGreaterThan(pos.closed_at_ms)
  })

  test('sets positionPlot window + default toggles before the audit resolves', async () => {
    const p = ctx.onPositionSelect(pos)
    expect(ctx.positionPlot).toBeTruthy()
    expect(ctx.positionPlot.symbol).toBe('tTESTBTC:TESTUSD')
    expect(ctx.positionPlot.window).toEqual({ start: 1730683960000, end: 1733964907000 })
    expect(ctx.positionPlot.toggles).toEqual({ trades: true, size: false, hist: false, fees: false })
    await p
  })

  test('after the audit resolves, derives series and plots the trades markers', async () => {
    await ctx.onPositionSelect(pos)
    expect(ctx.positionsFeed.getAudit).toHaveBeenCalledWith({
      venue: 'BITFINEX', account_id: 'primary-account', symbol: 'tTESTBTC:TESTUSD', position_id: 178155229,
    })
    expect(ctx.positionPlot.series.markers).toHaveLength(2)
    // trades toggle is on by default → markers overlay present on the price pane
    const trades = ctx.chart.data.onchart.find((o) => o.settings && o.settings.$positionOverlay)
    expect(trades.type).toBe('Trades')
  })

  test('a CLOSED position does not open a live audit stream', async () => {
    await ctx.onPositionSelect(pos)
    expect(ctx.positionsFeed.subscribeAudit).not.toHaveBeenCalled()
  })

  test('an OPEN position opens a live audit stream and ranges to now', async () => {
    const openPos = { ...pos, closed_at_ms: null }
    await ctx.onPositionSelect(openPos)
    expect(ctx.positionsFeed.subscribeAudit).toHaveBeenCalledTimes(1)
    // window end extends beyond the open timestamp (≈ now)
    expect(ctx.positionPlot.window.end).toBeGreaterThan(openPos.opened_at_ms)
  })
})
