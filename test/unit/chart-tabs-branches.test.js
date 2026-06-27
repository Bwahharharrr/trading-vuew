// @vitest-environment jsdom
//
// Branch-coverage companion to chart-tabs.test.js. The base file pins the happy
// paths (seed / replace / switch / close-active / restore). THIS file fills the
// remaining branches the mixin owns — the early-return guards, the activate
// range-save/restore + lazy-subscribe + saveStateToStorage seam, the
// background-close persist-else, _destroyChartTabCube's feed/btSub/no-cube exits,
// and a real MOUNT so data()/created()/chartTabBarHeight run through the runtime
// (the makeHost shim binds methods directly and never invokes those lifecycle
// hooks). We DON'T re-assert cases the base file already owns.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ChartTabs from '../../src/mixins/app/chart-tabs.js'
import DataCube from '../../src/helpers/datacube.js'

// Same fake-host shim the base file uses: bind the mixin's methods + define its
// computeds onto a plain object so we can drive them without a full App mount.
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

// ---------------------------------------------------------------------------
// A real component mount — this is the ONLY way to execute data() (line 27),
// created() (line 52, which seeds the first tab) and the chartTabBarHeight
// computed (line 49) through Vue's runtime instead of the bound shim.
// ---------------------------------------------------------------------------
describe('chart-tabs: real mount drives data()/created()/chartTabBarHeight', () => {
    const Host = defineComponent({
        mixins: [ChartTabs],
        data() { return { DataCubeClass: DataCube, log_scale: true } },
        render() { return null },
    })

    it('created() seeds exactly one tab and data() supplies the reactive defaults', () => {
        const w = mount(Host)
        // data() ran → empty-then-seeded list; created() ran → one tab + active id.
        expect(w.vm.chartTabs).toHaveLength(1)
        expect(w.vm.activeChartTabId).toBe(w.vm.chartTabs[0].id)
        expect(w.vm.maxChartTabs).toBe(8)             // data() default
        expect(w.vm.activeChart).toBe(w.vm.chartTabs[0].chart)
        w.unmount()
    })

    it('chartTabBarHeight computed returns the fixed chrome height', () => {
        const w = mount(Host)
        expect(w.vm.chartTabBarHeight).toBe(34)       // chartHeight subtracts this
        w.unmount()
    })
})

// ---------------------------------------------------------------------------
// activeTab / activeChart null fallbacks — when chartTabs is empty the computeds
// must degrade to null instead of throwing (the `|| null` / cond-expr branches).
// ---------------------------------------------------------------------------
describe('chart-tabs: computed null-fallbacks on an empty set', () => {
    it('activeTab is null and activeChart is null when there are no tabs', () => {
        const host = makeHost()              // NOT seeded → chartTabs === []
        expect(host.activeTab).toBe(null)    // find→undefined, [0]→undefined, || null
        expect(host.activeChart).toBe(null)  // activeTab ? … : null  (the null arm)
    })
})

// ---------------------------------------------------------------------------
// setupChartCube branches: null guard, the no-data branch, and the grid-merge
// path with/without an existing grid object.
// ---------------------------------------------------------------------------
describe('chart-tabs: setupChartCube guards + grid merge', () => {
    it('returns early on a null cube (no throw, nothing wired)', () => {
        const host = makeHost()
        expect(() => host.setupChartCube(null)).not.toThrow()   // `if (!dc) return`
    })

    it('skips the grid merge when the cube has no data.chart, but still wires the order agent', () => {
        const host = makeHost()
        const dc = { /* no .data */ }
        host.setupChartCube(dc)
        expect(dc.orderAgent).toBeTruthy()       // order-agent path still runs
    })

    it('merges logScale onto an EXISTING grid and onto a missing grid (both `grid || {}` arms)', () => {
        const host = makeHost({ log_scale: false })
        const withGrid = { data: { chart: { grid: { foo: 1 } } }, orderAgent: {} }
        host.setupChartCube(withGrid)
        expect(withGrid.data.chart.grid).toEqual({ foo: 1, logScale: false })  // preserved + merged

        const noGrid = { data: { chart: {} }, orderAgent: {} }
        host.setupChartCube(noGrid)
        expect(noGrid.data.chart.grid).toEqual({ logScale: false })            // `grid || {}` → {}
    })
})

