// Edge / error-path unit tests for CorkyPositionsFeed — orchestration over a
// FAKE CorkyClient. These pin the less-trodden branches of corky-positions-feed.js:
// audit-stream data delivery, inline `event.type === 'error'` routing, SYNCHRONOUS
// subscribe throws, onData-handler isolation, unsubscribe error swallowing
// (sync throw + rejecting promise + null handle), deterministic id minting, and
// the typeof-guards (falsy event, client without on()).
//
// Pure node env (no DOM); deterministic — no real network, timers, or randomness.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CorkyPositionsFeed } from '../../src/helpers/feed/corky-positions-feed.js'
import * as fx from '../fixtures/corky/index.js'

// ── FakeClient ──────────────────────────────────────────────────────────────
// `withOn` toggles whether the client exposes an on() method (exercises the
// `typeof this.client.on === 'function'` constructor guard).
function makeFakeClient({ withOn = true } = {}) {
  const subs = new Map()         // subscription_id → Set(cb)
  const openListeners = new Set()
  const client = {
    calls: [],
    // subscribe methods record + return a (by default) never-rejecting promise.
    // Tests override _subscribeResult to inject a rejection or a synchronous throw.
    _subscribeResult: () => Promise.resolve(),
    subscribeAuthPositions(args) { this.calls.push(['subscribeAuthPositions', args]); return this._subscribeResult(args) },
    subscribeAuthPositionAudit(args) { this.calls.push(['subscribeAuthPositionAudit', args]); return this._subscribeResult(args) },
    // unsubscribe behaviour is overridable per test (default: record only).
    _unsubscribeResult: () => undefined,
    unsubscribe(sid) { this.calls.push(['unsubscribe', sid]); return this._unsubscribeResult(sid) },
    onSubscription(sid, cb) {
      if (!subs.has(sid)) subs.set(sid, new Set())
      subs.get(sid).add(cb)
      return () => { const s = subs.get(sid); if (s) s.delete(cb) }
    },
    // ── test drivers ──
    _pushUpdate(sid, event) { for (const cb of (subs.get(sid) || [])) cb({ request_id: null, event }) },
    _pushRaw(sid, payload) { for (const cb of (subs.get(sid) || [])) cb(payload) },
    _hasListeners(sid) { return (subs.get(sid) || new Set()).size > 0 },
  }
  if (withOn) {
    client.on = (type, cb) => {
      if (type === 'open') { openListeners.add(cb); return () => openListeners.delete(cb) }
      return () => {}
    }
    client._emitOpen = () => { for (const cb of openListeners) cb() }
  }
  return client
}

const tick = () => new Promise((r) => setTimeout(r, 0))

let client, feed
beforeEach(() => {
  client = makeFakeClient()
  feed = new CorkyPositionsFeed({ client })
})

describe('subscribeAudit — data path', () => {
  it('delivers the parsed audit bundle (summary/orders/trades) via onData with the sequence', () => {
    const seen = []
    const ctxs = []
    feed.subscribeAudit(
      { subscription_id: 'sub-audit' },
      { onData: (d, ctx) => { seen.push(d); ctxs.push(ctx) } },
    )

    // The canonical fixture is an auth_position_audit_update at sequence 1.
    const ev = fx.authPositionAuditUpdateEvent.event
    expect(ev.type).toBe('auth_position_audit_update')
    expect(ev.sequence).toBe(1)
    client._pushUpdate('sub-audit', ev)

    expect(seen).toHaveLength(1)
    const audit = seen[0]
    // parseAudit returns event.audit verbatim → identity with the fixture bundle.
    expect(audit).toBe(ev.audit)
    expect(audit.summary.status).toBe('complete')
    expect(audit.orders).toHaveLength(1)
    expect(audit.trades).toHaveLength(1)
    // sequence threaded through as the second onData arg.
    expect(ctxs[0]).toEqual({ sequence: 1 })
  })
})

describe('inline error update (event.type === "error")', () => {
  it('routes to onError(err, { lastGood }) and does NOT call onData', () => {
    const onData = vi.fn()
    let errSeen = null
    let lastGoodSeen = 'unset'
    const handle = feed.subscribeAudit(
      { subscription_id: 'sub-audit' },
      {
        onData,
        onError: (err, ctx) => { errSeen = err; lastGoodSeen = ctx.lastGood },
      },
    )

    // First a good update so lastGood is populated, then an inline error.
    client._pushUpdate('sub-audit', fx.authPositionAuditUpdateEvent.event)
    expect(onData).toHaveBeenCalledTimes(1)

    const errorEvent = { type: 'error', code: 'auth_position_audit_unavailable', message: 'gone' }
    client._pushUpdate('sub-audit', errorEvent)

    // onData NOT called again for the error event.
    expect(onData).toHaveBeenCalledTimes(1)
    // _onSubError forwards the event itself as `err`, with the retained lastGood.
    expect(errSeen).toBe(errorEvent)
    expect(lastGoodSeen).toBe(fx.authPositionAuditUpdateEvent.event.audit)
    // Not a stateful_websocket_required error → streaming stays supported.
    expect(feed.streamingSupported).toBe(true)
    expect(handle.closed).toBe(false)
  })
})

