// Pins the detached-volume rendering fixes:
//   - Volume.vue y_range: detached pane is 0-based + flush (no expand) so the
//     '0' axis label sits at the pane bottom and bars scale with the Y-axis.
//   - layout_vol: emits $2screen-mapped yTop/y0 ONLY for the offchart pane, so a
//     Y-axis drag rescales the bars; the candle-pane `h` field is untouched.
//   - volbar.js: draws between yTop/y0 when present, else the glued fallback
//     (byte-identical to the golden path).
//   - colorVol* fall back to the modal's colorUp/colorDown keys.
//   - draw() dispatches Spline/StepLine to the line renderer.
import { test, expect, describe } from 'vitest'
import Volume from '../../src/components/overlays/Volume.vue'
import VolbarExt from '../../src/components/primitives/volbar.js'
import { layout_vol } from '../../src/components/js/layout_cnv.js'

// 6-col OHLCV: [t, o, h, l, c, v]
const OHLCV = [
  [0, 10, 12, 9, 11, 100],
  [1, 11, 13, 10, 12, 250],
  [2, 12, 14, 11, 10, 175],
]

function recCtx() {
  const calls = []
  return {
    _fill: null,
    set fillStyle(v) { this._fill = v },
    get fillStyle() { return this._fill },
    fillRect: (...a) => calls.push(a),
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
    calls,
  }
}

describe('Volume.vue y_range', () => {
  test('detached pane (grid_id > 0): [maxVol, 0, false] — 0 flush at bottom', () => {
    const ctx = { $props: { sub: OHLCV, grid_id: 1 } }
    const r = Volume.methods.y_range.call(ctx, 999, -999)
    expect(r).toEqual([250, 0, false])
  })

  test('detached pane applies volscale headroom at the top, 0 still flush', () => {
    const ctx = { $props: { sub: OHLCV, grid_id: 1 }, volscale: 0.85 }
    const r = Volume.methods.y_range.call(ctx, 0, 0)
    expect(r[1]).toBe(0)            // bottom flush at 0
    expect(r[2]).toBe(false)       // no EXPAND padding
    expect(r[0]).toBeCloseTo(250 / 0.85) // ~15% headroom above the tallest bar
  })

  test('candle pane (grid_id 0, OHLCV): [maxVol, minVol] — unchanged legacy', () => {
    const ctx = { $props: { sub: OHLCV, grid_id: 0 } }
    const r = Volume.methods.y_range.call(ctx, 999, -999)
    expect(r).toEqual([250, 100])
  })

  test('range is correct on the FIRST build (does not depend on draw-time _i1)', () => {
    // _i1 is only set during layout_vol() at draw time; y_range must detect the
    // volume column from data width itself.
    const ctx = { $props: { sub: OHLCV, grid_id: 1 } } // no _i1
    expect(Volume.methods.y_range.call(ctx, 0, 0)).toEqual([250, 0, false])
  })
})

describe('Volume.vue colour fallbacks', () => {
  test('colorVolUp accepts the modal colorUp key, then theme', () => {
    const up = Volume.computed.colorVolUp.call({
      sett: { colorUp: '#abcdef' }, $props: { colors: { volUp: '#000000' } },
    })
    expect(up).toBe('#abcdef')
    const themed = Volume.computed.colorVolUp.call({
      sett: {}, $props: { colors: { volUp: '#123456' } },
    })
    expect(themed).toBe('#123456')
  })
})

describe('Volume.vue draw() style dispatch', () => {
  test('Spline/StepLine route to the line renderer (never bars)', () => {
    for (const style of ['Spline', 'StepLine']) {
      let lineArgs = null
      const ctx = recCtx()
      const self = { sett: { style }, draw_line: (c, s) => { lineArgs = [c, s] } }
      Volume.methods.draw.call(self, ctx)
      expect(lineArgs).toEqual([ctx, style])
      // No bars drawn on the line path.
      expect(ctx.calls.length).toBe(0)
    }
  })
})

describe('layout_vol offchart geometry', () => {
  const layout = {
    height: 200,
    px_step: 10,
    ti_map: {},
    t2screen: (t) => t * 10,
    // value -> screen (0 at the bottom of a 200px pane, max at top)
    $2screen: (v) => 200 - (v / 250) * 200,
  }

  test('grid_id > 0: emits $2screen-mapped yTop + shared y0 baseline', () => {
    const self = { $props: { sub: OHLCV, data: OHLCV, layout, grid_id: 1, interval: 1, config: { VOLSCALE: 0.15 } } }
    const vol = layout_vol(self)
    expect(self._i1).toBe(5) // detected volume column
    expect(vol[0].y0).toBeCloseTo(200)            // value 0 -> bottom
    expect(vol[1].yTop).toBeCloseTo(0)            // max vol (250) -> top
    expect(vol[0].yTop).toBeCloseTo(200 - (100 / 250) * 200)
  })

  test('grid_id 0: no yTop/y0 (candle-pane glued path stays via h)', () => {
    const self = { $props: { sub: OHLCV, data: OHLCV, layout, grid_id: 0, interval: 1, config: { VOLSCALE: 0.15 } } }
    const vol = layout_vol(self)
    expect(vol[0].yTop).toBeUndefined()
    expect(vol[0].y0).toBeUndefined()
    expect(vol[0].h).toBeGreaterThan(0) // glued height still emitted
  })
})

describe('VolbarExt draw paths', () => {
  const overlay = { colorVolUp: '#23a776', colorVolDw: '#e54150', $props: { layout: { height: 200 } } }

  test('offchart: fills between yTop and y0 (rescales with the axis)', () => {
    const ctx = recCtx()
    new VolbarExt(overlay, ctx, { raw: OHLCV[0], x1: 10, x2: 20, yTop: 30, y0: 100, green: true })
    expect(ctx._fill).toBe('#23a776')           // solid up colour
    expect(ctx.calls[0]).toEqual([10, 30, 10, 70]) // x, top=min(30,100), w, h=|100-30|
  })

  test('offchart: zero-height bar clamps to >= 1px (stays visible)', () => {
    const ctx = recCtx()
    new VolbarExt(overlay, ctx, { raw: OHLCV[0], x1: 0, x2: 4, yTop: 50, y0: 50, green: false })
    expect(ctx.calls[0][3]).toBe(1)
  })

  test('glued fallback (no yTop/y0) is byte-identical to the golden path', () => {
    const ctx = recCtx()
    new VolbarExt(overlay, ctx, { raw: OHLCV[0], x1: 10, x2: 20, h: 50, green: true })
    // y0 = height(200) - floor(h)(50) - 0.5 -> floor 149 ; h -> floor(51)
    expect(ctx.calls[0]).toEqual([10, 149, 10, 51])
  })
})
