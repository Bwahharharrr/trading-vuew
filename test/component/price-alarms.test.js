// @vitest-environment jsdom
// PriceAlarms overlay: bells render beside the Y axis from settings.alarms,
// clicking a bell emits alarm-cleared, dragging it re-prices + emits
// alarm-moved. Mounts a real TradingVue (same harness as order-box tests).
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import PriceAlarms from '../../src/components/overlays/PriceAlarms.vue'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
} from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000

function seedDc(alarms) {
  const ohlcv = Array.from({ length: 60 }, (_, i) => {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 3, p - 3, p + 0.5, 100 + i]
  })
  return new DataCube({
    ohlcv,
    onchart: [{
      name: 'Price Alarms', type: 'PriceAlarms', grid: { id: 0 }, data: [],
      settings: {
        $uuid: 'price-alarms', 'z-index': 150, legend: false,
        alarms,
      }
    }]
  }, { scripts: false, validation: 'off' })
}

function alarmsRenderer(wrapper) {
  const sec0 = wrapper.vm.$refs.chart.$refs.sec[0]
  const gr = sec0.$refs.grid.renderer.renderer
  for (const layer of gr.overlays) {
    if (layer.renderer && layer.renderer.$options &&
        layer.renderer.$options.name === 'PriceAlarms') return layer.renderer
  }
  return null
}

function fakeEvent() {
  return { defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }
}

describe('PriceAlarms overlay', () => {
  let wrapper, dc, alarms
  beforeEach(() => installCanvasEnv())
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountWith(a) {
    alarms = a
    dc = seedDc(alarms)
    wrapper = mount(TradingVue, {
      props: { data: dc, overlays: [PriceAlarms], width: 800, height: 600 },
      attachTo: document.body
    })
    await settle(6)
  }

  test('draws one bell per alarm at the right edge, at the alarm price', async () => {
    await mountWith([
      { id: 'a1', price: 108, side: 'above', triggered: false },
      { id: 'a2', price: 92, side: 'below', triggered: false },
    ])
    const ov = alarmsRenderer(wrapper)
    dc.touchData(); await settle(4)
    expect(ov._geo.length).toBe(2)
    const L = ov.$props.layout
    const g1 = ov._geo.find(b => b.id === 'a1')
    expect(Math.abs((g1.rect.y + g1.rect.h / 2) - L.$2screen(108))).toBeLessThan(1)
    // hugs the right edge of the grid (next to the Y axis)
    expect(g1.rect.x + g1.rect.w).toBeGreaterThan(L.width - 25)
  })

  test('hovering the Y axis keeps the horizontal crosshair tracking', async () => {
    await mountWith([])
    const chart = wrapper.vm.$refs.chart
    const sec0 = chart.$refs.sec[0]
    const sb = sec0.$refs['sb-0']
    // wait for the lazy gesture wiring (sidebar listeners() is async)
    for (let i = 0; i < 10 && !sb.renderer._onAxisMove; i++) await settle(2)
    expect(typeof sb.renderer._onAxisMove).toBe('function')
    // simulate the pointer sliding along the axis labels
    sb.renderer._onAxisMove({ layerY: 150 })
    expect(chart.cursor.grid_id).toBe(0)
    // horizontal line tracks the hover (the shared cursor pipeline may snap by
    // a couple px — same as grid mousemoves)
    expect(Math.abs(chart.cursor.y - 150)).toBeLessThan(5)
    // axis price box: y$ maps back to the raw hover position (live layout)
    expect(Math.abs(chart.chartLayout.grids[0].$2screen(chart.cursor.y$) - 150))
      .toBeLessThan(3)
    // x pins to the grid's right edge (vertical line hugs the seam)
    expect(chart.cursor.xr).toBe(sb.renderer.layout.width - 1)
    // leaving the axis clears the line (same as grid mouseout: the cursor y
    // degenerates to a non-finite value, which the crosshair doesn't draw)
    sb.renderer._onAxisOut()
    expect(Number.isFinite(chart.cursor.y)).toBe(false)
  })

  test('registers a sidebar shader that paints an axis bar per alarm', async () => {
    await mountWith([
      { id: 'a1', price: 108, side: 'above', triggered: false },
      { id: 'a2', price: 92, side: 'below', triggered: true },
    ])
    const ov = alarmsRenderer(wrapper)
    dc.touchData(); await settle(4)
    const sec0 = wrapper.vm.$refs.chart.$refs.sec[0]
    const shader = sec0.shaders.find(s => s.target === 'sidebar')
    expect(shader).toBeTruthy()
    // drive the shader directly with a stub axis ctx: one 2px bar per alarm,
    // green for 'above', red for 'below'
    const rects = []
    const fills = []
    const ctx = {
      canvas: { width: 64 },
      set fillStyle(v) { fills.push(v) }, get fillStyle() { return fills[fills.length - 1] },
      globalAlpha: 1,
      fillRect: (x, y, w, h) => rects.push({ x, y, w, h }),
    }
    shader.draw(ctx)
    expect(rects.length).toBe(2)
    expect(fills).toContain('#23a776')
    expect(fills).toContain('#e54150')
    const L = ov.$props.layout
    expect(Math.abs(rects[0].y + 1 - L.$2screen(108))).toBeLessThan(1.5)
    expect(rects.every(r => r.h === 2 && r.x === 0)).toBe(true)
  })

  test('clicking a bell emits alarm-cleared with its id', async () => {
    await mountWith([{ id: 'a1', price: 108, side: 'above', triggered: false }])
    const ov = alarmsRenderer(wrapper)
    dc.touchData(); await settle(4)
    const got = []
    const orig = ov.custom_event.bind(ov)
    ov.custom_event = (e, ...a) => { if (e.startsWith('alarm-')) got.push([e, a[0]]); return orig(e, ...a) }
    const b = ov._geo[0]
    ov.mouse.x = b.rect.x + b.rect.w / 2
    ov.mouse.y = b.rect.y + b.rect.h / 2
    ov.on_mousedown(fakeEvent())
    ov.on_mouseup(fakeEvent())
    expect(got).toEqual([['alarm-cleared', { id: 'a1' }]])
  })

  test('dragging a bell re-prices the alarm and emits alarm-moved', async () => {
    await mountWith([{ id: 'a1', price: 108, side: 'above', triggered: true }])
    const ov = alarmsRenderer(wrapper)
    dc.touchData(); await settle(4)
    const got = []
    const orig = ov.custom_event.bind(ov)
    ov.custom_event = (e, ...a) => { if (e.startsWith('alarm-')) got.push([e, a[0]]); return orig(e, ...a) }
    const L = ov.$props.layout
    const b = ov._geo[0]
    ov.mouse.x = b.rect.x + b.rect.w / 2
    ov.mouse.y = b.rect.y + b.rect.h / 2
    ov.on_mousedown(fakeEvent())
    expect(alarms[0].$dragging).toBe(true) // trigger checker paused mid-drag
    ov.mouse.y = L.$2screen(112)           // drag to a new level
    ov.on_mousemove()
    ov.on_mouseup(fakeEvent())
    expect(got.length).toBe(1)
    expect(got[0][0]).toBe('alarm-moved')
    expect(got[0][1].id).toBe('a1')
    expect(Math.abs(got[0][1].price - 112)).toBeLessThan(0.5)
    expect(alarms[0].$dragging).toBe(false)
  })
})
