// Unit tests for the pure search-query helpers: descriptor lookup, indicators[]
// derivation (canonical kind verbatim, display-label condition), condition-tree
// assembly, full-query validation, and match-row projection.

import { describe, it, expect } from 'vitest'
import {
    findIndicatorDescriptor,
    conditionIndicatorLabels,
    buildSearchIndicators,
    compareCondition,
    buildCondition,
    isValidRow,
    buildSearchQuery,
    projectMatchRow,
} from '../../src/helpers/feed/search-query.js'

// Descriptors mirror a real list_candle_states dump (kind ≠ display_label).
const DESCRIPTORS = [
    { display_label: 'MACD(12,26,9)', kind: 'MACD', timeframe: '1h', source: 'close', params: { fast: '12', slow: '26', signal: '9' } },
    { display_label: 'MACD(12,26,9)', kind: 'MACD', timeframe: '2h', source: 'close', params: { fast: '12', slow: '26', signal: '9' } },
    { display_label: 'CRUP', kind: 'CRUP_MTF', timeframe: '1h', source: 'close', params: { decay: '0.9', timeframes: '1h,2h', timeframes_pinned: '1' } },
    { display_label: 'SCMR', kind: 'SCMR', timeframe: '1h', source: 'close', params: {} },
]

describe('findIndicatorDescriptor', () => {
    it('prefers the descriptor at the requested timeframe', () => {
        const d = findIndicatorDescriptor(DESCRIPTORS, 'MACD(12,26,9)', '2h')
        expect(d.timeframe).toBe('2h')
    })
    it('falls back to the first match when the timeframe is absent', () => {
        const d = findIndicatorDescriptor(DESCRIPTORS, 'MACD(12,26,9)', '1D')
        expect(d.timeframe).toBe('1h')
    })
    it('returns null for an unknown label', () => {
        expect(findIndicatorDescriptor(DESCRIPTORS, 'NOPE', '1h')).toBeNull()
    })
})

describe('conditionIndicatorLabels', () => {
    it('collects distinct labels across a nested all/any tree', () => {
        const cond = {
            type: 'all',
            conditions: [
                { type: 'compare', field: { indicator: 'CRUP', field: 'bull_confluence_timeframe_count' }, op: 'gte', value: 1 },
                { type: 'any', conditions: [
                    { type: 'compare', field: { indicator: 'MACD(12,26,9)', field: 'histogram' }, op: 'gt', value: 0 },
                    { type: 'compare', field: { indicator: 'CRUP', field: 'bear_box_count' }, op: 'lt', value: 5 },
                ] },
            ],
        }
        expect(conditionIndicatorLabels(cond)).toEqual(['CRUP', 'MACD(12,26,9)'])
    })
})

describe('buildSearchIndicators', () => {
    it('derives entries with the canonical kind verbatim, timeframe pinned to the search tf', () => {
        const { indicators, unresolved } = buildSearchIndicators({
            descriptors: DESCRIPTORS, labels: ['MACD(12,26,9)'], timeframes: ['1h'],
        })
        expect(unresolved).toEqual([])
        expect(indicators).toEqual([
            { kind: 'MACD', timeframe: '1h', source: 'close', params: { fast: '12', slow: '26', signal: '9' } },
        ])
    })

    it('emits one entry per (label × timeframe) and de-dupes identical entries', () => {
        const { indicators } = buildSearchIndicators({
            descriptors: DESCRIPTORS, labels: ['MACD(12,26,9)', 'CRUP'], timeframes: ['1h', '2h'],
        })
        // MACD@1h, MACD@2h, CRUP@1h, CRUP@2h(fallback descriptor pinned to 2h)
        expect(indicators).toHaveLength(4)
        const kinds = indicators.map((i) => `${i.kind}@${i.timeframe}`)
        expect(kinds).toContain('MACD@1h')
        expect(kinds).toContain('MACD@2h')
        expect(kinds).toContain('CRUP_MTF@1h')
        expect(kinds).toContain('CRUP_MTF@2h')
    })

    it('reports labels with no descriptor as unresolved (would silently stall)', () => {
        const { indicators, unresolved } = buildSearchIndicators({
            descriptors: DESCRIPTORS, labels: ['GHOST'], timeframes: ['1h'],
        })
        expect(indicators).toEqual([])
        expect(unresolved).toEqual(['GHOST'])
    })
})

