import { test, expect, describe } from 'vitest'
import { getByQuery, querySearch, chartAsPiv, createQueryCache } from '../../src/stores/query.js'

function fixture() {
  return {
    data: {
      chart: { type: 'Candles', data: [[1000, 1, 2, 0.5, 1.5, 10]] },
      onchart: [
        { id: 'EMA_0', name: 'EMA, 20', type: 'EMA', data: [[1000, 1.2]], settings: { $uuid: 'u1' } },
        { id: 'SMA_0', name: 'SMA, 50', type: 'SMA', data: [[1000, 1.1]], settings: { $uuid: 'u2' }, locked: true },
      ],
      offchart: [
        { id: 'RSI_0', name: 'RSI, 14', type: 'RSI', data: [[1000, 55]], settings: { $uuid: 'u3' } },
      ],
    },
  }
}

describe('query engine (framework-agnostic, no Vue/DataCube)', () => {
  test('chart.data resolves the candle series pivot', () => {
    const r = getByQuery(fixture(), 'chart.data')
    expect(r).toHaveLength(1)
    expect(r[0].i).toBe('data')
    expect(r[0].v[0][0]).toBe(1000)
  })

  test('chart (no field) returns the chart object pivot', () => {
    const r = chartAsPiv(fixture().data, ['chart'])
    expect(r[0].i).toBe('chart')
    expect(r[0].v.type).toBe('Candles')
  })

  test('onchart.EMA resolves by name prefix', () => {
    const r = getByQuery(fixture(), 'onchart.EMA')
    expect(r.map((x) => x.v.name)).toEqual(['EMA, 20'])
    expect(r[0].i).toBe(0) // index in onchart
  })

  test('offchart.RSI resolves', () => {
    const r = getByQuery(fixture(), 'offchart.RSI')
    expect(r.map((x) => x.v.name)).toEqual(['RSI, 14'])
  })

  test('bare type queries BOTH panes', () => {
    const f = fixture()
    f.data.offchart.push({ id: 'EMA_1', name: 'EMA fast', type: 'EMA', data: [], settings: {} })
    const r = getByQuery(f, 'EMA')
    expect(r.map((x) => x.v.name).sort()).toEqual(['EMA fast', 'EMA, 20'])
  })

  test('locked overlays are filtered unless chuck=true', () => {
    const visible = getByQuery(fixture(), 'SMA')
    expect(visible).toHaveLength(0) // SMA is locked
    const all = getByQuery(fixture(), 'SMA', true)
    expect(all).toHaveLength(1)
  })

  test('field query returns {p:item,i:field,v}', () => {
    const r = querySearch(fixture().data, 'onchart.EMA.settings', ['onchart', 'EMA', 'settings'])
    expect(r[0].i).toBe('settings')
    expect(r[0].v.$uuid).toBe('u1')
  })

  test('datasets.* resolves data() via dss', () => {
    const f = {
      data: { chart: { data: [] }, onchart: [], offchart: [],
        datasets: [{ id: 'ds1', type: 'X' }] },
      dss: { ds1: { data: () => [[1, 2]] } },
    }
    const r = getByQuery(f, 'datasets.ds1.data', false)
    expect(r[0].v).toEqual([[1, 2]])
  })
})

describe('createQueryCache (opt-in memoization)', () => {
  test('returns stable reference until version changes', () => {
    let version = 0
    const ctx = fixture()
    const cached = createQueryCache(() => version)
    const a = cached(ctx, 'onchart.EMA')
    const b = cached(ctx, 'onchart.EMA')
    expect(a).toBe(b) // same reference (memoized)
    version = 1
    const c = cached(ctx, 'onchart.EMA')
    expect(c).not.toBe(a) // invalidated
    expect(c).toEqual(a) // but same content
  })
})
