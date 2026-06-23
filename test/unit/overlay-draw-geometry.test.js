// Overlay draw geometry: pins the pure draw()/legend()/computed geometry of the
// canvas overlays (Volume line+legend, Zones column-order, Trades legend, Markers
// shapes, Bar/Range/StepLine, the bar-chart-base & canvas-drawing mixins, volbar).
//
// All overlay methods are pure given a fake `this` (sett/$props/computed values)
// and a recording 2D context — so they run in plain node (no jsdom). We invoke
// them with Component.methods.x.call(self, ...) / .computed.x.call(self) exactly
// like the existing test/unit/volume-overlay.test.js. No DOM, no timers, no net.
import { describe, it, expect } from 'vitest'
import Volume from '../../src/components/overlays/Volume.vue'
import Zones from '../../src/components/overlays/Zones.vue'
import Trades from '../../src/components/overlays/Trades.vue'
import Markers from '../../src/components/overlays/Markers.vue'
import Bar from '../../src/components/overlays/Bar.vue'
import Range from '../../src/components/overlays/Range.vue'
import StepLine from '../../src/components/overlays/StepLine.vue'
import BarChartBase from '../../src/mixins/bar-chart-base.js'
import CanvasDrawing from '../../src/mixins/canvas-drawing.js'
import VolbarExt from '../../src/components/primitives/volbar.js'

// Recording 2D context: every drawing call is appended to `ops` as
// [name, ...args], and the latest fill/stroke/lineJoin/lineWidth styles are
// readable so we can assert state at the moment of a fill/stroke.
function recCtx() {
  const ops = []
  const ctx = {
    ops,
    fillStyle: null,
    strokeStyle: null,
    lineWidth: null,
    lineJoin: null,
    font: null,
    textAlign: null,
    textBaseline: null,
  }
  const rec = (name) => (...a) => ops.push([name, ...a])
  for (const m of ['beginPath', 'moveTo', 'lineTo', 'rect', 'arc', 'closePath',
    'fill', 'stroke', 'fillRect', 'fillText', 'setLineDash']) {
    ctx[m] = rec(m)
  }
  return ctx
}
const names = (ctx) => ctx.ops.map((o) => o[0])
const opsNamed = (ctx, name) => ctx.ops.filter((o) => o[0] === name)

// A linear layout: t2screen=t*10, $2screen(v)=200-v (so price 0 -> y200, top up).
function makeLayout(over = {}) {
  return {
    width: 500,
    height: 200,
    px_step: 10,
    t2screen: (t) => t * 10,
    $2screen: (v) => 200 - v,
    ...over,
  }
}

// Bind the real computed getters of a component onto `self` so methods that read
// `this.color`, `this.sett`, etc. work as in a live instance. Also copy the
// component's own methods so a draw() that calls a sibling method (e.g.
// Zones._drawZone) resolves on `this`.
function withComputed(Comp, self) {
  const m = Comp.methods || {}
  for (const k of Object.keys(m)) {
    if (!(k in self)) self[k] = m[k]
  }
  const c = Comp.computed || {}
  for (const k of Object.keys(c)) {
    Object.defineProperty(self, k, { get() { return c[k].call(self) }, configurable: true })
  }
  // overlay.js provides `sett` as settings||{}; replicate it.
  if (!('sett' in self)) {
    Object.defineProperty(self, 'sett', {
      get() { return (this.$props && this.$props.settings) || {} }, configurable: true,
    })
  }
  return self
}

// 6-col OHLCV: [t, o, h, l, c, v]
const OHLCV = [
  [0, 10, 12, 9, 11, 100],  // close>open  -> up
  [1, 11, 13, 10, 12, 250],
  [2, 12, 14, 11, 9, 175],  // close<open  -> down
]
// 3-col series: [t, value, flag]
const SERIES3 = [
  [0, 5, 1],
  [1, 7, 0],
  [2, 6, 1],
]

