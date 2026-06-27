// Phase 4 (concurrent-live) — every chart tab owns its OWN CorkyFeed and keeps
// streaming in the background, so switching tabs is a render swap (no
// re-subscribe, no jump) and a load lands in the tab you're viewing.
//
// Binds the real App corky-tab methods to a fake `this` (the app-* pattern).
import { describe, it, expect, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods

function makeHost(over = {}) {
    const host = {
        feedMode: 'gateway',
        corkyClient: {},          // minimal — CorkyFeed ctor guards client.on()
        activeChart: null,
        activeTab: null,
        ...over,
    }
    for (const m of ['_ensureTabFeed', '_corkyBindActiveCube', 'onCorkySelect']) {
        host[m] = M[m].bind(host)
    }
    host.corkySelect = vi.fn()
    host.createChartTab = vi.fn(() => ({ id: 'ct-new' }))   // truthy = created (null = at cap)
    host.clearPositionPlot = vi.fn()
    host._clearSearchNav = vi.fn()
    host._corkyCancelSelectRetry = vi.fn()
    host._corkyHistoryLoader = vi.fn()
    return host
}

describe('_ensureTabFeed — one CorkyFeed per tab over the shared client', () => {
    it('creates the tab\'s own feed (bound to its cube) when missing', () => {
        const tab = { chart: { id: 'cube' }, corkyFeed: null }
        const host = makeHost()
        host._ensureTabFeed(tab)
        expect(tab.corkyFeed).toBeTruthy()
        expect(tab.corkyFeed.dc).toBe(tab.chart)     // bound to THIS tab's cube
    })

    it('is idempotent and a no-op without a client', () => {
        const host = makeHost()
        const existing = { dc: {} }
        const tab = { chart: {}, corkyFeed: existing }
        host._ensureTabFeed(tab)
        expect(tab.corkyFeed).toBe(existing)         // not replaced

        const noClient = makeHost({ corkyClient: null })
        const tab2 = { chart: {}, corkyFeed: null }
        noClient._ensureTabFeed(tab2)
        expect(tab2.corkyFeed).toBe(null)            // nothing to build a feed over
    })

    it('distinct tabs get distinct feeds with non-colliding subscription ids', () => {
        const host = makeHost()
        const a = { chart: {}, corkyFeed: null }
        const b = { chart: {}, corkyFeed: null }
        host._ensureTabFeed(a)
        host._ensureTabFeed(b)
        expect(a.corkyFeed).not.toBe(b.corkyFeed)
        // _nextSubscriptionId embeds a per-feed id → ids differ across feeds.
        expect(a.corkyFeed._nextSubscriptionId()).not.toBe(b.corkyFeed._nextSubscriptionId())
    })
})

describe('_corkyBindActiveCube — ensure feed + bind the loader to the active cube', () => {
    it('ensures the active tab\'s feed and binds its lazy-history loader', () => {
        const cube = { onrange: vi.fn() }
        const tab = { chart: cube, corkyFeed: null }
        const host = makeHost({ activeTab: tab, activeChart: cube })
        host._corkyBindActiveCube()
        expect(tab.corkyFeed).toBeTruthy()           // feed created
        expect(cube.onrange).toHaveBeenCalledTimes(1) // pan-backfill bound to it
    })

    it('no-ops safely with no active tab', () => {
        expect(() => makeHost({ activeTab: null })._corkyBindActiveCube()).not.toThrow()
    })
})

describe('onCorkySelect new-tab routing', () => {
    it('⌘/Ctrl/middle-click (newTab:true) opens a NEW tab before loading', () => {
        const host = makeHost()
        host.onCorkySelect({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', newTab: true })
        expect(host.createChartTab).toHaveBeenCalledTimes(1)
        expect(host.corkySelect).toHaveBeenCalled()
    })

    it('a plain click loads into the active tab (no new tab)', () => {
        const host = makeHost()
        host.onCorkySelect({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', newTab: false })
        expect(host.createChartTab).not.toHaveBeenCalled()
        expect(host.corkySelect).toHaveBeenCalled()
    })
})

describe('per-tab control epoch — concurrent loads do not supersede each other', () => {
    function makeTab(id) {
        return {
            id, corkyFeed: null, corkyCurrent: null, corkyHandle: null, corkyLast: null,
            corkyLoading: false, corkyProgress: null, corkyError: null, searchNav: null,
            title: '', _stream: { gen: 0, retries: 0, retryKeepSpinner: false },
            corkyFeedSubs: {},
        }
    }
    it('a load on tab B leaves tab A\'s epoch + handle intact (no cross-supersede)', async () => {
        const tabA = makeTab('A'); const tabB = makeTab('B')
        const feedFor = (id) => ({ subscribe: vi.fn(async () => ({ id })), unsubscribe: vi.fn() })
        tabA.corkyFeed = feedFor('A'); tabB.corkyFeed = feedFor('B')
        const host = {
            corkyClient: {}, corkyStates: [], corkyEnabled: {}, activeChartTabId: 'A',
            _tabs: { A: tabA, B: tabB },
            $nextTick: () => {}, $refs: { tradingVue: {} }, saveStateToStorage: vi.fn(),
        }
        Object.defineProperty(host, 'activeTab', { get() { return host._tabs[host.activeChartTabId] }, configurable: true })
        for (const m of ['corkySelect', '_corkyUnsub', '_corkyMem', '_corkyErr', '_navStatusLabel',
            '_corkyScheduleSelectRetry', '_ensureTabFeed']) host[m] = M[m].bind(host)
        host._corkyBindActiveCube = () => {}   // skip loader binding (tested elsewhere)

        await host.corkySelect({ venue: 'V', symbol: 'A', timeframe: '1h' }, tabA)
        const genA = tabA._stream.gen
        host.activeChartTabId = 'B'
        await host.corkySelect({ venue: 'V', symbol: 'B', timeframe: '1h' }, tabB)

        expect(tabA._stream.gen).toBe(genA)                 // tab B's select did NOT bump tab A
        expect(tabB._stream.gen).toBeGreaterThan(0)
        expect(tabA.corkyHandle).toEqual({ id: 'A' })       // each kept its own handle
        expect(tabB.corkyHandle).toEqual({ id: 'B' })
        expect(tabA.corkyCurrent.symbol).toBe('A')          // …and its own symbol
        expect(tabB.corkyCurrent.symbol).toBe('B')
        expect(tabA.corkyFeed.subscribe).toHaveBeenCalledTimes(1)   // each loaded via its OWN feed
        expect(tabB.corkyFeed.subscribe).toHaveBeenCalledTimes(1)
    })

    it('at the tab cap (createChartTab → null) a new-tab click ABORTS, never clobbers the active chart', () => {
        const host = makeHost()
        host.createChartTab = vi.fn(() => null)   // at MAX_CHART_TABS
        host.onCorkySelect({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', newTab: true })
        expect(host.createChartTab).toHaveBeenCalledTimes(1)
        expect(host.corkySelect).not.toHaveBeenCalled()   // did NOT load into the active tab
    })
})
