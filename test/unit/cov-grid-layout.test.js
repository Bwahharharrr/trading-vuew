// @vitest-environment jsdom
//
// Coverage push — grid-layout cluster:
//
//   src/components/js/grid_maker.js  — the layout/scale-math factory. Built with
//        a (sub, range, ctx, $p, grid, ...) bundle exactly the way layout.js
//        constructs it, then .create()d to drive ALL of the previously-uncovered
//        math: log-scale grid (grid_y_log / dollar_mult / search_start_* /
//        log_rounder), the YEAR/MONTH/DAY x-grid ranks, extend_left/right,
//        y_range_fn (main + offchart, exp=false), fixed-range & collapsed-range
//        branches, the precision schemes and the empty/single-point sidebar bail.
//   src/components/js/sidebar.js     — the Y-axis renderer + zoom math. Driven
//        through the prototype with a recording ctx + a plain `this` (the full
//        component needs a real canvas): update() label/panel draw, calc_zoom,
//        calc_range (linear + log), apply_shaders, mousezoom, rezoom_range.
//   src/components/js/grid.js        — the I/O facade. Constructed in jsdom with
//        a recording canvas (via the component harness) + a fake comp, then its
//        pure event methods exercised (mousemove/out/down/up, touch2mouse,
//        emit_cursor_coord, change_range clamp, calc_offset cache, destroy).
//
// Values below were derived by reading the source and confirmed against a live
// node/jsdom run before being pinned. jsdom is only needed for the Grid section
// (canvas + DOM listeners); GridMaker & Sidebar math are framework-agnostic.

import { test, expect, describe, vi, beforeEach } from 'vitest'
import GridMaker from '../../src/components/js/grid_maker.js'
import Sidebar from '../../src/components/js/sidebar.js'
import Grid from '../../src/components/js/grid.js'
import Const from '../../src/stuff/constants.js'
import math from '../../src/stuff/math.js'
import {
  installCanvasEnv, uninstallCanvasEnv,
} from '../component/_component-harness.js'

const CONFIG = Const.ChartConfig
const { DAY, HOUR, YEAR, MONTH } = Const
const T0 = 1_600_000_000_000
const INTERVAL = 60_000
const HEIGHT = 300

// GridMaker.calc_sidebar() only needs ctx.measureText().width.
const stubCtx = () => ({ measureText: (s) => ({ width: s.length * 7 }) })

function ohlcv(n, base = 100, t0 = T0, iv = INTERVAL) {
  return Array.from({ length: n }, (_, i) =>
    [t0 + i * iv, base, base + 3, base - 3, base + 1, 100 + i])
}

// A complete GridMaker param bundle (mirrors layout.js `specs`).
function mkParams(over = {}) {
  const sub = over.sub || ohlcv(50)
  const interval = over.interval || INTERVAL
  const range = over.range ||
    (sub.length ? [sub[0][0], sub[sub.length - 1][0]] : [T0, T0 + 49 * interval])
  return {
    sub, interval, range, ctx: stubCtx(),
    $p: Object.assign({ width: 800, config: CONFIG }, over.$p),
    layers_meta: over.layers_meta || [{}],
    height: over.height || HEIGHT,
    y_t: over.y_t,
    ti_map: over.ti_map ||
      { ib: false, tf: interval, i2t: (i) => i, smth2i: (t) => t },
    grid: over.grid || {},
    timezone: over.timezone || 0,
  }
}

// Build + create a single (master) grid layout.
function makeLayout(over = {}) {
  return new GridMaker(0, mkParams(over)).create()
}

