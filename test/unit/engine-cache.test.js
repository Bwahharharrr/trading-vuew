// ScriptEngine output-cache state machine — pure-node unit tests.
//
// Exercises the cache helpers that let the engine skip re-execution when only
// DISPLAY-ONLY settings change:
//   _computationHash / _isDisplayOnlyChange / _isCacheValid /
//   _saveToCache + _restoreFromCache / fastDeepCopy / DISPLAY_ONLY_SETTINGS
//
// These are framework-agnostic methods on the ScriptEngine class (no DOM, no
// canvas), so we instantiate a fresh engine per assertion and drive the
// methods directly with hand-built `script` records (shape: { src.props,
// sett, env.{data,onchart,offchart} }). fastDeepCopy is module-private, so we
// observe it through its genuine public seam: _saveToCache / _restoreFromCache,
// which deep-copy env.onchart / env.offchart.
import { test, expect, describe } from 'vitest'
import { ScriptEngine } from '../../src/helpers/script_engine.js'

// Build a minimal script record the cache helpers understand.
function mkScript({ props = {}, sett = {}, data = [], onchart = {}, offchart = {} } = {}) {
    return { src: { props }, sett, env: { data, onchart, offchart } }
}

describe('_computationHash', () => {
    test('DISPLAY-ONLY prop difference (color) hashes identically', () => {
        const eng = new ScriptEngine()
        const a = mkScript({ props: { color: { val: '#f00' }, len: { val: 20 } } })
        const b = mkScript({ props: { color: { val: '#0f0' }, len: { val: 20 } } })
        // color is in DISPLAY_ONLY_SETTINGS, so it is excluded from the hash.
        expect(eng._computationHash(a)).toBe('len:20')
        expect(eng._computationHash(a)).toBe(eng._computationHash(b))
    })

    test('compute-prop difference (len 20 vs 21) hashes differently', () => {
        const eng = new ScriptEngine()
        const a = mkScript({ props: { color: { val: '#f00' }, len: { val: 20 } } })
        const c = mkScript({ props: { color: { val: '#f00' }, len: { val: 21 } } })
        expect(eng._computationHash(a)).toBe('len:20')
        expect(eng._computationHash(c)).toBe('len:21')
        expect(eng._computationHash(a)).not.toBe(eng._computationHash(c))
    })

    test('uses props[k].val when present, else props[k].def', () => {
        const eng = new ScriptEngine()
        const withDef = mkScript({ props: { len: { def: 14 } } }) // no val
        const withVal = mkScript({ props: { len: { def: 14, val: 14 } } })
        expect(eng._computationHash(withDef)).toBe('len:14')
        // val present (even when equal to def) still resolves to the same string.
        expect(eng._computationHash(withVal)).toBe('len:14')
        // a distinct val overrides def.
        const override = mkScript({ props: { len: { def: 14, val: 30 } } })
        expect(eng._computationHash(override)).toBe('len:30')
    })

    test('object vals serialise via JSON, primitives via String', () => {
        const eng = new ScriptEngine()
        const obj = mkScript({ props: { conf: { val: { a: 1, b: 2 } } } })
        expect(eng._computationHash(obj)).toBe('conf:{"a":1,"b":2}')
        const prim = mkScript({ props: { len: { val: 20 } } })
        expect(eng._computationHash(prim)).toBe('len:20')
    })

    test('order-insensitive over prop insertion order (sorted)', () => {
        const eng = new ScriptEngine()
        const s1 = mkScript({ props: { aaa: { val: 1 }, zzz: { val: 2 } } })
        const s2 = mkScript({ props: { zzz: { val: 2 }, aaa: { val: 1 } } })
        expect(eng._computationHash(s1)).toBe('aaa:1|zzz:2')
        expect(eng._computationHash(s1)).toBe(eng._computationHash(s2))
    })
})

