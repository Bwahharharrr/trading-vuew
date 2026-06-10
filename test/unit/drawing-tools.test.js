// drawing-tools mixin: rectangle readout + the Scaled Order create/edit flows
// (the cog-edit branch re-derives an EXISTING box's distribution in place).
import { test, expect, describe, vi } from 'vitest'
import drawingTools, { boxReadout } from '../../src/mixins/app/drawing-tools.js'

const M = drawingTools.methods
const DATA = drawingTools.data

function mkCtx(over = {}) {
  const ctx = Object.assign({}, DATA(), {
    chart: {
      data: {
        chart: { type: 'Candles', data: [[1000, 100, 101, 99, 100, 5]] },
        onchart: [], offchart: [],
      },
      add: vi.fn(function (pane, ov) { this.data[pane].push(ov) }),
      touchData: vi.fn(),
    },
  })
  ctx.chart.add = ctx.chart.add.bind(ctx.chart)
  Object.assign(ctx, M)
  return Object.assign(ctx, over)
}

describe('boxReadout', () => {
  // Linear fake grid: y 0..100 → price 110..90 (inverted), x px == minutes.
  const T0 = Date.UTC(2026, 0, 2, 12, 0) // 2026-01-02 12:00 UTC
  const grid = {
    prec: 2,
    screen2$: (y) => 110 - (y / 100) * 20,
    screen2t: (x) => T0 + x * 60_000,
    ti_map: { i2t: (t) => t, tf: 60_000 }, // 1m (intraday → tz applies)
  }

  test('y-inversion: top edge = HIGH, bottom edge = LOW (drag direction agnostic)', () => {
    const r = boxReadout(grid, { topY: 10, botY: 90, leftX: 0, rightX: 30 })
    expect(r.high).toBe('108.00') // y=10 → higher price
    expect(r.low).toBe('92.00')   // y=90 → lower price
    expect(r.tStart).toBe(T0)
    expect(r.tEnd).toBe(T0 + 30 * 60_000)
  })

  test('intraday timezone shifts the readable strings only (UTC getters)', () => {
    const r0 = boxReadout(grid, { topY: 0, botY: 10, leftX: 0, rightX: 1 }, 0)
    const r3 = boxReadout(grid, { topY: 0, botY: 10, leftX: 0, rightX: 1 }, 3)
    expect(r0.startStr).toBe('2026-01-02 12:00')
    expect(r3.startStr).toBe('2026-01-02 15:00') // +3h display shift
    expect(r3.tStart).toBe(T0)                   // raw epoch untouched
  })

  test('daily timeframe ignores the timezone shift', () => {
    const daily = { ...grid, ti_map: { i2t: (t) => t, tf: 86_400_000 } }
    const r = boxReadout(daily, { topY: 0, botY: 10, leftX: 0, rightX: 1 }, 3)
    expect(r.startStr).toBe('2026-01-02 12:00')
  })
})

describe('onOrderConfirm — CREATE', () => {
  test('adds an OrderBox anchored to the drawn box; side auto from price', () => {
    const ctx = mkCtx({
      pendingBoxGeometry: { tStart: 1, tEnd: 2, low: 104, high: 108 }, // box ABOVE close=100
      orderModalOpen: true,
    })
    ctx.onOrderConfirm({ orderQty: 4, orderSize: 10, distribution: 'flat' })
    expect(ctx.orderModalOpen).toBe(false)
    expect(ctx.pendingBoxGeometry).toBeNull()
    const ov = ctx.chart.data.onchart[0]
    expect(ov.type).toBe('OrderBox')
    expect(ov.settings.side).toBe('sell') // above price → sell
    expect(ov.settings.c0).toEqual([1, 104])
    expect(ov.settings.c1).toEqual([2, 108])
    expect(ov.settings.orders.length).toBe(4)
    expect(ov.settings.orders.every(o => o.status === 'local')).toBe(true)
    const total = ov.settings.orders.reduce((s, o) => s + o.size, 0)
    expect(total).toBeCloseTo(10, 6)
  })

  test('a box BELOW the current price becomes a BUY box', () => {
    const ctx = mkCtx({ pendingBoxGeometry: { tStart: 1, tEnd: 2, low: 90, high: 95 } })
    ctx.onOrderConfirm({ orderQty: 2, orderSize: 6, distribution: 'flat' })
    expect(ctx.chart.data.onchart[0].settings.side).toBe('buy')
  })
})

