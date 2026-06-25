// Hand-written TypeScript contract for the Corky chart-client-interface v1 WS
// gateway (corky.chart-client-interface, schema_version 1).
//
// This is the compile-time contract for the WebSocket JSON protocol: the
// client request envelope + each command, and the gateway event envelope +
// each event payload. Mirrors:
//   docs/protocol/chart-client-interface.v1.json
//   docs/schemas/chart-feed/v1/{chart-client-request,chart-feed-event,
//                               chart-state-descriptor}.schema.json
//
// Runtime wiring (codec / feed adapter) lives elsewhere under
// ../helpers/feed/; this file is types-only.

// ───────────────────────────────────────────────────────────── primitives ──

/**
 * A decimal value transported as a string to preserve exact precision
 * (prices, volumes, indicator outputs). Convert with `Number(s)` for
 * rendering; keep the raw string where exact text is needed (tooltips).
 */
export type DecimalString = string

/** Unix epoch milliseconds, signed 64-bit. Safe as a JS `number`. */
export type TimestampMs = number

/** Protocol schema version. Always `1` for this contract. */
export type SchemaVersion = 1

/**
 * Timeframe label (e.g. `"1m"`, `"5m"`, `"1h"`, `"1D"`, `"1W"`, `"1M"`).
 * The gateway advertises a fixed set, but the wire type is an open string.
 */
export type Timeframe = string

// ─────────────────────────────────────────────────────────────── enums ──────

/** Lifecycle state of a candle state or indicator (`ServiceState`). */
export type ServiceState =
  | 'Starting'
  | 'Running'
  | 'Ready'
  | 'Degraded'
  | 'Reconnecting'
  | 'Stopping'
  | 'Stopped'
  | 'Failed'
  | 'Unknown'

/** Status reported on a `control_ack` (`RuntimeControlStatus`). */
export type RuntimeControlStatus = 'Accepted' | 'Rejected' | 'Applied' | 'Failed'

/** Detailed outcome of a state-control command (`StateControlOutcome`). */
export type StateControlOutcome =
  | 'applied_hot'
  | 'accepted_pending'
  | 'requires_restart'
  | 'noop'
  | 'rejected'
  | 'failed'

/** Catalog of error codes the gateway may emit. */
export type KnownErrorCode =
  | 'unsupported_schema_version'
  | 'invalid_request_json'
  | 'state_not_found'
  | 'runtime_not_found'
  | 'invalid_control_command'
  | 'control_response_timeout'
  | 'control_receive_error'
  | 'historical_query_failed'
  // auth-position flows
  | 'auth_position_history_unavailable'
  | 'auth_position_audit_unavailable'
  | 'stateful_websocket_required'
  // strategy / backtest read flows
  | 'backtest_artifacts_disabled'
  | 'strategy_not_found'
  | 'backtest_not_found'
  | 'backtest_artifact_not_ready'
  | 'invalid_backtest_request'
  | 'backtest_artifact_invalid'
  | 'backtest_store_unavailable'

/**
 * An error code on the wire: a {@link KnownErrorCode} or any future string the
 * gateway may introduce.
 */
export type ErrorCode = KnownErrorCode | (string & {})

// ──────────────────────────────────────────────────────── history ranges ──

/** Subscribe to the latest `limit` closed candles. */
export interface ChartHistoryRangeLatest {
  type: 'latest'
  limit: number
}

/** Subscribe to a fixed `[start_ms, end_ms]` window. */
export interface ChartHistoryRangeStartEnd {
  type: 'start_end'
  start_ms: TimestampMs
  end_ms: TimestampMs
}

/** Subscribe to everything from inception up to `end_ms` (or now if null). */
export interface ChartHistoryRangeSinceInception {
  type: 'since_inception'
  end_ms?: TimestampMs | null
}

/** Range a client may request on `subscribe_candles` (`ChartHistoryRange`). */
export type ChartHistoryRange =
  | ChartHistoryRangeLatest
  | ChartHistoryRangeStartEnd
  | ChartHistoryRangeSinceInception

/**
 * Range the gateway reports it actually served on `historical_ack`
 * (`HistoricalCandleRange`). Differs from {@link ChartHistoryRange}: the
 * `latest` variant carries a resolved `end_ms`.
 */
export type HistoricalCandleRange =
  | { type: 'start_end'; start_ms: TimestampMs; end_ms: TimestampMs }
  | { type: 'latest'; limit: number; end_ms?: TimestampMs | null }
  | { type: 'since_inception'; end_ms?: TimestampMs | null }

// ─────────────────────────────────────────────────────── candle rows ──────

/** A single OHLCV candle (decimal prices/volume as strings). */
export interface CandleSnapshot {
  timestamp_ms: TimestampMs
  open: DecimalString
  high: DecimalString
  low: DecimalString
  close: DecimalString
  volume: DecimalString
}

/**
 * Indicator outputs attached to a row, keyed by `display_label` (e.g.
 * `"sma:20"`), then by output name (e.g. `"sma"`) → decimal value.
 */
export type RowIndicators = Record<string, Record<string, DecimalString>>

/** A historical / live candle row (`ChartCandleRow`). */
export interface ChartCandleRow {
  timeframe: Timeframe
  candle: CandleSnapshot
  /** Defaults to `{}` when omitted. */
  indicators?: RowIndicators
}

// ───────────────────────────────────────────────── state descriptor ──────

/** A four-slot candle preview for a timeframe (`CandlePreview`). */
export interface CandlePreview {
  first?: CandleSnapshot | null
  previous_2_closed?: CandleSnapshot | null
  previous_1_closed?: CandleSnapshot | null
  current?: CandleSnapshot | null
}

