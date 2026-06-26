// Coverage push for the symbol / aggregation / script-utils helpers.
//
// Targets the UNDER-covered branches that the existing siblings
// (symstd.test.js, sym-sampler.test.js) don't reach:
//   - src/helpers/script_utils.js  (regex/source helpers, tf math, nextt,
//     size_of/size_of_dss caching, ovf, update, get_fn_id, make_module_lib)
//   - src/helpers/symbol.js        (update_custom, fillgaps branches, the
//     copy gap-fill path, the main-symbol bootstrap)
//   - src/helpers/std/symbol.js    (the sym() ScriptStd method — every arg
//     variation: object / number / string / cached)
//   - src/helpers/symstd.js        (the FNSTD switch: tr/atr/kc/kcw/dmi/sar/
//     supertrend/wpr wrapper bodies)
//   - src/helpers/agg_tool.js      (push/update/refine/update_ds/clear/destroy)
//
// Pure Node logic — no DOM. agg_tool touches requestAnimationFrame, which is
// stubbed below so update()'s tail scheduler is a no-op.
import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest'

import * as u from '../../src/helpers/script_utils.js'
import { Sym, ARR, TSS, NUM } from '../../src/helpers/symbol.js'
import symbolFns from '../../src/helpers/std/symbol.js'
import symstd from '../../src/helpers/symstd.js'
import AggTool from '../../src/helpers/agg_tool.js'
import se from '../../src/helpers/script_state.js'
import Const from '../../src/stuff/constants.js'

const TF = 60_000

// ───────────────────────────────────────────────────────────────────────────
// script_utils.js
// ───────────────────────────────────────────────────────────────────────────
describe('script_utils — function source parsing', () => {
  test('f_args extracts trimmed argument names from a function source', () => {
    expect(u.f_args('function foo(a, b ,  c) { return a }')).toEqual(['a', 'b', 'c'])
  })

  test('f_args on a source with no recognizable signature → []', () => {
    expect(u.f_args('let x = 1')).toEqual([])
  })

  test('f_args extracts a single argument', () => {
    expect(u.f_args('function g(z){ return z }')).toEqual(['z'])
  })

  test('f_args does NOT match a bare arrow function (no fn keyword) → []', () => {
    // FDEFS requires a `function name(args)` shape; arrows are not parsed
    expect(u.f_args('const h = (a, b) => a')).toEqual([])
  })

  test('f_body returns the text between the first { and the last }', () => {
    expect(u.f_body('function f(a){ return a + 1 }').trim()).toBe('return a + 1')
    // nested braces: slice goes to the LAST closing brace
    expect(u.f_body('f(){ if (a) { b() } }').trim()).toBe('if (a) { b() }')
  })

  test('get_raw_src passes a string through unchanged', () => {
    expect(u.get_raw_src('already source')).toBe('already source')
  })

  test('get_raw_src on a function returns its body', () => {
    const f = function (a) { return a * 2 }
    expect(u.get_raw_src(f).trim()).toBe('return a * 2')
  })

  test('make_module_lib compiles every key into a callable (skips main/id)', () => {
    // Module values arrive over the worker boundary as SOURCE STRINGS
    // (see script_dispatch upload-module → make_module_lib(msg.data)).
    const mod = {
      id: 'mymod',
      main: 'function main(a) { return a }',
      twice: 'function twice(x) { return x * 2 }',
      sum: 'function sum(a, b) { return a + b }',
    }
    const lib = u.make_module_lib(mod)
    expect('main' in lib).toBe(false)
    expect('id' in lib).toBe(false)
    expect(lib.twice(5)).toBe(10)
    expect(lib.sum(3, 4)).toBe(7)
  })
})

