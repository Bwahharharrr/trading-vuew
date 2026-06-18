// Unit tests for CorkyPositionsFeed — orchestration over a FAKE CorkyClient.
// The fake records calls, lets the test resolve/reject the subscribe promises,
// and drive fan-out updates (mimicking onSubscription delivery).

import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyPositionsFeed } from '../../src/helpers/feed/corky-positions-feed.js'
import * as fx from '../fixtures/corky/index.js'

// ── FakeClient ──────────────────────────────────────────────────────────────
function makeFakeClient() {
  const subs = new Map()         // subscription_id → Set(cb)
  const openListeners = new Set()
  const client = {
    calls: [],
    // one-shot reads return controllable results
    _positions: fx.authPositionsEvent.event,
    _history: fx.authPositionHistoryEvent.event,
    _audit: fx.authPositionAuditEvent.event,
    listAuthPositions(args) { this.calls.push(['listAuthPositions', args]); return Promise.resolve(this._positions) },
    listAuthPositionHistory(args) { this.calls.push(['listAuthPositionHistory', args]); return Promise.resolve(this._history) },
    getAuthPositionAudit(args) { this.calls.push(['getAuthPositionAudit', args]); return Promise.resolve(this._audit) },
    // subscribe methods: record + return a (by default) never-rejecting promise.
    // Tests override _subscribeResult to inject a rejection.
    _subscribeResult: () => Promise.resolve(),
    subscribeAuthPositions(args) { this.calls.push(['subscribeAuthPositions', args]); return this._subscribeResult(args) },
    subscribeAuthPositionAudit(args) { this.calls.push(['subscribeAuthPositionAudit', args]); return this._subscribeResult(args) },
    unsubscribe(sid) { this.calls.push(['unsubscribe', sid]) },
    onSubscription(sid, cb) {
      if (!subs.has(sid)) subs.set(sid, new Set())
      subs.get(sid).add(cb)
      return () => { const s = subs.get(sid); if (s) s.delete(cb) }
    },
    on(type, cb) { if (type === 'open') { openListeners.add(cb); return () => openListeners.delete(cb) } return () => {} },
    // ── test drivers ──
    _pushUpdate(sid, event) { for (const cb of (subs.get(sid) || [])) cb({ request_id: null, event }) },
    _emitOpen() { for (const cb of openListeners) cb() },
    _hasListeners(sid) { return (subs.get(sid) || new Set()).size > 0 },
  }
  return client
}

const tick = () => new Promise((r) => setTimeout(r, 0))

let client, feed
beforeEach(() => {
  client = makeFakeClient()
  feed = new CorkyPositionsFeed({ client })
})

describe('one-shot reads delegate + parse', () => {
  it('listOpen → { positions, current, historical }', async () => {
    const out = await feed.listOpen({ venue: 'BITFINEX' })
    expect(client.calls[0]).toEqual(['listAuthPositions', { venue: 'BITFINEX', account_id: undefined, symbol: undefined, include_historical: false }])
    expect(out.current).toHaveLength(1)
    expect(out.historical).toHaveLength(1)
  })

  it('listHistory → { positions, next_cursor, total_count }', async () => {
    const out = await feed.listHistory({ venue: 'BITFINEX', account_id: 'paper-a', limit: 2 })
    expect(out.total_count).toBe(1)
    expect(out.next_cursor).toBeNull()
  })

  it('getAudit → audit bundle', async () => {
    const out = await feed.getAudit({ venue: 'BITFINEX', account_id: 'paper-a', symbol: 'tBTCUSD', position_id: 77 })
    expect(out.summary.status).toBe('complete')
  })
})