// ───────────────────────────── Volume draw_line ─────────────────────────────
describe('Volume.draw_line', () => {
  it("'StepLine' on 6-col OHLCV sets _i1=5 and stair-draws the volume column", () => {
    const ctx = recCtx()
    const self = withComputed(Volume, {
      $props: { sub: OHLCV, settings: {}, colors: {} },
      ...CanvasDrawing.methods,
    })
    self.$props.layout = makeLayout()
    Volume.methods.draw_line.call(self, ctx, 'StepLine')

    expect(self._i1).toBe(5)
    expect(ctx.lineJoin).toBe('round')
    expect(ctx.lineWidth).toBe(1.0)               // no sett.lineWidth -> 1.0
    expect(ctx.strokeStyle).toBe(self.colorVolUp)
    // StepLine dispatch: a moveTo to the first point then stair lineTo pairs.
    expect(names(ctx)).toContain('moveTo')
    const stairs = opsNamed(ctx, 'lineTo')
    expect(stairs.length).toBe(4)                 // 2 points after the first * 2
    expect(names(ctx)[names(ctx).length - 1]).toBe('stroke')
  })

  it("'Spline' on a 3-col series sets _i1=1 and draws a plain data line", () => {
    const ctx = recCtx()
    const self = withComputed(Volume, {
      $props: { sub: SERIES3, settings: { lineWidth: 3 }, colors: {} },
      ...CanvasDrawing.methods,
    })
    self.$props.layout = makeLayout()
    Volume.methods.draw_line.call(self, ctx, 'Spline')

    expect(self._i1).toBe(1)
    expect(ctx.lineWidth).toBe(3)                 // respects sett.lineWidth
    // drawDataLine emits a lineTo for every (non-NaN) point, no leading moveTo.
    expect(opsNamed(ctx, 'lineTo').length).toBe(3)
    expect(names(ctx)).not.toContain('moveTo')
  })
})

// ───────────────────────────── Volume legend ────────────────────────────────
describe('Volume.legend', () => {
  it('OHLCV up bar (close>=open) -> colorVolUpLegend, value = values[5]', () => {
    const self = withComputed(Volume, {
      _i1: 5, _i2: (p) => p[4] >= p[1],
      $props: { settings: {}, colors: { candleUp: '#UP', candleDw: '#DW' } },
    })
    const out = Volume.methods.legend.call(self, OHLCV[0])
    expect(out).toEqual([{ value: 100, color: '#UP' }])
  })

  it('OHLCV down bar (close<open) -> colorVolDwLegend', () => {
    const self = withComputed(Volume, {
      _i1: 5, _i2: (p) => p[4] >= p[1],
      $props: { settings: {}, colors: { candleUp: '#UP', candleDw: '#DW' } },
    })
    const out = Volume.methods.legend.call(self, OHLCV[2]) // close 9 < open 12
    expect(out).toEqual([{ value: 175, color: '#DW' }])
  })

  it('non-OHLCV: flag = values[2], value = values[1]', () => {
    const self = withComputed(Volume, {
      _i1: 1, _i2: (p) => p[2],
      $props: { settings: {}, colors: { candleUp: '#UP', candleDw: '#DW' } },
    })
    expect(Volume.methods.legend.call(self, [0, 7, 0])).toEqual([{ value: 7, color: '#DW' }])
    expect(Volume.methods.legend.call(self, [0, 7, 1])).toEqual([{ value: 7, color: '#UP' }])
  })

  it('before any draw (_i1/_i2 undefined) falls back to values[1] flag values[2]', () => {
    const self = withComputed(Volume, {
      // no _i1/_i2 — first frame, draw_line not yet run
      $props: { settings: {}, colors: { candleUp: '#UP', candleDw: '#DW' } },
    })
    // flag = values[2] (truthy -> up), value = values[1]
    expect(() => Volume.methods.legend.call(self, [0, 42, 1])).not.toThrow()
    expect(Volume.methods.legend.call(self, [0, 42, 1])).toEqual([{ value: 42, color: '#UP' }])
    expect(Volume.methods.legend.call(self, [0, 42, 0])).toEqual([{ value: 42, color: '#DW' }])
  })
})

