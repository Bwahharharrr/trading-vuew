// @vitest-environment jsdom
//
// TradingVue index-based (ib) navigation: goto/setRange/getRange/getCursor/
// range_changed time<->index conversions + the index_based/mod_ovs/set_loader
// surface.
//
// In index-based mode the chart's internal axis is a candle INDEX, but the
// public TradingVue API speaks TIMESTAMPS. TradingVue.vue is the seam that
// converts between the two: it maps timestamps -> indices (ti_map.gt2i) on the
// way IN (goto/setRange) and indices -> timestamps (ti_map.i2t) on the way OUT
// (getRange/getCursor/range_changed). These tests mount the real component (via
// the jsdom component harness with a recording canvas) and pin that conversion
// contract by spying on the live chart child + its ti_map.
//
// Concrete reference values (60 candles, 60s apart, T0 = 1_600_000_000_000):
//   chart.range (raw indices) = [8.5, 64.5]
//   ti_map.i2t(8.5)  = 1_600_000_510_000   (= T0 + 8.5 * 60_000)
//   ti_map.i2t(64.5) = 1_600_003_870_000
//   ti_map.gt2i(T0 + 5*60_000, ohlcv) = 5

import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
} from './_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000 // 1-minute candles
const t = (i) => T0 + i * TF // candle index -> timestamp helper

function seedDc() {
  const ohlcv = Array.from({ length: 60 }, (_, i) => {
    const p = 100 + Math.sin(i / 5) * 5
    return [t(i), p, p + 1, p - 1, p + 0.5, 100 + i]
  })
  return new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
}

