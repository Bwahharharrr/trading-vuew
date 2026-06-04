declare namespace _default {
    function data(): {
        charts: {};
        currentTimeframe: null;
        selectedTimeframe: number;
        log_scale: boolean;
        width: number;
        height: number;
        config: {
            DEFAULT_LEN: number;
            TB_BORDER: number;
            CANDLEW: number;
            GRIDX: number;
            VOLSCALE: number;
            RIGHTBAR: number;
        };
    };
    namespace computed {
        function colors(): {
            back: string;
            grid: string;
            text: string;
            cross: string;
            candle_dw: string;
            wick_dw: string;
        };
        function rightPanelWidth(): any;
        function chartWidth(): number;
        function chartHeight(): number;
        function bottomPanelHeight(): number;
        function timeframes(): string[];
    }
    namespace methods {
        function onResize(): void;
        function resetView(): void;
        function selectTimeframe(tf: any, index: any): void;
        function initializeChart(data: any): void;
    }
    namespace watch {
        function log_scale(value: any): void;
    }
}
export default _default;
