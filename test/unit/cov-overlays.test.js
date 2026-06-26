// Pure-method coverage for the canvas OVERLAYS that were under-covered:
//   - BarrierPlan.js  (Corky search-match target plan — was 0%)
//   - LineTracker.js  (per-bar horizontal tick lines — was 0%)
//   - RangeTool.vue   (price/time measurement tool — draw/value/t2str)
//   - OrderBox.vue    (order-distribution box — un-hit geometry/status branches)
//
// Every overlay method is PURE given a fake `this` (sett / $props / computed
// values) plus a recording 2D context, so these run in plain Node — no jsdom,
// no mount, no timers, no network. We invoke them exactly like the existing
// test/unit/overlay-draw-geometry.test.js:  Comp.methods.x.call(self, ...) and
// Comp.computed.x.call(self). We deliberately target the branches the live
// component test (test/component/order-box.test.js) does NOT reach.
import { describe, it, expect } from 'vitest'
import BarrierPlan from '../../src/components/overlays/BarrierPlan.js'
import LineTracker from '../../src/components/overlays/LineTracker.js'
import RangeTool from '../../src/components/overlays/RangeTool.vue'
import OrderBox from '../../src/components/overlays/OrderBox.vue'

// ───────────────────────── recording 2D context ─────────────────────────────
// Every drawing call is appended to `ops` as [name, ...args]; the latest style
// fields are readable so we can assert state at the moment of a fill/stroke.
function recCtx() {
  const ops = []
  const ctx = {
    ops,
    fillStyle: null, strokeStyle: null, lineWidth: null,
    font: null, textAlign: null, textBaseline: null, globalAlpha: 1,
  }
  const rec = (name) => (...a) => ops.push([name, ...a])
  for (const m of ['beginPath', 'moveTo', 'lineTo', 'rect', 'arc', 'arcTo',
    'closePath', 'fill', 'stroke', 'fillRect', 'strokeRect', 'fillText',
    'setLineDash', 'quadraticCurveTo', 'save', 'restore']) {
    ctx[m] = rec(m)
  }
  ctx.measureText = (s) => ({ width: String(s).length * 6 })
  return ctx
}
const names = (ctx) => ctx.ops.map((o) => o[0])
const opsNamed = (ctx, name) => ctx.ops.filter((o) => o[0] === name)

// Linear layout: t2screen=t (identity), $2screen(v)=200-v (top is "up").
function makeLayout(over = {}) {
  return {
    width: 500, height: 200, prec: 2,
    t2screen: (t) => t,
    $2screen: (v) => 200 - v,
    ...over,
  }
}

// Bind the component's own methods + computed getters onto `self` so a method
// that reads this.color / this.sett / a sibling method resolves like a live
// instance. Mirrors overlay.js: `sett` = settings || {}.
function bind(Comp, self) {
  const m = Comp.methods || {}
  for (const k of Object.keys(m)) if (!(k in self)) self[k] = m[k]
  const c = Comp.computed || {}
  for (const k of Object.keys(c)) {
    Object.defineProperty(self, k, { get() { return c[k].call(self) }, configurable: true })
  }
  if (!('sett' in self)) {
    Object.defineProperty(self, 'sett', {
      get() { return (this.$props && this.$props.settings) || {} }, configurable: true,
    })
  }
  return self
}

