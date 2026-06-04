// @vitest-environment jsdom
import { test, expect, describe, beforeEach, afterEach } from 'vitest'
import TradingVue from '../../src/TradingVue.vue'
import DataCube from '../../src/helpers/datacube.js'
import {
  mount, installCanvasEnv, uninstallCanvasEnv, settle,
  totalDrawCalls, totalClearRects, contextCount,
} from './_component-harness.js'

function seedDc() {
  const T0 = 1_600_000_000_000
  const ohlcv = Array.from({ length: 60 }, (_, i) => {
    const t = T0 + i * 60000
    const p = 100 + Math.sin(i / 5) * 5
    return [t, p, p + 1, p - 1, p + 0.5, 100 + i]
  })
  return new DataCube({ ohlcv }, { scripts: false, validation: 'off' })
}

describe('TradingVue mounts and renders (component harness smoke)', () => {
  let wrapper
  beforeEach(() => installCanvasEnv())
  afterEach(() => { if (wrapper) wrapper.unmount(); uninstallCanvasEnv() })

  test('mounts without throwing and draws to canvas', async () => {
    wrapper = mount(TradingVue, {
      props: { data: seedDc(), width: 600, height: 400 },
      attachTo: document.body,
    })
    await settle()
    expect(wrapper.exists()).toBe(true)
    // It created at least one canvas and drew to it (render path fired).
    expect(contextCount()).toBeGreaterThan(0)
    expect(totalDrawCalls()).toBeGreaterThan(0)
    expect(totalClearRects()).toBeGreaterThan(0)
  })
})
