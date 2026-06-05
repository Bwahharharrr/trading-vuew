/**
 * Lightly enforce the FeedSource contract on an arbitrary object — useful for
 * factory-style feeds that aren't `class extends FeedSource`. Throws if a
 * required method is missing; returns the object unchanged otherwise.
 *
 * @template T
 * @param {T} feed
 * @returns {T}
 */
export function asFeedSource<T>(feed: T): T;
/** @typedef {{ onStatus?: (s: any) => void, onError?: (e: any) => void }} FeedHandlers */
/** @typedef {{ venue: string, symbol: string, timeframe: string,
 *              indicators?: string[], range?: any }} SubscribeOpts */
/**
 * Base class for a FeedSource. Concrete feeds extend this and override the
 * abstract methods. The defaults throw a clear `not implemented` so a
 * half-built feed fails loudly rather than silently doing nothing.
 *
 * @abstract
 */
export class FeedSource {
    /**
     * List the catalog of available states (venues/symbols/timeframes/
     * indicators) the UI will render.
     * @returns {Promise<any[]>}
     * @abstract
     */
    discover(): Promise<any[]>;
    /**
     * Subscribe to a stream of chart data.
     * @param {SubscribeOpts} _opts
     * @param {FeedHandlers} [_handlers]
     * @returns {Promise<any>} an opaque handle for {@link unsubscribe}
     * @abstract
     */
    subscribe(_opts: SubscribeOpts, _handlers?: FeedHandlers): Promise<any>;
    /**
     * Stop a stream previously started by {@link subscribe}.
     * @param {any} _handle
     * @returns {Promise<void>}
     * @abstract
     */
    unsubscribe(_handle: any): Promise<void>;
    /**
     * Tear the feed down: unsubscribe everything + release the transport.
     * Defaults to a no-op so trivial feeds need not override it.
     * @returns {void}
     */
    destroy(): void;
}
export default FeedSource;
export type FeedHandlers = {
    onStatus?: (s: any) => void;
    onError?: (e: any) => void;
};
export type SubscribeOpts = {
    venue: string;
    symbol: string;
    timeframe: string;
    indicators?: string[];
    range?: any;
};
