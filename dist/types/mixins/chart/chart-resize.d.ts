declare namespace _default {
    namespace methods {
        function on_resize_grids(e: any): void;
        function _throttledResizeUpdate(): void;
        function on_resize_complete(): void;
        function on_toggle_minimize(gridId: any): void;
        function redistribute_heights(changedGridId: any, wasMinimized: any): void;
        function minimize_all_offcharts(): void;
    }
    function data(): {
        customGridHeights: {};
        minimizedGrids: {};
        savedGridHeights: {};
        isResizing: boolean;
    };
    function beforeUnmount(): void;
}
export default _default;
