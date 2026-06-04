/**
 * @param {number} t - target timestamp (or index in IB mode)
 * @param {[number,number]|null} bounds - [firstTs, lastTs] of the data
 * @returns {{ value:number, diagnostics:object[] }}
 */
export function clampGoto(t: number, bounds: [number, number] | null): {
    value: number;
    diagnostics: object[];
};
/**
 * @param {number} t1 @param {number} t2
 * @param {[number,number]|null} bounds
 * @returns {{ t1:number, t2:number, diagnostics:object[] }}
 */
export function clampRange(t1: number, t2: number, bounds: [number, number] | null): {
    t1: number;
    t2: number;
    diagnostics: object[];
};
/** Extract [firstTs, lastTs] from a DataCube (or null if no data). */
export function dataBounds(dataCube: any): any[] | null;
