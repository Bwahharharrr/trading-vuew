// App.chartEmpty — drives the "select a source" empty-state placeholder (and the
// hiding of the empty grid / axes / Volume legend). True until the active chart
// actually has candles; must react to an IN-PLACE data load via the store revision
// signal (ohlcv rows are markRaw'd, so a bare length change wouldn't recompute).
import { describe, it, expect, vi } from 'vitest'
import App from '../../src/App.vue'

const chartEmpty = App.computed.chartEmpty
const call = (chart) => chartEmpty.call({ chart })

describe('App.chartEmpty', () => {
  it('is EMPTY (true) when there is no chart / no data / no candles', () => {
    expect(call(null)).toBe(true)
    expect(call({})).toBe(true)
    expect(call({ data: {} })).toBe(true)
    expect(call({ data: { chart: {} } })).toBe(true)
    expect(call({ data: { chart: { data: [] } } })).toBe(true)
  })

  it('is NOT empty (false) once the chart has candles', () => {
    expect(call({ data: { chart: { data: [[1, 100, 101, 99, 100.5, 5]] } } })).toBe(false)
  })

  it('reads the store revision so an in-place data load recomputes (reactive dependency)', () => {
    const revision = vi.fn(() => 0)
    call({ data: { chart: { data: [] }, $cd: { revision } } })
    expect(revision).toHaveBeenCalled()
  })

  it('still works when the $cd back-ref is absent (graceful fallback)', () => {
    expect(call({ data: { chart: { data: [] } } })).toBe(true)
    expect(call({ data: { chart: { data: [[1, 2, 3, 4, 5, 6]] } } })).toBe(false)
  })
})
