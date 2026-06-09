// Pins the bold-Y-axis-label fix: the cursor-only fast path band-clears
// [top, bottom] around the old panel and then _repaintLabels() restores the
// value labels in that band. The old guard repainted labels up to PANHEIGHT
// (22px) ABOVE the cleared rect — those transparent-background glyphs were
// fillText-ed onto un-cleared pixels every frame as the cursor swept past and
// accumulated into a BOLD smear. _repaintLabels must now repaint ONLY labels
// whose glyph box intersects the cleared band (no bold), while still repainting
// labels whose glyph merely reaches into the band (no clipping).
import { test, expect, describe } from 'vitest'
import Sidebar from '../../src/components/js/sidebar.js'

function mockCtx(font = '11px Arial') {
  const fills = []
  return {
    font, fillStyle: '', strokeStyle: '', textAlign: '',
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
    fillText: (t, x, y) => fills.push({ t, x, y }),
    _fills: fills,
  }
}

// Build a `this` for Sidebar.prototype._repaintLabels with labels at the given
// baseline Ys (labelY === p[0] + 4, so we store p[0] = y - 4).
function selfWith(baselineYs, font) {
  const ctx = mockCtx(font)
  const self = {
    _labelGeom: { x1Base: 0, x2Offset: 4, textOffset: 6, textAlign: 'left' },
    layout: {
      ys: baselineYs.map((y, i) => [y - 4, 100 + i]),
      height: 100000,
      prec: 2,
    },
    $p: { font: font || '11px Arial', colors: { text: '#fff', scale: '#888' } },
    ctx,
  }
  return { self, ctx }
}

function paintedBaselines(ctx) {
  return ctx._fills.map(f => f.y).sort((a, b) => a - b)
}

describe('Sidebar._repaintLabels only restores labels in the cleared band', () => {
  // Cleared band mirrors _clearPanel: ~24px tall. Use [100, 124].
  const TOP = 100
  const BOTTOM = 124

  test('does NOT repaint a label well above the cleared band (no bold)', () => {
    // baseline 85: glyph ≈ [75, 89] — entirely above the cleared rect (100).
    // Old guard (top - PANHEIGHT = 78) WOULD have repainted it -> bold.
    const { self, ctx } = selfWith([85, 112])
    Sidebar.prototype._repaintLabels.call(self, TOP, BOTTOM)
    expect(paintedBaselines(ctx)).toEqual([112]) // 85 excluded, 112 (inside) kept
  })

  test('repaints a label whose glyph reaches UP into the band (no clip)', () => {
    // baseline 130: 6px below bottom (124), but glyph top ≈ 120 reaches into the
    // band. Old guard (bottom + 4 = 128) would SKIP it -> clipped on sweep.
    const { self, ctx } = selfWith([130])
    Sidebar.prototype._repaintLabels.call(self, TOP, BOTTOM)
    expect(paintedBaselines(ctx)).toEqual([130])
  })

  test('repaints labels inside / straddling the band, skips far ones', () => {
    // 70 far above (skip), 98 straddles top (keep), 112 inside (keep),
    // 130 straddles bottom (keep), 150 far below (skip).
    const { self, ctx } = selfWith([70, 98, 112, 130, 150])
    Sidebar.prototype._repaintLabels.call(self, TOP, BOTTOM)
    expect(paintedBaselines(ctx)).toEqual([98, 112, 130])
  })

  test('glyph extents scale with a larger font', () => {
    // 20px font: ascent ≈ 17, descent ≈ 6. baseline 138 -> glyph top ≈ 121
    // still reaches into [100,124]; with the 11px assumption it would be skipped.
    const { self, ctx } = selfWith([138], '20px Arial')
    Sidebar.prototype._repaintLabels.call(self, TOP, BOTTOM)
    expect(paintedBaselines(ctx)).toEqual([138])
  })
})
