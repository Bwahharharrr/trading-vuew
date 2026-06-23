// datatrack mixin: data_changed / check_all_data / reindex_delta viewport
// reanchor / save_data_t
//
// Pure-node unit test. The mixin's methods read/write a handful of fields off
// `this` (ohlcv, _data_n0/_data_len/_data_t, ti_map, interval_ms, range, goto,
// $emit). We bind the real mixin methods onto a fake `this` (the App.vue method
// -binding pattern: see test/component/position-plot-select.test.js) and drive
// the actual source so its branches are exercised.
import { describe, test, expect, vi } from 'vitest'
import datatrack from '../../src/mixins/datatrack.js'
import Utils from '../../src/stuff/utils.js'

const M = datatrack.methods

// A candle is [t, o, h, l, c, v]; ohlcv is newest-LAST (ascending t), matching
// what fast_nearest/IndexedArray(col "0") expect.
const candle = (t) => [t, t, t + 1, t - 1, t, 1]
const OHLCV = [candle(1000), candle(2000), candle(3000), candle(4000)]

// Build a fake component `this` with the mixin methods bound onto it.
function mkCtx(over = {}) {
  const ctx = {
    ohlcv: OHLCV.map((c) => c.slice()),
    _data_n0: datatrack.data()._data_n0,   // null
    _data_len: datatrack.data()._data_len, // 0
    _data_t: datatrack.data()._data_t,     // 0
    interval_ms: 1000,
    range: [0, 3],
    ti_map: {
      ib: false,
      i2t: vi.fn((i) => i * 1000),       // index -> t
      t2i: vi.fn((t) => t / 1000),       // t -> index
    },
    goto: vi.fn(),
    $emit: vi.fn(),
    ...over,
  }
  for (const name of ['data_changed', 'check_all_data', 'reindex_delta', 'save_data_t']) {
    ctx[name] = M[name].bind(ctx)
  }
  return ctx
}

const dataLenEvents = (ctx) =>
  ctx.$emit.mock.calls.filter(
    ([name, payload]) => name === 'custom-event' && payload && payload.event === 'data-len-changed'
  )

// --- 1. check_all_data emit rules -------------------------------------------
describe('check_all_data', () => {
  test('emits data-len-changed when |length delta| > 1', () => {
    const ctx = mkCtx({ _data_len: 1, _data_n0: OHLCV[0] })
    // ohlcv.length (4) vs prev len 1 → delta 3 > 1 → emit
    ctx.check_all_data(true)
    const ev = dataLenEvents(ctx)
    expect(ev).toHaveLength(1)
    expect(ev[0][1]).toEqual({ event: 'data-len-changed', args: [] })
  })

  test('emits data-len-changed when the head timestamp (_data_n0) changed', () => {
    // length delta is 0 (len 4 == ohlcv 4) but the stored head !== current head
    const ctx = mkCtx({ _data_len: 4, _data_n0: candle(999) })
    ctx.check_all_data(false)
    expect(dataLenEvents(ctx)).toHaveLength(1)
  })

  test('does NOT emit on a single-bar append with unchanged head', () => {
    // prev len 3, now 4 → |delta| === 1 (not > 1); head unchanged → no emit
    const ctx = mkCtx({ _data_len: 3 })
    ctx._data_n0 = ctx.ohlcv[0] // SAME reference → _data_n0 === ohlcv[0]
    ctx.check_all_data(false)
    expect(dataLenEvents(ctx)).toHaveLength(0)
  })
})