// ═════════════════════════════ BarrierPlan ══════════════════════════════════
describe('BarrierPlan', () => {
  function bpSelf(plan, over = {}) {
    return bind(BarrierPlan, {
      $props: {
        layout: makeLayout(), settings: { plan, ...over.settings },
        font: '11px Arial', data: over.data !== undefined ? over.data : [[0, 1]],
      },
    })
  }

  it('meta_info / use_for / legend descriptors', () => {
    const self = bpSelf(null)
    expect(BarrierPlan.methods.meta_info.call(self)).toMatchObject({ author: 'TVJS', version: '1.0.0' })
    expect(BarrierPlan.methods.use_for.call(self)).toEqual(['BarrierPlan'])
    expect(BarrierPlan.methods.legend.call(self)).toEqual([])
  })

  it('computed colours fall back to defaults, then to settings overrides', () => {
    const def = bpSelf({ entry: 1 })
    expect(BarrierPlan.computed.up_color.call(def)).toBe('#23a776')
    expect(BarrierPlan.computed.dn_color.call(def)).toBe('#e54150')
    expect(BarrierPlan.computed.entry_color.call(def)).toBe('#9aa3b2')
    // font_px default: '10px ' + the family parsed off `font` ('11px Arial' -> ' Arial')
    expect(BarrierPlan.computed.font_px.call(def)).toBe('10px  Arial')

    const ovr = bpSelf({ entry: 1 }, { settings: { upColor: '#u', dnColor: '#d', entryColor: '#e', font: '8px Mono' } })
    expect(BarrierPlan.computed.up_color.call(ovr)).toBe('#u')
    expect(BarrierPlan.computed.dn_color.call(ovr)).toBe('#d')
    expect(BarrierPlan.computed.entry_color.call(ovr)).toBe('#e')
    expect(BarrierPlan.computed.font_px.call(ovr)).toBe('8px Mono')
  })

  it('draw: no data -> early return (nothing drawn)', () => {
    const ctx = recCtx()
    BarrierPlan.methods.draw.call(bpSelf({ entry: 100 }, { data: [] }), ctx)
    expect(ctx.ops.length).toBe(0)
  })

  it('draw: no plan -> early return', () => {
    const ctx = recCtx()
    BarrierPlan.methods.draw.call(bpSelf(null), ctx)
    expect(ctx.ops.length).toBe(0)
  })

  it('draw: plan with null entry -> early return', () => {
    const ctx = recCtx()
    BarrierPlan.methods.draw.call(bpSelf({ entry: null, take_up: 110 }), ctx)
    expect(ctx.ops.length).toBe(0)
  })

  it('draw: full matured bull plan draws channel, 3 levels, expiry vertical, outcome label', () => {
    const ctx = recCtx()
    const plan = {
      entryTs: 10, expiryTs: 40, entry: 100,
      take_up: 110, stop_up: 90, take_dn: 90, stop_dn: 110,
      outcome: 'bull_hit', pending: false,
    }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)

    // Shaded take<->stop channel: fillRect from x0=10 to x1=40, yU=$2screen(110)=90,
    // height = $2screen(90)-$2screen(110) = 110-90 = 20.
    const channel = opsNamed(ctx, 'fillRect')[0]
    expect(channel).toEqual(['fillRect', 10, 90, 30, 20])

    // 3 level lines (take/stop/entry): each beginPath+moveTo+lineTo+stroke.
    // Plus the expiry vertical = 4 strokes; outcome label = 1 fillText for level
    // labels (3) + outcome (1).
    expect(opsNamed(ctx, 'stroke').length).toBe(4) // 3 levels + expiry vertical
    // entry level is dashed [3,3]; expiry vertical also dashed.
    const dashes = opsNamed(ctx, 'setLineDash')
    expect(dashes.some(d => Array.isArray(d[1]) && d[1][0] === 3)).toBe(true)

    // outcome label colour for 'bull_*' is up_color, drawn at entry y - 4.
    const lastText = opsNamed(ctx, 'fillText').slice(-1)[0]
    expect(lastText[1]).toBe('bull_hit')
    // $2screen(entry=100) = 100, minus 4 -> y=96, x = x0+4 = 14.
    expect(lastText[2]).toBe(14)
    expect(lastText[3]).toBe(96)
  })

  it('draw: x1 clamps to >= x0+4 when expiry precedes entry', () => {
    const ctx = recCtx()
    // expiryTs(11) maps near entryTs(10); t2screen identity -> x1 would be 11,
    // but x0+4 = 14 wins via Math.max.
    const plan = { entryTs: 10, expiryTs: 11, entry: 100, take_up: 110, stop_up: 90 }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    const channel = opsNamed(ctx, 'fillRect')[0]
    // width = x1 - x0 = 14 - 10 = 4
    expect(channel[1]).toBe(10)
    expect(channel[3]).toBe(4)
  })

  it('draw: no expiryTs -> x1 = layout.width and NO expiry vertical', () => {
    const ctx = recCtx()
    const plan = { entryTs: 10, expiryTs: null, entry: 100, take_up: 110, stop_up: 90 }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    const channel = opsNamed(ctx, 'fillRect')[0]
    expect(channel[1]).toBe(10)
    expect(channel[3]).toBe(490) // width(500) - x0(10)
    // Only the 3 level lines stroke (no expiry vertical).
    expect(opsNamed(ctx, 'stroke').length).toBe(3)
  })

  it('draw: mirrored fallback — upper from stop_dn, lower from take_dn when take_up/stop_up null', () => {
    const ctx = recCtx()
    const plan = { entryTs: 10, expiryTs: 40, entry: 100, take_up: null, stop_up: null, stop_dn: 120, take_dn: 80 }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    // upper = stop_dn = 120 -> yU=$2screen(120)=80; lower = take_dn = 80 -> yL=120.
    const channel = opsNamed(ctx, 'fillRect')[0]
    expect(channel).toEqual(['fillRect', 10, 80, 30, 40])
  })

  it('draw: channel skipped when upper or lower is null', () => {
    const ctx = recCtx()
    // only entry present; upper/lower both resolve null -> no channel fillRect.
    const plan = { entryTs: 10, expiryTs: 40, entry: 100, take_up: null, stop_up: null, stop_dn: null, take_dn: null }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    // No fillRect (channel) and no level lines for upper/lower; only entry level.
    expect(opsNamed(ctx, 'fillRect').length).toBe(0)
    expect(opsNamed(ctx, 'stroke').length).toBe(2) // entry level + expiry vertical
  })

  it('draw: pending plan uses neutral grey for the outcome label', () => {
    const ctx = recCtx()
    const plan = { entryTs: 10, expiryTs: 40, entry: 100, take_up: 110, stop_up: 90, outcome: 'pending', pending: true }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    // The label fillStyle is set to '#808a9d' immediately before the outcome fillText,
    // which is the LAST draw call, so the recorded fillStyle is that neutral grey.
    const labelText = opsNamed(ctx, 'fillText').slice(-1)[0]
    expect(labelText[1]).toBe('pending')
    expect(ctx.fillStyle).toBe('#808a9d')
  })

  it('draw: bear outcome resolves to dn_color (label still drawn)', () => {
    const ctx = recCtx()
    const plan = { entryTs: 10, expiryTs: 40, entry: 100, take_up: 110, stop_up: 90, outcome: 'bear_hit', pending: false }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    expect(opsNamed(ctx, 'fillText').slice(-1)[0][1]).toBe('bear_hit')
    // bear_* (not pending) -> dn_color, and it's the last fillStyle set.
    expect(ctx.fillStyle).toBe('#e54150')
  })

  it('draw: bull outcome label uses up_color (last fillStyle)', () => {
    const ctx = recCtx()
    const plan = { entryTs: 10, expiryTs: 40, entry: 100, take_up: 110, stop_up: 90, outcome: 'bull_hit', pending: false }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    expect(ctx.fillStyle).toBe('#23a776')
  })

  it('draw: unknown outcome prefix (not bull/bear) -> neutral grey', () => {
    const ctx = recCtx()
    const plan = { entryTs: 10, expiryTs: 40, entry: 100, take_up: 110, stop_up: 90, outcome: 'expired', pending: false }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    expect(opsNamed(ctx, 'fillText').slice(-1)[0][1]).toBe('expired')
    expect(ctx.fillStyle).toBe('#808a9d')
  })

  it('draw: no outcome -> no outcome label (only the 3 level labels)', () => {
    const ctx = recCtx()
    const plan = { entryTs: 10, expiryTs: 40, entry: 100, take_up: 110, stop_up: 90 }
    BarrierPlan.methods.draw.call(bpSelf(plan), ctx)
    const texts = opsNamed(ctx, 'fillText').map(t => t[1])
    expect(texts).toEqual(['take ↑', 'stop ↑', 'entry'])
  })

  it('_level: null / non-finite price draws nothing', () => {
    const self = bpSelf({ entry: 1 })
    const ctxNull = recCtx()
    BarrierPlan.methods._level.call(self, ctxNull, self.$props.layout, 0, 100, null, '#fff', [], 'x')
    expect(ctxNull.ops.length).toBe(0)
    const ctxNaN = recCtx()
    BarrierPlan.methods._level.call(self, ctxNaN, self.$props.layout, 0, 100, 'not-a-number', '#fff', [], 'x')
    expect(ctxNaN.ops.length).toBe(0)
  })

  it('_level: a valid price strokes a horizontal line and (when given) a label clamped to width-44', () => {
    const self = bpSelf({ entry: 1 })
    const ctx = recCtx()
    // x1=600 would push the label past the right edge -> clamped to width-44 = 456.
    BarrierPlan.methods._level.call(self, ctx, self.$props.layout, 10, 600, 50, '#abc', [2, 2], 'lbl')
    const y = self.$props.layout.$2screen(50) // 150
    expect(opsNamed(ctx, 'moveTo')[0]).toEqual(['moveTo', 10, y])
    expect(opsNamed(ctx, 'lineTo')[0]).toEqual(['lineTo', 600, y])
    expect(ctx.strokeStyle).toBe('#abc')
    expect(ctx.lineWidth).toBe(1.3)
    const txt = opsNamed(ctx, 'fillText')[0]
    expect(txt[1]).toBe('lbl')
    expect(txt[2]).toBe(456) // Math.min(x1+4=604, width-44=456)
    expect(txt[3]).toBe(y)   // label sits on the line's y
    // line is solid (dash reset to []) and the label colour matches the line.
    const dashes = opsNamed(ctx, 'setLineDash')
    expect(dashes[0]).toEqual(['setLineDash', [2, 2]]) // requested dash
    expect(dashes[dashes.length - 1]).toEqual(['setLineDash', []]) // reset after
  })

  it('_level: empty label -> line only, no fillText', () => {
    const self = bpSelf({ entry: 1 })
    const ctx = recCtx()
    BarrierPlan.methods._level.call(self, ctx, self.$props.layout, 0, 100, 50, '#abc', [], '')
    expect(opsNamed(ctx, 'fillText').length).toBe(0)
    expect(opsNamed(ctx, 'stroke').length).toBe(1)
  })
})

