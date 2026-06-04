// Visual-regression harness.
//
// Rasterises the REAL candle/volume drawing primitives
// (src/components/primitives/{candle,volbar}.js) onto a headless skia-canvas
// with a fixed, deterministic screen layout, then reduces the framebuffer to a
// stable pixel signature. This is the pixel-level safety net the Phase 3
// RenderEngine extraction must preserve — pulled into Phase 1 (per review) so
// the riskiest visual refactor lands with a baseline, not after one.
import { Canvas } from 'skia-canvas'
import CandleExt from '../../src/components/primitives/candle.js'
import VolbarExt from '../../src/components/primitives/volbar.js'

const BG = '#141823'

// Default overlay style (the trading-vue dark theme defaults).
const STYLE = {
  colorCandleUp: '#23a776',
  colorCandleDw: '#e54150',
  colorWickUp: '#23a776',
  colorWickDw: '#e54150',
  colorVolUp: '#23a77642',
  colorVolDw: '#e5415042',
}

// Render `candles` ([t,o,h,l,c,v][]) into a width×height canvas using a simple
// deterministic price→screen mapping. Returns { canvas, ctx, width, height }.
export function renderCandles(candles, opts = {}) {
  const width = opts.width || 800
  const height = opts.height || 400
  const pad = 12
  const volPaneH = 90
  const priceH = height - volPaneH

  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, width, height)

  const lows = candles.map((c) => c[3])
  const highs = candles.map((c) => c[2])
  const pMin = Math.min(...lows)
  const pMax = Math.max(...highs)
  const vMax = Math.max(...candles.map((c) => c[5]))
  const n = candles.length
  const step = width / n
  const w = step * 0.7

  const y = (p) => pad + ((pMax - p) / (pMax - pMin)) * (priceH - 2 * pad)

  const overlay = { ...STYLE, $props: { layout: { height } } }

  for (let i = 0; i < n; i++) {
    const raw = candles[i]
    const cx = i * step + step / 2
    const data = {
      raw,
      x: cx,
      w,
      o: y(raw[1]),
      h: y(raw[2]),
      l: y(raw[3]),
      c: y(raw[4]),
    }
    new CandleExt(overlay, ctx, data)

    // Volume bar in the bottom pane.
    const vh = (raw[5] / vMax) * (volPaneH - 6)
    new VolbarExt(overlay, ctx, {
      raw,
      x1: cx - w / 2,
      x2: cx + w / 2,
      h: vh,
      green: raw[4] >= raw[1],
    })
  }

  return { canvas, ctx, width, height }
}

// Reduce the framebuffer to a deterministic, snapshot-friendly signature:
//  - a coarse sampled grid of packed RGBA hex (solid regions are stable),
//  - the count of non-background pixels (overall coverage),
//  - per-channel coarse colour histogram buckets.
// Robust to sub-pixel AA jitter on the sampled grid while still catching any
// geometry/colour change in the draw primitives.
export function pixelSignature(ctx, width, height, gridStep = 16) {
  const img = ctx.getImageData(0, 0, width, height).data
  const bg = [0x14, 0x18, 0x23]

  const grid = []
  for (let yy = gridStep >> 1; yy < height; yy += gridStep) {
    let row = ''
    for (let xx = gridStep >> 1; xx < width; xx += gridStep) {
      const o = (yy * width + xx) * 4
      row += packHex(img[o], img[o + 1], img[o + 2])
      row += ' '
    }
    grid.push(row.trim())
  }

  let coverage = 0
  let greenish = 0
  let reddish = 0
  for (let i = 0; i < img.length; i += 4) {
    const r = img[i]
    const g = img[i + 1]
    const b = img[i + 2]
    if (Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]) > 12) {
      coverage++
      if (g > r && g > b) greenish++
      else if (r > g && r > b) reddish++
    }
  }

  return {
    width,
    height,
    // Bucket coverage to the nearest 25px to absorb AA jitter on wick edges.
    coverageBucket: Math.round(coverage / 25) * 25,
    greenBucket: Math.round(greenish / 25) * 25,
    redBucket: Math.round(reddish / 25) * 25,
    grid,
  }
}

function packHex(r, g, b) {
  return (
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  )
}