describe('script_utils — wrap_idxs (index access rewriting)', () => {
  test('rewrites high[7] into an index-tracked access (index >= BUF_INC)', () => {
    // indices below BUF_INC (5) and [0] are left alone, so use 7
    const out = u.wrap_idxs('let x = high[7]')
    expect(out).toContain('high[_i(7, high)]')
  })

  test('leaves an index below BUF_INC (high[3]) unchanged', () => {
    expect(u.wrap_idxs('let x = high[3]')).toBe('let x = high[3]')
  })

  test('honours a prefix on the index tracker helper', () => {
    const out = u.wrap_idxs('close[7]', 'this.')
    expect(out).toContain('close[this._i(7, close)]')
  })

  test('leaves low index / [0] / let / var / return alone', () => {
    // index 0 and < BUF_INC (5) are skipped; keyword names are skipped
    const src = 'a[0]; b[2]; let[1]; return[1]'
    const out = u.wrap_idxs(src)
    expect(out).toBe(src) // nothing rewritten (all below BUF_INC or keywords)
  })

  test('returns the original source when nothing matches', () => {
    const src = 'let z = 1'
    const out = u.wrap_idxs(src)
    expect(out).toBe(src)
    expect(out).toBe('let z = 1')  // value unchanged
  })

  test('rewrites every qualifying access in a multi-index source', () => {
    // two trackable accesses on the same line, both >= BUF_INC
    const out = u.wrap_idxs('let r = high[7] + low[9]')
    expect(out).toContain('high[_i(7, high)]')
    expect(out).toContain('low[_i(9, low)]')
  })
})

describe('script_utils — timeframe math', () => {
  test('tf_from_pair multiplies the number by the unit', () => {
    expect(u.tf_from_pair('15', 'm')).toBe(15 * Const.MINUTE)
    expect(u.tf_from_pair('1', 'H')).toBe(Const.HOUR)
    expect(u.tf_from_pair('2', 'D')).toBe(2 * Const.DAY)
    expect(u.tf_from_pair('1', 'W')).toBe(Const.WEEK)
    expect(u.tf_from_pair('1', 'M')).toBe(Const.MONTH)
    expect(u.tf_from_pair('1', 'Y')).toBe(Const.YEAR)
    expect(u.tf_from_pair('5', 's')).toBe(5 * Const.SECOND)
  })

  test('tf_from_pair with an unknown unit → mult stays 1 (just the number)', () => {
    expect(u.tf_from_pair('30', '?')).toBe(30)
  })

  test('tf_from_str passes numbers through untouched', () => {
    expect(u.tf_from_str(12345)).toBe(12345)
  })

  test('tf_from_str parses a string and memoizes it (cache hit on repeat)', () => {
    const first = u.tf_from_str('15m')
    expect(first).toBe(15 * Const.MINUTE)
    // second call hits tf_cache and returns the same value
    expect(u.tf_from_str('15m')).toBe(first)
  })

  test('tf_from_str on an unparseable string → undefined', () => {
    // TFSTR is /(\d+)(\w*)/ → needs at least one digit
    expect(u.tf_from_str('abc')).toBe(undefined)
  })
})

describe('script_utils — small helpers', () => {
  test('get_fn_id keeps only the tail of a lineage id', () => {
    expect(u.get_fn_id('ema', 'a<-b<-c')).toBe('ema-c')
    expect(u.get_fn_id('rsi', 'solo')).toBe('rsi-solo')
  })

  test('ovf maps overlays, replacing data via the supplied fn, copying other keys', () => {
    const obj = {
      ema0: { name: 'EMA', type: 'EMA', data: [[0, 1], [1, 2]] },
    }
    const out = u.ovf(obj, (d) => d.map((r) => r[1]))
    expect(out.ema0.name).toBe('EMA')
    expect(out.ema0.type).toBe('EMA')
    expect(out.ema0.data).toEqual([1, 2])      // transformed
    expect(out).not.toBe(obj)                   // fresh object
  })

  test('update pushes a newer point and overwrites the last one when not newer', () => {
    const data = [[0, 'a']]
    u.update(data, [1, 'b'])                    // newer ts → push
    expect(data).toEqual([[0, 'a'], [1, 'b']])
    u.update(data, [1, 'c'])                    // same ts → overwrite last
    expect(data).toEqual([[0, 'a'], [1, 'c']])
  })

  test('update on an empty array pushes (no last element)', () => {
    const data = []
    u.update(data, [5, 'x'])
    expect(data).toEqual([[5, 'x']])
  })
})

