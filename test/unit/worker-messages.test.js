import { test, expect, describe } from 'vitest'
import { validateWorkerMessage, DC_TO_WW_TYPES } from '../../src/helpers/schema/worker-messages.js'

describe('worker message guard', () => {
  test('accepts every real message type with a payload', () => {
    for (const type of DC_TO_WW_TYPES) {
      const { ok } = validateWorkerMessage({ type, data: {} })
      expect(ok, `type ${type}`).toBe(true)
    }
  })

  test('payload-less types are accepted without data', () => {
    expect(validateWorkerMessage({ type: 'exec-all-scripts' }).ok).toBe(true)
    expect(validateWorkerMessage({ type: 'send-meta-info' }).ok).toBe(true)
    expect(validateWorkerMessage({ type: 'module-event' }).ok).toBe(true)
  })

  test('rejects non-object envelope', () => {
    expect(validateWorkerMessage(null).ok).toBe(false)
    expect(validateWorkerMessage('exec-script').ok).toBe(false)
    expect(validateWorkerMessage(42).ok).toBe(false)
  })

  test('rejects missing/empty type', () => {
    expect(validateWorkerMessage({ data: {} }).ok).toBe(false)
    expect(validateWorkerMessage({ type: '', data: {} }).ok).toBe(false)
  })

  test('rejects a data-bearing type with missing payload', () => {
    const r = validateWorkerMessage({ type: 'upload-data' })
    expect(r.ok).toBe(false)
    expect(r.diagnostics[0].code).toBe('ww.msg.payload')
  })

  test('unknown type is a warning but not rejected (forward-compatible)', () => {
    const r = validateWorkerMessage({ type: 'future-message', data: {} })
    expect(r.ok).toBe(true)
    expect(r.diagnostics.some((d) => d.code === 'ww.msg.unknown')).toBe(true)
  })
})
