// symbol-meta.js — DERIVED symbol classification for the Corky discovery UI.
//
// IMPORTANT: The Corky chart-feed protocol exposes NO category field on a
// state/symbol. The categories below are DERIVED purely from Bitfinex symbol
// NAMING conventions. This module is the SINGLE place to refine that heuristic
// (e.g. when adding other venues) so the .vue stays presentational.
//
// Bitfinex naming heuristic:
//   - 'f…'            (e.g. fUSD:p30)            → funding
//   - '…F0…' marker   (e.g. tBTCF0:USTF0)        → derivative (perp/futures),
//                                                   which is also margin-eligible
//   - 't…' (non-F0)   (e.g. tBTCUSD, tADABTC)    → exchange, also margin-eligible
//   - anything else                              → exchange (safe fallback)
//
// The "F0" marker is detected case-sensitively as it appears in Bitfinex
// derivative tickers (e.g. tBTCF0:USTF0, tETHF0:BTCF0).

// Display/sort order for the category filter chips in the UI.
export const SYMBOL_CATEGORIES = ['exchange', 'margin', 'derivative', 'funding']

/**
 * Classify a Bitfinex-style symbol into zero-or-more derived categories.
 *
 * @param {string} symbol  e.g. 'tBTCUSD', 'tBTCF0:USTF0', 'fUSD:p30'
 * @returns {string[]} subset of SYMBOL_CATEGORIES (order not guaranteed)
 */
export function symbolCategories(symbol) {
    if (typeof symbol !== 'string' || symbol.length === 0) {
        return ['exchange']
    }

    // Funding symbols are prefixed with a lowercase 'f'.
    if (symbol[0] === 'f') {
        return ['funding']
    }

    // Derivative (perp/futures) symbols carry the 'F0' marker. On Bitfinex
    // these are margin-eligible.
    if (symbol.includes('F0')) {
        return ['derivative', 'margin']
    }

    // Trading-pair symbols are prefixed with 't' and are margin-eligible.
    if (symbol[0] === 't') {
        return ['exchange', 'margin']
    }

    // Unknown shape: classify conservatively as a plain exchange symbol.
    return ['exchange']
}
