// Phase 4 (multi-tab) — the per-tab gateway-stream + load-chrome computed SHIMS
// (App.vue:522-576). corkyFeed/corkyCurrent/corkyHandle/corkyLast/corkyLoading/
// corkyProgress/corkyError all resolve to the ACTIVE tab so the existing corky
// code (corkySelect, discovery panel, indicator toggles) transparently reads/
// writes whichever tab is showing — while every tab keeps streaming. The flat-ctx
// app-* tests bind App.methods to a plain object and so NEVER exercise these
// computeds; this file pins the get/set seam directly against App.computed.
import { describe, it, expect } from 'vitest'
import App from '../../src/App.vue'

const C = App.computed

// Bind one computed onto `host` as a real accessor (get + optional set), exactly
// like a Vue component instance would expose it — so `host.corkyFeed = x` runs
// the shim's setter (or no-ops if get-only), not a plain assignment.
function bindComputed(host, name) {
    const def = C[name]
    Object.defineProperty(host, name, {
        get: def.get ? def.get.bind(host) : def.bind(host),
        set: def.set ? def.set.bind(host) : undefined,
        configurable: true,
    })
}

// A tab carries the un-prefixed storage field for each shim. _btPlot/_btProgressSub
// store under btPlot/btProgressSub on the tab (the shim strips the underscore).
function freshTab(id) {
    return {
        id,
        corkyFeed: null, corkyCurrent: null, corkyHandle: null, corkyLast: null,
        corkyLoading: false, corkyProgress: null, corkyError: null,
    }
}

// Map of shim name → the tab field it proxies (only where they differ).
const STORE = { _btPlot: 'btPlot', _btProgressSub: 'btProgressSub' }
const field = (shim) => STORE[shim] || shim

// Every get+set corky/load-chrome shim under test, with its empty-state default.
const RW_SHIMS = [
    ['corkyCurrent', null],
    ['corkyHandle', null],
    ['corkyLast', null],
    ['corkyLoading', false],
    ['corkyProgress', null],
    ['corkyError', null],
]

function makeHost() {
    const tabA = freshTab('a')
    const tabB = freshTab('b')
    const host = { _tabs: { a: tabA, b: tabB }, _active: 'a' }
    Object.defineProperty(host, 'activeTab', {
        get() { return host._tabs[host._active] }, configurable: true,
    })
    for (const [name] of RW_SHIMS) bindComputed(host, name)
    bindComputed(host, 'corkyFeed') // get-only
    return { host, tabA, tabB }
}

describe('per-tab corky + load-chrome shims', () => {
    it('every get/set shim writes to and reads from the ACTIVE tab', () => {
        const { host, tabA } = makeHost()
        host.corkyCurrent = { venue: 'X', symbol: 'btc' }
        host.corkyHandle = { enabledLayers: ['a'] }
        host.corkyLast = { symbol: 'btc' }
        host.corkyLoading = true
        host.corkyProgress = { pct: 42 }
        host.corkyError = 'boom'
        // All landed on the active tab (a)…
        expect(tabA.corkyCurrent).toEqual({ venue: 'X', symbol: 'btc' })
        expect(tabA.corkyHandle).toEqual({ enabledLayers: ['a'] })
        expect(tabA.corkyLast).toEqual({ symbol: 'btc' })
        expect(tabA.corkyLoading).toBe(true)
        expect(tabA.corkyProgress).toEqual({ pct: 42 })
        expect(tabA.corkyError).toBe('boom')
        // …and reading back through the shim returns the same identity.
        expect(host.corkyCurrent).toBe(tabA.corkyCurrent)
        expect(host.corkyHandle).toBe(tabA.corkyHandle)
        expect(host.corkyProgress).toBe(tabA.corkyProgress)
    })

    it('switching the active tab flips EVERY shim (per-tab isolation)', () => {
        const { host, tabA, tabB } = makeHost()
        // Arm tab A with non-empty values on every shim.
        host.corkyCurrent = { symbol: 'a' }
        host.corkyHandle = { h: 'a' }
        host.corkyLast = { l: 'a' }
        host.corkyLoading = true
        host.corkyProgress = { p: 'a' }
        host.corkyError = 'errA'

        host._active = 'b'                       // swap to the clean tab
        for (const [name, empty] of RW_SHIMS) {
            expect(host[name]).toEqual(empty)    // tab B reads its own (empty) field
        }

        // Writing through the shim now targets B; A is untouched (isolation).
        host.corkyCurrent = { symbol: 'b' }
        host.corkyError = 'errB'
        expect(tabB.corkyCurrent).toEqual({ symbol: 'b' })
        expect(tabB.corkyError).toBe('errB')
        expect(tabA.corkyCurrent).toEqual({ symbol: 'a' })  // A preserved
        expect(tabA.corkyError).toBe('errA')

        host._active = 'a'                        // swap back — A's values return
        expect(host.corkyCurrent).toEqual({ symbol: 'a' })
        expect(host.corkyLoading).toBe(true)
        expect(host.corkyProgress).toEqual({ p: 'a' })
    })

    it('corkyFeed is GET-ONLY — reads the active tab, has no setter', () => {
        const { host, tabA, tabB } = makeHost()
        tabA.corkyFeed = { feed: 'A' }
        tabB.corkyFeed = { feed: 'B' }
        expect(host.corkyFeed).toEqual({ feed: 'A' })     // active = a
        host._active = 'b'
        expect(host.corkyFeed).toEqual({ feed: 'B' })     // follows active tab
        // No setter was installed (def has no .set) → assigning is rejected by the
        // accessor descriptor, so the underlying tab field stays B's feed.
        expect(Object.getOwnPropertyDescriptor(host, 'corkyFeed').set).toBeUndefined()
        expect(() => { host.corkyFeed = { feed: 'C' } }).toThrow()  // get-only accessor
        expect(tabB.corkyFeed).toEqual({ feed: 'B' })     // unchanged by the failed set
    })

    it('all get-shims return the empty default when there is no active tab', () => {
        const host = {}
        Object.defineProperty(host, 'activeTab', { get() { return null }, configurable: true })
        for (const [name] of RW_SHIMS) bindComputed(host, name)
        bindComputed(host, 'corkyFeed')
        expect(host.corkyFeed).toBe(null)
        for (const [name, empty] of RW_SHIMS) {
            expect(host[name]).toEqual(empty)
        }
    })

    it('setting a shim is a silent no-op (no throw, no write) with no active tab', () => {
        const host = {}
        Object.defineProperty(host, 'activeTab', { get() { return null }, configurable: true })
        for (const [name] of RW_SHIMS) bindComputed(host, name)
        for (const [name, empty] of RW_SHIMS) {
            expect(() => { host[name] = { x: 1 } }).not.toThrow()  // guarded by `if (activeTab)`
            expect(host[name]).toEqual(empty)                      // still the default
        }
    })
})

