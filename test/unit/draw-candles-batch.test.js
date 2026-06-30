// Batched candle renderer (drawCandles) — color-batching + label z-order.
//
// drawCandles is the array-level fast path: it groups candles by RESOLVED colour
// and emits one state-set + one path per colour (vs drawCandle's per-candle set),
// then draws all value labels LAST so they stay above every neighbour's body.
// The visual golden proves PIXEL equality for the no-label, 2-colour case; this
// pins the two behaviours the golden's data doesn't exercise: the batching floor
// (style assignments == distinct colours, not == N) and the labels-on-top order.
import { test, expect, describe } from 'vitest'
import { drawCandles } from '../../src/components/primitives/candle-draw.js'

// Recording 2D context: logs every op + every style assignment IN ORDER.
function recCtx() {
  const ops = []
  const ctx = {
    ops,
    beginPath() { ops.push({ op: 'beginPath' }) },
    moveTo() { ops.push({ op: 'moveTo' }) },
    lineTo() { ops.push({ op: 'lineTo' }) },
    stroke() { ops.push({ op: 'stroke' }) },
    fillRect() { ops.push({ op: 'fillRect' }) },
    fillText() { ops.push({ op: 'fillText' }) },
  }
  let _fill = '', _stroke = ''
  Object.defineProperty(ctx, 'fillStyle', { get: () => _fill, set(v) { _fill = v; ops.push({ op: 'fillStyle', v }) } })
  Object.defineProperty(ctx, 'strokeStyle', { get: () => _stroke, set(v) { _stroke = v; ops.push({ op: 'strokeStyle', v }) } })
  Object.defineProperty(ctx, 'font', { get: () => '', set() {} })
  Object.defineProperty(ctx, 'textAlign', { get: () => '', set() {} })
  Object.defineProperty(ctx, 'textBaseline', { get: () => '', set() {} })
  return ctx
}

// Wide-body candle ({x,w,o,h,l,c,raw}); raw drives green/red + label fields.
function candle(x, green, label) {
  const raw = green
    ? [0, 100, 110, 90, 105, 1000]   // c>=o → green
    : [0, 105, 110, 90, 100, 1000]   // c<o  → red
  if (label) { raw[7] = label }
  return { x, w: 4, o: 200, h: 140, l: 210, c: 150, raw }
}

const overlay = { colorCandleUp: '#23a776', colorCandleDw: '#e54150', colorWickUp: '#23a776', colorWickDw: '#e54150' }

describe('drawCandles — color batching', () => {
  test('style is assigned once per distinct colour, not once per candle', () => {
    const ctx = recCtx()
    // 6 wide candles, 3 green + 3 red → 2 wick colours + 2 body colours.
    const candles = [true, false, true, false, true, false].map((g, i) => candle(i * 10, g))
    drawCandles(ctx, candles, overlay)

    const strokeAssigns = ctx.ops.filter((o) => o.op === 'strokeStyle')
    const fillAssigns = ctx.ops.filter((o) => o.op === 'fillStyle')
    // Wicks: one strokeStyle per distinct wick colour (2), NOT 6.
    expect(strokeAssigns).toHaveLength(2)
    // Wide bodies: one fillStyle per distinct body colour (2), NOT 6.
    expect(fillAssigns).toHaveLength(2)
    // Still 6 bodies actually filled.
    expect(ctx.ops.filter((o) => o.op === 'fillRect')).toHaveLength(6)
  })
})

describe('drawCandles — label z-order', () => {
  test('all value labels draw AFTER every body/wick (on top of neighbours)', () => {
    const ctx = recCtx()
    // Labels on the FIRST and a MIDDLE candle — in the per-candle loop a later
    // candle would occlude them; batched, every label must land after all bodies.
    const candles = [candle(0, true, 'A'), candle(10, false), candle(20, true, 'B'), candle(30, false)]
    drawCandles(ctx, candles, overlay)

    const firstLabel = ctx.ops.findIndex((o) => o.op === 'fillText')
    const lastBody = ctx.ops.map((o) => o.op).lastIndexOf('fillRect')
    const lastWick = ctx.ops.map((o) => o.op).lastIndexOf('stroke')
    expect(firstLabel).toBeGreaterThan(-1)
    expect(firstLabel).toBeGreaterThan(lastBody)   // labels after the last body
    expect(firstLabel).toBeGreaterThan(lastWick)   // …and after the last wick
    expect(ctx.ops.filter((o) => o.op === 'fillText')).toHaveLength(2)   // both labels drawn
  })
})