describe('synchronous throw from the subscribe method', () => {
  it('is caught and surfaced via onError (not propagated to the caller)', () => {
    const boom = new Error('sync subscribe boom')
    client._subscribeResult = () => { throw boom }
    let errSeen = null
    let lastGoodSeen = 'unset'

    // _subscribe → _issue runs synchronously inside subscribeOpen; the throw must
    // be swallowed there (no exception escapes), then routed to onError.
    let handle
    expect(() => {
      handle = feed.subscribeOpen(
        { subscription_id: 'sub-open' },
        { onError: (err, ctx) => { errSeen = err; lastGoodSeen = ctx.lastGood } },
      )
    }).not.toThrow()

    expect(errSeen).toBe(boom)
    expect(lastGoodSeen).toBeNull()      // nothing good ever arrived
    expect(handle.subscription_id).toBe('sub-open')
  })
})

describe('onData handler isolation', () => {
  it('a throwing onData does not poison the handle — a later in-order update still fires onData', () => {
    let calls = 0
    const onData = vi.fn(() => { calls += 1; if (calls === 1) throw new Error('consumer blew up') })
    feed.subscribeOpen({ subscription_id: 'sub-open' }, { onData })

    // seq 1 → handler throws, but is isolated inside _onUpdate.
    expect(() => {
      client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 1, positions: [{ source: 'current' }] })
    }).not.toThrow()

    // seq 2 (strictly greater) → still delivered; handle was not closed/poisoned.
    client._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 2, positions: [] })

    expect(onData).toHaveBeenCalledTimes(2)
    // second call received the empty (full-replacement) set.
    expect(onData.mock.calls[1][0].current).toHaveLength(0)
    expect(onData.mock.calls[1][1]).toEqual({ sequence: 2 })
  })
})

describe('unsubscribe — best-effort error swallowing', () => {
  it('swallows a client.unsubscribe() that throws synchronously', () => {
    const handle = feed.subscribeOpen({ subscription_id: 'sub-open' }, { onData: () => {} })
    client._unsubscribeResult = () => { throw new Error('sync unsubscribe boom') }
    expect(() => feed.unsubscribe(handle)).not.toThrow()
    // still tore down: fan-out detached + removed from the registry.
    expect(client._hasListeners('sub-open')).toBe(false)
    expect(handle.closed).toBe(true)
  })

  it('swallows a client.unsubscribe() that returns a REJECTING promise (no unhandled rejection)', async () => {
    const onUnhandled = vi.fn()
    process.on('unhandledRejection', onUnhandled)
    try {
      const handle = feed.subscribeOpen({ subscription_id: 'sub-open' }, { onData: () => {} })
      client._unsubscribeResult = () => Promise.reject(new Error('client closed'))
      expect(() => feed.unsubscribe(handle)).not.toThrow()
      // let any microtask/macrotask rejection flush.
      await tick()
      await tick()
      expect(onUnhandled).not.toHaveBeenCalled()
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })

  it('unsubscribe(null/undefined) is a no-op — no throw, no client call', () => {
    const before = client.calls.length
    expect(() => feed.unsubscribe(null)).not.toThrow()
    expect(() => feed.unsubscribe(undefined)).not.toThrow()
    expect(client.calls.filter((c) => c[0] === 'unsubscribe')).toHaveLength(0)
    expect(client.calls.length).toBe(before)
  })
})

describe('deterministic subscription_id minting', () => {
  it('subscribeOpen without subscription_id → "auth-positions-1"', () => {
    const handle = feed.subscribeOpen({}, { onData: () => {} })
    expect(handle.subscription_id).toBe('auth-positions-1')
    // the minted id is threaded into the request args.
    const call = client.calls.find((c) => c[0] === 'subscribeAuthPositions')
    expect(call[1].subscription_id).toBe('auth-positions-1')
  })

  it('subscribeAudit without subscription_id → "auth-position-audit-1"', () => {
    const handle = feed.subscribeAudit({}, { onData: () => {} })
    expect(handle.subscription_id).toBe('auth-position-audit-1')
  })

  it('the counter is shared + monotonic across both streams', () => {
    const a = feed.subscribeOpen({}, {})
    const b = feed.subscribeAudit({}, {})
    expect(a.subscription_id).toBe('auth-positions-1')
    expect(b.subscription_id).toBe('auth-position-audit-2')
  })
})

describe('guard branches', () => {
  it('an update with no event (payload.event falsy) is ignored — onData not called', () => {
    const onData = vi.fn()
    feed.subscribeOpen({ subscription_id: 'sub-open' }, { onData })
    client._pushRaw('sub-open', { request_id: null, event: null })
    client._pushRaw('sub-open', { request_id: null })           // no event key at all
    client._pushRaw('sub-open', null)                            // whole payload falsy
    expect(onData).not.toHaveBeenCalled()
  })

  it('a client without on() constructs, and subscribe/unsubscribe still work', () => {
    const bareClient = makeFakeClient({ withOn: false })
    expect(typeof bareClient.on).toBe('undefined')
    const bareFeed = new CorkyPositionsFeed({ client: bareClient })

    const seen = []
    const handle = bareFeed.subscribeOpen({ subscription_id: 'sub-open' }, { onData: (d) => seen.push(d) })
    expect(bareClient.calls.some((c) => c[0] === 'subscribeAuthPositions')).toBe(true)

    bareClient._pushUpdate('sub-open', { type: 'auth_positions_update', subscription_id: 'sub-open', sequence: 1, positions: [{ source: 'current' }] })
    expect(seen).toHaveLength(1)
    expect(seen[0].current).toHaveLength(1)

    bareFeed.unsubscribe(handle)
    expect(bareClient._hasListeners('sub-open')).toBe(false)
    expect(bareClient.calls).toContainEqual(['unsubscribe', 'sub-open'])
  })
})
