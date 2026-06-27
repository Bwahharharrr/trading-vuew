// @vitest-environment jsdom
//
// CorkyFeed lifecycle teardown + reconnect-edge coverage.
//
// Complements corky-feed.test.js / feedfix-corky-feed.test.js / corky-feed-error-
// paths.test.js by pinning the dispose()/destroy() SPLIT, the per-instance
// _feedId subscription-id namespacing, and the reconnect re-issue timeout — the
// review-batch fixes that let MULTIPLE feeds share one client (one CorkyFeed per
// chart tab):
//   · _nextSubscriptionId() embeds the per-instance _feedId → two feeds over ONE
//     client mint NON-COLLIDING ids (a collision would cross-wire two tabs'
//     live_update fan-outs, since the client routes by subscription_id).
//   · dispose() unsubscribes EVERY _subs entry (unsubFanout + client.unsubscribe),
//     detaches the connection-lifecycle off-handles, clears _activeSubId, and does
//     NOT close the SHARED client (closing it would kill every other tab's stream).
//   · destroy() == dispose() + a single client.close() (sole-owner teardown).
//   · dispose() is idempotent / safe with no subs.
//   · _reissue() guards a hung reconnect re-subscribe with its own timeout
//     (the original subscribe's guard doesn't cover re-issues) → onError.
//   · _onClientOpen() skips a handle whose ORIGINAL subscribe() is still pending.
//   · _debugLive() logs each live tick when window.__CORKY_DEBUG is set.
//
// jsdom only so _debugLive's `typeof window !== 'undefined' && window.__CORKY_DEBUG`
// branch is reachable. A FAKE client (on/onSubscription/subscribeCandles/
// unsubscribe/close) drives everything; no network, no real socket.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'

// ── FakeClient ────────────────────────────────────────────────────────────────
// Minimal slice of the CorkyClient surface CorkyFeed touches. Records outbound
// commands, registers per-subscription fan-out + connection-lifecycle listeners,
// and lets the test push events / resolve the subscribe flow / fire 'open'.
class FakeClient {
    constructor() {
        this.sent = []                 // outbound command log
        this._subs = new Map()         // subscription_id → Set<cb> (fan-out)
        this._lc = new Map()           // lifecycle type → Set<cb>
        this._pending = new Map()      // subscription_id → subscribe() flow resolver
        this.neverResolve = false
        this.closeCount = 0            // count close() calls (destroy must call ONCE)
        this.unsubscribed = []         // ids passed to unsubscribe()
    }
    async listCandleStates() { return [] }
    subscribeCandles(opts) {
        this.sent.push({ type: 'subscribe_candles', ...opts })
        return new Promise((res) => { if (!this.neverResolve) this._pending.set(opts.subscription_id, res) })
    }
    unsubscribe(id) {
        this.unsubscribed.push(id)
        this.sent.push({ type: 'unsubscribe', subscription_id: id })
        return Promise.resolve({})
    }
    onSubscription(id, cb) {
        let s = this._subs.get(id); if (!s) { s = new Set(); this._subs.set(id, s) }
        s.add(cb); return () => s.delete(cb)
    }
    on(type, cb) {
        let s = this._lc.get(type); if (!s) { s = new Set(); this._lc.set(type, s) }
        s.add(cb); return () => s.delete(cb)
    }
    close() { this.closeCount += 1 }
    // ── drivers ──
    emit(id, event) {
        const s = this._subs.get(id); if (!s) return
        for (const cb of [...s]) cb({ request_id: null, event: { ...event, subscription_id: id } })
    }
    fire(type, payload) { const s = this._lc.get(type); if (s) for (const cb of [...s]) cb(payload) }
    completeHistory(id) {
        this.emit(id, { type: 'historical_complete' })
        const r = this._pending.get(id); if (r) { this._pending.delete(id); r({ type: 'historical_complete' }) }
    }
    // total live fan-out listeners across ALL subscriptions (must hit 0 on teardown)
    fanoutCount() { let n = 0; for (const s of this._subs.values()) n += s.size; return n }
    // total connection-lifecycle listeners (must hit 0 after dispose detaches them)
    lifecycleCount() { let n = 0; for (const s of this._lc.values()) n += s.size; return n }
    hasListeners(id) { return (this._subs.get(id) || new Set()).size > 0 }
}

