// @vitest-environment jsdom
//
// App-level search-navigation wiring: onSearchResultSelect (synchronous active +
// loading feedback, range + pending-zoom, ensureCandleState → corkySelect) and
// the on-chart vertical signal marker (syncSignalMarker / _clearSearchNav).
// Exercised against a lightweight `this` (App.methods bound to a fake ctx), the
// same technique as position-plot-select.test.js — no full mount.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods

function mkCtx() {
    const ctx = {
        corkyCurrent: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' },
        corkyStates: [{ venue: 'BITFINEX', symbol: 'tBTCUSD', available_timeframes: ['1h'] }],
        searchNav: null,
        chart: {
            data: { onchart: [], offchart: [] },
            add(s, o) { this.data[s].push(o) },
            update_ids() {}, touchData() {},
        },
        corkySelect: vi.fn(),
        _ensureCandleState: vi.fn(async () => true),
    }
    for (const m of ['onSearchResultSelect', '_isActiveNav', '_setNavMessage', '_navStatusLabel',
        'syncSignalMarker', '_removeSignalMarker', '_clearSearchNav']) {
        ctx[m] = M[m]
    }
    return ctx
}

const marker = (ctx) => ctx.chart.data.onchart.find((o) => o.settings && o.settings.$signalMarker)
const markers = (ctx) => ctx.chart.data.onchart.filter((o) => o.settings && o.settings.$signalMarker)

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('onSearchResultSelect', () => {
    const row = {
        ticker: 'tBTCUSD', venue: 'BITFINEX', timeframe: '1h', timestamp_ms: 1000,
        low: '63597', signal: '1h bull',
        chart_window: { timeframe: '1h', start_ms: 900, end_ms: 1100, before_bars: 200, after_bars: 600 },
    }

    test('sets the active+loading nav synchronously (before any await)', () => {
        const p = ctx.onSearchResultSelect({ tabId: 'search-1', row, index: 2 })
        expect(ctx.searchNav).toMatchObject({ tabId: 'search-1', index: 2, loading: true, error: false })
        expect(ctx.searchNav.target).toEqual({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' })
        expect(ctx.searchNav.signal).toEqual({ ts: 1000, low: '63597', label: '1h bull' })
        expect(ctx._corkyPendingRange).toEqual({ start: 900, end: 1100 })
        return p
    })

    test('ensures the candle state then selects with the chart_window start_end range', async () => {
        await ctx.onSearchResultSelect({ tabId: 'search-1', row, index: 0 })
        expect(ctx._ensureCandleState).toHaveBeenCalledWith('BITFINEX', 'tBTCUSD', '1h')
        expect(ctx.corkySelect).toHaveBeenCalledWith({
            venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h',
            range: { type: 'start_end', start_ms: 900, end_ms: 1100 },
        })
    })

    test('an unavailable symbol → error nav, no select', async () => {
        ctx._ensureCandleState = vi.fn(async () => false)
        await ctx.onSearchResultSelect({ tabId: 'search-1', row, index: 0 })
        expect(ctx.corkySelect).not.toHaveBeenCalled()
        expect(ctx.searchNav).toMatchObject({ loading: false, error: true })
        expect(ctx.searchNav.message).toMatch(/unavailable/i)
    })

    test('a superseded click during the await does not select for the stale row', async () => {
        let resolve
        ctx._ensureCandleState = vi.fn(() => new Promise((r) => { resolve = r }))
        const p = ctx.onSearchResultSelect({ tabId: 'search-1', row, index: 0 })
        // a newer click replaces the nav before the first resolves
        ctx.searchNav = { tabId: 'search-1', index: 5, loading: true }
        resolve(true)
        await p
        expect(ctx.corkySelect).not.toHaveBeenCalled()
    })
})

describe('syncSignalMarker', () => {
    beforeEach(() => {
        ctx.searchNav = {
            tabId: 'search-1', index: 0, loading: false,
            target: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' },
            signal: { ts: 1000, low: '63597', label: '1h bull' },
        }
    })

    test('adds a SignalMarker overlay for the charted symbol with numeric low', () => {
        ctx.syncSignalMarker()
        const m = marker(ctx)
        expect(m.type).toBe('SignalMarker')
        expect(m.grid).toEqual({ id: 0 })
        expect(m.data).toEqual([[1000, 63597, '1h bull']])   // low coerced to Number
    })

    test('is idempotent — re-syncing replaces, never duplicates', () => {
        ctx.syncSignalMarker()
        ctx.syncSignalMarker()
        expect(markers(ctx)).toHaveLength(1)
    })

    test('draws nothing when the nav targets a different symbol', () => {
        ctx.corkyCurrent = { venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '1h' }
        ctx.syncSignalMarker()
        expect(marker(ctx)).toBeUndefined()
    })

    test('a missing low still marks the bar (null low → full-height line)', () => {
        ctx.searchNav.signal.low = null
        ctx.syncSignalMarker()
        expect(marker(ctx).data).toEqual([[1000, null, '1h bull']])
    })
})

describe('_clearSearchNav', () => {
    test('nulls the nav and removes the marker', () => {
        ctx.searchNav = {
            tabId: 'search-1', index: 0,
            target: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' },
            signal: { ts: 1000, low: '63597', label: '1h bull' },
        }
        ctx.syncSignalMarker()
        expect(marker(ctx)).toBeTruthy()
        ctx._clearSearchNav()
        expect(ctx.searchNav).toBeNull()
        expect(marker(ctx)).toBeUndefined()
    })
})
