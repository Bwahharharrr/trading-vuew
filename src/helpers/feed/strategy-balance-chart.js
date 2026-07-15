// Pure rendering helpers for the strategy balance chart. Financial values stay
// decimal strings until this display boundary; Number conversion is never fed
// back into runtime/accounting state.

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

export function balanceChartDomain(points, baseline, logScale = false) {
  const values = [baseline]
  for (const point of points || []) {
    if (Number.isFinite(point.booked)) values.push(point.booked)
    if (Number.isFinite(point.equity)) values.push(point.equity)
  }
  const useLog = !!logScale && values.every((value) => value > 0)
  const project = useLog ? (value) => Math.log10(value) : (value) => value
  let minimum = Math.min(...values.map(project))
  let maximum = Math.max(...values.map(project))
  if (minimum === maximum) {
    const padding = Math.abs(minimum || 1) * 0.05
    minimum -= padding
    maximum += padding
  } else {
    const padding = (maximum - minimum) * 0.08
    minimum -= padding
    maximum += padding
  }
  return { minimum, maximum, useLog, project }
}
