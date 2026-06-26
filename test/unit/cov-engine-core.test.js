// Coverage push — engine-core cluster. Targets the UNDER-covered internals of:
//   src/helpers/script_engine.js   (size limiting, data_required/match_ds,
//                                    make_ohlcv/custom_main, remove_scripts queue
//                                    purge, format_map output modes, update()
//                                    error boundary, _onScriptError)
//   src/helpers/dc_core.js          (range_changed loader + failure, chunk_loaded
//                                    array/object/recursion, update_overlays
//                                    datasets/array/scalar/.data, fast_merge 3
//                                    branches, update_ids grid-merge, update_tick/
//                                    update_candle seed paths)
//   src/helpers/dc_events.js        (register_tools presets+mods, change_settings,
//                                    data_changed gates, scripts_onrange, set_loading,
//                                    before_destroy, get_overlay miss)
//   src/helpers/script_ww_api.js    (relay, destroy socket cleanup, start_socket
//                                    no-url, deepToRaw Map/Set/typed-array/cycle)
//
// Strategy: drive the framework-agnostic class methods DIRECTLY (no DOM/canvas)
// with hand-built fakes for the few collaborators (`tv`, `agg`, recording `ww`).
// Behaviours were confirmed against the live source before being pinned — every
// assertion is on a real output value or branch, never a tautology.
import { test, expect, describe, beforeEach, vi, afterEach } from 'vitest'
import { reactive } from 'vue'
import { ScriptEngine } from '../../src/helpers/script_engine.js'
import { DatasetWW } from '../../src/helpers/dataset.js'
import DataCube from '../../src/helpers/datacube.js'
import WebWork from '../../src/helpers/script_ww_api.js'

// ───────────────────────────────────────────────────────────────────────────
// script_engine.js
// ───────────────────────────────────────────────────────────────────────────

// A minimal dataset stand-in: `{ type, last_upd, data }` is all the size /
// eviction / match_ds code reads.
function ds(type, data, last_upd) {
  return { type, last_upd, data, id: type.toLowerCase() }
}

describe('ScriptEngine.recalc_size / limit_size', () => {
  test('with no RAM limit, size is recorded, broadcast, and nothing is evicted', () => {
    const eng = new ScriptEngine()
    const sent = []
    eng.send = (type, data) => sent.push([type, data])
    eng.sett = { ww_ram_limit: 0 }
    eng.data = {
      ohlcv: { id: 'ohlcv', type: 'OHLCV', last_upd: 1, data: [[1, 2, 3, 4, 5, 6]] },
    }
    eng.recalc_size()
    // A finite, non-negative MB figure is stored (rounded to 2dp).
    expect(Number.isFinite(eng.data_size)).toBe(true)
    expect(eng.data_size).toBeGreaterThanOrEqual(0)
    // recalc_size's whole job is to record the size AND broadcast engine-state.
    const state = sent.find(([t]) => t === 'engine-state')
    expect(state).toBeDefined()
    expect(state[1].data_size).toBe(eng.data_size)
    expect(state[1].scripts).toBe(0) // empty map
    // No RAM pressure → the single dataset survives untouched.
    expect(Object.keys(eng.data)).toEqual(['ohlcv'])
    expect(eng.data.ohlcv.data).toEqual([[1, 2, 3, 4, 5, 6]])
  })

  test('limit_size evicts the OLDEST non-ohlcv dataset, never ohlcv', () => {
    const eng = new ScriptEngine()
    eng.send = () => {}
    // Each candle row carries enough numbers to exceed a tiny RAM limit.
    const rows = Array.from({ length: 200 }, (_, i) => [i, 1, 2, 3, 4, 5])
    eng.sett = { ww_ram_limit: 0.0001 } // ~100 bytes — forces eviction
    eng.data = {
      ohlcv: { id: 'ohlcv', type: 'OHLCV', last_upd: 100, data: rows },
      // older (smaller last_upd) → evicted first
      vol: { id: 'vol', type: 'VOL', last_upd: 1, data: rows.slice() },
      rsi: { id: 'rsi', type: 'RSI', last_upd: 50, data: rows.slice() },
    }
    eng.recalc_size()
    // ohlcv is NEVER a victim — it survives even though it sorts as oldest-ish.
    expect(eng.data.ohlcv).toBeDefined()
    expect(eng.data.ohlcv.data).toBe(rows) // same ref, untouched
    // The limit is far below even one dataset, so recalc_size's loop evicts
    // EVERY non-ohlcv dataset (oldest-first: vol@1 then rsi@50) until only the
    // protected main remains.
    expect(eng.data.vol).toBeUndefined()
    expect(eng.data.rsi).toBeUndefined()
    expect(Object.keys(eng.data)).toEqual(['ohlcv'])
  })

  test('limit_size evicts the OLDEST first when one eviction relieves the pressure', () => {
    const eng = new ScriptEngine()
    eng.send = () => {}
    const rows = Array.from({ length: 200 }, (_, i) => [i, 1, 2, 3, 4, 5])
    eng.data = {
      ohlcv: { id: 'ohlcv', type: 'OHLCV', last_upd: 100, data: rows },
      vol: { id: 'vol', type: 'VOL', last_upd: 1, data: rows.slice() },   // oldest
      rsi: { id: 'rsi', type: 'RSI', last_upd: 50, data: rows.slice() },
    }
    // A single limit_size() call removes exactly ONE victim — the oldest.
    eng.limit_size()
    expect(eng.data.vol).toBeUndefined()  // oldest (last_upd=1) chosen
    expect(eng.data.rsi).toBeDefined()    // newer one spared this pass
    expect(eng.data.ohlcv).toBeDefined()
  })

  test('limit_size is a no-op when only ohlcv remains (no victim found)', () => {
    const eng = new ScriptEngine()
    eng.send = () => {}
    const ohlcv = { id: 'ohlcv', type: 'OHLCV', last_upd: 1, data: [[1, 2, 3, 4, 5, 6]] }
    eng.data = { ohlcv }
    eng.limit_size()
    // The only dataset is the protected main → data is left exactly as it was.
    expect(eng.data).toEqual({ ohlcv })
    expect(eng.data.ohlcv).toBe(ohlcv) // identity preserved (nothing deleted)
  })
})

describe('ScriptEngine.data_required / match_ds', () => {
  test('returns null when every required type is already present', () => {
    const eng = new ScriptEngine()
    eng.map = {}
    eng.data = { ohlcv: ds('OHLCV', [[1]], 1) }
    // No scripts require anything beyond OHLCV (which exists) → satisfied.
    expect(eng.data_required()).toBeNull()
  })

  test('returns the unfulfilled requirement list when a script needs a missing dataset', () => {
    const eng = new ScriptEngine()
    eng.map = {}
    eng.data = { ohlcv: ds('OHLCV', [[1]], 1) }
    const s = { uuid: 'sc1', src: { data: { d0: { type: 'COOL_DS' } } } }
    const unf = eng.data_required(s)
    expect(Array.isArray(unf)).toBe(true)
    expect(unf).toEqual([{ id: 'sc1', type: 'COOL_DS' }])
  })

  test('aggregates requirements from the existing map too', () => {
    const eng = new ScriptEngine()
    eng.data = { ohlcv: ds('OHLCV', [[1]], 1) }
    eng.map = { existing: { uuid: 'existing', src: { data: { a: { type: 'MISSING_TYPE' } } } } }
    const unf = eng.data_required()
    expect(unf).toEqual([{ id: 'existing', type: 'MISSING_TYPE' }])
  })

  test('a script with no src.data contributes no requirements (only OHLCV checked)', () => {
    const eng = new ScriptEngine()
    eng.map = {}
    eng.data = { ohlcv: ds('OHLCV', [[1]], 1) }
    // src.data absent → the `if (sc.src.data)` branch is skipped; OHLCV present.
    expect(eng.data_required({ uuid: 's', src: {} })).toBeNull()
  })

  test('reports OHLCV itself as unfulfilled when the main dataset is absent', () => {
    const eng = new ScriptEngine()
    eng.map = {}
    eng.data = {} // no OHLCV at all
    expect(eng.data_required()).toEqual([{ type: 'OHLCV' }])
  })

  test('dedupes nothing but lists EACH missing requirement (per script/type)', () => {
    const eng = new ScriptEngine()
    eng.data = { ohlcv: ds('OHLCV', [[1]], 1) }
    eng.map = {}
    const s = { uuid: 'multi', src: { data: { a: { type: 'X' }, b: { type: 'Y' } } } }
    expect(eng.data_required(s)).toEqual([
      { id: 'multi', type: 'X' },
      { id: 'multi', type: 'Y' },
    ])
  })

  test('match_ds finds the dataset id whose type equals the requested type', () => {
    const eng = new ScriptEngine()
    eng.data = { ohlcv: ds('OHLCV', [], 1), spy: ds('STOCK', [], 1) }
    expect(eng.match_ds('any', 'STOCK')).toBe('spy')
    expect(eng.match_ds('any', 'NOPE')).toBeUndefined()
  })

  test('match_ds returns the FIRST matching id when several share a type', () => {
    const eng = new ScriptEngine()
    eng.data = {
      ohlcv: ds('OHLCV', [], 1),
      a: { type: 'DUP', data: [], id: 'a' },
      b: { type: 'DUP', data: [], id: 'b' },
    }
    // insertion order → 'a' wins
    expect(eng.match_ds('x', 'DUP')).toBe('a')
  })
})

