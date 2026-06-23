// ScriptEngine format_map output modes + _rangeSlice/_bsGTE/_bsGT binary search
// + data_required/match_ds handshake.
//
// These are pure data helpers on the engine — no worker, no postMessage, no Vue.
// We instantiate a FRESH `ScriptEngine` (not the module-level singleton) per test
// and poke its public fields (`map`, `data`, `range`, `custom_main`) directly,
// then assert the exact shapes/values the methods return. Source under test:
// src/helpers/script_engine.js (_bsGTE/_bsGT/_rangeSlice/format_map/
// data_required/match_ds).
import { test, expect, describe, beforeEach } from 'vitest'
import { ScriptEngine } from '../../src/helpers/script_engine.js'

// A sorted [t, ...] series — the binary helpers key on row[0] (the timestamp).
const SERIES = () => [[10, 1], [20, 2], [30, 3], [40, 4]]

let se
beforeEach(() => {
  se = new ScriptEngine()
})

describe('_bsGTE — first index with arr[i][0] >= t', () => {
  test('exact match returns that element index', () => {
    expect(se._bsGTE(SERIES(), 30)).toBe(2)
  })
  test('between elements returns the next-higher index', () => {
    expect(se._bsGTE(SERIES(), 25)).toBe(2)
  })
  test('before the first element returns 0', () => {
    expect(se._bsGTE(SERIES(), 5)).toBe(0)
    expect(se._bsGTE(SERIES(), 10)).toBe(0) // exact first stays at 0
  })
  test('after the last element returns length', () => {
    expect(se._bsGTE(SERIES(), 99)).toBe(4)
  })
})

describe('_bsGT — first index with arr[i][0] > t (exclusive upper)', () => {
  test('exact match skips the equal element', () => {
    expect(se._bsGT(SERIES(), 30)).toBe(3) // > 30, not >= 30
  })
  test('between elements behaves like GTE', () => {
    expect(se._bsGT(SERIES(), 25)).toBe(2)
  })
  test('before the first element returns 0', () => {
    expect(se._bsGT(SERIES(), 5)).toBe(0)
  })
  test('after / at the last element returns length', () => {
    expect(se._bsGT(SERIES(), 99)).toBe(4)
    expect(se._bsGT(SERIES(), 40)).toBe(4) // exact last is excluded
  })
})

describe('_rangeSlice — inclusive [t1, t2] window via binary search', () => {
  test('empty array returns the SAME array (identity short-circuit)', () => {
    const empty = []
    const out = se._rangeSlice(empty, 0, 100)
    expect(out).toBe(empty)
    expect(out).toHaveLength(0)
  })
  test('window spanning the middle returns the inclusive slice', () => {
    expect(se._rangeSlice(SERIES(), 20, 30)).toEqual([[20, 2], [30, 3]])
  })
  test('both ends are inclusive (full span returns every row)', () => {
    expect(se._rangeSlice(SERIES(), 10, 40)).toEqual(SERIES())
  })
  test('t1 > t2 (inverted window) returns []', () => {
    expect(se._rangeSlice(SERIES(), 30, 20)).toEqual([])
  })
  test('a window entirely outside the data returns []', () => {
    expect(se._rangeSlice(SERIES(), 100, 200)).toEqual([]) // beyond the end
    expect(se._rangeSlice(SERIES(), 0, 5)).toEqual([]) // before the start
  })
})

describe('format_map — output modes', () => {
  test("output===false (no `output` arg) pushes {id, data:null}", () => {
    se.map = {
      a: { output: false, env: { data: SERIES(), onchart: {}, offchart: {} } },
    }
    se.range = [10, 40]
    expect(se.format_map(['a'])).toEqual([{ id: 'a', data: null }])
  })

  test("output==='none' (no `output` arg) likewise pushes {id, data:null}", () => {
    se.map = {
      b: { output: 'none', env: { data: SERIES(), onchart: {}, offchart: {} } },
    }
    se.range = [10, 40]
    expect(se.format_map(['b'])).toEqual([{ id: 'b', data: null }])
  })

  test('a normal script returns {id, data, new_ovs:{onchart, offchart}}', () => {
    const data = SERIES()
    se.map = {
      c: {
        output: undefined,
        env: {
          data,
          onchart: { line: { type: 'Spline', color: 'red', data } },
          offchart: {},
        },
      },
    }
    se.range = [10, 40]
    const r = se.format_map(['c'])
    expect(r).toEqual([
      {
        id: 'c',
        data: SERIES(),
        new_ovs: {
          // ovf() copies every key except data, then re-maps data through f
          // (identity here, since no range) — type/color survive verbatim.
          onchart: { line: { type: 'Spline', color: 'red', data: SERIES() } },
          offchart: {},
        },
      },
    ])
  })

  test("the `output` arg forces data through even when output===false/'none'", () => {
    se.map = {
      a: { output: false, env: { data: SERIES(), onchart: {}, offchart: {} } },
    }
    se.range = [10, 40]
    const r = se.format_map(['a'], undefined, 'force')
    expect(r).toEqual([
      { id: 'a', data: SERIES(), new_ovs: { onchart: {}, offchart: {} } },
    ])
  })
})

