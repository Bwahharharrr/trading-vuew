// @vitest-environment jsdom
//
// Phase B: App.syncPositionOverlays() reconciles the chart's position overlays to
// positionPlot + its toggles, and survives the candle feed's onchart/offchart
// wipe. Exercised against a fake DataCube using App's own methods (the same
// lightweight technique as chart-state.test.js).
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const audit = {
  position: { source: 'historical', opened_at_ms: 1730683960000, closed_at_ms: 1733964907000, updated_at_ms: 1733964907000 },
  trades: [
    { execution_timestamp_ms: 1730683960181, amount: '0.01015975', price: '69012', fee: '-1.402289334', fee_currency: 'TESTUSD' },
    { execution_timestamp_ms: 1730707382909, amount: '0.03984025', price: '69012', fee: '-2.749455333', fee_currency: 'TESTUSD' },
    { execution_timestamp_ms: 1733964892254, amount: '0.2', price: '100800', fee: '-40.32', fee_currency: 'TESTUSD' },
    { execution_timestamp_ms: 1733964906796, amount: '-0.25', price: '100660', fee: '-50.33', fee_currency: 'TESTUSD' },
  ],
}

function fakeDc() {
  const data = { onchart: [], offchart: [], chart: { data: [] } }
  return { data, add(side, ov) { data[side].push(ov); return ov }, update_ids() {}, touchData() {} }
}

const M = App.methods
function mkCtx(toggles) {
  const ctx = {
    chart: fakeDc(),
    corkyCurrent: { symbol: 'tTESTBTC:TESTUSD', venue: 'BITFINEX' },
    positionPlot: { symbol: 'tTESTBTC:TESTUSD', series: null, toggles },
    $nextTick: (fn) => fn && fn(),
    $refs: { tradingVue: { refreshOffchartOverlays: vi.fn() } },
  }
  for (const m of ['syncPositionOverlays', '_removePositionOverlays', '_computePositionSeries', 'togglePositionDetail']) {
    ctx[m] = M[m]
  }
  ctx.positionPlot.series = ctx._computePositionSeries(audit)
  return ctx
}
const tags = (ctx, side) => ctx.chart.data[side].filter((o) => o.settings && o.settings.$positionOverlay)

let ctx
beforeEach(() => { ctx = mkCtx({ trades: true, size: true, hist: true, fees: true }) })

describe('syncPositionOverlays', () => {
  test('adds Trades (onchart) + Size/Histogram/Fees (offchart) when all toggled on', () => {
    ctx.syncPositionOverlays()
    const on = tags(ctx, 'onchart'); const off = tags(ctx, 'offchart')
    expect(on.map((o) => o.type)).toEqual(['Trades'])
    expect(on[0].grid).toEqual({ id: 0 })          // price pane
    expect(off.map((o) => o.type).sort()).toEqual(['Histogram', 'Spline', 'StepLine'])
    expect(off.every((o) => o.grid === undefined)).toBe(true)  // each its own pane (anchor)
    // overlay data points at the App-owned series (survives wipe)
    expect(on[0].data).toBe(ctx.positionPlot.series.markers)
    // fees pane labels the currency
    expect(off.find((o) => o.type === 'Spline').name).toBe('Fees (TESTUSD)')
  })

  test('re-adds the overlays after a simulated cube wipe (idempotent, no dupes)', () => {
    ctx.syncPositionOverlays()
    ctx.syncPositionOverlays()   // calling again must not duplicate
    expect(tags(ctx, 'onchart')).toHaveLength(1)
    expect(tags(ctx, 'offchart')).toHaveLength(3)
    // wipe (what corky-feed._finishHistory does), then re-sync
    ctx.chart.data.onchart.length = 0
    ctx.chart.data.offchart.length = 0
    ctx.syncPositionOverlays()
    expect(tags(ctx, 'onchart')).toHaveLength(1)
    expect(tags(ctx, 'offchart')).toHaveLength(3)
  })

  test('respects toggles — only enabled series are plotted', () => {
    ctx.positionPlot.toggles = { trades: true, size: false, hist: false, fees: false }
    ctx.syncPositionOverlays()
    expect(tags(ctx, 'onchart').map((o) => o.type)).toEqual(['Trades'])
    expect(tags(ctx, 'offchart')).toHaveLength(0)
  })

  test('plots nothing when the plotted position is not the charted symbol', () => {
    ctx.corkyCurrent.symbol = 'tOTHER'
    ctx.syncPositionOverlays()
    expect(tags(ctx, 'onchart')).toHaveLength(0)
    expect(tags(ctx, 'offchart')).toHaveLength(0)
  })

  test('positionDetailRows lists the four toggles, labelling the fee currency', () => {
    const rows = App.computed.positionDetailRows.call(ctx)
    expect(rows.map((r) => r.key)).toEqual(['trades', 'size', 'hist', 'fees'])
    expect(rows[3].name).toBe('Fees (TESTUSD)')          // currency from the series
    // before series resolve, the fees row falls back to a generic label
    const pending = { positionPlot: { toggles: {}, series: null } }
    expect(App.computed.positionDetailRows.call(pending)[3].name).toBe('Fees')
    // no plotted position → no rows
    expect(App.computed.positionDetailRows.call({ positionPlot: null })).toEqual([])
  })

  test('togglePositionDetail flips a series and re-syncs', () => {
    ctx.syncPositionOverlays()
    expect(tags(ctx, 'offchart').some((o) => o.type === 'StepLine')).toBe(true)
    ctx.togglePositionDetail('size')
    expect(tags(ctx, 'offchart').some((o) => o.type === 'StepLine')).toBe(false)
    ctx.togglePositionDetail('size')
    expect(tags(ctx, 'offchart').some((o) => o.type === 'StepLine')).toBe(true)
  })
})
