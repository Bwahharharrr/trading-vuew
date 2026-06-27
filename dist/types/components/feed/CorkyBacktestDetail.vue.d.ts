declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
