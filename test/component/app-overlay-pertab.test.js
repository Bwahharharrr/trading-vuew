// Phase 4 (overlay state per-tab) — positionPlot / searchNav / priceAlarms /
// rectDrawMode / _btPlot / _btProgressSub are computed shims that read+write the
// ACTIVE tab, so a plotted position / backtest / drawing arm / alarms stay with
// the chart they were made on instead of bleeding across tabs.
import { describe, it, expect } from 'vitest'
import App from '../../src/App.vue'

const C = App.computed

function bindComputed(host, name) {
    const def = C[name]
    Object.defineProperty(host, name, {
        get: def.get ? def.get.bind(host) : def.bind(host),
        set: def.set ? def.set.bind(host) : undefined,
        configurable: true,
    })
}

function freshTab(id) {
    return { id, positionPlot: null, searchNav: null, priceAlarms: [], rectDrawMode: false, btPlot: null, btProgressSub: null }
}

function makeHost() {
    const tabA = freshTab('a')
    const tabB = freshTab('b')
    const host = { _tabs: { a: tabA, b: tabB }, _active: 'a' }
    Object.defineProperty(host, 'activeTab', { get() { return host._tabs[host._active] }, configurable: true })
    for (const n of ['positionPlot', 'searchNav', 'priceAlarms', 'rectDrawMode', '_btPlot', '_btProgressSub']) {
        bindComputed(host, n)
    }
    return { host, tabA, tabB }
}

describe('per-tab overlay-state shims', () => {
    it('positionPlot / _btPlot / rectDrawMode read+write the ACTIVE tab only', () => {
        const { host, tabA, tabB } = makeHost()
        host.positionPlot = { id: 'pos1' }
        host._btPlot = { runId: 'r1' }
        host.rectDrawMode = true
        expect(tabA.positionPlot).toEqual({ id: 'pos1' })   // written to active (a)
        expect(tabA.btPlot).toEqual({ runId: 'r1' })
        expect(tabA.rectDrawMode).toBe(true)

        host._active = 'b'                                   // switch tabs
        expect(host.positionPlot).toBe(null)                // tab B is clean
        expect(host._btPlot).toBe(null)
        expect(host.rectDrawMode).toBe(false)

        // tab A's overlays are untouched by viewing/mutating tab B.
        host.positionPlot = { id: 'pos2' }
        expect(tabB.positionPlot).toEqual({ id: 'pos2' })
        expect(tabA.positionPlot).toEqual({ id: 'pos1' })   // isolated
    })

    it('priceAlarms is a distinct per-tab array', () => {
        const { host, tabA, tabB } = makeHost()
        host.priceAlarms.push({ price: 100 })               // mutate active (a)'s array
        expect(tabA.priceAlarms).toHaveLength(1)
        host._active = 'b'
        expect(host.priceAlarms).toHaveLength(0)            // tab B's own empty array
        expect(tabB.priceAlarms).not.toBe(tabA.priceAlarms)
    })

    it('shims are null/empty-safe when there is no active tab', () => {
        const host = {}
        Object.defineProperty(host, 'activeTab', { get() { return null }, configurable: true })
        for (const n of ['positionPlot', 'searchNav', 'priceAlarms', 'rectDrawMode', '_btPlot']) bindComputed(host, n)
        expect(host.positionPlot).toBe(null)
        expect(host.priceAlarms).toEqual([])
        expect(host.rectDrawMode).toBe(false)
        expect(() => { host.positionPlot = { x: 1 } }).not.toThrow()   // no-op, no crash
    })
})
