// stuff/utils.js — core math/lookup helpers (pure node). Covers the
// binary-search / interval-detection / fast-filter / layout-copy / deep-copy /
// date-LRU branches NOT already exercised by stuff-utils.test.js.
//
// All asserted values were observed against the real source + arrayslicer dep;
// these pin ACTUAL current behavior (incl. the IndexedArray fallback path and
// the LRU eviction edge).
import { test, expect, describe } from 'vitest'
import Utils from '../../src/stuff/utils.js'
import Const from '../../src/stuff/constants.js'

describe('nearest_a — O(log n) binary search', () => {
  test('returns [-1, null] for empty or null arrays', () => {
    expect(Utils.nearest_a(5, [])).toEqual([-1, null])
    expect(Utils.nearest_a(5, null)).toEqual([-1, null])
    expect(Utils.nearest_a(5, undefined)).toEqual([-1, null])
  })

  test('returns [0, array[0]] for a single-element array regardless of x', () => {
    expect(Utils.nearest_a(99, [42])).toEqual([0, 42])
    expect(Utils.nearest_a(-99, [42])).toEqual([0, 42])
  })

  test('clamps to lo when x <= first and to hi when x >= last', () => {
    const a = [10, 20, 30, 40]
    expect(Utils.nearest_a(5, a)).toEqual([0, 10])    // below first
    expect(Utils.nearest_a(10, a)).toEqual([0, 10])   // equal first (x <= lo)
    expect(Utils.nearest_a(99, a)).toEqual([3, 40])   // above last
    expect(Utils.nearest_a(40, a)).toEqual([3, 40])   // equal last (x >= hi)
  })

  test('exact interior match returns that index', () => {
    const a = [10, 20, 30, 40]
    expect(Utils.nearest_a(30, a)).toEqual([2, 30])
  })

  test('picks the LEFT neighbor on an exact tie (distLo <= distHi)', () => {
    // x=25 is equidistant from 20 and 30 → left wins
    expect(Utils.nearest_a(25, [10, 20, 30, 40])).toEqual([1, 20])
  })

  test('against Const.TIMESCALES, a value just below MONTH snaps to the adjacent scale', () => {
    const TS = Const.TIMESCALES
    const monthIdx = TS.indexOf(Const.MONTH) // 18
    const lowerIdx = monthIdx - 1            // DAY*15
    const mid = (TS[lowerIdx] + TS[monthIdx]) / 2
    // just below the DAY*15↔MONTH midpoint (still < MONTH) → adjacent lower scale
    expect(Utils.nearest_a(mid - 1, TS)).toEqual([lowerIdx, TS[lowerIdx]])
    // just above the midpoint → snaps up to MONTH
    expect(Utils.nearest_a(mid + 1, TS)).toEqual([monthIdx, Const.MONTH])
  })
})

describe('detect_interval', () => {
  test('returns the minimum positive delta for evenly-spaced 1m ohlcv', () => {
    const ohlcv = []
    for (let i = 0; i < 5; i++) ohlcv.push([i * 60000, 1, 1, 1, 1, 1])
    expect(Utils.detect_interval(ohlcv)).toBe(60000)
  })

  test('clamps a "monthly" min delta in [MONTH, DAY*30] up to DAY*31', () => {
    const monthly = [[0], [Const.DAY * 30], [Const.DAY * 60]]
    expect(Utils.detect_interval(monthly)).toBe(Const.DAY * 31)
  })

  test('ignores NaN deltas via the d === d guard', () => {
    // The NaN timestamp produces NaN deltas that are skipped; the real 60s
    // spacing between the valid rows is detected.
    const withNaN = [[0], [NaN], [120000], [180000]]
    expect(Utils.detect_interval(withNaN)).toBe(60000)
  })

  test('caps the scan at 99 rows — a tiny delta beyond index 99 is ignored', () => {
    const late = []
    let t = 0
    for (let i = 0; i < 150; i++) {
      late.push([t])
      t += i >= 120 ? 1 : 1000 // 1ms steps only AFTER the 99-row scan window
    }
    expect(Utils.detect_interval(late)).toBe(1000)

    // sanity: the same tiny step INSIDE the window is honored
    const early = []
    let t2 = 0
    for (let i = 0; i < 150; i++) {
      early.push([t2])
      t2 += i >= 50 ? 1 : 1000
    }
    expect(Utils.detect_interval(early)).toBe(1)
  })

  test('0/1-length arrays yield Infinity (no deltas to scan)', () => {
    expect(Utils.detect_interval([])).toBe(Infinity)
    expect(Utils.detect_interval([[0]])).toBe(Infinity)
  })
})

describe('parse_tf', () => {
  test('maps known timeframe strings to ms via Const.map_unit', () => {
    expect(Utils.parse_tf('15m')).toBe(Const.MINUTE15)
    expect(Utils.parse_tf('1H')).toBe(Const.HOUR)
    expect(Utils.parse_tf('4h')).toBe(Const.HOUR4)
    expect(Utils.parse_tf('1D')).toBe(Const.DAY)
    expect(Utils.parse_tf('1M')).toBe(Const.MONTH)
  })

  test('returns a numeric input unchanged', () => {
    expect(Utils.parse_tf(12345)).toBe(12345)
    expect(Utils.parse_tf(0)).toBe(0)
  })

  test('returns undefined for an unknown timeframe string', () => {
    expect(Utils.parse_tf('zzz')).toBeUndefined()
  })
})

