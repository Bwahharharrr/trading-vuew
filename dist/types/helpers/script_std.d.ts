export default class ScriptStd {
    constructor(env: any);
    env: any;
    se: {
        t: number;
        tf: number;
        iter: number;
        data: {};
        shared: {};
        mods: {};
        send: null;
        std_inject: null;
        match_ds: null;
    };
    SWMA: number[];
    STDEV_EPS: number;
    STDEV_Z: number;
    _index_tracking(): void;
    _add_i(name: any, src: any): Function | null;
    corr(): void;
    time(res: any, sesh: any): void;
    timestamp(): void;
    linearint(): void;
    nearestrank(): void;
    percentrank(): void;
    variance(src: any, len: any): void;
    vwap(src: any): void;
}
