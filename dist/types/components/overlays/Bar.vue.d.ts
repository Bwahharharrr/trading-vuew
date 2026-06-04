declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {}, {
    colorUp(): any;
    bar_width_ratio(): any;
}, {
    use_for(): string[];
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
} | {
    methods: {
        meta_info(): {
            author: string;
            version: string;
        };
        draw(ctx: any): void;
        data_colors(): any[];
        legend(values: any): {
            value: any;
            color: any;
        }[];
        y_range(hi: any, lo: any): any[];
    };
    computed: {
        colorDown(): any;
        baseline(): any;
        data_index(): any;
    };
    data(): {};
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
