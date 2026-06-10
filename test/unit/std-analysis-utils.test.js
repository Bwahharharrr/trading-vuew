// std/analysis.js + std/utils.js — invoked directly on the source modules.
import { test, expect, describe } from 'vitest'
import { mkStd, ts } from './_std-direct.js'

describe('std/analysis operators', () => {
  const s = mkStd()
  test('add/sub/mult/div/neg on plain numbers return TS([result])', () => {
    expect(s.add(2, 3)[0]).toBe(5)
    expect(s.sub(2, 3)[0]).toBe(-1)
    expect(s.mult(2, 3)[0]).toBe(6)
    expect(s.div(6, 3)[0]).toBe(2)
    expect(s.neg(4)[0]).toBe(-4)
  })

  test('operators unwrap TS args (use [0]) and propagate NaN on na', () => {
    expect(s.add(ts([10]), ts([5]))[0]).toBe(15)
    expect(Number.isNaN(s.add(NaN, 3)[0])).toBe(true)   // na(x) → NaN
    expect(Number.isNaN(s.mult(NaN, 2)[0])).toBe(true)
  })

  test('avg / max / min over varargs (engine appends a trailing _id, which is popped)', () => {
    expect(s.avg(2, 4, 6, '_id')).toBe(4)
    expect(s.max(2, 9, 4, '_id')).toBe(9)
    expect(s.min(2, 9, 4, '_id')).toBe(2)
  })

  test('change: src[0] - src[len]', () => {
    expect(s.change(ts([10, 7]))[0]).toBe(3)        // default len 1
    expect(s.change(ts([10, 9, 6]), 2)[0]).toBe(4)
  })

  test('cross / crossover / crossunder', () => {
    // a went from below→above b ⇒ cross true, crossover true, crossunder false
    const a = ts([6, 4], 'a'); const b = ts([5, 5], 'b')
    expect(s.cross(a, b)[0]).toBe(true)
    expect(s.crossover(a, b)[0]).toBe(true)
    expect(s.crossunder(a, b)[0]).toBe(false)
    // no crossing
    expect(s.cross(ts([6, 7], 'a'), ts([5, 5], 'b'))[0]).toBe(false)
  })

  test('rising / falling over a window', () => {
    expect(s.rising(ts([3, 2, 1]), 2)[0]).toBe(true)
    expect(s.rising(ts([3, 4, 1]), 2)[0]).toBe(false)
    expect(s.falling(ts([1, 2, 3]), 2)[0]).toBe(true)
    expect(s.falling(ts([1, 0, 3]), 2)[0]).toBe(false)
  })

  test('highest / lowest scan the window', () => {
    expect(s.highest(ts([3, 9, 1, 5]), 4)[0]).toBe(9)
    expect(s.lowest(ts([3, 9, 1, 5]), 4)[0]).toBe(1)
  })

  test('cum accumulates (needs the running buffer)', () => {
    const std = mkStd()
    // bar 1
    std.cum(ts([5], 'x'))
    // bar 2: the cum buffer holds the prior sum at [1]
    const id = std._tsid(undefined, 'cum')
    std.env.tss[id].unshift(std.env.tss[id][0])
    const r = std.cum(ts([3], 'x'))
    expect(r[0]).toBe(8)
  })
})

