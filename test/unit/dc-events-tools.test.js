// dc_events tool lifecycle: selection (trash icon), Delete-key removal (the
// path the two-OrderBox bug rode through), tool registration/drawing-mode, and
// the change-settings merge + repaint contract. Drives a REAL DataCube via
// on_custom_event — the same entry TradingVue uses.
import { test, expect, describe, beforeEach } from 'vitest'
import DataCube from '../../src/helpers/datacube.js'

function seedDc() {
  return new DataCube({
    chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
    onchart: [
      { name: 'Box A', type: 'OrderBox', data: [], settings: { $uuid: 'box-A', $selected: false } },
      { name: 'Box B', type: 'OrderBox', data: [], settings: { $uuid: 'box-B', $selected: false } },
    ],
    offchart: [],
  }, { scripts: false, validation: 'off' })
}

describe('object selection + System:Remove', () => {
  let dc
  beforeEach(() => { dc = seedDc(); dc.data.tools = [] })

  test('object-selected flags the overlay, adds the trash tool, tracks `selected`', () => {
    dc.on_custom_event('object-selected', [0, 'OrderBox0', 'box-A'])
    expect(dc.data.selected).toBe('box-A')
    expect(dc.data.onchart[0].settings.$selected).toBe(true)
    expect(dc.data.tools.some(t => t.type === 'System:Remove')).toBe(true)
    // selecting the OTHER box deselects the first
    dc.on_custom_event('object-selected', [0, 'OrderBox1', 'box-B'])
    expect(dc.data.onchart[0].settings.$selected).toBe(false)
    expect(dc.data.onchart[1].settings.$selected).toBe(true)
    expect(dc.data.selected).toBe('box-B')
    // empty selection clears everything
    dc.on_custom_event('object-selected', [])
    expect(dc.data.selected).toBeNull()
    expect(dc.data.tools.some(t => t.type === 'System:Remove')).toBe(false)
  })

  test('remove-tool deletes EXACTLY the selected overlay by uuid', () => {
    dc.on_custom_event('object-selected', [0, 'OrderBox0', 'box-A'])
    dc.on_custom_event('remove-tool', [])
    expect(dc.data.onchart.length).toBe(1)
    expect(dc.data.onchart[0].settings.$uuid).toBe('box-B') // survivor intact
    expect(dc.data.tools.some(t => t.type === 'System:Remove')).toBe(false)
    expect(dc.data.tool).toBe('Cursor') // drawing mode reset
  })

  test('remove-tool with nothing selected is a no-op', () => {
    dc.on_custom_event('remove-tool', [])
    expect(dc.data.onchart.length).toBe(2)
  })
})

describe('tool registration + drawing mode', () => {
  test('register-tools builds the toolbar list with Cursor first', () => {
    const dc = seedDc()
    dc.on_custom_event('register-tools', [
      { use_for: 'LineTool', info: { type: 'Segment', icon: 'i1' } },
      { use_for: 'RangeTool', info: { icon: 'i2' } }, // no type → Default
    ])
    const types = dc.data.tools.map(t => t.type)
    expect(types[0]).toBe('Cursor')
    expect(types).toContain('LineTool:Segment')
    expect(types).toContain('RangeTool:Default')
  })

  test('tool-selected switches the active tool; Cursor exits drawing mode', () => {
    const dc = seedDc()
    dc.data.drawingMode = true
    dc.on_custom_event('tool-selected', ['LineTool:Segment'])
    expect(dc.data.tool).toBe('LineTool:Segment')
    dc.on_custom_event('tool-selected', ['Cursor'])
    expect(dc.data.tool).toBe('Cursor')
    expect(dc.data.drawingMode).toBe(false)
    // null tool guarded (the HODL quick-fix branch)
    expect(() => dc.on_custom_event('tool-selected', [null])).not.toThrow()
  })

  test('drawing-mode-off resets both flags', () => {
    const dc = seedDc()
    dc.data.drawingMode = true
    dc.data.tool = 'LineTool:Segment'
    dc.on_custom_event('drawing-mode-off', [])
    expect(dc.data.drawingMode).toBe(false)
    expect(dc.data.tool).toBe('Cursor')
  })
})

describe('change-settings contract', () => {
  test('merges into the addressed overlay by uuid and bumps the render revision', () => {
    const dc = seedDc()
    const rev = dc.revision ? dc.revision() : null
    dc.on_custom_event('change-settings', [{ side: 'sell' }, 0, 'OrderBox0', 'box-B'])
    expect(dc.data.onchart[1].settings.side).toBe('sell')
    expect(dc.data.onchart[0].settings.side).toBeUndefined() // A untouched
    if (rev != null) expect(dc.revision()).toBeGreaterThan(rev) // repaint signalled
  })

  test('strips a stray id field before merging (reserved)', () => {
    const dc = seedDc()
    dc.on_custom_event('change-settings', [{ id: 'evil', color: '#fff' }, 0, 'OrderBox0', 'box-A'])
    expect(dc.data.onchart[0].settings.id).toBeUndefined()
    expect(dc.data.onchart[0].settings.color).toBe('#fff')
  })
})
