declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
