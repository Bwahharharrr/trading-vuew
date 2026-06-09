// Pure ingestion transforms: Corky chart-feed v1 rows → trading-vue data.
//
// Everything here is a pure function with no I/O and no framework deps so it
// can be golden-pinned and reused by the (later) DataCube wiring. Decimal
// strings on the wire are converted to JS numbers for rendering; the raw
// strings are preserved in a sidecar so a tooltip can show exact text.
//
// Wire row shape (see src/types/corky-feed.ts → ChartCandleRow):
//   { timeframe, candle:{ timestamp_ms, open, high, low, close, volume },
//     indicators?: { "<kind>:<period>": { "<output>": "<decimal>" } } }
//
// trading-vue targets:
//   OHLCV:    [ts, open, high, low, close, volume]  (numbers, ascending ts)
//   overlay:  { name, type, data:[[ts, value], ...] }

import {
  indicatorPlacement, layerKindToOverlay, styleToSettings, candleColorOf
} from './indicator-catalog.js'

// ─────────────────────────────────────────────────────────── primitives ──

/**
 * Convert a decimal string (or number) to a JS number, NaN-safe.
 * Empty / null / non-numeric input → NaN (never throws).
 *
 * @param {string|number|null|undefined} s
 * @returns {number}
 */
export function decimalToNumber(s) {
  if (s === null || s === undefined || s === '') return NaN
  const n = Number(s)
  return n // Number('abc') === NaN; Number('77865.25') === 77865.25
}

/**
 * Project a row's candle to a trading-vue OHLCV tuple.
 *
 * @param {import('../../types/corky-feed').ChartCandleRow} row
 * @returns {[number, number, number, number, number, number]}
 */
export function rowToOhlcv(row) {
  const c = row.candle
  return [
    c.timestamp_ms,
    decimalToNumber(c.open),
    decimalToNumber(c.high),
    decimalToNumber(c.low),
    decimalToNumber(c.close),
    decimalToNumber(c.volume),
  ]
}

// ─────────────────────────────────────────────────────────── indicators ──

/**
 * The indicator kind of an instance key. Tolerant of both wire forms the
 * gateway may emit: `'sma:20'` (kind:period, per the examples) and
 * `'SMA(20)'` (display_label, per the contract's candle_row_shape). The kind
 * is the leading run of letters; falls back to the `':'` prefix.
 *   'sma:20'  → 'sma'   ·   'SMA(20)' → 'SMA'   ·   'macd:12:26:9' → 'macd'
 * (indicator-catalog lowercases the kind, so case here is irrelevant to placement.)
 */
function kindOf(instanceKey) {
  const m = /^[A-Za-z]+/.exec(instanceKey)
  if (m) return m[0]
  const i = instanceKey.indexOf(':')
  return i === -1 ? instanceKey : instanceKey.slice(0, i)
}

/**
 * Pivot per-row indicator outputs into per-series arrays.
 *
 * For every row, for each `row.indicators[instanceKey][output]`, accumulate
 * `[ts, Number(value)]` under the series key `instanceKey + '.' + output`.
 *
 * @param {import('../../types/corky-feed').ChartCandleRow[]} rows
 * @returns {Array<{ key:string, instanceKey:string, output:string,
 *                    data:[number, number][], raw:[number, string][] }>}
 *   one entry per (instanceKey, output) series, each `data` sorted ascending
 *   by ts. `raw` carries the original decimal strings alongside (tooltips).
 */
export function pivotIndicators(rows) {
  // Preserve first-seen order of series keys for stable output ordering.
  const order = []
  const byKey = new Map()

  for (const row of rows) {
    const ts = row.candle.timestamp_ms
    const inds = row.indicators
    if (!inds) continue
    for (const instanceKey of Object.keys(inds)) {
      const outputs = inds[instanceKey]
      if (!outputs) continue
      for (const output of Object.keys(outputs)) {
        const key = instanceKey + '.' + output
        let series = byKey.get(key)
        if (!series) {
          series = { key, instanceKey, output, data: [], raw: [] }
          byKey.set(key, series)
          order.push(key)
        }
        series.data.push([ts, decimalToNumber(outputs[output])])
        series.raw.push([ts, outputs[output]])
      }
    }
  }

  const out = order.map((k) => byKey.get(k))
  // Each series ascending by ts (rows may arrive unordered upstream).
  for (const s of out) {
    s.data.sort((a, b) => a[0] - b[0])
    s.raw.sort((a, b) => a[0] - b[0])
  }
  return out
}

