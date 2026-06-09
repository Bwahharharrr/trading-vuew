// @vitest-environment jsdom
//
// Regression guard for the STALE-CANDLE fix (layout.js candle cache key).
//
// The module-level candle cache in src/components/js/layout.js previously keyed
// geometry on range/scale (A/B/px_step) but NOT on candle OHLC. A live
// intra-candle tick that moves only the close WITHIN the existing visible hi/lo
// band leaves range + A/B + px_step identical, so the cache HIT and served stale
// candle pixels — the last candle froze until a pan/zoom changed the range.
//
// This pins the fix by reading the real built candle geometry
// (chartLayout.grids[0].candles) before/after an in-band close move and asserting
// it tracks the live close. Pre-fix this assertion fails (geometry unchanged);
// post-fix it passes.
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { mount, installCanvasEnv, uninstallCanvasEnv, settle } from './_component-harness.js'

function seed() {
  const T0 = 1_600_000_000_000
  // Deliberate price HEADROOM: each bar's high/low straddle the close by ±3, so
  // the close can move several units WITHOUT changing the visible hi/lo (A/B).
  const ohlcv = Array.from({ length: 60 }, (_, i) => {
    const t = T0 + i * 60000
    const base = 100 + Math.sin(i / 5) * 5
    return [t, base, base + 3, base - 3, base + 0.5, 100 + i]
  })
  return new DataCube({ ohlcv })
}

function lastCandleGeom(wrapper) {
  const chart = wrapper.findComponent({ name: 'Chart' })
  const grid0 = chart.vm.chartLayout?.grids?.[0]
  const candles = grid0?.candles
  if (!candles || !candles.length) return null
  return candles[candles.length - 1]
}

describe('candle cache busts on an in-band intra-candle close move', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  test('last candle geometry tracks the live close (range/A/B unchanged)', async () => {
    dc = seed()
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle(6)

    const before = lastCandleGeom(wrapper)
    expect(before, 'expected built candle geometry for grid 0').toBeTruthy()
    const arr = dc.data.chart.data
    const i = arr.length - 1
    const [t, o, h, l, , v] = arr[i]

    // Move ONLY the close, kept strictly inside (l, h) so the visible hi/lo —
    // and therefore the price transform A/B and the OLD cache key — are unchanged.
    const newClose = (h + l) / 2
    expect(newClose).toBeGreaterThan(l)
    expect(newClose).toBeLessThan(h)
    arr[i] = [t, o, h, l, newClose, v]
    dc.touchData()
    await settle(6)

    const after = lastCandleGeom(wrapper)
    expect(after, 'expected rebuilt candle geometry').toBeTruthy()
    // The close pixel (.c) MUST have moved — proving the cache was busted and
    // candles_n_vol recomputed despite identical range/A/B/px_step.
    expect(after.c).not.toBe(before.c)
    // And the raw close in the geometry reflects the live value.
    expect(after.raw[4]).toBe(newClose)
  })
})
