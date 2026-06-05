export class CorkyFeed extends FeedSource {
    /**
     * @param {object} cfg
     * @param {import('./corky-client.js').CorkyClient} cfg.client - a connected
     *   (or connectable) CorkyClient. Injectable so tests pass a stub/fake.
     * @param {import('../datacube.js').default} cfg.dataCube - the DataCube to
     *   drive. Injectable so tests pass a real headless DataCube.
     */
    constructor({ client, dataCube, subscribeTimeoutMs }?: {
        client: import("./corky-client.js").CorkyClient;
        dataCube: import("../datacube.js").default;
    });
    client: CorkyClient;
    dc: import("../datacube.js").default;
    subscribeTimeoutMs: any;
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
    /**
     * Show/hide every overlay of a given indicator KIND in the DataCube,
     * WITHOUT re-subscribing — the data is already loaded and kept fresh on
     * `handle.built`. Idempotent.
     *
     * on  → dc.add(pane, ov) for each handle.built overlay whose
     *       settings.corkyKind === kind that isn't already added (the SAME
     *       overlay object, so live upserts mutate it in place); track the
     *       added overlay for later removal.
     * off → dc.del(ov.id) for each tracked overlay of that kind.
     *
     * @param {object} handle - the subscribe() handle.
     * @param {string} kind   - indicator kind (e.g. 'MACD'); matched against
     *                          settings.corkyKind.
     * @param {boolean} on    - enable (show) or disable (hide).
     * @returns {boolean} whether this kind actually has overlays in the loaded
     *   data (so the caller knows whether the toggle was meaningful).
     */
    setIndicatorEnabled(handle: object, kind: string, on: boolean): boolean;
    _removeOverlay(dc: any, ov: any): void;
    /** Indicator kinds currently shown in the DataCube for a handle. */
    enabledKinds(handle: any): Set<any>;
    _applyLive(handle: any, event: any, onStatus: any): void;
    _clearHandle(h: any): void;
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
