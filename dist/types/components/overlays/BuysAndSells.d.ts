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
        function draw(ctx: any): void;
        function use_for(): string[];
    }
    let computed: {};
}
export default _default;
