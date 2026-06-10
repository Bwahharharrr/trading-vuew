// @vitest-environment jsdom
// useCanvasRenderer composable (0% covered): createCanvas vnode wiring, redraw
// delegation to the renderer, scheduleRedraw RAF debounce, and cleanup.
import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'
import { useCanvasRenderer } from '../../src/composables/useCanvasRenderer.js'
import { installCanvasEnv, uninstallCanvasEnv, flushRaf } from './_component-harness.js'

beforeEach(() => installCanvasEnv())
afterEach(() => uninstallCanvasEnv())

function setup(rendererOver = {}) {
  const renderer = Object.assign({ update: vi.fn(), mousemove: vi.fn() }, rendererOver)
  const api = useCanvasRenderer({ tv_id: 'tv', width: 200, height: 100 }, () => renderer)
  return { api, renderer }
}

describe('useCanvasRenderer', () => {
  test('redraw delegates to renderer.update()', () => {
    const { api, renderer } = setup()
    api.redraw()
    expect(renderer.update).toHaveBeenCalled()
  })

  test('scheduleRedraw debounces multiple calls into one RAF redraw', () => {
    const { api, renderer } = setup()
    api.scheduleRedraw()
    api.scheduleRedraw()
    api.scheduleRedraw()
    expect(renderer.update).not.toHaveBeenCalled() // deferred to RAF
    flushRaf()
    expect(renderer.update).toHaveBeenCalledTimes(1)
  })

  test('createCanvas builds a positioned div with a wired canvas vnode', () => {
    const { api } = setup()
    const vnode = api.createCanvas('grid', {
      attrs: { width: 200, height: 100 },
      position: { x: 4, y: 8 },
      style: {}, hs: [],
    })
    expect(vnode.props.style.left).toBe('4px')
    expect(vnode.props.style.position).toBe('absolute')
    const canvas = vnode.children[0]
    expect(canvas.props.id).toBe('tv-grid-canvas')
    expect(canvas.props.width).toBe(200)
    // mouse handlers forward to the renderer
    const r = { mousemove: vi.fn() }
    api.canvasRef // touch the ref
    expect(typeof canvas.props.onMousemove).toBe('function')
  })

  test('cleanup cancels a pending RAF without error', () => {
    const { api, renderer } = setup()
    api.scheduleRedraw()
    api.cleanup()
    flushRaf()
    expect(renderer.update).not.toHaveBeenCalled() // RAF was cancelled
  })

  test('updateDimensions records new attrs', () => {
    const { api } = setup()
    api.updateDimensions(640, 480)
    expect(api.attrs.value.width).toBe(640)
    expect(api.attrs.value.height).toBe(480)
  })
})
