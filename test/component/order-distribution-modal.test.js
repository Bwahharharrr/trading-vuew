// @vitest-environment jsdom
// Pins the OrderDistributionModal: field capture (float size / int qty), side +
// distribution toggles, the @confirm payload, and @close paths.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../../src/components/OrderDistributionModal.vue'

const geometry = { high: 200, low: 100, tStart: 1_000_000, tEnd: 2_000_000 }

function mountModal() {
  return mount(Modal, { props: { geometry }, attachTo: document.body })
}

describe('OrderDistributionModal', () => {
  test('confirm emits the captured config (float size, int qty, dist, side)', async () => {
    const w = mountModal()
    await w.find('input[type="number"][step="any"]').setValue('12.5')
    await w.find('input[type="number"][step="1"]').setValue('7')
    // pick desc distribution + sell side
    const distBtns = w.findAll('.type-btn')
    await distBtns[1].trigger('click') // High→Low (desc)
    await w.find('.side-btn.sell').trigger('click')
    await w.find('.btn-confirm').trigger('click')

    const ev = w.emitted('confirm')
    expect(ev).toBeTruthy()
    expect(ev[0][0]).toEqual({ orderSize: 12.5, orderQty: 7, distribution: 'desc', side: 'sell' })
    w.unmount()
  })

  test('distribution + side toggles set .active', async () => {
    const w = mountModal()
    const distBtns = w.findAll('.type-btn')
    await distBtns[2].trigger('click') // asc
    expect(distBtns[2].classes()).toContain('active')
    expect(distBtns[0].classes()).not.toContain('active')
    await w.find('.side-btn.sell').trigger('click')
    expect(w.find('.side-btn.sell').classes()).toContain('active')
    w.unmount()
  })

  test('Confirm disabled for invalid qty/size; no emit', async () => {
    const w = mountModal()
    await w.find('input[type="number"][step="1"]').setValue('0') // qty < 1
    expect(w.find('.btn-confirm').attributes('disabled')).toBeDefined()
    await w.find('.btn-confirm').trigger('click')
    expect(w.emitted('confirm')).toBeFalsy()
    w.unmount()
  })

  test('Cancel and backdrop click emit close', async () => {
    const w = mountModal()
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
    await w.find('.order-modal-overlay').trigger('click') // @click.self backdrop
    expect(w.emitted('close').length).toBeGreaterThanOrEqual(2)
    w.unmount()
  })

  test('shows the range context from geometry', () => {
    const w = mountModal()
    expect(w.find('.range-context').text()).toContain('100')
    expect(w.find('.range-context').text()).toContain('200')
    w.unmount()
  })
})
