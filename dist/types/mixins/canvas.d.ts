declare namespace _default {
    namespace methods {
        function setup(): void;
        function create_canvas(h_arg: any, id: any, props: any): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>;
        function redraw(): void;
        function redrawDynamic(): void;
    }
    namespace computed {
        function canvasDimensions(): string;
    }
    namespace watch {
        function canvasDimensions(newVal: any): void;
    }
}
export default _default;
