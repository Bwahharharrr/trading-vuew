declare namespace _default {
    namespace methods {
        function range_changed(r: any): void;
        function goto(t: any): void;
        function setRange(t1: any, t2: any): void;
        function calc_interval(): void;
        function set_ytransform(s: any): void;
        function default_range(): void;
        function subset(range?: any): any;
        function init_range(): void;
        function update_layout(clac_tf: any, forceResize?: boolean): void;
        function common_props(): {
            title_txt: any;
            layout: any;
            sub: any;
            range: any;
            interval: any;
            cursor: any;
            colors: any;
            font: any;
            y_ts: any;
            tv_id: any;
            config: any;
            buttons: any;
            meta: any;
            skin: any;
            dataVersion: any;
        };
        function overlay_subset(source: any, side: any): any;
        function update_last_values(): void;
    }
    function data(): {
        sub: never[];
        range: never[];
        interval: number;
        interval_ms: number;
        y_transforms: {};
        sub_start: undefined;
        last_candle: never[];
        last_values: {};
        rerender: number;
        chartLayout: null;
    };
    namespace computed {
        function dimensions(): string;
        function dataHashKey(): any;
    }
    namespace watch {
        function dimensions(): void;
        function ib(nw: any): void;
        function timezone(): void;
        function colors(): void;
        function forced_tf(n: any, p: any): void;
        function dataHashKey(newKey: any, oldKey: any): void;
    }
}
export default _default;
