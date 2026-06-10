// Price-alarm audio: repeating WebAudio beeps, one tone per alarm side.
//
// AUTOPLAY: browsers only allow audio after a user gesture. unlock() must be
// called from the click that CREATES an alarm — it instantiates/resumes the
// AudioContext inside the gesture, so later (non-gesture) trigger beeps play.
//
// Each ringing alarm gets its own repeating beep timer; stop(id)/stopAll()
// silence them. No Web Audio in the environment (jsdom/tests) → silent no-ops.

const TONE = {
    above: 880,    // A5 — brighter "price rose to your level"
    below: 587.33, // D5 — slightly lower "price fell to your level"
}
const BEEP_EVERY_MS = 1200
const BEEP_LEN_S = 0.35

export class AlarmSound {
    constructor() {
        this.ctx = null
        this.timers = new Map() // alarm id → interval handle
    }

    _context() {
        const AC = typeof window !== 'undefined' &&
            (window.AudioContext || window.webkitAudioContext)
        if (!AC) return null
        if (!this.ctx) this.ctx = new AC()
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
        return this.ctx
    }

    // Call from a user gesture (the axis click that sets the alarm).
    unlock() { this._context() }

    _beep(side) {
        const ctx = this._context()
        if (!ctx) return
        try {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.value = TONE[side] || TONE.above
            const t = ctx.currentTime
            gain.gain.setValueAtTime(0.0001, t)
            gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, t + BEEP_LEN_S)
            osc.connect(gain).connect(ctx.destination)
            osc.start(t)
            osc.stop(t + BEEP_LEN_S + 0.05)
        } catch (_) { /* audio backend died — stay silent */ }
    }

    // Repeat the side's beep until stop(id). Idempotent per id.
    start(id, side) {
        if (this.timers.has(id)) return
        this._beep(side)
        this.timers.set(id, setInterval(() => this._beep(side), BEEP_EVERY_MS))
    }

    stop(id) {
        const t = this.timers.get(id)
        if (t != null) { clearInterval(t); this.timers.delete(id) }
    }

    stopAll() {
        for (const t of this.timers.values()) clearInterval(t)
        this.timers.clear()
    }

    destroy() {
        this.stopAll()
        if (this.ctx) {
            try { this.ctx.close() } catch (_) { /* already closed */ }
            this.ctx = null
        }
    }
}

/**
 * Should this (un-triggered) alarm fire at the given last close?
 * 'above' alarms arm above the price and fire when it RISES to the level;
 * 'below' alarms fire when it FALLS to the level.
 * @param {{ side:'above'|'below', price:number }} alarm
 * @param {number} close
 * @returns {boolean}
 */
export function alarmShouldTrigger(alarm, close) {
    if (!alarm || !Number.isFinite(close) || !Number.isFinite(alarm.price)) return false
    return alarm.side === 'above' ? close >= alarm.price : close <= alarm.price
}

/**
 * One trigger-loop tick: ring alarms whose level the price has reached, and
 * SILENCE + RE-ARM ringing alarms whose price has crossed back to the armed
 * side (e.g. a 'below' alarm rings while price is under the level and stops
 * when it recovers above it — and rings again on the next cross).
 * Alarms mid-drag ($dragging) are skipped entirely.
 *
 * @param {Array} alarms - mutated in place (triggered flags)
 * @param {number} close - last close
 * @param {{start:(id,side)=>void, stop:(id)=>void}} sound
 * @returns {boolean} whether any alarm changed state (caller repaints)
 */
export function updateAlarms(alarms, close, sound) {
    let changed = false
    for (const a of alarms) {
        if (!a || a.$dragging) continue
        if (a.triggered) {
            if (!alarmShouldTrigger(a, close)) {
                a.triggered = false
                sound.stop(a.id)
                changed = true
            }
            continue
        }
        if (alarmShouldTrigger(a, close)) {
            a.triggered = true
            sound.start(a.id, a.side)
            changed = true
        }
    }
    return changed
}
