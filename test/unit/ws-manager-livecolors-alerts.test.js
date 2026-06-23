// @vitest-environment jsdom
//
// App ws-manager (file-feed live WebSocket): the live-recolor + alert/zones
// rendering paths that the existing ws-manager.test.js does NOT cover —
//   • _wsApplyLiveColors: index-aligned recolor of chartData[liveDataStartIdx+i]
//   • _wsHandleAlert: zones→onchart Zones overlay (only on an alerts file),
//     the TV→settings column swap, append vs create, MAX_LIVE cap
//   • candle_alert_color: index-aligned alert-color accumulator + DataCube recolor
//   • the displayedView / currentDataFile watchers
//
// App methods are unit-tested by binding wsManager.methods to a fake `this`
// (same pattern as test/component/position-plot-select.test.js). A lightweight
// fake `chart` stands in for the DataCube — these paths only touch
// chart.data.chart.data, chart.data.onchart, chart.add(), chart.touchData().
import { test, expect, describe, beforeEach, vi } from 'vitest'
import wsManager from '../../src/mixins/app/ws-manager.js'

const M = wsManager.methods
const W = wsManager.watch

// A minimal stand-in for the DataCube surface these methods touch.
function makeFakeChart(rows = []) {
  return {
    touchData: vi.fn(),
    data: {
      onchart: [],
      offchart: [],
      chart: { data: rows },
    },
    // mirrors DataCube.add: push the overlay onto the named section
    add(section, ov) { this.data[section].push(ov); return ov },
  }
}

// Identity tuple shared by the fake meta + every test message.
const META = { exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m' }
function msg(extra) {
  return Object.assign({ exchange: 'bitfinex', ticker: 'tBTCUSD', tf: '1m' }, extra)
}

function mkCtx(over = {}) {
  const ctx = Object.assign(
    {},
    wsManager.data(),
    {
      chart: makeFakeChart(),
      originalChartData: [],
      currentDataFile: 'data_bitfinex_tBTCUSD_1m.json', // classifies as 'scmr'
      currentFileMeta: { ...META },
      displayedView: '',
      $refs: {},
      $nextTick: (fn) => { if (fn) fn() },
    },
    over,
  )
  Object.assign(ctx, M)
  return ctx
}

// SCMR (non-alert) file vs alerts file selectors.
const SCMR_FILE = 'data_bitfinex_tBTCUSD_1m.json'
const ALERT_FILE = 'data_alerts_bitfinex_tBTCUSD_1m.json'

describe('_wsApplyLiveColors — index-aligned recolor', () => {
  test('no-op when liveDataStartIdx < 0 (touchData not called)', () => {
    const ctx = mkCtx({
      chart: makeFakeChart([[1000, 1, 2, 0, 1, 5]]),
      liveDataStartIdx: -1,
      liveScmrColors: ['#a'],
    })
    ctx._wsApplyLiveColors()
    expect(ctx.chart.touchData).not.toHaveBeenCalled()
    expect(ctx.chart.data.chart.data[0][6]).toBeUndefined()
  })

  test('no-op when chart is null', () => {
    const ctx = mkCtx({ chart: null, liveDataStartIdx: 0, liveScmrColors: ['#a'] })
    expect(() => ctx._wsApplyLiveColors()).not.toThrow()
    // nothing to assert beyond "did not throw / no chart to touch"
  })

  test('writes scmr colors into chartData[N] / chartData[N+1], pads short rows to len 9, touches once; OOB indices skipped', () => {
    // 3 rows: N=1 → rows[1], rows[2] colored; a 3rd color would map to rows[3] (OOB → skipped)
    const rows = [
      [1000, 1, 2, 0, 1, 5],          // idx 0 (before live region)
      [2000, 1, 2, 0, 1, 5],          // idx 1 → '#a'
      [3000, 1, 2, 0, 1, 5],          // idx 2 → '#b'
    ]
    const ctx = mkCtx({
      chart: makeFakeChart(rows),
      currentDataFile: SCMR_FILE,
      liveDataStartIdx: 1,
      liveScmrColors: ['#a', '#b', '#c'], // '#c' → idx 3, out of bounds → skipped silently
    })
    ctx._wsApplyLiveColors()

    expect(ctx.chart.data.chart.data[1].length).toBe(9)   // padded
    expect(ctx.chart.data.chart.data[1][6]).toBe('#a')
    expect(ctx.chart.data.chart.data[2].length).toBe(9)
    expect(ctx.chart.data.chart.data[2][6]).toBe('#b')
    expect(ctx.chart.data.chart.data[0][6]).toBeUndefined() // untouched (before live)
    expect(ctx.chart.data.chart.data.length).toBe(3)        // no OOB row created
    expect(ctx.chart.touchData).toHaveBeenCalledTimes(1)
  })

  test('on an alerts file uses liveAlertColors (not liveScmrColors)', () => {
    const rows = [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 5]]
    const ctx = mkCtx({
      chart: makeFakeChart(rows),
      currentDataFile: ALERT_FILE,
      liveDataStartIdx: 0,
      liveScmrColors: ['#scmr0', '#scmr1'],
      liveAlertColors: ['#alert0', '#alert1'],
    })
    ctx._wsApplyLiveColors()
    expect(ctx.chart.data.chart.data[0][6]).toBe('#alert0')
    expect(ctx.chart.data.chart.data[1][6]).toBe('#alert1')
  })
})

