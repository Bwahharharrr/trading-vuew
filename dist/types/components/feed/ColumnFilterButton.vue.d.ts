declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
