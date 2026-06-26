// @vitest-environment jsdom
//
// vr-3 "Strategy B" coverage: the inner overlay ROW arrays (onchart[i].data /
// .raw, offchart[i].data / .raw) are markRaw'd (non-reactive) to kill ~6N
// proxies. Redraw is NOT driven by deep reactivity — it is the explicit
// revision signal (cd.invalidate via touchData) that repaints. This test pins
// that an OVERLAY-row IN-PLACE mutation still triggers a redraw, the exact
// analogue of live-inplace-redraw.test.js but for an overlay series, not OHLCV.
//
// It also covers a CREATION SITE (dc.set, which markRaw's the new array): a
// later in-place write on the fresh array must NOT re-proxy it and must still
// repaint. FINDING: the dc.add path does NOT markRaw the new overlay.data array
// at creation (init_data / dc.set / dc.merge do) — a perf gap, not a behaviour
// gap, since redraw is revision-driven; the dc.add test asserts only behaviour.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import { isReactive, reactive } from 'vue'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
  totalDrawCalls, totalClearRects, methodTotal, resetCounters,
} from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000
const N = 60

function ohlcv(n = N) {
  return Array.from({ length: n }, (_, i) => {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
}

// An onchart line series (Spline) whose row array is the markRaw target.
function splineData(n = N) {
  return Array.from({ length: n }, (_, i) => [T0 + i * TF, 100 + Math.cos(i / 5) * 3])
}

// The revision counter (cd.invalidate bumps it; Grid.dataKey reads it). This is
// the "dataKey/revision" the task asks us to assert.
const rev = (dc) => dc.data.$cd.revision()

describe('overlay-row in-place redraw (vr-3 Strategy B coverage)', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  async function mountWithOverlay() {
    dc = new DataCube(
      {
        ohlcv: ohlcv(),
        onchart: [{ name: 'EMA, 20', type: 'Spline', data: splineData(), settings: { color: '#0a0' } }],
      },
      { scripts: false, validation: 'off' },
    )
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle()
    return dc.data.onchart[0]
  }

  test('boundary: overlay ROW array is markRaw, container + chart object are NOT', async () => {
    const ov = await mountWithOverlay()
    // markRaw is irreversible: reactive() can NEVER convert a markRaw'd object,
    // so reactive(rowArr) returns the SAME raw array. That is the markRaw tag.
    expect(reactive(ov.data)).toBe(ov.data)
    expect(isReactive(reactive(ov.data))).toBe(false)
    // chart.data (OHLCV) is markRaw too.
    expect(reactive(dc.data.chart.data)).toBe(dc.data.chart.data)
    // ...but the onchart CONTAINER array + the chart OBJECT were NOT markRaw'd —
    // they CAN still be made reactive (they drive Chart.vue structure computeds
    // + the dc_core $watch-es, so breaking them would freeze overlay add/del).
    expect(reactive(dc.data.onchart)).not.toBe(dc.data.onchart)
    expect(isReactive(reactive(dc.data.onchart))).toBe(true)
    expect(isReactive(reactive(dc.data.chart))).toBe(true)
    expect(isReactive(reactive(ov.settings))).toBe(true)
  })

  test('in-place overlay-row update bumps the revision AND redraws (THE CONTRACT)', async () => {
    const ov = await mountWithOverlay()
    const i = ov.data.length - 1
    const ts = ov.data[i][0]
    const before = rev(dc)
    resetCounters()
    // In-place replace of one overlay row (same ts, new value) — the overlay
    // analogue of applyLiveUpdate upserting the current candle in place.
    ov.data[i] = [ts, ov.data[i][1] + 25]
    dc.touchData()
    await settle(6)
    // revision bumped exactly once...
    expect(rev(dc)).toBe(before + 1)
    // ...and that invalidation propagated to a real canvas repaint.
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(totalDrawCalls()).toBeGreaterThan(0)
  })

  test('appending an overlay row redraws (length++ baseline)', async () => {
    const ov = await mountWithOverlay()
    const lastT = ov.data[ov.data.length - 1][0]
    const before = rev(dc)
    resetCounters()
    ov.data.push([lastT + TF, 99])
    dc.touchData()
    await settle(6)
    expect(rev(dc)).toBe(before + 1)
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(totalDrawCalls()).toBeGreaterThan(0)
  })

  test('mutation WITHOUT touchData does not bump the revision (revision-driven, not deep-reactive)', async () => {
    const ov = await mountWithOverlay()
    const before = rev(dc)
    // Mutate a markRaw'd row in place but do NOT signal — since the row is
    // non-reactive, nothing should observe this (proving redraw is the explicit
    // revision signal, not deep reactivity on the row).
    ov.data[0] = [ov.data[0][0], ov.data[0][1] + 999]
    expect(rev(dc)).toBe(before)
  })

  test('CREATION SITE (dc.set): a freshly-set overlay.data array is markRaw and stays raw after an in-place write', async () => {
    const ov = await mountWithOverlay()
    // dc.set REPLACES the overlay row array — the chart-data store markRaw's the
    // new array at creation (chart-data.js set()), closing the migration GAP for
    // this path: a later in-place write must NOT re-proxy it.
    dc.set('onchart.EMA, 20.data', splineData())
    await settle()
    const fresh = ov.data
    // markRaw held at creation: reactive() cannot convert it.
    expect(reactive(fresh)).toBe(fresh)

    const i = fresh.length - 1
    const ts = fresh[i][0]
    const beforeMut = rev(dc)
    resetCounters()
    fresh[i] = [ts, fresh[i][1] + 30]   // in-place write on the fresh array
    dc.touchData()
    await settle(6)
    // re-proxy guard: STILL raw after the in-place write...
    expect(reactive(ov.data)).toBe(ov.data)
    // ...revision bumped and a real repaint fired.
    expect(rev(dc)).toBe(beforeMut + 1)
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(methodTotal('stroke') + methodTotal('fill')).toBeGreaterThan(0)
  })

  test('runtime-added overlay (dc.add): in-place row mutation still redraws (behavioural contract)', async () => {
    await mountWithOverlay()
    // dc.add pushes a brand-new overlay. NOTE (finding): the dc.add path does
    // NOT markRaw the new overlay.data array at creation (unlike init_data /
    // dc.set / dc.merge), so its rows get re-proxied. That is a PERF gap only —
    // redraw is revision-driven (touchData -> cd.invalidate), so the observable
    // behaviour (in-place mutation repaints) is preserved, which is what this
    // test pins. Not asserting markRaw here, to avoid a false red on the
    // unwrapped src; the gap is reported separately.
    dc.add('onchart', {
      name: 'Sig', type: 'Spline', data: splineData(), settings: { color: '#00a' },
    })
    await settle()
    const added = dc.data.onchart[dc.data.onchart.length - 1]
    const i = added.data.length - 1
    const ts = added.data[i][0]
    const beforeMut = rev(dc)
    resetCounters()
    added.data[i] = [ts, added.data[i][1] + 30]   // in-place row update
    dc.touchData()
    await settle(6)
    expect(rev(dc)).toBe(beforeMut + 1)
    expect(totalClearRects()).toBeGreaterThan(0)
    expect(methodTotal('stroke') + methodTotal('fill')).toBeGreaterThan(0)
  })
})
