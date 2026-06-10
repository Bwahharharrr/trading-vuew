// @vitest-environment jsdom
// IndicatorSettings.vue — the type/colour settings modal (34% covered): type
// selection, settings assembly for line vs bar vs volume, apply/close emits.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import IndicatorSettings from '../../src/components/IndicatorSettings.vue'

function mountIS(props = {}) {
  return mount(IndicatorSettings, {
    props: Object.assign({
      indicatorName: 'RSI', currentType: 'Spline',
      currentSettings: { color: '#abc', lineWidth: 2 },
      indicatorIndex: 0, gridId: 1,
    }, props),
    attachTo: document.body,
  })
}

describe('IndicatorSettings', () => {
  test('selecting a type emits apply with line settings for Spline', async () => {
    const w = mountIS()
    w.vm.selectType('Spline')
    const ev = w.emitted('apply')
    expect(ev).toBeTruthy()
    const p = ev[ev.length - 1][0]
    expect(p.newType).toBe('Spline')
    expect(p.indicatorIndex).toBe(0)
    expect(p.gridId).toBe(1)
    expect(p.newSettings).toHaveProperty('color')
    expect(p.newSettings).toHaveProperty('lineWidth')
    w.unmount()
  })

  test('a bar type emits colorUp/colorDown (not a line color)', () => {
    const w = mountIS({ currentType: 'Histogram', currentSettings: { colorUp: '#0f0', colorDown: '#f00' } })
    w.vm.selectType('Histogram')
    const p = w.emitted('apply').pop()[0]
    expect(p.newSettings).toHaveProperty('colorUp')
    expect(p.newSettings).toHaveProperty('colorDown')
    expect(p.newSettings.color).toBeUndefined()
    w.unmount()
  })

  test('Volume keeps newType Volume and drives the look via style + colorVol*', () => {
    const w = mountIS({ indicatorName: 'Volume', currentType: 'Volume', indicatorIndex: -1 })
    expect(w.vm.isVolume).toBe(true)
    expect(w.vm.isAttachedVolume).toBe(true)
    w.vm.selectType('Histogram')
    const p = w.emitted('apply').pop()[0]
    expect(p.newType).toBe('Volume')         // type stays Volume
    expect(p.newSettings.style).toBe('Histogram')
    expect(p.newSettings).toHaveProperty('colorVolUp')
    w.unmount()
  })

  test('updateColors re-emits; close emits close', () => {
    const w = mountIS()
    w.vm.updateColors()
    expect(w.emitted('apply')).toBeTruthy()
    w.vm.close()
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })
})