/** Per-timeframe range/buffer/lifecycle descriptor (`ChartTimeframeRange`). */
export interface ChartTimeframeRange {
  timeframe: Timeframe
  source_timeframe: Timeframe
  live_source?: string | null
  seed_source?: string | null
  // buffer
  held_count: number
  buffer_target: number
  effective_target_count?: number | null
  // range
  first_ts_ms?: TimestampMs | null
  last_closed_ts_ms?: TimestampMs | null
  current_ts_ms?: TimestampMs | null
  // lifecycle
  ready: boolean
  readiness_status?: string | null
  stale: boolean
  stale_reason?: string | null
  // preview (defaults to all-null)
  preview?: CandlePreview
}

/** Indicator view layer kind (chart-feed v1). */
export type IndicatorViewLayerKind =
  | 'line' | 'histogram' | 'band' | 'candle_color' | 'box' | 'marker' | 'diagnostic'

/** Where a view layer renders. */
export interface IndicatorViewTarget {
  surface?: 'price' | 'pane'
  pane?: string | null
}

/** One default-render layer of an indicator's view. */
export interface IndicatorViewLayerSpec {
  id: string
  label: string
  kind: IndicatorViewLayerKind
  target?: IndicatorViewTarget
  /** Output names to read from the indicator values map. Default = all outputs. */
  fields?: string[]
  /** Client rendering hints (free-form). */
  style?: Record<string, string>
  /** Initial visibility; hidden layers stay available for user opt-in. */
  visible_by_default?: boolean
}

/** Default rendering intent for an indicator (chart-feed `view`). */
export interface IndicatorViewSpec {
  version?: number
  layers?: IndicatorViewLayerSpec[]
}

/** Indicator descriptor advertised in discovery (`ChartIndicatorDescriptor`). */
export interface ChartIndicatorDescriptor {
  kind: string
  display_label: string
  timeframe: Timeframe
  source: string
  state: ServiceState
  readiness_status?: string | null
  warmup: number
  samples_seen: number
  ready: boolean
  last_timestamp_ms?: TimestampMs | null
  /** Output names this indicator emits, e.g. `["sma"]`. Defaults to `[]`. */
  outputs?: string[]
  /** Latest output values keyed by output name. Defaults to `{}`. */
  values?: Record<string, DecimalString>
  /** Default rendering intent (preferred over plotting every output). */
  view?: IndicatorViewSpec
}

/** A maintained candle state (`ChartCandleStateDescriptor`). */
export interface ChartCandleStateDescriptor {
  // identity
  runtime_id: string
  shard_id?: string | null
  state_id: string
  venue: string
  symbol: string
  funding_period?: string | null
  // lifecycle
  state: ServiceState
  lifecycle_reason?: string | null
  // source
  source_channel: string
  source_timeframe: Timeframe
  seed_source?: string | null
  live_source?: string | null
  previous_live_source?: string | null
  live_source_changed_at_ms?: TimestampMs | null
  // timeframes
  requested_timeframes?: Timeframe[]
  available_timeframes?: Timeframe[]
  buffer_target: number
  ranges?: ChartTimeframeRange[]
  // indicators
  indicators?: ChartIndicatorDescriptor[]
}

// ─────────────────────────────────────────────────── auth positions ──────
//
// Authenticated private-account positions, surfaced read-only from observed
// private-runtime snapshots (the gateway does NOT query the venue directly).
// All numeric fields are {@link DecimalString}; timestamps are {@link TimestampMs}.

/**
 * Origin of a position row: `current` = open position from the authenticated
 * positions feed; `historical` = closed position from the positions-history store.
 */
export type ChartAuthPositionSource = 'current' | 'historical'

/** A private-account position row (`ChartAuthPosition`). */
export interface ChartAuthPosition {
  runtime_id: string
  account_id: string
  venue: string
  source: ChartAuthPositionSource
  symbol: string
  /** Stable integer id; required for {@link GetAuthPositionAuditCommand}. */
  position_id: number
  status: string
  side: string
  amount: DecimalString
  base_price: DecimalString
  pl?: DecimalString | null
  pl_perc?: DecimalString | null
  liquidation_price?: DecimalString | null
  leverage?: DecimalString | null
  collateral?: DecimalString | null
  collateral_min?: DecimalString | null
  opened_at_ms?: TimestampMs | null
  closed_at_ms?: TimestampMs | null
  updated_at_ms?: TimestampMs | null
}

/** Completeness of a reconstructed position audit (`summary.status`). */
export type ChartAuthPositionAuditStatus =
  | 'complete' | 'degraded' | 'incomplete' | 'missing'

/** The position identity/window inside an audit bundle. */
export interface ChartAuthPositionAuditPosition {
  source?: ChartAuthPositionSource | null
  status: string
  side: string
  amount: DecimalString
  base_price: DecimalString
  opened_at_ms?: TimestampMs | null
  closed_at_ms?: TimestampMs | null
  updated_at_ms?: TimestampMs | null
}

/** Reconciliation summary for an audit bundle. */
export interface ChartAuthPositionAuditSummary {
  status: ChartAuthPositionAuditStatus
  order_count: number
  trade_count: number
  /** Ledger fee-event count. Absent on older audits → treat as 0. */
  fee_count?: number
  trade_amount_sum: DecimalString
  expected_position_amount: DecimalString
  amount_delta: DecimalString
  /**
   * AGGREGATE fees keyed by currency — includes BOTH trade execution fees and
   * the {@link ChartAuthPositionAudit.fees} ledger events. Use this for the total
   * fee display. Defaults to `{}`.
   */
  fees_by_currency?: Record<string, DecimalString>
  /** Defaults to `[]`. */
  order_ids?: number[]
  /** Defaults to `[]`. */
  trade_ids?: number[]
  /** Ledger fee ids. Absent on older audits → treat as `[]`. */
  fee_ids?: number[]
  /** Human-readable reasons when not `complete`. Defaults to `[]`. */
  reasons?: string[]
}

/** Known `kind` values for a {@link ChartAuthPositionAuditFee} (open string). */
export type ChartAuthPositionFeeKind =
  | 'margin_funding'         // margin-position funding cost / interest
  | 'derivatives_funding'    // derivatives funding payment
  | 'funding_provider_fee'   // fee charged on funding-provider earnings
  | (string & {})