// ───────────────────────────── Zones draw ───────────────────────────────────
describe('Zones.draw', () => {
  const layout = makeLayout()

  it('maps data rows as [ts, y1, X2@idx3, Y2@idx2, color] (x2=p[3], y2=p[2])', () => {
    const ctx = recCtx()
    // data row: x1@t=1 ($2screen via t2screen=10), y1=50, y2(idx2)=80, x2(idx3) t=4, color
    const self = withComputed(Zones, {
      $props: { layout, settings: {}, data: [[1, 50, 80, 4, '#abc']] },
    })
    Zones.methods.draw.call(self, ctx)
    const rects = opsNamed(ctx, 'fillRect')
    expect(rects.length).toBe(1)
    // x1=t2screen(1)=10, x2=t2screen(4)=40 -> left=10, w=30
    // y1=$2screen(50)=150, y2=$2screen(80)=120 -> top=min=120, h=|150-120|=30
    expect(ctx.fillStyle).toBe('#abc')
    expect(rects[0]).toEqual(['fillRect', 10, 120, 30, 30])
  })

  it('settings.zones uses the straight order [x1,y1,x2,y2,color]', () => {
    const ctx = recCtx()
    const self = withComputed(Zones, {
      $props: { layout, settings: { zones: [[1, 50, 4, 80, '#def']] }, data: [] },
    })
    Zones.methods.draw.call(self, ctx)
    const rects = opsNamed(ctx, 'fillRect')
    // x1=t2screen(1)=10, x2=t2screen(4)=40 -> left=10, w=30; y1=150 y2=120
    expect(rects[0]).toEqual(['fillRect', 10, 120, 30, 30])
  })

  it('rows with < 5 elements are skipped', () => {
    const ctx = recCtx()
    const self = withComputed(Zones, {
      $props: { layout, settings: {}, data: [[1, 50, 80, 4]] }, // length 4
    })
    Zones.methods.draw.call(self, ctx)
    expect(opsNamed(ctx, 'fillRect').length).toBe(0)
  })

  it('entirely off-screen zone is culled', () => {
    const ctx = recCtx()
    // x1=t=-10 -> -100, x2=t=-5 -> -50, both right < 0 (after +2 clamp still <0)
    const self = withComputed(Zones, {
      $props: { layout, settings: {}, data: [[-10, 50, 80, -5, '#abc']] },
    })
    Zones.methods.draw.call(self, ctx)
    expect(opsNamed(ctx, 'fillRect').length).toBe(0)
  })

  it('x1==x2 is clamped to a minimum 2px width', () => {
    const ctx = recCtx()
    const self = withComputed(Zones, {
      $props: { layout, settings: {}, data: [[1, 50, 80, 1, '#abc']] }, // x1==x2 (t=1)
    })
    Zones.methods.draw.call(self, ctx)
    expect(opsNamed(ctx, 'fillRect')[0][3]).toBe(2) // width clamped to 2
  })

  it('missing color falls back to default_color (#FF000020)', () => {
    const ctx = recCtx()
    const self = withComputed(Zones, {
      $props: { layout, settings: {}, data: [[1, 50, 80, 4, undefined]] },
    })
    Zones.methods.draw.call(self, ctx)
    expect(ctx.fillStyle).toBe('#FF000020')
  })

  it('count = data zones + settings.zones', () => {
    const ctx = recCtx()
    const self = withComputed(Zones, {
      $props: {
        layout,
        settings: { zones: [[1, 50, 4, 80, '#1'], [2, 50, 5, 80, '#2']] },
        data: [[1, 50, 80, 4, '#abc']],
      },
    })
    Zones.methods.draw.call(self, ctx)
    expect(opsNamed(ctx, 'fillRect').length).toBe(3) // 1 data + 2 settings
  })
})

