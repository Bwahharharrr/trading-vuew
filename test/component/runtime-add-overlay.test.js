// @vitest-environment jsdom
// Draw-before-init regression: on a RUNTIME overlay add, overlay.js mounted()
// emits new-grid-layer (Grid renders synchronously) BEFORE init() runs.
// Candles' price was still the data() placeholder ({}) → the user-reported
//   [trading-vue] overlay "Candles" draw() threw: this.price.draw is not a function
// The same pattern previously bit PriceAlarms (dup shader) and OrderBox (NaN
// first-frame geometry).
import { test, expect, beforeEach, afterEach, vi } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

let wrapper
beforeEach(() => installCanvasEnv())
afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv(); vi.restoreAllMocks() })

test('runtime-adding a Candles overlay draws without a per-overlay error', async () => {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 60 }, (_, i) => [T0 + i * 60000, 100, 101, 99, 100, 5])
  const dc = new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
  wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 500 }, attachTo: document.body })
  await settle()

  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  // Runtime add — exactly the user's stack: dc.add → new-grid-layer →
  // Grid.new_layer → renderer.update() → drawOverlays → Candles.draw,
  // all BEFORE the component's init() has created the Price primitive.
  dc.add('onchart', {
    name: 'Sub Candles', type: 'Candles', grid: { id: 0 },
    data: ohlcv.slice(30),
    settings: { 'z-index': 5 },
  })
  await settle()

  const drawThrew = errors.mock.calls.find((c) =>
    String(c[0]).includes('draw() threw'))
  expect(drawThrew).toBeUndefined()
})
