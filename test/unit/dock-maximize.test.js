// @vitest-environment jsdom
//
// Bottom positions-dock MAXIMIZE: the ⤢ button expands the dock to full page
// height (chart → 0); Restore returns it to the resizable positionsDockHeight.
// Mirrors the right-panel-collapse precedent. Pins the bottomDockHeight maximized
// branch + the chartHeight >= 0 clamp (chart-state computeds), and the App-level
// toggleDockMaximize / resize-exits-maximize behaviour (App.methods bound to a
// fake `this`, the same technique used across the app-*.test.js files).
import { describe, it, expect, vi } from 'vitest'
import ChartState from '../../src/mixins/app/chart-state.js'
import App from '../../src/App.vue'

const C = ChartState.computed
const M = App.methods

// Fake host carrying the plain inputs the two computeds read; bottomDockHeight
// and chartHeight are bound as getters (chartHeight reads the bound bottomDock).
function layoutHost(over = {}) {
    const h = {
        feedMode: 'gateway', height: 800, bottomPanelHeight: 44, chartTabBarHeight: 34,
        positionsDockOpen: true, positionsDockMaximized: false, positionsDockHeight: 240,
        ...over,
    }
    Object.defineProperty(h, 'bottomDockHeight', { get: C.bottomDockHeight.bind(h), configurable: true })
    Object.defineProperty(h, 'chartHeight', { get: C.chartHeight.bind(h), configurable: true })
    return h
}

describe('dock maximize — chart-state layout', () => {
    it('(a) maximized fills height - bottomPanel - tabBar, and chartHeight clamps to 0', () => {
        const h = layoutHost({ positionsDockMaximized: true })
        expect(h.bottomDockHeight).toBe(800 - 44 - 34)   // 722 — whole chart+dock area
        expect(h.chartHeight).toBe(0)                    // chart squeezed to nothing
    })

    it('(a) a tiny viewport never yields a negative chart height (floor guard + clamp)', () => {
        const h = layoutHost({ height: 100, positionsDockMaximized: true })
        // floor: HEADER(34) + 120 = 154 wins over (100 - 44 - 34 = 22)
        expect(h.bottomDockHeight).toBe(154)
        expect(h.chartHeight).toBe(0)                    // Math.max(0, 100-44-154-34)
    })

    it('(b) collapsed wins over maximized — header only, chart keeps the space', () => {
        const h = layoutHost({ positionsDockOpen: false, positionsDockMaximized: true })
        expect(h.bottomDockHeight).toBe(34)              // HEADER only
        expect(h.chartHeight).toBe(800 - 44 - 34 - 34)   // 688
    })

    it('non-maximized open dock still uses the clamped resizable body', () => {
        const h = layoutHost({ positionsDockHeight: 300 })
        expect(h.bottomDockHeight).toBe(34 + 300)        // HEADER + body
    })
})

describe('dock maximize — App.toggleDockMaximize', () => {
    it('(c) maximize force-opens a collapsed dock, (re)starts streams, and persists', () => {
        const ctx = {
            positionsDockOpen: false, positionsDockMaximized: false,
            positionsActiveTab: 'open',
            _ensureHistoryLoaded: vi.fn(), _positionsSyncStreams: vi.fn(), saveStateToStorage: vi.fn(),
        }
        M.toggleDockMaximize.call(ctx, true)
        expect(ctx.positionsDockMaximized).toBe(true)
        expect(ctx.positionsDockOpen).toBe(true)         // maximizing opens it
        expect(ctx._positionsSyncStreams).toHaveBeenCalledTimes(1)   // opening starts the stream
        expect(ctx.saveStateToStorage).toHaveBeenCalledTimes(1)
    })

    it('(c) restore clears maximized, leaves the dock open, and persists', () => {
        const ctx = {
            positionsDockOpen: true, positionsDockMaximized: true,
            positionsActiveTab: 'open',
            _ensureHistoryLoaded: vi.fn(), _positionsSyncStreams: vi.fn(), saveStateToStorage: vi.fn(),
        }
        M.toggleDockMaximize.call(ctx, false)
        expect(ctx.positionsDockMaximized).toBe(false)
        expect(ctx.positionsDockOpen).toBe(true)         // restore does NOT collapse
        expect(ctx.saveStateToStorage).toHaveBeenCalledTimes(1)
    })

    it('maximizing onto the Historical tab loads history', () => {
        const ctx = {
            positionsDockOpen: false, positionsDockMaximized: false,
            positionsActiveTab: 'historical',
            _ensureHistoryLoaded: vi.fn(), _positionsSyncStreams: vi.fn(), saveStateToStorage: vi.fn(),
        }
        M.toggleDockMaximize.call(ctx, true)
        expect(ctx._ensureHistoryLoaded).toHaveBeenCalledTimes(1)
    })
})

describe('dock maximize — collapse clears maximize (togglePositionsDock)', () => {
    it('collapsing a maximized dock clears the flag so Expand restores the normal body', () => {
        const ctx = {
            positionsDockOpen: true, positionsDockMaximized: true,
            positionsActiveTab: 'open',
            _ensureHistoryLoaded: vi.fn(), _positionsSyncStreams: vi.fn(), saveStateToStorage: vi.fn(),
        }
        M.togglePositionsDock.call(ctx, false)           // ▾ collapse
        expect(ctx.positionsDockOpen).toBe(false)
        expect(ctx.positionsDockMaximized).toBe(false)   // not stuck maximized
        expect(ctx.saveStateToStorage).toHaveBeenCalledTimes(1)
    })
})

describe('dock maximize — resize exits maximize', () => {
    it('(d) grabbing the handle while maximized seeds the body from the full height (single transition) and clears the flag', () => {
        const ctx = {
            positionsDockMaximized: true, positionsDockHeight: 240, height: 800,
            bottomDockHeight: 722,   // current full body = 722 (HEADER 34 + 688)
            saveStateToStorage: vi.fn(),
        }
        M.startPositionsDockResize.call(ctx, { clientY: 500 })
        expect(ctx.positionsDockMaximized).toBe(false)   // manual drag picks a height
        expect(ctx.positionsDockHeight).toBe(688)        // seeded from bottomDockHeight - HEADER(34)
        // tidy up the document listeners the handler registered
        ctx._onDockResizeEnd()
    })
})
