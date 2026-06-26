declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
