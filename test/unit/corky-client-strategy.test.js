// CorkyClient strategy-runtime senders: one-shot command framing + terminal-event
// FIELD extraction (event.type ≠ the field it carries), input guards, and the
// runtime subscription (first strategy_runtime_update resolves the subscribe; the
// rest fan out). Drives the REAL client through a FakeSocket (no network),
// replaying the saved strategy fixtures.
import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyClient } from '../../src/helpers/feed/corky-client.js'

import runtimesFx from '../fixtures/corky/strategy/list_strategy_runtimes.json'
import runtimeFx from '../fixtures/corky/strategy/get_strategy_runtime.json'
import tickerAdaFx from '../fixtures/corky/strategy/get_strategy_ticker_ADA.json'
import decisionsFx from '../fixtures/corky/strategy/list_strategy_decisions_ADA.json'
import overlaysFx from '../fixtures/corky/strategy/get_strategy_chart_overlays_ADA_1m.json'

// ── FakeSocket (records outbound frames, pushes gateway events back) ───────────
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
  drop(code = 1006) { if (this.onclose) this.onclose({ code }) }
  static reset() { FakeSocket.instances = [] }
}
FakeSocket.instances = []

function makeClient(opts = {}) {
  FakeSocket.reset()
  const client = new CorkyClient({
    url: 'ws://fake/corky', socketFactory: (url) => new FakeSocket(url), backoff: false, ...opts,
  })
  client.connect()
  const sock = () => FakeSocket.instances[FakeSocket.instances.length - 1]
  sock().open()
  return { client, sock }
}

const withRequestId = (envelope, request_id) => ({ ...envelope, request_id })

beforeEach(() => FakeSocket.reset())

