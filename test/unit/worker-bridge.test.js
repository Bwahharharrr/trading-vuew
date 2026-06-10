// script_ww_api.js (WebWork) — the DC↔worker transport (was ~14% covered).
// Driven through the worker seam: deepToRaw unwrapping, send/exec/just,
// onmessage task-vs-event routing, the node/websocket fallback, and a real
// end-to-end exec round-trip against a live engine.
import { test, expect, describe, vi, afterEach } from 'vitest'
import { reactive, ref } from 'vue'
import WebWork from '../../src/helpers/script_ww_api.js'
import { attachFakeWorker, recordingWorker, drain } from '../_seams/worker-harness.js'

function mkWW(sett = {}) { return new WebWork({ sett }) }

afterEach(() => vi.useRealTimers())

describe('construction', () => {
  test('builds with worker=null under node (no Worker global)', () => {
    const ww = mkWW()
    expect(ww.worker).toBeNull()
    // every transport call is a safe no-op without a worker
    expect(ww.just('x', {})).toBeUndefined()
    expect(ww.exec('x', {})).resolves.toBeNull()
  })
})

describe('send + deepToRaw', () => {
  test('unwraps Vue reactive/ref proxies before postMessage', () => {
    const ww = mkWW()
    const rec = recordingWorker()
    ww.worker = rec
    const inner = reactive([[1, 2]])
    const msg = reactive({ type: 'update-data', data: { ohlcv: inner, n: 5 } })
    ww.send(msg)
    const sent = rec.messages[0]
    // nested reactive array deep-unwrapped to a plain, structured-clone-safe array
    expect(Array.isArray(sent.data.ohlcv)).toBe(true)
    expect(sent.data.ohlcv).not.toBe(inner)   // a raw copy, not the proxy
    expect(sent.data.ohlcv[0]).toEqual([1, 2])
    expect(sent.data.n).toBe(5)
  })

  test('passes transferables through when tx_keys given', () => {
    const ww = mkWW()
    const rec = recordingWorker()
    ww.worker = rec
    ww.send({ type: 't', data: { buf: [9] } }, ['buf'])
    expect(rec.transfers[0]).toEqual([[9]])
  })

  test('Date/RegExp pass through untouched', () => {
    const ww = mkWW()
    const rec = recordingWorker()
    ww.worker = rec
    const d = new Date(0)
    ww.send({ type: 't', data: { d } })
    expect(rec.messages[0].data.d).toBe(d)
  })
})

describe('onmessage routing', () => {
  test('a reply with a known task id resolves that task; else routed to onevent', () => {
    const ww = mkWW()
    ww.worker = recordingWorker()
    const events = []
    ww.onevent = (e) => events.push(e.data)
    const got = []
    ww.tasks['abc'] = (data) => got.push(data)
    ww.onmessage({ data: { id: 'abc', data: { ok: 1 } } })
    expect(got).toEqual([{ ok: 1 }])
    expect(ww.tasks.abc).toBeUndefined()       // consumed
    // an event (no matching task) goes to onevent
    ww.onmessage({ data: { type: 'overlay-data', data: [] } })
    expect(events).toEqual([{ type: 'overlay-data', data: [] }])
  })
})

describe('exec / just timeout', () => {
  test('exec rejects after 30s with no reply', async () => {
    vi.useFakeTimers()
    const ww = mkWW()
    ww.worker = recordingWorker()
    const p = ww.exec('get-dataset', 'ohlcv')
    const assertion = expect(p).rejects.toThrow(/timeout/)
    await vi.advanceTimersByTimeAsync(30001)
    await assertion
  })

  test('just sends fire-and-forget, registers no task', () => {
    const ww = mkWW()
    const rec = recordingWorker()
    ww.worker = rec
    ww.just('exec-script', { s: {} })
    expect(rec.messages[0].type).toBe('exec-script')
    expect(Object.keys(ww.tasks)).toHaveLength(0)
  })
})

describe('node/websocket fallback (send_node)', () => {
  test('queues messages until the socket opens, then flushes in order', () => {
    const sent = []
    let listeners = {}
    class FakeWS {
      constructor() { this.readyState = 0 /* CONNECTING */; FakeWS.last = this }
      addEventListener(t, fn) { listeners[t] = fn }
      send(s) { sent.push(JSON.parse(s)) }
    }
    FakeWS.OPEN = 1
    vi.stubGlobal('WebSocket', FakeWS)
    const ww = mkWW({ node_url: 'ws://x' })
    ww.send({ type: 'a', n: 1 })           // socket still CONNECTING → queued
    expect(sent).toHaveLength(0)
    expect(ww.msg_queue).toHaveLength(1)
    FakeWS.last.readyState = 1               // OPEN
    ww.send({ type: 'b', n: 2 })           // flush queue + this one
    expect(sent.map((m) => m.type)).toEqual(['a', 'b'])
    vi.unstubAllGlobals()
  })
})

describe('end-to-end round-trip against a live engine', () => {
  test('upload-data then exec(get-dataset) returns the stored dataset', async () => {
    const ww = mkWW()
    attachFakeWorker(ww)
    const candles = [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1.5, 6]]
    ww.just('upload-data', { ohlcv: candles })
    await drain()
    const ds = await ww.exec('get-dataset', 'ohlcv')
    expect(ds).toBeTruthy()
    expect(ds.data).toEqual(candles)
  })

  test('exec-script emits overlay-data through onevent', async () => {
    const ww = mkWW()
    attachFakeWorker(ww)
    const events = []
    ww.onevent = (e) => events.push(e.data)
    const candles = Array.from({ length: 20 }, (_, i) => [1000 + i * 1000, 1, 2, 0, 1 + i, 5])
    ww.send({ type: 'update-dc-settings', data: { scripts: true, script_depth: 0 } })
    ww.just('upload-data', { ohlcv: candles })
    await drain()
    const descriptor = {
      uuid: 'ov1', type: 'spline', name: 'EMA',
      src: { init: () => {}, update() { return 1 } },
      settings: {}, sett: {},
    }
    ww.just('exec-script', { s: descriptor, tf: '1m', range: [1000, 20000] })
    // Poll rather than a single fixed wait — the engine round-trip can stretch
    // under full-suite load (this assertion was an intermittent flake at 20ms).
    for (let i = 0; i < 50 && !events.some((e) => e.type === 'overlay-data'); i++) await drain(10)
    expect(events.some((e) => e.type === 'overlay-data')).toBe(true)
  })
})
