// @vitest-environment jsdom
//
// Phase 2 (multi-tab charts) — pins the ChartTab lifecycle the chart-tabs mixin
// owns, WITHOUT a full App mount. We bind the mixin's methods + computed shims to
// a fake `this` (the app-* test pattern) and drive real DataCubes. jsdom gives us
// `window` (the mixin sets window.dc) and a no-op Worker fallback in WebWork.
//
// The load-bearing contract: cube REPLACE (this.chart = newCube, a tf/file load)
// destroys the replaced cube; tab ACTIVATE (switch) NEVER destroys a backgrounded
// cube. With one tab only the replace path runs, so single-chart stays identical.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChartTabs from '../../src/mixins/app/chart-tabs.js'
import DataCube from '../../src/helpers/datacube.js'

function makeHost(overrides = {}) {
    const host = {
        DataCubeClass: DataCube,
        log_scale: true,
        corkyFeed: null,
        priceAlarms: [],
        positionPlot: null,
        $nextTick: (fn) => { if (fn) fn(); return Promise.resolve() },
        $refs: { tradingVue: { resetChart: vi.fn() } },
        chartTabs: [],
        activeChartTabId: null,
        maxChartTabs: 8,
        ...overrides,
    }
    for (const [k, fn] of Object.entries(ChartTabs.methods)) host[k] = fn.bind(host)
    for (const [k, def] of Object.entries(ChartTabs.computed)) {
        if (typeof def === 'function') {
            Object.defineProperty(host, k, { get: def.bind(host), configurable: true })
        } else {
            Object.defineProperty(host, k, {
                get: def.get.bind(host),
                set: def.set ? def.set.bind(host) : undefined,
                configurable: true,
            })
        }
    }
    return host
}

describe('chart-tabs: seed + the `chart` shim', () => {
    let host
    beforeEach(() => { host = makeHost(); host.seedInitialChartTab() })

    it('seeds exactly one tab and `chart` resolves to its cube', () => {
        expect(host.chartTabs).toHaveLength(1)
        expect(host.activeChartTabId).toBe(host.chartTabs[0].id)
        expect(host.chart).toBe(host.chartTabs[0].chart)
        expect(host.activeChart).toBe(host.chart)
        expect(host.chart.orderAgent).toBeTruthy()   // setupChartCube ran
    })

    it('setting `this.chart` REPLACES the active tab cube (destroys the old)', () => {
        const old = host.chart
        const destroy = vi.spyOn(old, 'destroy')
        const next = new DataCube()

        host.chart = next   // hits the computed setter -> onTabCubeReplaced

        expect(host.chart).toBe(next)
        expect(host.chartTabs[0].chart).toBe(next)
        expect(destroy).toHaveBeenCalledTimes(1)       // replaced cube torn down
        expect(next.orderAgent).toBeTruthy()           // new cube wired
    })

    it('replace re-points the Corky feed to the new active cube', () => {
        host.corkyFeed = { dc: host.chart }
        const next = new DataCube()
        host.chart = next
        expect(host.corkyFeed.dc).toBe(next)
    })
})

