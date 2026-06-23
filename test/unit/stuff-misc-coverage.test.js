// stuff small utils: smart_wheel/format_name/maxAtIndex/default_prevented,
// rafThrottle, Mouse, Keys, ObjectPool, gestures loader.
//
// Pure-node coverage for the grab-bag helpers in src/stuff/*. These are the
// edge/error branches not exercised by stuff-utils.test.js / metrics.test.js:
//   - smart_wheel large-delta compression (sign-preserving log)
//   - format_name global token replace + the no-name / no-settings paths
//   - strip / add_zero / get_year / get_month / maxAtIndex / minAtIndex /
//     default_prevented (wrapped vs plain)
//   - rafThrottle frame-coalescing, this-binding, reschedule + cancel (RAF is
//     injected, never the real browser scheduler — deterministic)
//   - Mouse / Keys listener registries + emit side effects (layout injected)
//   - ObjectPool reuse / drain-fallback / reset-on-release + the preset pools
//   - the lazy gesture loader's caching / interop / retry-after-reject path
//     (hammerjs/hamsterjs are vi.doMock'd so nothing touches `window`)
import {
  test, expect, describe, vi, beforeEach, afterEach,
} from 'vitest'
import Utils from '../../src/stuff/utils.js'
import Mouse from '../../src/stuff/mouse.js'
import Keys from '../../src/stuff/keys.js'
import {
  ObjectPool, createCursorEventPool, createRangeArrayPool,
} from '../../src/stuff/pool.js'
import RenderMetrics from '../../src/stuff/metrics.js'

describe('utils: smart_wheel', () => {
  test('passes small deltas (|delta| <= 500) through unchanged', () => {
    expect(Utils.smart_wheel(0)).toBe(0)
    expect(Utils.smart_wheel(500)).toBe(500)
    expect(Utils.smart_wheel(-500)).toBe(-500)
    expect(Utils.smart_wheel(-200)).toBe(-200)
  })

  test('compresses large deltas via (200 + log|x|) * sign, sign preserved', () => {
    expect(Utils.smart_wheel(1000)).toBeCloseTo(200 + Math.log(1000), 10)
    // negative large delta keeps its sign
    expect(Utils.smart_wheel(-1000)).toBeCloseTo(-(200 + Math.log(1000)), 10)
    expect(Utils.smart_wheel(-1000)).toBeLessThan(0)
  })
})

describe('utils: format_name + small helpers', () => {
  test('format_name substitutes every $key token (global, repeated tokens)', () => {
    // both occurrences of $a are replaced; $b too
    expect(Utils.format_name({ name: 'X $a $a $b', settings: { a: 1, b: 2 } }))
      .toBe('X 1 1 2')
  })

  test('format_name returns undefined when ov.name is missing', () => {
    expect(Utils.format_name({ settings: { a: 1 } })).toBeUndefined()
  })

  test('format_name returns the raw name when there are no settings', () => {
    expect(Utils.format_name({ name: 'hi' })).toBe('hi')
  })

  test('strip collapses float noise (0.1 + 0.2 -> 0.3)', () => {
    expect(Utils.strip(0.1 + 0.2)).toBe(0.3)
    expect(Utils.strip(0.1 * 3)).toBe(0.3)        // 0.30000000000000004 -> 0.3
    expect(Utils.strip(1.005 * 100)).toBe(100.5)  // 100.49999999999999 -> 100.5
  })

  test('add_zero pads single digits, leaves >= 10 alone', () => {
    expect(Utils.add_zero(5)).toBe('05')
    expect(Utils.add_zero(9)).toBe('09')
    expect(Utils.add_zero(12)).toBe(12)
  })

  test('get_year / get_month read UTC, return undefined on falsy input', () => {
    const T = Date.UTC(2026, 5, 17, 13, 45) // June (month index 5)
    expect(Utils.get_year(T)).toBe(2026)
    expect(Utils.get_month(T)).toBe(5)
    expect(Utils.get_year(0)).toBeUndefined()
    expect(Utils.get_month(null)).toBeUndefined()
  })

  test('maxAtIndex / minAtIndex scan the chosen column, +/-Infinity on empty', () => {
    const rows = [[1, 2, 3], [4, 5, 6], [7, 0, 9]]
    expect(Utils.maxAtIndex(rows, 1)).toBe(5)
    expect(Utils.minAtIndex(rows, 1)).toBe(0)
    expect(Utils.maxAtIndex(rows, 0)).toBe(7)
    expect(Utils.maxAtIndex([], 1)).toBe(-Infinity)
    expect(Utils.minAtIndex([], 1)).toBe(Infinity)
    expect(Utils.maxAtIndex(null, 0)).toBe(-Infinity)
  })

  test('default_prevented reads event.original when wrapped, else event itself', () => {
    // wrapped: prefers .original.defaultPrevented over the top-level one
    expect(Utils.default_prevented({
      original: { defaultPrevented: true }, defaultPrevented: false,
    })).toBe(true)
    expect(Utils.default_prevented({
      original: { defaultPrevented: false }, defaultPrevented: true,
    })).toBe(false)
    // unwrapped: reads the event's own flag
    expect(Utils.default_prevented({ defaultPrevented: true })).toBe(true)
    expect(Utils.default_prevented({ defaultPrevented: false })).toBe(false)
  })
})

