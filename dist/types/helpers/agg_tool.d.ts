export default class AggTool {
    constructor(dc: any, int?: number);
    symbols: {};
    int: number;
    dc: any;
    st_id: any;
    raf_id: any;
    data_changed: boolean;
    _lastUpdate: number;
    push(sym: any, upd: any, tf: any): void;
    update(): void;
    _scheduleNextUpdate(): void;
    refine(sym: any, upd: any): void;
    update_ds(sym: any, out: any): void;
    clear(): void;
    destroy(): void;
}
