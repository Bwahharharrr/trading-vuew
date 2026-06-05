/**
 * Resolve placement + overlay type for an indicator kind.
 *
 * @param {string} kind - indicator kind, e.g. `'sma'`, `'rsi'`, `'macd'`.
 * @returns {{ pane: 'onchart'|'offchart', overlayType: string }}
 */
export function indicatorPlacement(kind: string): {
    pane: "onchart" | "offchart";
    overlayType: string;
};
export namespace onchartKinds {
    export { LINE as sma };
    export { LINE as ema };
    export { LINE as wma };
    export { LINE as vwap };
    export { LINE as hma };
    export let bbands: string;
    export { LINE as dema };
    export { LINE as tema };
    export let kc: string;
    export { LINE as supertrend };
}
export namespace offchartKinds {
    export { LINE as rsi };
    export let macd: string;
    export let stoch: string;
    export { LINE as atr };
    export { LINE as adx };
    export { LINE as cci };
    export { LINE as mfi };
    export { LINE as obv };
    export let volume: string;
}
declare const LINE: "Spline";
export {};
