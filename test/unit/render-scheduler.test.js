// RenderScheduler — the single rAF spine (scale-engine Phase 2). Pins the
// coalescing invariants the whole migration leans on: max-merge (a pending Full
// is NEVER demoted by a later Cursor), exactly one drain per frame regardless of
// how many sources invalidate, _drain nulls its rafId BEFORE running so a
// re-invalidation during the drain schedules exactly one follow-up frame, and
// flush()/destroy() behave deterministically. Frame primitives are injected so
// the test is fully deterministic.
import { test, expect, describe } from 'vitest'
import { RenderScheduler, LEVEL } from '../../src/render/render-scheduler.js'

function harness(onDrain) {
  let nextId = 1
  const pend = new Map()            // id -> cb (the "rAF queue")
  const raf = (cb) => { const id = nextId++; pend.set(id, cb); return id }
  const caf = (id) => { pend.delete(id) }
  const drains = []
  const sched = new RenderScheduler(onDrain || ((lvl) => drains.push(lvl)), { raf, caf })
  // Run every currently-queued frame; callbacks scheduled DURING a frame land in
  // the queue and run on the NEXT tick (real rAF semantics).
  const tick = () => {
    const cbs = [...pend.values()]
    pend.clear()
    for (const cb of cbs) cb(0)
  }
  return { sched, drains, tick, pend }
}

describe('RenderScheduler', () => {
  test('one invalidate → one scheduled frame → one drain at that level; mask resets', () => {
    const { sched, drains, tick } = harness()
    sched.invalidate(LEVEL.FULL)
    expect(sched.scheduled).toBe(true)
    expect(sched.pending).toBe(LEVEL.FULL)
    tick()
    expect(drains).toEqual([LEVEL.FULL])
    expect(sched.pending).toBe(LEVEL.NONE)
    expect(sched.scheduled).toBe(false)
  })

  test('MAX-MERGE: a pending Full is never demoted by a later Cursor (order-independent)', () => {
    const { sched, drains, tick } = harness()
    sched.invalidate(LEVEL.CURSOR)
    sched.invalidate(LEVEL.FULL)
    sched.invalidate(LEVEL.CURSOR)       // must NOT downgrade
    tick()
    expect(drains).toEqual([LEVEL.FULL]) // pan→pan→cursor in one frame drains as Full
  })

  test('many invalidates in one frame coalesce to exactly ONE drain', () => {
    const { sched, drains, tick, pend } = harness()
    sched.invalidate(LEVEL.REPOSITION)
    sched.invalidate(LEVEL.REPOSITION)
    sched.invalidate(LEVEL.FULL)
    expect(pend.size).toBe(1)            // a single rAF scheduled
    tick()
    expect(drains).toEqual([LEVEL.FULL])
  })

  test('re-invalidating DURING the drain schedules exactly one follow-up frame (rafId nulled first)', () => {
    let calls = 0
    const h = harness((lvl) => {
      calls++
      if (calls === 1) h.sched.invalidate(LEVEL.CURSOR)  // re-entrant invalidate
    })
    h.sched.invalidate(LEVEL.FULL)
    h.tick()                              // drain #1 → re-invalidates
    expect(calls).toBe(1)
    expect(h.pend.size).toBe(1)           // exactly one follow-up frame queued
    h.tick()                              // drain #2 (the Cursor follow-up)
    expect(calls).toBe(2)
    expect(h.pend.size).toBe(0)
  })

  test('idle (no invalidate) never drains', () => {
    const { drains, tick } = harness()
    tick()
    expect(drains).toEqual([])
  })

  test('flush() runs the pending drain synchronously and cancels the frame', () => {
    const { sched, drains, pend } = harness()
    sched.invalidate(LEVEL.REPOSITION)
    sched.flush()
    expect(drains).toEqual([LEVEL.REPOSITION])  // ran now, not next frame
    expect(pend.size).toBe(0)                   // rafId canceled
    expect(sched.pending).toBe(LEVEL.NONE)
  })

  test('flush() with nothing pending is a no-op', () => {
    const { sched, drains } = harness()
    sched.flush()
    expect(drains).toEqual([])
  })

  test('destroy() cancels the pending frame and never drains afterwards', () => {
    const { sched, drains, tick } = harness()
    sched.invalidate(LEVEL.FULL)
    sched.destroy()
    tick()
    expect(drains).toEqual([])             // onDrain nulled, frame canceled
  })
})
