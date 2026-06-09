// @vitest-environment jsdom
//
// Reproduction for "current candle not redrawn in realtime": NEW candles
// (append, length++) draw once, but an IN-PLACE update of the CURRENT candle
// (same ts, close/high/low change, length unchanged) must also redraw.
//
// Mirrors the REAL app path: empty `new DataCube()` (init_data deferred), then
// history is loaded and live ticks upsert the last candle in place — exactly
// what CorkyFeed._applyLive -> applyLiveUpdate + dc.touchData() does.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
  totalDrawCalls, totalClearRects, methodTotal, resetCounters,
} from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000

function history(n = 60) {
  return Array.from({ length: n }, (_, i) => {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
}

describe('live in-place current-candle redraw', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountEmptyThenLoad() {
    // REAL app: App.vue does `new DataCube()` (empty) and binds it to
    // <trading-vue :data>; CorkyFeed later fills it.
    dc = new DataCube()
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle()
    // CorkyFeed._finishHistory equivalent: ensure skeleton, push the series by
    // reference, signal a redraw.
    if (typeof dc.init_data === 'function' && !dc.data.chart) dc.init_data()
    dc.set('chart.data', history())
    dc.touchData()
    await settle()
  }

  test('append (new candle) redraws — baseline that already works', async () => {
    await mountEmptyThenLoad()
    const arr = dc.data.chart.data
    const lastT = arr[arr.length - 1][0]
    resetCounters()
    arr.push([lastT + TF, 110, 111, 109, 110.5, 5]) // append, length++
    dc.touchData()
    await settle(6)
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(totalDrawCalls()).toBeGreaterThan(0)
  })

  test('in-place current-candle update redraws (THE BUG)', async () => {
    await mountEmptyThenLoad()
    const arr = dc.data.chart.data
    const i = arr.length - 1
    const ts = arr[i][0]
    resetCounters()
    // applyLiveUpdate/upsertByTs replace-same-ts path: same ts, new OHLC.
    arr[i] = [ts, arr[i][1], arr[i][2] + 50, arr[i][3], arr[i][4] + 40, arr[i][5] + 10]
    dc.touchData()
    await settle(6)
    // The candle canvas must repaint: a clear + candle body fills/strokes.
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(methodTotal('fillRect') + methodTotal('stroke')).toBeGreaterThan(0)
  })
})