// ───────────────────────────── Trades legend + draw ─────────────────────────
describe('Trades.legend', () => {
  const base = { $props: { settings: {}, colors: { text: '#txt' } } }
  const self = () => withComputed(Trades, { ...base, $props: { settings: {}, colors: { text: '#txt' } } })

  it('values[1]=1 -> Buy, price=values[2].toFixed(4)', () => {
    const out = Trades.methods.legend.call(self(), [0, 1, 12.3])
    expect(out[0]).toEqual({ value: 'Buy' })
    expect(out[1]).toEqual({ value: '12.3000', color: '#txt' })
  })

  it('values[1]=0 -> Sell', () => {
    expect(Trades.methods.legend.call(self(), [0, 0, 5])[0]).toEqual({ value: 'Sell' })
  })

  it('values[1]=2 -> Unknown', () => {
    expect(Trades.methods.legend.call(self(), [0, 2, 5])[0]).toEqual({ value: 'Unknown' })
  })

  it("values[2]==null -> '' price cell", () => {
    const out = Trades.methods.legend.call(self(), [0, 1, null])
    expect(out[1]).toEqual({ value: '', color: '#txt' })
  })

  it('appends a 3rd cell only when values[3] is truthy', () => {
    expect(Trades.methods.legend.call(self(), [0, 1, 5]).length).toBe(2)
    const out = Trades.methods.legend.call(self(), [0, 1, 5, 'note'])
    expect(out.length).toBe(3)
    expect(out[2]).toEqual({ value: 'note' })
  })
})

describe('Trades.draw', () => {
  const layout = makeLayout()
  it('buy_color when p[1] truthy else sell_color; label drawn only when show_label && p[3]', () => {
    const ctx = recCtx()
    const self = withComputed(Trades, {
      $props: {
        layout, settings: {}, colors: { text: '#txt' }, font: '12px Arial',
        data: [[1, 1, 50, 'L1'], [2, 0, 60]],
      },
    })
    Trades.methods.draw.call(self, ctx)
    // 2 arcs (one per trade), fillText only for the labelled buy.
    expect(opsNamed(ctx, 'arc').length).toBe(2)
    const txt = opsNamed(ctx, 'fillText')
    expect(txt.length).toBe(1)
    expect(txt[0][1]).toBe('L1')
    // The last fillStyle set was for the second (sell) point's arc.
    expect(self.buy_color).toBe('#63df89')
    expect(self.sell_color).toBe('#ec4662')
  })

  it('show_label=false suppresses labels even with p[3]', () => {
    const ctx = recCtx()
    const self = withComputed(Trades, {
      $props: {
        layout, settings: { showLabel: false }, colors: { text: '#txt' }, font: '12px Arial',
        data: [[1, 1, 50, 'L1']],
      },
    })
    Trades.methods.draw.call(self, ctx)
    expect(opsNamed(ctx, 'fillText').length).toBe(0)
  })
})

