// Typed OverlayDefinition contract (Phase 2).
//
// The existing overlays are Vue Options-API components using the Overlay mixin;
// this is the contract they must satisfy, enforced at REGISTRATION time by
// ../helpers/schema/validate-overlay.js (replacing the old silent-skip +
// "reload the browser" mount fallback). Phase 4 turns this into a
// `defineOverlay()` factory; the shape is designed to carry forward.

export interface OverlayMeta {
  author?: string
  version?: string
  contact?: string
  github?: string
  desc?: string
  [k: string]: unknown
}

/** The canvas 2D context overlays draw onto. */
export type OverlayDrawContext = CanvasRenderingContext2D

export interface OverlayDefinition {
  /** Chart-data `type` strings this overlay renders (e.g. ['EMA','SMA']). Required, non-empty. */
  use_for(): string[]
  /** Render onto the grid canvas. Required. Called every frame. */
  draw(ctx: OverlayDrawContext): void
  /** Author/version metadata (required for publishing, optional otherwise). */
  meta_info?(): OverlayMeta
  /** Per-data-column colours for the legend. */
  data_colors?(): string[]
  /** [hi, lo] price range override for off-chart overlays. */
  y_range?(): [number, number]
  /** Drawing-tool descriptor (tools only). */
  tool?(): Record<string, unknown>
  init_tool?(): void
  init?(): void
  destroy?(): void
  /** Script object for engine-computed overlays. */
  calc?(): Record<string, unknown>
}
