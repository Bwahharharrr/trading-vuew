declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    grid_id?: any;
    data?: any;
    width?: any;
    height?: any;
    font?: any;
    colors?: any;
    overlays?: any;
    tv_id?: any;
    config?: any;
    sub?: any;
    layout?: any;
    range?: any;
    interval?: any;
    cursor?: any;
    y_transform?: any;
    meta?: any;
    shaders?: any;
    dataVersion?: any;
}, {}, {
    layoutOverride: null;
    renderKey: number;
    pendingLayers: never[];
    rendererGeneration: number;
}, {
    is_active(): boolean;
    rangeKey(): string;
    layoutKey(): string;
    dataKey(): string;
    yTransformKey(): string;
}, {
    new_layer(layer: any): void;
    del_layer(layer: any): void;
    on_dblclick(e: any): void;
    get_overlays(): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>[];
    common_props(): {
        cursor: any;
        colors: any;
        layout: any;
        interval: any;
        sub: any;
        font: any;
        config: any;
    };
    emit_ux_event(e: any): void;
    inject_renderer(comp: any): any;
    resize_from_layout(layout: any): void;
}, {
    methods: {
        setup(): void;
        create_canvas(h_arg: any, id: any, props: any): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>;
        redraw(): void;
        redrawDynamic(): void;
    };
    computed: {
        canvasDimensions(): string;
    };
    watch: {
        canvasDimensions(newVal: any): void;
    };
} | {
    methods: {
        on_ux_event(d: any, target: any): any;
        modify(ux: any, obj?: {}): void;
        remove_all_ux(id: any): void;
    };
    data(): {
        uxs: never[];
    };
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    grid_id?: any;
    data?: any;
    width?: any;
    height?: any;
    font?: any;
    colors?: any;
    overlays?: any;
    tv_id?: any;
    config?: any;
    sub?: any;
    layout?: any;
    range?: any;
    interval?: any;
    cursor?: any;
    y_transform?: any;
    meta?: any;
    shaders?: any;
    dataVersion?: any;
}> & Readonly<{}>, {}, {}, {
    Crosshair: import("vue").DefineComponent<{
        colors?: any;
        sub?: any;
        layout?: any;
        cursor?: any;
    }, {}, {}, {}, {
        create(): void;
        updateCrosshair(): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        colors?: any;
        sub?: any;
        layout?: any;
        cursor?: any;
    }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    KeyboardListener: import("vue").DefineComponent<{}, {}, {}, {}, {
        keydown(event: any): void;
        keyup(event: any): void;
        keypress(event: any): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
