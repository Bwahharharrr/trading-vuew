// Pins the rectangle-tool readout conversion: screen pixels -> high/low price +
// start/end epoch-ms timestamps + readable strings. Locks in the tricky parts:
// Y-inversion (top edge = HIGH), timestamp is epoch-ms (ti_map.i2t called exactly
// once), and the chart-timezone is applied only intraday via UTC getters.
import { test, expect, describe } from 'vitest'
import { boxReadout } from '../../src/mixins/app/drawing-tools.js'
import Const from '../../src/stuff/constants.js'

// Linear price axis: screen2$(y) = (y - 400) / -4  => y=0 -> $100, y=400 -> $0
// (A<0, i.e. bigger screen-y = LOWER price, mirroring grid_maker).
// Time axis: screen2t(x) = 1_000_000 + x  (1px = 1ms), regular mode (i2t identity).
function makeGrid(overrides = {}) {
  return Object.assign({
    prec: 2,
    ti_map: { tf: Const.HOUR, i2t: (i) => i }, // intraday, passthrough
    screen2$: (y) => (y - 400) / -4,
    screen2t: (x) => 1_000_000 + x,
  }, overrides)
}

describe('boxReadout (rectangle tool screen->price/time)', () => {
  test('maps a screen rect to HIGH/LOW price (Y inverted) + epoch-ms start/end', () => {
    const r = boxReadout(makeGrid(), { topY: 100, botY: 300, leftX: 50, rightX: 250 }, 0)
    expect(r.high).toBe('75.00')   // screen2$(100) = 75 (top edge = HIGH)
    expect(r.low).toBe('25.00')    // screen2$(300) = 25 (bottom edge = LOW)
    expect(r.tStart).toBe(1_000_050)
    expect(r.tEnd).toBe(1_000_250)
  })

  test('HIGH/LOW are drag-direction independent (top/bottom swapped)', () => {
    const r = boxReadout(makeGrid(), { topY: 300, botY: 100, leftX: 0, rightX: 0 }, 0)
    expect(r.high).toBe('75.00')
    expect(r.low).toBe('25.00')
  })

  test('honors grid.prec for price precision', () => {
    const r = boxReadout(makeGrid({ prec: 4 }), { topY: 100, botY: 300, leftX: 0, rightX: 0 }, 0)
    expect(r.high).toBe('75.0000')
    expect(r.low).toBe('25.0000')
  })

  test('timezone (hours) is applied intraday, via UTC — shifts the readable time', () => {
    const grid = makeGrid()
    // tStart for leftX=0 is 1_000_000 ms = 1970-01-01 00:16:40 UTC.
    const utc = boxReadout(grid, { topY: 0, botY: 0, leftX: 0, rightX: 0 }, 0)
    expect(utc.startStr).toBe('1970-01-01 00:16')
    // +2h timezone -> 02:16 (and never affected by the host machine's local TZ).
    const plus2 = boxReadout(grid, { topY: 0, botY: 0, leftX: 0, rightX: 0 }, 2)
    expect(plus2.startStr).toBe('1970-01-01 02:16')
  })

  test('daily+ timeframes are NOT timezone-shifted (matches the axis)', () => {
    const grid = makeGrid({ ti_map: { tf: Const.DAY, i2t: (i) => i } })
    const r = boxReadout(grid, { topY: 0, botY: 0, leftX: 0, rightX: 0 }, 5)
    expect(r.startStr).toBe('1970-01-01 00:16') // tz ignored for tf >= DAY
  })

  test('index-based mode: ti_map.i2t runs exactly once (screen2t returns an index)', () => {
    // screen2t returns an index; i2t maps index -> epoch-ms (index * 1000).
    const grid = makeGrid({
      ti_map: { tf: Const.HOUR, i2t: (i) => i * 1000 },
      screen2t: (x) => x, // returns an index, not ms
    })
    const r = boxReadout(grid, { topY: 0, botY: 0, leftX: 42, rightX: 99 }, 0)
    expect(r.tStart).toBe(42_000) // 42 * 1000 — NOT 42_000_000 (would be double-i2t)
    expect(r.tEnd).toBe(99_000)
  })
})
