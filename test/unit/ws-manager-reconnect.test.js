// @vitest-environment jsdom
//
// App ws-manager mixin — reconnect / dedup / backoff / teardown.
//
// The mixin (src/mixins/app/ws-manager.js) drives a live WebSocket from the
// currently-loaded chart file's _meta. We unit-test its watcher + methods by
// binding them to a FAKE `this` (the same App.methods-on-a-fake-this pattern
// used in test/component/position-plot-select.test.js), and we replace the
// global WebSocket with a recording fake so nothing touches the network and
// the suite stays deterministic. Timers are faked where backoff is exercised.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import wsManager from '../../src/mixins/app/ws-manager.js'

// ── Fake WebSocket ───────────────────────────────────────────────────────────
// Records construction + close; never opens a real connection. A `throwOnNew`
// switch lets case 4 simulate a constructor that throws.
let wsInstances
let throwOnNew

class FakeWebSocket {
  constructor(url) {
    if (throwOnNew) throw new Error('boom: ' + url)
    this.url = url
    this.closed = false
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    wsInstances.push(this)
  }
  close() { this.closed = true }
}

// Build a fake `this` carrying the mixin's data() defaults + the methods we
// need (real implementations, bound to this ctx). _wsBuildUrl is the REAL
// helper-backed method (it reads window.location, which jsdom provides as
// http://localhost:3000).
function makeCtx() {
  const data = wsManager.data()                       // real reactive defaults
  const ctx = { ...data }
  for (const m of ['wsConnect', 'wsDisconnect', '_wsScheduleReconnect', '_wsBuildUrl']) {
    ctx[m] = wsManager.methods[m]
  }
  ctx.currentFileMeta = null
  return ctx
}

// Invoke the currentFileMeta watcher with this=ctx.
function fireMetaWatch(ctx, newMeta, oldMeta) {
  return wsManager.watch.currentFileMeta.call(ctx, newMeta, oldMeta)
}

const META = (over = {}) => ({
  exchange: 'bitfinex',
  ticker: 'tBTCUSD',
  tf: '1m',
  instance_id: 'inst-1',
  ws: { port: 9000, host: '', path: '/' },
  ...over,
})

let logSpy, warnSpy, errSpy

