// CorkyClient strategy DIRECT-CONTROL senders: outbound command framing matched
// against the saved *.request.json fixtures, control_ack resolution, the
// runtime-targeting target_runtime_id forwarding, required-field guards (reason
// is mandatory — it MUTATES a live runtime), and getStrategyTicker resolving the
// ticker for BOTH the new (top-level status) and live (no top-level status)
// shapes. Drives the REAL client through a FakeSocket (no network).
import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyClient } from '../../src/helpers/feed/corky-client.js'

import pauseReq from '../fixtures/corky/strategy/examples/pause-strategy-ticker.request.json'
import cancelReq from '../fixtures/corky/strategy/examples/cancel-strategy-ticker-orders.request.json'
import adoptOneReq from '../fixtures/corky/strategy/examples/adopt-strategy-position.request.json'
import adoptManyReq from '../fixtures/corky/strategy/examples/adopt-strategy-positions.request.json'

import newTickerFx from '../fixtures/corky/strategy/examples/strategy-ticker.event.json'
import liveTickerFx from '../fixtures/corky/strategy/live_get_strategy_ticker.json'
import oldTickerFx from '../fixtures/corky/strategy/get_strategy_ticker_ADA.json'

class FakeSocket {
  constructor(url) {
    this.url = url
    this.sent = []
    this.onopen = this.onmessage = this.onerror = this.onclose = null
    FakeSocket.instances.push(this)
  }
  send(raw) { this.sent.push(JSON.parse(raw)) }
  close() { if (this.onclose) this.onclose({ code: 1000 }) }
  open() { if (this.onopen) this.onopen({}) }
  push(envelope) { if (this.onmessage) this.onmessage({ data: JSON.stringify(envelope) }) }
  static reset() { FakeSocket.instances = [] }
}
FakeSocket.instances = []

function makeClient() {
  FakeSocket.reset()
  const client = new CorkyClient({
    url: 'ws://fake/corky', socketFactory: (url) => new FakeSocket(url), backoff: false,
  })
  client.connect()
  const sock = () => FakeSocket.instances[FakeSocket.instances.length - 1]
  sock().open()
  return { client, sock }
}

const ack = (request_id, extra = {}) => ({
  schema_version: 1, request_id, event: { type: 'control_ack', outcome: 'accepted', ...extra },
})

beforeEach(() => FakeSocket.reset())

// ── outbound framing matches the request fixtures ─────────────────────────────
describe('control command framing matches the *.request.json fixtures', () => {
  it('pauseStrategyTicker → the pause-strategy-ticker.request.json command', () => {
    const { client, sock } = makeClient()
    const { type, runtime_id, ticker_id, reason } = pauseReq.command
    client.pauseStrategyTicker({ runtime_id, ticker_id, reason })
    expect(sock().sent[0].command).toEqual({ type, runtime_id, ticker_id, reason })
    expect(sock().sent[0].command).toEqual(pauseReq.command)
    expect(sock().sent[0].schema_version).toBe(1)
  })

  it('cancelStrategyTickerOrders → the cancel-strategy-ticker-orders.request.json command (reason visible)', () => {
    const { client, sock } = makeClient()
    const { runtime_id, ticker_id, reason } = cancelReq.command
    client.cancelStrategyTickerOrders({ runtime_id, ticker_id, reason })
    expect(sock().sent[0].command).toEqual(cancelReq.command)
  })

  it('adoptStrategyPosition → the adopt-strategy-position.request.json command', () => {
    const { client, sock } = makeClient()
    const { runtime_id, ticker_id, position_id, reason } = adoptOneReq.command
    client.adoptStrategyPosition({ runtime_id, ticker_id, position_id, reason })
    expect(sock().sent[0].command).toEqual(adoptOneReq.command)
  })

  it('adoptStrategyPositions → the adopt-strategy-positions.request.json command (batch + instance id)', () => {
    const { client, sock } = makeClient()
    const { runtime_id, strategy_instance_id, positions, reason } = adoptManyReq.command
    client.adoptStrategyPositions({ runtime_id, strategy_instance_id, positions, reason })
    expect(sock().sent[0].command).toEqual(adoptManyReq.command)
    // positions[] carries only { ticker_id, position_id } — no extra keys leak
    expect(sock().sent[0].command.positions).toEqual([
      { ticker_id: 'BITFINEX:tTESTADA:TESTUSD', position_id: 77 },
      { ticker_id: 'BITFINEX:tTESTBTC:TESTUSD', position_id: 88 },
    ])
  })

  it('resumeStrategyTicker → derived-from-pause shape', () => {
    const { client, sock } = makeClient()
    client.resumeStrategyTicker({ runtime_id: 'rt', ticker_id: 'tk', reason: 'operator resume' })
    expect(sock().sent[0].command).toEqual({
      type: 'resume_strategy_ticker', runtime_id: 'rt', ticker_id: 'tk', reason: 'operator resume',
    })
  })

  it('unlockStrategyTicker → pause shape + new_allocation (amount stays a decimal STRING)', () => {
    const { client, sock } = makeClient()
    client.unlockStrategyTicker({
      runtime_id: 'rt', ticker_id: 'tk', reason: 'operator unlock after bust',
      new_allocation: { currency: 'TESTUSD', amount: '2500.50' },
    })
    expect(sock().sent[0].command).toEqual({
      type: 'unlock_strategy_ticker', runtime_id: 'rt', ticker_id: 'tk', reason: 'operator unlock after bust',
      new_allocation: { currency: 'TESTUSD', amount: '2500.50' },
    })
    expect(typeof sock().sent[0].command.new_allocation.amount).toBe('string')
  })
})

