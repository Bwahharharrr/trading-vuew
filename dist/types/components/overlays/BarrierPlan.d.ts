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
        function _level(ctx: any, layout: any, x0: any, x1: any, price: any, color: any, dash: any, label: any): void;
        function use_for(): string[];
        function legend(): never[];
    }
    namespace computed {
        function up_color(): any;
        function dn_color(): any;
        function entry_color(): any;
        function font_px(): any;
    }
}
export default _default;