// ───────────────────────────────────────────────────────────────────────────
// GridMaker — linear $-range & Y transform
// ───────────────────────────────────────────────────────────────────────────
describe('GridMaker — linear $-range / Y transform (calc_$range, calc_positions)', () => {
  test('auto range pads hi/lo by EXPAND and builds an invertible A/B transform', () => {
    const lay = makeLayout()
    // raw OHLC band is [97, 103]; EXPAND=0.15 pads each side by (103-97)*0.15=0.9
    expect(lay.$_hi).toBeCloseTo(103.9, 6)
    expect(lay.$_lo).toBeCloseTo(96.1, 6)

    // A maps the price band onto [0, height] (inverted); B is the shift.
    expect(lay.A).toBeCloseTo(-HEIGHT / (lay.$_hi - lay.$_lo), 9)
    expect(lay.B).toBeCloseTo(-lay.$_hi * lay.A, 6)

    // $2screen($_hi) sits at the top (≈ -0.5 after the layout_fn -0.5 nudge),
    // $2screen($_lo) at the bottom (≈ height-0.5).
    expect(lay.$2screen(lay.$_hi)).toBe(-0.5)
    expect(lay.$2screen(lay.$_lo)).toBe(HEIGHT - 0.5)

    // screen2$ is the inverse of the un-floored y = $*A + B mapping.
    expect(lay.screen2$(0)).toBeCloseTo(lay.$_hi, 6)
    const yMid = lay.$_lo * lay.A + lay.B
    expect(lay.screen2$(yMid)).toBeCloseTo(lay.$_lo, 6)
  })

  test('px_step / spacex / startx from the range & sidebar width', () => {
    const lay = makeLayout()
    expect(lay.spacex).toBe(800 - lay.sb)             // width - sidebar
    const dt = (49 * INTERVAL)                         // range span
    const capacity = dt / INTERVAL                     // 49 candles
    expect(lay.px_step).toBeCloseTo(lay.spacex / capacity, 9)
    // first candle sits at range[0] → startx 0
    expect(lay.startx).toBeCloseTo(0, 9)
  })

  test('fixed (non-auto) y_t.range is used verbatim — no EXPAND padding', () => {
    const lay = makeLayout({ y_t: { auto: false, range: [200, 100] } })
    expect(lay.$_hi).toBe(200)
    expect(lay.$_lo).toBe(100)
  })

  test('y_t.auto=true falls back to the auto-scaled band (range ignored)', () => {
    const lay = makeLayout({ y_t: { auto: true, range: [200, 100] } })
    expect(lay.$_hi).toBeCloseTo(103.9, 6)
    expect(lay.$_lo).toBeCloseTo(96.1, 6)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// GridMaker — collapsed-range guards
// ───────────────────────────────────────────────────────────────────────────
describe('GridMaker — collapsed range guards', () => {
  test('all-equal non-zero prices expand symmetrically by |hi|*0.05', () => {
    // every bar pinned at 50 → hi===lo before the guard
    const lay = makeLayout({ sub: ohlcv(50).map((r) => [r[0], 50, 50, 50, 50, r[5]]) })
    const pad = 50 * 0.05 // 2.5
    expect(lay.$_hi).toBeCloseTo(50 + pad, 6)
    expect(lay.$_lo).toBeCloseTo(50 - pad, 6)
    expect(lay.$_hi).toBeGreaterThan(lay.$_lo) // not inverted
  })

  test('all-zero prices avoid a collapsed band → [1, -1] (with +pad)', () => {
    const lay = makeLayout({ sub: ohlcv(50).map((r) => [r[0], 0, 0, 0, 0, r[5]]) })
    // hi/lo set to 1/-1, then |1|*0.05 pad each side
    expect(lay.$_hi).toBeCloseTo(1.05, 6)
    expect(lay.$_lo).toBeCloseTo(-1.05, 6)
    // transform is the exact linear map of the [1.05,-1.05] band onto [0,height]
    expect(lay.A).toBeCloseTo(-HEIGHT / (lay.$_hi - lay.$_lo), 9) // -142.857…
    expect(lay.B).toBeCloseTo(-lay.$_hi * lay.A, 6)               // 150
    // and it's actually invertible across the band (no degenerate A=0/∞)
    expect(lay.$2screen(lay.$_hi)).toBe(-0.5)
    expect(lay.$2screen(lay.$_lo)).toBe(HEIGHT - 0.5)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// GridMaker — y_range_fn (overlay-supplied range)
// ───────────────────────────────────────────────────────────────────────────
describe('GridMaker — y_range_fn from layers_meta', () => {
  test('main grid: y_range fn provides hi/lo, then EXPAND pads it', () => {
    const lay = makeLayout({ layers_meta: [{ ov0: { y_range: () => [500, 50] } }] })
    // fn → [500,50]; EXPAND=0.15 pads (500-50)*0.15 = 67.5 each side
    expect(lay.$_hi).toBeCloseTo(567.5, 6)
    expect(lay.$_lo).toBeCloseTo(-17.5, 6)
  })

  test('offchart grid: y_range fn with exp=false disables EXPAND (verbatim band)', () => {
    const master = makeLayout()
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    const gm = new GridMaker(
      1,
      mkParams({ sub: off, layers_meta: [{}, { ov: { y_range: () => [80, 20, false] } }] }),
      master
    )
    const lay = gm.create()
    expect(lay.$_hi).toBe(80)
    expect(lay.$_lo).toBe(20)
  })

  test('first y_range fn wins when several overlays expose one', () => {
    const lay = makeLayout({
      layers_meta: [{
        a: { y_range: () => [10, 0] },
        b: { y_range: () => [9999, -9999] },
      }],
    })
    // [10,0] padded by (10)*0.15 = 1.5
    expect(lay.$_hi).toBeCloseTo(11.5, 6)
    expect(lay.$_lo).toBeCloseTo(-1.5, 6)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// GridMaker — offchart (master_grid) range scan
// ───────────────────────────────────────────────────────────────────────────
describe('GridMaker — offchart range scans every column', () => {
  test('hi/lo span the min & max over ALL non-time columns of the sub rows', () => {
    const master = makeLayout()
    // two-value rows: [t, a, b] — both columns participate in the scan
    const off = Array.from({ length: 20 }, (_, i) => [T0 + i * INTERVAL, i, 100 - i])
    const gm = new GridMaker(1, mkParams({ sub: off, layers_meta: [{}, {}] }), master)
    const lay = gm.create()
    // raw band: max=100 (col b @ i=0), min=0 (col a @ i=0); EXPAND pads 15 each side
    expect(lay.$_hi).toBeCloseTo(115, 6)
    expect(lay.$_lo).toBeCloseTo(-15, 6)
  })

  test('offchart borrows the master timeline (xs / t_step / startx)', () => {
    const masterGm = new GridMaker(0, mkParams())
    const master = masterGm.create()
    const off = ohlcv(50).map((r) => [r[0], r[5]])
    const gm = new GridMaker(1, mkParams({ sub: off, layers_meta: [{}, {}] }), master)
    const lay = gm.create()
    expect(lay.xs).toBe(master.xs)          // same array reference
    expect(lay.t_step).toBe(master.t_step)
    expect(lay.startx).toBe(master.startx)
    expect(lay.master_grid).toBe(master)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// GridMaker — sidebar width / precision schemes
// ───────────────────────────────────────────────────────────────────────────
describe('GridMaker — sidebar width & calc_precision', () => {
  test('empty grid yields a stub sidebar (prec 0, SBMIN, no ys)', () => {
    const lay = makeLayout({ sub: [], range: [T0, T0 + 49 * INTERVAL] })
    expect(lay.prec).toBe(0)
    expect(lay.sb).toBe(CONFIG.SBMIN)
    expect(lay.ys).toEqual([]) // grid_y over an empty band produces no levels
  })

  test('single visible point still gets a real Y-axis (prec computed, sb clamped)', () => {
    const lay = makeLayout({ sub: ohlcv(1) })
    expect(lay.prec).toBeGreaterThanOrEqual(2)
    expect(lay.sb).toBeGreaterThanOrEqual(CONFIG.SBMIN)
    // <2 bars → calc_positions bails, so the transform stays unset
    expect(lay.A).toBeUndefined()
  })

  test('precision scheme: 2-digit integer part → prec 2', () => {
    const lay = makeLayout({ sub: ohlcv(5).map((r, i) => [r[0], 50 + i, 50 + i, 50 + i, 50 + i, 1]) })
    expect(lay.prec).toBe(2)
  })

  test('precision scheme: 2-digit integer + 3 decimals → prec 4 (mid branch cap)', () => {
    // max_l===2 hits the `min(4, max(2, even))` branch; even = 3 - 1 + 2 = 4,
    // so this is distinct from both the 1-digit (→8) and ≥3-digit (→2) schemes.
    const sub = ohlcv(5).map((r, i) => {
      const v = 12.345 + i * 0.001
      return [r[0], v, v, v, v, 1]
    })
    expect(makeLayout({ sub }).prec).toBe(4)
  })

  test('precision scheme: 5-digit integer part collapses to prec 2', () => {
    const lay = makeLayout({
      sub: ohlcv(5).map((r, i) => [r[0], 12345 + i, 12345 + i, 12345 + i, 12345 + i, 1]),
    })
    expect(lay.prec).toBe(2)
  })

  test('precision scheme: sub-cent values lift precision via the e- branch', () => {
    const sub = ohlcv(5).map((r, i) => {
      const v = 0.00001234 + i * 0.00000111
      return [r[0], v, v, v, v, 1]
    })
    const lay = makeLayout({ sub })
    expect(lay.prec).toBeGreaterThan(4) // sub-cent → many decimals (8)
  })

  test('sidebar width is clamped to [SBMIN, SBMAX]', () => {
    const lay = makeLayout()
    expect(lay.sb).toBeGreaterThanOrEqual(CONFIG.SBMIN)
    expect(lay.sb).toBeLessThanOrEqual(CONFIG.SBMAX)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// GridMaker — linear grid_y (dollar_step) & grid_x (time_step + ranks)
// ───────────────────────────────────────────────────────────────────────────
describe('GridMaker — linear grid_y levels', () => {
  test('grid_y produces ascending price levels, each mapped to a y ≤ height', () => {
    const lay = makeLayout()
    expect(lay.ys.length).toBeGreaterThan(1)
    expect(Number.isFinite(lay.$_step)).toBe(true)
    expect(lay.$_step).toBeGreaterThan(0)
    // ys = [yPx, price]; prices strictly increase, all yPx ≤ height
    const prices = lay.ys.map((p) => p[1])
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1])
    }
    for (const [yPx] of lay.ys) expect(yPx).toBeLessThanOrEqual(lay.height)
    // each level's y matches floor(price*A + B)
    for (const [yPx, price] of lay.ys) {
      expect(yPx).toBe(Math.floor(price * lay.A + lay.B))
    }
  })

  test('$_step is at least 10^-prec (prevents duplicate levels)', () => {
    const lay = makeLayout()
    expect(lay.$_step).toBeGreaterThanOrEqual(Math.pow(10, -lay.prec))
  })
})

describe('GridMaker — grid_x time ranks (DAY/hourly) + extension', () => {
  // Hourly bars aligned to a day boundary, range padded so extend_* can run.
  function hourly() {
    let t0 = T0 - (T0 % DAY)               // align to midnight UTC
    const sub = ohlcv(48, 100, t0, HOUR)   // two full days of hourly bars
    return new GridMaker(0, mkParams({
      sub, interval: HOUR,
      range: [t0 - 6 * HOUR, sub[sub.length - 1][0] + 6 * HOUR],
    })).create()
  }

  test('day boundaries are tagged with the DAY rank; lines are x-monotonic', () => {
    const lay = hourly()
    expect(lay.xs.length).toBeGreaterThan(0)
    const ranks = new Set(lay.xs.map((x) => x[2]))
    expect(ranks.has(DAY)).toBe(true)     // midnight crossings → DAY rank
    expect(ranks.has(HOUR)).toBe(true)    // intra-day hourly lines
    // x positions never go backwards
    const xsX = lay.xs.map((x) => x[0])
    for (let i = 1; i < xsX.length; i++) {
      expect(xsX[i]).toBeGreaterThanOrEqual(xsX[i - 1])
    }
    expect(Number.isFinite(lay.t_step)).toBe(true)
  })

  test('extend_left/right add grid lines beyond the bar span (range is padded)', () => {
    // The 6h pad on each side leaves empty pixels past the first/last bar; the
    // extend_* passes must fill them with extra time lines, proving they ran
    // (vs. merely inserting a line per bar). t_step is exactly 1h here.
    let t0 = T0 - (T0 % DAY)
    const sub = ohlcv(48, 100, t0, HOUR)
    const firstT = sub[0][0], lastT = sub[sub.length - 1][0]
    const lay = new GridMaker(0, mkParams({
      sub, interval: HOUR,
      range: [t0 - 6 * HOUR, lastT + 6 * HOUR],
    })).create()
    const lineTimes = lay.xs.map((x) => x[1][0])
    expect(Math.min(...lineTimes)).toBeLessThan(firstT)  // extend_left fired
    expect(Math.max(...lineTimes)).toBeGreaterThan(lastT) // extend_right fired
    // extension lines all land on a clean interval boundary (the `t % interval`
    // guard in extend_*), and stay inside the drawable pixel band.
    for (const [x, [t]] of lay.xs) {
      if (t < firstT || t > lastT) {
        expect(t % HOUR).toBe(0)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(lay.spacex)
      }
    }
  })

  test('YEAR rank appears when bars cross a calendar-year boundary', () => {
    // Daily bars straddling 2021→2022 (Dec 30 2021 .. Jan 3 2022).
    const start = Date.UTC(2021, 11, 30)
    const sub = ohlcv(6, 100, start, DAY)
    const lay = new GridMaker(0, mkParams({
      sub, interval: DAY, range: [sub[0][0], sub[sub.length - 1][0]],
    })).create()
    const ranks = new Set(lay.xs.map((x) => x[2]))
    expect(ranks.has(YEAR)).toBe(true)
  })

  test('MONTH rank appears when bars cross a month boundary (same year)', () => {
    // Daily bars straddling Jan→Feb 2021.
    const start = Date.UTC(2021, 0, 29)
    const sub = ohlcv(6, 100, start, DAY)
    const lay = new GridMaker(0, mkParams({
      sub, interval: DAY, range: [sub[0][0], sub[sub.length - 1][0]],
    })).create()
    const ranks = new Set(lay.xs.map((x) => x[2]))
    expect(ranks.has(MONTH)).toBe(true)
    expect(ranks.has(YEAR)).toBe(false) // stays inside 2021
  })

  test('timezone offset shifts intraday boundaries (sub-DAY tf path)', () => {
    // Hourly bars with a +5h timezone still produce a valid, monotone grid.
    let t0 = T0 - (T0 % DAY)
    const sub = ohlcv(30, 100, t0, HOUR)
    const lay = new GridMaker(0, mkParams({
      sub, interval: HOUR, timezone: 5,
      range: [sub[0][0], sub[sub.length - 1][0]],
    })).create()
    expect(lay.xs.length).toBeGreaterThan(0)
    const xsX = lay.xs.map((x) => x[0])
    for (let i = 1; i < xsX.length; i++) {
      expect(xsX[i]).toBeGreaterThanOrEqual(xsX[i - 1])
    }
  })
})

// ───────────────────────────────────────────────────────────────────────────
// GridMaker — LOG scale (the big uncovered block)
// ───────────────────────────────────────────────────────────────────────────
describe('GridMaker — log-scale grid (grid_y_log / dollar_mult / search_start_*)', () => {
  test('log mode builds a multiplicative Y transform and price levels', () => {
    const lay = makeLayout({ grid: { logScale: true } })
    // A/B are the LOG-space transform.
    expect(lay.A).toBeCloseTo(-HEIGHT / (math.log(lay.$_hi) - math.log(lay.$_lo)), 6)
    expect(lay.B).toBeCloseTo(-math.log(lay.$_hi) * lay.A, 6)

    // $_mult is the per-level price ratio; > 1 for a positive band.
    expect(lay.$_mult).toBeGreaterThan(1)

    expect(lay.ys.length).toBeGreaterThan(1)
    // every level: y === floor(log(price)*A + B); prices strictly DECREASE as we
    // step from the top down (grid_y_log pushes hi→lo).
    for (const [yPx, price] of lay.ys) {
      expect(yPx).toBe(Math.floor(math.log(price) * lay.A + lay.B))
      expect(Number.isFinite(price)).toBe(true)
    }
  })

  test('log $2screen / screen2$ round-trip through log/exp', () => {
    const lay = makeLayout({ grid: { logScale: true } })
    // forward: log-band edges anchor to the top / bottom pixels (post -0.5 nudge),
    // exactly like the linear case — proves the log A/B orient the pane correctly.
    expect(lay.$2screen(lay.$_hi)).toBe(-0.5)
    expect(lay.$2screen(lay.$_lo)).toBe(HEIGHT - 0.5)
    const price = (lay.$_hi + lay.$_lo) / 2
    // feed the un-floored screen value to isolate the log/exp inversion
    const yExact = math.log(price) * lay.A + lay.B
    expect(lay.screen2$(yExact)).toBeCloseTo(price, 4)
  })

  test('log mode over a band that includes negative & positive prices stays finite', () => {
    // signed series → grid_y_log walks both the over-0 and under-0 loops.
    const sub = ohlcv(40).map((r, i) => {
      const v = -20 + i // -20 .. 19
      return [r[0], v, v + 1, v - 1, v, r[5]]
    })
    const lay = makeLayout({ sub, grid: { logScale: true } })
    expect(Number.isFinite(lay.A)).toBe(true)
    expect(Number.isFinite(lay.B)).toBe(true)
    for (const [yPx, price] of lay.ys) {
      expect(Number.isFinite(yPx)).toBe(true)
      expect(Number.isFinite(price)).toBe(true)
    }
    // a negative level exists (under-0 loop ran)
    expect(lay.ys.some((p) => p[1] < 0)).toBe(true)
  })

  test('log mode with a collapsed (all-equal) band expands without NaN', () => {
    const sub = ohlcv(30).map((r) => [r[0], 50, 50, 50, 50, r[5]])
    const lay = makeLayout({ sub, grid: { logScale: true } })
    // log_scale.expand widens the pinned 50 into a real band straddling it
    expect(Number.isFinite(lay.A)).toBe(true)
    expect(lay.$_hi).toBeGreaterThan(50)
    expect(lay.$_lo).toBeLessThan(50)
    expect(lay.$_lo).toBeGreaterThan(0) // stays positive — log() never sees ≤0
    // and it still produces a usable, all-finite ladder of levels
    expect(lay.ys.length).toBeGreaterThan(1)
    for (const [yPx, price] of lay.ys) {
      expect(Number.isFinite(yPx)).toBe(true)
      expect(Number.isFinite(price)).toBe(true)
      expect(yPx).toBe(Math.floor(math.log(price) * lay.A + lay.B))
    }
  })

  test('log mode with a single bar leaves ys empty (early return)', () => {
    const lay = makeLayout({ sub: ohlcv(1), grid: { logScale: true } })
    // <2 bars → calc_positions bails, so A/B never get set; grid_y_log then maps
    // log(price)*undefined+undefined = NaN for every candidate, so no level is
    // pushed and ys comes back empty (not merely "an array").
    expect(lay.ys).toEqual([])
    expect(lay.A).toBeUndefined()
    expect(lay.B).toBeUndefined()
  })
})

// ───────────────────────────────────────────────────────────────────────────
// GridMaker — layout_fn helpers wired through create()
// ───────────────────────────────────────────────────────────────────────────
describe('GridMaker — layout_fn transforms attached by create()', () => {
  test('t2screen / screen2t round-trip within one pixel of time', () => {
    const lay = makeLayout()
    const t = T0 + 25 * INTERVAL
    const x = lay.t2screen(t)
    // t2screen FLOORS to whole pixels, so the inverse recovers t only to within
    // one pixel's worth of time (dt/spacex). Assert that, not sub-ms equality.
    const msPerPx = (49 * INTERVAL) / lay.spacex
    expect(Math.abs(lay.screen2t(x + 0.5) - t)).toBeLessThanOrEqual(msPerPx)
  })

  test('create() exposes the grid params and width = $p.width - sb', () => {
    const lay = makeLayout()
    expect(lay.grid).toBeTruthy()
    expect(lay.width).toBe(800 - lay.sb)
    expect(lay.height).toBe(HEIGHT)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// Sidebar — Y-axis render & zoom math (prototype-driven)
// ───────────────────────────────────────────────────────────────────────────
function mockCtx(font = '11px Arial') {
  const calls = []
  const c = {
    font, fillStyle: '', strokeStyle: '', textAlign: '', _calls: calls,
  }
  for (const m of ['beginPath', 'moveTo', 'lineTo', 'stroke', 'clearRect',
    'fillRect', 'fillText', 'save', 'restore']) {
    c[m] = (...a) => calls.push([m, ...a])
  }
  c.measureText = (s) => ({ width: String(s).length * 6 })
  return c
}
const callsOf = (ctx, name) => ctx._calls.filter((c) => c[0] === name)

describe('Sidebar.update — label & axis drawing', () => {
  function mkSelf(side, cursor, ys, font) {
    const ctx = mockCtx(font)
    const layout = {
      ys: ys || [[10, 100], [60, 101], [400, 102]],
      height: 300, prec: 2, sb: 60, width: 60, id: side === 'left' ? 1 : 0,
      grid: {},
    }
    // Build on the prototype so update() can call its siblings
    // (upper_border/apply_shaders/panel/_repaintLabels).
    const self = Object.assign(Object.create(Sidebar.prototype), {
      ctx, side, id: layout.id,
      comp: { layoutOverride: null },
      $p: {
        font: font || '11px Arial',
        colors: { back: '#000', scale: '#888', text: '#fff', textHL: '#fff', panel: '#333' },
        grid_id: layout.id, cursor: cursor || { y: 0, y$: 0, grid_id: layout.id },
        shaders: [], layout: { grids: { [layout.id]: layout } },
      },
    })
    return { self, ctx, layout }
  }

  test('right side: clears the column, draws only on-screen labels, caches geom', () => {
    const { self, ctx } = mkSelf('right')
    self.update()
    // ys[2]=[400,102] is below height (300) → skipped
    const texts = callsOf(ctx, 'fillText').map((c) => c[1])
    expect(texts).toEqual(['100.00', '101.00'])
    expect(callsOf(ctx, 'clearRect').length).toBe(1)
    // label geometry cached for the cursor-only fast path
    expect(self._labelGeom).toMatchObject({ textAlign: 'start' })
    expect(self._labelGeom.x1Base).toBe(-0.5)
  })

  test('left side: mirrored geometry (textAlign end, x1Base = w-0.5)', () => {
    const { self } = mkSelf('left', { y: 0, y$: 0, grid_id: 1 }, [[10, 100]])
    self.update()
    expect(self._labelGeom.textAlign).toBe('end')
    // w = floor(sb)=60 → x1Base = 60 - 0.5
    expect(self._labelGeom.x1Base).toBe(59.5)
  })

  test('grid_id set + cursor present: draws upper border + cursor panel', () => {
    const { self, ctx } = mkSelf('left', { y: 50, y$: 101.5, grid_id: 1 }, [[10, 100]])
    self.update()
    // upper_border() draws a horizontal line at y=0.5
    expect(ctx._calls.some((c) => c[0] === 'moveTo' && c[1] === 0 && c[2] === 0.5)).toBe(true)
    // panel() fills a rect and writes the formatted cursor price
    expect(callsOf(ctx, 'fillRect').length).toBe(1)
    expect(callsOf(ctx, 'fillText').map((c) => c[1])).toContain('101.50')
    expect(self._lastPanelY).toBe(50)
  })

  test('main pane (grid_id 0): no upper border drawn', () => {
    const { self, ctx } = mkSelf('right', { y: 0, y$: 0, grid_id: 0 }, [[10, 100]])
    self.update()
    // upper_border only fires when $p.grid_id is truthy; here it's 0 → none.
    // The only horizontal moveTo at y=0.5 would be from upper_border; assert absent.
    expect(ctx._calls.some((c) => c[0] === 'moveTo' && c[1] === 0 && c[2] === 0.5)).toBe(false)
  })

  test('layoutOverride wins over $p.layout.grids[id] (resize path)', () => {
    const { self } = mkSelf('right')
    const overrideLayout = {
      ys: [[5, 999]], height: 300, prec: 0, sb: 60, width: 60, id: 0, grid: {},
    }
    self.comp.layoutOverride = overrideLayout
    self.update()
    expect(self.layout).toBe(overrideLayout)
    expect(callsOf(self.ctx, 'fillText').map((c) => c[1])).toEqual(['999'])
  })
})

describe('Sidebar.panel — cursor price box', () => {
  test('bails when cursor.grid_id !== layout.id (no rect)', () => {
    const ctx = mockCtx()
    const self = {
      ctx, layout: { id: 0, prec: 2, sb: 60 },
      $p: { cursor: { grid_id: 5, y: 50, y$: 100 }, colors: { panel: '#000', textHL: '#fff' } },
    }
    Sidebar.prototype.panel.call(self)
    expect(callsOf(ctx, 'fillRect').length).toBe(0)
  })

  test('caches the formatted label across identical (y$, prec) calls', () => {
    const ctx = mockCtx()
    const self = {
      ctx, layout: { id: 0, prec: 2, sb: 60 },
      $p: { cursor: { grid_id: 0, y: 40, y$: 12.3456 }, colors: { panel: '#000', textHL: '#fff' } },
    }
    Sidebar.prototype.panel.call(self)
    expect(self._lastLbl).toBe('12.35')
    expect(self._lastY$).toBe(12.3456)
    // second call with same y$/prec reuses the cached label
    Sidebar.prototype.panel.call(self)
    expect(callsOf(ctx, 'fillText').every((c) => c[1] === '12.35')).toBe(true)
  })
})

describe('Sidebar.apply_shaders', () => {
  test('runs each shader with the resolved layout, wrapped in save/restore', () => {
    const ctx = mockCtx()
    const got = []
    const self = {
      ctx, layout: { sb: 60 },
      $p: { cursor: { x: 1 }, shaders: [{ draw: (c, p) => got.push(p) }] },
    }
    Sidebar.prototype.apply_shaders.call(self)
    expect(got[0].layout).toBe(self.layout)
    expect(got[0].cursor).toBe(self.$p.cursor)
    expect(callsOf(ctx, 'save').length).toBe(1)
    expect(callsOf(ctx, 'restore').length).toBe(1)
  })

  test('bails (no draw) when layout is absent', () => {
    const draw = vi.fn()
    const ctx = mockCtx()
    const self = { ctx, layout: null, $p: { shaders: [{ draw }] } }
    Sidebar.prototype.apply_shaders.call(self)
    // early-returns before the shader loop: draw never runs and the ctx is
    // left untouched (no save/restore bracketing emitted).
    expect(draw).not.toHaveBeenCalled()
    expect(callsOf(ctx, 'save').length).toBe(0)
    expect(callsOf(ctx, 'restore').length).toBe(0)
  })
})

describe('Sidebar.upper_border', () => {
  test('strokes a full-width line at y=0.5', () => {
    const ctx = mockCtx()
    const self = { ctx, layout: { width: 60 }, $p: { colors: { scale: '#888' } } }
    Sidebar.prototype.upper_border.call(self)
    expect(ctx._calls.some((c) => c[0] === 'moveTo' && c[2] === 0.5)).toBe(true)
    expect(ctx._calls.some((c) => c[0] === 'lineTo' && c[1] === 60)).toBe(true)
  })
})

describe('Sidebar._clearPanel', () => {
  test('clears the panel band, redraws the scale line, repaints in-band labels', () => {
    const ctx = mockCtx()
    // Built on the prototype so _clearPanel can call _repaintLabels.
    const self = Object.assign(Object.create(Sidebar.prototype), {
      ctx,
      layout: { sb: 60, ys: [[120, 50]], height: 1000, prec: 1 },
      _labelGeom: { x1Base: -0.5, x2Offset: 4.5, textOffset: 10, textAlign: 'start' },
      $p: { font: '11px Arial', colors: { scale: '#888', text: '#fff' } },
    })
    self._clearPanel(124)
    // band cleared once
    expect(callsOf(ctx, 'clearRect').length).toBe(1)
    // the label at p[0]=120 (baseline 124) sits in the cleared band → repainted
    expect(callsOf(ctx, 'fillText').map((c) => c[1])).toContain('50.0')
  })
})

describe('Sidebar.calc_zoom / calc_range', () => {
  test('calc_zoom: dragging up accelerates (speed 3), down decelerates (speed 1)', () => {
    const up = Object.assign(Object.create(Sidebar.prototype),
      { drug: { y: 200, z: 1.0 }, layout: { height: 400 } })
    expect(up.calc_zoom({ center: { y: 100 } })).toBeCloseTo(1.75, 6) // 1*(1+3*100/400)
    const down = Object.assign(Object.create(Sidebar.prototype),
      { drug: { y: 200, z: 1.0 }, layout: { height: 400 } })
    expect(down.calc_zoom({ center: { y: 300 } })).toBeCloseTo(0.75, 6) // 1*(1-100/400)
  })

  test('calc_zoom clamps to the [0.005, 100] band', () => {
    // dragging up from z=100 would overshoot 100 → clamped to the ceiling
    const hi = Object.assign(Object.create(Sidebar.prototype),
      { drug: { y: 400, z: 100 }, layout: { height: 400 } })
    expect(hi.calc_zoom({ center: { y: 0 } })).toBe(100)
    // dragging fully down (k→0) from a tiny z would undershoot → clamped to floor
    const lo = Object.assign(Object.create(Sidebar.prototype),
      { drug: { y: 0, z: 0.005 }, layout: { height: 400 } })
    expect(lo.calc_zoom({ center: { y: 400 } })).toBe(0.005)
  })

  test('calc_range linear: zooms the price band symmetrically about the mid', () => {
    const self = Object.assign(Object.create(Sidebar.prototype), {
      zoom: 2.0, drug: { z: 1.0 }, y_range: [110, 90],
      layout: { grid: { logScale: false }, height: 400 },
    })
    // z=2 → zk=(1/2-1)/2=-0.25 ; delta=20 → [110-5, 90+5]
    expect(self.calc_range()).toEqual([105, 95])
    // asymmetric diffs shrink only the top edge
    expect(self.calc_range(2, 0)).toEqual([100, 90])
  })

  test('calc_range log: stays finite with hi above lo', () => {
    const A = -400 / (math.log(110) - math.log(90))
    const B = -math.log(110) * A
    const self = Object.assign(Object.create(Sidebar.prototype), {
      zoom: 2.0, drug: { z: 1.0, A, B }, y_range: [110, 90],
      layout: { grid: { logScale: true }, height: 400 },
    })
    const r = self.calc_range()
    expect(r.every(Number.isFinite)).toBe(true)
    expect(r[0]).toBeGreaterThan(r[1])
    // z=2 zoom-in through the exp() inverse: band tightens around ~99.5 (log-mid
    // of [110,90]) — pin the exact recovered edges so the log path can't silently
    // drift back toward a linear (symmetric-about-100) result.
    expect(r[0]).toBeCloseTo(104.6215611, 5)
    expect(r[1]).toBeCloseTo(94.6338828, 5)
  })
})

describe('Sidebar.mousezoom / rezoom_range — emits sidebar-transform', () => {
  function mkZoomSelf(over = {}) {
    const emits = []
    const layout = {
      $_hi: 110, $_lo: 90, A: -20, B: 2200, height: 400, grid: { logScale: false }, id: 0,
    }
    const self = Object.assign(Object.create(Sidebar.prototype), {
      id: 0, layout,
      comp: { $emit: (e, p) => emits.push([e, p]) },
      $p: Object.assign({ y_transform: null }, over.$p),
      _emits: emits,
    })
    return self
  }

  test('mousezoom emits a non-auto transform with a fresh range', () => {
    const self = mkZoomSelf()
    self.mousezoom(50, {
      originalEvent: { preventDefault() {} }, preventDefault() {},
    })
    const st = self._emits.find((e) => e[0] === 'sidebar-transform')
    expect(st).toBeTruthy()
    expect(st[1]).toMatchObject({ grid_id: 0, auto: false, drugging: false })
    // delta 50 → smart_wheel → k=+0.05 → zoom 1*(1+0.05)=1.05? no: smart_wheel
    // remaps; the linear calc_range then zooms the [110,90] band about its mid.
    // Pin the exact widened band so a regression in the zoom math is caught.
    expect(st[1].zoom).toBeCloseTo(1.1, 6)
    expect(st[1].range[0]).toBeCloseTo(109.0909090909, 6)
    expect(st[1].range[1]).toBeCloseTo(90.9090909090, 6)
    // symmetric about the band midpoint (100)
    expect((st[1].range[0] + st[1].range[1]) / 2).toBeCloseTo(100, 6)
    expect(self.drug).toBe(null) // released after emit
  })

  test('rezoom_range no-ops without a manual (non-auto) y_transform', () => {
    const self = mkZoomSelf({ $p: { y_transform: null } })
    self.rezoom_range(10, 1, 1)
    expect(self._emits.length).toBe(0)
  })

  test('rezoom_range with a manual y_transform emits drugging start+end', () => {
    const self = mkZoomSelf({ $p: { y_transform: { auto: false, zoom: 1 } } })
    self.rezoom_range(10, 1, 1)
    const transforms = self._emits.filter((e) => e[0] === 'sidebar-transform')
    expect(transforms.length).toBe(2)
    // first emit carries the recomputed (non-auto) range the chart applies…
    expect(transforms[0][1]).toMatchObject({ grid_id: 0, auto: false, drugging: true })
    expect(transforms[0][1].range.every(Number.isFinite)).toBe(true)
    // band stays oriented hi > lo after the zoom
    expect(transforms[0][1].range[0]).toBeGreaterThan(transforms[0][1].range[1])
    // …the second is the bare drag-release signal (no range/zoom payload)
    expect(transforms[1][1]).toEqual({ grid_id: 0, drugging: false })
    expect(self.drug).toBe(null)
  })
})

describe('Sidebar — inert mouse handlers', () => {
  test('mousemove/out/up/down are no-ops (overridden by gesture pipeline)', () => {
    const self = Object.create(Sidebar.prototype)
    // true stubs: they neither throw nor touch `self` (no ctx/emit deref), and
    // return undefined. Pass a tripwire event whose getters would throw if read.
    const tripwire = new Proxy({}, { get() { throw new Error('event read') } })
    expect(self.mousemove(tripwire)).toBeUndefined()
    expect(self.mouseout(tripwire)).toBeUndefined()
    expect(self.mouseup(tripwire)).toBeUndefined()
    expect(self.mousedown(tripwire)).toBeUndefined()
  })
})

// ───────────────────────────────────────────────────────────────────────────
// Grid — I/O facade (jsdom + recording canvas)
// ───────────────────────────────────────────────────────────────────────────
describe('Grid — construction & event methods', () => {
  beforeEach(() => { installCanvasEnv() })
  // teardown handled per-test in a finally where needed; install is idempotent.

  function mkCanvas(rect = { x: 0, y: 0 }) {
    const c = document.createElement('canvas')
    c.getBoundingClientRect = () => ({
      x: rect.x, y: rect.y, left: rect.x, top: rect.y, width: 500, height: 300,
    })
    return c
  }
  function mkComp(over = {}) {
    const emits = []
    return {
      emits,
      $emit: (e, p) => emits.push([e, p]),
      $props: Object.assign({
        config: { MIN_ZOOM: 25, MAX_ZOOM: 100000, SCROLL_WHEEL: 'prevent' },
        sub: [[1000, 1, 1, 1, 1, 1], [2000, 1, 1, 1, 1, 1], [3000, 1, 1, 1, 1, 1]],
        range: [1000, 3000], grid_id: 0, interval: 1000,
        cursor: { mode: 'explore', scroll_lock: false, locked: false },
        layout: { grids: { 0: { B: 100, offset: 0, width: 440 } } },
        y_transform: null, meta: { activated: true },
      }, over),
    }
  }

  test('constructor wires id / interval / range getter / zoom limits / modules', () => {
    const g = new Grid(mkCanvas(), mkComp(), mkCanvas())
    try {
      expect(g.id).toBe(0)
      expect(g.interval).toBe(1000)
      expect(g.range).toEqual([1000, 3000]) // live getter off $p
      expect(g.MIN_ZOOM).toBe(25)
      expect(g.MAX_ZOOM).toBe(100000)
      expect(g.zoomManager).toBeTruthy()
      expect(g.panManager).toBeTruthy()
      expect(g.renderer).toBeTruthy()
      // dual-canvas mode active (recording ctx is non-null)
      expect(g.renderer.hasDualCanvas).toBe(true)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('calc_offset caches negated bounding-rect; invalidate_offset re-arms it', () => {
    const g = new Grid(mkCanvas({ x: 5, y: 7 }), mkComp(), mkCanvas())
    try {
      g.calc_offset(true)
      expect(g.offset_x).toBe(-5)
      expect(g.offset_y).toBe(-7)
      expect(g._offsetCached).toBe(true)
      g.invalidate_offset()
      expect(g._offsetCached).toBe(false)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('overlays getter/setter delegate to the renderer', () => {
    const g = new Grid(mkCanvas(), mkComp(), mkCanvas())
    try {
      const layers = [{ id: 'a' }]
      g.overlays = layers
      expect(g.overlays).toBe(layers)
      expect(g.renderer.overlays).toBe(layers)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('mousemove emits cursor-changed with layer coords + layout offset', () => {
    const comp = mkComp()
    comp.$props.layout.grids[0].offset = 13
    const g = new Grid(mkCanvas({ x: 5, y: 7 }), comp, mkCanvas())
    try {
      comp.emits.length = 0
      g.mousemove({ layerX: 50, layerY: 60 })
      const cc = comp.emits.find((e) => e[0] === 'cursor-changed')
      expect(cc[1]).toMatchObject({ grid_id: 0, x: 50, y: 60 + 13 })
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('mouseout emits an empty cursor (clears crosshair)', () => {
    const comp = mkComp()
    const g = new Grid(mkCanvas(), comp, mkCanvas())
    try {
      comp.emits.length = 0
      g.mouseout({})
      const cc = comp.emits.find((e) => e[0] === 'cursor-changed')
      expect(cc[1]).toEqual({})
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('mousedown emits cursor-locked then a grid-mousedown custom-event', () => {
    const comp = mkComp()
    const g = new Grid(mkCanvas(), comp, mkCanvas())
    try {
      comp.emits.length = 0
      g.mousedown({ defaultPrevented: false })
      expect(comp.emits.some((e) => e[0] === 'cursor-locked' && e[1] === true)).toBe(true)
      const ce = comp.emits.find((e) => e[0] === 'custom-event')
      expect(ce[1].event).toBe('grid-mousedown')
      expect(ce[1].args[0]).toBe(0)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('mousedown skips the custom-event when defaultPrevented', () => {
    const comp = mkComp()
    const g = new Grid(mkCanvas(), comp, mkCanvas())
    try {
      comp.emits.length = 0
      g.mousedown({ defaultPrevented: true })
      expect(comp.emits.some((e) => e[0] === 'cursor-locked')).toBe(true)
      expect(comp.emits.some((e) => e[0] === 'custom-event')).toBe(false)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('mouseup clears drug and unlocks the cursor', () => {
    const comp = mkComp()
    const g = new Grid(mkCanvas(), comp, mkCanvas())
    try {
      g.drug = { x: 1 }
      comp.emits.length = 0
      g.mouseup({})
      expect(g.drug).toBe(null)
      expect(comp.emits.some((e) => e[0] === 'cursor-locked' && e[1] === false)).toBe(true)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('touch2mouse maps gesture center → layer coords via the cached offset', () => {
    const g = new Grid(mkCanvas({ x: 5, y: 7 }), mkComp(), mkCanvas())
    try {
      const m = g.touch2mouse({ srcEvent: { preventDefault() {} }, center: { x: 100, y: 200 } })
      // offset_x/y are -rect.x/-rect.y after the internal calc_offset
      expect(m.layerX).toBe(100 + g.offset_x)
      expect(m.layerY).toBe(200 + g.offset_y)
      expect(typeof m.preventDefault).toBe('function')
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('emit_cursor_coord merges the `add` overrides into the cursor payload', () => {
    const comp = mkComp()
    const g = new Grid(mkCanvas(), comp, mkCanvas())
    try {
      comp.$props.layout.grids[0].offset = 0
      comp.emits.length = 0
      g.emit_cursor_coord({ center: { x: 10, y: 20 } }, { mode: 'aim' })
      const cc = comp.emits.find((e) => e[0] === 'cursor-changed')
      expect(cc[1].mode).toBe('aim')
      expect(cc[1].grid_id).toBe(0)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('change_range clamps both edges and emits range-changed', () => {
    const comp = mkComp()
    const g = new Grid(mkCanvas(), comp, mkCanvas())
    try {
      g.data = comp.$props.sub
      // push the range far past the data so both clamps engage
      comp.$props.range = [Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER]
      comp.emits.length = 0
      g.change_range()
      const rc = comp.emits.find((e) => e[0] === 'range-changed')
      expect(rc).toBeTruthy()
      const [lo, hi] = rc[1]
      // both edges were pushed to ±MAX_SAFE_INTEGER, so both clamps fully engage:
      //   lo = last.t  - interval*5.5 = 3000 - 5500 = -2500
      //   hi = first.t + interval*5.5 = 1000 + 5500 =  6500
      expect(lo).toBe(3000 - 1000 * 5.5)   // -2500
      expect(hi).toBe(1000 + 1000 * 5.5)   //  6500
      // emitted array is the same range object that was clamped in place
      expect(rc[1]).toBe(comp.$props.range)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('change_range bails (no emit) with fewer than 2 data points', () => {
    const comp = mkComp({ sub: [[1000, 1, 1, 1, 1, 1]] })
    const g = new Grid(mkCanvas(), comp, mkCanvas())
    try {
      g.data = comp.$props.sub
      comp.emits.length = 0
      g.change_range()
      expect(comp.emits.some((e) => e[0] === 'range-changed')).toBe(false)
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('delegations (update/markStaticDirty/propagate/layer ops) reach the renderer', () => {
    const comp = mkComp()
    const g = new Grid(mkCanvas(), comp, mkCanvas())
    try {
      g.renderer.update = vi.fn()
      g.renderer.markStaticDirty = vi.fn()
      g.renderer.propagate = vi.fn()
      g.renderer.new_layer = vi.fn()
      g.renderer.del_layer = vi.fn()
      g.renderer.show_hide_layer = vi.fn()
      g.update(); g.markStaticDirty(); g.propagate('x', {})
      g.new_layer({ id: 'L' }); g.del_layer('L'); g.show_hide_layer({})
      expect(g.renderer.update).toHaveBeenCalled()
      expect(g.renderer.markStaticDirty).toHaveBeenCalled()
      expect(g.renderer.propagate).toHaveBeenCalledWith('x', {})
      expect(g.renderer.new_layer).toHaveBeenCalled()
      expect(g.renderer.del_layer).toHaveBeenCalledWith('L')
      expect(g.renderer.show_hide_layer).toHaveBeenCalled()
    } finally { g.destroy(); uninstallCanvasEnv() }
  })

  test('destroy() flags destroyed and releases canvas/module refs', () => {
    const g = new Grid(mkCanvas(), mkComp(), mkCanvas())
    g.destroy()
    expect(g._destroyed).toBe(true)
    expect(g.canvas).toBe(null)
    expect(g.canvasDynamic).toBe(null)
    expect(g.ctx).toBe(null)
    expect(g.renderer).toBe(null)
    expect(g.zoomManager).toBe(null)
    uninstallCanvasEnv()
  })
})
