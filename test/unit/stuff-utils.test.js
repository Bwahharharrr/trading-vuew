// stuff/utils.js — the grab-bag of pure helpers (57% → up). Covers the
// previously-untested math/time/id/layout utilities.
import { test, expect, describe, vi } from 'vitest'
import Utils from '../../src/stuff/utils.js'

describe('numeric helpers', () => {
  test('clamp bounds a value', () => {
    expect(Utils.clamp(5, 0, 10)).toBe(5)
    expect(Utils.clamp(-3, 0, 10)).toBe(0)
    expect(Utils.clamp(99, 0, 10)).toBe(10)
  })

  test('round trims floating noise to N decimals', () => {
    expect(Utils.round(0.1 + 0.2)).toBe(0.3)
    expect(Utils.round(1.23456789, 2)).toBe(1.23)
  })

  test('minInArray scans for the minimum, Infinity on empty', () => {
    expect(Utils.minInArray([3, 1, 2])).toBe(1)
    expect(Utils.minInArray([])).toBe(Infinity)
    expect(Utils.minInArray(null)).toBe(Infinity)
  })
})

describe('time helpers', () => {
  const T = Date.UTC(2026, 5, 17, 13, 45) // 2026-06-17

  test('month_start / year_start snap to UTC boundaries', () => {
    expect(Utils.month_start(T)).toBe(Date.UTC(2026, 5, 1))
    expect(Utils.year_start(T)).toBe(Date.UTC(2026, 0, 1))
  })

  test('get_day returns the local day-of-month, null on falsy', () => {
    expect(Utils.get_day(T)).toBe(new Date(T).getDate())
    expect(Utils.get_day(0)).toBeNull()
  })
})

describe('id helpers', () => {
  test('get_num_id pulls the trailing numeric segment', () => {
    expect(Utils.get_num_id('EMA_3')).toBe(3)
    expect(Utils.get_num_id('grid_0_layer_12')).toBe(12)
  })

  test('uuid2 yields a 12-char hex-ish id', () => {
    const id = Utils.uuid2()
    expect(id).toHaveLength(12)
    expect(Utils.uuid2()).not.toBe(id)
  })
})

describe('color / array / event helpers', () => {
  test('apply_opacity appends an alpha byte to a #rrggbb color only', () => {
    expect(Utils.apply_opacity('#ff8800', 0.5)).toBe('#ff88007f')  // floor(127.5)=0x7f
    expect(Utils.apply_opacity('#ff8800', 2)).toBe('#ff8800ff')    // clamped to 255
    expect(Utils.apply_opacity('#ff880080', 0.5)).toBe('#ff880080') // already 9-char → untouched
  })

  test('fast_filter_i slices by index range [i1, i2+1) and reports the offset', () => {
    const arr = [[0], [1], [2], [3], [4]]
    expect(Utils.fast_filter_i(arr, 1, 3)).toEqual([[[1], [2], [3]], 1])
    expect(Utils.fast_filter_i(arr, -5, 1)).toEqual([[[0], [1]], 0]) // i1 clamped to 0
    expect(Utils.fast_filter_i([], 0, 1)).toEqual([[], undefined])
  })

  test('get_deltaY normalizes a wheel event delta', () => {
    expect(Utils.get_deltaY({ originalEvent: { deltaY: 24 } })).toBe(2)
  })

  test('index_shift finds the offset between a sub-series and overlay data', () => {
    const sub = [[100], [101], [102], [103]]
    const data = [[101], [101], [102]] // second distinct ts (102) is at sub index 2, data index 2
    expect(Utils.index_shift(sub, data)).toBe(0)
    expect(Utils.index_shift(sub, [])).toBe(0)
  })
})

describe('script-update + exec gating', () => {
  test('is_scr_props_upd detects a changed reactive prop', () => {
    const prev = [{ v: { $uuid: 'a', length: 10 }, p: {} }]
    const n = { v: { $uuid: 'a', length: 20 }, p: { settings: { $props: ['length'] } } }
    expect(Utils.is_scr_props_upd(n, prev)).toBe(true)
    const same = { v: { $uuid: 'a', length: 10 }, p: { settings: { $props: ['length'] } } }
    expect(Utils.is_scr_props_upd(same, prev)).toBe(false)
    // unknown uuid or no $props → false
    expect(Utils.is_scr_props_upd({ v: { $uuid: 'z' }, p: {} }, prev)).toBe(false)
  })

  test('delayed_exec throttles by execInterval, stamping $last_exec', () => {
    const now = vi.spyOn(Utils, 'now').mockReturnValue(1000)
    expect(Utils.delayed_exec({ settings: {} })).toBe(true) // no execInterval → always
    const v = { script: { execInterval: 500 }, settings: {} }
    expect(Utils.delayed_exec(v)).toBe(true)            // first run
    expect(v.settings.$last_exec).toBe(1000)
    expect(Utils.delayed_exec(v)).toBe(false)           // too soon
    now.mockReturnValue(1600)
    expect(Utils.delayed_exec(v)).toBe(true)            // interval elapsed
    now.mockRestore()
  })
})
