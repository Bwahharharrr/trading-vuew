declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    title_txt?: any;
    data?: any;
    width?: any;
    height?: any;
    font?: any;
    colors?: any;
    overlays?: any;
    tv_id?: any;
    config?: any;
    buttons?: any;
    toolbar?: any;
    ib?: any;
    skin?: any;
    timezone?: any;
}, {}, {
    settings_ohlcv: {};
    settings_ov: {};
    activated: boolean;
}, {
    main_section(): {
        title_txt: any;
        layout: any;
        sub: any;
        range: any;
        interval: any;
        cursor: any;
        colors: any;
        font: any;
        y_ts: any;
        tv_id: any;
        config: any;
        buttons: any;
        meta: any;
        skin: any;
        dataVersion: any;
    };
    sub_section(): {
        title_txt: any;
        layout: any;
        sub: any;
        range: any;
        interval: any;
        cursor: any;
        colors: any;
        font: any;
        y_ts: any;
        tv_id: any;
        config: any;
        buttons: any;
        meta: any;
        skin: any;
        dataVersion: any;
    };
    botbar_props(): {};
    offsub(): any;
    ohlcv(): any;
    chart(): any;
    onchart(): any;
    offchart(): any;
    filter(): (arr: any, t1: any, t2: any) => any[];
    styles(): {
        'margin-left': string;
        position: string;
    };
    meta(): {
        last: never[];
        sub_start: undefined;
        activated: boolean;
    };
    forced_tf(): any;
    visibleOffchartCount(): any;
    resizerIndices(): number[];
}, {
    section_props(i: any): {
        title_txt: any;
        layout: any;
        sub: any;
        range: any;
        interval: any;
        cursor: any;
        colors: any;
        font: any;
        y_ts: any;
        tv_id: any;
        config: any;
        buttons: any;
        meta: any;
        skin: any;
        dataVersion: any;
    };
    toggleOverlayVisibility(gridId: any, overlayId: any, display: any): void;
    refreshOffchartOverlays(): void;
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
} | {
    methods: {
        data_changed(): boolean;
        check_all_data(changed: any): void;
        reindex_delta(n: any, p: any): void;
        save_data_t(): void;
    };
    data(): {
        _data_n0: null;
        _data_len: number;
        _data_t: number;
    };
} | {
    methods: {
        range_changed(r: any): void;
        clamp_range(r: any): any;
        goto(t: any): void;
        setRange(t1: any, t2: any): void;
        calc_interval(): void;
        set_ytransform(s: any): void;
        default_range(): void;
        subset(range?: any): any;
        init_range(): void;
        update_layout(clac_tf: any, forceResize?: boolean): void;
        common_props(): {
            title_txt: any;
            layout: any;
            sub: any;
            range: any;
            interval: any;
            cursor: any;
            colors: any;
            font: any;
            y_ts: any;
            tv_id: any;
            config: any;
            buttons: any;
            meta: any;
            skin: any;
            dataVersion: any;
        };
        overlay_subset(source: any, side: any): any;
        update_last_values(): void;
    };
    data(): {
        sub: never[];
        range: never[];
        interval: number;
        interval_ms: number;
        y_transforms: {};
        sub_start: undefined;
        last_candle: never[];
        last_values: {};
        rerender: number;
        chartLayout: null;
    };
    computed: {
        dimensions(): string;
        dataHashKey(): any;
    };
    watch: {
        dimensions(): void;
        ib(nw: any): void;
        timezone(): void;
        colors(): void;
        forced_tf(n: any, p: any): void;
        dataHashKey(newKey: any, oldKey: any): void;
    };
} | {
    methods: {
        on_resize_grids(e: any): void;
        _throttledResizeUpdate(): void;
        on_resize_complete(): void;
        on_toggle_minimize(gridId: any): void;
        redistribute_heights(changedGridId: any, wasMinimized: any): void;
        minimize_all_offcharts(): void;
    };
    data(): {
        customGridHeights: {};
        minimizedGrids: {};
        savedGridHeights: {};
        isResizing: boolean;
    };
    beforeUnmount(): void;
} | {
    methods: {
        cursor_changed(e: any): void;
        cursor_locked(state: any): void;
        register_kb(event: any): void;
        remove_kb(event: any): void;
    };
    data(): {
        cursor: {
            x: null;
            y: null;
            t: null;
            y$: null;
            grid_id: null;
            locked: boolean;
            values: {};
            scroll_lock: boolean;
            mode: string;
        };
    };
} | {
    methods: {
        emit_custom_event(d: any): void;
        layer_meta_props(d: any): void;
        remove_meta_props(grid_id: any, layer_id: any): void;
        legend_button_click(event: any): void;
        ce(event: any, ...args: any[]): void;
        hooks(...list: any[]): void;
    };
    data(): {
        layers_meta: {};
    };
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    title_txt?: any;
    data?: any;
    width?: any;
    height?: any;
    font?: any;
    colors?: any;
    overlays?: any;
    tv_id?: any;
    config?: any;
    buttons?: any;
    toolbar?: any;
    ib?: any;
    skin?: any;
    timezone?: any;
}> & Readonly<{}>, {}, {}, {
    GridSection: import("vue").DefineComponent<{
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
        }, {
            format(id: any, values: any): any;
            n_a(len: any): any[];
            button_click(event: any): void;
            on_dblclick(e: any): void;
            openSettings(indicator: any): void;
            closeIndicator(indicator: any): void;
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
    Botbar: import("vue").DefineComponent<{
        width?: any;
        height?: any;
        font?: any;
        colors?: any;
        tv_id?: any;
        config?: any;
        timezone?: any;
        sub?: any;
        layout?: any;
        range?: any;
        interval?: any;
        cursor?: any;
        shaders?: any;
        rerender?: any;
    }, {}, {
        layoutOverride: null;
        renderKey: number;
    }, {
        bot_shaders(): any;
        rangeKey(): string;
        layoutKey(): string;
    }, {}, {
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
        width?: any;
        height?: any;
        font?: any;
        colors?: any;
        tv_id?: any;
        config?: any;
        timezone?: any;
        sub?: any;
        layout?: any;
        range?: any;
        interval?: any;
        cursor?: any;
        shaders?: any;
        rerender?: any;
    }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    Keyboard: import("vue").DefineComponent<{}, {}, {}, {}, {
        keydown(event: any): void;
        keyup(event: any): void;
        keypress(event: any): void;
        register(listener: any): void;
        remove(listener: any): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    GridResizer: import("vue").DefineComponent<{
        grid_id?: any;
        colors?: any;
        layout?: any;
    }, {}, {
        dragging: boolean;
        startY: number;
        startHeights: never[];
    }, {
        resizerStyle(): {
            top?: undefined;
            left?: undefined;
            width?: undefined;
        } | {
            top: string;
            left: string;
            width: string;
        };
        lineStyle(): {
            background: any;
        };
    }, {
        onMouseDown(e: any): void;
        onMouseMove(e: any): void;
        onMouseUp(): void;
        onDoubleClick(e: any): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        grid_id?: any;
        colors?: any;
        layout?: any;
    }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