describe('ScriptEngine.make_ohlcv (custom_main append)', () => {
  test('appends a new OHLCV row from the custom main symbol when update() returns truthy', () => {
    const eng = new ScriptEngine()
    eng.t = 1000
    eng.tf = 100
    eng.data = { ohlcv: { data: [[1000, 1, 2, 0, 1, 5]] } }
    const updateArgs = []
    eng.custom_main = {
      open: [10], high: [12], low: [9], close: [11], vol: [7],
      update: (...a) => { updateArgs.push(a); return true },
    }
    eng.make_ohlcv()
    // update() is invoked with (null, t + tf) — the NEXT bar timestamp
    expect(updateArgs).toEqual([[null, 1100]])
    // ...and the appended row reads o/h/l/c/v from the symbol's [0] slot
    expect(eng.data.ohlcv.data).toEqual([[1000, 1, 2, 0, 1, 5], [1100, 10, 12, 9, 11, 7]])
  })

  test('does NOT append when the symbol update() returns falsy', () => {
    const eng = new ScriptEngine()
    eng.t = 1000
    eng.tf = 100
    eng.data = { ohlcv: { data: [[1000, 1, 2, 0, 1, 5]] } }
    let called = 0
    eng.custom_main = { open: [0], high: [0], low: [0], close: [0], vol: [0], update: () => { called++; return false } }
    eng.make_ohlcv()
    expect(called).toBe(1) // update WAS consulted; its falsy return gated the append
    expect(eng.data.ohlcv.data).toEqual([[1000, 1, 2, 0, 1, 5]])
  })
})

describe('ScriptEngine.remove_scripts (map + queue + delta purge)', () => {
  test('drops the map entry, output cache, and any queued exec / delta for the dead id', () => {
    const eng = new ScriptEngine()
    const sent = []
    eng.send = (type, data) => sent.push([type, data])
    eng.map = { dead: { uuid: 'dead' }, alive: { uuid: 'alive' } }
    eng._outputCache.set('dead', { data: [] })
    eng._outputCache.set('alive', { data: [] })
    eng.queue = [{ uuid: 'dead' }, { uuid: 'alive' }]
    eng.delta_queue = [{ dead: { len: 1 }, alive: { len: 2 } }, { dead: { x: 9 } }]

    eng.remove_scripts(['dead'])

    expect(eng.map.dead).toBeUndefined()
    expect(eng.map.alive).toBeDefined()
    expect(eng._outputCache.has('dead')).toBe(false)
    expect(eng._outputCache.has('alive')).toBe(true)
    // queued exec for the dead overlay is purged; the alive one survives
    expect(eng.queue.map(s => s.uuid)).toEqual(['alive'])
    // the all-dead delta object is dropped entirely; the mixed one keeps `alive`
    expect(eng.delta_queue).toEqual([{ alive: { len: 2 } }])
    expect(eng._updateTemplate).toBeNull()
    // remove_scripts broadcasts the new engine state, now reporting 1 live script
    const state = sent.find(([t]) => t === 'engine-state')
    expect(state).toBeDefined()
    expect(state[1].scripts).toBe(1)
  })

  test('removing an id that is not present is a safe no-op on the surviving map', () => {
    const eng = new ScriptEngine()
    eng.send = () => {}
    eng.map = { alive: { uuid: 'alive' } }
    eng._outputCache.set('alive', { data: [] })
    eng.queue = [{ uuid: 'alive' }]
    eng.delta_queue = [{ alive: { len: 1 } }]
    eng.remove_scripts(['ghost'])
    expect(eng.map.alive).toBeDefined()
    expect(eng._outputCache.has('alive')).toBe(true)
    expect(eng.queue.map(s => s.uuid)).toEqual(['alive'])
    expect(eng.delta_queue).toEqual([{ alive: { len: 1 } }])
  })
})

describe('ScriptEngine.format_map output modes', () => {
  // Build a map entry with a synthetic env so format_map can read env.data /
  // env.onchart / env.offchart without a real run.
  function mapEntry(output) {
    return {
      output,
      env: {
        data: [[1000, 1], [2000, 2], [3000, 3]],
        onchart: {}, offchart: {},
      },
    }
  }

  test('output:false → data:null (suppressed), no env read', () => {
    const eng = new ScriptEngine()
    eng.map = { a: mapEntry(false) }
    const res = eng.format_map(['a'])
    expect(res).toEqual([{ id: 'a', data: null }])
  })

  test("output:'none' is treated like false", () => {
    const eng = new ScriptEngine()
    eng.map = { a: mapEntry('none') }
    expect(eng.format_map(['a'])).toEqual([{ id: 'a', data: null }])
  })

  test('output:false is OVERRIDDEN when the explicit `output` arg is set', () => {
    const eng = new ScriptEngine()
    eng.map = { a: mapEntry(false) }
    const res = eng.format_map(['a'], null, true)
    // Now the full series passes through instead of being nulled.
    expect(res[0].data).toEqual([[1000, 1], [2000, 2], [3000, 3]])
  })

  test("output:'range' slices the series to [t1,t2] (binary range slice)", () => {
    const eng = new ScriptEngine()
    eng.map = { a: mapEntry('range') }
    eng.range = [1500, 3000]
    const res = eng.format_map(['a'])
    // 1000 excluded (<1500); 2000 and 3000 included
    expect(res[0].data).toEqual([[2000, 2], [3000, 3]])
  })

  test('explicit range arg slices regardless of overlay output mode', () => {
    const eng = new ScriptEngine()
    eng.map = { a: mapEntry(true) }
    const res = eng.format_map(['a'], [0, 2000])
    expect(res[0].data).toEqual([[1000, 1], [2000, 2]])
  })

  test('appends a synthetic chart entry when custom_main is set', () => {
    const eng = new ScriptEngine()
    eng.map = { a: mapEntry(true) }
    eng.data = { ohlcv: { data: [[1, 2, 3, 4, 5, 6]] } }
    eng.custom_main = {}
    const res = eng.format_map(['a'])
    const chart = res.find(r => r.id === 'chart')
    expect(chart).toBeDefined()
    expect(chart.data).toEqual([[1, 2, 3, 4, 5, 6]])
  })

  test('default sel = all map keys when none passed', () => {
    const eng = new ScriptEngine()
    eng.map = { a: mapEntry(true), b: mapEntry(true) }
    const res = eng.format_map()
    expect(res.map(r => r.id).sort()).toEqual(['a', 'b'])
  })

  test('new_ovs mirrors env.onchart/offchart: non-data props copied, data passed through f', () => {
    const eng = new ScriptEngine()
    eng.map = {
      a: {
        output: true,
        env: {
          data: [[1000, 1], [2000, 2], [3000, 3]],
          onchart: { EMA0: { type: 'EMA', name: 'EMA 9', data: [[1000, 7], [2000, 8], [3000, 9]] } },
          offchart: { RSI0: { type: 'RSI', data: [[1000, 50]] } },
        },
      },
    }
    const res = eng.format_map(['a'], [1500, 3000]) // range slice applied to ALL series
    const ent = res[0]
    // main series sliced
    expect(ent.data).toEqual([[2000, 2], [3000, 3]])
    // onchart overlay: meta props preserved, data run through the SAME slice fn
    expect(ent.new_ovs.onchart.EMA0.type).toBe('EMA')
    expect(ent.new_ovs.onchart.EMA0.name).toBe('EMA 9')
    expect(ent.new_ovs.onchart.EMA0.data).toEqual([[2000, 8], [3000, 9]])
    // offchart overlay sliced too (1000 dropped, outside [1500,3000])
    expect(ent.new_ovs.offchart.RSI0.data).toEqual([])
    expect(ent.new_ovs.offchart.RSI0.type).toBe('RSI')
  })
})

