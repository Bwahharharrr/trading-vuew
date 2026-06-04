import { test, expect, describe } from 'vitest'
import { validateOverlayComponent } from '../../src/helpers/schema/validate-overlay.js'

// Real built-in overlays must satisfy the contract.
import Spline from '../../src/components/overlays/Spline.vue'
import Candles from '../../src/components/overlays/Candles.vue'
import Volume from '../../src/components/overlays/Volume.vue'

describe('validateOverlayComponent — built-ins pass', () => {
  for (const [name, comp] of [['Spline', Spline], ['Candles', Candles], ['Volume', Volume]]) {
    test(`${name} is a valid overlay`, () => {
      const r = validateOverlayComponent(comp)
      expect(r.ok).toBe(true)
      // built-ins define draw, so no draw warning
      expect(r.diagnostics.some((d) => d.code === 'overlay.draw')).toBe(false)
      expect(Array.isArray(r.types) && r.types.length > 0).toBe(true)
    })
  }
})

describe('validateOverlayComponent — catches malformed overlays', () => {
  test('non-object', () => {
    expect(validateOverlayComponent(null).ok).toBe(false)
    expect(validateOverlayComponent(42).ok).toBe(false)
  })

  test('missing methods', () => {
    const r = validateOverlayComponent({ name: 'X' })
    expect(r.ok).toBe(false)
    expect(r.diagnostics[0].code).toBe('overlay.methods')
  })

  test('missing use_for is a hard skip', () => {
    const r = validateOverlayComponent({ name: 'X', methods: { draw() {} } })
    expect(r.ok).toBe(false)
    expect(r.diagnostics[0].code).toBe('overlay.use_for')
  })

  test('use_for returning non-array fails', () => {
    const r = validateOverlayComponent({ name: 'X', methods: { use_for: () => 'EMA', draw() {} } })
    expect(r.ok).toBe(false)
    expect(r.diagnostics[0].code).toBe('overlay.use_for.return')
  })

  test('use_for that throws is caught', () => {
    const r = validateOverlayComponent({
      name: 'X',
      methods: { use_for() { throw new Error('boom') }, draw() {} },
    })
    expect(r.ok).toBe(false)
    expect(r.diagnostics[0].code).toBe('overlay.use_for.throw')
  })

  test('valid use_for but missing draw → registers with a warning', () => {
    const r = validateOverlayComponent({ name: 'X', methods: { use_for: () => ['EMA'] } })
    expect(r.ok).toBe(true) // still registered (mixin fallback), but loud
    expect(r.diagnostics.some((d) => d.code === 'overlay.draw')).toBe(true)
  })
})
