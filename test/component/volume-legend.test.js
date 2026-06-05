// @vitest-environment jsdom
//
// Pins the "Volume legend row" feature (eye / cog / detach-arrow):
//   - default state is byte-identical to today: volume ON the candle pane,
//     SHOWN, no extra offchart pane;
//   - the detach arrow moves volume into its OWN offchart pane (grid count +1)
//     and hides the candle-pane copy (showVolume=false);
//   - re-attach reverses both;
//   - the eye toggles candle-pane volume visibility without detaching.
//
// The logic lives on Chart (toggleVolumeDetach / setVolumeShown), driven from
// the Legend via the legend-button-click channel — so we exercise the real
// component methods through the mounted TradingVue.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
} from './_component-harness.js'

function seedDc() {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 40 }, (_, i) => {
    const t = T0 + i * 60000
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
  return new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
}

describe('volume legend row (detach / attach / show-hide)', () => {
  let wrapper, dc, chart
  beforeEach(() => { installCanvasEnv(); dc = seedDc() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountChart() {
    wrapper = mount(TradingVue, {
      props: { data: dc, width: 600, height: 400 }, attachTo: document.body,
    })
    await settle()
    chart = wrapper.vm.$refs.chart
  }

  test('default: volume attached + shown, single grid (golden-safe state)', async () => {
    await mountChart()
    expect(chart.volumeIsDetached).toBe(false)
    expect(chart.volumeShown).toBe(true)
    // No auto-added offchart overlay, single (main) grid.
    expect(dc.data.offchart.some(x => x.type === 'Volume')).toBe(false)
    expect(chart.chartLayout.grids.length).toBe(1)
  })

  test('detach: adds a Volume offchart pane + hides candle-pane volume', async () => {
    await mountChart()
    chart.toggleVolumeDetach()
    await settle()
    // A managed Volume overlay now exists on the offchart side.
    const vol = dc.data.offchart.filter(x => x.type === 'Volume')
    expect(vol.length).toBe(1)
    expect(vol[0].settings.$volumeLegend).toBe(true)
    // It references the SAME OHLCV array (live updates flow through).
    expect(vol[0].data).toBe(dc.data.chart.data)
    // Candle-pane volume is hidden, state reflects detached.
    expect(chart.volumeShown).toBe(false)
    expect(chart.volumeIsDetached).toBe(true)
    // A second grid (the volume subplot) now exists.
    expect(chart.chartLayout.grids.length).toBe(2)
  })

  test('re-attach: removes the pane + re-shows candle-pane volume', async () => {
    await mountChart()
    chart.toggleVolumeDetach()       // detach
    await settle()
    chart.toggleVolumeDetach()       // re-attach
    await settle()
    expect(dc.data.offchart.some(x => x.settings && x.settings.$volumeLegend))
      .toBe(false)
    expect(chart.volumeShown).toBe(true)
    expect(chart.volumeIsDetached).toBe(false)
    expect(chart.chartLayout.grids.length).toBe(1)
  })

  test('double-detach is idempotent (no duplicate panes)', async () => {
    await mountChart()
    chart.detachVolume()
    chart.detachVolume()
    await settle()
    expect(dc.data.offchart.filter(x => x.type === 'Volume').length).toBe(1)
  })

  test('eye toggle flips candle-pane visibility without detaching', async () => {
    await mountChart()
    chart.legend_button_click({ button: 'display', overlay: 'Volume', grid: 0 })
    await settle()
    expect(chart.volumeShown).toBe(false)
    expect(chart.volumeIsDetached).toBe(false)   // still attached
    chart.legend_button_click({ button: 'display', overlay: 'Volume', grid: 0 })
    await settle()
    expect(chart.volumeShown).toBe(true)
  })

  test('non-Volume legend buttons still bubble (unchanged behaviour)', async () => {
    await mountChart()
    // A non-Volume overlay must re-emit up to TradingVue (real bubble path),
    // not be intercepted by the volume handler.
    chart.legend_button_click({ button: 'display', overlay: 'EMA0', grid: 1 })
    await settle()
    const emitted = wrapper.emitted('legend-button-click')
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0]).toMatchObject({ overlay: 'EMA0' })
  })
})