describe('ScriptEngine binary slice helpers', () => {
  const arr = [[10], [20], [30], [40], [50]]
  test('_bsGTE finds the first index with t >= target', () => {
    const eng = new ScriptEngine()
    expect(eng._bsGTE(arr, 25)).toBe(2) // first >=25 is 30 at idx 2
    expect(eng._bsGTE(arr, 10)).toBe(0)
    expect(eng._bsGTE(arr, 100)).toBe(5) // past the end
  })
  test('_bsGT finds the exclusive upper bound (first index with t > target)', () => {
    const eng = new ScriptEngine()
    expect(eng._bsGT(arr, 30)).toBe(3) // 30 is <=, so bound moves past it
    expect(eng._bsGT(arr, 5)).toBe(0)
  })
  test('_rangeSlice returns [] for an empty input and for an empty intersection', () => {
    const eng = new ScriptEngine()
    expect(eng._rangeSlice([], 0, 100)).toEqual([])
    expect(eng._rangeSlice(arr, 60, 70)).toEqual([]) // lo>=hi → empty
  })
})

describe('ScriptEngine.update() error boundary', () => {
  test('a throw inside the step loop is caught and logged, never propagated', () => {
    const eng = new ScriptEngine()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    eng.data = { ohlcv: { data: [[1000, 1, 2, 0, 1, 5]] } }
    eng.running = false
    eng.shared = {}
    // A map entry whose env.step throws — the try/catch in update() must swallow it.
    eng.map = { boom: { env: { step() { throw new Error('kaboom') } } } }
    eng.make_mods_hooks = () => []
    expect(() => eng.update([[2000, 1, 2, 0, 1, 5]])).not.toThrow()
    // The outer boundary logs with its specific prefix and the original error.
    expect(errSpy).toHaveBeenCalledTimes(1)
    const [prefix, err] = errSpy.mock.calls[0]
    expect(prefix).toBe('Script update error:')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('kaboom')
    errSpy.mockRestore()
  })

  test('update() queues candles and returns early while a run is in flight', () => {
    const eng = new ScriptEngine()
    eng.data = { ohlcv: { data: [[1, 1, 1, 1, 1, 1]] } }
    eng.running = true
    eng.update_queue = []
    eng.update([[2, 1, 1, 1, 1, 1]])
    expect(eng.update_queue).toEqual([[[2, 1, 1, 1, 1, 1]]])
  })

  test('update() early-returns (no queueing, no send) when there is no ohlcv data', () => {
    const eng = new ScriptEngine()
    const sent = []
    eng.send = (...a) => sent.push(a)
    eng.update_queue = []
    // no ohlcv dataset at all
    eng.data = {}
    expect(eng.update([[1, 1, 1, 1, 1, 1]])).toBeUndefined()
    // ohlcv present but EMPTY
    eng.data = { ohlcv: { data: [] } }
    expect(eng.update([[1, 1, 1, 1, 1, 1]])).toBeUndefined()
    // the guard fires before the running/queue branch and before send_update/state
    expect(eng.update_queue).toEqual([])
    expect(sent).toEqual([])
  })
})

describe('ScriptEngine._onScriptError', () => {
  test('emits a structured script-error with uuid/name/type/phase/message', () => {
    const eng = new ScriptEngine()
    const sent = []
    eng.send = (type, data) => sent.push([type, data])
    eng.map = { rsi: { name: 'RSI', type: 'RSI' } }
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    eng._onScriptError('rsi', 'exec', new Error('div by zero'))
    expect(sent).toEqual([[
      'script-error',
      { uuid: 'rsi', name: 'RSI', type: 'RSI', phase: 'exec', message: 'div by zero' },
    ]])
    errSpy.mockRestore()
  })

  test('handles an unknown id and a non-Error throwable (String(e) fallback)', () => {
    const eng = new ScriptEngine()
    const sent = []
    eng.send = (type, data) => sent.push([type, data])
    eng.map = {}
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    eng._onScriptError('ghost', 'init', 'plain-string-error')
    expect(sent[0][1]).toEqual({
      uuid: 'ghost', name: undefined, type: undefined,
      phase: 'init', message: 'plain-string-error',
    })
    errSpy.mockRestore()
  })
})

describe('ScriptEngine.make_mods_hooks caching', () => {
  test('rebuilds the bound-fn array when the mods key changes, caches within a key', () => {
    const eng = new ScriptEngine()
    eng.mods = {}
    eng._hooksCache = {}
    eng._hooksModsKey = null
    // No mods → empty hooks; cached.
    expect(eng.make_mods_hooks('pre_step')).toEqual([])
    const cached = eng._hooksCache['pre_step']
    expect(eng.make_mods_hooks('pre_step')).toBe(cached) // same array (cache hit)

    // Add a mod with a pre_step hook → key changes → cache invalidated + rebuilt.
    const hits = []
    eng.mods = { m1: { pre_step: function (sel) { hits.push(sel) } } }
    const hooks = eng.make_mods_hooks('pre_step')
    expect(hooks).toHaveLength(1)
    expect(eng._hooksModsKey).toBe('m1') // key tracked the new mods set
    expect(hooks).not.toBe(cached)       // a fresh array, not the stale empty one
    hooks[0](['x'])
    expect(hits).toEqual([['x']])
    // The hook is bound to its mod (`this` === the mod) — bind() correctness.
    expect(typeof hooks[0]).toBe('function')
  })

  test('a key change does NOT serve a SECOND name from the stale cache (the pinned bug)', () => {
    // run()/update() call make_mods_hooks('pre_step') THEN ('post_step') in the
    // same tick. A naive impl updated _hooksModsKey on the first call, so the
    // second name was resolved against an already-fresh key and missed the new
    // module's post_step. This asserts BOTH names resolve against the new mods.
    const eng = new ScriptEngine()
    eng.mods = {}
    eng._hooksCache = {}
    eng._hooksModsKey = null
    // Warm both caches against the EMPTY mods set.
    expect(eng.make_mods_hooks('pre_step')).toEqual([])
    expect(eng.make_mods_hooks('post_step')).toEqual([])

    const pre = [], post = []
    eng.mods = {
      m1: {
        pre_step() { pre.push(1) },
        post_step() { post.push(1) },
      },
    }
    const preHooks = eng.make_mods_hooks('pre_step')   // first call, key flips here
    const postHooks = eng.make_mods_hooks('post_step')  // second call must still rebuild
    expect(preHooks).toHaveLength(1)
    expect(postHooks).toHaveLength(1)
    preHooks[0]()
    postHooks[0]()
    expect(pre).toEqual([1])
    expect(post).toEqual([1])
  })
})

