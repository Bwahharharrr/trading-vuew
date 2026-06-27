declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    tabs: {
        type: ArrayConstructor;
        default: () => never[];
    };
    activeId: {
        type: StringConstructor;
        default: null;
    };
    max: {
        type: NumberConstructor;
        default: number;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("create" | "select" | "close")[], "create" | "select" | "close", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    tabs: {
        type: ArrayConstructor;
        default: () => never[];
    };
    activeId: {
        type: StringConstructor;
        default: null;
    };
    max: {
        type: NumberConstructor;
        default: number;
    };
}>> & Readonly<{
    onSelect?: ((...args: any[]) => any) | undefined;
    onClose?: ((...args: any[]) => any) | undefined;
    onCreate?: ((...args: any[]) => any) | undefined;
}>, {
    max: number;
    tabs: unknown[];
    activeId: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
