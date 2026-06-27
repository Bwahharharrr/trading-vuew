export function boxReadout(grid: any, { topY, botY, leftX, rightX }: {
    topY: any;
    botY: any;
    leftX: any;
    rightX: any;
}, tzHours?: number): {
    high: string;
    low: string;
    tStart: number;
    tEnd: number;
    startStr: string;
    endStr: string;
};
declare namespace _default {
    function data(): {
        isDrawing: boolean;
        rectStart: null;
        rectCurrent: null;
        orderTypeModalOpen: boolean;
        orderModalOpen: boolean;
        pendingBoxGeometry: null;
        editingOrderBox: null;
    };
    namespace methods {
        function toggleRectDrawMode(): void;
        function onDrawStart(event: any): void;
        function onDrawMove(event: any): void;
        function _drawCanvasEl(chart: any): any;
        function onDrawEnd(event: any): void;
        function onOrderTypeSelect(type: any): void;
        function onOrderTypeCancel(): void;
        function onOrderBoxSettings(payload: any): void;
        function onOrderConfirm(cfg: any): void;
        function onOrderCancel(): void;
    }
}
export default _default;
