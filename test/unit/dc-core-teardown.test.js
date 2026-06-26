// Unit test pinning the DCCore.destroy() cleanup contract.
//
// ROOT CAUSE this guards against: DataCube extends DCCore;
// TradingVue.beforeUnmount calls data.destroy() -> DCCore.destroy(). That
// method historically only ran the settings/ids/datasets watcher unwatchers and
// NEVER tore down the AggTool. AggTool runs a self-rescheduling
// setTimeout(~100ms)->requestAnimationFrame loop (agg_tool.js), so it survived
// unmount and fired after jsdom's RAF was torn down ->
// 'requestAnimationFrame is not defined'.
//
// The fix adds `if (this.agg) this.agg.destroy()` to DCCore.destroy(). This test
// pins that contract WITHOUT importing the real RAF-touching AggTool: we swap in
// a spy and assert destroy() is invoked exactly once, and that destroy() stays
// null-safe when this.agg is absent. Pure Node — no DOM.
import { describe, it, expect, vi } from 'vitest'
import DataCube from '../../src/helpers/datacube.js'

describe('DCCore.destroy() tears down the AggTool', () => {
    it('calls this.agg.destroy() exactly once', () => {
        const dc = new DataCube()
        // Replace the real (RAF-touching) AggTool with a spy.
        const spy = { destroy: vi.fn() }
        dc.agg = spy

        dc.destroy()

        expect(spy.destroy).toHaveBeenCalledTimes(1)
    })

    it('is null-safe when this.agg is absent (DCCore used standalone)', () => {
        const dc = new DataCube()
        dc.agg = null

        expect(() => dc.destroy()).not.toThrow()
    })
})

// Multi-tab opens N cubes; each closed cube must release its Web Worker, and
// destroy() must be safe to fire twice (a tab close + TradingVue.beforeUnmount).
describe('DCCore.destroy() releases the per-cube Web Worker + is idempotent', () => {
    it('calls this.ww.destroy() exactly once', () => {
        const dc = new DataCube()
        const ww = { destroy: vi.fn() }
        dc.ww = ww

        dc.destroy()

        expect(ww.destroy).toHaveBeenCalledTimes(1)
    })

    it('a second destroy() is a no-op (agg + ww each torn down once total)', () => {
        const dc = new DataCube()
        const agg = { destroy: vi.fn() }
        const ww = { destroy: vi.fn() }
        dc.agg = agg
        dc.ww = ww

        dc.destroy()
        dc.destroy()   // e.g. TradingVue.beforeUnmount firing after an explicit close

        expect(agg.destroy).toHaveBeenCalledTimes(1)
        expect(ww.destroy).toHaveBeenCalledTimes(1)
    })
})

// teardown_tvjs is the inverse of init_tvjs — it detaches the reactive watchers
// so a backgrounded tab stops recomputing, WITHOUT throwing away the cube's data.
describe('DCCore.teardown_tvjs() detaches watchers without destroying data', () => {
    it('runs the unwatchers, clears caches, drops the TV ref, keeps data', () => {
        const dc = new DataCube()
        const u1 = vi.fn(), u2 = vi.fn(), u3 = vi.fn()
        dc._settingsUnwatch = u1
        dc._idsUnwatch = u2
        dc._datasetsUnwatch = u3
        dc.tv = { fake: 'root' }
        dc._cachedSettingsKey = 'x'
        dc._cachedIdsKey = 'y'

        dc.teardown_tvjs()

        expect(u1).toHaveBeenCalledTimes(1)
        expect(u2).toHaveBeenCalledTimes(1)
        expect(u3).toHaveBeenCalledTimes(1)
        expect(dc.tv).toBe(null)
        expect(dc._settingsUnwatch).toBe(null)
        expect(dc._cachedSettingsKey).toBe(null)
        expect(dc.data).toBeTruthy()   // data survives — only reactivity detached
    })

    it('is safe to call twice (unwatchers nulled after the first run)', () => {
        const dc = new DataCube()
        dc._settingsUnwatch = vi.fn()

        dc.teardown_tvjs()
        expect(() => dc.teardown_tvjs()).not.toThrow()
    })
})
