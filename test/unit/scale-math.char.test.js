// Scale-math CHARACTERIZATION — the Phase-0 baseline for the scale-engine spine.
//
// Locks the EXACT numeric outputs of a REAL Layout-built grid's coordinate scales
// (price→y, time→x, their inverses) and candles_n_vol geometry for a fixed
// range+data. The scale-engine migration (tasks/render-architecture-plan.md)
// extracts these computations into first-class TimeScale/PriceScale objects
// (Phase 1) and later translates instead of rebuilding them (Phase 3) — every
// phase MUST reproduce these values byte-for-byte. A change here is a real
// arithmetic regression, not a test to update.
//
// Values were captured from a live run of the current code (the same harness
// layout-math-coverage.test.js uses: real Layout + GridMaker, stubbed measureText).
import { test, expect, describe } from 'vitest'
import Layout from '../../src/components/js/layout.js'
import Const from '../../src/stuff/constants.js'

const CONFIG = Const.ChartConfig
const T0 = 1_600_000_000_000
const INT = 60_000
const HEIGHT = 400

// 50 bars, DISTINCT o/h/l/c per bar so each maps to a distinct pixel.
const SUB = Array.from({ length: 50 }, (_, i) => [T0 + i * INT, 100 + i, 100 + i + 3, 100 + i - 2, 100 + i + 1, 100 + i * 2])
const RANGE = [SUB[0][0], SUB[49][0]]
const stubCtx = () => ({ measureText: (s) => ({ width: s.length * 7 }) })

function mkLayout(over = {}) {
  const sub = over.sub || SUB
  const range = over.range || [sub[0][0], sub[sub.length - 1][0]]
  return Layout({
    chart: { grid: {} }, sub, offsub: [], interval: INT, range, ctx: stubCtx(),
    layers_meta: [{}],
    ti_map: { ib: false, tf: INT, smth2i: (t) => t, i2t: (i) => i, t2i: (t) => t },
    $props: { width: 800, height: HEIGHT, config: CONFIG, timezone: 0, interval: INT },
    y_transforms: [undefined],
  })
}
const mainGrid = (over) => mkLayout(over).grids[0]

describe('scale-math char — PriceScale (price↔y)', () => {
  const g = mainGrid()
  test('A / B (the y = price*A + B transform params) are pinned exactly', () => {
    expect(g.A).toBe(-5.2991452991453)
    expect(g.B).toBe(848.3931623931625)
  })
  test('$2screen(price) = floor(price*A + B) - 0.5 — exact pixels', () => {
    expect(g.$2screen(100)).toBe(317.5)
    expect(g.$2screen(125)).toBe(185.5)
    expect(g.$2screen(150)).toBe(52.5)
  })
  test('screen2$(y) inverts the price map — exact', () => {
    expect(g.screen2$(0)).toBe(160.1)
    expect(g.screen2$(200)).toBe(122.35806451612903)
    // round-trip: feed the un-floored y back (the public $2screen floors -0.5)
    expect(g.screen2$(100 * g.A + g.B)).toBeCloseTo(100, 9)
  })
})

describe('scale-math char — TimeScale (time↔x)', () => {
  const g = mainGrid()
  test('px_step / spacex / startx pinned exactly', () => {
    expect(g.px_step).toBe(14.89795918367347)
    expect(g.spacex).toBe(730)
    expect(g.startx).toBe(0)
  })
  test('t2screen(t) = floor((t-range0)*r) - 0.5 — exact at first / mid / last', () => {
    expect(g.t2screen(RANGE[0])).toBe(-0.5)
    expect(g.t2screen(T0 + 25 * INT)).toBe(371.5)
    expect(g.t2screen(RANGE[1])).toBe(729.5)
  })
  test('screen2t inverts the time map to within one bar (the t2screen floor is lossy by ~1px)', () => {
    const t = T0 + 25 * INT
    const x = g.t2screen(t)
    // t2screen floors to a pixel (≈1px ≈ INT/px_step ms of resolution), so the
    // inverse recovers t to within a bar — the exact forward values above are the
    // byte-level anchor; this just pins that screen2t is the inverse direction.
    expect(Math.abs(g.screen2t(x + 0.5) - t)).toBeLessThan(INT)
  })
})

describe('scale-math char — candles_n_vol geometry', () => {
  const g = mainGrid()
  test('candle count matches the visible sub', () => {
    expect(g.candles).toHaveLength(50)
  })
  test('candle[0] / [25] / [49] field values are pinned exactly (x,o,h,l,c,w)', () => {
    const pick = (c) => ({ x: c.x, o: c.o, h: c.h, l: c.l, c: c.c, w: c.w })
    expect(pick(g.candles[0])).toEqual({ x: 0, o: 318, h: 302, l: 329, c: 313, w: 8.938775510204081 })
    expect(pick(g.candles[25])).toEqual({ x: 372, o: 186, h: 170, l: 196, c: 180, w: 8.938775510204081 })
    expect(pick(g.candles[49])).toEqual({ x: 730, o: 58, h: 42, l: 69, c: 53, w: 8.938775510204081 })
  })
  test('volume[0] geometry is pinned exactly', () => {
    const v = g.volume[0]
    expect({ x1: v.x1, x2: v.x2, h: v.h, green: v.green })
      .toEqual({ x1: -8, x2: 6.5, h: 30.303030303030305, green: true })
  })
})

describe('scale-math char — layout REBUILD baseline (build-count proxy)', () => {
  // Today EVERY range change rebuilds the full candle/volume geometry; an
  // identical rebuild is served from the module cache (same array identity).
  // This pins the current behaviour the scheduler/reposition phases optimize:
  // Phase 1/3 must keep these OUTPUT values identical; Phase 3 changes the build
  // PATH (reposition) but candle/volume field values stay byte-identical.
  test('identical rebuild reuses the cached geometry array (cache HIT)', () => {
    const a = mainGrid().candles
    const b = mainGrid().candles
    expect(b).toBe(a)   // same object reference → no rebuild
  })
  test('a range change busts the cache → a fresh geometry array (full rebuild)', () => {
    const a = mainGrid().candles
    const c = mainGrid({ range: [RANGE[0], RANGE[1] + 30_000] }).candles
    expect(c).not.toBe(a)   // current model: pan/zoom == full rebuild
  })

  test('BUILD-COUNT baseline: a pan burst of K distinct ranges does K full rebuilds (no coalescing today)', () => {
    // Simulated pan: each frame nudges range0+range1 by one step (width constant).
    // Today every distinct range produces its OWN fresh geometry build — nothing
    // is reused across the burst. Phase 3 (Reposition) must SHRINK this rebuild
    // count while keeping the per-frame OUTPUT values byte-identical to the char
    // assertions above. This pins the "rebuild the world every frame" baseline.
    const K = 5
    const builds = new Set()
    for (let k = 0; k < K; k++) {
      const r = [RANGE[0] + k * 5000, RANGE[1] + k * 5000]
      builds.add(mainGrid({ range: r }).candles)   // distinct object ⇒ a real rebuild
    }
    expect(builds.size).toBe(K)   // K rebuilds, zero reuse — the cost Phase 3 attacks
  })
})
