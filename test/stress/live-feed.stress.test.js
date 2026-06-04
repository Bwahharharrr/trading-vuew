// Phase 3.1b GATE — 600-ticks/sec live-feed reactivity baseline.
//
// Pins the current touchData/dataVersion + AggTool anti-thrash behaviour as
// concrete budgets. The 3.1b reactivity rewrite (stores + typed actions,
// removing touchData/dataVersion) MUST keep these green — that's how we prove
// "correct reactive updates with no thrash" instead of guessing.
import { test, expect, describe } from 'vitest'
import { setupStressDc, percentile } from './_stress-harness.js'

// A small deterministic seed (timestamps 1m apart).
const TF = 60000
const T0 = 1_600_000_000_000
const seed = Array.from({ length: 50 }, (_, i) => {
  const t = T0 + i * TF
  const p = 100 + i
  return [t, p, p + 1, p - 1, p, 10]
})

describe('live-feed reactivity baseline (current touchData/dataVersion)', () => {
  test('TICK COLLAPSE: 600 same-candle ticks between flushes => 1 render', () => {
    const h = setupStressDc(seed, { tf: TF })
    const lastT = h.lastCandle()[0]
    try {
      for (let i = 0; i < 600; i++) {
        const c = 200 + i * 0.01
        h.tick([lastT, c, c, c, c, 1]) // same timestamp as last candle
      }
      expect(h.renders).toBe(0) // AggTool batches; no render until a flush
      h.flush()
      // 600 ticks collapsed into ONE render invalidation — the anti-thrash core.
      expect(h.renders).toBe(1)
      expect(h.touches).toBe(1)
      // Correctness: the last candle reflects the LATEST tick.
      expect(h.lastCandle()[4]).toBeCloseTo(200 + 599 * 0.01, 6)
      expect(h.candleCount()).toBe(seed.length) // replaced in place, not appended
    } finally { h.teardown() }
  })

  test('NEW CANDLES: 10 candles x 60 ticks, one flush each => 10 renders, all appended', () => {
    const h = setupStressDc(seed, { tf: TF })
    const baseLen = h.candleCount()
    const lastT = h.lastCandle()[0]
    try {
      for (let c = 1; c <= 10; c++) {
        const ct = lastT + c * TF
        let close
        for (let k = 0; k < 60; k++) {
          close = 300 + c + k * 0.01
          h.tick([ct, close, close, close, close, 1])
        }
        h.flush()
        // each candle's appended value reflects its last tick
        expect(h.lastCandle()[0]).toBe(ct)
        expect(h.lastCandle()[4]).toBeCloseTo(300 + c + 59 * 0.01, 6)
      }
      expect(h.candleCount()).toBe(baseLen + 10) // 10 new candles, none lost
      expect(h.renders).toBe(10) // exactly one render per flush — no thrash
      expect(h.touches).toBe(10)
    } finally { h.teardown() }
  })

  test('REACTIVE BRIDGE: render invalidations == touchData calls (1:1, no missed/dup)', () => {
    const h = setupStressDc(seed, { tf: TF })
    const lastT = h.lastCandle()[0]
    try {
      for (let f = 0; f < 20; f++) {
        for (let i = 0; i < 30; i++) { const c = 150 + f + i * 0.01; h.tick([lastT, c, c, c, c, 1]) }
        h.flush()
      }
      expect(h.renders).toBe(20)
      expect(h.renders).toBe(h.touches)
    } finally { h.teardown() }
  })

  test('THROUGHPUT: sustains 600 ticks/sec (p99 per-tick well under frame budget)', () => {
    const h = setupStressDc(seed, { tf: TF })
    const lastT = h.lastCandle()[0]
    const samples = []
    try {
      for (let i = 0; i < 600; i++) {
        const c = 200 + i * 0.01
        const t0 = performance.now()
        h.tick([lastT, c, c, c, c, 1])
        samples.push(performance.now() - t0)
      }
      const t0 = performance.now()
      h.flush()
      const flushMs = performance.now() - t0
      const p99 = percentile(samples, 0.99)
      const total = samples.reduce((a, b) => a + b, 0) + flushMs
      // Baseline budgets (generous; 3.1b must stay within these):
      expect(total).toBeLessThan(1000)   // 600 ticks + flush << 1s => >600/sec
      expect(p99).toBeLessThan(5)        // per-tick p99 well under a 16ms frame
      // eslint-disable-next-line no-console
      console.log(`[stress baseline] 600 ticks: total=${total.toFixed(1)}ms p99/tick=${p99.toFixed(3)}ms flush=${flushMs.toFixed(2)}ms renders=${h.renders}`)
    } finally { h.teardown() }
  })
})
