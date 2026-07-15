export function isRetryable(code: any, wireRetryable: any): any;
export namespace KNOWN_ERROR_CODES {
    namespace unsupported_schema_version {
        let retryable: boolean;
    }
    namespace invalid_request_json {
        let retryable_1: boolean;
        export { retryable_1 as retryable };
    }
    namespace state_not_found {
        let retryable_2: boolean;
        export { retryable_2 as retryable };
    }
    namespace runtime_not_found {
        let retryable_3: boolean;
        export { retryable_3 as retryable };
    }
    namespace invalid_control_command {
        let retryable_4: boolean;
        export { retryable_4 as retryable };
    }
    namespace control_response_timeout {
        let retryable_5: boolean;
        export { retryable_5 as retryable };
    }
    namespace control_receive_error {
        let retryable_6: boolean;
        export { retryable_6 as retryable };
    }
    namespace historical_query_failed {
        let retryable_7: boolean;
        export { retryable_7 as retryable };
    }
    namespace runtime_control_rejected {
        let retryable_8: boolean;
        export { retryable_8 as retryable };
    }
    namespace control_session_required {
        let retryable_9: boolean;
        export { retryable_9 as retryable };
    }
    namespace auth_position_history_unavailable {
        let retryable_10: boolean;
        export { retryable_10 as retryable };
    }
    namespace auth_position_audit_unavailable {
        let retryable_11: boolean;
        export { retryable_11 as retryable };
    }
    namespace stateful_websocket_required {
        let retryable_12: boolean;
        export { retryable_12 as retryable };
    }
    namespace backtest_artifacts_disabled {
        let retryable_13: boolean;
        export { retryable_13 as retryable };
    }
    namespace strategy_not_found {
        let retryable_14: boolean;
        export { retryable_14 as retryable };
    }
    namespace backtest_not_found {
        let retryable_15: boolean;
        export { retryable_15 as retryable };
    }
    namespace backtest_artifact_not_ready {
        let retryable_16: boolean;
        export { retryable_16 as retryable };
    }
    namespace invalid_backtest_request {
        let retryable_17: boolean;
        export { retryable_17 as retryable };
    }
    namespace backtest_artifact_invalid {
        let retryable_18: boolean;
        export { retryable_18 as retryable };
    }
    namespace backtest_store_unavailable {
        let retryable_19: boolean;
        export { retryable_19 as retryable };
    }
}
export class CorkyError extends Error {
    constructor(code: any, message: any, retryable: any);
    code: any;
    retryable: any;
}
export class CorkyClient {
    constructor({ url, socketFactory, backoff }?: {});
    url: any;
    _socketFactory: any;
    _backoffCfg: any;
    _emitter: import("mitt").Emitter<Record<import("mitt").EventType, unknown>>;
    _pending: Map<any, any>;
    _subscribers: Map<any, any>;
    _reqCounter: number;
    _socket: any;
    _closedByUser: boolean;
    _retries: number;
    _reconnectTimer: any;
    connect(): this;
    /** True when no socket is open/opening and no reconnect is pending —
     *  i.e. only an explicit connect() can revive this client. */
    isDead(): boolean;
    _open(): void;
    _sendQueue: any[] | undefined;
    close(): void;
    _handleClose(ev: any): void;
    _reconnectPossible(): boolean;
    _scheduleReconnect(): void;
    on(type: any, cb: any): () => void;
    off(type: any, cb: any): void;
    onSubscription(subscription_id: any, cb: any): () => void;
    listCandleStates(venue: any): Promise<any>;
    subscribeCandles(opts?: {}): Promise<any>;
    unsubscribe(subscription_id: any): Promise<any>;
    searchCandles(query: any): string;
    cancelSearch(search_id: any): string;
    upsertCandleState(opts?: {}): Promise<any>;
    patchCandleState(opts?: {}): Promise<any>;
    /** One-shot snapshot. Resolves with the `auth_positions` event. */
    listAuthPositions(opts?: {}): Promise<any>;
    /** Paged closed-position history. Resolves with the `auth_position_history` event. */
    listAuthPositionHistory(opts?: {}): Promise<any>;
    /** One-shot audit bundle. Resolves with the `auth_position_audit` event. */
    getAuthPositionAudit(opts?: {}): Promise<any>;
    /**
     * Stream position snapshots. Resolves with the FIRST `auth_positions_update`;
     * register `onSubscription(subscription_id, cb)` (or pass `onEvent`) for the
     * ongoing full-replacement updates.
     */
    subscribeAuthPositions(opts?: {}): Promise<any>;
    /**
     * Stream the audit bundle for one position. Resolves with the FIRST
     * `auth_position_audit_update`; register `onSubscription` for ongoing updates.
     */
    subscribeAuthPositionAudit(opts?: {}): Promise<any>;
    /** List available strategies → resolves the `strategies` array. */
    listStrategies(): Promise<any>;
    /** Inspect one strategy → resolves the `strategy` descriptor. */
    getStrategy(strategy: any): Promise<any>;
    /** List backtest runs (all filters optional) → resolves the `runs` array. */
    listBacktestRuns(opts?: {}): Promise<any>;
    /** Raw artifact for a run → resolves the pass-through `artifact` JSON. Pass
     *  { compact:true } to get plan/scenario/optimization/rankings/parameters/
     *  metrics with heavy report arrays (fills/ledger/equity/period_returns/
     *  rejected_orders) replaced by *_count fields — bounded, so it won't hit the
     *  `backtest_artifact_too_large` error a full read raises on long sweeps. */
    getBacktestRun(run_id: any, opts?: {}): Promise<any>;
    /** One-shot progress snapshot → resolves the `events` list. */
    getBacktestProgress(run_id: any): Promise<any>;
    /**
     * Stream live progress. Resolves with the FIRST `backtest_progress_update`;
     * register `onSubscription(subscription_id, …)` for ongoing updates (apply by
     * increasing `sequence`; each update carries the FULL current event list).
     */
    subscribeBacktestProgress(opts?: {}): Promise<any>;
    /** Trade chart overlays (per chart_window) → resolves the full event. Pass
     *  start_ms/end_ms to return only trades inside that visible window. */
    getBacktestChartOverlays(opts?: {}): Promise<any>;
    /** Normalized report/account overlays → resolves the full event. Pass
     *  start_ms/end_ms to window and max_points to downsample equity_curve. */
    getBacktestReportOverlays(opts?: {}): Promise<any>;
    /** List strategy runtimes → resolves the `runtimes` array. */
    listStrategyRuntimes(): Promise<any>;
    /** Inspect one runtime → resolves the `runtime` object. */
    getStrategyRuntime(runtime_id: any): Promise<any>;
    /** Inspect one ticker within a runtime → resolves the `ticker` object. */
    getStrategyTicker(runtime_id: any, ticker_id: any): Promise<any>;
    /** Recent decisions for a runtime → resolves the `decisions` array. Optional
     *  { ticker_id } filters to one ticker; { limit } caps the count. */
    listStrategyDecisions(runtime_id: any, opts?: {}): Promise<any>;
    /** Immutable operations page for a runtime. `cursor` is opaque and must be
     *  echoed verbatim; the client never interprets projection revisions. */
    listStrategyOperations(runtime_id: any, opts?: {}): Promise<any>;
    /** Authoritative server-computed strategy money projection. */
    getStrategyMoney(runtime_id: any): Promise<any>;
    /** Strategy chart overlays (decision/fill/order/allocation markers) →
     *  resolves the `overlays` array. Optional { timeframe, start_ms, end_ms }
     *  window the result. */
    getStrategyChartOverlays(runtime_id: any, ticker_id: any, opts?: {}): Promise<any>;
    /** Compare automatic-allocation policies without mutating runtime state. */
    compareStrategyAllocationPolicies(runtime_id: any, opts?: {}): Promise<any>;
    /** Create an expiring, revision-bound preview for an administrative action. */
    previewStrategyOperation(opts?: {}): Promise<any>;
    /** Apply one exact preview. The gateway still revalidates hash, expiry and revision. */
    approveStrategyOperation(preview: any, approval_statement: any): Promise<any>;
    /**
     * Stream runtime snapshots. Resolves with the FIRST `strategy_runtime_update`;
     * register `onSubscription(subscription_id, …)` (or pass `onEvent`) for the
     * ongoing FULL-REPLACEMENT updates (apply by increasing `sequence`). Omit both
     * filters for the authoritative live catalog, or scope by runtime/strategy.
     */
    subscribeStrategyRuntime(opts?: {}): Promise<any>;
    /** Cursor-resumable immutable strategy operations stream. */
    subscribeStrategyOperations(opts?: {}): Promise<any>;
    _strategyTickerControl(type: any, name: any, opts?: {}): {
        type: any;
        runtime_id: any;
        ticker_id: any;
        reason: any;
    };
    /** Pause one strategy ticker. Requires { runtime_id, ticker_id, reason }. */
    pauseStrategyTicker(opts?: {}): Promise<any>;
    /** Resume one paused strategy ticker. Requires { runtime_id, ticker_id, reason }. */
    resumeStrategyTicker(opts?: {}): Promise<any>;
    /** Cancel active/submitted strategy-owned orders on one ticker. Requires
     *  { runtime_id, ticker_id, reason } — the reason is a visible operator input. */
    cancelStrategyTickerOrders(opts?: {}): Promise<any>;
    /** Unlock one bust/capital-shortfall-locked ticker with a positive new
     *  allocation. Requires { runtime_id, ticker_id, reason, new_allocation:{
     *  currency, amount } } — `amount` is a DECIMAL STRING forwarded verbatim. */
    unlockStrategyTicker(opts?: {}): Promise<any>;
    /** Adopt one exact pre-existing auth position. Requires { runtime_id,
     *  ticker_id, position_id, reason }. */
    adoptStrategyPosition(opts?: {}): Promise<any>;
    /** Adopt an explicitly named batch of pre-existing auth positions. Requires
     *  { runtime_id, positions:[{ ticker_id, position_id }], reason }. */
    adoptStrategyPositions(opts?: {}): Promise<any>;
    _nextRequestId(): string;
    _request(command: any, meta?: {}): Promise<any>;
    _send(frame: any): void;
    _handleMessage(ev: any): void;
    _route(envelope: any): void;
    _resultFor(type: any, event: any): any;
    _fanOutSubscription(subscription_id: any, payload: any): void;
    _pendingBySubscription(subscription_id: any): {
        request_id: any;
        onEvent: any;
    } | null;
    _settleResolve(request_id: any, value: any): void;
    _settleReject(request_id: any, err: any): void;
    _failAllPending(err: any): void;
}
export default CorkyClient;