// ─────────────────────────────────────────────────────── full transform ──

/**
 * Build a trading-vue chart-data object from a set of rows.
 *
 * @param {import('../../types/corky-feed').ChartCandleRow[]} rows
 * @param {{ timeframe?: string }} [opts]
 * @returns {{
 *   chart: { type:'Candles', data:[number,number,number,number,number,number][] },
 *   onchart: Array<{ name:string, type:string, data:[number,number][] }>,
 *   offchart: Array<{ name:string, type:string, data:[number,number][] }>
 * }}
 */
// Resolve a descriptor view for a pivoted instance. `views` is keyed by
// display_label (preferred) and/or kind. Match by exact instanceKey/label
// first; fall back to kind ONLY when exactly one view exists for that kind
// (avoids applying SMA(20)'s view to SMA(50)).
function resolveView(views, instanceKey, kind) {
  if (!views) return null
  const get = (k) => (views instanceof Map ? views.get(k) : views[k])
  let v = get(instanceKey)
  if (v) return v.layers ? v : (v.view || null)
  // kind fallback only if unambiguous (case-insensitive: rows may use 'sma:20'
  // while the descriptor kind is 'sma'; kindOf('SMA(20)') is 'SMA').
  const kl = String(kind).toLowerCase()
  const all = views instanceof Map ? [...views.values()] : Object.values(views)
  const sameKind = all.filter((e) => e && e.kind && String(e.kind).toLowerCase() === kl)
  if (sameKind.length === 1) {
    const e = sameKind[0]
    return e.layers ? e : (e.view || null)
  }
  return null
}

// Pane name → numeric grid index. The FIRST layer of a pane is the anchor (it
// carries NO grid.id so it spawns the offchart grid); subsequent layers in the
// same pane carry grid:{id} to merge into it. (Section.vue groups offchart
// overlays by numeric grid index, not a string name.)
function makePaneResolver() {
  const byName = new Map()
  let next = 1
  return {
    assign(name) {
      const key = name == null ? '' : String(name)
      let rec = byName.get(key)
      if (!rec) { rec = { id: next++ }; byName.set(key, rec); return { id: rec.id, anchor: true } }
      return { id: rec.id, anchor: false }
    }
  }
}

// Build overlay data for a layer's fields: single field → [[ts, v]]; multi →
// [[ts, f0, f1, ...]] aligned by ts (Splines/Channel multi-column contract).
function zipFields(fields, outputsMap) {
  const series = fields.map((f) => outputsMap.get(f)).filter(Boolean)
  if (!series.length) return { data: [], raw: [] }
  if (series.length === 1) {
    return { data: series[0].data.map((d) => d.slice()), raw: series[0].raw.map((d) => d.slice()) }
  }
  const byTs = new Map(); const rawByTs = new Map()
  series.forEach((s, col) => {
    for (const [ts, v] of s.data) { let r = byTs.get(ts); if (!r) { r = []; byTs.set(ts, r) } r[col] = v }
    for (const [ts, v] of s.raw) { let r = rawByTs.get(ts); if (!r) { r = []; rawByTs.set(ts, r) } r[col] = v }
  })
  const tss = [...byTs.keys()].sort((a, b) => a - b)
  const data = tss.map((ts) => [ts, ...series.map((_, c) => { const v = byTs.get(ts)[c]; return v == null ? null : v })])
  const raw = tss.map((ts) => [ts, ...series.map((_, c) => { const v = (rawByTs.get(ts) || [])[c]; return v == null ? null : v })])
  return { data, raw }
}

