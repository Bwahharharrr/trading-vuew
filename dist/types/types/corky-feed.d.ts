/**
 * A decimal value transported as a string to preserve exact precision
 * (prices, volumes, indicator outputs). Convert with `Number(s)` for
 * rendering; keep the raw string where exact text is needed (tooltips).
 */
export type DecimalString = string;
/** Unix epoch milliseconds, signed 64-bit. Safe as a JS `number`. */
export type TimestampMs = number;
/** Protocol schema version. Always `1` for this contract. */
export type SchemaVersion = 1;
/**
 * Timeframe label (e.g. `"1m"`, `"5m"`, `"1h"`, `"1D"`, `"1W"`, `"1M"`).
 * The gateway advertises a fixed set, but the wire type is an open string.
 */
export type Timeframe = string;
/** Lifecycle state of a candle state or indicator (`ServiceState`). */
export type ServiceState = 'Starting' | 'Running' | 'Ready' | 'Degraded' | 'Reconnecting' | 'Stopping' | 'Stopped' | 'Failed' | 'Unknown';
/** Status reported on a `control_ack` (`RuntimeControlStatus`). */
export type RuntimeControlStatus = 'Accepted' | 'Rejected' | 'Applied' | 'Failed';
/** Detailed outcome of a state-control command (`StateControlOutcome`). */
export type StateControlOutcome = 'applied_hot' | 'accepted_pending' | 'requires_restart' | 'noop' | 'rejected' | 'failed';
/** Catalog of error codes the gateway may emit. */
export type KnownErrorCode = 'unsupported_schema_version' | 'invalid_request_json' | 'state_not_found' | 'runtime_not_found' | 'invalid_control_command' | 'control_response_timeout' | 'control_receive_error' | 'historical_query_failed' | 'auth_position_history_unavailable' | 'auth_position_audit_unavailable' | 'stateful_websocket_required';
/**
 * An error code on the wire: a {@link KnownErrorCode} or any future string the
 * gateway may introduce.
 */
export type ErrorCode = KnownErrorCode | (string & {});
/** Subscribe to the latest `limit` closed candles. */
export interface ChartHistoryRangeLatest {
    type: 'latest';
    limit: number;
}
/** Subscribe to a fixed `[start_ms, end_ms]` window. */
export interface ChartHistoryRangeStartEnd {
    type: 'start_end';
    start_ms: TimestampMs;
    end_ms: TimestampMs;
}
/** Subscribe to everything from inception up to `end_ms` (or now if null). */
export interface ChartHistoryRangeSinceInception {
    type: 'since_inception';
    end_ms?: TimestampMs | null;
}
/** Range a client may request on `subscribe_candles` (`ChartHistoryRange`). */
export type ChartHistoryRange = ChartHistoryRangeLatest | ChartHistoryRangeStartEnd | ChartHistoryRangeSinceInception;
/**
 * Range the gateway reports it actually served on `historical_ack`
 * (`HistoricalCandleRange`). Differs from {@link ChartHistoryRange}: the
 * `latest` variant carries a resolved `end_ms`.
 */
export type HistoricalCandleRange = {
    type: 'start_end';
    start_ms: TimestampMs;
    end_ms: TimestampMs;
} | {
    type: 'latest';
    limit: number;
    end_ms?: TimestampMs | null;
} | {
    type: 'since_inception';
    end_ms?: TimestampMs | null;
};
/** A single OHLCV candle (decimal prices/volume as strings). */
export interface CandleSnapshot {
    timestamp_ms: TimestampMs;
    open: DecimalString;
    high: DecimalString;
    low: DecimalString;
    close: DecimalString;
    volume: DecimalString;
}
/**
 * Indicator outputs attached to a row, keyed by `display_label` (e.g.
 * `"sma:20"`), then by output name (e.g. `"sma"`) → decimal value.
 */
