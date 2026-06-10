// @vitest-environment jsdom
// ws-manager mixin (File-feed live WebSocket): connect/disconnect generation
// guards, reconnect backoff, and the live-candle merge path into a REAL
// DataCube — previously 0% covered.
import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest'
import wsManager from '../../src/mixins/app/ws-manager.js'
import DataCube from '../../src/helpers/datacube.js'

const M = wsManager.methods

// Minimal controllable WebSocket fake (jsdom has none).
class FakeWS {
  constructor(url) { this.url = url; FakeWS.instances.push(this); this.closed = false }
  close() { this.closed = true }
}
FakeWS.instances = []

function mkCtx(over = {}) {
  const dc = new DataCube({
    chart: { type: 'Candles', data: [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1.5, 5]] },
    onchart: [], offchart: [],
  }, { scripts: false, validation: 'off' })
  // update_candle reads tv.$refs.chart.interval_ms and the agg flush pings the
  // worker — both wired by TradingVue on mount; stub them for headless use.
  dc.tv = { $refs: { chart: { interval_ms: 1000, cursor: { locked: false }, last_candle: null } } }
  dc.ww = { just: () => {} }
  const ctx = Object.assign({}, wsManager.data(), {
    chart: dc,
    originalChartData: dc.data.chart.data.map(c => c.slice()),
    currentDataFile: 'data_bitfinex_tBTCUSD_1m.json',
    // identity tuple must MATCH the messages (msgMatchesMeta drops on null meta)
    currentFileMeta: { exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m' },
    displayedView: '',
    $refs: {},
  })
  Object.assign(ctx, M)
  return Object.assign(ctx, over)
}

beforeEach(() => {
  FakeWS.instances = []
  vi.stubGlobal('WebSocket', FakeWS)
  vi.useFakeTimers()
})
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('connect / disconnect lifecycle', () => {
  test('connect wires handlers; open sets state; disconnect bumps the generation', () => {
    const ctx = mkCtx()
    ctx.wsConnect('ws://x:1/ws')
    expect(FakeWS.instances.length).toBe(1)
    const ws = FakeWS.instances[0]
    ws.onopen()
    expect(ctx.wsConnected).toBe(true)
    ctx.wsDisconnect()
    expect(ctx.wsConnected).toBe(false)
    expect(ws.closed).toBe(true)
    expect(ctx.ws).toBeNull()
  })

  test('STALE socket callbacks are ignored after a reconnect (generation guard)', () => {
    const ctx = mkCtx()
    ctx.wsConnect('ws://x:1/ws')
    const stale = FakeWS.instances[0]
    ctx.wsConnect('ws://x:1/ws') // re-connect → new generation
    const fresh = FakeWS.instances[1]
    fresh.onopen()
    expect(ctx.wsConnected).toBe(true)
    stale.onclose && stale.onclose() // must NOT flip state or schedule reconnect
    expect(ctx.wsConnected).toBe(true)
    expect(ctx.wsReconnectTimer).toBeNull()
  })

  test('close schedules a reconnect with EXPONENTIAL backoff; disconnect cancels it', () => {
    const ctx = mkCtx()
    ctx.wsConnect('ws://x:1/ws')
    FakeWS.instances[0].onclose()
    expect(ctx.wsReconnectTimer).not.toBeNull()
    vi.advanceTimersByTime(1000) // first delay
    expect(FakeWS.instances.length).toBe(2)        // reconnected
    expect(ctx.wsReconnectDelay).toBe(2000)        // backoff doubled
    FakeWS.instances[1].onclose()
    ctx.wsDisconnect()                             // user/file-switch teardown
    vi.advanceTimersByTime(60_000)
    expect(FakeWS.instances.length).toBe(2)        // cancelled — no zombie socket
  })

  test('no URL → no connection attempt', () => {
    const ctx = mkCtx()
    ctx.wsConnect()
    expect(FakeWS.instances.length).toBe(0)
  })
})

// dc.update batches through agg_tool (setTimeout + RAF) — flush both.
function flush() {
  vi.advanceTimersByTime(120)
}