function newDC() {
    return new DataCube(
        { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] },
        { scripts: false, validation: 'off' })
}
function chunk(rows, chunk_index = 0) {
    return { type: 'historical_chunk', chunk_index, timeframe: '1m', rows }
}
function candleRow(ts, close = 1) {
    return {
        timeframe: '1m',
        candle: { timestamp_ms: ts, open: '1', high: '1', low: '1', close: String(close), volume: '1' },
        indicators: {},
    }
}

let client, dc, feed
beforeEach(() => {
    client = new FakeClient()
    dc = newDC()
    feed = new CorkyFeed({ client, dataCube: dc })
})

// Prime a fully-loaded subscription (one valid candle) and return its handle.
async function primed(f = feed, c = client) {
    const p = f.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, {})
    const id = f._activeSubId
    c.emit(id, chunk([candleRow(1000)]))
    c.completeHistory(id)
    return p
}

// ─────────────────────────────────────────────────────────────────────────────
// _feedId / _nextSubscriptionId — two feeds over ONE client never collide
// ─────────────────────────────────────────────────────────────────────────────
describe('CorkyFeed._nextSubscriptionId — per-instance _feedId namespacing', () => {
    it('two feeds sharing one client get distinct _feedId and non-colliding ids', () => {
        // _feedId comes off a STATIC monotonic counter, so a second feed built over
        // the SAME client gets a different namespace — the multi-tab invariant.
        const feedB = new CorkyFeed({ client, dataCube: newDC() })
        expect(feedB._feedId).not.toBe(feed._feedId)

        // The id embeds the feed id: `corky-feed-<feedId>-sub-<n>`.
        const a1 = feed._nextSubscriptionId()
        const b1 = feedB._nextSubscriptionId()
        expect(a1).toBe(`corky-feed-${feed._feedId}-sub-1`)
        expect(b1).toBe(`corky-feed-${feedB._feedId}-sub-1`)
        expect(a1).not.toBe(b1) // distinct namespaces → no cross-wiring

        // Even at the SAME per-feed counter value the two feeds stay distinct.
        const a2 = feed._nextSubscriptionId()
        const b2 = feedB._nextSubscriptionId()
        expect(a2).toBe(`corky-feed-${feed._feedId}-sub-2`)
        expect(b2).toBe(`corky-feed-${feedB._feedId}-sub-2`)
        expect(new Set([a1, a2, b1, b2]).size).toBe(4) // all four unique
    })

    it('the counter is monotonic per feed (no reuse within one feed)', () => {
        const ids = [feed._nextSubscriptionId(), feed._nextSubscriptionId(), feed._nextSubscriptionId()]
        expect(ids).toEqual([
            `corky-feed-${feed._feedId}-sub-1`,
            `corky-feed-${feed._feedId}-sub-2`,
            `corky-feed-${feed._feedId}-sub-3`,
        ])
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// dispose() — release the feed WITHOUT closing the SHARED client
// ─────────────────────────────────────────────────────────────────────────────
describe('CorkyFeed.dispose — releases streams + listeners, keeps the client open', () => {
    it('unsubscribes every stream, detaches fan-out + lifecycle, clears _activeSubId, does NOT close', async () => {
        const handle = await primed()
        const id = handle.subscription_id

        // Pre-conditions: one live stream, its fan-out + two lifecycle listeners attached.
        expect(feed._subs.size).toBe(1)
        expect(feed._activeSubId).toBe(id)
        expect(client.hasListeners(id)).toBe(true)
        expect(client.lifecycleCount()).toBe(2) // 'open' + 'reconnect-exhausted' from ctor
        expect(feed._offClientEvents).toHaveLength(2)

        feed.dispose()

        // Every stream unsubscribed (gateway told to stop pushing live_update)…
        expect(client.unsubscribed).toContain(id)
        // …the per-sub fan-out listener detached (no orphaned routing)…
        expect(client.hasListeners(id)).toBe(false)
        expect(client.fanoutCount()).toBe(0)
        // …the _subs map emptied and _activeSubId cleared…
        expect(feed._subs.size).toBe(0)
        expect(feed._activeSubId).toBeNull()
        // …the connection-lifecycle off-handles fired + reset…
        expect(client.lifecycleCount()).toBe(0)
        expect(feed._offClientEvents).toEqual([])
        // …but the SHARED client is NOT closed (other tabs' streams survive).
        expect(client.closeCount).toBe(0)
    })

    it('a reconnect after dispose() does NOT resubscribe (lifecycle handlers detached)', async () => {
        client.fire('open')            // initial connect (must not resubscribe)
        await primed()
        feed.dispose()

        const before = client.sent.filter((s) => s.type === 'subscribe_candles').length
        client.fire('open')            // a later 'open' = reconnect — but we're disposed
        const after = client.sent.filter((s) => s.type === 'subscribe_candles').length
        expect(after).toBe(before)     // detached: no re-issue from a disposed feed
    })

    it('clears the active id when the active stream is still LOADING (never completed)', () => {
        // A still-in-flight subscribe registers _activeSubId before history lands;
        // dispose must clear it too (not only completed streams).
        feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, {})
        const id = feed._activeSubId
        expect(feed._subs.has(id)).toBe(true)

        feed.dispose()
        expect(feed._activeSubId).toBeNull()
        expect(feed._subs.size).toBe(0)
        expect(client.unsubscribed).toContain(id)
        expect(client.closeCount).toBe(0)
    })

    it('is idempotent / safe with no subscriptions', () => {
        // No subscribe() ever called: just the ctor's two lifecycle handlers exist.
        expect(feed._subs.size).toBe(0)
        expect(client.lifecycleCount()).toBe(2)

        expect(() => feed.dispose()).not.toThrow()
        expect(client.lifecycleCount()).toBe(0)
        expect(feed._offClientEvents).toEqual([])
        expect(client.unsubscribed).toHaveLength(0) // nothing to unsubscribe
        expect(client.closeCount).toBe(0)

        // A SECOND dispose() is a clean no-op (off-handles already cleared, no subs).
        expect(() => feed.dispose()).not.toThrow()
        expect(client.lifecycleCount()).toBe(0)
        expect(client.closeCount).toBe(0)
    })

    it('disposing one of two feeds on a shared client leaves the OTHER feed live', async () => {
        const feedB = new CorkyFeed({ client, dataCube: newDC() })
        const hA = await primed(feed, client)
        const hB = await primed(feedB, client)
        expect(hA.subscription_id).not.toBe(hB.subscription_id) // distinct namespaces

        feed.dispose() // tear down feed A only

        // A's stream gone; B's stream + its lifecycle listeners untouched.
        expect(client.unsubscribed).toContain(hA.subscription_id)
        expect(client.unsubscribed).not.toContain(hB.subscription_id)
        expect(feedB._subs.has(hB.subscription_id)).toBe(true)
        expect(feedB._activeSubId).toBe(hB.subscription_id)
        expect(client.closeCount).toBe(0) // the shared socket stays open for B
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// destroy() == dispose() + a single client.close()
// ─────────────────────────────────────────────────────────────────────────────
describe('CorkyFeed.destroy — dispose() behaviour PLUS closing the client', () => {
    it('performs the full dispose teardown AND closes the client exactly once', async () => {
        const handle = await primed()
        const id = handle.subscription_id

        feed.destroy()

        // dispose() behaviour …
        expect(client.unsubscribed).toContain(id)
        expect(client.hasListeners(id)).toBe(false)
        expect(feed._subs.size).toBe(0)
        expect(feed._activeSubId).toBeNull()
        expect(client.lifecycleCount()).toBe(0)
        expect(feed._offClientEvents).toEqual([])
        // … PLUS the client is closed (sole-owner teardown), exactly once.
        expect(client.closeCount).toBe(1)
    })

    it('tolerates a client without a close() method (typeof guard)', () => {
        // The destroy() close is gated on `typeof this.client.close === 'function'`.
        const noClose = {
            on() { return () => {} },
            onSubscription() { return () => {} },
            async unsubscribe() {},
            // no close()
        }
        const f = new CorkyFeed({ client: noClose, dataCube: newDC() })
        expect(() => f.destroy()).not.toThrow()
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// _onClientOpen — skip a handle whose ORIGINAL subscribe() is still pending
// ─────────────────────────────────────────────────────────────────────────────
describe('CorkyFeed reconnect — _onClientOpen skips a still-pending subscribe', () => {
    it('does NOT re-issue a handle whose first subscribe() is still awaiting history', () => {
        client.fire('open') // initial connect → _everOpened = true
        // Start a subscribe but DON'T complete history → subscribePending stays true.
        feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, {})
        const id = feed._activeSubId
        const before = client.sent.filter((s) => s.type === 'subscribe_candles').length

        client.fire('open') // reconnect while the original subscribe is in-flight
        const after = client.sent.filter((s) => s.type === 'subscribe_candles').length
        // The pending handle's OWN flow handles its failure — _onClientOpen skips it
        // (the `if (handle.subscribePending) continue` guard).
        expect(after).toBe(before)
        // Sanity: a COMPLETED stream on the same feed WOULD have re-issued.
        client.completeHistory(id)
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// _reissue — a hung reconnect re-subscribe is timed out → onError
// ─────────────────────────────────────────────────────────────────────────────
describe('CorkyFeed reconnect — _reissue guards a hung re-subscribe with its own timeout', () => {
    it('times out a re-issue that never resolves and reports subscribe_timeout via onError', async () => {
        vi.useFakeTimers()
        try {
            const errs = []
            // Complete the FIRST subscribe so the handle is eligible for re-issue,
            // then make every subsequent subscribeCandles hang (the re-issue).
            const p = feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' },
                { onError: (e) => errs.push(e) })
            const id = feed._activeSubId
            client.emit(id, chunk([candleRow(1000)]))
            client.completeHistory(id)
            await p

            client.fire('open')          // initial 'open' bookkeeping (no resubscribe yet)
            client.neverResolve = true   // the re-issue's flow will hang
            client.fire('open')          // reconnect → _reissue(handle) → guarded race

            // The re-issue re-sent subscribe_candles and reset history_complete.
            expect(client.sent.filter((s) => s.type === 'subscribe_candles').length).toBe(2)

            // Drive the guard timeout (default subscribeTimeoutMs = 30000).
            await vi.advanceTimersByTimeAsync(30000)

            expect(errs).toHaveLength(1)
            expect(errs[0]).toMatchObject({ code: 'subscribe_timeout', retryable: true })
            expect(errs[0].message).toMatch(/reconnect re-subscribe timed out/)
        } finally {
            vi.useRealTimers()
        }
    })

    it('with subscribeTimeoutMs=0 a re-issue is NOT guarded by a timeout', async () => {
        // 0 disables the guard: _reissue takes the bare-flow branch (no timer).
        const f = new CorkyFeed({ client, dataCube: dc, subscribeTimeoutMs: 0 })
        const errs = []
        const p = f.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' },
            { onError: (e) => errs.push(e) })
        const id = f._activeSubId
        client.emit(id, chunk([candleRow(1000)]))
        client.completeHistory(id)
        await p

        client.fire('open')          // initial
        client.neverResolve = true
        const sentBefore = client.sent.filter((s) => s.type === 'subscribe_candles').length
        client.fire('open')          // reconnect → _reissue with NO guard

        // Re-issued, but no timeout fires (no error) — the hung flow just stays open.
        expect(client.sent.filter((s) => s.type === 'subscribe_candles').length).toBe(sentBefore + 1)
        expect(errs).toHaveLength(0)
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// _debugLive — opt-in per-tick console logging (window.__CORKY_DEBUG)
// ─────────────────────────────────────────────────────────────────────────────
describe('CorkyFeed._debugLive — logs each live tick when window.__CORKY_DEBUG is set', () => {
    it('logs the seq/ts/close/applied summary for an applied tick when the flag is on', async () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
        try {
            window.__CORKY_DEBUG = true
            const handle = await primed()
            const id = handle.subscription_id

            client.emit(id, {
                type: 'live_update', sequence: 7,
                row: { timeframe: '1m',
                    candle: { timestamp_ms: 2000, open: '1', high: '1', low: '1', close: '9', volume: '1' },
                    indicators: {} },
            })

            // The diagnostic fired with the '[corky live]' tag and the tick's fields.
            const call = spy.mock.calls.find((c) => c[0] === '[corky live]')
            expect(call).toBeTruthy()
            expect(call[1]).toMatchObject({ seq: 7, ts: 2000, close: '9', applied: true })
            // applied tick → the lastSeq for this sub is now its sequence.
            expect(call[1].lastSeq).toBe(7)
        } finally {
            delete window.__CORKY_DEBUG
            spy.mockRestore()
        }
    })

    it('does NOT log when window.__CORKY_DEBUG is unset (zero-cost default)', async () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
        try {
            delete window.__CORKY_DEBUG
            const handle = await primed()
            client.emit(handle.subscription_id, {
                type: 'live_update', sequence: 1,
                row: { timeframe: '1m',
                    candle: { timestamp_ms: 2000, open: '1', high: '1', low: '1', close: '9', volume: '1' },
                    indicators: {} },
            })
            expect(spy.mock.calls.some((c) => c[0] === '[corky live]')).toBe(false)
        } finally {
            spy.mockRestore()
        }
    })
})
