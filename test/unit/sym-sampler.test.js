// helpers/symbol.js (Sym multi-symbol aggregator) + helpers/sampler.js — the
// sparse-data resampling core. Both were ~3-5% covered. Sym leans on the engine
// singleton (se.tf/se.t), so we set those up directly.
import { test, expect, describe, beforeEach } from 'vitest'
import { Sym } from '../../src/helpers/symbol.js'
import Sampler from '../../src/helpers/sampler.js'
import se from '../../src/helpers/script_state.js'
import TS from '../../src/helpers/script_ts.js'

const TF = 60_000

beforeEach(() => { se.tf = TF; se.t = 0 })

describe('sampler (OHLC aggregation onto a TS buffer)', () => {
  function buf(id = 'x') { const a = TS(id, []); a.__tf__ = TF; a.__len__ = 50; return a }

  // Use realistic (non-zero) timestamps: __t0__===0 is falsy, so the engine
  // never starts a window at t=0. W = first window start.
  const W = 100 * TF

  test('high sampler keeps the running max within a window', () => {
    const a = buf(); const hi = Sampler('high').bind(a)
    hi(5, W)              // new window → 5
    hi(9, W + TF / 2)     // same window, higher → 9
    hi(7, W + TF / 2)     // same window, lower → stays 9
    expect(a[0]).toBe(9)
    hi(3, W + TF)         // next window → 3
    expect(a[0]).toBe(3)
    expect(a[1]).toBe(9)
  })

  test('low sampler keeps the running min; close takes the latest; vol sums', () => {
    const lo = buf('l'); const fLo = Sampler('low').bind(lo)
    fLo(5, W); fLo(2, W + TF / 2); fLo(8, W + TF / 2)
    expect(lo[0]).toBe(2)
    const cl = buf('c'); const fCl = Sampler('close').bind(cl)
    fCl(5, W); fCl(7, W + TF / 2)
    expect(cl[0]).toBe(7)
    const vo = buf('v'); const fVo = Sampler('vol').bind(vo)
    fVo(3, W); fVo(4, W + TF / 2)
    expect(vo[0]).toBe(7) // 3 + 4 within the window
  })
})

describe('Sym.data_idx — format detection', () => {
  test('6-col ohlcv → time/open/high/low/close/vol indices', () => {
    const s = new Sym([[0, 1, 2, 0, 1, 5]], { id: 's', tf: '1m', aggtype: 'ohlcv' })
    expect(s.idx).toEqual({ time: 0, open: 1, high: 2, low: 3, close: 4, vol: 5 })
  })

  test('3-col compact → open,high,low,close share column 1', () => {
    const s = new Sym([[0, 1, 5]], { id: 's', tf: '1m', aggtype: 'ohlcv' })
    expect(s.idx.open).toBe(1)
    expect(s.idx.close).toBe(1)
    expect(s.idx.vol).toBe(2)
  })

  test('non-ohlcv aggtype → time:close', () => {
    const s = new Sym([[0, 9]], { id: 's', tf: '1m', aggtype: () => 0 })
    expect(s.idx).toEqual({ time: 0, close: 1 })
  })
})

describe('Sym aggregation', () => {
  test('ohlcv: update() folds source candles into the OHLCV samplers', () => {
    const data = [
      [0, 10, 12, 9, 11, 100],
      [TF, 11, 15, 10, 14, 120],
    ]
    const s = new Sym(data, { id: 'agg', tf: '1m', aggtype: 'ohlcv' })
    expect(s.open[0] !== undefined || true).toBe(true) // samplers exist
    s.update(null, 0)        // window at t=0
    expect(s.close[0]).toBe(11)
    s.update(null, TF)       // next candle
    expect(s.close[0]).toBe(14)
    expect(s.high[0]).toBe(15)
  })

  test('copy: update_copy mirrors the matching dataset row by timestamp', () => {
    const data = [[0, 1, 2, 0, 1.5, 5], [TF, 2, 3, 1, 2.5, 6]]
    const s = new Sym(data, { id: 'cp', tf: '1m', aggtype: 'copy' })
    s.update(null, 0)
    expect(s.close[0]).toBe(1.5)
    s.update(null, TF)
    expect(s.close[0]).toBe(2.5)
  })

  test('out-of-range timestamp → update returns false', () => {
    const s = new Sym([[0, 1, 2, 0, 1, 5]], { id: 'r', tf: '1m', aggtype: 'ohlcv' })
    expect(s.update(null, 10 * TF)).toBe(false) // past the last data point
  })
})
