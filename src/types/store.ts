// Store layer types (Phase 3.1). The runtime stores are JS (src/stores/*.js);
// these are the compile-time contracts for the framework-agnostic data/UI
// boundary the Phase 3 refactor establishes.

/** A query-resolution pivot: parent object, key/index, and the value at it. */
export interface QueryPivot {
  p: any
  i: string | number
  v: any
}

export interface QueryCtx {
  data: Record<string, any>
  dss?: Record<string, { data(): unknown[] }>
}

/** Chart interaction state, separated from chart data. */
export interface ChartUIState {
  tool?: string
  drawingMode: boolean
  scrollLock: boolean
  selected: string | null
  tools: Array<{ type: string; [k: string]: unknown }>
}
