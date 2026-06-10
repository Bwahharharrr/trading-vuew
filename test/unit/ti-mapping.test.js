// ti_mapping.js (TI) — index↔time mapping for the non-linear (index-based)
// t-axis. Regular mode is a pass-through; IB mode builds discrete maps with
// linear inter/extra-polation. Previously 15% covered.
import { test, expect, describe } from 'vitest'
import TI from '../../src/components/js/ti_mapping.js'

const TF = 60_000
// A sub-series with a GAP (so index != time is meaningful): indices 0..3 map to
// t = 0, 1, 2, 10 (×TF). sub_start = 0.
const SUB = [[0], [TF], [2 * TF], [10 * TF]].map((r, i) => [r[0], i])

function ibMap() {
  const ti = new TI()
  ti.init({
    sub: null, interval: null, meta: { sub_start: 0 },
    $props: {}, interval_ms: TF, sub_start: 0, ib: true,
  }, SUB)
  return ti
}

describe('regular (non-IB) mode is a pass-through', () => {
  const ti = new TI()
  ti.init({ meta: {}, interval_ms: TF, sub_start: 0, ib: false }, SUB)
  test('i2t / t2i identity; parse returns data unchanged', () => {
    expect(ti.i2t(7)).toBe(7)
    expect(ti.parse([[123, 1]], 'map')).toEqual([[123, 1]])
    expect(ti.ib).toBe(false)
  })
})

describe('IB mode discrete maps', () => {
  const ti = ibMap()
  test('map_sub built both directions + index-stamped sub', () => {
    expect(ti.it_map[0]).toBe(0)
    expect(ti.it_map[3]).toBe(10 * TF)
    expect(ti.ti_map[10 * TF]).toBe(3)
    expect(ti.sub_i[3][0]).toBe(3) // timestamp slot replaced by index
  })

  test('i2t: discrete hit, then extrapolation beyond both ends', () => {
    expect(ti.i2t(2)).toBe(2 * TF)              // discrete
    expect(ti.i2t(5)).toBe(10 * TF + 2 * TF)    // 2 indices past the last → +2 TF
    expect(ti.i2t(-2)).toBe(0 - 2 * TF)         // before the first
  })

  test('i2t: linear interpolation between two mapped indices', () => {
    // halfway between index 2 (t=2TF) and index 3 (t=10TF) → 6TF
    expect(ti.i2t(2.5)).toBeCloseTo(6 * TF, 6)
  })

  test('t2i: discrete hit, extrapolation, interpolation', () => {
    expect(ti.t2i(2 * TF)).toBe(2)                       // discrete
    expect(ti.t2i(-TF)).toBeCloseTo(-1, 6)              // before t0
    expect(ti.t2i(12 * TF)).toBeCloseTo(3 + 2, 6)       // after tN (+2 TF past index 3)
    expect(ti.t2i(6 * TF)).toBeCloseTo(2.5, 6)          // between t=2TF and t=10TF
  })

  test('smth2i / smth2t auto-detect index vs time by magnitude', () => {
    const big = Math.pow(2, 32) + 1
    expect(ti.smth2i(2)).toBe(2)              // small → index, pass through
    expect(typeof ti.smth2i(big)).toBe('number') // big → treated as time
    expect(ti.smth2t(2)).toBe(2 * TF)         // small → index → time
    expect(ti.smth2t(big)).toBe(big)          // big → already time
  })

  test('i2t_mode bypasses mapping in data mode', () => {
    expect(ti.i2t_mode(2, 'data')).toBe(2)
    expect(ti.i2t_mode(2, 'map')).toBe(2 * TF)
  })
})

describe('parse() maps overlay data to indices', () => {
  test('map mode: exact-timestamp rows get their index', () => {
    const ti = ibMap()
    const out = ti.parse([[0, 11], [2 * TF, 22], [10 * TF, 33]], 'map')
    expect(out.map(r => r[0])).toEqual([0, 2, 3])
    expect(out[1][1]).toBe(22) // value preserved
  })

  test('data mode is a pass-through', () => {
    const ti = ibMap()
    expect(ti.parse([[999, 1]], 'data')).toEqual([[999, 1]])
  })
})
