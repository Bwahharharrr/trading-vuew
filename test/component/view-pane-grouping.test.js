// @vitest-environment jsdom
// GATE for the view.layers pane-index resolver: verify trading-vue actually
// renders pane-grouped layers in ONE offchart grid (numeric grid.id grouping via
// Section.vue), not just that buildChartData tags them correctly — incl. a 2nd
// pane and a mixed-in fallback (no-view) offchart indicator (the index-drift risk).
import { test, expect } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { buildChartData } from '../../src/helpers/feed/corky-ingest.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

const T0 = 1_700_000_000_000, TF = 60000
function makeRows(n, ind) {
  return Array.from({ length: n }, (_, i) => ({
    timeframe: '1m',
    candle: { timestamp_ms: T0 + i * TF, open: '10', high: '12', low: '9', close: '11', volume: '5' },
    indicators: ind(i)
  }))
}
const view = (kind, layers) => ({ kind, view: { version: 1, layers } })

// overlays Section actually renders for an offchart grid (anchor + merged siblings)
function gridLayers(chart, gridIndex) {
  const sec = chart.$refs.sec[gridIndex]
  return (sec.grid_props.data || []).map(o => (o.settings && o.settings.corkyLayerId) || o.name)
}

test('MACD: histogram + macd/signal lines render in ONE grid; strength in its own', async () => {
  installCanvasEnv()
  const rows = makeRows(40, () => ({ MACD: { macd: '1', signal: '0.5', histogram: '0.2', bull: '3' } }))
  const views = {
    MACD: view('macd', [
      { id: 'hist', label: 'Histogram', kind: 'histogram', target: { surface: 'pane', pane: 'macd' }, fields: ['histogram'], visible_by_default: true },
      { id: 'lines', label: 'MACD', kind: 'line', target: { surface: 'pane', pane: 'macd' }, fields: ['macd', 'signal'], visible_by_default: true },
      { id: 'bull', label: 'Bull', kind: 'histogram', target: { surface: 'pane', pane: 'macd_strength' }, fields: ['bull'], visible_by_default: true }
    ])
  }
  const cd = buildChartData(rows, { views })
  const dc = new DataCube(cd, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 600 }, attachTo: document.body })
  await settle(8)
  const chart = wrapper.vm.$refs.chart
  // main + exactly 2 offchart panes
  expect(chart.chartLayout.grids.length).toBe(3)
  expect(gridLayers(chart, 1).sort()).toEqual(['hist', 'lines']) // co-located
  expect(gridLayers(chart, 2)).toEqual(['bull'])                 // separate pane
  wrapper.unmount(); uninstallCanvasEnv()
})

test('mixed with a fallback (no-view) offchart indicator: indices do not drift', async () => {
  installCanvasEnv()
  const rows = makeRows(40, () => ({
    MACD: { macd: '1', signal: '0.5', histogram: '0.2' },
    'rsi:14': { rsi: '55' } // no view → fallback offchart Spline, its own pane
  }))
  const views = {
    MACD: view('macd', [
      { id: 'hist', label: 'Histogram', kind: 'histogram', target: { surface: 'pane', pane: 'macd' }, fields: ['histogram'], visible_by_default: true },
      { id: 'lines', label: 'MACD', kind: 'line', target: { surface: 'pane', pane: 'macd' }, fields: ['macd', 'signal'], visible_by_default: true }
    ])
  }
  const cd = buildChartData(rows, { views })
  const dc = new DataCube(cd, { scripts: false, validation: 'off' })
  const wrapper = mount(TradingVue, { props: { data: dc, width: 800, height: 600 }, attachTo: document.body })
  await settle(8)
  const chart = wrapper.vm.$refs.chart
  // main + macd pane + rsi pane
  expect(chart.chartLayout.grids.length).toBe(3)
  // macd pane still co-locates hist+lines (grid:{id:1} merged into the hist anchor)
  expect(gridLayers(chart, 1).sort()).toEqual(['hist', 'lines'])
  // the fallback RSI is in its OWN pane (no view layer leaked into it)
  const rsiPane = gridLayers(chart, 2)
  expect(rsiPane.some(n => /rsi/i.test(String(n)))).toBe(true)
  expect(rsiPane).not.toContain('lines')
  wrapper.unmount(); uninstallCanvasEnv()
})
