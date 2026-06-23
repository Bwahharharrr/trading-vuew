// Unit tests for CorkySearchFeed — orchestration over a FAKE CorkyClient that
// records search/cancel sends and lets the test emit search_* events on the
// type channel (search routes by search_id, not request correlation).

import { describe, it, expect, beforeEach } from 'vitest'
import { CorkySearchFeed } from '../../src/helpers/feed/corky-search-feed.js'

function makeFakeClient() {
    const listeners = new Map()    // type → Set(cb)
    const client = {
        calls: [],
        searchCandles(query) { this.calls.push(['searchCandles', query]); return 'req-1' },
        cancelSearch(search_id) { this.calls.push(['cancelSearch', search_id]); return 'req-2' },
        on(type, cb) {
            if (!listeners.has(type)) listeners.set(type, new Set())
            listeners.get(type).add(cb)
            return () => listeners.get(type).delete(cb)
        },
        // test driver: emit an event envelope on its type channel
        _emit(event) {
            const set = listeners.get(event.type)
            if (set) for (const cb of set) cb({ request_id: null, event })
        },
        _emitRaw(type, payload) {
            const set = listeners.get(type)
            if (set) for (const cb of set) cb(payload)
        },
    }
    return client
}

function matchEvent(search_id, sequence, overrides = {}) {
    return {
        type: 'search_match', search_id, sequence,
        result: {
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h',
            timestamp_ms: 1781953200000 + sequence * 3600000,
            candle: { timestamp_ms: 0, open: '1', high: '1', low: '1', close: String(63000 + sequence), volume: '1' },
            indicators: {}, observations: [], side: 'bull',
            crup_context: null,
            chart_window: { timeframe: '1h', start_ms: 1, end_ms: 2, before_bars: 2, after_bars: 2 },
            ...overrides,
        },
    }
}

let client, feed
beforeEach(() => {
    client = makeFakeClient()
    feed = new CorkySearchFeed({ client })
})

describe('startSearch + routing by search_id', () => {
    it('sends search_candles and accumulates matches through to complete', () => {
        const seen = { accepted: 0, progress: 0, matches: [], complete: null }
        const q = { search_id: 'S1' }
        feed.startSearch(q, {
            onAccepted: () => { seen.accepted++ },
            onProgress: (p) => { seen.progress++; seen.lastProgress = p },
            onMatch: (row) => { seen.matches.push(row) },
            onComplete: (s) => { seen.complete = s },
        })
        expect(client.calls[0]).toEqual(['searchCandles', q])

        client._emit({ type: 'search_accepted', search_id: 'S1' })
        client._emit({ type: 'search_progress', search_id: 'S1', phase: 'loading', current: 1, total: 1, message: 'x' })
        client._emit(matchEvent('S1', 1))
        client._emit(matchEvent('S1', 2))
        client._emit({ type: 'search_complete', search_id: 'S1', matches: 2, scanned_rows: 2 })

        expect(seen.accepted).toBe(1)
        expect(seen.progress).toBe(1)
        expect(seen.lastProgress).toEqual({ phase: 'loading', current: 1, total: 1, message: 'x' })
        expect(seen.matches.map((m) => m.close)).toEqual(['63001', '63002'])
        expect(seen.complete).toEqual({ matches: 2, scanned_rows: 2 })
    })

    it('ignores events for an unknown search_id', () => {
        const rows = []
        feed.startSearch({ search_id: 'S1' }, { onMatch: (r) => rows.push(r) })
        client._emit(matchEvent('OTHER', 1))
        expect(rows).toHaveLength(0)
    })

    it('de-dupes matches by strictly-increasing sequence', () => {
        const rows = []
        feed.startSearch({ search_id: 'S1' }, { onMatch: (r) => rows.push(r) })
        client._emit(matchEvent('S1', 1))
        client._emit(matchEvent('S1', 1))   // duplicate
        client._emit(matchEvent('S1', 2))
        expect(rows).toHaveLength(2)
    })

    it('drops matches that arrive after a terminal event', () => {
        const rows = []
        feed.startSearch({ search_id: 'S1' }, { onMatch: (r) => rows.push(r) })
        client._emit(matchEvent('S1', 1))
        client._emit({ type: 'search_complete', search_id: 'S1', matches: 1, scanned_rows: 1 })
        client._emit(matchEvent('S1', 2))   // late — ignored
        expect(rows).toHaveLength(1)
    })
})

describe('cancel', () => {
    it('sends cancel_search and finalises on search_cancelled, retaining matches', () => {
        let cancelled = null
        const handle = feed.startSearch({ search_id: 'S1' }, { onCancelled: (e) => { cancelled = e } })
        client._emit(matchEvent('S1', 1))
        feed.cancel(handle)
        expect(client.calls.some((c) => c[0] === 'cancelSearch' && c[1] === 'S1')).toBe(true)
        client._emit({ type: 'search_cancelled', search_id: 'S1', matches: 1 })
        expect(cancelled).toEqual({ type: 'search_cancelled', search_id: 'S1', matches: 1 })
    })

    it('cancel by search_id string also works', () => {
        feed.startSearch({ search_id: 'S1' }, {})
        feed.cancel('S1')
        expect(client.calls.some((c) => c[0] === 'cancelSearch')).toBe(true)
    })
})

describe('failure preserves partial results', () => {
    it('search_failed marks failed but keeps accumulated matches', () => {
        const rows = []
        let failed = null
        feed.startSearch({ search_id: 'S1' }, { onMatch: (r) => rows.push(r), onFailed: (e) => { failed = e } })
        client._emit(matchEvent('S1', 1))
        client._emit({ type: 'search_failed', search_id: 'S1', code: 'historical_query_failed', message: 'boom' })
        expect(rows).toHaveLength(1)                       // partial retained
        expect(failed).toEqual({ code: 'historical_query_failed', message: 'boom' })
    })

    it('a socket close fails every in-flight search (partials kept)', () => {
        let failed = null
        feed.startSearch({ search_id: 'S1' }, { onFailed: (e) => { failed = e } })
        client._emit(matchEvent('S1', 1))
        client._emitRaw('close', {})
        expect(failed.code).toBe('connection_lost')
    })

    it('a generic error naming the search_id finalises it; an unrelated error is ignored', () => {
        let failed = null
        feed.startSearch({ search_id: 'S1' }, { onFailed: (e) => { failed = e } })
        client._emit({ type: 'error', code: 'invalid_request_json', message: 'nope' })   // no search_id
        expect(failed).toBeNull()
        client._emit({ type: 'error', search_id: 'S1', code: 'boom', message: 'bad' })
        expect(failed).toEqual({ code: 'boom', message: 'bad' })
    })
})

describe('destroy', () => {
    it('cancels live searches and detaches listeners', () => {
        feed.startSearch({ search_id: 'S1' }, {})
        feed.destroy()
        expect(client.calls.some((c) => c[0] === 'cancelSearch')).toBe(true)
        // after destroy, further events are not routed (listeners detached)
        const rows = []
        feed.startSearch({ search_id: 'S2' }, { onMatch: (r) => rows.push(r) })
        // _emit won't reach the feed since on() handlers were removed in destroy
        client._emit(matchEvent('S2', 1))
        expect(rows).toHaveLength(0)
    })
})