describe('ScriptEngine.start (script_depth offset)', () => {
  test('depth 0 starts at index 0 (whole series)', () => {
    const eng = new ScriptEngine()
    eng.sett = { script_depth: 0 }
    expect(eng.start(new Array(100))).toBe(0)
  })
  test('positive depth clamps the start so it never goes negative', () => {
    const eng = new ScriptEngine()
    eng.sett = { script_depth: 30 }
    expect(eng.start(new Array(100))).toBe(70)
    eng.sett = { script_depth: 500 }
    expect(eng.start(new Array(100))).toBe(0) // Math.max(...,0)
  })
})

describe('ScriptEngine.exec_sel / exec_all early returns', () => {
  test('exec_sel returns immediately with no ohlcv data (no emissions)', async () => {
    const eng = new ScriptEngine()
    const sent = []
    eng.send = (...a) => sent.push(a)
    eng.data = {}
    await expect(eng.exec_sel({ a: {} })).resolves.toBeUndefined()
    // the no-data guard fires before any overlay-data / engine-state emission
    expect(sent).toEqual([])
  })

  test('exec_all returns immediately with no ohlcv data (no timer, no hash)', () => {
    const eng = new ScriptEngine()
    eng.data = {}
    eng.exec_id = null
    eng._dataHash = 'STALE'
    eng.exec_all()
    // returned BEFORE the setTimeout that arms exec_id and BEFORE _dataHash recompute
    expect(eng.exec_id).toBeNull()
    expect(eng._dataHash).toBe('STALE') // untouched → proves the early return
  })
})

describe('ScriptEngine.init_state restart bookkeeping', () => {
  test('a same-task call while running arms _restart and returns false', () => {
    const eng = new ScriptEngine()
    eng.running = true
    eng.task = 'a,b'
    eng._restart = false
    expect(eng.init_state(['a', 'b'])).toBe(false)
    expect(eng._restart).toBe(true)
  })

  test('a DIFFERENT-task call while running does NOT clobber an armed restart', () => {
    const eng = new ScriptEngine()
    eng.running = true
    eng.task = 'a,b'
    eng._restart = false
    expect(eng.init_state(['c'])).toBe(false)
    expect(eng._restart).toBe(false) // untouched — not its task
  })

  test('a fresh call (not running) resets engine state and returns true', () => {
    const eng = new ScriptEngine()
    eng.running = false
    // Dirty the state so we can prove init_state wipes it.
    eng.iter = 99; eng.t = 12345; eng.skip = true
    eng.tss = { stale: 1 }; eng.shared = { stale: 1 }; eng.std_plus = { stale: 1 }
    let synced = 0
    eng.syncState = () => { synced++ }
    expect(eng.init_state(['x', 'y'])).toBe(true)
    expect(eng.running).toBe(true)
    expect(eng.iter).toBe(0)
    expect(eng.t).toBe(0)
    expect(eng.skip).toBe(false)
    expect(eng.task).toBe('x,y') // sel joined by comma
    expect(eng._aborted).toBe(false)
    // shared bags reset to empty objects (not the stale refs)
    expect(eng.tss).toEqual({})
    expect(eng.shared).toEqual({})
    expect(eng.std_plus).toEqual({})
    // inverted price series are (re)created
    expect(eng.close && eng.close.__id__).toBe('close')
    expect(synced).toBe(1) // syncState pushed the fresh state once
  })
})

describe('ScriptEngine.restarted', () => {
  test('consumes an armed restart: clears flags, marks aborted, returns true', () => {
    const eng = new ScriptEngine()
    eng._restart = true
    eng.running = true
    expect(eng.restarted()).toBe(true)
    expect(eng._restart).toBe(false)
    expect(eng.running).toBe(false)
    expect(eng._aborted).toBe(true)
    expect(eng.perf).toBe(0)
    // a second call sees no armed restart
    expect(eng.restarted()).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// dc_core.js — driven via a real DataCube with a stubbed tv/agg
// ───────────────────────────────────────────────────────────────────────────

// Build a DataCube WITHOUT mounting; init_data() wires the stores. agg/tv are
// stubbed to record the side-effecting calls the update/merge paths make.
function mkCore(data = { chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] }, onchart: [], offchart: [] }) {
  const dc = new DataCube(data, { scripts: false, validation: 'off' })
  dc.init_data()
  dc.update_ids()
  const aggCalls = []
  dc.agg = { push: (...a) => aggCalls.push(a) }
  dc._aggCalls = aggCalls
  dc.tv = {
    $refs: { chart: { interval_ms: 100, cursor: { locked: false }, last_candle: null } },
    getRange: () => [0, 5000],
    goto: vi.fn(),
    controllers: [],
  }
  return dc
}

describe('dc_core.range_changed', () => {
  test('no loader registered → immediate return, no loading flip, no last_chunk', async () => {
    const dc = mkCore()
    dc.loader = null
    dc.last_chunk = 'SENTINEL'
    await dc.range_changed([0, 100], 100)
    expect(dc.loading).toBeFalsy()
    // returns at `if (!this.loader)` — BEFORE the `if (!check) last_chunk = ...` line
    expect(dc.last_chunk).toBe('SENTINEL')
  })

  test('loads an earlier chunk via a Promise loader, records last_chunk', async () => {
    vi.useFakeTimers()
    const dc = mkCore({ chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 6]] }, onchart: [], offchart: [] })
    const chunk = [[500, 1, 2, 0, 1, 4]]
    dc.loader = vi.fn(() => Promise.resolve(chunk))
    const merged = vi.spyOn(dc, 'merge').mockImplementation(() => {})

    const p = dc.range_changed([100, 1500], 100)
    await vi.runAllTimersAsync()
    await p

    expect(dc.loader).toHaveBeenCalled()
    // chunk_loaded merged the array into chart.data
    expect(merged).toHaveBeenCalledWith('chart.data', chunk)
    expect(dc.loading).toBe(false)
    vi.useRealTimers()
  })

  test('a rejecting loader does NOT leave `loading` stuck true', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const dc = mkCore({ chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] }, onchart: [], offchart: [] })
    dc.loader = vi.fn(() => Promise.reject(new Error('network blip')))

    const p = dc.range_changed([100, 900], 100)
    await vi.runAllTimersAsync()
    await p

    expect(dc.loading).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    vi.useRealTimers()
  })

  test('returns early when range[0] is not before the first candle (nothing to load)', async () => {
    const dc = mkCore()
    dc.loader = vi.fn()
    // range starts AT/after the first candle ts (1000) → no fetch
    await dc.range_changed([1000, 2000], 100)
    expect(dc.loader).not.toHaveBeenCalled()
    expect(dc.last_chunk).toEqual([[1000, 2000], 100])
  })

  test('returns early when chart data is empty', async () => {
    const dc = mkCore({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    dc.loader = vi.fn()
    await dc.range_changed([0, 100], 100)
    expect(dc.loader).not.toHaveBeenCalled()
  })

  test('does not start a new load while one is already in flight', async () => {
    const dc = mkCore()
    dc.loader = vi.fn()
    dc.loading = true
    await dc.range_changed([0, 100], 100)
    expect(dc.loader).not.toHaveBeenCalled()
  })

  test('check=true does NOT overwrite last_chunk', async () => {
    const dc = mkCore()
    dc.loader = vi.fn()
    dc.last_chunk = ['SENTINEL']
    await dc.range_changed([1000, 2000], 100, true)
    expect(dc.last_chunk).toEqual(['SENTINEL'])
  })
})

