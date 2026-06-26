
// DataCube event handlers

import { markRaw } from 'vue'
import Utils from '../stuff/utils.js'
import Icons from '../stuff/icons.json'
import WebWork from './script_ww_api.js'
import Dataset from './dataset.js'


export default class DCEvents {

    constructor() {

        this.ww = new WebWork(this)

        // Listen to the web-worker events
        this.ww.onevent = e => {
            for (let ctrl of this.tv.controllers) {
                if (ctrl.ww) ctrl.ww(e.data)
            }
            switch(e.data.type) {
                case 'request-data':
                    // TODO: DataTunnel class for smarter data transfer
                    if (this.ww._data_uploading) break
                    let data = Dataset.make_tx(this, e.data.data)
                    this.send_meta_2_ww()
                    this.ww.just('upload-data', data)
                    this.ww._data_uploading = true
                    break
                case 'overlay-data':
                    this.on_overlay_data(e.data.data)
                    break
                case 'overlay-update':
                    this.on_overlay_update(e.data.data)
                    break
                case 'data-uploaded':
                    this.ww._data_uploading = false
                    break
                case 'engine-state':
                    this.se_state = Object.assign(
                        this.se_state || {}, e.data.data)
                    break
                case 'modify-overlay':
                    this.modify_overlay(e.data.data)
                    break
                case 'script-signal':
                    this.tv.$emit('signal', e.data.data)
                    break
                case 'script-error':
                    // Per-indicator failure (Phase 3.x): surface on the public
                    // EventMap so consumers know WHICH indicator failed and why.
                    this.tv.$emit('indicator-error', e.data.data)
                    break
            }
            for (let ctrl of this.tv.controllers) {
                if (ctrl.post_ww) ctrl.post_ww(e.data)
            }
        }
    }

    // Called when overalay/tv emits 'custom-event'
    on_custom_event(event, args) {
        switch(event) {
            case 'register-tools': this.register_tools(args)
                break
            case 'exec-script': this.exec_script(args)
                break
            case 'exec-all-scripts': this.exec_all_scripts()
                break
            case 'data-len-changed': this.data_changed(args)
                break
            case 'tool-selected':
                if (!args[0]) break // TODO: Quick fix, investigate
                if (args[0].split(':')[0] === 'System') {
                    this.system_tool(args[0].split(':')[1])
                    break
                }
                this.data['tool'] = args[0]
                if (args[0] === 'Cursor') {
                    this.drawing_mode_off()
                }
                break
            case 'grid-mousedown': this.grid_mousedown(args)
                break
            case 'drawing-mode-off': this.drawing_mode_off()
                break
            case 'change-settings': this.change_settings(args)
                break
            case 'range-changed': this.scripts_onrange(...args)
                break
            case 'scroll-lock': this.on_scroll_lock(args[0])
                break
            case 'object-selected': this.object_selected(args)
                break
            case 'remove-tool': this.system_tool('Remove')
                break
            case 'submit-orders': this.submit_orders(args)
                break
            case 'cancel-orders': this.cancel_orders(args)
                break
            case 'before-destroy': this.before_destroy()
                break

        }

    }

    // Triggered when one or multiple settings are changed
    // We select only the changed ones & re-exec them on the
    // web worker
    on_settings(values, prev) {

        if (!this.sett.scripts) return

        let delta = {}
        let changed = false

        for (let i = 0; i < values.length; i++) {
            let n = values[i]
            let arr = prev.filter(x => x.v === n.v)
            if (!arr.length && n.p.settings.$props) {
                let id = n.p.settings.$uuid
                if (Utils.is_scr_props_upd(n, prev) &&
                    Utils.delayed_exec(n.p)) {
                    delta[id] = n.v
                    changed = true
                    n.p['loading'] = true
                }
            }
        }

        if (changed && Object.keys(delta).length) {
            let tf = this.tv.$refs.chart.interval_ms ||
                     this.data.chart.tf
            let range = this.tv.getRange()
            this.ww.just('update-ov-settings', {
                delta, tf, range
            })
        }

    }

