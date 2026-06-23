// @vitest-environment jsdom
// PanManager momentum (pan_fade/stopFade/destroy) + ZoomManager deep branches
// (trackpad flags, click-gate, dpr CSS-width anchor, ZOOM_MODE='tl' rezoom-range,
// preventDefault). Complements pan-zoom-managers.test.js (basic math) by driving
// the FrameAnimation loop deterministically and exercising the edge guards.
import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'
import PanManager from '../../src/components/js/grid/pan-manager.js'
import ZoomManager from '../../src/components/js/grid/zoom-manager.js'
import Utils from '../../src/stuff/utils.js'

// --- Controllable rAF: capture each scheduled callback so the test can drive
// frames one at a time (no real timers / no real clock). ---
let rafQueue
let rafCancelled

function driveFrame() {
  // Pull the most recently scheduled callback and run it. FrameAnimation
  // schedules the next frame from inside the callback, so after running one the
  // queue holds the follow-up (or nothing if self.stop() was called).
  const cb = rafQueue.pop()
  rafQueue.length = 0 // only ever one pending frame at a time
  if (cb) cb()
}

beforeEach(() => {
  rafQueue = []
  rafCancelled = []
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    rafQueue.push(cb)
    return rafQueue.length // non-null id
  })
  vi.stubGlobal('cancelAnimationFrame', (id) => { rafCancelled.push(id) })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function mkGrid(over = {}) {
  const emits = []
  return Object.assign({
    emits,
    range: [10_000, 20_000],
    data: new Array(100).fill(0),
    layout: {
      width: 500, height: 300,
      $_hi: 110, $_lo: 90,
      A: -3, B: 330,
      grid: { logScale: false },
    },
    interval: 60_000,
    canvas: { width: 1000, height: 600, clientWidth: 500, clientHeight: 300 },
    comp: { $emit: (ev, p) => emits.push([ev, p]) },
    $p: { y_transform: null, meta: { activated: true }, config: {} },
    id: 0,
    drug: null,
    pinch: null,
    trackpad: false,
    wmode: 'pass',
    MIN_ZOOM: 10,
    MAX_ZOOM: 1000,
    change_range: vi.fn(),
  }, over)
}