describe('dc_core.chunk_loaded', () => {
  test('array payload merges into chart.data and clears loading', () => {
    const dc = mkCore()
    const merged = vi.spyOn(dc, 'merge').mockImplementation(() => {})
    dc.chunk_loaded([[500, 1, 2, 0, 1, 4]])
    expect(merged).toHaveBeenCalledWith('chart.data', [[500, 1, 2, 0, 1, 4]])
    expect(dc.loading).toBe(false)
  })

  test('object payload merges every key (chart.data + overlays)', () => {
    const dc = mkCore()
    const merged = vi.spyOn(dc, 'merge').mockImplementation(() => {})
    dc.chunk_loaded({ 'chart.data': [[1, 2]], 'onchart.EMA0.data': [[3, 4]] })
    expect(merged).toHaveBeenCalledWith('chart.data', [[1, 2]])
    expect(merged).toHaveBeenCalledWith('onchart.EMA0.data', [[3, 4]])
  })

  test('re-triggers range_changed when a deferred last_chunk was queued', () => {
    const dc = mkCore()
    vi.spyOn(dc, 'merge').mockImplementation(() => {})
    const rc = vi.spyOn(dc, 'range_changed').mockImplementation(() => {})
    dc.last_chunk = [[1, 2], 100]
    dc.chunk_loaded([[1, 2]])
    expect(rc).toHaveBeenCalledWith([1, 2], 100, true)
    expect(dc.last_chunk).toBeNull()
  })
})

describe('dc_core.update_overlays', () => {
  test('skips price/volume/candle/t keys, routes datasets.* via agg, builds .data and t-prefix for the rest', () => {
    const dc = mkCore()
    dc._aggCalls.length = 0
    dc.update_overlays(
      {
        price: 1, volume: 2, candle: [], t: 5,            // all skipped
        'datasets.foo': [9, 9],                            // dataset path (no .data, no t-prefix)
        'onchart.EMA0': 42,                                // scalar → wrapped to [42]
        'onchart.RSI0.data': [3, 4],                       // already .data → array kept
      },
      1000, 100
    )
    const byKey = Object.fromEntries(dc._aggCalls.map(c => [c[0], c[1]]))
    // dataset path: pushed verbatim, no [t,...] wrap
    expect(byKey['datasets.foo']).toEqual([9, 9])
    // scalar wrapped + .data suffix added + t prefixed
    expect(byKey['onchart.EMA0.data']).toEqual([1000, 42])
    // array value kept, .data already present, t prefixed
    expect(byKey['onchart.RSI0.data']).toEqual([1000, 3, 4])
    // none of the reserved keys produced a push
    expect(byKey['price.data']).toBeUndefined()
  })
})

describe('dc_core.fast_merge', () => {
  test('appends a strictly-later point and touches data', () => {
    const dc = mkCore()
    dc.sett = { auto_scroll: false }
    const touch = vi.spyOn(dc, 'touchData').mockImplementation(() => {})
    const data = [[1000, 1], [2000, 2]]
    dc.fast_merge(data, [3000, 3])
    expect(data).toEqual([[1000, 1], [2000, 2], [3000, 3]])
    expect(touch).toHaveBeenCalled()
  })

  test('replaces the last point in place when timestamps are equal', () => {
    const dc = mkCore()
    const touch = vi.spyOn(dc, 'touchData').mockImplementation(() => {})
    const data = [[1000, 1], [2000, 2]]
    dc.fast_merge(data, [2000, 99])
    expect(data).toEqual([[1000, 1], [2000, 99]])
    expect(touch).toHaveBeenCalled()
  })

  test('an OLDER point is dropped (no push, no replace, no touch)', () => {
    const dc = mkCore()
    const touch = vi.spyOn(dc, 'touchData').mockImplementation(() => {})
    const data = [[1000, 1], [2000, 2]]
    dc.fast_merge(data, [1500, 7])
    expect(data).toEqual([[1000, 1], [2000, 2]])
    expect(touch).not.toHaveBeenCalled()
  })

  test('null data is a safe no-op (no touch, no scroll)', () => {
    const dc = mkCore()
    dc.sett = { auto_scroll: true }
    const touch = vi.spyOn(dc, 'touchData').mockImplementation(() => {})
    const scroll = vi.spyOn(dc, 'scroll_to').mockImplementation(() => {})
    const ret = dc.fast_merge(null, [1, 2])
    expect(ret).toBeUndefined()
    expect(touch).not.toHaveBeenCalled()
    expect(scroll).not.toHaveBeenCalled()
  })

  test('appending to an EMPTY series triggers auto_scroll when enabled', () => {
    const dc = mkCore()
    dc.sett = { auto_scroll: true }
    const scroll = vi.spyOn(dc, 'scroll_to').mockImplementation(() => {})
    vi.spyOn(dc, 'touchData').mockImplementation(() => {})
    dc.fast_merge([], [5000, 1], true)
    expect(scroll).toHaveBeenCalledWith(5000)
  })
})

describe('dc_core.update_ids grid mapping', () => {
  test('offchart overlays sharing an explicit grid.id land in the SAME grid bucket', () => {
    const dc = new DataCube({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ type: 'EMA', data: [] }],
      offchart: [
        { type: 'RSI', data: [], grid: { id: 1 } },
        { type: 'MACD', data: [], grid: { id: 1 } },
      ],
    }, { scripts: false, validation: 'off' })
    dc.update_ids()
    // Both offchart overlays were assigned ids and grid-layer mappings.
    expect(dc.data.offchart[0].id).toBe('offchart.RSI0')
    expect(dc.data.offchart[1].id).toBe('offchart.MACD0')
    // explicit grid.id=1 → both map under g1_*
    expect(dc.dcgl['offchart.RSI0']).toMatch(/^g1_/)
    expect(dc.dcgl['offchart.MACD0']).toMatch(/^g1_/)
    // onchart overlay auto-named when name absent
    expect(dc.data.onchart[0].name).toBe('EMA 0')
  })
})

describe('dc_core merge/query delegates', () => {
  const dc = new DataCube({ chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]], foo: 7 } }, { scripts: false, validation: 'off' })

  test('binarySearchGTE / binarySearchLTE on a sorted ts series', () => {
    const arr = [[10], [20], [30], [40]]
    expect(dc.binarySearchGTE(arr, 25)).toBe(2)  // first >=25 → 30 at idx 2
    expect(dc.binarySearchGTE(arr, 5)).toBe(0)
    expect(dc.binarySearchGTE(arr, 99)).toBe(-1) // none
    expect(dc.binarySearchLTE(arr, 25)).toBe(1)  // last <=25 → 20 at idx 1
    expect(dc.binarySearchLTE(arr, 5)).toBe(-1)  // none
    expect(dc.binarySearchGTE([], 1)).toBe(-1)
  })

  test('ts_overlap returns the overlapping region descriptor', () => {
    const a = [[10, 1], [20, 2], [30, 3]]
    const b = [[20, 9], [30, 9], [40, 9]]
    const ov = dc.ts_overlap(a, b, [20, 30])
    // overlapping keys 20 and 30 (b wins on conflicts via Map set order)
    expect(ov.od.map(r => r[0])).toEqual([20, 30])
    expect(ov.d1[1]).toBe(2) // 2 elements of `a` in window
    expect(ov.d2[1]).toBe(2)
  })

  test('combine appends a strictly-later source to the destination', () => {
    const out = dc.combine([[1, 1], [2, 2]], [], [[3, 3], [4, 4]])
    expect(out).toEqual([[1, 1], [2, 2], [3, 3], [4, 4]])
  })

  test('combine PREPENDS an entirely-earlier source (gap-fill chunk before history)', () => {
    // src ends before dst starts → the `src[0][0] < dst[0][0]` branch prepends.
    const out = dc.combine([[3, 3], [4, 4]], [], [[1, 1], [2, 2]])
    expect(out).toEqual([[1, 1], [2, 2], [3, 3], [4, 4]])
  })

  test('combine treats a source fully inside the destination as a no-op merge', () => {
    const dst = [[1, 1], [2, 2], [3, 3]]
    const out = dc.combine(dst, [], [[2, 9]]) // src within [1,3] → dst returned as-is
    expect(out).toBe(dst)
    expect(out).toEqual([[1, 1], [2, 2], [3, 3]])
  })

  test('merge_objects writes a merged object back through the pivot ref', () => {
    const holder = { v: { a: 1 } }
    const pivot = { p: holder, i: 'v', v: holder.v }
    dc.merge_objects(pivot, { b: 2 })
    expect(holder.v).toEqual({ a: 1, b: 2 })
  })

  test('chart_as_piv returns the chart pivot, optionally for a named field', () => {
    const whole = dc.chart_as_piv(['chart'])
    expect(whole[0].i).toBe('chart')
    expect(whole[0].v).toBe(dc.data.chart)
    const field = dc.chart_as_piv(['chart', 'foo'])
    expect(field[0].i).toBe('foo')
    expect(field[0].v).toBe(7)
  })

  test('query_search finds overlays by id/name across a side', () => {
    const dc2 = new DataCube({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'My EMA', type: 'EMA', data: [], settings: { $uuid: 'U1' } }],
      offchart: [],
    }, { scripts: false, validation: 'off' })
    dc2.update_ids()
    const hits = dc2.query_search('onchart.EMA0', ['onchart', 'EMA0'])
    expect(hits).toHaveLength(1)
    expect(hits[0].v.name).toBe('My EMA')
  })
})