describe('onOrderConfirm — EDIT (cog)', () => {
  function withBox(ctx) {
    ctx.chart.data.onchart.push({
      name: 'Scaled Order', type: 'OrderBox',
      settings: {
        $uuid: 'orderbox-7', c0: [1, 104], c1: [2, 108], side: 'sell',
        totalSize: 10, qty: 4, distribution: 'flat',
        orders: [{ id: 'o1', price: 105, size: 2.5, status: 'local' }],
      },
    })
    return ctx
  }

  test('re-derives the existing box distribution over its OWN range, in place', () => {
    const ctx = withBox(mkCtx({
      editingOrderBox: { uuid: 'orderbox-7', geometry: { low: 104, high: 108 }, initial: {} },
      orderModalOpen: true,
    }))
    ctx.onOrderConfirm({ orderQty: 5, orderSize: 20, distribution: 'asc' })
    const s = ctx.chart.data.onchart[0].settings
    expect(s.qty).toBe(5)
    expect(s.totalSize).toBe(20)
    expect(s.distribution).toBe('asc')
    expect(s.orders.length).toBe(5)
    expect(Math.min(...s.orders.map(o => o.price))).toBeGreaterThanOrEqual(104)
    expect(Math.max(...s.orders.map(o => o.price))).toBeLessThanOrEqual(108)
    expect(s.c0).toEqual([1, 104]) // the box itself does not move
    expect(ctx.editingOrderBox).toBeNull()
    expect(ctx.chart.touchData).toHaveBeenCalled()
    expect(ctx.chart.data.onchart.length).toBe(1) // edited, not re-added
  })

  test('vanished box (uuid gone) is a safe no-op; cancel clears the edit state', () => {
    const ctx = mkCtx({ editingOrderBox: { uuid: 'nope', geometry: {}, initial: {} } })
    expect(() => ctx.onOrderConfirm({ orderQty: 2, orderSize: 4, distribution: 'flat' })).not.toThrow()
    const ctx2 = mkCtx({ editingOrderBox: { uuid: 'x' }, orderModalOpen: true, pendingBoxGeometry: { low: 1, high: 2 } })
    ctx2.onOrderCancel()
    expect(ctx2.editingOrderBox).toBeNull()
    expect(ctx2.orderModalOpen).toBe(false)
    expect(ctx2.pendingBoxGeometry).toBeNull()
  })
})

describe('onOrderBoxSettings + type chooser', () => {
  test('cog payload opens the modal pre-filled for THAT box', () => {
    const ctx = mkCtx()
    ctx.onOrderBoxSettings({
      uuid: 'orderbox-3', low: 90, high: 95,
      totalSize: 12, qty: 6, distribution: 'desc',
    })
    expect(ctx.orderModalOpen).toBe(true)
    expect(ctx.editingOrderBox).toEqual({
      uuid: 'orderbox-3',
      geometry: { low: 90, high: 95 },
      initial: { orderSize: 12, orderQty: 6, distribution: 'desc' },
    })
    // garbage payload → ignored
    const ctx2 = mkCtx()
    ctx2.onOrderBoxSettings(null)
    ctx2.onOrderBoxSettings({})
    expect(ctx2.orderModalOpen).toBe(false)
  })

  test('order-type chooser: scaled advances, cancel resets', () => {
    const ctx = mkCtx({ orderTypeModalOpen: true, pendingBoxGeometry: { low: 1, high: 2 } })
    ctx.onOrderTypeSelect('scaled')
    expect(ctx.orderTypeModalOpen).toBe(false)
    expect(ctx.orderModalOpen).toBe(true)
    const ctx2 = mkCtx({ orderTypeModalOpen: true, pendingBoxGeometry: { low: 1, high: 2 } })
    ctx2.onOrderTypeCancel()
    expect(ctx2.orderTypeModalOpen).toBe(false)
    expect(ctx2.pendingBoxGeometry).toBeNull()
  })
})

describe('rectangle draw-mode state machine', () => {
  test('toggleRectDrawMode flips the flag and clears state on exit', () => {
    const ctx = mkCtx({ rectDrawMode: false })
    ctx.toggleRectDrawMode()
    expect(ctx.rectDrawMode).toBe(true)
    ctx.isDrawing = true; ctx.rectStart = { x: 1, y: 1 }
    ctx.toggleRectDrawMode() // exit
    expect(ctx.rectDrawMode).toBe(false)
    expect(ctx.isDrawing).toBe(false)
    expect(ctx.rectStart).toBeNull()
  })

  test('onDrawStart / onDrawMove track the drag corners', () => {
    const ctx = mkCtx()
    ctx.onDrawStart({ clientX: 10, clientY: 20 })
    expect(ctx.isDrawing).toBe(true)
    expect(ctx.rectStart).toEqual({ x: 10, y: 20 })
    ctx.onDrawMove({ clientX: 50, clientY: 60 })
    expect(ctx.rectCurrent).toEqual({ x: 50, y: 60 })
    // a move while not drawing is ignored
    const ctx2 = mkCtx({ isDrawing: false, rectCurrent: null })
    ctx2.onDrawMove({ clientX: 9, clientY: 9 })
    expect(ctx2.rectCurrent).toBeNull()
  })

  test('onDrawEnd ignores a tiny (<5px) drag', () => {
    const ctx = mkCtx({ isDrawing: true, rectStart: { x: 0, y: 0 }, rectCurrent: { x: 2, y: 2 } })
    ctx.onDrawEnd({})
    // too small → no order modal opened, no crash
    expect(ctx.orderTypeModalOpen).toBeFalsy()
  })

  test('onDrawEnd is a no-op when not drawing', () => {
    const ctx = mkCtx({ isDrawing: false })
    expect(() => ctx.onDrawEnd({})).not.toThrow()
  })

  test('_drawCanvasEl falls back through the ref chain to a <canvas>', () => {
    const ctx = mkCtx()
    const canvas = { tagName: 'CANVAS' }
    const chart = { $refs: { sec: [{ $refs: { grid: { $refs: { canvas } } } }] } }
    expect(ctx._drawCanvasEl(chart)).toBe(canvas)
    // fallback: querySelector on the chart element
    const chart2 = { $refs: {}, $el: { querySelector: () => canvas } }
    expect(ctx._drawCanvasEl(chart2)).toBe(canvas)
  })
})