// ---------------------------------------------------------------------------
// onTabCubeReplaced — the null-tab guard + the active-tab $nextTick overlay
// re-add (priceAlarms / positionPlot) that the base file never exercises.
// ---------------------------------------------------------------------------
describe('chart-tabs: onTabCubeReplaced guards + overlay re-add', () => {
    it('is a no-op when given a null tab', () => {
        const host = makeHost(); host.seedInitialChartTab()
        expect(() => host.onTabCubeReplaced(null, new DataCube())).not.toThrow()  // `if (!tab) return`
    })

    it('re-adds the price-alarm + position overlays after replacing the ACTIVE cube', () => {
        const host = makeHost(); host.seedInitialChartTab()
        host.priceAlarms = [{ price: 100 }]
        host.positionPlot = { side: 'long' }
        host.ensurePriceAlarmOverlay = vi.fn()
        host.syncPositionOverlays = vi.fn()

        host.chart = new DataCube()   // active replace → $nextTick fires (our $nextTick is sync)

        expect(host.ensurePriceAlarmOverlay).toHaveBeenCalledTimes(1)  // line 144
        expect(host.syncPositionOverlays).toHaveBeenCalledTimes(1)     // line 145
        expect(window.dc).toBe(host.chart)                             // window.dc re-pointed
    })
})

// ---------------------------------------------------------------------------
// activateChartTab branches: the unknown-id / already-active early return, the
// range SAVE (copy) + saveStateToStorage seam, the lazy-subscribe corkySelect
// branch (corkyCurrent but no handle), the `!tv` post-tick guard, and the
// setRange restore arm.
// ---------------------------------------------------------------------------
describe('chart-tabs: activateChartTab branches', () => {
    let host
    beforeEach(() => { host = makeHost(); host.seedInitialChartTab() })

    it('returns early for an unknown id and for the already-active id', () => {
        const save = vi.fn(); host.saveStateToStorage = save
        host.activateChartTab('does-not-exist')           // tab undefined → return
        host.activateChartTab(host.activeChartTabId)      // id === active → return
        expect(save).not.toHaveBeenCalled()               // never reached the body
    })

    it('persists via saveStateToStorage and SAVES a COPY of the outgoing range on switch', () => {
        const live = [10, 20]
        host.$refs.tradingVue.getRange = () => live
        host.$refs.tradingVue.setRange = vi.fn()
        const save = vi.fn(); host.saveStateToStorage = save
        const tab0 = host.chartTabs[0]

        const tab1 = host.createChartTab()                // switch 0→1 saves tab0's range + persists
        expect(save).toHaveBeenCalled()                   // line 180
        expect(tab0.range).toEqual([10, 20])
        expect(tab0.range).not.toBe(live)                 // a snapshot, not the shared array
        expect(tab1.id).toBeTruthy()
    })

    it('lazy-subscribes a restored tab on first view (corkyCurrent w/o handle → corkySelect + return)', () => {
        host.feedMode = 'gateway'
        host._corkyBindActiveCube = vi.fn()
        host.corkySelect = vi.fn()
        host._restoreActiveTabOverlays = vi.fn()
        host.$refs.tradingVue.setRange = vi.fn()

        const tab1 = host.createChartTab()
        tab1.corkyCurrent = { venue: 'V', symbol: 'S', timeframe: '1h' }
        tab1.corkyHandle = null                            // NOT yet streaming → lazy branch
        tab1.range = [1, 2]                                // present, but the early return skips restore
        host.activateChartTab(host.chartTabs[0].id)        // switch away
        host.corkySelect.mockClear(); host._restoreActiveTabOverlays.mockClear()
        host.$refs.tradingVue.setRange.mockClear()

        host.activateChartTab(tab1.id)                     // switch back → lazy-subscribe path

        expect(host.corkySelect).toHaveBeenCalledWith({ venue: 'V', symbol: 'S', timeframe: '1h' })  // 192-194
        expect(host.$refs.tradingVue.setRange).not.toHaveBeenCalled()  // `return` before restore
        expect(host._restoreActiveTabOverlays).not.toHaveBeenCalled()  // skipped by the early return
    })

    it('tolerates a missing tradingVue ref inside the post-switch tick (the `!tv` guard)', () => {
        const tab1 = host.createChartTab()
        host.activateChartTab(host.chartTabs[0].id)        // back to tab0 (tv present for the save)
        host.$refs.tradingVue = null                       // drop the ref before the next switch's tick
        expect(() => host.activateChartTab(tab1.id)).not.toThrow()  // `if (!tv) return` (line 184)
        expect(host.activeChartTabId).toBe(tab1.id)        // active still flipped (set before the tick)
    })

    it('RESTORES a saved range via setRange when switching back to a live tab', () => {
        host.$refs.tradingVue.setRange = vi.fn()
        host.$refs.tradingVue.getRange = () => [5, 6]
        const tab1 = host.createChartTab()
        // feedMode is NOT gateway → skips lazy-subscribe, hits the setRange restore arm.
        host.activateChartTab(host.chartTabs[0].id)        // switch away (saves tab1's outgoing range)
        tab1.range = [42, 99]                              // pin the saved view AFTER the outgoing save
        host.$refs.tradingVue.setRange.mockClear()
        host.activateChartTab(tab1.id)                     // back → restore tab1.range
        expect(host.$refs.tradingVue.setRange).toHaveBeenCalledWith(42, 99)  // line 199
    })
})

