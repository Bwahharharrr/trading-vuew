declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    geometry: {
        type: ObjectConstructor;
        default: null;
    };
    initial: {
        type: ObjectConstructor;
        default: null;
    };
}>, {}, {
    orderSize: number;
    orderQty: number;
    distribution: any;
    distTypes: {
        value: string;
        label: string;
        icon: string;
    }[];
}, {
    low(): number;
    high(): number;
    valid(): boolean;
}, {
    fmt(v: any): any;
    confirm(): void;
    close(): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("close" | "confirm")[], "close" | "confirm", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    geometry: {
        type: ObjectConstructor;
        default: null;
    };
    initial: {
        type: ObjectConstructor;
        default: null;
    };
}>> & Readonly<{
    onClose?: ((...args: any[]) => any) | undefined;
    onConfirm?: ((...args: any[]) => any) | undefined;
}>, {
    geometry: Record<string, any>;
    initial: Record<string, any>;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
