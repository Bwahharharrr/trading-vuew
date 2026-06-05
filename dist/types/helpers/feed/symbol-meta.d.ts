/**
 * Classify a Bitfinex-style symbol into zero-or-more derived categories.
 *
 * @param {string} symbol  e.g. 'tBTCUSD', 'tBTCF0:USTF0', 'fUSD:p30'
 * @returns {string[]} subset of SYMBOL_CATEGORIES (order not guaranteed)
 */
export function symbolCategories(symbol: string): string[];
export const SYMBOL_CATEGORIES: string[];
