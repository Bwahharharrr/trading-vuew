import { test, expect, describe } from 'vitest'
import { symbolCategories, SYMBOL_CATEGORIES } from '../../src/helpers/feed/symbol-meta.js'

describe('symbolCategories (derived Bitfinex naming heuristic)', () => {
    test('funding symbols (f…) → funding only', () => {
        expect(symbolCategories('fUSD:p30')).toEqual(['funding'])
        expect(symbolCategories('fBTC')).toEqual(['funding'])
    })

    test('derivative symbols (…F0…) → derivative + margin', () => {
        expect(symbolCategories('tBTCF0:USTF0')).toEqual(['derivative', 'margin'])
        expect(symbolCategories('tETHF0:BTCF0')).toEqual(['derivative', 'margin'])
    })

    test('plain trading pairs (t…, non-F0) → exchange + margin', () => {
        expect(symbolCategories('tBTCUSD')).toEqual(['exchange', 'margin'])
        expect(symbolCategories('tADABTC')).toEqual(['exchange', 'margin'])
        expect(symbolCategories('tAVAX:BTC')).toEqual(['exchange', 'margin'])
    })

    test('unknown / empty shapes → exchange fallback', () => {
        expect(symbolCategories('')).toEqual(['exchange'])
        expect(symbolCategories(null)).toEqual(['exchange'])
        expect(symbolCategories('XYZ')).toEqual(['exchange'])
    })

    test('SYMBOL_CATEGORIES display order is stable', () => {
        expect(SYMBOL_CATEGORIES).toEqual(['exchange', 'margin', 'derivative', 'funding'])
    })
})