describe('_isDisplayOnlyChange', () => {
    test('true when every changed key is DISPLAY-ONLY (color, lineWidth)', () => {
        const eng = new ScriptEngine()
        const delta = { s1: { color: '#f00', lineWidth: 2 } }
        expect(eng._isDisplayOnlyChange(delta, 's1')).toBe(true)
    })

    test('false when any compute key is present (len)', () => {
        const eng = new ScriptEngine()
        const delta = { s1: { color: '#f00', len: 20 } }
        expect(eng._isDisplayOnlyChange(delta, 's1')).toBe(false)
    })

    test('false when the delta is missing the scriptId', () => {
        const eng = new ScriptEngine()
        // delta keyed under a different script id.
        expect(eng._isDisplayOnlyChange({ s2: { color: '#f00' } }, 's1')).toBe(false)
        // null delta is also handled.
        expect(eng._isDisplayOnlyChange(null, 's1')).toBe(false)
    })
})

describe('_isCacheValid', () => {
    test('false with no cache entry', () => {
        const eng = new ScriptEngine()
        expect(eng._isCacheValid('absent')).toBe(false)
    })

    test('false when cached.dataHash !== current _dataHash', () => {
        const eng = new ScriptEngine()
        eng._dataHash = 'DH1'
        eng.map['s1'] = mkScript({ props: { len: { val: 20 } } })
        eng._saveToCache('s1')
        expect(eng._isCacheValid('s1')).toBe(true)
        // data changed underneath the cache.
        eng._dataHash = 'DH2'
        expect(eng._isCacheValid('s1')).toBe(false)
    })

    test('false when computation hash differs', () => {
        const eng = new ScriptEngine()
        eng._dataHash = 'DH1'
        eng.map['s1'] = mkScript({ props: { len: { val: 20 } } })
        eng._saveToCache('s1')
        // mutate a compute prop after caching.
        eng.map['s1'].src.props.len.val = 99
        expect(eng._isCacheValid('s1')).toBe(false)
    })

    test('true only when both dataHash and computation hash match', () => {
        const eng = new ScriptEngine()
        eng._dataHash = 'DH1'
        eng.map['s1'] = mkScript({ props: { len: { val: 20 } } })
        eng._saveToCache('s1')
        expect(eng._isCacheValid('s1')).toBe(true)
        // a DISPLAY-ONLY mutation keeps the cache valid (excluded from hash).
        eng.map['s1'].src.props.color = { val: '#abc' }
        expect(eng._isCacheValid('s1')).toBe(true)
    })
})

describe('_saveToCache / _restoreFromCache round-trip', () => {
    test('restored deep-equals saved and is a distinct object tree', () => {
        const eng = new ScriptEngine()
        eng._dataHash = 'DH1'
        const onchart = { foo: [1, 2], bar: { deep: 3 } }
        const offchart = { vol: [9, 8, 7] }
        eng.map['s1'] = mkScript({
            props: { len: { val: 20 } },
            data: [[1, 2, 3]],
            onchart,
            offchart
        })
        eng._saveToCache('s1')

        // Mutate the live env wholesale.
        eng.map['s1'].env.data = []
        eng.map['s1'].env.onchart = {}
        eng.map['s1'].env.offchart = {}

        expect(eng._restoreFromCache('s1')).toBe(true)
        const env = eng.map['s1'].env
        expect(env.data).toEqual([[1, 2, 3]])
        expect(env.onchart).toEqual({ foo: [1, 2], bar: { deep: 3 } })
        expect(env.offchart).toEqual({ vol: [9, 8, 7] })

        // Restored tree is a DISTINCT object from the cached copy: mutating the
        // restored leaf must not bleed into the cache.
        const cached = eng._outputCache.get('s1')
        env.onchart.foo[0] = 999
        env.onchart.bar.deep = 777
        expect(cached.onchart.foo).toEqual([1, 2])
        expect(cached.onchart.bar.deep).toBe(3)
        expect(env.onchart).not.toBe(cached.onchart)
        expect(env.onchart.bar).not.toBe(cached.onchart.bar)
    })

    test('_restoreFromCache returns false when no cache entry exists', () => {
        const eng = new ScriptEngine()
        eng.map['s1'] = mkScript()
        expect(eng._restoreFromCache('s1')).toBe(false)
    })
})