// ---------------------------------------------------------------------------
// restoreChartTabs edge branches NOT covered by the base file: a malformed
// (venue/symbol-less) saved entry resolving to null, and the MAX-cap path where
// _appendChartTab returns null so the survivor is skipped.
// ---------------------------------------------------------------------------
describe('chart-tabs: restoreChartTabs edge branches', () => {
    it('drops a saved entry missing venue/symbol (resolve → null) while keeping a valid one', () => {
        const host = makeHost(); host.seedInitialChartTab()
        host.corkyStates = [{ venue: 'V', symbol: 'B', available_timeframes: ['1h'] }]
        host.corkySelect = vi.fn(); host._corkyBindActiveCube = vi.fn()
        const n = host.restoreChartTabs({
            tabs: [
                { symbol: 'B', timeframe: '1h' },          // no venue → resolve returns null (line 239), dropped
                { venue: 'V', symbol: 'B', timeframe: '1h' },
            ],
            activeIndex: 0,
        })
        expect(n).toBe(1)                                  // only the valid one survived
        expect(host.chartTabs[0].corkyCurrent).toMatchObject({ symbol: 'B', timeframe: '1h' })
    })

    it('skips a survivor when _appendChartTab hits MAX_CHART_TABS (the `if (!tab) return` arm)', () => {
        // Seed up to the cap so the very first restore append is refused.
        const host = makeHost(); host.seedInitialChartTab()
        host.corkySelect = vi.fn(); host._corkyBindActiveCube = vi.fn()
        host.corkyStates = [{ venue: 'V', symbol: 'B', available_timeframes: ['1h'] }]
        while (host.chartTabs.length < host.maxChartTabs) host._appendChartTab()
        expect(host.chartTabs).toHaveLength(8)
        // i===0 reuses chartTabs[0]; i===1 calls _appendChartTab → null (line 260/292).
        const n = host.restoreChartTabs({
            tabs: [
                { venue: 'V', symbol: 'B', timeframe: '1h' },   // i0 → reuses tab0
                { venue: 'V', symbol: 'B', timeframe: '1h' },   // i1 → append refused, survivor skipped
            ],
            activeIndex: 0,
        })
        expect(n).toBe(1)                                  // only the reused slot was filled
        expect(host.chartTabs).toHaveLength(8)             // no growth past the cap
    })

    it('_appendChartTab returns null at the cap', () => {
        const host = makeHost(); host.seedInitialChartTab()
        while (host.chartTabs.length < host.maxChartTabs) host._appendChartTab()
        expect(host._appendChartTab()).toBe(null)          // line 292 guard
    })

    it('returns 0 when every survivor slot is refused (created stays empty)', () => {
        // Defensive `if (!created.length) return 0` (line 268): reach it by passing the
        // line-256 survivor guard (a real selection resolves) yet having i===0 reuse an
        // ABSENT chartTabs[0] — an un-seeded host has [] — so the single push is skipped.
        const host = makeHost()                            // NOT seeded → chartTabs === [], [0] is undefined
        host.corkySelect = vi.fn(); host._corkyBindActiveCube = vi.fn()
        host.corkyStates = [{ venue: 'V', symbol: 'B', available_timeframes: ['1h'] }]
        const n = host.restoreChartTabs({
            tabs: [{ venue: 'V', symbol: 'B', timeframe: '1h' }],  // resolves → survivor, but slot 0 missing
            activeIndex: 0,
        })
        expect(n).toBe(0)                                  // created.length === 0 → early return
        expect(host.corkySelect).not.toHaveBeenCalled()    // never reached the lazy-subscribe tick
    })
})

