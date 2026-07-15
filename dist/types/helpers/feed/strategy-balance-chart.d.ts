export function balanceChartPoints(history: any): any;
export function splitBalanceSegments(points: any, valueKey: any, baseline: any): {
    tone: string;
    points: {
        timestamp: any;
        value: any;
    }[];
}[];
/**
 * Build a standard TradingVue DataCube description for one balance history.
 *
 * The main spline carries extra high/low columns because the existing main-grid
 * layout reads row[2]/row[3] to determine its Y range. All visible lines are the
 * chart engine's normal Spline overlays, so axes, crosshair, zoom, pan, log scale,
 * reset, capture, and tab range restoration use the established code paths.
 */
export function strategyBalanceChartData(history: any, { strategyName }?: {
    strategyName?: string | undefined;
}): {
    chart: {
        name: string;
        type: string;
        data: any;
        settings: {
            color: string;
            lineWidth: number;
            skipNaN: boolean;
            showVolume: boolean;
        };
    };
    onchart: {
        name: any;
        type: string;
        data: any;
        settings: any;
    }[];
    offchart: never[];
};