    // When the set of $uuids is changed
    on_ids_changed(values, prev) {
        // PERFORMANCE: Use Set for O(1) lookup instead of Array.includes() O(n)
        // This changes O(n²) to O(n) for the entire operation
        const valuesSet = new Set(values)
        let rem = prev.filter(x => x !== undefined && !valuesSet.has(x))

        if (rem.length) {
            this.ww.just('remove-scripts', rem)
        }
    }

    // Combine all tools and their mods
    register_tools(tools) {
        let preset = {}
        for (let tool of this.data.tools || []) {
             preset[tool.type] = tool
             delete tool.type
        }
        this.data['tools'] = []
        let list = [{
            type: 'Cursor', icon: Icons['cursor.png']
        }]
        for (let tool of tools) {
            let proto = Object.assign({}, tool.info)
            let type = tool.info.type || 'Default'
            proto.type = `${tool.use_for}:${type}`
            this.merge_presets(proto, preset[tool.use_for])
            this.merge_presets(proto, preset[proto.type])
            delete proto.mods
            list.push(proto)
            for (let mod in tool.info.mods) {
                let mp = Object.assign({}, proto)
                mp = Object.assign(mp, tool.info.mods[mod])
                mp.type = `${tool.use_for}:${mod}`
                this.merge_presets(mp, preset[tool.use_for])
                this.merge_presets(mp, preset[mp.type])
                list.push(mp)
            }
        }
        this.data['tools'] = list
        this.data['tool'] = 'Cursor'
    }

    exec_script(args) {
        if (args.length && this.sett.scripts) {
            let obj = this.get_overlay(args[0])
            if (!obj || obj.scripts === false) return
            if (obj.script && obj.script.src) {
                args[0].src = obj.script.src // opt, override the src
            }
            // Parse script props & get the values from the ov
            // TODO: remove unnecessary script initializations
            let s = obj.settings
            let props = args[0].src.props || {}
            if (!s.$uuid) s.$uuid = `${obj.type}-${Utils.uuid2()}`
            args[0].uuid = s.$uuid
            args[0].sett = s
            for (let k in props || {}) {
                let proto = props[k]
                if (s[k] !== undefined) {
                    proto.val = s[k] // use the existing val
                    continue
                }
                if (proto.def === undefined) {
                    // TODO: add support of info / errors to the legend
                    console.error(
                        `Overlay ${obj.id}: script prop '${k}' ` +
                        `doesn't have a default value`)
                    return
                }
                s[k] = proto.val = proto.def // set the default
            }
            // Remove old props (dropped by the current exec)
            if (s.$props) {
                for (let k in s) {
                    if (s.$props.includes(k) && !(k in props)) {
                        delete s[k]
                    }
                }
            }
            s.$props = Object.keys(args[0].src.props || {})
            obj['loading'] = true
            let tf = this.tv.$refs.chart.interval_ms ||
                     this.data.chart.tf
            let range = this.tv.getRange()
            if (obj.script && obj.script.output != null) {
                args[0].output = obj.script.output
            }
            this.ww.just('exec-script', {
                s: args[0], tf, range
            })
        }
    }

    exec_all_scripts() {
        if (!this.sett.scripts) return
        this.set_loading(true)
        let tf = this.tv.$refs.chart.interval_ms ||
                 this.data.chart.tf
        let range = this.tv.getRange()
        this.ww.just('exec-all-scripts', { tf, range })
    }

    scripts_onrange(r) {
        if (!this.sett.scripts) return
        let delta = {}

        this.get('.').forEach(v => {
            if (v.script && v.script.execOnRange &&
                v.settings.$uuid) {
                // TODO: execInterrupt flag?
                if (Utils.delayed_exec(v)) {
                    delta[v.settings.$uuid] = v.settings
                }
            }
        })

        if (Object.keys(delta).length) {
            let tf = this.tv.$refs.chart.interval_ms ||
                     this.data.chart.tf
            let range = this.tv.getRange()
            this.ww.just('update-ov-settings', {
                delta, tf, range
            })
        }
    }

    // Overlay modification from WW
    modify_overlay(upd) {
        let obj = this.get_overlay(upd)
        if (obj) {
            for (let k in upd.fields || {}) {
                if (typeof obj[k] === 'object') {
                    this.merge(`${upd.uuid}.${k}`, upd.fields[k])
                } else {
                    obj[k] = upd.fields[k]
                }
            }
        }
    }

