// @vitest-environment jsdom
//
// End-to-end repro: REAL CorkyFeed -> REAL DataCube -> mounted TradingVue.
// Replays history, appends one live candle, then streams INTRA-CANDLE updates
// (same timestamp_ms, rising close, incrementing sequence) — the realtime case
// the user reports as "current candle drawn once, never updated".
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import * as fx from '../fixtures/corky/index.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
  totalClearRects, methodTotal, resetCounters,
} from './_component-harness.js'

class FakeClient {
  constructor() { this._subListeners = new Map(); this._states = fx.candleStatesEvent.event.states }
  async listCandleStates() { return this._states }
  async subscribeCandles(opts) { this._lastSubId = opts.subscription_id; return { type: 'historical_complete' } }
  async unsubscribe() { return { type: 'control_ack' } }
  onSubscription(sid, cb) {
    let set = this._subListeners.get(sid)
    if (!set) { set = new Set(); this._subListeners.set(sid, set) }
    set.add(cb); return () => set.delete(cb)
  }
  close() {}
  emit(sid, event) {
    const set = this._subListeners.get(sid)
    if (!set) return
    const payload = { request_id: null, event: { ...event, subscription_id: sid } }
    for (const cb of [...set]) cb(payload)
  }
}

// A live_update for the CURRENT candle bucket (same ts), with a new close.
function intraCandle(seq, close) {
  return {
    type: 'live_update', sequence: seq,
    row: {
      timeframe: '1m',
      candle: {
        timestamp_ms: 1779465000000, // SAME bucket as the appended live candle
        open: '77871', high: String(close + 5), low: '77860', close: String(close),
        volume: '1.25',
      },
      indicators: { 'sma:20': { sma: String(close - 20) } },
    },
  }
}

describe('intra-candle realtime redraw (real CorkyFeed)', () => {
  let wrapper, dc, client, feed
  beforeEach(() => { installCanvasEnv() })
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  test('streaming same-ts updates repaint the current candle each tick', async () => {
    dc = new DataCube() // real App.vue style: empty, feed fills it
    wrapper = mount(TradingVue, { props: { data: dc, width: 600, height: 400 }, attachTo: document.body })
    await settle()

    client = new FakeClient()
    feed = new CorkyFeed({ client, dataCube: dc })
    const handle = await feed.subscribe({ venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' })
    const sid = handle.subscription_id

    client.emit(sid, fx.historicalChunkEvent.event)
    client.emit(sid, { type: 'historical_complete' })
    await settle()

    // Append the current candle (new bucket) — this is the "drawn once" event.
    client.emit(sid, intraCandle(42, 77890))
    await settle(6)
    expect(dc.data.chart.data.length).toBe(2)

    // Now stream INTRA-CANDLE updates: same ts, rising close. Each MUST repaint.
    const revStart = dc.cd.revision()
    let repaintedTicks = 0
    for (let k = 0; k < 4; k++) {
      resetCounters()
      client.emit(sid, intraCandle(43 + k, 77900 + k * 10))
      await settle(6)
      const painted = totalClearRects() > 0 && (methodTotal('fillRect') + methodTotal('stroke')) > 0
      if (painted) repaintedTicks++
    }

    // Data was actually mutated in place (still 2 candles, last close updated).
    expect(dc.data.chart.data.length).toBe(2)
    expect(dc.data.chart.data[1][4]).toBe(77930)
    // Revision bumped for each accepted tick.
    expect(dc.cd.revision()).toBeGreaterThan(revStart)
    // THE ASSERTION: every intra-candle tick repainted the canvas.
    expect(repaintedTicks).toBe(4)
  })
})
