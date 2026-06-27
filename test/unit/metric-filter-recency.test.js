// Foundation unit tests for the two pure helpers backing the backtest column
// filters + recency-graded click history:
//   - src/helpers/recency.js       (pushRecent + recencyClass)
//   - src/helpers/metric-filter.js (FILTER_OPS + passesFilter + applyMetricFilters)
import { describe, it, expect } from 'vitest'
import { pushRecent, recencyClass } from '../../src/helpers/recency.js'
import {
    FILTER_OPS,
    passesFilter,
    applyMetricFilters,
} from '../../src/helpers/metric-filter.js'

describe('pushRecent — dedup + cap + order', () => {
    it('prepends most-recent-first onto an empty/null list', () => {
        expect(pushRecent(null, 'a')).toEqual(['a'])
        expect(pushRecent(undefined, 'a')).toEqual(['a'])
        expect(pushRecent([], 'a')).toEqual(['a'])
        expect(pushRecent(['a'], 'b')).toEqual(['b', 'a'])
    })

    it('dedupes by promoting a re-clicked id to the front', () => {
        expect(pushRecent(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b'])
        expect(pushRecent(['a', 'b', 'c'], 'a')).toEqual(['a', 'b', 'c'])
    })

    it('caps the list at max (default 5), dropping the oldest', () => {
        const five = pushRecent(pushRecent(pushRecent(pushRecent(pushRecent([], 1), 2), 3), 4), 5)
        expect(five).toEqual([5, 4, 3, 2, 1])
        // 6th distinct click evicts the oldest (1).
        expect(pushRecent(five, 6)).toEqual([6, 5, 4, 3, 2])
        // custom max
        expect(pushRecent(['a', 'b', 'c'], 'd', 2)).toEqual(['d', 'a'])
    })

    it('does not mutate the input array', () => {
        const orig = ['a', 'b']
        const copy = [...orig]
        pushRecent(orig, 'c')
        expect(orig).toEqual(copy)
    })

    it('non-positive / non-finite max yields an empty list', () => {
        expect(pushRecent(['a'], 'b', 0)).toEqual([])
        expect(pushRecent(['a'], 'b', -1)).toEqual([])
        expect(pushRecent(['a'], 'b', NaN)).toEqual([])
    })
})

describe('recencyClass — index + prefix + miss', () => {
    const list = ['a', 'b', 'c']

    it('maps id to <prefix>-<idx> (0 = most recent)', () => {
        expect(recencyClass('a', list)).toBe('recency-0')
        expect(recencyClass('b', list)).toBe('recency-1')
        expect(recencyClass('c', list)).toBe('recency-2')
    })

    it('honors a custom prefix', () => {
        expect(recencyClass('a', list, 'row')).toBe('row-0')
        expect(recencyClass('c', list, 'hit')).toBe('hit-2')
    })

    it('returns "" on a miss or an invalid/empty list', () => {
        expect(recencyClass('z', list)).toBe('')
        expect(recencyClass('a', [])).toBe('')
        expect(recencyClass('a', null)).toBe('')
        expect(recencyClass('a', undefined)).toBe('')
    })
})

describe('passesFilter — all 5 ops + non-finite safety', () => {
    it('covers every operator in FILTER_OPS', () => {
        expect(FILTER_OPS).toEqual(['>', '>=', '<', '<=', '='])

        expect(passesFilter(10, '>', 5)).toBe(true)
        expect(passesFilter(5, '>', 5)).toBe(false)

        expect(passesFilter(5, '>=', 5)).toBe(true)
        expect(passesFilter(4, '>=', 5)).toBe(false)

        expect(passesFilter(3, '<', 5)).toBe(true)
        expect(passesFilter(5, '<', 5)).toBe(false)

        expect(passesFilter(5, '<=', 5)).toBe(true)
        expect(passesFilter(6, '<=', 5)).toBe(false)

        expect(passesFilter(5, '=', 5)).toBe(true)
        expect(passesFilter(5, '=', 6)).toBe(false)
    })

    it('FAILS (returns false) when the row value is non-finite', () => {
        expect(passesFilter(NaN, '>', 0)).toBe(false)
        expect(passesFilter(Infinity, '>', 0)).toBe(false)
        expect(passesFilter(-Infinity, '<', 0)).toBe(false)
        expect(passesFilter(undefined, '>', 0)).toBe(false) // undefined → NaN → fails
        expect(passesFilter('not-a-number', '>', 0)).toBe(false) // non-numeric string → NaN → fails
    })

    it('EXCLUDES the gateway no-data shapes (null / "" / whitespace), never treats them as 0', () => {
        // Number(null) === 0 and Number('') === 0 are finite, but these mean "no
        // data" — they must fail every comparison, not sneak past >=0 / <100 / =0.
        for (const op of ['>', '>=', '<', '<=', '=']) {
            expect(passesFilter(null, op, 0)).toBe(false)
            expect(passesFilter('', op, 0)).toBe(false)
            expect(passesFilter('   ', op, 100)).toBe(false)
        }
        // A genuine numeric 0 (or '0') still compares normally.
        expect(passesFilter(0, '>=', 0)).toBe(true)
        expect(passesFilter('0', '<', 100)).toBe(true)
    })

    it('FAILS when the threshold is non-finite', () => {
        expect(passesFilter(10, '>', NaN)).toBe(false)
        expect(passesFilter(10, '>', Infinity)).toBe(false)
        expect(passesFilter(10, '>', undefined)).toBe(false)
    })

    it('returns false for an unknown operator', () => {
        expect(passesFilter(10, '!=', 5)).toBe(false)
        expect(passesFilter(10, '', 5)).toBe(false)
    })
})

describe('applyMetricFilters — AND-of-filters + passthrough + getVal', () => {
    const rows = [
        { name: 'r1', pnl: 1500, score: 0.9 },
        { name: 'r2', pnl: 800, score: 0.4 },
        { name: 'r3', pnl: 2000, score: 0.2 },
        { name: 'r4', pnl: NaN, score: 0.95 }, // non-finite metric → excluded by pnl filter
        { name: 'r5', pnl: null, score: 0.95 }, // no-data (null) → excluded, NOT counted as 0
        { name: 'r6', pnl: '', score: 0.95 }, //  no-data ('') → excluded, NOT counted as 0
    ]
    const getVal = (row, key) => row[key]

    it('empty / missing filters pass every row through unchanged', () => {
        expect(applyMetricFilters(rows, [], getVal)).toBe(rows)
        expect(applyMetricFilters(rows, null, getVal)).toBe(rows)
    })

    it('applies a single filter via getVal', () => {
        const out = applyMetricFilters(rows, [{ key: 'pnl', op: '>', value: 1000 }], getVal)
        expect(out.map((r) => r.name)).toEqual(['r1', 'r3'])
    })

    it('ANDs multiple filters (every filter must pass)', () => {
        const filters = [
            { key: 'pnl', label: 'Net P/L', op: '>', value: 1000 },
            { key: 'score', label: 'Score v2', op: '>=', value: 0.5 },
        ]
        const out = applyMetricFilters(rows, filters, getVal)
        expect(out.map((r) => r.name)).toEqual(['r1'])
    })

    it('a non-finite metric fails the filter (row excluded)', () => {
        // r4 (NaN) / r5 (null) / r6 ('') all lack pnl, so a pnl>0 filter excludes them.
        const out = applyMetricFilters(rows, [{ key: 'pnl', op: '>', value: 0 }], getVal)
        expect(out.map((r) => r.name)).toEqual(['r1', 'r2', 'r3'])
    })

    it('no-data rows (null / "") never pass even a permissive numeric filter', () => {
        // pnl <= 1e9 would let any real number through; null/'' must still drop.
        const out = applyMetricFilters(rows, [{ key: 'pnl', op: '<=', value: 1e9 }], getVal)
        expect(out.map((r) => r.name)).toEqual(['r1', 'r2', 'r3'])   // r4/r5/r6 excluded
    })

    it('returns [] for a non-array rows input', () => {
        expect(applyMetricFilters(null, [], getVal)).toEqual([])
        expect(applyMetricFilters(undefined, [{ key: 'pnl', op: '>', value: 0 }], getVal)).toEqual([])
    })
})
