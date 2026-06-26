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
  indicatorPlacement, layerKindToOverlay, styleToSettings, candleColorOf, candleColorOpts,
  signedSlopeColor, candleColorPalette, paletteColorOf, paletteLabelOf,
  candleColorBullBear, bullBearColorOf,
  detectionBoxRule, detectionSet, hexToRgba,
  markerSymbolRule, markerSymbolOf
} from './indicator-catalog.js'

// ─────────────────────────────────────────────────────────── primitives ──

// True when `arr` is already non-strictly ascending by `arr[i][key]` (uses <=
// so equal keys count as ordered → a no-op sort would preserve their stable
// order). Lets the build/merge path skip an already-sorted array's sort.
function isAscendingBy(arr, key) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (!(arr[i][key] <= arr[i + 1][key])) return false
  }
  return true
}

// As `isAscendingBy`, but for a flat array of scalars (e.g. a list of ts).
function isAscending(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (!(arr[i] <= arr[i + 1])) return false
  }
  return true
}

/**
 * Convert a decimal string (or number) to a JS number, NaN-safe.
 * Empty / null / non-numeric input → NaN (never throws).
 *
 * @param {string|number|null|undefined} s
 * @returns {number}
 */
export function decimalToNumber(s) {
  if (s === null || s === undefined) return NaN
  // Whitespace-only / empty is a GAP, not a real 0 (Number(' ') === 0).
  if (typeof s === 'string' && s.trim() === '') return NaN
  const n = Number(s)
  // Reject ±Infinity (Number('1e999')/'Infinity') — it would blank panes
  // downstream by stretching the y-range. Only finite numbers pass.
  return Number.isFinite(n) ? n : NaN
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
  // Each series ascending by ts (rows may arrive unordered upstream). Skip the
  // sort when the series is already ordered (the common case: rows arrive in ts
  // order) — `<=` precheck keeps equal-ts stable order identical to a no-op sort.
  for (const s of out) {
    if (!isAscendingBy(s.data, 0)) s.data.sort((a, b) => a[0] - b[0])
    if (!isAscendingBy(s.raw, 0)) s.raw.sort((a, b) => a[0] - b[0])
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
      if (!rec) { rec = { id: next++ }; byName.set(key, rec); return { id: rec.id, name: key, anchor: true } }
      return { id: rec.id, name: key, anchor: false }
    }
  }
}

// Build overlay data for a layer's fields: single field → [[ts, v]]; multi →
// [[ts, f0, f1, ...]] aligned by ts (Splines/Channel multi-column contract).
function zipFields(fields, outputsMap) {
  // `survivors` are the declared fields that actually have a pivoted series, in
  // declared order. Build columns come from these, so the caller MUST store the
  // survivor list into settings.corkyFields (not the full declared `fields`) or
  // live writes (which index by corkyFields.indexOf(output)) land in the wrong
  // column when a non-final declared field is absent from history.
  const survivors = fields.filter((f) => outputsMap.get(f))
  const series = survivors.map((f) => outputsMap.get(f))
  if (!series.length) return { data: [], raw: [], fields: [] }
  if (series.length === 1) {
    return { data: series[0].data.map((d) => d.slice()), raw: series[0].raw.map((d) => d.slice()), fields: survivors }
  }
  const byTs = new Map(); const rawByTs = new Map()
  series.forEach((s, col) => {
    for (const [ts, v] of s.data) { let r = byTs.get(ts); if (!r) { r = []; byTs.set(ts, r) } r[col] = v }
    for (const [ts, v] of s.raw) { let r = rawByTs.get(ts); if (!r) { r = []; rawByTs.set(ts, r) } r[col] = v }
  })
  const tss = [...byTs.keys()]
  if (!isAscending(tss)) tss.sort((a, b) => a - b)
  const data = tss.map((ts) => [ts, ...series.map((_, c) => { const v = byTs.get(ts)[c]; return v == null ? null : v })])
  const raw = tss.map((ts) => [ts, ...series.map((_, c) => { const v = (rawByTs.get(ts) || [])[c]; return v == null ? null : v })])
  return { data, raw, fields: survivors }
}

// Build [ts, value, color] for a `signed_slope_histogram` layer. Colour per bar
// from the value sign + slope direction (signedSlopeColor). Slope comes from
// style.slope_field; if a row lacks it, derive from value − previous value; if
// there's no previous value, fall back to sign-only.
function buildSignedSlopeHistogram(layer, fields, outputsMap) {
  const style = layer.style || {}
  const valueField = style.value_field || fields[0]
  const slopeField = style.slope_field || null
  const colors = {
    positive_rising_color: style.positive_rising_color,
    positive_falling_color: style.positive_falling_color,
    negative_falling_color: style.negative_falling_color,
    negative_rising_color: style.negative_rising_color
  }
  const vSeries = outputsMap.get(valueField)
  const sSeries = slopeField ? outputsMap.get(slopeField) : null
  const slopeByTs = new Map()
  if (sSeries) for (const [ts, v] of sSeries.data) slopeByTs.set(ts, v)
  const vData = vSeries ? vSeries.data : []
  const vRaw = vSeries ? vSeries.raw : []
  const data = []; const raw = []
  let prev = null
  for (let k = 0; k < vData.length; k++) {
    const ts = vData[k][0]; const value = vData[k][1]
    const slope = slopeByTs.has(ts) ? slopeByTs.get(ts) : (prev != null ? value - prev : null)
    data.push([ts, value, signedSlopeColor(value, slope, colors)])
    raw.push([ts, vRaw[k] ? vRaw[k][1] : null])
    prev = value
  }
  return { data, raw, valueField, slopeField, colors }
}