describe('script_utils — nextt (binary search for next index since t)', () => {
  const data = [[0], [10], [20], [30], [40]]

  test('exact hit returns that index', () => {
    expect(u.nextt(data, 20)).toBe(2)
    expect(u.nextt(data, 0)).toBe(0)
    expect(u.nextt(data, 40)).toBe(4)
  })

  test('between two points returns the index of the next (higher) one', () => {
    expect(u.nextt(data, 15)).toBe(2)   // next >= 15 is 20 @ idx 2
    expect(u.nextt(data, 5)).toBe(1)
  })

  test('before the start returns 0; after the end returns length', () => {
    expect(u.nextt(data, -5)).toBe(0)
    expect(u.nextt(data, 100)).toBe(data.length)
  })

  test('honours a custom time index (ti)', () => {
    const d = [[1, 0], [1, 10], [1, 20]]
    expect(u.nextt(d, 10, 1)).toBe(1)
  })

  test('single-element dataset: before→0, exact→0, after→1', () => {
    // exercises the loop body when i0 === iN on the first iteration
    const one = [[10]]
    expect(u.nextt(one, 5)).toBe(0)    // t < the only point → mid
    expect(u.nextt(one, 10)).toBe(0)   // exact hit
    expect(u.nextt(one, 15)).toBe(1)   // t > the only point → mid + 1 (= length)
  })
})

describe('script_utils — size_of / size_of_dss', () => {
  test('size_of sums bytes by primitive type and handles cycles', () => {
    // boolean=4, number=8, string=len*2 ; objects traversed once
    expect(u.size_of(true)).toBe(4)
    expect(u.size_of(42)).toBe(8)
    expect(u.size_of('ab')).toBe(4)               // 2 chars * 2
    const obj = { n: 1, s: 'xy', b: false }       // 8 + 4 + 4
    expect(u.size_of(obj)).toBe(16)
    // cyclic reference must not loop forever
    const c = { v: 1 }; c.self = c
    expect(u.size_of(c)).toBe(8)
  })

  test('size_of_dss estimates dataset bytes and caches by id:length key', () => {
    const dss = {
      a: { data: [[0, 1, 2]] },
      b: { data: [[0, 1, 2], [1, 2, 3]] },
    }
    const bytes1 = u.size_of_dss(dss)
    expect(bytes1).toBeGreaterThan(0)
    // identical shape (same ids + lengths) → cache hit, same value
    expect(u.size_of_dss(dss)).toBe(bytes1)
    // a dataset with no .data is skipped in the key and the byte sum
    const dss2 = { a: { data: [[0, 1, 2]] }, c: { nope: true } }
    expect(u.size_of_dss(dss2)).toBeGreaterThan(0)
  })

  test('size_of_dss recomputes when a dataset grows', () => {
    const dss = { a: { data: [[0, 1]] } }
    const b1 = u.size_of_dss(dss)
    dss.a.data.push([1, 2])
    const b2 = u.size_of_dss(dss)
    expect(b2).toBeGreaterThan(b1)               // longer dataset → more bytes
  })
})