// ───────────────────────────── Markers draw_marker ──────────────────────────
describe('Markers.draw_marker shapes', () => {
  function markerSelf(sett = {}) {
    return withComputed(Markers, { $props: { settings: sett, font: '11px Arial', colors: {} } })
  }

  it("'square' -> rect(x-r, y-r, 2r, 2r) then fill", () => {
    const ctx = recCtx()
    const self = markerSelf({ shape: 'square' })
    Markers.methods.draw_marker.call(self, ctx, 100, 50, 5)
    const rect = opsNamed(ctx, 'rect')[0]
    expect(rect).toEqual(['rect', 95, 45, 10, 10])
    expect(names(ctx)).toContain('fill')
  })

  it("'diamond' -> 4 lineTo + closePath + fill", () => {
    const ctx = recCtx()
    const self = markerSelf({ shape: 'diamond' })
    Markers.methods.draw_marker.call(self, ctx, 100, 50, 5)
    expect(opsNamed(ctx, 'lineTo').length).toBe(3) // moveTo + 3 lineTo close the rhombus
    expect(names(ctx)).toContain('closePath')
    expect(names(ctx)).toContain('fill')
  })

  it("'triangle-down' apex at y+r, base at y-r", () => {
    const ctx = recCtx()
    const self = markerSelf({ shape: 'triangle-down' })
    Markers.methods.draw_marker.call(self, ctx, 100, 50, 5)
    const move = opsNamed(ctx, 'moveTo')[0]
    expect(move).toEqual(['moveTo', 100, 55]) // apex y+r
    const lts = opsNamed(ctx, 'lineTo')
    expect(lts[0]).toEqual(['lineTo', 105, 45]) // base y-r
    expect(lts[1]).toEqual(['lineTo', 95, 45])
  })

  it('line_width>0 strokes after fill; line_width="0" skips stroke', () => {
    const ctxStroke = recCtx()
    Markers.methods.draw_marker.call(markerSelf({ shape: 'square', lineWidth: 2 }), ctxStroke, 0, 0, 5)
    expect(names(ctxStroke)).toContain('stroke')

    const ctxNo = recCtx()
    Markers.methods.draw_marker.call(markerSelf({ shape: 'square', lineWidth: '0' }), ctxNo, 0, 0, 5)
    expect(names(ctxNo)).not.toContain('stroke')
  })

  it('marker_size falls back markerSize -> style.marker_size -> 5', () => {
    expect(Markers.computed.marker_size.call(markerSelf({ markerSize: 8 }))).toBe(8)
    expect(Markers.computed.marker_size.call(markerSelf({ style: { marker_size: 9 } }))).toBe(9)
    expect(Markers.computed.marker_size.call(markerSelf({}))).toBe(5)
  })
})

// ───────────────────────────── Markers legend ───────────────────────────────
describe('Markers.legend', () => {
  function markerSelf(sett = {}) {
    return withComputed(Markers, { $props: { settings: sett, font: '11px Arial', colors: {} } })
  }

  it('finite y -> [{ value: toFixed(4), color }]', () => {
    const self = markerSelf({ color: '#42b3f4' })
    expect(Markers.methods.legend.call(self, [0, 1.23456])).toEqual([{ value: '1.2346', color: '#42b3f4' }])
  })

  it('non-finite y -> empty legend', () => {
    const self = markerSelf({})
    expect(Markers.methods.legend.call(self, [0, NaN])).toEqual([])
    expect(Markers.methods.legend.call(self, [0, null])).toEqual([])
  })

  it('label cell appended for [t, y, lbl]; empty/null label omitted', () => {
    const self = markerSelf({ color: '#c' })
    const out = Markers.methods.legend.call(self, [0, 5, 'lbl'])
    expect(out).toEqual([{ value: '5.0000', color: '#c' }, { value: 'lbl' }])
    expect(Markers.methods.legend.call(self, [0, 5, '']).length).toBe(1)
    expect(Markers.methods.legend.call(self, [0, 5, null]).length).toBe(1)
  })
})

// ───────────────────────────── Bar computeds ────────────────────────────────
describe('Bar computeds', () => {
  function barSelf(sett = {}) {
    return withComputed(Bar, { $props: { settings: sett } })
  }
  it('colorUp prefers sett.colorUp, then sett.color, then #612ff9', () => {
    expect(Bar.computed.colorUp.call(barSelf({ colorUp: '#1', color: '#2' }))).toBe('#1')
    expect(Bar.computed.colorUp.call(barSelf({ color: '#2' }))).toBe('#2')
    expect(Bar.computed.colorUp.call(barSelf({}))).toBe('#612ff9')
  })
  it('bar_width_ratio = sett.barWidth else 0.4', () => {
    expect(Bar.computed.bar_width_ratio.call(barSelf({ barWidth: 0.7 }))).toBe(0.7)
    expect(Bar.computed.bar_width_ratio.call(barSelf({}))).toBe(0.4)
  })
  it('use_for() returns ["Bar"]', () => {
    expect(Bar.methods.use_for()).toEqual(['Bar'])
  })
})

