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
export function buildDetectionBoxes(rule: any, outputsMap: any, ohlcv: any): {
    boxes: ({
        side: string;
        top: number;
        bottom: number;
        t0: any;
        t1: any;
        alive: boolean;
        seed: boolean;
        seedCount: number;
    } | {
        side: string;
        top: any;
        bottom: any;
        t0: any;
        t1: any;
        alive: boolean;
        seed?: undefined;
        seedCount?: undefined;
    })[];
    tf: number;
    lastTs: any;
};
/** Zones settings-format rows ([x1, y1, x2, y2, rgba]) — one row per box. */
export function detectionBoxRows(boxes: any, rule: any): any;
/** Boxes covering the bar at `ts` (a bar is covered when the box spans its
 *  whole open..close) — must equal the server's `{side}_box_count`. */
export function detectionBoxCountAt(boxes: any, ts: any, tf: any, side?: null): any;
export function buildLayerOverlays(instanceKey: any, kind: any, outputsMap: any, view: any, paneResolver: any, ohlcv?: null): {
    onchart: ({
        name: any;
        type: string;
        data: never[];
        settings: {
            corkyKey: string;
            corkyKind: any;
            corkyInstance: any;
            corkyLayerId: any;
            corkyView: boolean;
            corkyVisibleDefault: boolean;
            display: boolean;
            legend: boolean;
            'z-index': number;
            zones: any;
        };
        raw: never[];
    } | {
        name: any;
        type: string;
        data: any;
        settings: object & ({
            corkyKey: string;
            corkyKind: any;
            corkyInstance: any;
            corkyLayerId: any;
            corkyView: boolean;
            corkyVisibleDefault: boolean;
            display: boolean;
        } & ({
            corkyColorRule: string;
            valueField: any;
            slopeField: any;
            ssColors: {
                positive_rising_color: any;
                positive_falling_color: any;
                negative_falling_color: any;
                negative_rising_color: any;
            };
            dataIndex: number;
            colorIndex: number;
            zeroLine: boolean;
            corkyFields: any[];
        } | {
            corkyFields: any;
            corkyColorRule?: undefined;
            valueField?: undefined;
            slopeField?: undefined;
            ssColors?: undefined;
            dataIndex?: undefined;
            colorIndex?: undefined;
            zeroLine?: undefined;
        }));
        raw: any;
    })[];
    offchart: {
        name: any;
        type: string;
        data: any;
        settings: object & ({
            corkyKey: string;
            corkyKind: any;
            corkyInstance: any;
            corkyLayerId: any;
            corkyView: boolean;
            corkyVisibleDefault: boolean;
            display: boolean;
        } & ({
            corkyColorRule: string;
            valueField: any;
            slopeField: any;
            ssColors: {
                positive_rising_color: any;
                positive_falling_color: any;
                negative_falling_color: any;
                negative_rising_color: any;
            };
            dataIndex: number;
            colorIndex: number;
            zeroLine: boolean;
            corkyFields: any[];
        } | {
            corkyFields: any;
            corkyColorRule?: undefined;
            valueField?: undefined;
            slopeField?: undefined;
            ssColors?: undefined;
            dataIndex?: undefined;
            colorIndex?: undefined;
            zeroLine?: undefined;
        }));
        raw: any;
    }[];
    candleColor: ({
        instanceKey: any;
        field: string | null;
        byTs: Map<any, any>;
        opts: null;
        palette: null;
        byTsLabel: null;
        bullBear: {
            bullField: string | null;
            bearField: string | null;
            bullColor: string;
            bearColor: string;
            bothColor: string;
        };
        layerId: any;
    } | {
        instanceKey: any;
        field: any;
        byTs: Map<any, any>;
        opts: object | null;
        palette: {
            colorField: string;
            labelField: string | null;
            colors: Record<string, string>;
            labels: Record<string, string>;
        } | null;
        byTsLabel: Map<any, any> | null;
        layerId: any;
        bullBear?: undefined;
    })[];
    detectionBoxes: {
        instanceKey: any;
        layerId: any;
        rule: object;
        boxes: ({
            side: string;
            top: number;
            bottom: number;
            t0: any;
            t1: any;
            alive: boolean;
            seed: boolean;
            seedCount: number;
        } | {
            side: string;
            top: any;
            bottom: any;
            t0: any;
            t1: any;
            alive: boolean;
            seed?: undefined;
            seedCount?: undefined;
        })[];
        tf: number;
        evaluatedThrough: any;
        lastLiveTs: null;
        lastVals: null;
        overlay: {
            name: any;
            type: string;
            data: never[];
            settings: {
                corkyKey: string;
                corkyKind: any;
                corkyInstance: any;
                corkyLayerId: any;
                corkyView: boolean;
                corkyVisibleDefault: boolean;
                display: boolean;
                legend: boolean;
                'z-index': number;
                zones: any;
            };
            raw: never[];
        };
    }[];
};
export function buildChartData(rows: any, opts?: {}): {
    chart: {
        type: string;
        data: any;
    };
    onchart: ({
        name: any;
        type: string;
        data: never[];
        settings: {
            corkyKey: string;
            corkyKind: any;
            corkyInstance: any;
            corkyLayerId: any;
            corkyView: boolean;
            corkyVisibleDefault: boolean;
            display: boolean;
            legend: boolean;
            'z-index': number;
            zones: any;
        };
        raw: never[];
    } | {
        name: any;
        type: string;
        data: any;
        settings: object & ({
            corkyKey: string;
            corkyKind: any;
            corkyInstance: any;
            corkyLayerId: any;
            corkyView: boolean;
            corkyVisibleDefault: boolean;
            display: boolean;
        } & ({
            corkyColorRule: string;
            valueField: any;
            slopeField: any;
            ssColors: {
                positive_rising_color: any;
                positive_falling_color: any;
                negative_falling_color: any;
                negative_rising_color: any;
            };
            dataIndex: number;
            colorIndex: number;
            zeroLine: boolean;
            corkyFields: any[];
        } | {
            corkyFields: any;
            corkyColorRule?: undefined;
            valueField?: undefined;
            slopeField?: undefined;
            ssColors?: undefined;
            dataIndex?: undefined;
            colorIndex?: undefined;
            zeroLine?: undefined;
        }));
        raw: any;
    } | {
        name: string;
        type: string;
        data: [number, number][];
        settings: {
            corkyKey: string;
            corkyKind: any;
            corkyOutput: string;
        };
        raw: [number, string][];
    })[];
    offchart: ({
        name: any;
        type: string;
        data: any;
        settings: object & ({
            corkyKey: string;
            corkyKind: any;
            corkyInstance: any;
            corkyLayerId: any;
            corkyView: boolean;
            corkyVisibleDefault: boolean;
            display: boolean;
        } & ({
            corkyColorRule: string;
            valueField: any;
            slopeField: any;
            ssColors: {
                positive_rising_color: any;
                positive_falling_color: any;
                negative_falling_color: any;
                negative_rising_color: any;
            };
            dataIndex: number;
            colorIndex: number;
            zeroLine: boolean;
            corkyFields: any[];
        } | {
            corkyFields: any;
            corkyColorRule?: undefined;
            valueField?: undefined;
            slopeField?: undefined;
            ssColors?: undefined;
            dataIndex?: undefined;
            colorIndex?: undefined;
            zeroLine?: undefined;
        }));
        raw: any;
    } | {
        name: string;
        type: string;
        data: [number, number][];
        settings: {
            corkyKey: string;
            corkyKind: any;
            corkyOutput: string;
        };
        raw: [number, string][];
    })[];
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
