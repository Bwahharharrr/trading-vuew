// Types for the defineOverlay / defineTool factories (Phase 4.1).

import type { OverlayMeta } from './overlay'

/** Curated render context passed to an overlay's draw (2nd arg). */
export interface RenderContext {
  /** Resolved grid layout (coordinate mapping: t2screen, $2screen, …). */
  layout: any
  /** This overlay's data series. */
  data: any[]
  /** The main chart data subset. */
  sub: any[]
  /** Merged overlay settings. */
  settings: Record<string, any>
  /** Theme colours. */
  colors: Record<string, any>
  cursor: any
  num: number
  interval: number
  tf: number
  font: string
  id: string
  grid_id: number
  /** Stroke setup helper (width, colour). */
  setupStroke(ctx: CanvasRenderingContext2D, width: number, color: string): void
  /** Draw a data line helper. */
  drawDataLine(ctx: CanvasRenderingContext2D, data: any[], index?: number, skipNaN?: boolean): void
}

export interface DefineOverlayConfig {
  /** Chart-data `type`s this overlay renders (required, non-empty). */
  useFor: string[]
  /** Render onto the grid canvas. Required; called every frame. */
  draw(ctx: CanvasRenderingContext2D, $: RenderContext): void
  name?: string
  meta?: OverlayMeta
  settings?: Record<string, unknown>
  dataColors?($: RenderContext): string[]
  yRange?($: RenderContext): [number, number]
  calc?(): Record<string, unknown>
  init?(): void
  destroy?(): void
  computed?: Record<string, () => unknown>
  methods?: Record<string, (...a: any[]) => any>
  mixins?: any[]
}

export interface DefineToolConfig extends DefineOverlayConfig {
  /** Tool type id (required). */
  type: string
  group?: string
  icon?: string
  hint?: string
  data?: any[]
  mods?: Record<string, unknown>
  init_tool?(): void
}
