/**
 * Should this (un-triggered) alarm fire at the given last close?
 * 'above' alarms arm above the price and fire when it RISES to the level;
 * 'below' alarms fire when it FALLS to the level.
 * @param {{ side:'above'|'below', price:number }} alarm
 * @param {number} close
 * @returns {boolean}
 */
export function alarmShouldTrigger(alarm: {
    side: "above" | "below";
    price: number;
}, close: number): boolean;
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
export function updateAlarms(alarms: any[], close: number, sound: {
    start: (id: any, side: any) => void;
    stop: (id: any) => void;
}): boolean;
export class AlarmSound {
    ctx: AudioContext | null;
    timers: Map<any, any>;
    _context(): AudioContext | null;
    unlock(): void;
    _beep(side: any): void;
    start(id: any, side: any): void;
    stop(id: any): void;
    stopAll(): void;
    destroy(): void;
}
