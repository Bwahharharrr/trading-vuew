/* Generated from Corky chart-feed v1 schemas.
 * chart-client-request.schema.json sha256:4a2ed8332edf7d56d62d72be7d713d3487106d38912f8d1f82f06e8b6808c00c
 * chart-feed-event.schema.json sha256:c8d8976b4737a7588ced8d693e1c5bd9082e768500cf4bd389467438afef1ff4
 * chart-state-descriptor.schema.json sha256:a7f5c3509b1091b98be41d2981d1426394cf90a41971cc95088e4751858c2536
 * Do not edit by hand.
 */

/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartFeedEventKind".
 */
export type ChartFeedEventKind =
  | {
      states: ChartCandleStateDescriptor[]
      type: 'candle_states'
      [k: string]: unknown
    }
  | {
      positions: ChartAuthPosition[]
      type: 'auth_positions'
      [k: string]: unknown
    }
  | {
      next_cursor?: string | null
      positions: ChartAuthPosition[]
      total_count: number
      type: 'auth_position_history'
      [k: string]: unknown
    }
  | {
      audit: ChartAuthPositionAudit
      type: 'auth_position_audit'
      [k: string]: unknown
    }
  | {
      positions: ChartAuthPosition[]
      sequence: number
      subscription_id: string
      type: 'auth_positions_update'
      [k: string]: unknown
    }
  | {
      audit: ChartAuthPositionAudit
      sequence: number
      subscription_id: string
      type: 'auth_position_audit_update'
      [k: string]: unknown
    }
  | {
      range: ChartHistoryRange
      state: ChartCandleStateDescriptor
      subscription_id: string
      timeframe: string
      type: 'subscription_accepted'
      [k: string]: unknown
    }
  | {
      funding_period?: string | null
      range: ChartHistoryRange
      runtime_id: string
      state_id: string
      subscription_id: string
      symbol: string
      timeframe: string
      type: 'subscription_accepted_summary'
      venue: string
      [k: string]: unknown
    }
  | {
      range: HistoricalCandleRange
      subscription_id: string
      symbol: string
      timeframes: string[]
      type: 'historical_ack'
      venue: string
      [k: string]: unknown
    }
  | {
      current: number
      message: string
      phase: string
      subscription_id: string
      total?: number | null
      type: 'historical_progress'
      [k: string]: unknown
    }
  | {
      chunk_index: number
      rows: ChartCandleRow[]
      subscription_id: string
      timeframe: string
      type: 'historical_chunk'
      [k: string]: unknown
    }
  | {
      chunk_index: number
      columns: ChartCandleColumnChunk
      subscription_id: string
      timeframe: string
      type: 'historical_chunk_columnar'
      [k: string]: unknown
    }
  | {
      chunks: number
      rows: number
      subscription_id: string
      timeframes: string[]
      type: 'historical_complete'
      [k: string]: unknown
    }
  | {
      range: HistoricalCandleRange
      result_window: SearchResultWindow
      search_id: string
      symbols: string[]
      timeframes: string[]
      type: 'search_accepted'
      venue: string
      [k: string]: unknown
    }
  | {
      current: number
      message: string
      metrics?: SearchProgressMetrics | null
      phase: string
      search_id: string
      total?: number | null
      type: 'search_progress'
      [k: string]: unknown
    }
  | {
      result: SearchCandleMatch
      search_id: string
      sequence: number
      type: 'search_match'
      [k: string]: unknown
    }
  | {
      matches: number
      scanned_rows: number
      search_id: string
      symbols: string[]
      timeframes: string[]
      type: 'search_complete'
      [k: string]: unknown
    }
  | {
      matches: number
      reason: string
      scanned_rows: number
      search_id: string
      type: 'search_cancelled'
      [k: string]: unknown
    }
  | {
      code?: string
      error: string
      message?: string
      search_id: string
      type: 'search_failed'
      [k: string]: unknown
    }
  | {
      strategies: ChartStrategyDescriptor[]
      type: 'strategies'
      [k: string]: unknown
    }
  | {
      strategy: ChartStrategyDescriptor
      type: 'strategy'
      [k: string]: unknown
    }
  | {
      runtimes: ChartStrategyRuntimeStatus[]
      type: 'strategy_runtimes'
      [k: string]: unknown
    }
  | {
      lifecycle: ChartStrategyRuntimeLifecycleStatus
      type: 'strategy_runtime_lifecycle'
      [k: string]: unknown
    }
  | {
      runtime: ChartStrategyRuntimeStatus
      type: 'strategy_runtime'
      [k: string]: unknown
    }
  | {
      ticker: ChartStrategyTickerStatus
      type: 'strategy_ticker'
      [k: string]: unknown
    }
  | {
      overlays: ChartStrategyChartOverlay[]
      runtime_id: string
      ticker_id: string
      timeframe?: string | null
      type: 'strategy_chart_overlays'
      [k: string]: unknown
    }
  | {
      decisions: ChartStrategyDecisionAudit[]
      runtime_id: string
      type: 'strategy_decisions'
      [k: string]: unknown
    }
  | {
      page: ChartStrategyOperationsPage
      type: 'strategy_operations'
      [k: string]: unknown
    }
  | {
      page: ChartStrategyOperationsPage
      sequence: number
      subscription_id: string
      type: 'strategy_operations_update'
      [k: string]: unknown
    }
  | {
      money: ChartStrategyMoneyView
      type: 'strategy_money'
      [k: string]: unknown
    }
  | {
      history: ChartStrategyBalanceHistory
      type: 'strategy_balance_history'
      [k: string]: unknown
    }
  | {
      money: ChartStrategyAccountMoneyView
      type: 'strategy_account_money'
      [k: string]: unknown
    }
  | {
      preview: ChartStrategyOperationPreview
      type: 'strategy_operation_preview'
      [k: string]: unknown
    }
  | {
      result: ChartStrategyOperationResult
      type: 'strategy_operation_result'
      [k: string]: unknown
    }
  | {
      comparison: ChartStrategyAllocationComparison
      type: 'strategy_allocation_comparison'
      [k: string]: unknown
    }
  | {
      runtimes: ChartStrategyRuntimeStatus[]
      sequence: number
      subscription_id: string
      type: 'strategy_runtime_update'
      [k: string]: unknown
    }
  | {
      promotions: ChartStrategyPromotionSummary[]
      type: 'strategy_promotions'
      [k: string]: unknown
    }
  | {
      promotion: ChartStrategyPromotionDetail
      type: 'strategy_promotion'
      [k: string]: unknown
    }
  | {
      runs: ChartBacktestRunSummary[]
      type: 'backtest_runs'
      [k: string]: unknown
    }
  | {
      artifact: unknown
      run_id: string
      type: 'backtest_run'
      [k: string]: unknown
    }
  | {
      events: ChartBacktestProgressEvent[]
      run_id: string
      type: 'backtest_progress'
      [k: string]: unknown
    }
  | {
      events: ChartBacktestProgressEvent[]
      run_id: string
      sequence: number
      subscription_id: string
      type: 'backtest_progress_update'
      [k: string]: unknown
    }
  | {
      fold_index?: number | null
      overlays: ChartBacktestTradeChartOverlay[]
      parameter_run_index?: number | null
      run_id: string
      timeframe: string
      type: 'backtest_chart_overlays'
      venue: string
      [k: string]: unknown
    }
  | {
      equity_curve: ChartBacktestEquityCurvePoint[]
      fold_index?: number | null
      metric_descriptors?: ChartBacktestMetricDescriptor[]
      parameter_run_index?: number | null
      period_returns?: ChartBacktestPeriodReturn[]
      price_levels?: ChartBacktestPriceLevelOverlay[]
      run_id: string
      series_descriptors?: ChartBacktestSeriesDescriptor[]
      trade_timeframe: string
      trades: ChartBacktestTradeOverlay[]
      type: 'backtest_report_overlays'
      venue: string
      [k: string]: unknown
    }
  | {
      row: ChartCandleRow
      sequence: number
      subscription_id: string
      type: 'live_update'
      [k: string]: unknown
    }
  | {
      message: string
      outcome?: StateControlOutcome | null
      restart_required?: boolean
      status: RuntimeControlStatus
      target_runtime_id?: string | null
      type: 'control_ack'
      [k: string]: unknown
    }
  | {
      alerts: AlertNotification[]
      subscription_id: string
      type: 'alert_list'
      [k: string]: unknown
    }
  | {
      alert: AlertNotification
      sequence: number
      subscription_id: string
      type: 'alert'
      [k: string]: unknown
    }
  | {
      code: string
      message: string
      retryable: boolean
      type: 'error'
      [k: string]: unknown
    }
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ServiceState".
 */
export type ServiceState =
  'Starting' | 'Running' | 'Ready' | 'Degraded' | 'Reconnecting' | 'Stopping' | 'Stopped' | 'Failed' | 'Unknown'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "IndicatorViewLayerKind".
 */
export type IndicatorViewLayerKind = 'line' | 'histogram' | 'band' | 'candle_color' | 'box' | 'marker' | 'diagnostic'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "IndicatorViewSurface".
 */
export type IndicatorViewSurface = 'price' | 'pane'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPositionSource".
 */
export type ChartAuthPositionSource = 'current' | 'historical'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPositionAuditStatus".
 */
export type ChartAuthPositionAuditStatus = 'complete' | 'degraded' | 'incomplete' | 'missing'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartHistoryRange".
 */
