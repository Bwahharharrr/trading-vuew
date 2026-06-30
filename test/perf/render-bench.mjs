#!/usr/bin/env node
// Deterministic render micro-benchmark for the candle draw path.
//
// Run with:  node test/perf/render-bench.mjs   (writes test/perf/after.json)
//
// PRIMARY SIGNAL = deterministic COUNTERS captured with a counting mock 2D ctx
// (byte-stable across runs/machines); wall-clock is a noisy secondary. It measures
// the two hot paths this work optimized, on the REAL runtime path Candles.vue +
// the visual golden now use:
//   A. CANDLE DRAW COST — per-frame ctx ops + style assignments from the batched
//      drawCandles/drawVolbars (one state-set + one path per colour).
//   B. INDICATOR-PANE ALLOC COST — layout_cnv_cached driven with a shared caller-
//      owned cache (exactly Candles.vue's this._cnvCache); the 2nd identical call
//      is a cache HIT → 0 rebuild.
// The legacy per-item drawCandle/drawVolbar + uncached layout_cnv are still
// imported only for a same-machine A/B. baseline.json holds the PRE-optimization
// numbers (legacy path); this harness writes after.json and prints the delta.
//
// STABILITY CONTRACT: counter definitions + fixed inputs are FROZEN — only the
// measured src files move between baseline and now, or the delta is meaningless.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// CHANGED PATH: batched runtime primitives + cached layout wrapper (what
// Candles.vue now calls). Legacy per-item fns kept for the same-machine A/B.
import {
  drawCandle, drawVolbar,        // legacy per-item (baseline path, A/B only)
  drawCandles, drawVolbars,      // batched runtime path (the optimization)
} from '../../src/components/primitives/candle-draw.js'
import { layout_cnv, layout_cnv_cached } from '../../src/components/js/layout_cnv.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Fixed, deterministic inputs (DO NOT TUNE — identical to render-bench.mjs).
// ---------------------------------------------------------------------------
const N = 1000               // visible candle count
const INTERVAL = 60_000      // 1-minute bars (ms)
const HEIGHT = 400           // layout pixel height
const PX_STEP = 6            // px per bar  -> candle body width 3.6px (> 1.5 => fillRect body path)
const CANDLEW = 0.6
const VOLSCALE = 0.15
const OVERRIDE_COLOR = '#ffaa00' // per-candle raw[6] color override
const OVERRIDE_EVERY = 50         // 20 of 1000 candles carry an override

const STYLE = {
  colorCandleUp: '#23a776',
  colorCandleDw: '#e54150',
  colorWickUp: '#23a776',
  colorWickDw: '#e54150',
  colorVolUp: '#23a77642',
  colorVolDw: '#e5415042',
}

function buildSeries(n) {
  const sub = []
  for (let i = 0; i < n; i++) {
    const t = i * INTERVAL
    const up = i % 2 === 0
    const o = 100 + (i % 20)
    const c = up ? o + 2 : o - 2
    const h = Math.max(o, c) + 1
    const l = Math.min(o, c) - 1
    const v = 1000 + (i % 100)
    const row = [t, o, h, l, c, v]
    if (i % OVERRIDE_EVERY === 0) row[6] = OVERRIDE_COLOR
    sub.push(row)
  }
  return sub
}

function buildSelf(sub) {
  const t0 = sub[0][0]
  return {
    $props: {
      data: sub,
      interval: INTERVAL,
      tf: undefined,
      config: { VOLSCALE, CANDLEW },
      layout: {
        height: HEIGHT,
        px_step: PX_STEP,
        t2screen: (t) => ((t - t0) / INTERVAL) * PX_STEP,
        A: -2,
        B: 600,
        ti_map: { ib: false, tf: INTERVAL },
      },
    },
  }
}

