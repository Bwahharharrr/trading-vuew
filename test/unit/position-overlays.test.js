// Unit tests for the pure position→overlay transforms (position-overlays.js),
// driven by the canonical 4-trade audit fixture (verified live on the gateway).

import { describe, it, expect } from 'vitest'
import {
  tradeMarkers, positionSizeSeries, buySellHistogram, cumulativeFees, positionWindow,
} from '../../src/helpers/feed/position-overlays.js'

// The shipped fixture has 1 trade; build the richer 4-trade bundle observed live
// (tTESTBTC:TESTUSD #178155229) so the cumulative math is exercised meaningfully.
const audit = {
  position: {
    source: 'historical', status: 'flat', side: 'flat', amount: '0',
    base_price: '94442.4', opened_at_ms: 1730683960000, closed_at_ms: 1733964907000,
    updated_at_ms: 1733964907000,
  },
  trades: [
    { trade_id: 1, execution_timestamp_ms: 1730683960181, amount: '0.01015975', price: '69012', fee: '-1.402289334', fee_currency: 'TESTUSD' },
    { trade_id: 2, execution_timestamp_ms: 1730707382909, amount: '0.03984025', price: '69012', fee: '-2.749455333', fee_currency: 'TESTUSD' },
    { trade_id: 3, execution_timestamp_ms: 1733964892254, amount: '0.2', price: '100800', fee: '-40.32', fee_currency: 'TESTUSD' },
    { trade_id: 4, execution_timestamp_ms: 1733964906796, amount: '-0.25', price: '100660', fee: '-50.33', fee_currency: 'TESTUSD' },
  ],
}

describe('tradeMarkers', () => {
  it('emits [ts, sideBool, price, signedLabel] sorted by time', () => {
    const m = tradeMarkers(audit)
    expect(m).toHaveLength(4)
    expect(m[0]).toEqual([1730683960181, 1, 69012, '+0.01015975'])  // buy
    expect(m[3]).toEqual([1733964906796, 0, 100660, '-0.25'])        // sell
  })
  it('sorts unsorted input', () => {
    const m = tradeMarkers({ trades: [audit.trades[3], audit.trades[0]] })
    expect(m.map((r) => r[0])).toEqual([1730683960181, 1733964906796])
  })
  it('handles empty/missing', () => {
    expect(tradeMarkers({})).toEqual([])
    expect(tradeMarkers(undefined)).toEqual([])
  })
})

describe('positionSizeSeries', () => {
  it('is the running signed sum, ending back at 0 for a closed position', () => {
    const s = positionSizeSeries(audit)
    // 0.01015975 → 0.05 → 0.25 → 0, plus a hold-point at close
    expect(s.map((r) => r[1])).toEqual([0.01015975, 0.05, 0.25, 0, 0])
    expect(s[s.length - 1][0]).toBe(1733964907000)   // extended to closed_at_ms
  })
  it('no float noise (rounds to 8dp)', () => {
    const s = positionSizeSeries(audit)
    expect(s[1][1]).toBe(0.05)   // not 0.049999999
  })
})

describe('buySellHistogram', () => {
  it('one signed bar per trade', () => {
    const h = buySellHistogram(audit)
    expect(h).toEqual([
      [1730683960181, 0.01015975],
      [1730707382909, 0.03984025],
      [1733964892254, 0.2],
      [1733964906796, -0.25],
    ])
  })
})

describe('cumulativeFees', () => {
  it('cumulates the dominant currency, ending at the summary total', () => {
    const { series, currency } = cumulativeFees(audit)
    expect(currency).toBe('TESTUSD')
    expect(series[series.length - 1][1]).toBe(-94.80174467)   // ≈ summary.fees_by_currency
    expect(series[0]).toEqual([1730683960181, -1.40228933])   // round8 (plot y)
  })
  it('picks the larger-magnitude currency when mixed', () => {
    const mixed = { trades: [
      { execution_timestamp_ms: 1, amount: '1', fee: '-0.5', fee_currency: 'BTC' },
      { execution_timestamp_ms: 2, amount: '1', fee: '-99', fee_currency: 'USD' },
    ] }
    const { currency, series } = cumulativeFees(mixed)
    expect(currency).toBe('USD')
    expect(series).toEqual([[2, -99]])   // BTC fee omitted from the single line
  })
})

describe('positionWindow', () => {
  it('reads opened/closed from a position or row', () => {
    expect(positionWindow(audit.position)).toEqual({ start: 1730683960000, end: 1733964907000 })
  })
  it('open position (no close) falls back to updated_at_ms, else null', () => {
    expect(positionWindow({ opened_at_ms: 10, updated_at_ms: 20 })).toEqual({ start: 10, end: 20 })
    expect(positionWindow({ opened_at_ms: 10 })).toEqual({ start: 10, end: null })
  })
})
