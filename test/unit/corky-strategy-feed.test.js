// CorkyStrategyFeed — orchestration over a FAKE CorkyClient. One-shot reads
// delegate + return; the runtime subscription is FULL-REPLACEMENT, sequence-
// guarded, re-issued on reconnect, and torn down on unsubscribe/destroy/dispose.
import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyStrategyFeed } from '../../src/helpers/feed/corky-strategy-feed.js'
import runtimesFx from '../fixtures/corky/strategy/list_strategy_runtimes.json'

const RUNTIMES = runtimesFx.event.runtimes

function makeFakeClient() {
  const subs = new Map()          // subscription_id → Set(cb)
  const openListeners = new Set()
  const client = {
    calls: [],
    _runtimes: RUNTIMES,
    _runtime: RUNTIMES[0],
    _ticker: { ticker_id: 'BITFINEX:tTESTADA:TESTUSD', allocation: { status: 'waiting' } },
    _decisions: [{ decision_id: 'd1', outcome: 'no_intents' }],
    _operations: { runtime_id: 'rt', projection_revision: 'rev-1', events: [], lifecycle_intervals: [], resume_cursor: 'cursor-1' },
    _money: { runtime_id: 'rt', totals: { observed_balance: '10000.0000000000000000001' } },
    _overlays: [{ kind: 'fill', timestamp_ms: 1, label: 'x', status: 'filled' }],
    listStrategyRuntimes() { this.calls.push(['listStrategyRuntimes']); return Promise.resolve(this._runtimes) },
    getStrategyRuntime(id) { this.calls.push(['getStrategyRuntime', id]); return Promise.resolve(this._runtime) },
    getStrategyTicker(rt, tk) { this.calls.push(['getStrategyTicker', rt, tk]); return Promise.resolve(this._ticker) },
    listStrategyDecisions(rt, o) { this.calls.push(['listStrategyDecisions', rt, o]); return Promise.resolve(this._decisions) },
    listStrategyOperations(rt, o) { this.calls.push(['listStrategyOperations', rt, o]); return Promise.resolve(this._operations) },
    getStrategyMoney(rt) { this.calls.push(['getStrategyMoney', rt]); return Promise.resolve(this._money) },
    getStrategyChartOverlays(rt, tk, o) { this.calls.push(['getStrategyChartOverlays', rt, tk, o]); return Promise.resolve(this._overlays) },
    _subscribeResult: () => Promise.resolve(),
    subscribeStrategyRuntime(args) { this.calls.push(['subscribeStrategyRuntime', args]); return this._subscribeResult(args) },
    subscribeStrategyOperations(args) { this.calls.push(['subscribeStrategyOperations', args]); return this._subscribeResult(args) },
    unsubscribe(sid) { this.calls.push(['unsubscribe', sid]) },
    onSubscription(sid, cb) {
      if (!subs.has(sid)) subs.set(sid, new Set())
      subs.get(sid).add(cb)
      return () => { const s = subs.get(sid); if (s) s.delete(cb) }
    },
    on(type, cb) { if (type === 'open') { openListeners.add(cb); return () => openListeners.delete(cb) } return () => {} },
    _pushUpdate(sid, event) { for (const cb of (subs.get(sid) || [])) cb({ request_id: null, event }) },
    _emitOpen() { for (const cb of openListeners) cb() },
    _hasListeners(sid) { return (subs.get(sid) || new Set()).size > 0 },
  }
  return client
}

const runtimeUpdate = (sid, sequence, runtimes) => ({
  type: 'strategy_runtime_update', subscription_id: sid, sequence, runtimes,
})
const operationsUpdate = (sid, sequence, page) => ({
  type: 'strategy_operations_update', subscription_id: sid, sequence, page,
})

let client, feed
beforeEach(() => { client = makeFakeClient(); feed = new CorkyStrategyFeed({ client }) })

