declare namespace _default {
    namespace methods {
        function emit_custom_event(d: any): void;
        function layer_meta_props(d: any): void;
        function remove_meta_props(grid_id: any, layer_id: any): void;
        function legend_button_click(event: any): void;
        function ce(event: any, ...args: any[]): void;
        function hooks(...list: any[]): void;
    }
    function data(): {
        layers_meta: {};
    };
}
export default _default;
