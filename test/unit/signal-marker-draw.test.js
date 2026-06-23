// Pure-node pin for the SignalMarker overlay's draw() pipeline. SignalMarker
// renders a vertical "signal" rule per row [ts, low, label?]: a centre line from
// the grid bottom (layout.height) up to $2screen(low)+2 (full height when low is
// absent), an optional translucent glow band, an optional caret + label under the
// low, and dashed/solid styling. We invoke the real draw() (and the real computed
// getters) bound to a fake `this` against a recording 2D context — the same
// direct-invocation technique as volume-overlay.test.js — so no DOM/mount is
// needed.
import { test, expect, describe } from 'vitest'
import SignalMarker from '../../src/components/overlays/SignalMarker.js'

// --- recording 2D context ------------------------------------------------
// Captures every drawing op (with args) in order, plus the live style state at
// the moment each op fires (fillStyle/strokeStyle/lineWidth/textAlign/baseline/
// font), so assertions can pin both geometry and the colour used per call.
function recCtx() {
    const ops = []
    const state = {
        fillStyle: null, strokeStyle: null, lineWidth: null,
        textAlign: null, textBaseline: null, font: null,
    }
    const snap = () => ({ ...state })
    return {
        ops,
        get fillStyle() { return state.fillStyle },
        set fillStyle(v) { state.fillStyle = v },
        get strokeStyle() { return state.strokeStyle },
        set strokeStyle(v) { state.strokeStyle = v },
        get lineWidth() { return state.lineWidth },
        set lineWidth(v) { state.lineWidth = v },
        get textAlign() { return state.textAlign },
        set textAlign(v) { state.textAlign = v },
        get textBaseline() { return state.textBaseline },
        set textBaseline(v) { state.textBaseline = v },
        get font() { return state.font },
        set font(v) { state.font = v },
        fillRect(x, y, w, h) { ops.push({ op: 'fillRect', x, y, w, h, ...snap() }) },
        beginPath() { ops.push({ op: 'beginPath' }) },
        moveTo(x, y) { ops.push({ op: 'moveTo', x, y }) },
        lineTo(x, y) { ops.push({ op: 'lineTo', x, y }) },
        closePath() { ops.push({ op: 'closePath' }) },
        stroke() { ops.push({ op: 'stroke', ...snap() }) },
        fill() { ops.push({ op: 'fill', ...snap() }) },
        fillText(text, x, y) { ops.push({ op: 'fillText', text, x, y, ...snap() }) },
        setLineDash(arr) { ops.push({ op: 'setLineDash', dash: arr.slice() }) },
    }
}

// Deterministic, invertible-by-eye layout maps.
//   t2screen: ts -> x (×0.001 keeps x small/finite for any ms timestamp)
//   $2screen: value -> y (linear, finite for any finite number)
const LAYOUT = {
    height: 400,
    t2screen: (t) => t * 0.001,
    $2screen: (v) => 500 - v,   // higher price -> smaller y (up)
}

// Build a fake `this` for draw(): real computed getters resolved from `sett`,
// real $props (layout/data/font). Mirrors the SignalMarker.computed contract so
// the production getters (color/band_color/line_width/glow_width/dashed/
// show_label/new_font) are themselves exercised, not stubbed.
function mkSelf({ data, sett = {}, font = '11px Arial' } = {}) {
    const C = SignalMarker.computed
    const base = {
        sett,
        $props: { layout: LAYOUT, data, font },
    }
    return {
        ...base,
        get color() { return C.color.call(base) },
        get band_color() { return C.band_color.call(base) },
        get line_width() { return C.line_width.call(base) },
        get glow_width() { return C.glow_width.call(base) },
        get dashed() { return C.dashed.call(base) },
        get show_label() { return C.show_label.call(base) },
        get new_font() { return C.new_font.call(base) },
    }
}

const run = (cfg) => {
    const ctx = recCtx()
    SignalMarker.methods.draw.call(mkSelf(cfg), ctx)
    return ctx.ops
}
const only = (ops, op) => ops.filter((o) => o.op === op)

// ------------------------------------------------------------------------

