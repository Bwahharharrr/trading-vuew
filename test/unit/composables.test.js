// @vitest-environment jsdom
// Composables (previously 0% / 53% covered): useChartActions,
// useIndicatorVisibility, and the tested-but-thin useChart bounds.
import { test, expect, describe, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useChartActions } from '../../src/composables/useChartActions.js'
import { useIndicatorVisibility } from '../../src/composables/useIndicatorVisibility.js'

describe('useChartActions', () => {
  test('resetAndSave saves immediately and resets on nextTick', async () => {
    const tv = ref({ resetChart: vi.fn() })
    const save = vi.fn()
    const a = useChartActions(tv, save)
    a.resetAndSave(true)
    expect(save).toHaveBeenCalled()          // save is synchronous
    expect(tv.value.resetChart).not.toHaveBeenCalled()
    await nextTick()
    expect(tv.value.resetChart).toHaveBeenCalledWith(true)
  })

  test('survives a missing tradingVue ref and a missing save fn', async () => {
    const tv = ref(null)
    const a = useChartActions(tv, null)
    expect(() => a.resetAndSave()).not.toThrow()
    expect(() => a.reset()).not.toThrow()
    await nextTick()
    expect(a.getInstance()).toBeNull()
    tv.value = { resetChart: vi.fn() }
    expect(a.getInstance()).toBe(tv.value)
  })
})

describe('useIndicatorVisibility', () => {
  test('default-visible; toggle flips and notifies with the persistence flag', () => {
    const events = []
    const v = useIndicatorVisibility((name, visible, persistent) =>
      events.push([name, visible, persistent]))
    expect(v.isVisible('RSI')).toBe(true) // unknown → visible by default
    v.toggle('RSI')
    expect(v.isVisible('RSI')).toBe(false)
    v.toggle('SCMR', true) // persistent bucket is independent
    expect(v.isVisible('SCMR', true)).toBe(false)
    expect(v.isVisible('SCMR', false)).toBe(true)
    expect(events).toEqual([['RSI', false, false], ['SCMR', false, true]])
  })

  test('toggle round-trips back to visible', () => {
    const v = useIndicatorVisibility()
    v.toggle('X')
    v.toggle('X')
    expect(v.isVisible('X')).toBe(true)
  })
})
