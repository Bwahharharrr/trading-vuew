declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {
    price: {};
}, {
    show_volume(): any;
    price_line(): any;
    colorCandleUp(): any;
    colorCandleDw(): any;
    colorWickUp(): any;
    colorWickDw(): any;
    colorWickSm(): any;
    colorVolUp(): any;
    colorVolDw(): any;
}, {
    meta_info(): {
        author: string;
        version: string;
    };
    init(): void;
    draw(ctx: any): void;
    use_for(): string[];
    y_range(): number[];
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