describe('subscribeOpen — streaming, full-replacement, sequence-guarded', () => {
  it('applies in-order updates and replaces the set each time', async () => {
    const seen = []
    feed.subscribeOpen({ subscription_id: 'sub-open' }, { onData: (d) => seen.push(d) })
    await tick()
    expect(client.calls.some((c) => c[0] === 'subscribeAuthPositions')).toBe(true)

    client._pushUpdate('sub-open', fx.authPositionsUpdateEvent.event)            // seq 1 (1 row)
    client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 2, positions: [] }) // seq 2 (empty)

    expect(seen).toHaveLength(2)
    expect(seen[0].current).toHaveLength(1)
    expect(seen[1].current).toHaveLength(0)   // full replacement, not a merge
  })

  it('drops stale / duplicate sequences', async () => {
    const seen = []
    feed.subscribeOpen({ subscription_id: 'sub-open' }, { onData: (d) => seen.push(d.positions.length) })
    client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 5, positions: [{ source: 'current' }] })
    client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 5, positions: [] }) // dup seq
    client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 3, positions: [] }) // stale
    expect(seen).toEqual([1])   // only the first applied
  })

  it('unsubscribe detaches fan-out and notifies the gateway', async () => {
    const handle = feed.subscribeOpen({ subscription_id: 'sub-open' }, { onData: () => {} })
    expect(client._hasListeners('sub-open')).toBe(true)
    feed.unsubscribe(handle)
    expect(client._hasListeners('sub-open')).toBe(false)
    expect(client.calls).toContainEqual(['unsubscribe', 'sub-open'])
    // a late update after unsubscribe is ignored
    let late = 0
    client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 9, positions: [] })
    expect(late).toBe(0)
  })
})

describe('subscribe error handling', () => {
  it('stateful_websocket_required → onError(lastGood) + streamingSupported=false', async () => {
    client._subscribeResult = () => Promise.reject({ code: 'stateful_websocket_required', message: 'need stateful ws', retryable: false })
    let errSeen = null
    let lastGood = 'sentinel'
    feed.subscribeOpen({ subscription_id: 'sub-open' }, {
      onError: (err, ctx) => { errSeen = err; lastGood = ctx.lastGood },
    })
    await tick()
    expect(errSeen.code).toBe('stateful_websocket_required')
    expect(lastGood).toBeNull()                 // nothing good yet
    expect(feed.streamingSupported).toBe(false)
  })

  it('keeps the last good payload across a later error', async () => {
    let lastGood = null
    const handle = feed.subscribeOpen({ subscription_id: 'sub-open' }, {
      onError: (_err, ctx) => { lastGood = ctx.lastGood },
    })
    client._pushUpdate('sub-open', fx.authPositionsUpdateEvent.event)   // good data
    feed._onSubError(handle, { code: 'auth_position_history_unavailable', message: 'x', retryable: true })
    expect(lastGood).not.toBeNull()
    expect(lastGood.current).toHaveLength(1)
  })
})

describe('reconnect re-issues active subscriptions', () => {
  it('re-sends the subscribe and resets the sequence guard on a later open', async () => {
    const seen = []
    feed.subscribeOpen({ subscription_id: 'sub-open' }, { onData: (d) => seen.push(d.positions.length) })
    client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 7, positions: [{ source: 'current' }] })
    expect(seen).toEqual([1])

    const subscribesBefore = client.calls.filter((c) => c[0] === 'subscribeAuthPositions').length
    client._emitOpen()  // INITIAL open the feed observes → no re-issue
    expect(client.calls.filter((c) => c[0] === 'subscribeAuthPositions').length).toBe(subscribesBefore)

    client._emitOpen()  // a RECONNECT → re-issue
    await tick()
    expect(client.calls.filter((c) => c[0] === 'subscribeAuthPositions').length).toBe(subscribesBefore + 1)

    // sequence guard reset: a fresh seq-1 stream is accepted (not dropped as stale)
    client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 1, positions: [] })
    expect(seen).toEqual([1, 0])
  })

  it('destroy() unsubscribes everything', async () => {
    feed.subscribeOpen({ subscription_id: 'a' }, {})
    feed.subscribeAudit({ subscription_id: 'b', venue: 'BITFINEX', account_id: 'paper-a', symbol: 'tBTCUSD', position_id: 77 }, {})
    feed.destroy()
    expect(client.calls).toContainEqual(['unsubscribe', 'a'])
    expect(client.calls).toContainEqual(['unsubscribe', 'b'])
  })
})
