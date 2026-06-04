declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {}, {
    line_width(): any;
    color(): any;
    show_mid(): any;
    back_color(): any;
}, {
    meta_info(): {
        author: string;
        version: string;
    };
    draw(ctx: any): void;
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
        drawDataLine(ctx: CanvasRenderingContext2D, data: any[], index?: number, skipNaN?: boolean): void;
        drawStepLine(ctx: CanvasRenderingContext2D, data: any[], index?: number): void;
        drawBandFill(ctx: CanvasRenderingContext2D, data: any[], topIndex: number, bottomIndex: number): void;
        drawMultiLines(ctx: CanvasRenderingContext2D, data: any[], indices: any[], skipNaN?: boolean): void;
        setupStroke(ctx: CanvasRenderingContext2D, width: number, color: string): void;
        setupFillAndStroke(ctx: CanvasRenderingContext2D, strokeWidth: number, strokeColor: string, fillColor: string): void;
        iterateData(data: any[], callback: Function, options?: Object): void;
        pointToScreen(point: any[], index?: number): any[];
    };
}, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