describe('format_map — range slicing', () => {
  test('a `range` arg slices env.data (and overlays) via _rangeSlice', () => {
    const data = SERIES()
    se.map = {
      c: {
        output: undefined,
        env: {
          data,
          onchart: { line: { type: 'Spline', data } },
          offchart: {},
        },
      },
    }
    se.range = [10, 40]
    const r = se.format_map(['c'], [20, 30])
    expect(r[0].data).toEqual([[20, 2], [30, 3]])
    expect(r[0].new_ovs.onchart.line.data).toEqual([[20, 2], [30, 3]])
  })

  test("output==='range' slices using the engine's current se.range", () => {
    se.map = {
      d: { output: 'range', env: { data: SERIES(), onchart: {}, offchart: {} } },
    }
    se.range = [20, 30]
    const r = se.format_map(['d'])
    expect(r[0].data).toEqual([[20, 2], [30, 3]])
  })

  test('custom_main appends a trailing {id:"chart", data: ohlcv}', () => {
    se.map = {
      a: { output: false, env: { data: SERIES(), onchart: {}, offchart: {} } },
    }
    se.range = [10, 40]
    se.custom_main = { foo: 1 } // truthy is enough to trigger the branch
    se.data = { ohlcv: { data: [[1, 2, 3, 4, 5, 6]] } }
    const r = se.format_map(['a'])
    expect(r).toEqual([
      { id: 'a', data: null },
      { id: 'chart', data: [[1, 2, 3, 4, 5, 6]] },
    ])
  })
})

describe('data_required — unfulfilled dataset handshake', () => {
  test('no datasets present → OHLCV is the lone requirement', () => {
    se.map = {}
    se.data = {}
    expect(se.data_required()).toEqual([{ type: 'OHLCV' }])
  })

  test('once an OHLCV dataset exists → returns null (nothing unfulfilled)', () => {
    se.map = {}
    se.data = { ohlcv: { type: 'OHLCV', data: [] } }
    expect(se.data_required()).toBeNull()
  })

  test('a script declaring src.data {type:Trades} adds an unfulfilled {id, type}', () => {
    se.map = {}
    se.data = { ohlcv: { type: 'OHLCV', data: [] } } // OHLCV already satisfied
    const s = { uuid: 'sc1', src: { data: { x: { type: 'Trades' } } } }
    // OHLCV is filtered out (present); only the Trades request remains, tagged
    // with the requesting script's uuid.
    expect(se.data_required(s)).toEqual([{ id: 'sc1', type: 'Trades' }])
  })

  test('the Trades requirement clears once a Trades dataset is present', () => {
    se.map = {}
    se.data = {
      ohlcv: { type: 'OHLCV', data: [] },
      trades: { type: 'Trades', data: [] },
    }
    const s = { uuid: 'sc1', src: { data: { x: { type: 'Trades' } } } }
    expect(se.data_required(s)).toBeNull()
  })
})

describe('match_ds — resolve a dataset id by required type', () => {
  beforeEach(() => {
    se.data = { ohlcv: { type: 'OHLCV' }, td: { type: 'Trades' } }
  })
  test('returns the dataset id whose .type matches', () => {
    expect(se.match_ds('any', 'Trades')).toBe('td')
    expect(se.match_ds('any', 'OHLCV')).toBe('ohlcv')
  })
  test('returns undefined when no dataset type matches', () => {
    expect(se.match_ds('any', 'Nope')).toBeUndefined()
  })
})
