// @vitest-environment jsdom
//
// MetricFilterBar — compact numeric column-filter builder shared by the backtest
// RUNS list and the universe CANDIDATES table. The component is presentational:
// the PARENT owns the `filters` array (so they persist in App-level state across
// tabs/views); the bar only emits the FULL new array on add/remove.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricFilterBar from '../../src/components/feed/MetricFilterBar.vue'
import { FILTER_OPS } from '../../src/helpers/metric-filter.js'

const columns = [
  { key: 'total_net_profit', label: 'Net P/L' },
  { key: 'score_v2', label: 'Score v2' },
]

function mountBar(props = {}) {
  return mount(MetricFilterBar, { props: { columns, filters: [], ...props } })
}

describe('MetricFilterBar', () => {
  test('renders the column options + the FILTER_OPS operator options', () => {
    const w = mountBar()
    const selects = w.findAll('select')
    const colOpts = selects[0].findAll('option').map((o) => o.text())
    expect(colOpts).toContain('Net P/L')
    expect(colOpts).toContain('Score v2')
    const opOpts = selects[1].findAll('option').map((o) => o.text())
    expect(opOpts).toEqual(FILTER_OPS)
  })

  test('+ Add is disabled until a column AND a finite value are chosen', async () => {
    const w = mountBar()
    const addBtn = w.find('.mfb-add')
    // No column, no value → disabled.
    expect(addBtn.attributes('disabled')).toBeDefined()
    // Column chosen but value still empty → disabled.
    await w.findAll('select')[0].setValue('total_net_profit')
    expect(addBtn.attributes('disabled')).toBeDefined()
    // Column + finite value → enabled.
    await w.find('input[type=number]').setValue('1000')
    expect(addBtn.attributes('disabled')).toBeUndefined()
  })

  test('Add emits update:filters with [...filters, newFilter] (label/op/value)', async () => {
    const w = mountBar({ filters: [{ key: 'score_v2', label: 'Score v2', op: '>', value: 0.5 }] })
    await w.findAll('select')[0].setValue('total_net_profit')
    await w.findAll('select')[1].setValue('>=')
    await w.find('input[type=number]').setValue('1000')
    await w.find('.mfb-add').trigger('click')
    const arr = w.emitted('update:filters').pop()[0]
    // Pre-existing filter preserved, new one appended with the picked column's label.
    expect(arr).toHaveLength(2)
    expect(arr[0]).toEqual({ key: 'score_v2', label: 'Score v2', op: '>', value: 0.5 })
    expect(arr[1]).toEqual({ key: 'total_net_profit', label: 'Net P/L', op: '>=', value: 1000 })
  })

  test('a chip renders "<label> <op> <value>" and its × emits the array minus that index', async () => {
    const filters = [
      { key: 'total_net_profit', label: 'Net P/L', op: '>', value: 1000 },
      { key: 'score_v2', label: 'Score v2', op: '>=', value: 0.5 },
    ]
    const w = mountBar({ filters })
    const chips = w.findAll('.mfb-chip')
    expect(chips).toHaveLength(2)
    expect(chips[0].text().replace(/\s+/g, ' ').trim()).toContain('Net P/L > 1000')
    // Remove the FIRST chip → array without index 0 (just the score_v2 filter).
    await chips[0].find('.mfb-chip-x').trigger('click')
    const arr = w.emitted('update:filters').pop()[0]
    expect(arr).toEqual([{ key: 'score_v2', label: 'Score v2', op: '>=', value: 0.5 }])
  })

  test('no chips render when there are no active filters', () => {
    const w = mountBar()
    expect(w.findAll('.mfb-chip')).toHaveLength(0)
  })
})
