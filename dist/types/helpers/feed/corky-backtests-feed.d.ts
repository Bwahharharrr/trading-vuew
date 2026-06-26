export class CorkyBacktestsFeed {
    constructor({ client }?: {});
    client: any;
    _subCounter: number;
    _subs: Map<any, any>;
    streamingSupported: boolean;
    _offClientEvents: any[];
    _everOpened: boolean;
    _nextSubscriptionId(prefix?: string): string;
    /** Available strategies. Resolves `ChartStrategyDescriptor[]`. */
    listStrategies(): any;
    /** One strategy's descriptor. Resolves `ChartStrategyDescriptor`. */
    getStrategy(strategy: any): any;
    /** Backtest runs (all filters optional). Resolves `ChartBacktestRunSummary[]`. */
    listRuns(filters?: {}): any;
    /** Raw pass-through artifact for a run. Resolves `{ run_id, artifact }`. Pass
     *  { compact:true } for the bounded metadata/rankings shape. */
    getRun(run_id: any, opts?: {}): any;
    /** One-shot progress snapshot. Resolves the progress-event list (`[]` if none). */
    getProgress(run_id: any): Promise<any>;
    /** Per-trade chart windows + markers. Resolves the full overlays event. */
    getChartOverlays(opts?: {}): any;
    /** Normalized report/account overlays. Resolves the full overlays event. */
    getReportOverlays(opts?: {}): any;
    /**
     * Stream live progress for a run. `handlers.onData(events, { sequence, run_id })`
     * fires on every (in-order) full-replacement update; `handlers.onError(err,
     * { lastGood })` on a subscribe failure. Returns a handle for unsubscribe().
     */
    subscribeProgress(opts?: {}, handlers?: {}): {
        subscription_id: any;
        run_id: any;
        args: {
            subscription_id: any;
        };
        onData: any;
        onError: any;
        lastSeq: number;
        lastGood: null;
        closed: boolean;
    };
    _issue(handle: any): void;
    _onUpdate(handle: any, payload: any): void;
    _onSubError(handle: any, err: any): void;
    /** Stop a progress stream: detach fan-out, tell the gateway, forget it. */
    unsubscribe(handle: any): void;
    _onClientOpen(): void;
    /** Tear down: unsubscribe everything and detach connection listeners. */
    destroy(): void;
}
export default CorkyBacktestsFeed;
