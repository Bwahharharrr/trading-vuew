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
}>, {}, {}, {
    rows(): unknown[];
    activeAccountKey(): string;
}, {
    selectTab(tab: any): void;
    accountKey(a: any): string;
    onAccountChange(ev: any): void;
    rowKey(p: any): string;
    isActiveRow(p: any): boolean;
    sideClass(p: any): "" | "side-long" | "side-short";
    signClass(dec: any): "" | "neg" | "pos";
    pctText(dec: any): string;
    fmtTime(ms: any): string;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("update:open" | "update:active-tab" | "update:active-account" | "select-position" | "load-more" | "refresh" | "resize-start")[], "update:open" | "update:active-tab" | "update:active-account" | "select-position" | "load-more" | "refresh" | "resize-start", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
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
}>> & Readonly<{
    "onUpdate:open"?: ((...args: any[]) => any) | undefined;
    "onUpdate:active-tab"?: ((...args: any[]) => any) | undefined;
    "onUpdate:active-account"?: ((...args: any[]) => any) | undefined;
    "onSelect-position"?: ((...args: any[]) => any) | undefined;
    "onLoad-more"?: ((...args: any[]) => any) | undefined;
    onRefresh?: ((...args: any[]) => any) | undefined;
    "onResize-start"?: ((...args: any[]) => any) | undefined;
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
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
