export function runShapeLabel(kind: any): any;
export function runShapeClass(kind: any): "normal" | "universe" | "optimize" | "sweep" | "walk" | "portfolio";
/**
 * @param {object} run        - run summary ({ run_id, symbols, run_kind?, optimization?, … }).
 * @param {object} [artifact] - raw get_backtest_run.artifact (authoritative for older runs).
 * @returns {{ kind:string, label:string, klass:string, chartable:boolean,
 *            multiCandidate:boolean, candidateCount:(number|null) }}
 */
export function detectRunShape(run?: object, artifact?: object): {
    kind: string;
    label: string;
    klass: string;
    chartable: boolean;
    multiCandidate: boolean;
    candidateCount: (number | null);
};
export const RUN_SHAPES: string[];
