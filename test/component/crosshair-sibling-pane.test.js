// @vitest-environment jsdom
//
// Regression guard (scale-engine Phase 2/3): the dual-canvas crosshair must track
// on NON-active SIBLING panes (offcharts / detached volume), not just the hovered
// pane. grid.js draws the crosshair SYNCHRONOUSLY for the hovered pane only;
// siblings rely on the render scheduler's Cursor-level drain calling
// updateDynamic() on every pane. A Phase-2 cursor-routing change once early-
// returned for dual-canvas and FROZE the sibling crosshair on every multi-pane
// chart (this app is heavily multi-pane). This pins that siblings track again.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle, flushRaf, allContexts } from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000

function seedDc() {
  const ohlcv = Array.from({ length: 120 }, (_, i) => {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
  // An offchart Histogram → a SECOND grid (grid 1) with its own dynamic canvas.
  const offchart = [{
    name: 'osc', type: 'Histogram',
    data: ohlcv.map((r, i) => [r[0], Math.sin(i / 4) * 10]),
    settings: {},
  }]
  return new DataCube({ ohlcv, onchart: [], offchart }, { scripts: false, validation: 'off' })
}

const dynById = (suffix) => allContexts().find((c) => new RegExp(suffix + '$').test(c.id))
function dispatchMove(canvas, layerX, layerY = 80) {
  const ev = new MouseEvent('mousemove', { bubbles: true })
  Object.defineProperty(ev, 'layerX', { value: layerX, configurable: true })
  Object.defineProperty(ev, 'layerY', { value: layerY, configurable: true })
  canvas.dispatchEvent(ev)
}

describe('dual-canvas crosshair tracks on sibling (non-active) panes', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv(); dc = seedDc() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  test('a cursor move over the MAIN pane repaints the OFFCHART pane crosshair', async () => {
    wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 500 }, attachTo: document.body })
    await settle(6)

    const mainDyn = document.getElementById('trading-vue-js-grid-0-canvas-dynamic')
    expect(mainDyn, 'main pane dynamic canvas exists').toBeTruthy()

    // Prime: a first move creates the crosshair layers + makes them visible.
    dispatchMove(mainDyn, 200)
    await nextTick(); flushRaf(); await settle(2)

    const offDyn = dynById('-grid-1-canvas-dynamic')
    expect(offDyn, 'offchart pane has its own dynamic canvas').toBeTruthy()
    const before = offDyn.log.clearRect

    // Move the cursor over the MAIN pane; the sibling (offchart) crosshair must
    // repaint via the scheduler's Cursor drain (updateDynamic on every pane).
    dispatchMove(mainDyn, 440)
    flushRaf()            // run the scheduler frame
    await settle(2)

    expect(offDyn.log.clearRect).toBeGreaterThan(before)   // sibling tracked, not frozen
  })
})
