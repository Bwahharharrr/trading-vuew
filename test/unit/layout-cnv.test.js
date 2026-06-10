// components/js/layout_cnv.js — candle/volume geometry math (50% → up).
import { test, expect, describe } from 'vitest'
import { layout_cnv, layout_vol } from '../../src/components/js/layout_cnv.js'

// OHLCV rows: [t, o, h, l, c, v]
const SUB = [
  [0, 10, 12, 9, 11, 100],
  [60, 11, 14, 10, 13, 200],
  [120, 13, 13, 8, 9, 50],
]

function mkSelf(over = {}) {
  const layout = {
    t2screen: (t) => t / 60 * 10,   // 10px per bar
    $2screen: ($) => 400 - $ * 10,  // price→y (offchart path)
    px_step: 10, A: 10, B: 0, height: 400,
    ti_map: { ib: false, tf: 60 },
  }
  return {
    $props: Object.assign({
      data: SUB, layout, config: { VOLSCALE: 0.3, CANDLEW: 0.6 },
      tf: 60, interval: 60, grid_id: 0,
    }, over),
  }
}

describe('layout_cnv (candles + glued volume)', () => {
  test('produces one candle + one volume bar per row with transformed coords', () => {
    const { candles, volume } = layout_cnv(mkSelf())
    expect(candles).toHaveLength(3)
    expect(volume).toHaveLength(3)
    // o/h/l/c run through A*price + B (A=10, B=0)
    expect(candles[0].o).toBe(100)
    expect(candles[0].h).toBe(120)
    expect(candles[0].raw).toBe(SUB[0])
    // green = close >= open
    expect(volume[0].green).toBe(true)   // 11 >= 10
    expect(volume[2].green).toBe(false)  // 9 < 13
  })

  test('volume height scales to the max volume in the slice', () => {
    const { volume } = layout_cnv(mkSelf())
    // maxv = 200 → vs = 0.3 * 400 / 200 = 0.6; bar0 h = 100 * 0.6 = 60
    expect(volume[0].h).toBeCloseTo(60, 6)
    expect(volume[1].h).toBeCloseTo(120, 6) // the max
  })

  test('zero-volume slice yields zero-height bars (no divide-by-zero)', () => {
    const flat = SUB.map((r) => [...r.slice(0, 5), 0])
    const { volume } = layout_cnv(mkSelf({ data: flat }))
    expect(volume.every((v) => v.h === 0)).toBe(true)
  })
})

describe('layout_vol (standalone volume pane)', () => {
  test('OHLCV input → green from close>=open; glued h emitted', () => {
    const vol = layout_vol(mkSelf())
    expect(vol).toHaveLength(3)
    expect(vol[0].green).toBe(true)
    expect(vol[0].y0).toBeUndefined() // grid_id 0 → candle-pane path, no Y-transform
  })

  test('detached pane (grid_id > 0) maps bar top + baseline through $2screen', () => {
    const vol = layout_vol(mkSelf({ grid_id: 1 }))
    expect(typeof vol[0].y0).toBe('number')   // baseline at $2screen(0)
    expect(typeof vol[0].yTop).toBe('number')
  })

  test('special 3-col volume data uses the [1]/[2] indices', () => {
    const special = [[0, 100, 1], [60, 50, 0]] // [t, vol, green?]
    const vol = layout_vol(mkSelf({ data: special }))
    expect(vol).toHaveLength(2)
    expect(vol[0].green).toBe(1)
  })
})
