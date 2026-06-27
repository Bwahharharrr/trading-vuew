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
export function pushRecent(list: Array<any> | null | undefined, id: any, max?: number): Array<any>;
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
export function recencyClass(id: any, list: Array<any> | null | undefined, prefix?: string): string;
