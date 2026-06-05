/**
 * Convert a decimal string (or number) to a JS number, NaN-safe.
 * Empty / null / non-numeric input → NaN (never throws).
 *
 * @param {string|number|null|undefined} s
 * @returns {number}
 */
export function decimalToNumber(s: string | number | null | undefined): number;
/**
 * Project a row's candle to a trading-vue OHLCV tuple.
 *
 * @param {import('../../types/corky-feed').ChartCandleRow} row
 * @returns {[number, number, number, number, number, number]}
 */
export function rowToOhlcv(row: import("../../types/corky-feed").ChartCandleRow): [number, number, number, number, number, number];
/**
 * Pivot per-row indicator outputs into per-series arrays.
 *
 * For every row, for each `row.indicators[instanceKey][output]`, accumulate
 * `[ts, Number(value)]` under the series key `instanceKey + '.' + output`.
 *
 * @param {import('../../types/corky-feed').ChartCandleRow[]} rows
 * @returns {Array<{ key:string, instanceKey:string, output:string,
 *                    data:[number, number][], raw:[number, string][] }>}
 *   one entry per (instanceKey, output) series, each `data` sorted ascending
 *   by ts. `raw` carries the original decimal strings alongside (tooltips).
 */
export function pivotIndicators(rows: import("../../types/corky-feed").ChartCandleRow[]): Array<{
    key: string;
    instanceKey: string;
    output: string;
    data: [number, number][];
    raw: [number, string][];
}>;
/**
 * Build a trading-vue chart-data object from a set of rows.
 *
 * @param {import('../../types/corky-feed').ChartCandleRow[]} rows
 * @param {{ timeframe?: string }} [opts]
 * @returns {{
 *   chart: { type:'Candles', data:[number,number,number,number,number,number][] },
 *   onchart: Array<{ name:string, type:string, data:[number,number][] }>,
 *   offchart: Array<{ name:string, type:string, data:[number,number][] }>
 * }}
 */
export function buildChartData(rows: import("../../types/corky-feed").ChartCandleRow[], opts?: {
    timeframe?: string;
}): {
    chart: {
        type: "Candles";
        data: [number, number, number, number, number, number][];
    };
    onchart: Array<{
        name: string;
        type: string;
        data: [number, number][];
    }>;
    offchart: Array<{
        name: string;
        type: string;
        data: [number, number][];
    }>;
};
/**
 * Flatten historical_chunk events into one ordered, deduped row list.
 *
 * Orders by `chunk_index`, then by row order within a chunk. Dedupes by
 * `[timeframe, candle.timestamp_ms]` — a later occurrence replaces an
 * earlier one (last write wins), matching live-update semantics.
 *
 * @param {import('../../types/corky-feed').HistoricalChunkEvent[]} chunkEvents
 * @returns {import('../../types/corky-feed').ChartCandleRow[]}
 */
export function assembleChunks(chunkEvents: import("../../types/corky-feed").HistoricalChunkEvent[]): import("../../types/corky-feed").ChartCandleRow[];
/**
 * Apply one `live_update` event to a chart-data object, in place.
 *
 * Drops the event if its `sequence` is <= the last seen sequence for its
 * `subscription_id` (out-of-order / duplicate). Otherwise upserts the candle
 * by timestamp and each indicator output's point into its overlay.
 *
 * @param {object} chartDataObj - result of {@link buildChartData} (mutated)
 * @param {import('../../types/corky-feed').LiveUpdateEvent} liveEvent
 * @param {Record<string, number>} lastSeqBySub - per-subscription last sequence
 *   (mutated on accept)
 * @returns {{ chart: object, applied: boolean, sequence: number }}
 */
export function applyLiveUpdate(chartDataObj: object, liveEvent: import("../../types/corky-feed").LiveUpdateEvent, lastSeqBySub: Record<string, number>): {
    chart: object;
    applied: boolean;
    sequence: number;
};
