declare namespace _default {
    function data(): {
        rectDrawMode: boolean;
        isDrawing: boolean;
        rectStart: null;
        rectCurrent: null;
    };
    namespace methods {
        function toggleRectDrawMode(): void;
        function onDrawStart(event: any): void;
        function onDrawMove(event: any): void;
        function onDrawEnd(event: any): void;
    }
}
export default _default;
