declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    grid_id?: any;
    common?: any;
}, {}, {
    meta_props: {};
    rerender: number;
    legendLayoutOverride: null;
}, {
    grid_props(): any;
    sidebar_props(): any;
    section_values(): any;
    legend_props(): any;
    get_meta_props(): {};
    grid_shaders(): never[];
    sb_shaders(): never[];
    layoutKey(): string;
}, {
    range_changed(r: any): void;
    cursor_changed(c: any): void;
    cursor_locked(state: any): void;
    sidebar_transform(s: any): void;
    sidebar_click(s: any): void;
    sidebar_cursor(c: any): void;
    emit_meta_props(d: any): void;
    emit_custom_event(d: any): void;
    button_click(event: any): void;
    legend_dblclick(grid_id: any): void;
    register_kb(event: any): void;
    remove_kb(event: any): void;
    rezoom_range(event: any): void;
    open_indicator_settings(indicatorInfo: any): void;
    close_indicator(indicatorInfo: any): void;
    updateLegendPosition(layout: any): void;
    clearLayoutOverride(): void;
    getGridHeightKey(common: any): any;
}, {
    methods: {
        init_shaders(skin: any, prev: any): void;
        on_shader_event(d: any, target: any): void;
    };
    watch: {
        skin(n: any, p: any): void;
    };
    data(): {
        shaders: never[];
    };
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    grid_id?: any;
    common?: any;
}> & Readonly<{}>, {}, {}, {
    Grid: import("vue").DefineComponent<{
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
    Sidebar: import("vue").DefineComponent<{
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
            redraw(): void;
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
    ChartLegend: import("vue").DefineComponent<{
        grid_id?: any;
        common?: any;
        values?: any;
        meta_props?: any;
        layout_override?: any;
    }, {}, {}, {
        ohlcv(): any;
        _indexMap(): Map<any, any>;
        indicators(): any;
        calc_style(): {
            top: string;
            width: string;
        };
        layout(): any;
        json_data(): any;
        off_data(): any;
        main_type(): any;
        show_values(): boolean;
        main_overlay(): any;
        show_volume_row(): boolean;
        chart_show_volume(): any;
        volume_detached(): any;
    }, {
        format(id: any, values: any): any;
        n_a(len: any): any[];
        button_click(event: any): void;
        on_dblclick(e: any): void;
        openSettings(indicator: any): void;
        closeIndicator(indicator: any): void;
        openVolumeSettings(): void;
        volume_button_click(event: any): void;
        toggleVolumeDetach(): void;
        isDetachedVolume(ind: any): any;
        reattachVolume(): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        grid_id?: any;
        common?: any;
        values?: any;
        meta_props?: any;
        layout_override?: any;
    }> & Readonly<{}>, {}, {}, {
        ButtonGroup: import("vue").DefineComponent<{
            grid_id?: any;
            index?: any;
            tv_id?: any;
            config?: any;
            buttons?: any;
            ov_id?: any;
            display?: any;
        }, {}, {}, {}, {
            button_click(event: any): void;
        }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
            grid_id?: any;
            index?: any;
            tv_id?: any;
            config?: any;
            buttons?: any;
            ov_id?: any;
            display?: any;
        }> & Readonly<{}>, {}, {}, {
            LegendButton: import("vue").DefineComponent<{
                grid_id?: any;
                index?: any;
                tv_id?: any;
                config?: any;
                ov_id?: any;
                display?: any;
                id?: any;
                icon?: any;
            }, {}, {}, {
                base64(): any;
                file_name(): string;
                uuid(): string;
                data_type(): "onchart" | "offchart";
                data_index(): any;
            }, {
                onclick(): void;
            }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
                grid_id?: any;
                index?: any;
                tv_id?: any;
                config?: any;
                ov_id?: any;
                display?: any;
                id?: any;
                icon?: any;
            }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        Spinner: import("vue").DefineComponent<{
            colors?: any;
        }, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
            colors?: any;
        }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
