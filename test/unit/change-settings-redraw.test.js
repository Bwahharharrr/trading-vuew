// Pins the P5.5 framework fix: a settings-only change (no cursor move) must bump
// the render revision so canvas consumers repaint — settings are read at DRAW
// time, not as a reactive render dependency (same gotcha as the Volume eye-toggle).
import { test, expect, describe } from 'vitest'
import DataCube from '../../src/helpers/datacube.js'

describe('change_settings invalidates the render revision', () => {
  test('merges the setting AND bumps revision', () => {
    const dc = new DataCube({
      ohlcv: [[1, 1, 1, 1, 1, 1]],
      onchart: [{ name: 'X', type: 'OrderBox', data: [], settings: { $uuid: 'u1', visible: true } }]
    }, { scripts: false, validation: 'off' })
    dc.init_data()  // runs on mount in the app; do it headlessly here

    const rev0 = dc.cd.revision()
    dc.change_settings([{ visible: false }, 0, 'X_0', 'u1'])
    expect(dc.data.onchart[0].settings.visible).toBe(false) // merge applied
    expect(dc.cd.revision()).toBeGreaterThan(rev0)          // repaint signalled
  })
})
