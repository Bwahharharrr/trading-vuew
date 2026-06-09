// @vitest-environment jsdom
// Pins the OrderTypeModal (first popup): Scaled selects, Distribution is a
// placeholder no-op, Cancel/backdrop close.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../../src/components/OrderTypeModal.vue'

describe('OrderTypeModal', () => {
  test('Scaled emits select("scaled")', async () => {
    const w = mount(Modal, { attachTo: document.body })
    await w.findAll('.type-btn')[0].trigger('click')
    expect(w.emitted('select')[0]).toEqual(['scaled'])
    w.unmount()
  })

  test('Distribution is a placeholder no-op (no select)', async () => {
    const w = mount(Modal, { attachTo: document.body })
    await w.findAll('.type-btn')[1].trigger('click')
    expect(w.emitted('select')).toBeFalsy()
    w.unmount()
  })

  test('Cancel and backdrop emit close', async () => {
    const w = mount(Modal, { attachTo: document.body })
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
    await w.find('.order-modal-overlay').trigger('click')
    expect(w.emitted('close').length).toBeGreaterThanOrEqual(2)
    w.unmount()
  })
})
