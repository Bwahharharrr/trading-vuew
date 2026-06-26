// Phase 3+4 — the gateway stream follows the ACTIVE chart tab.
//
// Pins the bug the user hit: loading a ticker while viewing tab 2 wrote into
// tab 1 because corkyFeed.dc never moved off the tab that built the feed. These
// tests bind the real App corky-tab methods to a fake `this` (the app-* pattern)
// and assert: the feed/loader re-point to the active cube, a tab switch
// re-subscribes that tab's remembered symbol (active-only-live), a blank tab
// tears the stream down, and ⌘/Ctrl-click routes to a NEW tab.
import { describe, it, expect, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods

function makeHost(over = {}) {
    const host = {
        feedMode: 'gateway',
        corkyFeed: { dc: null, unsubscribe: vi.fn() },
        corkyHandle: null,
        activeChart: null,
        activeTab: null,
        corkyCurrent: null,
        corkyLoading: false,
        corkyProgress: null,
        corkyError: null,
        _corkyGen: 0,
        _corkyRetryTimer: null,
        ...over,
    }
    for (const m of ['_corkyBindActiveCube', '_corkyActivateTab', '_corkyDeselect',
        '_corkyUnsub', '_corkyCancelSelectRetry', 'onCorkySelect']) {
        host[m] = M[m].bind(host)
    }
    // Stubs for collaborators not under test.
    host.corkySelect = vi.fn()
    host.createChartTab = vi.fn()
    host.clearPositionPlot = vi.fn()
    host._clearSearchNav = vi.fn()
    host._corkyHistoryLoader = vi.fn()
    return host
}

describe('_corkyBindActiveCube', () => {
    it('re-points feed.dc AND the lazy-history loader at the active cube', () => {
        const cube = { onrange: vi.fn() }
        const host = makeHost({ corkyFeed: { dc: { stale: true }, unsubscribe: vi.fn() }, activeChart: cube })
        host._corkyBindActiveCube()
        expect(host.corkyFeed.dc).toBe(cube)              // feed writes into the visible cube
        expect(cube.onrange).toHaveBeenCalledTimes(1)     // pan-backfill bound to it too
    })

    it('no-ops safely when there is no feed or no active cube', () => {
        expect(() => makeHost({ corkyFeed: null })._corkyBindActiveCube()).not.toThrow()
        expect(() => makeHost({ activeChart: null })._corkyBindActiveCube()).not.toThrow()
    })
})

describe('_corkyActivateTab (active-only-live on switch)', () => {
    it('re-subscribes the active tab\'s remembered symbol into its cube', () => {
        const cube = { onrange: vi.fn() }
        const host = makeHost({
            activeChart: cube,
            activeTab: { corkyCurrent: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' } },
        })
        host._corkyActivateTab()
        expect(host.corkyFeed.dc).toBe(cube)
        expect(host.corkySelect).toHaveBeenCalledWith(
            expect.objectContaining({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' }))
    })

    it('tears the stream down for a blank tab (no remembered symbol)', () => {
        const cube = { onrange: vi.fn() }
        const host = makeHost({
            activeChart: cube,
            activeTab: { corkyCurrent: null },
            corkyCurrent: { venue: 'X', symbol: 'Y', timeframe: '1h' },
            corkyHandle: { id: 'h1' },
        })
        host._corkyActivateTab()
        expect(host.corkySelect).not.toHaveBeenCalled()
        expect(host.corkyCurrent).toBe(null)              // deselected → discovery shows nothing active
        expect(host.corkyFeed.unsubscribe).toHaveBeenCalled()
    })

    it('does nothing outside gateway mode', () => {
        const host = makeHost({ feedMode: 'file', activeTab: { corkyCurrent: { venue: 'a', symbol: 'b', timeframe: '1h' } } })
        host._corkyActivateTab()
        expect(host.corkySelect).not.toHaveBeenCalled()
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
