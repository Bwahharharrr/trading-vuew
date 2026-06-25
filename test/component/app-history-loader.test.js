// @vitest-environment jsdom
//
// App._corkyHistoryLoader — the gateway lazy-history loader the chart calls when
// the user pans LEFT past the earliest loaded candle. Exercised against a fake
// `this` (no mount), the same technique as the other App handler tests.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import App from '../../src/App.vue'

const M = App.methods
const H = 3600000

function mkCtx(rows = [[1000, 1, 2, 0.5, 1.5, 10]]) {
  const ctx = {
    corkyCurrent: { venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h' },
    _corkyGen: 1,
    corkyFeed: { fetchHistory: vi.fn(async () => rows) },
  }
  ctx._corkyHistoryLoader = M._corkyHistoryLoader
  ctx._tfToMs = M._tfToMs
  return ctx
}

let ctx
beforeEach(() => { ctx = mkCtx() })

describe('_corkyHistoryLoader', () => {
  test('fetches the panned older window and returns the rows', async () => {
    const out = await ctx._corkyHistoryLoader([5000 * 1, 9000 * 1])   // small window (< cap)
    expect(out).toEqual([[1000, 1, 2, 0.5, 1.5, 10]])
    expect(ctx.corkyFeed.fetchHistory).toHaveBeenCalledWith(
      expect.objectContaining({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h', start_ms: 5000, end_ms: 9000 }))
  })

  test('caps the backfill window to 1000 bars for a far pan', async () => {
    const end = 100000 * H
    await ctx._corkyHistoryLoader([0, end])           // would be 100000 bars → clamp to last 1000
    const [opts] = ctx.corkyFeed.fetchHistory.mock.calls[0]
    expect(opts.start_ms).toBe(end - 1000 * H)        // clamped
    expect(opts.end_ms).toBe(end)
  })

  test('drops the result if the stream switched mid-fetch (staleness)', async () => {
    ctx.corkyFeed.fetchHistory = vi.fn(async () => { ctx._corkyGen = 2; return [[1000, 1, 2, 0.5, 1.5, 10]] })
    const out = await ctx._corkyHistoryLoader([0, 9000])
    expect(out).toEqual([])                            // gen changed → discard
  })

  test('no-ops without a charted stream or with a non-positive window', async () => {
    ctx.corkyCurrent = null
    expect(await ctx._corkyHistoryLoader([0, 9000])).toEqual([])
    ctx.corkyCurrent = { venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1h' }
    expect(await ctx._corkyHistoryLoader([9000, 9000])).toEqual([])
    expect(ctx.corkyFeed.fetchHistory).not.toHaveBeenCalled()
  })
})
