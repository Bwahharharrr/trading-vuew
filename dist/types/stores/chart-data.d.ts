export default class ChartData {
    /**
     * @param {object} ctx
     * @param {object} ctx.data - DataCube data object (live ref / getter)
     * @param {object} [ctx.dss] - dataset proxies
     * @param {()=>void} [ctx.updateIds] - rebuild id maps after a structural change
     */
    constructor(ctx: {
        data: object;
        dss?: object | undefined;
        updateIds?: (() => void) | undefined;
    });
    _ctx: {
        data: object;
        dss?: object | undefined;
        updateIds?: (() => void) | undefined;
    };
    invalidate: () => void;
    revision: () => number;
    get data(): object;
    _q(): {
        data: object;
        dss: object | undefined;
    };
    query(query: any, chuck: any): {
        p: any;
        i: any;
        v: any;
    }[];
    get(query: any): any[];
    getOne(query: any): any;
    set(query: any, data: any): void;
    merge(query: any, data: any): void;
    del(query: any): void;
    add(side: any, overlay: any): any;
    lock(query: any): void;
    unlock(query: any): void;
}
