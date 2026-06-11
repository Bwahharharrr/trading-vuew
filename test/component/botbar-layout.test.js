// @vitest-environment jsdom
// C2 regression — the botbar renderer drew from a CONSTRUCTION-TIME layout
// snapshot: update_layout() replaces chartLayout and re-points the grid +
// sidebar renderers but never did the botbar, so the time axis went stale
// after the first pan/zoom. Botbar.update() must re-resolve the live layout.
import { test, expect, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

let wrapper
beforeEach(() => installCanvasEnv())
afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

test('botbar renderer tracks the LIVE layout across a pan', async () => {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 200 }, (_, i) => [T0 + i * 60000, 100, 101, 99, 100, 5])
  const dc = new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
  wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 500 }, attachTo: document.body })
  await settle()
  const chart = wrapper.vm.$refs.chart
  const r = chart.range.slice()
  const shift = (r[1] - r[0]) * 0.5
  chart.range_changed([r[0] + shift, r[1] + shift])
  await settle()
  const bb = wrapper.findAllComponents({ name: 'Botbar' })[0]
  expect(bb).toBeTruthy()
  // force a redraw so update() runs against the latest props
  bb.vm.redraw()
  expect(bb.vm.renderer.layout).toBe(chart.chartLayout)   // FRESH, not the snapshot
})
