/**
 * @typedef {Object} Diagnostic
 * @property {'error'|'warn'} level
 * @property {string} code   - stable machine code, e.g. 'ohlcv.row.shape'
 * @property {string} message- human-readable explanation
 * @property {string} [path] - location, e.g. 'chart.data[42]'
 */
/** Make a diagnostic. */
export function diag(level: any, code: any, message: any, path: any): {
    level: any;
    code: any;
    message: any;
    path: any;
} | {
    level: any;
    code: any;
    message: any;
    path?: undefined;
};
/** True if any diagnostic is error-level. */
export function hasErrors(diagnostics: any): boolean;
/** One-line human summary of a diagnostic list (capped). */
export function formatDiagnostics(diagnostics: any, cap?: number): string;
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
export function report(diagnostics: Diagnostic[], mode?: "off" | "warn" | "strict", context?: string): Diagnostic[];
export function error(code: any, message: any, path: any): {
    level: any;
    code: any;
    message: any;
    path: any;
} | {
    level: any;
    code: any;
    message: any;
    path?: undefined;
};
export function warn(code: any, message: any, path: any): {
    level: any;
    code: any;
    message: any;
    path: any;
} | {
    level: any;
    code: any;
    message: any;
    path?: undefined;
};
export type Diagnostic = {
    level: "error" | "warn";
    /**
     * - stable machine code, e.g. 'ohlcv.row.shape'
     */
    code: string;
    /**
     * human-readable explanation
     */
    "message-": string;
    /**
     * - location, e.g. 'chart.data[42]'
     */
    path?: string | undefined;
};