// ── detection-zone boxes (box_rule: detection_zone_until_close_breaks) ─────
//
// One box per detection candle: vertical span = that candle's low..high; LEFT
// edge = that candle's CLOSE time (bar T+1's open — the detection candle is
// never inside its own box). A bull box dies when a later candle CLOSES
// strictly below its bottom; a bear box on a close strictly above its top.
// Wicks through the level do NOT invalidate; the invalidating candle is still
// covered (right edge at its close time). No invalidating close → extend to
// the live edge. Each box renders as its OWN translucent rect (no merging) so
// k overlapping boxes read k× stronger.
//
// Server truth: `{side}_box_count` / `{side}_box_top` / `{side}_box_bottom`
// accompany every bar. If the FIRST loaded bar has count > 0, the anchors are
// left of the window — a SEED rect is rendered from the envelope with
// opacity×count (capped) until real anchors load.

const MAX_DETECTION_BOXES = 2048 // mirror the indicator's bounded history

// Group the chart's base candles into the SOURCE candles a box layer is quantised
// to. A higher source timeframe (MTF, e.g. 2h on a 1h chart) repeats its state
// across the base rows it spans; `rule.sourceTimestampField` (tf_2h_timestamp)
// names the owning source bar, so we collapse those rows into ONE synthetic source
// candle ([ts, o, h, l, c, v]) and expose a rawOf(field) that reads the SETTLED
// (last base row in the group) value keyed by source ts. Returns null when there
// is no source field (legacy single-tf) → caller uses the base candles 1:1.
export function buildSourceCandles(rule, outputsMap, ohlcv) {
  const stf = rule.sourceTimestampField
  if (!stf) return null
  const tsSer = outputsMap.get(stf)
  if (!tsSer || !tsSer.raw.length) return null
  const srcByBase = new Map(tsSer.raw.map(([bt, v]) => [bt, Number(v)]))
  const groups = new Map() // srcTs -> { o, h, l, c, v, firstBt, lastBt }
  for (const bar of ohlcv) {
    const st = srcByBase.get(bar[0])
    if (!Number.isFinite(st)) continue
    let g = groups.get(st)
    if (!g) { g = { o: bar[1], h: -Infinity, l: Infinity, c: bar[4], v: 0, firstBt: Infinity, lastBt: -Infinity }; groups.set(st, g) }
    if (bar[0] < g.firstBt) { g.firstBt = bar[0]; g.o = bar[1] }
    if (bar[0] >= g.lastBt) { g.lastBt = bar[0]; g.c = bar[4] }
    if (bar[2] > g.h) g.h = bar[2]
    if (bar[3] < g.l) g.l = bar[3]
    g.v += Number(bar[5]) || 0
  }
  const tsList = [...groups.keys()].sort((a, b) => a - b)
  const candles = tsList.map((ts) => { const g = groups.get(ts); return [ts, g.o, g.h, g.l, g.c, g.v] })
  const rawOf = (field) => {
    const m = new Map()
    const ser = field ? outputsMap.get(field) : null
    if (!ser) return m
    const byBase = new Map(ser.raw)
    for (const ts of tsList) { const v = byBase.get(groups.get(ts).lastBt); if (v !== undefined) m.set(ts, v) }
    return m
  }
  return { candles, rawOf }
}

export function buildDetectionBoxes(rule, outputsMap, ohlcv) {
  // Candles the boxes are quantised to: the chart's own (base-tf / legacy) OR the
  // GROUPED source candles (MTF higher tf — deduped by source timestamp).
  const src = buildSourceCandles(rule, outputsMap, ohlcv)
  const candles = src ? src.candles : ohlcv
  const rawOf = src ? src.rawOf : (f) => {
    const ser = f ? outputsMap.get(f) : null
    return ser ? new Map(ser.raw) : new Map()
  }

  // tf from (source) candle spacing — boxes are bar-quantised; edges are close
  // times = ts + tf.
  let tf = Infinity
  for (let i = 1; i < candles.length; i++) {
    const d = candles[i][0] - candles[i - 1][0]
    if (d > 0 && d < tf) tf = d
  }
  if (!Number.isFinite(tf)) tf = 0

  const bullRaw = rawOf(rule.bullField)
  const bearRaw = rawOf(rule.bearField)
  const boxes = []

  // SEED boxes: history starts inside boxes anchored left of the window.
  if (candles.length) {
    const t0 = candles[0][0]
    for (const side of ['bull', 'bear']) {
      const count = Number(rawOf(rule.countFields[side]).get(t0))
      if (!(Number.isFinite(count) && count >= 1)) continue
      const top = Number(rawOf(rule.topFields[side]).get(t0))
      const bottom = Number(rawOf(rule.bottomFields[side]).get(t0))
      if (!(Number.isFinite(top) && Number.isFinite(bottom) && top > bottom)) continue
      boxes.push({
        side, top, bottom, t0, t1: t0, alive: true,
        seed: true, seedCount: count,
      })
    }
  }

  for (let i = 0; i < candles.length; i++) {
    const bar = candles[i]
    const ts = bar[0]
    const closeTime = ts + tf
    // 1) coverage + invalidation for boxes anchored at EARLIER bars
    //    (a box opened at bar T's close is first evaluated against T+1)
    for (const b of boxes) {
      if (!b.alive || b.t0 > ts) continue
      b.t1 = closeTime // covered through this bar — even when it invalidates
      if (b.side === 'bull' && bar[4] < b.bottom) b.alive = false
      else if (b.side === 'bear' && bar[4] > b.top) b.alive = false
    }
    // 2) detections ON this bar anchor new boxes at its close time
    if (detectionSet(bullRaw.get(ts))) {
      boxes.push({ side: 'bull', top: bar[2], bottom: bar[3], t0: closeTime, t1: closeTime, alive: true })
    }
    if (detectionSet(bearRaw.get(ts))) {
      boxes.push({ side: 'bear', top: bar[2], bottom: bar[3], t0: closeTime, t1: closeTime, alive: true })
    }
  }
  if (boxes.length > MAX_DETECTION_BOXES) boxes.splice(0, boxes.length - MAX_DETECTION_BOXES)
  const li = candles.length - 1
  // Live seed (only meaningful for a grouped/source layer): the last source bar's
  // accumulated candle + settled detection flags, so applyLiveUpdate can continue
  // the source-bar lifecycle across the history→live seam.
  const srcSeed = (src && li >= 0) ? {
    lastSrcTs: candles[li][0],
    srcAccum: { ts: candles[li][0], high: candles[li][2], low: candles[li][3], close: candles[li][4] },
    lastSrcVals: { bull: bullRaw.get(candles[li][0]), bear: bearRaw.get(candles[li][0]) },
  } : null
  return { boxes, tf, lastTs: li >= 0 ? candles[li][0] : null, usedSource: !!src, srcSeed }
}