/**
 * A ledger-backed position fee event (`audit.fees[]`) — funding / margin / etc.,
 * distinct from per-trade execution fees. `amount` is a decimal string: negative
 * = cost/debit, positive = credit/rebate/income. `description` is the raw
 * Bitfinex ledger row text and should stay visible in tooltips/details.
 */
export interface ChartAuthPositionAuditFee {
  fee_id: number
  timestamp_ms: TimestampMs
  currency: string
  amount: DecimalString
  /** Running wallet balance after this ledger entry. */
  balance: DecimalString
  kind: ChartAuthPositionFeeKind
  description: string
  symbol?: string | null
  position_id?: number | null
  source: string
}

/** A linked order row in an audit bundle. */
export interface ChartAuthPositionAuditOrder {
  order_id: number
  client_order_id: number
  symbol: string
  created_at_ms?: TimestampMs | null
  updated_at_ms?: TimestampMs | null
  amount?: DecimalString | null
  amount_original?: DecimalString | null
  order_type: string
  status?: string | null
  price?: DecimalString | null
  price_avg?: DecimalString | null
  /** Provenance, e.g. `"rest:orders_hist"`. */
  source: string
}

/** A linked trade row in an audit bundle. */
export interface ChartAuthPositionAuditTrade {
  trade_id: number
  order_id: number
  client_order_id?: number | null
  symbol: string
  execution_timestamp_ms: TimestampMs
  amount: DecimalString
  price: DecimalString
  order_type: string
  order_price: DecimalString
  maker: boolean
  fee?: DecimalString | null
  fee_currency?: string | null
  /** Provenance, e.g. `"rest:trades_hist"`. */
  source: string
}

/** The persisted audit bundle for one position (`ChartAuthPositionAudit`). */
export interface ChartAuthPositionAudit {
  venue: string
  account_id: string
  symbol: string
  position_id: number
  position: ChartAuthPositionAuditPosition
  summary: ChartAuthPositionAuditSummary
  /** Defaults to `[]` (or omitted when `include_orders=false`). */
  orders?: ChartAuthPositionAuditOrder[]
  /** Defaults to `[]` (or omitted when `include_trades=false`). */
  trades?: ChartAuthPositionAuditTrade[]
  /** Ledger fee events. Absent on older audits → treat as `[]`. */
  fees?: ChartAuthPositionAuditFee[]
  updated_at_ms?: TimestampMs | null
}

// ──────────────────────────────────────────────────── client requests ──────

/**
 * Spec for an indicator a client wants the runtime to maintain
 * (`PublicIndicatorSpec`).
 */
export interface PublicIndicatorSpec {
  kind: string
  timeframe: Timeframe
  /** Input series, defaults to `"close"`. */
  source?: string
  /** Free-form string params, e.g. `{ period: "20" }`. Defaults to `{}`. */
  params?: Record<string, string>
  version?: string | null
}

/** Discover maintained candle states and their timeframes/indicators. */
export interface ListCandleStatesCommand {
  type: 'list_candle_states'
  /** Filter to a single venue. Defaults to null (all venues). */
  venue?: string | null
}

/** Subscribe to one symbol/timeframe: historical rows then live updates. */
export interface SubscribeCandlesCommand {
  type: 'subscribe_candles'
  subscription_id: string
  venue: string
  symbol: string
  timeframe: Timeframe
  target_runtime_id?: string | null
  funding_period?: string | null
  /** Defaults to `{ type: 'latest', limit: 200 }`. */
  range?: ChartHistoryRange
  /** Defaults to `false`. */
  include_indicators?: boolean
  /** Defaults to `[]`. */
  indicators?: PublicIndicatorSpec[]
  /** Rows per historical chunk. Defaults to null (gateway chooses). */
  chunk_rows?: number | null
  /**
   * `'summary'` → gateway returns the lightweight {@link SubscriptionAcceptedSummaryEvent}
   * instead of the full {@link SubscriptionAcceptedEvent} descriptor (use discovery
   * for descriptor metadata). Omitted → full `subscription_accepted` (back-compat).
   */
  ack_mode?: 'summary' | 'full'
  /**
   * `'columnar'` → historical rows arrive as compact {@link HistoricalChunkColumnarEvent}s
   * instead of row-based {@link HistoricalChunkEvent}s. Omitted → row chunks
   * (back-compat). Live updates are unchanged regardless.
   */
  historical_format?: 'columnar' | 'rows'
}

/** Stop live updates for a subscription (idempotent; runtime state stays). */
export interface UnsubscribeCommand {
  type: 'unsubscribe'
  subscription_id: string
}

/** Create or replace desired candle state for a symbol/timeframes. */
export interface UpsertCandleStateCommand {
  type: 'upsert_candle_state'
  venue: string
  symbol: string
  timeframes: Timeframe[]
  target_runtime_id?: string | null
  funding_period?: string | null
  /** Defaults to `[]`. */
  indicators?: PublicIndicatorSpec[]
  buffer?: number | null
}

/** Patch an existing candle state, leaving unspecified fields untouched. */
export interface PatchCandleStateCommand {
  type: 'patch_candle_state'
  venue: string
  symbol: string
  target_runtime_id?: string | null
  funding_period?: string | null
  timeframes?: Timeframe[] | null
  indicators?: PublicIndicatorSpec[] | null
  buffer?: number | null
}

/**
 * One-shot snapshot of private-account positions. All filters optional; venue
 * and symbol match ASCII case-insensitively. Responds with `auth_positions`.
 */
export interface ListAuthPositionsCommand {
  type: 'list_auth_positions'
  venue?: string | null
  account_id?: string | null
  symbol?: string | null
  /** Include closed/historical rows alongside open ones. Defaults to `false`. */
  include_historical?: boolean
}

/**
 * Stream private-account positions: each `auth_positions_update` is a FULL
 * replacement set for the subscription (not a patch). Apply by `sequence`.
 */
