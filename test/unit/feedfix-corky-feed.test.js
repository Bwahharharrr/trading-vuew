// Regression tests for the CorkyFeed hub bug-fixes (multi-agent review batch):
//   F1  setLayerEnabled actually shows a hidden-by-default layer (display flip)
//   F2  offchart grid.id is recomputed under incremental toggles (no orphan)
//   CC  disabling one of two candle_color kinds keeps the other's colours
//   KI  indicator-kind toggle matches case-insensitively
//   HL  an explicitly-hidden layer is not resurrected by a kind off→on cycle
//   F5  a superseded in-flight subscribe can't double-subscribe / clobber
//   F8  a subscribe timeout unsubscribes the gateway-side stream
//   F3  a reconnect ('open' re-fire) re-issues subscribe_candles
//   PERF onStatus({phase:'live'}) is emitted once, not per tick
import { test, expect, describe, beforeEach } from 'vitest'
import { CorkyFeed } from '../../src/helpers/feed/corky-feed.js'
import DataCube from '../../src/helpers/datacube.js'

// A controllable fake client: records outbound commands, registers per-sub
// fan-out + lifecycle listeners, and lets the test drive history/live/reconnect.
class DriveClient {
  constructor() {
    this.sent = []
    this._subs = new Map()       // subscription_id → Set<cb>
    this._pending = new Map()    // subscription_id → flow resolver
    this._lc = new Map()         // lifecycle type → Set<cb>
    this.neverResolve = false
  }
  async listCandleStates() { return [] }
  subscribeCandles(opts) {
    this.sent.push({ type: 'subscribe_candles', ...opts })
    return new Promise((res) => { if (!this.neverResolve) this._pending.set(opts.subscription_id, res) })
  }
  unsubscribe(id) { this.sent.push({ type: 'unsubscribe', subscription_id: id }); return Promise.resolve({}) }
  onSubscription(id, cb) {
    let s = this._subs.get(id); if (!s) { s = new Set(); this._subs.set(id, s) }
    s.add(cb); return () => s.delete(cb)
  }
  on(type, cb) { let s = this._lc.get(type); if (!s) { s = new Set(); this._lc.set(type, s) } s.add(cb); return () => s.delete(cb) }
  close() {}
  // ── drivers ──
  emit(id, event) {
    const s = this._subs.get(id); if (!s) return
    for (const cb of [...s]) cb({ request_id: null, event: { ...event, subscription_id: id } })
  }
  fire(type, payload) { const s = this._lc.get(type); if (s) for (const cb of [...s]) cb(payload) }
  completeHistory(id) {
    this.emit(id, { type: 'historical_complete' })
    const r = this._pending.get(id); if (r) { this._pending.delete(id); r({ type: 'historical_complete' }) }
  }
}

function newDC() {
  return new DataCube({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [] }, { scripts: false, validation: 'off' })
}
function makeHandle(built) {
  return { built, addedOverlays: new Set(), enabledKinds: new Set(), enabledLayers: new Set(), hiddenLayers: new Set() }
}

