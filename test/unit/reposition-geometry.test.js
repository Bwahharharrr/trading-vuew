// Phase-3 Reposition fast path — GEOMETRY EQUIVALENCE + decision seam.
//
// The candle pixel golden (test/visual/candles.visual.test.js) covers the draw
// PRIMITIVES, not the Layout/Reposition geometry, and the indicator pane has NO
// rasterised guard (plan §2.4). So the Reposition reuse is pinned here by GEOMETRY
// EQUALITY: the candle geometry built via the reuse fast path (kept-bar y copied,
// x recomputed with the identical floor formula) must be BYTE-FOR-BYTE the same as
// a full from-scratch rebuild of the same panned range. Plus:
//   - the LAST visible bar is always rebuilt (live intra-candle tick term),
//   - membership churn > 5% escalates to a full rebuild (still byte-identical),
//   - REPOSITION_FAST rollback forces the full path,
//   - priceScale.recompute reproduces GridMaker's A/B byte-for-byte,
//   - repositionPass returns the right eligibility verdict.
import { test, expect, describe, beforeEach } from 'vitest'
import Layout from '../../src/components/js/layout.js'
import GridMaker from '../../src/components/js/grid_maker.js'
import { createPriceScale } from '../../src/render/scales/price-scale.js'
import { layout_cnv, layout_cnv_cached } from '../../src/components/js/layout_cnv.js'
import ChartRange from '../../src/mixins/chart/chart-range.js'
import Const from '../../src/stuff/constants.js'

const CONFIG = Const.ChartConfig
const T0 = 1_600_000_000_000
const INT = 60_000
const HEIGHT = 400
const stubCtx = () => ({ measureText: (s) => ({ width: s.length * 7 }) })

// A long OHLCV series whose HIGH and LOW bands are CONSTANT across every bar, so
// any contiguous window has the same hi/lo → the price transform (A,B) stays
// stable as the window pans (the precondition the reuse path needs). open/close/
// volume vary per bar so candle bodies + volume are still distinct.
const BASE_HI = 110
const BASE_LO = 90
function mkBig(n) {
  return Array.from({ length: n }, (_, i) => {
    const o = 100 + Math.sin(i / 7) * 8
    const c = 100 + Math.cos(i / 5) * 8
    return [T0 + i * INT, o, BASE_HI, BASE_LO, c, 1000 + (i % 13) * 50]
  })
}
const BIG = mkBig(400)

function windowOf(start, len) {
  return BIG.slice(start, start + len)
}

// Build a real Layout's master grid for a given visible window.
function buildGrid(sub) {
  const range = [sub[0][0], sub[sub.length - 1][0]]
  return Layout({
    chart: { grid: {} }, sub, offsub: [], interval: INT, range, ctx: stubCtx(),
    layers_meta: [{}],
    ti_map: { ib: false, tf: INT, smth2i: (t) => t, i2t: (i) => i, t2i: (t) => t },
    $props: { width: 800, height: HEIGHT, config: CONFIG, timezone: 0, interval: INT },
    y_transforms: [undefined],
  }).grids[0]
}

// Poison the module candle cache so the NEXT build of `sub` cannot reuse — by
// building an UNRELATED window at a DIFFERENT height (different A/B/px_step ⇒
// reuse guard misses). Returns a guaranteed full from-scratch rebuild of `sub`.
function fullBuild(sub) {
  Layout({
    chart: { grid: {} }, sub: windowOf(0, 50), offsub: [], interval: INT,
    range: [BIG[0][0], BIG[49][0]], ctx: stubCtx(), layers_meta: [{}],
    ti_map: { ib: false, tf: INT, smth2i: (t) => t, i2t: (i) => i, t2i: (t) => t },
    $props: { width: 800, height: 333, config: CONFIG, timezone: 0, interval: INT },
    y_transforms: [undefined],
  })
  return buildGrid(sub)
}

function candleFields(c) {
  return { x: c.x, w: c.w, o: c.o, h: c.h, l: c.l, c: c.c, z: c.z, raw: c.raw }
}
function volFields(v) {
  return { x1: v.x1, x2: v.x2, h: v.h, green: v.green, z: v.z, raw: v.raw }
}

