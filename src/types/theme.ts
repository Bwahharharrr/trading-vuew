// Typed theme surface (Phase 4.x). The token keys accepted by the `theme` prop
// (and the legacy `colors` object). All optional — unset keys fall back to the
// flat-prop defaults / defaultTheme.

export interface TradingVueTheme {
  /** Title bar colour. */
  title?: string
  /** Chart background. */
  back?: string
  /** Grid lines. */
  grid?: string
  /** Axis / label text. */
  text?: string
  /** Highlighted text. */
  textHL?: string
  /** Scale (axis) colour. */
  scale?: string
  /** Crosshair colour. */
  cross?: string
  /** Up candle body. */
  candleUp?: string
  /** Down candle body. */
  candleDw?: string
  /** Up candle wick. */
  wickUp?: string
  /** Down candle wick. */
  wickDw?: string
  /** Small-candle wick. */
  wickSm?: string
  /** Up volume bar. */
  volUp?: string
  /** Down volume bar. */
  volDw?: string
  /** Panel background. */
  panel?: string
  /** Toolbar border. */
  tbBorder?: string
  /** Toolbar background. */
  tbBack?: string
  /** Any additional custom token. */
  [token: string]: string | undefined
}
