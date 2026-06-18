/**
 * True when a decimal string represents a negative value — a purely textual
 * check (leading `-` after optional whitespace), so no float rounding happens.
 * Empty / null / non-decimal → false.
 */
export function isNeg(decStr: any): boolean;
/**
 * Stable identity for a position row across snapshots — venue/account/symbol are
 * case-folded (the gateway matches case-insensitively), source distinguishes an
 * open vs a closed row that happens to reuse a position_id. Use as a Vue key /
 * dedup key.
 */
export function positionKey(p: any): string;
/** Partition a flat position list into open (`current`) and closed (`historical`). */
export function splitBySource(positions: any): {
    current: any[];
    historical: any[];
};
/**
 * Normalize an `auth_positions` / `auth_positions_update` event into
 * `{ positions, current, historical }`. Rows are passed through unchanged
 * (decimals stay strings); `splitBySource` adds the convenience partitions.
 */
export function parsePositions(event: any): {
    current: any[];
    historical: any[];
    positions: any;
};
/**
 * Normalize an `auth_position_history` event into
 * `{ positions, next_cursor, total_count }`. `next_cursor` is OPAQUE — pass it
 * back unchanged for the next page; null means the history is exhausted.
 */
export function parseHistory(event: any): {
    positions: any;
    next_cursor: any;
    total_count: any;
};
/**
 * Pull the audit bundle out of an `auth_position_audit` /
 * `auth_position_audit_update` event. Returns the bundle (with `position`,
 * `summary`, `orders`, `trades`) or null. `summary.status` may be
 * complete / degraded / incomplete / missing — callers must honour it.
 */
export function parseAudit(event: any): any;
