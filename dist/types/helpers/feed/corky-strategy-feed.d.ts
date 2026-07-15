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
    /** Cursor-bound immutable operations page for a runtime. */
    listOperations(runtime_id: any, opts?: {}): any;
    /** Server-computed money/valuation projection; decimal strings stay intact. */
    getMoney(runtime_id: any): any;
    /** Chart overlays (decision/fill/order/allocation markers). Resolves `overlays`. */
    getChartOverlays(runtime_id: any, ticker_id: any, opts?: {}): any;
    /** Read-only allocation-policy comparison, returned exactly as projected. */
    compareAllocationPolicies(runtime_id: any, opts?: {}): any;
    /** Revision-bound administrative preview; does not mutate runtime state. */
    previewOperation(opts?: {}): any;
    /** Apply an exact preview after the operator supplies its required statement. */
    approveOperation(preview: any, approval_statement: any): any;
    /** Pause one ticker. opts: { runtime_id, ticker_id, reason, strategy_instance_id?, target_runtime_id? }. */
    pauseTicker(opts?: {}): any;
    /** Resume one paused ticker. Same opts shape as pauseTicker. */
    resumeTicker(opts?: {}): any;
    /** Unlock one locked ticker with a positive new allocation. opts adds
     *  { new_allocation: { currency, amount } } (amount is a decimal string). */
    unlockTicker(opts?: {}): any;
    /** Adopt one exact pre-existing auth position. opts: { runtime_id, ticker_id, position_id, reason, … }. */
    adoptPosition(opts?: {}): any;
    /** Adopt a named batch of pre-existing auth positions. opts: { runtime_id, positions:[{ticker_id,position_id}], reason, … }. */
    adoptPositions(opts?: {}): any;
    /** Cancel active/submitted orders on one ticker (reason is a visible operator input). */
    cancelTickerOrders(opts?: {}): any;
    /**
     * Stream the runtime set. `handlers.onData(runtimes, { sequence })` fires on
     * every (in-order) FULL-REPLACEMENT update; `handlers.onError(err, { lastGood })`
     * on a subscribe failure. Omit filters for the authoritative catalog, or scope
     * with `opts.runtime_id` / `opts.strategy` for a narrower diagnostic stream.
     * Returns a handle for unsubscribe().
     */
    subscribeRuntime(opts?: {}, handlers?: {}): {
        subscription_id: any;
        kind: string;
        args: {
            subscription_id: any;
        };
        onData: any;
        onError: any;
        lastSeq: number;
        lastGood: null;
        closed: boolean;
    };
    /** Stream immutable operation pages for one runtime. The latest published
     *  resume_cursor is retained on the handle and used after reconnect. */
    subscribeOperations(opts?: {}, handlers?: {}): {
        subscription_id: any;
        kind: string;
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
