// Compile-time mirror of the runtime Diagnostic shape produced by the
// validation seam (../helpers/schema/diagnostics.js).

export interface Diagnostic {
  level: 'error' | 'warn'
  /** Stable machine code, e.g. 'ohlcv.row.shape'. */
  code: string
  /** Human-readable explanation. */
  message: string
  /** Location, e.g. 'chart.data[42]'. */
  path?: string
}

export type ValidationMode = 'off' | 'warn' | 'strict'

export interface ValidationResult {
  ok: boolean
  diagnostics: Diagnostic[]
}
