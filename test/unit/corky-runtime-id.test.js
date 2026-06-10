// Runtime-targeting: the gateway routes control requests (subscribe / patch) to
// a runtime, defaulting to a stale "first public runtime for venue" when no
// target_runtime_id is given — the source of "missing or stale runtime control
// session". CorkyFeed must echo the discovered state's runtime_id back as
// target_runtime_id, including on reconnect re-issue.
import { describe, it, expect, beforeEach } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'

class FakeClient {
  constructor() { this.sent = []; this._subs = new Map(); this._reconnectCbs = [] }
  async listCandleStates() { return [] }
  async subscribeCandles(opts) { this.sent.push(opts); this._lastSid = opts.subscription_id; return { type: 'historical_complete' } }
  async unsubscribe(sid) { this.sent.push({ type: 'unsubscribe', subscription_id: sid }); return { type: 'control_ack' } }
  onSubscription(sid, cb) { let s = this._subs.get(sid); if (!s) { s = new Set(); this._subs.set(sid, s) } s.add(cb); return () => s.delete(cb) }
  on(type, cb) { if (type === 'open') this._reconnectCbs.push(cb) }
  close() {}
  // simulate a reconnect (the feed re-issues subscribes on 'open')
  fireReconnect() { for (const cb of this._reconnectCbs) cb() }
}

let client, feed
beforeEach(() => {
  client = new FakeClient()
  feed = new CorkyFeed({ client, dataCube: new DataCube({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] }) })
})

const RID = 'public-market-main'

describe('subscribe threads target_runtime_id', () => {
  it('forwards the runtime id to subscribe_candles', async () => {
    await feed.subscribe({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1m', target_runtime_id: RID })
    const sub = client.sent.find((c) => c.timeframe === '1m')
    expect(sub.target_runtime_id).toBe(RID)
  })

  it('omits it cleanly when no runtime id is supplied (undefined, not crash)', async () => {
    await feed.subscribe({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1m' })
    expect(client.sent[0].target_runtime_id).toBeUndefined()
  })
})

describe('reconnect re-issue keeps the runtime target', () => {
  it('re-subscribes with the same target_runtime_id after a drop', async () => {
    const handle = await feed.subscribe({ venue: 'bitfinex', symbol: 'tBTCUSD', timeframe: '1m', target_runtime_id: RID })
    // history completes so the handle is eligible for reconnect re-issue
    const sid = handle.subscription_id
    for (const cb of client._subs.get(sid)) cb({ event: { type: 'historical_complete', subscription_id: sid } })
    client.sent.length = 0
    feed._everOpened = true   // treat the next open as a RECONNECT, not the initial connect
    client.fireReconnect()
    const reissue = client.sent.find((c) => c.subscription_id === sid)
    expect(reissue).toBeTruthy()
    expect(reissue.target_runtime_id).toBe(RID)
  })
})