describe('utils: rafThrottle (injected RAF, deterministic)', () => {
  let pending
  let nextId
  beforeEach(() => {
    pending = null
    nextId = 0
    vi.stubGlobal('requestAnimationFrame', (cb) => { pending = cb; return ++nextId })
    vi.stubGlobal('cancelAnimationFrame', (id) => { if (id === nextId) pending = null })
  })
  afterEach(() => { vi.unstubAllGlobals() })

  const flush = () => { const cb = pending; pending = null; if (cb) cb() }

  test('coalesces calls within a frame to one invocation with the LAST args', () => {
    const seen = []
    const t = Utils.rafThrottle((...a) => seen.push(a))
    t(1); t(2); t(3)
    expect(seen).toHaveLength(0)   // nothing until the frame fires
    flush()
    expect(seen).toEqual([[3]])    // single call, last args win
  })

  test('applies fn with the calling `this` context', () => {
    let ctx = null
    const obj = { tag: 'me', go: Utils.rafThrottle(function () { ctx = this }) }
    obj.go()
    flush()
    expect(ctx).toBe(obj)
    expect(ctx.tag).toBe('me')
  })

  test('a call after the frame fires schedules a NEW frame', () => {
    const seen = []
    const t = Utils.rafThrottle((x) => seen.push(x))
    t('a')
    flush()
    expect(seen).toEqual(['a'])
    // rafId was reset to null inside the frame, so this schedules afresh
    t('b')
    expect(typeof pending).toBe('function')
    flush()
    expect(seen).toEqual(['a', 'b'])
  })

  test('cancel() aborts a pending frame; a later call reschedules', () => {
    const seen = []
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame')
    const t = Utils.rafThrottle((x) => seen.push(x))
    t('x')
    t.cancel()
    expect(cancelSpy).toHaveBeenCalledTimes(1)
    flush()                 // nothing pending -> fn never runs
    expect(seen).toEqual([])
    // after cancel, rafId is null again, so a new call reschedules
    t('y')
    flush()
    expect(seen).toEqual(['y'])
    cancelSpy.mockRestore()
  })
})

describe('Mouse', () => {
  const makeComp = () => ({
    $props: { cursor: { x: 11, y: 22, t: 33, y$: 44 } },
    layout: { screen2t: (x) => x * 10, screen2$: (y) => y + 1000 },
  })

  test('constructor seeds x/y/t/y$ from comp.$props.cursor', () => {
    const m = new Mouse(makeComp())
    expect([m.x, m.y, m.t, m.y$]).toEqual([11, 22, 33, 44])
    expect(m.listeners).toBe(0)
    expect(m.pressed).toBe(false)
  })

  test('on() registers/increments, ignores falsy handler, honors dir', () => {
    const m = new Mouse(makeComp())
    const order = []
    m.on('mousemove', () => order.push('a'))              // default unshift
    m.on('mousemove', () => order.push('b'), 'push')      // append
    m.on('mousemove', () => order.push('c'))              // unshift -> front
    m.on('mousemove', null)                               // ignored, no count
    expect(m.listeners).toBe(3)
    m.emit('mousemove', { layerX: 0, layerY: 0 })
    expect(order.join('')).toBe('cab')                    // c (front), a, b (back)
  })

  test('emit(mousemove) sets x/y from layerX/Y and t/y$ from layout', () => {
    const m = new Mouse(makeComp())
    m.emit('mousemove', { layerX: 5, layerY: 7 })
    expect(m.x).toBe(5)
    expect(m.y).toBe(7)
    expect(m.t).toBe(50)     // screen2t(5)
    expect(m.y$).toBe(1007)  // screen2$(7)
  })

  test('mousedown / mouseup toggle pressed', () => {
    const m = new Mouse(makeComp())
    m.emit('mousedown', {})
    expect(m.pressed).toBe(true)
    m.emit('mouseup', {})
    expect(m.pressed).toBe(false)
  })

  test('off() removes/decrements; no-ops on unknown name/handler (no negative count)', () => {
    const m = new Mouse(makeComp())
    const h = () => {}
    m.on('click', h)
    expect(m.listeners).toBe(1)
    m.off('nope', h)         // unknown name
    m.off('click', () => {}) // unknown handler
    expect(m.listeners).toBe(1)
    m.off('click', h)        // real removal
    expect(m.listeners).toBe(0)
    expect(m.map.click).toEqual([])
  })

  test('emit() is a no-op for a name with no handlers', () => {
    const m = new Mouse(makeComp())
    expect(() => m.emit('whatever', { foo: 1 })).not.toThrow()
    // no mutation of cursor state for a non-special event
    expect([m.x, m.y]).toEqual([11, 22])
  })
})