describe('SignalMarker.draw — line geometry & hasLow gate', () => {
    test('finite low: vertical line from bottom up to $2screen(low)+2 at x=t2screen(ts)', () => {
        const ts = 1000, low = 100
        const ops = run({ data: [[ts, low, 'sig']] })
        const x = LAYOUT.t2screen(ts)        // 1
        const top = LAYOUT.$2screen(low) + 2 // 500-100+2 = 402

        const move = only(ops, 'moveTo')[0]
        const line = only(ops, 'lineTo')[0]
        expect(move).toMatchObject({ x, y: LAYOUT.height }) // start at bottom (400)
        expect(line).toMatchObject({ x, y: top })           // up to low+2
        // crisp centre line: stroked with color + line_width
        const stroke = only(ops, 'stroke')[0]
        expect(stroke.strokeStyle).toBe('#f5c518')
        expect(stroke.lineWidth).toBe(1.5)
    })

    test('null low (row [ts, null, label]): full-height line (top=0) and NO caret/label', () => {
        const ops = run({ data: [[2000, null, 'nope']] })
        const x = LAYOUT.t2screen(2000)
        expect(only(ops, 'moveTo')[0]).toMatchObject({ x, y: 400 })
        expect(only(ops, 'lineTo')[0]).toMatchObject({ x, y: 0 }) // full height
        // hasLow false -> no caret triangle (no closePath/fill) and no label
        expect(only(ops, 'closePath')).toHaveLength(0)
        expect(only(ops, 'fill')).toHaveLength(0)
        expect(only(ops, 'fillText')).toHaveLength(0)
    })

    test('absent low element (row [ts]) is treated as null -> full-height, no caret', () => {
        const ops = run({ data: [[3000]] })
        expect(only(ops, 'lineTo')[0].y).toBe(0)
        expect(only(ops, 'fill')).toHaveLength(0)
    })

    test('decimal-STRING low is coerced via Number() (not NaN)', () => {
        const ops = run({ data: [[1000, '63597', 'bull']] })
        const top = LAYOUT.$2screen(63597) + 2 // 500-63597+2 = -63095
        const line = only(ops, 'lineTo')[0]
        expect(line.y).toBe(top)
        expect(Number.isNaN(line.y)).toBe(false)
        // caret/label gated on hasLow -> string low is finite, so caret drawn
        expect(only(ops, 'fill').length).toBeGreaterThan(0)
    })
})

describe('SignalMarker.draw — glow band', () => {
    test('glow_width>0: fillRect band at x-glow/2, top, glow, bottom-top in band_color', () => {
        const ts = 5000, low = 100
        const ops = run({ data: [[ts, low, 'g']] }) // default glow_width = 7
        const x = LAYOUT.t2screen(ts)
        const top = LAYOUT.$2screen(low) + 2
        const rects = only(ops, 'fillRect')
        expect(rects).toHaveLength(1)
        expect(rects[0]).toMatchObject({
            x: x - 7 / 2, y: top, w: 7, h: LAYOUT.height - top,
            fillStyle: 'rgba(245, 197, 24, 0.10)',
        })
    })

    test('glow_width=0 (glowWidth "0"): NO fillRect band', () => {
        const ops = run({ data: [[5000, 100, 'g']], sett: { glowWidth: '0' } })
        expect(only(ops, 'fillRect')).toHaveLength(0)
        // line itself is still drawn
        expect(only(ops, 'stroke').length).toBeGreaterThan(0)
    })
})

describe('SignalMarker.draw — dashed styling', () => {
    test('dashed=true: setLineDash([5,4]) before stroke, reset setLineDash([]) after', () => {
        const ops = run({ data: [[1000, 100, 'd']], sett: { dashed: true } })
        const dashOps = only(ops, 'setLineDash')
        expect(dashOps).toHaveLength(2)
        expect(dashOps[0].dash).toEqual([5, 4])
        expect(dashOps[1].dash).toEqual([])
        // ordering: set dash, then stroke, then reset dash
        const idxSet = ops.findIndex((o) => o.op === 'setLineDash' && o.dash.length === 2)
        const idxStroke = ops.findIndex((o) => o.op === 'stroke')
        const idxReset = ops.findIndex((o) => o.op === 'setLineDash' && o.dash.length === 0)
        expect(idxSet).toBeLessThan(idxStroke)
        expect(idxStroke).toBeLessThan(idxReset)
    })

    test('default (no dashed): no setLineDash calls at all', () => {
        const ops = run({ data: [[1000, 100, 'd']] })
        expect(only(ops, 'setLineDash')).toHaveLength(0)
    })
})

describe('SignalMarker.draw — caret triangle', () => {
    test('caret (moveTo/lineTo x2/closePath/fill) drawn only when hasLow', () => {
        const ts = 1000, low = 100
        const ops = run({ data: [[ts, low]] }) // no label -> caret yes, label no
        const x = LAYOUT.t2screen(ts)
        const cy = LAYOUT.$2screen(low) + 6
        expect(only(ops, 'closePath')).toHaveLength(1)
        const fills = only(ops, 'fill')
        expect(fills).toHaveLength(1)
        expect(fills[0].fillStyle).toBe('#f5c518') // caret filled with color

        // caret vertices: apex (x,cy) then (x-4,cy+6) then (x+4,cy+6)
        const carMoves = only(ops, 'moveTo')
        const carLines = only(ops, 'lineTo')
        // the caret's moveTo is the SECOND beginPath group (first is the line)
        const apex = carMoves[carMoves.length - 1]
        expect(apex).toMatchObject({ x, y: cy })
        const v2 = carLines[carLines.length - 2]
        const v3 = carLines[carLines.length - 1]
        expect(v2).toMatchObject({ x: x - 4, y: cy + 6 })
        expect(v3).toMatchObject({ x: x + 4, y: cy + 6 })
    })

    test('no caret when hasLow false', () => {
        const ops = run({ data: [[1000, null]] })
        expect(only(ops, 'closePath')).toHaveLength(0)
    })
})

