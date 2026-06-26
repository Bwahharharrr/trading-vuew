/**
 * Build descriptor-driven offchart overlays from a report-overlays event.
 * Each `series_descriptors[]` entry plots its first field out of `equity_curve[]`
 * (e.g. `backtest_equity` → equity line; `backtest_drawdown` → drawdown
 * histogram). Returns `[{ id, name, type, pane, fields, visible, data, settings }]`.
 *
 * @param {object} report - a `backtest_report_overlays` event
 */
export function backtestSeriesOverlays(report: object): {
    id: any;
    name: any;
    type: string;
    pane: any;
    fields: any;
    visible: boolean;
    data: any[][];
    settings: object;
}[];
/**
 * `trades[]` → Trades-overlay rows `[ts, buy?1:0, price, label]` (same shape the
 * position-trades overlay uses). Side is case-insensitive `Buy`/`Sell`.
 */
export function backtestTradeMarkers(trades: any): any[][];
/**
 * `price_levels[]` → `[{ price, priceRaw, kind, side, quantity, from, to,
 * triggered }]` — a horizontal level over its active lifecycle (activated →
 * triggered/cleared). `from`/`to` are ms (to=null means still active).
 */
export function backtestPriceLevels(levels: any): {
    price: number;
    priceRaw: any;
    kind: any;
    side: any;
    quantity: any;
    from: number | null;
    to: number | null;
    triggered: boolean;
}[];