describe('Keys', () => {
  test('on/off register and increment/decrement listeners; ignores falsy handler', () => {
    const k = new Keys({})
    const h = () => {}
    k.on('keydown', h)
    k.on('keydown', null)        // ignored
    expect(k.listeners).toBe(1)
    k.off('keydown', h)
    expect(k.listeners).toBe(0)
    k.off('keydown', h)          // already gone -> no-op
    expect(k.listeners).toBe(0)
  })

  test('keydown fires handlers + a synthetic key event the FIRST time, then pressed()', () => {
    const k = new Keys({})
    const fired = []
    k.on('keydown', (e) => fired.push('kd:' + e.key))
    k.on('a', () => fired.push('synthetic-a'))
    k.emit('keydown', { key: 'a' })
    expect(fired).toEqual(['kd:a', 'synthetic-a'])
    expect(k.pressed('a')).toBe(true)
  })

  test('a held key does NOT re-emit the synthetic event', () => {
    const k = new Keys({})
    const fired = []
    k.on('keydown', (e) => fired.push('kd:' + e.key))
    k.on('a', () => fired.push('synthetic-a'))
    k.emit('keydown', { key: 'a' })
    fired.length = 0
    k.emit('keydown', { key: 'a' }) // still held
    expect(fired).toEqual(['kd:a']) // no synthetic-a second time
  })

  test('keyup clears the key so a later keydown re-fires the synthetic event', () => {
    const k = new Keys({})
    const fired = []
    k.on('keydown', (e) => fired.push('kd:' + e.key))
    k.on('a', () => fired.push('synthetic-a'))
    k.emit('keydown', { key: 'a' })
    k.emit('keyup', { key: 'a' })
    expect(k.pressed('a')).toBe(false)
    fired.length = 0
    k.emit('keydown', { key: 'a' })
    expect(fired).toEqual(['kd:a', 'synthetic-a'])
  })

  test('pressed() is falsy for an unseen key', () => {
    const k = new Keys({})
    expect(k.pressed('z')).toBeFalsy()
  })
})

