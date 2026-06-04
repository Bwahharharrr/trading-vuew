declare namespace _default {
    namespace methods {
        function meta_info(): {
            author: string;
            version: string;
        };
        function draw(ctx: any): void;
        function data_colors(): any[];
        function legend(values: any): {
            value: any;
            color: any;
        }[];
        function y_range(hi: any, lo: any): any[];
    }
    namespace computed {
        function colorDown(): any;
        function baseline(): any;
        function data_index(): any;
    }
    function data(): {};
}
export default _default;
