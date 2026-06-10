// @vitest-environment jsdom
// Pins the OrderBox overlay (P3): a saved OrderBox in onchart renders a box and
// survives a redraw. Mounts a real TradingVue with OrderBox registered.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import OrderBox from '../../src/components/overlays/OrderBox.vue'
import { OrderAgent } from '../../src/helpers/orders/order-agent.js'
import { StubOrderTransport } from '../../src/helpers/orders/stub-order-transport.js'
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

  function fakeEvent() {
    return { defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }
  }
  function orders(dc) { return dc.data.onchart[0].settings.orders }

  test('delete (✕) removes exactly that order', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    const row = ob._geom.rows[1] // ord-2
    ob.mouse.x = row.del.x + row.del.w / 2
    ob.mouse.y = row.del.y + row.del.h / 2
    ob.on_mousedown(fakeEvent())
    await settle(4)
    expect(orders(dc).map(o => o.id)).toEqual(['ord-1', 'ord-3'])
  })

  test('eye toggle flips visible and hides the rows', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    expect(ob.visible).toBe(true)
    ob.mouse.x = ob._geom.eye.x + 2
    ob.mouse.y = ob._geom.eye.y + 2
    ob.on_mousedown(fakeEvent())
    await settle(6)
    expect(dc.data.onchart[0].settings.visible).toBe(false)
    expect(ob._geom.rows.length).toBe(0)
  })

  // Two boxes + Delete: the surviving box's Vue component is REUSED with the
  // other overlay's settings. watch_uuid must fire (settingsDisplayKey includes
  // $uuid) so the pins re-hydrate — otherwise the survivor renders at the
  // DELETED box's coordinates (green box at the sell box's spot, orders culled,
  // avg/spline floating where the box isn't).
  test('deleting one of two boxes re-anchors the survivor (no stale pins)', async () => {
    const dc2 = seedDc() // box A: orderbox-test @ prices 97..104
    dc2.data.onchart.push({
      name: 'Scaled Order B', type: 'OrderBox', grid: { id: 0 }, data: [],
      settings: {
        $uuid: 'orderbox-B', $selected: false, $state: 'finished',
        'z-index': 100, legend: false,
        c0: [T0 + 15 * TF, 90], c1: [T0 + 45 * TF, 95], // DISTINCT price band
        side: 'sell', visible: true,
        orders: [{ id: 'b-1', price: 92, size: 1, status: 'local' }]
      }
    })
    await mountWith(dc2)
    dc.touchData(); await settle(6)
    // delete box A the way Delete does it (system Remove → dc.del(selected uuid))
    dc.del('orderbox-test')
    await settle(8)
    const ob = orderBoxRenderer(wrapper)
    expect(ob).toBeTruthy()
    expect(ob.sett.$uuid).toBe('orderbox-B') // survivor's settings
    // corner() (pin-first) must give box B's corners, not stale box-A pins
    expect(ob.corner(0)[1]).toBe(90)
    expect(ob.corner(1)[1]).toBe(95)
    const r = ob.box_rect()
    const L = ob.$props.layout
    expect(Math.abs(r.yT - Math.min(L.$2screen(90), L.$2screen(95)))).toBeLessThan(1)
    // and its orders are NOT culled out of the box
    expect(ob._geom.rows.length).toBe(1)
  })

  test('cog click emits order-settings with the box config (modal pre-fill)', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    const got = []
    const orig = ob.custom_event.bind(ob)
    ob.custom_event = (e, ...a) => { if (e === 'order-settings') got.push(a[0]); return orig(e, ...a) }
    expect(ob._geom.cog).toBeTruthy()
    expect(ob._geom.cog.x).toBeGreaterThan(ob._geom.eye.x) // sits right of the eye
    ob.mouse.x = ob._geom.cog.x + 2
    ob.mouse.y = ob._geom.cog.y + 2
    ob.on_mousedown(fakeEvent())
    expect(got.length).toBe(1)
    expect(got[0].uuid).toBe('orderbox-test')
    expect(got[0].low).toBe(97)
    expect(got[0].high).toBe(104)
    expect(got[0].qty).toBe(3)             // falls back to orders.length
    expect(got[0].distribution).toBe('flat')
  })

  test('distribution curve: a faint spline is drawn near the right edge', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    resetCounters()
    dc.touchData(); await settle(6)
    // the smoothing pass uses quadraticCurveTo (3 orders → 1 mid-segment)
    expect(methodTotal('quadraticCurveTo')).toBeGreaterThan(0)
  })

  test('dragging an order changes its price (persisted)', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    const row = ob._geom.rows[0] // ord-1
    ob.mouse.x = row.grab.x + 4
    ob.mouse.y = row.grab.y + row.grab.h / 2
    ob.on_mousedown(fakeEvent())
    expect(ob._dragOrder).toBe('ord-1')
    // simulate the cursor moving to a new price, then a move + drop
    ob.$props.cursor.y$ = 102.75
    ob.on_mousemove()
    ob.on_mouseup(fakeEvent())
    await settle(4)
    const o1 = orders(dc).find(o => o.id === 'ord-1')
    expect(o1.price).toBe(102.75)
    expect(ob._dragOrder).toBe(null)
  })

  test('Submit (▶) flips orders local→confirmed via the agent', async () => {
    await mountWith(seedDc())
    dc.orderAgent = new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc })
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    expect(orders(dc).every(o => o.status === 'local')).toBe(true)
    ob.mouse.x = ob._geom.submit.x + 2
    ob.mouse.y = ob._geom.submit.y + 2
    ob.on_mousedown(fakeEvent())
    await settle(6)
    expect(orders(dc).every(o => o.status === 'confirmed')).toBe(true)
  })

  test('real Delete keydown removes a selected local box (full keyboard chain)', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    ob.custom_event('object-selected'); await settle(4)
    expect(ob.selected).toBe(true)
    // Grid's keydown is gated on is_active (cursor.t set + cursor.grid_id === grid).
    // Simulate the cursor being over grid 0 (as it is when the user hits Delete).
    ob.$props.cursor.grid_id = 0
    ob.$props.cursor.t = dc.data.chart.data[0][0]
    await settle(1)
    // Fire a real window keydown — exercises Keyboard.vue → KeyboardListener →
    // Grid.propagate('keydown') → keys.emit → 'Delete' → remove_tool → remove-tool.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    await settle(4)
    expect(dc.data.onchart.length).toBe(0) // box removed via the keyboard chain
  })

  test('Delete with only local orders emits remove-tool (delete now)', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    ob.custom_event('object-selected'); await settle(4)
    expect(ob.selected).toBe(true)
    let removeEmitted = false
    const orig = ob.custom_event.bind(ob)
    ob.custom_event = (e, ...a) => { if (e === 'remove-tool') removeEmitted = true; return orig(e, ...a) }
    ob.remove_tool()
    expect(removeEmitted).toBe(true)
  })

  test('Delete with confirmed orders cancels then removes the box (sync stub)', async () => {
    await mountWith(seedDc())
    dc.orderAgent = new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc })
    const ob = orderBoxRenderer(wrapper)
    ob.custom_event('object-selected'); await settle(4)
    orders(dc).forEach(o => { o.status = 'confirmed' })
    ob.remove_tool()
    await settle(4)
    expect(dc.data.onchart.length).toBe(0) // cancelled (sync) → box gone
  })

  test('Delete with live orders keeps the box until cancel confirmed (async)', async () => {
    await mountWith(seedDc())
    let fire
    const transport = { onevent: () => {}, send(m) { fire = () => transport.onevent({ type: 'orders_cancelled', request_id: m.request_id, orders: m.orders }) }, destroy() {} }
    dc.orderAgent = new OrderAgent({ transport, dataCube: dc })
    const ob = orderBoxRenderer(wrapper)
    ob.custom_event('object-selected'); await settle(4)
    orders(dc).forEach(o => { o.status = 'confirmed' })
    ob.remove_tool()
    await settle(2)
    expect(orders(dc).every(o => o.status === 'cancelling')).toBe(true) // requested
    expect(dc.data.onchart.length).toBe(1)                              // box stays
    fire()
    await settle(2)
    expect(dc.data.onchart.length).toBe(0)                              // gone after confirm
  })

  test('summary shows the order type label', async () => {
    await mountWith(seedDc({ orderType: 'scaled' }))
    const ob = orderBoxRenderer(wrapper)
    expect(ob.order_type_label()).toBe('Scaled Order')
  })

  test('order_summary: count, placed, filled, size-weighted avg price', async () => {
    await mountWith(seedDc({
      qty: 4, totalSize: 10,
      orders: [
        { id: 'ord-1', price: 100, size: 1, status: 'confirmed' },
        { id: 'ord-2', price: 102, size: 3, status: 'local' }
      ]
    }))
    const ob = orderBoxRenderer(wrapper)
    const s = ob.order_summary()
    expect(s.count).toBe(2)
    expect(s.origQty).toBe(4)            // original placed (from the modal)
    expect(s.origSize).toBe(10)
    expect(s.filledCount).toBe(1)        // confirmed = filled
    expect(s.totalSize).toBe(4)
    expect(s.avgPrice).toBeCloseTo((100 * 1 + 102 * 3) / 4, 6) // size-weighted
  })

  test('avg-price tracks a box move; summary renders (fillText) on redraw', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    const base = ob.order_summary().avgPrice
    // during a move the avg shifts by the same dy as the box
    ob._moveDy = -2
    expect(ob.order_summary().avgPrice).toBeCloseTo(base - 2, 6)
    ob._moveDy = 0
    // the real recording ctx draws the summary text on every redraw (no throw)
    resetCounters()
    dc.touchData(); await settle(6)
    expect(methodTotal('fillText')).toBeGreaterThan(0) // includes the stats lines + avg label
  })

  test('box_rect does not throw before pins exist (new-grid-layer fires draw pre-init)', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    const saved = ob.pins
    ob.pins = undefined // simulate the first draw, before init() created the pins
    expect(() => ob.box_rect()).not.toThrow()
    const r = ob.box_rect()
    expect(r && typeof r.xL === 'number').toBe(true) // falls back to settings.c0/c1
    ob.pins = saved
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

  // BUG 1: box must follow the corner Pins' LIVE state during a drag (not the
  // stale settings prop). Moving the pins without settling must shift box_rect.
  test('box_rect follows live pin state (move bug)', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    const before = ob.box_rect()
    const s = dc.data.onchart[0].settings
    ob.pins[0].update_from([s.c0[0] + 5 * TF, s.c0[1]], false) // move pins, NO emit/settle
    ob.pins[1].update_from([s.c1[0] + 5 * TF, s.c1[1]], false)
    const after = ob.box_rect()
    expect(after.xL).toBeGreaterThan(before.xL) // box shifted with the dots, live
    expect(after.xR).toBeGreaterThan(before.xR)
  })

  // A body-move shows a GHOST at the destination — the real box + its order lines
  // stay put — and the offset is applied to corners + order prices on drop (no
  // recompute, so spacing is preserved).
  test('box move shows a ghost (box stays put) + commits on drop', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    const start = orders(dc).map(o => o.price)
    const yBefore = ob._geom.rows.map(r => r.y)
    const DY = -2 // move down in price (lower)
    // Simulate a Tool box-body move: this.drag set + cursor moved by dy (dt = 0).
    ob.drag = { t: 0, y$: 100 }
    ob.$props.cursor.t = 0
    ob.$props.cursor.y$ = 100 + DY
    ob.drag_update()                       // records the ghost offset + emits $ghost
    expect(ob._ghost).toEqual({ dt: 0, dy: DY })
    dc.touchData(); await settle(2)
    // the ORIGINAL box + order lines DON'T move (only the ghost does)
    const yAfter = ob._geom.rows.map(r => r.y)
    for (let i = 0; i < yAfter.length; i++) {
      expect(yAfter[i]).toBeCloseTo(yBefore[i], 6)
    }
    ob.on_mouseup(fakeEvent())
    expect(orders(dc).map(o => o.price)).toEqual(start.map(p => p + DY)) // baked in on drop
    expect(ob._ghost).toBe(null)
  })

  // Resize handles carry directional cursors, and the top/bottom edge-mid handles
  // are offset out of the (horizontally centered) order-widget lane so the
  // topmost/lowest order doesn't bury them.
  test('resize handles have cursors; top/bottom-mid handles dodge the widget lane', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    const rs = ob._geom.resize
    expect(rs.length).toBe(8)
    for (const h of rs) expect(/-resize$/.test(h.cursor)).toBe(true) // every handle has one
    const box = ob.box_rect()
    const cx = (box.xL + box.xR) / 2
    // the two vertical-only (top/bottom edge-mid) handles sit OFF center
    const mids = rs.filter(h => h.edits.length === 1 && h.edits[0].axis === '$')
    expect(mids.length).toBe(2)
    for (const h of mids) {
      const hx = h.rect.x + h.rect.w / 2
      expect(Math.abs(hx - cx)).toBeGreaterThan(8)
      expect(h.cursor).toBe('ns-resize')
    }
  })

  // BUG 2: dragging a resize handle must change box_rect LIVE (not just settings)
  // — guards the fatal move/resize contradiction (pins kept in sync).
  test('resize handle drag widens box_rect live + persists (resize bug)', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    ob.show_pins = true // handles are grabbable once the box is hovered/selected
    expect(ob._geom.resize.length).toBe(8)
    const before = ob.box_rect()
    const rightEdge = ob._geom.resize[5] // [TL,TR,BL,BR,L,R,T,B] → R
    expect(rightEdge.edits).toEqual([{ pin: 1, axis: 't' }]) // c1 owns right (c0.t<c1.t)
    ob.mouse.x = rightEdge.rect.x + rightEdge.rect.w / 2
    ob.mouse.y = rightEdge.rect.y + rightEdge.rect.h / 2
    ob.on_mousedown(fakeEvent())
    expect(ob._dragResize).toBeTruthy()
    ob.$props.cursor.t = dc.data.onchart[0].settings.c1[0] + 20 * TF
    ob.$props.cursor.y$ = 100
    ob.on_mousemove()
    expect(ob.box_rect().xR).toBeGreaterThan(before.xR) // followed LIVE (not frozen)
    expect(ob.pins[1].t).toBe(ob.$props.cursor.t)       // pin synced
    ob.on_mouseup(fakeEvent())
    expect(ob._dragResize).toBe(null)
  })

  test('resize handles only present/active when selected', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    dc.touchData(); await settle(6)
    expect(ob.selected).toBeFalsy()
    expect(ob._geom.resize.length).toBe(8) // geometry always computed…
    // …but the hit-test is gated on selected||show_pins: a handle click when
    // deselected falls through (no _dragResize).
    const h = ob._geom.resize[5]
    ob.mouse.x = h.rect.x + 2; ob.mouse.y = h.rect.y + 2
    ob.on_mousedown(fakeEvent())
    expect(ob._dragResize).toBe(null)
  })

  // BUG 3: status button label/submittable reflects the aggregate order status.
  test('status button label + submittable per status mix', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    const set = ss => dc.data.onchart[0].settings.orders.forEach((o, i) => { o.status = ss[i] })
    set(['local', 'local', 'local'])
    expect(ob.order_status()).toMatchObject({ label: 'Submit', submittable: true })
    set(['confirmed', 'confirmed', 'confirmed'])
    expect(ob.order_status()).toMatchObject({ label: 'Confirmed', submittable: false })
    set(['rejected', 'rejected', 'rejected'])
    expect(ob.order_status()).toMatchObject({ label: 'Rejected', submittable: true })
    set(['pending', 'local', 'local'])
    expect(ob.order_status().label).toBe('Pending…')
  })

  test('status button: confirmed=no-op (no submit), rejected=resubmits', async () => {
    await mountWith(seedDc())
    dc.orderAgent = new OrderAgent({ transport: new StubOrderTransport(), dataCube: dc })
    const ob = orderBoxRenderer(wrapper)
    const clickSubmit = () => {
      ob.mouse.x = ob._geom.submit.x + 2
      ob.mouse.y = ob._geom.submit.y + 2
      ob.on_mousedown(fakeEvent())
    }
    // all confirmed → button is a status display, click does NOT resubmit
    orders(dc).forEach(o => { o.status = 'confirmed' })
    dc.touchData(); await settle(6)
    clickSubmit(); await settle(4)
    expect(orders(dc).every(o => o.status === 'confirmed')).toBe(true)
    // all rejected → submittable, click resubmits → confirmed (stub)
    orders(dc).forEach(o => { o.status = 'rejected' })
    dc.touchData(); await settle(6)
    clickSubmit(); await settle(4)
    expect(orders(dc).every(o => o.status === 'confirmed')).toBe(true)
  })

  test('status button width grows with a longer label', async () => {
    await mountWith(seedDc())
    const ob = orderBoxRenderer(wrapper)
    orders(dc).forEach(o => { o.status = 'local' })            // 'Submit'
    dc.touchData(); await settle(6)
    const wShort = ob._geom.submit.w
    orders(dc).forEach(o => { o.status = 'confirmed' })        // 'Confirmed' (longer)
    dc.touchData(); await settle(6)
    expect(ob._geom.submit.w).toBeGreaterThan(wShort)
  })
})
