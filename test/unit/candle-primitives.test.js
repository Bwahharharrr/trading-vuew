// Candle primitives draw math: drawCandle narrow-stroke/doji, value1/value2
// labels, color pick, fontSize clamp, drawVolbar, CandleExt parity.
//
// These are pure canvas-draw helpers: they take a 2D context and a precomputed
// `data` object and emit beginPath/moveTo/lineTo/stroke/fillRect/fillText calls.
// We feed a lightweight RECORDING context (a plain object that logs property
// assignments and method calls) so the math/branching is observable without a
// real canvas — hence this stays a pure-node test (no jsdom).
import { test, expect, describe } from 'vitest'
import { drawCandle, drawVolbar } from '../../src/components/primitives/candle-draw.js'
import CandleExt from '../../src/components/primitives/candle.js'

// A recording 2D context: assignments to styling props and every draw method
// are appended to `calls` as [name, ...args]; style props use a "name=" tag.
function recCtx() {
  const calls = []
  const c = { calls }
  for (const p of ['fillStyle', 'strokeStyle', 'font', 'textAlign', 'textBaseline']) {
    let v
    Object.defineProperty(c, p, {
      get() { return v },
      set(nv) { v = nv; calls.push([p + '=', nv]) },
    })
  }
  for (const m of ['beginPath', 'moveTo', 'lineTo', 'stroke', 'fillRect', 'fillText']) {
    c[m] = (...a) => calls.push([m, ...a])
  }
  return c
}
const get = (calls, name) => calls.filter((c) => c[0] === name)
const lastVal = (calls, name) => { const f = get(calls, name); return f.length ? f[f.length - 1][1] : undefined }

// raw layout consumed by the drawers:
//   raw[1] = open, raw[4] = close  -> green = close >= open
//   raw[6] = per-bar body color override
//   raw[7] = value1 (below), raw[8] = value2 (above)
const STYLE = {
  colorCandleUp: 'CUP', colorCandleDw: 'CDW',
  colorWickUp: 'WUP', colorWickDw: 'WDW',
  colorVolUp: 'VUP', colorVolDw: 'VDW',
}
// Helpers to build raw arrays with the right indices.
const raw = ({ open = 40, close = 50, color, v1, v2 } = {}) =>
  [0, open, 55, 60, close, 100, color ?? null, v1 ?? null, v2 ?? null]

describe('drawCandle — wide body (data.w > 1.5)', () => {
  test('emits a fillRect; green (close>=open) uses colorCandleUp, red uses colorCandleDw', () => {
    // green: raw close(50) >= open(40)
    let ctx = recCtx()
    drawCandle(ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50 }) }, STYLE)
    expect(get(ctx.calls, 'fillRect').length).toBe(1)
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('CUP')

    // red: raw close(40) < open(50)
    ctx = recCtx()
    drawCandle(ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 50, close: 40 }) }, STYLE)
    expect(get(ctx.calls, 'fillRect').length).toBe(1)
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('CDW')
  })

  test('raw[6] body-color override wins over both up/down colors', () => {
    const ctx = recCtx()
    drawCandle(ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50, color: 'BODYOVR' }) }, STYLE)
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('BODYOVR')
  })

  test('fillRect geometry: [xFloor-hw-1, data.c, hw*2+1, s*max(|o-c|,2)] with s=+1 green / -1 red', () => {
    // x=10 -> xFloor=10; w=5 -> hw=floor(2.5)=2; |o-c|=|50-45|=5, max_h=2 -> 5
    let ctx = recCtx()
    drawCandle(ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50 }) }, STYLE)
    // xFloor-hw-1 = 10-2-1 = 7 ; data.c = 45 ; hw*2+1 = 5 ; s=+1 * 5 = 5
    expect(get(ctx.calls, 'fillRect')[0]).toEqual(['fillRect', 7, 45, 5, 5])

    // red flips the sign of the height to -5
    ctx = recCtx()
    drawCandle(ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 50, close: 40 }) }, STYLE)
    expect(get(ctx.calls, 'fillRect')[0]).toEqual(['fillRect', 7, 45, 5, -5])
  })
})

