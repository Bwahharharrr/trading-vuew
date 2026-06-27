// Recency-graded click history (Foundation, pure).
//
// A small, framework-agnostic helper that tracks the last-N clicked ids
// (backtest runs, universe candidates, …) most-recent-FIRST, and maps an id to
// a CSS class so a row can be tinted by how recently it was opened (brighter =
// more recent, darker = older). No DOM, no Vue, no mutation of inputs.

/**
 * Push `id` onto the front of a recency list: most-recent-FIRST, deduped (a
 * re-click moves the id to the front rather than duplicating it), and capped at
 * `max`. Returns a NEW array (the input is never mutated); a null/undefined
 * list is treated as empty.
 *
 * @param {Array<*>|null|undefined} list - existing recency list (most-recent first)
 * @param {*} id - the id just clicked
 * @param {number} [max=5] - hard cap on remembered ids
 * @returns {Array<*>} new most-recent-first list
 */
export function pushRecent(list, id, max = 5) {
    const base = Array.isArray(list) ? list : []
    // Drop any prior occurrence so a re-click promotes (not duplicates) the id.
    // Object.is keeps dedup consistent with recencyClass's lookup for every id
    // kind (incl. the NaN edge), so push and lookup can never disagree.
    const deduped = base.filter((x) => !Object.is(x, id))
    const next = [id, ...deduped]
    // A non-positive / non-finite cap yields an empty list (defensive).
    const cap = Number.isFinite(max) && max > 0 ? Math.floor(max) : 0
    return next.slice(0, cap)
}

/**
 * Map an id to its recency CSS class. Returns `'<prefix>-<idx>'` where idx is
 * the id's position in the list (0 = most recent), or `''` when the id is not
 * present (or the list is empty/invalid).
 *
 * @param {*} id - the id to look up
 * @param {Array<*>|null|undefined} list - recency list (most-recent first)
 * @param {string} [prefix='recency'] - class-name prefix
 * @returns {string} `'<prefix>-<idx>'` or `''`
 */
export function recencyClass(id, list, prefix = 'recency') {
    if (!Array.isArray(list)) return ''
    // findIndex+Object.is mirrors pushRecent's dedup equality (SameValue), so a
    // pushed id always resolves to its class — even for the NaN edge.
    const idx = list.findIndex((x) => Object.is(x, id))
    return idx === -1 ? '' : `${prefix}-${idx}`
}
