// Edge-branch unit tests for CorkySearchFeed — drives a FAKE CorkyClient that
// records search/cancel sends and lets the test emit search_* events on the
// type channel (search routes by search_id, not request correlation).
//
// These cover branches NOT exercised by corky-search-feed.test.js: a SYNCHRONOUS
// searchCandles throw → onFailed; pending→running flips driven by progress/match
// arriving before search_accepted; forget() on running vs terminal vs unknown;
// _safe consumer-throw isolation; non-numeric sequence acceptance; and
// idempotent destroy. Pure helper → runs in node (no DOM needed).

import { describe, it, expect, beforeEach } from 'vitest'
import { CorkySearchFeed } from '../../src/helpers/feed/corky-search-feed.js'

// A fake CorkyClient: records sends, exposes the type-channel emit driver, and
// (unlike the sibling test's client) can be told to throw SYNCHRONOUSLY from
// searchCandles and reports its live listener count so destroy() detach is
// observable.
function makeFakeClient() {
    const listeners = new Map()   // type → Set(cb)
    return {
        calls: [],
        throwOnSearch: null,
        searchCandles(query) {
            this.calls.push(['searchCandles', query])
            if (this.throwOnSearch) throw this.throwOnSearch
            return 'req-1'
        },
        cancelSearch(search_id) {
            this.calls.push(['cancelSearch', search_id])
            return 'req-2'
        },
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
        _listenerCount() {
            let n = 0
            for (const set of listeners.values()) n += set.size
            return n
        },
    }
}

// A minimally-valid search_match result so projectMatchRow yields a row.
function matchResult(close, overrides = {}) {
    return {
        venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h',
        timestamp_ms: 1781953200000,
        candle: { timestamp_ms: 0, open: '1', high: '2', low: '0', close: String(close), volume: '1' },
        indicators: {}, observations: [], side: 'bull',
        crup_context: null,
        chart_window: { timeframe: '1h', start_ms: 1, end_ms: 2, before_bars: 2, after_bars: 2 },
        ...overrides,
    }
}

let client, feed
beforeEach(() => {
    client = makeFakeClient()
    feed = new CorkySearchFeed({ client })
})

describe('startSearch: synchronous send-throw → onFailed', () => {
    it('surfaces a synchronous searchCandles throw as onFailed (code+message), record is NOT pending, later events ignored', () => {
        const err = new Error('socket unsendable')
        err.code = 'not_connected'
        client.throwOnSearch = err

        let failed = null
        let matched = 0
        let completed = 0
        feed.startSearch({ search_id: 'S1' }, {
            onFailed: (e) => { failed = e },
            onMatch: () => { matched++ },
            onComplete: () => { completed++ },
        })

        // The send was attempted, then the throw was caught and turned into onFailed.
        expect(client.calls).toEqual([['searchCandles', { search_id: 'S1' }]])
        expect(failed).toEqual({ code: 'not_connected', message: 'socket unsendable' })
        // Record is finalised as 'failed' — NOT stuck at 'pending'.
        expect(feed._searches.get('S1').status).toBe('failed')

        // A subsequent terminal/match event for the (now-failed) search is ignored.
        client._emit({ type: 'search_match', search_id: 'S1', sequence: 1, result: matchResult(63001) })
        client._emit({ type: 'search_complete', search_id: 'S1', matches: 1, scanned_rows: 1 })
        expect(matched).toBe(0)
        expect(completed).toBe(0)
    })
})

describe('pending → running flips without search_accepted', () => {
    it('onProgress before search_accepted flips pending→running and delivers projected progress', () => {
        let progress = null
        feed.startSearch({ search_id: 'S1' }, { onProgress: (p) => { progress = p } })
        expect(feed._searches.get('S1').status).toBe('pending')

        client._emit({ type: 'search_progress', search_id: 'S1', phase: 'scanning', current: 5, total: 10, message: 'hi' })

        expect(feed._searches.get('S1').status).toBe('running')
        // Progress is projected to exactly the four spec fields.
        expect(progress).toEqual({ phase: 'scanning', current: 5, total: 10, message: 'hi' })
    })

    it('onMatch before search_accepted flips pending→running and accumulates the match', () => {
        const rows = []
        feed.startSearch({ search_id: 'S1' }, { onMatch: (r) => rows.push(r) })

        client._emit({ type: 'search_match', search_id: 'S1', sequence: 1, result: matchResult(42) })

        expect(feed._searches.get('S1').status).toBe('running')
        expect(rows).toHaveLength(1)
        expect(rows[0].close).toBe('42')
        expect(feed._searches.get('S1').matches).toHaveLength(1)
    })
})

