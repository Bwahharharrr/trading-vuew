// CorkyFeed error & live-guard paths.
//
// Complements the happy-path coverage in corky-feed.test.js / feedfix-corky-feed.test.js
// by pinning the ERROR and LIVE-GUARD branches of src/helpers/feed/corky-feed.js:
//   · a mid-stream / pre-history 'error' event → subscribe()'s onError (no DC mutation)
//   · _finishHistory build-failure recovery (onError, history_complete stays false,
//     no partial push, 'history-complete' NOT emitted; a fresh subscribe retries)
//   · _applyLive guards (before history, superseded sub, applyLiveUpdate throw)
//   · onStatus phase sequencing (accepted / history+chunk_index / live-once)
//   · the late-historical_chunk unbounded-growth guard
//   · unsubscribe forms (string id, active-sub clear, undefined / {} / unknown id)
//
// Drives a REAL headless DataCube through a FAKE CorkyClient whose subscribeCandles
// flow is resolved by an explicit completeHistory() driver (mirroring the canonical
// fake in feedfix-corky-feed.test.js). Deterministic: no network, no real timers,
// no randomness.

import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'

// ── FakeClient ───────────────────────────────────────────────────────────────
// Records outbound commands; registers per-subscription fan-out listeners; lets
// the test push gateway EVENTS into a subscription and resolve the subscribe flow.
class FakeClient {
    constructor() {
        this.sent = []                 // outbound command log
        this._subs = new Map()         // subscription_id → Set<cb>
        this._pending = new Map()      // subscription_id → flow resolver
        this.neverResolve = false
        this.closed = false
    }
    async listCandleStates() { return [] }
    subscribeCandles(opts) {
        this.sent.push({ type: 'subscribe_candles', ...opts })
        return new Promise((res) => {
            if (!this.neverResolve) this._pending.set(opts.subscription_id, res)
        })
    }
    unsubscribe(id) {
        this.sent.push({ type: 'unsubscribe', subscription_id: id })
        return Promise.resolve({})
    }
    onSubscription(id, cb) {
        let s = this._subs.get(id)
        if (!s) { s = new Set(); this._subs.set(id, s) }
        s.add(cb)
        return () => s.delete(cb)
    }
    close() { this.closed = true }

    // ── drivers ──
    // Push a gateway EVENT (re-tagged with the subscription_id) to its listeners.
    emit(id, event) {
        const s = this._subs.get(id)
        if (!s) return
        for (const cb of [...s]) cb({ request_id: null, event: { ...event, subscription_id: id } })
    }
    // Deliver historical_complete AND resolve the awaiting subscribe() flow.
    completeHistory(id) {
        this.emit(id, { type: 'historical_complete' })
        const r = this._pending.get(id)
        if (r) { this._pending.delete(id); r({ type: 'historical_complete' }) }
    }
    hasListeners(id) { return (this._subs.get(id) || new Set()).size > 0 }
}

function newDC() {
    return new DataCube(
        { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] },
        { scripts: false, validation: 'off' })
}

// A simple one-candle history chunk (no indicators → trivial, valid build).
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
function liveRow(ts, close = 1) {
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
async function primed(opts = {}) {
    const handle = await (async () => {
        const p = feed.subscribe(
            { venue: 'V', symbol: 'S', timeframe: '1m', ...opts },
            opts.handlers || {})
        const id = feed._activeSubId
        client.emit(id, chunk([candleRow(1000)]))
        client.completeHistory(id)
        return p
    })()
    return handle
}

describe('CorkyFeed — error events route to onError without mutating the DataCube', () => {
    it('case 1: a mid-stream error (after history) reaches onError and leaves chart.data intact', async () => {
        let errSeen = null
        const handle = await primed({ handlers: { onError: (e) => { errSeen = e } } })
        const id = handle.subscription_id
        expect(dc.data.chart.data).toHaveLength(1) // history landed

        const errEvent = { type: 'error', code: 'runtime_control_rejected', message: 'rejected by runtime' }
        client.emit(id, errEvent)

        // onError received the SAME error event verbatim (re-tagged with the sub id).
        expect(errSeen).toMatchObject({
            type: 'error', code: 'runtime_control_rejected',
            message: 'rejected by runtime', subscription_id: id,
        })
        // The error event must not touch the loaded candles.
        expect(dc.data.chart.data).toHaveLength(1)
        expect(dc.data.chart.data[0][0]).toBe(1000)
    })

    it('case 2: an error arriving BEFORE history (still loading) is still delivered to onError', async () => {
        let errSeen = null
        feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, { onError: (e) => { errSeen = e } })
        const id = feed._activeSubId

        // No chunk / no complete yet — the subscribe flow is still in-flight.
        client.emit(id, { type: 'error', code: 'state_not_found', message: 'no maintained state' })

        expect(errSeen).toMatchObject({ type: 'error', code: 'state_not_found', subscription_id: id })
        // Nothing was built, so the DataCube is untouched.
        expect(dc.data.chart.data).toHaveLength(0)
        expect(dc.data.onchart).toHaveLength(0)
    })
})