describe('ObjectPool', () => {
  test('pre-allocates initialSize via the factory', () => {
    let made = 0
    const p = new ObjectPool(() => ({ id: ++made }), null, 3)
    expect(p.pool).toHaveLength(3)
    expect(made).toBe(3)
  })

  test('acquire() reuses pooled objects (LIFO) then falls back to the factory', () => {
    let made = 0
    const p = new ObjectPool(() => ({ id: ++made }), null, 3)
    const a = p.acquire()
    const b = p.acquire()
    const c = p.acquire()
    expect([a.id, b.id, c.id]).toEqual([3, 2, 1]) // popped from the end
    expect(p.pool).toHaveLength(0)
    const d = p.acquire()                          // drained -> factory
    expect(d.id).toBe(4)
    expect(made).toBe(4)
  })

  test('release runs the reset callback before re-pooling (stale fields cleared)', () => {
    const p = new ObjectPool(() => ({ v: 0 }), (o) => { o.v = 0 }, 0)
    const obj = { v: 99 }
    p.release(obj)
    expect(p.pool).toHaveLength(1)
    expect(p.pool[0].v).toBe(0)   // reset ran
    expect(p.acquire()).toBe(obj) // same instance recycled
  })

  test('a no-reset pool still re-pools the object as-is', () => {
    const p = new ObjectPool(() => ({ v: 1 }), null, 0)
    const x = { v: 9 }
    p.release(x)
    expect(p.pool).toEqual([{ v: 9 }])
  })

  test('clear() empties the pool', () => {
    const p = new ObjectPool(() => ({}), null, 5)
    expect(p.pool).toHaveLength(5)
    p.clear()
    expect(p.pool).toHaveLength(0)
  })

  test('createCursorEventPool yields {grid_id,x,y,mode:undefined}; reset restores all four', () => {
    const cp = createCursorEventPool()
    const ev = cp.acquire()
    expect(Object.keys(ev).sort()).toEqual(['grid_id', 'mode', 'x', 'y'])
    expect(ev).toEqual({ grid_id: undefined, x: undefined, y: undefined, mode: undefined })
    ev.grid_id = 1; ev.x = 2; ev.y = 3; ev.mode = 'cross'
    cp.release(ev)
    expect(ev).toEqual({ grid_id: undefined, x: undefined, y: undefined, mode: undefined })
  })

  test('createRangeArrayPool yields [0,0]; reset restores both slots', () => {
    const rp = createRangeArrayPool()
    const r = rp.acquire()
    expect(r).toEqual([0, 0])
    r[0] = 5; r[1] = 6
    rp.release(r)
    expect(r).toEqual([0, 0])
  })
})

describe('gestures: lazy loader (hammerjs/hamsterjs mocked)', () => {
  beforeEach(() => { vi.resetModules() })
  afterEach(() => {
    vi.doUnmock('hammerjs')
    vi.doUnmock('hamsterjs')
    vi.resetModules()
  })

  test('loadedGestures() is null before resolution; loadGestures caches + unwraps hamster .default', async () => {
    vi.doMock('hammerjs', () => ({ Manager: function () {}, Pan: function () {} }))
    vi.doMock('hamsterjs', () => ({ default: { isHamster: true } }))
    const g = await import('../../src/stuff/gestures.js')
    expect(g.loadedGestures()).toBe(null)         // nothing loaded yet
    const res = await g.loadGestures()
    expect(typeof res.Hammer.Manager).toBe('function')
    expect(res.Hamster).toEqual({ isHamster: true }) // .default unwrapped
    // second call returns the SAME cached object (no re-import)
    const res2 = await g.loadGestures()
    expect(res2).toBe(res)
    expect(g.loadedGestures()).toBe(res)
  })

  test('hamster plain (no .default) branch is returned as-is', async () => {
    vi.doMock('hammerjs', () => ({ Manager: function () {} }))
    vi.doMock('hamsterjs', () => ({ wheel: function () {}, default: undefined }))
    const g = await import('../../src/stuff/gestures.js')
    const res = await g.loadGestures()
    expect(typeof res.Hamster.wheel).toBe('function')
  })

  test('a rejected load clears the in-flight promise so a later call retries', async () => {
    let calls = 0
    vi.doMock('hammerjs', () => {
      calls++
      if (calls === 1) throw new Error('boom') // first import fails
      return { Manager: function () {} }
    })
    vi.doMock('hamsterjs', () => ({ default: {} }))
    const g = await import('../../src/stuff/gestures.js')
    await expect(g.loadGestures()).rejects.toThrow()
    expect(g.loadedGestures()).toBe(null)     // .catch cleared in-flight, nothing cached
    const res = await g.loadGestures()        // retry succeeds
    expect(typeof res.Hammer.Manager).toBe('function')
    expect(g.loadedGestures()).toBe(res)
  })
})

describe('metrics: single-frame snapshot', () => {
  test('one frame reports fps 0 (span === 0) and p50 === p95 === p99 === max', () => {
    const m = new RenderMetrics()
    m.begin()
    m.drawCall(3)
    m.end()
    const s = m.snapshot()
    expect(s.frames).toBe(1)
    expect(s.fps).toBe(0)              // single stamp -> span 0 -> fps 0
    expect(s.avgDrawCalls).toBe(3)
    expect(s.p50).toBe(s.p95)
    expect(s.p95).toBe(s.p99)
    expect(s.p99).toBe(s.max)
  })
})
