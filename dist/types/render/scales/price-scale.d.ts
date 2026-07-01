export function createPriceScale(params: any): {
    readonly version: number;
    readonly A: any;
    readonly B: any;
    readonly hi: any;
    readonly lo: any;
    readonly height: any;
    readonly logScale: any;
    set(p: any): boolean;
    recompute(visible: any, expand: any): {
        A: number;
        B: number;
        hi: number;
        lo: number;
        changed: boolean;
    } | null;
    $2screen(y: any): any;
    screen2$(y: any): any;
    clearCache(): void;
};
export default createPriceScale;
