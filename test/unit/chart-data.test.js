import { test, expect, describe, vi } from 'vitest'
import ChartData from '../../src/stores/chart-data.js'

function setup() {
  const data = {
    chart: { type: 'Candles', data: [[1000, 1, 2, 0.5, 1.5, 10]] },
    onchart: [
      { id: 'EMA_0', name: 'EMA, 20', type: 'EMA', data: [[1000, 1.2]], settings: { $uuid: 'u1', color: 'red' } },
    ],
    offchart: [
      { id: 'RSI_0', name: 'RSI, 14', type: 'RSI', data: [[1000, 55]], settings: { $uuid: 'u3' } },
    ],
  }
  const updateIds = vi.fn()
  const cd = new ChartData({ data, dss: {}, updateIds })
  return { cd, data, updateIds }
}

describe('ChartData store', () => {
  test('get / getOne resolve via the query engine', () => {
    const { cd } = setup()
    expect(cd.get('onchart.EMA').map((o) => o.name)).toEqual(['EMA, 20'])
    expect(cd.getOne('offchart.RSI').name).toBe('RSI, 14')
  })

  test('merge settings replaces reactively + bumps ids', () => {
    const { cd, data, updateIds } = setup()
    cd.merge('onchart.EMA.settings', { color: 'blue', width: 2 })
    expect(data.onchart[0].settings).toMatchObject({ color: 'blue', width: 2, $uuid: 'u1' })
    expect(updateIds).toHaveBeenCalled()
  })

  test('merge timeseries appends by timestamp', () => {
    const { cd, data } = setup()
    cd.merge('onchart.EMA.data', [[1001, 1.6], [1002, 1.7]])
    expect(data.onchart[0].data).toEqual([[1000, 1.2], [1001, 1.6], [1002, 1.7]])
  })

  test('add pushes an overlay and returns its id', () => {
    const { cd, data, updateIds } = setup()
    const id = cd.add('onchart', { id: 'SMA_0', name: 'SMA', type: 'SMA', data: [], settings: {} })
    expect(id).toBe('SMA_0')
    expect(data.onchart).toHaveLength(2)
    expect(updateIds).toHaveBeenCalled()
    // invalid side is a no-op
    expect(cd.add('bogus', {})).toBeUndefined()
  })

  test('del removes a matched overlay', () => {
    const { cd, data } = setup()
    cd.del('offchart.RSI')
    expect(data.offchart).toHaveLength(0)
  })

  test('set replaces the matched value', () => {
    const { cd, data } = setup()
    cd.set('chart.data', [[2000, 9, 9, 9, 9, 1]])
    expect(data.chart.data).toEqual([[2000, 9, 9, 9, 9, 1]])
  })

  test('lock/unlock toggles the overlay lock flag', () => {
    const { cd, data } = setup()
    cd.lock('EMA')
    expect(data.onchart[0].locked).toBe(true)
    // locked overlays are filtered from queries…
    expect(cd.get('EMA')).toHaveLength(0)
    cd.unlock('EMA')
    expect(data.onchart[0].locked).toBe(false)
    expect(cd.get('EMA')).toHaveLength(1)
  })
})
