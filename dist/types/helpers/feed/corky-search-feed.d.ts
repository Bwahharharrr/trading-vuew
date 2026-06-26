export class CorkySearchFeed {
    constructor({ client }?: {});
    client: any;
    _counter: number;
    _searches: Map<any, any>;
    _off: any[];
    /** Mint a deterministic, unique search_id (caller stamps it into the query). */
    nextSearchId(prefix?: string): string;
    /**
     * Start a search. `query` must already carry a `search_id` (build it with
     * buildSearchQuery, minting the id via {@link nextSearchId}). `handlers`:
     *   onAccepted(meta)      — query accepted, scan begins
     *   onProgress(progress)  — { phase, current, total, message }
     *   onMatch(row, info)    — row = projectMatchRow(result); info={ sequence, result }
     *   onComplete(summary)   — { matches, scanned_rows } (terminal)
     *   onCancelled(info)     — terminal, after cancel()
     *   onFailed(err)         — terminal; err={ code, message }; partials kept
     * Returns a handle; pass it (or the search_id) to {@link cancel}.
     */
    startSearch(query: any, handlers?: {}): {
        search_id: any;
        cancel: () => void;
    };
    /**
     * Cancel an in-flight search (by handle or search_id). Best-effort: sends
     * cancel_search and marks the record cancelling; the terminal
     * search_cancelled finalises it. Accumulated matches are retained.
     */
    cancel(handleOrId: any): void;
    /** Forget a finished (or abandoned) search; cancels first if still running. */
    forget(handleOrId: any): void;
    _recordFor(payload: any): any;
    _onAccepted(payload: any): void;
    _onProgress(payload: any): void;
    _onMatch(payload: any): void;
    _onComplete(payload: any): void;
    _onCancelled(payload: any): void;
    _onFailed(payload: any): void;
    _onError(payload: any): void;
    _failInfo(ev: any, fallbackCode: any): {
        code: any;
        message: any;
    };
    _onClose(): void;
    _fail(rec: any, err: any): void;
    _safe(fn: any, ...args: any[]): void;
    /** Tear down: detach listeners and forget all searches (cancelling live ones). */
    destroy(): void;
}
export default CorkySearchFeed;
