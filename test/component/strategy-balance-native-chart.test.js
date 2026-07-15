// @vitest-environment jsdom
//
// Contract: strategy balance is data for the established TradingVue engine,
// not a second renderer. Mount the real chart so main-grid layout, axes,
// overlays and range navigation all execute through their production paths.
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { strategyBalanceChartData } from '../../src/helpers/feed/strategy-balance-chart.js'
import {
  mount, installCanvasEnv, settle, uninstallCanvasEnv,
} from './_component-harness.js'

describe('native strategy balance chart', () => {
  let wrapper

  beforeEach(() => installCanvasEnv())
  afterEach(() => {
    if (wrapper) wrapper.unmount()
    uninstallCanvasEnv()
  })

  test('uses the normal main grid, spline overlays and TradingVue range controls', async () => {
    const history = {
      starting_balance: '1000',
      points: Array.from({ length: 40 }, (_, index) => ({
        timestamp_ms: 1_700_000_000_000 + index * 3_600_000,
        booked_balance: String(1000 + index - (index > 20 ? 30 : 0)),
        equity: index === 12 ? null : String(1000 + index * 1.5 - (index > 20 ? 35 : 0)),
        mark_status: index === 12 ? 'partial' : 'complete',
      })),
    }
    const dc = new DataCube(strategyBalanceChartData(history, {
      strategyName: 'EMA Regime Breakout V8',
    }), { scripts: false, validation: 'off' })

    wrapper = mount(TradingVue, {
      props: { data: dc, width: 800, height: 480, toolbar: true },
      attachTo: document.body,
    })
    await settle()

    const chart = wrapper.vm.$refs.chart
    expect(chart.chart.type).toBe('Spline')
    expect(chart.chartLayout.grids).toHaveLength(1)
    expect(chart.onchart.every((overlay) => overlay.type === 'Spline')).toBe(true)
    expect(chart.volumeIsDetached).toBe(false)

    const start = history.points[5].timestamp_ms
    const end = history.points[20].timestamp_ms
    expect(wrapper.vm.setRange(start, end).ok).toBe(true)
    expect(wrapper.vm.getRange()).toEqual([start, end])
    wrapper.vm.resetChart()
    await settle()
    expect(wrapper.vm.$refs.chart).toBeTruthy()
  })
})
