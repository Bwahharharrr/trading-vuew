import { test, expect, describe } from 'vitest'
import { clampGoto, clampRange, dataBounds } from '../../src/helpers/nav.js'

const BOUNDS = [1000, 2000]

describe('clampGoto', () => {
  test('in-range target is unchanged, no diagnostics', () => {
    const r = clampGoto(1500, BOUNDS)
    expect(r.value).toBe(1500)
    expect(r.diagnostics).toEqual([])
  })
  test('below range clamps to first + warns', () => {
    const r = clampGoto(500, BOUNDS)
    expect(r.value).toBe(1000)
    expect(r.diagnostics[0].code).toBe('nav.goto.out_of_range')
    expect(r.diagnostics[0].level).toBe('warn')
  })
  test('above range clamps to last + warns', () => {
    const r = clampGoto(9999, BOUNDS)
    expect(r.value).toBe(2000)
    expect(r.diagnostics).toHaveLength(1)
  })
  test('null bounds is a pass-through', () => {
    expect(clampGoto(500, null).value).toBe(500)
  })
})

describe('clampRange', () => {
  test('valid in-range range is unchanged', () => {
    const r = clampRange(1200, 1800, BOUNDS)
    expect([r.t1, r.t2]).toEqual([1200, 1800])
    expect(r.diagnostics).toEqual([])
  })
  test('reversed range is swapped + warns', () => {
    const r = clampRange(1800, 1200, BOUNDS)
    expect([r.t1, r.t2]).toEqual([1200, 1800])
    expect(r.diagnostics.some((d) => d.code === 'nav.range.reversed')).toBe(true)
  })
  test('range partly past the edge is allowed (over-scroll, no warn)', () => {
    const r = clampRange(1800, 2500, BOUNDS)
    expect([r.t1, r.t2]).toEqual([1800, 2500]) // not clamped
    expect(r.diagnostics).toEqual([])
  })
  test('range entirely off-data warns', () => {
    const r = clampRange(3000, 4000, BOUNDS)
    expect(r.diagnostics.some((d) => d.code === 'nav.range.off_data')).toBe(true)
  })
})

describe('dataBounds', () => {
  test('extracts first/last timestamp', () => {
    const dc = { data: { chart: { data: [[1000, 1], [1500, 2], [2000, 3]] } } }
    expect(dataBounds(dc)).toEqual([1000, 2000])
  })
  test('empty / missing data → null', () => {
    expect(dataBounds(null)).toBe(null)
    expect(dataBounds({ data: { chart: { data: [] } } })).toBe(null)
    expect(dataBounds({})).toBe(null)
  })
})
