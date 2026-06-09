// candleColorOf numeric thresholds + style-driven config (neutral dead-band).
import { test, expect, describe } from 'vitest'
import { candleColorOf, candleColorOpts } from '../../src/helpers/feed/indicator-catalog.js'

const BULL = '#23a776', BEAR = '#e54150', NEUTRAL = '#7f8694'

describe('candleColorOf', () => {
  test('strings: hex pass-through, enum lookup, unknown → null', () => {
    expect(candleColorOf('#abcdef')).toBe('#abcdef')
    expect(candleColorOf('#0a0')).toBe('#0a0')
    expect(candleColorOf('bull')).toBe(BULL)
    expect(candleColorOf('BEAR')).toBe(BEAR)
    expect(candleColorOf('weird')).toBeNull()
    expect(candleColorOf(null)).toBeNull()
    expect(candleColorOf('')).toBeNull()
  })

  test('numeric default: >0 green, <0 red, =0 neutral', () => {
    expect(candleColorOf(2)).toBe(BULL)
    expect(candleColorOf('3.5')).toBe(BULL)
    expect(candleColorOf(-0.01)).toBe(BEAR)
    expect(candleColorOf(0)).toBe(NEUTRAL)   // exactly zero is neutral now
  })

  test('symmetric neutral band via style', () => {
    const o = candleColorOpts({ neutral_band: '0.5' })
    expect(candleColorOf(0.3, o)).toBe(NEUTRAL)  // within band
    expect(candleColorOf(-0.4, o)).toBe(NEUTRAL)
    expect(candleColorOf(0.6, o)).toBe(BULL)
    expect(candleColorOf(-0.6, o)).toBe(BEAR)
  })

  test('explicit thresholds + custom colours via style', () => {
    const o = candleColorOpts({
      bull_above: '2', bear_below: '-1',
      color_up: '#0f0', color_down: '#f00', neutral_color: '#888'
    })
    expect(candleColorOf(3, o)).toBe('#0f0')
    expect(candleColorOf(2, o)).toBe('#888')   // not strictly above 2 → neutral
    expect(candleColorOf(1, o)).toBe('#888')   // between -1 and 2 → neutral
    expect(candleColorOf(-1, o)).toBe('#888')  // not strictly below -1 → neutral
    expect(candleColorOf(-2, o)).toBe('#f00')
  })

  test('candleColorOpts ignores absent keys (empty opts → defaults)', () => {
    expect(candleColorOpts(undefined)).toEqual({})
    expect(candleColorOpts({ unrelated: 'x' })).toEqual({})
    expect(candleColorOf(1, candleColorOpts({}))).toBe(BULL)
  })
})
