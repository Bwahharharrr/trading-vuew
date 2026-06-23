// dc_events WW INBOUND router — the `this.ww.onevent` switch installed in the
// DCEvents constructor (src/helpers/dc_events.js). Drives a REAL DataCube and
// invokes the router directly via `dc.ww.onevent({ data: <msg> })`, the exact
// entry the WebWork.onmessage relay uses for non-task messages.
//
// In Node/jsdom-free tests WebWork has no Worker (`ww.worker === null`), so
// `ww.just` is a no-op — we spy on it to capture outbound traffic. `tv` is a
// minimal fake (controllers / $refs.chart / getRange / $emit). No real worker,
// socket, timer, or randomness is exercised: the router is synchronous.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import DataCube from '../../src/helpers/datacube.js'

// Build a DataCube with ids stamped (update_ids) but WITHOUT mounting tv. A
// spy on ww.just records outbound messages; a fake tv satisfies the handlers
// that read interval_ms / range / emit.
function seed(data, { interval_ms = 60000 } = {}) {
  const dc = new DataCube(data, { scripts: false, validation: 'off' })
  dc.init_data()
  dc.update_ids()
  dc.ww.just = vi.fn()
  dc.tv = {
    controllers: [],
    $refs: { chart: { interval_ms } },
    getRange: () => [1000, 2000],
    $emit: vi.fn(),
  }
  return dc
}

// Convenience: fire one inbound WW message through the router.
const fire = (dc, type, data) => dc.ww.onevent({ data: { type, data } })

