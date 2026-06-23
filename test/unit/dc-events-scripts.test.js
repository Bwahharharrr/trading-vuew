// dc_events SCRIPT side: the web-worker dispatch contract for the script
// lifecycle — exec_script / on_settings / exec_all_scripts / scripts_onrange /
// data_changed / set_loading. These methods all funnel through `this.ww.just`,
// which is a real no-op in node (no Worker, no node_url), so we swap in a
// RECORDING fake ww and a stubbed `tv` ($refs.chart + getRange) — the same
// FAKE-client style used by the corky-*-feed unit tests. We drive a REAL
// DataCube so gldc resolution, the reactive store, and Utils.is_scr_props_upd /
// delayed_exec all run for real. Behaviors here were confirmed against the live
// source before being pinned (no aspirational assertions).
import { test, expect, describe, beforeEach, vi } from 'vitest'
import DataCube from '../../src/helpers/datacube.js'

// Recording stand-in for WebWork: same `just(type, data)` surface the script
// methods call, but it captures calls instead of postMessage-ing a worker.
function makeWW() {
  const calls = []
  return {
    calls,
    just(type, data) { calls.push([type, data]) },
    exec() {},
    destroy() {},
    _data_uploading: false,
  }
}

const RANGE = [100, 200]
const TF = 60000

// Build a real DataCube, run update_ids() so gldc maps grid/layer ids, then
// inject the recording ww + a stub tv (interval_ms + getRange).
function seed(overlays, sett = {}) {
  const dc = new DataCube(
    {
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: overlays,
      offchart: [],
    },
    Object.assign({ scripts: true, validation: 'off' }, sett)
  )
  dc.update_ids() // populate gldc: g0_<type>_<i> -> onchart.<type><i>
  dc.ww = makeWW()
  dc.tv = {
    $refs: { chart: { interval_ms: TF } },
    getRange: () => RANGE,
    controllers: [],
  }
  return dc
}

describe('exec_script', () => {
  test('happy path: one exec-script call, defaults applied, uuid stamped, $props recorded', () => {
    const ov = {
      name: 'EMA', type: 'EMA', data: [], settings: {},
      script: { src: { props: { len: { def: 20 } } } },
    }
    const dc = seed([ov])
    const arg = { grid_id: 0, layer_id: 'EMA_0', src: { props: { len: { def: 20 } } } }

    dc.exec_script([arg])

    // exactly one WW dispatch, of the right type
    expect(dc.ww.calls).toHaveLength(1)
    const [type, payload] = dc.ww.calls[0]
    expect(type).toBe('exec-script')
    expect(payload.tf).toBe(TF)
    expect(payload.range).toEqual(RANGE)
    expect(payload.s).toBe(arg) // s IS args[0] (mutated in place)

    const stored = dc.data.onchart[0]
    // loading flag flips on the (reactive store) overlay
    expect(stored.loading).toBe(true)
    // a fresh $uuid was minted and stamped onto the arg
    expect(stored.settings.$uuid).toMatch(/^EMA-/)
    expect(arg.uuid).toBe(stored.settings.$uuid)
    expect(arg.sett).toBe(stored.settings)
    // default value materialised from def, and reflected back into the proto.val
    expect(stored.settings.len).toBe(20)
    expect(arg.src.props.len.val).toBe(20)
    // $props snapshot of the script's prop keys
    expect(stored.settings.$props).toEqual(['len'])
  })

  test('missing default: exactly one console.error, no WW call; existing value wins over def', () => {
    // `len` ordered FIRST so its existing 33 wins (continue) BEFORE the
    // default-less `bad` prop trips the error+return.
    const ov = {
      name: 'EMA', type: 'EMA', data: [], settings: { len: 33 },
      script: { src: { props: { len: { def: 20 }, bad: {} } } },
    }
    const dc = seed([ov])
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const arg = { grid_id: 0, layer_id: 'EMA_0', src: { props: { len: { def: 20 }, bad: {} } } }

    dc.exec_script([arg])

    expect(spy).toHaveBeenCalledTimes(1)
    expect(dc.ww.calls).toHaveLength(0) // returned before dispatch
    // existing 33 was not overwritten by the def, and flowed into proto.val
    expect(dc.data.onchart[0].settings.len).toBe(33)
    expect(arg.src.props.len.val).toBe(33)
    spy.mockRestore()
  })

  test('drops stale props no longer present in the current exec', () => {
    const ov = {
      name: 'EMA', type: 'EMA', data: [],
      settings: { old: 99, len: 5, $props: ['old', 'len'] },
      script: { src: { props: { len: { def: 20 } } } },
    }
    const dc = seed([ov])
    const arg = { grid_id: 0, layer_id: 'EMA_0', src: { props: { len: { def: 20 } } } }

    dc.exec_script([arg])

    const s = dc.data.onchart[0].settings
    expect('old' in s).toBe(false) // dropped — was in $props but not in new props
    expect(s.len).toBe(5)          // kept (existing value wins over def)
    expect(s.$props).toEqual(['len'])
    expect(dc.ww.calls).toHaveLength(1)
  })

  test('no-op: stale gldc / obj.scripts===false / sett.scripts===false → zero WW calls, no throw', () => {
    // (a) gldc miss: get_overlay returns undefined
    const dcMiss = seed([{ name: 'EMA', type: 'EMA', data: [], settings: {}, script: { src: { props: {} } } }])
    expect(() => dcMiss.exec_script([{ grid_id: 9, layer_id: 'Nope_0', src: { props: {} } }])).not.toThrow()
    expect(dcMiss.ww.calls).toHaveLength(0)

    // (b) obj.scripts === false on the resolved overlay
    const dcOff = seed([{ name: 'EMA', type: 'EMA', data: [], settings: {}, scripts: false, script: { src: { props: {} } } }])
    dcOff.exec_script([{ grid_id: 0, layer_id: 'EMA_0', src: { props: {} } }])
    expect(dcOff.ww.calls).toHaveLength(0)

    // (c) global sett.scripts === false
    const dcSett = seed([{ name: 'EMA', type: 'EMA', data: [], settings: {}, script: { src: { props: {} } } }])
    dcSett.sett.scripts = false
    dcSett.exec_script([{ grid_id: 0, layer_id: 'EMA_0', src: { props: {} } }])
    expect(dcSett.ww.calls).toHaveLength(0)
  })
})

