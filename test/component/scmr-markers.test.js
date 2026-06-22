// @vitest-environment jsdom
// End-to-end: a chart-feed SCMR reversal-marker VIEW DESCRIPTOR → buildChartData →
// TradingVue renders the per-point reversal glyphs on the PRICE pane, anchored to
// candle highs/lows. Everything (glyph / colour / placement) is read from the
// descriptor's style map — nothing hardcoded.
import { test, expect } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { buildChartData } from '../../src/helpers/feed/corky-ingest.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle, resetCounters, allContexts } from './_component-harness.js'

const fillTexts = () => allContexts().flatMap((c) => c.log.ops).filter((o) => o.op === 'fillText')
const T0 = 1_700_000_000_000, TF = 60000
const candleRow = (i, reversal) => ({
  timeframe: '1m',
  candle: { timestamp_ms: T0 + i * TF, open: '100', high: '110', low: '90', close: '105', volume: '5' },
  indicators: { SCMR: reversal },
})
const scmrViews = {
  SCMR: { kind: 'scmr', view: { version: 1, layers: [{
    id: 'scmr_reversal_markers', label: 'SCMR', kind: 'marker', target: { surface: 'price' },
    fields: ['reversal_type', 'reversal_type_name'],
    style: {
      marker_rule: 'scmr_reversal_symbols', value_field: 'reversal_type', label_field: 'reversal_type_name',
      hide_zero: 'true', above_anchor: 'candle_high', below_anchor: 'candle_low',
      symbol_1: 'o', color_1: '#00FFFF', placement_1: 'below_candle',
      symbol_2: 'x', color_2: '#FF0000', placement_2: 'above_candle',
      symbol_3: 'z', color_3: '#00FF00', placement_3: 'below_candle',
    },
    visible_by_default: true,
  }] } },
}

test('SCMR view descriptor → buildChartData → reversal glyphs render on the price pane', async () => {
  installCanvasEnv()
  const rows = [
    candleRow(0, { reversal_type: '0' }),
    candleRow(1, { reversal_type: '1', reversal_type_name: 'Bullish' }),
    candleRow(2, { reversal_type: '2', reversal_type_name: 'Bearish' }),
    candleRow(3, { reversal_type: '0' }),
    candleRow(4, { reversal_type: '3', reversal_type_name: 'Strong' }),
    candleRow(5, { reversal_type: '0' }),
  ]
  const cd = buildChartData(rows, { views: scmrViews })
  // ingest sanity: one price-pane Markers overlay, 3 markers (ids 1/2/3; zeros hidden)
  const ov = cd.onchart.find((o) => o.settings.corkyLayerId === 'scmr_reversal_markers')
  expect(ov).toBeTruthy()
  expect(ov.type).toBe('Markers')
  expect(ov.data.map((d) => d[3])).toEqual(['o', 'x', 'z'])
  expect(cd.offchart).toHaveLength(0)

  const dc = new DataCube(cd, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 500 }, attachTo: document.body })
  await settle(8)
  resetCounters()
  dc.touchData()
  await settle(8)
  const glyphs = fillTexts().map((o) => o.text)
  expect(glyphs).toEqual(expect.arrayContaining(['o', 'x', 'z']))
  wrapper.unmount()
  uninstallCanvasEnv()
})
