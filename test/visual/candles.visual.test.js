// GOLDEN MASTER — candle/volume rasterisation (pixel baseline).
//
// Pins the pixel output of the real Candle/Volbar draw primitives. Any change
// to candle geometry, body/wick colours, or volume bars after the Phase 3
// RenderEngine extraction shows up here as a snapshot diff that must be
// explained — the visual safety net the renderer refactor relies on.
import { test, expect, describe, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderCandles, pixelSignature } from './_canvas-harness.js'

// See canvas-context.test.js: the skia-canvas pixel readback in pixelSignature()
// is slow and contention-sensitive; the 5s default is too tight under load.
vi.setConfig({ testTimeout: 20000 })

const btc = JSON.parse(
  readFileSync(new URL('../data/data_btc.json', import.meta.url))
).ohlcv

describe('candle rasterisation', () => {
  test('60-candle BTC slice signature', () => {
    const slice = btc.slice(100, 160)
    const { ctx, width, height } = renderCandles(slice, { width: 800, height: 400 })
    expect(pixelSignature(ctx, width, height)).toMatchSnapshot()
  })

  test('mixed up/down candles render both body colours', () => {
    const slice = btc.slice(100, 160)
    const { ctx, width, height } = renderCandles(slice)
    const sig = pixelSignature(ctx, width, height)
    // Sanity: a real BTC slice has both green and red candles.
    expect(sig.greenBucket).toBeGreaterThan(0)
    expect(sig.redBucket).toBeGreaterThan(0)
    expect(sig.coverageBucket).toBeGreaterThan(0)
  })

  test('rasterisation is deterministic across runs', () => {
    const slice = btc.slice(100, 160)
    const a = pixelSignature(...ctxOf(renderCandles(slice)))
    const b = pixelSignature(...ctxOf(renderCandles(slice)))
    expect(a).toEqual(b)
  })
})

function ctxOf(r) {
  return [r.ctx, r.width, r.height]
}
