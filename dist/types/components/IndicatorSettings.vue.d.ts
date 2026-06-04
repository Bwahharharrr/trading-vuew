declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    indicatorName: {
        type: StringConstructor;
        default: string;
    };
    currentType: {
        type: StringConstructor;
        default: string;
    };
    currentSettings: {
        type: ObjectConstructor;
        default: () => {};
    };
    indicatorIndex: {
        type: NumberConstructor;
        required: true;
    };
    gridId: {
        type: NumberConstructor;
        required: true;
    };
}>, {}, {
    selectedType: string;
    lineColor: any;
    colorUp: any;
    colorDown: any;
    lineWidth: any;
    visualTypes: {
        value: string;
        label: string;
        icon: string;
    }[];
}, {}, {
    selectType(type: any): void;
    updateColors(): void;
    emitSettings(): void;
    buildSettings(): {
        color: any;
        lineWidth: any;
        colorUp?: undefined;
        colorDown?: undefined;
    } | {
        colorUp: any;
        colorDown: any;
        color?: undefined;
        lineWidth?: undefined;
    };
    close(): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    indicatorName: {
        type: StringConstructor;
        default: string;
    };
    currentType: {
        type: StringConstructor;
        default: string;
    };
    currentSettings: {
        type: ObjectConstructor;
        default: () => {};
    };
    indicatorIndex: {
        type: NumberConstructor;
        required: true;
    };
    gridId: {
        type: NumberConstructor;
        required: true;
    };
}>> & Readonly<{}>, {
    indicatorName: string;
    currentType: string;
    currentSettings: Record<string, any>;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