export interface SubscribeAuthPositionsCommand {
  type: 'subscribe_auth_positions'
  subscription_id: string
  venue?: string | null
  account_id?: string | null
  symbol?: string | null
  /** Defaults to `false`. */
  include_historical?: boolean
}

/**
 * Paged closed-position history. `cursor` is opaque — pass `next_cursor` back
 * unchanged for the next page. Responds with `auth_position_history`.
 */
export interface ListAuthPositionHistoryCommand {
  type: 'list_auth_position_history'
  venue: string
  account_id: string
  symbol?: string | null
  /** Page size. Defaults to `100`. */
  limit?: number
  /** Opaque page cursor; omit for the first page. */
  cursor?: string | null
}

/** One-shot audit bundle for a selected position. Responds with `auth_position_audit`. */
export interface GetAuthPositionAuditCommand {
  type: 'get_auth_position_audit'
  venue: string
  account_id: string
  symbol: string
  position_id: number
  /** Defaults to `true`. */
  include_orders?: boolean
  /** Defaults to `true`. */
  include_trades?: boolean
}

/**
 * Stream the audit bundle for a selected position: each
 * `auth_position_audit_update` replaces the displayed bundle. Apply by `sequence`.
 */
export interface SubscribeAuthPositionAuditCommand {
  type: 'subscribe_auth_position_audit'
  subscription_id: string
  venue: string
  account_id: string
  symbol: string
  position_id: number
  /** Defaults to `true`. */
  include_orders?: boolean
  /** Defaults to `true`. */
  include_trades?: boolean
}

// ───────────────────────────────────────────────── historical search ──────
//
// One-shot historical indicator search: stream every bar in a window that
// satisfies an alert-style condition over computed indicators. NOT a live
// subscription — each search is keyed by `search_id` and terminates. Events
// carry `event.search_id` (and `request_id: null`); route by search_id, never
// by request correlation.

/** Comparison operator in a {@link SearchConditionCompare}. */
export type SearchCompareOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne'

/**
 * A reference to one indicator output at a bar offset. `indicator` is the
 * DISPLAY LABEL (e.g. `"MACD(12,26,9)"`, `"CRUP"`) — NOT the canonical kind.
 */
export interface SearchConditionField {
  indicator: string
  field: string
  /** Bars back from the candidate bar; 0 = the bar itself. Default 0. */
  bar_offset?: number
}

/** Leaf predicate: `field <op> value`. */
export interface SearchConditionCompare {
  type: 'compare'
  field: SearchConditionField
  op: SearchCompareOp
  value: number
}

/** All child conditions must hold. */
export interface SearchConditionAll {
  type: 'all'
  conditions: SearchCondition[]
}

/** Any child condition must hold. */
export interface SearchConditionAny {
  type: 'any'
  conditions: SearchCondition[]
}

/** Alert-style condition tree evaluated per candidate bar (`SearchCondition`). */
export type SearchCondition =
  | SearchConditionCompare
  | SearchConditionAll
  | SearchConditionAny

/** The set of symbols a search scans. */
export interface SearchSymbolSet {
  type: 'symbols'
  symbols: string[]
}

/**
 * An indicator the gateway must COMPUTE for the search. The `indicators` array
 * is REQUIRED and non-empty — omitting it makes the search accept then STALL
 * (nothing is computed to match on). Mirrors a discovery descriptor's
 * `{kind, timeframe, source, params}` (read those off {@link ChartIndicatorDescriptor}).
 */
export interface SearchIndicatorSpec {
  kind: string
  timeframe?: Timeframe
  source?: string
  params?: Record<string, DecimalString>
}

/** Bars to return on each side of a match (`SearchResultWindow`). */
export interface SearchResultWindow {
  before_bars: number
  after_bars: number
}

/**
 * Barrier Symmetric target-enrichment spec (`SearchBarrierSymmetricTargetSpec`).
 * All fields optional — the runtime applies documented defaults. This requests a
 * forward target/stop plan + (when matured) outcome attached to matched rows; it
 * is NOT a causal indicator and must never be referenced by a `condition`.
 */
export interface SearchBarrierSymmetricTargetSpec {
  timeframe?: Timeframe | null
  window_fwd?: number
  window_atr?: number
  /** Take-profit ATR multiple (default 0.9). */
  k_take?: number
  /** Stop ATR multiple (default = k_take). */
  k_stop?: number | null
  fees_bps?: number
  slippage_bps?: number
  half_spread_bps?: number
  giveback_eps_bps?: number
  post_hit_stop_relax_bps?: number
  timeout_requires_final?: boolean
  /** e.g. `'stop'`. */
  post_hit_policy?: string
  guard_use_close?: boolean
  guard_min_consecutive_closes?: number
  version?: number
}

/** A tagged target-enrichment spec for {@link SearchQuery.target_specs}. */
export interface SearchTargetSpec {
  type: 'barrier_symmetric'
  spec: SearchBarrierSymmetricTargetSpec
}

/** The full query carried by a {@link SearchCandlesCommand}. */
export interface SearchQuery {
  /** Caller-minted, unique; echoed on every event as `event.search_id`. */
  search_id: string
  venue: string
  symbols: SearchSymbolSet
  /** Reuses the subscribe range shapes (latest / start_end / since_inception). */
  range: ChartHistoryRange
  timeframes: Timeframe[]
  /** Indicators to compute; REQUIRED and non-empty (see {@link SearchIndicatorSpec}). */
  indicators: SearchIndicatorSpec[]
  condition: SearchCondition
  result_window?: SearchResultWindow
  /** Cap on returned matches; the gateway stops scanning once reached. */
  max_results?: number
  /**
   * Optional result ENRICHMENT (Barrier Symmetric plans/outcomes). Does NOT
   * change which rows match — plans/outcomes are attached to rows that already
   * satisfied the causal `condition`. (Alias on the wire: `outcome_specs`.)
   */
  target_specs?: SearchTargetSpec[]
}

/** Start a historical indicator search (streamed, keyed by `query.search_id`). */
export interface SearchCandlesCommand {
  type: 'search_candles'
  query: SearchQuery
}

