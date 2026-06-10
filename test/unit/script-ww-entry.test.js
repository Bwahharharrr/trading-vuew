// @vitest-environment node
// script_ww.js — the Web Worker entry glue (was 0%). It binds the shared
// dispatcher/event-wiring to the worker global's onmessage/postMessage. We
// stand in for the worker global: capture postMessage, import the module (which
// installs onmessage + wires the engine), then drive it like the main thread.
import { test, expect, describe, beforeAll } from 'vitest'

const posted = []
let wwGlobal

beforeAll(async () => {
  // script_ww.js picks `self` if present, else globalThis. Pin a known target.
  wwGlobal = typeof self !== 'undefined' ? self : globalThis
  wwGlobal.postMessage = (m) => posted.push(m)
  await import('../../src/helpers/script_ww.js') // installs wwGlobal.onmessage
})

const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms))

describe('worker entry', () => {
  test('installs an onmessage handler', () => {
    expect(typeof wwGlobal.onmessage).toBe('function')
  })

  test('inbound dispatch + wired engine events post back through postMessage', async () => {
    const candles = Array.from({ length: 16 }, (_, i) => [1000 + i * 1000, 1, 2, 0, 1 + i, 5])
    const descriptor = {
      uuid: 'ww-ov', type: 'spline', name: 'X',
      src: { init: () => {}, update() { return 2 } },
      settings: {}, sett: {},
    }
    wwGlobal.onmessage({ data: { type: 'update-dc-settings', data: { scripts: true, script_depth: 0 } } })
    wwGlobal.onmessage({ data: { type: 'upload-data', data: { ohlcv: candles } } })
    await tick()
    // upload-data acks + the engine's state events flow back via the wired se.send
    expect(posted.some((m) => m.type === 'data-uploaded')).toBe(true)
    wwGlobal.onmessage({ data: { type: 'exec-script', data: { s: descriptor, tf: '1m', range: [1000, 16000] } } })
    await tick(25)
    expect(posted.some((m) => m.type === 'engine-state')).toBe(true)
  })

  test('a request/response message (get-dataset) posts the reply with its id', async () => {
    wwGlobal.onmessage({ data: { type: 'get-dataset', id: 'req-1', data: 'ohlcv' } })
    await tick()
    const reply = posted.find((m) => m.id === 'req-1')
    expect(reply).toBeTruthy()
    expect(reply.data && reply.data.id).toBe('ohlcv') // the DatasetWW stored earlier
  })

  test('a malformed message is swallowed (dispatch .catch) without throwing', async () => {
    expect(() => wwGlobal.onmessage({ data: null })).not.toThrow()
    await tick(2)
  })
})
