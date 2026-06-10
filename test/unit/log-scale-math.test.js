// stuff/math.js + log_scale.js — the log-scale projection math the app runs
// under by DEFAULT (log_scale: true), previously 0% covered.
import { test, expect, describe } from 'vitest'
import math from '../../src/stuff/math.js'
import log_scale from '../../src/components/js/log_scale.js'

describe('symmetric log/exp', () => {
  test('log/exp are inverses across positive, negative and zero', () => {
    for (const x of [0, 1, 100, 65000.5, -1, -420.42, 0.001]) {
      expect(math.exp(math.log(x))).toBeCloseTo(x, 8)
    }
  })

  test('symmetry: log(-x) === -log(x); monotonic', () => {
    expect(math.log(-50)).toBeCloseTo(-math.log(50), 12)
    expect(math.log(10)).toBeGreaterThan(math.log(9))
    expect(math.log(0)).toBe(0)
  })
})

describe('log_mid / re_range', () => {
  test('log_mid returns the price at the pixel midpoint (between lo and hi)', () => {
    const mid = math.log_mid([100, 10], 200)
    expect(mid).toBeGreaterThan(10)
    expect(mid).toBeLessThan(100)
    // exactly halfway in LOG space
    expect(math.log(mid)).toBeCloseTo((math.log(100) + math.log(10)) / 2, 8)
  })

  test('re_range preserves the target midline under a new high', () => {
    const r1 = [100, 10]
    const mid = math.log_mid(r1, 200)
    const lo2 = math.re_range(r1, 120, mid)
    // the same mid must still sit at the same RELATIVE log position
    const rel1 = (math.log(r1[0]) - math.log(mid)) / (math.log(r1[0]) - math.log(r1[1]))
    const rel2 = (math.log(120) - math.log(mid)) / (math.log(120) - math.log(lo2))
    expect(rel2).toBeCloseTo(rel1, 8)
  })
})

describe('point/line geometry', () => {
  test('point2line: perpendicular distance', () => {
    expect(math.point2line([0, 5], [-10, 0], [10, 0])).toBeCloseTo(5, 6)
    // degenerate line (p2 === p3) must not produce NaN/Infinity
    expect(Number.isFinite(math.point2line([3, 4], [1, 1], [1, 1]))).toBe(true)
  })

  test('point2seg: clamps to the nearest endpoint beyond the segment', () => {
    const inside = math.point2seg([0, 3], [-5, 0], [5, 0])
    const beyond = math.point2seg([9, 0], [-5, 0], [5, 0])
    expect(beyond).toBeGreaterThan(inside) // off the end → endpoint distance wins
    expect(beyond).toBeCloseTo(4, 6)       // 9 - 5
  })

  test('point2ray: free in the ray direction, clamped behind the origin', () => {
    const ahead = math.point2ray([20, 0], [0, 0], [5, 0])
    const behind = math.point2ray([-7, 0], [0, 0], [5, 0])
    expect(ahead).toBeCloseTo(0, 6)
    expect(behind).toBeCloseTo(7, 6)
  })
})

describe('log_scale grid mapping', () => {
  // A grid mapping like grid_maker builds in log mode: y = log($) * A + B
  function mkSelf(hi, lo, height) {
    const A = -height / (math.log(hi) - math.log(lo))
    const B = -math.log(hi) * A
    return { $_hi: hi, $_lo: lo, A, B, px_step: 8 }
  }

  test('candle(): hi maps to the top, lo to the bottom, mid in between', () => {
    const self = mkSelf(100, 10, 200)
    const $p = { config: { CANDLEW: 0.6 } }
    const c = log_scale.candle(self, 50, [0, 100, 100, 10, 10, 1], $p)
    expect(c.o).toBe(0)                       // open at $_hi → y 0
    expect(c.h).toBe(0)
    expect(Math.abs(c.l - 200)).toBeLessThanOrEqual(1) // low at $_lo → y ≈ height
    expect(c.w).toBeCloseTo(8 * 0.6, 6)
    expect(c.raw[1]).toBe(100)
  })

  test('expand(): pads 10% above and below in LOG space (hi grows, lo shrinks)', () => {
    const self = mkSelf(100, 10, 200)
    log_scale.expand(self, 200)
    expect(self.$_hi).toBeGreaterThan(100)
    expect(self.$_lo).toBeLessThan(10)
    expect(self.$_lo).toBeGreaterThan(0) // log padding cannot cross zero
  })

  test('expand(): collapsed range (all prices equal) nudges apart, no div-by-zero', () => {
    const self = { $_hi: 50, $_lo: 50 }
    log_scale.expand(self, 200)
    expect(self.$_hi).toBeGreaterThan(self.$_lo)
    expect(Number.isFinite(self.$_hi)).toBe(true)
    expect(Number.isFinite(self.$_lo)).toBe(true)
  })
})