    data_changed(args) {
        if (!this.sett.scripts) return
        if (this.sett.data_change_exec === false) return
        let main = this.data.chart.data
        if (this.ww._data_uploading) return
        if (!this.se_state.scripts) return
        this.send_meta_2_ww()
        this.ww.just('upload-data', { ohlcv: main })
        this.ww._data_uploading = true
        this.set_loading(true)
    }

    set_loading(flag) {
        let skrr = this.get('.').filter(x => x.settings.$props)
        for (let s of skrr) {
            this.merge(`${s.id}`, { loading: flag })
        }
    }

    send_meta_2_ww() {
        let tf = this.tv.$refs.chart.interval_ms ||
                 this.data.chart.tf
        let range = this.tv.getRange()
        this.ww.just('send-meta-info', { tf, range })
    }

    merge_presets(proto, preset) {
        if (!preset) return
        for (let k in preset) {
            if (k === 'settings') {
                Object.assign(proto[k], preset[k])
            } else {
                proto[k] = preset[k]
            }
        }
    }

    grid_mousedown(args) {
        // TODO: tool state finished?
        this.object_selected([])
        // Remove the previous RangeTool
        let rem = () => this.get('RangeTool')
            .filter(x => x.settings.shiftMode)
            .forEach(x => this.del(x.id))
        if (this.data.tool && this.data.tool !== 'Cursor' &&
           !this.data.drawingMode) {
            // Prevent from "null" tools (tool created with HODL)
            if (args[1].type !== 'tap') {
                this.data['drawingMode'] = true
                this.build_tool(args[0])
            } else {
                this.tv.showTheTip(
                    `<b>Hodl</b>+<b>Drug</b> to create, ` +
                    `<b>Tap</b> to finish a tool`
                )
            }
        } else if (this.sett.shift_measure && args[1].shiftKey) {
            rem()
            this.tv.$nextTick(() =>
                this.build_tool(args[0], 'RangeTool:ShiftMode'))
        } else {
            rem()
        }
    }

    drawing_mode_off() {
        this.data['drawingMode'] = false
        this.data['tool'] = 'Cursor'
    }

    // Place a new tool
    build_tool(grid_id, type) {

        let list = this.data.tools
        type = type || this.data.tool
        let proto = list.find(x => x.type === type)
        if (!proto) return
        let sett = Object.assign({}, proto.settings || {})
        let data = (proto.data || []).slice()

        if(!('legend' in sett)) sett.legend = false
        if(!('z-index' in sett)) sett['z-index'] = 100
        sett.$selected = true
        sett.$state = 'wip'

        let side = grid_id ? 'offchart' : 'onchart'
        let id = this.add(side, {
            name: proto.name,
            type: type.split(':')[0],
            settings: sett,
            data: data,
            grid: { id: grid_id }
        })

        sett.$uuid = `${id}-${Utils.now()}`

        this.data['selected'] = sett.$uuid
        this.add_trash_icon()
    }

    // Remove selected / Remove all, etc
    system_tool(type) {
        switch (type) {
            case 'Remove':
                if (this.data.selected) {
                    this.del(this.data.selected)
                    this.remove_trash_icon()
                    this.drawing_mode_off()
                    this.on_scroll_lock(false)
                }
                break
        }
    }

    // Apply new overlay settings
    change_settings(args) {
        let settings = args[0]
        delete settings.id
        let grid_id = args[1]
        this.merge(`${args[3]}.settings`, settings)
        // Settings are read at DRAW time, not as a reactive render dependency of
        // the canvas (same gotcha as the Volume eye-toggle). A static settings
        // change with no following cursor move (eye toggle, order delete, etc.)
        // would otherwise not repaint — bump the render revision so the new
        // settings flow to the overlay AND the grid redraws.
        if (typeof this.touchData === 'function') this.touchData()
    }

    // Submit an OrderBox's orders to the (app-attached) OrderAgent. args from
    // custom_event('submit-orders') = [grid_id, layer_id, $uuid]. Prototype seam:
    // the agent flips local->pending->confirmed via a local stub transport.
    submit_orders(args) {
        if (!this.orderAgent) return
        const uuid = args[args.length - 1]
        // tools built on an offchart pane land in data.offchart (build_tool's
        // side selection) — scan both panes or their orders submit into the void
        for (const side of ['onchart', 'offchart']) {
            for (const ov of (this.data[side] || [])) {
                if (ov.settings && ov.settings.$uuid === uuid) {
                    this.orderAgent.submit(ov.settings)
                    return
                }
            }
        }
    }

