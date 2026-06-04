declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {}, {
    p1(): any;
    p2(): any;
    line_width(): any;
    color(): any;
    back_color(): any;
    value_back(): any;
    value_color(): any;
    prec(): any;
    new_font(): string;
    price(): any;
    time(): any;
    shift(): any;
}, {
    meta_info(): {
        author: string;
        version: string;
    };
    tool(): {
        group: string;
        icon: string;
        type: string;
        hint: string;
        data: never[];
        settings: {};
        mods: {
            Time: {
                icon: string;
                settings: {
                    price: boolean;
                    time: boolean;
                };
            };
            PriceTime: {
                icon: string;
                settings: {
                    price: boolean;
                    time: boolean;
                };
            };
            ShiftMode: {
                settings: {
                    price: boolean;
                    time: boolean;
                    shiftMode: boolean;
                };
                hidden: boolean;
            };
        };
    };
    init(): void;
    draw(ctx: any): void;
    vertical(ctx: any, x1: any, y1: any, x2: any, y2: any, xm: any): void;
    horizontal(ctx: any, x1: any, y1: any, x2: any, y2: any, xm: any): void;
    draw_value(ctx: any, dir: any, xm: any, y: any): void;
    t2str(t: any): string | undefined;
    use_for(): string[];
    data_colors(): any[];
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
        init_tool(): void;
        render_pins(ctx: any): void;
        set_state(name: any): void;
        watch_uuid(n: any, p: any): void;
        pre_draw(): void;
        remove_tool(): void;
        start_drag(): void;
        drag_update(): void;
    };
    computed: {
        selected(): any;
        state(): any;
    };
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
