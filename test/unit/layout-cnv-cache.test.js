// Indicator-pane geometry cache (layout_cnv_cached) — output equivalence + key.
//
// The MAIN candle pane caches its built geometry in layout.js; the indicator
// pane (Candles.vue used as an on/off-chart overlay, sub !== main data) rebuilt
// ~2*N candle/volume objects on EVERY frame via layout_cnv(self). layout_cnv_cached
// memoizes that per-overlay-instance on a layout fingerprint.
//
// The indicator render path has NO pixel/component coverage (the visual golden +
// jsdom repros exercise the main pane only — see tasks/render-perf-constraints.md
// §2). So this locks the cache by GEOMETRY EQUALITY: a cache HIT must return the
// byte-for-byte same geometry the uncached builder produces, and the fingerprint
// must bust on every output-affecting change (transform / range / live last bar).
import { test, expect, describe } from 'vitest'
import { layout_cnv, layout_cnv_cached } from '../../src/components/js/layout_cnv.js'

const T0 = 1_600_000_000_000
const STEP = 60_000

// 6 OHLCV bars with headroom so a last-bar close can move without other changes.
function makeSub() {
  return Array.from({ length: 6 }, (_, i) => {
    const base = 100 + i
    // [t, o, h, l, c, v, color?]
    return [T0 + i * STEP, base, base + 5, base - 5, base + 1, 1000 + i * 10, null]
  })
}

function makeLayout(over = {}) {
  return {
    A: 2, B: 100, px_step: 12, height: 300,
    ti_map: { ib: false, tf: STEP },
    // Deterministic affine time->screen map (range/zoom folded in).
    t2screen: (t) => Math.floor(((t - T0) / STEP) * 12) - 0.5,
    ...over,
  }
}

function makeSelf(sub, layout) {
  return {
    $props: {
      data: sub,
      layout,
      config: { VOLSCALE: 0.3, CANDLEW: 0.7 },
      tf: null,
      interval: STEP,
      grid_id: 1,
    },
  }
}

describe('layout_cnv_cached — geometry equivalence with uncached builder', () => {
  test('first call equals layout_cnv(self) byte-for-byte', () => {
    const sub = makeSub()
    const layout = makeLayout()
    const reference = layout_cnv(makeSelf(sub, layout))

    const cache = { key: '', val: null }
    const cached = layout_cnv_cached(makeSelf(sub, layout), cache)

    expect(cached).toEqual(reference)
    expect(cached.candles).toHaveLength(sub.length)
    expect(cached.volume).toHaveLength(sub.length)
  })

  test('cache HIT returns the SAME object (0 rebuild) when nothing changed', () => {
    const self = makeSelf(makeSub(), makeLayout())
    const cache = { key: '', val: null }

    const a = layout_cnv_cached(self, cache)
    const b = layout_cnv_cached(self, cache)
    const c = layout_cnv_cached(self, cache)

    expect(b).toBe(a) // identity — proves layout_cnv was NOT re-invoked
    expect(c).toBe(a)
  })
})

describe('layout_cnv_cached — fingerprint busts on every output-affecting change', () => {
  test('live intra-candle close move on the LAST bar busts the cache', () => {
    const sub = makeSub()
    const layout = makeLayout()
    const self = makeSelf(sub, layout)
    const cache = { key: '', val: null }

    const before = layout_cnv_cached(self, cache)

    // Move ONLY the last bar's close (in place, same array ref) — range/A/B/
    // px_step unchanged. The last-bar OHLCV term must bust the key.
    const li = sub.length - 1
    sub[li][4] = sub[li][4] + 3

    const after = layout_cnv_cached(self, cache)
    expect(after).not.toBe(before) // recomputed
    expect(after).toEqual(layout_cnv(self)) // and correct
    // The rebuilt last candle's close pixel tracks the live close.
    expect(after.candles[li].c).toBe(before.candles[li].c + 6) // A=2 -> *2
  })

  test('price transform (A/B) change busts the cache', () => {
    const sub = makeSub()
    const layout = makeLayout()
    const self = makeSelf(sub, layout)
    const cache = { key: '', val: null }

    const before = layout_cnv_cached(self, cache)
    layout.A = 3 // Y-axis rescale
    const after = layout_cnv_cached(self, cache)

    expect(after).not.toBe(before)
    expect(after).toEqual(layout_cnv(self))
  })

  test('horizontal pan (t2screen anchor) change busts the cache', () => {
    const sub = makeSub()
    let shift = 0
    const layout = makeLayout({
      t2screen: (t) => Math.floor(((t - T0) / STEP) * 12) - 0.5 + shift,
    })
    const self = makeSelf(sub, layout)
    const cache = { key: '', val: null }

    const before = layout_cnv_cached(self, cache)
    shift = 25 // pan: every bar's screen-x shifts
    const after = layout_cnv_cached(self, cache)

    expect(after).not.toBe(before)
    expect(after.candles[0].x).toBe(before.candles[0].x + 25)
    expect(after).toEqual(layout_cnv(self))
  })

  test('px_step (zoom / width resize) change busts the cache', () => {
    const sub = makeSub()
    const layout = makeLayout()
    const self = makeSelf(sub, layout)
    const cache = { key: '', val: null }

    const before = layout_cnv_cached(self, cache)
    layout.px_step = 20
    const after = layout_cnv_cached(self, cache)

    expect(after).not.toBe(before)
    expect(after).toEqual(layout_cnv(self))
  })

  test('an INTERIOR bar volume change busts the cache (it moves the pane volume max → rescales every bar)', () => {
    const sub = makeSub()                 // volumes 1000..1050, max = last bar
    const self = makeSelf(sub, makeLayout())
    const cache = { key: '', val: null }

    const before = layout_cnv_cached(self, cache)
    // Spike an INTERIOR (non-last) bar's volume above the current max — length,
    // last-bar OHLCV and the transform are all unchanged, so without maxv in the
    // key this would HIT and serve a stale, mis-scaled volume pane.
    sub[2][5] = 5000
    const after = layout_cnv_cached(self, cache)

    expect(after).not.toBe(before)               // busted
    expect(after).toEqual(layout_cnv(self))      // and correct
    // The whole pane rescaled: bar 0's volume height shrinks under the new max.
    expect(after.volume[0].h).not.toBeCloseTo(before.volume[0].h, 5)
  })

  test('a colour-only recolour of an EARLIER bar does NOT bust (geometry cache is colour-agnostic; colour re-read at draw)', () => {
    const sub = makeSub()
    const self = makeSelf(sub, makeLayout())
    const cache = { key: '', val: null }

    const before = layout_cnv_cached(self, cache)
    // Stamp a per-candle colour override on an earlier bar (raw[6]).
    sub[0][6] = '#abcdef'
    const after = layout_cnv_cached(self, cache)

    // Same geometry object (cache HIT): only the last bar's colour is keyed,
    // and drawCandles re-reads raw[6] from the live row at draw time, so the
    // recolour still shows without a geometry rebuild.
    expect(after).toBe(before)
    // The cached candle still references the live (now recoloured) row.
    expect(after.candles[0].raw[6]).toBe('#abcdef')
  })
})