describe('TradingVue index-based (ib) navigation conversions', () => {
  let wrapper

  beforeEach(() => installCanvasEnv())
  afterEach(() => { if (wrapper) wrapper.unmount(); wrapper = null; uninstallCanvasEnv() })

  async function mountIb(props = {}) {
    wrapper = mount(TradingVue, {
      props: { data: seedDc(), width: 600, height: 400, indexBased: true, ...props },
      attachTo: document.body,
    })
    await settle()
    return { vm: wrapper.vm, chart: wrapper.vm.$refs.chart }
  }

  // ── Case 1 ────────────────────────────────────────────────────────────────
  test('indexBased:true sets chart_props.ib and getRange() returns i2t-mapped TIMESTAMPS (not raw indices)', async () => {
    const { vm, chart } = await mountIb()

    expect(vm.chart_props.ib).toBe(true)
    expect(chart.ti_map.ib).toBe(true)

    // The chart's own range is the raw INDEX range.
    const rawRange = chart.range
    expect(rawRange).toEqual([8.5, 64.5])

    // getRange() converts each endpoint through ti_map.i2t -> timestamps.
    const out = vm.getRange()
    expect(out).toEqual([chart.ti_map.i2t(rawRange[0]), chart.ti_map.i2t(rawRange[1])])
    expect(out).toEqual([1_600_000_510_000, 1_600_003_870_000])

    // The mapped result must DIFFER from the raw index range.
    expect(out).not.toEqual(rawRange)
    expect(out[0]).toBeGreaterThan(rawRange[1]) // timestamps dwarf indices
  })

  // ── Case 2 ────────────────────────────────────────────────────────────────
  test('goto(t) maps t through ti_map.gt2i before chart.goto (chart receives the INDEX)', async () => {
    const { vm, chart } = await mountIb()

    // Mock chart.goto so it can't perturb internal range state; spy gt2i.
    const gotoSpy = vi.spyOn(chart, 'goto').mockImplementation(() => {})
    const gt2iSpy = vi.spyOn(chart.ti_map, 'gt2i')

    const target = t(5) // a timestamp on candle index 5
    vm.goto(target)

    // gt2i was called with the timestamp + the ohlcv array.
    expect(gt2iSpy).toHaveBeenCalledTimes(1)
    expect(gt2iSpy.mock.calls[0][0]).toBe(target)
    expect(gt2iSpy.mock.calls[0][1]).toBe(chart.ohlcv)

    // chart.goto received the converted INDEX (5), never the raw timestamp.
    expect(gotoSpy).toHaveBeenCalledTimes(1)
    expect(gotoSpy.mock.calls[0][0]).toBe(5)
    expect(gotoSpy.mock.calls[0][0]).not.toBe(target)
  })

  // ── Case 3 ────────────────────────────────────────────────────────────────
  test('setRange(t1,t2) maps BOTH endpoints through gt2i before chart.setRange', async () => {
    const { vm, chart } = await mountIb()

    const srSpy = vi.spyOn(chart, 'setRange').mockImplementation(() => {})
    const gt2iSpy = vi.spyOn(chart.ti_map, 'gt2i')

    vm.setRange(t(3), t(8))

    // Both endpoints were converted.
    expect(gt2iSpy).toHaveBeenCalledTimes(2)
    expect(gt2iSpy.mock.calls[0][0]).toBe(t(3))
    expect(gt2iSpy.mock.calls[1][0]).toBe(t(8))

    // chart.setRange got the two INDICES, in order.
    expect(srSpy).toHaveBeenCalledTimes(1)
    expect(srSpy.mock.calls[0]).toEqual([3, 8])
  })

  // ── Case 4 ────────────────────────────────────────────────────────────────
  test('getCursor() returns a COPY: copy.i = original t, copy.t = i2t(t); original cursor is unmutated', async () => {
    const { vm, chart } = await mountIb()

    // Seed the live cursor with a known INDEX in its `t` slot.
    chart.cursor.t = 10
    chart.cursor.x = 123

    const copy = vm.getCursor()

    // It is a distinct object (a copy), not the live cursor.
    expect(copy).not.toBe(chart.cursor)

    // copy.i carries the ORIGINAL value of t (the index); copy.t becomes i2t(t).
    expect(copy.i).toBe(10)
    expect(copy.t).toBe(chart.ti_map.i2t(10))
    expect(copy.t).toBe(t(10)) // 1_600_000_600_000
    // Other fields are shallow-copied through.
    expect(copy.x).toBe(123)

    // The original cursor must be untouched.
    expect(chart.cursor.t).toBe(10)
    expect(chart.cursor.i).toBeUndefined()
  })

  // ── Case 5 ────────────────────────────────────────────────────────────────
  test('range_changed(r) i2t-maps r before emitting range-changed AND before custom_event', async () => {
    const { vm, chart } = await mountIb()

    const ceSpy = vi.spyOn(vm, 'custom_event')
    const mapped = [chart.ti_map.i2t(8.5), chart.ti_map.i2t(64.5)]
    expect(mapped).toEqual([1_600_000_510_000, 1_600_003_870_000])

    // Feed it a raw INDEX range (as the chart child would).
    vm.range_changed([8.5, 64.5])

    // The 'range-changed' event was emitted with the i2t-mapped TIMESTAMPS.
    const emissions = wrapper.emitted('range-changed')
    expect(emissions).toBeTruthy()
    expect(emissions[0][0]).toEqual(mapped)

    // custom_event was invoked with the SAME mapped range (not the raw indices).
    expect(ceSpy).toHaveBeenCalled()
    const ceCall = ceSpy.mock.calls.find(c => c[0] && c[0].event === 'range-changed')
    expect(ceCall).toBeTruthy()
    expect(ceCall[0].args).toEqual([mapped])
  })

  // ── Case 6 ────────────────────────────────────────────────────────────────
  describe('index_based computed', () => {
    const ib = (data) => TradingVue.computed.index_based.call({ $props: { data } })

    test('true when raw shape data.chart.indexBased is set', () => {
      expect(ib({ chart: { indexBased: true } })).toBe(true)
    })

    test('true when decubed shape data.data.chart.indexBased is set', () => {
      expect(ib({ data: { chart: { indexBased: true } } })).toBe(true)
    })

    test('false when chart.indexBased is false', () => {
      expect(ib({ chart: { indexBased: false } })).toBe(false)
    })

    test('false when neither chart nor data is present', () => {
      expect(ib({ ohlcv: [] })).toBe(false)
    })

    test('a real DataCube (decubed shape) reports its chart.indexBased flag', () => {
      const dc = new DataCube(
        { ohlcv: [[t(0), 1, 1, 1, 1, 1]], chart: { indexBased: true, data: [[t(0), 1, 1, 1, 1, 1]] } },
        { scripts: false, validation: 'off' })
      // DataCube has no top-level .chart, so the computed falls to data.data.chart.
      expect(dc.chart).toBeUndefined()
      expect(ib(dc)).toBe(true)
    })
  })

  // ── Case 7 ────────────────────────────────────────────────────────────────
  test('mod_ovs flattens extension overlays into chart_props.overlays', async () => {
    const ovA = { name: 'ExtA', methods: {} }
    const ovB = { name: 'ExtB', methods: {} }

    // mod_ovs in isolation: extension overlay objects are flattened to an array.
    const flat = TradingVue.computed.mod_ovs.call({
      $props: { extensions: [{ overlays: { A: ovA, B: ovB } }] },
    })
    expect(flat).toHaveLength(2)
    expect(flat).toContain(ovA)
    expect(flat).toContain(ovB)

    // And chart_props.overlays = props.overlays.concat(mod_ovs). A real
    // extension also carries a Main controller class (the xcontrol mixin
    // instantiates it on mount via `x.Main.__name__`).
    class ExtMain {
      constructor(tv, dc, settings) { this.tv = tv; this.dc = dc; this.settings = settings }
    }
    ExtMain.__name__ = 'ExtMain'
    const { vm } = await mountIb({
      extensions: [{ Main: ExtMain, overlays: { A: ovA, B: ovB } }],
    })
    // Vue wraps the extension objects in reactive proxies, so assert by the
    // flattened set of overlay names rather than by object identity.
    const modNames = vm.mod_ovs.map(o => o.name)
    expect(modNames).toEqual(expect.arrayContaining(['ExtA', 'ExtB']))
    expect(vm.mod_ovs).toHaveLength(2)

    const allNames = vm.chart_props.overlays.map(o => o.name)
    expect(allNames).toEqual(expect.arrayContaining(['ExtA', 'ExtB']))
  })

  // ── Case 8 ────────────────────────────────────────────────────────────────
  test('set_loader(dc) installs onrange that forwards to dc.range_changed with chart.interval (non-ib)', async () => {
    // Non-ib mount: pf = '' so tf = chart.interval (the raw interval_ms here).
    wrapper = mount(TradingVue, {
      props: { data: seedDc(), width: 600, height: 400 },
      attachTo: document.body,
    })
    await settle()
    const vm = wrapper.vm
    const chart = vm.$refs.chart

    expect(vm.chart_props.ib).toBe(false)
    expect(vm.onrange).toBeUndefined()

    const dc = { range_changed: vi.fn() }
    vm.set_loader(dc)

    // onrange now exists and forwards (r, tf=chart.interval).
    expect(typeof vm.onrange).toBe('function')

    const r = [t(0), t(10)]
    vm.onrange(r)

    expect(dc.range_changed).toHaveBeenCalledTimes(1)
    expect(dc.range_changed.mock.calls[0][0]).toBe(r)
    // Non-ib timeframe comes from chart.interval (===interval_ms here).
    expect(dc.range_changed.mock.calls[0][1]).toBe(chart.interval)
    expect(dc.range_changed.mock.calls[0][1]).toBe(TF)
  })
})
