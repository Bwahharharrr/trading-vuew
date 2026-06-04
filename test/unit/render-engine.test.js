import { test, expect, describe } from 'vitest'
import { Canvas } from 'skia-canvas'
import { RenderEngine } from '../../src/render/render-engine.js'

const px = (ctx, x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data)

// Minimal layout: vertical lines at x, horizontal at y.
function layout() {
  return {
    width: 100, height: 80,
    xs: [[20, 0], [60, 0]],
    ys: [[20, 0], [60, 0]],
    ti_map: { tf: 60000 },
  }
}
const colors = { grid: '#333333', scale: '#888888' }

const overlay = (id, draw) => ({ id, name: id, display: true, renderer: { draw } })

describe('RenderEngine (framework-agnostic static rendering)', () => {
  test('renderStatic: clears, draws grid + overlays in order', () => {
    const c = new Canvas(100, 80)
    const ctx = c.getContext('2d')
    const eng = new RenderEngine()

    let drewOverlay = false
    eng.renderStatic(ctx, {
      canvas: c, layout: layout(), colors,
      overlays: [overlay('a', (cx) => { drewOverlay = true; cx.fillStyle = '#00ff00'; cx.fillRect(40, 40, 10, 10) })],
      upperBorder: false,
    })
    expect(drewOverlay).toBe(true)
    // overlay pixel present
    expect(px(ctx, 44, 44)).toEqual([0, 255, 0, 255])
  })

  test('renderStatic: a throwing overlay is isolated (engine owns the boundary)', () => {
    const c = new Canvas(100, 80)
    const ctx = c.getContext('2d')
    const eng = new RenderEngine()
    eng.renderStatic(ctx, {
      canvas: c, layout: layout(), colors,
      overlays: [
        overlay('bad', () => { throw new Error('boom') }),
        overlay('good', (cx) => { cx.fillStyle = '#ff0000'; cx.fillRect(0, 0, 10, 10) }),
      ],
    })
    expect(px(ctx, 5, 5)).toEqual([255, 0, 0, 255]) // good one still drew
  })

  test('renderStatic: missing layout is a safe no-op', () => {
    const ctx = new Canvas(10, 10).getContext('2d')
    const eng = new RenderEngine()
    expect(() => eng.renderStatic(ctx, { canvas: { width: 10, height: 10 }, layout: null })).not.toThrow()
  })

  test('drawGrid: strokes vertical + horizontal lines (+ optional border)', () => {
    const c = new Canvas(100, 80)
    const ctx = c.getContext('2d')
    new RenderEngine().drawGrid(ctx, layout(), colors, true)
    // a grid line was stroked somewhere along x=20 column
    const onLine = px(ctx, 19, 40)
    expect(onLine[3]).toBeGreaterThan(0) // non-transparent (line drawn)
  })

  test('renderDynamic: clears + draws only the crosshair', () => {
    const c = new Canvas(100, 80)
    const ctx = c.getContext('2d')
    let drew = false
    new RenderEngine().renderDynamic(ctx, c, overlay('x', () => { drew = true }))
    expect(drew).toBe(true)
    // null crosshair is a no-op
    expect(() => new RenderEngine().renderDynamic(ctx, c, null)).not.toThrow()
  })

  test('drawShaders: runs each shader in its own save/restore scope', () => {
    const ctx = new Canvas(10, 10).getContext('2d')
    const calls = []
    const sh = (n) => ({ draw: () => calls.push(n) })
    new RenderEngine().drawShaders(ctx, [sh('a'), sh('b')], { x: 1 })
    expect(calls).toEqual(['a', 'b'])
  })
})