describe('Reposition reuse — candle geometry is byte-identical to a full rebuild', () => {
  const WIN = 100

  test('a small pan REUSES kept-bar geometry yet matches a full rebuild field-for-field', () => {
    // Seed the cache with window @start=0, then pan by 2 bars (2% churn ⇒ reuse).
    const seeded = buildGrid(windowOf(0, WIN)).candles
    // Tag a cached kept-bar so we can PROVE the panned build copied from cache.
    const keptRaw = BIG[5]
    const seededKept = seeded.find((c) => c.raw === keptRaw)
    seededKept.__reuseSentinel = 'copied-from-cache'

    const panned = buildGrid(windowOf(2, WIN)).candles
    const reference = fullBuild(windowOf(2, WIN)).candles

    // The reuse path engaged: the panned kept-bar carries the sentinel (it was
    // spread-copied from the cached candle) but is a DISTINCT object.
    const pannedKept = panned.find((c) => c.raw === keptRaw)
    expect(pannedKept.__reuseSentinel).toBe('copied-from-cache')
    expect(pannedKept).not.toBe(seededKept)

    // …and the FULL reference does NOT carry the sentinel (proves it rebuilt).
    const refKept = reference.find((c) => c.raw === keptRaw)
    expect(refKept.__reuseSentinel).toBeUndefined()

    // BYTE-IDENTICAL geometry: every candle field equals the full rebuild.
    expect(panned.length).toBe(reference.length)
    for (let i = 0; i < panned.length; i++) {
      expect(candleFields(panned[i])).toEqual(candleFields(reference[i]))
    }
  })

  test('volume geometry also matches a full rebuild (volume is never reused)', () => {
    buildGrid(windowOf(0, WIN))
    const panned = buildGrid(windowOf(3, WIN)).volume
    const reference = fullBuild(windowOf(3, WIN)).volume
    expect(panned.length).toBe(reference.length)
    for (let i = 0; i < panned.length; i++) {
      expect(volFields(panned[i])).toEqual(volFields(reference[i]))
    }
  })

  test('the LAST visible bar is ALWAYS rebuilt (live intra-candle tick term)', () => {
    // Copied rows so the in-place tick mutation stays local to this test.
    const sub = windowOf(0, WIN).map((r) => r.slice())
    const seeded = buildGrid(sub).candles
    const seededLast = seeded[seeded.length - 1]
    seededLast.__reuseSentinel = 'stale-last'
    const beforeC = seededLast.c
    // Live in-band tick: move ONLY the last bar's close, kept inside [lo, hi].
    sub[sub.length - 1][4] = 100
    const rebuilt = buildGrid(sub).candles
    const rebuiltLast = rebuilt[rebuilt.length - 1]
    // The last bar was rebuilt from scratch (no sentinel) and tracks the new close
    // (the cache key's last-bar term busted; the reuse loop excludes the last bar).
    expect(rebuiltLast.__reuseSentinel).toBeUndefined()
    expect(rebuiltLast.c).not.toBe(beforeC)
    // And it equals a guaranteed full rebuild byte-for-byte.
    const reference = fullBuild(sub).candles
    expect(candleFields(rebuiltLast)).toEqual(candleFields(reference[reference.length - 1]))
  })

  test('membership churn > 5% escalates to a full rebuild (still byte-identical)', () => {
    // Seed @0, then pan by 12 bars (12% churn on a 100-bar window) → reuse gate
    // fails → full rebuild. Output must still equal the from-scratch reference.
    const seeded = buildGrid(windowOf(0, WIN)).candles
    const stillKept = BIG[40] // present in both windows
    seeded.find((c) => c.raw === stillKept).__reuseSentinel = 'should-not-copy'

    const jumped = buildGrid(windowOf(12, WIN)).candles
    const reference = fullBuild(windowOf(12, WIN)).candles

    // Reuse did NOT engage (churn too high): the kept bar was rebuilt, no sentinel.
    const jumpedKept = jumped.find((c) => c.raw === stillKept)
    expect(jumpedKept.__reuseSentinel).toBeUndefined()

    expect(jumped.length).toBe(reference.length)
    for (let i = 0; i < jumped.length; i++) {
      expect(candleFields(jumped[i])).toEqual(candleFields(reference[i]))
    }
  })
})

describe('priceScale.recompute reproduces GridMaker A/B byte-for-byte', () => {
  const stub = () => ({ measureText: (s) => ({ width: s.length * 7 }) })
  function gmGrid(sub) {
    return new GridMaker(0, {
      sub, interval: INT, range: [sub[0][0], sub[sub.length - 1][0]], ctx: stub(),
      $p: { width: 800, config: CONFIG }, layers_meta: [{}], height: HEIGHT,
      y_t: undefined, ti_map: { ib: false, tf: INT, i2t: (i) => i, smth2i: (t) => t },
      grid: {}, timezone: 0,
    }).create()
  }

  test('matches the real GridMaker linear-auto A/B exactly', () => {
    const sub = windowOf(0, 60)
    const grid = gmGrid(sub)
    const ps = createPriceScale({ A: 0, B: 0, height: HEIGHT, logScale: false })
    const out = ps.recompute(sub, CONFIG.EXPAND)
    expect(out).not.toBeNull()
    expect(out.A).toBe(grid.A)
    expect(out.B).toBe(grid.B)
    // `changed` is true here because the scale was seeded with A/B = 0/0.
    expect(out.changed).toBe(true)
    // Seeded with the SAME A/B → reports unchanged (the pan stability signal).
    const ps2 = createPriceScale({ A: grid.A, B: grid.B, height: HEIGHT, logScale: false })
    expect(ps2.recompute(sub, CONFIG.EXPAND).changed).toBe(false)
  })

  test('returns null for log scale (caller escalates to Full)', () => {
    const ps = createPriceScale({ A: 1, B: 0, height: HEIGHT, logScale: true })
    expect(ps.recompute(windowOf(0, 60), CONFIG.EXPAND)).toBeNull()
  })

  test('a window with a DIFFERENT price band reports changed (A/B move)', () => {
    const grid0 = gmGrid(windowOf(0, 60))
    // A window whose highs/lows differ → different A/B.
    const taller = windowOf(0, 60).map((r, i) =>
      [r[0], r[1], i === 0 ? 200 : r[2], i === 0 ? 10 : r[3], r[4], r[5]])
    const ps = createPriceScale({ A: grid0.A, B: grid0.B, height: HEIGHT, logScale: false })
    expect(ps.recompute(taller, CONFIG.EXPAND).changed).toBe(true)
  })
})