describe('compareCondition / buildCondition / isValidRow', () => {
    it('compareCondition coerces value to a number and defaults bar_offset to 0', () => {
        expect(compareCondition({ indicator: 'CRUP', field: 'score', op: 'gt', value: '1.5' }))
            .toEqual({ type: 'compare', field: { indicator: 'CRUP', field: 'score', bar_offset: 0 }, op: 'gt', value: 1.5 })
    })
    it('compareCondition keeps a non-zero bar_offset', () => {
        const c = compareCondition({ indicator: 'CRUP', field: 'score', op: 'gt', value: 1, bar_offset: 2 })
        expect(c.field.bar_offset).toBe(2)
    })
    it('buildCondition: a lone valid row collapses to its compare', () => {
        const c = buildCondition([{ indicator: 'CRUP', field: 'score', op: 'gt', value: 1 }])
        expect(c.type).toBe('compare')
    })
    it('buildCondition: multiple rows AND together under all', () => {
        const c = buildCondition([
            { indicator: 'CRUP', field: 'score', op: 'gt', value: 1 },
            { indicator: 'MACD(12,26,9)', field: 'histogram', op: 'gt', value: 0 },
        ])
        expect(c.type).toBe('all')
        expect(c.conditions).toHaveLength(2)
    })
    it('buildCondition: drops invalid rows; returns null when none remain', () => {
        expect(buildCondition([{ indicator: '', field: 'x', op: 'gt', value: 1 }])).toBeNull()
        expect(buildCondition([{ indicator: 'CRUP', field: 'score', op: 'gt', value: 'abc' }])).toBeNull()
    })
    it('isValidRow requires indicator, field, op and a finite numeric value', () => {
        expect(isValidRow({ indicator: 'CRUP', field: 'score', op: 'gt', value: 0 })).toBe(true)
        expect(isValidRow({ indicator: 'CRUP', field: 'score', op: 'gt', value: '' })).toBe(false)
        expect(isValidRow(null)).toBe(false)
    })
})

describe('buildSearchQuery', () => {
    const base = {
        search_id: 'corky-search-1',
        venue: 'BITFINEX',
        symbols: ['tBTCUSD'],
        range: { type: 'latest', limit: 80 },
        timeframes: ['1h'],
        descriptors: DESCRIPTORS,
        condition: { type: 'compare', field: { indicator: 'MACD(12,26,9)', field: 'histogram', bar_offset: 0 }, op: 'gt', value: 0 },
        result_window: { before_bars: 200, after_bars: 600 },
        max_results: 100,
    }

    it('assembles a gateway-ready query with derived indicators[]', () => {
        const { query } = buildSearchQuery(base)
        expect(query.search_id).toBe('corky-search-1')
        expect(query.symbols).toEqual({ type: 'symbols', symbols: ['tBTCUSD'] })
        expect(query.indicators).toEqual([
            { kind: 'MACD', timeframe: '1h', source: 'close', params: { fast: '12', slow: '26', signal: '9' } },
        ])
        expect(query.result_window).toEqual({ before_bars: 200, after_bars: 600 })
        expect(query.max_results).toBe(100)
    })

    it('parses a comma-separated symbol string', () => {
        const { query } = buildSearchQuery({ ...base, symbols: 'tBTCUSD, tETHUSD' })
        expect(query.symbols.symbols).toEqual(['tBTCUSD', 'tETHUSD'])
    })

    it('throws when a referenced indicator has no descriptor (would stall)', () => {
        expect(() => buildSearchQuery({
            ...base,
            condition: { type: 'compare', field: { indicator: 'GHOST', field: 'x' }, op: 'gt', value: 0 },
        })).toThrow(/no descriptor/)
    })

    it('throws on missing symbols / timeframes / condition', () => {
        expect(() => buildSearchQuery({ ...base, symbols: [] })).toThrow(/symbol/)
        expect(() => buildSearchQuery({ ...base, timeframes: [] })).toThrow(/timeframe/)
        expect(() => buildSearchQuery({ ...base, condition: null })).toThrow(/condition/)
    })

    it('defaults range to latest when omitted', () => {
        const { query } = buildSearchQuery({ ...base, range: undefined })
        expect(query.range.type).toBe('latest')
    })
})

describe('projectMatchRow', () => {
    const result = {
        venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h', timestamp_ms: 1781953200000,
        candle: { timestamp_ms: 1781953200000, open: '63654', high: '63780', low: '63597', close: '63664', volume: '11.20' },
        indicators: { CRUP: { bull_confluence_timeframe_count: '1' } },
        observations: [{ indicator: 'CRUP', field: 'bull_confluence_timeframe_count', bar_offset: 0, value: 1 }],
        side: 'bull',
        crup_context: {
            anchor_timeframe: '1h', bull_confluence_timeframe_count: 1, bear_confluence_timeframe_count: 0,
            detection_box_timeframes: [{ timeframe: '2h', side: 'bull', box_count: 2 }],
        },
        chart_window: { timeframe: '1h', start_ms: 1781946000000, end_ms: 1781960400000, before_bars: 2, after_bars: 2 },
    }

    it('projects ticker / signal / boxes and passes chart_window through', () => {
        const row = projectMatchRow(result)
        expect(row.ticker).toBe('tBTCUSD')
        expect(row.signal).toBe('1h bull')
        expect(row.close).toBe('63664')           // decimal kept as a string
        expect(row.boxesText).toBe('2h bull box ×2')
        expect(row.chart_window).toBe(result.chart_window)
    })

    it('is null-safe and tolerates a missing crup_context', () => {
        expect(projectMatchRow(null)).toBeNull()
        const row = projectMatchRow({ ...result, crup_context: null })
        expect(row.boxes).toEqual([])
        expect(row.boxesText).toBe('')
    })
})