// Build overlays for ONE indicator instance from its view.layers. Returns
// { onchart, offchart, candleColorByTs }. candle_color/marker produce no overlay
// (candle_color stamps the candle colour slot; raw values stay in the pivot).
export function buildLayerOverlays(instanceKey, kind, outputsMap, view, paneResolver) {
  const onchart = []; const offchart = []; const candleColor = []
  for (const layer of view.layers) {
    const fields = (layer.fields && layer.fields.length) ? layer.fields : [...outputsMap.keys()]
    if (layer.kind === 'candle_color') {
      // Compute the per-ts colours but DO NOT stamp the candles here — candle
      // colour is applied only when the indicator is enabled (candles-only
      // default), so the feed stamps/clears slot 6 in setIndicatorEnabled. The
      // source field is kept for the live re-stamp (rowToOhlcv rebuilds the tuple).
      const field = fields[0]
      const s = outputsMap.get(field)
      const byTs = new Map()
      if (s) for (const [ts, rawVal] of s.raw) {
        const c = candleColorOf(rawVal)
        if (c != null) byTs.set(ts, c)
      }
      candleColor.push({ instanceKey, field, byTs })
      continue
    }
    const overlayType = layerKindToOverlay(layer.kind, fields.length)
    if (!overlayType) continue // marker / unknown: no declarative renderer
    const { data, raw } = zipFields(fields, outputsMap)
    const surface = (layer.target && layer.target.surface) || 'price'
    const settings = Object.assign(styleToSettings(layer.style), {
      corkyKey: instanceKey + '#' + layer.id,
      corkyKind: kind,
      corkyInstance: instanceKey,
      corkyLayerId: layer.id,
      corkyFields: fields,
      corkyView: true,
      corkyVisibleDefault: layer.visible_by_default !== false,
      display: layer.visible_by_default !== false
    })
    const overlay = { name: layer.label || layer.id, type: overlayType, data, settings, raw }
    if (surface === 'pane') {
      const pane = paneResolver.assign((layer.target && layer.target.pane) || instanceKey)
      if (!pane.anchor) overlay.grid = { id: pane.id } // anchor spawns the grid (no grid.id)
      offchart.push(overlay)
    } else {
      onchart.push(overlay)
    }
  }
  return { onchart, offchart, candleColor }
}

export function buildChartData(rows, opts = {}) {
  const ohlcv = rows.map(rowToOhlcv)
  ohlcv.sort((a, b) => a[0] - b[0])

  const onchart = []
  const offchart = []
  const views = opts.views || null

  // Group pivot series by instance so a view can build per-layer overlays.
  const series = pivotIndicators(rows)
  const byInstance = new Map() // instanceKey -> { kind, outputs: Map<output, series> }
  for (const s of series) {
    let g = byInstance.get(s.instanceKey)
    if (!g) { g = { kind: kindOf(s.instanceKey), outputs: new Map() }; byInstance.set(s.instanceKey, g) }
    g.outputs.set(s.output, s)
  }
  const viewOf = (instanceKey, kind) => {
    const v = resolveView(views, instanceKey, kind)
    return v && Array.isArray(v.layers) && v.layers.length ? v : null
  }

  // 1) view-driven instances → per-layer overlays + candle-colour metadata.
  const paneResolver = makePaneResolver()
  const candleColor = [] // [{ kind, instanceKey, field, byTs }] — applied on enable
  const viewInstances = new Set()
  for (const [instanceKey, g] of byInstance) {
    const view = viewOf(instanceKey, g.kind)
    if (!view) continue
    viewInstances.add(instanceKey)
    const built = buildLayerOverlays(instanceKey, g.kind, g.outputs, view, paneResolver)
    for (const ov of built.onchart) onchart.push(ov)
    for (const ov of built.offchart) offchart.push(ov)
    for (const e of built.candleColor) candleColor.push({ kind: g.kind, ...e })
  }

  // 2) fallback (no/empty view) → plot every output (BYTE-IDENTICAL to legacy).
  for (const s of series) {
    if (viewInstances.has(s.instanceKey)) continue
    const kind = kindOf(s.instanceKey)
    const { pane, overlayType } = indicatorPlacement(kind)
    const overlay = {
      name:
        s.output === kind || s.output === s.instanceKey ? s.instanceKey : s.key,
      type: overlayType,
      data: s.data,
      settings: { corkyKey: s.key, corkyKind: kind, corkyOutput: s.output },
      raw: s.raw,
    }
    if (pane === 'onchart') onchart.push(overlay)
    else offchart.push(overlay)
  }

  // candle_color is NOT stamped at build — candles stay their natural red/green
  // until the owning indicator is enabled (candles-only default). The feed applies
  // it in setIndicatorEnabled (and re-applies on tf-switch/reload) using the
  // _candleColor metadata below.

  // Section.vue indexes an offchart grid's anchor as offchart[id-1] (the id-th
  // NO-grid-id overlay) and merges grid:{id} overlays into it. That holds only
  // if every grid:{id} (pane sibling) overlay sits AFTER all anchors — the per-
  // instance layer order interleaves them ([hist, lines#id1, bull]), which would
  // mis-index a 2nd pane. Reorder: anchors first, pane-siblings last. (No-op when
  // nothing carries .grid → fallback stays byte-identical.)
  if (offchart.some((o) => o.grid)) {
    const ordered = offchart.filter((o) => !o.grid).concat(offchart.filter((o) => o.grid))
    offchart.length = 0
    offchart.push(...ordered)
  }

  const result = {
    chart: { type: 'Candles', data: ohlcv },
    onchart,
    offchart,
  }
  // candle_color metadata (non-enumerable so it doesn't leak into spreads /
  // golden comparisons). `_candleColor` = [{ kind, instanceKey, field, byTs }]
  // (per-layer historical colours + the live source field). `_candleColorActive`
  // = kinds whose candle colour is currently applied to the candles (empty until
  // an indicator is enabled — see CorkyFeed.setIndicatorEnabled).
  Object.defineProperty(result, '_candleColor', {
    value: candleColor, enumerable: false, configurable: true, writable: true
  })
  Object.defineProperty(result, '_candleColorActive', {
    value: new Set(), enumerable: false, configurable: true, writable: true
  })
  return result
}

