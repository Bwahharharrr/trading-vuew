// Unit tests for CorkyFeed (Corky → DataCube integration driver).
//
// Drives a REAL headless DataCube through a FAKE CorkyClient. The fake exposes
// the slice of the client surface CorkyFeed touches (listCandleStates /
// subscribeCandles / unsubscribe / onSubscription / close) and lets the test
// replay the canonical fixtures from test/fixtures/corky/ in protocol order:
//   candle_states  → discover()
//   historical_chunk + historical_complete → history pushed into the DataCube
//   live_update    → in-place append + redraw signal (+ dup/out-of-order drop)

import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'
import * as fx from '../fixtures/corky/index.js'

// ── FakeClient ──────────────────────────────────────────────────────────────
// Records subscribeCandles calls, registers per-subscription listeners, and
// lets the test push gateway EVENTS (not envelopes) into a subscription.
class FakeClient {
    constructor() {
        this.sent = []                 // outbound command log
        this._subListeners = new Map() // subscription_id → Set<cb>
        this._states = fx.candleStatesEvent.event.states
        this.closed = false
    }

    // discover()
    async listCandleStates(venue) {
        this.sent.push({ type: 'list_candle_states', venue })
        return this._states
    }

    // subscribe() entry — resolves immediately (history arrives via fan-out).
    async subscribeCandles(opts) {
        this.sent.push({ type: 'subscribe_candles', ...opts })
        this._lastSubId = opts.subscription_id
        return { type: 'historical_complete' }
    }

    async unsubscribe(subscription_id) {
        this.sent.push({ type: 'unsubscribe', subscription_id })
        return { type: 'control_ack' }
    }

    onSubscription(subscription_id, cb) {
        let set = this._subListeners.get(subscription_id)
        if (!set) { set = new Set(); this._subListeners.set(subscription_id, set) }
        set.add(cb)
        return () => set.delete(cb)
    }

    close() { this.closed = true }

    // ── test driver ──
    // Push a gateway EVENT to a subscription's listeners, re-tagged with the
    // given subscription_id (the feed mints its own id, so fixtures get retagged).
    emit(subscription_id, event) {
        const set = this._subListeners.get(subscription_id)
        if (!set) return
        const payload = { request_id: null, event: { ...event, subscription_id } }
        for (const cb of [...set]) cb(payload)
    }
}

function emptyData() {
    return { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] }
}

let client, dc, feed
beforeEach(() => {
    client = new FakeClient()
    dc = new DataCube(emptyData())
    feed = new CorkyFeed({ client, dataCube: dc })
})

describe('CorkyFeed.discover', () => {
    it('returns the candle_states catalog from the client', async () => {
        const states = await feed.discover('BITFINEX')
        expect(Array.isArray(states)).toBe(true)
        expect(states).toBe(fx.candleStatesEvent.event.states)
        // venue forwarded to the client
        expect(client.sent[0]).toEqual({ type: 'list_candle_states', venue: 'BITFINEX' })
        // the catalog the UI renders: state + its indicator descriptor
        expect(states[0].symbol).toBe('tBTCUSD')
        expect(states[0].indicators[0].kind).toBe('sma')
    })
})

describe('CorkyFeed.subscribe — history', () => {
    it('pushes assembled candles + the SMA overlay onto the right pane', async () => {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        const sid = handle.subscription_id

        // Replay history: one chunk, then complete.
        client.emit(sid, fx.historicalChunkEvent.event)
        client.emit(sid, { type: 'historical_complete' })

        // Candles landed in the DataCube.
        const ohlcv = dc.data.chart.data
        expect(ohlcv).toHaveLength(1)
        expect(ohlcv[0][0]).toBe(1779464940000) // ts
        expect(ohlcv[0][4]).toBe(77871)         // close
        expect(dc.data.chart.tf).toBe('1m')     // single-tf tag

        // SMA overlay built on the PRICE (onchart) pane.
        expect(dc.data.onchart).toHaveLength(1)
        const sma = dc.data.onchart[0]
        expect(sma.settings.corkyKind).toBe('sma')
        expect(sma.settings.corkyKey).toBe('sma:20.sma')
        expect(sma.data).toEqual([[1779464940000, 77865.25]])
        // it has a real overlay id from the DataCube
        expect(sma.id).toMatch(/^onchart\./)
        // nothing wrongly placed off-chart
        expect(dc.data.offchart).toHaveLength(0)
    })
})