// ── runtime-targeting: forward target_runtime_id when provided ────────────────
describe('runtime-targeting (target_runtime_id) + optional strategy_instance_id', () => {
  it('forwards target_runtime_id + strategy_instance_id when provided; omits them otherwise', () => {
    const { client, sock } = makeClient()
    client.pauseStrategyTicker({
      runtime_id: 'rt', ticker_id: 'tk', reason: 'r',
      target_runtime_id: 'rt', strategy_instance_id: 'inst-1',
    })
    expect(sock().sent[0].command).toEqual({
      type: 'pause_strategy_ticker', runtime_id: 'rt', ticker_id: 'tk', reason: 'r',
      strategy_instance_id: 'inst-1', target_runtime_id: 'rt',
    })

    const { client: c2, sock: s2 } = makeClient()
    c2.pauseStrategyTicker({ runtime_id: 'rt', ticker_id: 'tk', reason: 'r' })
    expect(s2().sent[0].command).not.toHaveProperty('target_runtime_id')
    expect(s2().sent[0].command).not.toHaveProperty('strategy_instance_id')
  })
})

// ── control_ack resolution ────────────────────────────────────────────────────
describe('control commands resolve on control_ack', () => {
  it('resolves the ack event', async () => {
    const { client, sock } = makeClient()
    const p = client.pauseStrategyTicker({ runtime_id: 'rt', ticker_id: 'tk', reason: 'r' })
    sock().push(ack(sock().sent[0].request_id))
    const ev = await p
    expect(ev).toMatchObject({ type: 'control_ack', outcome: 'accepted' })
  })

  it('surfaces a gateway error (e.g. missing/stale control session) as a rejection', async () => {
    const { client, sock } = makeClient()
    const p = client.cancelStrategyTickerOrders({ runtime_id: 'rt', ticker_id: 'tk', reason: 'r' })
    sock().push({
      schema_version: 1, request_id: sock().sent[0].request_id,
      event: { type: 'error', code: 'strategy_control_unavailable', message: 'missing or stale runtime control session', retryable: false },
    })
    await expect(p).rejects.toMatchObject({ code: 'strategy_control_unavailable' })
  })
})

