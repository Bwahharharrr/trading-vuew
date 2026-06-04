declare namespace _default {
    /** Creates a new Symbol.
     * @param {*} x - Something, depends on arg variation
     * @param {*} y - Something, depends on arg variation
     * @return {Sym}
     * Argument variations:
     * <data>(Array), [<params>(Object)]
     * <ts>(TS), [<params>(Object)]
     * <point>(Number), [<params>(Object)]
     * <tf>(String) 1m, 5m, 1H, etc. (uses main OHLCV)
     * Params object: {
     *  id: <String>,
     *  tf: <String|Number>,
     *  aggtype: <String> (TODO: Type of aggregation)
     *  format: <String> (Data format, e.g. "time:price:vol")
     *  window: <String|Number> (Aggregation window)
     *  main <true|false> (Use as the main chart)
     * }
     */
    function sym(x: any, y: any | undefined, _id: any): Sym;
}
export default _default;
import { Sym } from '../symbol.js';
