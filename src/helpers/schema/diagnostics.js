
// Typed, recoverable diagnostics for the validation seam (Phase 2).
//
// "Fail loud at the edge": malformed data/overlays/messages surface as
// structured diagnostics here instead of silent NaN deep in a render loop.
// Dependency-free and SSR/worker-safe (no DOM, no schema library — keeps the
// bundle lean and tree-shakeable).

/**
 * @typedef {Object} Diagnostic
 * @property {'error'|'warn'} level
 * @property {string} code   - stable machine code, e.g. 'ohlcv.row.shape'
 * @property {string} message- human-readable explanation
 * @property {string} [path] - location, e.g. 'chart.data[42]'
 */

/** Make a diagnostic. */
export function diag(level, code, message, path) {
    return path !== undefined
        ? { level, code, message, path }
        : { level, code, message }
}

export const error = (code, message, path) => diag('error', code, message, path)
export const warn = (code, message, path) => diag('warn', code, message, path)

/** True if any diagnostic is error-level. */
export function hasErrors(diagnostics) {
    for (const d of diagnostics) if (d.level === 'error') return true
    return false
}

/** One-line human summary of a diagnostic list (capped). */
export function formatDiagnostics(diagnostics, cap = 8) {
    const shown = diagnostics.slice(0, cap).map(
        d => `  [${d.level}] ${d.code}${d.path ? ` @ ${d.path}` : ''}: ${d.message}`
    )
    const extra = diagnostics.length > cap
        ? `\n  …and ${diagnostics.length - cap} more`
        : ''
    return shown.join('\n') + extra
}

/**
 * Report diagnostics according to `mode`:
 *   'off'    - do nothing
 *   'warn'   - console.warn errors+warnings (default; non-breaking)
 *   'strict' - throw on any error-level diagnostic (after logging)
 *
 * Returns the (possibly filtered) diagnostics so callers can also surface them
 * on an event bus. Never throws in 'warn'/'off'.
 *
 * @param {Diagnostic[]} diagnostics
 * @param {'off'|'warn'|'strict'} mode
 * @param {string} context - label for the log line, e.g. 'OHLCV data'
 */
export function report(diagnostics, mode = 'warn', context = 'data') {
    if (!diagnostics || !diagnostics.length || mode === 'off') return diagnostics

    const header = `[trading-vue] ${context}: ${diagnostics.length} validation issue(s)`
    const body = formatDiagnostics(diagnostics)

    if (mode === 'strict' && hasErrors(diagnostics)) {
        // Log first so the full context is visible, then fail loud.
        if (typeof console !== 'undefined') console.error(header + '\n' + body)
        const err = new Error(`${header} (strict mode)\n${body}`)
        err.diagnostics = diagnostics
        throw err
    }

    if (typeof console !== 'undefined') {
        const fn = hasErrors(diagnostics) ? console.error : console.warn
        fn(header + '\n' + body)
    }
    return diagnostics
}