describe('watchers — reset + reschedule', () => {
  test('currentDataFile watcher resets liveDataStartIdx and clears accumulators', () => {
    const ctx = mkCtx({
      liveDataStartIdx: 7,
      liveScmrColors: ['#a'],
      liveAlertColors: ['#b'],
      liveZones: [[1, 2, 3, 4, '#c']],
      liveAlerts: [{ x: 1 }],
    })
    W.currentDataFile.call(ctx)
    expect(ctx.liveDataStartIdx).toBe(-1)
    expect(ctx.liveScmrColors).toEqual([])
    expect(ctx.liveAlertColors).toEqual([])
    expect(ctx.liveZones).toEqual([])
    expect(ctx.liveAlerts).toEqual([])
  })

  test('displayedView watcher schedules _wsApplyLiveColors via $nextTick', () => {
    const ctx = mkCtx()
    ctx._wsApplyLiveColors = vi.fn()
    const nextTick = vi.fn((fn) => fn && fn())
    ctx.$nextTick = nextTick
    W.displayedView.call(ctx)
    expect(nextTick).toHaveBeenCalledTimes(1)
    expect(ctx._wsApplyLiveColors).toHaveBeenCalledTimes(1)
  })
})

describe('_wsHandleAlert — zones accumulation vs Zones overlay (SCMR bleed guard)', () => {
  test('NON-alert file: zones accumulate into liveZones but NO Zones overlay is added', () => {
    const ctx = mkCtx({ currentDataFile: SCMR_FILE })
    const zones = [[1000, 1, 2, 2000, '#f00']]
    ctx._wsHandleAlert(msg({ alert: { timestamp: 1000 }, zones }))
    expect(ctx.liveZones).toEqual(zones)                 // accumulated
    expect(ctx.liveAlerts).toEqual([{ timestamp: 1000 }])
    expect(ctx.chart.data.onchart.find(o => o.type === 'Zones')).toBeUndefined() // NO overlay
    expect(ctx.chart.touchData).not.toHaveBeenCalled()
  })

  test('alerts file, no existing overlay: creates a Zones overlay with TV→settings column swap (y2/x2 swapped)', () => {
    const ctx = mkCtx({ currentDataFile: ALERT_FILE })
    // TV data format: [x1, y1, y2, x2, color]
    const zones = [[1000, 10, 20, 2000, '#0f0']]
    ctx._wsHandleAlert(msg({ alert: { timestamp: 1000 }, zones }))

    const ov = ctx.chart.data.onchart.find(o => o.type === 'Zones')
    expect(ov).toBeTruthy()
    expect(ov.name).toBe('Zones')
    expect(ov.data).toEqual(zones)                       // data keeps TV format
    // settings.zones converts [x1,y1,y2,x2,color] → [x1,y1,x2,y2,color]
    // i.e. columns 2 and 3 swap: original [1000,10,20,2000,'#0f0'] → [1000,10,2000,20,'#0f0']
    expect(ov.settings.zones).toEqual([[1000, 10, 2000, 20, '#0f0']])
    // explicit column-swap assertions
    expect(ov.settings.zones[0][2]).toBe(zones[0][3])    // settings x2 === data x2 (col 3)
    expect(ov.settings.zones[0][3]).toBe(zones[0][2])    // settings y2 === data y2 (col 2)
    expect(ctx.chart.touchData).toHaveBeenCalled()
  })

  test('alerts file, existing overlay: appends to data AND settings.zones; touches data', () => {
    const ctx = mkCtx({ currentDataFile: ALERT_FILE })
    // seed an existing Zones overlay
    const existing = {
      name: 'Zones', type: 'Zones',
      data: [[500, 1, 2, 600, '#aaa']],
      settings: { zones: [[500, 1, 600, 2, '#aaa']] },
    }
    ctx.chart.data.onchart.push(existing)

    const zones = [[1000, 10, 20, 2000, '#0f0']]
    ctx._wsHandleAlert(msg({ alert: { timestamp: 1000 }, zones }))

    expect(existing.data).toHaveLength(2)
    expect(existing.data[1]).toEqual([1000, 10, 20, 2000, '#0f0']) // appended in TV format
    expect(existing.settings.zones).toHaveLength(2)
    expect(existing.settings.zones[1]).toEqual([1000, 10, 2000, 20, '#0f0']) // swapped
    expect(ctx.chart.touchData).toHaveBeenCalled()
    // no SECOND overlay created
    expect(ctx.chart.data.onchart.filter(o => o.type === 'Zones')).toHaveLength(1)
  })
})

