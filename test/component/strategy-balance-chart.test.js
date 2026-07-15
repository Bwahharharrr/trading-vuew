// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import StrategyBalanceChart from '../../src/components/feed/StrategyBalanceChart.vue'

const history = {
  starting_balance: '1000',
  points: [
    { timestamp_ms: 1000, booked_balance: '1000', unrealized_pnl: '0', equity: '1000', mark_status: 'complete' },
    { timestamp_ms: 2000, booked_balance: '1010', unrealized_pnl: '5', equity: '1015', mark_status: 'complete' },
    { timestamp_ms: 3000, booked_balance: '990', mark_status: 'partial' },
  ],
}

describe('StrategyBalanceChart', () => {
  test('renders white/red booked segments, dotted marked equity, baseline and partial-mark disclosure', () => {
    const wrapper = mount(StrategyBalanceChart, { props: {
      history, strategyName: 'EMA Regime Breakout V8', timeframe: '1h', width: 900, height: 500,
    } })
    expect(wrapper.find('.sbc-booked.tone-profit').exists()).toBe(true)
    expect(wrapper.find('.sbc-booked.tone-loss').exists()).toBe(true)
    expect(wrapper.find('.sbc-equity').exists()).toBe(true)
    expect(wrapper.find('.sbc-baseline').exists()).toBe(true)
    expect(wrapper.find('.sbc-legend').text()).toContain('Marked equity (includes unbanked P&L)')
    expect(wrapper.find('.sbc-partial').text()).toContain('1 partial marks omitted')
  })

  test('keeps the previous history visible beneath a loading state and surfaces errors', async () => {
    const wrapper = mount(StrategyBalanceChart, { props: {
      history, loading: true, strategyName: 'EMA V8', timeframe: '4h', width: 900, height: 500,
    } })
    expect(wrapper.find('.sbc-svg').exists()).toBe(true)
    expect(wrapper.find('.sbc-loading').text()).toContain('4h')
    await wrapper.setProps({ loading: false, error: 'history unavailable' })
    expect(wrapper.find('.sbc-error').text()).toContain('history unavailable')
  })
})
