export default class Dataset {
    static watcher(n: any, p: any): void;
    static make_tx(dc: any, types: any): {};
    constructor(dc: any, desc: any);
    type: any;
    id: any;
    dc: any;
    set(data: any, exec?: boolean): void;
    update(arr: any): void;
    merge(data: any, exec?: boolean): void;
    remove(exec?: boolean): void;
    data(): Promise<any>;
}
export class DatasetWW {
    static update_all(se: any, data: any): void;
    constructor(id: any, data: any);
    last_upd: number;
    id: any;
    data: any;
    type: any;
    merge(data: any): void;
    op(se: any, op: any): void;
}
