// Unit tests for the pure auth-position transforms (corky-positions.js).
// Drives the canonical gateway fixtures and asserts decimal strings survive
// verbatim (no float parsing) and the snapshot shapes are correct.

import { describe, it, expect } from 'vitest'
import {
  isNeg, positionKey, splitBySource, parsePositions, parseHistory, parseAudit,
} from '../../src/helpers/feed/corky-positions.js'
import * as fx from '../fixtures/corky/index.js'

describe('isNeg — textual sign (no float parse)', () => {
  it('detects negative decimal strings exactly', () => {
    expect(isNeg('-0.1')).toBe(true)
    expect(isNeg('  -42000.000000001')).toBe(true)
    expect(isNeg('0')).toBe(false)
    expect(isNeg('0.25')).toBe(false)
    expect(isNeg('')).toBe(false)
    expect(isNeg(null)).toBe(false)
    expect(isNeg(undefined)).toBe(false)
  })
})

describe('positionKey — stable, case-folded identity', () => {
  it('folds venue/symbol case and includes source + id', () => {
    const p = { venue: 'BITFINEX', account_id: 'paper-a', symbol: 'tBTCUSD', source: 'current', position_id: 77 }
    expect(positionKey(p)).toBe('bitfinex|paper-a|tbtcusd|current|77')
    // same id, different source → distinct keys (open vs closed)
    expect(positionKey({ ...p, source: 'historical' })).not.toBe(positionKey(p))
  })
  it('is empty for nullish', () => {
    expect(positionKey(null)).toBe('')
  })
})

describe('parsePositions / splitBySource', () => {
  it('splits the snapshot into current + historical, preserving decimals', () => {
    const { positions, current, historical } = parsePositions(fx.authPositionsEvent.event)
    expect(positions).toHaveLength(2)
    expect(current).toHaveLength(1)
    expect(historical).toHaveLength(1)
    // decimals untouched (exact strings)
    expect(current[0].amount).toBe('0.25')
    expect(current[0].base_price).toBe('42000.5')
    expect(historical[0].amount).toBe('-0.1')
    expect(current[0].position_id).toBe(77)
  })

  it('tolerates a missing/empty positions array', () => {
    expect(parsePositions(undefined)).toEqual({ positions: [], current: [], historical: [] })
    expect(parsePositions({ positions: null })).toEqual({ positions: [], current: [], historical: [] })
  })

  it('ignores rows with an unknown source', () => {
    const { current, historical } = splitBySource([{ source: 'weird' }, { source: 'current' }])
    expect(current).toHaveLength(1)
    expect(historical).toHaveLength(0)
  })
})

describe('parseHistory — opaque cursor + total', () => {
  it('reads positions, next_cursor (null when exhausted), total_count', () => {
    const out = parseHistory(fx.authPositionHistoryEvent.event)
    expect(out.positions).toHaveLength(1)
    expect(out.next_cursor).toBeNull()
    expect(out.total_count).toBe(1)
  })
  it('passes a non-null cursor through verbatim', () => {
    const out = parseHistory({ positions: [], next_cursor: 'opaque-abc123', total_count: 50 })
    expect(out.next_cursor).toBe('opaque-abc123')
    expect(out.total_count).toBe(50)
  })
  it('defaults missing fields safely', () => {
    expect(parseHistory({})).toEqual({ positions: [], next_cursor: null, total_count: 0 })
  })
})

describe('parseAudit', () => {
  it('extracts the audit bundle with summary/orders/trades', () => {
    const audit = parseAudit(fx.authPositionAuditEvent.event)
    expect(audit.position_id).toBe(77)
    expect(audit.summary.status).toBe('complete')
    expect(audit.summary.trade_amount_sum).toBe('0.25')   // decimal string
    expect(audit.orders[0].order_id).toBe(9001)
    expect(audit.trades[0].fee).toBe('-0.1')
  })
  it('returns null without an audit payload', () => {
    expect(parseAudit({})).toBeNull()
    expect(parseAudit(undefined)).toBeNull()
  })
})
