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

describe('gap-fill merges (regression: data in a dst gap was silently dropped)', () => {
  test('chunk inside a gap of dst is INSERTED, not dropped', () => {
    const o = piv([[1, 'a'], [2, 'b'], [5, 'c'], [6, 'd']])
    mergeTs(o, [[3, 'x'], [4, 'y']])
    expect(o.p.v).toEqual([[1, 'a'], [2, 'b'], [3, 'x'], [4, 'y'], [5, 'c'], [6, 'd']])
  })

  test('chunk surrounding a small dst keeps the dst points', () => {
    const o = piv([[3, 'a'], [4, 'b']])
    mergeTs(o, [[1, 'p'], [2, 'q'], [5, 'r'], [6, 's']])
    expect(o.p.v).toEqual([[1, 'p'], [2, 'q'], [3, 'a'], [4, 'b'], [5, 'r'], [6, 's']])
  })

  test('gap chunk PARTIALLY overlapping one dst point still merges new-wins', () => {
    const o = piv([[1, 'a'], [2, 'b'], [5, 'c']])
    mergeTs(o, [[2, 'B'], [3, 'x']])
    expect(o.p.v).toEqual([[1, 'a'], [2, 'B'], [3, 'x'], [5, 'c']])
  })

  test('backfill scenario: post-disconnect gap healed by a chunk', () => {
    // live left a hole 1003..1004; the backfill chunk covers it exactly
    const o = piv([[1000, 1], [1001, 2], [1002, 3], [1005, 9], [1006, 10]])
    mergeTs(o, [[1003, 7], [1004, 8]])
    expect(o.p.v.map((r) => r[0])).toEqual([1000, 1001, 1002, 1003, 1004, 1005, 1006])
  })
})

describe('multi-match merge isolation (regression: first match consumed the chunk)', () => {
  test('each matched overlay receives the full chunk with independent rows', async () => {
    const { default: DataCube } = await import('../../src/helpers/datacube.js')
    const dc = new DataCube({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [
        { name: 'EMA, 9', type: 'EMA', data: [[1, 10], [2, 20]], settings: {} },
        { name: 'EMA, 21', type: 'EMA', data: [[1, 10], [2, 20]], settings: {} },
      ],
      offchart: [],
    }, { scripts: false, validation: 'off' })
    dc.merge('EMA.data', [[2, 99], [3, 30]])
    const a = dc.data.onchart[0].data
    const b = dc.data.onchart[1].data
    expect(a).toEqual([[1, 10], [2, 99], [3, 30]])
    expect(b).toEqual([[1, 10], [2, 99], [3, 30]])     // sibling got the SAME update
    expect(a[1]).not.toBe(b[1])                         // ...with independent rows
    a[2][1] = 777
    expect(b[2][1]).toBe(30)                            // no cross-overlay aliasing
  })
})