describe('CorkyFeed — _finishHistory build failure recovery', () => {
    // A `views` value whose property access throws makes buildChartData throw inside
    // _finishHistory (resolveView reads `v.layers` for the matching instance key).
    const evilViews = () => ({ 'sma:20': new Proxy({}, { get() { throw new Error('build boom') } }) })
    const indicatorRow = (ts) => ({
        timeframe: '1m',
        candle: { timestamp_ms: ts, open: '1', high: '1', low: '1', close: '1', volume: '1' },
        indicators: { 'sma:20': { sma: '1' } },
    })

    it('case 3: a build failure calls onError(err), keeps history_complete=false, pushes no partial', async () => {
        let errSeen = null
        const p = feed.subscribe(
            { venue: 'V', symbol: 'S', timeframe: '1m', views: evilViews() },
            { onError: (e) => { errSeen = e } })
        const id = feed._activeSubId
        client.emit(id, chunk([indicatorRow(1000)]))
        client.completeHistory(id)
        const handle = await p

        // The build threw → surfaced through onError…
        expect(errSeen).toBeInstanceOf(Error)
        expect(errSeen.message).toBe('build boom')
        // …history_complete stays false so a resubscribe can retry cleanly…
        expect(handle.history_complete).toBe(false)
        // …and NO partial data was pushed (the throw precedes any dc.set).
        expect(dc.data.chart.data).toHaveLength(0)
        expect(handle.built).toBeNull()
    })

    it('case 4: after a build failure, a fresh valid subscribe rebuilds; no history-complete on a failed build', async () => {
        const phases1 = []
        const p1 = feed.subscribe(
            { venue: 'V', symbol: 'S', timeframe: '1m', views: evilViews() },
            { onStatus: (s) => phases1.push(s.phase), onError: () => {} })
        const id1 = feed._activeSubId
        client.emit(id1, chunk([indicatorRow(1000)]))
        client.completeHistory(id1)
        await p1

        // _finishHistory returned false → 'history-complete' must NOT have been emitted
        // (the 'history' chunk phase still is).
        expect(phases1).not.toContain('history-complete')
        expect(phases1).toContain('history')

        // A fresh, valid subscribe (no evil views) rebuilds successfully. It also
        // supersedes the still-incomplete prior handle.
        const phases2 = []
        const p2 = feed.subscribe(
            { venue: 'V', symbol: 'S', timeframe: '1m' },
            { onStatus: (s) => phases2.push(s.phase) })
        const id2 = feed._activeSubId
        expect(id2).not.toBe(id1)
        client.emit(id2, chunk([candleRow(2000, 50)]))
        client.completeHistory(id2)
        const h2 = await p2

        expect(h2.history_complete).toBe(true)
        expect(dc.data.chart.data).toHaveLength(1)
        expect(dc.data.chart.data[0][0]).toBe(2000)
        expect(phases2).toContain('history-complete') // genuine build → emitted
    })
})

describe('CorkyFeed — _applyLive guards', () => {
    it('case 5: a live_update BEFORE historical_complete is ignored (liveView null), no error', async () => {
        let errSeen = null
        feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, { onError: (e) => { errSeen = e } })
        const id = feed._activeSubId

        // No history yet → handle.liveView is null → the tick is dropped.
        client.emit(id, { type: 'live_update', sequence: 1, row: liveRow(2000, 9) })

        expect(dc.data.chart.data).toHaveLength(0)
        expect(errSeen).toBeNull()
    })

    it('case 6: a live tick on a SUPERSEDED subscription does not mutate the active DataCube', async () => {
        // Sub A loads fully (so its handle survives the supersede sweep — that sweep
        // only drops still-loading handles), then sub B takes over _activeSubId.
        const hA = await primed()
        const idA = hA.subscription_id
        expect(dc.data.chart.data).toHaveLength(1)

        // A newer subscribe makes B the active sub; A is now superseded.
        feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, {})
        const idB = feed._activeSubId
        expect(idB).not.toBe(idA)
        expect(feed._activeSubId).toBe(idB)

        // A late live tick on the SUPERSEDED A must not mutate the (B-owned) DataCube.
        client.emit(idA, { type: 'live_update', sequence: 99, row: liveRow(9999, 42) })
        expect(dc.data.chart.data).toHaveLength(1)
        expect(dc.data.chart.data[0][0]).toBe(1000) // still A's history candle, unappended
    })

    it('case 7: when applyLiveUpdate throws, _applyLive reports onError and does NOT touchData', async () => {
        let errSeen = null
        const handle = await primed({ handlers: { onError: (e) => { errSeen = e } } })
        const id = handle.subscription_id

        // Corrupt the live target so applyLiveUpdate throws when it dereferences
        // chartDataObj.chart.data inside upsertByTs. lastSeqBySub is read first
        // (undefined → passes the stale guard), then the candle deref throws.
        handle.liveView.chart = null

        const revBefore = dc.cd.revision()
        client.emit(id, { type: 'live_update', sequence: 1, row: liveRow(2000, 9) })

        expect(errSeen).toBeInstanceOf(Error)
        // No redraw was signalled (touchData not called) — the store revision is unchanged.
        expect(dc.cd.revision()).toBe(revBefore)
    })

    it('case 8: a normal live tick after history touchData()s once and emits onStatus phase:live once', async () => {
        const phases = []
        const handle = await primed({ handlers: { onStatus: (s) => phases.push(s.phase) } })
        const id = handle.subscription_id

        const revBefore = dc.cd.revision()
        client.emit(id, { type: 'live_update', sequence: 1, row: liveRow(2000, 9) })

        // Applied → appended, redraw signalled exactly once (revision bumped by one tick).
        expect(dc.data.chart.data).toHaveLength(2)
        expect(dc.data.chart.data[1][0]).toBe(2000)
        expect(dc.cd.revision()).toBeGreaterThan(revBefore)
        // phase 'live' announced exactly once.
        expect(phases.filter((p) => p === 'live')).toHaveLength(1)
    })
})