describe('SignalMarker.draw — label gate', () => {
    test('label drawn centered, baseline top then restored to alphabetic (show_label default + non-empty)', () => {
        const ts = 1000, low = 100
        const ops = run({ data: [[ts, low, 'BULL']] })
        const x = LAYOUT.t2screen(ts)
        const cy = LAYOUT.$2screen(low) + 6
        const texts = only(ops, 'fillText')
        expect(texts).toHaveLength(1)
        expect(texts[0]).toMatchObject({
            text: 'BULL', x, y: cy + 9,
            textAlign: 'center', textBaseline: 'top', fillStyle: '#f5c518',
        })
        // baseline restored to 'alphabetic' after the label by end of draw
        const ctx2 = recCtx()
        SignalMarker.methods.draw.call(mkSelf({ data: [[ts, low, 'BULL']] }), ctx2)
        // last textBaseline mutation is the restore; the fillText snap shows 'top',
        // and after draw the live state is 'alphabetic'
        expect(ctx2.textBaseline).toBe('alphabetic')
    })

    test('non-string label is coerced via String() in fillText', () => {
        const ops = run({ data: [[1000, 100, 42]] })
        expect(only(ops, 'fillText')[0].text).toBe('42')
    })

    test('show_label=false (showLabel:false): no fillText', () => {
        const ops = run({ data: [[1000, 100, 'BULL']], sett: { showLabel: false } })
        expect(only(ops, 'fillText')).toHaveLength(0)
        // caret still drawn (hasLow true)
        expect(only(ops, 'fill').length).toBeGreaterThan(0)
    })

    test('empty-string label: no fillText (caret still drawn)', () => {
        const ops = run({ data: [[1000, 100, '']] })
        expect(only(ops, 'fillText')).toHaveLength(0)
        expect(only(ops, 'fill').length).toBeGreaterThan(0)
    })
})

describe('SignalMarker.draw — skip & empty-data guards', () => {
    test('rows with p==null or p[0]==null are skipped without throwing', () => {
        const ops = run({ data: [null, [null, 100, 'x'], [1000, 100, 'ok']] })
        // only the valid row drew a centre line
        expect(only(ops, 'moveTo').filter((m) => m.y === LAYOUT.height)).toHaveLength(1)
        expect(only(ops, 'fillText')).toHaveLength(1)
        expect(only(ops, 'fillText')[0].text).toBe('ok')
    })

    test('empty data returns early with zero ctx calls', () => {
        expect(run({ data: [] })).toHaveLength(0)
    })

    test('missing data returns early (no ctx calls, no throw)', () => {
        const ctx = recCtx()
        expect(() => SignalMarker.methods.draw.call(mkSelf({ data: undefined }), ctx)).not.toThrow()
        expect(ctx.ops).toHaveLength(0)
    })

    test('multiple valid rows each emit their own line + caret', () => {
        const ops = run({ data: [[1000, 100, 'a'], [2000, 120, 'b']] })
        // two bottom-anchored centre lines, two carets (closePath x2), two labels
        expect(only(ops, 'moveTo').filter((m) => m.y === LAYOUT.height)).toHaveLength(2)
        expect(only(ops, 'closePath')).toHaveLength(2)
        expect(only(ops, 'fillText').map((o) => o.text)).toEqual(['a', 'b'])
    })
})

describe('SignalMarker — static contract', () => {
    test('use_for() returns ["SignalMarker"]', () => {
        expect(SignalMarker.methods.use_for.call({})).toEqual(['SignalMarker'])
    })

    test('legend() returns [] (no legend row)', () => {
        expect(SignalMarker.methods.legend.call({})).toEqual([])
    })

    test('meta_info() exposes name/version/desc', () => {
        expect(SignalMarker.methods.meta_info.call({})).toMatchObject({
            author: 'TVJS', version: '1.0.0',
        })
        expect(SignalMarker.name).toBe('SignalMarker')
    })

    test('computed defaults: color/band/line_width/glow_width/dashed/show_label', () => {
        const C = SignalMarker.computed
        const self = { sett: {}, $props: { font: '12px Roboto' } }
        expect(C.color.call(self)).toBe('#f5c518')
        expect(C.band_color.call(self)).toBe('rgba(245, 197, 24, 0.10)')
        expect(C.line_width.call(self)).toBe(1.5)
        expect(C.glow_width.call(self)).toBe(7)
        expect(C.dashed.call(self)).toBe(false)
        expect(C.show_label.call(self)).toBe(true)
        // new_font falls back to 10px + the family from $props.font
        expect(C.new_font.call(self)).toBe('10px  Roboto')
    })
})