    // Cancel an OrderBox's live orders via the agent (the box stays until the
    // engine confirms the cancellation). args = [grid_id, layer_id, $uuid].
    cancel_orders(args) {
        if (!this.orderAgent) return
        const uuid = args[args.length - 1]
        for (const side of ['onchart', 'offchart']) {
            for (const ov of (this.data[side] || [])) {
                if (ov.settings && ov.settings.$uuid === uuid) {
                    this.orderAgent.cancel(ov.settings)
                    return
                }
            }
        }
    }

    // Lock the scrolling mechanism
    on_scroll_lock(flag) {
        this.data['scrollLock'] = flag
    }

    // When new object is selected / unselected
    object_selected(args) {
        let q = this.data.selected
        if (q) {
            // Check if current drawing is finished
            //let res = this.get_one(`${q}.settings`)
            //if (res && res.$state !== 'finished') return
            this.merge(`${q}.settings`, {
                $selected: false
            })
            this.remove_trash_icon()
        }
        this.data['selected'] = null

        if (!args.length) return

        this.data['selected'] = args[2]
        this.merge(`${args[2]}.settings`, {
            $selected: true
        })

        this.add_trash_icon()
    }

    add_trash_icon() {
        const type = 'System:Remove'
        if (this.data.tools.find(x => x.type === type)) {
            return
        }
        this.data.tools.push({
            type, icon: Icons['trash.png']
        })
    }

    remove_trash_icon() {
        // TODO: Does not call Toolbar render (distr version)
        const type = 'System:Remove'
        Utils.overwrite(this.data.tools,
            this.data.tools.filter(x => x.type !== type)
        )
    }

    // Set overlay data from the web-worker
    on_overlay_data(data) {
        this.get('.').forEach(x => {
            if (x.settings.$synth) this.del(`${x.id}`)
        })
        for (let ov of data) {
            let obj = this.get_one(`${ov.id}`)
            if (obj) {
                obj['loading'] = false
                if (!ov.data) continue
                // vr-3 Strategy B: the script-worker's fresh overlay ROW array
                // is non-reactive (markRaw) so the in-place fast_merge upserts in
                // on_overlay_update can't re-proxy it. Row array only — the
                // overlay OBJECT + container stay reactive.
                obj.data = Array.isArray(ov.data) ? markRaw(ov.data) : ov.data
            }
            if (!ov.new_ovs) continue
            for (let id in ov.new_ovs.onchart) {
                if (!this.get_one(`onchart.${id}`)) {
                    this.add('onchart', ov.new_ovs.onchart[id])
                }
            }
            for (let id in ov.new_ovs.offchart) {
                if (!this.get_one(`offchart.${id}`)) {
                    this.add('offchart', ov.new_ovs.offchart[id])
                }
            }
        }
    }

    // Push overlay updates from the web-worker
    on_overlay_update(data) {
        for (let ov of data) {
            if (!ov.data) continue
            let obj = this.get_one(`${ov.id}`)
            if (obj) {
                this.fast_merge(obj.data, ov.data, false)
            }
        }
    }

    // Clean-up unfinished business (tools)
    before_destroy() {
        let f = x => !x.settings.$state ||
            x.settings.$state === 'finished'
        this.data.onchart = this.data.onchart
            .filter(f)
        this.data.offchart = this.data.offchart
            .filter(f)
        this.drawing_mode_off()
        this.on_scroll_lock(false)
        this.object_selected([])
        this.ww.destroy()
    }

    // Get overlay by grid-layer id
    get_overlay(obj) {
        let id = obj.id || `g${obj.grid_id}_${obj.layer_id}`
        let dcid = obj.uuid || (this.gldc && this.gldc[id])
        // A gldc miss used to query the literal string 'undefined', which
        // (via the old includes(undefined) hole) returned an arbitrary
        // uuid-less overlay — scripts then executed against the wrong one.
        if (dcid == null) return undefined
        return this.get_one(`${dcid}`)
    }


}
