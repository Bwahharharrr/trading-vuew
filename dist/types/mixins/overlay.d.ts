declare namespace _default {
    let props: string[];
    function mounted(): void;
    function beforeUnmount(): void;
    namespace methods {
        function use_for(): void;
        function meta_info(): void;
        function custom_event(event: any, ...args: any[]): void;
        function exec_script(): void;
    }
    namespace watch {
        function settingsDisplayKey(newKey: any, oldKey: any): void;
    }
    namespace computed {
        function sett(): any;
        function settingsDisplayKey(): string;
    }
    function data(): {
        uxs_count: number;
        last_ux_id: null;
    };
    function render(): import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>;
}
export default _default;
