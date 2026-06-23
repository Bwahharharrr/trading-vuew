// Layout math coverage — pure-node exercise of the three layout helpers:
//
//   src/components/js/layout.js      — Layout(): grid-height split
//                                      (grid_hs / weighted_hs / custom_hs) +
//                                      candles_n_vol() cache + gap reset
//   src/components/js/layout_fn.js   — coordinate transforms, magnets, memo caches
//   src/components/js/layout_cnv.js  — layout_cnv/layout_vol new_interval ib-ratio
//
// These are all framework-agnostic math, so they run in node (no jsdom). Layout()
// builds REAL grids via GridMaker; we stub only ctx.measureText (the lone DOM
// touch-point) so the candle/volume geometry & height split are exercised end to
// end. Values below were derived by reading the source and confirmed against a
// live run before being pinned here.

import { test, expect, describe } from 'vitest'
import Layout from '../../src/components/js/layout.js'
import layout_fn from '../../src/components/js/layout_fn.js'
import { layout_cnv, layout_vol } from '../../src/components/js/layout_cnv.js'
import math from '../../src/stuff/math.js'
import TI from '../../src/components/js/ti_mapping.js'
import Const from '../../src/stuff/constants.js'

const CONFIG = Const.ChartConfig
const BOTBAR = CONFIG.BOTBAR // 28
const T0 = 1_600_000_000_000
const INTERVAL = 60_000
const HEIGHT = 400
const TOTAL = HEIGHT - BOTBAR // 372 — the column height Layout splits

function ohlcv(n) {
  return Array.from({ length: n }, (_, i) =>
    [T0 + i * INTERVAL, 100, 103, 97, 101, 100 + i])
}

// Minimal canvas: GridMaker.calc_sidebar() only needs measureText().width.
const stubCtx = () => ({ measureText: (s) => ({ width: s.length * 7 }) })

// Build a full Layout() param bundle. `range` defaults to span the data.
function mkParams(over = {}) {
  const sub = over.sub || ohlcv(50)
  const range = over.range || [sub[0][0], sub[sub.length - 1][0]]
  const offsub = over.offsub || []
  const n = offsub.length + 1
  return {
    chart: over.chart || { grid: {} },
    sub,
    offsub,
    interval: INTERVAL,
    range,
    ctx: stubCtx(),
    layers_meta: Array.from({ length: n }, () => ({})),
    ti_map: { ib: false, tf: INTERVAL, smth2i: (t) => t, i2t: (i) => i, t2i: (t) => t },
    $props: Object.assign(
      { width: 800, height: HEIGHT, config: CONFIG, timezone: 0, interval: INTERVAL },
      over.$props
    ),
    y_transforms: Array.from({ length: n }, () => undefined),
    customGridHeights: over.customGridHeights,
    minimizedGrids: over.minimizedGrids,
  }
}

const sumHeights = (r) => r.grids.reduce((a, g) => a + g.height, 0)

