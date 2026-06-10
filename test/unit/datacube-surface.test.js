// helpers/datacube.js — the thin public DataCube methods that were uncovered:
// lock/unlock (delegate to the store) and show/hide/onrange.
import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest'
import DataCube from '../../src/helpers/datacube.js'

function mkDc() {
  return new DataCube({ ohlcv: [[0, 1, 1, 1, 1, 1]] }, { scripts: false, validation: 'off' })
}

describe('show / hide normalize the query and merge a display flag', () => {
  let dc
  beforeEach(() => { dc = mkDc(); dc.merge = vi.fn() })

  test('show("offchart") → offchart..settings display:true', () => {
    dc.show('offchart')
    expect(dc.merge).toHaveBeenCalledWith('offchart..settings', { display: true })
  })

  test('hide on a specific overlay query', () => {
    dc.hide('onchart.EMA0')
    expect(dc.merge).toHaveBeenCalledWith('onchart.EMA0.settings', { display: false })
  })

  test('"." root query collapses to an empty prefix', () => {
    dc.show('.')
    expect(dc.merge).toHaveBeenCalledWith('.settings', { display: true })
  })
})

describe('lock / unlock delegate to the chart-data store', () => {
  test('forward the query to cd.lock / cd.unlock', () => {
    const dc = mkDc()
    // dc.cd is a getter onto the chart-data store — spy on its methods.
    const lock = vi.spyOn(dc.cd, 'lock').mockReturnValue('L')
    const unlock = vi.spyOn(dc.cd, 'unlock').mockReturnValue('U')
    expect(dc.lock('onchart.x')).toBe('L')
    expect(lock).toHaveBeenCalledWith('onchart.x')
    expect(dc.unlock('onchart.x')).toBe('U')
    expect(unlock).toHaveBeenCalledWith('onchart.x')
  })
})

describe('onrange registers a data-loader on the next tick', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('stores the callback and wires the loader into the TV instance', () => {
    const dc = mkDc()
    dc.tv = { set_loader: vi.fn() }
    const cb = () => {}
    dc.onrange(cb)
    expect(dc.loader).toBe(cb)
    expect(dc.tv.set_loader).not.toHaveBeenCalled() // deferred
    vi.runAllTimers()
    expect(dc.tv.set_loader).toHaveBeenCalledWith(dc)
  })

  test('a null callback detaches the loader', () => {
    const dc = mkDc()
    dc.tv = { set_loader: vi.fn() }
    dc.onrange(null)
    vi.runAllTimers()
    expect(dc.tv.set_loader).toHaveBeenCalledWith(null)
  })
})
