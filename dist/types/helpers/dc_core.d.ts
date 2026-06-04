export default class DCCore extends DCEvents {
    init_tvjs($root: any): void;
    tv: any;
    _cachedSettings: {
        p: any;
        i: any;
        v: any;
    }[] | null | undefined;
    _cachedSettingsKey: any;
    _settingsUnwatch: any;
    _cachedIds: any;
    _cachedIdsKey: any;
    _idsUnwatch: any;
    _datasetsUnwatch: any;
    destroy(): void;
    init_data($root: any): void;
    dss: {} | undefined;
    ui: ChartUI | undefined;
    get cd(): ChartData;
    _cd: ChartData | undefined;
    touchData(): void;
    range_changed(range: any, tf: any, check?: boolean): Promise<void>;
    loading: boolean | undefined;
    last_chunk: any[] | null | undefined;
    chunk_loaded(data: any): void;
    update_ids(): void;
    gldc: {} | undefined;
    dcgl: {} | undefined;
    update_candle(data: any): boolean;
    update_tick(data: any): boolean | void;
    update_overlays(data: any, t: any, tf: any): void;
    get_by_query(query: any, chuck: any): {
        p: any;
        i: any;
        v: any;
    }[];
    chart_as_piv(tuple: any): {
        p: any;
        i: any;
        v: any;
    }[];
    query_search(query: any, tuple: any): any;
    merge_objects(obj: any, data: any, new_obj?: {}): void;
    merge_ts(obj: any, data: any): any;
    ts_overlap(arr1: any, arr2: any, range: any): {
        od: any[];
        d1: number[];
        d2: number[];
    };
    binarySearchGTE(arr: any, target: any): number;
    binarySearchLTE(arr: any, target: any): number;
    combine(dst: any, o: any, src: any): any;
    fast_merge(data: any, point: any, main?: boolean): void;
    scroll_to(t: any): void;
}
import DCEvents from './dc_events.js';
import ChartUI from '../stores/chart-ui.js';
import ChartData from '../stores/chart-data.js';