// ── required-field guards (throw + send NOTHING) ──────────────────────────────
describe('control guards — reason is mandatory (mutating a live runtime)', () => {
  it('pause/resume/cancel require runtime_id, ticker_id, and reason', () => {
    const { client, sock } = makeClient()
    expect(() => client.pauseStrategyTicker({ ticker_id: 'tk', reason: 'r' })).toThrow(/runtime_id is required/)
    expect(() => client.pauseStrategyTicker({ runtime_id: 'rt', reason: 'r' })).toThrow(/ticker_id is required/)
    expect(() => client.pauseStrategyTicker({ runtime_id: 'rt', ticker_id: 'tk' })).toThrow(/reason is required/)
    expect(() => client.resumeStrategyTicker({ runtime_id: 'rt', ticker_id: 'tk' })).toThrow(/reason is required/)
    expect(() => client.cancelStrategyTickerOrders({ runtime_id: 'rt', ticker_id: 'tk' })).toThrow(/reason is required/)
    expect(sock().sent).toHaveLength(0)
  })

  it('unlock additionally requires new_allocation.currency + amount', () => {
    const { client, sock } = makeClient()
    expect(() => client.unlockStrategyTicker({ runtime_id: 'rt', ticker_id: 'tk', reason: 'r' }))
      .toThrow(/new_allocation\.currency and new_allocation\.amount are required/)
    expect(() => client.unlockStrategyTicker({ runtime_id: 'rt', ticker_id: 'tk', reason: 'r', new_allocation: { currency: 'USD' } }))
      .toThrow(/new_allocation/)
    expect(sock().sent).toHaveLength(0)
  })

  it('adoptStrategyPosition requires runtime_id, ticker_id, position_id, reason', () => {
    const { client, sock } = makeClient()
    expect(() => client.adoptStrategyPosition({ runtime_id: 'rt', ticker_id: 'tk', reason: 'r' })).toThrow(/position_id is required/)
    expect(() => client.adoptStrategyPosition({ runtime_id: 'rt', ticker_id: 'tk', position_id: 1 })).toThrow(/reason is required/)
    expect(sock().sent).toHaveLength(0)
  })

  it('adoptStrategyPositions requires a non-empty, well-formed positions[] and a reason', () => {
    const { client, sock } = makeClient()
    expect(() => client.adoptStrategyPositions({ runtime_id: 'rt', positions: [], reason: 'r' })).toThrow(/positions\[\] is required/)
    expect(() => client.adoptStrategyPositions({ runtime_id: 'rt', positions: [{ ticker_id: 'tk' }], reason: 'r' }))
      .toThrow(/each position requires ticker_id and position_id/)
    expect(() => client.adoptStrategyPositions({ runtime_id: 'rt', positions: [{ ticker_id: 'tk', position_id: 1 }] }))
      .toThrow(/reason is required/)
    expect(sock().sent).toHaveLength(0)
  })
})

// ── getStrategyTicker resolves BOTH ticker shapes ─────────────────────────────
describe('getStrategyTicker resolves the ticker for the new AND live shapes', () => {
  it('new shape carries a top-level status', async () => {
    const { client, sock } = makeClient()
    const p = client.getStrategyTicker('strategy-runtime-v8-test', 'tTESTADA:TESTUSD')
    sock().push({ ...newTickerFx, request_id: sock().sent[0].request_id })
    const ticker = await p
    expect(ticker.status).toBe('waiting')                 // top-level status present
    expect(ticker.allocation.status).toBe('waiting')
  })

  it('live shape has NO top-level status (status lives on allocation) — still resolves', async () => {
    const { client, sock } = makeClient()
    const p = client.getStrategyTicker('v8-tail-repair-live-main', 'BITFINEX:tTESTADA:TESTUSD')
    sock().push({ ...liveTickerFx, request_id: sock().sent[0].request_id })
    const ticker = await p
    expect('status' in ticker).toBe(false)                // no top-level status in the live shape
    expect(ticker.allocation.status).toBe('entering')     // fall back to the allocation status
    // decimal string preserved through the client
    expect(ticker.allocation.available_cash).toBe('3991.7619364139086071762000000')
  })

  it('older shape (no top-level status) resolves too', async () => {
    const { client, sock } = makeClient()
    const p = client.getStrategyTicker('rt', 'tk')
    sock().push({ ...oldTickerFx, request_id: sock().sent[0].request_id })
    const ticker = await p
    expect(ticker.allocation.status).toBe('waiting')
  })
})