// ───────────────────────────── bar-chart-base draw ──────────────────────────
describe('bar-chart-base.draw', () => {
  const layout = makeLayout()
  function baseSelf(sett, data, extra = {}) {
    return withComputed(BarChartBase, {
      $props: { layout, settings: sett, data },
      colorUp: '#up',
      ...extra,
    })
  }

  it('per-bar colour: p[colorIndex] when truthy else up/down by sign vs baseline', () => {
    const ctx = recCtx()
    // colorIndex=2; row0 has a precomputed colour, row1 doesn't (falls to up/down)
    const data = [[0, 5, '#PRE'], [1, -3, null]]
    const self = baseSelf({ colorIndex: 2 }, data)
    BarChartBase.methods.draw.call(self, ctx)
    const rects = opsNamed(ctx, 'fillRect')
    expect(rects.length).toBe(2)
    // Can't read per-rect fillStyle from ctx, but final fillStyle is the 2nd bar's
    // (negative -> colorDown). row0 used the precomputed colour.
    expect(self.colorDown).toBe('#EF5350')
    expect(ctx.fillStyle).toBe('#EF5350') // last bar negative -> down
  })

  it('null rows are skipped', () => {
    const ctx = recCtx()
    const self = baseSelf({}, [[0, null], [1, 4]])
    BarChartBase.methods.draw.call(self, ctx)
    expect(opsNamed(ctx, 'fillRect').length).toBe(1)
  })

  it('flat bar (value == baseline) gets height 1', () => {
    const ctx = recCtx()
    const self = baseSelf({}, [[0, 0]]) // value 0 == baseline 0
    BarChartBase.methods.draw.call(self, ctx)
    expect(opsNamed(ctx, 'fillRect')[0][4]).toBe(1) // height
  })

  it('sett.zeroLine strokes one horizontal line at round($2screen(baseline))+0.5', () => {
    const ctx = recCtx()
    const self = baseSelf({ zeroLine: true, zeroLineColor: '#zl' }, [[0, 5]])
    BarChartBase.methods.draw.call(self, ctx)
    // baseline 0 -> $2screen(0)=200 -> round+0.5 = 200.5
    const moves = opsNamed(ctx, 'moveTo')
    const lts = opsNamed(ctx, 'lineTo')
    expect(moves[moves.length - 1]).toEqual(['moveTo', 0, 200.5])
    expect(lts[lts.length - 1]).toEqual(['lineTo', layout.width, 200.5])
    expect(ctx.strokeStyle).toBe('#zl')
    expect(opsNamed(ctx, 'stroke').length).toBe(1)
  })

  it('no zeroLine -> no stroke at all', () => {
    const ctx = recCtx()
    const self = baseSelf({}, [[0, 5]])
    BarChartBase.methods.draw.call(self, ctx)
    expect(opsNamed(ctx, 'stroke').length).toBe(0)
  })

  it('y_range expands to include the baseline and pads 10%', () => {
    // data all above baseline 0; range must reach down to 0 and pad.
    const self = withComputed(BarChartBase, { $props: { settings: {}, data: [[0, 10], [1, 20]] } })
    const r = BarChartBase.methods.y_range.call(self, 0, 0)
    // max=20, min=10 but baseline 0 < min -> min=0; pad=(20-0)*0.1=2
    expect(r).toEqual([22, -2])
  })
})