export type RowIndicators = Record<string, Record<string, DecimalString>>;
/** A historical / live candle row (`ChartCandleRow`). */
export interface ChartCandleRow {
    timeframe: Timeframe;
    candle: CandleSnapshot;
    /** Defaults to `{}` when omitted. */
    indicators?: RowIndicators;
}
/** A four-slot candle preview for a timeframe (`CandlePreview`). */
export interface CandlePreview {
    first?: CandleSnapshot | null;
    previous_2_closed?: CandleSnapshot | null;
    previous_1_closed?: CandleSnapshot | null;
    current?: CandleSnapshot | null;
}
/** Per-timeframe range/buffer/lifecycle descriptor (`ChartTimeframeRange`). */
export interface ChartTimeframeRange {
    timeframe: Timeframe;
    source_timeframe: Timeframe;
    live_source?: string | null;
    seed_source?: string | null;
    held_count: number;
    buffer_target: number;
    effective_target_count?: number | null;
    first_ts_ms?: TimestampMs | null;
    last_closed_ts_ms?: TimestampMs | null;
    current_ts_ms?: TimestampMs | null;
    ready: boolean;
    readiness_status?: string | null;
    stale: boolean;
    stale_reason?: string | null;
    preview?: CandlePreview;
}
/** Indicator view layer kind (chart-feed v1). */
export type IndicatorViewLayerKind = 'line' | 'histogram' | 'band' | 'candle_color' | 'box' | 'marker' | 'diagnostic';
/** Where a view layer renders. */
export interface IndicatorViewTarget {
    surface?: 'price' | 'pane';
    pane?: string | null;
}
/** One default-render layer of an indicator's view. */
export interface IndicatorViewLayerSpec {
    id: string;
    label: string;
    kind: IndicatorViewLayerKind;
    target?: IndicatorViewTarget;
    /** Output names to read from the indicator values map. Default = all outputs. */
    fields?: string[];
    /** Client rendering hints (free-form). */
    style?: Record<string, string>;
    /** Initial visibility; hidden layers stay available for user opt-in. */
    visible_by_default?: boolean;
}
/** Default rendering intent for an indicator (chart-feed `view`). */
export interface IndicatorViewSpec {
    version?: number;
    layers?: IndicatorViewLayerSpec[];
}
/** Indicator descriptor advertised in discovery (`ChartIndicatorDescriptor`). */
export interface ChartIndicatorDescriptor {
    kind: string;
    display_label: string;
    timeframe: Timeframe;
    source: string;
    state: ServiceState;
    readiness_status?: string | null;
    warmup: number;
    samples_seen: number;
    ready: boolean;
    last_timestamp_ms?: TimestampMs | null;
    /** Output names this indicator emits, e.g. `["sma"]`. Defaults to `[]`. */
    outputs?: string[];
    /** Latest output values keyed by output name. Defaults to `{}`. */
    values?: Record<string, DecimalString>;
    /** Default rendering intent (preferred over plotting every output). */
    view?: IndicatorViewSpec;
}
/** A maintained candle state (`ChartCandleStateDescriptor`). */
export interface ChartCandleStateDescriptor {
    runtime_id: string;
    shard_id?: string | null;
    state_id: string;
    venue: string;
    symbol: string;
    funding_period?: string | null;
    state: ServiceState;
    lifecycle_reason?: string | null;
    source_channel: string;
    source_timeframe: Timeframe;
    seed_source?: string | null;
    live_source?: string | null;
    previous_live_source?: string | null;
    live_source_changed_at_ms?: TimestampMs | null;
    requested_timeframes?: Timeframe[];
    available_timeframes?: Timeframe[];
    buffer_target: number;
    ranges?: ChartTimeframeRange[];
    indicators?: ChartIndicatorDescriptor[];
}
/**
 * Origin of a position row: `current` = open position from the authenticated
 * positions feed; `historical` = closed position from the positions-history store.
 */
