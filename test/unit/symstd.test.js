// helpers/symstd.js — parses non-default symbols (close1D, hlc3, atr14(...))
// and injects TSs / sampler bindings into the engine state. 22% → up.
import { test, expect, describe, beforeEach } from 'vitest'
import symstd from '../../src/helpers/symstd.js'
import se from '../../src/helpers/script_engine.js'

function setOHLC(o, h, l, c, v = 0) {
  se.open = [o]; se.high = [h]; se.low = [l]; se.close = [c]; se.vol = [v]
}

beforeEach(() => {
  se.tss = {}
  se.std_plus = {}
  setOHLC(10, 12, 8, 11)
})

describe('parse_ts_sym — synthetic price series', () => {
  test('hl2 / hlc3 / ohlc4 install a TS whose __fn__ computes the blend', () => {
    symstd.parse_ts_sym('hl2')
    expect(se.tss.hl2.__fn__()).toBe((12 + 8) * 0.5)    // 10
    symstd.parse_ts_sym('hlc3')
    expect(se.tss.hlc3.__fn__()).toBeCloseTo((12 + 8 + 11) / 3, 9)
    symstd.parse_ts_sym('ohlc4')
    expect(se.tss.ohlc4.__fn__()).toBeCloseTo((10 + 12 + 8 + 11) / 4, 9)
  })
})

describe('deps — OHLC sampler dependencies for fn-std indicators', () => {
  test('creates one sampler TS per type at the requested timeframe', () => {
    symstd.deps(['high', 'low', 'close'], '5')
    expect(se.tss.high5).toBeTruthy()
    expect(se.tss.low5.__tf__).toBeGreaterThan(0)
    expect(typeof se.tss.close5.__fn__).toBe('function')
  })

  test('is idempotent — an existing dep is not recreated', () => {
    symstd.deps(['high'], '5')
    const first = se.tss.high5
    symstd.deps(['high'], '5')
    expect(se.tss.high5).toBe(first)
  })
})

describe('parse — scans a script source for symbol patterns', () => {
  function script(code) {
    return { src: { init_src: code, upd_src: '', post_src: '' } }
  }

  test('timeframe symbols (close1D) inject a bound sampler TS', () => {
    symstd.parse(script('let x = close1D + 1'))
    expect(se.tss.close1D).toBeTruthy()
    expect(se.tss.close1D.__tf__).toBeGreaterThan(0)
  })

  test('blend symbols (hlc3) route through parse_ts_sym', () => {
    symstd.parse(script('plot(hlc3)'))
    expect(se.tss.hlc3).toBeTruthy()
  })

  test('fn-std indicators (atr14(...)) register an std_plus wrapper + deps', () => {
    symstd.parse(script('let a = atr14(14)'))
    expect(typeof se.std_plus.atr14).toBe('function')
    expect(se.tss.high14).toBeTruthy() // dep injected
  })

  test('already-registered symbols are skipped', () => {
    se.tss.close1D = { existing: true }
    symstd.parse(script('close1D'))
    expect(se.tss.close1D).toEqual({ existing: true })
  })
})