describe('indicator-pane (layout_cnv) — version-keyed cache (plan §1#2 / §2.4)', () => {
  // The indicator pane has NO rasterised golden, so its geometry + cache are
  // pinned by equality. Here: the sub-pane cache is now wired to the scale-engine
  // VERSIONS, so a scale version bump (a future in-place Reposition) busts it even
  // if the A/B/px_step NUMBERS were re-derived to the same values.
  function mkIndicatorSelf(scaleVersion) {
    const sub = Array.from({ length: 6 }, (_, i) =>
      [T0 + i * INT, 100 + i, 105 + i, 95 + i, 101 + i, 1000 + i])
    return {
      $props: {
        data: sub,
        config: { VOLSCALE: 0.3, CANDLEW: 0.7 },
        tf: null, interval: INT, grid_id: 1,
        layout: {
          A: 2, B: 100, px_step: 12, height: 300,
          ti_map: { ib: false, tf: INT },
          t2screen: (t) => Math.floor(((t - T0) / INT) * 12) - 0.5,
          // Scale-engine spine objects carrying a controllable version.
          timeScale: { version: scaleVersion },
          priceScale: { version: scaleVersion },
        },
      },
    }
  }

  test('a scale VERSION bump busts the sub-pane cache (re-derives geometry)', () => {
    const cache = { key: '', val: null }
    const self0 = mkIndicatorSelf(0)
    const a = layout_cnv_cached(self0, cache)
    const b = layout_cnv_cached(self0, cache)
    expect(b).toBe(a) // unchanged version → cache HIT

    // Same A/B/px_step/anchors, but the scale version moved → must recompute.
    const self1 = mkIndicatorSelf(1)
    const c = layout_cnv_cached(self1, cache)
    expect(c).not.toBe(a)
    // …and the re-derived geometry is byte-identical to the uncached builder.
    expect(c).toEqual(layout_cnv(self1))
  })
})

describe('repositionPass — eligibility decision', () => {
  const reposition = ChartRange.methods.repositionPass

  function fakeChart(over = {}) {
    const sub = windowOf(0, 60)
    const grid = createPriceScale({
      A: -20, B: 2200, height: HEIGHT, logScale: false,
    })
    // Recompute what A/B SUB yields so we can make the prev scale match (pan) or
    // not (zoom) deterministically.
    const stable = grid.recompute(sub, CONFIG.EXPAND)
    return Object.assign({
      offsub: [],
      $props: { config: CONFIG },
      chartLayout: {
        grids: [{
          grid: { logScale: false },
          priceScale: createPriceScale({
            A: stable.A, B: stable.B, height: HEIGHT, logScale: false,
          }),
        }],
      },
    }, over)
  }

  test('a pure pan (A/B stable, no offcharts) is eligible → true', () => {
    const self = fakeChart()
    expect(reposition.call(self, windowOf(0, 60))).toBe(true)
  })

  test('offcharts present → escalate (false)', () => {
    const self = fakeChart({ offsub: [{ data: [] }] })
    expect(reposition.call(self, windowOf(0, 60))).toBe(false)
  })

  test('a price-band move (zoom/scale change) → escalate (false)', () => {
    const self = fakeChart()
    const taller = windowOf(0, 60).map((r, i) =>
      [r[0], r[1], i === 0 ? 999 : r[2], i === 0 ? 1 : r[3], r[4], r[5]])
    expect(reposition.call(self, taller)).toBe(false)
  })

  test('no prior layout → false (first build is always Full)', () => {
    const self = fakeChart({ chartLayout: null })
    expect(reposition.call(self, windowOf(0, 60))).toBe(false)
  })

  test('log scale → false', () => {
    const self = fakeChart()
    self.chartLayout.grids[0].grid.logScale = true
    expect(reposition.call(self, windowOf(0, 60))).toBe(false)
  })
})
