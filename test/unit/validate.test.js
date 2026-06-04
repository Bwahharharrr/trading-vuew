import { test, expect, describe } from 'vitest'
import { validateData, validateCandle, validateOHLCV } from '../../src/helpers/schema/validate.js'
import { report, hasErrors } from '../../src/helpers/schema/diagnostics.js'

const good = [
  [1000, 1, 2, 0.5, 1.5, 10],
  [1001, 1.5, 2.5, 1, 2, 12],
  [1002, 2, 2.2, 1.8, 2.1, 8],
]

describe('validateData — happy paths (non-breaking)', () => {
  test('short ohlcv form is ok', () => {
    const r = validateData({ ohlcv: good })
    expect(r.ok).toBe(true)
    expect(r.diagnostics).toEqual([])
  })

  test('chart.data form is ok', () => {
    const r = validateData({ chart: { data: good }, onchart: [], offchart: [] })
    expect(r.ok).toBe(true)
  })

  test('valid overlays + datasets are ok', () => {
    const r = validateData({
      ohlcv: good,
      onchart: [{ name: 'EMA, 20', type: 'EMA', data: [[1000, 1.2]] }],
      offchart: [{ name: 'RSI, 14', type: 'RSI', data: [[1000, 55]] }],
      datasets: [{ id: 'x', type: 'Y', data: [] }],
    })
    expect(r.ok).toBe(true)
  })

  test('multi-timeframe map validates each tf', () => {
    const r = validateData({ '1m': { ohlcv: good }, '1h': { ohlcv: good } })
    expect(r.ok).toBe(true)
  })

  test('extended 9-col candles are accepted', () => {
    const r = validateData({ ohlcv: [[1000, 1, 2, 0.5, 1.5, 10, '#fff', 'a', 'b']] })
    expect(r.ok).toBe(true)
  })
})

describe('validateData — catches real corruption', () => {
  test('non-array data', () => {
    expect(validateData(null).ok).toBe(false)
    expect(validateData({ ohlcv: 'nope' }).ok).toBe(false)
  })

  test('short candle row', () => {
    const r = validateData({ ohlcv: [[1000, 1, 2]] })
    expect(r.ok).toBe(false)
    expect(r.diagnostics[0].code).toBe('ohlcv.row.length')
  })

  test('NaN in OHLC surfaces a typed diagnostic', () => {
    const r = validateData({ ohlcv: [[1000, 1, NaN, 0.5, 1.5, 10]] })
    expect(r.ok).toBe(false)
    expect(r.diagnostics.some((d) => d.code === 'ohlcv.row.ohlc')).toBe(true)
  })

  test('descending / duplicate timestamps', () => {
    const desc = validateData({ ohlcv: [[1002, 1, 2, 0.5, 1.5, 1], [1001, 1, 2, 0.5, 1.5, 1]] })
    expect(desc.diagnostics.some((d) => d.code === 'ohlcv.order.descending')).toBe(true)
    const dup = validateData({ ohlcv: [[1000, 1, 2, 0.5, 1.5, 1], [1000, 1, 2, 0.5, 1.5, 1]] })
    expect(dup.diagnostics.some((d) => d.code === 'ohlcv.order.duplicate')).toBe(true)
  })

  test('overlay missing name/type', () => {
    const r = validateData({ ohlcv: good, onchart: [{ data: [] }] })
    expect(r.ok).toBe(false)
    expect(r.diagnostics.some((d) => d.code === 'overlay.name')).toBe(true)
    expect(r.diagnostics.some((d) => d.code === 'overlay.type')).toBe(true)
  })

  test('missing chart entirely', () => {
    const r = validateData({ onchart: [] })
    expect(r.diagnostics.some((d) => d.code === 'chart.missing')).toBe(true)
  })

  test('series malformation is truncated, not infinite', () => {
    const bad = Array.from({ length: 100 }, () => [1, 2]) // all too-short
    const r = validateData({ ohlcv: bad })
    expect(r.diagnostics.some((d) => d.code === 'ohlcv.truncated')).toBe(true)
  })
})

describe('validateCandle — live feed helper', () => {
  test('detects out-of-order live candle', () => {
    const out = []
    validateCandle([999, 1, 2, 0.5, 1.5, 1], 'live', out, 1000)
    expect(out.some((d) => d.code === 'ohlcv.order.descending')).toBe(true)
  })
})

describe('report() modes', () => {
  test('strict throws on error-level', () => {
    const out = []
    validateOHLCV('nope', 'x', out)
    expect(hasErrors(out)).toBe(true)
    expect(() => report(out, 'strict', 'test')).toThrow()
  })

  test('warn does not throw', () => {
    const out = []
    validateOHLCV([[1, 2]], 'x', out)
    expect(() => report(out, 'warn', 'test')).not.toThrow()
  })

  test('off is a no-op', () => {
    const out = [{ level: 'error', code: 'x', message: 'y' }]
    expect(report(out, 'off')).toBe(out)
  })
})