// ── one-shot reads: framing + FIELD extraction ────────────────────────────────
describe('strategy one-shot reads: command framing + terminal FIELD extraction', () => {
  it('listStrategyRuntimes → strategy_runtimes → resolves event.runtimes', async () => {
    const { client, sock } = makeClient()
    const p = client.listStrategyRuntimes()
    expect(sock().sent[0].command).toEqual({ type: 'list_strategy_runtimes' })
    sock().push(withRequestId(runtimesFx, sock().sent[0].request_id))
    const runtimes = await p
    expect(Array.isArray(runtimes)).toBe(true)
    expect(runtimes.map((r) => r.runtime_id)).toEqual(['v8-tail-repair-live-main', 'v8-tail-repair-status-main'])
  })

  it('getStrategyRuntime → strategy_runtime → resolves event.runtime (the object, not the array)', async () => {
    const { client, sock } = makeClient()
    const p = client.getStrategyRuntime('v8-tail-repair-live-main')
    expect(sock().sent[0].command).toEqual({ type: 'get_strategy_runtime', runtime_id: 'v8-tail-repair-live-main' })
    sock().push(withRequestId(runtimeFx, sock().sent[0].request_id))
    const runtime = await p
    expect(runtime.runtime_id).toBe('v8-tail-repair-live-main')
    // decimal string preserved through the client
    expect(runtime.ticker_allocations[1].position_avg_price).toBe('60281.158738234545917069447978')
  })

  it('getStrategyTicker → strategy_ticker → resolves event.ticker', async () => {
    const { client, sock } = makeClient()
    const p = client.getStrategyTicker('v8-tail-repair-live-main', 'BITFINEX:tTESTADA:TESTUSD')
    expect(sock().sent[0].command).toEqual({
      type: 'get_strategy_ticker', runtime_id: 'v8-tail-repair-live-main', ticker_id: 'BITFINEX:tTESTADA:TESTUSD',
    })
    sock().push(withRequestId(tickerAdaFx, sock().sent[0].request_id))
    const ticker = await p
    expect(ticker.ticker_id).toBe('BITFINEX:tTESTADA:TESTUSD')
    expect(ticker.allocation.status).toBe('waiting')
  })

  it('listStrategyDecisions → strategy_decisions → resolves event.decisions; passes ticker_id + limit only when given', async () => {
    const { client, sock } = makeClient()
    const p = client.listStrategyDecisions('v8-tail-repair-live-main', { ticker_id: 'bitfinex:tTESTADA:TESTUSD', limit: 3 })
    expect(sock().sent[0].command).toEqual({
      type: 'list_strategy_decisions', runtime_id: 'v8-tail-repair-live-main',
      ticker_id: 'bitfinex:tTESTADA:TESTUSD', limit: 3,
    })
    sock().push(withRequestId(decisionsFx, sock().sent[0].request_id))
    const decisions = await p
    expect(decisions).toHaveLength(3)
    expect(decisions[0].outcome).toBe('no_intents')

    // no opts → bare command (no ticker_id/limit keys)
    const { client: c2, sock: s2 } = makeClient()
    c2.listStrategyDecisions('rt-only')
    expect(s2().sent[0].command).toEqual({ type: 'list_strategy_decisions', runtime_id: 'rt-only' })
  })

  it('getStrategyChartOverlays → strategy_chart_overlays → resolves event.overlays; windows only when given', async () => {
    const { client, sock } = makeClient()
    const p = client.getStrategyChartOverlays('v8-tail-repair-live-main', 'tTESTADA:TESTUSD', {
      timeframe: '1m', start_ms: 1782921307806, end_ms: 1782937599595,
    })
    expect(sock().sent[0].command).toEqual({
      type: 'get_strategy_chart_overlays', runtime_id: 'v8-tail-repair-live-main', ticker_id: 'tTESTADA:TESTUSD',
      timeframe: '1m', start_ms: 1782921307806, end_ms: 1782937599595,
    })
    sock().push(withRequestId(overlaysFx, sock().sent[0].request_id))
    const overlays = await p
    expect(overlays).toHaveLength(51)
    expect(overlays[0].kind).toBe('fill')

    const { client: c2, sock: s2 } = makeClient()
    c2.getStrategyChartOverlays('rt', 'tk')
    expect(s2().sent[0].command).toEqual({ type: 'get_strategy_chart_overlays', runtime_id: 'rt', ticker_id: 'tk' })
  })

  it('listStrategyOperations returns the page and preserves its opaque cursors', async () => {
    const { client, sock } = makeClient()
    const p = client.listStrategyOperations('rt-main', { limit: 25, cursor: 'opaque.page.2' })
    expect(sock().sent[0].command).toEqual({
      type: 'list_strategy_operations', runtime_id: 'rt-main', limit: 25, cursor: 'opaque.page.2',
    })
    sock().push({
      schema_version: 1,
      request_id: sock().sent[0].request_id,
      event: {
        type: 'strategy_operations',
        page: {
          runtime_id: 'rt-main', projection_revision: 'rev-2', events: [],
          next_cursor: 'opaque.page.3', resume_cursor: 'opaque.resume.2', lifecycle_intervals: [],
        },
      },
    })
    await expect(p).resolves.toMatchObject({
      runtime_id: 'rt-main', next_cursor: 'opaque.page.3', resume_cursor: 'opaque.resume.2',
    })
  })

  it('getStrategyMoney returns the authoritative projection with decimal strings intact', async () => {
    const { client, sock } = makeClient()
    const p = client.getStrategyMoney('rt-main')
    expect(sock().sent[0].command).toEqual({ type: 'get_strategy_money', runtime_id: 'rt-main' })
    sock().push({
      schema_version: 1,
      request_id: sock().sent[0].request_id,
      event: {
        type: 'strategy_money',
        money: {
          runtime_id: 'rt-main', projection_revision: 'money-rev', authority_scope: 'wallet_local',
          generated_at_ms: 1, totals: { observed_balance: '10000.0000000000000000001' },
          wallets: [], ticker_allocations: [], funding: [],
        },
      },
    })
    const money = await p
    expect(money.totals.observed_balance).toBe('10000.0000000000000000001')
  })
})

// ── input guards ──────────────────────────────────────────────────────────────
describe('strategy sender input guards (throw + send nothing)', () => {
  it('one-shot readers require their ids', () => {
    const { client, sock } = makeClient()
    expect(() => client.getStrategyRuntime()).toThrow(/runtime_id is required/)
    expect(() => client.getStrategyTicker('rt')).toThrow(/runtime_id and ticker_id are required/)
    expect(() => client.getStrategyChartOverlays('rt')).toThrow(/runtime_id and ticker_id are required/)
    expect(() => client.listStrategyDecisions()).toThrow(/runtime_id is required/)
    expect(() => client.listStrategyOperations()).toThrow(/runtime_id is required/)
    expect(() => client.getStrategyMoney()).toThrow(/runtime_id is required/)
    expect(sock().sent).toHaveLength(0)
  })

  it('subscribeStrategyRuntime checks subscription_id first, then runtime_id|strategy', () => {
    const { client, sock } = makeClient()
    expect(() => client.subscribeStrategyRuntime({})).toThrow(/subscription_id is required/)
    expect(() => client.subscribeStrategyRuntime({ subscription_id: 's' })).toThrow(/runtime_id or strategy is required/)
    expect(sock().sent).toHaveLength(0)
  })

  it('subscribeStrategyOperations requires ids', () => {
    const { client, sock } = makeClient()
    expect(() => client.subscribeStrategyOperations({})).toThrow(/subscription_id is required/)
    expect(() => client.subscribeStrategyOperations({ subscription_id: 'ops' })).toThrow(/runtime_id is required/)
    expect(sock().sent).toHaveLength(0)
  })
})

