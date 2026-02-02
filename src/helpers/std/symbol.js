// Symbol functions for ScriptStd

import { Sym, ARR, TSS, NUM } from '../symbol.js'
import se from '../script_state.js'

export default {
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
    sym(x, y = {}, _id) {
        let id = y.id || this._tsid(_id, `sym`)
        y.id = id
        if (this.env.syms[id]) {
            this.env.syms[id].update(x)
            return this.env.syms[id]
        }

        switch(typeof x) {
            case 'object':
                var sym = new Sym(x, y)
                this.env.syms[id] = sym
                if (x.__id__) {
                    sym.data_type = TSS
                } else {
                    sym.data_type = ARR
                }

                break
            case 'number':
                sym = new Sym(null, y)
                sym.data_type = NUM
                break
            case 'string':
                y.tf = x
                sym = new Sym(se.data.ohlcv.data, y)
                sym.data_type = ARR
                break
        }

        this.env.syms[id] = sym
        return sym
    }
}