// ─────────────────────────────────────────────────────────── assembling ──

/**
 * Flatten historical_chunk events into one ordered, deduped row list.
 *
 * Orders by `chunk_index`, then by row order within a chunk. Dedupes by
 * `[timeframe, candle.timestamp_ms]` — a later occurrence replaces an
 * earlier one (last write wins), matching live-update semantics.
 *
 * @param {import('../../types/corky-feed').HistoricalChunkEvent[]} chunkEvents
 * @returns {import('../../types/corky-feed').ChartCandleRow[]}
 */
export function assembleChunks(chunkEvents) {
  const ordered = [...chunkEvents].sort(
    (a, b) => Number(a.chunk_index) - Number(b.chunk_index)
  )

  const byKey = new Map()
  const order = []
  for (const ev of ordered) {
    for (const row of ev.rows || []) {
      const key = row.timeframe + ' ' + row.candle.timestamp_ms
      if (!byKey.has(key)) order.push(key)
      byKey.set(key, row) // replace same [tf, ts]
    }
  }
  return order.map((k) => byKey.get(k))
}

// ─────────────────────────────────────────────────────────── live merge ──

/** Locate an overlay (across onchart+offchart) by its corky series key. */
function findOverlayByKey(chartDataObj, key) {
  const lists = [chartDataObj.onchart || [], chartDataObj.offchart || []]
  for (const list of lists) {
    for (const ov of list) {
      if (ov.settings && ov.settings.corkyKey === key) return ov
    }
  }
  return null
}

/** Upsert a `[ts, ...]` tuple into an ascending-by-ts array (replace same ts). */
function upsertByTs(data, tuple) {
  const ts = tuple[0]
  // Common case: append (live rows arrive newest-last).
  const lastIdx = data.length - 1
  if (lastIdx < 0 || data[lastIdx][0] < ts) {
    data.push(tuple)
    return
  }
  if (data[lastIdx][0] === ts) {
    data[lastIdx] = tuple
    return
  }
  // Out-of-order ts: binary search for an exact match or insert position.
  let lo = 0
  let hi = data.length // [lo, hi)
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (data[mid][0] < ts) lo = mid + 1
    else hi = mid
  }
  if (lo < data.length && data[lo][0] === ts) data[lo] = tuple
  else data.splice(lo, 0, tuple)
}

/**
 * Apply one `live_update` event to a chart-data object, in place.
 *
 * Drops the event if its `sequence` is <= the last seen sequence for its
 * `subscription_id` (out-of-order / duplicate). Otherwise upserts the candle
 * by timestamp and each indicator output's point into its overlay.
 *
 * @param {object} chartDataObj - result of {@link buildChartData} (mutated)
 * @param {import('../../types/corky-feed').LiveUpdateEvent} liveEvent
 * @param {Record<string, number>} lastSeqBySub - per-subscription last sequence
 *   (mutated on accept)
 * @returns {{ chart: object, applied: boolean, sequence: number }}
 */
