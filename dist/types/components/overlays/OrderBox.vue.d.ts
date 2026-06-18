declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {}, {
    side(): "sell" | "buy";
    visible(): boolean;
    orders(): any;
    color_buy(): any;
    color_sell(): any;
    fill_buy(): any;
    fill_sell(): any;
    font11(): string;
}, {
    meta_info(): {
        author: string;
        version: string;
    };
    use_for(): string[];
    init(): void;
    destroy(): void;
    watch_uuid(n: any, p: any): void;
    corner(i: any): any;
    box_rect(): {
        xL: number;
        xR: number;
        yT: number;
        yB: number;
    } | null;
    order_geometry(ctx: any, r: any): {
        eye: {
            x: any;
            y: any;
            w: number;
            h: number;
        };
        cog: {
            x: any;
            y: any;
            w: number;
            h: number;
        };
        submit: {
            x: any;
            y: any;
            w: number;
            h: number;
            st: {
                label: string;
                color: any;
                submittable: any;
            };
        };
        rows: {
            id: any;
            size: any;
            status: any;
            y: any;
            xL: any;
            xR: any;
            widget: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
            grab: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
            del: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
        }[];
        resize: any[];
    };
    order_status(): {
        label: string;
        color: any;
        submittable: any;
    };
    order_type_label(): any;
    has_submittable(): any;
    order_summary(): {
        count: any;
        origQty: any;
        origSize: any;
        totalSize: number;
        filledCount: number;
        filledSize: number;
        avgPrice: number | null;
    } | null;
    has_live_orders(): any;
    remove_tool(): void;
    draw(ctx: any): void;
    draw_ghost(ctx: any, color: any): void;
    draw_resize_handles(ctx: any, handles: any, color: any): void;
    draw_order(ctx: any, row: any, color: any): void;
    draw_summary(ctx: any, r: any): void;
    draw_cog(ctx: any, c: any, color: any, locked?: boolean): void;
    draw_dist_curve(ctx: any, r: any, color: any): void;
    draw_eye(ctx: any, e: any, open: any, color: any): void;
    draw_submit(ctx: any, s: any): void;
    on_mousedown(e: any): void;
    on_mousemove(): void;
    drag_update(): void;
    set_cursor(c: any): void;
    update_cursor(): void;
    on_boundary(r: any, x: any, y: any): boolean;
    on_mouseup(): void;
    set_orders(mapFn: any): void;
    delete_order(id: any): void;
    recompute_orders(): void;
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
