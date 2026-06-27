declare namespace _default {
    function data(): {
        charts: {};
        currentTimeframe: null;
        selectedTimeframe: number;
        log_scale: boolean;
        width: number;
        height: number;
        panelWidth: number;
        rightPanelCollapsed: boolean;
        positionsDockOpen: boolean;
        positionsDockHeight: number;
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
        function chartHeight(): any;
        function bottomPanelHeight(): number;
        function bottomDockHeight(): number;
        function timeframes(): string[];
    }
    namespace methods {
        function onResize(): void;
        function startPanelResize(e: any): void;
        function endPanelResize(): void;
        function toggleRightPanel(): void;
        function resetView(): void;
        function captureScreen(): Promise<void>;
        function _captureViaHtml2Canvas(): Promise<void>;
        function screenshotName(now?: Date): string;
        function _saveScreenshot(blob: any, name: any): Promise<void>;
        function selectTimeframe(tf: any, index: any): void;
        function initializeChart(data: any): void;
    }
    namespace watch {
        function log_scale(value: any): void;
    }
}
export default _default;