describe('_saveToCache eviction', () => {
    test('cache is bounded and the oldest key is evicted past the limit', () => {
        const eng = new ScriptEngine()
        eng._dataHash = 'DH'
        // The guard evicts when size > 50 BEFORE inserting. Inserting k0..k50
        // fills 51 slots; the 52nd insert (k51) first evicts k0, then adds k51.
        for (let i = 0; i < 52; i++) {
            const id = 'k' + i
            eng.map[id] = mkScript()
            eng._saveToCache(id)
        }
        expect(eng._outputCache.size).toBe(51)
        // First-inserted id is gone; the next-oldest survives.
        expect(eng._outputCache.has('k0')).toBe(false)
        expect(eng._outputCache.has('k1')).toBe(true)
        expect(eng._outputCache.has('k51')).toBe(true)
        const keys = [...eng._outputCache.keys()]
        expect(keys[0]).toBe('k1')
        expect(keys[keys.length - 1]).toBe('k51')
    })
})

// fastDeepCopy is module-private; we observe it through the cache deep-copy
// seam: _saveToCache deep-copies env.onchart, so the cached tree reveals every
// branch of the copier (null/primitive pass-through, empty array, primitive
// slice, nested recursion, inherited-prop exclusion).
describe('fastDeepCopy (via cache deep-copy seam)', () => {
    function copyOf(onchart) {
        const eng = new ScriptEngine()
        eng._dataHash = 'DH'
        eng.map['s1'] = mkScript({ onchart })
        eng._saveToCache('s1')
        return { copy: eng._outputCache.get('s1').onchart, original: onchart }
    }

    test('null and primitives pass through unchanged', () => {
        const { copy } = copyOf({ nullv: null, num: 42, str: 'hello', bool: true })
        expect(copy.nullv).toBe(null)
        expect(copy.num).toBe(42)
        expect(copy.str).toBe('hello')
        expect(copy.bool).toBe(true)
    })

    test('empty array returns a new empty array (equal but distinct ref)', () => {
        const original = { empty: [] }
        const { copy } = copyOf(original)
        expect(copy.empty).toEqual([])
        expect(copy.empty).not.toBe(original.empty)
    })

    test('primitive array returns a slice (equal but distinct ref)', () => {
        const original = { prims: [1, 2, 3] }
        const { copy } = copyOf(original)
        expect(copy.prims).toEqual([1, 2, 3])
        expect(copy.prims).not.toBe(original.prims)
    })

    test('nested array/object deeply cloned (mutating copy leaf leaves original intact)', () => {
        const original = { nested: [[10, 20], { deep: { leaf: 'orig' } }] }
        const { copy } = copyOf(original)
        expect(copy.nested[1].deep.leaf).toBe('orig')
        // Distinct nested refs throughout.
        expect(copy.nested[0]).not.toBe(original.nested[0])
        expect(copy.nested[1]).not.toBe(original.nested[1])
        expect(copy.nested[1].deep).not.toBe(original.nested[1].deep)
        // Mutate the copy's nested leaf — original must be untouched.
        copy.nested[1].deep.leaf = 'mutated'
        copy.nested[0][0] = 999
        expect(original.nested[1].deep.leaf).toBe('orig')
        expect(original.nested[0][0]).toBe(10)
    })

    test('inherited (non-hasOwnProperty) props are NOT copied', () => {
        const proto = { inherited: 'SHOULD_NOT_COPY' }
        const own = Object.create(proto)
        own.x = 1
        const { copy } = copyOf({ withInherited: own })
        expect(copy.withInherited.x).toBe(1)
        // Inherited key is dropped (fastDeepCopy guards with hasOwnProperty).
        expect(copy.withInherited.inherited).toBeUndefined()
        expect(Object.prototype.hasOwnProperty.call(copy.withInherited, 'inherited')).toBe(false)
    })
})