// ═════════════════════════════ LineTracker ══════════════════════════════════
describe('LineTracker', () => {
  function ltSelf(data, sett = {}) {
    const self = bind(LineTracker, {
      $props: { layout: makeLayout(), settings: sett, data, interval: 1 },
      data, // overlay.js exposes props on `this`; LineTracker reads this.data
    })
    return self
  }

  it('use_for() returns ["LineTracker"]', () => {
    expect(LineTracker.methods.use_for()).toEqual(['LineTracker'])
  })

  it('computed defaults: white line, offset 0, linkLines false', () => {
    const self = ltSelf([])
    expect(LineTracker.computed.linecolor.call(self)).toBe('#FFFFFF')
    expect(LineTracker.computed.offset.call(self)).toBe(0)
    expect(LineTracker.computed.linkLines.call(self)).toBe(false)
  })

  it('computed overrides from settings', () => {
    const self = ltSelf([], { linecolor: '#0f0', offset: 2, linkLines: 1 })
    expect(LineTracker.computed.linecolor.call(self)).toBe('#0f0')
    expect(LineTracker.computed.offset.call(self)).toBe(2)
    expect(LineTracker.computed.linkLines.call(self)).toBe(true)
  })

  it('draw: empty data -> early return', () => {
    const ctx = recCtx()
    LineTracker.methods.draw.call(ltSelf([]), ctx)
    expect(ctx.ops.length).toBe(0)
  })

  it('draw: index 0 is always skipped (continue)', () => {
    const ctx = recCtx()
    // only one point -> loop body for i=0 hits `continue`, nothing drawn.
    LineTracker.methods.draw.call(ltSelf([[0, 5]]), ctx)
    expect(ctx.ops.length).toBe(0)
  })

  it('draw: scalar price draws a centred horizontal tick of width interval', () => {
    const ctx = recCtx()
    // interval=1, offset=0 -> x=t2screen(t), x2=t2screen(t+1); half=(x2-x)/2=0.5.
    // points: [0,*] skipped; [1,5] drawn.
    LineTracker.methods.draw.call(ltSelf([[0, 5], [1, 5]]), ctx)
    const y = makeLayout().$2screen(5) // 195
    expect(opsNamed(ctx, 'moveTo')[0]).toEqual(['moveTo', 0.5, y]) // x-half = 1-0.5
    expect(opsNamed(ctx, 'lineTo')[0]).toEqual(['lineTo', 1.5, y]) // x+half = 1+0.5
    expect(ctx.strokeStyle).toBe('#FFFFFF')
    expect(ctx.lineWidth).toBe(2)
    expect(opsNamed(ctx, 'stroke').length).toBe(1)
  })

  it('draw: null price row is skipped', () => {
    const ctx = recCtx()
    LineTracker.methods.draw.call(ltSelf([[0, 1], [1, null], [2, 3]]), ctx)
    // i=0 skip, i=1 null skip, i=2 draws once.
    expect(opsNamed(ctx, 'stroke').length).toBe(1)
  })

  it('draw: array-of-prices draws one tick per price', () => {
    const ctx = recCtx()
    LineTracker.methods.draw.call(ltSelf([[0, 1], [1, [10, 20, 30]]]), ctx)
    // 3 ticks for the array at i=1.
    expect(opsNamed(ctx, 'stroke').length).toBe(3)
    const ys = opsNamed(ctx, 'moveTo').map(o => o[2])
    expect(ys).toEqual([190, 180, 170]) // $2screen(10/20/30)
  })

  it('draw: linkLines connects to the next point with a 2nd lineTo', () => {
    const ctx = recCtx()
    LineTracker.methods.draw.call(ltSelf([[0, 1], [1, 5], [2, 8]], { linkLines: true }), ctx)
    // For i=1 (has next i=2): two lineTo (horizontal + connector). For i=2 (no
    // next): one lineTo. Total 3 lineTo, 2 strokes.
    const lts = opsNamed(ctx, 'lineTo')
    expect(lts.length).toBe(3)
    expect(opsNamed(ctx, 'stroke').length).toBe(2)
    // i=1: horizontal tick ends at (x+half=1.5, y=$2screen(5)=195), then the
    // connector drops to the NEXT point's price: (1.5, $2screen(8)=192).
    expect(lts[0]).toEqual(['lineTo', 1.5, 195])
    expect(lts[1]).toEqual(['lineTo', 1.5, 192]) // connector to nxt[1]=8
    // i=2 (last): plain horizontal tick at y=$2screen(8)=192, no connector.
    expect(lts[2]).toEqual(['lineTo', 2.5, 192])
  })

  it('draw: linkLines skips the connector when the next price is null', () => {
    const ctx = recCtx()
    // i=1 has a next row [2,null] -> nxt[1] === null guard -> NO connector lineTo.
    LineTracker.methods.draw.call(ltSelf([[0, 1], [1, 5], [2, null]], { linkLines: true }), ctx)
    // i=1 draws one horizontal tick (no connector); i=2 null -> skipped.
    expect(opsNamed(ctx, 'lineTo').length).toBe(1)
    expect(opsNamed(ctx, 'stroke').length).toBe(1)
  })

  it('draw: linkLines off -> only horizontal ticks, no connector', () => {
    const ctx = recCtx()
    LineTracker.methods.draw.call(ltSelf([[0, 1], [1, 5], [2, 8]], { linkLines: false }), ctx)
    expect(opsNamed(ctx, 'lineTo').length).toBe(2) // one per drawn point
  })

  it('draw: offset shifts the tick window right by interval*offset', () => {
    const ctx = recCtx()
    LineTracker.methods.draw.call(ltSelf([[0, 5], [10, 5]], { offset: 2 }), ctx)
    // x = t2screen(10 + 1*2) = 12 ; x2 = t2screen(10 + 1*3) = 13 ; half=0.5
    expect(opsNamed(ctx, 'moveTo')[0]).toEqual(['moveTo', 11.5, 195]) // 12-0.5
    expect(opsNamed(ctx, 'lineTo')[0]).toEqual(['lineTo', 12.5, 195]) // 12+0.5
  })
})

