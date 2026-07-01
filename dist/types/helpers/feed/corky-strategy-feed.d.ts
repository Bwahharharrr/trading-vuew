export class CorkyStrategyFeed {
    constructor({ client }?: {});
    client: any;
    _subCounter: number;
    _subs: Map<any, any>;
    streamingSupported: boolean;
    _offClientEvents: any[];
    _everOpened: boolean;
    _nextSubscriptionId(prefix?: string): string;
    /** All strategy runtimes. Resolves the `runtimes` array. */
    listRuntimes(): any;
    /** One runtime's full snapshot. Resolves the `runtime` object. */
    getRuntime(runtime_id: any): any;
    /** One ticker within a runtime. Resolves the `ticker` object. */
    getTicker(runtime_id: any, ticker_id: any): any;
    /** Recent decisions for a runtime. Resolves the `decisions` array. */
    listDecisions(runtime_id: any, opts?: {}): any;
    /** Chart overlays (decision/fill/order/allocation markers). Resolves `overlays`. */
    getChartOverlays(runtime_id: any, ticker_id: any, opts?: {}): any;
    /**
     * Stream the runtime set. `handlers.onData(runtimes, { sequence })` fires on
     * every (in-order) FULL-REPLACEMENT update; `handlers.onError(err, { lastGood })`
     * on a subscribe failure. Scope with `opts.runtime_id` OR `opts.strategy`.
     * Returns a handle for unsubscribe().
     */
    subscribeRuntime(opts?: {}, handlers?: {}): {
        subscription_id: any;
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
    /** Stop a stream: detach fan-out, tell the gateway, forget it. */
    unsubscribe(handle: any): void;
    _onClientOpen(): void;
    /** Tear down: unsubscribe everything and detach connection listeners. */
    destroy(): void;
    /** Alias for destroy() — matches the dispose()/destroy() lifecycle contract. */
    dispose(): void;
}
export default CorkyStrategyFeed;
