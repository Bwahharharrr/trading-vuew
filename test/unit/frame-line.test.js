// stuff/frame.js (FrameAnimation) + components/primitives/line.js — both were 0%.
import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'
import FrameAnimation from '../../src/stuff/frame.js'
import Utils from '../../src/stuff/utils.js'
import Line from '../../src/components/primitives/line.js'

describe('FrameAnimation', () => {
  let queue
  beforeEach(() => {
    queue = []
    globalThis.requestAnimationFrame = (fn) => { queue.push(fn); return queue.length }
    globalThis.cancelAnimationFrame = vi.fn()
  })
  afterEach(() => { vi.restoreAllMocks() })

  // Drain one queued RAF callback.
  const tick = () => { const fn = queue.shift(); if (fn) fn() }

  test('invokes the callback each frame and auto-stops after ~1200ms', () => {
    let clock = 1000
    const now = vi.spyOn(Utils, 'now').mockImplementation(() => clock)
    const cb = vi.fn()
    const fa = new FrameAnimation(cb)        // t0 = 1000
    // Drive ~80ms frames (gap < 100 so none are skipped) until it auto-stops.
    for (let guard = 0; guard < 100 && fa.running; guard++) {
      clock += 80
      tick()
    }
    expect(fa.running).toBe(false)            // auto-stopped past t0 + 1200ms
    // ~ (1200 / 80) frames ran the callback before the deadline
    expect(cb.mock.calls.length).toBeGreaterThanOrEqual(10)
    expect(cb.mock.calls.length).toBeLessThanOrEqual(16)
    now.mockRestore()
  })

  test('skips a frame if the previous one took too long (tab was hidden)', () => {
    const now = vi.spyOn(Utils, 'now').mockReturnValue(1000)
    const cb = vi.fn()
    new FrameAnimation(cb)
    now.mockReturnValue(1200)                 // gap > 100ms → skip, no cb, keep looping
    tick()
    expect(cb).not.toHaveBeenCalled()
    expect(queue.length).toBe(1)              // rescheduled
  })

  test('stop() halts the loop and cancels the pending frame', () => {
    vi.spyOn(Utils, 'now').mockReturnValue(1000)
    const fa = new FrameAnimation(vi.fn())
    fa.stop()
    expect(fa.running).toBe(false)
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()
    expect(fa.rafId).toBeNull()
  })
})

describe('Line primitive', () => {
  function mkLine({ ray = false } = {}) {
    const ops = []
    const ctx = { moveTo: (...a) => ops.push(['moveTo', ...a]), lineTo: (...a) => ops.push(['lineTo', ...a]) }
    const collisions = []
    const overlay = {
      collisions,
      $props: { config: { TOOL_COLL: 7 }, layout: { width: 100, height: 80, t2screen: (t) => t, $2screen: ($) => $ } },
    }
    const line = new Line(overlay, ctx)
    line.ray = ray
    return { line, ctx, ops, collisions }
  }

  test('draw moves/lines through both endpoints and registers a collision fn', () => {
    const { line, ops, collisions } = mkLine()
    line.draw([0, 0], [40, 30])
    expect(ops.some(o => o[0] === 'moveTo')).toBe(true)
    expect(ops.some(o => o[0] === 'lineTo')).toBe(true)
    expect(collisions).toHaveLength(1)
    expect(typeof collisions[0]).toBe('function')
  })

  test('the collision fn is true near the segment, false far away', () => {
    const { line } = mkLine()
    line.draw([0, 0], [100, 0]) // horizontal segment along y=0
    const hit = line.comp.collisions[0]
    expect(hit(50, 1)).toBe(true)     // 1px off → within TOOL_COLL (7)
    expect(hit(50, 50)).toBe(false)   // far
  })

  test('ray mode only extends forward (one tail drawn)', () => {
    const { line, ops } = mkLine({ ray: true })
    line.draw([10, 10], [60, 40])
    // ray: moveTo p1, lineTo p2, then moveTo p2 + extend — but NOT the backward tail
    const moveTos = ops.filter(o => o[0] === 'moveTo')
    expect(moveTos.length).toBe(2) // non-ray would have 3
  })
})