// --- 2. data_changed bookkeeping --------------------------------------------
describe('data_changed', () => {
  test('updates _data_n0/_data_len from ohlcv, calls save_data_t, returns changed flag', () => {
    const ctx = mkCtx({ _data_len: 1, _data_n0: candle(999) })
    const saveSpy = vi.spyOn(ctx, 'save_data_t')
    const changed = ctx.data_changed()
    // changed requires BOTH head ref differs AND length differs (1 !== 4)
    expect(changed).toBe(true)
    expect(ctx._data_n0).toBe(ctx.ohlcv[0])
    expect(ctx._data_len).toBe(4)
    expect(saveSpy).toHaveBeenCalledTimes(1)
    // _data_t was saved via i2t(range[1]=3) === 3000
    expect(ctx._data_t).toBe(3000)
  })

  test('returns false when only one of head/length differs (length unchanged)', () => {
    // head differs but length matches (4) → changed stays false
    const ctx = mkCtx({ _data_len: 4, _data_n0: candle(999) })
    expect(ctx.data_changed()).toBe(false)
    // still updates bookkeeping regardless of the changed flag
    expect(ctx._data_len).toBe(4)
    expect(ctx._data_n0).toBe(ctx.ohlcv[0])
  })

  test('calls reindex_delta(new head, old head) when ti_map.ib is truthy', () => {
    const oldHead = candle(900)
    const ctx = mkCtx({ ti_map: { ib: true, i2t: vi.fn((i) => i * 1000), t2i: vi.fn((t) => t / 1000) }, _data_n0: oldHead })
    const reSpy = vi.spyOn(ctx, 'reindex_delta')
    // re-bind reindex_delta caller: data_changed calls this.reindex_delta — the
    // spy replaces ctx.reindex_delta, which data_changed reads off `this`.
    ctx.data_changed()
    expect(reSpy).toHaveBeenCalledTimes(1)
    expect(reSpy).toHaveBeenCalledWith(ctx.ohlcv[0], oldHead)
  })

  test('does NOT call reindex_delta when ti_map.ib is falsy', () => {
    const ctx = mkCtx() // ib:false
    const reSpy = vi.spyOn(ctx, 'reindex_delta')
    ctx.data_changed()
    expect(reSpy).not.toHaveBeenCalled()
  })
})

// --- 3. save_data_t ----------------------------------------------------------
describe('save_data_t', () => {
  test('stores ti_map.i2t(range[1]) into _data_t', () => {
    const ctx = mkCtx({ range: [5, 9] })
    ctx.save_data_t()
    expect(ctx.ti_map.i2t).toHaveBeenCalledWith(9)
    expect(ctx._data_t).toBe(9000)
  })
})

// --- 4/5/6. reindex_delta ----------------------------------------------------
describe('reindex_delta', () => {
  test('precise path: fast_nearest + fractional offset → goto(index + off)', () => {
    // _data_t = 2000 → nt = 2000.01 → fast_nearest([..2000..],2000.01) = [1,2]
    // cndl = ohlcv[1] = candle(2000); off = (2000.01 - 2000)/interval_ms
    const ctx = mkCtx({ _data_t: 2000, interval_ms: 1000 })
    // new head differs from old head → dt !== 0
    ctx.reindex_delta(candle(1100), candle(1000))
    const nt = 2000.01
    const res = Utils.fast_nearest(ctx.ohlcv, nt)
    const off = (nt - ctx.ohlcv[res[0]][0]) / 1000
    expect(ctx.goto).toHaveBeenCalledTimes(1)
    expect(ctx.goto).toHaveBeenCalledWith(res[0] + off)
    // sanity: it is index 1 plus a tiny positive fraction
    expect(ctx.goto.mock.calls[0][0]).toBeCloseTo(1 + 0.01 / 1000, 12)
    // t2i fallback was NOT taken
    expect(ctx.ti_map.t2i).not.toHaveBeenCalled()
  })

  test('fallback path: out-of-range t (cndl undefined → cndl[0] throws) → goto(t2i(_data_t))', () => {
    // _data_t far below the first candle → fast_nearest = [-1,0] → ohlcv[-1] undefined
    const ctx = mkCtx({ _data_t: -99999 })
    ctx.reindex_delta(candle(1100), candle(1000))
    expect(ctx.ti_map.t2i).toHaveBeenCalledWith(-99999)
    expect(ctx.goto).toHaveBeenCalledTimes(1)
    expect(ctx.goto).toHaveBeenCalledWith(-99999 / 1000)
  })

  test('n/p default to [0] when null (dt resolves to 0 → no goto)', () => {
    const ctx = mkCtx({ _data_t: 2000 })
    // both null → n=[0], p=[0] → dt = 0-0 = 0 → no-op
    ctx.reindex_delta(null, null)
    expect(ctx.goto).not.toHaveBeenCalled()
  })

  test('no-op (no goto) when dt === 0', () => {
    const ctx = mkCtx({ _data_t: 2000 })
    const same = candle(1000)
    ctx.reindex_delta(same, same) // n[0] - p[0] = 0
    expect(ctx.goto).not.toHaveBeenCalled()
  })

  test('no-op (no goto) when _data_t is falsy even if dt !== 0', () => {
    const ctx = mkCtx({ _data_t: 0 })
    ctx.reindex_delta(candle(1100), candle(1000)) // dt !== 0 but _data_t falsy
    expect(ctx.goto).not.toHaveBeenCalled()
  })
})
