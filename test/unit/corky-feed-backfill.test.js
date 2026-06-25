// CorkyFeed.fetchHistory — the one-shot historical candle read that powers the
// chart's lazy "load older candles on pan-left" loader. It runs on its OWN
// subscription id, collects historical chunks via the request's onEvent, awaits
// historical_complete, unsubscribes the live tail, and returns ascending OHLCV.
import { describe, it, expect } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'

const row = (ts, o, h, l, c, v) => ({ timeframe: '1h', candle: { timestamp_ms: ts, open: o, high: h, low: l, close: c, volume: v } })

// Fake client that delivers the given chunk events through onEvent, then
// resolves subscribeCandles (as the real client does on historical_complete).
class FetchFakeClient {
  constructor(deliver) { this.sent = []; this._deliver = deliver }
  async subscribeCandles(opts) {
    this.sent.push({ type: 'subscribe_candles', ...opts })
    if (opts.onEvent) for (const ev of this._deliver) opts.onEvent({ event: ev })
    return { type: 'historical_complete' }
  }
  async unsubscribe(subscription_id) { this.sent.push({ type: 'unsubscribe', subscription_id }); return {} }
  onSubscription() { return () => {} }
}

const mkFeed = (deliver) => {
  const client = new FetchFakeClient(deliver)
  return { client, feed: new CorkyFeed({ client, dataCube: {} }) }
}

describe('CorkyFeed.fetchHistory', () => {
  it('collects row-format chunks → ascending OHLCV, requests start_end, unsubscribes', async () => {
    const { client, feed } = mkFeed([
      { type: 'historical_chunk', chunk_index: 0, rows: [row(1000, '1', '2', '0.5', '1.5', '10')] },
      { type: 'historical_chunk', chunk_index: 1, rows: [row(2000, '1.5', '2.5', '1', '2', '12')] },
      { type: 'historical_complete' },
    ])
    const out = await feed.fetchHistory({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', start_ms: 0, end_ms: 3000 })
    expect(out).toEqual([[1000, 1, 2, 0.5, 1.5, 10], [2000, 1.5, 2.5, 1, 2, 12]])
    const sub = client.sent.find((s) => s.type === 'subscribe_candles')
    expect(sub.range).toEqual({ type: 'start_end', start_ms: 0, end_ms: 3000 })
    expect(sub.include_indicators).toBe(false)              // candles only
    expect(sub.subscription_id).toMatch(/backfill/)         // its OWN id, not the live stream
    expect(client.sent.some((s) => s.type === 'unsubscribe')).toBe(true)
  })

  it('reassembles columnar chunks (out of order) and dedupes by timestamp', async () => {
    const columnar = (idx, ts, closes) => ({
      type: 'historical_chunk_columnar', chunk_index: idx, timeframe: '1h',
      columns: { timestamp_ms: ts, open: ts.map(() => '1'), high: ts.map(() => '2'), low: ts.map(() => '0'), close: closes, volume: ts.map(() => '5') },
    })
    const { feed } = mkFeed([
      columnar(1, [2000], ['2']),
      columnar(0, [1000, 2000], ['1', '9']),   // chunk 0 sorts first; ts 2000 later replaced by chunk 1
      { type: 'historical_complete' },
    ])
    const out = await feed.fetchHistory({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', start_ms: 0, end_ms: 3000 })
    expect(out.map((r) => r[0])).toEqual([1000, 2000])      // deduped to two timestamps
    expect(out.find((r) => r[0] === 2000)[4]).toBe(2)       // chunk-1 (higher index) wins the close
  })

  it('guards bad input (missing fields / non-positive window) without subscribing', async () => {
    const { client, feed } = mkFeed([{ type: 'historical_complete' }])
    expect(await feed.fetchHistory({ symbol: 'tBTCUSD', timeframe: '1h', start_ms: 0, end_ms: 1 })).toEqual([])
    expect(await feed.fetchHistory({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', start_ms: 5, end_ms: 5 })).toEqual([])
    expect(client.sent.some((s) => s.type === 'subscribe_candles')).toBe(false)
  })
})
