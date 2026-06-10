// Gesture seam — a drop-in replacement for src/stuff/gestures.js.
//
// grid.js / botbar.js / sidebar.js wire their pan/pinch/tap/wheel handlers onto
// Hammer/Hamster instances obtained via `await loadGestures()`. jsdom has no real
// gesture recognition, so those handlers never run. This module exports the same
// loadGestures/loadedGestures API but returns CAPTURING fakes: every Hammer
// Manager and Hamster created during mount is recorded, and tests synthesise
// gesture events to drive the real handlers.
//
// Use via `vi.mock('../../src/stuff/gestures.js', () => import('../_seams/gesture-harness.js'))`.
// The test imports this module too; vitest dedupes, so the registry is shared.

let managers = []
let hamsters = []

class FakeRecognizer {
  constructor(type, opts = {}) { this.type = type; this.opts = opts }
  set() { return this }
  recognizeWith() { return this }
  requireFailure() { return this }
}

class FakeManager {
  constructor(el) { this.el = el; this.handlers = {}; this.recognizers = {}; managers.push(this) }
  add(r) { this.recognizers[(r.opts && r.opts.event) || r.type] = r; return this }
  get(type) { return this.recognizers[type] || new FakeRecognizer(type) }
  on(event, fn) { (this.handlers[event] = this.handlers[event] || []).push(fn) }
  off(event, fn) { if (this.handlers[event]) this.handlers[event] = this.handlers[event].filter((h) => h !== fn) }
  destroy() { this.destroyed = true }
  has(event) { return (this.handlers[event] || []).length > 0 }
  fire(event, ev) { for (const fn of this.handlers[event] || []) fn(ev) }
}

// Must be usable with `new` (grid.js does `new Hammer.Pan({...})`), so plain
// functions that return the recognizer — NOT arrow functions.
function mk(type) { return function (opts) { return new FakeRecognizer(type, opts) } }

export const FakeHammer = {
  Manager: FakeManager,
  Pan: mk('pan'), Tap: mk('tap'), Pinch: mk('pinch'), Press: mk('press'),
  DIRECTION_ALL: 30, DIRECTION_HORIZONTAL: 6, DIRECTION_VERTICAL: 24,
}

export function FakeHamster(el) {
  const h = { el, _wheel: null, wheel(cb) { h._wheel = cb; return h }, unwheel() { h._wheel = null } }
  hamsters.push(h)
  return h
}

// ── The gestures.js API surface (this is what gets mocked in) ──
const CACHE = { Hammer: FakeHammer, Hamster: FakeHamster }
export function loadGestures() { return Promise.resolve(CACHE) }
export function loadedGestures() { return CACHE }

// ── Test accessors ──
export function resetGestures() { managers = []; hamsters = [] }
export function gestureManagers() { return managers }
export function gestureHamsters() { return hamsters }

// A Hammer event rich enough for every consumer (pan center/delta, pinch scale,
// tap center + srcEvent for touch2mouse).
export function hammerEvent(over = {}) {
  return {
    center: { x: 120, y: 90 },
    deltaX: 24, deltaY: 18, scale: 1.5,
    preventDefault() {}, stopPropagation() {},
    srcEvent: { preventDefault() {}, stopPropagation() {} },
    ...over,
  }
}

// A Hamster wheel event (mousezoom reads originalEvent.{preventDefault,ctrlKey,offsetX,offsetY} + deltaX/Y).
export function wheelEvent(over = {}) {
  return {
    deltaX: 0, deltaY: 120,
    preventDefault() {}, stopPropagation() {},
    originalEvent: { preventDefault() {}, stopPropagation() {}, ctrlKey: false, offsetX: 120, offsetY: 90 },
    ...over,
  }
}

// Begin a pan: start + move on every pan-handling manager. We deliberately do
// NOT fire panend here — panmove is rafThrottled, so the drag is applied on the
// next animation frame; firing panend first would null `drug` and the throttled
// callback would no-op. Flush RAF (settle) to apply, THEN call firePanEnd().
export function firePan(over = {}) {
  let fired = 0
  for (const m of managers) {
    if (!m.has('panstart')) continue
    m.fire('panstart', hammerEvent(over))
    m.fire('panmove', hammerEvent(over))
    fired++
  }
  return fired
}

export function firePanEnd(over = {}) {
  for (const m of managers) if (m.has('panend')) m.fire('panend', hammerEvent(over))
}

// Fire a wheel on every Hamster.
export function fireWheel(delta = 3, over = {}) {
  let fired = 0
  for (const h of hamsters) { if (h._wheel) { h._wheel(wheelEvent(over), delta); fired++ } }
  return fired
}

// Fire a pinch gesture on every manager that handles it.
export function firePinch(scale = 1.4) {
  let fired = 0
  for (const m of managers) {
    if (!m.has('pinch')) continue
    m.fire('pinchstart', hammerEvent())
    m.fire('pinch', hammerEvent({ scale }))
    m.fire('pinchend', hammerEvent())
    fired++
  }
  return fired
}

// Fire a sidebar double-tap / single-tap where present.
export function fireTaps() {
  let fired = 0
  for (const m of managers) {
    if (m.has('doubletap')) { m.fire('doubletap', hammerEvent()); fired++ }
    if (m.has('singletap')) { m.fire('singletap', hammerEvent()); fired++ }
  }
  return fired
}