// ───────────────────────────── canvas-drawing mixin ─────────────────────────
describe('canvas-drawing mixin', () => {
  const layout = makeLayout()
  const host = (data) => ({ $props: { layout }, ...CanvasDrawing.methods, _data: data })

  it('drawDataLine skipNaN=false emits a lineTo for every point', () => {
    const ctx = recCtx()
    const self = { $props: { layout } }
    CanvasDrawing.methods.drawDataLine.call(self, ctx, [[0, 1], [1, NaN], [2, 3]], 1, false)
    expect(opsNamed(ctx, 'lineTo').length).toBe(3)
    expect(names(ctx)).not.toContain('moveTo')
  })

  it('drawDataLine skipNaN=true lifts the pen (moveTo) across a NaN gap', () => {
    const ctx = recCtx()
    const self = { $props: { layout } }
    CanvasDrawing.methods.drawDataLine.call(self, ctx, [[0, 1], [1, NaN], [2, 3]], 1, true)
    // point 0: lineTo; point 1: skipped; point 2: moveTo (pen lifted) + lineTo
    expect(names(ctx)).toEqual(['lineTo', 'moveTo', 'lineTo'])
  })

  it('drawStepLine stairs lineTo(x,prevY) then lineTo(x,y), resets across a null', () => {
    const ctx = recCtx()
    const self = { $props: { layout } }
    // pts: p0=(0,1) p1=null p2=(2,3) p3=(3,5)
    CanvasDrawing.methods.drawStepLine.call(self, ctx, [[0, 1], [1, null], [2, 3], [3, 5]], 1)
    // p0 -> moveTo; p1 -> reset; p2 -> moveTo (prev null); p3 -> stair lineTo,lineTo
    expect(names(ctx)).toEqual(['moveTo', 'moveTo', 'lineTo', 'lineTo'])
    const lts = opsNamed(ctx, 'lineTo')
    // p3: x=30, prevY=$2screen(3)=197, then y=$2screen(5)=195
    expect(lts[0]).toEqual(['lineTo', 30, 197])
    expect(lts[1]).toEqual(['lineTo', 30, 195])
  })

  it('drawBandFill = forward top pass + reverse bottom pass + fill (2*len verts)', () => {
    const ctx = recCtx()
    const self = { $props: { layout } }
    const data = [[0, 10, 2], [1, 12, 3], [2, 11, 1]]
    CanvasDrawing.methods.drawBandFill.call(self, ctx, data, 1, 2)
    expect(opsNamed(ctx, 'lineTo').length).toBe(2 * data.length)
    expect(names(ctx)[0]).toBe('beginPath')
    expect(names(ctx)[names(ctx).length - 1]).toBe('fill')
  })

  it('drawMultiLines: one beginPath+stroke per index', () => {
    const ctx = recCtx()
    const self = { $props: { layout }, ...CanvasDrawing.methods }
    CanvasDrawing.methods.drawMultiLines.call(self, ctx, [[0, 1, 2], [1, 3, 4]], [1, 2])
    expect(opsNamed(ctx, 'beginPath').length).toBe(2)
    expect(opsNamed(ctx, 'stroke').length).toBe(2)
  })

  it('pointToScreen = [t2screen(p[0]), $2screen(p[index])]', () => {
    const self = { $props: { layout } }
    expect(CanvasDrawing.methods.pointToScreen.call(self, [3, 42, 7], 1)).toEqual([30, 158])
    expect(CanvasDrawing.methods.pointToScreen.call(self, [3, 42, 7], 2)).toEqual([30, 193])
  })
})