describe('forget()', () => {
    it('forget on a still-running search sends cancelSearch AND removes the record so later events are ignored', () => {
        let matched = 0
        let completed = 0
        const handle = feed.startSearch({ search_id: 'S1' }, {
            onMatch: () => { matched++ },
            onComplete: () => { completed++ },
        })
        client._emit({ type: 'search_accepted', search_id: 'S1' })

        feed.forget(handle)

        // forget cancels the in-flight search...
        expect(client.calls.some((c) => c[0] === 'cancelSearch' && c[1] === 'S1')).toBe(true)
        // ...and removes the record entirely.
        expect(feed._searches.has('S1')).toBe(false)

        // Later events for that search_id route to nothing.
        client._emit({ type: 'search_match', search_id: 'S1', sequence: 1, result: matchResult(1) })
        client._emit({ type: 'search_complete', search_id: 'S1', matches: 1, scanned_rows: 1 })
        expect(matched).toBe(0)
        expect(completed).toBe(0)
    })

    it('forget on an already-terminal search deletes the record WITHOUT a second cancelSearch', () => {
        feed.startSearch({ search_id: 'S1' }, {})
        client._emit({ type: 'search_complete', search_id: 'S1', matches: 0, scanned_rows: 0 })
        expect(feed._searches.get('S1').status).toBe('complete')

        const callsBefore = client.calls.length
        feed.forget('S1')

        // No new client send for a search that already terminated.
        expect(client.calls.length).toBe(callsBefore)
        expect(client.calls.some((c) => c[0] === 'cancelSearch')).toBe(false)
        expect(feed._searches.has('S1')).toBe(false)
    })

    it('forget(unknown) and cancel(unknown) are no-ops (no throw, no client calls)', () => {
        expect(() => feed.forget('NOPE')).not.toThrow()
        expect(() => feed.cancel('NOPE')).not.toThrow()
        // Falsy / object-without-search_id handles are also tolerated.
        expect(() => feed.forget(undefined)).not.toThrow()
        expect(() => feed.cancel({})).not.toThrow()
        expect(client.calls).toHaveLength(0)
    })
})

describe('_safe consumer-throw isolation', () => {
    it('an onMatch that throws is isolated; routing continues and a later onComplete still fires', () => {
        let completed = null
        feed.startSearch({ search_id: 'S1' }, {
            onMatch: () => { throw new Error('consumer boom') },
            onComplete: (s) => { completed = s },
        })

        // The throwing onMatch must NOT bubble out of _onMatch / the emit driver.
        expect(() => {
            client._emit({ type: 'search_match', search_id: 'S1', sequence: 1, result: matchResult(1) })
        }).not.toThrow()

        // The match was still accumulated despite the consumer throwing.
        expect(feed._searches.get('S1').matches).toHaveLength(1)

        // Routing continues — the terminal event is delivered.
        client._emit({ type: 'search_complete', search_id: 'S1', matches: 1, scanned_rows: 1 })
        expect(completed).toEqual({ matches: 1, scanned_rows: 1 })
    })
})

describe('non-numeric sequence', () => {
    it('search_match with a non-numeric sequence is accepted (the seq guard only applies to numbers) and not dropped', () => {
        const seen = []
        feed.startSearch({ search_id: 'S1' }, { onMatch: (row, info) => seen.push({ close: row.close, seq: info.sequence }) })

        // Two matches with the SAME non-numeric sequence: neither is dropped,
        // because the strictly-increasing guard short-circuits on typeof number.
        client._emit({ type: 'search_match', search_id: 'S1', sequence: 'abc', result: matchResult(9) })
        client._emit({ type: 'search_match', search_id: 'S1', sequence: 'abc', result: matchResult(10) })

        expect(seen).toEqual([
            { close: '9', seq: 'abc' },
            { close: '10', seq: 'abc' },
        ])
        // lastSeq is untouched by non-numeric sequences.
        expect(feed._searches.get('S1').lastSeq).toBe(-Infinity)
    })
})

describe('destroy() idempotency', () => {
    it('calling destroy twice does not throw and detaches every listener exactly once', () => {
        // Constructor binds 8 type channels.
        expect(client._listenerCount()).toBe(8)

        feed.destroy()
        expect(client._listenerCount()).toBe(0)
        expect(feed._off).toHaveLength(0)

        // Second destroy is a clean no-op (no double-detach throw, count stays 0).
        expect(() => feed.destroy()).not.toThrow()
        expect(client._listenerCount()).toBe(0)
        expect(feed._off).toHaveLength(0)
    })
})
