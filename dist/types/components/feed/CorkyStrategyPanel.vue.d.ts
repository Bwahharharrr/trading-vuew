declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
    now: {
        type: NumberConstructor;
        default: number;
    };
}>, {}, {}, {
    activeRuntimeId(): any;
    selectedRuntime(): {} | null;
    walletGroups(): {
        class: string;
        wallets: any;
    }[];
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
    tickerRows(): any;
    decisionGroups(): any[];
}, {
    readiness(state: any): {
        state: string;
        ready: boolean;
        tone: string;
    };
    statusClasses(raw: any): string[];
    statusLabel(raw: any): string;
    rollupClasses(raw: any): string[];
    dash(v: any): any;
    dash0(v: any): any;
    boolText(v: any): "—" | "yes" | "no";
    gateClass(ok: any): "" | "pos" | "neg";
    signClass(dec: any): "" | "pos" | "neg";
    numOr0(v: any): number;
    orderCountsTitle(split: any): string;
    intentsTitle(intents: any): string;
    checksTitle(checks: any): string;
    risksFailed(checks: any): boolean;
    deltasTitle(deltas: any): string;
    claimsTitle(claims: any): string;
    outcomeClass(outcome: any): "" | "neg" | "act";
    shortFp(fp: any): string;
    _symbolFromTickerId(id: any): any;
    fmtTime(ms: any): string;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("select-runtime" | "refresh")[], "select-runtime" | "refresh", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
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
    now: {
        type: NumberConstructor;
        default: number;
    };
}>> & Readonly<{
    "onSelect-runtime"?: ((...args: any[]) => any) | undefined;
    onRefresh?: ((...args: any[]) => any) | undefined;
}>, {
    error: string;
    loading: boolean;
    runtimes: unknown[];
    selectedRuntimeId: string;
    decisions: unknown[];
    streaming: boolean;
    now: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
