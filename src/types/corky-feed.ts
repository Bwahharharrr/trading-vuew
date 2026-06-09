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

/** Discriminated union of client commands (`ChartClientCommand`). */
export type ChartClientCommand =
  | ListCandleStatesCommand
  | SubscribeCandlesCommand
  | UnsubscribeCommand
  | UpsertCandleStateCommand
  | PatchCandleStateCommand

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

/** Discriminated union of gateway event payloads (`ChartFeedEventKind`). */
export type ChartFeedEventKind =
  | CandleStatesEvent
  | SubscriptionAcceptedEvent
  | HistoricalAckEvent
  | HistoricalProgressEvent
  | HistoricalChunkEvent
  | HistoricalCompleteEvent
  | LiveUpdateEvent
  | ControlAckEvent
  | ErrorEvent

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