describe('CorkyFeed.subscribe — live', () => {
    async function primed() {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        client.emit(handle.subscription_id, fx.historicalChunkEvent.event)
        client.emit(handle.subscription_id, { type: 'historical_complete' })
        return handle
    }

    it('appends a live candle in place and signals a redraw (invalidate)', async () => {
        const handle = await primed()
        const rev0 = dc.cd.revision()

        client.emit(handle.subscription_id, fx.liveUpdateEvent.event)

        const ohlcv = dc.data.chart.data
        expect(ohlcv).toHaveLength(2) // appended, not replaced
        const live = ohlcv[ohlcv.length - 1]
        expect(live[0]).toBe(1779465000000) // new ts
        expect(live[4]).toBe(77890)         // new close

        // SMA overlay extended with the live point.
        expect(dc.data.onchart[0].data).toEqual([
            [1779464940000, 77865.25],
            [1779465000000, 77866.2],
        ])

        // redraw was signalled (store revision bumped).
        expect(dc.cd.revision()).toBeGreaterThan(rev0)
    })

    it('ignores a duplicate / out-of-order sequence (no append, no redraw)', async () => {
        const handle = await primed()

        // Apply the live update once (sequence 42).
        client.emit(handle.subscription_id, fx.liveUpdateEvent.event)
        expect(dc.data.chart.data).toHaveLength(2)
        const revAfterFirst = dc.cd.revision()

        // Replay the SAME event (sequence 42 ≤ last 42) → dropped.
        client.emit(handle.subscription_id, fx.liveUpdateEvent.event)
        expect(dc.data.chart.data).toHaveLength(2)        // no second append
        expect(dc.cd.revision()).toBe(revAfterFirst)      // no extra redraw

        // An explicitly older sequence is also dropped.
        const stale = { ...fx.liveUpdateEvent.event, sequence: 1 }
        client.emit(handle.subscription_id, stale)
        expect(dc.data.chart.data).toHaveLength(2)
        expect(dc.cd.revision()).toBe(revAfterFirst)
    })
})

describe('CorkyFeed.unsubscribe / destroy', () => {
    it('stops routing and sends unsubscribe; destroy closes the client', async () => {
        const handle = await feed.subscribe({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m',
        })
        client.emit(handle.subscription_id, fx.historicalChunkEvent.event)
        client.emit(handle.subscription_id, { type: 'historical_complete' })

        await feed.unsubscribe(handle)
        expect(client.sent.some(c => c.type === 'unsubscribe'
            && c.subscription_id === handle.subscription_id)).toBe(true)

        // After unsubscribe, further live events are no longer routed.
        client.emit(handle.subscription_id, fx.liveUpdateEvent.event)
        expect(dc.data.chart.data).toHaveLength(1) // unchanged

        feed.destroy()
        expect(client.closed).toBe(true)
    })
})

describe('CorkyFeed.subscribe timeout / failure cleanup', () => {
    it('rejects with subscribe_timeout and cleans up when the gateway never completes', async () => {
        // A client whose subscribeCandles never settles (silent gateway/runtime hang).
        const hangClient = {
            _subs: new Map(),
            async listCandleStates() { return [] },
            subscribeCandles() { return new Promise(() => {}) }, // never resolves
            async unsubscribe() {},
            close() {},
            onSubscription(id, cb) {
                let s = this._subs.get(id); if (!s) { s = new Set(); this._subs.set(id, s) }
                s.add(cb); return () => s.delete(cb)
            },
        }
        const dc2 = new DataCube({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
        const feed2 = new CorkyFeed({ client: hangClient, dataCube: dc2, subscribeTimeoutMs: 40 })

        await expect(
            feed2.subscribe({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' })
        ).rejects.toMatchObject({ code: 'subscribe_timeout', retryable: true })

        // No leaked subscription handle / fan-out listener after the timeout.
        expect(feed2._subs.size).toBe(0)
        const onlySub = [...hangClient._subs.values()][0]
        expect(onlySub ? onlySub.size : 0).toBe(0) // fan-out listener detached
    })
})
