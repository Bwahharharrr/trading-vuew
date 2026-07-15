import { describe, expect, test, vi } from 'vitest'
import Spline from '../../src/components/overlays/Spline.vue'

function splineSelf(settings = {}) {
  const self = {
    $props: { data: [[1, 10], [2, 11]], settings },
    sett: settings,
    setupStroke: vi.fn(),
    drawDataLine: vi.fn(),
  }
  for (const [name, computed] of Object.entries(Spline.computed)) {
    Object.defineProperty(self, name, { get: () => computed.call(self) })
  }
  return self
}

describe('Spline lineDash', () => {
  test('applies and resets a configured dash pattern around the native draw', () => {
    const self = splineSelf({ color: '#fff', lineWidth: 2, lineDash: [4, 6] })
    const ctx = { setLineDash: vi.fn(), beginPath: vi.fn(), stroke: vi.fn() }
    Spline.methods.draw.call(self, ctx)
    expect(ctx.setLineDash.mock.calls).toEqual([[[4, 6]], [[]]])
    expect(self.drawDataLine).toHaveBeenCalledWith(ctx, self.$props.data, 1, undefined)
  })

  test('leaves the canvas dash state untouched for ordinary solid splines', () => {
    const self = splineSelf()
    const ctx = { setLineDash: vi.fn(), beginPath: vi.fn(), stroke: vi.fn() }
    Spline.methods.draw.call(self, ctx)
    expect(ctx.setLineDash).not.toHaveBeenCalled()
  })
})
