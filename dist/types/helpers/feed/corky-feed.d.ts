export class CorkyFeed extends FeedSource {
    /**
     * @param {object} cfg
     * @param {import('./corky-client.js').CorkyClient} cfg.client - a connected
     *   (or connectable) CorkyClient. Injectable so tests pass a stub/fake.
     * @param {import('../datacube.js').default} cfg.dataCube - the DataCube to
     *   drive. Injectable so tests pass a real headless DataCube.
     */
    constructor({ client, dataCube }?: {
        client: import("./corky-client.js").CorkyClient;
        dataCube: import("../datacube.js").default;
    });
    client: CorkyClient;
    dc: import("../datacube.js").default;
    _subCounter: number;
    _subs: Map<any, any>;
    _nextSubscriptionId(): string;
    /**
     * List the candle-state catalog (venues/symbols/timeframes/indicators)
     * the UI renders. Delegates to the client's list_candle_states command.
     *
     * @param {string} [venue] - optional venue filter.
     * @returns {Promise<any[]>} the `states[]` descriptor array.
     */
    discover(venue?: string): Promise<any[]>;
    /**
     * Subscribe to one venue/symbol/timeframe stream and drive the DataCube.
     *
     * @param {{ venue: string, symbol: string, timeframe: string,
     *           indicators?: string[], range?: any }} opts
     * @param {{ onStatus?: (s: any) => void, onError?: (e: any) => void }} [handlers]
     * @returns {Promise<object>} a handle (carries the subscription_id).
     */
    subscribe(opts?: {
        venue: string;
        symbol: string;
        timeframe: string;
        indicators?: string[];
        range?: any;
    }, handlers?: {
        onStatus?: (s: any) => void;
        onError?: (e: any) => void;
    }): Promise<object>;
    _onSubscriptionEvent(handle: any, event: any, onStatus: any, onError: any): void;
    _finishHistory(handle: any): void;
    _applyLive(handle: any, event: any, onStatus: any): void;
    /**
     * Stop a stream and release its routing.
     * @param {object|string} handle - the handle from subscribe(), or a raw id.
     * @returns {Promise<void>}
     */
    unsubscribe(handle: object | string): Promise<void>;
}
export default CorkyFeed;
import { FeedSource } from './feed-source.js';
import { CorkyClient } from './corky-client.js';
