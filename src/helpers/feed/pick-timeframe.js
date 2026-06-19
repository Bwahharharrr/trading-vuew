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

// Parse the unit letter from a timeframe label, preserving the m/M distinction.
function tfUnit(tf) {
  const m = String(tf == null ? '' : tf).trim().match(/^(\d+(?:\.\d+)?)([a-zA-Z])$/)
  if (!m) return null
  return { n: parseFloat(m[1]), unit: (m[2] === 'm' || m[2] === 'M') ? m[2] : m[2].toLowerCase() }
}

/**
 * The candle subscribe window for a position: pad [start, end] by `count` candles
 * on each side using the timeframe's bucket size, then clamp to [0, now]. Month
 * (`M`) and year (`y`) timeframes step by CALENDAR units (not fixed 30-day math);
 * everything else uses {@link tfToMs}. `now` is passed in (pure/testable).
 *
 * Returns `{ start_ms, end_ms }` (end_ms ≥ start_ms; never future, never < 0).
 */
export function paddedCandleRange({ start, end, timeframe, count = 400, now }) {
  const u = tfUnit(timeframe)
  let s, e
  if (u && (u.unit === 'M' || u.unit === 'y')) {
    // Calendar stepping so 1M padding isn't off by days/leap years.
    const months = (u.unit === 'M' ? u.n : u.n * 12) * count
    const ds = new Date(start); ds.setMonth(ds.getMonth() - months)
    const de = new Date(end); de.setMonth(de.getMonth() + months)
    s = ds.getTime(); e = de.getTime()
  } else {
    const pad = count * tfToMs(timeframe)
    s = start - pad; e = end + pad
  }
  if (!Number.isFinite(s)) s = start
  if (!Number.isFinite(e)) e = end
  s = Math.max(0, s)
  if (typeof now === 'number' && Number.isFinite(now)) e = Math.min(now, e)
  if (e < s) e = s
  return { start_ms: s, end_ms: e }
}

/**
 * Coarsen a preferred timeframe so a long position window doesn't request an
 * absurd number of candles (e.g. a multi-year position at 1m). Returns the FINEST
 * available timeframe that is at least as coarse as `preferred` AND keeps
 * `spanMs / tfMs ≤ maxCandles`; if even the coarsest available exceeds the cap,
 * returns that coarsest. Never returns a timeframe FINER than `preferred`. With no
 * span (≤0) or no usable candidates, returns `preferred` unchanged.
 */
export function coarsenTimeframe(preferred, available, spanMs, { maxCandles = 3000 } = {}) {
  const list = (Array.isArray(available) ? available : []).filter((t) => t != null)
  if (!list.length || !(spanMs > 0)) return preferred
  const ranked = list
    .map((t) => ({ t, ms: tfToMs(t) }))
    .filter((x) => Number.isFinite(x.ms) && x.ms > 0)
    .sort((a, b) => a.ms - b.ms)
  if (!ranked.length) return preferred
  const prefMs = tfToMs(preferred)
  // Only consider timeframes at least as coarse as the preferred (never go finer);
  // fall back to the full set if the preferred is coarser than everything offered.
  const atOrCoarser = Number.isFinite(prefMs) ? ranked.filter((x) => x.ms >= prefMs) : ranked
  const pool = atOrCoarser.length ? atOrCoarser : ranked
  const fit = pool.find((x) => (spanMs / x.ms) <= maxCandles)   // finest that fits the cap
  return fit ? fit.t : pool[pool.length - 1].t                   // else the coarsest available
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
