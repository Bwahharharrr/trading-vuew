// @vitest-environment jsdom
// Render gate: a signed_slope_histogram view layer mounts and draws (per-bar
// colour column via colorIndex + zero line) without error, in its own pane with
// the macd_averages lines co-located. Colour CORRECTNESS is unit-tested
// (signed-slope-histogram.test.js) — the recording ctx doesn't capture fillStyle.
import { test, expect } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { buildChartData } from '../../src/helpers/feed/corky-ingest.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle, resetCounters, methodTotal } from './_component-harness.js'

const T0 = 1_700_000_000_000, TF = 60000
const view = (kind, layers) => ({ kind, view: { version: 1, layers } })

test('signed_slope histogram + macd lines render in one pane (no throw)', async () => {
  installCanvasEnv()
  const rows = Array.from({ length: 30 }, (_, i) => ({
    timeframe: '1m',
    candle: { timestamp_ms: T0 + i * TF, open: '10', high: '12', low: '9', close: '11', volume: '5' },
    indicators: { MACD: { histogram: String(Math.sin(i / 3)), hist_slope: String(Math.cos(i / 3)), macd: '1', signal: '0.8' } }
  }))
  const views = {
    MACD: view('macd', [
      {
        id: 'macd_hist', label: 'Histogram', kind: 'histogram', target: { surface: 'pane', pane: 'macd' }, fields: ['histogram'],
        style: {
          color_rule: 'signed_slope_histogram', value_field: 'histogram', slope_field: 'hist_slope',
          positive_rising_color: '#26a69a', positive_falling_color: '#7ec9c0',
          negative_falling_color: '#ef5350', negative_rising_color: '#f3a3a1', zero_line: 'true'
        },
        visible_by_default: true
      },
      { id: 'macd_averages', label: 'MACD', kind: 'line', target: { surface: 'pane', pane: 'macd' }, fields: ['macd', 'signal'], visible_by_default: true }
    ])
  }
  const cd = buildChartData(rows, { views })
  const dc = new DataCube(cd, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 600 }, attachTo: document.body })
  await settle(8)
  const chart = wrapper.vm.$refs.chart
  // main + the macd pane (histogram anchor + lines merged)
  expect(chart.chartLayout.grids.length).toBe(2)
  resetCounters()
  dc.touchData()
  await settle(8)
  expect(methodTotal('fillRect')).toBeGreaterThan(0) // histogram bars (+ candles)
  expect(methodTotal('stroke')).toBeGreaterThan(0)   // zero line + lines/candles
  wrapper.unmount()
  uninstallCanvasEnv()
})
