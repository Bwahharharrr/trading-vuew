import { test, expect, describe } from 'vitest'
import { Canvas } from 'skia-canvas'
import { CanvasContext } from '../../src/render/canvas-context.js'

const px = (ctx, x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data)
const layer = (id, draw, display = true) => ({ id, name: id, display, renderer: { draw } })

describe('CanvasContext per-overlay error boundary', () => {
  test('draws a good overlay', () => {
    const ctx = new Canvas(50, 50).getContext('2d')
    const cc = new CanvasContext(ctx)
    const ok = cc.drawOverlay(layer('a', (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 50, 50) }))
    expect(ok).toBe(true)
    expect(px(ctx, 25, 25)).toEqual([255, 255, 255, 255])
  })

  test('isolates a throwing overlay and reports the error ONCE (deduped)', () => {
    const ctx = new Canvas(50, 50).getContext('2d')
    const errs = []
    const cc = new CanvasContext(ctx, { onError: (d) => errs.push(d) })
    const bad = layer('bad', () => { throw new Error('boom') })
    expect(cc.drawOverlay(bad)).toBe(false)
    expect(cc.drawOverlay(bad)).toBe(false) // 2nd frame, same error
    expect(errs).toHaveLength(1)
    expect(errs[0].code).toBe('overlay.draw.throw')
    expect(errs[0].message).toContain('boom')
  })

  test('a good overlay after a throwing one still renders (no path corruption)', () => {
    const ctx = new Canvas(50, 50).getContext('2d')
    const cc = new CanvasContext(ctx)
    // bad overlay leaves a dangling subpath then throws
    cc.drawOverlay(layer('bad', (c) => { c.beginPath(); c.moveTo(0, 0); c.lineTo(50, 50); throw new Error('x') }))
    cc.drawOverlay(layer('good', (c) => { c.fillStyle = '#00ff00'; c.fillRect(10, 10, 20, 20) }))
    expect(px(ctx, 15, 15)).toEqual([0, 255, 0, 255])
  })

  test('display:false (and falsy) overlays are skipped', () => {
    const ctx = new Canvas(10, 10).getContext('2d')
    const cc = new CanvasContext(ctx)
    let drawn = false
    expect(cc.drawOverlay(layer('h', () => { drawn = true }, false))).toBe(false)
    // display absent entirely (falsy) is also skipped, matching `!l.display`
    expect(cc.drawOverlay({ id: 'u', name: 'u', renderer: { draw: () => { drawn = true } } })).toBe(false)
    expect(drawn).toBe(false)
  })

  test('error state clears on recovery, re-reports on a new failure', () => {
    const ctx = new Canvas(10, 10).getContext('2d')
    const errs = []
    const cc = new CanvasContext(ctx, { onError: (d) => errs.push(d) })
    let fail = true
    const l = layer('f', () => { if (fail) throw new Error('e') })
    cc.drawOverlay(l)            // reported (1)
    fail = false; cc.drawOverlay(l) // recovers, clears state
    fail = true; cc.drawOverlay(l)  // reported again (2)
    expect(errs).toHaveLength(2)
  })

  test('metrics.drawCall fires once per drawn overlay', () => {
    const ctx = new Canvas(10, 10).getContext('2d')
    let calls = 0
    const cc = new CanvasContext(ctx, { metrics: { drawCall: () => calls++ } })
    cc.drawOverlays([layer('a', () => {}), layer('b', () => {})])
    expect(calls).toBe(2)
  })

  test('use() repoints the wrapper at a new ctx (resize/remount)', () => {
    const ctxA = new Canvas(10, 10).getContext('2d')
    const ctxB = new Canvas(10, 10).getContext('2d')
    const cc = new CanvasContext(ctxA)
    cc.use(ctxB)
    cc.drawOverlay(layer('a', (c) => { c.fillStyle = '#ff0000'; c.fillRect(0, 0, 10, 10) }))
    expect(px(ctxB, 5, 5)).toEqual([255, 0, 0, 255])
  })
})
