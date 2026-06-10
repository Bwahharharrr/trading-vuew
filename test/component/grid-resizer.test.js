// @vitest-environment jsdom
// GridResizer.vue — the drag handle between stacked grids (23% covered):
// drag lifecycle, RAF-throttled resize emit, double-click minimize, styles.
import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GridResizer from '../../src/components/GridResizer.vue'

function layout() {
  return {
    grids: [
      { height: 300, offset: 0, width: 800 },
      { height: 200, offset: 300, width: 800 },
    ],
  }
}

function mountGR() {
  return mount(GridResizer, {
    props: { grid_id: 1, layout: layout(), colors: { scale: '#555' } },
    attachTo: document.body,
  })
}

describe('GridResizer', () => {
  let rafQ
  beforeEach(() => {
    rafQ = []
    globalThis.requestAnimationFrame = (fn) => { rafQ.push(fn); return rafQ.length }
  })
  afterEach(() => vi.restoreAllMocks())

  test('resizerStyle positions over the separator; lineStyle uses scale color', () => {
    const w = mountGR()
    expect(w.vm.resizerStyle.top).toBe('294px')   // offset(300) - 6
    expect(w.vm.resizerStyle.width).toBe('800px')
    expect(w.vm.lineStyle.background).toBe('#555')
    w.unmount()
  })

  test('mousedown starts a drag and snapshots grid heights', () => {
    const w = mountGR()
    w.vm.onMouseDown({ preventDefault() {}, stopPropagation() {}, clientY: 300 })
    expect(w.vm.dragging).toBe(true)
    expect(w.vm.startY).toBe(300)
    expect(w.vm.startHeights).toEqual([300, 200])
    w.unmount()
  })

  test('mousemove (RAF-throttled) emits resize-grids with new heights', () => {
    const w = mountGR()
    w.vm.onMouseDown({ preventDefault() {}, stopPropagation() {}, clientY: 300 })
    w.vm.onMouseMove({ clientY: 340 })   // drag down 40px
    expect(rafQ.length).toBe(1)          // throttled, not yet applied
    rafQ.shift()()                        // flush the RAF
    expect(w.emitted('resize-grids')).toBeTruthy()
    w.unmount()
  })

  test('mouseup ends the drag and emits resize-complete', () => {
    const w = mountGR()
    w.vm.onMouseDown({ preventDefault() {}, stopPropagation() {}, clientY: 300 })
    w.vm.onMouseUp()
    expect(w.vm.dragging).toBe(false)
    expect(w.emitted('resize-complete')).toBeTruthy()
    w.unmount()
  })

  test('double-click toggles minimize for this grid', () => {
    const w = mountGR()
    w.vm.onDoubleClick({ preventDefault() {}, stopPropagation() {} })
    expect(w.emitted('toggle-minimize').pop()).toEqual([1])
    w.unmount()
  })
})
