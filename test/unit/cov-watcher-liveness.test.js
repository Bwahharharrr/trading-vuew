// @vitest-environment jsdom
//
// vr-3 Strategy B — WATCHER LIVENESS under the markRaw migration.
//
// Strategy B markRaw's the LARGE inner ROW arrays (chart.data + every overlay
// .data/.raw) to drop ~6N row proxies. The HARD boundary (CLAUDE-cited) is that
// EVERYTHING driving Vue structure/watcher reactivity must stay reactive: the
// cube root, the onchart/offchart CONTAINER arrays, the chart object, and ALL
// settings objects. Three dc_core.js $watch-es ride on that reactivity:
//
//   1. settings-changed  (dc_core.js:32-49) — watches get_by_query('.settings')
//      via a JSON.stringify(s.v) fingerprint → on_settings + emits
//      'settings-changed'. Drives the worker re-exec on a settings flip.
//   2. ids               (dc_core.js:56-69) — watches get('.') mapped to each
//      overlay's settings.$uuid → on_ids_changed. Drives overlay add/del.
//   3. datasets          (dc_core.js:72-75).
//
// If markRaw had leaked onto a settings object or a container, these watchers
// would SILENTLY stop firing — overlay add/del, volume toggles and settings
// flips would freeze with no error. cube-reactivity-boundary.test.js asserts the
// reactivity FLAGS; THIS test asserts the watchers actually still FIRE end to end
// on a real mounted TradingVue (the watchers are bound to this.tv.$watch, so a
// mount is required — calling init_data standalone does NOT install them).
//
// Harness: the component harness (recording 2D ctx + controllable RAF). settle()
// runs the nextTick + RAF generations the Vue watcher callbacks need to flush.

import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest'
import { isReactive, reactive } from 'vue'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import emitter from '../../src/stuff/eventBus.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
} from '../component/_component-harness.js'

const T0 = 1_600_000_000_000
const TF = 60_000