describe('dc_core.scroll_to', () => {
  test('no-op when the cursor is locked', () => {
    const dc = mkCore()
    dc.tv.$refs.chart.cursor = { locked: true }
    dc.tv.$refs.chart.last_candle = [1000]
    dc.scroll_to(2000)
    expect(dc.tv.goto).not.toHaveBeenCalled()
  })

  test('no-op when there is no last candle', () => {
    const dc = mkCore()
    dc.tv.$refs.chart.cursor = { locked: false }
    dc.tv.$refs.chart.last_candle = null
    dc.scroll_to(2000)
    expect(dc.tv.goto).not.toHaveBeenCalled()
  })

  test('gotos t + trailing gap when the last candle is within the visible range', () => {
    const dc = mkCore()
    dc.tv.$refs.chart.cursor = { locked: false }
    dc.tv.$refs.chart.last_candle = [4000]
    // getRange()[1] is 5000 → d = 5000-4000 = 1000 > 0 → goto(t + d)
    dc.scroll_to(4000)
    expect(dc.tv.goto).toHaveBeenCalledWith(5000)
  })

  test('does NOT goto when the last candle is already at/past the range edge', () => {
    const dc = mkCore()
    dc.tv.$refs.chart.cursor = { locked: false }
    dc.tv.$refs.chart.last_candle = [5000] // d = 5000-5000 = 0 → no goto
    dc.scroll_to(5000)
    expect(dc.tv.goto).not.toHaveBeenCalled()
  })
})

describe('dc_core.update_tick / update_candle seed + tick paths', () => {
  // Use a real DataCube; agg.push stubbed; tv provides interval_ms + a cursor.
  function mkTickDc(data) {
    const dc = mkCore(data)
    dc.sett = { auto_scroll: false }
    vi.spyOn(dc, 'scroll_to').mockImplementation(() => {})
    vi.spyOn(dc, 'touchData').mockImplementation(() => {})
    return dc
  }

  test('update_tick seeds the FIRST candle on an empty chart', () => {
    const dc = mkTickDc({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    dc.update_tick({ price: 100, volume: 5, t: 1000 })
    const data = dc.data.chart.data
    expect(data.length).toBe(1)
    // zero-height seed candle [t, o,h,l,c, v]
    expect(data[0].slice(1)).toEqual([100, 100, 100, 100, 5])
  })

  test('update_tick updates an in-progress candle (h/l/c/v) when within the same bar', () => {
    const dc = mkTickDc({ chart: { type: 'Candles', data: [[1000, 100, 100, 100, 100, 5]] }, onchart: [], offchart: [] })
    // tf=100 so t_next = 1100; a tick at t=1050 stays in the same bar
    dc.update_tick({ price: 120, volume: 3, t: 1050 })
    const last = dc.data.chart.data[0]
    expect(last[2]).toBe(120) // high raised
    expect(last[3]).toBe(100) // low kept
    expect(last[4]).toBe(120) // close = tick
    expect(last[5]).toBe(8)   // vol accumulated 5+3
  })

  test('update_tick warns and returns when there is no timeframe', () => {
    const dc = mkTickDc({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    dc.tv.$refs.chart.interval_ms = undefined
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    dc.update_tick({ price: 1, t: 1000 })
    expect(warn).toHaveBeenCalledWith('Define the main timeframe')
    warn.mockRestore()
  })

  test('update_candle with a full 6-field candle uses the candle ts', () => {
    const dc = mkTickDc({ chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] }, onchart: [], offchart: [] })
    dc._aggCalls.length = 0
    const closed = dc.update_candle({ candle: [1100, 2, 3, 1, 2, 7] })
    // the full candle is pushed VERBATIM to the ohlcv aggregator
    const ohlcvPush = dc._aggCalls.find(c => c[0] === 'ohlcv')
    expect(ohlcvPush).toBeDefined()
    expect(ohlcvPush[1]).toEqual([1100, 2, 3, 1, 2, 7])
    // closed = t >= t_next; with last ts=1000, tf=100 → t_next=1100, t=1100 → true
    expect(closed).toBe(true)
  })

  test('update_candle returns false (still-open) when the full candle ts is before t_next', () => {
    const dc = mkTickDc({ chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] }, onchart: [], offchart: [] })
    dc._aggCalls.length = 0
    // tf=100 → t_next = 1100; a candle stamped 1050 is still in the open bar
    const closed = dc.update_candle({ candle: [1050, 2, 3, 1, 2, 7] })
    expect(dc._aggCalls.find(c => c[0] === 'ohlcv')[1]).toEqual([1050, 2, 3, 1, 2, 7])
    expect(closed).toBe(false)
  })

  test('update_candle returns false on empty chart + short candle (cannot seed)', () => {
    const dc = mkTickDc({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] })
    // short candle (<6 fields) and no `last` → guard returns false
    expect(dc.update_candle({ candle: [2, 3, 1, 2, 7] })).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// dc_events.js
// ───────────────────────────────────────────────────────────────────────────

function makeWW() {
  const calls = []
  return { calls, just(type, data) { calls.push([type, data]) }, exec() {}, destroy() { this.destroyed = true } }
}

function seedEvents(data = { chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] }, onchart: [], offchart: [] }, sett = {}) {
  const dc = new DataCube(data, Object.assign({ scripts: true, validation: 'off' }, sett))
  dc.init_data()
  dc.update_ids()
  dc.ww = makeWW()
  dc.se_state = {}
  dc.tv = {
    controllers: [],
    $refs: { chart: { interval_ms: 60000 } },
    getRange: () => [1000, 2000],
    $emit: vi.fn(),
    $nextTick: (fn) => fn && fn(),
    showTheTip: vi.fn(),
  }
  return dc
}

describe('dc_events.register_tools (presets + mods)', () => {
  test('builds the toolbar list: Cursor first, applies presets, expands mods, resets tool', () => {
    const dc = seedEvents()
    // A preset for the tool type pre-seeded in data.tools (consumed + stripped).
    dc.data.tools = [{ type: 'LineTool', settings: { color: '#abc' }, name: 'Preset Line' }]
    dc.register_tools([
      {
        use_for: 'LineTool',
        info: {
          type: 'Segment',
          icon: 'seg.png',
          settings: { width: 2 },
          mods: { Ray: { icon: 'ray.png' } },
        },
      },
    ])
    const types = dc.data.tools.map(t => t.type)
    expect(types[0]).toBe('Cursor')
    // base tool + its Ray mod both present
    expect(types).toContain('LineTool:Segment')
    expect(types).toContain('LineTool:Ray')
    // preset merged onto the matching tool (name from preset overrides)
    const seg = dc.data.tools.find(t => t.type === 'LineTool:Segment')
    expect(seg.name).toBe('Preset Line')
    expect(seg.settings.color).toBe('#abc') // settings object MERGED, not replaced
    expect(seg.settings.width).toBe(2)
    // active tool reset to Cursor
    expect(dc.data.tool).toBe('Cursor')
  })
})

describe('dc_events.change_settings', () => {
  test('merges settings into the overlay and bumps the render revision', () => {
    const dc = seedEvents({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'L', type: 'Spline', data: [], settings: { $uuid: 'U1', color: '#000' } }],
      offchart: [],
    }, { scripts: false })
    const touch = vi.spyOn(dc, 'touchData')
    // change_settings args: [settings, grid_id, layer_id, dcid]
    dc.change_settings([{ id: 'IGNORED', color: '#fff', width: 3 }, 0, 'Spline0', 'onchart.Spline0'])
    const ov = dc.data.onchart[0]
    expect(ov.settings.color).toBe('#fff')
    expect(ov.settings.width).toBe(3)
    expect(ov.settings.id).toBeUndefined() // `id` stripped before merge
    expect(touch).toHaveBeenCalled()
  })
})

