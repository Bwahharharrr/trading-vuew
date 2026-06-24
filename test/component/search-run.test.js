// @vitest-environment jsdom
//
// App.onRunSearch resolution: derives indicators[] from the SEARCHED symbol's
// descriptors (case-insensitive venue — the gateway reports it lowercase),
// sends the canonical venue, and fails the tab clearly when a symbol has no
// descriptors. Exercised against a lightweight `this` (App.methods bound to a
// fake ctx), like position-plot-select.test.js.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods

const BTC_STATE = {
    venue: 'bitfinex', symbol: 'tBTCUSD', available_timeframes: ['1h', '2h'],
    indicators: [
        { display_label: 'MACD(12,26,9)', kind: 'MACD', timeframe: '1h', source: 'close', params: { fast: '12', slow: '26', signal: '9' }, outputs: ['histogram'] },
        { display_label: 'CRUP', kind: 'CRUP_MTF', timeframe: '1h', source: 'close', params: { decay: '0.9', timeframes: '1h,2h' }, outputs: ['bull_box_timeframe_count'] },
    ],
}
const ETH_STATE = { venue: 'bitfinex', symbol: 'tETHUSD', available_timeframes: ['1h'], indicators: [] }

function mkCtx() {
    const ctx = {
        searchFeed: { nextSearchId: () => 'corky-search-1', startSearch: vi.fn() },
        searchTabs: [], searchTabSeq: 0,
        positionsDockOpen: true,
        togglePositionsDock: vi.fn(), setPositionsTab: vi.fn(),
        corkyStates: [BTC_STATE, ETH_STATE],
    }
    ctx.onRunSearch = M.onRunSearch
    return ctx
}

const form = (over = {}) => ({
    venue: 'BITFINEX', symbol: 'tBTCUSD', timeframes: ['1h'],
    range: { type: 'latest', limit: 80 },
    conditionRows: [{ indicator: 'MACD(12,26,9)', field: 'histogram', op: 'gt', value: 0, bar_offset: 0 }],
    result_window: { before_bars: 200, after_bars: 600 }, max_results: 50,
    ...over,
})

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('onRunSearch', () => {
    test('resolves descriptors case-insensitively and sends the canonical venue', () => {
        ctx.onRunSearch(form({ venue: 'BITFINEX' }))   // user/form venue UPPER, state is lower
        const tab = ctx.searchTabs[0]
        expect(tab.status).not.toBe('failed')
        const [query] = ctx.searchFeed.startSearch.mock.calls[0]
        expect(query.venue).toBe('bitfinex')           // canonical, from the state
        expect(query.indicators).toEqual([
            { kind: 'MACD', timeframe: '1h', source: 'close', params: { fast: '12', slow: '26', signal: '9' } },
        ])
    })

    test('threads a Barrier Symmetric target spec onto the query when the form enables it', () => {
        ctx.onRunSearch(form({ target: { window_fwd: 12, window_atr: 14, k_take: 0.9, k_stop: 0.9, post_hit_policy: 'stop', guard_use_close: true, guard_min_consecutive_closes: 1 } }))
        const [query] = ctx.searchFeed.startSearch.mock.calls[0]
        expect(query.target_specs).toHaveLength(1)
        expect(query.target_specs[0].type).toBe('barrier_symmetric')
        // tf defaulted to the first search timeframe
        expect(query.target_specs[0].spec.timeframe).toBe('1h')
        expect(query.target_specs[0].spec.window_fwd).toBe(12)
    })

    test('omits target_specs when the form leaves enrichment off (target null)', () => {
        ctx.onRunSearch(form({ target: null }))
        const [query] = ctx.searchFeed.startSearch.mock.calls[0]
        expect('target_specs' in query).toBe(false)
    })

    test('a symbol with no descriptors fails the tab with a clear message (no send)', () => {
        ctx.onRunSearch(form({ symbol: 'tETHUSD' }))
        const tab = ctx.searchTabs[0]
        expect(tab.status).toBe('failed')
        expect(tab.error.message).toMatch(/No indicator descriptors for tETHUSD/)
        expect(ctx.searchFeed.startSearch).not.toHaveBeenCalled()
    })

    test('an unknown symbol fails the tab, not the app', () => {
        ctx.onRunSearch(form({ symbol: 'tNOPEUSD' }))
        expect(ctx.searchTabs[0].status).toBe('failed')
        expect(ctx.searchFeed.startSearch).not.toHaveBeenCalled()
    })

    test('opens the dock + focuses the new results tab', () => {
        ctx.positionsDockOpen = false
        ctx.onRunSearch(form())
        expect(ctx.togglePositionsDock).toHaveBeenCalledWith(true)
        expect(ctx.setPositionsTab).toHaveBeenCalledWith('search-1')
    })
})
