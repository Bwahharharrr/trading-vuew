// mixins/chart/chart-resize.js — grid resize + minimize/restore height
// redistribution (was 2% covered). Pure state math; invoked directly with a
// crafted `this` and a controllable RAF.
import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'
import chartResize from '../../src/mixins/chart/chart-resize.js'

const M = chartResize.methods

function mkCtx(grids) {
  const ctx = Object.assign(chartResize.data(), {
    chartLayout: { grids: grids || [{ height: 300 }, { height: 150 }, { height: 120 }] },
    update_layout: vi.fn(),
  })
  Object.assign(ctx, M)
  return ctx
}

let rafQ
beforeEach(() => { rafQ = []; globalThis.requestAnimationFrame = (fn) => { rafQ.push(fn); return rafQ.length } })
afterEach(() => vi.restoreAllMocks())
const flush = () => { const q = rafQ; rafQ = []; q.forEach((fn) => fn && fn()) }

describe('on_resize_grids (drag) → throttled relayout', () => {
  test('records the two grid heights and relayouts on the next frame', () => {
    const ctx = mkCtx()
    ctx.on_resize_grids({ gridAbove: 0, gridBelow: 1, heightAbove: 260, heightBelow: 190 })
    expect(ctx.isResizing).toBe(true)
    expect(ctx.customGridHeights[0]).toBe(260)
    expect(ctx.customGridHeights[1]).toBe(190)
    expect(ctx.update_layout).not.toHaveBeenCalled() // deferred to RAF
    flush()
    expect(ctx.update_layout).toHaveBeenCalledWith(false, true)
  })

  test('the RAF is coalesced — concurrent resizes schedule one frame', () => {
    const ctx = mkCtx()
    ctx.on_resize_grids({ gridAbove: 0, gridBelow: 1, heightAbove: 1, heightBelow: 2 })
    ctx.on_resize_grids({ gridAbove: 0, gridBelow: 1, heightAbove: 3, heightBelow: 4 })
    expect(rafQ.length).toBe(1)
    flush()
    expect(ctx.update_layout).toHaveBeenCalledTimes(1)
  })
})

describe('on_resize_complete', () => {
  test('snapshots non-minimized grid heights and clears the resizing flag', () => {
    const ctx = mkCtx()
    ctx.minimizedGrids = { 2: true }
    ctx.isResizing = true
    ctx.on_resize_complete()
    expect(ctx.savedGridHeights[0]).toBe(300)
    expect(ctx.savedGridHeights[1]).toBe(150)
    expect(ctx.savedGridHeights[2]).toBeUndefined() // minimized → not saved
    expect(ctx.isResizing).toBe(false)
  })
})

describe('on_toggle_minimize', () => {
  test('minimize grid 1: saves height, flags minimized, redistributes to main', () => {
    const ctx = mkCtx()
    ctx.on_toggle_minimize(1)
    expect(ctx.minimizedGrids[1]).toBe(true)
    expect(ctx.savedGridHeights[1]).toBe(150)
    // the freed height went to the grid above (main, id 0)
    expect(ctx.customGridHeights[0]).toBeGreaterThan(300)
    expect(ctx.update_layout).toHaveBeenCalled()
  })

  test('restore a minimized grid: un-flags and pulls height back from main', () => {
    const ctx = mkCtx()
    ctx.minimizedGrids = { 1: true }
    ctx.savedGridHeights = { 1: 150 }
    ctx.customGridHeights = { 0: 450 }
    ctx.on_toggle_minimize(1)
    expect(ctx.minimizedGrids[1]).toBe(false)
    expect(ctx.customGridHeights[1]).toBeGreaterThan(28) // restored above the minimized floor
    expect(ctx.customGridHeights[0]).toBeLessThan(450)    // main gave height back
  })
})

describe('minimize_all_offcharts', () => {
  test('collapses every expanded offchart and grows the main pane', () => {
    const ctx = mkCtx()
    ctx.minimize_all_offcharts()
    expect(ctx.minimizedGrids[1]).toBe(true)
    expect(ctx.minimizedGrids[2]).toBe(true)
    expect(ctx.customGridHeights[0]).toBeGreaterThan(300) // absorbed the freed space
    expect(ctx.update_layout).toHaveBeenCalled()
  })

  test('when all are collapsed, restores them and shrinks the main pane', () => {
    const ctx = mkCtx()
    ctx.minimizedGrids = { 1: true, 2: true }
    ctx.savedGridHeights = { 1: 150, 2: 120 }
    ctx.customGridHeights = { 0: 600 }
    ctx.minimize_all_offcharts()
    expect(ctx.minimizedGrids[1]).toBe(false)
    expect(ctx.minimizedGrids[2]).toBe(false)
    expect(ctx.customGridHeights[1]).toBeGreaterThan(28)
    expect(ctx.customGridHeights[0]).toBeLessThan(600)
  })
})
