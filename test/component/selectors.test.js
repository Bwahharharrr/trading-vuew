// @vitest-environment jsdom
// Small selector SFCs (FileSelector / CandleColorSelector / TFSelector) — 0%
// covered. Mount each and exercise its change/click → emit path.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import FileSelector from '../../src/FileSelector.vue'
import CandleColorSelector from '../../src/CandleColorSelector.vue'
import TFSelector from '../../src/TFSelector.vue'

describe('FileSelector', () => {
  test('renders the files and emits file-selected on change', async () => {
    const w = mount(FileSelector, { props: { files: ['data_a.json', 'data_b.json'], currentFile: 'data_a.json' } })
    expect(w.findAll('option').length).toBe(2)
    w.vm.selectedFile = 'data_b.json'
    w.vm.onFileChange()
    expect(w.emitted('file-selected').pop()).toEqual(['data_b.json'])
  })
})

describe('CandleColorSelector', () => {
  test('emits coloring-selected on change', () => {
    const w = mount(CandleColorSelector, { props: { coloringOptions: [{ title: 'SCMR' }], currentColoring: '' } })
    w.vm.selectedColoring = 'SCMR'
    w.vm.onColoringChange()
    expect(w.emitted('coloring-selected').pop()).toEqual(['SCMR'])
  })
})

describe('TFSelector', () => {
  test('lists timeframes, emits selected on mount and on click', async () => {
    const charts = { '1m': {}, '15m': {}, '1h': {} }
    const w = mount(TFSelector, { props: { charts, rightOffset: 0 }, attachTo: document.body })
    // mounted emits the default selection
    expect(w.emitted('selected')).toBeTruthy()
    expect(w.vm.timeframes).toEqual(['1m', '15m', '1h'])
    w.vm.on_click('15m', 1)
    const ev = w.emitted('selected').pop()[0]
    expect(ev).toEqual({ name: '15m', i: 1 })
    w.unmount()
  })
})