describe('drawCandle — narrow body (data.w <= 1.5)', () => {
  test('no fillRect; strokes from floor(min(o,c)) to floor(max(o,c))', () => {
    const ctx = recCtx()
    // o=50.7, c=55.2 -> min floor=50, max floor=55 ; not a doji so no +1
    drawCandle(ctx, { x: 10.4, w: 1.5, o: 50.7, h: 40, l: 60, c: 55.2, raw: raw({ open: 40, close: 55 }) }, STYLE)
    expect(get(ctx.calls, 'fillRect').length).toBe(0)
    // Two beginPath strokes: wick (h->l) then body. Body is the SECOND moveTo/lineTo pair.
    const moves = get(ctx.calls, 'moveTo')
    const lines = get(ctx.calls, 'lineTo')
    expect(moves[1]).toEqual(['moveTo', 9.5, 50]) // floor(min(50.7,55.2)) = 50
    expect(lines[1]).toEqual(['lineTo', 9.5, 55]) // floor(max(50.7,55.2)) = 55, no doji bump
  })

  test('doji (o===c) bumps the lower lineTo y by +1', () => {
    const ctx = recCtx()
    drawCandle(ctx, { x: 10.7, w: 1, o: 50, h: 40, l: 60, c: 50, raw: raw({ open: 40, close: 50 }) }, STYLE)
    expect(get(ctx.calls, 'fillRect').length).toBe(0)
    const moves = get(ctx.calls, 'moveTo')
    const lines = get(ctx.calls, 'lineTo')
    expect(moves[1]).toEqual(['moveTo', 9.5, 50]) // floor(50)
    expect(lines[1]).toEqual(['lineTo', 9.5, 51]) // floor(50) + 1 (doji)
  })
})

describe('drawCandle — wick', () => {
  test('strokeStyle = colorWickUp/Dw by direction; x = floor(x)-0.5, y from hFloor to lFloor', () => {
    // green wick
    let ctx = recCtx()
    drawCandle(ctx, { x: 10.9, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50 }) }, STYLE)
    // wick strokeStyle is the FIRST strokeStyle assignment
    expect(get(ctx.calls, 'strokeStyle=')[0][1]).toBe('WUP')
    expect(get(ctx.calls, 'moveTo')[0]).toEqual(['moveTo', 9.5, 40]) // floor(10.9)-0.5=9.5, hFloor=40
    expect(get(ctx.calls, 'lineTo')[0]).toEqual(['lineTo', 9.5, 60]) // lFloor=60

    // red wick
    ctx = recCtx()
    drawCandle(ctx, { x: 10.9, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 50, close: 40 }) }, STYLE)
    expect(get(ctx.calls, 'strokeStyle=')[0][1]).toBe('WDW')
  })
})

describe('drawCandle — value labels (raw[7] below, raw[8] above)', () => {
  test('both labels: fillText at (xFloor, lFloor+3) #00FF00 and (xFloor, hFloor-3) #FF0000', () => {
    const ctx = recCtx()
    // x=10.9 -> xFloor=10 ; l=60.2 -> lFloor=60 -> +3 = 63 ; h=40.8 -> hFloor=40 -> -3 = 37
    drawCandle(ctx, { x: 10.9, w: 5, o: 50, h: 40.8, l: 60.2, c: 45, raw: raw({ open: 40, close: 50, v1: 'L1', v2: 'L2' }) }, STYLE)
    const texts = get(ctx.calls, 'fillText')
    expect(texts).toHaveLength(2)
    expect(texts[0]).toEqual(['fillText', 'L1', 10, 63])
    expect(texts[1]).toEqual(['fillText', 'L2', 10, 37])
    // color set immediately before each label
    const seq = ctx.calls.filter((c) => c[0] === 'fillStyle=' || c[0] === 'fillText')
    const i1 = seq.findIndex((c) => c[0] === 'fillText' && c[1] === 'L1')
    const i2 = seq.findIndex((c) => c[0] === 'fillText' && c[1] === 'L2')
    expect(seq[i1 - 1]).toEqual(['fillStyle=', '#00FF00'])
    expect(seq[i2 - 1]).toEqual(['fillStyle=', '#FF0000'])
  })

  test('only value1 -> one fillText below in #00FF00, no value2 text', () => {
    const ctx = recCtx()
    drawCandle(ctx, { x: 10, w: 5, o: 50, h: 40, l: 60.2, c: 45, raw: raw({ open: 40, close: 50, v1: 'ONLY1', v2: '' }) }, STYLE)
    const texts = get(ctx.calls, 'fillText')
    expect(texts).toHaveLength(1)
    expect(texts[0]).toEqual(['fillText', 'ONLY1', 10, 63])
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('#00FF00')
  })

  test('empty/undefined value1 & value2 -> NO fillText and NO font set', () => {
    const ctx = recCtx()
    drawCandle(ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50 }) }, STYLE)
    expect(get(ctx.calls, 'fillText')).toHaveLength(0)
    expect(get(ctx.calls, 'font=')).toHaveLength(0)
  })
})

describe('drawCandle — fontSize clamp (only when a label is present)', () => {
  test('tiny data.w clamps font to 8px', () => {
    const ctx = recCtx()
    // w=0.1 -> floor(0.08)=0 -> max(min(0,14),8)=8
    drawCandle(ctx, { x: 10, w: 0.1, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50, v1: 'x' }) }, STYLE)
    expect(lastVal(ctx.calls, 'font=')).toBe('8px sans-serif')
  })

  test('huge data.w clamps font to 14px', () => {
    const ctx = recCtx()
    // w=100 -> floor(80)=80 -> min(80,14)=14 -> max(14,8)=14
    drawCandle(ctx, { x: 10, w: 100, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50, v1: 'x' }) }, STYLE)
    expect(lastVal(ctx.calls, 'font=')).toBe('14px sans-serif')
  })
})