describe('chart-tabs: create / switch / close', () => {
    let host
    beforeEach(() => { host = makeHost(); host.seedInitialChartTab() })

    it('createChartTab adds a tab, activates it, and keeps both cubes alive', () => {
        const tab0 = host.chartTabs[0]
        const cube0 = tab0.chart
        const d0 = vi.spyOn(cube0, 'destroy')

        const tab1 = host.createChartTab()

        expect(host.chartTabs).toHaveLength(2)
        expect(host.activeChartTabId).toBe(tab1.id)
        expect(host.activeChart).toBe(tab1.chart)
        expect(tab1.chart).not.toBe(cube0)
        expect(d0).not.toHaveBeenCalled()              // tab 0's cube survives
    })

    it('creates one reusable strategy balance tab per runtime', () => {
        const balance = host.createStrategyBalanceTab({ runtimeId: 'rt-v8', strategyName: 'EMA V8' })
        expect(balance.kind).toBe('strategy_balance')
        expect(balance.title).toBe('Balance · EMA V8')
        expect(balance.strategyBalance.timeframe).toBe('1h')
        expect(host.createStrategyBalanceTab({ runtimeId: 'rt-v8', strategyName: 'EMA V8' })).toBe(balance)
        expect(host.chartTabs).toHaveLength(2)
    })

    it('switching tabs NEVER destroys a backgrounded cube', () => {
        const cube0 = host.chartTabs[0].chart
        const tab1 = host.createChartTab()
        const d0 = vi.spyOn(cube0, 'destroy')
        const d1 = vi.spyOn(tab1.chart, 'destroy')

        host.activateChartTab(host.chartTabs[0].id)     // back to tab 0
        expect(host.activeChart).toBe(cube0)
        host.activateChartTab(tab1.id)                  // forward to tab 1

        expect(d0).not.toHaveBeenCalled()
        expect(d1).not.toHaveBeenCalled()
    })

    it('closeChartTab destroys that tab cube and activates a neighbor', () => {
        const tab1 = host.createChartTab()              // active = tab1
        const d1 = vi.spyOn(tab1.chart, 'destroy')

        host.closeChartTab(tab1.id)

        expect(host.chartTabs).toHaveLength(1)
        expect(d1).toHaveBeenCalledTimes(1)             // closed cube released
        expect(host.activeChartTabId).toBe(host.chartTabs[0].id)
    })

    it('the last tab cannot be closed', () => {
        const onlyCube = host.chartTabs[0].chart
        const d = vi.spyOn(onlyCube, 'destroy')
        host.closeChartTab(host.chartTabs[0].id)
        expect(host.chartTabs).toHaveLength(1)
        expect(d).not.toHaveBeenCalled()
    })

    it('closeChartTab DISPOSES the closed tab\'s feed (no shared-client close)', () => {
        const tab1 = host.createChartTab()
        const dispose = vi.fn(); const destroy = vi.fn()
        tab1.corkyFeed = { dispose, destroy }
        host.closeChartTab(tab1.id)
        expect(dispose).toHaveBeenCalledTimes(1)
        expect(destroy).not.toHaveBeenCalled()       // destroy() would close the shared socket
        expect(tab1.corkyFeed).toBeNull()
    })

    it('closeChartTab invalidates the closed tab\'s epoch + cancels its retry (no post-close re-subscribe)', () => {
        const tab1 = host.createChartTab()
        tab1._stream = { gen: 5, retryTimer: setTimeout(() => {}, 9999), retryOpts: { venue: 'V' } }
        tab1.corkyFeed = { dispose: vi.fn() }
        const cancel = vi.fn()
        host._corkyCancelSelectRetry = cancel
        host.closeChartTab(tab1.id)
        expect(tab1._stream.gen).toBe(6)             // epoch bumped → an armed retry's select no-ops
        expect(cancel).toHaveBeenCalledWith(tab1)    // its retry timer is cancelled
    })

    it('activateChartTab re-applies overlays for a tab that completed in the background', () => {
        host.feedMode = 'gateway'
        host._corkyBindActiveCube = vi.fn()
        const restore = vi.fn()
        host._restoreActiveTabOverlays = restore
        const tab1 = host.createChartTab()
        tab1.corkyCurrent = { venue: 'V', symbol: 'S', timeframe: '1h' }
        tab1.corkyHandle = { id: 'h' }               // already loaded → non-lazy branch
        host.activateChartTab(host.chartTabs[0].id)  // switch away
        restore.mockClear()
        host.activateChartTab(tab1.id)               // switch back to the loaded tab
        expect(restore).toHaveBeenCalled()           // overlays re-applied on switch-back
    })

    it('caps at maxChartTabs and destroyAllChartTabs releases every cube', () => {
        while (host.chartTabs.length < host.maxChartTabs) host.createChartTab()
        expect(host.chartTabs).toHaveLength(8)
        expect(host.createChartTab()).toBe(null)        // 9th refused

        const spies = host.chartTabs.map(t => vi.spyOn(t.chart, 'destroy'))
        host.destroyAllChartTabs()
        for (const s of spies) expect(s).toHaveBeenCalledTimes(1)
    })

    it('saves a COPY of the view range per tab — zoom does not bleed across tabs', () => {
        const tab0 = host.chartTabs[0]
        // The chart returns a reference to its live, mutated-in-place range array.
        const liveRange = [100, 200]
        host.$refs.tradingVue.getRange = () => liveRange
        host.$refs.tradingVue.setRange = vi.fn()

        const tab1 = host.createChartTab()              // switch → saves tab0's range
        expect(tab0.range).toEqual([100, 200])
        expect(tab0.range).not.toBe(liveRange)          // a snapshot, NOT the shared array

        // Zooming tab1 mutates the shared live array in place; tab0 must be immune.
        liveRange[0] = 999; liveRange[1] = 1000
        expect(tab0.range).toEqual([100, 200])
        expect(tab1.id).toBeTruthy()
    })
})

