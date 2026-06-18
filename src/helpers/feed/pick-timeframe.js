// Timeframe selection for switching the chart to a position's ticker.
//
// Rule (per product spec): keep the timeframe the user is currently viewing if
// the target symbol offers it; else fall back to `1h`; else the LOWEST available.
// Matching is ASCII case-insensitive (the gateway advertises e.g. `1h` while some
// UI lists use `1H`), but the value RETURNED is the exact label the gateway
// advertised, so the follow-up subscribe uses a label the gateway recognises.

// Unit → milliseconds. CASE-SENSITIVE on the unit letter because `m` is a minute
// but `M` is a month (the gateway uses both); every other unit folds to lower.
const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,              // minute (lowercase only)
  h: 60 * 60 * 1000,        // hour
  d: 24 * 60 * 60 * 1000,   // day
  w: 7 * 24 * 60 * 60 * 1000, // week
  M: 30 * 24 * 60 * 60 * 1000, // month (uppercase only) — ordering proxy only
  y: 365 * 24 * 60 * 60 * 1000, // year
}

/**
 * Convert a timeframe label (`"1m"`, `"15m"`, `"1h"`/`"1H"`, `"1D"`, `"1W"`,
 * `"1M"`, …) to milliseconds for ordering. Unparseable labels → `Infinity` so
 * they sort LAST and are never chosen as "lowest".
 */
export function tfToMs(tf) {
  if (tf == null) return Infinity
  const m = String(tf).trim().match(/^(\d+(?:\.\d+)?)([a-zA-Z])$/)
  if (!m) return Infinity
  const n = parseFloat(m[1])
  const unit = m[2]
  // 'm' (minute) and 'M' (month) are distinct; fold the rest to lowercase.
  const key = (unit === 'm' || unit === 'M') ? unit : unit.toLowerCase()
  const ms = UNIT_MS[key]
  return ms == null ? Infinity : n * ms
}

const sameTf = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()

/**
 * Choose the timeframe to use when switching to `available` (the target symbol's
 * advertised timeframes): keep `current` if present → else `fallback` (default
 * `"1h"`) → else the lowest available. Returns the exact label from `available`
 * (preserving its case), or `current ?? null` when `available` is empty.
 *
 * @param {string} current   the timeframe currently being viewed
 * @param {string[]} available  timeframes the target symbol offers
 * @param {{fallback?: string}} [opts]
 */
export function pickTimeframe(current, available, opts = {}) {
  const list = Array.isArray(available) ? available.filter((t) => t != null) : []
  if (!list.length) return current == null ? null : current

  // 1) keep the current timeframe if the target offers it
  if (current != null) {
    const keep = list.find((t) => sameTf(t, current))
    if (keep) return keep
  }

  // 2) else the default (1h) if offered
  const fallback = opts.fallback || '1h'
  const def = list.find((t) => sameTf(t, fallback))
  if (def) return def

  // 3) else the lowest available by duration (first wins on ties → stable)
  let best = list[0]
  let bestMs = tfToMs(best)
  for (const t of list) {
    const ms = tfToMs(t)
    if (ms < bestMs) { best = t; bestMs = ms }
  }
  return best
}