describe('_wsHandleCandle merge', () => {
  test('same-ts candle updates the last bar IN PLACE (no append)', () => {
    const ctx = mkCtx()
    ctx._wsHandleCandle({ type: 'candle', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m', data: [2000, 1, 3, 0.5, 2.5, 9] })
    flush()
    const d = ctx.chart.data.chart.data
    expect(d.length).toBe(2)
    expect(d[1].slice(0, 6)).toEqual([2000, 1, 3, 0.5, 2.5, 9])
    expect(ctx.originalChartData[1].slice(1)).toEqual([1, 3, 0.5, 2.5, 9])
  })

  test('newer candle APPENDS to chart + pristine copy', () => {
    const ctx = mkCtx()
    ctx._wsHandleCandle({ type: 'candle', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m', data: [3000, 2, 3, 1, 2, 7] })
    flush()
    const d = ctx.chart.data.chart.data
    expect(d.length).toBe(3)
    expect(d[2][0]).toBe(3000)
    expect(ctx.originalChartData.length).toBe(3)
    expect(ctx.liveDataStartIdx).toBe(2) // live-region marker set on first append
  })

  test('older / malformed candles are dropped', () => {
    const ctx = mkCtx()
    ctx._wsHandleCandle({ type: 'candle', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m', data: [500, 1, 2, 0, 1, 5] }) // older than last
    ctx._wsHandleCandle({ type: 'candle', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m', data: [3000, 1] })            // too short
    ctx._wsHandleCandle({ type: 'candle', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m', data: null })
    flush()
    expect(ctx.chart.data.chart.data.length).toBe(2)
  })

  test('a HUGE gap (stale loaded data) refuses to append (blank-chart guard)', () => {
    const ctx = mkCtx()
    // default tf fallback is 1h → gap must exceed 200 bars
    ctx._wsHandleCandle({ type: 'candle', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m', data: [2000 + 3_600_000 * 300, 1, 2, 0, 1, 5] })
    flush()
    expect(ctx.chart.data.chart.data.length).toBe(2)
  })

  test('scmr file colours the live candle from msg.scmr_color (slot 6)', () => {
    const ctx = mkCtx({ currentDataFile: 'data_bitfinex_tBTCUSD_1m.json' })
    ctx._wsHandleCandle({ type: 'candle', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m', data: [3000, 2, 3, 1, 2, 7], scmr_color: '#00FF00' })
    flush()
    const last = ctx.chart.data.chart.data[2]
    expect(last[6]).toBe('#00FF00')
    expect(ctx.liveScmrColors[ctx.liveScmrColors.length - 1]).toBe('#00FF00')
  })

  test('_wsHandleAlert accumulates alerts + zones (capped) and identity-filters', () => {
    const ctx = mkCtx()
    ctx._wsHandleAlert({ type: 'alert', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m', alert: { a: 1 }, zones: [[1], [2]] })
    expect(ctx.liveAlerts).toEqual([{ a: 1 }])
    expect(ctx.liveZones).toEqual([[1], [2]])
    // identity mismatch → dropped
    ctx._wsHandleAlert({ type: 'alert', exchange: 'OTHER', alert: { a: 2 } })
    expect(ctx.liveAlerts.length).toBe(1)
  })

  test('_wsHandleSnapshot stores snapshot arrays without mutating the chart', () => {
    const ctx = mkCtx()
    const before = ctx.chart.data.chart.data.length
    ctx._wsHandleSnapshot({
      type: 'snapshot', exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m',
      candles: [[1]], alerts: [{ a: 1 }], zones: [[2]], scmr_colors: ['#0f0'],
    })
    expect(ctx.liveAlerts).toEqual([{ a: 1 }])
    expect(ctx.liveZones).toEqual([[2]])
    expect(ctx.liveScmrColors).toEqual(['#0f0'])
    expect(ctx.chart.data.chart.data.length).toBe(before) // snapshot does not apply
  })

  test('_wsOnMessage routes by type without throwing on unknown types', () => {
    const ctx = mkCtx()
    ctx._wsHandleAlert = vi.fn()
    ctx._wsHandleSnapshot = vi.fn()
    ctx._wsOnMessage({ type: 'alert', a: 1 })
    ctx._wsOnMessage({ type: 'snapshot', s: 1 })
    ctx._wsOnMessage({ type: 'mystery' })
    expect(ctx._wsHandleAlert).toHaveBeenCalled()
    expect(ctx._wsHandleSnapshot).toHaveBeenCalled()
  })
})