/** Cancel an in-flight search by its `search_id`. */
export interface CancelSearchCommand {
  type: 'cancel_search'
  search_id: string
}

// ───────────────────────────────────────────── strategies / backtests ──────
//
// READ-ONLY strategy + backtest commands served by corky-chart-gateway over the
// SAME WebSocket. The chart app never calls the legacy runner HTTP artifact API;
// artifact writing stays runner-side. All money/quantity fields are
// {@link DecimalString} — never float-parse them.

export type BacktestRunStatus = 'queued' | 'running' | 'completed' | 'failed'

/** List available strategies. */
export interface ListStrategiesCommand { type: 'list_strategies' }

/** Inspect one strategy by `name`. */
export interface GetStrategyCommand {
  type: 'get_strategy'
  strategy: string
}

/** List backtest runs; all filters optional. */
export interface ListBacktestRunsCommand {
  type: 'list_backtest_runs'
  strategy?: string
  symbol?: string
  venue?: string
  status?: BacktestRunStatus
}

/** Raw pass-through artifact for a run (advanced details). */
export interface GetBacktestRunCommand {
  type: 'get_backtest_run'
  run_id: string
}

/** One-shot progress snapshot for a run. */
export interface GetBacktestProgressCommand {
  type: 'get_backtest_progress'
  run_id: string
}

/** Stream live progress for a run (full event list each update). */
export interface SubscribeBacktestProgressCommand {
  type: 'subscribe_backtest_progress'
  subscription_id: string
  run_id: string
}

/** Per-trade chart windows + markers for a run. */
export interface GetBacktestChartOverlaysCommand {
  type: 'get_backtest_chart_overlays'
  run_id: string
  timeframe?: Timeframe
  before_bars?: number
  after_bars?: number
  /** Inclusive window: only trades whose timestamp_ms ∈ [start_ms, end_ms]. */
  start_ms?: TimestampMs
  end_ms?: TimestampMs
  /** Parameter-sweep run selector. */
  run_index?: number | null
  /** Walk-forward fold selector. */
  fold_index?: number | null
}

/** Normalized report/account overlays for a run. */
export interface GetBacktestReportOverlaysCommand {
  type: 'get_backtest_report_overlays'
  run_id: string
  /** Inclusive window filter (trades/equity/levels/period-returns intersecting). */
  start_ms?: TimestampMs
  end_ms?: TimestampMs
  /** Downsample equity_curve to at most this many points (no interpolation). */
  max_points?: number
  run_index?: number | null
  fold_index?: number | null
}

/** Discriminated union of client commands (`ChartClientCommand`). */
export type ChartClientCommand =
  | ListCandleStatesCommand
  | SubscribeCandlesCommand
  | UnsubscribeCommand
  | UpsertCandleStateCommand
  | PatchCandleStateCommand
  | ListAuthPositionsCommand
  | SubscribeAuthPositionsCommand
  | ListAuthPositionHistoryCommand
  | GetAuthPositionAuditCommand
  | SubscribeAuthPositionAuditCommand
  | SearchCandlesCommand
  | CancelSearchCommand
  | ListStrategiesCommand
  | GetStrategyCommand
  | ListBacktestRunsCommand
  | GetBacktestRunCommand
  | GetBacktestProgressCommand
  | SubscribeBacktestProgressCommand
  | GetBacktestChartOverlaysCommand
  | GetBacktestReportOverlaysCommand

/** Discriminant of {@link ChartClientCommand}. */
export type ChartClientCommandType = ChartClientCommand['type']

/** The envelope every client → gateway message is wrapped in. */
export interface ChartClientRequest {
  /** Defaults to `1`; the gateway rejects unknown versions. */
  schema_version?: SchemaVersion
  /** Client-generated, unique per outstanding request; echoed on events. */
  request_id: string
  command: ChartClientCommand
}

// ───────────────────────────────────────────────────────── feed events ──────

/** Response to `list_candle_states`. */
export interface CandleStatesEvent {
  type: 'candle_states'
  states: ChartCandleStateDescriptor[]
}

/** First event after a successful `subscribe_candles`. */
export interface SubscriptionAcceptedEvent {
  type: 'subscription_accepted'
  subscription_id: string
  state: ChartCandleStateDescriptor
  timeframe: Timeframe
  range: ChartHistoryRange
}

/**
 * Lightweight accept (when `ack_mode:'summary'`): identity + served range only,
 * WITHOUT the full {@link ChartCandleStateDescriptor}. Read descriptor metadata
 * from discovery / `list_candle_states` instead.
 */
export interface SubscriptionAcceptedSummaryEvent {
  type: 'subscription_accepted_summary'
  subscription_id: string
  runtime_id: string
  state_id: string
  venue: string
  symbol: string
  funding_period?: string | null
  timeframe: Timeframe
  range: ChartHistoryRange
}

/** Acknowledges the historical query and the range that will be served. */
export interface HistoricalAckEvent {
  type: 'historical_ack'
  subscription_id: string
  venue: string
  symbol: string
  timeframes: Timeframe[]
  range: HistoricalCandleRange
}

/** Progress during the historical backfill. */
export interface HistoricalProgressEvent {
  type: 'historical_progress'
  subscription_id: string
  phase: string
  current: number
  /** Total units for this phase, when known. */
  total?: number | null
  message: string
}

/** A batch of historical rows; append in `chunk_index` then row order. */
export interface HistoricalChunkEvent {
  type: 'historical_chunk'
  subscription_id: string
  chunk_index: number
  timeframe: Timeframe
  rows: ChartCandleRow[]
}

/**
 * Columnar form of {@link HistoricalChunkEvent} (when `historical_format:'columnar'`).
 * Parallel arrays indexed `[i]`; reconstruct a {@link ChartCandleRow} per `i`.
 * A `null` indicator field value means that field is absent for that row.
 * Decimal columns (OHLCV + indicator fields) are {@link DecimalString}s.
 */