export type ChartHistoryRange =
  | {
      limit: number
      type: 'latest'
      [k: string]: unknown
    }
  | {
      end_ms: number
      start_ms: number
      type: 'start_end'
      [k: string]: unknown
    }
  | {
      end_ms?: number | null
      type: 'since_inception'
      [k: string]: unknown
    }
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "HistoricalCandleRange".
 */
export type HistoricalCandleRange =
  | {
      end_ms: number
      start_ms: number
      type: 'start_end'
      [k: string]: unknown
    }
  | {
      end_ms?: number | null
      limit: number
      type: 'latest'
      [k: string]: unknown
    }
  | {
      end_ms?: number | null
      type: 'since_inception'
      [k: string]: unknown
    }
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchMatchSide".
 */
export type SearchMatchSide = 'bull' | 'bear' | 'mixed' | 'neutral' | 'unknown'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchTargetEvaluation".
 */
export type SearchTargetEvaluation = {
  evaluation: SearchBarrierSymmetricEvaluation
  type: 'barrier_symmetric'
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyOperationAction".
 */
export type ChartStrategyOperationAction =
  | {
      expected_pid: number
      reason: string
      type: 'stop_runtime'
      [k: string]: unknown
    }
  | {
      profile_id: string
      profile_revision: string
      reason: string
      type: 'launch_runtime_profile'
      [k: string]: unknown
    }
  | {
      expected_pid: number
      profile_id: string
      profile_revision: string
      reason: string
      type: 'switch_runtime_profile'
      [k: string]: unknown
    }
  | {
      reason: string
      ticker_id: string
      type: 'pause_ticker'
      [k: string]: unknown
    }
  | {
      reason: string
      ticker_id: string
      type: 'resume_ticker'
      [k: string]: unknown
    }
  | {
      reason: string
      ticker_id: string
      type: 'cancel_ticker_orders'
      [k: string]: unknown
    }
  | {
      deposit_event_id: string
      deposit_runtime_id: string
      reason: string
      transfer_id: string
      type: 'correlate_internal_transfer'
      withdrawal_event_id: string
      withdrawal_runtime_id: string
      [k: string]: unknown
    }
  | {
      proposal: unknown
      reason: string
      type: 'allocate_new_capital'
      [k: string]: unknown
    }
  | {
      policy: unknown
      reason: string
      type: 'approve_automatic_allocation_policy'
      [k: string]: unknown
    }
  | {
      enabled: boolean
      reason: string
      scope: AutomaticAllocationScope
      type: 'set_automatic_allocation_enabled'
      [k: string]: unknown
    }
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AutomaticAllocationScope".
 */
export type AutomaticAllocationScope =
  | {
      scope: 'global'
      [k: string]: unknown
    }
  | {
      account_id: string
      scope: 'wallet'
      [k: string]: unknown
    }
  | {
      scope: 'strategy'
      strategy_instance_id: string
      [k: string]: unknown
    }
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StateControlOutcome".
 */
export type StateControlOutcome =
  'applied_hot' | 'accepted_pending' | 'requires_restart' | 'noop' | 'rejected' | 'failed'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "RuntimeControlStatus".
 */
export type RuntimeControlStatus = 'Accepted' | 'Rejected' | 'Applied' | 'Failed'
/**
 * Numeric reduction of one field over a window of bars, for [`AlertCondition::WindowAggregate`]. Bars whose field is missing are skipped.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AlertAggregate".
 */
export type AlertAggregate = 'max' | 'min' | 'sum' | 'mean'
/**
 * Comparison operators for a scalar condition.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AlertCompareOp".
 */
export type AlertCompareOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne'
/**
 * Boolean condition tree evaluated against one market's confirmed bar. Phase 0 defines the schema only; the evaluator lands with the alert engine.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AlertCondition".
 */
export type AlertCondition =
  | {
      conditions: AlertCondition[]
      type: 'all'
      [k: string]: unknown
    }
  | {
      conditions: AlertCondition[]
      type: 'any'
      [k: string]: unknown
    }
  | {
      condition: AlertCondition
      type: 'not'
      [k: string]: unknown
    }
  | {
      field: AlertFieldRef
      op: AlertCompareOp
      type: 'compare'
      value: number
      [k: string]: unknown
    }
  | {
      direction: AlertCrossDirection
      field: AlertFieldRef
      level: number
      type: 'cross'
      within_bars?: number
      [k: string]: unknown
    }
  | {
      agg: AlertAggregate
      end_offset: number
      field: AlertFieldRef
      op: AlertCompareOp
      start_offset?: number
      type: 'window_aggregate'
      value: number
      [k: string]: unknown
    }
  | {
      at_least: number
      end_offset: number
      field: AlertFieldRef
      op: AlertCompareOp
      start_offset?: number
      type: 'window_count'
      value: number
      [k: string]: unknown
    }
  | {
      at_least: number
      condition: AlertCondition
      type: 'confluence'
      [k: string]: unknown
    }
/**
 * Direction of a level cross.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AlertCrossDirection".
 */
export type AlertCrossDirection = 'above' | 'below'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartClientCommand".
 */
export type ChartClientCommand =
  | {
      type: 'list_candle_states'
      venue?: string | null
      [k: string]: unknown
    }
  | {
      account_id?: string | null
      include_historical?: boolean
      symbol?: string | null
      type: 'list_auth_positions'
      venue?: string | null
      [k: string]: unknown
    }
  | {
      account_id: string
      cursor?: string | null
      limit?: number
      symbol?: string | null
      type: 'list_auth_position_history'
      venue: string
      [k: string]: unknown
    }
  | {
      account_id: string
      include_orders?: boolean
      include_trades?: boolean
      position_id: number
      symbol: string
      type: 'get_auth_position_audit'
      venue: string
      [k: string]: unknown
    }
  | {
      account_id?: string | null
      include_historical?: boolean
      subscription_id: string
      symbol?: string | null
      type: 'subscribe_auth_positions'
      venue?: string | null
      [k: string]: unknown
    }
  | {
      account_id: string
      include_orders?: boolean
      include_trades?: boolean
      position_id: number
      subscription_id: string
      symbol: string
      type: 'subscribe_auth_position_audit'
      venue: string
      [k: string]: unknown
    }
  | {
      ack_mode?: SubscriptionAckMode & string
      chunk_rows?: number | null
      funding_period?: string | null
      historical_format?: HistoricalChunkFormat & string
      include_indicators?: boolean
      indicators?: PublicIndicatorSpec[]
      range?: ChartHistoryRange
      subscription_id: string
      symbol: string
      target_runtime_id?: string | null
      timeframe: string
      type: 'subscribe_candles'
      venue: string
      [k: string]: unknown
    }
  | {
      query: SearchCandleQuery
      type: 'search_candles'
      [k: string]: unknown
    }
  | {
      search_id: string
      type: 'cancel_search'
      [k: string]: unknown
    }
  | {
      type: 'list_strategies'
      [k: string]: unknown
    }
  | {
      strategy: string
      type: 'get_strategy'
      [k: string]: unknown
    }
  | {
      runtime_id?: string | null
      strategy?: string | null
      ticker_id?: string | null
      type: 'list_strategy_runtimes'
      [k: string]: unknown
    }
  | {
      runtime_id: string
      type: 'list_strategy_launch_profiles'
      [k: string]: unknown
    }
  | {
      status?: string | null
      strategy?: string | null
      type: 'list_strategy_promotions'
      [k: string]: unknown
    }
  | {
      manifest_id: string
      type: 'get_strategy_promotion'
      [k: string]: unknown
    }
  | {
      runtime_id: string
      type: 'get_strategy_runtime'
      [k: string]: unknown
    }
  | {
      runtime_id: string
      ticker_id: string
      type: 'get_strategy_ticker'
      [k: string]: unknown
    }
  | {
      end_ms?: number | null
      runtime_id: string
      start_ms?: number | null
      ticker_id: string
      timeframe?: string | null
      type: 'get_strategy_chart_overlays'
      [k: string]: unknown
    }
  | {
      end_ms?: number | null
      limit?: number | null
      runtime_id: string
      start_ms?: number | null
      ticker_id?: string | null
      type: 'list_strategy_decisions'
      [k: string]: unknown
    }
  | {
      cursor?: string | null
      limit?: number
      runtime_id: string
      type: 'list_strategy_operations'
      [k: string]: unknown
    }
  | {
      runtime_id: string
      type: 'get_strategy_money'
      [k: string]: unknown
    }
  | {
      end_ms?: number | null
      runtime_id: string
      start_ms?: number | null
      timeframe?: string
      type: 'get_strategy_balance_history'
      [k: string]: unknown
    }
  | {
      type: 'get_strategy_account_money'
      [k: string]: unknown
    }
  | {
      as_of_ms: number
      candidate_performance?: unknown[]
      expires_at_ms: number
      policies: unknown[]
      runtime_id: string
      type: 'compare_strategy_allocation_policies'
      [k: string]: unknown
    }
  | {
      cursor?: string | null
      runtime_id: string
      subscription_id: string
      type: 'subscribe_strategy_operations'
      [k: string]: unknown
    }
  | {
      actor: string
      expected_revision: string
      expires_at_ms: number
      idempotency_key: string
      operation: ChartStrategyOperationAction
      runtime_id: string
      type: 'preview_strategy_operation'
      [k: string]: unknown
    }
  | {
      approval_statement: string
      preview: ChartStrategyOperationPreview
      type: 'approve_strategy_operation'
      [k: string]: unknown
    }
  | {
      runtime_id?: string | null
      strategy?: string | null
      subscription_id: string
      ticker_id?: string | null
      type: 'subscribe_strategy_runtime'
      [k: string]: unknown
    }
  | {
      reason: string
      runtime_id: string
      strategy_instance_id?: string | null
      ticker_id: string
      type: 'pause_strategy_ticker'
      [k: string]: unknown
    }
  | {
      reason: string
      runtime_id: string
      strategy_instance_id?: string | null
      ticker_id: string
      type: 'resume_strategy_ticker'
      [k: string]: unknown
    }
  | {
      new_allocation: StrategyControlMoney
      reason: string
      runtime_id: string
      strategy_instance_id?: string | null
      ticker_id: string
      type: 'unlock_strategy_ticker'
      [k: string]: unknown
    }
  | {
      position_id: number
      reason: string
      runtime_id: string
      strategy_instance_id?: string | null
      ticker_id: string
      type: 'adopt_strategy_position'
      [k: string]: unknown
    }
  | {
      positions: StrategyPositionAdoption[]
      reason: string
      runtime_id: string
      strategy_instance_id?: string | null
      type: 'adopt_strategy_positions'
      [k: string]: unknown
    }
  | {
      reason: string
      runtime_id: string
      strategy_instance_id?: string | null
      ticker_id: string
      type: 'cancel_strategy_ticker_orders'
      [k: string]: unknown
    }
  | {
      status?: string | null
      strategy?: string | null
      symbol?: string | null
      type: 'list_backtest_runs'
      [k: string]: unknown
    }
  | {
      compact?: boolean
      run_id: string
      type: 'get_backtest_run'
      [k: string]: unknown
    }
  | {
      run_id: string
      type: 'get_backtest_progress'
      [k: string]: unknown
    }
  | {
      run_id: string
      subscription_id: string
      type: 'subscribe_backtest_progress'
      [k: string]: unknown
    }
  | {
      after_bars?: number | null
      before_bars?: number | null
      end_ms?: number | null
      fold_index?: number | null
      run_id: string
      run_index?: number | null
      start_ms?: number | null
      timeframe?: string | null
      type: 'get_backtest_chart_overlays'
      [k: string]: unknown
    }
  | {
      end_ms?: number | null
      fold_index?: number | null
      max_points?: number | null
      run_id: string
      run_index?: number | null
      start_ms?: number | null
      type: 'get_backtest_report_overlays'
      [k: string]: unknown
    }
  | {
      subscription_id: string
      type: 'unsubscribe'
      [k: string]: unknown
    }
  | {
      subscription_id: string
      type: 'subscribe_alerts'
      [k: string]: unknown
    }
  | {
      buffer?: number | null
      funding_period?: string | null
      indicators?: PublicIndicatorSpec[]
      symbol: string
      target_runtime_id?: string | null
      timeframes: string[]
      type: 'upsert_candle_state'
      venue: string
      [k: string]: unknown
    }
  | {
      buffer?: number | null
      funding_period?: string | null
      indicators?: PublicIndicatorSpec[] | null
      symbol: string
      target_runtime_id?: string | null
      timeframes?: string[] | null
      type: 'patch_candle_state'
      venue: string
      [k: string]: unknown
    }
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SubscriptionAckMode".
 */
export type SubscriptionAckMode = 'full' | 'summary'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "HistoricalChunkFormat".
 */
export type HistoricalChunkFormat = 'rows' | 'columnar'
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchTargetSpec".
 */
export type SearchTargetSpec = {
  spec: SearchBarrierSymmetricTargetSpec
  type: 'barrier_symmetric'
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchSymbolScope".
 */
export type SearchSymbolScope =
  | {
      type: 'all_maintained'
      [k: string]: unknown
    }
  | {
      symbols: string[]
      type: 'symbols'
      [k: string]: unknown
    }

export interface ChartFeedEvent {
  event: ChartFeedEventKind
  request_id?: string | null
  schema_version?: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartCandleStateDescriptor".
 */
export interface ChartCandleStateDescriptor {
  available_timeframes?: string[]
  buffer_target: number
  funding_period?: string | null
  indicators?: ChartIndicatorDescriptor[]
  lifecycle_reason?: string | null
  live_source?: string | null
  live_source_changed_at_ms?: number | null
  previous_live_source?: string | null
  ranges?: ChartTimeframeRange[]
  recent_indicator_rows?: IndicatorRowSnapshot[]
  requested_timeframes?: string[]
  runtime_id: string
  seed_source?: string | null
  shard_id?: string | null
  source_channel: string
  source_timeframe: string
  state: ServiceState
  state_id: string
  symbol: string
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartIndicatorDescriptor".
 */
export interface ChartIndicatorDescriptor {
  display_label: string
  kind: string
  last_timestamp_ms?: number | null
  outputs?: string[]
  params?: {
    [k: string]: string
  }
  readiness_status?: string | null
  ready: boolean
  samples_seen: number
  source: string
  state: ServiceState
  timeframe: string
  values?: {
    [k: string]: string
  }
  view?: IndicatorViewSpec
  warmup: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "IndicatorViewSpec".
 */
export interface IndicatorViewSpec {
  layers?: IndicatorViewLayerSpec[]
  version?: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "IndicatorViewLayerSpec".
 */
export interface IndicatorViewLayerSpec {
  fields?: string[]
  id: string
  kind: IndicatorViewLayerKind
  label: string
  style?: {
    [k: string]: string
  }
  target?: IndicatorViewTarget
  visible_by_default?: boolean
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "IndicatorViewTarget".
 */
export interface IndicatorViewTarget {
  pane?: string | null
  surface?: IndicatorViewSurface & string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartTimeframeRange".
 */
export interface ChartTimeframeRange {
  buffer_target: number
  current_ts_ms?: number | null
  effective_target_count?: number | null
  first_ts_ms?: number | null
  held_count: number
  last_closed_ts_ms?: number | null
  live_source?: string | null
  preview?: CandlePreview
  readiness_status?: string | null
  ready: boolean
  seed_source?: string | null
  source_timeframe: string
  stale: boolean
  stale_reason?: string | null
  timeframe: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "CandlePreview".
 */
export interface CandlePreview {
  current?: CandleSnapshot | null
  first?: CandleSnapshot | null
  previous_1_closed?: CandleSnapshot | null
  previous_2_closed?: CandleSnapshot | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "CandleSnapshot".
 */
export interface CandleSnapshot {
  close: string
  high: string
  low: string
  open: string
  timestamp_ms: number
  volume: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "IndicatorRowSnapshot".
 */
export interface IndicatorRowSnapshot {
  indicators?: {
    [k: string]: {
      [k: string]: string
    }
  }
  timeframe: string
  timestamp_ms: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPosition".
 */
export interface ChartAuthPosition {
  account_id: string
  amount: string
  base_price: string
  closed_at_ms?: number | null
  collateral?: string | null
  collateral_min?: string | null
  leverage?: string | null
  liquidation_price?: string | null
  opened_at_ms?: number | null
  pl?: string | null
  pl_perc?: string | null
  position_id: number
  runtime_id: string
  side: string
  source: ChartAuthPositionSource
  status: string
  symbol: string
  updated_at_ms?: number | null
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPositionAudit".
 */
export interface ChartAuthPositionAudit {
  account_id: string
  fees?: ChartAuthPositionAuditFee[]
  orders?: ChartAuthPositionAuditOrder[]
  position: ChartAuthPositionAuditPosition
  position_id: number
  summary: ChartAuthPositionAuditSummary
  symbol: string
  trades?: ChartAuthPositionAuditTrade[]
  updated_at_ms?: number | null
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPositionAuditFee".
 */
export interface ChartAuthPositionAuditFee {
  amount: string
  balance: string
  currency: string
  description: string
  fee_id: number
  kind: string
  position_id?: number | null
  source: string
  symbol?: string | null
  timestamp_ms: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPositionAuditOrder".
 */
export interface ChartAuthPositionAuditOrder {
  amount?: string | null
  amount_original?: string | null
  client_order_id: number
  created_at_ms?: number | null
  order_id: number
  order_type: string
  price?: string | null
  price_avg?: string | null
  source: string
  status?: string | null
  symbol: string
  updated_at_ms?: number | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPositionAuditPosition".
 */
export interface ChartAuthPositionAuditPosition {
  amount: string
  base_price: string
  closed_at_ms?: number | null
  opened_at_ms?: number | null
  side: string
  source?: ChartAuthPositionSource | null
  status: string
  updated_at_ms?: number | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPositionAuditSummary".
 */
export interface ChartAuthPositionAuditSummary {
  amount_delta: string
  expected_position_amount: string
  fee_count?: number
  fee_ids?: number[]
  fees_by_currency?: {
    [k: string]: string
  }
  order_count: number
  order_ids?: number[]
  reasons?: string[]
  status: ChartAuthPositionAuditStatus
  trade_amount_sum: string
  trade_count: number
  trade_ids?: number[]
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartAuthPositionAuditTrade".
 */
export interface ChartAuthPositionAuditTrade {
  amount: string
  client_order_id?: number | null
  execution_timestamp_ms: number
  fee?: string | null
  fee_currency?: string | null
  maker: boolean
  order_id: number
  order_price: string
  order_type: string
  price: string
  source: string
  symbol: string
  trade_id: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartCandleRow".
 */
export interface ChartCandleRow {
  candle: CandleSnapshot
  confirmed_at_ms?: number | null
  indicators?: {
    [k: string]: {
      [k: string]: string
    }
  }
  source?: string
  status?: string
  timeframe: string
  updated_at_ms?: number | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartCandleColumnChunk".
 */
export interface ChartCandleColumnChunk {
  close?: string[]
  confirmed_at_ms?: (number | null)[]
  high?: string[]
  indicators?: {
    [k: string]: {
      [k: string]: (string | null)[]
    }
  }
  low?: string[]
  open?: string[]
  source?: string[]
  status?: string[]
  timestamp_ms?: number[]
  updated_at_ms?: (number | null)[]
  volume?: string[]
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchResultWindow".
 */
export interface SearchResultWindow {
  after_bars?: number
  before_bars?: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchProgressMetrics".
 */
export interface SearchProgressMetrics {
  base_projection_ms?: number | null
  cache_hit?: boolean | null
  cache_lookup_ms?: number | null
  eval_ms?: number | null
  fetch_ms?: number | null
  match_emit_ms?: number | null
  matches?: number | null
  mtf_projection_ms?: number | null
  numeric_fields?: number | null
  parse_fields_ms?: number | null
  rows?: number | null
  stopped_at_max_results?: boolean | null
  symbol?: string | null
  timeframe?: string | null
  total_load_ms?: number | null
  visible_candles?: number | null
  warmup_candles?: number | null
  warmup_ms?: number | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchCandleMatch".
 */
export interface SearchCandleMatch {
  candle: CandleSnapshot
  chart_window: SearchChartWindow
  crup_context?: SearchCrupContext | null
  indicators?: {
    [k: string]: {
      [k: string]: string
    }
  }
  observations?: AlertObservation[]
  side: SearchMatchSide
  symbol: string
  target_evaluations?: SearchTargetEvaluation[]
  timeframe: string
  timestamp_ms: number
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchChartWindow".
 */
export interface SearchChartWindow {
  after_bars: number
  before_bars: number
  end_ms: number
  start_ms: number
  timeframe: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchCrupContext".
 */
export interface SearchCrupContext {
  anchor_timeframe: string
  bear_confluence_timeframe_count?: number | null
  bull_confluence_timeframe_count?: number | null
  detection_box_timeframes?: SearchDetectionBoxTimeframe[]
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchDetectionBoxTimeframe".
 */
export interface SearchDetectionBoxTimeframe {
  box_count: number
  side: SearchMatchSide
  timeframe: string
  [k: string]: unknown
}
/**
 * One field reading that contributed to a rule firing (the "why").
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AlertObservation".
 */
export interface AlertObservation {
  bar_offset?: number
  field: string
  indicator: string
  value: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchBarrierSymmetricEvaluation".
 */
export interface SearchBarrierSymmetricEvaluation {
  analytics_summary?: SearchBarrierSymmetricAnalyticsSummary | null
  outcome?: SearchBarrierSymmetricOutcome | null
  plan: SearchBarrierSymmetricPlan
  target_spec_hash: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchBarrierSymmetricAnalyticsSummary".
 */
export interface SearchBarrierSymmetricAnalyticsSummary {
  bear_expected_value?: number | null
  bear_full_kelly?: number | null
  bear_hit_count: number
  bear_hit_rate?: number | null
  bear_wilson_lower_bound?: number | null
  bull_expected_value?: number | null
  bull_full_kelly?: number | null
  bull_hit_count: number
  bull_hit_rate?: number | null
  bull_wilson_lower_bound?: number | null
  reward_risk_ratio?: number | null
  sample_count: number
  target_spec_hash: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchBarrierSymmetricOutcome".
 */
export interface SearchBarrierSymmetricOutcome {
  bear_hit: boolean
  bull_hit: boolean
  evaluable_outcome: boolean
  mae_dn?: number | null
  mae_up?: number | null
  matured_at_ms: number
  quality_dn?: number | null
  quality_up?: number | null
  strength_dn?: number | null
  strength_up?: number | null
  target_spec_hash: string
  time_dn?: number | null
  time_up?: number | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchBarrierSymmetricPlan".
 */
export interface SearchBarrierSymmetricPlan {
  atr?: string | null
  atr_pct?: string | null
  cost_log?: string | null
  entry_price: string
  evaluable_outcome: boolean
  expiry_timestamp_ms?: number | null
  fees_bps: number
  half_spread_bps: number
  k_stop: number
  k_take: number
  kind: string
  reward_risk_ratio?: number | null
  sigma_log?: string | null
  slippage_bps: number
  stop_dn_price?: string | null
  stop_up_price?: string | null
  take_dn_price?: string | null
  take_up_price?: string | null
  target_spec_hash: string
  timeframe: string
  window_atr: number
  window_fwd: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyDescriptor".
 */
export interface ChartStrategyDescriptor {
  default_context_timeframes?: string[]
  default_indicators?: unknown[]
  default_trade_timeframe: string
  display_name?: string | null
  name: string
  parameters?: ChartStrategyParameterDescriptor[]
  schema_version: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyParameterDescriptor".
 */
export interface ChartStrategyParameterDescriptor {
  default_value?: {
    [k: string]: unknown
  }
  description?: string | null
  name: string
  recommended_sweep?: {
    [k: string]: unknown
  }
  type: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyRuntimeStatus".
 */
export interface ChartStrategyRuntimeStatus {
  allocation_account_id?: string | null
  allocation_configured?: boolean
  allocation_events?: number
  allocation_ledger_path?: string | null
  allocation_observed_available?: string | null
  allocation_observed_balance?: string | null
  allocation_quote_currency?: string | null
  allocation_ready?: boolean
  allocation_strategy_instance_id?: string | null
  allocation_strategy_status?: string | null
  allocation_unallocated_available?: string | null
  allocation_wallet_type?: string | null
  auth_gate_configured?: boolean
  auth_order_control_configured?: boolean
  auth_order_control_reason?: string | null
  auth_order_control_registry_status?: string | null
  auth_order_control_session_fingerprint?: string | null
  auth_order_control_status?: string | null
  auth_order_control_target_runtime_id?: string | null
  auth_ready?: boolean
  auth_snapshots_seen?: number
  auth_target_open_positions?: StrategyAuthOpenPositionSnapshot[]
  auth_wallet_balances?: StrategyWalletBalanceSnapshot[]
  automatic_allocation?: StrategyAutomaticAllocationStatus | null
  candidate_artifact_path?: string | null
  candidate_metrics?: StrategyRuntimeLineageMetricsSnapshot | null
  candidate_params_sha256?: string | null
  candidate_rank?: number | null
  candidate_run_index?: number | null
  context_timeframes?: string[]
  control_audit_path?: string | null
  decision_audit_path?: string | null
  decision_events?: number
  dependencies?: ChartStrategyRuntimeDependency[]
  feature_requirements?: number
  features_ready?: number
  fills?: number
  generated_at_ms: number
  last_auth_snapshot_ms?: number | null
  last_decision_ms?: number | null
  last_error?: string | null
  last_public_snapshot_ms?: number | null
  ledger_events?: number
  ledger_path?: string | null
  lifecycle_ledger_path?: string | null
  lineage_note?: string | null
  lineage_reasons?: string[]
  lineage_status?: string
  live_operator_approval?: StrategyLiveOperatorApprovalStatus | null
  market_data_audit_path?: string | null
  matching_auth_snapshots_seen?: number
  matching_public_snapshots_seen?: number
  mode: string
  mutations_halted_reason?: string | null
  oldest_submitted_order_ts_ms?: number | null
  order_events?: number
  order_journal_path?: string | null
  order_status_counts?: {
    [k: string]: number
  }
  orders_active_or_pending?: number
  orders_submitted_nonterminal?: number
  orders_total?: number
  pending_allocation_reasons?: string[]
  pending_auth_reasons?: string[]
  pending_control_requests?: number
  pending_feature_reasons?: string[]
  process_kind?: string
  public_snapshots_seen?: number
  recent_decisions?: ChartStrategyDecisionSummary[]
  runtime_control_available?: boolean
  runtime_control_reason?: string | null
  runtime_id: string
  stale_order_forensics?: StrategyStaleOrderForensicsStatusSnapshot | null
  state: ServiceState
  state_origin?: StrategyStateOriginSnapshot | null
  strategy: string
  strategy_config_path?: string | null
  strategy_config_sha256?: string | null
  strategy_descriptor_schema_version?: number | null
  strategy_id?: string
  strategy_instance_id?: string | null
  strategy_params_canonical_json?: string | null
  strategy_params_sha256?: string | null
  submitted_order_blockers?: StrategySubmittedOrderBlockerSnapshot[]
  target_private_runtime_id?: string | null
  target_public_runtime_id: string
  ticker_allocations?: ChartStrategyTickerAllocation[]
  ticker_orders?: ChartStrategyTickerOrderStatus[]
  tickers?: ChartStrategyRuntimeTicker[]
  trade_timeframe?: string | null
  universe_backtest_run_id?: string | null
  valuation?: StrategyValuationSnapshot | null
  wallet_allocations?: ChartStrategyWalletAllocation[]
  [k: string]: unknown
}
/**
 * Open auth position row observed on a configured strategy target symbol.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyAuthOpenPositionSnapshot".
 */
export interface StrategyAuthOpenPositionSnapshot {
  amount: string
  base_price: string
  owned?: boolean
  position_id: number
  side: string
  symbol: string
  ticker_id: string
  [k: string]: unknown
}
/**
 * Sanitized auth wallet row exposed through strategy runtime status.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyWalletBalanceSnapshot".
 */
export interface StrategyWalletBalanceSnapshot {
  available?: string | null
  balance: string
  class: string
  currency: string
  wallet_type: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyAutomaticAllocationStatus".
 */
export interface StrategyAutomaticAllocationStatus {
  approved_at_ms?: number | null
  approved_by?: string | null
  daily_digest: StrategyAutomaticAllocationDailyDigest
  enabled: boolean
  fault?: string | null
  global_enabled: boolean
  journal_path: string
  last_decision?: StrategyAutomaticAllocationDecisionSnapshot | null
  policy_configured: boolean
  policy_hash?: string | null
  policy_id?: string | null
  policy_version?: number | null
  strategy_enabled: boolean
  wallet_enabled: boolean
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyAutomaticAllocationDailyDigest".
 */
export interface StrategyAutomaticAllocationDailyDigest {
  applications: number
  applied_amount: string
  decisions?: StrategyAutomaticAllocationDecisionSnapshot[]
  noops: number
  proposals: number
  rejections: number
  remaining_unallocated: string
  summary: string
  utc_day: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyAutomaticAllocationDecisionSnapshot".
 */
export interface StrategyAutomaticAllocationDecisionSnapshot {
  account_revision?: string | null
  amount: string
  at_ms: number
  decision_id: string
  proposal_sha256?: string | null
  reason: string
  reconciliation_revision?: string | null
  status: string
  valuation_revision?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyRuntimeLineageMetricsSnapshot".
 */
export interface StrategyRuntimeLineageMetricsSnapshot {
  avg_trades?: string | null
  beat_buy_hold?: number | null
  institutional_score?: string | null
  lower_tail_return?: string | null
  max_drawdown_pct?: string | null
  score?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyRuntimeDependency".
 */
export interface ChartStrategyRuntimeDependency {
  dependency_runtime_id: string
  kind: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyLiveOperatorApprovalStatus".
 */
export interface StrategyLiveOperatorApprovalStatus {
  account_id: string
  action: string
  approval_id: string
  approved_at_ms: number
  approved_by: string
  canary_review_path?: string | null
  context_timeframes?: string[]
  expires_at_ms: number
  live_validation_proof?: StrategyLiveValidationProofStatus | null
  max_order_notional: string
  path?: string | null
  quote_currency: string
  reason?: string | null
  statement: string
  strategy_id: string
  strategy_instance_id: string
  symbols?: string[]
  target_private_runtime_id: string
  trade_timeframe?: string
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyLiveValidationProofStatus".
 */
export interface StrategyLiveValidationProofStatus {
  command: string
  completed_at_ms: number
  kind: string
  log_path: string
  log_sha256: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyDecisionSummary".
 */
export interface ChartStrategyDecisionSummary {
  decision_id: string
  decision_ts_ms: number
  fill_count?: number
  first_intent_kind?: string | null
  first_intent_reason?: string | null
  first_intent_side?: string | null
  intent_count?: number
  ledger_event_count?: number
  outcome: string
  queued_order_count?: number
  reason?: string | null
  rejected_order_count?: number
  risk_checks?: ChartStrategyDecisionRiskCheck[]
  symbol: string
  ticker_id: string
  timeframe: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyDecisionRiskCheck".
 */
export interface ChartStrategyDecisionRiskCheck {
  detail?: string | null
  name: string
  status: string
  symbol?: string | null
  [k: string]: unknown
}
/**
 * Status for the latest read-only stale submitted-order forensics packet.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyStaleOrderForensicsStatusSnapshot".
 */
export interface StrategyStaleOrderForensicsStatusSnapshot {
  as_of_ms?: number | null
  auth_order_history_dir?: string | null
  auth_trade_history_dir?: string | null
  blocked_order_count?: number
  expected_appended_event_ids?: string[]
  forbidden_mutations?: string[]
  generated_at_ms?: number | null
  live_mutation_allowed_by_this_report?: boolean | null
  reason?: string | null
  repair_command_argv?: string[]
  repair_report_path?: string | null
  repairable_order_count?: number
  report_is_not_approval?: boolean | null
  report_path?: string | null
  required_statement_for_repair?: string | null
  stale_nonterminal_order_count?: number
  status: string
  [k: string]: unknown
}
/**
 * Status payload published by a Rust strategy runtime (capability [`CAP_STRATEGY_RUNTIME_STATUS_V1`]).
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyStateOriginSnapshot".
 */
export interface StrategyStateOriginSnapshot {
  allocation_position_count: number
  artifact_path: string
  artifact_sha256: string
  auth_account_id: string
  checkpoint_sha256: string
  money_mutations_fenced: boolean
  replay_end_ms: number
  replay_event_count: number
  restore_verified: boolean
  strategy_instance_id: string
  [k: string]: unknown
}
/**
 * Bounded operator row for an order that has left local queued state and still needs exchange/order-history reconciliation.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategySubmittedOrderBlockerSnapshot".
 */
export interface StrategySubmittedOrderBlockerSnapshot {
  age_ms?: number | null
  auth_order_boundary?: string
  auth_order_command_batch_id?: string | null
  auth_order_control_request_id?: string | null
  auth_order_control_session_fingerprint?: string | null
  auth_order_control_target_runtime_id?: string | null
  auth_order_encoded_command_sha256?: string | null
  auth_order_queue_accepted_at_ms?: number | null
  client_order_id: number
  decision_id: string
  exchange_boundary?: string
  exchange_order_id?: number | null
  first_exchange_response_ts_ms?: number | null
  first_fill_ts_ms?: number | null
  group_id: number
  kind: string
  last_event: string
  last_event_ts_ms: number
  order_key: string
  quantity: string
  reason: string
  remaining_quantity: string
  side: string
  status: string
  suggested_action: string
  symbol: string
  ticker_id: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyTickerAllocation".
 */
export interface ChartStrategyTickerAllocation {
  allocated_equity: string
  available_cash: string
  fees_paid: string
  last_decision_id?: string | null
  last_event?: string | null
  locked_margin: string
  lockout_reason?: string | null
  position_avg_price?: string | null
  position_opened_at_ms?: number | null
  position_quantity: string
  realized_pnl: string
  reserved_cash: string
  status: string
  status_reason?: string | null
  status_since_ms?: number | null
  ticker_id: string
  unrealized_pnl: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyTickerOrderStatus".
 */
export interface ChartStrategyTickerOrderStatus {
  last_event?: string | null
  last_event_ts_ms?: number | null
  oldest_submitted_order_ts_ms?: number | null
  order_status_counts?: {
    [k: string]: number
  }
  orders_active_or_pending?: number
  orders_submitted_nonterminal?: number
  orders_total?: number
  submitted_order_blockers?: StrategySubmittedOrderBlockerSnapshot[]
  symbol: string
  ticker_id: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyRuntimeTicker".
 */
export interface ChartStrategyRuntimeTicker {
  last_decision_ms?: number | null
  last_decision_summary?: string | null
  position_opened_at_ms?: number | null
  recent_decisions?: ChartStrategyDecisionSummary[]
  status: string
  status_reason?: string | null
  status_since_ms?: number | null
  symbol: string
  ticker_id: string
  [k: string]: unknown
}
/**
 * Derived strategy valuation projection. Financial history remains owned by the allocation ledger; this projection records the fresh market observations used to value it.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyValuationSnapshot".
 */
export interface StrategyValuationSnapshot {
  as_of_ms: number
  reason?: string | null
  schema_version: number
  source: string
  status: string
  tickers?: StrategyTickerValuationSnapshot[]
  total_equity: string
  total_unrealized_pnl: string
  [k: string]: unknown
}
/**
 * One side-aware ticker valuation row.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyTickerValuationSnapshot".
 */
export interface StrategyTickerValuationSnapshot {
  average_entry_price?: string | null
  fees_paid: string
  mark_age_ms?: number | null
  mark_as_of_ms?: number | null
  mark_price?: string | null
  mark_side?: string | null
  mark_source?: string | null
  position_quantity: string
  reason?: string | null
  status: string
  symbol: string
  ticker_id: string
  unrealized_pnl?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyWalletAllocation".
 */
export interface ChartStrategyWalletAllocation {
  account_id: string
  allocated_to_strategy: string
  class: string
  currency: string
  observed_available: string
  observed_balance: string
  ticker_allocations?: ChartStrategyTickerAllocation[]
  ticker_ids?: string[]
  unallocated_available: string
  wallet_type: string
  [k: string]: unknown
}
/**
 * Runtime-scoped lifecycle view. The PID is a stale-action guard, not a process discovery surface: it is returned only after the gateway proves the observed snapshot and private local registry identify the same live strategy process.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyRuntimeLifecycleStatus".
 */
export interface ChartStrategyRuntimeLifecycleStatus {
  current_mode: string
  observed_pid?: number | null
  profiles?: ChartStrategyLaunchProfile[]
  profiles_error?: string | null
  runtime_id: string
  stop_available?: boolean
  stop_unavailable_reason?: string | null
  [k: string]: unknown
}
/**
 * One server-owned strategy launch profile exposed without executable arguments, credentials, approval artifacts, or control-session material.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyLaunchProfile".
 */
export interface ChartStrategyLaunchProfile {
  account_id?: string | null
  active?: boolean
  blockers?: string[]
  display_name: string
  launch_ready?: boolean
  max_order_notional?: string | null
  mode: string
  network?: string | null
  profile_id: string
  profile_revision: string
  runtime_id: string
  strategy_id: string
  strategy_instance_id: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyTickerStatus".
 */
export interface ChartStrategyTickerStatus {
  allocation?: ChartStrategyTickerAllocation | null
  allocation_ready?: boolean
  auth_ready?: boolean
  generated_at_ms: number
  last_decision_ms?: number | null
  mode: string
  orders?: ChartStrategyTickerOrderStatus | null
  pending_allocation_reasons?: string[]
  pending_auth_reasons?: string[]
  position_opened_at_ms?: number | null
  recent_decisions?: ChartStrategyDecisionSummary[]
  runtime_id: string
  state: ServiceState
  status?: string | null
  status_reason?: string | null
  status_since_ms?: number | null
  strategy: string
  symbol?: string | null
  ticker_id: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyChartOverlay".
 */
export interface ChartStrategyChartOverlay {
  candidate_params_sha256?: string | null
  candidate_rank?: number | null
  candidate_run_index?: number | null
  decision_id?: string | null
  end_timestamp_ms?: number | null
  kind: string
  label: string
  lineage_status?: string | null
  order_status_counts?: {
    [k: string]: number
  }
  runtime_id: string
  source: string
  status?: string | null
  strategy: string
  strategy_instance_id?: string | null
  strategy_params_sha256?: string | null
  symbol: string
  ticker_id: string
  timeframe?: string | null
  timestamp_ms: number
  universe_backtest_run_id?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyDecisionAudit".
 */
export interface ChartStrategyDecisionAudit {
  claim_states?: ChartStrategyTickerAllocation[]
  context_bar_count?: number
  decision_id: string
  decision_ts_ms: number
  emitted_at_ms: number
  event_id: string
  execution_bar: ChartStrategyDecisionBar
  feature_fingerprint?: string | null
  fill_count?: number
  indicator_row_count?: number
  intents?: ChartStrategyDecisionIntent[]
  ledger_deltas?: ChartStrategyDecisionLedgerDelta[]
  ledger_event_count?: number
  mode: string
  outcome: string
  queued_order_count?: number
  reason?: string | null
  rejected_order_count?: number
  risk_checks?: ChartStrategyDecisionRiskCheck[]
  runtime_id: string
  schema_version?: number
  strategy: string
  strategy_instance_id: string
  symbol: string
  ticker_id: string
  timeframe: string
  trade_bar: ChartStrategyDecisionBar
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyDecisionBar".
 */
export interface ChartStrategyDecisionBar {
  close: string
  high: string
  low: string
  open: string
  timestamp_ms: number
  volume: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyDecisionIntent".
 */
export interface ChartStrategyDecisionIntent {
  kind: string
  leg_index: number
  quantity: string
  reason: string
  side: string
  sizing: string
  stop_loss?: string | null
  symbol: string
  take_profit?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyDecisionLedgerDelta".
 */
export interface ChartStrategyDecisionLedgerDelta {
  amount?: string | null
  cash_after?: string | null
  count?: number | null
  detail?: string | null
  equity?: string | null
  fee?: string | null
  kind: string
  price?: string | null
  quantity?: string | null
  realized_pnl?: string | null
  side?: string | null
  symbol?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyOperationsPage".
 */
export interface ChartStrategyOperationsPage {
  events: ChartStrategyOperationEvent[]
  lifecycle_intervals?: ChartStrategyLifecycleInterval[]
  next_cursor?: string | null
  projection_revision: string
  resume_cursor?: string | null
  runtime_id: string
  [k: string]: unknown
}
/**
 * One immutable strategy operations row assembled from an authoritative sidecar.
 *
 * `kind` and `payload` deliberately preserve the source event rather than mapping it to a lossy client enum. A client that does not understand a newly added `kind` can display or reject it while retaining the complete payload.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyOperationEvent".
 */
export interface ChartStrategyOperationEvent {
  event_id: string
  kind: string
  order_id?: string | null
  payload: unknown
  source: string
  ticker_id?: string | null
  ts_ms: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyLifecycleInterval".
 */
export interface ChartStrategyLifecycleInterval {
  end_ms?: number | null
  reason?: string | null
  source: string
  start_ms: number
  state: string
  ticker_id?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyMoneyView".
 */
export interface ChartStrategyMoneyView {
  account_id?: string | null
  authority_scope: string
  funding?: ChartStrategyFundingEvent[]
  generated_at_ms: number
  projection_revision: string
  quote_currency?: string | null
  runtime_id: string
  ticker_allocations?: ChartStrategyTickerAllocation[]
  totals: ChartStrategyMoneyTotals
  valuation?: StrategyValuationSnapshot | null
  wallets?: ChartStrategyWalletAllocation[]
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyFundingEvent".
 */
export interface ChartStrategyFundingEvent {
  amount: string
  classification: string
  currency: string
  direction: string
  event_id: string
  reason: string
  transfer_id?: string | null
  ts_ms: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyMoneyTotals".
 */
export interface ChartStrategyMoneyTotals {
  allocated: string
  external_deposits: string
  external_withdrawals: string
  fees: string
  gross_exposure: string
  observed_available: string
  observed_balance: string
  realized_pnl: string
  unallocated: string
  unrealized_pnl: string
  [k: string]: unknown
}
/**
 * One read-only, USD-normalized strategy balance history response.
 *
 * `booked_balance` is reconstructed from the immutable allocation ledger. `equity` adds the unbanked mark-to-market `unrealized_pnl` derived from confirmed strategy trade-bar closes. Decimal values remain strings at the client boundary.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyBalanceHistory".
 */
export interface ChartStrategyBalanceHistory {
  available_timeframes?: string[]
  generated_at_ms: number
  normalization_currency: string
  normalization_source: string
  points?: ChartStrategyBalancePoint[]
  projection_revision: string
  quote_currency: string
  runtime_id: string
  starting_balance: string
  strategy_instance_id: string
  timeframe: string
  [k: string]: unknown
}
/**
 * One balance/equity observation after all ledger and market-data events at `timestamp_ms`.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyBalancePoint".
 */
export interface ChartStrategyBalancePoint {
  booked_balance: string
  equity?: string | null
  mark_status: string
  timestamp_ms: number
  unrealized_pnl?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyAccountMoneyView".
 */
export interface ChartStrategyAccountMoneyView {
  authority_scope: string
  currencies?: ChartStrategyAccountCurrencyTotals[]
  generated_at_ms: number
  projection_revision: string
  runtimes?: ChartStrategyMoneyView[]
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyAccountCurrencyTotals".
 */
export interface ChartStrategyAccountCurrencyTotals {
  account_ids?: string[]
  currency: string
  totals: ChartStrategyMoneyTotals
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyOperationPreview".
 */
export interface ChartStrategyOperationPreview {
  actor: string
  created_at_ms: number
  expected_revision: string
  expires_at_ms: number
  idempotency_key: string
  operation: ChartStrategyOperationAction
  preview_hash: string
  runtime_id: string
  schema_version: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyOperationResult".
 */
export interface ChartStrategyOperationResult {
  applied: boolean
  idempotency_key: string
  message: string
  preview_hash: string
  projection_revision: string
  runtime_id: string
  status: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyAllocationComparison".
 */
export interface ChartStrategyAllocationComparison {
  as_of_ms: number
  expires_at_ms: number
  ledger_revision: string
  projection_revision: string
  proposals: unknown[]
  runtime_id: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyPromotionSummary".
 */
export interface ChartStrategyPromotionSummary {
  active_build_id: string
  approved_at_ms: number
  candidate_rank?: number | null
  candidate_run_index?: number | null
  committed_at_ms: number
  created_at_ms: number
  latest_stage: string
  manifest_id: string
  manifest_sha256: string
  revision: number
  status: string
  strategy: string
  strategy_version: string
  symbols: string[]
  trade_timeframe: string
  universe_backtest_run_id: string
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyPromotionDetail".
 */
export interface ChartStrategyPromotionDetail {
  history: ChartStrategyPromotionHistoryEvent[]
  manifest: unknown
  summary: ChartStrategyPromotionSummary
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartStrategyPromotionHistoryEvent".
 */
export interface ChartStrategyPromotionHistoryEvent {
  actor: string
  artifact_path?: string | null
  artifact_sha256?: string | null
  event_id: string
  occurred_at_ms: number
  reason?: string | null
  revision: number
  stage: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestRunSummary".
 */
export interface ChartBacktestRunSummary {
  bar_count?: number | null
  completed_at_ms?: number | null
  first_bar_ts_ms?: number | null
  last_bar_ts_ms?: number | null
  metrics?: {
    [k: string]: unknown
  }
  optimization?: ChartBacktestRunOptimizationSummary | null
  run_id: string
  run_kind?: string | null
  running_strategy_instances?: ChartBacktestRunningStrategyInstance[]
  started_at_ms: number
  status: string
  strategy: string
  symbols: string[]
  trade_timeframe: string
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestRunOptimizationSummary".
 */
export interface ChartBacktestRunOptimizationSummary {
  candidate_count?: number | null
  exhaustive?: boolean | null
  full_grid_count?: number | null
  objective?: string | null
  sampler?: string | null
  selected_parameter_set_count?: number | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestRunningStrategyInstance".
 */
export interface ChartBacktestRunningStrategyInstance {
  candidate_params_sha256?: string | null
  candidate_rank?: number | null
  candidate_run_index?: number | null
  lineage_status: string
  mode: string
  runtime_id: string
  strategy_instance_id?: string | null
  strategy_params_sha256?: string | null
  tickers?: string[]
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestProgressEvent".
 */
export interface ChartBacktestProgressEvent {
  completed_steps: number
  kind: string
  message: string
  run_id: string
  total_steps?: number | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestTradeChartOverlay".
 */
export interface ChartBacktestTradeChartOverlay {
  chart_window: ChartBacktestInspectionWindow
  trade: ChartBacktestTradeOverlay
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestInspectionWindow".
 */
export interface ChartBacktestInspectionWindow {
  after_bars: number
  anchor_timestamp_ms: number
  before_bars: number
  end_ms: number
  start_ms: number
  symbol: string
  timeframe: string
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestTradeOverlay".
 */
export interface ChartBacktestTradeOverlay {
  fee: string
  price: string
  quantity: string
  side: string
  symbol: string
  timestamp_ms: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestEquityCurvePoint".
 */
export interface ChartBacktestEquityCurvePoint {
  cash: string
  drawdown: string
  drawdown_pct?: string | null
  equity: string
  position_quantity: string
  timestamp_ms: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestMetricDescriptor".
 */
export interface ChartBacktestMetricDescriptor {
  description?: string | null
  name: string
  precision?: number | null
  unit: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestPeriodReturn".
 */
export interface ChartBacktestPeriodReturn {
  end_ts_ms: number
  ending_equity: string
  period: string
  return_amount: string
  return_pct?: string | null
  start_ts_ms: number
  starting_equity: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestPriceLevelOverlay".
 */
export interface ChartBacktestPriceLevelOverlay {
  activated_at_ms: number
  cleared_at_ms?: number | null
  kind: string
  price: string
  quantity: string
  side: string
  symbol: string
  triggered_at_ms?: number | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartBacktestSeriesDescriptor".
 */
export interface ChartBacktestSeriesDescriptor {
  display_name: string
  fields: string[]
  id: string
  kind: string
  style?: {
    [k: string]: string
  }
  target: IndicatorViewTarget
  visible_by_default?: boolean
  [k: string]: unknown
}
/**
 * A fired alert, published on `TOPIC_ALERTS` and appended to the durable log.
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AlertNotification".
 */
export interface AlertNotification {
  /**
   * Stable dedupe id (see [`AlertNotification::alert_id`]).
   */
  alert_id: string
  /**
   * Wall-clock emission time (ms).
   */
  emitted_at_ms: number
  /**
   * The firing rule's delivery routing (Telegram chat/list, send toggle), so the alert is self-sufficient for the chart-render path.
   */
  notify?: AlertNotify
  /**
   * The field readings that satisfied the rule.
   */
  observed?: AlertObservation[]
  rule_id: string
  rule_label: string
  schema_version?: number
  symbol: string
  timeframe: string
  /**
   * Confirmed candle timestamp (ms) the rule matched on.
   */
  triggered_bar_ts: number
  venue: string
  [k: string]: unknown
}
/**
 * Telegram delivery routing for a fired rule (consumed by the delivery phase).
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AlertNotify".
 */
export interface AlertNotify {
  /**
   * Explicit Telegram chat id (takes precedence over `subscriber_list`).
   */
  chat_id?: number | null
  /**
   * Named Telegram subscriber list (resolved by the telegram bot config).
   */
  subscriber_list?: string | null
  /**
   * Send a rendered chart to Telegram when the rule fires.
   */
  telegram?: boolean
  [k: string]: unknown
}
/**
 * Reference to one indicator output value at a bar offset (0 = the confirmed bar under evaluation, N = N bars earlier).
 *
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "AlertFieldRef".
 */
export interface AlertFieldRef {
  /**
   * Bars back from the confirmed bar (0 = current).
   */
  bar_offset?: number
  /**
   * Indicator output field, e.g. `bullcount` or `histogram`.
   */
  field: string
  /**
   * Indicator display label, e.g. `CRUP` or `MACD(12,26,9)`.
   */
  indicator: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "PublicIndicatorSpec".
 */
export interface PublicIndicatorSpec {
  kind: string
  params?: {
    [k: string]: string
  }
  source?: string
  timeframe: string
  version?: string | null
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchCandleQuery".
 */
export interface SearchCandleQuery {
  as_of_ms?: number | null
  chunk_rows?: number | null
  condition: AlertCondition
  indicators?: PublicIndicatorSpec[]
  max_results?: number | null
  outcome_specs?: SearchTargetSpec[]
  range: HistoricalCandleRange
  result_window?: SearchResultWindow
  search_id: string
  symbols?: SearchSymbolScope
  target_specs?: SearchTargetSpec[]
  timeframes: string[]
  venue: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "SearchBarrierSymmetricTargetSpec".
 */
export interface SearchBarrierSymmetricTargetSpec {
  fees_bps?: number
  giveback_eps_bps?: number
  guard_min_consecutive_closes?: number
  guard_use_close?: boolean
  half_spread_bps?: number
  k_stop?: number | null
  k_take?: number
  post_hit_policy?: string
  post_hit_stop_relax_bps?: number
  slippage_bps?: number
  timeframe?: string | null
  timeout_requires_final?: boolean
  version?: number
  window_atr?: number
  window_fwd?: number
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyControlMoney".
 */
export interface StrategyControlMoney {
  amount: string
  currency: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "StrategyPositionAdoption".
 */
export interface StrategyPositionAdoption {
  position_id: number
  ticker_id: string
  [k: string]: unknown
}
/**
 * This interface was referenced by `ChartFeedEvent`'s JSON-Schema
 * via the `definition` "ChartClientRequest".
 */
export interface ChartClientRequest {
  command: ChartClientCommand
  request_id: string
  schema_version?: number
  [k: string]: unknown
}

// Compatibility aliases retained for the original public deep-import surface.
export type DecimalString = string
export type TimestampMs = number
export type SchemaVersion = 1
export type Timeframe = string
export type KnownErrorCode =
  | 'unsupported_schema_version' | 'invalid_request_json' | 'state_not_found'
  | 'runtime_not_found' | 'invalid_control_command' | 'control_response_timeout'
  | 'control_receive_error' | 'historical_query_failed'
  | 'auth_position_history_unavailable' | 'auth_position_audit_unavailable'
  | 'stateful_websocket_required' | 'backtest_artifacts_disabled'
  | 'strategy_not_found' | 'backtest_not_found' | 'backtest_artifact_not_ready'
  | 'invalid_backtest_request' | 'backtest_artifact_invalid'
  | 'backtest_store_unavailable'
export type ErrorCode = KnownErrorCode | (string & {})
export type ChartHistoryRangeLatest = Extract<ChartHistoryRange, { type: 'latest' }>
export type ChartHistoryRangeStartEnd = Extract<ChartHistoryRange, { type: 'start_end' }>
export type ChartHistoryRangeSinceInception = Extract<ChartHistoryRange, { type: 'since_inception' }>
export type RowIndicators = Record<string, Record<string, DecimalString>>
export type ChartAuthPositionFeeKind = ChartAuthPositionAuditFee['kind']
export type SearchCompareOp = AlertCompareOp
export type SearchConditionField = AlertFieldRef
export type SearchConditionCompare = Extract<AlertCondition, { type: 'compare' }>
export type SearchConditionAll = Extract<AlertCondition, { type: 'all' }>
export type SearchConditionAny = Extract<AlertCondition, { type: 'any' }>
export type SearchCondition = AlertCondition
export type SearchSymbolSet = Extract<SearchSymbolScope, { type: 'symbols' }>
export type SearchIndicatorSpec = PublicIndicatorSpec
export type SearchQuery = SearchCandleQuery
export type SearchObservation = AlertObservation
export type SearchMatchResult = SearchCandleMatch
export type BacktestRunStatus = 'queued' | 'running' | 'completed' | 'failed'
export type ChartBacktestProgressItem = ChartBacktestProgressEvent
export type ChartClientCommandType = ChartClientCommand['type']
export type ChartFeedEventType = ChartFeedEventKind['type']
export type EventOf<T extends ChartFeedEventType> = Extract<ChartFeedEventKind, { type: T }>
export type CommandOf<T extends ChartClientCommandType> = Extract<ChartClientCommand, { type: T }>
export type ListCandleStatesCommand = Extract<ChartClientCommand, { type: 'list_candle_states' }>
export type ListAuthPositionsCommand = Extract<ChartClientCommand, { type: 'list_auth_positions' }>
export type ListAuthPositionHistoryCommand = Extract<ChartClientCommand, { type: 'list_auth_position_history' }>
export type GetAuthPositionAuditCommand = Extract<ChartClientCommand, { type: 'get_auth_position_audit' }>
export type SubscribeAuthPositionsCommand = Extract<ChartClientCommand, { type: 'subscribe_auth_positions' }>
export type SubscribeAuthPositionAuditCommand = Extract<ChartClientCommand, { type: 'subscribe_auth_position_audit' }>
export type SubscribeCandlesCommand = Extract<ChartClientCommand, { type: 'subscribe_candles' }>
export type SearchCandlesCommand = Extract<ChartClientCommand, { type: 'search_candles' }>
export type CancelSearchCommand = Extract<ChartClientCommand, { type: 'cancel_search' }>
export type ListStrategiesCommand = Extract<ChartClientCommand, { type: 'list_strategies' }>
export type GetStrategyCommand = Extract<ChartClientCommand, { type: 'get_strategy' }>
export type ListStrategyRuntimesCommand = Extract<ChartClientCommand, { type: 'list_strategy_runtimes' }>
export type ListStrategyLaunchProfilesCommand = Extract<ChartClientCommand, { type: 'list_strategy_launch_profiles' }>
export type ListStrategyPromotionsCommand = Extract<ChartClientCommand, { type: 'list_strategy_promotions' }>
export type GetStrategyPromotionCommand = Extract<ChartClientCommand, { type: 'get_strategy_promotion' }>
export type GetStrategyRuntimeCommand = Extract<ChartClientCommand, { type: 'get_strategy_runtime' }>
export type GetStrategyTickerCommand = Extract<ChartClientCommand, { type: 'get_strategy_ticker' }>
export type GetStrategyChartOverlaysCommand = Extract<ChartClientCommand, { type: 'get_strategy_chart_overlays' }>
export type ListStrategyDecisionsCommand = Extract<ChartClientCommand, { type: 'list_strategy_decisions' }>
export type ListStrategyOperationsCommand = Extract<ChartClientCommand, { type: 'list_strategy_operations' }>
export type GetStrategyMoneyCommand = Extract<ChartClientCommand, { type: 'get_strategy_money' }>
export type GetStrategyBalanceHistoryCommand = Extract<ChartClientCommand, { type: 'get_strategy_balance_history' }>
export type GetStrategyAccountMoneyCommand = Extract<ChartClientCommand, { type: 'get_strategy_account_money' }>
export type CompareStrategyAllocationPoliciesCommand = Extract<ChartClientCommand, { type: 'compare_strategy_allocation_policies' }>
export type SubscribeStrategyOperationsCommand = Extract<ChartClientCommand, { type: 'subscribe_strategy_operations' }>
export type PreviewStrategyOperationCommand = Extract<ChartClientCommand, { type: 'preview_strategy_operation' }>
export type ApproveStrategyOperationCommand = Extract<ChartClientCommand, { type: 'approve_strategy_operation' }>
export type SubscribeStrategyRuntimeCommand = Extract<ChartClientCommand, { type: 'subscribe_strategy_runtime' }>
export type PauseStrategyTickerCommand = Extract<ChartClientCommand, { type: 'pause_strategy_ticker' }>
export type ResumeStrategyTickerCommand = Extract<ChartClientCommand, { type: 'resume_strategy_ticker' }>
export type UnlockStrategyTickerCommand = Extract<ChartClientCommand, { type: 'unlock_strategy_ticker' }>
export type AdoptStrategyPositionCommand = Extract<ChartClientCommand, { type: 'adopt_strategy_position' }>
export type AdoptStrategyPositionsCommand = Extract<ChartClientCommand, { type: 'adopt_strategy_positions' }>
export type CancelStrategyTickerOrdersCommand = Extract<ChartClientCommand, { type: 'cancel_strategy_ticker_orders' }>
export type ListBacktestRunsCommand = Extract<ChartClientCommand, { type: 'list_backtest_runs' }>
export type GetBacktestRunCommand = Extract<ChartClientCommand, { type: 'get_backtest_run' }>
export type GetBacktestProgressCommand = Extract<ChartClientCommand, { type: 'get_backtest_progress' }>
export type SubscribeBacktestProgressCommand = Extract<ChartClientCommand, { type: 'subscribe_backtest_progress' }>
export type GetBacktestChartOverlaysCommand = Extract<ChartClientCommand, { type: 'get_backtest_chart_overlays' }>
export type GetBacktestReportOverlaysCommand = Extract<ChartClientCommand, { type: 'get_backtest_report_overlays' }>
export type UnsubscribeCommand = Extract<ChartClientCommand, { type: 'unsubscribe' }>
export type SubscribeAlertsCommand = Extract<ChartClientCommand, { type: 'subscribe_alerts' }>
export type UpsertCandleStateCommand = Extract<ChartClientCommand, { type: 'upsert_candle_state' }>
export type PatchCandleStateCommand = Extract<ChartClientCommand, { type: 'patch_candle_state' }>
export type CandleStatesEvent = Extract<ChartFeedEventKind, { type: 'candle_states' }>
export type AuthPositionsEvent = Extract<ChartFeedEventKind, { type: 'auth_positions' }>
export type AuthPositionHistoryEvent = Extract<ChartFeedEventKind, { type: 'auth_position_history' }>
export type AuthPositionAuditEvent = Extract<ChartFeedEventKind, { type: 'auth_position_audit' }>
export type AuthPositionsUpdateEvent = Extract<ChartFeedEventKind, { type: 'auth_positions_update' }>
export type AuthPositionAuditUpdateEvent = Extract<ChartFeedEventKind, { type: 'auth_position_audit_update' }>
export type SubscriptionAcceptedEvent = Extract<ChartFeedEventKind, { type: 'subscription_accepted' }>
export type SubscriptionAcceptedSummaryEvent = Extract<ChartFeedEventKind, { type: 'subscription_accepted_summary' }>
export type HistoricalAckEvent = Extract<ChartFeedEventKind, { type: 'historical_ack' }>
export type HistoricalProgressEvent = Extract<ChartFeedEventKind, { type: 'historical_progress' }>
export type HistoricalChunkEvent = Extract<ChartFeedEventKind, { type: 'historical_chunk' }>
export type HistoricalChunkColumnarEvent = Extract<ChartFeedEventKind, { type: 'historical_chunk_columnar' }>
export type HistoricalCompleteEvent = Extract<ChartFeedEventKind, { type: 'historical_complete' }>
export type SearchAcceptedEvent = Extract<ChartFeedEventKind, { type: 'search_accepted' }>
export type SearchProgressEvent = Extract<ChartFeedEventKind, { type: 'search_progress' }>
export type SearchMatchEvent = Extract<ChartFeedEventKind, { type: 'search_match' }>
export type SearchCompleteEvent = Extract<ChartFeedEventKind, { type: 'search_complete' }>
export type SearchCancelledEvent = Extract<ChartFeedEventKind, { type: 'search_cancelled' }>
export type SearchFailedEvent = Extract<ChartFeedEventKind, { type: 'search_failed' }>
export type StrategiesEvent = Extract<ChartFeedEventKind, { type: 'strategies' }>
export type StrategyEvent = Extract<ChartFeedEventKind, { type: 'strategy' }>
export type StrategyRuntimesEvent = Extract<ChartFeedEventKind, { type: 'strategy_runtimes' }>
export type StrategyRuntimeLifecycleEvent = Extract<ChartFeedEventKind, { type: 'strategy_runtime_lifecycle' }>
export type StrategyRuntimeEvent = Extract<ChartFeedEventKind, { type: 'strategy_runtime' }>
export type StrategyTickerEvent = Extract<ChartFeedEventKind, { type: 'strategy_ticker' }>
export type StrategyChartOverlaysEvent = Extract<ChartFeedEventKind, { type: 'strategy_chart_overlays' }>
export type StrategyDecisionsEvent = Extract<ChartFeedEventKind, { type: 'strategy_decisions' }>
export type StrategyOperationsEvent = Extract<ChartFeedEventKind, { type: 'strategy_operations' }>
export type StrategyOperationsUpdateEvent = Extract<ChartFeedEventKind, { type: 'strategy_operations_update' }>
export type StrategyMoneyEvent = Extract<ChartFeedEventKind, { type: 'strategy_money' }>
export type StrategyBalanceHistoryEvent = Extract<ChartFeedEventKind, { type: 'strategy_balance_history' }>
export type StrategyAccountMoneyEvent = Extract<ChartFeedEventKind, { type: 'strategy_account_money' }>
export type StrategyOperationPreviewEvent = Extract<ChartFeedEventKind, { type: 'strategy_operation_preview' }>
export type StrategyOperationResultEvent = Extract<ChartFeedEventKind, { type: 'strategy_operation_result' }>
export type StrategyAllocationComparisonEvent = Extract<ChartFeedEventKind, { type: 'strategy_allocation_comparison' }>
export type StrategyRuntimeUpdateEvent = Extract<ChartFeedEventKind, { type: 'strategy_runtime_update' }>
export type StrategyPromotionsEvent = Extract<ChartFeedEventKind, { type: 'strategy_promotions' }>
export type StrategyPromotionEvent = Extract<ChartFeedEventKind, { type: 'strategy_promotion' }>
export type BacktestRunsEvent = Extract<ChartFeedEventKind, { type: 'backtest_runs' }>
export type BacktestRunEvent = Extract<ChartFeedEventKind, { type: 'backtest_run' }>
export type BacktestProgressEvent = Extract<ChartFeedEventKind, { type: 'backtest_progress' }>
export type BacktestProgressUpdateEvent = Extract<ChartFeedEventKind, { type: 'backtest_progress_update' }>
export type BacktestChartOverlaysEvent = Extract<ChartFeedEventKind, { type: 'backtest_chart_overlays' }>
export type BacktestReportOverlaysEvent = Extract<ChartFeedEventKind, { type: 'backtest_report_overlays' }>
export type LiveUpdateEvent = Extract<ChartFeedEventKind, { type: 'live_update' }>
export type ControlAckEvent = Extract<ChartFeedEventKind, { type: 'control_ack' }>
export type AlertListEvent = Extract<ChartFeedEventKind, { type: 'alert_list' }>
export type AlertEvent = Extract<ChartFeedEventKind, { type: 'alert' }>
export type ErrorEvent = Extract<ChartFeedEventKind, { type: 'error' }>
