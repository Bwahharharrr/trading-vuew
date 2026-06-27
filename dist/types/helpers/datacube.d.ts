export default class DataCube extends DCCore {
    constructor(data?: {}, sett?: {});
    sett: any;
    data: {};
    agg: AggTool;
    se_state: {};
    add(side: any, overlay: any): any;
    get(query: any): any[];
    get_one(query: any): any;
    set(query: any, data: any): void;
    merge(query: any, data: any): void;
    del(query: any): void;
    update(data: any): boolean | void;
    lock(query: any): void;
    unlock(query: any): void;
    show(query: any): void;
    hide(query: any): void;
    onrange(callback: any): void;
}
import DCCore from './dc_core.js';
import AggTool from './agg_tool.js';