// The on-chart overlay shims (positionPlot/searchNav/priceAlarms/rectDrawMode/
// _btPlot/_btProgressSub) — driven the same way, but here we also pin the
// underscore→field rename (_btPlot→tab.btPlot) which the sibling overlay test
// covers only by happenstance.
describe('per-tab overlay-state shims (underscore→field rename + empties)', () => {
    function makeOverlayHost() {
        const tabA = { id: 'a' }
        const tabB = { id: 'b' }
        const host = { _tabs: { a: tabA, b: tabB }, _active: 'a' }
        Object.defineProperty(host, 'activeTab', {
            get() { return host._tabs[host._active] }, configurable: true,
        })
        for (const n of ['positionPlot', 'searchNav', 'priceAlarms', 'rectDrawMode', '_btPlot', '_btProgressSub']) {
            bindComputed(host, n)
        }
        return { host, tabA, tabB }
    }

    it('_btPlot / _btProgressSub store under the UN-prefixed tab field', () => {
        const { host, tabA } = makeOverlayHost()
        host._btPlot = { runId: 'r1' }
        host._btProgressSub = { unsub: 'fn' }
        // The shim strips the leading underscore: writes land on tab.btPlot etc.
        expect(tabA[field('_btPlot')]).toEqual({ runId: 'r1' })
        expect(tabA[field('_btProgressSub')]).toEqual({ unsub: 'fn' })
        expect(tabA.btPlot).toEqual({ runId: 'r1' })          // explicit name pin
        expect(host._btPlot).toBe(tabA.btPlot)                // read round-trips
    })

    it('priceAlarms reads the active tab field; is isolated per tab', () => {
        const { host, tabA, tabB } = makeOverlayHost()
        // The [] default is the NO-active-tab branch; with an active tab the get
        // returns the tab's own field verbatim (undefined until written).
        expect(host.priceAlarms).toBeUndefined()
        host.priceAlarms = [{ price: 100 }]
        expect(tabA.priceAlarms).toEqual([{ price: 100 }])
        expect(host.priceAlarms).toBe(tabA.priceAlarms)       // same identity back
        host._active = 'b'
        expect(host.priceAlarms).toBeUndefined()              // B's own (unset) field
        expect(tabA.priceAlarms).toEqual([{ price: 100 }])    // A's array isolated
    })

    it('rectDrawMode flips per active tab; the false default is the no-tab branch', () => {
        const { host, tabA } = makeOverlayHost()
        expect(host.rectDrawMode).toBeUndefined()            // tab field unset (not the default)
        host.rectDrawMode = true
        expect(tabA.rectDrawMode).toBe(true)
        host._active = 'b'
        expect(host.rectDrawMode).toBeUndefined()            // B has no value → its own field
    })

    it('overlay shims are empty-safe with no active tab (no throw on set)', () => {
        const host = {}
        Object.defineProperty(host, 'activeTab', { get() { return null }, configurable: true })
        for (const n of ['positionPlot', 'searchNav', 'priceAlarms', 'rectDrawMode', '_btPlot', '_btProgressSub']) {
            bindComputed(host, n)
        }
        expect(host.positionPlot).toBe(null)
        expect(host.searchNav).toBe(null)
        expect(host.priceAlarms).toEqual([])
        expect(host.rectDrawMode).toBe(false)
        expect(host._btPlot).toBe(null)
        expect(host._btProgressSub).toBe(null)
        expect(() => { host._btProgressSub = { x: 1 } }).not.toThrow()
    })
})