describe('construction', () => {
  it('requires a client', () => {
    expect(() => new CorkyStrategyFeed({})).toThrow(/`client` is required/)
  })
})

describe('one-shot reads delegate + pass args', () => {
  it('listRuntimes / getRuntime / getTicker resolve the client payloads', async () => {
    expect(await feed.listRuntimes()).toHaveLength(2)
    expect(await feed.getRuntime('v8-tail-repair-live-main')).toMatchObject({ runtime_id: 'v8-tail-repair-live-main' })
    expect(await feed.getTicker('rt', 'BITFINEX:tTESTADA:TESTUSD')).toMatchObject({ allocation: { status: 'waiting' } })
    expect(client.calls).toContainEqual(['getStrategyRuntime', 'v8-tail-repair-live-main'])
    expect(client.calls).toContainEqual(['getStrategyTicker', 'rt', 'BITFINEX:tTESTADA:TESTUSD'])
  })

  it('listDecisions / getChartOverlays forward their opts verbatim', async () => {
    expect(await feed.listDecisions('rt', { ticker_id: 'tk', limit: 5 })).toHaveLength(1)
    expect(client.calls).toContainEqual(['listStrategyDecisions', 'rt', { ticker_id: 'tk', limit: 5 }])
    expect(await feed.getChartOverlays('rt', 'tk', { timeframe: '1m' })).toHaveLength(1)
    expect(client.calls).toContainEqual(['getStrategyChartOverlays', 'rt', 'tk', { timeframe: '1m' }])
  })

  it('listOperations preserves opaque cursors', async () => {
    expect(await feed.listOperations('rt', { limit: 40, cursor: 'opaque' })).toMatchObject({ projection_revision: 'rev-1' })
    expect(client.calls).toContainEqual(['listStrategyOperations', 'rt', { limit: 40, cursor: 'opaque' }])
  })

  it('getMoney delegates without converting decimals', async () => {
    expect((await feed.getMoney('rt')).totals.observed_balance).toBe('10000.0000000000000000001')
    expect(client.calls).toContainEqual(['getStrategyMoney', 'rt'])
  })
})

describe('subscribeOperations — cursor-resumable immutable pages', () => {
  it('delivers in-order pages and resumes from the latest published cursor', () => {
    const got = []
    const h = feed.subscribeOperations({ runtime_id: 'rt', cursor: 'cursor-0' }, {
      onData: (page, meta) => got.push([meta.sequence, page.projection_revision]),
    })
    expect(client.calls).toContainEqual(['subscribeStrategyOperations', {
      runtime_id: 'rt', cursor: 'cursor-0', subscription_id: h.subscription_id,
    }])
    client._pushUpdate(h.subscription_id, operationsUpdate(h.subscription_id, 1, {
      runtime_id: 'rt', projection_revision: 'rev-2', events: [],
      lifecycle_intervals: [], resume_cursor: 'cursor-2',
    }))
    client._pushUpdate(h.subscription_id, operationsUpdate(h.subscription_id, 1, {
      runtime_id: 'rt', projection_revision: 'stale', events: [], lifecycle_intervals: [],
    }))
    expect(got).toEqual([[1, 'rev-2']])
    client._emitOpen()
    client._emitOpen()
    expect(client.calls.filter((call) => call[0] === 'subscribeStrategyOperations').pop()).toEqual([
      'subscribeStrategyOperations', {
        runtime_id: 'rt', cursor: 'cursor-2', subscription_id: h.subscription_id,
      },
    ])
  })
})

