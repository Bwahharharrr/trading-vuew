// FeedSource — the chart-feed abstraction (the seam the UI talks to).
//
// A FeedSource is whatever can (a) DISCOVER the catalog of available
// venues/symbols/timeframes/indicators, and (b) SUBSCRIBE to a live, growing
// stream of chart data for one of them — surfacing status + errors as it goes.
// Both the Corky WS gateway (CorkyFeed) and a local file replay (FileFeed,
// later) implement this same contract, so the UI is feed-agnostic.
//
// This module is deliberately tiny: it documents the contract and provides a
// base class whose methods throw `not implemented` until a concrete feed
// overrides them. Subclasses MUST override discover/subscribe/unsubscribe;
// destroy() defaults to a no-op so trivial feeds need not implement it.
//
// Contract:
//
//   FeedSource {
//     async discover()                 -> Promise<State[]>
//         List the catalog the UI renders (venues/symbols/timeframes/
//         indicators). The shape of State is feed-specific (for Corky it is
//         the `candle_states` descriptor array).
//
//     async subscribe(opts, handlers)  -> Promise<handle>
//         opts:     { venue, symbol, timeframe, indicators?, range? }
//         handlers: { onStatus?(status), onError?(err) }
//         Begins streaming chart data into the feed's sink (e.g. a DataCube).
//         Resolves with an opaque `handle` used to unsubscribe.
//
//     async unsubscribe(handle)        -> Promise<void>
//         Stop the stream identified by `handle` and release its routing.
//
//     destroy()                        -> void
//         Tear everything down (unsubscribe all + close the transport).
//   }

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
    async discover() {
        throw new Error('FeedSource.discover: not implemented')
    }

    /**
     * Subscribe to a stream of chart data.
     * @param {SubscribeOpts} _opts
     * @param {FeedHandlers} [_handlers]
     * @returns {Promise<any>} an opaque handle for {@link unsubscribe}
     * @abstract
     */
    async subscribe(_opts, _handlers) {
        throw new Error('FeedSource.subscribe: not implemented')
    }

    /**
     * Stop a stream previously started by {@link subscribe}.
     * @param {any} _handle
     * @returns {Promise<void>}
     * @abstract
     */
    async unsubscribe(_handle) {
        throw new Error('FeedSource.unsubscribe: not implemented')
    }

    /**
     * Tear the feed down: unsubscribe everything + release the transport.
     * Defaults to a no-op so trivial feeds need not override it.
     * @returns {void}
     */
    destroy() {}
}

/**
 * Lightly enforce the FeedSource contract on an arbitrary object — useful for
 * factory-style feeds that aren't `class extends FeedSource`. Throws if a
 * required method is missing; returns the object unchanged otherwise.
 *
 * @template T
 * @param {T} feed
 * @returns {T}
 */
export function asFeedSource(feed) {
    for (const m of ['discover', 'subscribe', 'unsubscribe']) {
        if (typeof feed[m] !== 'function') {
            throw new Error(`FeedSource: missing required method '${m}'`)
        }
    }
    if (typeof feed.destroy !== 'function') feed.destroy = () => {}
    return feed
}

export default FeedSource
