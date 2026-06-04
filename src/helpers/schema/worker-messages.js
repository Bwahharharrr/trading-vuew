
// Runtime guard for the DataCube <-> ScriptEngine worker message protocol
// (Phase 2). Rejects malformed `postMessage` payloads at the worker boundary
// with a typed diagnostic instead of crashing deep inside the engine switch.
//
// See ../../types/worker-messages.ts for the typed discriminated union.

import { error, warn } from './diagnostics.js'

// Every message type the worker (script_ww.js) handles in its onmessage switch.
export const DC_TO_WW_TYPES = new Set([
    'update-dc-settings',
    'exec-script',
    'exec-all-scripts',
    'upload-data',
    'upload-module',
    'module-event',
    'update-data',
    'get-dataset',
    'dataset-op',
    'update-ov-settings',
    'send-meta-info',
    'remove-scripts',
])

/**
 * Validate an inbound worker message envelope.
 * Returns { ok, diagnostics }. `ok:false` => caller should NOT dispatch it.
 * An unknown (but well-formed) type is a warning, not a hard error, so the
 * protocol can be extended without bricking older workers.
 *
 * @param {any} data - the `e.data` from onmessage
 */
export function validateWorkerMessage(data) {
    const out = []
    if (data == null || typeof data !== 'object') {
        out.push(error('ww.msg.shape', `worker message is not an object: ${typeof data}`))
        return { ok: false, diagnostics: out }
    }
    if (typeof data.type !== 'string' || !data.type) {
        out.push(error('ww.msg.type', 'worker message missing string `type`'))
        return { ok: false, diagnostics: out }
    }
    if (!DC_TO_WW_TYPES.has(data.type)) {
        out.push(warn('ww.msg.unknown', `unknown worker message type "${data.type}"`))
        // well-formed but unknown — let the switch no-op on it (ok: true)
        return { ok: true, diagnostics: out }
    }
    // Per-type payload presence checks for the data-bearing messages.
    const needsData = data.type !== 'exec-all-scripts' &&
        data.type !== 'send-meta-info' &&
        data.type !== 'module-event'
    if (needsData && data.data === undefined) {
        out.push(error('ww.msg.payload', `message "${data.type}" missing \`data\` payload`))
        return { ok: false, diagnostics: out }
    }
    return { ok: true, diagnostics: out }
}