describe('subscribeRuntime — streaming, full-replacement, sequence-guarded', () => {
  it('delivers the full runtimes list per in-order update; drops stale sequences', () => {
    const got = []
    const h = feed.subscribeRuntime({ runtime_id: 'v8-tail-repair-live-main' },
      { onData: (runtimes, meta) => got.push([meta.sequence, runtimes.length]) })
    const sid = h.subscription_id
    expect(client._hasListeners(sid)).toBe(true)
    // the subscribe frame carried runtime_id + the minted subscription_id
    expect(client.calls).toContainEqual(['subscribeStrategyRuntime', { runtime_id: 'v8-tail-repair-live-main', subscription_id: sid }])

    client._pushUpdate(sid, runtimeUpdate(sid, 1, RUNTIMES.slice(0, 1)))
    client._pushUpdate(sid, runtimeUpdate(sid, 1, RUNTIMES))          // stale (<=lastSeq) → dropped
    client._pushUpdate(sid, runtimeUpdate(sid, 2, RUNTIMES))          // full replacement (2 runtimes)
    expect(got).toEqual([[1, 1], [2, 2]])
    expect(h.lastGood).toHaveLength(2)
  })

  it('deterministic subscription_id minting (counter + prefix)', () => {
    const a = feed.subscribeRuntime({ runtime_id: 'rt' }, {})
    const b = feed.subscribeRuntime({ strategy: 'ema_regime_breakout_v8' }, {})
    expect(a.subscription_id).toBe('strategy-runtime-1')
    expect(b.subscription_id).toBe('strategy-runtime-2')
  })

  it('routes an inline error event to onError and flags streaming unsupported for stateful_websocket_required', () => {
    let err = null
    const h = feed.subscribeRuntime({ runtime_id: 'rt' }, { onError: (e) => { err = e } })
    client._pushUpdate(h.subscription_id, { type: 'error', code: 'stateful_websocket_required', message: 'need stateful ws' })
    expect(err).toMatchObject({ code: 'stateful_websocket_required' })
    expect(feed.streamingSupported).toBe(false)
  })

  it('surfaces a subscribe REJECTION (async) to onError with the last good set', async () => {
    client._subscribeResult = () => Promise.reject({ code: 'strategy_not_found', message: 'nope' })
    let err = null
    feed.subscribeRuntime({ runtime_id: 'ghost' }, { onError: (e) => { err = e } })
    await Promise.resolve(); await Promise.resolve()
    expect(err).toMatchObject({ code: 'strategy_not_found' })
  })

  it('re-issues the subscription on reconnect (sequence reset); first open is a no-op', () => {
    const h = feed.subscribeRuntime({ runtime_id: 'rt' }, {})
    const count = () => client.calls.filter((c) => c[0] === 'subscribeStrategyRuntime').length
    const before = count()
    client._pushUpdate(h.subscription_id, runtimeUpdate(h.subscription_id, 5, RUNTIMES))
    expect(h.lastSeq).toBe(5)

    client._emitOpen()                 // initial connect → no re-issue
    expect(count()).toBe(before)
    client._emitOpen()                 // a reconnect → re-issue + sequence reset
    expect(count()).toBe(before + 1)
    expect(h.lastSeq).toBe(-Infinity)
  })

  it('unsubscribe detaches fan-out + tells the gateway; destroy/dispose tear all down', () => {
    const h = feed.subscribeRuntime({ runtime_id: 'rt' }, {})
    const sid = h.subscription_id
    feed.unsubscribe(h)
    expect(client._hasListeners(sid)).toBe(false)
    expect(client.calls).toContainEqual(['unsubscribe', sid])
    expect(h.closed).toBe(true)

    const h2 = feed.subscribeRuntime({ runtime_id: 'rt2' }, {})
    feed.dispose()                     // alias for destroy()
    expect(client._hasListeners(h2.subscription_id)).toBe(false)
  })

  it('after unsubscribe, a late update is ignored (closed handle)', () => {
    const got = []
    const h = feed.subscribeRuntime({ runtime_id: 'rt' }, { onData: (r) => got.push(r) })
    const sid = h.subscription_id
    feed.unsubscribe(h)
    client._pushUpdate(sid, runtimeUpdate(sid, 1, RUNTIMES))   // fan-out already detached
    expect(got).toHaveLength(0)
  })
})
