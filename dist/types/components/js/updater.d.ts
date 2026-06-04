export default CursorUpdater;
declare class CursorUpdater {
    constructor(comp: any);
    comp: any;
    cursor: any;
    _screenCache: Float64Array<any> | null;
    _screenCacheKey: any;
    get grids(): any;
    _nearestTimestamp(t: any, data: any): number;
    _nearestScreenX(x: any, data: any, grid: any): number;
    sync(e: any): void;
    overlay_data(grid: any, e: any): {};
    cursor_data(grid: any, e: any): {
        x?: undefined;
        y?: undefined;
        y$?: undefined;
        t?: undefined;
        values?: undefined;
    } | {
        x: number;
        y: number;
        y$: any;
        t: any;
        values: {
            ohlcv: any;
        };
    };
    cursor_time(grid: any, mouse: any, candle: any): any;
}
