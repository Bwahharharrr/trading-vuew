declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {
    chart: DataCube;
    overlays: import("vue").Raw<{
        name: string;
        mixins: {
            props: string[];
            mounted(): void;
            beforeUnmount(): void;
            methods: {
                use_for(): void;
                meta_info(): void;
                custom_event(event: any, ...args: any[]): void;
                exec_script(): void;
            };
            watch: {
                settingsDisplayKey(newKey: any, oldKey: any): void;
            };
            computed: {
                sett(): any;
                settingsDisplayKey(): string;
            };
            data(): {
                uxs_count: number;
                last_ux_id: null;
            };
            render(): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
                [key: string]: any;
            }>;
        }[];
        methods: {
            draw(ctx: any): void;
            use_for(): string[];
        };
        computed: {};
    } | import("vue").DefineComponent<{}, {}, {}, {
        side(): "buy" | "sell";
        visible(): boolean;
        orders(): any;
        color_buy(): any;
        color_sell(): any;
        fill_buy(): any;
        fill_sell(): any;
        font11(): string;
    }, {
        meta_info(): {
            author: string;
            version: string;
        };
        use_for(): string[];
        init(): void;
        destroy(): void;
        watch_uuid(n: any, p: any): void;
        corner(i: any): any;
        box_rect(): {
            xL: number;
            xR: number;
            yT: number;
            yB: number;
        } | null;
        order_geometry(ctx: any, r: any): {
            eye: {
                x: any;
                y: any;
                w: number;
                h: number;
            };
            cog: {
                x: any;
                y: any;
                w: number;
                h: number;
            };
            submit: {
                x: any;
                y: any;
                w: number;
                h: number;
                st: {
                    label: string;
                    color: any;
                    submittable: any;
                };
            };
            rows: {
                id: any;
                size: any;
                status: any;
                y: any;
                xL: any;
                xR: any;
                widget: {
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                };
                grab: {
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                };
                del: {
                    x: number;
                    y: number;
                    w: number;
                    h: number;
                };
            }[];
            resize: any[];
        };
        order_status(): {
            label: string;
            color: any;
            submittable: any;
        };
        order_type_label(): any;
        has_submittable(): any;
        order_summary(): {
            count: any;
            origQty: any;
            origSize: any;
            totalSize: number;
            filledCount: number;
            filledSize: number;
            avgPrice: number | null;
        } | null;
        has_live_orders(): any;
        remove_tool(): void;
        draw(ctx: any): void;
        draw_ghost(ctx: any, color: any): void;
        draw_resize_handles(ctx: any, handles: any, color: any): void;
        draw_order(ctx: any, row: any, color: any): void;
        draw_summary(ctx: any, r: any): void;
        draw_cog(ctx: any, c: any, color: any, locked?: boolean): void;
        draw_dist_curve(ctx: any, r: any, color: any): void;
        draw_eye(ctx: any, e: any, open: any, color: any): void;
        draw_submit(ctx: any, s: any): void;
        on_mousedown(e: any): void;
        on_mousemove(): void;
        drag_update(): void;
        set_cursor(c: any): void;
        update_cursor(): void;
        on_boundary(r: any, x: any, y: any): boolean;
        on_mouseup(): void;
        set_orders(mapFn: any): void;
        delete_order(id: any): void;
        recompute_orders(): void;
        data_colors(): any[];
    }, {
        props: string[];
        mounted(): void;
        beforeUnmount(): void;
        methods: {
            use_for(): void;
            meta_info(): void;
            custom_event(event: any, ...args: any[]): void;
            exec_script(): void;
        };
        watch: {
            settingsDisplayKey(newKey: any, oldKey: any): void;
        };
        computed: {
            sett(): any;
            settingsDisplayKey(): string;
        };
        data(): {
            uxs_count: number;
            last_ux_id: null;
        };
        render(): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>;
    } | {
        beforeUnmount(): void;
        methods: {
            init_tool(): void;
            render_pins(ctx: any): void;
            set_state(name: any): void;
            watch_uuid(n: any, p: any): void;
            pre_draw(): void;
            remove_tool(): void;
            start_drag(): void;
            drag_update(): void;
        };
        computed: {
            selected(): any;
            state(): any;
        };
    }, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any> | import("vue").DefineComponent<{}, {}, {}, {
        font11(): string;
    }, {
        meta_info(): {
            author: string;
            version: string;
        };
        use_for(): string[];
        init(): void;
        init_axis_shader(): void;
        alarms(): any;
        draw(ctx: any): void;
        draw_bell(ctx: any, x: any, y: any, color: any, ringing: any): void;
        on_mousedown(e: any): void;
        on_mousemove(): void;
        on_mouseup(): void;
        data_colors(): string[];
    }, {
        props: string[];
        mounted(): void;
        beforeUnmount(): void;
        methods: {
            use_for(): void;
            meta_info(): void;
            custom_event(event: any, ...args: any[]): void;
            exec_script(): void;
        };
        watch: {
            settingsDisplayKey(newKey: any, oldKey: any): void;
        };
        computed: {
            sett(): any;
            settingsDisplayKey(): string;
        };
        data(): {
            uxs_count: number;
            last_ux_id: null;
        };
        render(): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>;
    } | {
        beforeUnmount(): void;
        methods: {
            init_tool(): void;
            render_pins(ctx: any): void;
            set_state(name: any): void;
            watch_uuid(n: any, p: any): void;
            pre_draw(): void;
            remove_tool(): void;
            start_drag(): void;
            drag_update(): void;
        };
        computed: {
            selected(): any;
            state(): any;
        };
    }, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>>[];
    priceAlarms: never[];
    DataCubeClass: typeof DataCube;
    feedMode: string;
    corkyClient: null;
    corkyFeed: null;
    corkyStates: never[];
    corkyCurrent: null;
    corkyEnabled: {};
    corkyLast: null;
    corkyLoading: boolean;
    corkyProgress: null;
    corkyError: null;
    corkyHandle: null;
    positionsFeed: null;
    openPositions: never[];
    historicalPositions: never[];
    positionsAccounts: never[];
    positionsActiveAccount: null;
    positionsActiveTab: string;
    positionsLoading: boolean;
    positionsError: null;
    positionsHistoryCursor: null;
    positionsHistoryTotal: number;
    searchFeed: null;
    searchTabs: never[];
    searchTabSeq: number;
    searchNav: null;
    backtestsFeed: null;
    backtests: {
        strategies: never[];
        runs: never[];
        filters: {
            strategy: string;
            symbol: string;
            status: string;
            timeframe: string;
            runType: string;
        };
        selectedRun: null;
        detail: {};
        loading: boolean;
        error: null;
    };
    positionPlot: null;
    auditOpen: boolean;
    auditData: null;
    auditLoading: boolean;
    auditError: null;
    auditTarget: null;
}, {
    positionsCurrentSymbolKey(): string;
    positionDetailRows(): {
        key: string;
        name: string;
    }[];
    searchContext(): {
        venue: any;
        symbol: any;
        timeframe: null;
        timeframes: any;
        indicators: {
            label: any;
            fields: any[];
        }[];
        symbols: {
            venue: any;
            symbol: any;
            timeframes: any;
            indicators: {
                label: any;
                fields: any[];
            }[];
        }[];
    };
}, {
    setFeedMode(mode: any): void;
    enterGatewayMode(): void;
    corkyDiscover(venue: any): Promise<never[] | undefined>;
    _corkyHistoryLoader(range: any): Promise<any>;
    _btMergeReportWindow(base: any, add: any): any;
    corkySelect(opts: any): Promise<void>;
    _corkyScheduleSelectRetry(opts: any, mapped: any): boolean;
    onCorkySelect(opts: any): void;
    _corkyCancelSelectRetry(): void;
    onCorkyAddTimeframe(req: any): Promise<void>;
    onCorkyToggleIndicator(req: any): void;
    _syncHandleEnabled(mem: any): void;
    onCorkyToggleLayer(req: any): void;
    _alarmSoundInst(): never;
    _lastClose(): number;
    onSidebarClick(s: any): void;
    ensurePriceAlarmOverlay(): void;
    _computePositionSeries(audit: any, tailTs: any): {
        markers: any;
        orders: any[][];
        openClose: any[][];
        size: any[][];
        hist: any;
        fees: {
            series: any[][];
            currency: string | null;
        };
    };
    _removePositionOverlays(dc: any): void;
    _removeSignalMarker(dc: any): void;
    syncSignalMarker(): void;
    _removeBarrierOverlay(dc: any): void;
    syncBarrierOverlay(): void;
    syncPositionOverlays(): void;
    togglePositionDetail(key: any): void;
    clearPositionPlot(): void;
    checkPriceAlarms(): void;
    onAlarmCleared({ id }: {
        id: any;
    }): void;
    onAlarmMoved({ id, price }: {
        id: any;
        price: any;
    }): void;
    clearAllAlarms(): void;
    closeCorkyIndicator(payload: any): boolean;
    _corkyRuntimeId(venue: any, symbol: any): undefined;
    _candleStateHas(venue: any, symbol: any, timeframe: any): any;
    _ensureCandleState(venue: any, symbol: any, timeframe: any): Promise<boolean>;
    _corkyMem(venue: any, symbol: any): any;
    _corkyPatchAndReselect(patch: any, selectOpts: any): Promise<void>;
    onCorkyRetry(): void;
    _corkyUnsub(): Promise<void>;
    refreshPositions(): Promise<void>;
    _applyOpenPositions(out: any): void;
    _positionsDeriveAccounts(rows: any): void;
    _positionsErrText(err: any): any;
    _positionsSyncStreams(): void;
    _positionsStartOpenStream(): void;
    _positionsStopOpenStream(): void;
    _positionsStartPoll(): void;
    togglePositionsDock(open: any): void;
    setPositionsTab(tab: any): void;
    _indicatorOptions(state: any): {
        label: any;
        fields: any[];
    }[];
    onRunSearch(form: any): void;
    onCancelSearch(tabId: any): void;
    onCloseSearchTab(tabId: any): void;
    onSearchResultSelect({ tabId, row, index }?: {}): Promise<void>;
    _isActiveNav(tabId: any, index: any): false;
    _setNavMessage(tabId: any, index: any, message: any): void;
    _navStatusLabel(status: any): any;
    _clearSearchNav(): void;
    _btErr(err: any): any;
    _btSetDetail(patch: any): void;
    btLoadStrategies(): Promise<void>;
    btUpdateFilter(patch: any): void;
    btInspectStrategy(name: any): Promise<void>;
    btListRuns(): Promise<void>;
    btSelectRun(run: any): Promise<void>;
    _withTimeout(promise: any, ms: any): Promise<any>;
    _btLoadArtifact(run: any): Promise<void>;
    _btRunIndex(): number | undefined;
    btSelectCandidate(runIndex: any): Promise<void>;
    _btLoadOverview(run: any): Promise<void>;
    btCloseDetail(): void;
    _btSubscribeProgress(run: any): void;
    _btStopProgress(): void;
    _canonicalVenue(venue: any, symbol: any): any;
    _loadedCandleRange(): any[] | null;
    btPlotRun(run: any): Promise<void>;
    _btPlotWindow(run: any, timeframe: any): {
        start: any;
        end: any;
    };
    btSelectTrade(trade: any): Promise<void>;
    _btTradeChartWindow(run: any, trade: any, timeframe: any, runIndex: any, beforeBars: any, afterBars: any): Promise<{
        start: number;
        end: number;
    } | null>;
    _tfToMs(tf: any): number;
    _removeBacktestOverlays(dc: any): void;
    syncBacktestOverlays(): void;
    setPositionsAccount(acct: any): void;
    _ensureHistoryLoaded(opts?: {}): void;
    loadHistoryPage(reset?: boolean, { silent }?: {
        silent?: boolean | undefined;
    }): Promise<void>;
    onPositionSelect(pos: any): Promise<void>;
    _isOpenPosition(pos: any, audit: any): boolean;
    _plotWindow(pos: any, audit: any): {
        start: any;
        end: any;
    } | null;
    _startPositionAuditStream(pos: any): void;
    _stopPositionAuditStream(): void;
    openAudit(pos: any): void;
    _loadAudit(): Promise<void>;
    _startAuditStream(): void;
    _stopAuditStream(): void;
    closeAudit(): void;
    startPositionsDockResize(ev: any): void;
    teardownCorky(): void;
    _corkyErr(err: any): {
        message: any;
        retryable: boolean;
    };
}, {
    data(): {
        candleColoringOptions: never[];
        selectedView: string;
        displayedView: string;
        originalChartData: null;
    };
    methods: {
        extractCandleColoringOptions(chartData: any, timeframe?: null): void;
        prepareChartData(chartData: any, timeframe?: null, originalChartData?: null): {
            chart: any;
            onchart: any;
            offchart: any;
        };
        onViewSelected(viewName: any): void;
        applyCurrentColoring(): void;
        applyViewOffchart(viewData: any): void;
        buildOffchartData(persistentIndicators: any, viewData?: null): any;
    };
} | {
    data(): {
        indicatorVisibility: {};
        lastIndicatorSet: never[];
        indicatorSettingsOpen: boolean;
        indicatorSettingsData: null;
        persistentIndicatorsRaw: {};
        persistentIndicatorsClipped: never[];
        persistentIndicatorVisibility: {};
        accordionExpandedViews: {};
    };
    computed: {
        offchartIndicators(): any;
        viewIndicatorsAccordion(): {
            title: string;
            isExpanded: boolean;
            isCurrentView: boolean;
            indicators: any;
        }[];
    };
    methods: {
        loadPersistentIndicators(): Promise<void>;
        clipPersistentIndicators(timeframe?: null, chartData?: null): any;
        isPersistentIndicatorVisible(name: any): any;
        togglePersistentIndicatorVisibility(name: any): void;
        toggleAccordion(viewTitle: any): void;
        toggleViewIndicatorVisibility(viewTitle: any, indicatorName: any): void;
        toggleIndicatorVisibility(index: any): void;
        openIndicatorSettings(indicatorInfo: any): void;
        onCloseIndicator(payload: any): void;
        closeIndicatorSettings(): void;
        applyIndicatorSettings(payload: any): void;
        getIndicatorSettings(): {};
        applyRestoredIndicatorSettings(savedSettings: any): void;
    };
    watch: {
        'currentFileMeta.indicators_url'(newUrl: any, oldUrl: any): void;
    };
} | {
    data(): {
        dataFiles: never[];
        currentDataFile: string;
        selectedDataFile: string;
        currentFileMeta: null;
        pendingFileLoad: null;
        pendingIndicatorSettings: null;
    };
    methods: {
        loadDataFileList(): Promise<void>;
        onFileSelected(filename: any): Promise<void>;
        saveStateToStorage(): void;
        loadStateFromStorage(): {} | null;
    };
    watch: {
        dataFiles(newFiles: any): void;
    };
} | {
    data(): {
        charts: {};
        currentTimeframe: null;
        selectedTimeframe: number;
        log_scale: boolean;
        width: number;
        height: number;
        panelWidth: number;
        positionsDockOpen: boolean;
        positionsDockHeight: number;
        config: {
            DEFAULT_LEN: number;
            TB_BORDER: number;
            CANDLEW: number;
            GRIDX: number;
            VOLSCALE: number;
            RIGHTBAR: number;
        };
    };
    computed: {
        colors(): {
            back: string;
            grid: string;
            text: string;
            cross: string;
            candle_dw: string;
            wick_dw: string;
        };
        rightPanelWidth(): any;
        chartWidth(): number;
        chartHeight(): number;
        bottomPanelHeight(): number;
        bottomDockHeight(): number;
        timeframes(): string[];
    };
    methods: {
        onResize(): void;
        startPanelResize(e: any): void;
        endPanelResize(): void;
        resetView(): void;
        captureScreen(): Promise<void>;
        _captureViaHtml2Canvas(): Promise<void>;
        screenshotName(now?: Date): string;
        _saveScreenshot(blob: any, name: any): Promise<void>;
        selectTimeframe(tf: any, index: any): void;
        initializeChart(data: any): void;
    };
    watch: {
        log_scale(value: any): void;
    };
} | {
    data(): {
        rectDrawMode: boolean;
        isDrawing: boolean;
        rectStart: null;
        rectCurrent: null;
        orderTypeModalOpen: boolean;
        orderModalOpen: boolean;
        pendingBoxGeometry: null;
        editingOrderBox: null;
    };
    methods: {
        toggleRectDrawMode(): void;
        onDrawStart(event: any): void;
        onDrawMove(event: any): void;
        _drawCanvasEl(chart: any): any;
        onDrawEnd(event: any): void;
        onOrderTypeSelect(type: any): void;
        onOrderTypeCancel(): void;
        onOrderBoxSettings(payload: any): void;
        onOrderConfirm(cfg: any): void;
        onOrderCancel(): void;
    };
} | {
    data(): {
        ws: null;
        wsConnected: boolean;
        wsReconnectTimer: null;
        wsReconnectDelay: number;
        wsUrl: null;
        _wsGen: number;
        liveScmrColors: never[];
        liveAlertColors: never[];
        liveZones: never[];
        liveAlerts: never[];
        liveDataStartIdx: number;
    };
    methods: {
        wsConnect(url: any): void;
        wsDisconnect(): void;
        _wsScheduleReconnect(originatingGen: any): void;
        _wsMsgMatchesCurrentFile(msg: any): boolean;
        _wsBuildUrl(meta: any): string | null;
        _wsOnMessage(msg: any): void;
        _wsHandleCandle(msg: any): void;
        _wsHandleAlert(msg: any): void;
        _wsHandleSnapshot(msg: any): void;
        _wsApplyLiveColors(): void;
    };
    watch: {
        displayedView(): void;
        currentDataFile(): void;
        currentFileMeta(newMeta: any, oldMeta: any): void;
    };
    beforeUnmount(): void;
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
    TradingVue: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
        theme: {
            type: ObjectConstructor;
            default: null;
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
        a11y: {
            type: BooleanConstructor;
            default: boolean;
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
        a11y_id(): string;
        a11y_label(): string;
        a11y_summary(): string;
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
        a11y_keydown(e: any): void;
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
        theme: {
            type: ObjectConstructor;
            default: null;
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
        a11y: {
            type: BooleanConstructor;
            default: boolean;
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
        theme: Record<string, any>;
        chartConfig: Record<string, any>;
        legendButtons: unknown[];
        indexBased: boolean;
        extensions: unknown[];
        xSettings: Record<string, any>;
        a11y: boolean;
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
            volumeIsDetached(): any;
            volumeShown(): any;
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
            ensure_chart_settings(): any;
            setVolumeShown(shown: any): void;
            toggleVolumeDetach(): void;
            detachVolume(): void;
            reattachVolume(): void;
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
                    xr: null;
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
    IndicatorSettings: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        indicatorName: {
            type: StringConstructor;
            default: string;
        };
        currentType: {
            type: StringConstructor;
            default: string;
        };
        currentSettings: {
            type: ObjectConstructor;
            default: () => {};
        };
        indicatorIndex: {
            type: NumberConstructor;
            required: true;
        };
        gridId: {
            type: NumberConstructor;
            required: true;
        };
    }>, {}, {
        selectedType: any;
        lineColor: any;
        colorUp: any;
        colorDown: any;
        lineWidth: any;
        visualTypes: {
            value: string;
            label: string;
            icon: string;
        }[];
    }, {
        isVolume(): boolean;
        isAttachedVolume(): boolean;
    }, {
        selectType(type: any): void;
        updateColors(): void;
        emitSettings(): void;
        buildSettings(): {
            color: any;
            lineWidth: any;
            colorUp?: undefined;
            colorDown?: undefined;
        } | {
            colorUp: any;
            colorDown: any;
            color?: undefined;
            lineWidth?: undefined;
        };
        close(): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        indicatorName: {
            type: StringConstructor;
            default: string;
        };
        currentType: {
            type: StringConstructor;
            default: string;
        };
        currentSettings: {
            type: ObjectConstructor;
            default: () => {};
        };
        indicatorIndex: {
            type: NumberConstructor;
            required: true;
        };
        gridId: {
            type: NumberConstructor;
            required: true;
        };
    }>> & Readonly<{}>, {
        indicatorName: string;
        currentType: string;
        currentSettings: Record<string, any>;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    OrderDistributionModal: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        geometry: {
            type: ObjectConstructor;
            default: null;
        };
        initial: {
            type: ObjectConstructor;
            default: null;
        };
    }>, {}, {
        orderSize: number;
        orderQty: number;
        distribution: any;
        distTypes: {
            value: string;
            label: string;
            icon: string;
        }[];
    }, {
        low(): number;
        high(): number;
        valid(): boolean;
    }, {
        fmt(v: any): any;
        confirm(): void;
        close(): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("close" | "confirm")[], "close" | "confirm", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        geometry: {
            type: ObjectConstructor;
            default: null;
        };
        initial: {
            type: ObjectConstructor;
            default: null;
        };
    }>> & Readonly<{
        onClose?: ((...args: any[]) => any) | undefined;
        onConfirm?: ((...args: any[]) => any) | undefined;
    }>, {
        geometry: Record<string, any>;
        initial: Record<string, any>;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    OrderTypeModal: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        geometry: {
            type: ObjectConstructor;
            default: null;
        };
    }>, {}, {
        scaledIcon: string;
        distIcon: string;
    }, {}, {
        noop(): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("select" | "close")[], "select" | "close", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        geometry: {
            type: ObjectConstructor;
            default: null;
        };
    }>> & Readonly<{
        onSelect?: ((...args: any[]) => any) | undefined;
        onClose?: ((...args: any[]) => any) | undefined;
    }>, {
        geometry: Record<string, any>;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    CorkyDiscoveryPanel: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        states: {
            type: ArrayConstructor;
            default: () => never[];
        };
        current: {
            type: ObjectConstructor;
            default: null;
        };
        loading: {
            type: BooleanConstructor;
            default: boolean;
        };
        progress: {
            type: ObjectConstructor;
            default: null;
        };
        error: {
            type: ObjectConstructor;
            default: null;
        };
    }>, {}, {
        query: string;
        activeCategory: string;
        collapsedVenues: Set<any>;
        expandedSymbols: Set<any>;
        addingFor: null;
    }, {
        categoryFilters(): {
            value: string;
            label: any;
        }[];
        venues(): {
            venue: any;
            symbols: any;
        }[];
        filteredVenues(): {
            venue: any;
            symbols: any;
        }[];
        symbolCount(): number;
        hasProgress(): boolean;
        progressPct(): number;
        progressLabel(): any;
        progressStatusText(): string;
        progressText(): any;
        standardTimeframes(): string[];
        errorMessage(): any;
    }, {
        categoryLabel(cat: any): any;
        timeframesFor(st: any): any;
        activeTimeframe(row: any): any;
        indicatorsFor(row: any): any[];
        isSymbolActive(row: any): boolean;
        isCurrent(row: any, tf: any): boolean;
        isIndicatorOn(row: any, ind: any): boolean;
        toggleableLayers(ind: any): any;
        isLayerOn(row: any, ind: any, layer: any): boolean;
        onToggleLayer(row: any, ind: any, layer: any): void;
        badgeText(tf: any): "pending" | "stale" | "ready";
        badgeClass(tf: any): "badge-pending" | "badge-stale" | "badge-ready";
        onSelectTimeframe(row: any, tf: any): void;
        isVenueExpanded(venue: any): boolean;
        toggleVenue(venue: any): void;
        isSymbolExpanded(key: any): boolean;
        toggleSymbol(key: any): void;
        availableTimeframes(row: any): string[];
        toggleAddPicker(row: any): void;
        onAddTimeframe(row: any, timeframe: any): void;
        closePickerIfNeeded(): void;
        onToggleIndicator(row: any, ind: any): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("select" | "add-timeframe" | "toggle-indicator" | "toggle-layer" | "retry")[], "select" | "add-timeframe" | "toggle-indicator" | "toggle-layer" | "retry", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        states: {
            type: ArrayConstructor;
            default: () => never[];
        };
        current: {
            type: ObjectConstructor;
            default: null;
        };
        loading: {
            type: BooleanConstructor;
            default: boolean;
        };
        progress: {
            type: ObjectConstructor;
            default: null;
        };
        error: {
            type: ObjectConstructor;
            default: null;
        };
    }>> & Readonly<{
        onSelect?: ((...args: any[]) => any) | undefined;
        "onAdd-timeframe"?: ((...args: any[]) => any) | undefined;
        "onToggle-indicator"?: ((...args: any[]) => any) | undefined;
        "onToggle-layer"?: ((...args: any[]) => any) | undefined;
        onRetry?: ((...args: any[]) => any) | undefined;
    }>, {
        error: Record<string, any>;
        current: Record<string, any>;
        progress: Record<string, any>;
        states: unknown[];
        loading: boolean;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    CorkyPositionsPanel: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        height: {
            type: NumberConstructor;
            default: number;
        };
        open: {
            type: BooleanConstructor;
            default: boolean;
        };
        activeTab: {
            type: StringConstructor;
            default: string;
        };
        openPositions: {
            type: ArrayConstructor;
            default: () => never[];
        };
        historicalPositions: {
            type: ArrayConstructor;
            default: () => never[];
        };
        accounts: {
            type: ArrayConstructor;
            default: () => never[];
        };
        activeAccount: {
            type: ObjectConstructor;
            default: null;
        };
        loading: {
            type: BooleanConstructor;
            default: boolean;
        };
        error: {
            type: StringConstructor;
            default: null;
        };
        historyHasMore: {
            type: BooleanConstructor;
            default: boolean;
        };
        historyTotal: {
            type: NumberConstructor;
            default: number;
        };
        currentSymbolKey: {
            type: StringConstructor;
            default: string;
        };
        searchTabs: {
            type: ArrayConstructor;
            default: () => never[];
        };
        searchContext: {
            type: ObjectConstructor;
            default: null;
        };
        searchNav: {
            type: ObjectConstructor;
            default: null;
        };
        backtests: {
            type: ObjectConstructor;
            default: () => {};
        };
    }>, {}, {}, {
        rows(): unknown[];
        activeSearchTab(): {} | null;
        runDetailTitle(): string;
        activeAccountKey(): string;
    }, {
        selectTab(tab: any): void;
        accountKey(a: any): string;
        onAccountChange(ev: any): void;
        rowKey(p: any): string;
        isActiveRow(p: any): boolean;
        sideClass(p: any): "" | "side-long" | "side-short";
        signClass(dec: any): "" | "pos" | "neg";
        pctText(dec: any): string;
        fmtTime(ms: any): string;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("update:open" | "update:active-tab" | "update:active-account" | "select-position" | "audit-position" | "load-more" | "refresh" | "resize-start" | "run-search" | "cancel-search" | "close-search-tab" | "select-result" | "bt-refresh-strategies" | "bt-update-filter" | "bt-list-runs" | "bt-inspect-strategy" | "bt-select-run" | "bt-plot-run" | "bt-select-trade" | "bt-select-candidate" | "bt-close-detail")[], "update:open" | "update:active-tab" | "update:active-account" | "select-position" | "audit-position" | "load-more" | "refresh" | "resize-start" | "run-search" | "cancel-search" | "close-search-tab" | "select-result" | "bt-refresh-strategies" | "bt-update-filter" | "bt-list-runs" | "bt-inspect-strategy" | "bt-select-run" | "bt-plot-run" | "bt-select-trade" | "bt-select-candidate" | "bt-close-detail", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        height: {
            type: NumberConstructor;
            default: number;
        };
        open: {
            type: BooleanConstructor;
            default: boolean;
        };
        activeTab: {
            type: StringConstructor;
            default: string;
        };
        openPositions: {
            type: ArrayConstructor;
            default: () => never[];
        };
        historicalPositions: {
            type: ArrayConstructor;
            default: () => never[];
        };
        accounts: {
            type: ArrayConstructor;
            default: () => never[];
        };
        activeAccount: {
            type: ObjectConstructor;
            default: null;
        };
        loading: {
            type: BooleanConstructor;
            default: boolean;
        };
        error: {
            type: StringConstructor;
            default: null;
        };
        historyHasMore: {
            type: BooleanConstructor;
            default: boolean;
        };
        historyTotal: {
            type: NumberConstructor;
            default: number;
        };
        currentSymbolKey: {
            type: StringConstructor;
            default: string;
        };
        searchTabs: {
            type: ArrayConstructor;
            default: () => never[];
        };
        searchContext: {
            type: ObjectConstructor;
            default: null;
        };
        searchNav: {
            type: ObjectConstructor;
            default: null;
        };
        backtests: {
            type: ObjectConstructor;
            default: () => {};
        };
    }>> & Readonly<{
        "onUpdate:open"?: ((...args: any[]) => any) | undefined;
        "onUpdate:active-tab"?: ((...args: any[]) => any) | undefined;
        "onUpdate:active-account"?: ((...args: any[]) => any) | undefined;
        "onSelect-position"?: ((...args: any[]) => any) | undefined;
        "onAudit-position"?: ((...args: any[]) => any) | undefined;
        "onLoad-more"?: ((...args: any[]) => any) | undefined;
        onRefresh?: ((...args: any[]) => any) | undefined;
        "onResize-start"?: ((...args: any[]) => any) | undefined;
        "onRun-search"?: ((...args: any[]) => any) | undefined;
        "onCancel-search"?: ((...args: any[]) => any) | undefined;
        "onClose-search-tab"?: ((...args: any[]) => any) | undefined;
        "onSelect-result"?: ((...args: any[]) => any) | undefined;
        "onBt-refresh-strategies"?: ((...args: any[]) => any) | undefined;
        "onBt-update-filter"?: ((...args: any[]) => any) | undefined;
        "onBt-list-runs"?: ((...args: any[]) => any) | undefined;
        "onBt-inspect-strategy"?: ((...args: any[]) => any) | undefined;
        "onBt-select-run"?: ((...args: any[]) => any) | undefined;
        "onBt-plot-run"?: ((...args: any[]) => any) | undefined;
        "onBt-select-trade"?: ((...args: any[]) => any) | undefined;
        "onBt-select-candidate"?: ((...args: any[]) => any) | undefined;
        "onBt-close-detail"?: ((...args: any[]) => any) | undefined;
    }>, {
        error: string;
        height: number;
        loading: boolean;
        open: boolean;
        activeTab: string;
        openPositions: unknown[];
        historicalPositions: unknown[];
        accounts: unknown[];
        activeAccount: Record<string, any>;
        historyHasMore: boolean;
        historyTotal: number;
        currentSymbolKey: string;
        searchTabs: unknown[];
        searchContext: Record<string, any>;
        searchNav: Record<string, any>;
        backtests: Record<string, any>;
    }, {}, {
        SearchSignalsForm: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
            context: {
                type: ObjectConstructor;
                default: null;
            };
        }>, {}, {
            OPS: {
                v: string;
                label: string;
            }[];
            venue: string;
            symbol: string;
            venueDirty: boolean;
            symbolDirty: boolean;
            tfs: never[];
            rangeMode: string;
            latestLimit: number;
            startStr: string;
            endStr: string;
            rows: any[];
            beforeBars: number;
            afterBars: number;
            maxResults: number;
            targetEnabled: boolean;
            target: {
                timeframe: string;
                window_fwd: number;
                window_atr: number;
                k_take: number;
                k_stop: number;
                post_hit_policy: string;
                guard_use_close: boolean;
                guard_min_consecutive_closes: number;
            };
            error: string;
        }, {
            symbolOptions(): any;
            availableTimeframes(): any;
            indicators(): any;
        }, {
            blankRow(): {
                indicator: string;
                field: string;
                op: string;
                value: string;
                bar_offset: number;
            };
            applyDefaults(): void;
            reconcileTimeframes(): void;
            toggleTf(tf: any): void;
            fieldsFor(label: any): any;
            addRow(): void;
            removeRow(i: any): void;
            submit(): void;
        }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, "run"[], "run", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
            context: {
                type: ObjectConstructor;
                default: null;
            };
        }>> & Readonly<{
            onRun?: ((...args: any[]) => any) | undefined;
        }>, {
            context: Record<string, any>;
        }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        SearchResults: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
            tab: {
                type: ObjectConstructor;
                required: true;
            };
            nav: {
                type: ObjectConstructor;
                default: null;
            };
        }>, {}, {}, {
            activeNav(): Record<string, any> | null;
            hasBarrier(): any;
            statusLabel(): any;
            errorText(): any;
        }, {
            isActive(i: any): boolean;
            barrierCell(m: any): {
                label: string;
                cls: string;
                title: string;
            };
            analyticsTitle(b: any): string;
            sideClass(side: any): "" | "bull" | "bear";
            fmtDate(ms: any): string;
        }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("select" | "cancel")[], "select" | "cancel", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
            tab: {
                type: ObjectConstructor;
                required: true;
            };
            nav: {
                type: ObjectConstructor;
                default: null;
            };
        }>> & Readonly<{
            onSelect?: ((...args: any[]) => any) | undefined;
            onCancel?: ((...args: any[]) => any) | undefined;
        }>, {
            nav: Record<string, any>;
        }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        CorkyBacktestsPanel: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
            strategies: {
                type: ArrayConstructor;
                default: () => never[];
            };
            runs: {
                type: ArrayConstructor;
                default: () => never[];
            };
            filters: {
                type: ObjectConstructor;
                default: () => {
                    strategy: string;
                    symbol: string;
                    status: string;
                };
            };
            selectedRun: {
                type: ObjectConstructor;
                default: null;
            };
            loading: {
                type: BooleanConstructor;
                default: boolean;
            };
            error: {
                type: StringConstructor;
                default: null;
            };
        }>, {}, {
            sortKey: string;
            sortDir: number;
            metricCols: ({
                key: string;
                label: string;
                metric: string;
                fmt: string;
                signMode: string;
                agg: string;
                beat?: undefined;
                title?: undefined;
            } | {
                key: string;
                label: string;
                metric: string;
                fmt: string;
                signMode: string;
                beat: string;
                agg: string;
                title?: undefined;
            } | {
                key: string;
                label: string;
                metric: string;
                fmt: string;
                signMode: string;
                title: string;
                agg: string;
                beat?: undefined;
            })[];
        }, {
            columns(): ({
                key: string;
                label: string;
                metric: string;
                fmt: string;
                signMode: string;
                agg: string;
                beat?: undefined;
                title?: undefined;
            } | {
                key: string;
                label: string;
                metric: string;
                fmt: string;
                signMode: string;
                beat: string;
                agg: string;
                title?: undefined;
            } | {
                key: string;
                label: string;
                metric: string;
                fmt: string;
                signMode: string;
                title: string;
                agg: string;
                beat?: undefined;
            } | {
                key: string;
                label: string;
                title?: undefined;
            } | {
                key: string;
                label: string;
                title: string;
            })[];
            timeframeOptions(): any[];
            runTypeOptions(): {
                kind: any;
                label: any;
            }[];
            filteredRuns(): unknown[];
            sortedRuns(): unknown[];
            selectedStrategy(): {} | null;
            summaryCells(): {
                key: string;
                text: string;
                sign: string;
                title: string;
            }[];
        }, {
            sortBy(key: any): void;
            onStrategy(name: any): void;
            indLabel(i: any): string;
            metric(r: any, key: any): any;
            runShape(r: any): any;
            _truthy(raw: any): boolean;
            fmtRatio(raw: any): string;
            fmtPct(raw: any): string;
            fmtMoney(raw: any): string;
            cellText(r: any, c: any): string;
            cellSign(r: any, c: any): "" | "pos" | "neg";
            cellTitle(r: any, c: any): any;
            fmtTime(ms: any): string;
            fmtDate(ms: any): string;
            _tfMs(tf: any): number;
            _dataRange(r: any): {
                s: number;
                e: number;
            };
            barCount(r: any): {
                n: number;
                exact: boolean;
            } | null;
            fmtDuration(r: any): string;
            durationTitle(r: any): "" | "Bar count estimated from the data span ÷ timeframe (exact bar_count not in the run summary)";
        }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("refresh-strategies" | "update:filter" | "list-runs" | "inspect-strategy" | "select-run")[], "refresh-strategies" | "update:filter" | "list-runs" | "inspect-strategy" | "select-run", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
            strategies: {
                type: ArrayConstructor;
                default: () => never[];
            };
            runs: {
                type: ArrayConstructor;
                default: () => never[];
            };
            filters: {
                type: ObjectConstructor;
                default: () => {
                    strategy: string;
                    symbol: string;
                    status: string;
                };
            };
            selectedRun: {
                type: ObjectConstructor;
                default: null;
            };
            loading: {
                type: BooleanConstructor;
                default: boolean;
            };
            error: {
                type: StringConstructor;
                default: null;
            };
        }>> & Readonly<{
            "onRefresh-strategies"?: ((...args: any[]) => any) | undefined;
            "onUpdate:filter"?: ((...args: any[]) => any) | undefined;
            "onList-runs"?: ((...args: any[]) => any) | undefined;
            "onInspect-strategy"?: ((...args: any[]) => any) | undefined;
            "onSelect-run"?: ((...args: any[]) => any) | undefined;
        }>, {
            error: string;
            strategies: unknown[];
            filters: Record<string, any>;
            loading: boolean;
            runs: unknown[];
            selectedRun: Record<string, any>;
        }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        CorkyBacktestDetail: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
            run: {
                type: ObjectConstructor;
                required: true;
            };
            detail: {
                type: ObjectConstructor;
                default: () => {};
            };
        }>, {}, {}, {
            shape(): any;
            chartable(): boolean;
            showStudy(): boolean;
            candidateCount(): number;
            runIndex(): number | null;
            metricDescriptors(): {};
            metricGroups(): {
                title: string;
                cells: {
                    key: any;
                    label: any;
                    value: string;
                    raw: any;
                    sign: string;
                }[];
            }[];
            metricRows(): ({
                type: string;
                title: string;
                cells?: undefined;
                alt?: undefined;
            } | {
                type: string;
                cells: {
                    key: any;
                    label: any;
                    value: string;
                    raw: any;
                    sign: string;
                }[];
                alt: boolean;
                title?: undefined;
            })[];
            metricColSpan(): number;
            progress(): any;
            progressLive(): boolean;
            overviewLoading(): boolean;
            plotBusy(): boolean;
            plotted(): boolean;
            trades(): any;
            periodReturns(): any;
        }, {
            _truthy(raw: any): boolean;
            formatMetric(raw: any, d: any): string;
            signClass(dec: any): "" | "pos" | "neg";
            pctText(dec: any): string;
            fmtTime(ms: any): string;
        }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("close" | "select-candidate" | "plot-run" | "select-trade")[], "close" | "select-candidate" | "plot-run" | "select-trade", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
            run: {
                type: ObjectConstructor;
                required: true;
            };
            detail: {
                type: ObjectConstructor;
                default: () => {};
            };
        }>> & Readonly<{
            onClose?: ((...args: any[]) => any) | undefined;
            "onSelect-candidate"?: ((...args: any[]) => any) | undefined;
            "onPlot-run"?: ((...args: any[]) => any) | undefined;
            "onSelect-trade"?: ((...args: any[]) => any) | undefined;
        }>, {
            detail: Record<string, any>;
        }, {}, {
            CorkyUniverseStudy: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
                run: {
                    type: ObjectConstructor;
                    default: null;
                };
                artifact: {
                    type: ObjectConstructor;
                    default: null;
                };
                loading: {
                    type: BooleanConstructor;
                    default: boolean;
                };
                error: {
                    type: StringConstructor;
                    default: null;
                };
                chartable: {
                    type: BooleanConstructor;
                    default: boolean;
                };
                selectedRunIndex: {
                    type: NumberConstructor;
                    default: null;
                };
            }>, {}, {
                expanded: number;
                showRaw: boolean;
            }, {
                candidateCols(): ({
                    key: string;
                    label: string;
                    fmt: string;
                    names: string[];
                    sign?: undefined;
                } | {
                    key: string;
                    label: string;
                    fmt: string;
                    sign: boolean;
                    names: string[];
                })[];
                perSymbolCols(): ({
                    key: string;
                    label: string;
                    fmt: string;
                    sign: boolean;
                    names: string[];
                } | {
                    key: string;
                    label: string;
                    fmt: string;
                    names: string[];
                    sign?: undefined;
                })[];
                study(): any;
                candidates(): {
                    runIndex: any;
                    params: any;
                    perSymbol: {
                        symbol: any;
                    }[];
                }[];
                optMetaRows(): {
                    key: string;
                    label: string;
                    value: string;
                }[];
                rawJson(): string;
            }, {
                onRowClick(cand: any, i: any): void;
                _perSymbol(c: any): {
                    symbol: any;
                }[];
                signOf(v: any): "" | "pos" | "neg";
                fmtCell(v: any, col: any): string;
                paramStr(params: any): string;
            }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, "select-candidate"[], "select-candidate", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
                run: {
                    type: ObjectConstructor;
                    default: null;
                };
                artifact: {
                    type: ObjectConstructor;
                    default: null;
                };
                loading: {
                    type: BooleanConstructor;
                    default: boolean;
                };
                error: {
                    type: StringConstructor;
                    default: null;
                };
                chartable: {
                    type: BooleanConstructor;
                    default: boolean;
                };
                selectedRunIndex: {
                    type: NumberConstructor;
                    default: null;
                };
            }>> & Readonly<{
                "onSelect-candidate"?: ((...args: any[]) => any) | undefined;
            }>, {
                error: string;
                loading: boolean;
                run: Record<string, any>;
                artifact: Record<string, any>;
                chartable: boolean;
                selectedRunIndex: number;
            }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    PositionAuditDrawer: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        open: {
            type: BooleanConstructor;
            default: boolean;
        };
        audit: {
            type: ObjectConstructor;
            default: null;
        };
        loading: {
            type: BooleanConstructor;
            default: boolean;
        };
        error: {
            type: StringConstructor;
            default: null;
        };
        target: {
            type: ObjectConstructor;
            default: null;
        };
    }>, {}, {}, {
        headSymbol(): any;
        headId(): any;
        isMissing(): boolean;
        reasons(): any;
        orders(): any;
        trades(): any;
        fees(): any;
        feesText(): string;
    }, {
        signClass(dec: any): "" | "pos" | "neg";
        sideClass(side: any): "" | "side-long" | "side-short";
        fmtTime(ms: any): string;
        feeKindLabel(kind: any): any;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, "close"[], "close", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        open: {
            type: BooleanConstructor;
            default: boolean;
        };
        audit: {
            type: ObjectConstructor;
            default: null;
        };
        loading: {
            type: BooleanConstructor;
            default: boolean;
        };
        error: {
            type: StringConstructor;
            default: null;
        };
        target: {
            type: ObjectConstructor;
            default: null;
        };
    }>> & Readonly<{
        onClose?: ((...args: any[]) => any) | undefined;
    }>, {
        error: string;
        target: Record<string, any>;
        loading: boolean;
        open: boolean;
        audit: Record<string, any>;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
import DataCube from '../src/helpers/datacube.js';
