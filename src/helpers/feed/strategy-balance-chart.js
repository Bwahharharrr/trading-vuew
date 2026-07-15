// Strategy balance histories arrive as decimal strings. Convert them only at
// this display boundary, then describe the chart with TradingVue's native
// DataCube/main-chart/overlay structure. No renderer or axis math lives here.

const PROFIT_COLOR = '#f5f7fa'
const LOSS_COLOR = '#ff5c6c'
const BASELINE_COLOR = '#8590a2'

export function balanceChartPoints(history) {
  const raw = history && Array.isArray(history.points) ? history.points : []
  return raw.map((point) => {
    const timestamp = Number(point && point.timestamp_ms)
    const booked = Number(point && point.booked_balance)
    const equity = point && point.equity != null ? Number(point.equity) : null
    return {
      timestamp,
      booked: Number.isFinite(booked) ? booked : null,
      equity: Number.isFinite(equity) ? equity : null,
      markStatus: point && point.mark_status,
    }
  }).filter((point) => Number.isFinite(point.timestamp) && point.booked != null)
    .sort((left, right) => left.timestamp - right.timestamp)
}

export function splitBalanceSegments(points, valueKey, baseline) {
  const segments = []
  let previous = null
  let current = null
  const tone = (value) => value < baseline ? 'loss' : 'profit'

  for (const point of points || []) {
    const value = point && point[valueKey]
    if (!Number.isFinite(value)) {
      previous = null
      current = null
      continue
    }
    const next = { timestamp: point.timestamp, value }
    const nextTone = tone(value)
    if (!previous) {
      current = { tone: nextTone, points: [next] }
      segments.push(current)
      previous = next
      continue
    }

    const previousTone = tone(previous.value)
    if (previousTone === nextTone) {
      if (!current || current.tone !== nextTone) {
        current = { tone: nextTone, points: [previous] }
        segments.push(current)
      }
      current.points.push(next)
    } else {
      const ratio = (baseline - previous.value) / (value - previous.value)
      const crossing = {
        timestamp: previous.timestamp + (point.timestamp - previous.timestamp) * ratio,
        value: baseline,
      }
      current.points.push(crossing)
      current = { tone: nextTone, points: [crossing, next] }
      segments.push(current)
    }
    previous = next
  }
  return segments
}

// Flatten disjoint native spline segments into one series. The null point lifts
// TradingVue's pen between segments while preserving exact baseline crossings.
function toneSeries(points, valueKey, baseline, wantedTone) {
  const segments = splitBalanceSegments(points, valueKey, baseline)
    .filter((segment) => segment.tone === wantedTone)
  const data = []
  for (const segment of segments) {
    if (data.length) {
      const previous = data[data.length - 1]
      const first = segment.points[0]
      data.push([(previous[0] + first.timestamp) / 2, null])
    }
    data.push(...segment.points.map((point) => [point.timestamp, point.value]))
  }
  return data
}

function spline(name, data, settings) {
  return { name, type: 'Spline', data, settings }
}

/**
 * Build a standard TradingVue DataCube description for one balance history.
 *
 * The main spline carries extra high/low columns because the existing main-grid
 * layout reads row[2]/row[3] to determine its Y range. All visible lines are the
 * chart engine's normal Spline overlays, so axes, crosshair, zoom, pan, log scale,
 * reset, capture, and tab range restoration use the established code paths.
 */
export function strategyBalanceChartData(history, { strategyName = 'Strategy' } = {}) {
  const points = balanceChartPoints(history)
  const rawBaseline = Number(history && history.starting_balance)
  const baseline = Number.isFinite(rawBaseline)
    ? rawBaseline : (points[0] ? points[0].booked : 0)

  const chartData = points.map((point) => {
    const values = [baseline, point.booked]
    if (Number.isFinite(point.equity)) values.push(point.equity)
    return [point.timestamp, point.booked, Math.max(...values), Math.min(...values)]
  })
  const bookedLoss = toneSeries(points, 'booked', baseline, 'loss')
  const equity = points.map((point) => [point.timestamp, point.equity])
  const equityLoss = toneSeries(points, 'equity', baseline, 'loss')
  const baselineData = points.map((point) => [point.timestamp, baseline])

  const onchart = []
  if (bookedLoss.length) {
    onchart.push(spline('Booked balance below start', bookedLoss, {
      $uuid: 'strategy-balance-booked-loss',
      color: LOSS_COLOR,
      lineWidth: 2,
      skipNaN: true,
      legend: false,
      zIndex: 3,
    }))
  }
  if (equity.some((point) => Number.isFinite(point[1]))) {
    onchart.push(spline('Marked equity (unbanked P&L)', equity, {
      $uuid: 'strategy-balance-equity',
      color: PROFIT_COLOR,
      lineWidth: 1.7,
      lineDash: [4, 6],
      skipNaN: true,
      zIndex: 4,
    }))
  }
  if (equityLoss.length) {
    onchart.push(spline('Marked equity below start', equityLoss, {
      $uuid: 'strategy-balance-equity-loss',
      color: LOSS_COLOR,
      lineWidth: 1.7,
      lineDash: [4, 6],
      skipNaN: true,
      legend: false,
      zIndex: 5,
    }))
  }
  if (baselineData.length) {
    onchart.push(spline('Starting balance', baselineData, {
      $uuid: 'strategy-balance-baseline',
      color: BASELINE_COLOR,
      lineWidth: 1,
      lineDash: [7, 5],
      legend: true,
      zIndex: 1,
    }))
  }

  return {
    chart: {
      name: `${strategyName} · Booked balance (banked)`,
      type: 'Spline',
      data: chartData,
      settings: {
        color: PROFIT_COLOR,
        lineWidth: 2,
        skipNaN: true,
        showVolume: false,
      },
    },
    onchart,
    offchart: [],
  }
}