/** Zones settings-format rows ([x1, y1, x2, y2, rgba]) — one row per box. */
export function detectionBoxRows(boxes, rule) {
  return boxes.map((b) => [
    b.t0, b.top, b.t1, b.bottom,
    hexToRgba(
      b.side === 'bull' ? rule.bullFill : rule.bearFill,
      b.seed
        ? Math.min(rule.fillOpacity * b.seedCount, rule.seedAlphaCap)
        : rule.fillOpacity),
  ])
}

/** Boxes covering the bar at `ts` (a bar is covered when the box spans its
 *  whole open..close) — must equal the server's `{side}_box_count`. */
export function detectionBoxCountAt(boxes, ts, tf, side = null) {
  return boxes.filter((b) =>
    (!side || b.side === side) && b.t0 <= ts && b.t1 >= ts + tf).length
}

// Resolve a marker-rule anchor name to a price off an ohlcv tuple
// ([ts, open, high, low, close, volume]). Defaults to the high.
export function anchorYFromCandle(candle, anchor) {
  if (!candle) return null
  switch (anchor) {
    case 'candle_low': return candle[3]
    case 'candle_open': return candle[1]
    case 'candle_close': return candle[4]
    case 'candle_high':
    default: return candle[2]
  }
}

// Build per-point marker rows for a marker-rule layer (e.g. SCMR reversal
// symbols). Each non-zero/known type-id becomes a row:
//   [ts, y, label, glyph, color, dir]
// where y is the OWNING candle's anchor price (high for above_candle, low for
// below_candle), `dir` ('above'|'below') tells the overlay which way to offset
// the glyph, and glyph/color come straight from the descriptor. Markers anchored
// to a candle the loaded window doesn't carry are skipped (no y).
export function buildSymbolMarkers(rule, outputsMap, ohlcv) {
  const valSeries = outputsMap.get(rule.valueField)
  const labelSeries = rule.labelField ? outputsMap.get(rule.labelField) : null
  const labelByTs = new Map(labelSeries ? labelSeries.raw : [])
  const candleByTs = new Map((ohlcv || []).map((c) => [c[0], c]))
  const data = []; const raw = []
  if (valSeries) for (const [ts, rawVal] of valSeries.raw) {
    const m = markerSymbolOf(rawVal, rule)
    if (!m) continue                                    // 0 / unknown id / non-numeric → no marker
    const above = m.placement === 'above_candle'
    const y = anchorYFromCandle(candleByTs.get(ts), above ? rule.aboveAnchor : rule.belowAnchor)
    if (y == null || !Number.isFinite(Number(y))) continue
    const label = labelByTs.has(ts) ? labelByTs.get(ts) : null
    data.push([ts, Number(y), label, m.glyph, m.color, above ? 'above' : 'below'])
    raw.push([ts, rawVal])
  }
  return { data, raw }
}

