// @vitest-environment jsdom
// PanManager / ZoomManager — the chart-navigation math (previously ~2-10%
// covered). Driven through a fake grid facade exposing exactly the surface the
// managers consume.
import { test, expect, describe, vi } from 'vitest'
import PanManager from '../../src/components/js/grid/pan-manager.js'
import ZoomManager from '../../src/components/js/grid/zoom-manager.js'

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
    canvas: { width: 500, height: 300 },
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

describe('PanManager.mousedrag', () => {
  test('horizontal drag shifts the x-range proportionally to pixels moved', () => {
    const grid = mkGrid()
    grid.drug = { x: 250, y: 150, t: 10_000, r: [10_000, 20_000], o: 0, y_r: null }
    const pm = new PanManager(grid)
    // drag LEFT by 50px: dt = t * (drug.x - x)/width = 10000 * 50/500 = 1000
    pm.mousedrag(200, 150)
    expect(grid.range).toEqual([11_000, 21_000])
    expect(grid.change_range).toHaveBeenCalled()
  })

  test('vertical drag with a manual y-transform emits the shifted price range', () => {
    const grid = mkGrid({ $p: { y_transform: { auto: false }, meta: {}, config: {} } })
    grid.drug = { x: 250, y: 150, t: 10_000, r: [10_000, 20_000], o: 0, y_r: [110, 90] }
    const pm = new PanManager(grid)
    // drag DOWN 30px: d$ = ($_hi-$_lo) * (drug.y - y)/height = 20 * (-30)/300 = -2
    pm.mousedrag(250, 180)
    const st = grid.emits.find(e => e[0] === 'sidebar-transform')
    expect(st).toBeTruthy()
    expect(st[1].range).toEqual([112, 92]) // y_r - offset = y_r - (-2)
  })

  test('log-scale vertical drag converts through exp((y - B)/A) — no throw, finite', () => {
    const grid = mkGrid({ $p: { y_transform: { auto: false }, meta: {}, config: {} } })
    grid.layout.grid.logScale = true
    grid.drug = { x: 250, y: 150, t: 10_000, r: [10_000, 20_000], o: 0, y_r: [110, 90], B: 330 }
    const pm = new PanManager(grid)
    pm.mousedrag(250, 100)
    const st = grid.emits.find(e => e[0] === 'sidebar-transform')
    expect(st[1].range.every(Number.isFinite)).toBe(true)
    expect(st[1].range[0]).toBeGreaterThan(st[1].range[1]) // hi stays above lo
  })

  test('no active drug → no-op', () => {
    const grid = mkGrid()
    new PanManager(grid).mousedrag(1, 1)
    expect(grid.change_range).not.toHaveBeenCalled()
  })
})

describe('ZoomManager', () => {
  function wheelEvent(deltaY, opts = {}) {
    return {
      deltaX: 0, deltaY,
      originalEvent: Object.assign({
        preventDefault() {}, ctrlKey: false, offsetX: 250, offsetY: 150,
        deltaX: 0, deltaY,
      }, opts),
      preventDefault() {},
    }
  }

  test('wheel zoom-out extends the left edge only (default mode)', () => {
    const grid = mkGrid()
    const zm = new ZoomManager(grid)
    const before = grid.range.slice()
    zm.mousezoom(100, wheelEvent(100))
    expect(grid.range[1]).toBe(before[1])          // right edge anchored
    expect(grid.range[0]).toBeLessThan(before[0])  // window grew leftwards
    expect(grid.change_range).toHaveBeenCalled()
  })

  test('ctrl-zoom splits the delta around the pointer (both edges move)', () => {
    const grid = mkGrid()
    const zm = new ZoomManager(grid)
    const before = grid.range.slice()
    zm.mousezoom(100, wheelEvent(100, { ctrlKey: true }))
    expect(grid.range[0]).toBeLessThan(before[0])
    expect(grid.range[1]).toBeGreaterThan(before[1])
  })

  test('MIN/MAX zoom clamps: no range change beyond the limits', () => {
    const tooFewBars = mkGrid({ data: new Array(5).fill(0) }) // <= MIN_ZOOM
    new ZoomManager(tooFewBars).mousezoom(-100, wheelEvent(-100))
    expect(tooFewBars.range).toEqual([10_000, 20_000])
    const tooManyBars = mkGrid({ data: new Array(2000).fill(0) }) // > MAX_ZOOM
    new ZoomManager(tooManyBars).mousezoom(100, wheelEvent(100))
    expect(tooManyBars.range).toEqual([10_000, 20_000])
  })

  test('pinchzoom scales the window around the pinch anchor', () => {
    const grid = mkGrid()
    grid.pinch = { t: 10_000, r: [10_000, 20_000] }
    const zm = new ZoomManager(grid)
    zm.pinchzoom(2) // zoom IN 2x: nt = t/2 → window shrinks, split half per side
    expect(grid.range[0]).toBe(10_000 - (5000 - 10_000) * 0.5)
    expect(grid.range[1]).toBe(20_000 + (5000 - 10_000) * 0.5)
  })

  test('trackpad horizontal scroll pans both edges together', () => {
    const grid = mkGrid()
    const zm = new ZoomManager(grid)
    zm.trackpad_scroll({ deltaX: 10 })
    const shift = 10 * 10_000 * 0.011
    expect(grid.range[0]).toBeCloseTo(10_000 + shift, 6)
    expect(grid.range[1]).toBeCloseTo(20_000 + shift, 6)
  })
})
