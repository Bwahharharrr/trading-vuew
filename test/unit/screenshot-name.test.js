// screenshotName: fs-safe, date-stamped, includes the active gateway stream.
import { test, expect } from 'vitest'
import chartState from '../../src/mixins/app/chart-state.js'

const { screenshotName } = chartState.methods
const AT = new Date(2026, 5, 10, 14, 30, 5) // 2026-06-10 14:30:05 local

test('includes venue/symbol/timeframe when a stream is active', () => {
  const name = screenshotName.call(
    { corkyCurrent: { venue: 'BITFINEX', symbol: 'tBTCUSD', timeframe: '1m' } }, AT)
  expect(name).toBe('chart-BITFINEX-tBTCUSD-1m-2026-06-10_14-30-05.png')
})

test('falls back to chart-<timestamp> with no active stream', () => {
  const name = screenshotName.call({ corkyCurrent: null }, AT)
  expect(name).toBe('chart-2026-06-10_14-30-05.png')
})

test('sanitizes fs-hostile characters from symbol names', () => {
  const name = screenshotName.call(
    { corkyCurrent: { venue: 'X', symbol: 'tBTC/USD:perp', timeframe: '1D' } }, AT)
  expect(name).not.toMatch(/[/:]/)
  expect(name.endsWith('.png')).toBe(true)
})
