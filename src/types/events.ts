// Typed EventMap for the trading-vue public event surface (Phase 2).
//
// Enumerated from every `$emit` site (see the custom-event relay in
// overlay.js -> Grid -> Section -> Chart -> TradingVue, plus TradingVue's own
// emits). The runtime is unchanged (still mitt + Vue $emit); this is the
// compile-time contract consumers get in the shipped .d.ts, so listeners like
// `@range-changed="(r: Range) => …"` are typed.

export type Range = [number, number]

/** Payload of `open-indicator-settings` / `legend-button-click`. */
export interface IndicatorInfo {
  grid_id?: number
  index?: number
  name?: string
  [k: string]: unknown
}

/** Payload of `indicator-error` — a structured per-indicator failure. */
export interface IndicatorError {
  /** Script $uuid (null for an engine-level failure). */
  uuid: string | null
  name?: string
  type?: string
  /** Where it failed. */
  phase: 'build' | 'init' | 'exec' | 'post' | 'engine'
  message: string
}

/** Identity tuple appended to most relayed overlay/tool events. */
export type OverlayRef = [grid_id: number, layer_id: string, uuid?: string]

/**
 * Events emitted on the root <trading-vue> component (consumer-facing).
 * Keyed by event name → tuple of handler arguments.
 */
export interface TradingVueEventMap {
  'range-changed': [range: Range]
  'open-indicator-settings': [info: IndicatorInfo]
  'legend-button-click': [info: IndicatorInfo]
  /** A script/indicator failed to build or execute (structured). */
  'indicator-error': [error: IndicatorError]
  /** Script `signal()` output surfaced from the engine. */
  signal: [data: unknown]
  /**
   * Meta-event wrapping every relayed custom event:
   * `{ event: CustomEventName, args?: unknown[] }`. TradingVue also re-emits
   * `d.event` directly with `...d.args` (see the custom-event catalog below).
   */
  'custom-event': [payload: { event: CustomEventName | string; args?: unknown[] }]
}

/**
 * The catalog of relayed custom-event names. Each is ALSO re-emitted as a
 * top-level Vue event with its args, so a consumer can listen to either
 * `@custom-event` or e.g. `@object-selected`.
 */
export type CustomEventName =
  // reserved (string-compared in overlay.js)
  | 'change-settings'
  | 'object-selected'
  | 'new-shader'
  | 'new-interface'
  | 'remove-tool'
  // tool / layer lifecycle
  | 'register-tools'
  | 'tool-selected'
  | 'exec-script'
  | 'grid-mousedown'
  | 'grid-dblclick'
  | 'minimize-all-offcharts'
  | 'remove-shaders'
  | 'remove-layer-meta'
  | 'data-len-changed'
  | 'scroll-lock'
  | 'modify-interface'
  | 'close-interface'
  | 'close-indicator'
  | 'chart-reset'
  | 'before-destroy'

/** Payload shapes for the relayed custom events (best-effort from emit sites). */
export interface CustomEventArgs {
  'change-settings': [settings: Record<string, unknown>, ...ref: OverlayRef]
  'object-selected': OverlayRef
  'new-shader': [shader: unknown, ...ref: OverlayRef]
  'new-interface': [ux: unknown, ...ref: OverlayRef]
  'remove-tool': []
  'register-tools': [tools: unknown[]]
  'tool-selected': [type: string]
  'exec-script': [req: { grid_id: number; layer_id: string; src: unknown; use_for: string[]; uuid: string; sett?: unknown; output?: unknown }]
  'grid-mousedown': [grid_id: number, event: unknown]
  'grid-dblclick': [grid_id: number]
  'minimize-all-offcharts': []
  'remove-shaders': [grid_id: number, layer_id: string]
  'remove-layer-meta': [grid_id: number, layer_id: string]
  'data-len-changed': []
  'scroll-lock': [locked: boolean, ...ref: OverlayRef]
  'modify-interface': [uuid: string, ...rest: unknown[]]
  'close-interface': [uuid: string]
  'before-destroy': []
}

export type TradingVueEventName = keyof TradingVueEventMap
