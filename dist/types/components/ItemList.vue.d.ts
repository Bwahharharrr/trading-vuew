declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    colors?: any;
    config?: any;
    dc?: any;
    items?: any;
}, {}, {}, {}, {
    list_style(): {
        left: string;
        background: any;
        borderTop: string;
        borderRight: string;
        borderBottom: string;
    };
    item_class(item: any): "tvjs-item-list-item selected-item" | "tvjs-item-list-item";
    item_style(item: any): {
        height: string;
        color: string | undefined;
    };
    icon_style(data: any): {
        'background-image': string;
        width: string;
        height: string;
        margin: string;
        filter: string;
    };
    item_click(e: any, item: any): void;
    onmousedown(): void;
    thismousedown(e: any): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    colors?: any;
    config?: any;
    dc?: any;
    items?: any;
}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