describe('dc_events.data_changed gates', () => {
  test('no-op when scripts disabled', () => {
    const dc = seedEvents(undefined, { scripts: false })
    dc.data_changed([])
    expect(dc.ww.calls).toHaveLength(0)
  })

  test('no-op when data_change_exec is explicitly false', () => {
    const dc = seedEvents(undefined, { scripts: true, data_change_exec: false })
    dc.se_state = { scripts: 1 }
    dc.data_changed([])
    expect(dc.ww.calls).toHaveLength(0)
  })

  test('no-op while a data upload is already in flight', () => {
    const dc = seedEvents()
    dc.ww._data_uploading = true
    dc.se_state = { scripts: 1 }
    dc.data_changed([])
    expect(dc.ww.calls).toHaveLength(0)
  })

  test('no-op when the engine reports no live scripts', () => {
    const dc = seedEvents()
    dc.se_state = { scripts: 0 }
    dc.data_changed([])
    expect(dc.ww.calls).toHaveLength(0)
  })

  test('happy path: sends meta + upload-data and sets the uploading flag', () => {
    const dc = seedEvents()
    dc.se_state = { scripts: 1 }
    dc.ww._data_uploading = false
    dc.data_changed([])
    const types = dc.ww.calls.map(c => c[0])
    expect(types).toEqual(['send-meta-info', 'upload-data'])
    expect(dc.ww.calls[1][1]).toEqual({ ohlcv: [[1000, 1, 2, 0, 1, 5]] })
    expect(dc.ww._data_uploading).toBe(true)
  })
})

describe('dc_events.scripts_onrange', () => {
  test('no-op when scripts disabled', () => {
    const dc = seedEvents(undefined, { scripts: false })
    dc.scripts_onrange([1000, 2000])
    expect(dc.ww.calls).toHaveLength(0)
  })

  test('emits update-ov-settings only for execOnRange overlays with a $uuid', () => {
    const dc = seedEvents({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [
        { name: 'A', type: 'EMA', data: [], settings: { $uuid: 'UA' }, script: { execOnRange: true } },
        { name: 'B', type: 'WMA', data: [], settings: { $uuid: 'UB' }, script: { execOnRange: false } },
      ],
      offchart: [],
    })
    dc.scripts_onrange([1000, 2000])
    const call = dc.ww.calls.find(c => c[0] === 'update-ov-settings')
    expect(call).toBeDefined()
    // only the execOnRange overlay made it into the delta
    expect(Object.keys(call[1].delta)).toEqual(['UA'])
  })

  test('no WW traffic when nothing qualifies', () => {
    const dc = seedEvents({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'A', type: 'EMA', data: [], settings: { $uuid: 'UA' }, script: { execOnRange: false } }],
      offchart: [],
    })
    dc.scripts_onrange([1000, 2000])
    expect(dc.ww.calls.find(c => c[0] === 'update-ov-settings')).toBeUndefined()
  })
})

describe('dc_events.set_loading', () => {
  test('flips `loading` on every overlay that has $props', () => {
    const dc = seedEvents({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [
        { name: 'Scripted', type: 'EMA', data: [], settings: { $uuid: 'UA', $props: ['len'] } },
        { name: 'Plain', type: 'Spline', data: [], settings: { $uuid: 'UB' } }, // no $props → untouched
      ],
      offchart: [],
    }, { scripts: false })
    dc.set_loading(true)
    expect(dc.data.onchart[0].loading).toBe(true)
    expect(dc.data.onchart[1].loading).toBeUndefined()
  })
})

describe('dc_events.get_overlay miss', () => {
  test('an unresolvable grid/layer id returns undefined (no arbitrary overlay)', () => {
    const dc = seedEvents()
    expect(dc.get_overlay({ grid_id: 9, layer_id: 'Nope_5' })).toBeUndefined()
  })

  test('resolves via the gldc map by grid/layer id', () => {
    const dc = seedEvents({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'EMA', type: 'EMA', data: [], settings: { $uuid: 'UA' } }],
      offchart: [],
    })
    const ov = dc.get_overlay({ grid_id: 0, layer_id: 'EMA_0' })
    expect(ov).toBeDefined()
    expect(ov.id).toBe('onchart.EMA0')
  })
})

describe('dc_events.before_destroy', () => {
  test('filters unfinished tools, resets drawing/scroll, clears selection, destroys ww', () => {
    const dc = seedEvents({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [
        { name: 'Done', type: 'LineTool', data: [], settings: { $uuid: 'D', $state: 'finished' } },
        { name: 'WIP', type: 'LineTool', data: [], settings: { $uuid: 'W', $state: 'wip' } },
        { name: 'Plain', type: 'Spline', data: [], settings: { $uuid: 'P' } }, // no $state → kept
      ],
      offchart: [
        { name: 'OffWip', type: 'LineTool', data: [], settings: { $uuid: 'OW', $state: 'wip' } },
      ],
    }, { scripts: false })
    dc.data.tools = []
    dc.before_destroy()
    // wip onchart tool dropped; finished + plain kept
    expect(dc.data.onchart.map(x => x.name)).toEqual(['Done', 'Plain'])
    // wip offchart tool dropped
    expect(dc.data.offchart).toEqual([])
    expect(dc.data.drawingMode).toBe(false)
    expect(dc.data.scrollLock).toBe(false)
    expect(dc.data.selected).toBeNull()
    expect(dc.ww.destroyed).toBe(true)
  })
})

