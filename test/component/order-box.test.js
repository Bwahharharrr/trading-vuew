// @vitest-environment jsdom
// Pins the OrderBox overlay (P3): a saved OrderBox in onchart renders a box and
// survives a redraw. Mounts a real TradingVue with OrderBox registered.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import OrderBox from '../../src/components/overlays/OrderBox.vue'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle, resetCounters, methodTotal,
} from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000

function seedDc(boxSettings) {
  const ohlcv = Array.from({ length: 60 }, (_, i) => {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 3, p - 3, p + 0.5, 100 + i]
  })
  return new DataCube({
    ohlcv,
    onchart: [{
      name: 'Order Distribution', type: 'OrderBox', grid: { id: 0 }, data: [],
      settings: Object.assign({
        $uuid: 'orderbox-test', $selected: false, $state: 'finished',
        'z-index': 100, legend: false,
        c0: [T0 + 10 * TF, 97], c1: [T0 + 40 * TF, 104],
        side: 'buy', visible: true,
        orders: [
          { id: 'ord-1', price: 98, size: 1, status: 'local' },
          { id: 'ord-2', price: 101, size: 1, status: 'local' },
          { id: 'ord-3', price: 103, size: 1, status: 'local' }
        ]
      }, boxSettings || {})
    }]
  }, { scripts: false, validation: 'off' })
}

// Find the live OrderBox renderer instance among the grid's overlays.
function orderBoxRenderer(wrapper) {
  const sec0 = wrapper.vm.$refs.chart.$refs.sec[0]
  const gr = sec0.$refs.grid.renderer.renderer // GridRenderer
  for (const layer of gr.overlays) {
    if (layer.renderer && layer.renderer.$options &&
        layer.renderer.$options.name === 'OrderBox') return layer.renderer
  }
  return null
}

describe('OrderBox overlay (P3)', () => {
  let wrapper, dc
  beforeEach(() => installCanvasEnv())
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountWith(d) {
    dc = d
    wrapper = mount(TradingVue, {
      props: { data: dc, overlays: [OrderBox], width: 600, height: 400 },
      attachTo: document.body
    })
    await settle(6)
  }

  test('the OrderBox overlay is registered and draws a box', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    expect(ob, 'OrderBox overlay registered').toBeTruthy()

    // Spy on its draw; force a full redraw and assert the box paints.
    let drew = 0
    const orig = ob.draw.bind(ob)
    ob.draw = (ctx) => { drew++; return orig(ctx) }
    resetCounters()
    dc.touchData()
    await settle(6)
    expect(drew).toBeGreaterThan(0)
    expect(methodTotal('fillRect')).toBeGreaterThan(0)   // box fill
    expect(methodTotal('strokeRect')).toBeGreaterThan(0) // box border
  })

  test('mounts cleanly for buy and sell (no throw)', async () => {
    await mountWith(seedDc({ side: 'sell' }))
    expect(orderBoxRenderer(wrapper)).toBeTruthy()
  })

  test('renders one row per order (lines + size widgets) when visible', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    resetCounters()
    dc.touchData()
    await settle(6)
    expect(ob._geom.rows.length).toBe(3)              // one per order
    expect(ob._geom.rows.map(r => r.id)).toEqual(['ord-1', 'ord-2', 'ord-3'])
    expect(methodTotal('fillText')).toBeGreaterThan(0) // size labels
  })

  test('eye toggle (visible:false) hides the order rows; box still drawn', async () => {
    await mountWith(seedDc({ visible: false }))
    const ob = orderBoxRenderer(wrapper)
    resetCounters()
    dc.touchData()
    await settle(6)
    expect(ob._geom.rows.length).toBe(0)               // orders hidden
    expect(methodTotal('strokeRect')).toBeGreaterThan(0) // box still there
  })

  test('order lines are clamped to the box width', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData()
    await settle(6)
    const box = ob.box_rect()
    for (const row of ob._geom.rows) {
      expect(row.xL).toBe(box.xL)
      expect(row.xR).toBe(box.xR)
      // widget stays inside the box
      expect(row.widget.x).toBeGreaterThanOrEqual(box.xL - 0.01)
      expect(row.widget.x + row.widget.w).toBeLessThanOrEqual(box.xR + 0.01)
    }
  })
})