// ───────────────────────────────────────────────────────────────────────────
// symbol.js — branches the sibling test misses
// ───────────────────────────────────────────────────────────────────────────
describe('Sym — custom aggregation function', () => {
  beforeEach(() => { se.tf = TF; se.t = 0 })

  test('update_custom applies the agg fn over the window and unshifts new candles', () => {
    const data = [
      [0, 10], [TF, 11], [2 * TF, 12], [3 * TF, 13],
    ]
    // agg fn: sum of the window's close values
    const agg = (sub) => sub.reduce((acc, dp) => acc + dp[1], 0)
    const s = new Sym(data, { id: 'cu', tf: '1m', aggtype: agg })
    expect(s.idx).toEqual({ time: 0, close: 1 })

    expect(s.update(null, 0)).toBe(true)
    expect(s.close.slice()).toEqual([10])        // window = [10] → sum 10
    expect(s.update(null, TF)).toBe(true)        // new candle
    // new window unshifts a slot: [sum([11]), prev 10]
    expect(s.close.slice()).toEqual([11, 10])
  })

  test('update_custom: empty data / out-of-range → false', () => {
    const agg = (sub) => sub.length
    const empty = new Sym([], { id: 'e', tf: '1m', aggtype: agg })
    expect(empty.update(null, 0)).toBe(false)    // !this.data.length

    const s = new Sym([[0, 1]], { id: 'oor', tf: '1m', aggtype: agg })
    expect(s.update(null, 99 * TF)).toBe(false)  // t past the last point
  })

  test('update_custom with a window slices the look-back range', () => {
    const data = [[0, 1], [TF, 2], [2 * TF, 4], [3 * TF, 8]]
    const agg = (sub) => sub.length
    const s = new Sym(data, { id: 'w', tf: '1m', aggtype: agg, window: 2 * TF })
    expect(s.update(null, 2 * TF)).toBe(true)
    // look-back t0 = 2*TF - window + tf = TF → slice spans [TF] and [2*TF],
    // so the length-counting agg yields EXACTLY 2 (and the [0] point is excluded)
    expect(s.close[0]).toBe(2)
  })
})

describe('Sym — ohlcv update branches', () => {
  beforeEach(() => { se.tf = TF; se.t = 0 })

  test('gap window with NO in-range source row + fillgaps:false → no event (returns false)', () => {
    // i0 lands on a row already past t1 (a gap window). `noevent` stays true
    // (set only after the in-range check), so the gap-fill block runs and, with
    // fillgaps off on a non-main series, correctly returns false — the prior
    // candle is left untouched rather than carried over as a phantom event.
    const data = [[0, 10, 12, 9, 11, 100], [5 * TF, 20, 22, 19, 21, 50]]
    const s = new Sym(data, { id: 'g', tf: '1m', aggtype: 'ohlcv', fillgaps: false })
    s.update(null, 0)
    expect([s.open[0], s.high[0], s.low[0], s.close[0], s.vol[0]])
      .toEqual([10, 12, 9, 11, 100])
    expect(s.update(null, 2 * TF)).toBe(false)   // gap + fillgaps:false → no event
    expect([s.open[0], s.high[0], s.low[0], s.close[0], s.vol[0]])
      .toEqual([10, 12, 9, 11, 100])             // untouched
  })

  test('gap window with NO in-range source row + fillgaps:true → flat-fill from last close, vol→0', () => {
    // Same gap, but fillgaps on: the (now-reachable) gap-fill block carries the
    // last close across O/H/L/C and resets volume to 0.
    const data = [[0, 10, 12, 9, 11, 100], [5 * TF, 20, 22, 19, 21, 50]]
    const s = new Sym(data, { id: 'gf', tf: '1m', aggtype: 'ohlcv', fillgaps: true })
    s.update(null, 0)
    expect(s.update(null, 2 * TF)).toBe(true)
    expect([s.open[0], s.high[0], s.low[0], s.close[0], s.vol[0]])
      .toEqual([11, 11, 11, 11, 0])              // flat-fill at last close, vol reset
  })

  test('the volume buffer is flushed at the start of a fresh window', () => {
    const data = [[0, 10, 12, 9, 11, 100], [TF, 11, 14, 10, 13, 120]]
    const s = new Sym(data, { id: 'vf', tf: '1m', aggtype: 'ohlcv' })
    s.update(null, 0)
    expect([s.open[0], s.high[0], s.low[0], s.close[0], s.vol[0]])
      .toEqual([10, 12, 9, 11, 100])
    s.update(null, TF)
    // new window → vol reset then re-summed; full OHLC from the [TF] row
    expect([s.open[0], s.high[0], s.low[0], s.close[0], s.vol[0]])
      .toEqual([11, 14, 10, 13, 120])
  })
})

