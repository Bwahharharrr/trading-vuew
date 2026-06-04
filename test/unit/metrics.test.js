import { test, expect, describe } from 'vitest'
import RenderMetrics from '../../src/stuff/metrics.js'

describe('RenderMetrics shim', () => {
  test('empty snapshot is zeroed', () => {
    const m = new RenderMetrics()
    expect(m.snapshot()).toEqual({
      frames: 0, fps: 0, p50: 0, p95: 0, p99: 0, max: 0, avgDrawCalls: 0,
    })
  })

  test('records frames, draw calls, and percentiles', () => {
    const m = new RenderMetrics()
    for (let i = 0; i < 10; i++) {
      m.frame(() => {
        m.drawCall(2)
        // burn a little time so durations are > 0
        let s = 0
        for (let j = 0; j < 1e5; j++) s += j
        return s
      })
    }
    const snap = m.snapshot()
    expect(snap.frames).toBe(10)
    expect(snap.avgDrawCalls).toBe(2)
    expect(snap.p99).toBeGreaterThanOrEqual(snap.p50)
    expect(snap.max).toBeGreaterThanOrEqual(snap.p99)
  })

  test('ring buffer caps retained frames', () => {
    const m = new RenderMetrics(5)
    for (let i = 0; i < 20; i++) m.frame(() => {})
    expect(m.snapshot().frames).toBe(5)
  })

  test('begin/end bracket works without a function', () => {
    const m = new RenderMetrics()
    m.begin()
    m.drawCall()
    m.end()
    expect(m.snapshot().frames).toBe(1)
    expect(m.snapshot().avgDrawCalls).toBe(1)
  })
})