// Counting mock 2D context — IDENTICAL to render-bench.mjs.
function makeCountingCtx() {
  const counts = {
    beginPath: 0, moveTo: 0, lineTo: 0, stroke: 0, fill: 0,
    fillRect: 0, fillText: 0,
    fillStyleAssign: 0, strokeStyleAssign: 0,
  }
  const styleStates = new Set()
  let _fill, _stroke
  return {
    counts, styleStates,
    beginPath() { counts.beginPath++ },
    moveTo() { counts.moveTo++ },
    lineTo() { counts.lineTo++ },
    stroke() { counts.stroke++ },
    fill() { counts.fill++ },
    fillRect() { counts.fillRect++ },
    fillText() { counts.fillText++ },
    font: '', textAlign: '', textBaseline: '',
    get fillStyle() { return _fill },
    set fillStyle(v) { _fill = v; counts.fillStyleAssign++; styleStates.add('f:' + v) },
    get strokeStyle() { return _stroke },
    set strokeStyle(v) { _stroke = v; counts.strokeStyleAssign++; styleStates.add('s:' + v) },
  }
}

function makeNoopCtx() {
  return {
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {},
    fillRect() {}, fillText() {},
    font: '', textAlign: '', textBaseline: '',
    get fillStyle() { return '' }, set fillStyle(_v) {},
    get strokeStyle() { return '' }, set strokeStyle(_v) {},
  }
}

// One Candles.vue frame — BATCHED path (what the runtime now draws):
// volume first (show_volume default true), then candles.
function drawFrame(ctx, cnv, style, layoutHeight) {
  drawVolbars(ctx, cnv.volume, style, layoutHeight)
  drawCandles(ctx, cnv.candles, style)
}

