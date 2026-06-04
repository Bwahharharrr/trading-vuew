declare namespace _default {
    let props: string[];
    function mounted(): void;
    namespace methods {
        function close(): void;
        function modify(obj: any): void;
        function custom_event(event: any, ...args: any[]): void;
    }
    namespace computed {
        function overlay(): any;
        function layout(): any;
        function uxr(): any;
    }
    function data(): {};
}
export default _default;