// Build overlays for ONE indicator instance from its view.layers. Returns
// { onchart, offchart, candleColorByTs }. candle_color/marker produce no overlay
// (candle_color stamps the candle colour slot; raw values stay in the pivot).
export function buildLayerOverlays(instanceKey, kind, outputsMap, view, paneResolver, ohlcv = null) {
  const onchart = []; const offchart = []; const candleColor = []; const detectionBoxes = []
  for (const layer of view.layers) {
    const fields = (layer.fields && layer.fields.length) ? layer.fields : [...outputsMap.keys()]
    // box layers with the detection-zone rule: STATEFUL reconstruction over the
    // candles (the generic box→Zones mapping below can't express lifetimes).
    if (layer.kind === 'box') {
      const boxRule = detectionBoxRule(layer.style)
      if (boxRule) {
        const builtBoxes = buildDetectionBoxes(boxRule, outputsMap, ohlcv || [])
        const visible = layer.visible_by_default !== false
        const overlay = {
          name: layer.label || layer.id,
          type: 'Zones',
          data: [],   // long-lived rects live in settings.zones (index-0 time
                      // filtering would clip boxes anchored left of the view)
          settings: {
            corkyKey: instanceKey + '#' + layer.id,
            corkyKind: kind,
            corkyInstance: instanceKey,
            corkyLayerId: layer.id,
            corkyView: true,
            corkyVisibleDefault: visible,
            display: visible,
            legend: false,
            'z-index': -1,   // behind the candles
            zones: detectionBoxRows(builtBoxes.boxes, boxRule),
          },
          raw: [],
        }
        onchart.push(overlay)   // price surface
        // A layer is GROUPED (MTF) when its source bar is coarser than the chart's
        // base candle — then the live path advances the box lifecycle per SOURCE
        // bar (via source_timestamp_field), not per base row.
        let baseTf = Infinity
        for (let i = 1; i < (ohlcv || []).length; i++) { const d = ohlcv[i][0] - ohlcv[i - 1][0]; if (d > 0 && d < baseTf) baseTf = d }
        const grouped = builtBoxes.usedSource && Number.isFinite(baseTf) && builtBoxes.tf > baseTf
        const seed = grouped ? (builtBoxes.srcSeed || {}) : {}
        detectionBoxes.push({
          instanceKey, layerId: layer.id, rule: boxRule,
          boxes: builtBoxes.boxes, tf: builtBoxes.tf,
          evaluatedThrough: builtBoxes.lastTs,
          lastLiveTs: null, lastVals: null,
          // MTF source-bar live state (seeded from the history build)
          grouped,
          lastSrcTs: grouped ? (seed.lastSrcTs ?? null) : null,
          srcAccum: grouped ? (seed.srcAccum ?? null) : null,
          lastSrcVals: grouped ? (seed.lastSrcVals ?? null) : null,
          overlay,
        })
        continue
      }
    }
    if (layer.kind === 'candle_color') {
      // Compute the per-ts colours but DO NOT stamp the candles here — candle
      // colour is applied only when the indicator is enabled (candles-only
      // default), so the feed stamps/clears slot 6 in setIndicatorEnabled. The
      // source field is kept for the live re-stamp (rowToOhlcv rebuilds the tuple).
      //
      // Two resolution modes, chosen from the layer's own style (never hardcoded):
      //  · BULL/BEAR DETECTION (CRUP): style.{bull_field,bear_field} are two
      //    boolean-ish outputs; both>0 → both_color, bull>0 → bull_color,
      //    bear>0 → bear_color, neither → untouched. TWO fields per candle —
      //    the single-field modes below can't express it (the old fallthrough
      //    read only fields[0], so bear candles were never painted red).
      //  · PALETTE (SCMR/SCMR-INV): style.color_field names the output holding a
      //    numeric type-id; color_{id}/label_{id} map it to a hex + name.
      //  · THRESHOLD: numeric value → bull/bear/neutral ramp (legacy default).
      const bullBear = candleColorBullBear(layer.style)
      if (bullBear) {
        const sb = bullBear.bullField ? outputsMap.get(bullBear.bullField) : null
        const sr = bullBear.bearField ? outputsMap.get(bullBear.bearField) : null
        const bullByTs = new Map(sb ? sb.raw : [])
        const bearByTs = new Map(sr ? sr.raw : [])
        const byTs = new Map()
        const allTs = new Set([...bullByTs.keys(), ...bearByTs.keys()])
        for (const ts of allTs) {
          const c = bullBearColorOf(bullByTs.get(ts), bearByTs.get(ts), bullBear)
          if (c != null) byTs.set(ts, c) // neither-detected → uncoloured
        }
        candleColor.push({
          instanceKey, field: bullBear.bullField || bullBear.bearField,
          byTs, opts: null, palette: null, byTsLabel: null,
          bullBear, layerId: layer.id,
        })
        continue
      }
      const palette = candleColorPalette(layer.style)
      const field = palette ? palette.colorField : fields[0]
      const s = outputsMap.get(field)
      const opts = palette ? null : candleColorOpts(layer.style)
      const byTs = new Map()
      const byTsLabel = (palette && palette.labelField) ? new Map() : null
      if (s) for (const [ts, rawVal] of s.raw) {
        const c = palette ? paletteColorOf(rawVal, palette) : candleColorOf(rawVal, opts)
        if (c != null) byTs.set(ts, c) // null (warmup/unknown id) → uncoloured, no carry-over
        if (byTsLabel) { const l = paletteLabelOf(rawVal, palette); if (l != null) byTsLabel.set(ts, l) }
      }
      candleColor.push({ instanceKey, field, byTs, opts, palette, byTsLabel, layerId: layer.id })
      continue
    }
    // marker layers with a SYMBOL rule (e.g. SCMR reversal symbols): per-point
    // glyph/colour/anchor resolved from the descriptor, not the generic
    // [ts, value] mapping below (which would plot the type-id as a price). The
    // overlay is price-surface — markers anchor to candle high/low. Live updates
    // recompute these wholesale (see applyLiveUpdate), so they're excluded from
    // the generic column-write (viewOverlaysFor).
    if (layer.kind === 'marker') {
      const mRule = markerSymbolRule(layer.style)
      if (mRule) {
        const built = buildSymbolMarkers(mRule, outputsMap, ohlcv || [])
        const visible = layer.visible_by_default !== false
        onchart.push({
          name: layer.label || layer.id,
          type: 'Markers',
          data: built.data,
          settings: Object.assign(styleToSettings(layer.style), {
            corkyKey: instanceKey + '#' + layer.id,
            corkyKind: kind,
            corkyInstance: instanceKey,
            corkyLayerId: layer.id,
            corkyView: true,
            corkyVisibleDefault: visible,
            display: visible,
            corkyMarkerRule: mRule.rule,
            corkyMarkerSpec: mRule,
            corkyFields: [mRule.valueField, mRule.labelField].filter(Boolean),
            legend: false,
          }),
          raw: built.raw,
        })
        continue
      }
    }
    const overlayType = layerKindToOverlay(layer.kind, fields.length)
    if (!overlayType) continue // unknown: no declarative renderer
    const style = layer.style || {}
    let data, raw, extra
    if (layer.kind === 'histogram' && style.color_rule === 'signed_slope_histogram') {
      // Per-bar colour by value sign + slope direction. Data is [ts, value, color]
      // (colour precomputed); the Histogram overlay reads colour from colorIndex.
      const ss = buildSignedSlopeHistogram(layer, fields, outputsMap)
      data = ss.data; raw = ss.raw
      extra = {
        corkyColorRule: 'signed_slope_histogram',
        valueField: ss.valueField, slopeField: ss.slopeField, ssColors: ss.colors,
        dataIndex: 1, colorIndex: 2,
        zeroLine: style.zero_line === 'true' || style.zero_line === true,
        corkyFields: [ss.valueField, ss.slopeField].filter(Boolean)
      }
    } else {
      const z = zipFields(fields, outputsMap)
      data = z.data; raw = z.raw
      // Store the SURVIVOR list (declared fields that produced a column), not the
      // full declared `fields` — build columns and live-write column indices must
      // agree (live indexes by corkyFields.indexOf(output)+1).
      extra = { corkyFields: z.fields }
    }
    const surface = (layer.target && layer.target.surface) || 'price'
    const settings = Object.assign(styleToSettings(style), {
      corkyKey: instanceKey + '#' + layer.id,
      corkyKind: kind,
      corkyInstance: instanceKey,
      corkyLayerId: layer.id,
      corkyView: true,
      corkyVisibleDefault: layer.visible_by_default !== false,
      display: layer.visible_by_default !== false
    }, extra)
    const overlay = { name: layer.label || layer.id, type: overlayType, data, settings, raw }
    if (surface === 'pane') {
      const pane = paneResolver.assign((layer.target && layer.target.pane) || instanceKey)
      if (!pane.anchor) overlay.grid = { id: pane.id } // anchor spawns the grid (no grid.id)
      // STABLE pane membership tags so the feed can recompute grid.id at DC-push
      // time from pane membership (the build-time absolute id 1..N goes stale
      // under incremental toggles, where Section.vue resolves an anchor as the
      // id-th NO-grid overlay positionally). corkyPaneName identifies the pane;
      // corkyPaneAnchor distinguishes the grid-spawning anchor (no grid.id) from
      // its merging siblings (carry grid.id). See corky-feed.js DC-push.
      settings.corkyPaneName = pane.name
      settings.corkyPaneAnchor = pane.anchor
      offchart.push(overlay)
    } else {
      onchart.push(overlay)
    }
  }
  return { onchart, offchart, candleColor, detectionBoxes }
}