// ── runtime subscription streaming ─────────────────────────────────────────────
describe('subscribeStrategyRuntime — first update resolves, rest fan out', () => {
  const liveRuntimes = runtimesFx.event.runtimes
  const update = (subscription_id, sequence, runtimes) => ({
    schema_version: 1, request_id: sequence === 1 ? 's1' : null,
    event: { type: 'strategy_runtime_update', subscription_id, sequence, runtimes },
  })

  it('sends subscribe_strategy_runtime with runtime_id (not strategy); resolves on the FIRST update; fans out the rest', async () => {
    const { client, sock } = makeClient()
    const seen = []
    const p = client.subscribeStrategyRuntime({
      subscription_id: 'strategy-runtime-main', runtime_id: 'v8-tail-repair-live-main',
      onEvent: ({ event }) => seen.push(['onEvent', event.sequence]),
    })
    expect(sock().sent[0].command).toEqual({
      type: 'subscribe_strategy_runtime', subscription_id: 'strategy-runtime-main', runtime_id: 'v8-tail-repair-live-main',
    })

    sock().push(update('strategy-runtime-main', 1, liveRuntimes))
    const first = await p
    expect(first.type).toBe('strategy_runtime_update')
    expect(first.sequence).toBe(1)
    expect(first.runtimes.map((r) => r.runtime_id)).toContain('v8-tail-repair-live-main')
    expect(seen).toEqual([['onEvent', 1]])

    // subsequent updates only reach onSubscription (the subscribe already settled)
    client.onSubscription('strategy-runtime-main', ({ event }) => seen.push(['fanout', event.sequence]))
    sock().push(update('strategy-runtime-main', 2, liveRuntimes.slice(0, 1)))
    expect(seen).toContainEqual(['fanout', 2])
  })

  it('sends `strategy` (not runtime_id) when scoping by strategy', () => {
    const { client, sock } = makeClient()
    client.subscribeStrategyRuntime({ subscription_id: 'sub-strat', strategy: 'ema_regime_breakout_v8' })
    expect(sock().sent[0].command).toEqual({
      type: 'subscribe_strategy_runtime', subscription_id: 'sub-strat', strategy: 'ema_regime_breakout_v8',
    })
  })

  it('a foreign subscription_id never leaks into another stream', () => {
    const { client, sock } = makeClient()
    client.onSubscription('other-sub', () => { throw new Error('must not fire') })
    const seen = []
    client.onSubscription('strategy-runtime-main', ({ event }) => seen.push(event.sequence))
    sock().push(update('strategy-runtime-main', 1, liveRuntimes))
    expect(seen).toEqual([1])
  })

  it('rejects the subscribe when the gateway requires a stateful websocket', async () => {
    const { client, sock } = makeClient()
    const p = client.subscribeStrategyRuntime({ subscription_id: 'sub-1', runtime_id: 'rt' })
    sock().push({
      schema_version: 1, request_id: sock().sent[0].request_id,
      event: { type: 'error', code: 'stateful_websocket_required', message: 'subscriptions require a stateful websocket', retryable: false },
    })
    await expect(p).rejects.toMatchObject({ code: 'stateful_websocket_required' })
  })
})

describe('subscribeStrategyOperations — first page resolves, rest fan out', () => {
  it('sends cursor verbatim and resolves the first operations update', async () => {
    const { client, sock } = makeClient()
    const seen = []
    const p = client.subscribeStrategyOperations({
      subscription_id: 'ops-main', runtime_id: 'rt-main', cursor: 'opaque.resume.1',
      onEvent: ({ event }) => seen.push(event.sequence),
    })
    expect(sock().sent[0].command).toEqual({
      type: 'subscribe_strategy_operations', subscription_id: 'ops-main',
      runtime_id: 'rt-main', cursor: 'opaque.resume.1',
    })
    sock().push({
      schema_version: 1,
      event: {
        type: 'strategy_operations_update', subscription_id: 'ops-main', sequence: 1,
        page: { runtime_id: 'rt-main', projection_revision: 'rev-1', events: [], lifecycle_intervals: [] },
      },
    })
    await expect(p).resolves.toMatchObject({ type: 'strategy_operations_update', sequence: 1 })
    expect(seen).toEqual([1])
  })
})
