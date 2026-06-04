import { test, expect, describe } from 'vitest'
import ChartUI from '../../src/stores/chart-ui.js'

describe('ChartUI store (typed facade over backing data)', () => {
  test('reads/writes flow through to the backing object', () => {
    const backing = {}
    const ui = new ChartUI(backing)

    ui.tool = 'LineTool:Segment'
    expect(backing.tool).toBe('LineTool:Segment')
    expect(ui.tool).toBe('LineTool:Segment')

    ui.setDrawingMode(true)
    expect(backing.drawingMode).toBe(true)
    expect(ui.drawingMode).toBe(true)

    ui.setScrollLock(true)
    expect(backing.scrollLock).toBe(true)

    ui.select('u-42')
    expect(backing.selected).toBe('u-42')
    expect(ui.selected).toBe('u-42')

    ui.deselect()
    expect(ui.selected).toBe(null)
  })

  test('defaults: tools initialised, booleans coerced, selected null', () => {
    const ui = new ChartUI({})
    expect(ui.tools).toEqual([])
    expect(ui.drawingMode).toBe(false)
    expect(ui.scrollLock).toBe(false)
    expect(ui.selected).toBe(null)
  })

  test('hasTool + resetInteraction', () => {
    const ui = new ChartUI({ tools: [{ type: 'Segment' }] })
    expect(ui.hasTool('Segment')).toBe(true)
    expect(ui.hasTool('Nope')).toBe(false)

    ui.setDrawingMode(true)
    ui.setScrollLock(true)
    ui.resetInteraction()
    expect(ui.drawingMode).toBe(false)
    expect(ui.scrollLock).toBe(false)
  })

  test('shares state with a parallel reader of the same backing object', () => {
    // Proves the facade does not copy — DataCube.data and ui see the same state.
    const backing = {}
    const ui = new ChartUI(backing)
    ui.tool = 'Cursor'
    expect(backing.tool).toBe('Cursor') // a `this.data.tool` reader sees it
  })
})