// ───────────────────────────────────────────────────────────────────────────
// CASE 1 — default split
// ───────────────────────────────────────────────────────────────────────────
describe('layout.grid_hs — default sqrt split', () => {
  test('main + N offcharts sum EXACTLY to ($p.height - BOTBAR)', () => {
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    const r = Layout(mkParams({ offsub: [{ data: off, grid: {} }] }))
    expect(r.grids).toHaveLength(2)
    expect(sumHeights(r)).toBe(TOTAL)
  })

  test('offchart px = floor(height*off_h) with off_h=(2*sqrt(n)/7)/n; main=height-px*n', () => {
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    const n = 1
    const off_h = (2 * Math.sqrt(n) / 7) / (n || 1)
    const px = Math.floor(TOTAL * off_h) // floor(372 * 2/7) = 106
    const r = Layout(mkParams({ offsub: [{ data: off, grid: {} }] }))
    expect(r.grids[1].height).toBe(px)
    expect(r.grids[0].height).toBe(TOTAL - px * n)
    // pin the concrete numbers so a formula regression is obvious
    expect(px).toBe(106)
    expect(r.grids[0].height).toBe(266)
  })

  test('two offcharts still sum exactly to TOTAL', () => {
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    const r = Layout(mkParams({ offsub: [{ data: off, grid: {} }, { data: off, grid: {} }] }))
    expect(r.grids).toHaveLength(3)
    expect(sumHeights(r)).toBe(TOTAL)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CASE 2 — weighted_hs
// ───────────────────────────────────────────────────────────────────────────
describe('layout.weighted_hs — height-weight split', () => {
  test('mgrid.height=3 + offsub grid.height=1 -> ~3:1 summing exactly', () => {
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    const r = Layout(mkParams({
      chart: { grid: { height: 3 } },
      offsub: [{ data: off, grid: { height: 1 } }],
    }))
    // floor(3/4*372)=279, floor(1/4*372)=93 → already 372 (no remainder)
    expect(r.grids[0].height).toBe(279)
    expect(r.grids[1].height).toBe(93)
    expect(sumHeights(r)).toBe(TOTAL)
    // ratio is ~3:1
    expect(r.grids[0].height / r.grids[1].height).toBeCloseTo(3, 1)
  })

  test('missing grid.height defaults each weight to 1 (two equal -> ~50/50)', () => {
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    // mgrid.height set (forces weighted path); offsub omits height → weight 1
    const r = Layout(mkParams({
      chart: { grid: { height: 1 } },
      offsub: [{ data: off, grid: {} }],
    }))
    // floor(1/2*372)=186 each → 372 exactly
    expect(r.grids[0].height).toBe(186)
    expect(r.grids[1].height).toBe(186)
    expect(sumHeights(r)).toBe(TOTAL)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CASE 3 — custom_hs
// ───────────────────────────────────────────────────────────────────────────
describe('layout.custom_hs — explicit pixel heights', () => {
  test('customGridHeights used verbatim; shortfall absorbed by hs[0]; fills exactly', () => {
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    const r = Layout(mkParams({
      offsub: [{ data: off, grid: {} }],
      customGridHeights: { 0: 260, 1: 190 },
    }))
    // both verbatim → 260+190=450, but column is 372: hs[0] absorbs (372-450)
    expect(r.grids[1].height).toBe(190) // offchart verbatim
    expect(r.grids[0].height).toBe(TOTAL - 190) // 182, absorbs the shortfall
    expect(sumHeights(r)).toBe(TOTAL)
  })

  test('a minimized grid gets MINIMIZED_HEIGHT(28) regardless of saved height', () => {
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    const r = Layout(mkParams({
      offsub: [{ data: off, grid: {} }],
      minimizedGrids: { 1: true },
      customGridHeights: { 1: 300 }, // saved height is ignored when minimized
    }))
    expect(r.grids[1].height).toBe(28)
    // main grid absorbs the rest so the column still fills exactly
    expect(r.grids[0].height).toBe(TOTAL - 28)
    expect(sumHeights(r)).toBe(TOTAL)
  })

  test('null slots split remaining evenly via floor(remaining/nullCount)', () => {
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    // 3 grids; only grid 1 fixed → grids 0 & 2 are null slots
    const r = Layout(mkParams({
      offsub: [{ data: off, grid: {} }, { data: off, grid: {} }],
      customGridHeights: { 1: 100 },
    }))
    // usedHeight=100, nullCount=2, remaining=272 → default=floor(272/2)=136
    expect(r.grids[1].height).toBe(100)
    expect(r.grids[0].height).toBe(136)
    expect(r.grids[2].height).toBe(136)
    expect(sumHeights(r)).toBe(TOTAL)
  })

  test('no div-by-zero when nullCount=0 (every slot fixed)', () => {
    // 2 grids both fixed → nullCount=0, the floor(remaining/0) branch is skipped
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    expect(() =>
      Layout(mkParams({
        offsub: [{ data: off, grid: {} }],
        customGridHeights: { 0: 200, 1: 172 }, // sums to exactly TOTAL
      }))
    ).not.toThrow()
    const r = Layout(mkParams({
      offsub: [{ data: off, grid: {} }],
      customGridHeights: { 0: 200, 1: 172 },
    }))
    // total already === TOTAL, so no absorb adjustment either
    expect(r.grids[0].height).toBe(200)
    expect(r.grids[1].height).toBe(172)
    expect(sumHeights(r)).toBe(TOTAL)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CASE 4 — candles_n_vol cache / gap / early-return
// ───────────────────────────────────────────────────────────────────────────
describe('layout.candles_n_vol — cache, gap reset, early return', () => {
  test('cache HIT: identical inputs serve the SAME candles/volume object identity', () => {
    // Two back-to-back identical builds; the module-level cache must serve the
    // exact same array reference on the second call.
    const r1 = Layout(mkParams())
    const c1 = r1.grids[0].candles
    const v1 = r1.grids[0].volume
    const r2 = Layout(mkParams())
    expect(r2.grids[0].candles).toBe(c1) // same object
    expect(r2.grids[0].volume).toBe(v1)

    // A changed range busts the key → a fresh array (NOT the cached one).
    const r3 = Layout(mkParams({ range: [T0, T0 + 49 * INTERVAL + 30_000] }))
    expect(r3.grids[0].candles).not.toBe(c1)
  })

  test('a time gap (delta>interval) resets prev so the gapped volume bar starts at floor(mid - hf_px_step)', () => {
    const sub = ohlcv(10)
    // open a > interval gap before index 5
    for (let i = 5; i < sub.length; i++) sub[i][0] += 10 * INTERVAL
    const range = [sub[0][0], sub[sub.length - 1][0]]
    const r = Layout(mkParams({ sub, range }))
    const g = r.grids[0]
    const hf = g.px_step * 0.5
    const mid5 = g.t2screen(sub[5][0]) + 0.5
    // gapped bar: prev was reset to null → x1 = floor(mid - hf_px_step)
    expect(g.volume[5].x1).toBe(Math.floor(mid5 - hf))
    // a NON-gapped, mid-series bar instead inherits prev (x2 + splitter), which
    // carries the +0.5 sub-pixel offset → not an integer
    expect(Number.isInteger(g.volume[3].x1)).toBe(false)
  })

  test('sub.length<2 returns early leaving candles/volume [] (and A/px_step unset)', () => {
    const r = Layout(mkParams({ sub: ohlcv(1) }))
    const g = r.grids[0]
    expect(g.candles).toEqual([])
    expect(g.volume).toEqual([])
    // calc_positions bails for <2 bars, so the transform params never get set
    expect(g.A).toBeUndefined()
    expect(g.px_step).toBeUndefined()
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CASE 5 — layout_fn transforms (linear / log / ib)
// ───────────────────────────────────────────────────────────────────────────
describe('layout_fn — coordinate transforms', () => {
  function linSelf(over = {}) {
    return Object.assign(
      { spacex: 700, A: -10, B: 5000, grid: { logScale: false }, ti_map: { ib: false } },
      over
    )
  }

  test('t2screen / screen2t are inverses on the linear path', () => {
    const range = [1000, 2000]
    const self = layout_fn(linSelf(), range)
    const x = self.t2screen(1500)
    // t2screen floors and shifts -0.5; adding 0.5 back recovers the exact t
    expect(self.screen2t(x + 0.5)).toBeCloseTo(1500, 6)
  })

  test('$2screen / screen2$ round-trip on the linear path', () => {
    const self = layout_fn(linSelf(), [1000, 2000])
    const y = self.$2screen(123)
    expect(self.screen2$(y + 0.5)).toBeCloseTo(123, 6)
  })

  test('logScale round-trips a positive price via symmetrical log/exp', () => {
    const self = layout_fn(linSelf({ grid: { logScale: true } }), [1000, 2000])
    const price = 250
    // Feed the un-floored screen value so we isolate the log/exp inversion
    // (the public $2screen floors, which would inject a 1px quantization error).
    const yExact = math.log(price) * self.A + self.B
    expect(self.screen2$(yExact)).toBeCloseTo(price, 6)
    // and the underlying symmetrical pair is self-inverse for a positive price
    expect(math.exp(math.log(price))).toBeCloseTo(price, 6)
  })

  test('ib path runs the timestamp through smth2i before the linear transform (t2screen & t_magnet)', () => {
    const ti = new TI()
    const TF = 60_000
    const SUB = [[0], [TF], [2 * TF], [10 * TF]].map((r, i) => [r[0], i])
    ti.init({ meta: { sub_start: 0 }, interval_ms: TF, sub_start: 0, ib: true }, SUB)

    const candles = SUB.map((r) => ({ x: ti.t2i(r[0]) * 10, raw: [r[0]] }))
    const self = { spacex: 100, A: -1, B: 0, grid: {}, ti_map: ti, candles }
    const range = [0, 3]
    layout_fn(self, range)

    // big > MAX_ARR(2^32) → smth2i treats it as time and maps through t2i
    const big = Math.pow(2, 32) + 2 * TF
    const r = self.spacex / (range[1] - range[0]) // px/index ratio
    const expected = Math.floor((ti.smth2i(big) - range[0]) * r) - 0.5
    expect(self.t2screen(big)).toBe(expected)
    // t_magnet likewise pre-maps through smth2i (small index passes straight
    // through; nearest candle is index 0 here)
    expect(self.t_magnet(0)).toBe(Math.floor(candles[0].x) - 0.5)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CASE 6 — magnets + magnet cache
// ───────────────────────────────────────────────────────────────────────────
describe('layout_fn — magnets', () => {
  const mkCandles = () => [
    { x: 10.7, raw: [100] },
    { x: 20.3, raw: [200] },
    { x: 30.9, raw: [300] },
  ]

  test('t_magnet returns floor(candle.x)-0.5 for the nearest candle', () => {
    const candles = mkCandles()
    const self = { spacex: 100, A: -1, B: 0, grid: {}, ti_map: { ib: false }, candles }
    layout_fn(self, [0, 1000])
    expect(self.t_magnet(210)).toBe(Math.floor(20.3) - 0.5) // 19.5
  })

  test('t_magnet returns undefined when the nearest index has no candle', () => {
    const cn = [{ x: 10, raw: [100] }, { x: 20, raw: [200] }]
    const self = { spacex: 100, A: -1, B: 0, grid: {}, ti_map: { ib: false }, candles: cn }
    layout_fn(self, [0, 1000])
    self.t_magnet(100) // primes magnetTs from raw[0] = [100, 200]
    cn[1] = undefined // nearest-to-200 slot is now a hole
    expect(self.t_magnet(200)).toBeUndefined()
  })

  test('c_magnet / c_magnet_i return the nearest candle/index via Utils.nearest_a', () => {
    const candles = mkCandles()
    const self = { spacex: 100, A: -1, B: 0, grid: {}, ti_map: { ib: false }, candles }
    layout_fn(self, [0, 1000])
    expect(self.c_magnet(210)).toBe(candles[1])
    expect(self.c_magnet_i(210)).toBe(1)
  })

  test('magnet cache reuses magnetTs for the same candles array and rebuilds on a new reference', () => {
    const c1 = [{ x: 10, raw: [100] }, { x: 20, raw: [200] }, { x: 30, raw: [300] }]
    const self = { spacex: 100, A: -1, B: 0, grid: {}, ti_map: { ib: false }, candles: c1 }
    layout_fn(self, [0, 1000])
    expect(self.c_magnet_i(300)).toBe(2) // builds magnetTs = [100,200,300]

    // Mutate a raw timestamp WITHOUT swapping the array reference: because the
    // ts array is cached against array identity, the stale [100,200,300] is
    // reused → 999999's nearest is still the cached index 2.
    c1[2].raw[0] = 999_999
    expect(self.c_magnet_i(999_999)).toBe(2)

    // Swap the candles array to a NEW reference → cache rebuilds from the new raw.
    const c2 = [{ x: 40, raw: [400] }, { x: 50, raw: [500] }]
    self.candles = c2
    expect(self.c_magnet(400)).toBe(c2[0])
    expect(self.c_magnet_i(500)).toBe(1)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CASE 7 — memoization cap / clear / master fallback
// ───────────────────────────────────────────────────────────────────────────
describe('layout_fn — memoization & caches', () => {
  test('>2000 distinct t values still return correct results past MAX_CACHE_SIZE', () => {
    const self = { spacex: 2000, A: -1, B: 0, grid: {}, ti_map: { ib: false }, candles: [{ x: 0, raw: [0] }] }
    layout_fn(self, [0, 5000])
    const r = self.spacex / 5000 // 0.4
    for (let i = 0; i < 2500; i++) self.t2screen(i) // overflow the 2000-entry cap
    // an entry that was never cacheable (size limit hit) still computes correctly
    expect(self.t2screen(2499)).toBe(Math.floor(2499 * r) - 0.5)
  })

  test('clearCoordCaches empties all three memo maps; a later transform recomputes', () => {
    const self = { spacex: 1000, A: -2, B: 100, grid: { logScale: false }, ti_map: { ib: false } }
    layout_fn(self, [0, 1000])
    const t = self.t2screen(500)
    const d = self.$2screen(40)
    const s = self.screen2$(10)
    self.clearCoordCaches()
    // recompute after clearing — values are deterministic, so they match again
    expect(self.t2screen(500)).toBe(t)
    expect(self.$2screen(40)).toBe(d)
    expect(self.screen2$(10)).toBe(s)
  })

  test('falls back to self.master_grid.candles when self.candles absent', () => {
    const self = {
      spacex: 100, A: -1, B: 0, grid: {}, ti_map: { ib: false },
      master_grid: { candles: [{ x: 5, raw: [50] }] },
    }
    layout_fn(self, [0, 5000])
    expect(self.c_magnet(50)).toBe(self.master_grid.candles[0])
    expect(self.c_magnet_i(50)).toBe(0)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CASE 8 — layout_cnv / layout_vol new_interval ib-ratio + gap reset
// ───────────────────────────────────────────────────────────────────────────
describe('layout_cnv / layout_vol — new_interval ib-ratio & gap reset', () => {
  const SUB = [
    [0, 10, 12, 9, 11, 100],
    [60, 11, 14, 10, 13, 200],
    [120, 13, 13, 8, 9, 50],
  ]
  function mkSelf(over = {}) {
    const layout = Object.assign(
      {
        t2screen: (t) => (t / 60) * 10,
        $2screen: ($) => 400 - $ * 10,
        px_step: 10, A: 10, B: 0, height: 400,
        ti_map: { ib: false, tf: 60 },
      },
      over.layout
    )
    return {
      $props: Object.assign(
        { data: over.data || SUB, layout, config: { VOLSCALE: 0.3, CANDLEW: 0.6 }, tf: 60, interval: 60, grid_id: 0 },
        over.$props
      ),
    }
  }

  test('ib=true with $p.tf: ratio=$p.tf/ti_map.tf; px_step2=layout.px_step*ratio; candle x=t2screen+1, w=px_step*CANDLEW*ratio', () => {
    const self = mkSelf({ layout: { ti_map: { ib: true, tf: 30 } }, $props: { tf: 120 } })
    const { candles } = layout_cnv(self)
    const ratio = 120 / 30 // 4
    const layout = self.$props.layout
    expect(candles[0].x).toBe(layout.t2screen(0) + 1) // 1
    expect(candles[0].w).toBe(layout.px_step * 0.6 * ratio) // 10*0.6*4 = 24
  })

  test('ib=true with no $p.tf falls back to $p.interval; ratio=interval2/$p.interval (=1)', () => {
    const self = mkSelf({ layout: { ti_map: { ib: true, tf: 30 } }, $props: { tf: undefined, interval: 60 } })
    const { candles, volume } = layout_cnv(self)
    // interval2 = $p.interval = 60; ratio = 60/60 = 1 → w = 10*0.6*1 = 6
    expect(candles[0].w).toBeCloseTo(6, 6)
    expect(volume).toHaveLength(3)
  })

  test('a time-gap row resets prev in both layout_cnv and layout_vol (ib path)', () => {
    // ib=true, tf=30, ti_map.tf=30 → ratio=1, interval2=ratio=1 → gap 1→100 trips reset
    const sub = [
      [0, 10, 12, 9, 11, 100],
      [1, 11, 14, 10, 13, 200],
      [100, 13, 13, 8, 9, 50],
    ]
    const self = mkSelf({ data: sub, layout: { ti_map: { ib: true, tf: 30 } }, $props: { tf: 30 } })
    const layout = self.$props.layout
    const px_step2 = layout.px_step * 1 // ratio = 30/30 = 1
    const mid2 = layout.t2screen(sub[2][0]) + 1
    const expectedX1 = Math.floor(mid2 - px_step2 * 0.5)

    const { volume } = layout_cnv(self)
    expect(volume[2].x1).toBe(expectedX1)

    const vol = layout_vol(self)
    expect(vol[2].x1).toBe(expectedX1)
  })
})