describe('chart-tabs: persistence (serialize / restore)', () => {
    let host
    beforeEach(() => { host = makeHost(); host.seedInitialChartTab() })

    it('serializeChartTabs captures each tab selection + the active index', () => {
        host.chartTabs[0].corkyCurrent = { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' }
        const tab1 = host.createChartTab()
        tab1.corkyCurrent = { venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '4h' }
        const s = host.serializeChartTabs()
        expect(s.tabs).toEqual([
            { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' },
            { venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '4h' },
        ])
        expect(s.activeIndex).toBe(1)               // tab1 is active
    })

    it('serializes a blank tab as null', () => {
        const s = host.serializeChartTabs()          // tab0 has no selection
        expect(s.tabs).toEqual([null])
    })

    it('does not persist financial balance tabs across runtime sessions', () => {
        host.chartTabs[0].corkyCurrent = { venue: 'V', symbol: 'BTC', timeframe: '1h' }
        host.createStrategyBalanceTab({ runtimeId: 'rt-v8', strategyName: 'EMA V8' })
        expect(host.serializeChartTabs()).toEqual({
            tabs: [{ venue: 'V', symbol: 'BTC', timeframe: '1h' }],
            activeIndex: 0,
        })
    })

    it('restoreChartTabs recreates tabs from selections, dropping vanished symbols', () => {
        host.corkyStates = [
            { venue: 'BITFINEX', symbol: 'tBTCUSD', available_timeframes: ['1h', '4h'] },
            { venue: 'BITFINEX', symbol: 'tETHUSD', available_timeframes: ['1d'] },
        ]
        host.corkySelect = vi.fn()
        host._corkyBindActiveCube = vi.fn()
        const n = host.restoreChartTabs({
            tabs: [
                { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h' },
                { venue: 'BITFINEX', symbol: 'tETHUSD', timeframe: '99x' },  // bad tf → first available
                { venue: 'GONE', symbol: 'X', timeframe: '1h' },             // not discovered → dropped
            ],
            activeIndex: 1,
        })
        expect(n).toBe(2)
        expect(host.chartTabs).toHaveLength(2)
        expect(host.chartTabs[0].corkyCurrent).toMatchObject({ symbol: 'tBTCUSD', timeframe: '1h' })
        expect(host.chartTabs[1].corkyCurrent).toMatchObject({ symbol: 'tETHUSD', timeframe: '1d' })  // fell back
        expect(host.activeChartTabId).toBe(host.chartTabs[1].id)   // activeIndex 1
        expect(host.corkySelect).toHaveBeenCalled()                // active tab lazy-subscribed
    })

    it('restoreChartTabs is a no-op for an empty/garbage saved set', () => {
        host.corkyStates = []
        expect(host.restoreChartTabs(null)).toBe(0)
        expect(host.restoreChartTabs({ tabs: [{ venue: 'GONE', symbol: 'X', timeframe: '1h' }] })).toBe(0)
        expect(host.chartTabs).toHaveLength(1)     // untouched
    })

    it('maps activeIndex through a LEADING dropped tab (wrong-active-tab bug)', () => {
        host.corkyStates = [
            { venue: 'V', symbol: 'B', available_timeframes: ['1h'] },
            { venue: 'V', symbol: 'C', available_timeframes: ['1h'] },
        ]
        host.corkySelect = vi.fn(); host._corkyBindActiveCube = vi.fn()
        // saved: [A(vanished, idx0), B(active, idx1), C(idx2)] — B was active.
        host.restoreChartTabs({
            tabs: [
                { venue: 'V', symbol: 'GONE', timeframe: '1h' },  // dropped
                { venue: 'V', symbol: 'B', timeframe: '1h' },     // origIndex 1 = saved active
                { venue: 'V', symbol: 'C', timeframe: '1h' },
            ],
            activeIndex: 1,
        })
        expect(host.activeTab.corkyCurrent.symbol).toBe('B')   // B active, NOT C
    })

    it('serializeChartTabs preserves the pending saved set while a restore is pending', () => {
        host._savedCorkyTabs = { tabs: [{ venue: 'V', symbol: 'X', timeframe: '1h' }], activeIndex: 0 }
        host._corkyRestorePending = true
        // The current set is just a blank seeded tab — serialize must round-trip the
        // PENDING set so a transient discovery failure can't overwrite the layout.
        expect(host.serializeChartTabs()).toBe(host._savedCorkyTabs)
        host._corkyRestorePending = false
        expect(host.serializeChartTabs().tabs).toEqual([null])   // now serializes the live (blank) set
    })

    it('preserves a blank (null) tab on restore + maps the active index past it', () => {
        host.corkyStates = [{ venue: 'V', symbol: 'B', available_timeframes: ['1h'] }]
        host.corkySelect = vi.fn(); host._corkyBindActiveCube = vi.fn()
        const n = host.restoreChartTabs({
            tabs: [null, { venue: 'V', symbol: 'B', timeframe: '1h' }],  // [blank, B(active)]
            activeIndex: 1,
        })
        expect(n).toBe(2)
        expect(host.chartTabs).toHaveLength(2)                 // blank preserved
        expect(host.chartTabs[0].corkyCurrent).toBe(null)      // tab 0 stays blank
        expect(host.activeTab.corkyCurrent.symbol).toBe('B')   // active mapped past the blank
    })
})
