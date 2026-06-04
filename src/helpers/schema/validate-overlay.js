
// Registration-time validation of overlay components (Phase 2).
//
// Replaces the old failure modes — silently skipping an overlay with a bad
// `use_for`, and the runtime "EARLY ADOPTER BUG: reload the browser" draw
// fallback — with a clear, typed diagnostic emitted when the overlay registry
// is built (Grid.vue created()), BEFORE anything tries to render.
//
// Non-breaking: a structurally invalid overlay is still skipped (not thrown),
// but now loudly. See ../../types/overlay.ts for the contract.

import { error, warn } from './diagnostics.js'

const isFn = (v) => typeof v === 'function'

/**
 * Validate a Vue overlay component (Options object) against OverlayDefinition.
 * @param {any} comp - a component options object (has `.methods`, `.name`)
 * @returns {{ ok: boolean, diagnostics: import('../../types/diagnostics').Diagnostic[] }}
 *   ok:false => the overlay must not be registered (it would fail to render).
 */
export function validateOverlayComponent(comp) {
    const out = []
    const label = (comp && (comp.name || comp.__name)) || 'overlay'

    if (!comp || typeof comp !== 'object') {
        out.push(error('overlay.component', 'overlay is not a component object', label))
        return { ok: false, diagnostics: out }
    }
    const m = comp.methods
    if (!m || typeof m !== 'object') {
        out.push(error('overlay.methods', `overlay "${label}" has no methods`, label))
        return { ok: false, diagnostics: out }
    }

    // use_for — required, must return a non-empty array of non-empty strings.
    if (!isFn(m.use_for)) {
        out.push(error('overlay.use_for',
            `overlay "${label}" must implement use_for() returning string[]`, label))
        return { ok: false, diagnostics: out }
    }
    let useFor
    try {
        useFor = m.use_for()
    } catch (e) {
        out.push(error('overlay.use_for.throw',
            `overlay "${label}" use_for() threw: ${e && e.message}`, label))
        return { ok: false, diagnostics: out }
    }
    if (!Array.isArray(useFor) || useFor.length === 0 ||
        !useFor.every((t) => typeof t === 'string' && t.length > 0)) {
        out.push(error('overlay.use_for.return',
            `overlay "${label}" use_for() must return a non-empty string[]`, label))
        return { ok: false, diagnostics: out }
    }

    // draw — required to render. Missing => the old "reload the browser" stub
    // would fire at mount; surface it here instead (warn, still register so the
    // mixin fallback keeps dev HMR limping).
    if (!isFn(m.draw)) {
        out.push(warn('overlay.draw',
            `overlay "${label}" has no draw(ctx) method — it will not render`, label))
    }

    // meta_info — optional, only needed for publishing; flag wrong type only.
    if (m.meta_info !== undefined && !isFn(m.meta_info)) {
        out.push(warn('overlay.meta_info',
            `overlay "${label}" meta_info is present but not a function`, label))
    }

    return { ok: true, diagnostics: out, types: useFor }
}