describe('PanManager.pan_fade momentum', () => {
  test('fresh drug schedules a FrameAnimation; each frame shifts BOTH edges by the decaying velocity', () => {
    // Pin the clock so FrameAnimation's t0/t == now (no skip, no 1200ms stop).
    vi.spyOn(Utils, 'now').mockReturnValue(1_000)
    const grid = mkGrid()
    // drug.t0 = 600 → dt = now(1000) - 600 = 400 (<=500, so not a no-op)
    // drug.r[1] = 19_900 → dx = range[1](20000) - 19900 = 100 → v = 42*100/400 = 10.5
    grid.drug = { t0: 600, r: [10_000, 19_900] }
    const pm = new PanManager(grid)

    pm.pan_fade({})

    // FrameAnimation constructed → scheduled a frame, none run yet.
    expect(pm.fade).toBeTruthy()
    expect(rafQueue.length).toBe(1)
    expect(grid.change_range).not.toHaveBeenCalled()

    const before = grid.range.slice()
    driveFrame() // first frame: v decays to 10.5 * 0.85 = 8.925
    const v1 = 10.5 * 0.85
    expect(grid.range[0]).toBeCloseTo(before[0] + v1, 6)
    expect(grid.range[1]).toBeCloseTo(before[1] + v1, 6)
    expect(grid.change_range).toHaveBeenCalledTimes(1)
  })

  test('no-op when dt = now - drug.t0 > 500ms (no FrameAnimation, no change_range)', () => {
    vi.spyOn(Utils, 'now').mockReturnValue(2_000)
    const grid = mkGrid()
    grid.drug = { t0: 1_000, r: [10_000, 19_900] } // dt = 1000 > 500
    const pm = new PanManager(grid)

    pm.pan_fade({})

    expect(pm.fade).toBeNull()
    expect(rafQueue.length).toBe(0)
    expect(grid.change_range).not.toHaveBeenCalled()
  })

  test('no-op when grid.drug is null', () => {
    vi.spyOn(Utils, 'now').mockReturnValue(1_000)
    const grid = mkGrid({ drug: null })
    const pm = new PanManager(grid)

    pm.pan_fade({})

    expect(pm.fade).toBeNull()
    expect(rafQueue.length).toBe(0)
    expect(grid.change_range).not.toHaveBeenCalled()
  })

  test('velocity decays by 0.85/frame and self.stop()s once |v| < v0 (|v*0.01|)', () => {
    vi.spyOn(Utils, 'now').mockReturnValue(1_000)
    const grid = mkGrid()
    // v0 = |v * 0.01| where v is the INITIAL velocity. v decays by 0.85 each
    // frame; |v| < v0 first holds after k frames where 0.85^k < 0.01,
    // i.e. k = ceil(log(0.01)/log(0.85)) = 29.
    grid.drug = { t0: 600, r: [10_000, 19_900] } // v=10.5, v0=0.105
    const pm = new PanManager(grid)
    pm.pan_fade({})

    let v = 10.5
    const v0 = Math.abs(v * 0.01)
    let frames = 0
    // Drive until the animation stops (queue drains) or a safety bound.
    while (rafQueue.length && frames < 100) {
      v *= 0.85
      driveFrame()
      frames++
      if (Math.abs(v) < v0) break
    }
    // After the stopping frame, the loop scheduled nothing further.
    expect(pm.fade.running).toBe(false)
    expect(rafQueue.length).toBe(0)
    // 0.85^29 < 0.01 <= 0.85^28 → stops on the 29th frame.
    expect(frames).toBe(29)

    // Once stopped, further driveFrame attempts are no-ops (nothing scheduled),
    // so change_range count is frozen at exactly `frames`.
    const calls = grid.change_range.mock.calls.length
    expect(calls).toBe(frames)
  })

  test('pan_fade stops a previously-running fade before starting a new one', () => {
    vi.spyOn(Utils, 'now').mockReturnValue(1_000)
    const grid = mkGrid()
    grid.drug = { t0: 600, r: [10_000, 19_900] }
    const pm = new PanManager(grid)

    pm.pan_fade({})
    const first = pm.fade
    expect(first.running).toBe(true)

    pm.pan_fade({}) // should stop `first` and install a new one
    expect(first.running).toBe(false)
    expect(pm.fade).not.toBe(first)
    expect(pm.fade.running).toBe(true)
  })
})

describe('PanManager.stopFade / destroy', () => {
  test('stopFade() stops an active fade', () => {
    vi.spyOn(Utils, 'now').mockReturnValue(1_000)
    const grid = mkGrid()
    grid.drug = { t0: 600, r: [10_000, 19_900] }
    const pm = new PanManager(grid)
    pm.pan_fade({})
    const fade = pm.fade
    expect(fade.running).toBe(true)

    pm.stopFade()
    expect(fade.running).toBe(false)
    expect(pm.fade).toBe(fade) // stopFade does NOT null the ref
  })

  test('stopFade() is a safe no-op when this.fade is null', () => {
    const pm = new PanManager(mkGrid())
    expect(pm.fade).toBeNull()
    expect(() => pm.stopFade()).not.toThrow()
    expect(pm.fade).toBeNull()
  })

  test('destroy() stops the fade and nulls this.fade', () => {
    vi.spyOn(Utils, 'now').mockReturnValue(1_000)
    const grid = mkGrid()
    grid.drug = { t0: 600, r: [10_000, 19_900] }
    const pm = new PanManager(grid)
    pm.pan_fade({})
    const fade = pm.fade
    expect(fade.running).toBe(true)

    pm.destroy()
    expect(fade.running).toBe(false)
    expect(pm.fade).toBeNull()
  })
})