describe('Sym — copy aggregation gap fill', () => {
  beforeEach(() => { se.tf = TF; se.t = 0 })

  test('update_copy fills a missing row flat from the prior close, vol→0', () => {
    // tmap only has rows at 0 and 2*TF — the 1*TF candle is a gap
    const data = [[0, 1, 2, 0, 1.5, 5], [2 * TF, 2, 3, 1, 2.5, 6]]
    const s = new Sym(data, { id: 'cpg', tf: '1m', aggtype: 'copy', fillgaps: true })
    s.update(null, 0)
    // real source row copied verbatim (o,h,l,c,v)
    expect([s.open[0], s.high[0], s.low[0], s.close[0], s.vol[0]])
      .toEqual([1, 2, 0, 1.5, 5])
    s.update(null, TF)                            // gap candle (no tmap[TF])
    // every O/H/L/C goes FLAT at the previous close (1.5); only volume → 0
    expect([s.open[0], s.high[0], s.low[0], s.close[0], s.vol[0]])
      .toEqual([1.5, 1.5, 1.5, 1.5, 0])
    s.update(null, 2 * TF)                         // real row again (tmap[2*TF])
    expect([s.open[0], s.high[0], s.low[0], s.close[0], s.vol[0]])
      .toEqual([2, 3, 1, 2.5, 6])
  })
})

