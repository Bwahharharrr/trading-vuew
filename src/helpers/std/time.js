// Time functions for ScriptStd
// Note: These use 'se' from script_state for current timestamp

import se from '../script_state.js'

export default {
    /** Day of month, literally
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Day
     */
    dayofmonth(time) {
        return new Date(time || se.t).getUTCDate()
    },

    /** Day of week, literally
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Day
     */
    dayofweek(time) {
        return new Date(time || se.t).getUTCDay() + 1
    },

    /** Returns hours of a given timestamp
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Hour
     */
    hour(time) {
        return new Date(time || se.t).getUTCHours()
    },

    /** Returns minutes of a given timestamp
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Minute
     */
    minute(time) {
        return new Date(time || se.t).getUTCMinutes()
    },

    /** Month
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Month
     */
    month(time) {
        return new Date(time || se.t).getUTCMonth()
    },

    /** The current time
     * @return {number} - timestamp
     */
    now() {
        // PERFORMANCE: Date.now() is 5-10x faster than new Date().getTime()
        return Date.now()
    },

    /** Returns seconds of a given timestamp
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Second
     */
    second(time) {
        return new Date(time || se.t).getUTCSeconds()
    },

    /** Week of year, literally
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Week
     */
    weekofyear(time) {
        let date = new Date(time || se.t)
        date.setUTCHours(0, 0, 0, 0)
        date.setDate(date.getUTCDate() + 3 - (date.getUTCDay() + 6) % 7)
        let week1 = new Date(date.getUTCFullYear(), 0, 4)
        return 1 + Math.round(
            ((date - week1) / 86400000 - 3 +
            (week1.getUTCDay() + 6) % 7) / 7
        )
    },

    /** Year
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Year
     */
    year(time) {
        return new Date(time || se.t).getUTCFullYear()
    }
}
