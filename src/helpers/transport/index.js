
// Transport seam (Phase 3.2). Two interchangeable ways to drive the
// ScriptEngine behind one conceptual interface:
//
//   Transport {
//     send(msg)          // DC -> engine
//     onevent: (e) => {} // engine -> DC  (e.data is the message)
//   }
//
//   - WorkerTransport (script_ww_api.js `WebWork`): postMessage to a real
//     web worker. Production path; used by DataCube (dc_events.js).
//   - SyncTransport: runs the engine in-process for Node/tests.
//
// WebWork is re-exported here as WorkerTransport for naming clarity; DataCube
// still imports it directly, so this is additive (no behavioural change).

export { default as SyncTransport } from './sync-transport.js'
export { default as WorkerTransport } from '../script_ww_api.js'
