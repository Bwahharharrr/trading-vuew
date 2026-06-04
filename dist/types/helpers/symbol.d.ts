export default class Sym {
    constructor(data: any, params: any);
    id: any;
    tf: any;
    format: any;
    aggtype: any;
    window: any;
    fillgaps: any;
    data: any;
    data_type: number;
    main: boolean;
    idx: {};
    tmap: {};
    close: any;
    update(x: any, t: any): boolean | void;
    update_ohlcv(x: any, t: any): boolean;
    update_copy(x: any, t: any): void;
    __t0__: number | undefined;
    update_custom(x: any, t: any): boolean;
    data_idx(): {};
}
export const ARR: 0;
export const TSS: 1;
export const NUM: 2;
