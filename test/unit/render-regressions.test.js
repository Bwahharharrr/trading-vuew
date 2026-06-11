// Rendering regressions (C2, M15): botbar layout staleness + Y-axis precision
// collapse on monotonic windows.
import { test, expect, describe } from 'vitest'
import GridMaker from '../../src/components/js/grid_maker.js'

function mkGrid(data) {
  const params = {
    sub: data, interval: 1, range: [data[0][0], data[data.length - 1][0]],
    ctx: { measureText: () => ({ width: 10 }), font: '10px a' },
    layers_meta: {}, ti_map: { ib: false },
    height: 400, y_t: null, grid: {}, timezone: 0,
    $p: {
      config: { GRIDX: 100, GRIDY: 47, SBMIN: 60, SBMAX: Infinity, DEFAULT_LEN: 50, TOOLBAR: 57 },
      width: 800, height: 400, colors: {}, interval_ms: 1,
    },
  }
  return GridMaker(0, params)
}

describe('M15 — Y-axis precision on monotonic data', () => {
  const rows = (vals) => vals.map((v, i) => [i, v, v + 1e-7, v - 1e-7, v, 1])

  test('strictly RISING sub-cent series keeps full precision (min was Infinity)', () => {
    const rising = rows([0.0000121, 0.0000122, 0.0000123, 0.0000124])
    const g = mkGrid(rising).create()
    expect(g.prec).toBeGreaterThanOrEqual(7)   // not the collapsed default 2
  })

  test('shuffled series produces the same precision as sorted', () => {
    const vals = [0.0000121, 0.0000124, 0.0000122, 0.0000123]
    const sorted = [...vals].sort((a, b) => a - b)
    const p1 = mkGrid(rows(vals)).create().prec
    const p2 = mkGrid(rows(sorted)).create().prec
    expect(p1).toBe(p2)
  })
})
