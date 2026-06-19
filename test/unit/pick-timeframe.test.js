// Unit tests for pick-timeframe.js — the keep→1h→lowest selection used when a
// position click switches the chart to that position's ticker.

import { describe, it, expect } from 'vitest'
import { tfToMs, pickTimeframe, paddedCandleRange, coarsenTimeframe } from '../../src/helpers/feed/pick-timeframe.js'

const DAY = 24 * 3600 * 1000

describe('tfToMs — duration ordering (case-aware units)', () => {
  it('orders minute < hour < day < week < month', () => {
    expect(tfToMs('1m')).toBeLessThan(tfToMs('1h'))
    expect(tfToMs('1h')).toBeLessThan(tfToMs('1D'))
    expect(tfToMs('1D')).toBeLessThan(tfToMs('1W'))
    expect(tfToMs('1W')).toBeLessThan(tfToMs('1M'))
  })
  it('distinguishes 1m (minute) from 1M (month)', () => {
    expect(tfToMs('1m')).toBe(60 * 1000)
    expect(tfToMs('1M')).toBeGreaterThan(tfToMs('1W'))
  })
  it('folds case for hour/day/week (1h == 1H, 1d == 1D)', () => {
    expect(tfToMs('1h')).toBe(tfToMs('1H'))
    expect(tfToMs('1d')).toBe(tfToMs('1D'))
    expect(tfToMs('1w')).toBe(tfToMs('1W'))
  })
  it('handles multi-unit labels (15m, 4h)', () => {
    expect(tfToMs('15m')).toBe(15 * 60 * 1000)
    expect(tfToMs('4h')).toBe(4 * 60 * 60 * 1000)
  })
  it('returns Infinity for unparseable labels', () => {
    expect(tfToMs('weird')).toBe(Infinity)
    expect(tfToMs('60')).toBe(Infinity)   // bare number is not a gateway label
    expect(tfToMs(null)).toBe(Infinity)
  })
})

describe('pickTimeframe — keep → 1h → lowest', () => {
  it('keeps the current timeframe when offered, returning the advertised case', () => {
    expect(pickTimeframe('1h', ['1m', '1H', '1D'])).toBe('1H')  // case-insensitive match, advertised case kept
    expect(pickTimeframe('1D', ['1m', '1h', '1D'])).toBe('1D')
  })

  it('falls back to 1h when the current timeframe is unavailable', () => {
    expect(pickTimeframe('5m', ['1H', '1D', '1W'])).toBe('1H')   // 1h offered as 1H
    expect(pickTimeframe('5m', ['15m', '1h', '4h'])).toBe('1h')
  })

  it('falls back to the lowest available when neither current nor 1h is offered', () => {
    expect(pickTimeframe('4h', ['1D', '1W', '15m'])).toBe('15m')
    expect(pickTimeframe('2h', ['1W', '1D', '4h'])).toBe('4h')
    expect(pickTimeframe(null, ['1M', '1W', '1D'])).toBe('1D')
  })

  it('returns current (or null) when nothing is available', () => {
    expect(pickTimeframe('1h', [])).toBe('1h')
    expect(pickTimeframe(null, [])).toBeNull()
    expect(pickTimeframe('1h', null)).toBe('1h')
  })

  it('honours a custom fallback', () => {
    expect(pickTimeframe('5m', ['1D', '4h', '1W'], { fallback: '4h' })).toBe('4h')
  })
})

describe('paddedCandleRange — ±N candles around a window', () => {
  const NOW = 2_000_000_000_000   // far future so clamps don't interfere
  it('pads fixed timeframes by count·tfToMs each side', () => {
    const start = 1_000_000_000_000, end = 1_000_100_000_000
    const r = paddedCandleRange({ start, end, timeframe: '1h', count: 400, now: NOW })
    expect(r.start_ms).toBe(start - 400 * 3600 * 1000)
    expect(r.end_ms).toBe(end + 400 * 3600 * 1000)
  })
  it('1M steps by CALENDAR months, not fixed 30 days', () => {
    // start at 2021-03-15; pad 2 months back/forward
    const start = Date.UTC(2021, 2, 15), end = Date.UTC(2021, 2, 20)
    const r = paddedCandleRange({ start, end, timeframe: '1M', count: 2, now: NOW })
    // calendar: Jan 15 .. May 20 (not start - 60 days fixed)
    expect(new Date(r.start_ms).getUTCMonth()).toBe(0)   // January
    expect(new Date(r.end_ms).getUTCMonth()).toBe(4)     // May
    expect(r.start_ms).not.toBe(start - 2 * 30 * 86400000)  // not fixed 30-day math
  })
  it('clamps start_ms ≥ 0 and end_ms ≤ now', () => {
    const r = paddedCandleRange({ start: 1000, end: NOW - 1000, timeframe: '1D', count: 400, now: NOW })
    expect(r.start_ms).toBe(0)            // would go negative → clamped
    expect(r.end_ms).toBe(NOW)            // would exceed now → clamped
  })
  it('end_ms is never less than start_ms', () => {
    const r = paddedCandleRange({ start: 5000, end: 6000, timeframe: '1h', count: 0, now: 5500 })
    expect(r.end_ms).toBeGreaterThanOrEqual(r.start_ms)
  })
})

describe('coarsenTimeframe — bound candle count for long spans', () => {
  const TFS = ['1m', '5m', '1h', '4h', '1D']
  it('keeps the preferred tf for a short span', () => {
    expect(coarsenTimeframe('1h', TFS, 10 * 3600 * 1000)).toBe('1h')   // 10 candles
  })
  it('coarsens to the finest tf that fits the cap', () => {
    // 200 days at 1h = 4800 > 3000; at 4h = 1200 ≤ 3000 → 4h
    expect(coarsenTimeframe('1h', TFS, 200 * DAY, { maxCandles: 3000 })).toBe('4h')
  })
  it('never goes finer than the preferred (caps at preferred if it cannot coarsen)', () => {
    // only 1m and 1h offered, preferred 1h, huge span → can't coarsen → stays 1h, never 1m
    expect(coarsenTimeframe('1h', ['1m', '1h'], 5000 * DAY)).toBe('1h')
  })
  it('falls back to the coarsest available when nothing fits', () => {
    expect(coarsenTimeframe('1m', ['1m', '5m', '1h'], 4000 * DAY)).toBe('1h')
  })
  it('no span / no candidates → preferred unchanged', () => {
    expect(coarsenTimeframe('1h', TFS, 0)).toBe('1h')
    expect(coarsenTimeframe('1h', [], 999 * DAY)).toBe('1h')
  })
  it('respects a custom maxCandles cap', () => {
    // 30 days at 1h = 720 candles; cap 500 → coarsen to 4h (180 ≤ 500)
    expect(coarsenTimeframe('1h', TFS, 30 * DAY, { maxCandles: 500 })).toBe('4h')
  })
})
