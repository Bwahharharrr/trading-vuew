// mixins/shaders.js — the shader-event parser mixin. Pure methods + a `skin`
// watcher; tested via the ctx pattern (bind the mixin methods to a fake `this`).
import { describe, it, expect, vi } from 'vitest'
import shaders from '../../src/mixins/shaders.js'

const M = shaders.methods
// A fake `this` for the mixin: the reactive bits it reads/writes.
const ctx = () => ({ shaders: [], rerender: 0 })

describe('shaders mixin — data()', () => {
  it('seeds an empty shaders array', () => {
    expect(shaders.data()).toEqual({ shaders: [] })
  })
})

describe('shaders mixin — init_shaders', () => {
  it('does nothing when the skin is unchanged (skin === prev)', () => {
    const skin = { id: 'a', shaders: [class { }] }
    const self = ctx()
    M.init_shaders.call(self, skin, skin)
    expect(self.shaders).toEqual([])      // identity short-circuit
  })

  it('instantiates each Shader from a new skin and tags it with the skin id', () => {
    class S1 { constructor() { this.kind = 's1' } }
    class S2 { constructor() { this.kind = 's2' } }
    const self = ctx()
    M.init_shaders.call(self, { id: 'skinA', shaders: [S1, S2] }, null)
    expect(self.shaders).toHaveLength(2)
    expect(self.shaders[0]).toBeInstanceOf(S1)
    expect(self.shaders[1]).toBeInstanceOf(S2)
    expect(self.shaders.map((s) => s.owner)).toEqual(['skinA', 'skinA'])
    expect(self.shaders.map((s) => s.kind)).toEqual(['s1', 's2'])
  })

  it('drops the previous skin\'s shaders before adding the new ones', () => {
    class New { }
    const self = ctx()
    // pre-existing shaders: two from skin "old", one from a third owner.
    self.shaders = [
      { owner: 'old', id: 1 }, { owner: 'keep', id: 2 }, { owner: 'old', id: 3 },
    ]
    M.init_shaders.call(self, { id: 'new', shaders: [New] }, { id: 'old' })
    // "old"-owned removed, "keep" survives, the new shader appended + owner-tagged
    expect(self.shaders).toHaveLength(2)
    expect(self.shaders[0]).toEqual({ owner: 'keep', id: 2 })
    expect(self.shaders[1]).toBeInstanceOf(New)
    expect(self.shaders[1].owner).toBe('new')
  })
})

describe('shaders mixin — on_shader_event', () => {
  it('new-shader for THIS target → assigns id, pushes it, bumps rerender', () => {
    const self = ctx()
    const shader = { target: 'grid-0' }
    M.on_shader_event.call(self, { event: 'new-shader', args: [shader, 'ovl', 3] }, 'grid-0')
    expect(self.shaders).toEqual([{ target: 'grid-0', id: 'ovl-3' }])   // id = args[1]-args[2]
    expect(self.rerender).toBe(1)
  })

  it('new-shader for a DIFFERENT target → ignored', () => {
    const self = ctx()
    M.on_shader_event.call(self, { event: 'new-shader', args: [{ target: 'other' }, 'ovl', 3] }, 'grid-0')
    expect(self.shaders).toEqual([])
    expect(self.rerender).toBe(0)
  })

  it('remove-shaders → drops the shader whose id matches args.join("-")', () => {
    const self = ctx()
    self.shaders = [{ id: 'a-1' }, { id: 'a-2' }, { id: 'b-1' }]
    M.on_shader_event.call(self, { event: 'remove-shaders', args: ['a', '2'] }, 'grid-0')
    expect(self.shaders.map((s) => s.id)).toEqual(['a-1', 'b-1'])   // only 'a-2' removed
  })

  it('unrelated event → no-op', () => {
    const self = ctx()
    self.shaders = [{ id: 'x' }]
    M.on_shader_event.call(self, { event: 'something-else', args: [] }, 'grid-0')
    expect(self.shaders).toEqual([{ id: 'x' }])
    expect(self.rerender).toBe(0)
  })
})

describe('shaders mixin — skin watcher routes to init_shaders', () => {
  it('calls init_shaders(n, p) on a skin change', () => {
    const self = { shaders: [], init_shaders: vi.fn() }
    shaders.watch.skin.call(self, { id: 'n' }, { id: 'p' })
    expect(self.init_shaders).toHaveBeenCalledWith({ id: 'n' }, { id: 'p' })
  })
})
