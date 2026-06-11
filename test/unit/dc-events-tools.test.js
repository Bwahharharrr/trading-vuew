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

describe('overlay query + mutation surface', () => {
  // querySearch matches on overlay.id / .name / $uuid-substring; the full DC
  // pipeline stamps `id`, so do it here for index-style queries to resolve.
  function seedIds() {
    const dc = seedDc()
    dc.data.onchart[0].id = 'onchart.0'
    dc.data.onchart[1].id = 'onchart.1'
    return dc
  }

  test('get_overlay resolves by id', () => {
    const dc = seedIds()
    const ov = dc.get_overlay({ uuid: 'onchart.0' })
    expect(ov && ov.settings.$uuid).toBe('box-A')
  })

  test('modify_overlay overwrites scalar fields and merges object fields', () => {
    const dc = seedIds()
    dc.modify_overlay({ uuid: 'onchart.0', fields: { name: 'Renamed', settings: { extra: 1 } } })
    expect(dc.data.onchart[0].name).toBe('Renamed')
    expect(dc.data.onchart[0].settings.extra).toBe(1)        // merged, not replaced
    expect(dc.data.onchart[0].settings.$uuid).toBe('box-A')  // kept
  })

  test('set_loading flags only script-backed overlays', () => {
    const dc = seedIds()
    dc.data.onchart[0].settings.$props = {}  // mark as a script overlay
    dc.set_loading(true)
    expect(dc.data.onchart[0].loading).toBe(true)
    expect(dc.data.onchart[1].loading).toBeUndefined()
  })

  test('on_overlay_data drops synthetic overlays and refreshes data by id', () => {
    const dc = seedIds()
    dc.data.onchart.push({ id: 'onchart.2', name: 'synth', type: 'Spline', data: [], settings: { $synth: true, $uuid: 's1' } })
    dc.on_overlay_data([{ id: 'onchart.0', data: [[1000, 9]] }])
    expect(dc.data.onchart[0].data).toEqual([[1000, 9]])
    expect(dc.data.onchart[0].loading).toBe(false)
    expect(dc.data.onchart.some(x => x.settings.$synth)).toBe(false) // synthetic purged
  })

  test('build_tool instantiates a WIP overlay from the tool prototype', () => {
    const dc = seedDc()
    dc.data.tools = [{ type: 'LineTool:seg', name: 'Line', settings: { color: '#f00' } }]
    dc.build_tool(0, 'LineTool:seg')
    const wip = dc.data.onchart.find(x => x.settings.$state === 'wip')
    expect(wip).toBeTruthy()
    expect(wip.type).toBe('LineTool')          // base type (split on ':')
    expect(wip.settings.$selected).toBe(true)
    expect(wip.settings.legend).toBe(false)     // defaulted
    expect(wip.settings['z-index']).toBe(100)
  })

  test('build_tool is a no-op for an unknown tool type', () => {
    const dc = seedDc()
    dc.data.tools = []
    const before = dc.data.onchart.length
    dc.build_tool(0, 'Nope')
    expect(dc.data.onchart.length).toBe(before)
  })
})

describe('order routing (submit / cancel)', () => {
  function dcWithAgent() {
    const dc = seedDc()
    const calls = []
    dc.orderAgent = { submit: (s) => calls.push(['submit', s.$uuid]), cancel: (s) => calls.push(['cancel', s.$uuid]) }
    return { dc, calls }
  }
  test('submit-orders routes to the agent for the matching $uuid only', () => {
    const { dc, calls } = dcWithAgent()
    dc.on_custom_event('submit-orders', [0, 'OrderBox1', 'box-B'])
    expect(calls).toEqual([['submit', 'box-B']])
  })
  test('cancel-orders routes to the agent', () => {
    const { dc, calls } = dcWithAgent()
    dc.on_custom_event('cancel-orders', [0, 'OrderBox0', 'box-A'])
    expect(calls).toEqual([['cancel', 'box-A']])
  })
  test('no agent attached → silent no-op', () => {
    const dc = seedDc()
    expect(() => dc.on_custom_event('submit-orders', [0, 'x', 'box-A'])).not.toThrow()
  })
  test('scroll-lock toggles the flag', () => {
    const dc = seedDc()
    dc.on_custom_event('scroll-lock', [true])
    expect(dc.data.scrollLock).toBe(true)
    dc.on_custom_event('scroll-lock', [false])
    expect(dc.data.scrollLock).toBe(false)
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

describe('data-layer regressions (M2-M5)', () => {
  test('M2: a stale gldc id returns undefined, never an arbitrary overlay', () => {
    const dc = seedDc()
    // uuid-less overlays must not match the literal "undefined" query
    dc.data.onchart.forEach(ov => { delete ov.settings.$uuid })
    const ov = dc.get_overlay({ grid_id: 9, layer_id: 'Nope99' }) // gldc miss
    expect(ov).toBeUndefined()
  })

  test('M3: the first tick on an EMPTY chart bootstraps a candle', () => {
    const dc = seedDc()
    dc.data.chart.data.length = 0
    dc.tv = { $refs: { chart: { interval_ms: 60000, cursor: {}, last_candle: null } } }
    dc.agg = { push: () => {} }   // update_tick pushes to ohlcv itself
    dc.update_overlays = () => {}
    dc.update_tick({ price: 101.5, t: 1_600_000_030_000 })
    expect(dc.data.chart.data).toHaveLength(1)     // was silently dropped
    expect(dc.data.chart.data[0][4]).toBe(101.5)   // close = tick
  })

  test('M3: a FULL candle update on an empty chart is accepted', () => {
    const dc = seedDc()
    dc.data.chart.data.length = 0
    dc.tv = { $refs: { chart: { interval_ms: 60000 } } }
    const pushed = []
    dc.agg = { push: (k, v) => pushed.push(v) }
    dc.update_overlays = () => {}
    dc.update_candle({ candle: [1_600_000_000_000, 1, 2, 0.5, 1.5, 9] })
    expect(pushed).toHaveLength(1)                 // was return-false'd away
    expect(pushed[0][0]).toBe(1_600_000_000_000)
  })

  test('M4: a later dataset add works on a cube constructed WITHOUT datasets', async () => {
    const { default: Dataset } = await import('../../src/helpers/dataset.js')
    const dc = seedDc()
    dc.init_data()                                  // boot path (sans tv watchers)
    dc.add('datasets', { id: 'trades', type: 'Trades', data: [] })
    // the watcher used to throw: this.dss was only created when the cube was
    // CONSTRUCTED with datasets
    expect(() => Dataset.watcher.call(dc, dc.data.datasets, [])).not.toThrow()
    expect(dc.dss.trades).toBeTruthy()
  })

  test('M5: a rejecting loader resets `loading` so lazy-history survives a blip', async () => {
    const dc = seedDc()
    dc.data.chart.data.push([2000, 1, 2, 0, 1, 5])
    dc.onrange // exists
    dc.loader = () => Promise.reject(new Error('network blip'))
    await dc.range_changed([0, 1500], '1m')
    expect(dc.loading).toBe(false)          // was stuck true forever
  })
})
