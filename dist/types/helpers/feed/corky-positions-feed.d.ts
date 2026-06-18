export class CorkyPositionsFeed {
    constructor({ client }?: {});
    client: any;
    _subCounter: number;
    _subs: Map<any, any>;
    streamingSupported: boolean;
    _offClientEvents: any[];
    _everOpened: boolean;
    _nextSubscriptionId(prefix: any): string;
    /** Snapshot of OPEN positions. Resolves `{ positions, current, historical }`. */
    listOpen({ venue, account_id, symbol, include_historical }?: {
        include_historical?: boolean | undefined;
    }): Promise<{
        current: any[];
        historical: any[];
        positions: any;
    }>;
    /**
     * One page of CLOSED-position history. Resolves
     * `{ positions, next_cursor, total_count }`; pass `next_cursor` back as `cursor`
     * for the next page (opaque — never construct it yourself).
     */
    listHistory({ venue, account_id, symbol, limit, cursor }?: {}): Promise<{
        positions: any;
        next_cursor: any;
        total_count: any;
    }>;
    /** One-shot audit bundle for a selected position. Resolves the bundle (or null). */
    getAudit({ venue, account_id, symbol, position_id, include_orders, include_trades }?: {}): Promise<any>;
    /**
     * Stream OPEN positions. `handlers.onData({ positions, current, historical })`
     * fires on every (in-order) full-replacement update; `handlers.onError(err,
     * { lastGood })` on a subscribe failure. Returns a handle for unsubscribe().
     */
    subscribeOpen(opts?: {}, handlers?: {}): {
        subscription_id: any;
        method: any;
        parse: any;
        args: any;
        onData: any;
        onError: any;
        lastSeq: number;
        lastGood: null;
        closed: boolean;
    };
    /**
     * Stream the audit bundle for one position. `handlers.onData(audit)` per update;
     * `handlers.onError(err, { lastGood })` on failure. Returns a handle.
     */
    subscribeAudit(opts?: {}, handlers?: {}): {
        subscription_id: any;
        method: any;
        parse: any;
        args: any;
        onData: any;
        onError: any;
        lastSeq: number;
        lastGood: null;
        closed: boolean;
    };
    _subscribe(method: any, prefix: any, opts: any, handlers: any, parse: any): {
        subscription_id: any;
        method: any;
        parse: any;
        args: any;
        onData: any;
        onError: any;
        lastSeq: number;
        lastGood: null;
        closed: boolean;
    };
    _issue(handle: any): void;
    _onUpdate(handle: any, payload: any): void;
    _onSubError(handle: any, err: any): void;
    /** Stop a streaming subscription: detach fan-out, tell the gateway, forget it. */
    unsubscribe(handle: any): void;
    _onClientOpen(): void;
    /** Tear down: unsubscribe everything and detach connection listeners. */
    destroy(): void;
}
export default CorkyPositionsFeed;
