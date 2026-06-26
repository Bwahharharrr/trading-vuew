// @vitest-environment jsdom
//
// vr-3 Strategy B — WHOLE-ARRAY REPLACE redraw (the tf-switch / chunk-load path).
//
// The markRaw migration wraps the inner OHLCV ROW array (chart.data) at every
// site that CREATES or REPLACES it, so the ~6N row proxies stay dead AND a later
// in-place write can't re-proxy the fresh array. The in-place redraw path is
// already pinned by live-inplace-redraw.test.js; this file pins the OTHER half:
// when the entire chart.data array is swapped for a NEW one (what a timeframe
// switch or a fresh history chunk-load does), the new array
//   (a) lands NON-reactive (markRaw / isReactive === false), and
//   (b) still repaints the canvas, and
//   (c) a subsequent in-place push on that fresh array does NOT re-proxy it and
//       still repaints.
//
// Mirrors the REAL app: empty `new DataCube()`, history loaded by reference, then
// the series is REPLACED wholesale via dc.set('chart.data', newArr) (the public
// path a feed's tf-switch takes) — set() markRaw-wraps the slot at chart-data.js.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import { isReactive } from 'vue'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
  totalDrawCalls, totalClearRects, methodTotal, resetCounters,
} from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000

function series(n, base) {
  return Array.from({ length: n }, (_, i) => {
    const t = base + i * TF
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
}

describe('whole-array replace redraw (vr-3 tf-switch / chunk-load path)', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountEmptyThenLoad() {
    // REAL app: App.vue does `new DataCube()` (empty); the feed fills it later.
    dc = new DataCube()
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle()
    if (typeof dc.init_data === 'function' && !dc.data.chart) dc.init_data()
    dc.set('chart.data', series(60, T0))
    dc.touchData()
    await settle()
  }

  test('replacing chart.data with a NEW array stays raw AND repaints', async () => {
    await mountEmptyThenLoad()

    // Sanity: the initially-loaded array is already non-reactive.
    expect(isReactive(dc.data.chart.data)).toBe(false)

    // tf-switch / chunk-load: build a BRAND NEW array (different identity, new
    // window) and swap it in wholesale via the public set() path.
    const fresh = series(80, T0 + 1_000 * TF)
    expect(isReactive(fresh)).toBe(false) // plain array pre-set

    resetCounters()
    dc.set('chart.data', fresh)
    dc.touchData()
    await settle(6)

    // (a) the replacement landed NON-reactive (markRaw'd at the set site) and is
    //     the array we handed in (replaced by reference, not merged).
    expect(isReactive(dc.data.chart.data)).toBe(false)
    expect(dc.data.chart.data).toBe(fresh)
    expect(dc.data.chart.data.length).toBe(80)

    // (b) the swap repainted the candle canvas.
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(totalDrawCalls()).toBeGreaterThan(0)
  })

  test('in-place push on the FRESH array does NOT re-proxy and still repaints', async () => {
    await mountEmptyThenLoad()

    // Replace wholesale (the path that could leave a reactive array behind if a
    // creation/replacement site were missed).
    const fresh = series(80, T0 + 1_000 * TF)
    dc.set('chart.data', fresh)
    dc.touchData()
    await settle(6)

    const arr = dc.data.chart.data
    expect(arr).toBe(fresh)
    expect(isReactive(arr)).toBe(false)

    // A live append on the just-swapped array: pushing into a markRaw'd array
    // keeps it raw (the boundary invariant), and the explicit revision bump
    // repaints.
    const lastT = arr[arr.length - 1][0]
    const lenBefore = arr.length
    resetCounters()
    arr.push([lastT + TF, 110, 111, 109, 110.5, 5])
    dc.touchData()
    await settle(6)

    // NOT re-proxied by the in-place write.
    expect(isReactive(dc.data.chart.data)).toBe(false)
    expect(dc.data.chart.data).toBe(fresh)
    expect(dc.data.chart.data.length).toBe(lenBefore + 1)

    // Repainted.
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(methodTotal('fillRect') + methodTotal('stroke')).toBeGreaterThan(0)
  })
})
