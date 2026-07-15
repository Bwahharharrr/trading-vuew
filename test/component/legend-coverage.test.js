// @vitest-environment jsdom
//
// Unit-coverage for Legend.vue's computeds + action emitters, exercised by
// binding the component's computed getters / methods to a controllable `this`
// (the same fake-`this` pattern used by position-plot-select.test.js for App.vue).
// This pins the render-cache behaviour (OHLCV cache, format() LRU memo), the
// per-type id suffixing in indicators(), calc_style geometry, and the exact
// shape / object-identity of every emitted event — including the SCMR/SCMR(INV)
// disambiguation invariant that closeIndicator must forward the SAME settings ref.
import { test, expect, describe, beforeEach } from 'vitest'
import Legend from '../../src/components/Legend.vue'
import { VOLUME_LEGEND_FLAG } from '../../src/stuff/volume.js'

const C = Legend.computed
const M = Legend.methods

// A controllable `this` for Legend. Computeds reference other computeds via
// `this.<name>` (resolved values), and props via `this.$props.<name>`, so we
// just stash both on the same object. `created()` seeds the non-reactive caches.
function mkCtx(over = {}) {
  const ctx = {
    $props: {
      values: null,
      meta_props: {},
      grid_id: 0,
      common: {},
      layout_override: undefined,
    },
    _emits: [],
    $emit(name, payload) { this._emits.push([name, payload]) },
    ...over,
  }
  // Seed render caches exactly like created().
  Legend.created.call(ctx)
  return ctx
}

// Resolve a computed getter against ctx.
const get = (ctx, name) => C[name].call(ctx)
// Bind the dependent computeds onto ctx so a getter that reads `this.layout`
// etc. sees a value rather than the getter fn. We compute lazily/manually.
function withDerived(ctx) {
  Object.defineProperty(ctx, 'layout', { configurable: true, get() { return get(ctx, 'layout') } })
  Object.defineProperty(ctx, 'json_data', { configurable: true, get() { return get(ctx, 'json_data') } })
  Object.defineProperty(ctx, 'off_data', { configurable: true, get() { return get(ctx, 'off_data') } })
  Object.defineProperty(ctx, 'main_type', { configurable: true, get() { return get(ctx, 'main_type') } })
  Object.defineProperty(ctx, 'main_overlay', { configurable: true, get() { return get(ctx, 'main_overlay') } })
  Object.defineProperty(ctx, 'volume_detached', { configurable: true, get() { return get(ctx, 'volume_detached') } })
  Object.defineProperty(ctx, '_indexMap', { configurable: true, get() { return get(ctx, '_indexMap') } })
  Object.defineProperty(ctx, 'format', { configurable: true, get() { return M.format.bind(ctx) } })
  ctx.n_a = M.n_a
  return ctx
}

