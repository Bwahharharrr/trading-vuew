// backtest-overlays transforms — descriptor-driven series, trade markers, and
// price levels from a `backtest_report_overlays` event (shapes per the gateway
// examples). Decimals stay strings at the source; numbers only for plot data.
import { describe, it, expect } from 'vitest'
import {
  backtestSeriesOverlays, backtestTradeMarkers, backtestPriceLevels,
} from '../../src/helpers/feed/backtest-overlays.js'

const REPORT = {
  type: 'backtest_report_overlays', run_id: 'r1', venue: 'BITFINEX', trade_timeframe: '1h',
  trades: [
    { symbol: 'tBTCUSD', timestamp_ms: 3600000, side: 'Buy', quantity: '0.25', price: '40000', fee: '8' },
    { symbol: 'tBTCUSD', timestamp_ms: 7200000, side: 'Sell', quantity: '0.25', price: '41000', fee: '8' },
  ],
  price_levels: [
    { symbol: 'tBTCUSD', kind: 'stop_loss', side: 'Buy', price: '38000', quantity: '0.25', activated_at_ms: 3600000, cleared_at_ms: null, triggered_at_ms: null },
    { symbol: 'tBTCUSD', kind: 'take_profit', side: 'Buy', price: '42000', quantity: '0.25', activated_at_ms: 3600000, cleared_at_ms: null, triggered_at_ms: 7200000 },
  ],
  equity_curve: [
    { timestamp_ms: 0, equity: '10000', cash: '10000', position_quantity: '0', drawdown: '0', drawdown_pct: null },
    { timestamp_ms: 3600000, equity: '10125.50', cash: '0', position_quantity: '0.25', drawdown: '0', drawdown_pct: '0' },
    { timestamp_ms: 7200000, equity: '10250', cash: '10250', position_quantity: '0', drawdown: '5.5', drawdown_pct: '0.0005' },
  ],
  period_returns: [],
  series_descriptors: [
    { id: 'backtest_equity', display_name: 'Backtest Equity', kind: 'line', fields: ['equity'], target: { surface: 'pane', pane: 'Backtest' }, style: {}, visible_by_default: true },
    { id: 'backtest_drawdown', display_name: 'Backtest Drawdown', kind: 'histogram', fields: ['drawdown'], target: { surface: 'pane', pane: 'Backtest Drawdown' }, style: {}, visible_by_default: true },
    { id: 'backtest_cash', display_name: 'Backtest Cash', kind: 'line', fields: ['cash'], target: { surface: 'pane', pane: 'Backtest' }, style: {}, visible_by_default: false },
  ],
}

describe('backtestSeriesOverlays', () => {
  it('builds one descriptor-driven overlay per series, mapping kind→overlay type', () => {
    const ovs = backtestSeriesOverlays(REPORT)
    expect(ovs.map((o) => o.id)).toEqual(['backtest_equity', 'backtest_drawdown', 'backtest_cash'])
    expect(ovs[0].type).toBe('Spline')      // line → Spline
    expect(ovs[1].type).toBe('Histogram')   // histogram → Histogram
    expect(ovs[0].pane).toBe('Backtest')
    expect(ovs[1].pane).toBe('Backtest Drawdown')
    expect(ovs[2].visible).toBe(false)      // visible_by_default:false honored
  })

  it('plots the descriptor field from equity_curve as [ts, Number(value)]', () => {
    const [equity, drawdown] = backtestSeriesOverlays(REPORT)
    expect(equity.data).toEqual([[0, 10000], [3600000, 10125.5], [7200000, 10250]])
    expect(drawdown.data).toEqual([[0, 0], [3600000, 0], [7200000, 5.5]])
  })

  it('skips an unknown plot kind and a missing/null field point', () => {
    const r = {
      equity_curve: [{ timestamp_ms: 0, equity: '1' }, { timestamp_ms: 1, equity: null }, { timestamp_ms: 2, equity: '3' }],
      series_descriptors: [
        { id: 'x', display_name: 'X', kind: 'candle_color', fields: ['equity'], target: {} },   // unknown → skipped
        { id: 'eq', display_name: 'E', kind: 'line', fields: ['equity'], target: { pane: 'P' } },
      ],
    }
    const ovs = backtestSeriesOverlays(r)
    expect(ovs.map((o) => o.id)).toEqual(['eq'])             // candle_color dropped
    expect(ovs[0].data).toEqual([[0, 1], [2, 3]])            // null point skipped
  })

  it('is empty-safe', () => {
    expect(backtestSeriesOverlays(null)).toEqual([])
    expect(backtestSeriesOverlays({})).toEqual([])
  })
})

describe('backtestTradeMarkers', () => {
  it('maps trades to [ts, buy?1:0, price, label]', () => {
    expect(backtestTradeMarkers(REPORT.trades)).toEqual([
      [3600000, 1, 40000, 'Buy 0.25'],
      [7200000, 0, 41000, 'Sell 0.25'],
    ])
  })
  it('drops trades with a non-finite price; empty-safe', () => {
    expect(backtestTradeMarkers([{ timestamp_ms: 1, side: 'Buy', price: 'x' }])).toEqual([])
    expect(backtestTradeMarkers(null)).toEqual([])
  })
})

describe('backtestPriceLevels', () => {
  it('maps levels to lifecycle segments (from/to, triggered)', () => {
    const lv = backtestPriceLevels(REPORT.price_levels)
    expect(lv[0]).toMatchObject({ price: 38000, priceRaw: '38000', kind: 'stop_loss', from: 3600000, to: null, triggered: false })
    expect(lv[1]).toMatchObject({ price: 42000, kind: 'take_profit', from: 3600000, to: 7200000, triggered: true })
  })
  it('drops non-finite prices; empty-safe', () => {
    expect(backtestPriceLevels([{ price: 'nope' }])).toEqual([])
    expect(backtestPriceLevels(undefined)).toEqual([])
  })
})