describe('std/utils', () => {
  const s = mkStd()
  test('na / nz / nf null-and-NaN handling', () => {
    expect(s.na(undefined)).toBe(true)
    expect(s.na(NaN)).toBe(true)
    expect(s.na(0)).toBe(false)
    expect(s.nz(NaN, 7)).toBe(7)
    expect(s.nz(undefined)).toBe(0)
    expect(s.nz(5)).toBe(5)
    expect(s.nf(Infinity, 2)).toBe(2)
    expect(s.nf(3)).toBe(3)
  })

  test('bool / iff', () => {
    expect(s.bool(0)).toBe(false)
    expect(s.bool('x')).toBe(true)
    expect(s.iff(true, 'a', 'b')).toBe('a')
    expect(s.iff(false, 'a', 'b')).toBe('b')
    expect(s.iff(ts([1], 'c'), 'a', 'b')).toBe('a') // TS condition uses [0]
    expect(s.iff(ts([0], 'c'), 'a', 'b')).toBe('b')
  })

  test('fixnan back-fills the head with the nearest prior non-NaN', () => {
    expect(s.fixnan(ts([NaN, NaN, 5, 6]))[0]).toBe(5)
    expect(s.fixnan(ts([3, NaN]))[0]).toBe(3) // already finite → untouched
  })

  test('offset tags a TS / wraps a scalar', () => {
    const tagged = s.offset(ts([1, 2], 'o'), 2)
    expect(tagged.__offset__).toBe(2)
    const wrapped = s.offset(5, 1)
    expect(wrapped.__offset__).toBe(1)
  })

  test('buffsize sets the reverse-buffer length', () => {
    const a = ts([1])
    s.buffsize(a, 12)
    expect(a.__len__).toBe(12)
  })
})

describe('std/analysis — bars/pivots/sum', () => {
  const s = mkStd()
  test('highestbars / lowestbars return the NEGATIVE offset of the extreme', () => {
    expect(s.highestbars(ts([3, 9, 1, 5]), 4)[0]).toBe(-1) // 9 is 1 bar back
    expect(s.lowestbars(ts([3, 9, 1, 5]), 4)[0]).toBe(-2)  // 1 is 2 bars back
  })

  test('sum over a window', () => {
    expect(s.sum(ts([1, 2, 3, 4]), 3)[0]).toBe(6) // 1+2+3
  })

  test('pivothigh / pivotlow detect a local extreme at the center', () => {
    // window of left+right+1 = 3; center (index right=1) is the peak
    expect(s.pivothigh(ts([1, 9, 1], 'p'), 1, 1)[0]).toBe(9)
    expect(s.pivotlow(ts([5, 0, 5], 'p'), 1, 1)[0]).toBe(0)
    // not a pivot → NaN
    expect(Number.isNaN(s.pivothigh(ts([1, 2, 3], 'p'), 1, 1)[0])).toBe(true)
  })

  test('since counts bars since a condition was last true', () => {
    const std = mkStd()
    // bar 1: cond false
    std.since(false)
    let id = std._tsid(undefined, 'since')
    // bar 2: cond true → 0
    std.env.tss[id] && std.env.tss[id].unshift(std.env.tss[id][0])
    const r = std.since(true)
    expect(r[0]).toBe(0)
  })
})

describe('std/timeseries core (ts / tstf / sample / _tsid / _i / _v)', () => {
  test('ts creates a per-id buffer and updates [0] in place', () => {
    const s = mkStd()
    const a = s.ts(5, 'x')
    expect(a[0]).toBe(5)
    expect(a.__id__).toBe('x')
    const b = s.ts(7, 'x')
    expect(b).toBe(a)     // same buffer reused
    expect(a[0]).toBe(7)
  })

  test('tstf / sample attach a sampler and aggregate by timeframe', () => {
    const s = mkStd()
    const a = s.tstf(3, '5m', 'agg')
    expect(a.__tf__).toBeGreaterThan(0)
    expect(typeof a.__fn__).toBe('function')
    s.tstf(4, '5m', 'agg') // second value runs the sampler (no throw)
    const c = s.sample(2, 'high', '5m', 'smp')
    expect(c.__id__).toBe('smp')
  })

  test('_tsid composes a lineage string; _i / _v grow the buffer length', () => {
    const s = mkStd()
    expect(s._tsid('a', 'b')).toBe('a<-b')
    const tsArr = ts([1, 2, 3], 'q')
    s._i(5, tsArr)
    expect(tsArr.__len__).toBeGreaterThanOrEqual(6)
    const tsArr2 = ts([1], 'q2')
    expect(s._v(tsArr2, 9)).toBe(tsArr2)
    expect(tsArr2.__len__).toBeGreaterThanOrEqual(10)
    // non-TS inputs pass through untouched
    expect(s._v(42, 3)).toBe(42)
    expect(s._i(2, 99)).toBe(2)
  })
})