describe('PanManager.mousedrag log-scale auto guard', () => {
  test('log-scale branch with drug.y_r but y_transform.auto=true does NOT emit sidebar-transform', () => {
    const grid = mkGrid({ $p: { y_transform: { auto: true }, meta: {}, config: {} } })
    grid.layout.grid.logScale = true
    grid.drug = { x: 250, y: 150, t: 10_000, r: [10_000, 20_000], o: 0, y_r: [110, 90], B: 330 }
    const pm = new PanManager(grid)

    pm.mousedrag(250, 100)

    // The !auto guard blocks the emit even though the log-scale range was computed.
    const st = grid.emits.find(e => e[0] === 'sidebar-transform')
    expect(st).toBeUndefined()
    // x-range still updates and change_range still fires.
    expect(grid.change_range).toHaveBeenCalled()
  })
})

describe('ZoomManager click-gate', () => {
  function wheelEvent(deltaY, opts = {}) {
    const pdOrig = vi.fn()
    const pdEvt = vi.fn()
    return {
      deltaX: 0, deltaY, preventDefault: pdEvt,
      originalEvent: Object.assign({
        preventDefault: pdOrig, ctrlKey: false, offsetX: 250, offsetY: 150,
        deltaX: 0, deltaY,
      }, opts),
      _pdOrig: pdOrig, _pdEvt: pdEvt,
    }
  }

  test("wmode='click' with meta.activated=false: returns immediately, range unchanged, no change_range, no preventDefault", () => {
    const grid = mkGrid({
      wmode: 'click',
      $p: { y_transform: null, meta: { activated: false }, config: {} },
    })
    const zm = new ZoomManager(grid)
    const before = grid.range.slice()
    const ev = wheelEvent(100)

    zm.mousezoom(100, ev)

    expect(grid.range).toEqual(before)
    expect(grid.change_range).not.toHaveBeenCalled()
    expect(ev._pdOrig).not.toHaveBeenCalled()
    expect(ev._pdEvt).not.toHaveBeenCalled()
  })
})

describe('ZoomManager trackpad branch', () => {
  function wheelEvent(deltaX, deltaY, opts = {}) {
    return {
      deltaX, deltaY,
      originalEvent: Object.assign({
        preventDefault() {}, ctrlKey: false, offsetX: 250, offsetY: 150,
        deltaX, deltaY,
      }, opts),
      preventDefault() {},
    }
  }

  test('deltaX>0 sets grid.trackpad=true, scales delta by 0.1 when |deltaX|>=|deltaY|, pans via trackpad_scroll', () => {
    const grid = mkGrid({ trackpad: false })
    const zm = new ZoomManager(grid)
    const spyScroll = vi.spyOn(zm, 'trackpad_scroll')
    const ev = wheelEvent(10, 5) // |deltaX|(10) >= |deltaY|(5)

    const before = grid.range.slice()
    zm.mousezoom(100, ev)

    expect(grid.trackpad).toBe(true)
    expect(spyScroll).toHaveBeenCalledTimes(1)
    // trackpad_scroll panned BOTH edges by deltaX*dt*0.011 (dt = 10000).
    const shift = 10 * 10_000 * 0.011
    // The subsequent zoom math also moves range[0]; assert the trackpad pan
    // happened by checking range[1] (only touched by trackpad_scroll here, since
    // it's not ctrl/tl so the default branch only moves range[0]).
    expect(grid.range[1]).toBeCloseTo(before[1] + shift, 6)
    expect(grid.change_range).toHaveBeenCalled()
  })

  test('when grid.trackpad already true, delta is multiplied by 0.032 before smart_wheel (default-branch left-edge shrinks more)', () => {
    // No deltaX (so the deltaX>0 branch is skipped) but trackpad pre-set true →
    // exercises the standalone `if (this.grid.trackpad) delta *= 0.032`.
    const gridOn = mkGrid({ trackpad: true })
    const gridOff = mkGrid({ trackpad: false })
    const zmOn = new ZoomManager(gridOn)
    const zmOff = new ZoomManager(gridOff)

    zmOn.mousezoom(100, wheelEvent(0, 100))
    zmOff.mousezoom(100, wheelEvent(0, 100))

    // delta=100, k=interval/1000=60, len=100.
    // trackpad ON: delta=100*0.032=3.2 → diff=3.2*60*100=19200 → range[0]-=19200
    // trackpad OFF: delta=100 → diff=100*60*100=600000 → range[0]-=600000
    expect(gridOn.range[0]).toBeCloseTo(10_000 - 3.2 * 60 * 100, 4)
    expect(gridOff.range[0]).toBeCloseTo(10_000 - 100 * 60 * 100, 4)
    // The 0.032 scaling makes the ON shift strictly smaller in magnitude.
    expect(Math.abs(10_000 - gridOn.range[0])).toBeLessThan(
      Math.abs(10_000 - gridOff.range[0])
    )
  })
})

