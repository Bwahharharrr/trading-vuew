declare namespace _default {
    function mounted(): void;
    namespace methods {
        function ctrllist(): any;
        function pre_dc(e: any): void;
        function post_dc(e: any): void;
        function ctrl_destroy(): void;
        function skin_styles(): void;
    }
    namespace computed {
        function ws(): {};
        function skins(): {};
        function skin_proto(): any;
        function colorpack(): any;
        function xSettingsKey(): any;
    }
    namespace watch {
        function skin(n: any, p: any): void;
        function extensions(): void;
        function xSettingsKey(newKey: any, oldKey: any): void;
    }
    function data(): {
        controllers: never[];
    };
}
export default _default;
