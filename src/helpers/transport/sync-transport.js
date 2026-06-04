
// SyncTransport (Phase 3.2) — runs the ScriptEngine IN-PROCESS, synchronously,
// with no web worker. This makes the engine unit-testable in Node and drives
// the golden masters through the REAL message dispatch (the same code the
// worker uses), proving the WorkerTransport and SyncTransport paths agree.
//
// API mirrors the relevant slice of WebWork (script_ww_api.js): `send(msg)`
// pushes a DC->engine message; `onevent(cb)` receives engine->DC events.

import { ScriptEngine } from '../script_engine.js'
import { makeDispatcher, wireEngineEvents } from '../script_dispatch.js'

export default class SyncTransport {

    constructor() {
        // A fresh, isolated engine instance (not the module singleton).
        this.se = new ScriptEngine()
        this.onevent = () => {}

        const deliver = (msg) => this._receive(msg)
        wireEngineEvents(this.se, deliver)
        this._dispatch = makeDispatcher(this.se, deliver)
    }

    // engine -> DC. Shaped like a worker message event ({ data }) so the same
    // consumer code (WebWork.onmessage) could handle both.
    _receive(msg) {
        this.onevent({ data: msg })
    }

    // DC -> engine. Returns the dispatch promise (some handlers await).
    send(msg) {
        return this._dispatch(msg)
    }

    destroy() {
        this.onevent = () => {}
        this.se = null
        this._dispatch = null
    }
}
