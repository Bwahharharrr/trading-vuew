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