// ───────────────────────────────────────────────────────────────────────────
// std/symbol.js — the sym() ScriptStd method (direct invocation)
// ───────────────────────────────────────────────────────────────────────────
describe('std/symbol.sym — every argument variation', () => {
  function mkCtx() {
    // Minimal ScriptStd-shaped `this` for sym()
    return {
      env: { syms: {} },
      _tsid(prev, next) { return `${prev}<-${next}` },
    }
  }

  beforeEach(() => {
    se.tf = TF
    se.t = 0
    se.data = { ohlcv: { data: [[0, 10, 12, 9, 11, 100], [TF, 11, 14, 10, 13, 120]] } }
  })

  test('object data → builds an ARR Sym and caches it under the id', () => {
    const ctx = mkCtx()
    const data = [[0, 10, 12, 9, 11, 100], [TF, 11, 14, 10, 13, 120]]
    const sym = symbolFns.sym.call(ctx, data, { aggtype: 'ohlcv', tf: '1m' }, 'auto0')
    expect(sym).toBeInstanceOf(Sym)
    expect(sym.data_type).toBe(ARR)
    // id falls back to _tsid(_id, 'sym') → 'auto0<-sym'
    expect(ctx.env.syms['auto0<-sym']).toBe(sym)
  })

  test('object data tagged with __id__ → TSS data_type', () => {
    const ctx = mkCtx()
    const data = [[0, 1, 2, 0, 1, 5]]
    data.__id__ = 'src'
    const sym = symbolFns.sym.call(ctx, data, { aggtype: 'ohlcv', tf: '1m', id: 'tagged' }, '_id')
    expect(sym.data_type).toBe(TSS)
    expect(ctx.env.syms.tagged).toBe(sym)
  })

  test('a cached id short-circuits: update() is called and the same Sym returned', () => {
    const ctx = mkCtx()
    const existing = { update: vi.fn() }
    ctx.env.syms.cached = existing
    const ret = symbolFns.sym.call(ctx, [[0, 1, 2, 0, 1, 5]], { id: 'cached' }, '_id')
    expect(ret).toBe(existing)
    expect(existing.update).toHaveBeenCalled()
  })

  test('number arg → NUM data_type Sym (no data)', () => {
    const ctx = mkCtx()
    const sym = symbolFns.sym.call(ctx, 42, { aggtype: () => 0, tf: '1m' }, 'num0')
    expect(sym.data_type).toBe(NUM)
    expect(sym.data).toBe(null)
  })

  test('string arg → uses the main ohlcv dataset at that tf (ARR)', () => {
    const ctx = mkCtx()
    const sym = symbolFns.sym.call(ctx, '5m', { aggtype: 'ohlcv' }, 'str0')
    expect(sym.data_type).toBe(ARR)
    expect(sym.data).toBe(se.data.ohlcv.data)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// symstd.js — the FNSTD switch (each std_plus wrapper body)
// ───────────────────────────────────────────────────────────────────────────
describe('symstd.parse — FNSTD indicator wrappers', () => {
  function script(code) {
    return { src: { init_src: code, upd_src: '', post_src: '' } }
  }
  // A stub ScriptStd `this` that records which fn was called + the trailing tf arg.
  function stub() {
    const calls = {}
    const rec = (name) => (...args) => { calls[name] = args; return name }
    return {
      calls,
      tr: rec('tr'), atr: rec('atr'), kc: rec('kc'), kcw: rec('kcw'),
      dmi: rec('dmi'), sar: rec('sar'), supertrend: rec('supertrend'), wpr: rec('wpr'),
    }
  }

  beforeEach(() => {
    se.tss = {}
    se.std_plus = {}
  })

  test('tr5 → wrapper forwards (fixnan, _id, tf) to this.tr', () => {
    symstd.parse(script('let a = tr5()'))
    expect(typeof se.std_plus.tr5).toBe('function')
    const ctx = stub()
    se.std_plus.tr5.call(ctx, true, 'id1')
    expect(ctx.calls.tr).toEqual([true, 'id1', '5']) // tf is the captured pair-suffix
    expect(se.tss.high5).toBeTruthy()                // deps injected
  })

  test('atr14 → forwards (len, _id, tf)', () => {
    symstd.parse(script('atr14(14)'))
    const ctx = stub()
    se.std_plus.atr14.call(ctx, 14, 'idA')
    expect(ctx.calls.atr).toEqual([14, 'idA', '14'])
  })

  test('kc10 → forwards (src, len, mult, use_tr, _id, tf)', () => {
    symstd.parse(script('kc10(close, 10, 2)'))
    const ctx = stub()
    se.std_plus.kc10.call(ctx, 'src', 10, 2, false, 'idK')
    expect(ctx.calls.kc).toEqual(['src', 10, 2, false, 'idK', '10'])
  })

  test('kcw20 → forwards to this.kcw', () => {
    symstd.parse(script('kcw20(close, 20, 2)'))
    const ctx = stub()
    se.std_plus.kcw20.call(ctx, 'src', 20, 2, true, 'idW')
    expect(ctx.calls.kcw).toEqual(['src', 20, 2, true, 'idW', '20'])
  })

  test('dmi7 → forwards (len, smooth, _id, tf)', () => {
    symstd.parse(script('dmi7(7, 14)'))
    const ctx = stub()
    se.std_plus.dmi7.call(ctx, 7, 14, 'idD')
    expect(ctx.calls.dmi).toEqual([7, 14, 'idD', '7'])
  })

  test('sar3 → forwards (start, inc, max, _id, tf)', () => {
    symstd.parse(script('sar3(0.02, 0.02, 0.2)'))
    const ctx = stub()
    se.std_plus.sar3.call(ctx, 0.02, 0.02, 0.2, 'idS')
    expect(ctx.calls.sar).toEqual([0.02, 0.02, 0.2, 'idS', '3'])
  })

  test('supertrend4 → forwards (factor, atrlen, _id, tf)', () => {
    symstd.parse(script('supertrend4(3, 10)'))
    const ctx = stub()
    se.std_plus.supertrend4.call(ctx, 3, 10, 'idST')
    expect(ctx.calls.supertrend).toEqual([3, 10, 'idST', '4'])
  })

  test('wpr9 → forwards (len, _id, tf)', () => {
    symstd.parse(script('wpr9(9)'))
    const ctx = stub()
    se.std_plus.wpr9.call(ctx, 9, 'idP')
    expect(ctx.calls.wpr).toEqual([9, 'idP', '9'])
  })

  test('an already-registered std_plus fn is skipped (idempotent)', () => {
    se.std_plus.atr14 = function () { return 'kept' }
    symstd.parse(script('atr14(14)'))
    expect(se.std_plus.atr14()).toBe('kept')
  })
})

// ───────────────────────────────────────────────────────────────────────────
// agg_tool.js — tick aggregation (RAF stubbed so update()'s tail is a no-op)
// ───────────────────────────────────────────────────────────────────────────
describe('AggTool — tick aggregation', () => {
  let raf, caf
  beforeEach(() => {
    // Fake timers so NO setTimeout/RAF the source schedules can ever fire for
    // real and leak across files (the source's update() reschedules itself).
    vi.useFakeTimers()
    raf = globalThis.requestAnimationFrame
    caf = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = vi.fn(() => 123)
    globalThis.cancelAnimationFrame = vi.fn()
  })
  afterEach(() => {
    // Drop any timers the source queued, then restore the real clock + globals.
    vi.clearAllTimers()
    vi.useRealTimers()
    globalThis.requestAnimationFrame = raf
    globalThis.cancelAnimationFrame = caf
  })

  function mkDc() {
    return {
      data: { chart: { data: [[0, 1, 2, 0, 1, 5]] } },
      merges: [],
      updates: [],
      stores: {},
      fast_merge(data, upd /*, main */) { data.push(upd); this.merges.push([data, upd]) },
      get_one(q) { return this.stores[q] || null },
      ww: { just: (ev, payload) => { /* event sink */ } },
    }
  }

  test('push seeds a brand-new symbol entry', () => {
    const dc = mkDc()
    const agg = new AggTool(dc)
    agg.push('ohlcv', [TF, 1, 2, 0, 1, 5], 60000)
    expect(agg.symbols.ohlcv.upd).toEqual([TF, 1, 2, 0, 1, 5])
    // a non-datasets symbol seeds an EMPTY raw buffer (only datasets.* fill it)
    expect(agg.symbols.ohlcv.data).toEqual([])
    expect(typeof agg.symbols.ohlcv.t).toBe('number')
    expect(agg.data_changed).toBe(true)
    agg.destroy()
  })

  test('push of a tick within the same window UPDATES the current point', () => {
    const dc = mkDc()
    const agg = new AggTool(dc)
    agg.push('ohlcv', [0, 1, 2, 0, 1, 5], 60000)
    agg.push('ohlcv', [0, 1, 9, 0, 8, 7], 60000)  // same window (ts diff < tf)
    expect(agg.symbols.ohlcv.upd).toEqual([0, 1, 9, 0, 8, 7])
    agg.destroy()
  })

  test('push past the window boundary refines the prior point then starts fresh', () => {
    const dc = mkDc()
    const agg = new AggTool(dc)
    agg.push('ohlcv', [0, 1, 2, 0, 1, 5], 60000)
    const before = dc.merges.length
    agg.push('ohlcv', [TF, 2, 3, 1, 2, 6], 60000) // upd[0] >= old.upd[0] + tf
    // refine() fast_merges the OLD point, then a fresh entry replaces it
    expect(dc.merges.length).toBeGreaterThan(before)
    expect(agg.symbols.ohlcv.upd).toEqual([TF, 2, 3, 1, 2, 6])
    expect(agg.symbols.ohlcv.data).toEqual([])
    agg.destroy()
  })

  test('push of a datasets.* symbol accumulates the raw updates in .data', () => {
    const dc = mkDc()
    const agg = new AggTool(dc)
    agg.push('datasets.trades', [0, 'x'], 60000)
    agg.push('datasets.trades', [TF, 'y'], 60000)
    expect(agg.symbols['datasets.trades'].data).toEqual([[0, 'x'], [TF, 'y']])
    agg.destroy()
  })

  test('update merges the ohlcv symbol and clears data_changed', () => {
    const dc = mkDc()
    let emitted = null
    dc.ww.just = (ev, payload) => { if (ev === 'update-data') emitted = payload }
    const agg = new AggTool(dc)
    agg.push('ohlcv', [TF, 1, 2, 0, 1, 5], 60000)
    agg.data_changed = true
    agg.update()
    expect(agg.data_changed).toBe(false)
    // the tick was appended to chart.data via fast_merge
    expect(dc.data.chart.data).toEqual([[0, 1, 2, 0, 1, 5], [TF, 1, 2, 0, 1, 5]])
    // and the event payload carries the last two points under ohlcv (slice(-2))
    expect(emitted).toEqual({ ohlcv: [[0, 1, 2, 0, 1, 5], [TF, 1, 2, 0, 1, 5]] })
    agg.destroy()
  })

  test('update routes a known non-ohlcv overlay through get_one + fast_merge', () => {
    const dc = mkDc()
    let emitted = null
    dc.ww.just = (ev, payload) => { if (ev === 'update-data') emitted = payload }
    const target = [[0, 1]]
    dc.stores['onchart.EMA0'] = target
    const agg = new AggTool(dc)
    agg.push('onchart.EMA0', [TF, 9], 60000)
    agg.update()
    expect(target).toEqual([[0, 1], [TF, 9]])   // fast_merge appended the tick
    // non-ohlcv overlays merge in place but never enter the `out` payload
    expect(emitted).toEqual({})
    agg.destroy()
  })

  test('update skips an unknown overlay (get_one → null)', () => {
    const dc = mkDc()
    const agg = new AggTool(dc)
    agg.push('onchart.MISSING', [TF, 9], 60000)
    // get_one returns null → continue; no throw
    expect(() => agg.update()).not.toThrow()
    agg.destroy()
  })

  test('update emits the datasets buffer then resets it (update_ds)', () => {
    const dc = mkDc()
    let emitted = null
    dc.ww.just = (ev, payload) => { emitted = payload }
    const agg = new AggTool(dc)
    agg.push('datasets.trades', [0, 'a'], 60000)
    agg.data_changed = true
    agg.update()
    expect(emitted['datasets.trades']).toEqual([[0, 'a']])
    expect(agg.symbols['datasets.trades'].data).toEqual([]) // reset
    agg.destroy()
  })

  test('refine on a missing overlay returns without merging', () => {
    const dc = mkDc()
    const agg = new AggTool(dc)
    const before = dc.merges.length
    agg.refine('onchart.GONE', [0, 1])   // get_one → null → early return
    expect(dc.merges.length).toBe(before)
    agg.destroy()
  })

  test('clear empties the symbol map', () => {
    const dc = mkDc()
    const agg = new AggTool(dc)
    agg.push('ohlcv', [0, 1, 2, 0, 1, 5], 60000)
    agg.clear()
    expect(agg.symbols).toEqual({})
    agg.destroy()
  })

  test('destroy clears pending timers and the symbol map', () => {
    const dc = mkDc()
    const agg = new AggTool(dc)
    agg.push('ohlcv', [0, 1, 2, 0, 1, 5], 60000) // sets st_id
    agg.raf_id = 999
    agg.destroy()
    expect(agg.symbols).toEqual({})
    expect(agg.st_id).toBe(null)
    expect(agg.raf_id).toBe(null)
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(999)
  })
})
