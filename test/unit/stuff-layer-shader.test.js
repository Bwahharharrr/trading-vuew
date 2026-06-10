// stuff/layer.js + stuff/shader.js — tiny helper constructors (0% → 100%).
import { test, expect, describe } from 'vitest'
import Layer from '../../src/stuff/layer.js'
import Shader from '../../src/stuff/shader.js'

describe('Layer', () => {
  test('a function renderer is wrapped into { draw }', () => {
    const fn = () => {}
    const l = new Layer('grid', 5, fn)
    expect(l.name).toBe('grid')
    expect(l.z).toBe(5)
    expect(l.display).toBe(true)
    expect(typeof l.renderer.draw).toBe('function')
    expect(l.renderer.draw).toBe(fn)
  })

  test('an object renderer is used as-is', () => {
    const r = { draw() {} }
    const l = new Layer('x', 1, r)
    expect(l.renderer).toBe(r)
  })
})

describe('Shader', () => {
  test('captures target/draw/name with defaults', () => {
    const draw = (ctx) => ctx
    const s = new Shader('sidebar', draw, 'price-tag')
    expect(s.target).toBe('sidebar')
    expect(s.draw).toBe(draw)
    expect(s.name).toBe('price-tag')
    expect(s.id).toBeNull()
    expect(s.zIndex).toBe(0)
  })
})
