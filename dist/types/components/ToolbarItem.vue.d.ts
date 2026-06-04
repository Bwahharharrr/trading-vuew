declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    data?: any;
    colors?: any;
    tv_id?: any;
    config?: any;
    selected?: any;
    dc?: any;
    subs?: any;
}, {}, {
    exp_hover: boolean;
    show_exp_list: boolean;
    sub_item: null;
}, {
    item_style(): {
        width: string;
        height: string;
        margin: string;
        'background-color': any;
    } | {
        width: string;
        height: string;
        margin: string;
        'border-radius': string;
    };
    icon_style(): {
        'background-image'?: undefined;
        width?: undefined;
        height?: undefined;
        margin?: undefined;
        filter?: undefined;
    } | {
        'background-image': string;
        width: string;
        height: string;
        margin: string;
        filter: string;
    };
    exp_style(): {
        padding: string;
        transform: string;
    };
    splitter(): {
        width: string;
        height: string;
        margin: string;
        'background-color': any;
    };
}, {
    mousedown(e: any): void;
    expmouseover(): void;
    expmouseleave(): void;
    expmousedown(e: any): void;
    emit_selected(src: any): void;
    emit_selected_sub(item: any): void;
    exp_click(e: any): void;
    close_list(): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    data?: any;
    colors?: any;
    tv_id?: any;
    config?: any;
    selected?: any;
    dc?: any;
    subs?: any;
}> & Readonly<{}>, {}, {}, {
    ItemList: import("vue").DefineComponent<{
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
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
