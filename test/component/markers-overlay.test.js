// @vitest-environment jsdom
// Pins the Markers overlay (view.layers kind=marker): a glyph is drawn per
// finite-y point; non-finite/null y is skipped. Markers is a built-in overlay
// (registered in Grid._list), so it renders by type name with no custom overlays.
import { test, expect } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle, resetCounters, methodTotal } from './_component-harness.js'

test('Markers draws a glyph per finite-y point', async () => {
  installCanvasEnv()
  const T0 = 1_700_000_000_000, TF = 60000
  const ohlcv = Array.from({ length: 10 }, (_, i) => [T0 + i * TF, 100, 101, 99, 100.5, 5])
  const dc = new DataCube({
    ohlcv,
    onchart: [{
      name: 'sig', type: 'Markers',
      data: [[T0 + 1 * TF, 100.5], [T0 + 5 * TF, 100.7], [T0 + 7 * TF, null]], // last skipped
      settings: { shape: 'triangle-up', color: '#0f0', markerSize: 5 }
    }]
  }, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
  await settle(6)
  resetCounters()
  dc.touchData()
  await settle(6)
  // triangle markers → moveTo/lineTo/closePath + fill per point (2 finite points)
  expect(methodTotal('fill')).toBeGreaterThan(0)
  expect(methodTotal('closePath')).toBeGreaterThan(0)
  wrapper.unmount()
  uninstallCanvasEnv()
})

test('circle-shape Markers use arc()', async () => {
  installCanvasEnv()
  const T0 = 1_700_000_000_000, TF = 60000
  const ohlcv = Array.from({ length: 6 }, (_, i) => [T0 + i * TF, 100, 101, 99, 100.5, 5])
  const dc = new DataCube({
    ohlcv,
    onchart: [{ name: 'm', type: 'Markers', data: [[T0 + 2 * TF, 100.5]], settings: { color: '#f00' } }]
  }, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
  await settle(6)
  resetCounters()
  dc.touchData()
  await settle(6)
  expect(methodTotal('arc')).toBeGreaterThan(0) // default circle shape
  wrapper.unmount()
  uninstallCanvasEnv()
})
