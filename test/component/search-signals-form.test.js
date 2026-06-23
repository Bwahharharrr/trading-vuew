// @vitest-environment jsdom
//
// SearchSignalsForm — a controlled form that emits a `run` payload (plain
// selections) for the parent to turn into a gateway query. Seeds venue/symbol/
// timeframe from the charted context, references indicators by display label,
// and validates before emitting.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchSignalsForm from '../../src/components/feed/SearchSignalsForm.vue'

const context = {
    venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1h',
    timeframes: ['1h', '2h'],
    indicators: [
        { label: 'MACD(12,26,9)', fields: ['histogram', 'macd', 'signal'] },
        { label: 'CRUP', fields: ['bull_confluence_timeframe_count', 'score'] },
    ],
}

function mountForm(props = {}) {
    return mount(SearchSignalsForm, { props: { context, ...props } })
}

// Fill the first condition row's indicator / field / value selects+input.
async function fillCondition(w, { indicator, field, value }) {
    const cond = w.findAll('.ssf-cond')[0]
    const selects = cond.findAll('select')
    await selects[0].setValue(indicator)   // indicator
    await selects[1].setValue(field)        // field
    const valueInput = cond.find('input[step="any"]')
    await valueInput.setValue(value)
}

describe('SearchSignalsForm', () => {
    test('seeds venue / symbol / timeframe from the context', () => {
        const w = mountForm()
        expect(w.find('.ssf-input').element.value).toBe('BITFINEX')   // venue (first input)
        const inputs = w.findAll('.ssf-grid2 input')
        expect(inputs[0].element.value).toBe('BITFINEX')
        expect(inputs[1].element.value).toBe('tBTCUSD')
        // first timeframe is auto-selected
        const onChips = w.findAll('.ssf-chip.on')
        expect(onChips).toHaveLength(1)
        expect(onChips[0].text()).toBe('1h')
    })

    test('renders a chip per available timeframe; clicking toggles it', async () => {
        const w = mountForm()
        const chips = w.findAll('.ssf-chip')
        expect(chips.map((c) => c.text())).toEqual(['1h', '2h'])
        await chips[1].trigger('click')                       // add 2h
        expect(w.findAll('.ssf-chip.on')).toHaveLength(2)
    })

    test('auto-syncs venue/symbol to the charted context until the user edits them', async () => {
        const w = mountForm()
        const sym = () => w.findAll('.ssf-grid2 input')[1]
        expect(sym().element.value).toBe('tBTCUSD')
        // charted symbol changes → the form follows (not yet edited)
        await w.setProps({ context: { ...context, symbol: 'tETHUSD' } })
        expect(sym().element.value).toBe('tETHUSD')
        // user edits the symbol → it pins, later context changes don't clobber it
        await sym().setValue('tMANUAL')
        await w.setProps({ context: { ...context, symbol: 'tXRPUSD' } })
        expect(sym().element.value).toBe('tMANUAL')
    })

    test('indicator options follow the searched symbol (context.symbols)', async () => {
        const ctx = {
            ...context,
            symbols: [
                { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframes: ['1h'], indicators: [{ label: 'MACD(12,26,9)', fields: ['histogram'] }] },
                { venue: 'BITFINEX', symbol: 'tETHF0:BTCF0', timeframes: ['1h'], indicators: [{ label: 'SWINGRSI(7)', fields: ['rsi'] }] },
            ],
        }
        const w = mountForm({ context: ctx })
        const indOpts = () => w.findAll('.ssf-cond')[0].findAll('select')[0].findAll('option').map((o) => o.text())
        expect(indOpts()).toContain('MACD(12,26,9)')
        expect(indOpts()).not.toContain('SWINGRSI(7)')
        await w.findAll('.ssf-grid2 input')[1].setValue('tETHF0:BTCF0')
        expect(indOpts()).toContain('SWINGRSI(7)')
        expect(indOpts()).not.toContain('MACD(12,26,9)')
    })

    test('field options follow the chosen indicator', async () => {
        const w = mountForm()
        const cond = w.findAll('.ssf-cond')[0]
        const selects = cond.findAll('select')
        await selects[0].setValue('CRUP')
        const fieldOpts = selects[1].findAll('option').map((o) => o.text())
        expect(fieldOpts).toContain('bull_confluence_timeframe_count')
        expect(fieldOpts).not.toContain('histogram')
    })

    test('emits a complete run payload for a valid single-condition search', async () => {
        const w = mountForm()
        await fillCondition(w, { indicator: 'MACD(12,26,9)', field: 'histogram', value: '0' })
        await w.find('.ssf-run').trigger('click')
        const runs = w.emitted('run')
        expect(runs).toHaveLength(1)
        expect(runs[0][0]).toEqual({
            venue: 'BITFINEX',
            symbol: 'tBTCUSD',
            timeframes: ['1h'],
            range: { type: 'latest', limit: 500 },
            conditionRows: [{ indicator: 'MACD(12,26,9)', field: 'histogram', op: 'gt', value: 0, bar_offset: 0 }],
            result_window: { before_bars: 200, after_bars: 600 },
            max_results: 100,
        })
    })

    test('supports multiple conditions (AND) via Add condition', async () => {
        const w = mountForm()
        await fillCondition(w, { indicator: 'MACD(12,26,9)', field: 'histogram', value: '0' })
        await w.find('.ssf-addcond').trigger('click')
        const rows = w.findAll('.ssf-cond')
        expect(rows).toHaveLength(2)
        const s = rows[1].findAll('select')
        await s[0].setValue('CRUP')
        await s[1].setValue('bull_confluence_timeframe_count')
        await s[2].setValue('gte')   // non-default operator captured
        await rows[1].find('input[step="any"]').setValue('1')
        await w.find('.ssf-run').trigger('click')
        const payload = w.emitted('run')[0][0]
        expect(payload.conditionRows).toHaveLength(2)
        expect(payload.conditionRows[1]).toEqual({ indicator: 'CRUP', field: 'bull_confluence_timeframe_count', op: 'gte', value: 1, bar_offset: 0 })
    })

    test('refuses to emit without a complete condition (shows an error)', async () => {
        const w = mountForm()
        await w.find('.ssf-run').trigger('click')
        expect(w.emitted('run')).toBeUndefined()
        expect(w.find('.ssf-error').exists()).toBe(true)
    })

    test('builds a start_end range from date inputs', async () => {
        const w = mountForm()
        await fillCondition(w, { indicator: 'MACD(12,26,9)', field: 'histogram', value: '0' })
        // switch to date-range mode
        const radios = w.findAll('input[type="radio"]')
        await radios[1].setValue()   // select 'start_end'
        const dates = w.findAll('input[type="datetime-local"]')
        await dates[0].setValue('2024-06-01T00:00')
        await dates[1].setValue('2024-06-10T00:00')
        await w.find('.ssf-run').trigger('click')
        const payload = w.emitted('run')[0][0]
        expect(payload.range.type).toBe('start_end')
        expect(payload.range.end_ms).toBeGreaterThan(payload.range.start_ms)
    })
})