// ───────────────────────────── Range draw + y_range ─────────────────────────
describe('Range.draw', () => {
  const layout = makeLayout()
  function rangeSelf(sett, data) {
    return withComputed(Range, { $props: { layout, settings: sett, data } })
  }

  it('fills the band rect (0, $2screen(upper), width, $2screen(lower)-$2screen(upper)) with back_color', () => {
    const ctx = recCtx()
    const self = rangeSelf({ upper: 70, lower: 30 }, [[0, 50]])
    Range.methods.draw.call(self, ctx)
    const rect = opsNamed(ctx, 'fillRect')[0]
    // upper=$2screen(70)=130, lower=$2screen(30)=170 -> y=130, h=170-130=40
    expect(rect).toEqual(['fillRect', 0, 130, layout.width, 40])
    expect(ctx.fillStyle).toBe(self.back_color)
  })

  it('draws upper + lower band lines and resets setLineDash([]) at the end', () => {
    const ctx = recCtx()
    const self = rangeSelf({}, [[0, 50], [1, 55]])
    Range.methods.draw.call(self, ctx)
    // setLineDash called twice: [5] for the bands, then [] reset.
    const dashes = opsNamed(ctx, 'setLineDash')
    expect(dashes.length).toBe(2)
    expect(dashes[0]).toEqual(['setLineDash', [5]])
    expect(dashes[dashes.length - 1]).toEqual(['setLineDash', []]) // no dash leak
  })

  it('y_range = [max(hi, upper||70), min(lo, lower||30)]', () => {
    const self = rangeSelf({}, [])
    expect(Range.methods.y_range.call(self, 50, 40)).toEqual([70, 30])     // defaults win
    expect(Range.methods.y_range.call(self, 90, 10)).toEqual([90, 10])     // data wins
  })
})

// ───────────────────────────── StepLine y_range ─────────────────────────────
describe('StepLine.y_range', () => {
  function slSelf(sett, data) {
    return withComputed(StepLine, { $props: { settings: sett, data, num: 0 } })
  }
  it('pads [max+pad, min-pad] with 10% padding', () => {
    const self = slSelf({}, [[0, 10], [1, 30]])
    // max=30 min=10 pad=(30-10)*0.1=2 -> [32, 8]
    expect(StepLine.methods.y_range.call(self, 0, 0)).toEqual([32, 8])
  })
  it('empty data returns the incoming [hi, lo]', () => {
    const self = slSelf({}, [])
    expect(StepLine.methods.y_range.call(self, 123, -7)).toEqual([123, -7])
  })
})

// ───────────────────────────── volbar primitive ─────────────────────────────
describe('VolbarExt', () => {
  const overlay = { colorVolUp: '#23a776', colorVolDw: '#e54150', $props: { layout: { height: 200 } } }

  it('detached: fillRect top=floor(min(yTop,y0)), height=floor(max(1,|y0-yTop|))', () => {
    const ctx = recCtx()
    new VolbarExt(overlay, ctx, { raw: [0], x1: 10.4, x2: 20.9, yTop: 30.7, y0: 100.2, green: true })
    const rect = opsNamed(ctx, 'fillRect')[0]
    // w=x2-x1=10.5 -> floor 10 ; top=min(30.7,100.2)=30.7 -> floor 30 ; h=|100.2-30.7|=69.5 -> floor 69
    expect(rect).toEqual(['fillRect', 10, 30, 10, 69])
    expect(ctx.fillStyle).toBe('#23a776')
  })

  it('detached: yTop === y0 -> height clamps to 1', () => {
    const ctx = recCtx()
    new VolbarExt(overlay, ctx, { raw: [0], x1: 0, x2: 4, yTop: 50, y0: 50, green: false })
    expect(opsNamed(ctx, 'fillRect')[0][4]).toBe(1)
    expect(ctx.fillStyle).toBe('#e54150') // down colour
  })

  it('candle pane: fillRect y=floor(height-floor(h)-0.5), height=floor(h)+1', () => {
    const ctx = recCtx()
    new VolbarExt(overlay, ctx, { raw: [0], x1: 10, x2: 20, h: 50, green: true })
    // y0=height(200)-floor(h)(50)-0.5 -> floor 149 ; h-> floor(h)+1 = 51
    expect(opsNamed(ctx, 'fillRect')[0]).toEqual(['fillRect', 10, 149, 10, 51])
  })

  it('raw[6] style override wins over the overlay colorVolUp/Dw', () => {
    const ctx = recCtx()
    new VolbarExt(overlay, ctx, {
      raw: [0, 0, 0, 0, 0, 0, { colorVolUp: '#OVR' }], x1: 0, x2: 4, h: 10, green: true,
    })
    expect(ctx.fillStyle).toBe('#OVR')
  })
})
