declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
