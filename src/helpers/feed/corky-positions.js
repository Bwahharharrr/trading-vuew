// Pure transforms for Corky auth-position events. No framework / I/O deps so the
// shapes can be golden-pinned and unit-tested in isolation (mirrors corky-ingest.js).
//
// DECIMAL SAFETY: every numeric position field (amount, base_price, pl, …) is a
// decimal STRING on the wire. These transforms NEVER parse them as floats — they
// pass the strings through verbatim so the UI can render exact text. The only
// numeric interpretation is sign (for colouring), via isNeg(), which is a textual
// test and loses no precision. Timestamps are epoch-ms integers (safe as numbers).

/**
 * True when a decimal string represents a negative value — a purely textual
 * check (leading `-` after optional whitespace), so no float rounding happens.
 * Empty / null / non-decimal → false.
 */
export function isNeg(decStr) {
  if (decStr == null) return false
  return String(decStr).trim().startsWith('-')
}

/**
 * Stable identity for a position row across snapshots — venue/account/symbol are
 * case-folded (the gateway matches case-insensitively), source distinguishes an
 * open vs a closed row that happens to reuse a position_id. Use as a Vue key /
 * dedup key.
 */
export function positionKey(p) {
  if (!p) return ''
  const v = String(p.venue || '').toLowerCase()
  const a = String(p.account_id || '')
  const s = String(p.symbol || '').toLowerCase()
  return `${v}|${a}|${s}|${p.source}|${p.position_id}`
}

/** Partition a flat position list into open (`current`) and closed (`historical`). */
export function splitBySource(positions) {
  const current = []
  const historical = []
  for (const p of positions || []) {
    if (!p) continue
    if (p.source === 'historical') historical.push(p)
    else if (p.source === 'current') current.push(p)
  }
  return { current, historical }
}

/**
 * Normalize an `auth_positions` / `auth_positions_update` event into
 * `{ positions, current, historical }`. Rows are passed through unchanged
 * (decimals stay strings); `splitBySource` adds the convenience partitions.
 */
export function parsePositions(event) {
  const positions = (event && Array.isArray(event.positions)) ? event.positions : []
  return { positions, ...splitBySource(positions) }
}

/**
 * Normalize an `auth_position_history` event into
 * `{ positions, next_cursor, total_count }`. `next_cursor` is OPAQUE — pass it
 * back unchanged for the next page; null means the history is exhausted.
 */
export function parseHistory(event) {
  return {
    positions: (event && Array.isArray(event.positions)) ? event.positions : [],
    next_cursor: (event && event.next_cursor != null) ? event.next_cursor : null,
    total_count: (event && typeof event.total_count === 'number') ? event.total_count : 0,
  }
}

/**
 * Pull the audit bundle out of an `auth_position_audit` /
 * `auth_position_audit_update` event. Returns the bundle (with `position`,
 * `summary`, `orders`, `trades`) or null. `summary.status` may be
 * complete / degraded / incomplete / missing — callers must honour it.
 */
export function parseAudit(event) {
  return (event && event.audit) ? event.audit : null
}