describe('drawVolbar', () => {
  test('green -> colorVolUp, red -> colorVolDw; raw[6] override wins', () => {
    // green from data.green flag (not raw direction)
    let ctx = recCtx()
    drawVolbar(ctx, { x1: 5.6, x2: 12.3, h: 20.9, green: true, raw: [] }, STYLE, 200)
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('VUP')

    ctx = recCtx()
    drawVolbar(ctx, { x1: 5.6, x2: 12.3, h: 20.9, green: false, raw: [] }, STYLE, 200)
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('VDW')

    // raw[6] override wins over both
    ctx = recCtx()
    const ovr = { ...STYLE, colorVolUp: 'OVRUP' } // override object at raw[6]
    drawVolbar(ctx, { x1: 5.6, x2: 12.3, h: 20.9, green: true, raw: [0, 0, 0, 0, 0, 0, ovr] }, STYLE, 200)
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('OVRUP')
  })

  test('fillRect: y=floor(layoutHeight - h - 0.5), height=h+1', () => {
    const ctx = recCtx()
    // x1=5.6 -> 5 ; x2-x1 = 12.3-5.6 = 6.7 -> floor 6 ; h=floor(20.9)=20
    // y = floor(200 - 20 - 0.5) = floor(179.5) = 179 ; height = 20 + 1 = 21
    drawVolbar(ctx, { x1: 5.6, x2: 12.3, h: 20.9, green: true, raw: [] }, STYLE, 200)
    expect(get(ctx.calls, 'fillRect')[0]).toEqual(['fillRect', 5, 179, 6, 21])
  })
})

describe('CandleExt.draw — parity with drawCandle (separate class code path)', () => {
  test('green/red color pick + raw[6] override match drawCandle', () => {
    // green
    let ctx = recCtx()
    new CandleExt(STYLE, ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50 }) })
    expect(get(ctx.calls, 'strokeStyle=')[0][1]).toBe('WUP') // wick
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('CUP')      // body (wide)

    // red
    ctx = recCtx()
    new CandleExt(STYLE, ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 50, close: 40 }) })
    expect(get(ctx.calls, 'strokeStyle=')[0][1]).toBe('WDW')
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('CDW')

    // raw[6] override
    ctx = recCtx()
    new CandleExt(STYLE, ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50, color: 'BODYOVR' }) })
    expect(lastVal(ctx.calls, 'fillStyle=')).toBe('BODYOVR')
  })

  test('narrow doji bumps lower lineTo by +1 (same as drawCandle)', () => {
    const ctx = recCtx()
    new CandleExt(STYLE, ctx, { x: 10.7, w: 1, o: 50, h: 40, l: 60, c: 50, raw: raw({ open: 40, close: 50 }) })
    expect(get(ctx.calls, 'fillRect').length).toBe(0)
    const moves = get(ctx.calls, 'moveTo')
    const lines = get(ctx.calls, 'lineTo')
    expect(moves[1]).toEqual(['moveTo', 9.5, 50])
    expect(lines[1]).toEqual(['lineTo', 9.5, 51]) // doji +1
  })

  test('value labels: L1 at (xFloor, lFloor+3) #00FF00, L2 at (xFloor, hFloor-3) #FF0000', () => {
    const ctx = recCtx()
    new CandleExt(STYLE, ctx, { x: 10.9, w: 5, o: 50, h: 40.8, l: 60.2, c: 45, raw: raw({ open: 40, close: 50, v1: 'L1', v2: 'L2' }) })
    const texts = get(ctx.calls, 'fillText')
    expect(texts).toHaveLength(2)
    expect(texts[0]).toEqual(['fillText', 'L1', 10, 63]) // lFloor(60)+3
    expect(texts[1]).toEqual(['fillText', 'L2', 10, 37]) // hFloor(40)-3
  })

  test('CandleExt ALWAYS sets font (no label-guard, unlike drawCandle)', () => {
    // This is the one intentional divergence in the parity path: CandleExt sets
    // font/textAlign unconditionally even when there are no labels.
    const ctx = recCtx()
    new CandleExt(STYLE, ctx, { x: 10, w: 5, o: 50, h: 40, l: 60, c: 45, raw: raw({ open: 40, close: 50 }) })
    expect(lastVal(ctx.calls, 'font=')).toBe('8px sans-serif')
    expect(get(ctx.calls, 'fillText')).toHaveLength(0)
  })
})
