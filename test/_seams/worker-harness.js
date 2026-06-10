// Worker seam — a synchronous stand-in for the Vite `?worker&inline` Worker.
//
// In jsdom/node there is no real Web Worker (typeof Worker === 'undefined'), so
// WebWork (script_ww_api.js) builds with worker=null and every send/exec/just is
// a no-op — leaving the whole DC↔engine bridge uncovered. FakeWorker implements
// the same postMessage/onmessage contract but runs a REAL ScriptEngine through
// the REAL dispatcher (script_dispatch.js) in-process, so WebWork's full
// round-trip (deepToRaw → postMessage → dispatch → engine → reply → onmessage →
// task resolve) can be driven and asserted synchronously.
import { ScriptEngine } from '../../src/helpers/script_engine.js'
import { makeDispatcher, wireEngineEvents } from '../../src/helpers/script_dispatch.js'

export class FakeWorker {
  constructor() {
    this.se = new ScriptEngine()          // fresh instance, like SyncTransport
    this.onmessage = null
    this.terminated = false
    this.posted = []                       // every message the worker emitted
    wireEngineEvents(this.se, (msg) => this._emit(msg))
    this._dispatch = makeDispatcher(this.se, (msg) => this._emit(msg))
  }

  // DC → worker. A REAL worker's postMessage is ALWAYS async — the worker never
  // processes a message on the caller's stack. We must enforce that here too:
  // defer the dispatch CALL (not just its result) to a microtask, otherwise a
  // handler that posts synchronously (e.g. get-dataset, no await before post)
  // would reply before exec() has registered its task → the reply is dropped.
  postMessage(msg) {
    if (this.terminated) return
    Promise.resolve().then(() => this._dispatch(msg)).catch((e) => { this._err = e })
  }

  // worker → DC
  _emit(msg) {
    this.posted.push(msg)
    if (this.onmessage && !this.terminated) this.onmessage({ data: msg })
  }

  terminate() { this.terminated = true; this.onmessage = null }
}

// Give a WebWork instance a live FakeWorker (it built with worker=null in node).
export function attachFakeWorker(ww) {
  const fw = new FakeWorker()
  ww.worker = fw
  fw.onmessage = (e) => ww.onmessage(e)
  return fw
}

// A plain recording worker for testing WebWork's send/deepToRaw/routing without
// a live engine (asserts exactly what was postMessage'd).
export function recordingWorker() {
  return {
    onmessage: null,
    messages: [],
    transfers: [],
    postMessage(msg, tx) { this.messages.push(msg); if (tx) this.transfers.push(tx) },
    terminate() { this.terminated = true },
  }
}

// Let queued microtasks + a short timer (Utils.pause(1) in upload/dataset-op) run.
export const drain = (ms = 5) => new Promise((r) => setTimeout(r, ms))
