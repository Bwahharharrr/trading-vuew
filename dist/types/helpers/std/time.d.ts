declare namespace _default {
    /** Day of month, literally
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Day
     */
    function dayofmonth(time?: number): number;
    /** Day of week, literally
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Day
     */
    function dayofweek(time?: number): number;
    /** Returns hours of a given timestamp
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Hour
     */
    function hour(time?: number): number;
    /** Returns minutes of a given timestamp
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Minute
     */
    function minute(time?: number): number;
    /** Month
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Month
     */
    function month(time?: number): number;
    /** The current time
     * @return {number} - timestamp
     */
    function now(): number;
    /** Returns seconds of a given timestamp
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Second
     */
    function second(time?: number): number;
    /** Week of year, literally
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Week
     */
    function weekofyear(time?: number): number;
    /** Year
     * @param {number} [time] - Time in ms (current t, if not defined)
     * @return {number} - Year
     */
    function year(time?: number): number;
}
export default _default;