describe('fast_filter', () => {
  test('returns [arr, undefined] on an empty array (same ref back)', () => {
    const empty = []
    const [res, i0] = Utils.fast_filter(empty, 0, 10)
    expect(res).toBe(empty)
    expect(i0).toBeUndefined()
  })

  test('bounds short-circuit returns [[], undefined] when wholly out of [t1,t2]', () => {
    const arr = [[10], [20], [30], [40], [50]]
    expect(Utils.fast_filter(arr, 100, 200)).toEqual([[], undefined]) // all below t1
    expect(Utils.fast_filter(arr, -50, 5)).toEqual([[], undefined])   // all above t2
  })

  test('returns in-range rows + a numeric next-index i0 for a normal range', () => {
    const arr = [[10], [20], [30], [40], [50]]
    // t1=15 is between rows → valpos[15].next is the numeric next index (1)
    const [res, i0] = Utils.fast_filter(arr, 15, 35)
    expect(res).toEqual([[20], [30]])
    expect(typeof i0).toBe('number')
    expect(i0).toBe(1)
  })

  test('falls back to Array.filter returning [filtered, 0] when the slice lib throws', () => {
    const arr = [[10], [20], [30], [40], [50]]
    // t1=5 is below the data minimum: IndexedArray.fetch never memoizes valpos[5],
    // so `ia.valpos[t1].next` throws (TypeError) → catch → Array.filter fallback.
    const [res, i0] = Utils.fast_filter(arr, 5, 30)
    expect(res).toEqual([[10], [20], [30]])
    expect(i0).toBe(0)
  })
})

describe('copy_layout', () => {
  test('overwrites an array in place (same ref) when the new length differs', () => {
    const obj = { arr: [{ a: 1 }, { a: 2 }] }
    const ref = obj.arr
    Utils.copy_layout(obj, { arr: [{ a: 9 }, { a: 8 }, { a: 7 }] })
    expect(obj.arr).toBe(ref) // splice keeps the reference
    expect(obj.arr).toEqual([{ a: 9 }, { a: 8 }, { a: 7 }])
  })

  test('does element-wise Object.assign (no ref swap) when array lengths match', () => {
    const obj = { rows: [{ a: 1 }, { a: 2 }] }
    const rowsRef = obj.rows
    const e0 = obj.rows[0]
    const e1 = obj.rows[1]
    Utils.copy_layout(obj, { rows: [{ a: 10, b: 1 }, { a: 20 }] })
    expect(obj.rows).toBe(rowsRef)   // container ref preserved
    expect(obj.rows[0]).toBe(e0)     // element refs preserved (assigned onto)
    expect(obj.rows[1]).toBe(e1)
    expect(obj.rows).toEqual([{ a: 10, b: 1 }, { a: 20 }])
  })

  test('Object.assign for a non-array property (merges onto the same object)', () => {
    const obj = { meta: { x: 1 } }
    const ref = obj.meta
    Utils.copy_layout(obj, { meta: { x: 2, y: 3 } })
    expect(obj.meta).toBe(ref)
    expect(obj.meta).toEqual({ x: 2, y: 3 })
  })
})

describe('fastDeepCopy', () => {
  test('returns primitives unchanged', () => {
    expect(Utils.fastDeepCopy(5)).toBe(5)
    expect(Utils.fastDeepCopy('hi')).toBe('hi')
    expect(Utils.fastDeepCopy(null)).toBeNull()
    expect(Utils.fastDeepCopy(true)).toBe(true)
  })

  test('a primitive array is returned as a NEW slice, not the same ref', () => {
    const pa = [1, 2, 3]
    const copy = Utils.fastDeepCopy(pa)
    expect(copy).not.toBe(pa)
    expect(copy).toEqual([1, 2, 3])
  })

  test('an empty array returns a fresh []', () => {
    const e = []
    const copy = Utils.fastDeepCopy(e)
    expect(copy).toEqual([])
    expect(copy).not.toBe(e)
  })

  test('nested arrays/objects are deep-cloned — mutating the copy does not touch the original', () => {
    const nested = [{ a: [1, 2] }, { b: { c: 3 } }]
    const copy = Utils.fastDeepCopy(nested)
    copy[0].a.push(99)
    copy[1].b.c = 77
    expect(nested).toEqual([{ a: [1, 2] }, { b: { c: 3 } }])
    expect(copy).toEqual([{ a: [1, 2, 99] }, { b: { c: 77 } }])

    const obj = { x: 1, y: { z: 2 } }
    const ocopy = Utils.fastDeepCopy(obj)
    ocopy.y.z = 100
    expect(obj.y.z).toBe(2)
    expect(ocopy.y.z).toBe(100)
  })
})

describe('getCachedDate — LRU date cache', () => {
  test('returns the SAME Date instance on a repeat timestamp (cache hit)', () => {
    Utils._dateCache.clear()
    const d1 = Utils.getCachedDate(1000)
    const d1b = Utils.getCachedDate(1000)
    expect(d1).toBeInstanceOf(Date)
    expect(d1.getTime()).toBe(1000)
    expect(d1b).toBe(d1) // identity, not just equality
  })

  test('evicts the oldest entry after 16 distinct timestamps (size stays <= 16)', () => {
    Utils._dateCache.clear()
    const oldest = Utils.getCachedDate(1000) // first inserted
    expect(Utils._dateCache.size).toBe(1)
    // add 16 more distinct stamps → first insertion (1000) is evicted
    for (let i = 0; i < 16; i++) Utils.getCachedDate(2000 + i)
    expect(Utils._dateCache.size).toBe(16)
    expect(Utils._dateCache.has(1000)).toBe(false)
    expect(Utils._dateCache.size).toBeLessThanOrEqual(16)
    // a now-evicted stamp yields a fresh (non-identical) instance on re-fetch
    const refetched = Utils.getCachedDate(1000)
    expect(refetched).not.toBe(oldest)
    expect(refetched.getTime()).toBe(1000)
  })
})
