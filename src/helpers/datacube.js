
// Main DataHelper class. A container for data,
// which works as a proxy and CRUD interface

import Utils from '../stuff/utils.js'
import DCCore from './dc_core.js'
import SettProxy from './sett_proxy.js'
import AggTool from './agg_tool.js'
import { validateData } from './schema/validate.js'
import { report } from './schema/diagnostics.js'


// Interface methods. Private methods in dc_core.js
export default class DataCube extends DCCore {

    constructor(data = {}, sett = {}) {

        let def_sett = {
            aggregation: 100,       // Update aggregation interval
            script_depth: 0,        // 0 === Exec on all data
            auto_scroll: true,      // Auto scroll to a new candle
            scripts: true,          // Enable overlays scripts,
            ww_ram_limit: 0,        // WebWorker RAM limit (MB)
            node_url: null,         // Use node.js instead of WW
            shift_measure: true,    // Draw measurment shift+click
            validation: 'warn'      // 'off' | 'warn' | 'strict' (data ingest)
        }
        sett = Object.assign(def_sett, sett)

        super()
        this.sett = sett
        this.data = data

        // Validate at the primary ingestion choke point. Default 'warn' is
        // non-breaking (loud but never throws); 'strict' fails fast on malformed
        // data. Skip trivial empty construction (`new DataCube()`).
        if (sett.validation !== 'off' && data && Object.keys(data).length) {
            const { diagnostics } = validateData(data)
            if (diagnostics.length) {
                report(diagnostics, sett.validation, 'chart data')
            }
        }
        this.sett = SettProxy(sett, this.ww)
        this.agg = new AggTool(this, sett.aggregation)
        this.se_state = {}

        //this.agg.update = this.agg_update.bind(this)
    }

    // Public data API — delegates to the typed ChartData store (Phase 3.1b).
    // The mutation bodies moved verbatim into src/stores/chart-data.js; these
    // remain the stable public surface used by overlays/mixins/consumers.

    // Add new overlay
    add(side, overlay) {
        return this.cd.add(side, overlay)
    }

    // Get all objects matching the query
    get(query) {
        return this.cd.get(query)
    }

    // Get first object matching the query
    get_one(query) {
        return this.cd.getOne(query)
    }

    // Set data (reactively)
    set(query, data) {
        return this.cd.set(query, data)
    }

    // Merge object or array (reactively)
    merge(query, data) {
        return this.cd.merge(query, data)
    }

    // Remove an overlay by query (id/type/name/...)
    del(query) {
        return this.cd.del(query)
    }

    // Update/append data point, depending on timestamp
    update(data) {
        if(data['candle']) {
            return this.update_candle(data)
        } else {
            return this.update_tick(data)
        }
    }

    // Lock overlays from being pulled by query_search
    // TODO: subject to review
    lock(query) {
        return this.cd.lock(query)
    }

    // Unlock overlays from being pulled by query_search
    //
    unlock(query) {
        return this.cd.unlock(query)
    }

    // Show indicator
    show(query) {
        if (query === 'offchart' || query === 'onchart') {
             query += '.'
        } else if (query === '.') {
            query = ''
        }
        this.merge(query + '.settings', { display: true })
    }

    // Hide indicator
    hide(query) {
        if (query === 'offchart' || query === 'onchart') {
             query += '.'
        } else if (query === '.') {
             query = ''
        }
        this.merge(query + '.settings', { display: false })
    }

    // Set data loader callback
    onrange(callback) {
        this.loader = callback
        setTimeout(() =>
            this.tv.set_loader(callback ? this : null), 0
        )
    }

}
