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
