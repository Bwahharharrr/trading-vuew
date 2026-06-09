// Pins the pixel-smooth vertical crosshair line: it must draw at the RAW pointer
// x (cursor.xr), not the candle-snapped cursor.x — so it tracks the pointer
// continuously instead of stepping candle-to-candle. Falls back to cursor.x when
// no raw value is set (programmatic cursor).
import { test, expect, describe } from 'vitest'
import Crosshair from '../../src/components/js/crosshair.js'

function mockCtx() {
  const moves = [], lines = []
  return {
    save() {}, restore() {}, beginPath() {}, stroke() {}, setLineDash() {},
    strokeStyle: '',
    moveTo: (x, y) => moves.push([x, y]),
    lineTo: (x, y) => lines.push([x, y]),
    moves, lines,
  }
}

function makeCh(cursor) {
  const comp = {
    $props: {
      cursor,
      layout: { id: 0, width: 800, height: 400 },
      colors: { cross: '#888' },
      sub: [],
    },
  }
  const ch = new Crosshair(comp)
  ch.visible = true
  return ch
}

// The vertical line is the moveTo/lineTo pair sharing one constant x spanning
// the full height (y 0 -> height).
function verticalX(ctx, height) {
  const top = ctx.moves.find(m => m[1] === 0)
  const bottom = ctx.lines.find(l => l[1] === height)
  return top && bottom && top[0] === bottom[0] ? top[0] : undefined
}

describe('crosshair vertical line tracks raw pointer x', () => {
  test('draws at cursor.xr (raw) when set, not cursor.x (snapped)', () => {
    const ch = makeCh({ x: 100, xr: 137, y: 50, grid_id: 0, mode: 'default' })
    const ctx = mockCtx()
    ch.draw(ctx)
    expect(verticalX(ctx, 400)).toBe(137) // raw, not the snapped 100
  })

  test('falls back to cursor.x when xr is null (programmatic cursor)', () => {
    const ch = makeCh({ x: 100, xr: null, y: 50, grid_id: 0, mode: 'default' })
    const ctx = mockCtx()
    ch.draw(ctx)
    expect(verticalX(ctx, 400)).toBe(100)
  })

  test('xr of 0 (left edge) is honored, not treated as missing', () => {
    const ch = makeCh({ x: 50, xr: 0, y: 50, grid_id: 0, mode: 'default' })
    const ctx = mockCtx()
    ch.draw(ctx)
    expect(verticalX(ctx, 400)).toBe(0)
  })
})