export function buildChartData(rows, opts = {}) {
  // Drop malformed rows up front (missing candle / non-finite timestamp_ms):
  // mapped through rowToOhlcv they would seed a corrupt [undefined,...] tuple,
  // and pivotIndicators keys points by row.candle.timestamp_ms too. Filter once
  // so candles AND indicator pivots stay consistent.
  rows = rows.filter((r) => r && r.candle && Number.isFinite(r.candle.timestamp_ms))
  const ohlcv = rows.map(rowToOhlcv)
  if (!isAscendingBy(ohlcv, 0)) ohlcv.sort((a, b) => a[0] - b[0])

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
  const detectionBoxes = [] // stateful box-layer reconstructions (live-extended)
  const viewInstances = new Set()
  for (const [instanceKey, g] of byInstance) {
    const view = viewOf(instanceKey, g.kind)
    if (!view) continue
    viewInstances.add(instanceKey)
    const built = buildLayerOverlays(instanceKey, g.kind, g.outputs, view, paneResolver, ohlcv)
    for (const ov of built.onchart) onchart.push(ov)
    for (const ov of built.offchart) offchart.push(ov)
    for (const e of built.candleColor) candleColor.push({ kind: g.kind, ...e })
    for (const e of built.detectionBoxes) detectionBoxes.push({ kind: g.kind, ...e })
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
  // Stateful box-layer reconstructions (detection zones). applyLiveUpdate
  // extends/anchors/kills boxes per the rule and regenerates the overlay's
  // settings.zones rows in place.
  Object.defineProperty(result, '_detectionBoxes', {
    value: detectionBoxes, enumerable: false, configurable: true, writable: true
  })
  // Live-tick lookup indexes (non-enumerable, like the sidecars above). MEMBERSHIP
  // of result.onchart/offchart is immutable after this build — toggles mutate
  // dc.data[pane] (a DIFFERENT array) — so these need NO per-toggle invalidation.
  // applyLiveUpdate consumes them when present and falls back to a full scan when
  // they're absent (e.g. a `{ ...built }` spread drops these non-enumerable props).
  attachLiveIndexes(result)
  return result
}

// Build the per-tick lookup indexes on a freshly-built chart-data object. All
// four mirror the iteration order of the scan functions they replace (onchart
// before offchart, array order within each) so results stay byte-identical.
//   _overlayByKey         — corkyKey → fallback overlay (findOverlayByKey; first wins)
//   _viewOverlaysByInstance — corkyInstance → [view overlays] pre-filtered to
//                             (corkyView && !corkyColorRule && !corkyMarkerRule);
//                             the per-output corkyFields.includes(output) filter is
//                             STILL applied per tick (this map is instance-keyed only)
//   _ssHistograms         — signed_slope_histogram overlays
//   _markerRuleOverlays   — corkyMarkerRule overlays
function attachLiveIndexes(result) {
  const byKey = new Map()
  const viewByInstance = new Map()
  const ssHistograms = []
  const markerRuleOverlays = []
  for (const pane of ['onchart', 'offchart']) {
    const arr = result[pane]
    if (!arr) continue
    for (const ov of arr) {
      const s = ov.settings
      if (!s) continue
      if (s.corkyKey != null && !byKey.has(s.corkyKey)) byKey.set(s.corkyKey, ov)
      if (s.corkyView && !s.corkyColorRule && !s.corkyMarkerRule && s.corkyInstance != null &&
          Array.isArray(s.corkyFields)) {
        let list = viewByInstance.get(s.corkyInstance)
        if (!list) { list = []; viewByInstance.set(s.corkyInstance, list) }
        list.push(ov)
      }
      if (s.corkyColorRule === 'signed_slope_histogram') ssHistograms.push(ov)
      if (s.corkyMarkerRule) markerRuleOverlays.push(ov)
    }
  }
  const def = (k, v) => Object.defineProperty(result, k, { value: v, enumerable: false, configurable: true, writable: true })
  def('_overlayByKey', byKey)
  def('_viewOverlaysByInstance', viewByInstance)
  def('_ssHistograms', ssHistograms)
  def('_markerRuleOverlays', markerRuleOverlays)
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
  const ordered = [...chunkEvents]
  // Skip the sort when chunks already arrive in ascending chunk_index order
  // (the common case). `<=` on the NUMERIC index mirrors the comparator exactly
  // and keeps equal-index chunks in their original (stable) order.
  let sorted = true
  for (let i = 0; i < ordered.length - 1; i++) {
    if (!(Number(ordered[i].chunk_index) <= Number(ordered[i + 1].chunk_index))) { sorted = false; break }
  }
  if (!sorted) ordered.sort((a, b) => Number(a.chunk_index) - Number(b.chunk_index))

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

/**
 * Reconstruct a row-format historical chunk from a `historical_chunk_columnar`
 * event so the rest of the pipeline (assembleChunks → buildChartData) stays
 * format-agnostic. The gateway sends parallel column arrays; we rebuild one
 * `ChartCandleRow` per index. Decimal values are kept as STRINGS (rowToOhlcv /
 * decimalToNumber convert downstream). A `null`/absent indicator field value
 * means that field is absent for that row and is omitted (NOT coerced to 0).
 *
 * @param {object} event - the `historical_chunk_columnar` event
 * @param {string} [fallbackTimeframe] - used when the event omits `timeframe`
 * @returns {{ type:'historical_chunk', subscription_id, chunk_index, timeframe, rows }}
 */
export function columnarChunkToRows(event, fallbackTimeframe) {
  const cols = (event && event.columns) || {}
  const ts = cols.timestamp_ms || []
  const tf = event && event.timeframe != null ? event.timeframe : fallbackTimeframe
  const indLabels = cols.indicators ? Object.keys(cols.indicators) : []
  const at = (arr, i) => (arr ? arr[i] : undefined)
  const rows = []
  for (let i = 0; i < ts.length; i++) {
    const candle = {
      timestamp_ms: ts[i],
      open: at(cols.open, i),
      high: at(cols.high, i),
      low: at(cols.low, i),
      close: at(cols.close, i),
      volume: at(cols.volume, i),
    }
    const indicators = {}
    for (const label of indLabels) {
      const fields = cols.indicators[label] || {}
      let bag = null
      for (const f of Object.keys(fields)) {
        const v = at(fields[f], i)
        if (v == null) continue // null = field absent for this row
        if (!bag) bag = {}
        bag[f] = v
      }
      if (bag) indicators[label] = bag
    }
    rows.push({ timeframe: tf, candle, indicators })
  }
  return {
    type: 'historical_chunk',
    subscription_id: event && event.subscription_id,
    chunk_index: event ? event.chunk_index : 0,
    timeframe: tf,
    rows,
  }
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

/**
 * Upsert a `[ts, ...]` tuple into an ascending-by-ts array (replace same ts).
 * RETURNS the row now living at `ts` (the appended/replaced/spliced tuple) so a
 * caller that needs the OHLCV row it just wrote can skip a redundant backward
 * `for(...)` ts rescan.
 */
function upsertByTs(data, tuple) {
  const ts = tuple[0]
  // Common case: append (live rows arrive newest-last).
  const lastIdx = data.length - 1
  if (lastIdx < 0 || data[lastIdx][0] < ts) {
    data.push(tuple)
    return tuple
  }
  if (data[lastIdx][0] === ts) {
    data[lastIdx] = tuple
    return tuple
  }
  // Out-of-order ts: binary search for an exact match or insert position.
  let lo = 0
  let hi = data.length // [lo, hi)
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (data[mid][0] < ts) lo = mid + 1
    else hi = mid
  }
  if (lo < data.length && data[lo][0] === ts) { data[lo] = tuple; return tuple }
  data.splice(lo, 0, tuple)
  return tuple
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
  // Guard a malformed row: a missing candle / non-finite timestamp_ms would make
  // upsertByTs's binary search converge to 0 and splice a corrupt [undefined,...]
  // tuple at the head of the OHLCV array (poisoning every downstream ts lookup).
  // Skip such a row without bumping lastSeq (so a valid later message applies).
  if (!row || !row.candle || !Number.isFinite(row.candle.timestamp_ms)) {
    return { chart: chartDataObj, applied: false, sequence: last, reason: 'bad-timestamp' }
  }
  // Single-timeframe invariant: one subscription streams one timeframe. If a
  // caller tagged the chart-data object with its timeframe, drop foreign-tf
  // rows rather than mixing them into the same OHLCV array keyed by ts alone.
  if (chartDataObj.timeframe && row.timeframe && row.timeframe !== chartDataObj.timeframe) {
    return { chart: chartDataObj, applied: false, sequence: last, reason: 'tf-mismatch' }
  }
  // `liveCandle` is the OHLCV row now living at `ts` (the tuple just upserted).
  // Nothing below mutates chartDataObj.chart.data again, so the candle_color /
  // grouped-box / marker sections reuse this reference instead of re-scanning
  // the OHLCV array backward for arr[i][0] === ts.
  const liveCandle = upsertByTs(chartDataObj.chart.data, rowToOhlcv(row))

  // Precomputed live-tick indexes (attached by buildChartData). Membership of the
  // pane arrays is immutable post-build, so these stay valid for the object's life.
  // Absent (e.g. on a `{ ...built }` spread that drops non-enumerable props) → fall
  // back to the original full-scan functions for byte-identical behaviour.
  const overlayByKey = chartDataObj._overlayByKey || null
  const viewByInstance = chartDataObj._viewOverlaysByInstance || null

  const ts = row.candle.timestamp_ms
  const inds = row.indicators || {}
  for (const instanceKey of Object.keys(inds)) {
    const outputs = inds[instanceKey] || {}
    // Pre-filtered view overlays for this instance (the per-output
    // corkyFields.includes(output) filter is still applied below).
    const viewOvsForInstance = viewByInstance
      ? (viewByInstance.get(instanceKey) || null)
      : null
    for (const output of Object.keys(outputs)) {
      const numv = decimalToNumber(outputs[output])
      // (a) Legacy/fallback single-output overlay keyed by instanceKey.output.
      const key = instanceKey + '.' + output
      const ov = overlayByKey
        ? (overlayByKey.has(key) ? overlayByKey.get(key) : null)
        : findOverlayByKey(chartDataObj, key)
      if (ov) {
        upsertByTs(ov.data, [ts, numv])
        if (ov.raw) upsertByTs(ov.raw, [ts, outputs[output]])
      }
      // (b) view overlays consuming this field (by corkyInstance + corkyFields),
      //     writing the value into its column (multi-field Splines/Channel/Zones).
      const vovs = viewByInstance
        ? (viewOvsForInstance
            ? viewOvsForInstance.filter((vov) => vov.settings.corkyFields.includes(output))
            : [])
        : viewOverlaysFor(chartDataObj, instanceKey, output)
      for (const vov of vovs) {
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
  if (ccMeta && ccMeta.length) {
    // The OHLCV row at `ts` is the one we just upserted (always present).
    const candle = liveCandle
    for (const cc of ccMeta) {
      const vals = inds[cc.instanceKey]
      // Does THIS update actually carry the colour field(s)? A live tick that is
      // a pure price/volume refinement (or warmup with no outputs) omits them —
      // and rowToOhlcv just wiped slot 6, so we must NOT recompute a null colour
      // and clear it: that blanked previously-detected candles (the live-only
      // "colour disappears, refresh brings it back" bug). Only an update that
      // PROVIDES the field(s) is authoritative; otherwise preserve byTs.
      let hasFields, v, color
      if (cc.bullBear) {
        hasFields = !!vals &&
          (cc.bullBear.bullField in vals || cc.bullBear.bearField in vals)
        const bv = vals ? vals[cc.bullBear.bullField] : null
        const rv = vals ? vals[cc.bullBear.bearField] : null
        v = (bv != null) ? bv : rv
        color = bullBearColorOf(bv, rv, cc.bullBear)
      } else {
        hasFields = !!vals && (cc.field in vals)
        v = vals ? vals[cc.field] : null
        color = (v == null) ? null
          : (cc.palette ? paletteColorOf(v, cc.palette) : candleColorOf(v, cc.opts))
      }
      // byTs is authoritative — updated ONLY when this tick provides the
      // field(s). A null result WITH fields present (genuine clear / warmup)
      // removes the entry; a fields-LESS tick leaves the prior colour intact.
      if (hasFields) {
        if (cc.byTs) { if (color != null) cc.byTs.set(ts, color); else cc.byTs.delete(ts) }
        if (cc.byTsLabel) {
          const l = (v == null || !cc.palette) ? null : paletteLabelOf(v, cc.palette)
          if (l != null) cc.byTsLabel.set(ts, l); else cc.byTsLabel.delete(ts)
        }
      }
      // Re-stamp slot 6 (rowToOhlcv wiped it) from the AUTHORITATIVE byTs — so a
      // fields-less refinement can't blank a detected candle, and a genuine clear
      // (entry removed above) leaves it uncoloured. Active instances only.
      if (candle && ccActive && ccActive.has(cc.instanceKey)) {
        const stamp = cc.byTs ? cc.byTs.get(ts) : (color != null ? color : null)
        if (stamp != null) { while (candle.length < 9) candle.push(''); candle[6] = stamp }
      }
    }
  }

  // detection-zone boxes: the rule is re-evaluated ONLY on bar close. A new ts
  // means the previous bar's close is final — kill boxes it broke, anchor new
  // boxes from its (settled) detection flags. The FORMING bar only extends the
  // live edge provisionally; a provisional close below/above a level must
  // never retract or kill a box.
  const dbMeta = chartDataObj._detectionBoxes
  if (dbMeta && dbMeta.length) {
    const arr = chartDataObj.chart.data
    for (const db of dbMeta) {
      const vals = inds[db.instanceKey]
      const tf = db.tf || 0

      // GROUPED (MTF) layer: advance the box lifecycle per SOURCE bar. A higher
      // source tf repeats its state across base rows; box closes/anchors happen
      // when the source bar (source_timestamp_field) advances, using the source
      // candle's accumulated high/low (built from the base rows it spans).
      if (db.grouped) {
        const srcTs = vals ? Number(vals[db.rule.sourceTimestampField]) : NaN
        if (Number.isFinite(srcTs)) {
          // The OHLCV row at `ts` is the one we just upserted (always present).
          const candle = liveCandle
          // NEW source bar → the previous source bar closed: kill/anchor from it.
          if (db.lastSrcTs != null && srcTs > db.lastSrcTs && db.srcAccum &&
              (db.evaluatedThrough == null || db.lastSrcTs > db.evaluatedThrough)) {
            const closeTime = db.lastSrcTs + tf
            const acc = db.srcAccum
            for (const b of db.boxes) {
              if (!b.alive || b.t0 > db.lastSrcTs) continue
              b.t1 = closeTime
              if (b.side === 'bull' && acc.close < b.bottom) b.alive = false
              else if (b.side === 'bear' && acc.close > b.top) b.alive = false
            }
            const lv = db.lastSrcVals || {}
            if (detectionSet(lv.bull)) db.boxes.push({ side: 'bull', top: acc.high, bottom: acc.low, t0: closeTime, t1: closeTime, alive: true })
            if (detectionSet(lv.bear)) db.boxes.push({ side: 'bear', top: acc.high, bottom: acc.low, t0: closeTime, t1: closeTime, alive: true })
            if (db.boxes.length > 2048) db.boxes.splice(0, db.boxes.length - 2048)
            db.evaluatedThrough = db.lastSrcTs
          }
          // accumulate the live base candle into the (forming) source candle
          if (candle) {
            if (!db.srcAccum || db.srcAccum.ts !== srcTs) {
              db.srcAccum = { ts: srcTs, high: candle[2], low: candle[3], close: candle[4] }
            } else {
              if (candle[2] > db.srcAccum.high) db.srcAccum.high = candle[2]
              if (candle[3] < db.srcAccum.low) db.srcAccum.low = candle[3]
              db.srcAccum.close = candle[4]
            }
          }
          db.lastSrcTs = srcTs
          if (vals) db.lastSrcVals = { bull: vals[db.rule.bullField], bear: vals[db.rule.bearField] }
          for (const b of db.boxes) { if (b.alive && b.t0 <= srcTs) b.t1 = srcTs + tf }
          db.overlay.settings.zones = detectionBoxRows(db.boxes, db.rule)
        }
        continue
      }
      // NEW BAR → the bar at db.lastLiveTs just closed. Guard on
      // evaluatedThrough: the build walk already consumed the last HISTORY
      // bar's close (idempotence across the history→live seam).
      if (db.lastLiveTs != null && ts > db.lastLiveTs &&
          (db.evaluatedThrough == null || db.lastLiveTs > db.evaluatedThrough)) {
        let prev = null
        for (let i = arr.length - 1; i >= 0; i--) {
          if (arr[i][0] === db.lastLiveTs) { prev = arr[i]; break }
        }
        if (prev) {
          const closeTime = db.lastLiveTs + tf
          for (const b of db.boxes) {
            if (!b.alive || b.t0 > db.lastLiveTs) continue
            b.t1 = closeTime // the invalidating candle is still covered
            if (b.side === 'bull' && prev[4] < b.bottom) b.alive = false
            else if (b.side === 'bear' && prev[4] > b.top) b.alive = false
          }
          const lv = db.lastVals || {}
          if (detectionSet(lv.bull)) {
            db.boxes.push({ side: 'bull', top: prev[2], bottom: prev[3], t0: closeTime, t1: closeTime, alive: true })
          }
          if (detectionSet(lv.bear)) {
            db.boxes.push({ side: 'bear', top: prev[2], bottom: prev[3], t0: closeTime, t1: closeTime, alive: true })
          }
          if (db.boxes.length > 2048) db.boxes.splice(0, db.boxes.length - 2048)
        }
        db.evaluatedThrough = db.lastLiveTs
      }
      // FORMING bar: alive boxes extend to the live edge (provisional only)
      for (const b of db.boxes) {
        if (b.alive && b.t0 <= ts) b.t1 = ts + tf
      }
      db.lastLiveTs = ts
      // settle-on-close: remember the latest intrabar flag values — they are
      // the bar's FINAL values when the next bar arrives
      if (vals) {
        db.lastVals = { bull: vals[db.rule.bullField], bear: vals[db.rule.bearField] }
      }
      // regenerate the overlay rows in place (bounded by the anchor cap)
      db.overlay.settings.zones = detectionBoxRows(db.boxes, db.rule)
    }
  }

  // signed_slope_histogram overlays: recompute the bar wholesale ([ts,value,
  // color]) — slope from slope_field, else value − previous bar value, else
  // sign-only. (Excluded from the generic column-write above.) Iterate the
  // precomputed list (onchart-then-offchart) when present — usually empty, so
  // the block is skipped entirely — else fall back to a full pane scan.
  const ssOverlays = chartDataObj._ssHistograms ||
    [...(chartDataObj.onchart || []), ...(chartDataObj.offchart || [])]
  for (const ov of ssOverlays) {
      const s = ov.settings
      if (!s || s.corkyColorRule !== 'signed_slope_histogram') continue
      const oinds = inds[s.corkyInstance]
      if (!oinds || oinds[s.valueField] == null) continue
      const value = decimalToNumber(oinds[s.valueField])
      let slope = null
      if (s.slopeField && oinds[s.slopeField] != null) {
        slope = decimalToNumber(oinds[s.slopeField])
      } else {
        const d = ov.data
        if (d.length) {
          // Locate ts's position (it may be an append OR an older-ts backfill —
          // upsertByTs supports both and ts monotonicity is not enforced). The
          // previous bar's value is the element immediately before the insert
          // index; if ts inserts at the head there is no previous → sign-only.
          let lo = 0, hi = d.length
          while (lo < hi) { const m = (lo + hi) >> 1; if (d[m][0] < ts) lo = m + 1; else hi = m }
          // `lo` is the position of ts (exact match) or its insert slot; the
          // preceding bar is d[lo-1] in both cases.
          const prevVal = lo > 0 ? d[lo - 1][1] : null
          if (prevVal != null) slope = value - prevVal
        }
      }
      upsertByTs(ov.data, [ts, value, signedSlopeColor(value, slope, s.ssColors)])
      if (ov.raw) upsertByTs(ov.raw, [ts, oinds[s.valueField]])
  }

  // marker-rule overlays (e.g. SCMR reversal symbols): recompute the marker for
  // ts wholesale from the indicator value + the (now-updated) candle's anchor
  // price. A tick that resolves to no marker (0 / unknown id / no field) REMOVES
  // any marker previously placed at ts — so a transient reversal that flips back
  // to 0 on the forming bar disappears. Excluded from the generic column-write.
  // Iterate the precomputed list (onchart-then-offchart) when present — usually
  // empty, so the block is skipped — else fall back to a full pane scan.
  const markerOverlays = chartDataObj._markerRuleOverlays ||
    [...(chartDataObj.onchart || []), ...(chartDataObj.offchart || [])]
  for (const ov of markerOverlays) {
      const s = ov.settings
      if (!s || !s.corkyMarkerRule) continue
      const rule = s.corkyMarkerSpec
      const oinds = inds[s.corkyInstance]
      // Only an update that PROVIDES the value field is authoritative; a pure
      // price/volume refinement leaves the existing marker untouched.
      if (!rule || !oinds || !(rule.valueField in oinds)) continue
      const m = markerSymbolOf(oinds[rule.valueField], rule)
      if (!m) { removeByTs(ov.data, ts); if (ov.raw) removeByTs(ov.raw, ts); continue }
      // The OHLCV row at `ts` is the one we just upserted (always present).
      const candle = liveCandle
      const above = m.placement === 'above_candle'
      const y = anchorYFromCandle(candle, above ? rule.aboveAnchor : rule.belowAnchor)
      if (y == null || !Number.isFinite(Number(y))) {
        removeByTs(ov.data, ts); if (ov.raw) removeByTs(ov.raw, ts); continue
      }
      const label = (rule.labelField && rule.labelField in oinds) ? oinds[rule.labelField] : null
      upsertByTs(ov.data, [ts, Number(y), label, m.glyph, m.color, above ? 'above' : 'below'])
      if (ov.raw) upsertByTs(ov.raw, [ts, oinds[rule.valueField]])
  }

  lastSeqBySub[sub] = seq
  return { chart: chartDataObj, applied: true, sequence: seq }
}

// Remove the row at `ts` from a [ts, ...] array (markers are sparse → linear).
function removeByTs(data, ts) {
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][0] === ts) { data.splice(i, 1); return }
  }
}

// View overlays (built from view.layers) that consume `output` of `instanceKey`.
function viewOverlaysFor(chartDataObj, instanceKey, output) {
  const out = []
  for (const pane of ['onchart', 'offchart']) {
    const arr = chartDataObj[pane]
    if (!arr) continue
    for (const ov of arr) {
      const s = ov.settings
      // signed_slope histograms AND marker-rule overlays are recomputed wholesale
      // (value+slope+colour / glyph+anchor), not column-written field-by-field —
      // both are handled in applyLiveUpdate.
      if (s && s.corkyView && !s.corkyColorRule && !s.corkyMarkerRule &&
          s.corkyInstance === instanceKey &&
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
