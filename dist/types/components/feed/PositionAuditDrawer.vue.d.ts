declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