describe('engine-state / data-uploaded', () => {
  test('engine-state Object.assigns into se_state and ACCUMULATES across events', () => {
    const dc = seed({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    fire(dc, 'engine-state', { scripts: 3, ram: 10 })
    fire(dc, 'engine-state', { ram: 20, gpu: 1 })
    // first event seeds, second merges (ram overwritten, gpu added, scripts kept)
    expect(dc.se_state).toEqual({ scripts: 3, ram: 20, gpu: 1 })
  })

  test('data-uploaded clears the ww._data_uploading flag', () => {
    const dc = seed({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    dc.ww._data_uploading = true
    fire(dc, 'data-uploaded')
    expect(dc.ww._data_uploading).toBe(false)
  })
})

describe('request-data upload gate', () => {
  test('sends send-meta-info THEN upload-data (ohlcv tx) and sets the uploading flag', () => {
    const dc = seed({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [], offchart: [],
    })
    dc.ww._data_uploading = false
    fire(dc, 'request-data', [{ type: 'OHLCV' }])

    const types = dc.ww.just.mock.calls.map(c => c[0])
    expect(types).toEqual(['send-meta-info', 'upload-data'])
    // meta carries tf+range; the tx is the {ohlcv} bundle from Dataset.make_tx
    expect(dc.ww.just.mock.calls[0][1]).toEqual({ tf: 60000, range: [1000, 2000] })
    expect(dc.ww.just.mock.calls[1][1]).toEqual({ ohlcv: [[1000, 1, 2, 0, 1, 5]] })
    expect(dc.ww._data_uploading).toBe(true)
  })

  test('request-data is a NO-OP while already uploading', () => {
    const dc = seed({ chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] }, onchart: [], offchart: [] })
    dc.ww._data_uploading = true
    fire(dc, 'request-data', [{ type: 'OHLCV' }])
    expect(dc.ww.just).not.toHaveBeenCalled()
    expect(dc.ww._data_uploading).toBe(true)
  })
})

describe('script signal / error re-emit on the public EventMap', () => {
  test('script-signal re-emits tv.$emit("signal", payload)', () => {
    const dc = seed({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    const payload = { id: 'EMA0', value: 42 }
    fire(dc, 'script-signal', payload)
    expect(dc.tv.$emit).toHaveBeenCalledWith('signal', payload)
  })

  test('script-error re-emits tv.$emit("indicator-error", payload)', () => {
    const dc = seed({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    const payload = { uuid: 'RSI0', error: 'boom' }
    fire(dc, 'script-error', payload)
    expect(dc.tv.$emit).toHaveBeenCalledWith('indicator-error', payload)
  })
})

describe('overlay message routing', () => {
  test('overlay-data → on_overlay_data, overlay-update → on_overlay_update, modify-overlay → modify_overlay', () => {
    const dc = seed({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    const onData = vi.spyOn(dc, 'on_overlay_data').mockImplementation(() => {})
    const onUpd = vi.spyOn(dc, 'on_overlay_update').mockImplementation(() => {})
    const onMod = vi.spyOn(dc, 'modify_overlay').mockImplementation(() => {})

    fire(dc, 'overlay-data', [{ id: 'x' }])
    fire(dc, 'overlay-update', [{ id: 'y' }])
    fire(dc, 'modify-overlay', { uuid: 'z' })

    expect(onData).toHaveBeenCalledWith([{ id: 'x' }])
    expect(onUpd).toHaveBeenCalledWith([{ id: 'y' }])
    expect(onMod).toHaveBeenCalledWith({ uuid: 'z' })
  })
})

describe('controller fan-out ordering', () => {
  test('ww() fires on EVERY controller BEFORE the switch, post_ww() AFTER', () => {
    const dc = seed({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    const order = []
    const ctrl = name => ({
      ww: () => order.push(`${name}.ww`),
      post_ww: () => order.push(`${name}.post`),
    })
    dc.tv.controllers = [ctrl('c1'), ctrl('c2')]
    // 'engine-state' is an inert switch arm — the fan-out is what we assert.
    fire(dc, 'engine-state', {})
    expect(order).toEqual(['c1.ww', 'c2.ww', 'c1.post', 'c2.post'])
  })
})

describe('on_ids_changed → remove-scripts', () => {
  test('emits remove-scripts for uuids in prev but not values; ignores undefined; no call when nothing removed', () => {
    const dc = seed({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })

    // 'b' is gone; the `undefined` entry (a fresh/uuid-less overlay) is ignored
    dc.on_ids_changed(['a', 'c'], ['a', 'b', undefined])
    expect(dc.ww.just).toHaveBeenCalledTimes(1)
    expect(dc.ww.just).toHaveBeenCalledWith('remove-scripts', ['b'])

    dc.ww.just.mockClear()
    // nothing removed → no WW traffic at all
    dc.on_ids_changed(['a', 'b'], ['a', 'b'])
    expect(dc.ww.just).not.toHaveBeenCalled()
  })
})

describe('send_meta_2_ww tf resolution', () => {
  test('uses chart.interval_ms when present', () => {
    const dc = seed({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] }, { interval_ms: 60000 })
    dc.send_meta_2_ww()
    expect(dc.ww.just).toHaveBeenCalledWith('send-meta-info', { tf: 60000, range: [1000, 2000] })
  })

  test('falls back to data.chart.tf when interval_ms is absent', () => {
    const dc = seed({ chart: { type: 'Candles', data: [], tf: 300000 }, onchart: [], offchart: [] })
    dc.tv.$refs.chart.interval_ms = undefined // simulate a chart with no resolved interval
    dc.send_meta_2_ww()
    expect(dc.ww.just).toHaveBeenCalledWith('send-meta-info', { tf: 300000, range: [1000, 2000] })
  })
})

describe('on_overlay_update (fast_merge, same-ts replace / append / skip)', () => {
  function seedLine() {
    return seed({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'Line', type: 'Spline', data: [[1000, 10], [2000, 20]], settings: { $uuid: 'UID_A' } }],
      offchart: [],
    })
  }

  test('a point at the EXISTING last timestamp replaces the last row in place', () => {
    const dc = seedLine()
    dc.on_overlay_update([{ id: 'onchart.Spline0', data: [2000, 99] }])
    expect(dc.data.onchart[0].data).toEqual([[1000, 10], [2000, 99]])
  })

  test('a NEW later timestamp appends', () => {
    const dc = seedLine()
    dc.on_overlay_update([{ id: 'onchart.Spline0', data: [3000, 30] }])
    expect(dc.data.onchart[0].data).toEqual([[1000, 10], [2000, 20], [3000, 30]])
  })

  test('entries with no ov.data, or an unresolved id, are skipped (no throw, no mutation)', () => {
    const dc = seedLine()
    const before = JSON.parse(JSON.stringify(dc.data.onchart[0].data))
    expect(() => {
      dc.on_overlay_update([{ id: 'onchart.Spline0' }])            // no data
      dc.on_overlay_update([{ id: 'offchart.NopeXYZ', data: [9, 9] }]) // unresolved
    }).not.toThrow()
    expect(dc.data.onchart[0].data).toEqual(before)
  })
})

describe('on_overlay_data (loading reset / data replace / synth purge / new_ovs add)', () => {
  test('matched id: loading=false, data replaced; synthetic overlays purged first', () => {
    const dc = seed({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [
        { name: 'Line', type: 'Spline', data: [[1000, 1]], settings: { $uuid: 'UID_A' }, loading: true },
        { name: 'SynthLine', type: 'Spline', data: [], settings: { $synth: true, $uuid: 'UID_S' } },
      ],
      offchart: [],
    })
    dc.on_overlay_data([{ id: 'onchart.Spline0', data: [[1000, 5], [2000, 6]] }])

    expect(dc.data.onchart.map(x => x.name)).toEqual(['Line']) // synth purged
    expect(dc.data.onchart[0].loading).toBe(false)
    expect(dc.data.onchart[0].data).toEqual([[1000, 5], [2000, 6]])
  })

  test('clears loading even when ov.data is falsy (data left untouched)', () => {
    const dc = seed({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'Line', type: 'Spline', data: [[1, 2]], settings: { $uuid: 'UID_A' }, loading: true }],
      offchart: [],
    })
    dc.on_overlay_data([{ id: 'onchart.Spline0' }])
    expect(dc.data.onchart[0].loading).toBe(false)
    expect(dc.data.onchart[0].data).toEqual([[1, 2]]) // unchanged
  })

  test('new_ovs ADDS overlays not already present by id, skips ones that already exist', () => {
    const dc = seed({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'Mainline', type: 'Spline', data: [[1000, 1]], settings: { $uuid: 'UID_A' }, loading: true }],
      offchart: [],
    })
    dc.on_overlay_data([{
      id: 'onchart.Spline0',
      data: [[1000, 5], [2000, 6]],
      new_ovs: {
        onchart: {
          // fresh key (no overlay matches) → ADDED
          FreshKey: { name: 'FreshKey', type: 'EMA', data: [[9, 9]], settings: { $uuid: 'UID_F' } },
          // key matches the existing overlay's name → SKIPPED (no duplicate)
          Mainline: { name: 'Mainline', type: 'WMA', data: [], settings: { $uuid: 'UID_DUP' } },
        },
        offchart: {
          OffFresh: { name: 'OffFresh', type: 'RSI', data: [], settings: { $uuid: 'UID_O' } },
        },
      },
    }])

    // Mainline kept once (not duplicated), FreshKey appended
    expect(dc.data.onchart.map(x => x.name)).toEqual(['Mainline', 'FreshKey'])
    expect(dc.data.onchart.map(x => x.type)).toEqual(['Spline', 'EMA'])
    expect(dc.data.offchart.map(x => x.name)).toEqual(['OffFresh'])
    // the matched overlay still got its data replaced + loading cleared
    const main = dc.data.onchart.find(x => x.name === 'Mainline')
    expect(main.data).toEqual([[1000, 5], [2000, 6]])
    expect(main.loading).toBe(false)
  })
})

describe('modify_overlay (object merge vs scalar overwrite, no-op miss)', () => {
  test('merges object fields (settings) via merge but overwrites scalar fields (name) directly', () => {
    const dc = seed({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'Line', type: 'Spline', data: [], settings: { $uuid: 'UID_A', color: '#f00' } }],
      offchart: [],
    })
    dc.modify_overlay({ uuid: 'onchart.Spline0', fields: { name: 'Renamed', settings: { extra: 1 } } })
    const ov = dc.data.onchart[0]
    expect(ov.name).toBe('Renamed')                     // scalar overwrite
    expect(ov.settings).toEqual({ $uuid: 'UID_A', color: '#f00', extra: 1 }) // merged
  })

  test('is a no-op when the uuid does not resolve', () => {
    const dc = seed({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'Line', type: 'Spline', data: [], settings: { $uuid: 'UID_A' } }],
      offchart: [],
    })
    const before = JSON.parse(JSON.stringify(dc.data.onchart[0]))
    expect(() => dc.modify_overlay({ uuid: 'offchart.NopeXYZ', fields: { name: 'X' } })).not.toThrow()
    expect(JSON.parse(JSON.stringify(dc.data.onchart[0]))).toEqual(before)
  })
})
