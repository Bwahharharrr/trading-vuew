declare namespace _default {
    function data(): {
        candleColoringOptions: never[];
        selectedView: string;
        displayedView: string;
        originalChartData: null;
    };
    namespace methods {
        function extractCandleColoringOptions(chartData: any, timeframe?: null): void;
        function prepareChartData(chartData: any, timeframe?: null, originalChartData?: null): {
            chart: any;
            onchart: any;
            offchart: any;
        };
        function onViewSelected(viewName: any): void;
        function applyCurrentColoring(): void;
        function applyViewOffchart(viewData: any): void;
        function buildOffchartData(persistentIndicators: any, viewData?: null): any;
    }
}
export default _default;
