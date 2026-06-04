// GOLDEN MASTER — DataCube merge + query.
//
// Pins the time-series merge overlap behaviour (merge_ts) and the string-path
// query resolution (get_by_query) of the CURRENT DataCube before the Phase 3
// store rewrite. The strangler-fig adapter that replaces DataCube must keep
// these byte-identical.
import { test, expect, describe } from 'vitest'
import DataCube from '../../src/helpers/datacube.js'

// ── merge_ts overlap matrix ───────────────────────────────────────────────
// A compact golden of every src/dst overlap arrangement in one artifact.
class Dst {
  constructor(arr) { this.p = this; this.v = arr; this.i = 'v' }
}

describe('DataCube.merge_ts overlap matrix', () => {
  const dc = new DataCube()
  dc.tv = { $set: (parent, index, data) => { parent[index] = data } }

  const cases = {
    'src...dst': [[[1005, 4], [1006, 5], [1007, 6]], [[1000, 11], [1001, 22], [1002, 33]]],
    'src.dst': [[[1003, 4], [1004, 5], [1005, 6]], [[1000, 11], [1001, 22], [1002, 33]]],
    'src[.]dst': [[[1002, 4], [1003, 5], [1004, 6]], [[1000, 11], [1001, 22], [1002, 33]]],
    'src[dst]': [[[1002, 3], [1003, 4]], [[1000, 11], [1001, 22], [1002, 33], [1003, 44], [1004, 55], [1005, 66]]],
    'equal': [[[1000, 1], [1001, 2], [1002, 3]], [[1000, 11], [1001, 22], [1002, 33]]],
    'dst[src]': [[[1000, 1], [1001, 2], [1002, 3], [1003, 4], [1004, 5], [1005, 6]], [[1001, 22], [1002, 33], [1003, 44], [1004, 55]]],
    'dst[.]src': [[[1000, 1], [1001, 2], [1002, 3], [1003, 4]], [[1002, 33], [1003, 44], [1004, 55], [1005, 66]]],
    'mixed_fractional': [[[1002, 4], [1003, 5], [1004, 6]], [[1000, 11], [1001, 22], [1002.5, 33], [1003.5, 44]]],
  }

  test('matrix', () => {
    const result = {}
    for (const [name, [dstArr, src]] of Object.entries(cases)) {
      result[name] = dc.merge_ts(new Dst(dstArr), src)
    }
    expect(result).toMatchSnapshot()
  })
})

// ── get_by_query string-path resolution ───────────────────────────────────
describe('DataCube.get_by_query resolution', () => {
  function buildDc() {
    const dc = new DataCube({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0.5, 1.5, 10], [1001, 1.5, 2.5, 1, 2, 12]], tf: '1D' },
      onchart: [
        { name: 'EMA, 20', type: 'EMA', data: [[1000, 1.2], [1001, 1.6]], settings: { color: 'red' } },
        { name: 'SMA, 50', type: 'SMA', data: [[1000, 1.1], [1001, 1.5]], settings: { color: 'blue' } },
      ],
      offchart: [
        { name: 'RSI, 14', type: 'RSI', data: [[1000, 55], [1001, 60]], settings: { upper: 70 } },
      ],
    })
    dc.tv = { $set: (parent, index, data) => { parent[index] = data } }
    return dc
  }

  test('chart.data resolves the candle series', () => {
    const r = buildDc().get_by_query('chart.data')
    expect(r.map((x) => ({ i: x.i, v: x.v }))).toMatchSnapshot()
  })

  test('onchart.EMA resolves by name prefix', () => {
    const r = buildDc().get_by_query('onchart.EMA')
    expect(r.map((x) => x.v && x.v.name)).toMatchSnapshot()
  })

  test('offchart.RSI resolves the offchart overlay', () => {
    const r = buildDc().get_by_query('offchart.RSI')
    expect(r.map((x) => x.v && x.v.name)).toMatchSnapshot()
  })

  test('bare type queries both panes', () => {
    const r = buildDc().get_by_query('EMA')
    expect(r.map((x) => x.v && x.v.name)).toMatchSnapshot()
  })
})
