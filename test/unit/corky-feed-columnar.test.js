// CorkyFeed columnar / summary subscribe path.
//
// Pins the upgraded subscribe_candles request (ack_mode + historical_format
// default to the optimized values) and that the feed handles BOTH new response
// shapes: subscription_accepted_summary → onStatus 'accepted', and
// historical_chunk_columnar → reconstructed rows → DataCube (identical to the
// row-format path). Real headless DataCube + fake CorkyClient; deterministic.
import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'

class FakeClient {
    constructor() { this.sent = []; this._subs = new Map(); this._pending = new Map() }
    async listCandleStates() { return [] }
    subscribeCandles(opts) {
        this.sent.push({ type: 'subscribe_candles', ...opts })
        return new Promise((res) => this._pending.set(opts.subscription_id, res))
    }
    unsubscribe(id) { this.sent.push({ type: 'unsubscribe', subscription_id: id }); return Promise.resolve({}) }
    onSubscription(id, cb) {
        let s = this._subs.get(id); if (!s) { s = new Set(); this._subs.set(id, s) }
        s.add(cb); return () => s.delete(cb)
    }
    close() {}
    emit(id, event) {
        const s = this._subs.get(id); if (!s) return
        for (const cb of [...s]) cb({ request_id: null, event: { ...event, subscription_id: id } })
    }
    completeHistory(id) {
        this.emit(id, { type: 'historical_complete' })
        const r = this._pending.get(id); if (r) { this._pending.delete(id); r({ type: 'historical_complete' }) }
    }
}

function newDC() {
    return new DataCube(
        { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] },
        { scripts: false, validation: 'off' })
}

// A 2-row columnar history chunk (1m) with a MACD indicator.
function columnarChunk() {
    return {
        type: 'historical_chunk_columnar', chunk_index: 0, timeframe: '1m',
        columns: {
            timestamp_ms: [1000, 2000],
            open: ['10', '11'], high: ['12', '13'], low: ['9', '10'],
            close: ['11', '12'], volume: ['100', '200'],
            status: ['confirmed', 'confirmed'],
            indicators: { 'MACD(12,26,9)': { histogram: ['0.5', '0.6'] } },
        },
    }
}

let client, dc, feed
beforeEach(() => { client = new FakeClient(); dc = newDC(); feed = new CorkyFeed({ client, dataCube: dc }) })

describe('subscribe request — optimized fields by default', () => {
    it('sends ack_mode:summary + historical_format:columnar by default', () => {
        feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' })
        const sub = client.sent.find((c) => c.type === 'subscribe_candles')
        expect(sub.ack_mode).toBe('summary')
        expect(sub.historical_format).toBe('columnar')
    })

    it('a caller can override both fields', () => {
        feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m', ack_mode: 'full', historical_format: 'rows' })
        const sub = client.sent.find((c) => c.type === 'subscribe_candles')
        expect(sub.ack_mode).toBe('full')
        expect(sub.historical_format).toBe('rows')
    })

    it('re-issues the same optimized fields on reconnect', () => {
        feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' })
        const id = feed._activeSubId
        const handle = feed._subs.get(id)
        expect(handle.subscribeArgs.ack_mode).toBe('summary')
        expect(handle.subscribeArgs.historical_format).toBe('columnar')
    })
})

describe('feed handles the new response shapes', () => {
    it('subscription_accepted_summary fires onStatus { phase: accepted }', async () => {
        const phases = []
        const p = feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' },
            { onStatus: (s) => phases.push(s.phase) })
        const id = feed._activeSubId
        client.emit(id, { type: 'subscription_accepted_summary', runtime_id: 'r', state_id: 'x', venue: 'V', symbol: 'S', timeframe: '1m', range: { type: 'latest', limit: 400 } })
        client.completeHistory(id)
        await p
        expect(phases).toContain('accepted')
        expect(phases).toContain('history-complete')
    })

    it('historical_chunk_columnar lands reconstructed candles in the DataCube', async () => {
        const p = feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' })
        const id = feed._activeSubId
        client.emit(id, columnarChunk())
        client.completeHistory(id)
        await p
        // Both candles reconstructed from the columns reached the chart.
        expect(dc.data.chart.data).toHaveLength(2)
        expect(dc.data.chart.data[0][0]).toBe(1000) // first ts
        expect(dc.data.chart.data[1][4]).toBe(12)   // 2nd close (decimal -> number)
        // The MACD indicator was reconstructed from the columnar fields into the
        // feed's FULL built structure (candles-only is pushed to the DC; indicator
        // overlays live in handle.built until toggled on).
        const handle = feed._subs.get(id)
        const hasMacd = handle.built.offchart.some((o) => o.data && o.data.length === 2)
        expect(hasMacd).toBe(true)
    })

    it('a columnar history chunk after completion is ignored (no late growth)', async () => {
        const p = feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' })
        const id = feed._activeSubId
        client.emit(id, columnarChunk())
        client.completeHistory(id)
        await p
        const handle = feed._subs.get(id)
        const before = handle.chunks.length
        client.emit(id, { ...columnarChunk(), chunk_index: 99 })
        expect(handle.chunks.length).toBe(before) // late chunk dropped
    })
})
