// Minimal AVA-compatible `test` shim over Vitest.
//
// Lets the original AVA suites (which use `test('name', t => { t.deepEqual… })`)
// run under Vitest unchanged except for their import line. Keeps the historical
// assertions byte-identical so the port introduces zero behavioural drift.
import { test as vtest, expect } from 'vitest'

function makeT() {
  return {
    deepEqual: (a, b, msg) => expect(a, msg).toEqual(b),
    is: (a, b, msg) => expect(a, msg).toBe(b),
    not: (a, b, msg) => expect(a, msg).not.toBe(b),
    true: (a, msg) => expect(a, msg).toBe(true),
    false: (a, msg) => expect(a, msg).toBe(false),
    truthy: (a, msg) => expect(a, msg).toBeTruthy(),
    falsy: (a, msg) => expect(a, msg).toBeFalsy(),
    pass: () => expect(true).toBe(true),
    fail: (msg) => expect.unreachable(msg || 't.fail()'),
    plan: () => {},
    throws: (fn, _e, msg) => expect(fn, msg).toThrow(),
    notThrows: (fn, msg) => expect(fn, msg).not.toThrow(),
  }
}

export default function test(name, fn) {
  vtest(name, () => fn(makeT()))
}
