declare namespace _default {
    function data(): {
        chartTabs: never[];
        activeChartTabId: null;
        maxChartTabs: number;
    };
    namespace computed {
        function activeTab(): any;
        function activeChart(): any;
        namespace chart {
            function get(): any;
            function set(dc: any): void;
        }
        function chartTabBarHeight(): number;
    }
    function created(): void;
    namespace methods {
        function _makeChartTab(chart: any, extra?: {}): {
            id: string;
            title: string;
            kind: string;
            strategyBalance: null;
            chart: any;
            corkyFeed: null;
            corkyCurrent: null;
            corkyHandle: null;
            corkyLast: null;
            range: null;
            corkyLoading: boolean;
            corkyProgress: null;
            corkyError: null;
            _stream: import("vue").Raw<{
                gen: number;
                retryOpts: null;
                retryTimer: null;
                retries: number;
                retryKeepSpinner: boolean;
            }>;
            positionPlot: null;
            searchNav: null;
            priceAlarms: never[];
            rectDrawMode: boolean;
            btPlot: null;
            btProgressSub: null;
        };
        function setupChartCube(dc: any): void;
        function seedInitialChartTab(): void;
        function onTabCubeReplaced(tab: any, dc: any): void;
        function createChartTab(): {
            id: string;
            title: string;
            kind: string;
            strategyBalance: null;
            chart: any;
            corkyFeed: null;
            corkyCurrent: null;
            corkyHandle: null;
            corkyLast: null;
            range: null;
            corkyLoading: boolean;
            corkyProgress: null;
            corkyError: null;
            _stream: import("vue").Raw<{
                gen: number;
                retryOpts: null;
                retryTimer: null;
                retries: number;
                retryKeepSpinner: boolean;
            }>;
            positionPlot: null;
            searchNav: null;
            priceAlarms: never[];
            rectDrawMode: boolean;
            btPlot: null;
            btProgressSub: null;
        } | null;
        function createStrategyBalanceTab({ runtimeId, strategyName, timeframe }?: {
            timeframe?: string | undefined;
        }): any;
        function activateChartTab(id: any): void;
        function serializeChartTabs(): any;
        function restoreChartTabs(saved: any): number;
        function _appendChartTab(): {
            id: string;
            title: string;
            kind: string;
            strategyBalance: null;
            chart: any;
            corkyFeed: null;
            corkyCurrent: null;
            corkyHandle: null;
            corkyLast: null;
            range: null;
            corkyLoading: boolean;
            corkyProgress: null;
            corkyError: null;
            _stream: import("vue").Raw<{
                gen: number;
                retryOpts: null;
                retryTimer: null;
                retries: number;
                retryKeepSpinner: boolean;
            }>;
            positionPlot: null;
            searchNav: null;
            priceAlarms: never[];
            rectDrawMode: boolean;
            btPlot: null;
            btProgressSub: null;
        } | null;
        function closeChartTab(id: any): void;
        function _destroyChartTabCube(tab: any): void;
        function destroyAllChartTabs(): void;
    }
}
export default _default;