// LEGACY per-item frame — kept ONLY for the same-machine wall-clock A/B.
function drawFrameLegacy(ctx, cnv, style, layoutHeight) {
  const cv = cnv.volume
  for (let i = 0, n = cv.length; i < n; i++) drawVolbar(ctx, cv[i], style, layoutHeight)
  const cc = cnv.candles
  for (let i = 0, n = cc.length; i < n; i++) drawCandle(ctx, cc[i], style)
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// ---------------------------------------------------------------------------
// A. CANDLE DRAW COST (deterministic counters + wall-clock) — BATCHED path
// ---------------------------------------------------------------------------
function benchCandleDraw() {
  const sub = buildSeries(N)
  const self = buildSelf(sub)
  const cnv = layout_cnv(self)   // geometry prep (not measured), identical input

  const ctx = makeCountingCtx()
  drawFrame(ctx, cnv, STYLE, HEIGHT)
  const c = ctx.counts
  const opsPerFrame =
    c.beginPath + c.moveTo + c.lineTo + c.stroke + c.fill + c.fillRect
  const styleAssignmentsPerFrame = c.fillStyleAssign + c.strokeStyleAssign
  const minStyleAssignments = ctx.styleStates.size

  // wall-clock (secondary) — same ITERS/RUNS/warmup as baseline harness.
  const noop = makeNoopCtx()
  const ITERS = 50
  const RUNS = 7
  for (let k = 0; k < 20; k++) drawFrame(noop, cnv, STYLE, HEIGHT)
  const runs = []
  for (let r = 0; r < RUNS; r++) {
    const t0 = process.hrtime.bigint()
    for (let k = 0; k < ITERS; k++) drawFrame(noop, cnv, STYLE, HEIGHT)
    const t1 = process.hrtime.bigint()
    runs.push(Number(t1 - t0) / 1e6 / ITERS)
  }

  // same-machine LEGACY wall-clock A/B (identical warmup/iters/runs)
  for (let k = 0; k < 20; k++) drawFrameLegacy(noop, cnv, STYLE, HEIGHT)
  const legacyRuns = []
  for (let r = 0; r < RUNS; r++) {
    const t0 = process.hrtime.bigint()
    for (let k = 0; k < ITERS; k++) drawFrameLegacy(noop, cnv, STYLE, HEIGHT)
    const t1 = process.hrtime.bigint()
    legacyRuns.push(Number(t1 - t0) / 1e6 / ITERS)
  }

  return {
    candleCount: N,
    opsPerFrame,
    styleAssignmentsPerFrame,
    minStyleAssignments,
    wallClockMsMedian: median(runs),
    legacyWallClockMsMedian: median(legacyRuns),
    counts: c,
    distinctStyleStates: [...ctx.styleStates].sort(),
    timing: { iters: ITERS, runs, legacyRuns },
  }
}

// ---------------------------------------------------------------------------
// B. INDICATOR-PANE ALLOC COST — CACHED path (layout_cnv_cached, shared cache)
// ---------------------------------------------------------------------------
function benchIndicatorPaneAlloc() {
  const sub = buildSeries(N)
  const self = buildSelf(sub)

  // Caller-owned cache, exactly like Candles.vue's this._cnvCache.
  const cache = { key: '', val: null }

  // Call TWICE with identical inputs through the cached wrapper.
  const r1 = layout_cnv_cached(self, cache)   // 1st: builds, allocates 2*N
  const r2 = layout_cnv_cached(self, cache)   // 2nd: cache HIT, same arrays

  const objectsPerCall = r1.candles.length + r1.volume.length      // 2*N (built once)

  if (objectsPerCall !== 2 * N) {
    throw new Error(`layout_cnv alloc mismatch: ${objectsPerCall} !== ${2 * N}`)
  }

  // Cache proof: 2nd call returns the SAME arrays + objects (no rebuild).
  const rebuiltNoCache =
    r1.candles !== r2.candles &&
    r1.volume !== r2.volume &&
    r1.candles[0] !== r2.candles[0] &&
    r1.volume[0] !== r2.volume[0]
  const cacheHits = rebuiltNoCache ? 0 : 1
  // NEW objects allocated on the REPEAT (2nd) call — counted ONLY if rebuilt
  // (same semantics as the baseline's objectsPerCall2: it was a fresh 2*N array
  // there because there was no cache; here a hit means 0 new objects).
  const objectsRepeatCall = rebuiltNoCache ? (r2.candles.length + r2.volume.length) : 0
  const objectsTwoCalls = objectsPerCall + objectsRepeatCall        // 2*N on a hit

  // wall-clock (secondary): steady-state per-frame cost = a cache HIT. Warm the
  // cache, then time layout_cnv_cached with the SAME warm cache (matching key).
  const ITERS = 50
  const RUNS = 7
  for (let k = 0; k < 20; k++) layout_cnv_cached(self, cache) // warm (all hits)
  const runs = []
  for (let r = 0; r < RUNS; r++) {
    const t0 = process.hrtime.bigint()
    for (let k = 0; k < ITERS; k++) layout_cnv_cached(self, cache)
    const t1 = process.hrtime.bigint()
    runs.push(Number(t1 - t0) / 1e6 / ITERS)
  }

  // same-machine LEGACY wall-clock A/B: uncached layout_cnv (full rebuild/call).
  for (let k = 0; k < 20; k++) layout_cnv(self)
  const legacyRuns = []
  for (let r = 0; r < RUNS; r++) {
    const t0 = process.hrtime.bigint()
    for (let k = 0; k < ITERS; k++) layout_cnv(self)
    const t1 = process.hrtime.bigint()
    legacyRuns.push(Number(t1 - t0) / 1e6 / ITERS)
  }

  return {
    barCount: N,
    objectsPerCall,
    objectsRepeatCall,
    objectsTwoCalls,
    cacheHits,
    rebuiltNoCache,
    wallClockMsMedian: median(runs),
    legacyWallClockMsMedian: median(legacyRuns),
    timing: { iters: ITERS, runs, legacyRuns },
  }
}

function round(x, dp = 4) {
  const f = 10 ** dp
  return Math.round(x * f) / f
}

function main() {
  const a = benchCandleDraw()
  const b = benchIndicatorPaneAlloc()

  const metrics = [
    { name: 'candle_count', value: a.candleCount, unit: 'candles', scenario: 'candle_draw' },
    { name: 'ctx_ops_per_frame', value: a.opsPerFrame, unit: 'ops', scenario: 'candle_draw' },
    { name: 'style_assignments_per_frame', value: a.styleAssignmentsPerFrame, unit: 'assignments', scenario: 'candle_draw' },
    { name: 'min_style_assignments_per_frame', value: a.minStyleAssignments, unit: 'assignments', scenario: 'candle_draw' },
    { name: 'draw_wall_clock', value: round(a.wallClockMsMedian), unit: 'ms', scenario: 'candle_draw' },
    { name: 'bar_count', value: b.barCount, unit: 'bars', scenario: 'indicator_pane_alloc' },
    { name: 'objects_per_call', value: b.objectsPerCall, unit: 'objects', scenario: 'indicator_pane_alloc' },
    { name: 'objects_two_calls', value: b.objectsTwoCalls, unit: 'objects', scenario: 'indicator_pane_alloc' },
    { name: 'cache_hits', value: b.cacheHits, unit: 'hits', scenario: 'indicator_pane_alloc' },
    { name: 'layout_cnv_wall_clock', value: round(b.wallClockMsMedian), unit: 'ms', scenario: 'indicator_pane_alloc' },
  ]

  const after = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    harness: 'test/perf/render-bench-after.mjs (path-tweak of render-bench.mjs)',
    config: { N, INTERVAL, HEIGHT, PX_STEP, CANDLEW, VOLSCALE, OVERRIDE_COLOR, OVERRIDE_EVERY },
    metrics,
    details: { candle_draw: a, indicator_pane_alloc: b },
  }

  const outPath = join(__dirname, 'after.json')
  writeFileSync(outPath, JSON.stringify(after, null, 2) + '\n')

  console.log('=== render-bench AFTER (batched draw + cached layout) ===')
  console.log('node', process.version)
  console.log('\n[A] CANDLE DRAW COST  (N=%d candles + %d volume bars / frame)', N, N)
  console.log('  ctx ops / frame            :', a.opsPerFrame)
  console.log('  style assignments / frame  :', a.styleAssignmentsPerFrame,
    '   (', a.counts.strokeStyleAssign, 'stroke +', a.counts.fillStyleAssign, 'fill )')
  console.log('  distinct style states      :', a.minStyleAssignments,
    '  <- batching floor:', a.distinctStyleStates.join(' '))
  console.log('  op breakdown               :',
    `beginPath=${a.counts.beginPath} moveTo=${a.counts.moveTo} lineTo=${a.counts.lineTo}`,
    `stroke=${a.counts.stroke} fillRect=${a.counts.fillRect} fill=${a.counts.fill} fillText=${a.counts.fillText}`)
  console.log('  wall-clock / frame (median):', round(a.wallClockMsMedian), 'ms',
    '  (legacy same-machine:', round(a.legacyWallClockMsMedian), 'ms )')

  console.log('\n[B] INDICATOR-PANE ALLOC COST  (layout_cnv_cached, N=%d bars, called twice)', N)
  console.log('  objects / call             :', b.objectsPerCall, '(= 2*N, built once)')
  console.log('  NEW objects on repeat call :', b.objectsRepeatCall, '(cache hit => 0)')
  console.log('  objects across 2 calls     :', b.objectsTwoCalls)
  console.log('  cache hits on 2nd call     :', b.cacheHits, '(rebuiltNoCache =', b.rebuiltNoCache, ')')
  console.log('  wall-clock / call (median) :', round(b.wallClockMsMedian), 'ms',
    '  (legacy same-machine:', round(b.legacyWallClockMsMedian), 'ms )')

  console.log('\nwrote', outPath)
  return { metrics, outPath }
}

main()
