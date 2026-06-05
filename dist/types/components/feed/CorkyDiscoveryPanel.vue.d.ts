declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
}>, {}, {}, {
    venues(): {
        venue: any;
        symbols: any;
    }[];
    hasProgress(): boolean;
    progressPct(): number;
    progressText(): string;
    errorMessage(): any;
}, {
    timeframesFor(st: any): any;
    activeTimeframe(row: any): any;
    indicatorsFor(row: any): any;
    defaultIndicators(row: any, tf: any): any;
    isSymbolActive(row: any): boolean;
    isCurrent(row: any, tf: any): boolean;
    isIndicatorOn(row: any, ind: any): boolean;
    badgeText(tf: any): "pending" | "stale" | "ready";
    badgeClass(tf: any): "badge-pending" | "badge-stale" | "badge-ready";
    onSelectTimeframe(row: any, tf: any): void;
    onAddTimeframe(row: any): void;
    onToggleIndicator(row: any, ind: any): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("select" | "add-timeframe" | "add-indicator" | "retry")[], "select" | "add-timeframe" | "add-indicator" | "retry", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
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
    "onAdd-indicator"?: ((...args: any[]) => any) | undefined;
    onRetry?: ((...args: any[]) => any) | undefined;
}>, {
    error: Record<string, any>;
    progress: Record<string, any>;
    states: unknown[];
    current: Record<string, any>;
    loading: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