describe('_wsHandleAlert — candle_alert_color index alignment + DataCube recolor', () => {
  test('NON-alert file: updates liveAlertColors accumulator only (no chartData write)', () => {
    // originalChartData live region starts at idx 1 → liveAlertColors[i] maps to originalChartData[1+i]
    const orig = [
      [900, 1, 2, 0, 1, 5],
      [1000, 1, 2, 0, 1, 5],   // idx 1 → alertTs 1000 → liveAlertColors[0]
      [2000, 1, 2, 0, 1, 5],   // idx 2 → liveAlertColors[1]
    ]
    const ctx = mkCtx({
      currentDataFile: SCMR_FILE,
      originalChartData: orig,
      liveDataStartIdx: 1,
      liveAlertColors: ['', ''],
      chart: makeFakeChart([[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 5]]),
    })
    ctx._wsHandleAlert(msg({ alert: { timestamp: 1000 }, candle_alert_color: '#ff0' }))
    expect(ctx.liveAlertColors).toEqual(['#ff0', ''])          // accumulator updated
    // non-alert file → chart candle NOT recolored, no touchData from this branch
    expect(ctx.chart.data.chart.data[0][6]).toBeUndefined()
    expect(ctx.chart.touchData).not.toHaveBeenCalled()
  })

  test('alerts file: updates accumulator AND writes chartData row [6] (padded to 9), touches data', () => {
    const orig = [
      [1000, 1, 2, 0, 1, 5],   // idx 0 → alertTs 1000 → liveAlertColors[0]
      [2000, 1, 2, 0, 1, 5],
    ]
    const chartRows = [[1000, 1, 2, 0, 1, 5], [2000, 1, 2, 0, 1, 5]]
    const ctx = mkCtx({
      currentDataFile: ALERT_FILE,
      originalChartData: orig,
      liveDataStartIdx: 0,
      liveAlertColors: ['', ''],
      chart: makeFakeChart(chartRows),
    })
    ctx._wsHandleAlert(msg({ alert: { timestamp: 1000 }, candle_alert_color: '#abc' }))
    expect(ctx.liveAlertColors[0]).toBe('#abc')                // accumulator (idx aligned)
    const row = ctx.chart.data.chart.data[0]
    expect(row.length).toBe(9)                                 // padded
    expect(row[6]).toBe('#abc')                                // recolored
    expect(ctx.chart.touchData).toHaveBeenCalled()
  })
})

describe('_wsHandleAlert — MAX_LIVE cap on the Zones overlay', () => {
  test('overlay data / settings.zones splice off the oldest beyond 10000 (tail retained)', () => {
    const ctx = mkCtx({ currentDataFile: ALERT_FILE })
    // Seed an existing overlay near the cap so a single batch pushes it over.
    const seedData = []
    const seedSettings = []
    for (let i = 0; i < 9999; i++) {
      seedData.push([i, 0, 0, i + 1, '#seed'])
      seedSettings.push([i, 0, i + 1, 0, '#seed'])
    }
    ctx.chart.data.onchart.push({
      name: 'Zones', type: 'Zones',
      data: seedData, settings: { zones: seedSettings },
    })

    // Add 5 fresh zones → 9999 + 5 = 10004 → splice oldest 4 → cap at 10000.
    const fresh = []
    for (let k = 0; k < 5; k++) fresh.push([100000 + k, 1, 2, 200000 + k, '#new' + k])
    ctx._wsHandleAlert(msg({ alert: { timestamp: 1 }, zones: fresh }))

    const ov = ctx.chart.data.onchart.find(o => o.type === 'Zones')
    expect(ov.data.length).toBe(10000)
    expect(ov.settings.zones.length).toBe(10000)
    // tail (the newest fresh zone) retained, in both formats
    expect(ov.data[ov.data.length - 1]).toEqual([100004, 1, 2, 200004, '#new4'])
    expect(ov.settings.zones[ov.settings.zones.length - 1]).toEqual([100004, 1, 200004, 2, '#new4'])
  })
})