export type ChartAuthPositionSource = 'current' | 'historical';
/** A private-account position row (`ChartAuthPosition`). */
export interface ChartAuthPosition {
    runtime_id: string;
    account_id: string;
    venue: string;
    source: ChartAuthPositionSource;
    symbol: string;
    /** Stable integer id; required for {@link GetAuthPositionAuditCommand}. */
    position_id: number;
    status: string;
    side: string;
    amount: DecimalString;
    base_price: DecimalString;
    pl?: DecimalString | null;
    pl_perc?: DecimalString | null;
    liquidation_price?: DecimalString | null;
    leverage?: DecimalString | null;
    collateral?: DecimalString | null;
    collateral_min?: DecimalString | null;
    opened_at_ms?: TimestampMs | null;
    closed_at_ms?: TimestampMs | null;
    updated_at_ms?: TimestampMs | null;
}
/** Completeness of a reconstructed position audit (`summary.status`). */
export type ChartAuthPositionAuditStatus = 'complete' | 'degraded' | 'incomplete' | 'missing';
/** The position identity/window inside an audit bundle. */
export interface ChartAuthPositionAuditPosition {
    source?: ChartAuthPositionSource | null;
    status: string;
    side: string;
    amount: DecimalString;
    base_price: DecimalString;
    opened_at_ms?: TimestampMs | null;
    closed_at_ms?: TimestampMs | null;
    updated_at_ms?: TimestampMs | null;
}
/** Reconciliation summary for an audit bundle. */
export interface ChartAuthPositionAuditSummary {
    status: ChartAuthPositionAuditStatus;
    order_count: number;
    trade_count: number;
    trade_amount_sum: DecimalString;
    expected_position_amount: DecimalString;
    amount_delta: DecimalString;
    /** Fees keyed by currency. Defaults to `{}`. */
    fees_by_currency?: Record<string, DecimalString>;
    /** Defaults to `[]`. */
    order_ids?: number[];
    /** Defaults to `[]`. */
    trade_ids?: number[];
    /** Human-readable reasons when not `complete`. Defaults to `[]`. */
    reasons?: string[];
}
/** A linked order row in an audit bundle. */
export interface ChartAuthPositionAuditOrder {
    order_id: number;
    client_order_id: number;
    symbol: string;
    created_at_ms?: TimestampMs | null;
    updated_at_ms?: TimestampMs | null;
    amount?: DecimalString | null;
    amount_original?: DecimalString | null;
    order_type: string;
    status?: string | null;
    price?: DecimalString | null;
    price_avg?: DecimalString | null;
    /** Provenance, e.g. `"rest:orders_hist"`. */
    source: string;
}
/** A linked trade row in an audit bundle. */
export interface ChartAuthPositionAuditTrade {
    trade_id: number;
    order_id: number;
    client_order_id?: number | null;
    symbol: string;
    execution_timestamp_ms: TimestampMs;
    amount: DecimalString;
    price: DecimalString;
    order_type: string;
    order_price: DecimalString;
    maker: boolean;
    fee?: DecimalString | null;
    fee_currency?: string | null;
    /** Provenance, e.g. `"rest:trades_hist"`. */
    source: string;
}
/** The persisted audit bundle for one position (`ChartAuthPositionAudit`). */
export interface ChartAuthPositionAudit {
    venue: string;
    account_id: string;
    symbol: string;
    position_id: number;
    position: ChartAuthPositionAuditPosition;
    summary: ChartAuthPositionAuditSummary;
    /** Defaults to `[]` (or omitted when `include_orders=false`). */
    orders?: ChartAuthPositionAuditOrder[];
    /** Defaults to `[]` (or omitted when `include_trades=false`). */
    trades?: ChartAuthPositionAuditTrade[];
    updated_at_ms?: TimestampMs | null;
}
/**
 * Spec for an indicator a client wants the runtime to maintain
 * (`PublicIndicatorSpec`).
 */
export interface PublicIndicatorSpec {
    kind: string;
    timeframe: Timeframe;
    /** Input series, defaults to `"close"`. */
    source?: string;
    /** Free-form string params, e.g. `{ period: "20" }`. Defaults to `{}`. */
    params?: Record<string, string>;
    version?: string | null;
}
/** Discover maintained candle states and their timeframes/indicators. */
export interface ListCandleStatesCommand {
    type: 'list_candle_states';
    /** Filter to a single venue. Defaults to null (all venues). */
    venue?: string | null;
}
/** Subscribe to one symbol/timeframe: historical rows then live updates. */
export interface SubscribeCandlesCommand {
    type: 'subscribe_candles';
    subscription_id: string;
    venue: string;
    symbol: string;
    timeframe: Timeframe;
    target_runtime_id?: string | null;
    funding_period?: string | null;
    /** Defaults to `{ type: 'latest', limit: 200 }`. */
    range?: ChartHistoryRange;
    /** Defaults to `false`. */
    include_indicators?: boolean;
    /** Defaults to `[]`. */
    indicators?: PublicIndicatorSpec[];
    /** Rows per historical chunk. Defaults to null (gateway chooses). */
    chunk_rows?: number | null;
}
/** Stop live updates for a subscription (idempotent; runtime state stays). */
export interface UnsubscribeCommand {
    type: 'unsubscribe';
    subscription_id: string;
}
/** Create or replace desired candle state for a symbol/timeframes. */
export interface UpsertCandleStateCommand {
    type: 'upsert_candle_state';
    venue: string;
    symbol: string;
    timeframes: Timeframe[];
    target_runtime_id?: string | null;
    funding_period?: string | null;
    /** Defaults to `[]`. */
    indicators?: PublicIndicatorSpec[];
    buffer?: number | null;
}
/** Patch an existing candle state, leaving unspecified fields untouched. */
export interface PatchCandleStateCommand {
    type: 'patch_candle_state';
    venue: string;
    symbol: string;
    target_runtime_id?: string | null;
    funding_period?: string | null;
    timeframes?: Timeframe[] | null;
    indicators?: PublicIndicatorSpec[] | null;
    buffer?: number | null;
}
/**
 * One-shot snapshot of private-account positions. All filters optional; venue
 * and symbol match ASCII case-insensitively. Responds with `auth_positions`.
 */