describe('ZoomManager ctrl-zoom DPR anchor (CSS width, not canvas.width)', () => {
  test('uses clientWidth=500 (not canvas.width=1000): offsetX at left edge → diff1~=0, right edge takes nearly the whole delta', () => {
    const grid = mkGrid()
    grid.canvas = { width: 1000, height: 600, clientWidth: 500, clientHeight: 300 }
    const zm = new ZoomManager(grid)
    const before = grid.range.slice()
    const ev = {
      deltaX: 0, deltaY: 100, preventDefault() {},
      originalEvent: { preventDefault() {}, ctrlKey: true, offsetX: 0, offsetY: 0, deltaX: 0, deltaY: 100 },
    }

    zm.mousezoom(100, ev)

    // delta=100 (trackpad false, no deltaX), diff = 100*60*100 = 600000.
    // w = clientWidth(500). offset=0 → diff1 = 0/(500-1)*diff = 0.
    // diff2 = diff - 0 = diff. range[0] -= 0 ; range[1] += diff.
    const diff = 100 * 60 * 100
    expect(grid.range[0]).toBeCloseTo(before[0], 6)      // diff1 ~= 0
    expect(grid.range[1]).toBeCloseTo(before[1] + diff, 6) // right edge took it all
    // Sanity: had the buggy canvas.width(1000) been used, diff1 would still be 0
    // here, so additionally prove the CSS width is what divides by checking a
    // mid-canvas offset splits at the CSS-width midpoint (offsetX=250 of 500).
    const grid2 = mkGrid()
    grid2.canvas = { width: 1000, height: 600, clientWidth: 500, clientHeight: 300 }
    const zm2 = new ZoomManager(grid2)
    const b2 = grid2.range.slice()
    zm2.mousezoom(100, {
      deltaX: 0, deltaY: 100, preventDefault() {},
      originalEvent: { preventDefault() {}, ctrlKey: true, offsetX: 250, offsetY: 0, deltaX: 0, deltaY: 100 },
    })
    // offsetX=250 / (clientWidth500 - 1) ~= 0.501 of diff to the left edge.
    const frac = 250 / (500 - 1)
    expect(grid2.range[0]).toBeCloseTo(b2[0] - frac * diff, 4)
    expect(grid2.range[1]).toBeCloseTo(b2[1] + (diff - frac * diff), 4)
  })
})

