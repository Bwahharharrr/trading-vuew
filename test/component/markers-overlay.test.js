// @vitest-environment jsdom
// Pins the Markers overlay (view.layers kind=marker): a glyph is drawn per
// finite-y point; non-finite/null y is skipped. Markers is a built-in overlay
// (registered in Grid._list), so it renders by type name with no custom overlays.
import { test, expect } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle, resetCounters, methodTotal, allContexts } from './_component-harness.js'

const fillTexts = () => allContexts().flatMap((c) => c.log.ops).filter((o) => o.op === 'fillText')

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

test('SCMR symbol markers: per-point glyph drawn as text, above vs below placement', async () => {
  installCanvasEnv()
  const T0 = 1_700_000_000_000, TF = 60000
  const ohlcv = Array.from({ length: 6 }, (_, i) => [T0 + i * TF, 100, 110, 90, 105, 5]) // high 110, low 90
  const dc = new DataCube({
    ohlcv,
    onchart: [{
      name: 'SCMR', type: 'Markers',
      // [ts, y, label, glyph, color, dir]
      data: [
        [T0 + 1 * TF, 90, 'Bull', 'o', '#00FFFF', 'below'],
        [T0 + 2 * TF, 110, 'Bear', 'x', '#FF0000', 'above'],
        [T0 + 4 * TF, 90, 'Strong', 'z', '#00FF00', 'below'],
      ],
      settings: { corkyMarkerRule: 'scmr_reversal_symbols', markerSize: 6, showLabel: false }
    }]
  }, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
  await settle(6)
  resetCounters()
  dc.touchData()
  await settle(6)
  const texts = fillTexts()
  // each glyph rendered as a literal text character
  expect(texts.map((o) => o.text)).toEqual(expect.arrayContaining(['o', 'x', 'z']))
  // 'x' (above the high 110) draws higher on screen (smaller y) than 'o' (below the low 90)
  const xOp = texts.find((o) => o.text === 'x')
  const oOp = texts.find((o) => o.text === 'o')
  expect(xOp.y).toBeLessThan(oOp.y)
  wrapper.unmount()
  uninstallCanvasEnv()
})

test('SCMR symbol markers: zero/missing rows draw no glyph', async () => {
  installCanvasEnv()
  const T0 = 1_700_000_000_000, TF = 60000
  const ohlcv = Array.from({ length: 4 }, (_, i) => [T0 + i * TF, 100, 110, 90, 105, 5])
  const dc = new DataCube({
    ohlcv,
    onchart: [{
      name: 'SCMR', type: 'Markers',
      data: [[T0 + 1 * TF, null, '', '', '', 'above'], [T0 + 2 * TF, 110, 'Bear', 'x', '#FF0000', 'above']],
      settings: { corkyMarkerRule: 'scmr_reversal_symbols', markerSize: 6, showLabel: false }
    }]
  }, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
  await settle(6)
  resetCounters()
  dc.touchData()
  await settle(6)
  const glyphs = fillTexts().map((o) => o.text)
  expect(glyphs).toContain('x')      // the valid row
  expect(glyphs).not.toContain('')   // the null/empty row drew nothing
  wrapper.unmount()
  uninstallCanvasEnv()
})

test('SCMR symbol markers: the per-point label is NOT stamped on-chart by default', async () => {
  installCanvasEnv()
  const T0 = 1_700_000_000_000, TF = 60000
  const ohlcv = Array.from({ length: 4 }, (_, i) => [T0 + i * TF, 100, 110, 90, 105, 5])
  const dc = new DataCube({
    ohlcv,
    onchart: [{
      name: 'SCMR', type: 'Markers',
      data: [[T0 + 1 * TF, 110, 'Bearish', 'x', '#FF0000', 'above']],
      settings: { corkyMarkerRule: 'scmr_reversal_symbols', markerSize: 6 } // no show_label → glyph only
    }]
  }, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
  await settle(6)
  resetCounters()
  dc.touchData()
  await settle(6)
  const texts = fillTexts().map((o) => o.text)
  expect(texts).toContain('x')          // glyph IS drawn
  expect(texts).not.toContain('Bearish') // label NOT stamped on each candle
  wrapper.unmount()
  uninstallCanvasEnv()
})

test('SCMR symbol markers: style.show_label="true" opts the label back in', async () => {
  installCanvasEnv()
  const T0 = 1_700_000_000_000, TF = 60000
  const ohlcv = Array.from({ length: 4 }, (_, i) => [T0 + i * TF, 100, 110, 90, 105, 5])
  const dc = new DataCube({
    ohlcv,
    onchart: [{
      name: 'SCMR', type: 'Markers',
      data: [[T0 + 1 * TF, 110, 'Bearish', 'x', '#FF0000', 'above']],
      settings: { corkyMarkerRule: 'scmr_reversal_symbols', markerSize: 6, style: { show_label: 'true' } }
    }]
  }, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
  await settle(6)
  resetCounters()
  dc.touchData()
  await settle(6)
  const texts = fillTexts().map((o) => o.text)
  expect(texts).toContain('x')
  expect(texts).toContain('Bearish')   // opted in
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
