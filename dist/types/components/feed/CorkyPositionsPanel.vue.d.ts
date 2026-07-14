declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    height: {
        type: NumberConstructor;
        default: number;
    };
    open: {
        type: BooleanConstructor;
        default: boolean;
    };
    maximized: {
        type: BooleanConstructor;
        default: boolean;
    };
    activeTab: {
        type: StringConstructor;
        default: string;
    };
    tabOrder: {
        type: ArrayConstructor;
        default: () => never[];
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
    strategy: {
        type: ObjectConstructor;
        default: () => {};
    };
}>, {}, {
    dragId: null;
    dragOverId: null;
}, {
    orderedBaseTabs(): {
        id: unknown;
        label: any;
        count: any;
    }[];
    rows(): unknown[];
    activeSearchTab(): {} | null;
    runDetailTitle(): string;
    activeAccountKey(): string;
}, {
    newTabIntent: typeof newTabIntent;
    selectTab(tab: any): void;
    tabCount(id: any): any;
    onTabDragStart(id: any, ev: any): void;
    onTabDragOver(id: any): void;
    onTabDragLeave(id: any): void;
    onTabDrop(targetId: any): void;
    onTabDragEnd(): void;
    accountKey(a: any): string;
    onAccountChange(ev: any): void;
    rowKey(p: any): string;
    isActiveRow(p: any): boolean;
    sideClass(p: any): "" | "side-long" | "side-short";
    signClass(dec: any): "" | "pos" | "neg";
    pctText(dec: any): string;
    fmtTime(ms: any): string;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("refresh" | "update:open" | "update:maximized" | "update:active-tab" | "update:active-account" | "update:tab-order" | "select-position" | "audit-position" | "load-more" | "resize-start" | "run-search" | "cancel-search" | "close-search-tab" | "select-result" | "bt-refresh-strategies" | "bt-update-filter" | "bt-set-metric-filters" | "bt-list-runs" | "bt-inspect-strategy" | "bt-select-run" | "bt-plot-run" | "bt-select-trade" | "bt-select-candidate" | "bt-close-detail" | "strategy-select-runtime" | "strategy-refresh" | "strategy-load-more-operations" | "strategy-toggle-overlay" | "strategy-compare-allocation" | "strategy-preview-operation" | "strategy-approve-operation" | "strategy-clear-preview" | "strategy-cancel-ticker-orders" | "strategy-pause-ticker" | "strategy-resume-ticker" | "strategy-unlock-ticker" | "strategy-adopt-position" | "strategy-open-lineage-run")[], "refresh" | "update:open" | "update:maximized" | "update:active-tab" | "update:active-account" | "update:tab-order" | "select-position" | "audit-position" | "load-more" | "resize-start" | "run-search" | "cancel-search" | "close-search-tab" | "select-result" | "bt-refresh-strategies" | "bt-update-filter" | "bt-set-metric-filters" | "bt-list-runs" | "bt-inspect-strategy" | "bt-select-run" | "bt-plot-run" | "bt-select-trade" | "bt-select-candidate" | "bt-close-detail" | "strategy-select-runtime" | "strategy-refresh" | "strategy-load-more-operations" | "strategy-toggle-overlay" | "strategy-compare-allocation" | "strategy-preview-operation" | "strategy-approve-operation" | "strategy-clear-preview" | "strategy-cancel-ticker-orders" | "strategy-pause-ticker" | "strategy-resume-ticker" | "strategy-unlock-ticker" | "strategy-adopt-position" | "strategy-open-lineage-run", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    height: {
        type: NumberConstructor;
        default: number;
    };
    open: {
        type: BooleanConstructor;
        default: boolean;
    };
    maximized: {
        type: BooleanConstructor;
        default: boolean;
    };
    activeTab: {
        type: StringConstructor;
        default: string;
    };
    tabOrder: {
        type: ArrayConstructor;
        default: () => never[];
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
    strategy: {
        type: ObjectConstructor;
        default: () => {};
    };
}>> & Readonly<{
    onRefresh?: ((...args: any[]) => any) | undefined;
    "onUpdate:open"?: ((...args: any[]) => any) | undefined;
    "onUpdate:maximized"?: ((...args: any[]) => any) | undefined;
    "onUpdate:active-tab"?: ((...args: any[]) => any) | undefined;
    "onUpdate:active-account"?: ((...args: any[]) => any) | undefined;
    "onUpdate:tab-order"?: ((...args: any[]) => any) | undefined;
    "onSelect-position"?: ((...args: any[]) => any) | undefined;
    "onAudit-position"?: ((...args: any[]) => any) | undefined;
    "onLoad-more"?: ((...args: any[]) => any) | undefined;
    "onResize-start"?: ((...args: any[]) => any) | undefined;
    "onRun-search"?: ((...args: any[]) => any) | undefined;
    "onCancel-search"?: ((...args: any[]) => any) | undefined;
    "onClose-search-tab"?: ((...args: any[]) => any) | undefined;
    "onSelect-result"?: ((...args: any[]) => any) | undefined;
    "onBt-refresh-strategies"?: ((...args: any[]) => any) | undefined;
    "onBt-update-filter"?: ((...args: any[]) => any) | undefined;
    "onBt-set-metric-filters"?: ((...args: any[]) => any) | undefined;
    "onBt-list-runs"?: ((...args: any[]) => any) | undefined;
    "onBt-inspect-strategy"?: ((...args: any[]) => any) | undefined;
    "onBt-select-run"?: ((...args: any[]) => any) | undefined;
    "onBt-plot-run"?: ((...args: any[]) => any) | undefined;
    "onBt-select-trade"?: ((...args: any[]) => any) | undefined;
    "onBt-select-candidate"?: ((...args: any[]) => any) | undefined;
    "onBt-close-detail"?: ((...args: any[]) => any) | undefined;
    "onStrategy-select-runtime"?: ((...args: any[]) => any) | undefined;
    "onStrategy-refresh"?: ((...args: any[]) => any) | undefined;
    "onStrategy-load-more-operations"?: ((...args: any[]) => any) | undefined;
    "onStrategy-toggle-overlay"?: ((...args: any[]) => any) | undefined;
    "onStrategy-compare-allocation"?: ((...args: any[]) => any) | undefined;
    "onStrategy-preview-operation"?: ((...args: any[]) => any) | undefined;
    "onStrategy-approve-operation"?: ((...args: any[]) => any) | undefined;
    "onStrategy-clear-preview"?: ((...args: any[]) => any) | undefined;
    "onStrategy-cancel-ticker-orders"?: ((...args: any[]) => any) | undefined;
    "onStrategy-pause-ticker"?: ((...args: any[]) => any) | undefined;
    "onStrategy-resume-ticker"?: ((...args: any[]) => any) | undefined;
    "onStrategy-unlock-ticker"?: ((...args: any[]) => any) | undefined;
    "onStrategy-adopt-position"?: ((...args: any[]) => any) | undefined;
    "onStrategy-open-lineage-run"?: ((...args: any[]) => any) | undefined;
}>, {
    error: string;
    strategy: Record<string, any>;
    height: number;
    loading: boolean;
    open: boolean;
    maximized: boolean;
    activeTab: string;
    tabOrder: unknown[];
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
        newTabIntent: typeof newTabIntent;
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
        metricFilters: {
            type: ArrayConstructor;
            default: () => never[];
        };
        clickHistory: {
            type: ArrayConstructor;
            default: () => never[];
        };
    }>, {}, {
        strategyOpen: boolean;
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
        recencyClass: typeof import("../../helpers/recency.js").recencyClass;
        isFilterable(c: any): boolean;
        filterForColumn(key: any): {} | null;
        applyColumnFilter(filter: any): void;
        clearColumnFilter(key: any): void;
        clearAllColumnFilters(): void;
        fmtSymbols(symbols: any): string;
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
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("refresh-strategies" | "update:filter" | "list-runs" | "inspect-strategy" | "select-run" | "update:metric-filters")[], "refresh-strategies" | "update:filter" | "list-runs" | "inspect-strategy" | "select-run" | "update:metric-filters", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
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
        metricFilters: {
            type: ArrayConstructor;
            default: () => never[];
        };
        clickHistory: {
            type: ArrayConstructor;
            default: () => never[];
        };
    }>> & Readonly<{
        "onRefresh-strategies"?: ((...args: any[]) => any) | undefined;
        "onUpdate:filter"?: ((...args: any[]) => any) | undefined;
        "onList-runs"?: ((...args: any[]) => any) | undefined;
        "onInspect-strategy"?: ((...args: any[]) => any) | undefined;
        "onSelect-run"?: ((...args: any[]) => any) | undefined;
        "onUpdate:metric-filters"?: ((...args: any[]) => any) | undefined;
    }>, {
        error: string;
        strategies: unknown[];
        filters: Record<string, any>;
        loading: boolean;
        runs: unknown[];
        selectedRun: Record<string, any>;
        metricFilters: unknown[];
        clickHistory: unknown[];
    }, {}, {
        ColumnFilterButton: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
            column: {
                type: ObjectConstructor;
                required: true;
            };
            filter: {
                type: ObjectConstructor;
                default: null;
            };
        }>, {}, {
            open: boolean;
            ops: string[];
            draftOp: string;
            draftValue: string;
        }, {
            canApply(): boolean;
        }, {
            toggle(): void;
            openPop(): void;
            close(): void;
            _onDocDown(e: any): void;
            apply(): void;
            remove(): void;
            fmtVal(v: any): string;
        }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("clear" | "apply")[], "clear" | "apply", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
            column: {
                type: ObjectConstructor;
                required: true;
            };
            filter: {
                type: ObjectConstructor;
                default: null;
            };
        }>> & Readonly<{
            onClear?: ((...args: any[]) => any) | undefined;
            onApply?: ((...args: any[]) => any) | undefined;
        }>, {
            filter: Record<string, any>;
        }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
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
            candidateFilters: never[];
            candidateHistory: never[];
            copyToast: {
                show: boolean;
                ok: boolean;
                x: number;
                y: number;
            };
        }, {
            studyKey(): any;
            candidateCols(): ({
                key: string;
                label: string;
                fmt: string;
                names: string[];
                title?: undefined;
                sign?: undefined;
            } | {
                key: string;
                label: string;
                fmt: string;
                title: string;
                names: string[];
                sign?: undefined;
            } | {
                key: string;
                label: string;
                fmt: string;
                sign: boolean;
                names: string[];
                title?: undefined;
            })[] | ({
                key: string;
                label: string;
                fmt: string;
                names: string[];
                title?: undefined;
                sign?: undefined;
            } | {
                key: string;
                label: string;
                fmt: string;
                title: string;
                names: string[];
                sign?: undefined;
            } | {
                key: string;
                label: string;
                fmt: string;
                sign: boolean;
                title: string;
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
                _i: number;
                runIndex: any;
                params: any;
                perSymbol: {
                    symbol: any;
                }[];
            }[];
            shownCandidates(): {
                _i: number;
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
            recencyClass: typeof import("../../helpers/recency.js").recencyClass;
            copyRaw(e: any): Promise<void>;
            _fallbackCopy(text: any): boolean;
            _showCopyToast(e: any, ok: any): void;
            filterForCandidateCol(key: any): null;
            applyCandidateFilter(filter: any): void;
            clearCandidateFilter(key: any): void;
            clearAllCandidateFilters(): void;
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
        }, {}, {
            ColumnFilterButton: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
                column: {
                    type: ObjectConstructor;
                    required: true;
                };
                filter: {
                    type: ObjectConstructor;
                    default: null;
                };
            }>, {}, {
                open: boolean;
                ops: string[];
                draftOp: string;
                draftValue: string;
            }, {
                canApply(): boolean;
            }, {
                toggle(): void;
                openPop(): void;
                close(): void;
                _onDocDown(e: any): void;
                apply(): void;
                remove(): void;
                fmtVal(v: any): string;
            }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("clear" | "apply")[], "clear" | "apply", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
                column: {
                    type: ObjectConstructor;
                    required: true;
                };
                filter: {
                    type: ObjectConstructor;
                    default: null;
                };
            }>> & Readonly<{
                onClear?: ((...args: any[]) => any) | undefined;
                onApply?: ((...args: any[]) => any) | undefined;
            }>, {
                filter: Record<string, any>;
            }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    CorkyStrategyPanel: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        runtimes: {
            type: ArrayConstructor;
            default: () => never[];
        };
        selectedRuntimeId: {
            type: StringConstructor;
            default: string;
        };
        decisions: {
            type: ArrayConstructor;
            default: () => never[];
        };
        operations: {
            type: ObjectConstructor;
            default: () => {};
        };
        overlayVisibility: {
            type: ObjectConstructor;
            default: () => {};
        };
        money: {
            type: ObjectConstructor;
            default: () => {};
        };
        administration: {
            type: ObjectConstructor;
            default: () => {};
        };
        administrationEnabledFlag: {
            type: BooleanConstructor;
            default: boolean;
        };
        loading: {
            type: BooleanConstructor;
            default: boolean;
        };
        error: {
            type: StringConstructor;
            default: null;
        };
        streaming: {
            type: BooleanConstructor;
            default: boolean;
        };
        maximized: {
            type: BooleanConstructor;
            default: boolean;
        };
        now: {
            type: NumberConstructor;
            default: number;
        };
        control: {
            type: ObjectConstructor;
            default: () => {
                available: boolean;
                pending: boolean;
                awaiting: boolean;
                error: null;
            };
        };
    }>, {}, {
        TABS: {
            id: string;
            label: string;
        }[];
        ACTIVITY_RENDER_BATCH: number;
        activeTab: string | null;
        selectedTicker: string;
        selectedAuditTicker: string;
        activitySource: string;
        activityKind: string;
        activityTicker: string;
        overlayKinds: string[];
        reason: string;
        unlockCurrency: string;
        unlockAmount: string;
        adoptPositionId: string;
        controlValidation: string;
        allocationPolicyJson: string;
        adminActor: string;
        adminIdempotencyKey: string;
        adminReason: string;
        allocationScope: string;
        allocationAccountId: string;
        allocationStrategyInstanceId: string;
        allocationDesiredState: string;
        approvalStatement: string;
        adminValidation: string;
        activityVisibleLimit: number;
    }, {
        nowMs(): number;
        processGroups(): {
            process_kind: any;
            total: any;
            ready: number;
            degraded: number;
            runtimes: any;
        }[];
        activeRuntimeId(): any;
        selectedRuntime(): {} | null;
        selectedNodeTickers(): any;
        selectedTickerId(): string;
        controlEnabled(): boolean;
        controlUnavailableReason(): any;
        controlPending(): boolean;
        controlAwaiting(): boolean;
        summaryDeps(): {
            public: any;
            private: any;
        };
        controlError(): any;
        controlTarget(): {
            runtime_id: any;
            ticker_id: string;
            symbol: any;
            statusInfo: {
                status: string;
                known: boolean;
                style: any;
                attention: boolean;
                position: boolean;
                lockout: boolean;
                durationMs: number | null;
                durationSource: string | null;
                label: string;
                reason: string | null;
                lockoutReason: string | null;
            };
            blocker: {
                blocked: boolean;
                submittedNonterminal: number;
                oldestSubmittedTsMs: number | null;
            };
            actions: ({
                kind: string;
                intent: string;
                label: string;
                reason: boolean;
                danger: boolean;
                allocation?: undefined;
                capital?: undefined;
                position?: undefined;
            } | {
                kind: string;
                intent: string;
                label: string;
                reason: boolean;
                danger?: undefined;
                allocation?: undefined;
                capital?: undefined;
                position?: undefined;
            } | {
                kind: string;
                intent: string;
                label: string;
                reason: boolean;
                allocation: boolean;
                capital: boolean;
                danger?: undefined;
                position?: undefined;
            } | {
                kind: string;
                intent: string;
                label: string;
                reason: boolean;
                position: boolean;
                capital: boolean;
                danger?: undefined;
                allocation?: undefined;
            })[];
            capitalBlocked: boolean;
            lineageRaw: any;
            needsAllocation: boolean;
            needsPosition: boolean;
        } | null;
        readinessInfo(): {
            state: string;
            ready: boolean;
            tone: string;
        };
        runtimeSemantics(): {
            health: {
                state: string;
                ready: boolean;
                tone: string;
            };
            mode: {
                raw: string;
                label: string;
            };
            observer: boolean;
            authority: {
                status: string;
                tone: string;
                label: string;
                reason: any;
            };
            freshness: {
                status: string;
                tone: string;
                label: string;
                ageMs: number | null;
            };
            auth: {
                configured: boolean;
                ready: boolean;
                status: string;
                tone: string;
                label: any;
            };
            allocation: {
                configured: boolean;
                ready: boolean;
                status: string;
                tone: string;
                label: any;
            };
            runtimeControl: {
                available: boolean;
                reason: any;
            };
            primaryReason: any;
        };
        rollupInfo(): {
            status: string;
            known: boolean;
            tone: string;
        };
        lineageInfo(): {
            status: string;
            raw: any;
            tone: string;
            running: boolean;
            known: boolean;
        };
        automaticAllocation(): any;
        administrationEnabled(): boolean;
        administrationUnavailableReason(): any;
        administrationPending(): any;
        administrationError(): any;
        allocationComparison(): any;
        operationPreview(): any;
        operationResult(): any;
        requiredApprovalStatement(): string;
        previewExpired(): boolean;
        previewRevisionCurrent(): boolean;
        approvalReady(): boolean;
        lineageLink(): {
            runId: any;
            runIndex: any;
            rank: any;
        } | null;
        lineageRawLabel(): any;
        lineageReasons(): any[];
        canonicalParamsDisplay(): string;
        candidateMetricRows(): {
            key: string;
            value: any;
        }[];
        pendingAuthReasons(): any[];
        pendingAllocationReasons(): any[];
        recentDecisionRows(): any[];
        approvalRaw(): any;
        approval(): {
            present: boolean;
            stale: boolean;
            expiresAtMs: any;
            approvedAtMs: any;
            maxOrderNotional: any;
            tradeTimeframe: any;
            contextTimeframes: any;
            symbols: any;
        };
        validationProof(): any;
        orderSplit(): {
            local: {
                queued: number;
            };
            dispatched: {};
            localTotal: number;
            dispatchedTotal: number;
            total: number;
        };
        dispatchedKeys(): string[];
        runtimeBlocker(): {
            blocked: boolean;
            submittedNonterminal: number;
            oldestSubmittedTsMs: number | null;
        };
        tickerOrderRows(): any[];
        staleOrderForensics(): any;
        submittedOrderBlockers(): any[];
        moneyData(): any;
        moneyTotalRows(): {
            key: string;
            label: string;
            value: any;
        }[];
        walletBalanceGroups(): {
            class: string;
            wallets: any;
        }[];
        totalAuthWallets(): number;
        allocTree(): {
            legacy: boolean;
            wallets: any;
        };
        auditPointers(): {
            k: string;
            v: any;
        }[];
        decisionGroups(): any[];
        auditTickers(): {
            ticker_id: any;
            symbol: any;
            count: any;
        }[];
        activeAuditTicker(): any;
        auditDecisions(): unknown[];
        activityBaseRows(): {
            id: string;
            type: string;
            ts_ms: any;
            source: any;
            kind: any;
            ticker_id: any;
            order_id: any;
            reason: any;
            payload: any;
            count: number;
        }[];
        activitySources(): any[];
        activityKinds(): any[];
        activityTickers(): any[];
        filteredActivityRows(): {
            id: string;
            type: string;
            ts_ms: any;
            source: any;
            kind: any;
            ticker_id: any;
            order_id: any;
            reason: any;
            payload: any;
            count: number;
        }[];
        activityRows(): {
            id: string;
            type: string;
            ts_ms: any;
            source: any;
            kind: any;
            ticker_id: any;
            order_id: any;
            reason: any;
            payload: any;
            count: number;
        }[];
        activityHasMore(): boolean;
        lifecycleIntervals(): any;
    }, {
        setActiveTab(id: any): void;
        onTaskTabKeydown(event: any, index: any): void;
        overlayEnabled(kind: any): boolean;
        openLineage(): void;
        parseAllocationPolicy(): any;
        compareAllocationPolicy(): void;
        administrationIdentity(): {
            actor: string;
            idempotency_key: string;
            reason: string;
        } | null;
        previewPolicyProposal(proposal: any): void;
        automaticAllocationScope(): {
            scope: string;
            account_id?: undefined;
            strategy_instance_id?: undefined;
        } | {
            scope: string;
            account_id: string;
            strategy_instance_id?: undefined;
        } | {
            scope: string;
            strategy_instance_id: string;
            account_id?: undefined;
        } | null;
        previewAllocationToggle(): void;
        approvePreview(): void;
        selectRuntime(id: any): void;
        selectTicker(runtimeId: any, tickerId: any): void;
        runControl(action: any): void;
        fmt(v: any): string;
        fmtDur(ms: any): string;
        dash(v: any): any;
        dash0(v: any): any;
        boolText(v: any): "—" | "yes" | "no";
        gateClass(ok: any): "" | "pos" | "neg";
        signClass(dec: any): "" | "pos" | "neg";
        numOr0(v: any): number;
        tickerBadge(info: any): string[];
        blockerTitle(b: any): string;
        walletKey(w: any): string;
        intentsTitle(intents: any): string;
        checksTitle(checks: any): string;
        risksFailed(checks: any): boolean;
        deltasTitle(deltas: any): string;
        claimsTitle(claims: any): string;
        decisionReason(decision: any): any;
        operationReason(event: any): any;
        prettyPayload(payload: any): string;
        lifecycleKey(interval: any): string;
        lifecycleClass(state: any): "sts-attention" | "sts-muted-grey";
        outcomeClass(outcome: any): "" | "neg" | "act";
        shortFp(fp: any): string;
        shortSha(sha: any): string;
        symbolOf(id: any): any;
        _tickerOrdersMap(rt: any): Map<any, any>;
        fmtTime(ms: any): string;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("cancel-ticker-orders" | "resume-ticker" | "unlock-ticker" | "adopt-position" | "pause-ticker" | "select-runtime" | "refresh" | "load-more-operations" | "toggle-overlay" | "compare-allocation" | "preview-operation" | "approve-operation" | "clear-preview" | "open-lineage-run")[], "cancel-ticker-orders" | "resume-ticker" | "unlock-ticker" | "adopt-position" | "pause-ticker" | "select-runtime" | "refresh" | "load-more-operations" | "toggle-overlay" | "compare-allocation" | "preview-operation" | "approve-operation" | "clear-preview" | "open-lineage-run", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        runtimes: {
            type: ArrayConstructor;
            default: () => never[];
        };
        selectedRuntimeId: {
            type: StringConstructor;
            default: string;
        };
        decisions: {
            type: ArrayConstructor;
            default: () => never[];
        };
        operations: {
            type: ObjectConstructor;
            default: () => {};
        };
        overlayVisibility: {
            type: ObjectConstructor;
            default: () => {};
        };
        money: {
            type: ObjectConstructor;
            default: () => {};
        };
        administration: {
            type: ObjectConstructor;
            default: () => {};
        };
        administrationEnabledFlag: {
            type: BooleanConstructor;
            default: boolean;
        };
        loading: {
            type: BooleanConstructor;
            default: boolean;
        };
        error: {
            type: StringConstructor;
            default: null;
        };
        streaming: {
            type: BooleanConstructor;
            default: boolean;
        };
        maximized: {
            type: BooleanConstructor;
            default: boolean;
        };
        now: {
            type: NumberConstructor;
            default: number;
        };
        control: {
            type: ObjectConstructor;
            default: () => {
                available: boolean;
                pending: boolean;
                awaiting: boolean;
                error: null;
            };
        };
    }>> & Readonly<{
        "onCancel-ticker-orders"?: ((...args: any[]) => any) | undefined;
        "onResume-ticker"?: ((...args: any[]) => any) | undefined;
        "onUnlock-ticker"?: ((...args: any[]) => any) | undefined;
        "onAdopt-position"?: ((...args: any[]) => any) | undefined;
        "onPause-ticker"?: ((...args: any[]) => any) | undefined;
        "onSelect-runtime"?: ((...args: any[]) => any) | undefined;
        onRefresh?: ((...args: any[]) => any) | undefined;
        "onLoad-more-operations"?: ((...args: any[]) => any) | undefined;
        "onToggle-overlay"?: ((...args: any[]) => any) | undefined;
        "onCompare-allocation"?: ((...args: any[]) => any) | undefined;
        "onPreview-operation"?: ((...args: any[]) => any) | undefined;
        "onApprove-operation"?: ((...args: any[]) => any) | undefined;
        "onClear-preview"?: ((...args: any[]) => any) | undefined;
        "onOpen-lineage-run"?: ((...args: any[]) => any) | undefined;
    }>, {
        error: string;
        loading: boolean;
        money: Record<string, any>;
        streaming: boolean;
        control: Record<string, any>;
        runtimes: unknown[];
        selectedRuntimeId: string;
        decisions: unknown[];
        operations: Record<string, any>;
        overlayVisibility: Record<string, any>;
        administration: Record<string, any>;
        administrationEnabledFlag: boolean;
        maximized: boolean;
        now: number;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
import { newTabIntent } from '../../helpers/open-intent.js';
