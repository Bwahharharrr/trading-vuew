// Feed resilience regressions (C5, M17, M18, M19, M20):
// superseded-subscribe quiet failure, reconnect re-issue wedge, backoff
// exhaustion revival, post-history error routing, instance-scoped layers.
import { describe, it, expect, vi } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import { CorkyClient } from '../../src/helpers/feed/corky-client.js'
import DataCube from '../../src/helpers/datacube.js'

const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms))

function mkDc() {
  return new DataCube(
    { chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] },
    { scripts: false, validation: 'off' })
}

class FakeClient {
  constructor() { this.sent = []; this._subs = new Map(); this._open = []; this.subscribeImpl = async () => ({ type: 'historical_complete' }) }
  async listCandleStates() { return [] }
  subscribeCandles(opts) { this.sent.push(opts); return this.subscribeImpl(opts) }
  async unsubscribe(sid) { this.sent.push({ type: 'unsubscribe', subscription_id: sid }); return {} }
  onSubscription(sid, cb) { let s = this._subs.get(sid); if (!s) { s = new Set(); this._subs.set(sid, s) } s.add(cb); return () => s.delete(cb) }
  on(type, cb) { if (type === 'open') this._open.push(cb); return () => {} }
  emit(sid, event) { for (const cb of this._subs.get(sid) || []) cb({ event: { ...event, subscription_id: sid } }) }
  fireOpen() { for (const cb of this._open) cb() }
  close() {}
}

describe('C5 — superseded subscribe fails QUIETLY (returns null, no onError/throw)', () => {
  it('late failure of an abandoned stream neither throws nor reports', async () => {
    const client = new FakeClient()
    const feed = new CorkyFeed({ client, dataCube: mkDc(), subscribeTimeoutMs: 30 })
    const errsA = []
    // A: subscribe that never completes (will time out at 30ms)
    let resolveA
    client.subscribeImpl = () => new Promise((res) => { resolveA = res })
    const pA = feed.subscribe(
      { venue: 'v', symbol: 'A', timeframe: '1m' },
      { onError: (e) => errsA.push(e) })
    await tick(2)
    // B supersedes A mid-load and completes
    client.subscribeImpl = async () => ({ type: 'historical_complete' })
    const hB = await feed.subscribe({ venue: 'v', symbol: 'B', timeframe: '1m' })
    expect(hB).toBeTruthy()
    // A's guard timeout now fires — it must resolve NULL, not throw, not report
    const rA = await pA
    expect(rA).toBeNull()
    expect(errsA).toHaveLength(0)
    void resolveA
  })
})

describe('M17 — a failed reconnect re-issue stays ELIGIBLE for the next reconnect', () => {
  it('re-issues again on the next open instead of skipping forever', async () => {
    const client = new FakeClient()
    const feed = new CorkyFeed({ client, dataCube: mkDc(), subscribeTimeoutMs: 0 })
    const errs = []
    const h = await feed.subscribe({ venue: 'v', symbol: 'S', timeframe: '1m' }, { onError: (e) => errs.push(e) })
    client.emit(h.subscription_id, { type: 'historical_complete' })
    feed._everOpened = true
    // reconnect #1: the re-issue REJECTS (gateway refuses)
    client.subscribeImpl = async () => { throw Object.assign(new Error('refused'), { retryable: true }) }
    client.sent.length = 0
    client.fireOpen()
    await tick()
    expect(client.sent.some((c) => c.subscription_id === h.subscription_id)).toBe(true)
    expect(errs.length).toBe(1)            // failure reported
    // reconnect #2: the handle must be re-issued AGAIN (old code skipped it)
    client.subscribeImpl = async () => ({ type: 'historical_complete' })
    client.sent.length = 0
    client.fireOpen()
    await tick()
    expect(client.sent.some((c) => c.subscription_id === h.subscription_id)).toBe(true)
  })
})

describe('M18 — client revival after backoff exhaustion', () => {
  function mkSock() {
    return { sent: [], readyState: 0, send(d) { this.sent.push(d) }, close() { this.readyState = 3 } }
  }
  it('connect() resets the retry budget and isDead() reports a closed client', () => {
    const socks = []
    const client = new CorkyClient({
      url: 'ws://x',
      socketFactory: () => { const s = mkSock(); socks.push(s); return s },
      backoff: { base: 1, factor: 1, max: 1, maxRetries: 2 },
    })
    client.connect()
    client._retries = 2                       // exhausted
    socks[socks.length - 1].readyState = 3    // dead socket
    expect(client.isDead()).toBe(true)
    client.connect()                          // revival
    expect(client._retries).toBe(0)           // fresh budget
    expect(socks.length).toBe(2)              // new socket opened
    expect(client.isDead()).toBe(false)
  })
})

describe('M19 — post-history subscription errors reach the feed handler', () => {
  it('a mid-stream error (no pending request) is fanned out by subscription_id', async () => {
    const client = new CorkyClient({ url: 'ws://x', socketFactory: () => ({ send() {}, close() {} }), backoff: false })
    const got = []
    client.onSubscription('sub-9', (p) => got.push(p.event))
    // no pending request for this request_id — simulates the runtime dying
    // AFTER historical_complete settled the original subscribe
    client._route({ schema_version: 1, request_id: 'gone', event: { type: 'error', code: 'runtime_control_rejected', message: 'died', subscription_id: 'sub-9' } })
    expect(got).toHaveLength(1)
    expect(got[0].code).toBe('runtime_control_rejected')
  })
})

describe('M20 — layer toggles are instance-scoped', () => {
  function builtHandleFeed() {
    const client = new FakeClient()
    const dc = mkDc()
    const feed = new CorkyFeed({ client, dataCube: dc, subscribeTimeoutMs: 0 })
    const mkOv = (instance, layerId) => ({
      name: `${instance}:${layerId}`, type: 'Spline', data: [],
      settings: {
        corkyKind: 'SCMR', corkyInstance: instance, corkyLayerId: layerId,
        corkyKey: `${instance}#${layerId}`, corkyView: true, corkyVisibleDefault: true,
      },
    })
    const handle = {
      built: { onchart: [mkOv('SCMR', 'trade_lines'), mkOv('SCMR(INV)', 'trade_lines')], offchart: [] },
      addedOverlays: new Set(), enabledLayers: new Set(), enabledKinds: new Set(),
      hiddenLayers: new Set(),
    }
    // both instances' overlays start enabled
    for (const ov of handle.built.onchart) handle.addedOverlays.add(ov)
    return { feed, dc, handle }
  }

  it('disabling one instance\'s layer leaves the sibling instance alone', () => {
    const { feed, handle } = builtHandleFeed()
    const applied = feed.setLayerEnabled(handle, 'trade_lines', false, 'SCMR(INV)')
    expect(applied).toBe(true)
    const remaining = [...handle.addedOverlays].map((o) => o.settings.corkyInstance)
    expect(remaining).toEqual(['SCMR'])                       // sibling untouched
    expect(handle.hiddenLayers.has('SCMR(INV)#trade_lines')).toBe(true)
    expect(handle.hiddenLayers.has('trade_lines')).toBe(false) // no bare collision key
  })

  it('a persisted scoped key round-trips through setLayerEnabled', () => {
    const { feed, handle } = builtHandleFeed()
    handle.addedOverlays.clear()
    const applied = feed.setLayerEnabled(handle, 'SCMR(INV)#trade_lines', true)
    expect(applied).toBe(true)
    const added = [...handle.addedOverlays].map((o) => o.settings.corkyInstance)
    expect(added).toEqual(['SCMR(INV)'])
  })
})
