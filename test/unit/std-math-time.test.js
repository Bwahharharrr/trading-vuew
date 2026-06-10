// std/math.js + std/time.js — pure ScriptStd helpers, invoked DIRECTLY on the
// source modules (the engine rewrites TS methods via new Function(), so going
// through ScriptStd would never execute these source lines).
import { test, expect, describe } from 'vitest'
import { mathFns, timeFns } from '../../src/helpers/std/index.js'

describe('std/math', () => {
  test('thin Math wrappers pass through exactly', () => {
    expect(mathFns.abs(-3)).toBe(3)
    expect(mathFns.ceil(1.1)).toBe(2)
    expect(mathFns.floor(1.9)).toBe(1)
    expect(mathFns.round(1.5)).toBe(2)
    expect(mathFns.sign(-7)).toBe(-1)
    expect(mathFns.sqrt(16)).toBe(4)
    expect(mathFns.pow(2, 10)).toBe(1024)
    expect(mathFns.exp(0)).toBe(1)
    expect(mathFns.log(Math.E)).toBeCloseTo(1, 12)
  })

  test('trig + inverse trig', () => {
    expect(mathFns.sin(0)).toBe(0)
    expect(mathFns.cos(0)).toBe(1)
    expect(mathFns.tan(0)).toBe(0)
    expect(mathFns.asin(1)).toBeCloseTo(Math.PI / 2, 12)
    expect(mathFns.acos(1)).toBe(0)
    expect(mathFns.atan(1)).toBeCloseTo(Math.PI / 4, 12)
  })

  test('log10 if present', () => {
    if (mathFns.log10) expect(mathFns.log10(1000)).toBeCloseTo(3, 12)
  })
})

describe('std/time (explicit UTC timestamps)', () => {
  // 2026-03-04 (Wednesday) 09:07:42 UTC
  const T = Date.UTC(2026, 2, 4, 9, 7, 42)

  test('calendar fields read in UTC', () => {
    expect(timeFns.year(T)).toBe(2026)
    expect(timeFns.month(T)).toBe(2)        // 0-based March
    expect(timeFns.dayofmonth(T)).toBe(4)
    expect(timeFns.hour(T)).toBe(9)
    expect(timeFns.minute(T)).toBe(7)
    expect(timeFns.second(T)).toBe(42)
  })

  test('dayofweek is 1-based (Sun=1) — Wed → 4', () => {
    expect(timeFns.dayofweek(T)).toBe(4)
    expect(timeFns.dayofweek(Date.UTC(2026, 2, 8))).toBe(1) // a Sunday
  })

  test('weekofyear (ISO-ish) is a sane positive week number', () => {
    const w = timeFns.weekofyear(T)
    expect(w).toBeGreaterThanOrEqual(8)
    expect(w).toBeLessThanOrEqual(11)
  })

  test('now() returns a current epoch millis', () => {
    const n = timeFns.now()
    expect(typeof n).toBe('number')
    expect(n).toBeGreaterThan(1_700_000_000_000)
  })
})
