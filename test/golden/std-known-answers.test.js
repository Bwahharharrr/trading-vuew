/* eslint-disable no-undef -- script bodies run inside the engine, which
   injects sma/ema/close/... as scoped globals (same as the golden suite) */
// KNOWN-ANSWER stdlib tests — unlike the golden fingerprints (which pin
// determinism), these pin CORRECTNESS: hand-computed expectations on a tiny
// synthetic series. closes = 1..10, high = close+1, low = close-1.
import { test, expect, describe } from 'vitest'
import { runScript, script } from './_engine-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000
const CANDLES = Array.from({ length: 10 }, (_, i) =>
  [T0 + i * TF, i + 1, i + 2, i, i + 1, 1]) // [t, o=c, h=c+1, l=c-1, c, v]

const last = (out) => out[out.length - 1][1]
const at = (out, t) => { const p = out.find(x => x[0] === t); return p && p[1] }

describe('std known answers (closes 1..10)', () => {
  test('sma(close,3): rolling mean — mid-series and final', async () => {
    const out = await runScript(CANDLES, script('ka-sma', function () { return sma(close, 3) }))
    expect(last(out)).toBeCloseTo(9, 8)                    // (8+9+10)/3
    expect(at(out, T0 + 4 * TF)).toBeCloseTo(4, 8)         // (3+4+5)/3
  })

  test('ema(close,3): seeds with sma then α=0.5 recurrence → tracks close-1', async () => {
    const out = await runScript(CANDLES, script('ka-ema', function () { return ema(close, 3) }))
    expect(last(out)).toBeCloseTo(9, 8) // e_i = close_i - 1 for this ramp
    expect(at(out, T0 + 5 * TF)).toBeCloseTo(5, 8)
  })

  test('roc(close,2) and change(close,1)', async () => {
    const roc = await runScript(CANDLES, script('ka-roc', function () { return roc(close, 2) }))
    expect(last(roc)).toBeCloseTo(100 * (10 - 8) / 8, 8) // 25
    const ch = await runScript(CANDLES, script('ka-chg', function () { return change(close) }))
    expect(last(ch)).toBeCloseTo(1, 8)
  })

  test('stdev(close,3): population stdev around the rolling mean', async () => {
    const out = await runScript(CANDLES, script('ka-std', function () { return stdev(close, 3) }))
    expect(last(out)).toBeCloseTo(Math.sqrt(2 / 3), 8) // closes 8,9,10 vs mean 9
  })

  test('highest/lowest(close,3): window extremes', async () => {
    const hi = await runScript(CANDLES, script('ka-hi', function () { return highest(close, 3) }))
    const lo = await runScript(CANDLES, script('ka-lo', function () { return lowest(close, 3) }))
    expect(last(hi)).toBe(10)
    expect(last(lo)).toBe(8)
  })

  test('atr(3): constant true range (H-L = 2) converges to exactly 2', async () => {
    const out = await runScript(CANDLES, script('ka-atr', function () { return atr(3) }))
    expect(last(out)).toBeCloseTo(2, 6)
  })

  test('rsi(close,3): a monotonic ramp pegs RSI at 100', async () => {
    const out = await runScript(CANDLES, script('ka-rsi', function () { return rsi(close, 3) }))
    expect(last(out)).toBeCloseTo(100, 4)
  })
})