// ---------------------------------------------------------------------------
// 1. ohlcv computed — toFixed shape + fallbacks
// ---------------------------------------------------------------------------
describe('ohlcv computed', () => {
  test('returns the 5 toFixed strings (volume toFixed(2)) at the layout prec', () => {
    const ctx = withDerived(mkCtx({
      $props: {
        values: { ohlcv: [111, 1.111, 2.222, 3.333, 4.444, 5000.5] },
        meta_props: {}, grid_id: 0,
        common: { layout: { grids: [{ prec: 3 }] } },
        layout_override: undefined,
      },
    }))
    const r = get(ctx, 'ohlcv')
    // O=ohlcv[1] H=ohlcv[2] L=ohlcv[3] C=ohlcv[4] V=ohlcv[5]
    expect(r).toEqual(['1.111', '2.222', '3.333', '4.444', '5000.50'])
  })

  test("volume slot is 'n/a' when ohlcv[5] is falsy", () => {
    const ctx = withDerived(mkCtx({
      $props: {
        values: { ohlcv: [111, 1.1, 2.2, 3.3, 4.4, 0] },
        meta_props: {}, grid_id: 0,
        common: { layout: { grids: [{ prec: 2 }] } },
        layout_override: undefined,
      },
    }))
    expect(get(ctx, 'ohlcv')[4]).toBe('n/a')
  })

  test('returns Array(6).fill("n/a") when values is null', () => {
    const ctx = withDerived(mkCtx({
      $props: { values: null, meta_props: {}, grid_id: 0, common: { layout: { grids: [{}] } }, layout_override: undefined },
    }))
    expect(get(ctx, 'ohlcv')).toEqual(['n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'n/a'])
  })

  test('returns Array(6).fill("n/a") when layout is missing', () => {
    const ctx = withDerived(mkCtx({
      $props: { values: { ohlcv: [1, 2, 3, 4, 5, 6] }, meta_props: {}, grid_id: 0, common: {}, layout_override: undefined },
    }))
    expect(get(ctx, 'ohlcv')).toEqual(['n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'n/a'])
  })
})

describe('non-candle main-series legend', () => {
  test('identifies a native Spline main series and suppresses candle volume chrome', () => {
    const ctx = withDerived(mkCtx({
      $props: {
        values: { ohlcv: [111, 1000.125, 1002, 998] },
        meta_props: {}, grid_id: 0,
        common: {
          data: [{ main: true, type: 'Spline' }],
          meta: { last: [222, 999.5, 1002, 998] },
          layout: { grids: [{ prec: 2 }] },
        },
        layout_override: undefined,
      },
    }))
    expect(get(ctx, 'main_type')).toBe('Spline')
    expect(get(ctx, 'show_volume_row')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. ohlcv cache behaviour
// ---------------------------------------------------------------------------
describe('ohlcv cache', () => {
  function ctxFor(ohlcv) {
    return withDerived(mkCtx({
      $props: {
        values: { ohlcv },
        meta_props: {}, grid_id: 0,
        common: { layout: { grids: [{ prec: 2 }] } },
        layout_override: undefined,
      },
    }))
  }

  test('cache HIT: identical values twice returns the SAME array reference', () => {
    const ctx = ctxFor([111, 1, 2, 3, 4, 5])
    const a = get(ctx, 'ohlcv')
    const b = get(ctx, 'ohlcv')
    expect(b).toBe(a)
  })

  test('a changed close busts the cache to a NEW array', () => {
    const vals = { ohlcv: [111, 1, 2, 3, 4, 5] }
    const ctx = withDerived(mkCtx({
      $props: { values: vals, meta_props: {}, grid_id: 0, common: { layout: { grids: [{ prec: 2 }] } }, layout_override: undefined },
    }))
    const a = get(ctx, 'ohlcv')
    vals.ohlcv = [111, 1, 2, 3, 9, 5]   // close (ohlcv[4]) changed
    const b = get(ctx, 'ohlcv')
    expect(b).not.toBe(a)
    expect(b[3]).toBe('9.00')
  })

  test('a custom meta.legend() override wins over the toFixed path', () => {
    const ctx = withDerived(mkCtx({
      $props: {
        values: { ohlcv: [111, 1, 2, 3, 4, 5] },
        meta_props: { Candles_0: { legend: () => [{ value: 'AA' }, { value: 'BB' }] } },
        grid_id: 0,
        common: { layout: { grids: [{ prec: 2 }] }, data: [{ main: true, type: 'Candles' }] },
        layout_override: undefined,
      },
    }))
    expect(get(ctx, 'ohlcv')).toEqual(['AA', 'BB'])
  })
})

// ---------------------------------------------------------------------------
// 3. format() — precision branches, n_a, memo, LRU eviction
// ---------------------------------------------------------------------------
describe('format()', () => {
  function ctxFor(meta_props = {}) {
    return withDerived(mkCtx({ $props: { values: null, meta_props, grid_id: 0, common: {}, layout_override: undefined } }))
  }

  test('|x|>0.001 -> toFixed(4); a value <=0.001 -> toFixed(8)', () => {
    const ctx = ctxFor()
    const r = ctx.format('EMA_0', { EMA_0: [111, 1.23456789, 0.0005] })
    expect(r[0].value).toBe('1.2346')      // > 0.001 -> 4 dp
    expect(r[1].value).toBe('0.00050000')  // <= 0.001 -> 8 dp
  })

  test('returns n_a(1) when values[id] is absent', () => {
    const ctx = ctxFor()
    expect(ctx.format('NOPE', { OTHER: [1, 2] })).toEqual([{ value: 'n/a' }])
  })

  test('memo returns the cached array ref on the 2nd call', () => {
    const ctx = ctxFor()
    const values = { EMA_0: [111, 5] }
    const a = ctx.format('EMA_0', values)
    const b = ctx.format('EMA_0', values)
    expect(b).toBe(a)
  })

  test('LRU eviction: pushing >50 distinct keys drops the FIRST, keeps the newest', () => {
    const ctx = ctxFor()
    // First key — its data must stay byte-stable so the same cacheKey is reused.
    ctx.format('K0', { K0: [111, 1] })
    expect(ctx._formatCache.has('K0:111,1')).toBe(true)
    // Push 51 more distinct keys K1..K51. Eviction triggers once size > 50.
    for (let i = 1; i <= 51; i++) {
      ctx.format('K' + i, { ['K' + i]: [111, i] })
    }
    // The very first inserted key has been evicted...
    expect(ctx._formatCache.has('K0:111,1')).toBe(false)
    // ...while the newest is present.
    expect(ctx._formatCache.has('K51:111,51')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 4. indicators() — per-type suffixing, exclusions, unk flag
// ---------------------------------------------------------------------------
describe('indicators()', () => {
  test('two onchart overlays of the same type get suffixed ids type_0 / type_1', () => {
    const a = { type: 'EMA', settings: {}, name: undefined }
    const b = { type: 'EMA', settings: {}, name: undefined }
    const ctx = withDerived(mkCtx({
      $props: {
        values: null, meta_props: { EMA_0: {}, EMA_1: {} }, grid_id: 1,
        common: { data: [a, b] }, layout_override: undefined,
      },
    }))
    const inds = get(ctx, 'indicators')
    expect(inds.map(i => i.id)).toEqual(['EMA_0', 'EMA_1'])
    expect(inds.map(i => i.index)).toEqual([0, 1])   // _indexMap positions
  })

  test('overlays with settings.legend===false or .main are excluded', () => {
    const keep = { type: 'RSI', settings: {} }
    const ctx = withDerived(mkCtx({
      $props: {
        values: null, meta_props: { RSI_0: {} }, grid_id: 1,
        common: {
          data: [
            { type: 'Candles', main: true, settings: {} },         // .main -> excluded
            { type: 'EMA', settings: { legend: false } },          // legend:false -> excluded
            keep,
          ],
        },
        layout_override: undefined,
      },
    }))
    const inds = get(ctx, 'indicators')
    expect(inds).toHaveLength(1)
    expect(inds[0].id).toBe('RSI_0')
  })

  test('unk=true when the id is missing from meta_props', () => {
    const ctx = withDerived(mkCtx({
      $props: {
        values: null, meta_props: {}, grid_id: 1,
        common: { data: [{ type: 'Ghost', settings: {} }] }, layout_override: undefined,
      },
    }))
    expect(get(ctx, 'indicators')[0].unk).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. calc_style — geometry
// ---------------------------------------------------------------------------
describe('calc_style', () => {
  test('layout.height>150 -> top 10; width = grids[0].width-20', () => {
    const ctx = withDerived(mkCtx({
      $props: {
        values: null, meta_props: {}, grid_id: 0,
        common: { layout: { grids: [{ height: 200, width: 320, offset: 0 }] } },
        layout_override: undefined,
      },
    }))
    expect(get(ctx, 'calc_style')).toEqual({ top: '10px', width: '300px' })
  })

  test('layout.height<=150 -> top 5', () => {
    const ctx = withDerived(mkCtx({
      $props: {
        values: null, meta_props: {}, grid_id: 0,
        common: { layout: { grids: [{ height: 100, width: 120, offset: 0 }] } },
        layout_override: undefined,
      },
    }))
    expect(get(ctx, 'calc_style').top).toBe('5px')
  })

  test('falls back to {top:10px,width:100px} when layout is undefined', () => {
    const ctx = withDerived(mkCtx({
      $props: { values: null, meta_props: {}, grid_id: 0, common: {}, layout_override: undefined },
    }))
    expect(get(ctx, 'calc_style')).toEqual({ top: '10px', width: '100px' })
  })
})

// ---------------------------------------------------------------------------
// 6. openSettings — payload + settings identity
// ---------------------------------------------------------------------------
describe('openSettings()', () => {
  test("emits 'open-indicator-settings' with the SAME settings reference", () => {
    const settings = { foo: 1 }
    const ind = { name: 'My EMA', type: 'EMA', index: 3, settings }
    const ctx = mkCtx({ $props: { values: null, meta_props: {}, grid_id: 2, common: {}, layout_override: undefined } })
    M.openSettings.call(ctx, ind)
    expect(ctx._emits).toHaveLength(1)
    const [name, payload] = ctx._emits[0]
    expect(name).toBe('open-indicator-settings')
    expect(payload).toEqual({ name: 'My EMA', type: 'EMA', index: 3, settings, gridId: 2 })
    expect(payload.settings).toBe(settings)   // identity preserved
  })
})

// ---------------------------------------------------------------------------
// 7. closeIndicator — SCMR/SCMR(INV) identity invariant
// ---------------------------------------------------------------------------
describe('closeIndicator()', () => {
  test('forwards the exact settings object reference (toBe identity)', () => {
    const settings = { $marker: 'SCMR(INV)' }
    const ind = { name: 'SCMR', type: 'SCMR', index: 7, settings }
    const ctx = mkCtx({ $props: { values: null, meta_props: {}, grid_id: 1, common: {}, layout_override: undefined } })
    M.closeIndicator.call(ctx, ind)
    const [name, payload] = ctx._emits[0]
    expect(name).toBe('close-indicator')
    expect(payload).toEqual({ name: 'SCMR', index: 7, gridId: 1, settings })
    expect(payload.settings).toBe(settings)   // disambiguation by identity
  })
})

// ---------------------------------------------------------------------------
// 8. volume detach / reattach
// ---------------------------------------------------------------------------
describe('volume detach / reattach', () => {
  test('isDetachedVolume true only for Volume + the legend flag', () => {
    expect(M.isDetachedVolume({ type: 'Volume', settings: { [VOLUME_LEGEND_FLAG]: true } })).toBe(true)
    expect(M.isDetachedVolume({ type: 'Volume', settings: {} })).toBeFalsy()
    expect(M.isDetachedVolume({ type: 'EMA', settings: { [VOLUME_LEGEND_FLAG]: true } })).toBe(false)
  })

  test("toggleVolumeDetach emits legend-button-click with detach=!volume_detached", () => {
    const ctx = withDerived(mkCtx({
      $props: { values: null, meta_props: {}, grid_id: 0, common: { volume_detached: false }, layout_override: undefined },
    }))
    M.toggleVolumeDetach.call(ctx)
    expect(ctx._emits[0]).toEqual([
      'legend-button-click',
      { button: 'volume-detach', overlay: 'Volume', grid: 0, detach: true },
    ])
  })

  test('reattachVolume emits the volume-detach button with this grid_id', () => {
    const ctx = mkCtx({ $props: { values: null, meta_props: {}, grid_id: 3, common: {}, layout_override: undefined } })
    M.reattachVolume.call(ctx)
    expect(ctx._emits[0]).toEqual([
      'legend-button-click',
      { button: 'volume-detach', overlay: 'Volume', grid: 3 },
    ])
  })
})

// ---------------------------------------------------------------------------
// 9. on_dblclick — off-chart only
// ---------------------------------------------------------------------------
describe('on_dblclick()', () => {
  function fakeEvent() {
    let prevented = false, stopped = false
    return {
      preventDefault() { prevented = true },
      stopPropagation() { stopped = true },
      get prevented() { return prevented },
      get stopped() { return stopped },
    }
  }

  test('off-chart (grid_id>0): emits legend-dblclick + prevents/stops', () => {
    const ctx = mkCtx({ $props: { values: null, meta_props: {}, grid_id: 2, common: {}, layout_override: undefined } })
    const e = fakeEvent()
    M.on_dblclick.call(ctx, e)
    expect(ctx._emits[0]).toEqual(['legend-dblclick', 2])
    expect(e.prevented).toBe(true)
    expect(e.stopped).toBe(true)
  })

  test('main grid (grid_id===0): emits nothing, does not prevent', () => {
    const ctx = mkCtx({ $props: { values: null, meta_props: {}, grid_id: 0, common: {}, layout_override: undefined } })
    const e = fakeEvent()
    M.on_dblclick.call(ctx, e)
    expect(ctx._emits).toHaveLength(0)
    expect(e.prevented).toBe(false)
  })
})