export interface HistoricalChunkColumnarEvent {
  type: 'historical_chunk_columnar'
  subscription_id: string
  chunk_index: number
  timeframe: Timeframe
  columns: {
    timestamp_ms: TimestampMs[]
    open: DecimalString[]
    high: DecimalString[]
    low: DecimalString[]
    close: DecimalString[]
    volume: DecimalString[]
    status?: string[]
    source?: string[]
    updated_at_ms?: (TimestampMs | null)[]
    confirmed_at_ms?: (TimestampMs | null)[]
    /** `indicators[display_label][field][i]` → value (or null = absent). */
    indicators?: Record<string, Record<string, (DecimalString | null)[]>>
  }
}

/** Terminal historical event: backfill is done, live updates follow. */
export interface HistoricalCompleteEvent {
  type: 'historical_complete'
  subscription_id: string
  chunks: number
  rows: number
  timeframes: Timeframe[]
}

/**
 * A live candle update. Apply per `subscription_id` by increasing `sequence`;
 * dedupe rows by `[timeframe, candle.timestamp_ms]` (same ts replaces).
 */
export interface LiveUpdateEvent {
  type: 'live_update'
  subscription_id: string
  sequence: number
  row: ChartCandleRow
}

/** Acknowledges a control command (unsubscribe / upsert / patch). */
export interface ControlAckEvent {
  type: 'control_ack'
  status: RuntimeControlStatus
  message: string
  /** Defaults to `false`. */
  restart_required?: boolean
  outcome?: StateControlOutcome | null
  target_runtime_id?: string | null
}

/** An error correlated (usually) to a request by the envelope `request_id`. */
export interface ErrorEvent {
  type: 'error'
  code: ErrorCode
  message: string
  retryable: boolean
}

/** Response to `list_auth_positions`: a full snapshot of position rows. */
export interface AuthPositionsEvent {
  type: 'auth_positions'
  positions: ChartAuthPosition[]
}

/**
 * Streamed position set for a `subscribe_auth_positions`. Each event is a FULL
 * replacement; apply per `subscription_id` by increasing `sequence`.
 */
export interface AuthPositionsUpdateEvent {
  type: 'auth_positions_update'
  subscription_id: string
  sequence: number
  positions: ChartAuthPosition[]
}

/** A page of closed-position history (`list_auth_position_history`). */
export interface AuthPositionHistoryEvent {
  type: 'auth_position_history'
  positions: ChartAuthPosition[]
  /** Opaque cursor for the next page; null when exhausted. */
  next_cursor?: string | null
  total_count: number
}

/** Response to `get_auth_position_audit`. */
export interface AuthPositionAuditEvent {
  type: 'auth_position_audit'
  audit: ChartAuthPositionAudit
}

/**
 * Streamed audit bundle for a `subscribe_auth_position_audit`. Each event
 * replaces the displayed bundle; apply per `subscription_id` by `sequence`.
 */
export interface AuthPositionAuditUpdateEvent {
  type: 'auth_position_audit_update'
  subscription_id: string
  sequence: number
  audit: ChartAuthPositionAudit
}

// ──────────────────────────────────────────────── historical search ──────

/** A single field comparison the gateway evaluated to produce a match. */
export interface SearchObservation {
  indicator: string
  field: string
  bar_offset: number
  value: number
}

/** Detection-box context attached to a CRUP-style match (`crup_context`). */
export interface SearchCrupContext {
  anchor_timeframe: Timeframe
  bull_confluence_timeframe_count: number
  bear_confluence_timeframe_count: number
  detection_box_timeframes: Array<{
    timeframe: Timeframe
    side: string
    box_count: number
  }>
}

/** The chart window to load when the user opens a match (`chart_window`). */
export interface SearchChartWindow {
  timeframe: Timeframe
  start_ms: TimestampMs
  end_ms: TimestampMs
  before_bars: number
  after_bars: number
}

/**
 * Causal Barrier Symmetric PLAN for a matched row (`SearchBarrierSymmetricPlan`):
 * chartable forward target/stop levels computed from data up to the row. Prices
 * are {@link DecimalString}s. Band prices may be absent when ATR can't be formed.
 */
export interface SearchBarrierSymmetricPlan {
  kind: 'BARRIER_SYMMETRIC'
  target_spec_hash: string
  timeframe: Timeframe
  window_fwd: number
  window_atr: number
  k_take: number
  k_stop: number
  fees_bps: number
  slippage_bps: number
  half_spread_bps: number
  entry_price: DecimalString
  atr?: DecimalString
  atr_pct?: DecimalString
  sigma_log?: DecimalString
  cost_log?: DecimalString
  take_up_price?: DecimalString
  stop_up_price?: DecimalString
  take_dn_price?: DecimalString
  stop_dn_price?: DecimalString
  reward_risk_ratio?: number
  expiry_timestamp_ms?: TimestampMs
  /** When false, the outcome can't mature yet — render pending, NOT a miss. */
  evaluable_outcome: boolean
}

/** Matured Barrier Symmetric OUTCOME (`SearchBarrierSymmetricOutcome`), optional. */
export interface SearchBarrierSymmetricOutcome {
  target_spec_hash: string
  matured_at_ms: TimestampMs
  evaluable_outcome: boolean
  bull_hit: boolean
  bear_hit: boolean
  strength_up?: number | null
  strength_dn?: number | null
  mae_up?: number | null
  mae_dn?: number | null
  time_up?: number | null
  time_dn?: number | null
  quality_up?: number | null
  quality_dn?: number | null
}

/** Cohort analytics for the spec (`SearchBarrierSymmetricAnalyticsSummary`), optional. */
export interface SearchBarrierSymmetricAnalyticsSummary {
  target_spec_hash: string
  sample_count: number
  bull_hit_count: number
  bear_hit_count: number
  bull_hit_rate?: number
  bear_hit_rate?: number
  bull_wilson_lower_bound?: number
  bear_wilson_lower_bound?: number
  reward_risk_ratio?: number
  bull_expected_value?: number
  bear_expected_value?: number
  bull_full_kelly?: number
  bear_full_kelly?: number
}

