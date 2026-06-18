declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {}, {
    default_font(): string;
    color(): any;
    stroke(): any;
    marker_size(): number;
    line_width(): number;
    shape(): any;
    show_label(): boolean;
    label_color(): any;
    new_font(): any;
}, {
    meta_info(): {
        author: string;
        version: string;
        desc: string;
    };
    draw(ctx: any): void;
    draw_marker(ctx: any, x: any, y: any, r: any): void;
    use_for(): string[];
    legend(values: any): ({
        value: string;
        color: any;
    } | {
        value: string;
        color?: undefined;
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