beforeEach(() => {
  wsInstances = []
  throwOnNew = false
  vi.stubGlobal('WebSocket', FakeWebSocket)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  delete window.__tvw_wsConnected
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// ── 1. same-identity refresh while connected → no-op ─────────────────────────
describe('currentFileMeta dedup by identity', () => {
  it('same-identity meta change while wsConnected is a no-op (no reconnect, socket untouched)', () => {
    const ctx = makeCtx()
    // Simulate an established connection.
    const liveSocket = new FakeWebSocket('ws://localhost:3000/live-ws/9000')
    ctx.ws = liveSocket
    ctx.wsConnected = true
    const genBefore = ctx._wsGen
    const connectSpy = vi.spyOn(ctx, 'wsConnect')
    const disconnectSpy = vi.spyOn(ctx, 'wsDisconnect')

    // A FRESH object with identical identity tuple (JSON.parse always yields
    // new objects on a same-file refresh).
    fireMetaWatch(ctx, META(), META())

    expect(connectSpy).not.toHaveBeenCalled()
    expect(disconnectSpy).not.toHaveBeenCalled()
    expect(ctx.ws).toBe(liveSocket)          // existing socket untouched
    expect(liveSocket.closed).toBe(false)
    expect(ctx._wsGen).toBe(genBefore)        // generation not bumped
  })

  // ── 2. changed endpoint → reconnect with rebuilt URL ───────────────────────
  it('a different ws.port triggers wsConnect with the rebuilt URL (reconnect)', () => {
    const ctx = makeCtx()
    ctx.ws = new FakeWebSocket('ws://localhost:3000/live-ws/9000')
    ctx.wsConnected = true
    const connectSpy = vi.spyOn(ctx, 'wsConnect')

    fireMetaWatch(ctx, META({ ws: { port: 9100, host: '', path: '/' } }), META())

    expect(connectSpy).toHaveBeenCalledTimes(1)
    expect(connectSpy).toHaveBeenCalledWith('ws://localhost:3000/live-ws/9100')
    // wsConnect built a new socket against the rebuilt URL.
    const built = wsInstances.find(w => w.url === 'ws://localhost:3000/live-ws/9100')
    expect(built).toBeTruthy()
  })

  it('a different ticker triggers a reconnect (identity tuple covers ticker)', () => {
    const ctx = makeCtx()
    ctx.ws = new FakeWebSocket('ws://localhost:3000/live-ws/9000')
    ctx.wsConnected = true
    const connectSpy = vi.spyOn(ctx, 'wsConnect')

    fireMetaWatch(ctx, META({ ticker: 'tETHUSD' }), META())

    expect(connectSpy).toHaveBeenCalledTimes(1)
    expect(connectSpy).toHaveBeenCalledWith('ws://localhost:3000/live-ws/9000')
  })

  // ── 3. buildWsUrl null → disconnect-or-noop ────────────────────────────────
  it('null URL (meta without ws) calls wsDisconnect when a socket exists', () => {
    const ctx = makeCtx()
    const sock = new FakeWebSocket('ws://localhost:3000/live-ws/9000')
    ctx.ws = sock
    ctx.wsConnected = true
    const connectSpy = vi.spyOn(ctx, 'wsConnect')
    const disconnectSpy = vi.spyOn(ctx, 'wsDisconnect')

    fireMetaWatch(ctx, { exchange: 'x', ticker: 't', tf: '1m' }, META())  // no .ws → buildWsUrl→null

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    expect(connectSpy).not.toHaveBeenCalled()
    expect(sock.closed).toBe(true)
    expect(ctx.ws).toBeNull()
    expect(ctx.wsConnected).toBe(false)
  })

  it('null URL with a pending reconnect timer (no socket) calls wsDisconnect to clear it', () => {
    const ctx = makeCtx()
    ctx.ws = null
    ctx.wsReconnectTimer = 12345               // pretend a reconnect is scheduled
    const disconnectSpy = vi.spyOn(ctx, 'wsDisconnect')
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')

    fireMetaWatch(ctx, null, META())            // null meta → buildWsUrl→null

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    expect(clearSpy).toHaveBeenCalledWith(12345)
    expect(ctx.wsReconnectTimer).toBeNull()
  })

  it('null URL with neither socket nor timer is a no-op (no wsDisconnect)', () => {
    const ctx = makeCtx()
    ctx.ws = null
    ctx.wsReconnectTimer = null
    const disconnectSpy = vi.spyOn(ctx, 'wsDisconnect')
    const connectSpy = vi.spyOn(ctx, 'wsConnect')

    fireMetaWatch(ctx, null, null)

    expect(disconnectSpy).not.toHaveBeenCalled()
    expect(connectSpy).not.toHaveBeenCalled()
  })
})

// ── 4. constructor throws → logged + reconnect scheduled ─────────────────────
describe('wsConnect resilience', () => {
  it('logs and schedules a reconnect when new WebSocket(url) throws (no unhandled exception)', () => {
    const ctx = makeCtx()
    throwOnNew = true
    const scheduleSpy = vi.spyOn(ctx, '_wsScheduleReconnect')

    expect(() => ctx.wsConnect('ws://localhost:3000/live-ws/9000')).not.toThrow()

    // generation was bumped before the throw; reconnect is scheduled with it.
    expect(ctx._wsGen).toBe(1)
    expect(scheduleSpy).toHaveBeenCalledTimes(1)
    expect(scheduleSpy).toHaveBeenCalledWith(1)
    expect(errSpy).toHaveBeenCalled()
    expect(errSpy.mock.calls.some(c => String(c[0]).includes('Failed to create WebSocket'))).toBe(true)
    expect(ctx.ws).toBeNull()                   // never assigned (assignment threw)
    expect(ctx.wsConnected).toBe(false)
  })
})

// ── 5. exponential backoff capped at 30000ms ─────────────────────────────────
describe('_wsScheduleReconnect backoff cap', () => {
  it('doubles the delay but never exceeds 30000ms, and arms the timer with min(delay, 30000)', () => {
    vi.useFakeTimers()
    const ctx = makeCtx()
    // wsConnect is invoked by the scheduled timer; stub it to a recorder so the
    // loop just re-schedules without touching sockets. We re-arm manually below.
    ctx.wsConnect = vi.fn(function () { /* would normally rebuild the socket */ })
    const setSpy = vi.spyOn(globalThis, 'setTimeout')

    const armedDelays = []
    const seenBackoff = []

    // Drive 12 reconnect cycles. Each cycle: schedule (arms timer with the
    // CURRENT delay capped at 30000), then fire it (which doubles the stored
    // delay, capped at 30000). _wsScheduleReconnect bails if a timer is already
    // pending, so we always start a cycle with no pending timer.
    for (let i = 0; i < 12; i++) {
      expect(ctx.wsReconnectTimer).toBeNull()
      ctx._wsScheduleReconnect()                 // arms with min(wsReconnectDelay, 30000)
      armedDelays.push(setSpy.mock.calls.at(-1)[1])
      vi.runOnlyPendingTimers()                  // fires → doubles delay (capped)
      seenBackoff.push(ctx.wsReconnectDelay)
    }

    // The stored backoff doubles 1000→2000→4000→…→30000 and then stays pinned.
    expect(seenBackoff.slice(0, 6)).toEqual([2000, 4000, 8000, 16000, 30000, 30000])
    // Never exceeds the cap.
    expect(Math.max(...seenBackoff)).toBe(30000)
    expect(seenBackoff.every(d => d <= 30000)).toBe(true)
    // Every armed timer delay is min(delay, 30000) ≤ 30000, and once saturated
    // it is exactly 30000.
    expect(Math.max(...armedDelays)).toBe(30000)
    expect(armedDelays.every(d => d <= 30000)).toBe(true)
    expect(armedDelays.at(-1)).toBe(30000)
    // The reconnect actually fired each cycle.
    expect(ctx.wsConnect).toHaveBeenCalledTimes(12)
  })

  it('is a no-op if a reconnect timer is already pending (no double-arm)', () => {
    vi.useFakeTimers()
    const ctx = makeCtx()
    ctx.wsConnect = vi.fn()
    ctx.wsReconnectTimer = 999                    // already pending
    const setSpy = vi.spyOn(globalThis, 'setTimeout')

    ctx._wsScheduleReconnect()

    expect(setSpy).not.toHaveBeenCalled()
    expect(ctx.wsReconnectTimer).toBe(999)
  })
})

// ── 6. beforeUnmount tears everything down ───────────────────────────────────
describe('beforeUnmount cleanup', () => {
  it('calls wsDisconnect: closes socket, clears timer, flags false, window flag false', () => {
    const ctx = makeCtx()
    for (const m of ['wsDisconnect']) ctx[m] = wsManager.methods[m]
    const sock = new FakeWebSocket('ws://localhost:3000/live-ws/9000')
    ctx.ws = sock
    ctx.wsConnected = true
    window.__tvw_wsConnected = true
    ctx.wsReconnectTimer = setTimeout(() => {}, 100000)
    const genBefore = ctx._wsGen
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')

    wsManager.beforeUnmount.call(ctx)

    expect(sock.closed).toBe(true)
    expect(sock.onclose).toBeNull()              // detached before close
    expect(ctx.ws).toBeNull()
    expect(ctx.wsReconnectTimer).toBeNull()
    expect(clearSpy).toHaveBeenCalled()
    expect(ctx.wsConnected).toBe(false)
    expect(window.__tvw_wsConnected).toBe(false)
    expect(ctx._wsGen).toBe(genBefore + 1)       // generation bumped → stale callbacks bail
  })
})
