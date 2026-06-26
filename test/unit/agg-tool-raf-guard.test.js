// AggTool RAF-guard defense (F2, belt-and-braces alongside F1).
//
// AggTool._scheduleNextUpdate arms a setTimeout whose body calls
// requestAnimationFrame to sync the next tick with the render loop. If that
// timer ever outlives the DOM (e.g. RAF removed after jsdom teardown) or runs
// in a non-DOM context, an unguarded call would throw an unhandled
// "requestAnimationFrame is not defined". The guard turns that impossible-today
// case into a no-op (raf_id stays null) while staying observationally identical
// whenever RAF exists.
//
// Pure Node logic. Fake timers + explicit cleanup — no real-time waits, no
// leaked timers, RAF global fully restored after each test.
import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest'

import AggTool from '../../src/helpers/agg_tool.js'

const TF = 60_000

// Minimal DataCube-shaped stub: just enough for push()/update() to run.
function mkDc() {
  return {
    data: { chart: { data: [[0, 1, 2, 0, 1, 5]] } },
    merges: [],
    fast_merge(data, upd /*, main */) { data.push(upd); this.merges.push([data, upd]) },
    get_one() { return null },
    ww: { just: () => { /* event sink */ } },
  }
}

describe('AggTool — RAF guard (requestAnimationFrame absent)', () => {
  let raf, caf

  beforeEach(() => {
    // Fake timers so the source's self-rescheduling setTimeout/RAF can never
    // fire for real or leak across files.
    vi.useFakeTimers()
    raf = globalThis.requestAnimationFrame
    caf = globalThis.cancelAnimationFrame
    // cancelAnimationFrame is still needed by destroy(); keep it harmless.
    globalThis.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    globalThis.requestAnimationFrame = raf
    globalThis.cancelAnimationFrame = caf
  })

  test('orphaned timer with RAF removed → no throw, raf_id stays null', () => {
    // Simulate the impossible-today case: RAF gone (post-teardown / non-DOM).
    delete globalThis.requestAnimationFrame
    expect(typeof globalThis.requestAnimationFrame).toBe('undefined')

    const dc = mkDc()
    const agg = new AggTool(dc)

    // push() seeds a symbol and arms the bootstrap setTimeout → update().
    agg.push('ohlcv', [TF, 1, 2, 0, 1, 5], 60000)

    // Drive the whole scheduler: the bootstrap timer fires update(), which
    // (via _scheduleNextUpdate) arms the next setTimeout whose body would call
    // requestAnimationFrame. Advancing far enough runs that body. With RAF
    // absent, the guard must make it a no-op rather than throw.
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow()

    // Guard took the else-branch: raf_id explicitly null, never assigned a handle.
    expect(agg.raf_id).toBe(null)

    agg.destroy()
  })

  test('calling _scheduleNextUpdate directly with RAF removed is a no-op', () => {
    delete globalThis.requestAnimationFrame

    const dc = mkDc()
    const agg = new AggTool(dc)

    agg._scheduleNextUpdate()
    // The inner timer body is what touches RAF — advance past `int` to run it.
    expect(() => vi.advanceTimersByTime(500)).not.toThrow()
    expect(agg.raf_id).toBe(null)

    agg.destroy()
  })

  test('with RAF present the timer body sets raf_id from the handle', () => {
    // Observationally identical to the original behaviour when RAF exists.
    globalThis.requestAnimationFrame = vi.fn(() => 4242)

    const dc = mkDc()
    const agg = new AggTool(dc)

    agg._scheduleNextUpdate()
    vi.advanceTimersByTime(500)

    expect(globalThis.requestAnimationFrame).toHaveBeenCalledTimes(1)
    expect(agg.raf_id).toBe(4242)

    agg.destroy()
  })
})
