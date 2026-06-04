
// Lazy gesture-library loader (Phase 4.x).
//
// hammerjs/hamsterjs run an IIFE that touches `window`/`document` at MODULE
// EVAL. Importing them statically therefore (a) crashes a bare SSR/Node import
// of the library, and (b) plants a top-level side effect in the bundle that
// blocks consumer tree-shaking. Loading them on demand — only when a chart
// actually wires up interaction at mount time, which is always in the browser —
// fixes both: the eval happens inside a dynamically-imported chunk, off the
// main module's top level.
//
// Cached after the first load; concurrent callers share one in-flight promise.

let cache = null
let inFlight = null

export function loadGestures() {
    if (cache) return Promise.resolve(cache)
    if (inFlight) return inFlight
    inFlight = Promise.all([
        import('hammerjs'),
        import('hamsterjs'),
    ]).then(([H, Ha]) => {
        // Interop: hammerjs exposes Manager/Pan/etc. on the module (or .default
        // under CJS interop); hamsterjs is a default export.
        const Hammer = (H && H.Manager) ? H : (H.default || H)
        const Hamster = (Ha && Ha.default) ? Ha.default : Ha
        cache = { Hammer, Hamster }
        inFlight = null
        return cache
    })
    return inFlight
}

/** Synchronous accessor — non-null only after loadGestures() has resolved. */
export function loadedGestures() {
    return cache
}
