// dataset.js — the Dataset proxy (DC side) + DatasetWW receiver (worker side).
// Previously 7% covered.
import { test, expect, describe, vi } from 'vitest'
import Dataset, { DatasetWW } from '../../src/helpers/dataset.js'

function fakeDC() {
  return { ww: { just: vi.fn(), exec: vi.fn() }, del: vi.fn(), dss: {}, data: { chart: { data: [[0, 1]] } } }
}

describe('Dataset (proxy)', () => {
  test('constructor uploads data to the worker and strips it from the descriptor', () => {
    const dc = fakeDC()
    const desc = { id: 'trades', type: 'Trades', data: [[1, 2]] }
    const ds = new Dataset(dc, desc)
    expect(dc.ww.just).toHaveBeenCalledWith('upload-data', { trades: expect.objectContaining({ id: 'trades' }) })
    // the OWN data property is stripped (desc is then re-prototyped to Dataset)
    expect(Object.prototype.hasOwnProperty.call(desc, 'data')).toBe(false)
    expect(ds.id).toBe('trades')
    expect(desc.dc).toBe(dc)                // descriptor re-prototyped with a dc getter
  })

  test('set / update / merge forward worker ops with the right type', () => {
    const dc = fakeDC()
    const ds = new Dataset(dc, { id: 'x', type: 'T' })
    ds.set([[1, 1]])
    ds.update([[2, 2]])
    ds.merge([[3, 3]])
    const ops = dc.ww.just.mock.calls.map(c => [c[0], c[1].type])
    expect(ops).toEqual(expect.arrayContaining([
      ['dataset-op', 'set'], ['update-data', undefined], ['dataset-op', 'mrg'],
    ]))
  })

  test('remove deletes from the DC and tells the worker', () => {
    const dc = fakeDC()
    dc.dss.x = new Dataset(dc, { id: 'x', type: 'T' })
    dc.dss.x.remove()
    expect(dc.del).toHaveBeenCalledWith('datasets.x')
    expect(dc.dss.x).toBeUndefined()
  })

  test('data() awaits the worker fetch and returns the rows', async () => {
    const dc = fakeDC()
    dc.ww.exec.mockResolvedValue({ data: [[9, 9]] })
    const ds = new Dataset(dc, { id: 'x', type: 'T' })
    expect(await ds.data()).toEqual([[9, 9]])
    dc.ww.exec.mockResolvedValue(undefined)
    expect(await ds.data()).toBeUndefined()
  })

  test('make_tx wraps the main OHLCV series when requested', () => {
    const dc = fakeDC()
    const tx = Dataset.make_tx(dc, [{ type: 'OHLCV' }])
    expect(tx.ohlcv).toBe(dc.data.chart.data)
    expect(Dataset.make_tx(dc, [{ type: 'Other' }])).toEqual({})
  })
})

describe('DatasetWW (worker receiver)', () => {
  test('constructs from a raw array (ohlcv) or a descriptor', () => {
    const a = new DatasetWW('ohlcv', [[0, 1]])
    expect(a.type).toBe('OHLCV')
    expect(a.data).toEqual([[0, 1]])
    const b = new DatasetWW('trades', { type: 'Trades', data: [[1, 2]] })
    expect(b.type).toBe('Trades')
    expect(b.data).toEqual([[1, 2]])
  })

  test('merge concatenates only the strictly-outside rows (left + right)', () => {
    const ds = new DatasetWW('x', [[10], [20], [30]])
    ds.merge([[5], [15], [35]]) // 15 is inside → dropped; 5 left, 35 right
    expect(ds.data).toEqual([[5], [10], [20], [30], [35]])
    // merge into empty replaces wholesale
    const empty = new DatasetWW('y', [])
    empty.merge([[1], [2]])
    expect(empty.data).toEqual([[1], [2]])
  })

  test('op set / mrg / del drive the engine recalc', () => {
    const se = { data: { x: null }, recalc_size: vi.fn() }
    const ds = new DatasetWW('x', [[1]])
    se.data.x = ds
    ds.op(se, { type: 'set', data: [[2], [3]] })
    expect(ds.data).toEqual([[2], [3]])
    ds.op(se, { type: 'mrg', data: [[0], [4]] })
    expect(ds.data).toEqual([[0], [2], [3], [4]])
    ds.op(se, { type: 'del' })
    expect(se.data.x).toBeUndefined()
    expect(se.recalc_size).toHaveBeenCalledTimes(3)
  })

  test('update_all appends only newer points per dataset (skips ohlcv)', () => {
    const se = { data: { trades: { data: [[10]], last_upd: 0 } } }
    DatasetWW.update_all(se, { ohlcv: [[99]], 'datasets.trades': [[5], [11], [12]] })
    expect(se.data.trades.data).toEqual([[10], [11], [12]]) // 5 (older) dropped
  })
})