// ---------------------------------------------------------------------------
// closeChartTab branches: unknown id, and closing a BACKGROUND (non-active) tab
// (persists via the saveStateToStorage else-arm, NEVER re-activates).
// ---------------------------------------------------------------------------
describe('chart-tabs: closeChartTab branches', () => {
    let host
    beforeEach(() => { host = makeHost(); host.seedInitialChartTab() })

    it('is a no-op for an unknown id (idx < 0)', () => {
        host.createChartTab()                              // now 2 tabs so the length>1 guard passes
        const before = host.chartTabs.length
        host.closeChartTab('ghost-id')                     // findIndex → -1 → return (line 303)
        expect(host.chartTabs).toHaveLength(before)
    })

    it('closing a BACKGROUND tab persists the new set WITHOUT activating a neighbor', () => {
        const tab1 = host.createChartTab()                 // active = tab1
        const bg = host.chartTabs[0]                        // tab0 is now backgrounded
        const d = vi.spyOn(bg.chart, 'destroy')
        host.saveStateToStorage = vi.fn()
        const activeBefore = host.activeChartTabId

        host.closeChartTab(bg.id)                           // close the NON-active tab

        expect(d).toHaveBeenCalledTimes(1)                  // its cube is torn down
        expect(host.activeChartTabId).toBe(activeBefore)    // active unchanged (no neighbor-activate)
        expect(host.saveStateToStorage).toHaveBeenCalledTimes(1)  // lines 309-310 (the else arm)
        expect(host.chartTabs).toEqual([tab1])
    })
})

// ---------------------------------------------------------------------------
// _destroyChartTabCube branches: null guard, the btProgressSub unsubscribe, and
// the no-cube early return. (The base file already covers feed-dispose +
// gen-bump + retry-cancel, so we only add the missing arms here.)
// ---------------------------------------------------------------------------
describe('chart-tabs: _destroyChartTabCube remaining arms', () => {
    let host
    beforeEach(() => { host = makeHost(); host.seedInitialChartTab() })

    it('is a no-op on a null tab', () => {
        expect(() => host._destroyChartTabCube(null)).not.toThrow()  // line 315 guard
    })

    it('unsubscribes the tab backtest-progress subscription via the shared feed', () => {
        const tab1 = host.createChartTab()
        const unsubscribe = vi.fn()
        host.backtestsFeed = { unsubscribe }
        tab1.btProgressSub = 'sub-token'
        host._destroyChartTabCube(tab1)
        expect(unsubscribe).toHaveBeenCalledWith('sub-token')  // lines 335-336
        expect(tab1.btProgressSub).toBe(null)
    })

    it('returns before the order-agent teardown when the tab has no cube', () => {
        const tab1 = host.createChartTab()
        tab1.chart = null                                  // no cube → `if (!tab.chart) return` (line 338)
        expect(() => host._destroyChartTabCube(tab1)).not.toThrow()
    })

    it('destroyAllChartTabs releases EVERY tab cube (drives _destroyChartTabCube over N)', () => {
        const t1 = host.createChartTab()
        const t2 = host.createChartTab()
        const spies = [host.chartTabs[0], t1, t2].map(t => vi.spyOn(t.chart, 'destroy'))
        host.destroyAllChartTabs()
        for (const s of spies) expect(s).toHaveBeenCalledTimes(1)
    })
})