function seedDc() {
  const ohlcv = Array.from({ length: 40 }, (_, i) => {
    const t = T0 + i * TF
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
  // One onchart overlay carrying a settings object WITH a $uuid so both the
  // .settings fingerprint watcher and the $uuid ids watcher have live input.
  const sma = ohlcv.map(c => [c[0], c[4]])
  return new DataCube({
    ohlcv,
    onchart: [{
      name: 'SMA', type: 'Spline', data: sma,
      settings: { $uuid: 'uuid-sma-0', color: '#ff0000', lineWidth: 1 },
    }],
  }, { scripts: false, validation: 'off' })
}

describe('vr-3 watcher liveness (settings + ids stayed reactive under markRaw)', () => {
  let wrapper, dc
  beforeEach(() => { installCanvasEnv(); dc = seedDc() })
  afterEach(() => {
    if (wrapper) wrapper.unmount()
    uninstallCanvasEnv()
    vi.restoreAllMocks()
  })

  async function mountChart() {
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle()
  }

  // The mounted component reads `this.$props.data.data`, so Vue auto-proxies the
  // cube's `dc.data` as a reactive object and the dc_core watchers track THAT
  // proxy (init_tvjs is called as data.init_tvjs(this) with `this` = the reactive
  // DataCube prop). reactive() is idempotent — it returns the SAME cached proxy
  // for a given raw target — so this is the very object the watchers observe.
  // Mutating the raw `dc.data` directly would bypass the proxy traps and fire
  // nothing; the real app's writes flow through this reactive view.
  const view = () => reactive(dc.data)

  test('sanity: settings objects + containers stayed REACTIVE (markRaw boundary held)', async () => {
    await mountChart()
    const r = view()
    // The watchers depend on these being reactive; assert the boundary directly.
    expect(isReactive(r)).toBe(true)              // cube root
    expect(isReactive(r.onchart)).toBe(true)      // CONTAINER array
    expect(isReactive(r.offchart)).toBe(true)     // CONTAINER array
    expect(isReactive(r.chart)).toBe(true)        // chart OBJECT
    expect(isReactive(r.onchart[0])).toBe(true)   // overlay OBJECT
    expect(isReactive(r.onchart[0].settings)).toBe(true) // settings object
    expect(isReactive(r.chart.settings)).toBe(true)
    // …and the LARGE row array is raw (the whole point of Strategy B).
    expect(isReactive(r.chart.data)).toBe(false)
    expect(isReactive(r.onchart[0].data)).toBe(false)
  })

  test('settings-changed watcher FIRES on an overlay settings-value mutation', async () => {
    await mountChart()

    // Listen on the same bus dc_core's settings watcher emits to (dc_core.js:47).
    const events = []
    const onChanged = (payload) => events.push(payload)
    emitter.on('settings-changed', onChanged)

    try {
      // Mutate a settings VALUE on the reactive settings object. This flips the
      // JSON.stringify(s.v) fingerprint the watcher tracks → callback must fire.
      view().onchart[0].settings.color = '#00ff00'
      await settle(6)

      expect(events.length).toBeGreaterThan(0)
      // The new value flowed through the watcher's newVal snapshot.
      const sawNewColor = events.some(e =>
        Array.isArray(e.newVal) &&
        e.newVal.some(s => s && s.v && s.v.color === '#00ff00'))
      expect(sawNewColor).toBe(true)
    } finally {
      emitter.off('settings-changed', onChanged)
    }
  })

  test('settings-changed watcher does NOT fire without a settings mutation (no false positive)', async () => {
    await mountChart()
    const events = []
    const onChanged = (payload) => events.push(payload)
    emitter.on('settings-changed', onChanged)
    try {
      // settle alone — no settings touched. The fingerprint is unchanged, so the
      // watcher must stay quiet (proves the assertion above is meaningful, not a
      // mount-time emission we happened to catch).
      await settle(6)
      expect(events.length).toBe(0)
    } finally {
      emitter.off('settings-changed', onChanged)
    }
  })

  test('ids watcher FIRES on an overlay $uuid mutation', async () => {
    await mountChart()

    // on_ids_changed is the ids watcher's callback (dc_core.js:68). Spy on it.
    const spy = vi.spyOn(dc, 'on_ids_changed')

    // Changing $uuid changes the ids-key (join of every overlay's $uuid), so the
    // ids watcher must re-evaluate and invoke on_ids_changed. Mutate through the
    // reactive view so the proxy traps fire (raw writes would be invisible).
    view().onchart[0].settings.$uuid = 'uuid-sma-RENAMED'
    await settle(6)

    expect(spy).toHaveBeenCalled()
    // The new $uuid is present in the watcher's newVal list.
    const sawNewUuid = spy.mock.calls.some(([nVal]) =>
      Array.isArray(nVal) && nVal.includes('uuid-sma-RENAMED'))
    expect(sawNewUuid).toBe(true)
  })

  test('ids watcher FIRES on a structural add (new overlay → new $uuid in the container)', async () => {
    await mountChart()
    const spy = vi.spyOn(dc, 'on_ids_changed')

    // Push a new overlay into the reactive onchart CONTAINER (so the array's
    // reactivity fires), then update_ids — exactly cd.add's two steps. The new
    // settings.$uuid changes the ids-key → the ids watcher must fire. This is the
    // overlay-add path a leaked markRaw on the CONTAINER would have frozen.
    view().onchart.push({
      name: 'EMA', type: 'Spline',
      data: dc.data.onchart[0].data.map(p => [p[0], p[1] + 1]),
      settings: { $uuid: 'uuid-ema-1', color: '#0000ff' },
    })
    dc.update_ids()
    await settle(6)

    expect(spy).toHaveBeenCalled()
    expect(dc.data.onchart.length).toBe(2)
  })
})