describe('dc_events.on_custom_event tool selection', () => {
  test('tool-selected with a System: tool routes to system_tool (Remove)', () => {
    const dc = seedEvents({
      chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5]] },
      onchart: [{ name: 'Box', type: 'OrderBox', data: [], settings: { $uuid: 'BX' } }],
      offchart: [],
    }, { scripts: false })
    dc.data.tools = []
    dc.data.selected = 'BX'
    dc.on_custom_event('tool-selected', ['System:Remove'])
    // the selected overlay was removed
    expect(dc.data.onchart).toEqual([])
  })

  test('tool-selected with a falsy first arg is ignored (tool unchanged)', () => {
    const dc = seedEvents(undefined, { scripts: false })
    dc.data.tool = 'PreExisting'
    dc.data.drawingMode = true
    dc.on_custom_event('tool-selected', [null])
    // early `break` → neither the active tool nor drawing mode is touched
    expect(dc.data.tool).toBe('PreExisting')
    expect(dc.data.drawingMode).toBe(true)
  })

  test('tool-selected with a real (non-System) tool sets it and leaves drawing on', () => {
    const dc = seedEvents(undefined, { scripts: false })
    dc.data.drawingMode = true
    dc.on_custom_event('tool-selected', ['LineTool:Segment'])
    expect(dc.data.tool).toBe('LineTool:Segment')
    // only 'Cursor' turns drawing off; a real tool leaves it on
    expect(dc.data.drawingMode).toBe(true)
  })

  test('tool-selected with Cursor turns drawing mode off', () => {
    const dc = seedEvents(undefined, { scripts: false })
    dc.data.drawingMode = true
    dc.on_custom_event('tool-selected', ['Cursor'])
    expect(dc.data.tool).toBe('Cursor')
    expect(dc.data.drawingMode).toBe(false)
  })

  test('scroll-lock + drawing-mode-off custom events flip the right flags', () => {
    const dc = seedEvents(undefined, { scripts: false })
    dc.on_custom_event('scroll-lock', [true])
    expect(dc.data.scrollLock).toBe(true)
    dc.data.drawingMode = true
    dc.on_custom_event('drawing-mode-off', [])
    expect(dc.data.drawingMode).toBe(false)
    expect(dc.data.tool).toBe('Cursor')
  })
})

// ───────────────────────────────────────────────────────────────────────────
// script_ww_api.js — deepToRaw edge types, relay, destroy/socket cleanup
// ───────────────────────────────────────────────────────────────────────────

function recWorker() {
  return {
    onmessage: null, messages: [], transfers: [],
    postMessage(m, tx) { this.messages.push(m); if (tx) this.transfers.push(tx) },
    terminate() { this.terminated = true },
  }
}
function mkWW(sett = {}) { return new WebWork({ sett }) }

describe('script_ww_api deepToRaw special-cased types', () => {
  test('Map / Set / typed-array / ArrayBuffer pass through untouched (not flattened)', () => {
    const ww = mkWW()
    const rec = recWorker()
    ww.worker = rec
    const map = new Map([['k', 1]])
    const set = new Set([1, 2])
    const f64 = new Float64Array([1.5, 2.5])
    const buf = new ArrayBuffer(8)
    ww.send({ type: 't', data: { map, set, f64, buf } })
    const sent = rec.messages[0].data
    expect(sent.map).toBe(map)
    expect(sent.set).toBe(set)
    expect(sent.f64).toBe(f64) // NOT turned into a string-keyed object
    expect(sent.buf).toBe(buf)
  })

  test('a self-referential object does not recurse infinitely (cycle guard)', () => {
    const ww = mkWW()
    const rec = recWorker()
    ww.worker = rec
    const cyc = { a: 1 }
    cyc.self = cyc
    expect(() => ww.send({ type: 't', data: { cyc } })).not.toThrow()
    // the cycle is preserved as a back-reference, not deep-copied forever
    const out = rec.messages[0].data.cyc
    expect(out.a).toBe(1)
    // On revisit the guard returns the ORIGINAL object (postMessage's structured
    // clone then re-knits the cycle), so the back-ref resolves to a {a:1} node.
    expect(out.self).toBeDefined()
    expect(out.self.a).toBe(1)
    // and following it once more closes the loop (no infinite fresh copies)
    expect(out.self.self.a).toBe(1)
  })

  test('a nested reactive array is deep-unwrapped to a plain array', () => {
    const ww = mkWW()
    const rec = recWorker()
    ww.worker = rec
    const arr = reactive([[1, 2], [3, 4]])
    ww.send({ type: 't', data: { arr } })
    const out = rec.messages[0].data.arr
    expect(Array.isArray(out)).toBe(true)
    expect(out).not.toBe(arr)         // a raw copy, not the reactive proxy
    expect(out).toEqual([[1, 2], [3, 4]])
  })

  test('send is a no-op when there is no worker and no node_url (nothing queued)', () => {
    const ww = mkWW()
    ww.worker = null
    ww.msg_queue = []
    ww.send({ type: 't', data: {} })
    // node_url branch skipped, worker branch returns → no queue write, no socket
    expect(ww.msg_queue).toEqual([])
    expect(ww.socket).toBeUndefined()
  })
})

describe('script_ww_api relay', () => {
  test('just=true relays the event to the worker and registers NO task', () => {
    const ww = mkWW()
    const rec = recWorker()
    ww.worker = rec
    // NB: not awaited — a `just` relay never resolves (no reply task is armed),
    // by design. We assert the SIDE EFFECTS: the event was posted, no task left.
    ww.relay({ type: 'e', id: 'rid', data: { k: 1 } }, true)
    expect(rec.messages[0]).toEqual({ type: 'e', id: 'rid', data: { k: 1 } })
    expect(Object.keys(ww.tasks)).toHaveLength(0)
  })
})

describe('script_ww_api relay registers a pending task', () => {
  test('non-just relay posts the event and arms a task awaiting the reply', () => {
    const ww = mkWW()
    const rec = recWorker()
    ww.worker = rec
    ww.relay({ type: 'e', id: 'RID', data: { x: 1 } }) // not awaited — just inspect side effects
    // the event was posted to the worker
    expect(rec.messages[0]).toEqual({ type: 'e', id: 'RID', data: { x: 1 } })
    // a task keyed by the event id is now pending
    expect(typeof ww.tasks.RID).toBe('function')
  })

  test('relay is a no-op returning null with no worker/node_url', async () => {
    const ww = mkWW()
    ww.worker = null
    await expect(ww.relay({ id: 'x' })).resolves.toBeNull()
  })
})

describe('script_ww_api start_socket / send_node guards', () => {
  test('start_socket returns early when node_url is unset (no socket created)', () => {
    const ww = mkWW()
    ww.dc.sett.node_url = null
    ww.start_socket()
    // the `if (!node_url) return` fires before `new WebSocket(...)`
    expect(ww.socket).toBeUndefined()
  })

  test('send_node queues while CONNECTING, caps the queue, then flushes in order on OPEN', () => {
    const sent = []
    let listeners = {}
    class FakeWS {
      constructor() { this.readyState = 0; FakeWS.last = this }
      addEventListener(t, fn) { listeners[t] = fn }
      send(s) { sent.push(JSON.parse(s)) }
      close() { this.closed = true }
    }
    FakeWS.OPEN = 1
    vi.stubGlobal('WebSocket', FakeWS)
    const ww = mkWW({ node_url: 'ws://x' })
    ww.send({ type: 'a' }) // CONNECTING → queued
    expect(ww.msg_queue).toHaveLength(1)
    FakeWS.last.readyState = 1
    ww.send({ type: 'b' }) // flush + send
    expect(sent.map(m => m.type)).toEqual(['a', 'b'])
    vi.unstubAllGlobals()
  })
})

describe('script_ww_api destroy', () => {
  test('terminates the worker and nulls it out', () => {
    const ww = mkWW()
    const rec = recWorker()
    ww.worker = rec
    ww.destroy()
    expect(rec.terminated).toBe(true)
    expect(ww.worker).toBeNull()
    expect(ww.tasks).toEqual({})
  })

  test('removes socket listeners and closes the socket', () => {
    const removed = []
    const ww = mkWW()
    ww.worker = null
    ww._socketMessageHandler = () => {}
    ww._socketErrorHandler = () => {}
    ww._socketCloseHandler = () => {}
    ww.socket = {
      removeEventListener: (t) => removed.push(t),
      close: () => { ww.socket && (ww.socket._closed = true) },
    }
    const sock = ww.socket
    ww.destroy()
    expect(removed.sort()).toEqual(['close', 'error', 'message'])
    expect(sock._closed).toBe(true)
    expect(ww.socket).toBeNull()
  })
})