describe('CorkyFeed — onStatus phases & late-chunk guard', () => {
    it('case 9: subscription_accepted → phase:accepted; each historical_chunk → phase:history with its chunk_index', async () => {
        const statuses = []
        const p = feed.subscribe(
            { venue: 'V', symbol: 'S', timeframe: '1m' },
            { onStatus: (s) => statuses.push(s) })
        const id = feed._activeSubId

        client.emit(id, { type: 'subscription_accepted' })
        client.emit(id, chunk([candleRow(1000)], 0))
        client.emit(id, chunk([candleRow(2000)], 1))
        client.completeHistory(id)
        await p

        const accepted = statuses.find((s) => s.phase === 'accepted')
        expect(accepted).toMatchObject({ phase: 'accepted', subscription_id: id })

        const historyPhases = statuses.filter((s) => s.phase === 'history')
        expect(historyPhases).toHaveLength(2)
        expect(historyPhases.map((s) => s.chunk_index)).toEqual([0, 1])
        expect(historyPhases.every((s) => s.subscription_id === id)).toBe(true)
    })

    it('case 10: a historical_chunk AFTER historical_complete is ignored (no growth, no extra status)', async () => {
        const statuses = []
        const handle = await primed({ handlers: { onStatus: (s) => statuses.push(s) } })
        const id = handle.subscription_id

        expect(handle.history_complete).toBe(true)
        const chunksLenAfterComplete = handle.chunks.length // released to 0 on build
        const historyStatusesBefore = statuses.filter((s) => s.phase === 'history').length

        // A late chunk must be dropped (the unbounded-growth guard) — no consumer.
        client.emit(id, chunk([candleRow(3000)], 5))

        expect(handle.chunks.length).toBe(chunksLenAfterComplete) // not grown
        expect(handle.chunks.length).toBe(0)
        expect(statuses.filter((s) => s.phase === 'history').length).toBe(historyStatusesBefore) // no extra status
    })
})

describe('CorkyFeed — unsubscribe forms', () => {
    it('case 11: unsubscribe by raw STRING id tears down the same handle and clears an active _activeSubId', async () => {
        const handle = await primed()
        const id = handle.subscription_id
        expect(client.hasListeners(id)).toBe(true)
        expect(feed._subs.has(id)).toBe(true)
        expect(feed._activeSubId).toBe(id)

        await feed.unsubscribe(id) // raw string, NOT the handle object

        // The same handle was torn down: fan-out detached, _subs entry gone…
        expect(client.hasListeners(id)).toBe(false)
        expect(feed._subs.has(id)).toBe(false)
        // …the gateway received an unsubscribe for that id…
        expect(client.sent.some((c) => c.type === 'unsubscribe' && c.subscription_id === id)).toBe(true)
        // …and unsubscribing the ACTIVE sub clears _activeSubId.
        expect(feed._activeSubId).toBeNull()
    })

    it('case 12: unsubscribe(undefined) and unsubscribe({}) are no-ops; an unknown id still forwards to the client', async () => {
        // No-op forms: no command sent, no throw.
        await expect(feed.unsubscribe(undefined)).resolves.toBeUndefined()
        await expect(feed.unsubscribe({})).resolves.toBeUndefined()
        expect(client.sent.some((c) => c.type === 'unsubscribe')).toBe(false)

        // An unknown id (not in _subs) still forwards client.unsubscribe(id) without throwing.
        await expect(feed.unsubscribe('no-such-sub')).resolves.toBeUndefined()
        expect(client.sent.some((c) => c.type === 'unsubscribe' && c.subscription_id === 'no-such-sub')).toBe(true)
    })
})
