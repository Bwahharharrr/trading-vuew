// @vitest-environment jsdom
//
// Guard for the crosshair-lag fix ("glued then jumps" on mouse motion).
//
// BEFORE: the crosshair pixel was deferred behind a Vue 'cursor.x' watcher
// microtask + a requestAnimationFrame (Grid.vue), so on every move the crosshair
// trailed the pointer by ~1 frame and a burst coalesced to one late paint.
//
// AFTER: for the dual-canvas case, grid.js mousemove draws the dynamic crosshair
// SYNCHRONOUSLY in the same tick the cursor is committed (updater.sync runs
// synchronously inside the $emit), so the crosshair tracks the latest pointer
// position with no frame deferral. Grid.vue's RAF watcher is skipped for
// dual-canvas (kept only as the single-canvas fallback).
//
// These tests assert the SYNC behavior (no nextTick/flushRaf needed) and that a
// cursor-only move never redraws the static candle canvas.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle, flushRaf, allContexts,
} from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000

function seedDc() {
  const ohlcv = Array.from({ length: 120 }, (_, i) => {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
  return new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
}

function dynamicCanvas() {
  return document.getElementById('trading-vue-js-grid-0-canvas-dynamic')
}

function dispatchMove(canvas, layerX, layerY = 100) {
  const ev = new MouseEvent('mousemove', { bubbles: true })
  Object.defineProperty(ev, 'layerX', { value: layerX, configurable: true })
  Object.defineProperty(ev, 'layerY', { value: layerY, configurable: true })
  canvas.dispatchEvent(ev)
}

// Spy on the live crosshair renderer's draw(); record the cursor.x painted at.
function spyCrosshair(gridVm) {
  const gr = gridVm.renderer.renderer // GridRenderer
  const layer = gr.crosshair
  if (!layer) return null
  const ch = layer.renderer
  const draws = []
  const orig = ch.draw.bind(ch)
  ch.draw = function (ctx) { draws.push(this.$p.cursor.x); return orig(ctx) }
  return { draws }
}

function staticClearRects() {
  const c = allContexts().find(c => /-grid-0-canvas$/.test(c.id))
  return c ? c.log.clearRect : 0
}

describe('crosshair tracks the pointer synchronously (no frame lag)', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv(); dc = seedDc() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountChart() {
    wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 400 }, attachTo: document.body })
    await settle()
  }

  // The crosshair LAYER is created lazily by Crosshair.vue's own cursor.x watcher
  // (a microtask). Prime it so it exists + is visible, then install the spy.
  async function primeCrosshair(gvm, canvas) {
    dispatchMove(canvas, 120)
    await nextTick()   // Crosshair.vue creates the layer + sets visible
    flushRaf()
    await settle(2)
    return spyCrosshair(gvm)
  }

  test('a single mousemove paints the crosshair SYNCHRONOUSLY at the latest X', async () => {
    await mountChart()
    const gvm = wrapper.findComponent({ name: 'Grid' }).vm
    const chart = wrapper.findComponent({ name: 'Chart' }).vm
    const canvas = dynamicCanvas()
    const spy = await primeCrosshair(gvm, canvas)
    expect(spy, 'crosshair layer exists after priming').toBeTruthy()
    spy.draws.length = 0

    dispatchMove(canvas, 360)
    const pointerX = chart.cursor.x
    // Painted in the SAME tick — no nextTick/flushRaf. (The fix.)
    expect(spy.draws.length).toBeGreaterThanOrEqual(1)
    expect(spy.draws[spy.draws.length - 1]).toBe(pointerX)
  })

  test('a burst of moves paints each one synchronously; final paint is the latest X (no coalescing-drop)', async () => {
    await mountChart()
    const gvm = wrapper.findComponent({ name: 'Grid' }).vm
    const chart = wrapper.findComponent({ name: 'Chart' }).vm
    const canvas = dynamicCanvas()
    const spy = await primeCrosshair(gvm, canvas)
    spy.draws.length = 0

    let latest
    for (const x of [160, 200, 240, 280, 320]) { dispatchMove(canvas, x); latest = chart.cursor.x }
    // Every move drew synchronously — no frame needed, nothing dropped.
    expect(spy.draws.length).toBe(5)
    expect(spy.draws[spy.draws.length - 1]).toBe(latest)
  })

  test('a cursor-only move does NOT redraw the static candle canvas (perf fast path preserved)', async () => {
    await mountChart()
    const gvm = wrapper.findComponent({ name: 'Grid' }).vm
    const canvas = dynamicCanvas()
    await primeCrosshair(gvm, canvas)

    const before = staticClearRects()
    dispatchMove(canvas, 300)
    dispatchMove(canvas, 340)
    // The static (candle) canvas must not be cleared/redrawn by a cursor move.
    expect(staticClearRects()).toBe(before)
  })

  test('mouseout clears the dynamic crosshair layer in the same tick', async () => {
    await mountChart()
    const gvm = wrapper.findComponent({ name: 'Grid' }).vm
    const canvas = dynamicCanvas()
    await primeCrosshair(gvm, canvas)
    dispatchMove(canvas, 300)

    const dyn = allContexts().find(c => /-grid-0-canvas-dynamic$/.test(c.id))
    const beforeClears = dyn.log.clearRect
    const ev = new MouseEvent('mouseout', { bubbles: true })
    canvas.dispatchEvent(ev)
    // Dynamic layer cleared synchronously on exit.
    expect(dyn.log.clearRect).toBeGreaterThan(beforeClears)
  })
})
