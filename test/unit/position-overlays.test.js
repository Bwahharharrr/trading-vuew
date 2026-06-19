// Unit tests for the pure position→overlay transforms (position-overlays.js),
// driven by the canonical 4-trade audit fixture (verified live on the gateway).

import { describe, it, expect } from 'vitest'
import {
  tradeMarkers, positionSizeSeries, buySellHistogram, cumulativeFees, feeEvents, positionWindow,
  orderMarkers, openCloseMarkers,
} from '../../src/helpers/feed/position-overlays.js'
import { authPositionAuditEvent } from '../fixtures/corky/index.js'

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
  it('extends a single-trade (open) position to tailTs so the line is visible', () => {
    const single = { trades: [{ execution_timestamp_ms: 100, amount: '0.01' }] }
    expect(positionSizeSeries(single)).toEqual([[100, 0.01]])           // no tail → 1 point
    expect(positionSizeSeries(single, 9999)).toEqual([[100, 0.01], [9999, 0.01]])  // tail → flat line
  })
  it('tailTs ≤ last point is ignored', () => {
    const single = { trades: [{ execution_timestamp_ms: 100, amount: '0.01' }] }
    expect(positionSizeSeries(single, 50)).toEqual([[100, 0.01]])
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
  it('trade-only audit (no fees[]) cumulates the dominant currency — backward compat', () => {
    const { series, currency } = cumulativeFees(audit)   // no audit.fees
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
  it('extends a single-fee (open) position to tailTs so the line is visible', () => {
    const one = { trades: [{ execution_timestamp_ms: 100, amount: '1', fee: '-0.6', fee_currency: 'USD' }] }
    expect(cumulativeFees(one).series).toEqual([[100, -0.6]])                 // no tail → 1 point
    expect(cumulativeFees(one, 9999).series).toEqual([[100, -0.6], [9999, -0.6]])  // tail → flat line
  })
  it('COMBINES trade fees + ledger funding fees (audit.fees[]) → summary total', () => {
    const a = authPositionAuditEvent.event.audit   // 1 trade (-0.1) + 1 funding (-0.02)
    const { series, currency } = cumulativeFees(a)
    expect(currency).toBe('USD')
    expect(series).toHaveLength(2)                  // trade event + funding event
    expect(series[series.length - 1][1]).toBe(-0.12)  // == summary.fees_by_currency.USD
    // events are time-ordered: trade @1000 before funding @2000
    expect(series.map((p) => p[0])).toEqual([1700000001000, 1700000002000])
  })
})

describe('feeEvents', () => {
  it('merges trade fees + ledger fees, time-sorted, tagged by kind', () => {
    const evs = feeEvents(authPositionAuditEvent.event.audit)
    expect(evs).toHaveLength(2)
    expect(evs[0].kind).toBe('trade')
    expect(evs[1].kind).toBe('margin_funding')
    expect(evs[1].description).toBe('Position funding cost')   // raw ledger text kept
    expect(evs[1].amount).toBe('-0.02')                        // raw decimal string
  })
  it('older audit with no fees[] yields just the trade fees', () => {
    expect(feeEvents(audit)).toHaveLength(4)                   // 4 trades, 0 funding
    expect(feeEvents(audit).every((e) => e.kind === 'trade')).toBe(true)
  })
})

describe('orderMarkers', () => {
  it('emits [created_at_ms, price, type] for orders with a usable price', () => {
    const m = orderMarkers(authPositionAuditEvent.event.audit)
    expect(m).toEqual([[1700000000000, 42000.5, 'EXCHANGE LIMIT']])
  })
  it('skips orders without a price/timestamp; empty/missing → []', () => {
    expect(orderMarkers({ orders: [{ created_at_ms: 0, price: '1' }, { created_at_ms: 5, price: null }] })).toEqual([])
    expect(orderMarkers({})).toEqual([])
  })
})

describe('openCloseMarkers', () => {
  it('open marker only for a current position (no close)', () => {
    const m = openCloseMarkers(authPositionAuditEvent.event.audit)   // opened + base_price, no closed
    expect(m).toEqual([[1700000000000, 42000.5, 'Open']])
  })
  it('open + close for a closed position (close uses the last trade price)', () => {
    const a = { position: { opened_at_ms: 10, closed_at_ms: 99, base_price: '100' }, trades: [{ execution_timestamp_ms: 50, price: '105' }] }
    expect(openCloseMarkers(a)).toEqual([[10, 100, 'Open'], [99, 105, 'Close']])
  })
  it('skips an open marker when base_price is unusable', () => {
    expect(openCloseMarkers({ position: { opened_at_ms: 10 } })).toEqual([])
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
