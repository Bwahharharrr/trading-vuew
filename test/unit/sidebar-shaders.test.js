// Pins the last-price-tag fix: the cursor-only fast path (updatePanelOnly) must
// repaint sidebar shaders, otherwise _clearPanel wipes the highlighted price tag
// on every cursor move and the cursor-only path never redraws it. Driven through
// Sidebar.prototype with a mock `this` (the full renderer needs a real canvas).
import { test, expect, describe, vi } from 'vitest'
import Sidebar from '../../src/components/js/sidebar.js'

function mockRenderer(cursor) {
  return {
    // A resolved layout — the cursor-only fast path bails when it's absent.
    layout: { sb: 60, height: 400 },
    $p: { cursor },
    _lastPanelY: undefined,
    _clearPanel: vi.fn(),
    apply_shaders: vi.fn(),
    panel: vi.fn(),
  }
}

describe('Sidebar.updatePanelOnly repaints shaders (price tag)', () => {
  test('cursor present: apply_shaders runs, before panel()', () => {
    const order = []
    const self = mockRenderer({ y: 120, y$: 99.5 })
    self.apply_shaders = vi.fn(() => order.push('shaders'))
    self.panel = vi.fn(() => order.push('panel'))

    Sidebar.prototype.updatePanelOnly.call(self)

    expect(self.apply_shaders).toHaveBeenCalledTimes(1)
    expect(self.panel).toHaveBeenCalledTimes(1)
    // Shaders must paint BEFORE the cursor panel (panel overlays them).
    expect(order).toEqual(['shaders', 'panel'])
    expect(self._lastPanelY).toBe(120)
  })

  test('cursor gone but a panel was drawn: clears then repaints shaders', () => {
    const self = mockRenderer({ y: 0, y$: 0 })
    self._lastPanelY = 80
    Sidebar.prototype.updatePanelOnly.call(self)

    expect(self._clearPanel).toHaveBeenCalledWith(80)
    expect(self.apply_shaders).toHaveBeenCalledTimes(1)
    expect(self.panel).not.toHaveBeenCalled()
    expect(self._lastPanelY).toBeUndefined()
  })

  test('cursor gone and nothing was drawn: no-op (no shader repaint needed)', () => {
    const self = mockRenderer({ y: 0, y$: 0 })
    self._lastPanelY = undefined
    Sidebar.prototype.updatePanelOnly.call(self)

    expect(self._clearPanel).not.toHaveBeenCalled()
    expect(self.apply_shaders).not.toHaveBeenCalled()
  })

  // Regression: a cursor move can fire updatePanelOnly() before the first full
  // update() resolves a layout (initial load) or while the grid layout is
  // momentarily absent (tf-switch rebuild). _clearPanel/panel dereference
  // this.layout.sb, so the fast path must bail instead of throwing.
  test('no layout yet: bails without throwing (no clear/panel)', () => {
    const self = mockRenderer({ y: 120, y$: 99.5 })
    self.layout = undefined
    self._lastPanelY = 80 // a previous panel existed
    expect(() => Sidebar.prototype.updatePanelOnly.call(self)).not.toThrow()
    expect(self._clearPanel).not.toHaveBeenCalled()
    expect(self.panel).not.toHaveBeenCalled()
    expect(self.apply_shaders).not.toHaveBeenCalled()
  })
})
