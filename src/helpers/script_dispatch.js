
// Shared engine message dispatch (Phase 3.2 — Transport seam).
//
// The DataCube <-> ScriptEngine protocol switch used to live inline in the
// web-worker entry (script_ww.js), hard-wired to `self.postMessage` and the
// module singleton. Extracting it here lets BOTH transports reuse the exact
// same logic:
//   - WorkerTransport (script_ww.js): post = self.postMessage  (production)
//   - SyncTransport: post = in-process callback                (Node/tests)
//
// Behaviour is byte-identical to the old inline switch — the engine golden
// masters, now also driven through SyncTransport, are the guarantee.

import Utils from '../stuff/utils.js'
import * as u from './script_utils.js'
import { DatasetWW } from './dataset.js'
import { validateWorkerMessage } from './schema/worker-messages.js'
import { report } from './schema/diagnostics.js'

/**
 * Wire engine -> DC events. The engine calls `se.send(type, data)`; we forward
 * the whitelisted event types to `post` as a `{type, data}` envelope.
 * @param {object} se   - a ScriptEngine instance
 * @param {(msg:any)=>void} post - delivers a message to the DC side
 */
export function wireEngineEvents(se, post) {
    se.send = (type, data) => {
        switch (type) {
            case 'overlay-data':
            case 'overlay-update':
            case 'engine-state':
            case 'modify-overlay':
            case 'module-data':
            case 'script-signal':
            case 'script-error':
                post({ type, data })
                break
        }
    }
}

/**
 * Build the DC -> engine message dispatcher.
 * @param {object} se   - a ScriptEngine instance
 * @param {(msg:any)=>void} post - delivers a message to the DC side
 * @returns {(msg:any)=>Promise<void>} dispatch(msg)
 */
export function makeDispatcher(se, post) {

    // Per-dispatcher state (was a module-level flag in the worker).
    let data_requested = false

    return async function dispatch(msg) {

        // Guard the boundary: reject a malformed envelope with a typed
        // diagnostic instead of crashing deep in the engine. Well-formed but
        // unknown types warn and harmlessly fall through the switch.
        const guard = validateWorkerMessage(msg)
        if (guard.diagnostics.length) report(guard.diagnostics, 'warn', 'worker message')
        if (!guard.ok) return

        switch (msg.type) {

            case 'update-dc-settings':
                se.sett = msg.data
                break

            case 'exec-script': {
                let req = se.data_required(msg.data.s)
                if (req && !data_requested) {
                    data_requested = true
                    post({ type: 'request-data', data: req })
                }
                se.tf = u.tf_from_str(msg.data.tf)
                se.range = msg.data.range
                se.queue.push(msg.data.s)
                se.exec_all()
                break
            }

            case 'exec-all-scripts': {
                let req2 = se.data_required(msg.data && msg.data.s)
                if (req2 && !data_requested) {
                    data_requested = true
                    post({ type: 'request-data', data: req2 })
                }
                se.tf = u.tf_from_str(msg.data && msg.data.tf)
                se.range = msg.data && msg.data.range
                se.exec_all()
                break
            }

            case 'upload-data':
                post({ type: 'data-uploaded' })
                await Utils.pause(1)
                for (let id in msg.data) {
                    let data = msg.data[id]
                    se.data[id] = new DatasetWW(id, data)
                }
                se.recalc_size()
                data_requested = false
                se.exec_all()
                break

            case 'upload-module': {
                let lib = u.make_module_lib(msg.data)
                se.mods[msg.data.id] = new (
                    new Function('mod', 'se', 'lib', u.f_body(msg.data.main))
                )(msg.data.id, se, lib)
                break
            }

            case 'module-event':
                // TODO: this
                break

            case 'update-data':
                DatasetWW.update_all(se, msg.data)
                if (msg.data.ohlcv) se.update(msg.data.ohlcv)
                break

            case 'get-dataset':
                post({ id: msg.id, data: se.data[msg.data] })
                break

            case 'dataset-op':
                await Utils.pause(1)
                if (msg.data.id in se.data) {
                    se.data[msg.data.id].op(se, msg.data)
                }
                if (msg.data.exec) se.exec_all()
                break

            case 'update-ov-settings':
                se.tf = u.tf_from_str(msg.data.tf)
                se.range = msg.data.range
                se.exec_sel(msg.data.delta)
                break

            case 'send-meta-info':
                se.tf = u.tf_from_str(msg.data && msg.data.tf)
                se.range = msg.data && msg.data.range
                break

            case 'remove-scripts':
                se.remove_scripts(msg.data)
                break
        }
    }
}
