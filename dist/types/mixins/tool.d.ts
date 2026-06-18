declare namespace _default {
    function beforeUnmount(): void;
    namespace methods {
        function init_tool(): void;
        function render_pins(ctx: any): void;
        function set_state(name: any): void;
        function watch_uuid(n: any, p: any): void;
        function pre_draw(): void;
        function remove_tool(): void;
        function start_drag(): void;
        function drag_update(): void;
    }
    namespace computed {
        function selected(): any;
        function state(): any;
    }
}
export default _default;
