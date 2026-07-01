declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    grid_id?: any;
    width?: any;
    height?: any;
    font?: any;
    colors?: any;
    tv_id?: any;
    config?: any;
    sub?: any;
    layout?: any;
    range?: any;
    interval?: any;
    cursor?: any;
    y_transform?: any;
    shaders?: any;
    rerender?: any;
}, {}, {
    layoutOverride: null;
    renderKey: number;
}, {
    rangeKey(): string;
    layoutKey(): string;
    yTransformKey(): string;
}, {
    resize_from_layout(layout: any): void;
}, {
    methods: {
        setup(): void;
        create_canvas(h_arg: any, id: any, props: any): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>;
        redraw(freshGridLayout: any): void;
        redrawDynamic(): void;
    };
    computed: {
        canvasDimensions(): string;
    };
    watch: {
        canvasDimensions(newVal: any): void;
    };
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    grid_id?: any;
    width?: any;
    height?: any;
    font?: any;
    colors?: any;
    tv_id?: any;
    config?: any;
    sub?: any;
    layout?: any;
    range?: any;
    interval?: any;
    cursor?: any;
    y_transform?: any;
    shaders?: any;
    rerender?: any;
}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