// ═════════════════════════════ RangeTool ════════════════════════════════════
describe('RangeTool', () => {
  // ti_map / c_magnet_i stub for draw_value time/bar math.
  function rtLayout(over = {}) {
    return makeLayout({
      ti_map: {
        tf: 60000,
        smth2t: (t) => t,         // identity: ms == coordinate
        i2t: (i) => i,
      },
      c_magnet_i: (t) => t,       // bar index == coordinate
      ...over,
    })
  }
  function rtSelf(sett, over = {}) {
    const layout = rtLayout(over.layout)
    const self = bind(RangeTool, {
      $props: {
        layout, settings: sett, colors: { cross: '#x', text: '#t' },
        font: '12px Arial', config: { TOOL_COLL: 7 },
      },
      // RangeTool.draw_value reads this.layout directly (Vue exposes props on
      // `this`); mirror that so ti_map / c_magnet_i resolve.
      layout,
      collisions: [],
      selected: false, show_pins: false,
      // From the Tool mixin: a no-op here (we never select/hover the pins).
      render_pins() {},
      ...over.self,
    })
    return self
  }

  it('meta_info / use_for / data_colors', () => {
    const self = rtSelf({})
    expect(RangeTool.methods.meta_info.call(self)).toMatchObject({ author: 'C451' })
    expect(RangeTool.methods.use_for.call(self)).toEqual(['RangeTool'])
    expect(RangeTool.methods.data_colors.call(self)).toEqual([self.color])
  })

  it('tool() descriptor: Price type with Time/PriceTime/ShiftMode mods', () => {
    const t = RangeTool.methods.tool.call(rtSelf({}))
    expect(t.group).toBe('Measurements')
    expect(t.type).toBe('Price')
    expect(t.hint).toBe('Price Range')
    expect(t.mods.Time.settings).toEqual({ price: false, time: true })
    expect(t.mods.PriceTime.settings).toEqual({ price: true, time: true })
    expect(t.mods.ShiftMode.settings).toMatchObject({ price: true, time: true, shiftMode: true })
    expect(t.mods.ShiftMode.hidden).toBe(true)
  })

  it('computed defaults + overrides', () => {
    const def = rtSelf({})
    expect(RangeTool.computed.line_width.call(def)).toBe(0.9)
    expect(RangeTool.computed.color.call(def)).toBe('#x')          // colors.cross
    expect(RangeTool.computed.back_color.call(def)).toBe('#9b9ba316')
    expect(RangeTool.computed.value_back.call(def)).toBe('#9b9ba316')
    expect(RangeTool.computed.value_color.call(def)).toBe('#t')    // colors.text
    expect(RangeTool.computed.prec.call(def)).toBe(2)
    expect(RangeTool.computed.new_font.call(def)).toBe('12px  Arial')
    expect(RangeTool.computed.price.call(def)).toBe(true)          // default true
    expect(RangeTool.computed.time.call(def)).toBe(false)          // default false
    expect(RangeTool.computed.shift.call(def)).toBeUndefined()

    const ovr = rtSelf({ lineWidth: 3, color: '#c', backColor: '#b', valueBack: '#vb', valueColor: '#vc', precision: 4, price: false, time: true, shiftMode: true })
    expect(RangeTool.computed.line_width.call(ovr)).toBe(3)
    expect(RangeTool.computed.color.call(ovr)).toBe('#c')
    expect(RangeTool.computed.back_color.call(ovr)).toBe('#b')
    expect(RangeTool.computed.value_back.call(ovr)).toBe('#vb')
    expect(RangeTool.computed.value_color.call(ovr)).toBe('#vc')
    expect(RangeTool.computed.prec.call(ovr)).toBe(4)
    expect(RangeTool.computed.price.call(ovr)).toBe(false)
    expect(RangeTool.computed.time.call(ovr)).toBe(true)
    expect(RangeTool.computed.shift.call(ovr)).toBe(true)
  })

  it('p1/p2 computed read settings.p1/p2', () => {
    const self = rtSelf({ p1: [10, 100], p2: [40, 120] })
    expect(RangeTool.computed.p1.call(self)).toEqual([10, 100])
    expect(RangeTool.computed.p2.call(self)).toEqual([40, 120])
  })

  it('draw: missing p1/p2 -> early return', () => {
    const ctx = recCtx()
    RangeTool.methods.draw.call(rtSelf({}), ctx)
    expect(ctx.ops.length).toBe(0)
  })

  it('draw: default (price only) fills the background rect and draws the vertical block + value box', () => {
    const ctx = recCtx()
    const self = rtSelf({ p1: [10, 100], p2: [40, 120] })
    RangeTool.methods.draw.call(self, ctx)
    // Background fillRect: x1=10,y1=$2screen(100)=100,w=40-10=30,h=$2screen(120)-100=-20.
    const bg = opsNamed(ctx, 'fillRect')[0]
    expect(bg).toEqual(['fillRect', 10, 100, 30, -20])
    // background uses back_color, the value box uses value_back.
    expect(ctx.ops.find(o => o[0] === 'fillRect')).toBe(bg)
    // price=true -> vertical() drew Top + Bottom + dashed-centre Segs = 3 collisions.
    expect(self.collisions.length).toBe(3)
    // value box drawn (second fillRect from draw_value).
    expect(opsNamed(ctx, 'fillRect').length).toBe(2)
    // value text is a single price row "<d$>  (<p>%)" — no "bars" line.
    const texts = opsNamed(ctx, 'fillText').map(t => t[1])
    expect(texts.length).toBe(1)
    expect(texts[0]).toMatch(/^20\.00 {2}\(20\.00%\)$/) // d$=120-100, p=100*(120/100-1)
    // The value box fillRect: w = max(measureText(text)+20, 100); the recording
    // ctx returns text.length*6, so w = 15*6 + 20 = 110 (> the 100 floor).
    const vbox = opsNamed(ctx, 'fillRect')[1]
    expect(vbox[3]).toBe(texts[0].length * 6 + 20)
    expect(vbox[3]).toBe(110)
    expect(vbox[4]).toBe(20)  // single line -> h = 20*1, dir = sign(120-100)=+1
  })

  it('draw: time-only mode draws the horizontal block, not the vertical', () => {
    const ctx = recCtx()
    const self = rtSelf({ p1: [10, 100], p2: [40, 120], price: false, time: true })
    RangeTool.methods.draw.call(self, ctx)
    // horizontal() pushes Left+Right segs (2 collisions) when not in shift mode.
    expect(self.collisions.length).toBe(2)
    // time-only -> exactly ONE value line "<bars> bars, <t2str>"; NO price/% row.
    const texts = opsNamed(ctx, 'fillText').map(t => t[1])
    expect(texts.length).toBe(1)
    // c_magnet_i identity -> bars = p2.t - p1.t = 40 - 10 = 30; dt = 30ms -> '' via t2str.
    expect(texts[0]).toBe('30 bars, ')
    expect(texts.some(t => /%/.test(t))).toBe(false)
  })

  it('draw: shift mode suppresses the boundary Segs in vertical()', () => {
    const ctxShift = recCtx()
    const selfShift = rtSelf({ p1: [10, 100], p2: [40, 120], price: true, shiftMode: true })
    RangeTool.methods.draw.call(selfShift, ctxShift)
    // In shift mode, vertical() skips the Top/Bottom Segs; only the dashed centre
    // Seg pushes a collision.
    expect(selfShift.collisions.length).toBe(1)

    const ctxNorm = recCtx()
    const selfNorm = rtSelf({ p1: [10, 100], p2: [40, 120], price: true })
    RangeTool.methods.draw.call(selfNorm, ctxNorm)
    // Normal mode: Top + Bottom + centre = 3 collisions.
    expect(selfNorm.collisions.length).toBe(3)
  })

  it('draw_value: percent is N/A when p1 price is 0', () => {
    const ctx = recCtx()
    const self = rtSelf({ p1: [10, 0], p2: [40, 50], price: true })
    RangeTool.methods.draw.call(self, ctx)
    const texts = opsNamed(ctx, 'fillText').map(t => t[1])
    expect(texts.some(t => /N\/A/.test(t))).toBe(true)
  })

  it('draw_value: price+time renders BOTH lines (2-row value box)', () => {
    const ctx = recCtx()
    const self = rtSelf({ p1: [10, 100], p2: [70, 130], price: true, time: true })
    RangeTool.methods.draw.call(self, ctx)
    const texts = opsNamed(ctx, 'fillText').map(t => t[1])
    expect(texts.some(t => /%/.test(t))).toBe(true)      // price row
    expect(texts.some(t => /bars/.test(t))).toBe(true)    // time row
  })

  // ── t2str: ms -> compact `1D 12h` style label ────────────────────────────
  it('t2str: sub-second -> empty string (no segment below 1s)', () => {
    // 500ms: the smallest unit (s) floors to 0 at i=0, and there is no i-1/i-2
    // tier, so the builder returns just the (empty, positive) sign prefix.
    expect(RangeTool.methods.t2str.call({}, 500)).toBe('')
  })
  it('t2str: minutes+seconds', () => {
    // 90_000 ms = 1m 30s
    expect(RangeTool.methods.t2str.call({}, 90_000)).toBe('1m 30s')
  })
  it('t2str: hours+minutes', () => {
    // 3_600_000 + 30*60_000 = 1h 30m
    expect(RangeTool.methods.t2str.call({}, 3_600_000 + 30 * 60_000)).toBe('1h 30m')
  })
  it('t2str: days+hours', () => {
    // 1 day + 12 hours
    expect(RangeTool.methods.t2str.call({}, 86_400_000 + 12 * 3_600_000)).toBe('1D 12h')
  })
  it('t2str: negative durations are sign-prefixed', () => {
    expect(RangeTool.methods.t2str.call({}, -90_000)).toBe('-1m 30s')
  })
  it('t2str: exact unit boundary has no remainder segment', () => {
    // exactly 2 minutes -> '2m 0s' (seconds remainder = 0 -> n2 falsy -> only '2m')
    expect(RangeTool.methods.t2str.call({}, 120_000)).toBe('2m')
  })
})

