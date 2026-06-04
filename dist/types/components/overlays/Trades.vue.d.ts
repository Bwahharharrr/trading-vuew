declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {}, {
    default_font(): string;
    buy_color(): any;
    sell_color(): any;
    label_color(): any;
    marker_size(): any;
    show_label(): boolean;
    new_font(): any;
}, {
    meta_info(): {
        author: string;
        version: string;
    };
    draw(ctx: any): void;
    draw_label(ctx: any, x: any, y: any, p: any): void;
    use_for(): string[];
    legend(values: any): ({
        value: string;
        color?: undefined;
    } | {
        value: any;
        color: any;
    })[];
}, {
    props: string[];
    mounted(): void;
    beforeUnmount(): void;
    methods: {
        use_for(): void;
        meta_info(): void;
        custom_event(event: any, ...args: any[]): void;
        exec_script(): void;
    };
    watch: {
        settingsDisplayKey(newKey: any, oldKey: any): void;
    };
    computed: {
        sett(): any;
        settingsDisplayKey(): string;
    };
    data(): {
        uxs_count: number;
        last_ux_id: null;
    };
    render(): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>;
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