export interface ListAuthPositionsCommand {
    type: 'list_auth_positions';
    venue?: string | null;
    account_id?: string | null;
    symbol?: string | null;
    /** Include closed/historical rows alongside open ones. Defaults to `false`. */
    include_historical?: boolean;
}
/**
 * Stream private-account positions: each `auth_positions_update` is a FULL
 * replacement set for the subscription (not a patch). Apply by `sequence`.
 */
export interface SubscribeAuthPositionsCommand {
    type: 'subscribe_auth_positions';
    subscription_id: string;
    venue?: string | null;
    account_id?: string | null;
    symbol?: string | null;
    /** Defaults to `false`. */
    include_historical?: boolean;
}
/**
 * Paged closed-position history. `cursor` is opaque — pass `next_cursor` back
 * unchanged for the next page. Responds with `auth_position_history`.
 */
export interface ListAuthPositionHistoryCommand {
    type: 'list_auth_position_history';
    venue: string;
    account_id: string;
    symbol?: string | null;
    /** Page size. Defaults to `100`. */
    limit?: number;
    /** Opaque page cursor; omit for the first page. */
    cursor?: string | null;
}
/** One-shot audit bundle for a selected position. Responds with `auth_position_audit`. */
export interface GetAuthPositionAuditCommand {
    type: 'get_auth_position_audit';
    venue: string;
    account_id: string;
    symbol: string;
    position_id: number;
    /** Defaults to `true`. */
    include_orders?: boolean;
    /** Defaults to `true`. */
    include_trades?: boolean;
}
/**
 * Stream the audit bundle for a selected position: each
 * `auth_position_audit_update` replaces the displayed bundle. Apply by `sequence`.
 */
export interface SubscribeAuthPositionAuditCommand {
    type: 'subscribe_auth_position_audit';
    subscription_id: string;
    venue: string;
    account_id: string;
    symbol: string;
    position_id: number;
    /** Defaults to `true`. */
    include_orders?: boolean;
    /** Defaults to `true`. */
    include_trades?: boolean;
}
/** Discriminated union of client commands (`ChartClientCommand`). */
export type ChartClientCommand = ListCandleStatesCommand | SubscribeCandlesCommand | UnsubscribeCommand | UpsertCandleStateCommand | PatchCandleStateCommand | ListAuthPositionsCommand | SubscribeAuthPositionsCommand | ListAuthPositionHistoryCommand | GetAuthPositionAuditCommand | SubscribeAuthPositionAuditCommand;
/** Discriminant of {@link ChartClientCommand}. */
export type ChartClientCommandType = ChartClientCommand['type'];
/** The envelope every client → gateway message is wrapped in. */
export interface ChartClientRequest {
    /** Defaults to `1`; the gateway rejects unknown versions. */
    schema_version?: SchemaVersion;
    /** Client-generated, unique per outstanding request; echoed on events. */
    request_id: string;
    command: ChartClientCommand;
}
/** Response to `list_candle_states`. */
export interface CandleStatesEvent {
    type: 'candle_states';
    states: ChartCandleStateDescriptor[];
}
/** First event after a successful `subscribe_candles`. */
export interface SubscriptionAcceptedEvent {
    type: 'subscription_accepted';
    subscription_id: string;
    state: ChartCandleStateDescriptor;
    timeframe: Timeframe;
    range: ChartHistoryRange;
}
/** Acknowledges the historical query and the range that will be served. */
export interface HistoricalAckEvent {
    type: 'historical_ack';
    subscription_id: string;
    venue: string;
    symbol: string;
    timeframes: Timeframe[];
    range: HistoricalCandleRange;
}
/** Progress during the historical backfill. */
export interface HistoricalProgressEvent {
    type: 'historical_progress';
    subscription_id: string;
    phase: string;
    current: number;
    /** Total units for this phase, when known. */
    total?: number | null;
    message: string;
}
/** A batch of historical rows; append in `chunk_index` then row order. */
export interface HistoricalChunkEvent {
    type: 'historical_chunk';
    subscription_id: string;
    chunk_index: number;
    timeframe: Timeframe;
    rows: ChartCandleRow[];
}
/** Terminal historical event: backfill is done, live updates follow. */
export interface HistoricalCompleteEvent {
    type: 'historical_complete';
    subscription_id: string;
    chunks: number;
    rows: number;
    timeframes: Timeframe[];
}
/**
 * A live candle update. Apply per `subscription_id` by increasing `sequence`;
 * dedupe rows by `[timeframe, candle.timestamp_ms]` (same ts replaces).
 */
