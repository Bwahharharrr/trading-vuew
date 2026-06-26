declare namespace _default {
    let name: string;
    let mixins: {
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
    }[];
    namespace methods {
        function meta_info(): {
            author: string;
            version: string;
            desc: string;
        };
        function draw(ctx: any): void;
        function use_for(): string[];
        function legend(): never[];
    }
    namespace computed {
        function color(): any;
        function band_color(): any;
        function line_width(): number;
        function glow_width(): number;
        function dashed(): boolean;
        function show_label(): boolean;
        function new_font(): any;
    }
}
export default _default;
