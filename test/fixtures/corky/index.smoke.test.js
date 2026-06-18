import { describe, it, expect } from 'vitest'
import * as fixtures from './index.js'
import { fixturesByFilename } from './index.js'

describe('corky v1 fixtures barrel', () => {
  it('exports every example as parsed JSON', () => {
    expect(fixtures.candleStatesEvent.event.type).toBe('candle_states')
    expect(fixtures.controlAckEvent.event.type).toBe('control_ack')
    expect(fixtures.errorEvent.event.type).toBe('error')
    expect(fixtures.historicalChunkEvent.event.type).toBe('historical_chunk')
    expect(fixtures.liveUpdateEvent.event.type).toBe('live_update')
    expect(fixtures.listCandleStatesRequest.command.type).toBe('list_candle_states')
    expect(fixtures.subscribeLatestRequest.command.type).toBe('subscribe_candles')
    expect(fixtures.upsertCandleStateRequest.command.type).toBe('upsert_candle_state')
  })

  it('exports every auth-position example as parsed JSON', () => {
    expect(fixtures.listAuthPositionsRequest.command.type).toBe('list_auth_positions')
    expect(fixtures.authPositionsEvent.event.type).toBe('auth_positions')
    expect(fixtures.subscribeAuthPositionsRequest.command.type).toBe('subscribe_auth_positions')
    expect(fixtures.authPositionsUpdateEvent.event.type).toBe('auth_positions_update')
    expect(fixtures.listAuthPositionHistoryRequest.command.type).toBe('list_auth_position_history')
    expect(fixtures.authPositionHistoryEvent.event.type).toBe('auth_position_history')
    expect(fixtures.getAuthPositionAuditRequest.command.type).toBe('get_auth_position_audit')
    expect(fixtures.authPositionAuditEvent.event.type).toBe('auth_position_audit')
    expect(fixtures.subscribeAuthPositionAuditRequest.command.type).toBe('subscribe_auth_position_audit')
    expect(fixtures.authPositionAuditUpdateEvent.event.type).toBe('auth_position_audit_update')
    expect(fixtures.authPositionAuditErrorEvent.event.code).toBe('auth_position_audit_unavailable')
  })

  it('auth-position rows carry source + decimal-string numerics', () => {
    const rows = fixtures.authPositionsEvent.event.positions
    expect(rows.map((r) => r.source).sort()).toEqual(['current', 'historical'])
    for (const r of rows) {
      expect(typeof r.amount).toBe('string')        // decimals are strings
      expect(typeof r.base_price).toBe('string')
      expect(Number.isInteger(r.position_id)).toBe(true)
      expect(Number.isInteger(r.opened_at_ms)).toBe(true) // epoch ms
    }
  })

  it('auth-position-history carries opaque cursor + total_count', () => {
    const ev = fixtures.authPositionHistoryEvent.event
    expect(Array.isArray(ev.positions)).toBe(true)
    expect('next_cursor' in ev).toBe(true)          // present (may be null)
    expect(typeof ev.total_count).toBe('number')
  })

  it('every request/event declares schema_version 1', () => {
    for (const fx of Object.values(fixturesByFilename)) {
      expect(fx.schema_version).toBe(1)
    }
  })

  it('exposes all 19 fixtures by canonical filename', () => {
    expect(Object.keys(fixturesByFilename)).toHaveLength(19)
  })
})
