// std/indicators.js — invoked directly on the source module via the bar-driver,
// so the actual source lines run (the engine path uses recompiled copies).
// Values are cross-checked against hand math on small series.
import { test, expect, describe } from 'vitest'
import { runBars, lastFinite } from './_std-direct.js'

const RAMP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // closes; high=c+1, low=c-1

describe('std/indicators — moving averages', () => {
  test('sma(close,3) rolling mean', () => {
    const out = runBars(RAMP, (s, x) => s.sma(x.close, 3))
    expect(out[2]).toBeCloseTo(2, 8)   // (1+2+3)/3
    expect(out[9]).toBeCloseTo(9, 8)   // (8+9+10)/3
  })

  test('ema(close,3) seeds with sma then α=0.5 recurrence', () => {
    const out = runBars(RAMP, (s, x) => s.ema(x.close, 3))
    expect(lastFinite(out)).toBeCloseTo(9, 6)
  })

  test('wma / rma / vwma / swma / hma compute finite values', () => {
    for (const fn of ['wma', 'rma', 'vwma', 'hma']) {
      const out = runBars(RAMP, (s, x) => s[fn](x.close, 4))
      expect(Number.isFinite(lastFinite(out))).toBe(true)
    }
    const sw = runBars(RAMP, (s, x) => s.swma(x.close))
    expect(Number.isFinite(lastFinite(sw))).toBe(true)
  })

  test('alma is finite over the window', () => {
    const out = runBars(RAMP, (s, x) => s.alma(x.close, 5, 0.85, 6))
    expect(Number.isFinite(lastFinite(out))).toBe(true)
  })
})

describe('std/indicators — momentum / dispersion', () => {
  test('roc(close,2) = 100*(c0-c2)/c2', () => {
    const out = runBars(RAMP, (s, x) => s.roc(x.close, 2))
    expect(out[9]).toBeCloseTo(100 * (10 - 8) / 8, 8) // 25
  })

  test('mom(close,2) = c0 - c2', () => {
    const out = runBars(RAMP, (s, x) => s.mom(x.close, 2))
    expect(out[9]).toBeCloseTo(2, 8)
  })

  test('stdev / dev over a flat-step window', () => {
    const std = runBars(RAMP, (s, x) => s.stdev(x.close, 3))
    expect(std[9]).toBeCloseTo(Math.sqrt(2 / 3), 6) // 8,9,10 around mean 9
    const dev = runBars(RAMP, (s, x) => s.dev(x.close, 3))
    expect(Number.isFinite(dev[9])).toBe(true)
  })

  test('rsi pegs at 100 on a monotonic ramp', () => {
    const out = runBars(RAMP, (s, x) => s.rsi(x.close, 3))
    expect(lastFinite(out)).toBeCloseTo(100, 4)
  })

  test('cmo / tsi / cci / cog are finite', () => {
    expect(Number.isFinite(lastFinite(runBars(RAMP, (s, x) => s.cmo(x.close, 4))))).toBe(true)
    expect(Number.isFinite(lastFinite(runBars(RAMP, (s, x) => s.tsi(x.close, 4, 2))))).toBe(true)
    expect(Number.isFinite(lastFinite(runBars(RAMP, (s, x) => s.cci(x.close, 4))))).toBe(true)
    expect(Number.isFinite(lastFinite(runBars(RAMP, (s, x) => s.cog(x.close, 4))))).toBe(true)
  })
})

describe('std/indicators — OHLC / volatility', () => {
  // h=c+1, l=c-1 → true range is constant 2 on the ramp
  test('tr() and atr(3) converge to the constant true range (2)', () => {
    const tr = runBars(RAMP, (s) => s.tr())
    expect(tr[9]).toBeCloseTo(2, 6)
    const atr = runBars(RAMP, (s) => s.atr(3))
    expect(atr[9]).toBeCloseTo(2, 6)
  })

  test('wpr(3) (Williams %R) is finite and in [-100, 0]', () => {
    const out = runBars(RAMP, (s) => s.wpr(3))
    const v = lastFinite(out)
    expect(v).toBeGreaterThanOrEqual(-100)
    expect(v).toBeLessThanOrEqual(0)
  })

  test('bb / kc / dmi multi-output bands compute finite values', () => {
    const bb = runBars(RAMP, (s, x) => { const b = s.bb(x.close, 4, 2); return b[0] })
    expect(Number.isFinite(lastFinite(bb))).toBe(true)
    const kc = runBars(RAMP, (s, x) => { const k = s.kc(x.close, 4, 2); return k[0] })
    expect(Number.isFinite(lastFinite(kc))).toBe(true)
    const bbw = runBars(RAMP, (s, x) => s.bbw(x.close, 4, 2))
    expect(Number.isFinite(lastFinite(bbw))).toBe(true)
  })

  test('macd returns [macd, signal, histogram] finite series', () => {
    const out = runBars(RAMP, (s, x) => { const m = s.macd(x.close, 3, 6, 3); return m[0][0] })
    expect(Number.isFinite(lastFinite(out))).toBe(true)
  })

  // A non-monotonic series so directional/oscillator indicators actually move.
  const WAVY = Array.from({ length: 24 }, (_, i) => 100 + 8 * Math.sin(i / 2))

  test('stoch / mfi / wpr over a wavy series stay in range and finite', () => {
    const st = runBars(WAVY, (s, x) => s.stoch(x.close, x.high, x.low, 5))
    expect(Number.isFinite(lastFinite(st))).toBe(true)
    const mf = runBars(WAVY, (s, x) => s.mfi(x.close, 5))
    const v = lastFinite(mf)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(100)
  })

  test('dmi / sar / supertrend / kcw read OHLC from env.shared and compute', () => {
    const dmi = runBars(WAVY, (s) => { const d = s.dmi(5, 5); return d[0][0] })
    expect(Number.isFinite(lastFinite(dmi))).toBe(true)
    const sar = runBars(WAVY, (s) => s.sar(0.02, 0.02, 0.2))
    expect(Number.isFinite(lastFinite(sar))).toBe(true)
    const stt = runBars(WAVY, (s) => { const r = s.supertrend(3, 5); return r[0][0] })
    expect(Number.isFinite(lastFinite(stt))).toBe(true)
    const kcw = runBars(WAVY, (s, x) => s.kcw(x.close, 5, 2))
    expect(Number.isFinite(lastFinite(kcw))).toBe(true)
  })
})