export interface LiveUpdateEvent {
    type: 'live_update';
    subscription_id: string;
    sequence: number;
    row: ChartCandleRow;
}
/** Acknowledges a control command (unsubscribe / upsert / patch). */
export interface ControlAckEvent {
    type: 'control_ack';
    status: RuntimeControlStatus;
    message: string;
    /** Defaults to `false`. */
    restart_required?: boolean;
    outcome?: StateControlOutcome | null;
    target_runtime_id?: string | null;
}
/** An error correlated (usually) to a request by the envelope `request_id`. */
export interface ErrorEvent {
    type: 'error';
    code: ErrorCode;
    message: string;
    retryable: boolean;
}
/** Response to `list_auth_positions`: a full snapshot of position rows. */
export interface AuthPositionsEvent {
    type: 'auth_positions';
    positions: ChartAuthPosition[];
}
/**
 * Streamed position set for a `subscribe_auth_positions`. Each event is a FULL
 * replacement; apply per `subscription_id` by increasing `sequence`.
 */
export interface AuthPositionsUpdateEvent {
    type: 'auth_positions_update';
    subscription_id: string;
    sequence: number;
    positions: ChartAuthPosition[];
}
/** A page of closed-position history (`list_auth_position_history`). */
export interface AuthPositionHistoryEvent {
    type: 'auth_position_history';
    positions: ChartAuthPosition[];
    /** Opaque cursor for the next page; null when exhausted. */
    next_cursor?: string | null;
    total_count: number;
}
/** Response to `get_auth_position_audit`. */
export interface AuthPositionAuditEvent {
    type: 'auth_position_audit';
    audit: ChartAuthPositionAudit;
}
/**
 * Streamed audit bundle for a `subscribe_auth_position_audit`. Each event
 * replaces the displayed bundle; apply per `subscription_id` by `sequence`.
 */
export interface AuthPositionAuditUpdateEvent {
    type: 'auth_position_audit_update';
    subscription_id: string;
    sequence: number;
    audit: ChartAuthPositionAudit;
}
/** Discriminated union of gateway event payloads (`ChartFeedEventKind`). */
export type ChartFeedEventKind = CandleStatesEvent | SubscriptionAcceptedEvent | HistoricalAckEvent | HistoricalProgressEvent | HistoricalChunkEvent | HistoricalCompleteEvent | LiveUpdateEvent | ControlAckEvent | ErrorEvent | AuthPositionsEvent | AuthPositionsUpdateEvent | AuthPositionHistoryEvent | AuthPositionAuditEvent | AuthPositionAuditUpdateEvent;
/** Discriminant of {@link ChartFeedEventKind}. */
export type ChartFeedEventType = ChartFeedEventKind['type'];
/** The envelope every gateway → client message is wrapped in. */
export interface ChartFeedEvent {
    /** Defaults to `1`. */
    schema_version?: SchemaVersion;
    /** Echoed request id; null on unsolicited live updates. */
    request_id?: string | null;
    event: ChartFeedEventKind;
}
/**
 * Pull the payload for a specific event `type` out of {@link ChartFeedEventKind}.
 * e.g. `EventOf<'live_update'>` → {@link LiveUpdateEvent}.
 */
export type EventOf<T extends ChartFeedEventType> = Extract<ChartFeedEventKind, {
    type: T;
}>;
/**
 * Pull the command shape for a specific command `type` out of
 * {@link ChartClientCommand}. e.g. `CommandOf<'subscribe_candles'>`.
 */
export type CommandOf<T extends ChartClientCommandType> = Extract<ChartClientCommand, {
    type: T;
}>;