describe("ZoomManager ZOOM_MODE='tl'", () => {
  test('ctrl-style x-split happens AND a rezoom-range event is emitted with {grid_id,z,diff1,diff2} from offsetY/clientHeight', () => {
    const grid = mkGrid({
      id: 7,
      $p: { y_transform: null, meta: { activated: true }, config: { ZOOM_MODE: 'tl' } },
    })
    grid.canvas = { width: 1000, height: 600, clientWidth: 500, clientHeight: 300 }
    const zm = new ZoomManager(grid)
    const before = grid.range.slice()
    const ev = {
      deltaX: 0, deltaY: 100, preventDefault() {},
      originalEvent: { preventDefault() {}, ctrlKey: false, offsetX: 250, offsetY: 150, deltaX: 0, deltaY: 100 },
    }

    zm.mousezoom(100, ev)

    const diff = 100 * 60 * 100 // delta(100)*k(60)*len(100); trackpad false
    // x-split (tl forces the ctrl-style branch even without ctrlKey):
    const xfrac = 250 / (500 - 1)
    expect(grid.range[0]).toBeCloseTo(before[0] - xfrac * diff, 3)
    expect(grid.range[1]).toBeCloseTo(before[1] + (diff - xfrac * diff), 3)

    const rz = grid.emits.find(e => e[0] === 'rezoom-range')
    expect(rz).toBeTruthy()
    const p = rz[1]
    expect(p.grid_id).toBe(7)
    // diff1 = offsetY / (clientHeight-1) * 2 ; diff2 = 2 - diff1
    const d1 = 150 / (300 - 1) * 2
    expect(p.diff1).toBeCloseTo(d1, 6)
    expect(p.diff2).toBeCloseTo(2 - d1, 6)
    // z = diff / (range[1] - range[0]) computed AFTER the x-split.
    expect(p.z).toBeCloseTo(diff / (grid.range[1] - grid.range[0]), 6)
  })

  test('clientHeight falls back to canvas.height when 0/undefined (Math.max guard)', () => {
    const grid = mkGrid({
      id: 3,
      $p: { y_transform: null, meta: { activated: true }, config: { ZOOM_MODE: 'tl' } },
    })
    // clientHeight = 0 → `clientHeight || canvas.height` → 600.
    grid.canvas = { width: 1000, height: 600, clientWidth: 500, clientHeight: 0 }
    const zm = new ZoomManager(grid)
    const ev = {
      deltaX: 0, deltaY: 100, preventDefault() {},
      originalEvent: { preventDefault() {}, ctrlKey: false, offsetX: 250, offsetY: 300, deltaX: 0, deltaY: 100 },
    }

    zm.mousezoom(100, ev)

    const rz = grid.emits.find(e => e[0] === 'rezoom-range')
    expect(rz).toBeTruthy()
    // h falls back to canvas.height(600): diff1 = offsetY(300)/(600-1)*2.
    const d1 = 300 / (600 - 1) * 2
    expect(rz[1].diff1).toBeCloseTo(d1, 6)
    expect(rz[1].diff2).toBeCloseTo(2 - d1, 6)
  })
})

describe('ZoomManager preventDefault', () => {
  test("wmode!=='pass' (and not gated) calls preventDefault on BOTH originalEvent and event", () => {
    const grid = mkGrid({ wmode: 'click', $p: { y_transform: null, meta: { activated: true }, config: {} } })
    const zm = new ZoomManager(grid)
    const pdOrig = vi.fn()
    const pdEvt = vi.fn()
    const ev = {
      deltaX: 0, deltaY: 100, preventDefault: pdEvt,
      originalEvent: { preventDefault: pdOrig, ctrlKey: false, offsetX: 250, offsetY: 150, deltaX: 0, deltaY: 100 },
    }

    zm.mousezoom(100, ev)

    expect(pdOrig).toHaveBeenCalledTimes(1)
    expect(pdEvt).toHaveBeenCalledTimes(1)
  })

  test("wmode='pass' does NOT call preventDefault", () => {
    const grid = mkGrid({ wmode: 'pass' })
    const zm = new ZoomManager(grid)
    const pdOrig = vi.fn()
    const pdEvt = vi.fn()
    const ev = {
      deltaX: 0, deltaY: 100, preventDefault: pdEvt,
      originalEvent: { preventDefault: pdOrig, ctrlKey: false, offsetX: 250, offsetY: 150, deltaX: 0, deltaY: 100 },
    }

    zm.mousezoom(100, ev)

    expect(pdOrig).not.toHaveBeenCalled()
    expect(pdEvt).not.toHaveBeenCalled()
  })
})
