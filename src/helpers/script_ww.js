
// Web-worker entry (WorkerTransport side of the Phase 3.2 seam).
//
// Thin wrapper: the message-handling logic now lives in script_dispatch.js and
// is shared with SyncTransport. Here we just bind it to the worker's
// postMessage/onmessage.

import se from './script_engine.js'
import { makeDispatcher, wireEngineEvents } from './script_dispatch.js'

const wwGlobal = typeof self !== 'undefined' ? self : globalThis

// engine -> DC: post events back to the main thread.
wireEngineEvents(se, (msg) => wwGlobal.postMessage(msg))

// DC -> engine: dispatch inbound messages.
const dispatch = makeDispatcher(se, (msg) => wwGlobal.postMessage(msg))
wwGlobal.onmessage = (e) => dispatch(e.data)
