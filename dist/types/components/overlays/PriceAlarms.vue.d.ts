declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {}, {
    font11(): string;
}, {
    meta_info(): {
        author: string;
        version: string;
    };
    use_for(): string[];
    init(): void;
    init_axis_shader(): void;
    alarms(): any;
    draw(ctx: any): void;
    draw_bell(ctx: any, x: any, y: any, color: any, ringing: any): void;
    on_mousedown(e: any): void;
    on_mousemove(): void;
    on_mouseup(): void;
    data_colors(): string[];
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
    beforeUnmount(): void;
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