describe('CorkyFeed hub fixes', () => {
  let client, dc, feed
  beforeEach(() => { client = new DriveClient(); dc = newDC(); feed = new CorkyFeed({ client, dataCube: dc }) })

  test('F1: setLayerEnabled shows a hidden-by-default layer (display flipped true)', () => {
    const ov = { name: 'tl', type: 'Spline', data: [], raw: [], settings: { corkyKind: 'SCMR', corkyLayerId: 'tl', corkyView: true, corkyVisibleDefault: false, display: false } }
    const h = makeHandle({ chart: { type: 'Candles', data: [] }, onchart: [ov], offchart: [] })
    expect(feed.setLayerEnabled(h, 'tl', true)).toBe(true)
    expect(dc.data.onchart).toContain(ov)
    expect(ov.settings.display).toBe(true) // would be false → never drawn, without the fix
  })

  test('F2: enabling only a pane SIBLING pulls in its anchor and fixes grid.id', () => {
    const anchor = { name: 'hist', type: 'Histogram', data: [], raw: [], settings: { corkyKind: 'MACD', corkyLayerId: 'hist', corkyView: true, corkyVisibleDefault: true, corkyPaneName: 'macd', corkyPaneAnchor: true } }
    const sibling = { name: 'lines', type: 'Spline', data: [], raw: [], grid: { id: 999 }, settings: { corkyKind: 'MACD', corkyLayerId: 'lines', corkyView: true, corkyVisibleDefault: true, corkyPaneName: 'macd', corkyPaneAnchor: false } }
    const h = makeHandle({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [anchor, sibling] })
    feed.setLayerEnabled(h, 'lines', true) // sibling only
    // anchor was pulled in, anchors-first, sibling grid.id renumbered to pane index 1
    expect(dc.data.offchart).toEqual([anchor, sibling])
    expect(anchor.grid).toBeUndefined()       // anchor spawns the grid → no grid.id
    expect(sibling.grid).toEqual({ id: 1 })   // matches anchor at offchart[0]
  })

  test('F2: two panes toggled get distinct, position-correct grid ids', () => {
    const mk = (pane, anchor, layerId, kind) => ({ name: layerId, type: 'Spline', data: [], raw: [], ...(anchor ? {} : { grid: { id: 999 } }), settings: { corkyKind: kind, corkyLayerId: layerId, corkyView: true, corkyVisibleDefault: true, corkyPaneName: pane, corkyPaneAnchor: anchor } })
    const histA = mk('macd', true, 'hist', 'MACD'), lines = mk('macd', false, 'lines', 'MACD'), bull = mk('strength', true, 'bull', 'MACD')
    const h = makeHandle({ chart: { type: 'Candles', data: [] }, onchart: [], offchart: [histA, lines, bull] })
    feed.setIndicatorEnabled(h, 'MACD', true)
    expect(dc.data.offchart.slice(0, 2)).toEqual([histA, bull]) // anchors first, in pane order
    expect(histA.grid).toBeUndefined()
    expect(bull.grid).toBeUndefined()
    expect(lines.grid).toEqual({ id: 1 }) // macd pane = grid 1; its anchor is offchart[0]
  })

  test('CC: disabling one of two active candle_color kinds keeps the other', () => {
    const T1 = 1000, T2 = 2000
    const built = {
      chart: { type: 'Candles', data: [[T1, 1, 2, 0, 1, 5], [T2, 1, 2, 0, 1, 5]] },
      onchart: [], offchart: [],
      _candleColor: [
        { kind: 'SCMR', instanceKey: 'SCMR', field: 'c', byTs: new Map([[T1, '#0f0'], [T2, '#0f0']]) },
        { kind: 'CRUP', instanceKey: 'CRUP', field: 'c', byTs: new Map([[T1, '#f00'], [T2, '#f00']]) },
      ],
    }
    const h = makeHandle(built)
    feed.setIndicatorEnabled(h, 'SCMR', true)
    feed.setIndicatorEnabled(h, 'CRUP', true)
    feed.setIndicatorEnabled(h, 'CRUP', false) // disable one
    // SCMR still active → candles keep its colour (the bug blanked them)
    expect(built.chart.data[0][6]).toBe('#0f0')
    expect(built.chart.data[1][6]).toBe('#0f0')
  })

  test('KI: indicator kind toggle matches case-insensitively', () => {
    const ov = { name: 'sma', type: 'Spline', data: [], raw: [], settings: { corkyKind: 'SMA', corkyLayerId: 'sma' } }
    const h = makeHandle({ chart: { type: 'Candles', data: [] }, onchart: [ov], offchart: [] })
    feed.setIndicatorEnabled(h, 'sma', true) // lowercase vs 'SMA'
    expect(dc.data.onchart).toContain(ov)
  })

  test('HL: an explicitly-hidden layer is not resurrected by a kind off→on cycle', () => {
    const mk = (layerId, vis) => ({ name: layerId, type: 'Spline', data: [], raw: [], settings: { corkyKind: 'SCMR', corkyLayerId: layerId, corkyView: true, corkyVisibleDefault: vis } })
    const main = mk('main', true), tl = mk('tl', false)
    const h = makeHandle({ chart: { type: 'Candles', data: [] }, onchart: [main, tl], offchart: [] })
    feed.setIndicatorEnabled(h, 'SCMR', true)   // main shown
    feed.setLayerEnabled(h, 'tl', true)          // tl opted in
    feed.setLayerEnabled(h, 'tl', false)         // tl explicitly hidden
    feed.setIndicatorEnabled(h, 'SCMR', false)   // kind off
    feed.setIndicatorEnabled(h, 'SCMR', true)    // kind back on
    expect(dc.data.onchart.map(o => o.settings.corkyLayerId)).toEqual(['main']) // tl stays hidden
  })

  test('F5: a new subscribe supersedes an in-flight one (unsubscribe + no clobber)', () => {
    feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, {})
    const aId = feed._activeSubId
    feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '5m' }, {})
    const bId = feed._activeSubId
    expect(bId).not.toBe(aId)
    expect(feed._subs.has(aId)).toBe(false) // A torn down
    expect(client.sent.some(s => s.type === 'unsubscribe' && s.subscription_id === aId)).toBe(true)
    // A's late historical_complete must not touch the DataCube (fan-out detached)
    client.emit(aId, { type: 'historical_complete' })
    expect(dc.data.chart.data.length).toBe(0)
  })

  test('F8: a subscribe timeout unsubscribes the gateway-side stream', async () => {
    client.neverResolve = true
    feed = new CorkyFeed({ client, dataCube: dc, subscribeTimeoutMs: 20 })
    let err = null
    await feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, { onError: (e) => { err = e } }).catch(() => {})
    expect(err && err.code).toBe('subscribe_timeout')
    expect(client.sent.some(s => s.type === 'unsubscribe')).toBe(true)
  })

  test('F3: a reconnect re-issues subscribe_candles for a live stream', async () => {
    client.fire('open') // initial connect — must NOT resubscribe
    const p = feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, {})
    const id = feed._activeSubId
    client.completeHistory(id)
    await p
    const before = client.sent.filter(s => s.type === 'subscribe_candles').length
    client.fire('open') // reconnect
    const after = client.sent.filter(s => s.type === 'subscribe_candles').length
    expect(after).toBe(before + 1)
    expect(client.sent[client.sent.length - 1].subscription_id).toBe(id)
  })

  test('PERF: onStatus({phase:live}) is emitted once across many ticks', async () => {
    const statuses = []
    const p = feed.subscribe({ venue: 'V', symbol: 'S', timeframe: '1m' }, { onStatus: (s) => statuses.push(s.phase) })
    const id = feed._activeSubId
    // a chunk + complete so history builds with one candle, then live ticks
    client.emit(id, { type: 'historical_chunk', chunk_index: 0, rows: [{ timeframe: '1m', candle: { timestamp_ms: 1000, open: '1', high: '1', low: '1', close: '1', volume: '1' }, indicators: {} }] })
    client.completeHistory(id)
    await p
    for (let i = 1; i <= 5; i++) {
      client.emit(id, { type: 'live_update', sequence: i, row: { timeframe: '1m', candle: { timestamp_ms: 1000 + i * 60000, open: '1', high: '1', low: '1', close: String(i), volume: '1' }, indicators: {} } })
    }
    expect(statuses.filter(p => p === 'live').length).toBe(1)
  })
})
