export function createTimeScale(params: any): {
    readonly version: number;
    readonly range: any;
    readonly spacex: any;
    readonly px_step: any;
    readonly startx: any;
    readonly r: number;
    readonly ib: any;
    readonly ti_map: any;
    set(p: any): boolean;
    t2screen(t: any): any;
    screen2t(x: any): any;
    t_magnet(t: any, cn: any): number | undefined;
    c_magnet(t: any, cn: any): any;
    c_magnet_i(t: any, cn: any): any;
    clearCache(): void;
};
export default createTimeScale;
