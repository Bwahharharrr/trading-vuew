// @vitest-environment jsdom
//
// ColumnFilterButton — the per-column "[+]" that lives beside a sortable heading
// and opens a one-column numeric-threshold filter. The PARENT owns the filter
// set; this emits `apply` ({key,label,op,value}) / `clear` (key) for its column
// only. When a filter is active the trigger shows the condition (e.g. ">1000").
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import ColumnFilterButton from '../../src/components/feed/ColumnFilterButton.vue'
import { FILTER_OPS } from '../../src/helpers/metric-filter.js'

const column = { key: 'total_net_profit', label: 'Net P/L' }

function mountBtn(props = {}) {
  return mount(ColumnFilterButton, { props: { column, filter: null, ...props }, attachTo: document.body })
}

describe('ColumnFilterButton', () => {
  test('inactive trigger shows "+" and no popover until clicked', async () => {
    const w = mountBtn()
    expect(w.find('.cfb-btn').text()).toBe('+')
    expect(w.find('.cfb-btn').classes()).not.toContain('active')
    expect(w.find('.cfb-pop').exists()).toBe(false)
    await w.find('.cfb-btn').trigger('click')
    expect(w.find('.cfb-pop').exists()).toBe(true)
    // Operator <select> offers exactly the FILTER_OPS.
    const ops = w.find('.cfb-op').findAll('option').map((o) => o.text())
    expect(ops).toEqual(FILTER_OPS)
  })

  test('active trigger shows the condition (op + value) and is styled active', () => {
    const w = mountBtn({ filter: { key: 'total_net_profit', label: 'Net P/L', op: '>', value: 1000 } })
    const btn = w.find('.cfb-btn')
    expect(btn.classes()).toContain('active')
    // Thousands collapse to a separated integer in the compact chip.
    expect(btn.text().replace(/\s+/g, '')).toBe('>1,000')
  })

  test('Apply is disabled until a finite value is entered, then emits apply for THIS column', async () => {
    const w = mountBtn()
    await w.find('.cfb-btn').trigger('click')
    expect(w.find('.cfb-apply').attributes('disabled')).toBeDefined()
    await w.find('.cfb-op').setValue('>=')
    await w.find('.cfb-val').setValue('1500')
    expect(w.find('.cfb-apply').attributes('disabled')).toBeUndefined()
    await w.find('.cfb-apply').trigger('click')
    expect(w.emitted('apply')[0][0]).toEqual({ key: 'total_net_profit', label: 'Net P/L', op: '>=', value: 1500 })
    // Popover closes after applying.
    expect(w.find('.cfb-pop').exists()).toBe(false)
  })

  test('opening on an active filter pre-fills op + value (edit, not re-add)', async () => {
    const w = mountBtn({ filter: { key: 'total_net_profit', label: 'Net P/L', op: '<', value: 250 } })
    await w.find('.cfb-btn').trigger('click')
    expect(w.find('.cfb-op').element.value).toBe('<')
    expect(w.find('.cfb-val').element.value).toBe('250')
  })

  test('Remove (only shown when a filter is active) emits clear with the column key', async () => {
    const w = mountBtn({ filter: { key: 'total_net_profit', label: 'Net P/L', op: '>', value: 1000 } })
    await w.find('.cfb-btn').trigger('click')
    await w.find('.cfb-remove').trigger('click')
    expect(w.emitted('clear')[0][0]).toBe('total_net_profit')
  })

  test('Enter in the value box applies; a non-finite value does not', async () => {
    const w = mountBtn()
    await w.find('.cfb-btn').trigger('click')
    // Empty → Enter is a no-op.
    await w.find('.cfb-val').trigger('keydown.enter')
    expect(w.emitted('apply')).toBeUndefined()
    await w.find('.cfb-val').setValue('42')
    await w.find('.cfb-val').trigger('keydown.enter')
    expect(w.emitted('apply')[0][0]).toEqual({ key: 'total_net_profit', label: 'Net P/L', op: '>', value: 42 })
  })

  test('a click outside the component dismisses the popover', async () => {
    const w = mountBtn()
    await w.find('.cfb-btn').trigger('click')
    expect(w.find('.cfb-pop').exists()).toBe(true)
    // Capture-phase document mousedown outside $el → close.
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(w.find('.cfb-pop').exists()).toBe(false)
    w.unmount()
  })
})
