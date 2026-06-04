// @vitest-environment jsdom
//
// Pins the render-TRIGGER contract that 3.1b-final (deleting touchData/
// dataVersion) must preserve: a data invalidation must cause a redraw. The
// chain is touchData -> dataVersion++ -> chart-range.dataHashKey ->
// Grid.dataVersion prop -> Grid.dataKey watcher -> redraw. When dataVersion is
// later replaced with fine-grained reactivity, THIS test must stay green.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
  totalDrawCalls, totalClearRects, methodTotal, resetCounters,
} from './_component-harness.js'

function seedDc() {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 60 }, (_, i) => {
    const t = T0 + i * 60000
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
  return new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
}

describe('render-trigger contract (the 3.1b-final gate)', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv(); dc = seedDc() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountChart() {
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle()
  }

  test('initial mount draws the grid + candles (orchestration)', async () => {
    await mountChart()
    // Grid lines are stroked; candles fill/stroke; canvas is cleared.
    expect(methodTotal('clearRect')).toBeGreaterThan(0)
    expect(methodTotal('stroke')).toBeGreaterThan(0)
    // candles overlay draws bodies/wicks
    expect(methodTotal('fillRect') + methodTotal('stroke')).toBeGreaterThan(0)
  })

  test('touchData (dataVersion bump) triggers a redraw', async () => {
    await mountChart()
    resetCounters()
    dc.touchData()
    await settle()
    // The invalidation propagated to a real canvas redraw.
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(totalDrawCalls()).toBeGreaterThan(0)
  })

  test('no spurious redraw without an invalidation (no thrash)', async () => {
    await mountChart()
    resetCounters()
    await settle() // settle alone, no data change
    // A few stray frames are fine, but it must not be busy-redrawing.
    expect(totalClearRects()).toBeLessThan(5)
  })

  test('a COLOUR-only write (close unchanged) still triggers a redraw', async () => {
    // Regression guard for the live scmr_color feature: dataHashKey's OHLC
    // fields don't capture candle colour (index 6), so the explicit revision
    // signal must catch it — exactly what dataVersion used to do.
    await mountChart()
    const chartData = dc.data.chart.data
    resetCounters()
    // Bulk in-place colour write across history (like _wsApplyLiveColors),
    // close values untouched.
    for (let i = 0; i < chartData.length; i++) {
      while (chartData[i].length < 9) chartData[i].push('')
      chartData[i][6] = '#abcdef'
    }
    dc.touchData()
    await settle()
    expect(totalClearRects()).toBeGreaterThan(0)
  })

  test('a live candle update redraws and appends the candle', async () => {
    await mountChart()
    const before = dc.data.chart.data.length
    const lastT = dc.data.chart.data[before - 1][0]
    resetCounters()
    // New candle one TF ahead.
    dc.update({ candle: [lastT + 60000, 110, 111, 109, 110.5, 5] })
    // Let AggTool's timer + RAF + reactivity settle.
    await new Promise((r) => setTimeout(r, 0))
    await settle(6)
    expect(dc.data.chart.data.length).toBe(before + 1)
    expect(totalClearRects()).toBeGreaterThan(0)
  })
})
