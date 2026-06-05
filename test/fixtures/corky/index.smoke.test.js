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

  it('every request/event declares schema_version 1', () => {
    for (const fx of Object.values(fixturesByFilename)) {
      expect(fx.schema_version).toBe(1)
    }
  })

  it('exposes all 8 fixtures by canonical filename', () => {
    expect(Object.keys(fixturesByFilename)).toHaveLength(8)
  })
})