describe('on_settings', () => {
  test('a script-prop change emits update-ov-settings keyed by $uuid + sets loading', () => {
    const p = { settings: { $uuid: 'u1', $props: ['len'] } }
    const prev = [{ v: { $uuid: 'u1', len: 20 }, p }]
    const n = { v: { $uuid: 'u1', len: 50 }, p }
    const dc = seed([])

    dc.on_settings([n], prev)

    expect(dc.ww.calls).toHaveLength(1)
    const [type, payload] = dc.ww.calls[0]
    expect(type).toBe('update-ov-settings')
    expect(payload.tf).toBe(TF)
    expect(payload.range).toEqual(RANGE)
    expect(payload.delta).toEqual({ u1: { $uuid: 'u1', len: 50 } }) // keyed by $uuid
    expect(p.loading).toBe(true)
  })

  test('a style-only / unchanged change (is_scr_props_upd false) produces zero WW calls', () => {
    // $props=['len'] but len is unchanged (only color moved) → not a prop update
    const p = { settings: { $uuid: 'u1', $props: ['len'] } }
    const prev = [{ v: { $uuid: 'u1', len: 20, color: '#fff' }, p }]
    const n = { v: { $uuid: 'u1', len: 20, color: '#000' }, p }
    const dc = seed([])

    dc.on_settings([n], prev)

    expect(dc.ww.calls).toHaveLength(0)
    expect(p.loading).toBeUndefined()
  })

  test('early-returns (no WW) when sett.scripts is falsy', () => {
    const dc = seed([])
    dc.sett.scripts = false
    const p = { settings: { $uuid: 'u1', $props: ['len'] } }
    dc.on_settings(
      [{ v: { $uuid: 'u1', len: 50 }, p }],
      [{ v: { $uuid: 'u1', len: 20 }, p }]
    )
    expect(dc.ww.calls).toHaveLength(0)
  })
})