/** Barrier Symmetric evaluation attached to a match (`SearchBarrierSymmetricEvaluation`). */
export interface SearchBarrierSymmetricEvaluation {
  target_spec_hash: string
  plan: SearchBarrierSymmetricPlan
  outcome?: SearchBarrierSymmetricOutcome | null
  analytics_summary?: SearchBarrierSymmetricAnalyticsSummary | null
}

/** One entry of {@link SearchMatchResult.target_evaluations}. */
export interface SearchTargetEvaluation {
  type: 'barrier_symmetric'
  evaluation: SearchBarrierSymmetricEvaluation
}

/** A matched bar carried by {@link SearchMatchEvent} (`result`). */
export interface SearchMatchResult {
  venue: string
  symbol: string
  timeframe: Timeframe
  timestamp_ms: TimestampMs
  candle: CandleSnapshot
  /** Indicator outputs at the match bar, keyed by DISPLAY LABEL. */
  indicators: RowIndicators
  observations: SearchObservation[]
  /** `bull` / `bear` / `neutral` (open string). */
  side: string
  crup_context?: SearchCrupContext | null
  chart_window: SearchChartWindow
  /** Target enrichment requested via {@link SearchQuery.target_specs}. */
  target_evaluations?: SearchTargetEvaluation[]
}

/** First event after `search_candles`: the query was accepted, the scan begins. */
export interface SearchAcceptedEvent {
  type: 'search_accepted'
  search_id: string
  venue: string
  symbols: string[]
  timeframes: Timeframe[]
  range: HistoricalCandleRange
  result_window?: SearchResultWindow
}

/** Progress during a search scan. */
export interface SearchProgressEvent {
  type: 'search_progress'
  search_id: string
  phase: string
  current: number
  total?: number | null
  message?: string
}

/** One bar that satisfied the condition; apply in `sequence` order. */
export interface SearchMatchEvent {
  type: 'search_match'
  search_id: string
  sequence: number
  result: SearchMatchResult
}

/** Terminal: the scan finished (possibly with 0 matches). */
export interface SearchCompleteEvent {
  type: 'search_complete'
  search_id: string
  matches: number
  scanned_rows: number
  symbols: string[]
  timeframes: Timeframe[]
}

/** Terminal: the search was cancelled (`cancel_search` / tab close). */
export interface SearchCancelledEvent {
  type: 'search_cancelled'
  search_id: string
  /** Matches emitted before cancellation, when reported. */
  matches?: number
}

/** Terminal: the search failed; any partial matches already streamed are kept. */
export interface SearchFailedEvent {
  type: 'search_failed'
  search_id: string
  code?: ErrorCode
  message?: string
  /** The gateway puts the human-readable failure detail here (code/message may be absent). */
  error?: string
}

// ───────────────────────────────────────────── strategies / backtests ──────

/** One tunable strategy parameter (`ChartStrategyParameterDescriptor`). */
export interface ChartStrategyParameterDescriptor {
  name: string
  /** e.g. `'integer'` | `'decimal'`. */
  type: string
  /** Default value — decimal params are {@link DecimalString}; may be null. */
  default_value?: DecimalString | number | null
  recommended_sweep?: { start: DecimalString | number; step: DecimalString | number; end: DecimalString | number } | null
  description?: string | null
}

/** A strategy descriptor (`ChartStrategyDescriptor`). */
export interface ChartStrategyDescriptor {
  schema_version?: SchemaVersion
  name: string
  display_name: string
  default_trade_timeframe: Timeframe
  default_context_timeframes: Timeframe[]
  /** `{kind, timeframe, source, params}` — same shape as a search indicator. */
  default_indicators: SearchIndicatorSpec[]
  parameters: ChartStrategyParameterDescriptor[]
}

/** A backtest run summary row (`ChartBacktestRunSummary`). */
export interface ChartBacktestRunSummary {
  run_id: string
  strategy: string
  venue: string
  symbols: string[]
  trade_timeframe: Timeframe
  status: BacktestRunStatus
  started_at_ms?: TimestampMs
  completed_at_ms?: TimestampMs | null
  /** Decimal-string (or numeric) metric values keyed by name. */
  metrics?: Record<string, DecimalString | number>
}

/** One progress event item (`ChartBacktestProgressEvent`). */
export interface ChartBacktestProgressItem {
  run_id: string
  kind: 'accepted' | 'progress' | 'completed' | 'failed'
  completed_steps?: number
  total_steps?: number
  message?: string
}

/** A backtest trade marker (`ChartBacktestTradeOverlay`). Decimals as strings. */
export interface ChartBacktestTradeOverlay {
  symbol: string
  timestamp_ms: TimestampMs
  /** `'Buy'` | `'Sell'`. */
  side: string
  quantity: DecimalString
  price: DecimalString
  fee?: DecimalString
}

/** A stop-loss / take-profit level with lifecycle (`ChartBacktestPriceLevelOverlay`). */
export interface ChartBacktestPriceLevelOverlay {
  symbol: string
  /** e.g. `'stop_loss'` | `'take_profit'`. */
  kind: string
  side: string
  price: DecimalString
  quantity?: DecimalString
  activated_at_ms?: TimestampMs | null
  cleared_at_ms?: TimestampMs | null
  triggered_at_ms?: TimestampMs | null
}

/** One account/equity-curve sample (`ChartBacktestEquityCurvePoint`). Decimals as strings. */
export interface ChartBacktestEquityCurvePoint {
  timestamp_ms: TimestampMs
  equity: DecimalString
  cash: DecimalString
  position_quantity: DecimalString
  drawdown: DecimalString
  drawdown_pct?: DecimalString | null
}

/**
 * Formatting metadata for a run metric (`ChartBacktestMetricDescriptor`). `unit`
 * tells the UI how to render the decimal-string value. IMPORTANT: `percent`
 * values are decimal FRACTIONS (`"0.32"` = 32%).
 */
