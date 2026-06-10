// @vitest-environment jsdom
// Price-alarm helpers: trigger predicate + beep-timer lifecycle. jsdom has no
// Web Audio, so AlarmSound must run silently (guarded) while still managing
// its repeat timers correctly.
import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'
import { AlarmSound, alarmShouldTrigger, updateAlarms } from '../../src/helpers/alarm-sound.js'

describe('alarmShouldTrigger', () => {
  test('above: fires when price RISES to the level', () => {
    const a = { side: 'above', price: 105 }
    expect(alarmShouldTrigger(a, 104.99)).toBe(false)
    expect(alarmShouldTrigger(a, 105)).toBe(true)
    expect(alarmShouldTrigger(a, 110)).toBe(true)
  })

  test('below: fires when price FALLS to the level', () => {
    const a = { side: 'below', price: 95 }
    expect(alarmShouldTrigger(a, 95.01)).toBe(false)
    expect(alarmShouldTrigger(a, 95)).toBe(true)
    expect(alarmShouldTrigger(a, 90)).toBe(true)
  })

  test('garbage in → never fires', () => {
    expect(alarmShouldTrigger(null, 100)).toBe(false)
    expect(alarmShouldTrigger({ side: 'above', price: NaN }, 100)).toBe(false)
    expect(alarmShouldTrigger({ side: 'above', price: 100 }, NaN)).toBe(false)
  })
})

describe('updateAlarms (trigger-loop tick)', () => {
  function stubSound() {
    const calls = []
    return { calls, start: (id, side) => calls.push(['start', id, side]), stop: (id) => calls.push(['stop', id]) }
  }

  test('rings on cross, then SILENCES + RE-ARMS when price crosses back', () => {
    const s = stubSound()
    const alarms = [{ id: 'b1', side: 'below', price: 95, triggered: false }]
    // price falls under the level → rings
    expect(updateAlarms(alarms, 94, s)).toBe(true)
    expect(alarms[0].triggered).toBe(true)
    expect(s.calls).toEqual([['start', 'b1', 'below']])
    // still under → no state change, keeps ringing
    expect(updateAlarms(alarms, 93, s)).toBe(false)
    // price recovers ABOVE the level → stops + re-arms
    expect(updateAlarms(alarms, 96, s)).toBe(true)
    expect(alarms[0].triggered).toBe(false)
    expect(s.calls).toEqual([['start', 'b1', 'below'], ['stop', 'b1']])
    // crosses again → rings again
    expect(updateAlarms(alarms, 94.5, s)).toBe(true)
    expect(alarms[0].triggered).toBe(true)
  })

  test('above alarms mirror: ring at/over the level, stop when price drops back', () => {
    const s = stubSound()
    const alarms = [{ id: 'a1', side: 'above', price: 105, triggered: false }]
    updateAlarms(alarms, 106, s)
    expect(alarms[0].triggered).toBe(true)
    updateAlarms(alarms, 104, s)
    expect(alarms[0].triggered).toBe(false)
    expect(s.calls).toEqual([['start', 'a1', 'above'], ['stop', 'a1']])
  })

  test('an alarm mid-drag is skipped entirely', () => {
    const s = stubSound()
    const alarms = [{ id: 'a1', side: 'above', price: 105, triggered: false, $dragging: true }]
    expect(updateAlarms(alarms, 110, s)).toBe(false)
    expect(alarms[0].triggered).toBe(false)
    expect(s.calls).toEqual([])
  })
})

describe('AlarmSound timers (no Web Audio backend → silent no-ops)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('start is idempotent per id; stop/stopAll clear the repeats', () => {
    const s = new AlarmSound()
    s.start('a1', 'above')
    s.start('a1', 'above') // duplicate start must not stack a second timer
    s.start('a2', 'below')
    expect(s.timers.size).toBe(2)
    s.stop('a1')
    expect(s.timers.size).toBe(1)
    s.stopAll()
    expect(s.timers.size).toBe(0)
    s.destroy() // no throw without an AudioContext
  })

  test('beeping without an audio backend never throws across repeats', () => {
    const s = new AlarmSound()
    s.start('a1', 'above')
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow()
    s.destroy()
  })
})