// ═════════════════════════════ OrderBox ═════════════════════════════════════
// Target the geometry / status / cursor branches NOT reached by the live
// component test (which mounts the box and exercises drag/redraw).
describe('OrderBox pure methods', () => {
  function obSelf(sett = {}, over = {}) {
    const self = bind(OrderBox, {
      $props: {
        layout: makeLayout(), settings: sett,
        colors: { back: '#000', textHL: '#cfe' }, font: '11px Arial',
      },
      pins: null, // pre-init: corner() must fall back to settings
      selected: false, show_pins: false, drag: null,
      _ghost: null, _dragOrder: null, _dragResize: null, _moveDy: 0,
      ...over,
    })
    return self
  }

  it('meta_info / use_for', () => {
    expect(OrderBox.methods.meta_info.call(obSelf())).toMatchObject({ author: 'order-box' })
    expect(OrderBox.methods.use_for.call(obSelf())).toEqual(['OrderBox'])
  })

  it('computeds: side/visible/orders/colours/font11 defaults + overrides', () => {
    const def = obSelf({})
    expect(OrderBox.computed.side.call(def)).toBe('buy')        // default
    expect(OrderBox.computed.visible.call(def)).toBe(true)
    expect(OrderBox.computed.orders.call(def)).toEqual([])      // non-array -> []
    expect(OrderBox.computed.color_buy.call(def)).toBe('#23a776')
    expect(OrderBox.computed.color_sell.call(def)).toBe('#e54150')
    expect(OrderBox.computed.fill_buy.call(def)).toBe('rgba(35,167,118,0.10)')
    expect(OrderBox.computed.fill_sell.call(def)).toBe('rgba(229,65,80,0.10)')
    expect(OrderBox.computed.font11.call(def)).toBe('11px  Arial')

    const sell = obSelf({ side: 'sell', visible: false, orders: 'nope', colorBuy: '#b', colorSell: '#s' })
    expect(OrderBox.computed.side.call(sell)).toBe('sell')
    expect(OrderBox.computed.visible.call(sell)).toBe(false)
    expect(OrderBox.computed.orders.call(sell)).toEqual([])     // string -> []
    expect(OrderBox.computed.color_buy.call(sell)).toBe('#b')
    expect(OrderBox.computed.color_sell.call(sell)).toBe('#s')
  })

  it('side: anything other than "sell" is "buy"', () => {
    expect(OrderBox.computed.side.call(obSelf({ side: 'long' }))).toBe('buy')
  })

  // ── corner() / box_rect() ────────────────────────────────────────────────
  it('corner(): pre-init falls back to settings.c0/c1', () => {
    const self = obSelf({ c0: [10, 50], c1: [40, 80] })
    expect(OrderBox.methods.corner.call(self, 0)).toEqual([10, 50])
    expect(OrderBox.methods.corner.call(self, 1)).toEqual([40, 80])
  })

  it('corner(): prefers live pin state when present', () => {
    const self = obSelf({ c0: [10, 50], c1: [40, 80] }, {
      pins: [{ t: 11, y$: 51 }, { t: 41, y$: 81 }],
    })
    expect(OrderBox.methods.corner.call(self, 0)).toEqual([11, 51])
    expect(OrderBox.methods.corner.call(self, 1)).toEqual([41, 81])
  })

  it('corner(): pin with null coords falls back to settings', () => {
    const self = obSelf({ c0: [10, 50], c1: [40, 80] }, {
      pins: [{ t: null, y$: null }, { t: null, y$: null }],
    })
    expect(OrderBox.methods.corner.call(self, 0)).toEqual([10, 50])
  })

  it('box_rect(): normalises corners (min/max) regardless of order', () => {
    const self = obSelf({ c0: [40, 80], c1: [10, 50] }) // reversed
    const r = OrderBox.methods.box_rect.call(self)
    // x: t2screen identity -> 40,10 -> xL=10,xR=40 ; y: $2screen -> 120,150 -> yT=120,yB=150
    expect(r).toEqual({ xL: 10, xR: 40, yT: 120, yB: 150 })
  })

  it('box_rect(): null corner -> null', () => {
    const self = obSelf({})
    expect(OrderBox.methods.box_rect.call(self)).toBeNull()
  })

  // ── order_status() aggregate ─────────────────────────────────────────────
  function statusSelf(orders, side = 'buy') {
    return obSelf({ side, orders })
  }
  it('order_status: no orders', () => {
    expect(OrderBox.methods.order_status.call(statusSelf([]))).toEqual({ label: 'No orders', color: '#5b6472', submittable: false })
  })
  it('order_status: all local -> Submit (accent, submittable)', () => {
    // {} -> status defaults to 'local' (st('local') true) -> Submit.
    const buy = OrderBox.methods.order_status.call(statusSelf([{ status: 'local' }, {}], 'buy'))
    expect(buy).toEqual({ label: 'Submit', color: '#23a776', submittable: true }) // buy accent
    const sell = OrderBox.methods.order_status.call(statusSelf([{ status: 'local' }, {}], 'sell'))
    expect(sell.color).toBe('#e54150') // sell accent
  })
  it('order_status: any cancelling -> Cancelling…', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'cancelling' }, { status: 'confirmed' }]))
    expect(s).toMatchObject({ label: 'Cancelling…', submittable: false })
  })
  it('order_status: any pending -> Pending…', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'pending' }, { status: 'confirmed' }]))
    expect(s.label).toBe('Pending…')
    // no local/rejected among {pending,confirmed} -> not resubmittable.
    expect(s.submittable).toBe(false)
  })

  it('order_status: pending + local -> Pending… BUT submittable (has_submittable)', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'pending' }, { status: 'local' }]))
    expect(s.label).toBe('Pending…')
    // the local order is resubmittable -> submittable flips true via has_submittable().
    expect(s.submittable).toBe(true)
  })

  it('order_status: cancelling wins over pending (precedence)', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'cancelling' }, { status: 'pending' }]))
    expect(s.label).toBe('Cancelling…')
  })
  it('order_status: all confirmed -> Confirmed (not submittable)', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'confirmed' }, { status: 'confirmed' }]))
    expect(s).toMatchObject({ label: 'Confirmed', submittable: false })
  })
  it('order_status: all cancelled -> Cancelled (resubmittable)', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'cancelled' }]))
    expect(s).toMatchObject({ label: 'Cancelled', submittable: true })
  })
  it('order_status: all rejected -> Rejected (resubmittable)', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'rejected' }]))
    expect(s).toMatchObject({ label: 'Rejected', submittable: true })
  })
  it('order_status: any rejected (mixed) -> Partially Rejected', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'rejected' }, { status: 'confirmed' }]))
    expect(s.label).toBe('Partially Rejected')
  })
  it('order_status: mixed confirmed+local -> Partially Confirmed (submittable via has_submittable)', () => {
    const s = OrderBox.methods.order_status.call(statusSelf([{ status: 'confirmed' }, { status: 'local' }]))
    expect(s).toMatchObject({ label: 'Partially Confirmed', submittable: true })
  })

  it('has_submittable: true if any local/rejected, false otherwise', () => {
    expect(OrderBox.methods.has_submittable.call(obSelf({ orders: [{ status: 'confirmed' }, { status: 'local' }] }))).toBe(true)
    expect(OrderBox.methods.has_submittable.call(obSelf({ orders: [{ status: 'rejected' }] }))).toBe(true)
    expect(OrderBox.methods.has_submittable.call(obSelf({ orders: [{ status: 'confirmed' }, { status: 'pending' }] }))).toBe(false)
  })

  it('has_live_orders: pending/confirmed/cancelling count as live', () => {
    expect(OrderBox.methods.has_live_orders.call(obSelf({ orders: [{ status: 'pending' }] }))).toBe(true)
    expect(OrderBox.methods.has_live_orders.call(obSelf({ orders: [{ status: 'confirmed' }] }))).toBe(true)
    expect(OrderBox.methods.has_live_orders.call(obSelf({ orders: [{ status: 'cancelling' }] }))).toBe(true)
    expect(OrderBox.methods.has_live_orders.call(obSelf({ orders: [{ status: 'local' }, { status: 'rejected' }] }))).toBe(false)
  })

  it('order_type_label: scaled / distribution / fallback', () => {
    expect(OrderBox.methods.order_type_label.call(obSelf({}))).toBe('Scaled Order')
    expect(OrderBox.methods.order_type_label.call(obSelf({ orderType: 'distribution' }))).toBe('Distribution')
    expect(OrderBox.methods.order_type_label.call(obSelf({ orderType: 'mystery' }))).toBe('Order')
  })

  it('order_summary: null when no orders', () => {
    expect(OrderBox.methods.order_summary.call(obSelf({ orders: [] }))).toBeNull()
  })

  it('order_summary: size-weighted average + filled tally; origQty/origSize fall back', () => {
    const self = obSelf({
      orders: [
        { price: 100, size: 1, status: 'confirmed' },
        { price: 110, size: 3, status: 'local' },
      ],
    })
    const s = OrderBox.methods.order_summary.call(self)
    expect(s.count).toBe(2)
    expect(s.totalSize).toBe(4)
    expect(s.filledCount).toBe(1)
    expect(s.filledSize).toBe(1)
    // weighted avg = (100*1 + 110*3) / 4 = 107.5
    expect(s.avgPrice).toBeCloseTo(107.5, 9)
    // no sett.qty/totalSize -> fall back to count / summed size
    expect(s.origQty).toBe(2)
    expect(s.origSize).toBe(4)
  })

  it('order_summary: explicit sett.qty/totalSize win; _moveDy shifts the avg', () => {
    const self = obSelf({ orders: [{ price: 100, size: 2 }], qty: 9, totalSize: 12.5 }, { _moveDy: 5 })
    const s = OrderBox.methods.order_summary.call(self)
    expect(s.origQty).toBe(9)
    expect(s.origSize).toBe(12.5)
    expect(s.avgPrice).toBeCloseTo(105, 9) // 100 + moveDy(5)
  })

  it('data_colors: buy -> color_buy, sell -> color_sell', () => {
    expect(OrderBox.methods.data_colors.call(obSelf({ side: 'buy' }))).toEqual(['#23a776'])
    expect(OrderBox.methods.data_colors.call(obSelf({ side: 'sell' }))).toEqual(['#e54150'])
  })

  // ── on_boundary() perimeter hit-test ─────────────────────────────────────
  it('on_boundary: within 5px of an edge is true, deep interior is false', () => {
    const self = obSelf()
    const r = { xL: 10, xR: 110, yT: 20, yB: 80 }
    expect(OrderBox.methods.on_boundary.call(self, r, 10, 50)).toBe(true)   // on left edge
    expect(OrderBox.methods.on_boundary.call(self, r, 110, 50)).toBe(true)  // on right edge
    expect(OrderBox.methods.on_boundary.call(self, r, 60, 20)).toBe(true)   // on top edge
    expect(OrderBox.methods.on_boundary.call(self, r, 60, 50)).toBe(false)  // dead centre
    expect(OrderBox.methods.on_boundary.call(self, r, 500, 500)).toBe(false) // far outside
  })

  // ── order_geometry(): chrome layout + row culling ────────────────────────
  it('order_geometry: eye/cog/submit chrome placed at top-left; rows produced for visible orders', () => {
    const ctx = recCtx()
    const self = obSelf({
      c0: [0, 50], c1: [200, 150], side: 'buy', visible: true,
      orders: [{ id: 'a', price: 100, size: 1, status: 'local' }],
    })
    const r = OrderBox.methods.box_rect.call(self)
    const g = OrderBox.methods.order_geometry.call(self, ctx, r)
    // eye at xL+4 / yT+4, 16x16.
    expect(g.eye).toMatchObject({ x: r.xL + 4, y: r.yT + 4, w: 16, h: 16 })
    // cog to the right of the eye.
    expect(g.cog.x).toBe(r.xL + 4 + 16 + 4)
    // submit button carries the status object + a measured width.
    // measureText('Submit') = 6 chars * 6 = 36; w = ceil(36) + BTN_PADX(8)*2 = 52.
    expect(g.submit.st.label).toBe('Submit')
    expect(g.submit.st.submittable).toBe(true) // all-local -> Submit
    expect(g.submit.w).toBe(52)
    expect(g.submit.h).toBe(16) // BTN_H
    // submit sits to the right of the cog: cog.x + EYE(16) + 4.
    expect(g.submit.x).toBe(g.cog.x + 16 + 4)
    expect(g.submit.y).toBe(r.yT + 4)
    // one visible order -> one row, with grab/del/widget rects.
    expect(g.rows.length).toBe(1)
    expect(g.rows[0].id).toBe('a')
    expect(g.rows[0].status).toBe('local')
    expect(g.rows[0].del.w).toBe(18)
    expect(g.rows[0].grab.w).toBe(g.rows[0].widget.w - 18) // grab = widget - DEL_W
    // del rect butts up against the right edge of the widget.
    expect(g.rows[0].del.x).toBe(g.rows[0].widget.x + g.rows[0].widget.w - 18)
    // row y projects the order price 100 -> $2screen(100) = 100, inside [50,150].
    expect(g.rows[0].y).toBe(100)
    // 8 resize handles for a valid 2-corner box.
    expect(g.resize.length).toBe(8)
    // The four corner handles sit on the box corners (HND=8 half-size centring).
    const corners = g.resize.slice(0, 4).map(h => [h.rect.x + 8, h.rect.y + 8])
    expect(corners).toEqual([[r.xL, r.yT], [r.xR, r.yT], [r.xL, r.yB], [r.xR, r.yB]])
  })

  it('order_geometry: visible=false suppresses order rows', () => {
    const ctx = recCtx()
    const self = obSelf({
      c0: [0, 50], c1: [200, 150], visible: false,
      orders: [{ id: 'a', price: 100, size: 1 }],
    })
    const r = OrderBox.methods.box_rect.call(self)
    const g = OrderBox.methods.order_geometry.call(self, ctx, r)
    expect(g.rows.length).toBe(0)
  })

  it('order_geometry: an order priced far outside the box is culled', () => {
    const ctx = recCtx()
    const self = obSelf({
      c0: [0, 50], c1: [200, 150], visible: true,
      orders: [{ id: 'far', price: 9999, size: 1 }], // y way above the box top
    })
    const r = OrderBox.methods.box_rect.call(self)
    const g = OrderBox.methods.order_geometry.call(self, ctx, r)
    expect(g.rows.length).toBe(0)
  })

  it('order_geometry: ROW_H slop band — y exactly on the cull boundary is KEPT', () => {
    const ctx = recCtx()
    // r = {yT:50, yB:150}. price 32 -> y = $2screen(32) = 168 = yB + ROW_H(18):
    // the cull test is `y > yB + ROW_H` (strict) so 168 survives the band.
    const self = obSelf({
      c0: [0, 50], c1: [200, 150], visible: true,
      orders: [{ id: 'edge', price: 32, size: 1 }],
    })
    const r = OrderBox.methods.box_rect.call(self)
    const kept = OrderBox.methods.order_geometry.call(self, ctx, r)
    expect(kept.rows.length).toBe(1)
    expect(kept.rows[0].y).toBe(168)

    // One px further out (price 31 -> y 169 > 168) is culled.
    const self2 = obSelf({
      c0: [0, 50], c1: [200, 150], visible: true,
      orders: [{ id: 'gone', price: 31, size: 1 }],
    })
    const g2 = OrderBox.methods.order_geometry.call(self2, ctx, OrderBox.methods.box_rect.call(self2))
    expect(g2.rows.length).toBe(0)
  })

  // ── draw_dist_curve(): faint distribution spline ─────────────────────────
  it('draw_dist_curve: < 2 orders draws nothing', () => {
    const ctx = recCtx()
    const self = obSelf({ orders: [{ price: 100, size: 1 }], visible: true })
    OrderBox.methods.draw_dist_curve.call(self, ctx, { xL: 0, xR: 200 }, '#fff')
    expect(ctx.ops.length).toBe(0)
  })

  it('draw_dist_curve: >= 2 orders strokes a spline + a dot per order', () => {
    const ctx = recCtx()
    const self = obSelf({
      orders: [{ price: 100, size: 1 }, { price: 110, size: 2 }, { price: 120, size: 3 }],
      visible: true,
    })
    OrderBox.methods.draw_dist_curve.call(self, ctx, { xL: 0, xR: 200 }, '#fff')
    expect(opsNamed(ctx, 'stroke').length).toBe(1)        // the spline
    expect(opsNamed(ctx, 'arc').length).toBe(3)           // one dot per order
    expect(opsNamed(ctx, 'fill').length).toBe(3)
    // The dot x reflects size: bigger order bulges DEEPER (further LEFT of xR).
    // W = min(40, (200-0)*0.25) = 40; x = xR(200) - 4 - (size/maxSize)*40.
    // Dots are sorted by ascending y (= descending price): 120,110,100.
    const dotX = opsNamed(ctx, 'arc').map(o => o[1])
    expect(dotX).toEqual([
      200 - 4 - (3 / 3) * 40, // price 120, size 3 (deepest)   -> 156
      200 - 4 - (2 / 3) * 40, // price 110, size 2             -> ~169.33
      200 - 4 - (1 / 3) * 40, // price 100, size 1 (shallowest)-> ~182.67
    ])
    expect(dotX[0]).toBeLessThan(dotX[1]) // bigger size = smaller x = deeper bulge
    expect(dotX[1]).toBeLessThan(dotX[2])
    // Faint, side-coloured chrome.
    expect(ctx.globalAlpha).toBe(0.35)
    expect(ctx.fillStyle).toBe('#fff')
  })

  it('draw_dist_curve: not visible -> nothing', () => {
    const ctx = recCtx()
    const self = obSelf({ orders: [{ price: 1, size: 1 }, { price: 2, size: 2 }], visible: false })
    OrderBox.methods.draw_dist_curve.call(self, ctx, { xL: 0, xR: 200 }, '#fff')
    expect(ctx.ops.length).toBe(0)
  })

  it('draw_dist_curve: all-zero sizes -> nothing (maxSize 0 guard)', () => {
    const ctx = recCtx()
    const self = obSelf({ orders: [{ price: 1, size: 0 }, { price: 2, size: 0 }], visible: true })
    OrderBox.methods.draw_dist_curve.call(self, ctx, { xL: 0, xR: 200 }, '#fff')
    expect(ctx.ops.length).toBe(0)
  })

  it('draw_dist_curve: a too-narrow box (W < 6) draws nothing', () => {
    const ctx = recCtx()
    const self = obSelf({ orders: [{ price: 1, size: 1 }, { price: 2, size: 2 }], visible: true })
    // (xR-xL)*0.25 = 5 < 6 -> early return
    OrderBox.methods.draw_dist_curve.call(self, ctx, { xL: 0, xR: 20 }, '#fff')
    expect(ctx.ops.length).toBe(0)
  })

  // ── draw_eye(): open vs closed ───────────────────────────────────────────
  it('draw_eye: open eye draws the lens arc; closed eye draws the slash', () => {
    const e = { x: 0, y: 0, w: 16, h: 16 }
    const open = recCtx()
    OrderBox.methods.draw_eye.call(obSelf(), open, e, true, '#fff')
    expect(opsNamed(open, 'arc').length).toBe(1) // pupil
    // lens outline = two quadraticCurveTo, NO lineTo when open (only the arc pupil).
    expect(opsNamed(open, 'quadraticCurveTo').length).toBe(2)
    expect(opsNamed(open, 'lineTo').length).toBe(0)
    // stroke called twice: lens outline + pupil.
    expect(opsNamed(open, 'stroke').length).toBe(2)
    expect(open.strokeStyle).toBe('#fff')

    const closed = recCtx()
    OrderBox.methods.draw_eye.call(obSelf(), closed, e, false, '#fff')
    expect(opsNamed(closed, 'arc').length).toBe(0) // no pupil
    expect(opsNamed(closed, 'quadraticCurveTo').length).toBe(2) // lens still drawn
    // slash: exactly one extra moveTo+lineTo over the lens outline.
    expect(opsNamed(closed, 'lineTo').length).toBe(1)
    // slash runs bottom-left -> top-right of the eye box.
    expect(opsNamed(closed, 'lineTo')[0]).toEqual(['lineTo', e.x + e.w - 1, e.y + 1])
    expect(opsNamed(closed, 'stroke').length).toBe(2) // lens + slash
  })

  // ── draw_cog(): locked dims the gear ─────────────────────────────────────
  it('draw_cog: 8 teeth + body + hub; locked sets globalAlpha 0.35', () => {
    const c = { x: 0, y: 0, w: 16, h: 16 }
    const ctx = recCtx()
    OrderBox.methods.draw_cog.call(obSelf(), ctx, c, '#fff', true)
    // body arc + hub arc + 8 teeth strokes.
    expect(opsNamed(ctx, 'arc').length).toBe(2)
    // 8 teeth each beginPath+stroke, plus body + hub strokes = 10 strokes total.
    expect(opsNamed(ctx, 'stroke').length).toBe(10)
    // locked -> dimmed (our recorder's restore is a no-op, so the set value sticks).
    expect(ctx.globalAlpha).toBe(0.35)
    expect(ctx.strokeStyle).toBe('#fff')

    // Unlocked: identical geometry but full opacity.
    const ctx2 = recCtx()
    OrderBox.methods.draw_cog.call(obSelf(), ctx2, c, '#fff', false)
    expect(opsNamed(ctx2, 'stroke').length).toBe(10)
    expect(ctx2.globalAlpha).toBe(1) // never dimmed
  })

  // ── draw_submit(): submittable fills, else outlined ──────────────────────
  it('draw_submit: submittable button is filled; non-submittable is outlined', () => {
    const filled = recCtx()
    OrderBox.methods.draw_submit.call(obSelf(), filled, {
      x: 0, y: 0, w: 40, h: 16, st: { label: 'Submit', color: '#0f0', submittable: true },
    })
    expect(opsNamed(filled, 'fill').length).toBe(1)
    expect(opsNamed(filled, 'fillText')[0][1]).toBe('Submit')

    const outlined = recCtx()
    OrderBox.methods.draw_submit.call(obSelf(), outlined, {
      x: 0, y: 0, w: 40, h: 16, st: { label: 'Confirmed', color: '#0a0', submittable: false },
    })
    expect(opsNamed(outlined, 'fill').length).toBe(0)
    expect(opsNamed(outlined, 'stroke').length).toBe(1)  // outline
  })

  // ── draw(): full pipeline, box stroke colour by side, collision pushed ────
  it('draw: buy box fills+strokes with buy colours and registers a box collision', () => {
    const ctx = recCtx()
    const self = obSelf({
      c0: [0, 50], c1: [200, 150], side: 'buy', visible: true,
      orders: [{ id: 'a', price: 100, size: 1, status: 'local' }],
    }, { collisions: [], render_pins() {} })
    OrderBox.methods.draw.call(self, ctx)
    // The FIRST fillRect is the box body: r = {xL:0,xR:200,yT:50,yB:150}.
    const boxFill = opsNamed(ctx, 'fillRect')[0]
    expect(boxFill).toEqual(['fillRect', 0, 50, 200, 100])
    // The FIRST strokeRect is the box outline (inset by 0.5 each side).
    const boxStroke = opsNamed(ctx, 'strokeRect')[0]
    expect(boxStroke).toEqual(['strokeRect', 0.5, 50.5, 199, 99])
    // a single box-collision predicate registered.
    expect(self.collisions.length).toBe(1)
    const hit = self.collisions[0]
    // r = {xL:0,xR:200,yT:50,yB:150}; centre is inside, far point outside.
    expect(hit(100, 100)).toBe(true)
    expect(hit(900, 900)).toBe(false)
    // boundary is inclusive at the edges, exclusive just outside.
    expect(hit(0, 50)).toBe(true)
    expect(hit(-1, 50)).toBe(false)
    // _geom cached for hit-testing, with the same chrome the geometry method built.
    expect(self._geom).toBeTruthy()
    expect(self._geom.rows.length).toBe(1)
    expect(self._geom.submit.st.label).toBe('Submit')
  })

  it('draw: null box_rect (no corners) -> early return, nothing drawn', () => {
    const ctx = recCtx()
    const self = obSelf({}, { collisions: [] })
    OrderBox.methods.draw.call(self, ctx)
    expect(ctx.ops.length).toBe(0)
    expect(self.collisions.length).toBe(0)
  })

  it('draw: selected box also draws the 8 resize handles', () => {
    const ctx = recCtx()
    const self = obSelf({
      c0: [0, 50], c1: [200, 150], side: 'sell', visible: true, orders: [],
    }, { collisions: [], selected: true, render_pins() {} })
    OrderBox.methods.draw.call(self, ctx)
    // No orders -> no order rows / dist curve / summary, so the ONLY strokeRects are
    // the box outline (1) + 8 resize handles = exactly 9.
    expect(opsNamed(ctx, 'strokeRect').length).toBe(9)
    // 8 handle fillRects use the chrome back colour ('#000' from obSelf colors).
    expect(ctx.fillStyle).toBe('#000')
    // a sell box strokes with the sell colour.
    expect(ctx.strokeStyle).toBe('#e54150')
  })

  it('draw: unselected box draws NO resize handles', () => {
    const ctx = recCtx()
    const self = obSelf({
      c0: [0, 50], c1: [200, 150], side: 'buy', visible: true, orders: [],
    }, { collisions: [], selected: false, show_pins: false, render_pins() {} })
    OrderBox.methods.draw.call(self, ctx)
    // Only the box outline strokeRect; no handles.
    expect(opsNamed(ctx, 'strokeRect').length).toBe(1)
  })

  // ── draw_ghost(): move preview ───────────────────────────────────────────
  it('draw_ghost: no/zero offset -> nothing; non-zero offset -> dashed rect', () => {
    const none = recCtx()
    OrderBox.methods.draw_ghost.call(obSelf({ c0: [0, 50], c1: [200, 150] }, { _ghost: null }), none, '#fff')
    expect(none.ops.length).toBe(0)

    const zero = recCtx()
    OrderBox.methods.draw_ghost.call(obSelf({ c0: [0, 50], c1: [200, 150] }, { _ghost: { dt: 0, dy: 0 } }), zero, '#fff')
    expect(zero.ops.length).toBe(0)

    const moved = recCtx()
    OrderBox.methods.draw_ghost.call(obSelf({ c0: [0, 50], c1: [200, 150] }, { _ghost: { dt: 10, dy: 5 } }), moved, '#fff')
    expect(opsNamed(moved, 'strokeRect').length).toBe(1)
    // Ghost rect = corners shifted by (dt=10,dy=5): c0->[10,55], c1->[210,155].
    // x: t2screen identity -> 10,210; y: $2screen -> 145,45 -> yT=45,yB=145.
    // strokeRect inset 0.5 each side: (10.5, 45.5, 199, 99).
    expect(opsNamed(moved, 'strokeRect')[0]).toEqual(['strokeRect', 10.5, 45.5, 199, 99])
    expect(moved.strokeStyle).toBe('#fff')
    // dashed: setLineDash([5,4]) then reset [].
    const dashes = opsNamed(moved, 'setLineDash')
    expect(dashes[0]).toEqual(['setLineDash', [5, 4]])
    expect(dashes[dashes.length - 1]).toEqual(['setLineDash', []])
  })

  it('draw_ghost: only a y-offset (dt=0) still draws the preview', () => {
    const ctx = recCtx()
    // dy alone is truthy -> NOT the (!dt && !dy) early-return; x stays put.
    OrderBox.methods.draw_ghost.call(obSelf({ c0: [0, 50], c1: [200, 150] }, { _ghost: { dt: 0, dy: 5 } }), ctx, '#fff')
    expect(opsNamed(ctx, 'strokeRect').length).toBe(1)
    // x unchanged (0,200), y shifted by 5: $2screen(55)=145, $2screen(155)=45.
    expect(opsNamed(ctx, 'strokeRect')[0]).toEqual(['strokeRect', 0.5, 45.5, 199, 99])
  })

  // ── set_cursor(): only mutates when changed (Node: document undefined → no-op)
  it('set_cursor: server path (document undefined) returns early, sets nothing', () => {
    // Only meaningful when there is no DOM — guard so a jsdom global doesn't
    // silently turn this into a no-assertion test.
    expect(typeof document).toBe('undefined')
    const self = obSelf({}, { _cursor: 'pre' })
    expect(() => OrderBox.methods.set_cursor.call(self, 'grab')).not.toThrow()
    // Early return BEFORE touching _cursor: it stays at its prior value.
    expect(self._cursor).toBe('pre')
  })

  // ── remove_tool(): live vs deletable routing ─────────────────────────────
  it('remove_tool: not selected -> no event', () => {
    const events = []
    const self = obSelf({ orders: [{ status: 'local' }] }, {
      selected: false, custom_event: (...a) => events.push(a),
    })
    OrderBox.methods.remove_tool.call(self)
    expect(events.length).toBe(0)
  })

  it('remove_tool: selected + live orders -> cancel-orders', () => {
    const events = []
    const self = obSelf({ orders: [{ status: 'confirmed' }] }, {
      selected: true, custom_event: (...a) => events.push(a),
    })
    OrderBox.methods.remove_tool.call(self)
    expect(events).toEqual([['cancel-orders']])
  })

  it('remove_tool: selected + only local/rejected -> remove-tool', () => {
    const events = []
    const self = obSelf({ orders: [{ status: 'local' }, { status: 'rejected' }] }, {
      selected: true, custom_event: (...a) => events.push(a),
    })
    OrderBox.methods.remove_tool.call(self)
    expect(events).toEqual([['remove-tool']])
  })

  // ── delete_order(): live order routes a cancel; local order filters out ──
  it('delete_order: live order -> cancel-orders (no local removal)', () => {
    const events = []
    const self = obSelf({ orders: [{ id: 'x', status: 'confirmed' }] }, {
      custom_event: (...a) => events.push(a),
    })
    OrderBox.methods.delete_order.call(self, 'x')
    expect(events).toEqual([['cancel-orders']])
  })

  it('delete_order: local order -> change-settings with the order spliced out by id', () => {
    const events = []
    const self = obSelf({ orders: [{ id: 'ord-1', status: 'local' }, { id: 'ord-10', status: 'local' }] }, {
      custom_event: (...a) => events.push(a),
    })
    OrderBox.methods.delete_order.call(self, 'ord-1')
    expect(events.length).toBe(1)
    expect(events[0][0]).toBe('change-settings')
    // identity-based filter: ord-10 must survive (no substring collision).
    expect(events[0][1].orders).toEqual([{ id: 'ord-10', status: 'local' }])
  })

  // ── set_orders(): maps and re-emits a NEW array ──────────────────────────
  it('set_orders: emits change-settings with the mapped order array', () => {
    const events = []
    const self = obSelf({ orders: [{ id: 'a', price: 1 }, { id: 'b', price: 2 }] }, {
      custom_event: (...a) => events.push(a),
    })
    OrderBox.methods.set_orders.call(self, o => o.id === 'a' ? { ...o, price: 9 } : o)
    expect(events[0][0]).toBe('change-settings')
    expect(events[0][1].orders).toEqual([{ id: 'a', price: 9 }, { id: 'b', price: 2 }])
  })

  // ── recompute_orders(): live-order guard + fresh distribution ────────────
  it('recompute_orders: live orders present -> no-op (no event)', () => {
    const events = []
    const self = obSelf({ c0: [0, 50], c1: [200, 150], orders: [{ status: 'confirmed' }] }, {
      custom_event: (...a) => events.push(a),
    })
    OrderBox.methods.recompute_orders.call(self)
    expect(events.length).toBe(0)
  })

  it('recompute_orders: derives a fresh local distribution from the corner range', () => {
    const events = []
    const self = obSelf({
      c0: [0, 50], c1: [200, 150], qty: 3, totalSize: 6, distribution: 'flat',
      orders: [{ status: 'local' }],
    }, { custom_event: (...a) => events.push(a) })
    OrderBox.methods.recompute_orders.call(self)
    expect(events.length).toBe(1)
    expect(events[0][0]).toBe('change-settings')
    const fresh = events[0][1].orders
    expect(fresh.length).toBe(3)            // qty
    expect(fresh.every(o => o.status === 'local')).toBe(true)
    // Deterministic ids ord-1..ord-3 (no Date.now/random).
    expect(fresh.map(o => o.id)).toEqual(['ord-1', 'ord-2', 'ord-3'])
    // flat distribution across [low,high]=[50,150]: endpoints anchored, midpoint centred.
    expect(fresh.map(o => o.price)).toEqual([50, 100, 150])
    // Σ size === totalSize (6), flat -> 2 each.
    expect(fresh.map(o => o.size)).toEqual([2, 2, 2])
    expect(fresh.reduce((a, o) => a + o.size, 0)).toBe(6)
  })
})
