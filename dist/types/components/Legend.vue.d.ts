declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    grid_id?: any;
    common?: any;
    values?: any;
    meta_props?: any;
    layout_override?: any;
}, {}, {}, {
    ohlcv(): any;
    _indexMap(): Map<any, any>;
    indicators(): any;
    calc_style(): {
        top: string;
        width: string;
    };
    layout(): any;
    json_data(): any;
    off_data(): any;
    main_type(): any;
    show_values(): boolean;
}, {
    format(id: any, values: any): any;
    n_a(len: any): any[];
    button_click(event: any): void;
    on_dblclick(e: any): void;
    openSettings(indicator: any): void;
    closeIndicator(indicator: any): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    grid_id?: any;
    common?: any;
    values?: any;
    meta_props?: any;
    layout_override?: any;
}> & Readonly<{}>, {}, {}, {
    ButtonGroup: import("vue").DefineComponent<{
        grid_id?: any;
        index?: any;
        tv_id?: any;
        config?: any;
        buttons?: any;
        ov_id?: any;
        display?: any;
    }, {}, {}, {}, {
        button_click(event: any): void;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        grid_id?: any;
        index?: any;
        tv_id?: any;
        config?: any;
        buttons?: any;
        ov_id?: any;
        display?: any;
    }> & Readonly<{}>, {}, {}, {
        LegendButton: import("vue").DefineComponent<{
            grid_id?: any;
            index?: any;
            tv_id?: any;
            config?: any;
            ov_id?: any;
            display?: any;
            id?: any;
            icon?: any;
        }, {}, {}, {
            base64(): any;
            file_name(): string;
            uuid(): string;
            data_type(): "onchart" | "offchart";
            data_index(): any;
        }, {
            onclick(): void;
        }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
            grid_id?: any;
            index?: any;
            tv_id?: any;
            config?: any;
            ov_id?: any;
            display?: any;
            id?: any;
            icon?: any;
        }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    }, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    Spinner: import("vue").DefineComponent<{
        colors?: any;
    }, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        colors?: any;
    }> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
