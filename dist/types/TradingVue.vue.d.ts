declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    titleTxt: {
        type: StringConstructor;
        default: string;
    };
    id: {
        type: StringConstructor;
        default: string;
    };
    width: {
        type: NumberConstructor;
        default: number;
    };
    height: {
        type: NumberConstructor;
        default: number;
    };
    colorTitle: {
        type: StringConstructor;
        default: string;
    };
    colorBack: {
        type: StringConstructor;
        default: string;
    };
    colorGrid: {
        type: StringConstructor;
        default: string;
    };
    colorText: {
        type: StringConstructor;
        default: string;
    };
    colorTextHL: {
        type: StringConstructor;
        default: string;
    };
    colorScale: {
        type: StringConstructor;
        default: string;
    };
    colorCross: {
        type: StringConstructor;
        default: string;
    };
    colorCandleUp: {
        type: StringConstructor;
        default: string;
    };
    colorCandleDw: {
        type: StringConstructor;
        default: string;
    };
    colorWickUp: {
        type: StringConstructor;
        default: string;
    };
    colorWickDw: {
        type: StringConstructor;
        default: string;
    };
    colorWickSm: {
        type: StringConstructor;
        default: string;
    };
    colorVolUp: {
        type: StringConstructor;
        default: string;
    };
    colorVolDw: {
        type: StringConstructor;
        default: string;
    };
    colorPanel: {
        type: StringConstructor;
        default: string;
    };
    colorTbBack: {
        type: StringConstructor;
    };
    colorTbBorder: {
        type: StringConstructor;
        default: string;
    };
    colors: {
        type: ObjectConstructor;
    };
    font: {
        type: StringConstructor;
        default: any;
    };
    toolbar: {
        type: BooleanConstructor;
        default: boolean;
    };
    data: {
        type: ObjectConstructor;
        required: true;
    };
    overlays: {
        type: ArrayConstructor;
        default: () => never[];
    };
    chartConfig: {
        type: ObjectConstructor;
        default: () => {};
    };
    legendButtons: {
        type: ArrayConstructor;
        default: () => never[];
    };
    indexBased: {
        type: BooleanConstructor;
        default: boolean;
    };
    extensions: {
        type: ArrayConstructor;
        default: () => never[];
    };
    xSettings: {
        type: ObjectConstructor;
        default: () => {};
    };
    skin: {
        type: StringConstructor;
    };
    timezone: {
        type: NumberConstructor;
        default: number;
    };
}>, {}, {
    reset: number;
    tip: null;
}, {
    chart_props(): {
        title_txt: string;
        overlays: unknown[];
        data: any;
        width: number;
        height: number;
        font: any;
        buttons: unknown[];
        toolbar: boolean;
        ib: any;
        colors: any;
        skin: any;
        timezone: number;
    };
    chart_config(): {
        SBMIN: number;
        SBMAX: number;
        TOOLBAR: number;
        RIGHTBAR: number;
        TB_ICON: number;
        TB_ITEM_M: number;
        TB_ICON_BRI: number;
        TB_ICON_HOLD: number;
        TB_BORDER: number;
        TB_B_STYLE: string;
        TOOL_COLL: number;
        EXPAND: number;
        CANDLEW: number;
        GRIDX: number;
        GRIDY: number;
        BOTBAR: number;
        PANHEIGHT: number;
        DEFAULT_LEN: number;
        MINIMUM_LEN: number;
        MIN_ZOOM: number;
        MAX_ZOOM: number;
        VOLSCALE: number;
        UX_OPACITY: number;
        ZOOM_MODE: string;
        L_BTN_SIZE: number;
        L_BTN_MARGIN: string;
        SCROLL_WHEEL: string;
    } & Record<string, any>;
    decubed(): any;
    index_based(): any;
    mod_ovs(): any[];
    font_comp(): any;
}, {
    resetChart(resetRange?: boolean): void;
    toggleOverlayVisibility(gridId: any, overlayId: any, display: any): void;
    updateLayout(forceResize?: boolean): void;
    refreshOffchartOverlays(): void;
    goto(t: any): {
        ok: boolean;
        diagnostics: object[];
    };
    setRange(t1: any, t2: any): {
        ok: boolean;
        diagnostics: object[];
    };
    getRange(): any;
    getCursor(): any;
    showTheTip(text: any, color?: string): void;
    legend_button(event: any): void;
    open_indicator_settings(indicatorInfo: any): void;
    custom_event(d: any): void;
    range_changed(r: any): void;
    set_loader(dc: any): void;
    parse_colors(colors: any): void;
    mousedown(): void;
    mouseleave(): void;
}, {
    mounted(): void;
    methods: {
        ctrllist(): any;
        pre_dc(e: any): void;
        post_dc(e: any): void;
        ctrl_destroy(): void;
        skin_styles(): void;
    };
    computed: {
        ws(): {};
        skins(): {};
        skin_proto(): any;
        colorpack(): any;
        xSettingsKey(): any;
    };
    watch: {
        skin(n: any, p: any): void;
        extensions(): void;
        xSettingsKey(newKey: any, oldKey: any): void;
    };
    data(): {
        controllers: never[];
    };
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    titleTxt: {
        type: StringConstructor;
        default: string;
    };
    id: {
        type: StringConstructor;
        default: string;
    };
    width: {
        type: NumberConstructor;
        default: number;
    };
    height: {
        type: NumberConstructor;
        default: number;
    };
    colorTitle: {
        type: StringConstructor;
        default: string;
    };
    colorBack: {
        type: StringConstructor;
        default: string;
    };
    colorGrid: {
        type: StringConstructor;
        default: string;
    };
    colorText: {
        type: StringConstructor;
        default: string;
    };
    colorTextHL: {
        type: StringConstructor;
        default: string;
    };
    colorScale: {
        type: StringConstructor;
        default: string;
    };
    colorCross: {
        type: StringConstructor;
        default: string;
    };
    colorCandleUp: {
        type: StringConstructor;
        default: string;
    };
    colorCandleDw: {
        type: StringConstructor;
        default: string;
    };
    colorWickUp: {
        type: StringConstructor;
        default: string;
    };
    colorWickDw: {
        type: StringConstructor;
        default: string;
    };
    colorWickSm: {
        type: StringConstructor;
        default: string;
    };
    colorVolUp: {
        type: StringConstructor;
        default: string;
    };
    colorVolDw: {
        type: StringConstructor;
        default: string;
    };
    colorPanel: {
        type: StringConstructor;
        default: string;
    };
    colorTbBack: {
        type: StringConstructor;
    };
    colorTbBorder: {
        type: StringConstructor;
        default: string;
    };
    colors: {
        type: ObjectConstructor;
    };
    font: {
        type: StringConstructor;
        default: any;
    };
    toolbar: {
        type: BooleanConstructor;
        default: boolean;
    };
    data: {
        type: ObjectConstructor;
        required: true;
    };
    overlays: {
        type: ArrayConstructor;
        default: () => never[];
    };
    chartConfig: {
        type: ObjectConstructor;
        default: () => {};
    };
    legendButtons: {
        type: ArrayConstructor;
        default: () => never[];
    };
    indexBased: {
        type: BooleanConstructor;
        default: boolean;
    };
    extensions: {
        type: ArrayConstructor;
        default: () => never[];
    };
    xSettings: {
        type: ObjectConstructor;
        default: () => {};
    };
    skin: {
        type: StringConstructor;
    };
    timezone: {
        type: NumberConstructor;
        default: number;
    };
}>> & Readonly<{}>, {
    width: number;
    height: number;
    font: string;
    overlays: unknown[];
    toolbar: boolean;
    timezone: number;
    id: string;
    titleTxt: string;
    colorTitle: string;
    colorBack: string;
    colorGrid: string;
    colorText: string;
    colorTextHL: string;
    colorScale: string;
    colorCross: string;
    colorCandleUp: string;
    colorCandleDw: string;
    colorWickUp: string;
    colorWickDw: string;
    colorWickSm: string;
    colorVolUp: string;
    colorVolDw: string;
    colorPanel: string;
    colorTbBorder: string;
    chartConfig: Record<string, any>;
    legendButtons: unknown[];
    indexBased: boolean;
    extensions: unknown[];
    xSettings: Record<string, any>;
}, {}, {
    Chart: import("vue").DefineComponent<{
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
    Toolbar: import("vue").DefineComponent<{
        data?: any;
        height?: any;
        colors?: any;
        tv_id?: any;
        config?: any;
    }, {}, {
        tool_count: number;
        sub_map: {};
    }, {
        styles(): {
            width: string;
            height: string;
            'background-color': any;
            'border-right': string;
        };
        groups(): any[];
        toolsLength(): any;
    }, {
        selected(tool: any): void;
        is_selected(tool: any): boolean;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        data?: any;
        height?: any;
        colors?: any;
        tv_id?: any;
        config?: any;
    }> & Readonly<{}>, {}, {}, {
        ToolbarItem: import("vue").DefineComponent<{
            data?: any;
            colors?: any;
            tv_id?: any;
            config?: any;
            selected?: any;
            dc?: any;
            subs?: any;
        }, {}, {
            exp_hover: boolean;
            show_exp_list: boolean;
            sub_item: null;
        }, {
            item_style(): {
                width: string;
                height: string;
                margin: string;
                'background-color': any;
            } | {
                width: string;
                height: string;
                margin: string;
                'border-radius': string;
            };
            icon_style(): {
                'background-image'?: undefined;
                width?: undefined;
                height?: undefined;
                margin?: undefined;
                filter?: undefined;
            } | {
                'background-image': string;
                width: string;
                height: string;
                margin: string;
                filter: string;
            };
            exp_style(): {
                padding: string;
                transform: string;
            };
            splitter(): {
                width: string;
                height: string;
                margin: string;
                'background-color': any;
            };
        }, {
            mousedown(e: any): void;
            expmouseover(): void;
            expmouseleave(): void;
            expmousedown(e: any): void;
            emit_selected(src: any): void;
            emit_selected_sub(item: any): void;
            exp_click(e: any): void;
            close_list(): void;
        }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
            data?: any;
            colors?: any;
            tv_id?: any;
            config?: any;
            selected?: any;
            dc?: any;
            subs?: any;
        }> & Readonly<{}>, {}, {}, {
            ItemList: import("vue").DefineComponent<{
                colors?: any;
                config?: any;
                dc?: any;
                items?: any;
            }, {}, {}, {}, {
                list_style(): {
                    left: string;
                    background: any;
                    borderTop: string;
                    borderRight: string;
                    borderBottom: string;
                };
                item_class(item: any): "tvjs-item-list-item selected-item" | "tvjs-item-list-item";
                item_style(item: any): {
                    height: string;
                    color: string | undefined;
                };
                icon_style(data: any): {
                    'background-image': string;
                    width: string;
                    height: string;
                    margin: string;
                    filter: string;
                };
                item_click(e: any, item: any): void;
                onmousedown(): void;
                thismousedown(e: any): void;
            }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
                colors?: any;
                config?: any;
                dc?: any;
                items?: any;
            }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    Widgets: import("vue").DefineComponent<{
        width?: any;
        height?: any;
        map?: any;
        dc?: any;
        tv?: any;
    }, {}, {}, {}, {
        initw(id: any): any;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        width?: any;
        height?: any;
        map?: any;
        dc?: any;
        tv?: any;
    }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    TheTip: import("vue").DefineComponent<{
        data?: any;
    }, {}, {}, {
        style(): {
            background: any;
        };
    }, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        data?: any;
    }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
