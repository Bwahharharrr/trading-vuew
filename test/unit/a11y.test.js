import { test, expect, describe } from 'vitest'
import { chartAriaLabel, chartDataSummary, prefersReducedMotion, NAV_KEYS } from '../../src/stuff/a11y.js'

const dc = {
  data: {
    chart: { data: [[1000, 1, 2, 0.5, 1.5, 10], [1060, 1.5, 2.5, 1, 2, 12]] },
    onchart: [{ name: 'EMA, 20' }],
    offchart: [{ name: 'RSI, 14' }],
  },
}

describe('a11y helpers', () => {
  test('chartAriaLabel summarizes candle count + latest close', () => {
    const l = chartAriaLabel(dc, 'BTC')
    expect(l).toContain('BTC financial chart')
    expect(l).toContain('2 candles')
    expect(l).toContain('latest close 2')
  })

  test('chartDataSummary includes range, OHLC, and overlay names', () => {
    const s = chartDataSummary(dc, 'BTC')
    expect(s).toContain('2 candles')
    expect(s).toContain('Latest open')
    expect(s).toContain('Overall high 2.5')
    expect(s).toContain('EMA, 20')
    expect(s).toContain('RSI, 14')
  })

  test('handles empty / missing data gracefully', () => {
    expect(chartAriaLabel(null, 'X')).toContain('no data')
    expect(chartDataSummary({ data: { chart: { data: [] } } }, 'X')).toContain('no chart data')
  })

  test('prefersReducedMotion is false when matchMedia is unavailable (jsdom/SSR)', () => {
    expect(prefersReducedMotion()).toBe(false)
  })

  test('NAV_KEYS covers arrow + home/end', () => {
    expect(NAV_KEYS.has('ArrowLeft')).toBe(true)
    expect(NAV_KEYS.has('End')).toBe(true)
    expect(NAV_KEYS.has('a')).toBe(false)
  })
})