describe('exec_all_scripts', () => {
  test('set_loading(true) then one exec-all-scripts dispatch', () => {
    const a = { name: 'EMA', type: 'EMA', data: [], settings: { $props: ['len'] } }
    const b = { name: 'SMA', type: 'SMA', data: [], settings: {} } // plain, no $props
    const dc = seed([a, b])

    dc.exec_all_scripts()

    expect(dc.ww.calls).toHaveLength(1)
    const [type, payload] = dc.ww.calls[0]
    expect(type).toBe('exec-all-scripts')
    expect(payload.tf).toBe(TF)
    expect(payload.range).toEqual(RANGE)
    // set_loading flagged only the $props-backed overlay
    expect(dc.data.onchart[0].loading).toBe(true)
    expect(dc.data.onchart[1].loading).toBeUndefined()
  })

  test('no-op when sett.scripts is false', () => {
    const dc = seed([{ name: 'EMA', type: 'EMA', data: [], settings: { $props: ['len'] } }])
    dc.sett.scripts = false
    dc.exec_all_scripts()
    expect(dc.ww.calls).toHaveLength(0)
  })
})

describe('scripts_onrange', () => {
  test('batches execOnRange overlays into one update-ov-settings; non-execOnRange excluded', () => {
    const a = { name: 'EMA', type: 'EMA', data: [], settings: { $uuid: 'a' }, script: { execOnRange: true } }
    const b = { name: 'SMA', type: 'SMA', data: [], settings: { $uuid: 'b' }, script: {} } // no execOnRange
    const dc = seed([a, b])

    dc.scripts_onrange(RANGE)

    expect(dc.ww.calls).toHaveLength(1)
    const [type, payload] = dc.ww.calls[0]
    expect(type).toBe('update-ov-settings')
    expect(payload.tf).toBe(TF)
    expect(payload.range).toEqual(RANGE)
    expect(Object.keys(payload.delta)).toEqual(['a']) // only the execOnRange overlay
    expect(payload.delta.a.$uuid).toBe('a')
  })

  test('empty delta → no WW call (nothing eligible)', () => {
    const b = { name: 'SMA', type: 'SMA', data: [], settings: { $uuid: 'b' }, script: {} }
    const dc = seed([b])
    dc.scripts_onrange(RANGE)
    expect(dc.ww.calls).toHaveLength(0)
  })
})

describe('data_changed', () => {
  test('emits send-meta-info THEN upload-data, sets _data_uploading + loading', () => {
    const ov = { name: 'EMA', type: 'EMA', data: [], settings: { $props: ['len'] } }
    const dc = seed([ov])
    dc.se_state = { scripts: { ready: true } }
    dc.ww._data_uploading = false

    dc.data_changed([])

    // ordered dispatch: meta first, then the data upload
    expect(dc.ww.calls.map(c => c[0])).toEqual(['send-meta-info', 'upload-data'])
    const meta = dc.ww.calls[0][1]
    expect(meta).toEqual({ tf: TF, range: RANGE })
    const upload = dc.ww.calls[1][1]
    expect(upload.ohlcv).toBe(dc.data.chart.data)
    // upload-in-flight latch + script-overlay loading flagged
    expect(dc.ww._data_uploading).toBe(true)
    expect(dc.data.onchart[0].loading).toBe(true)
  })

  test('early returns (no WW): data_change_exec===false / already uploading / se_state.scripts absent', () => {
    // data_change_exec disabled
    const d1 = seed([])
    d1.se_state = { scripts: { ready: true } }
    d1.sett.data_change_exec = false
    d1.data_changed([])
    expect(d1.ww.calls).toHaveLength(0)

    // an upload already in flight
    const d2 = seed([])
    d2.se_state = { scripts: { ready: true } }
    d2.ww._data_uploading = true
    d2.data_changed([])
    expect(d2.ww.calls).toHaveLength(0)

    // engine has no scripts state yet
    const d3 = seed([])
    d3.se_state = {}
    d3.data_changed([])
    expect(d3.ww.calls).toHaveLength(0)
  })
})

describe('set_loading', () => {
  let dc
  beforeEach(() => {
    dc = seed([
      { name: 'EMA', type: 'EMA', data: [], settings: { $props: ['len'] } }, // script-backed
      { name: 'SMA', type: 'SMA', data: [], settings: {} },                  // plain
    ])
  })

  test('flags only overlays whose settings.$props is set', () => {
    dc.set_loading(true)
    expect(dc.data.onchart[0].loading).toBe(true)        // $props present → flagged
    expect(dc.data.onchart[1].loading).toBeUndefined()   // plain → untouched

    dc.set_loading(false)
    expect(dc.data.onchart[0].loading).toBe(false)       // toggled back
    expect(dc.data.onchart[1].loading).toBeUndefined()   // still untouched
  })
})
