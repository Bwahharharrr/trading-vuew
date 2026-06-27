// Right-panel collapse toggle (the button left of the 'Source' title): collapsing
// fully closes the panel (rightPanelWidth → 0, the chart takes the space) and
// reopening restores the remembered panelWidth. Pins the width logic + the toggle.
import { describe, it, expect, vi } from 'vitest'
import ChartState from '../../src/mixins/app/chart-state.js'

const C = ChartState.computed
const M = ChartState.methods

function host(over = {}) {
    const h = {
        panelWidth: 300, width: 1200, rightPanelCollapsed: false,
        config: {}, saveStateToStorage: vi.fn(), ...over,
    }
    Object.defineProperty(h, 'rightPanelWidth', { get: C.rightPanelWidth.bind(h), configurable: true })
    Object.defineProperty(h, 'chartWidth', { get: C.chartWidth.bind(h), configurable: true })
    h.toggleRightPanel = M.toggleRightPanel.bind(h)
    return h
}

describe('right-panel collapse', () => {
    it('rightPanelWidth = remembered width when open, 0 when collapsed', () => {
        const h = host({ panelWidth: 360 })
        expect(h.rightPanelWidth).toBe(360)      // open → clamped panelWidth
        expect(h.chartWidth).toBe(1200 - 360)
        h.rightPanelCollapsed = true
        expect(h.rightPanelWidth).toBe(0)        // collapsed → fully closed
        expect(h.chartWidth).toBe(1200)          // chart gets the whole width
    })

    it('toggleRightPanel flips the flag, persists, and reopening restores the prior width', () => {
        const h = host({ panelWidth: 420 })
        h.toggleRightPanel()
        expect(h.rightPanelCollapsed).toBe(true)
        expect(h.rightPanelWidth).toBe(0)
        expect(h.saveStateToStorage).toHaveBeenCalledTimes(1)

        h.toggleRightPanel()
        expect(h.rightPanelCollapsed).toBe(false)
        expect(h.rightPanelWidth).toBe(420)      // panelWidth untouched → exact prior width
        expect(h.saveStateToStorage).toHaveBeenCalledTimes(2)
    })

    it('collapse ignores the clamp — even a huge panelWidth closes to 0', () => {
        const h = host({ panelWidth: 9999, rightPanelCollapsed: true })
        expect(h.rightPanelWidth).toBe(0)
    })
})