export interface ChartBacktestMetricDescriptor {
  name: string
  unit: 'currency' | 'ratio' | 'percent' | 'count' | 'bps' | (string & {})
  precision?: number
  description?: string
}

/** A period-return row (`ChartBacktestPeriodReturn`). Decimals as strings. */
export interface ChartBacktestPeriodReturn {
  period: string
  start_ts_ms: TimestampMs
  end_ts_ms: TimestampMs
  starting_equity: DecimalString
  ending_equity: DecimalString
  return_amount: DecimalString
  return_pct: DecimalString
}

/**
 * An indicator-style plot descriptor for an account series
 * (`ChartBacktestSeriesDescriptor`) — same descriptor-driven plotting as
 * indicator `view.layers`.
 */
export interface ChartBacktestSeriesDescriptor {
  id: string
  display_name: string
  /** e.g. `'line'` | `'histogram'`. */
  kind: string
  fields: string[]
  target: { surface: string; pane?: string }
  style?: Record<string, unknown>
  visible_by_default?: boolean
}

/** A trade + its chart window (`ChartBacktestTradeChartOverlay`). */
export interface ChartBacktestTradeChartOverlay {
  trade: ChartBacktestTradeOverlay
  chart_window: {
    venue: string
    symbol: string
    timeframe: Timeframe
    anchor_timestamp_ms?: TimestampMs
    start_ms: TimestampMs
    end_ms: TimestampMs
    before_bars?: number
    after_bars?: number
  }
}

/** Response to `list_strategies`. */
export interface StrategiesEvent {
  type: 'strategies'
  strategies: ChartStrategyDescriptor[]
}

/** Response to `get_strategy`. */
export interface StrategyEvent {
  type: 'strategy'
  strategy: ChartStrategyDescriptor
}

/** Response to `list_backtest_runs`. */
export interface BacktestRunsEvent {
  type: 'backtest_runs'
  runs: ChartBacktestRunSummary[]
}

/** Response to `get_backtest_run`: `artifact` is PASS-THROUGH JSON (feature-detect). */
export interface BacktestRunEvent {
  type: 'backtest_run'
  run_id: string
  artifact: unknown
}

/** Response to `get_backtest_progress` (one-shot). */
export interface BacktestProgressEvent {
  type: 'backtest_progress'
  run_id: string
  events: ChartBacktestProgressItem[]
}

/**
 * Streamed progress for `subscribe_backtest_progress`. Each update carries the
 * FULL current event list; apply per `subscription_id` by increasing `sequence`.
 */
export interface BacktestProgressUpdateEvent {
  type: 'backtest_progress_update'
  subscription_id: string
  sequence: number
  run_id: string
  events: ChartBacktestProgressItem[]
}

/** Response to `get_backtest_chart_overlays`. */
export interface BacktestChartOverlaysEvent {
  type: 'backtest_chart_overlays'
  run_id: string
  parameter_run_index?: number | null
  fold_index?: number | null
  venue: string
  timeframe: Timeframe
  overlays: ChartBacktestTradeChartOverlay[]
}

/** Response to `get_backtest_report_overlays`. */
export interface BacktestReportOverlaysEvent {
  type: 'backtest_report_overlays'
  run_id: string
  parameter_run_index?: number | null
  fold_index?: number | null
  venue: string
  trade_timeframe: Timeframe
  trades: ChartBacktestTradeOverlay[]
  price_levels: ChartBacktestPriceLevelOverlay[]
  equity_curve: ChartBacktestEquityCurvePoint[]
  period_returns: ChartBacktestPeriodReturn[]
  series_descriptors: ChartBacktestSeriesDescriptor[]
  /** Formatting metadata for run metrics (see {@link ChartBacktestMetricDescriptor}). */
  metric_descriptors?: ChartBacktestMetricDescriptor[]
}

/** Discriminated union of gateway event payloads (`ChartFeedEventKind`). */
export type ChartFeedEventKind =
  | CandleStatesEvent
  | SubscriptionAcceptedEvent
  | SubscriptionAcceptedSummaryEvent
  | HistoricalAckEvent
  | HistoricalProgressEvent
  | HistoricalChunkEvent
  | HistoricalChunkColumnarEvent
  | HistoricalCompleteEvent
  | LiveUpdateEvent
  | ControlAckEvent
  | ErrorEvent
  | AuthPositionsEvent
  | AuthPositionsUpdateEvent
  | AuthPositionHistoryEvent
  | AuthPositionAuditEvent
  | AuthPositionAuditUpdateEvent
  | SearchAcceptedEvent
  | SearchProgressEvent
  | SearchMatchEvent
  | SearchCompleteEvent
  | SearchCancelledEvent
  | SearchFailedEvent
  | StrategiesEvent
  | StrategyEvent
  | BacktestRunsEvent
  | BacktestRunEvent
  | BacktestProgressEvent
  | BacktestProgressUpdateEvent
  | BacktestChartOverlaysEvent
  | BacktestReportOverlaysEvent

/** Discriminant of {@link ChartFeedEventKind}. */
export type ChartFeedEventType = ChartFeedEventKind['type']

/** The envelope every gateway → client message is wrapped in. */
export interface ChartFeedEvent {
  /** Defaults to `1`. */
  schema_version?: SchemaVersion
  /** Echoed request id; null on unsolicited live updates. */
  request_id?: string | null
  event: ChartFeedEventKind
}

// ─────────────────────────────────────────────────────── narrowing helpers ──

/**
 * Pull the payload for a specific event `type` out of {@link ChartFeedEventKind}.
 * e.g. `EventOf<'live_update'>` → {@link LiveUpdateEvent}.
 */
export type EventOf<T extends ChartFeedEventType> = Extract<ChartFeedEventKind, { type: T }>

/**
 * Pull the command shape for a specific command `type` out of
 * {@link ChartClientCommand}. e.g. `CommandOf<'subscribe_candles'>`.
 */
export type CommandOf<T extends ChartClientCommandType> = Extract<ChartClientCommand, { type: T }>
