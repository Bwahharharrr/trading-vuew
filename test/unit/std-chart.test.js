// std/chart.js — onchart/offchart/onclose/signal/signalif/modify/settings,
// invoked directly on the source with a stubbed env + script-state singleton.
import { test, expect, describe, beforeEach, vi } from 'vitest'
import { mkStd } from './_std-direct.js'
import se from '../../src/helpers/script_state.js'

function chartCtx() {
  const std = mkStd()
  std.env.send_modify = vi.fn()
  std.env.src = { sett: {} }
  se.t = 5000
  se.tf = 1000
  se.shared = { event: 'update' }
  se.send = vi.fn()
  return std
}

describe('std/chart onchart / offchart', () => {
  let std
  beforeEach(() => { std = chartCtx() })

  test('onchart creates a synthetic overlay and appends [t, value]', () => {
    std.onchart(42, 'MyLine', {})
    const ov = std.env.onchart.MyLine
    expect(ov).toBeTruthy()
    expect(ov.type).toBe('Spline')         // default single-value type
    expect(ov.settings.$synth).toBe(true)
    expect(ov.data[ov.data.length - 1]).toEqual([5000, 42])
  })

  test('onchart with a multi-value array → Splines + spread row', () => {
    std.onchart([1, 2, 3], 'Band', { type: 'Channel' })
    const ov = std.env.onchart.Band
    expect(ov.type).toBe('Channel')
    expect(ov.data[ov.data.length - 1]).toEqual([5000, 1, 2, 3])
  })

  test('offchart creates an overlay in the offchart bucket', () => {
    std.offchart(7, 'Osc', {})
    expect(std.env.offchart.Osc.data[0]).toEqual([5000, 7])
  })

  test('a TS value is unwrapped and its offset shifts the timestamp', () => {
    const tsArr = Object.assign([9], { __id__: 't', __offset__: 2 })
    std.onchart(tsArr, 'Off', {})
    expect(std.env.onchart.Off.data[0]).toEqual([5000 + 2 * se.tf, 9])
  })
})

describe('std/chart onclose / signals / modify / settings', () => {
  let std
  beforeEach(() => { std = chartCtx() })

  test('onclose: true exactly when (t+tf) aligns to the queried timeframe', () => {
    std.env.shared.onclose = true
    se.t = 5000; se.tf = 1000 // t+tf = 6000
    expect(std.onclose(2000)).toBe(true)   // 6000 % 2000 === 0
    expect(std.onclose(4000)).toBe(false)  // 6000 % 4000 !== 0
    std.env.shared.onclose = false
    expect(std.onclose(1000)).toBe(false)  // gated off entirely
  })

  test('signal / signalif emit only during the update phase', () => {
    std.signal('buy', { qty: 1 })
    expect(se.send).toHaveBeenCalledWith('script-signal', { type: 'buy', data: { qty: 1 } })
    se.send.mockClear()
    std.signalif(false, 'sell')
    expect(se.send).not.toHaveBeenCalled()
    std.signalif(true, 'sell')
    expect(se.send).toHaveBeenCalled()
    // not during init/post phase
    se.send.mockClear()
    se.shared.event = 'init'
    std.signal('x')
    expect(se.send).not.toHaveBeenCalled()
  })

  test('modify sends an overlay patch; settings merges + notifies', () => {
    std.modify('ov-1', { color: '#fff' })
    expect(se.send).toHaveBeenCalledWith('modify-overlay', { uuid: 'ov-1', fields: { color: '#fff' } })
    std.settings({ lineWidth: 3 })
    expect(std.env.send_modify).toHaveBeenCalledWith({ settings: { lineWidth: 3 } })
    expect(std.env.src.sett.lineWidth).toBe(3)
  })
})