export function applyLiveUpdate(chartDataObj, liveEvent, lastSeqBySub) {
  const sub = liveEvent.subscription_id
  const seq = liveEvent.sequence
  const last = lastSeqBySub[sub]

  if (last !== undefined && seq <= last) {
    // Dropped as a duplicate / out-of-order sequence. NOTE: this assumes the
    // gateway's `sequence` is strictly monotonic PER MESSAGE. If it only bumps
    // per finalized candle (so intra-candle refinements share a sequence), this
    // guard silently drops every refinement after the first — the current
    // candle is then "drawn once, never updated".
    return { chart: chartDataObj, applied: false, sequence: last, reason: 'stale-sequence' }
  }

  const row = liveEvent.row
  // Single-timeframe invariant: one subscription streams one timeframe. If a
  // caller tagged the chart-data object with its timeframe, drop foreign-tf
  // rows rather than mixing them into the same OHLCV array keyed by ts alone.
  if (chartDataObj.timeframe && row.timeframe && row.timeframe !== chartDataObj.timeframe) {
    return { chart: chartDataObj, applied: false, sequence: last, reason: 'tf-mismatch' }
  }
  upsertByTs(chartDataObj.chart.data, rowToOhlcv(row))

  const ts = row.candle.timestamp_ms
  const inds = row.indicators || {}
  for (const instanceKey of Object.keys(inds)) {
    const outputs = inds[instanceKey] || {}
    for (const output of Object.keys(outputs)) {
      const numv = decimalToNumber(outputs[output])
      // (a) Legacy/fallback single-output overlay keyed by instanceKey.output.
      const ov = findOverlayByKey(chartDataObj, instanceKey + '.' + output)
      if (ov) {
        upsertByTs(ov.data, [ts, numv])
        if (ov.raw) upsertByTs(ov.raw, [ts, outputs[output]])
      }
      // (b) view overlays consuming this field (by corkyInstance + corkyFields),
      //     writing the value into its column (multi-field Splines/Channel/Zones).
      for (const vov of viewOverlaysFor(chartDataObj, instanceKey, output)) {
        const col = vov.settings.corkyFields.indexOf(output) + 1
        const ncol = vov.settings.corkyFields.length
        upsertColumn(vov.data, ts, col, ncol, numv)
        if (vov.raw) upsertColumn(vov.raw, ts, col, ncol, outputs[output])
      }
    }
  }

  // candle_color: rowToOhlcv above replaced the candle tuple with a fresh
  // 6-element array, destroying any slot-6 colour — re-stamp it from the live
  // field value, but ONLY for kinds whose candle colour is currently applied
  // (_candleColorActive); an un-enabled candle_color indicator must not colour
  // the candles. Also keeps byTs current so a later toggle re-stamps correctly.
  const ccMeta = chartDataObj._candleColor
  const ccActive = chartDataObj._candleColorActive
  if (ccMeta && ccMeta.length && ccActive && ccActive.size) {
    let candle = null
    const arr = chartDataObj.chart.data
    for (let i = arr.length - 1; i >= 0; i--) { if (arr[i][0] === ts) { candle = arr[i]; break } }
    if (candle) {
      for (const cc of ccMeta) {
        if (!ccActive.has(cc.kind)) continue
        const v = inds[cc.instanceKey] && inds[cc.instanceKey][cc.field]
        const color = candleColorOf(v)
        if (color != null) {
          while (candle.length < 9) candle.push('')
          candle[6] = color
          if (cc.byTs) cc.byTs.set(ts, color)
        }
      }
    }
  }

  lastSeqBySub[sub] = seq
  return { chart: chartDataObj, applied: true, sequence: seq }
}

// View overlays (built from view.layers) that consume `output` of `instanceKey`.
function viewOverlaysFor(chartDataObj, instanceKey, output) {
  const out = []
  for (const pane of ['onchart', 'offchart']) {
    const arr = chartDataObj[pane]
    if (!arr) continue
    for (const ov of arr) {
      const s = ov.settings
      if (s && s.corkyView && s.corkyInstance === instanceKey &&
          Array.isArray(s.corkyFields) && s.corkyFields.includes(output)) {
        out.push(ov)
      }
    }
  }
  return out
}

// Upsert a value into column `col` of the row at `ts` in a multi-column array
// ([ts, c1..cn]); insert a fresh ncol+1 row (nulls) if the ts is new.
function upsertColumn(data, ts, col, ncol, value) {
  const last = data.length - 1
  let rowArr
  if (last >= 0 && data[last][0] === ts) {
    rowArr = data[last]
  } else if (last < 0 || data[last][0] < ts) {
    rowArr = [ts]; for (let i = 0; i < ncol; i++) rowArr.push(null)
    data.push(rowArr)
  } else {
    // out-of-order: binary search
    let lo = 0, hi = data.length
    while (lo < hi) { const m = (lo + hi) >> 1; if (data[m][0] < ts) lo = m + 1; else hi = m }
    if (lo < data.length && data[lo][0] === ts) rowArr = data[lo]
    else { rowArr = [ts]; for (let i = 0; i < ncol; i++) rowArr.push(null); data.splice(lo, 0, rowArr) }
  }
  rowArr[col] = value
}
