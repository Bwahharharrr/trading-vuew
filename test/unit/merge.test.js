import { test, expect, describe } from 'vitest'
import { mergeTs, mergeObjects, tsOverlap, combine, binarySearchGTE, binarySearchLTE } from '../../src/stores/merge.js'

// Pivot helper mirroring the DataCube {p,i,v} shape.
const piv = (arr) => { const p = { v: arr }; return { p, i: 'v', v: arr } }

describe('merge engine (framework-agnostic, no DataCube)', () => {
  test('mergeTs: disjoint [dst]...[src] appends', () => {
    const o = piv([[1000, 1], [1001, 2], [1002, 3]])
    mergeTs(o, [[1005, 66], [1006, 77]])
    expect(o.p.v).toEqual([[1000, 1], [1001, 2], [1002, 3], [1005, 66], [1006, 77]])
  })

  test('mergeTs: overlap [src [ ] dst] keeps src in overlap', () => {
    const o = piv([[1002, 4], [1003, 5], [1004, 6]])
    mergeTs(o, [[1000, 11], [1001, 22], [1002, 33]])
    expect(o.p.v).toEqual([[1000, 11], [1001, 22], [1002, 33], [1003, 5], [1004, 6]])
  })

  test('mergeTs: src fully contains dst => src wins', () => {
    const o = piv([[1002, 3], [1003, 4]])
    mergeTs(o, [[1000, 11], [1001, 22], [1002, 33], [1003, 44], [1004, 55], [1005, 66]])
    expect(o.p.v).toEqual([[1000, 11], [1001, 22], [1002, 33], [1003, 44], [1004, 55], [1005, 66]])
  })

  test('mergeObjects: replaces with a fresh merged object', () => {
    const parent = { settings: { a: 1, b: 2 } }
    mergeObjects({ p: parent, i: 'settings', v: parent.settings }, { b: 9, c: 3 })
    expect(parent.settings).toEqual({ a: 1, b: 9, c: 3 })
  })

  test('binary search GTE/LTE on sorted [ts,...] rows', () => {
    const a = [[10], [20], [30], [40]]
    expect(binarySearchGTE(a, 25)).toBe(2)
    expect(binarySearchLTE(a, 25)).toBe(1)
    expect(binarySearchGTE(a, 5)).toBe(0)
    expect(binarySearchLTE(a, 5)).toBe(-1)
    expect(binarySearchGTE([], 1)).toBe(-1)
  })

  test('tsOverlap + combine round-trip preserves sorted order', () => {
    const a = [[1, 1], [2, 2], [3, 3]]
    const b = [[2, 22], [3, 33], [4, 44]]
    const { od } = tsOverlap(a, b, [2, 3])
    expect(od).toEqual([[2, 22], [3, 33]]) // src wins in overlap
  })
})
