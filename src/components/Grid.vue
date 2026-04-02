<script>
// Sets up all layers/overlays for the grid with 'grid_id'
// Optimized for Vue 3: targeted watchers, no $forceUpdate

import { h, nextTick } from 'vue'
import Grid from './js/grid.js'
import Canvas from '../mixins/canvas.js'
import UxList from '../mixins/uxlist.js'
import Crosshair from './Crosshair.vue'
import KeyboardListener from './KeyboardListener.vue'
import UxLayer from './UxLayer.vue'

import Spline from "./overlays/Spline.vue"
import Splines from "./overlays/Splines.vue"
import Range from "./overlays/Range.vue"
import Trades from "./overlays/Trades.vue"
import Channel from "./overlays/Channel.vue"
import Segment from "./overlays/Segment.vue"
import Candles from "./overlays/Candles.vue"
import Volume from "./overlays/Volume.vue"
import Splitters from "./overlays/Splitters.vue"
import LineTool from "./overlays/LineTool.vue"
import RangeTool from "./overlays/RangeTool.vue"
import StepLine from "./overlays/StepLine.vue"
import Histogram from "./overlays/Histogram.vue"
import Bar from "./overlays/Bar.vue"
import Zones from "./overlays/Zones.vue"


export default {
    name: 'Grid',
    props: [
        'sub', 'layout', 'range', 'interval', 'cursor', 'colors', 'overlays',
        'width', 'height', 'data', 'grid_id', 'y_transform', 'font', 'tv_id',
        'config', 'meta', 'shaders'
    ],
    mixins: [Canvas, UxList],
    components: { Crosshair, KeyboardListener },
    created() {
        // Vue 3: Initialize event handlers in created() using arrow functions
        // so they capture 'this' at call time (methods aren't bound in data())
        this.layer_events = {
            'new-grid-layer': d => this.new_layer(d),
            'delete-grid-layer': d => this.del_layer(d),
            'show-grid-layer': d => {
                if (this.renderer) {
                    this.renderer.show_hide_layer(d)
                    this.redraw()
                }
            },
            'redraw-grid': () => this.redraw(),
            'layer-meta-props': d => this.$emit('layer-meta-props', d),
            'custom-event': d => this.$emit('custom-event', d)
        }
        this.keyboard_events = {
            'register-kb-listener': event => {
                this.$emit('register-kb-listener', event)
            },
            'remove-kb-listener': event => {
                this.$emit('remove-kb-listener', event)
            },
            'keyup': event => {
                if (!this.is_active || !this.renderer) return
                this.renderer.propagate('keyup', event)
            },
            'keydown': event => {
                if (!this.is_active || !this.renderer) return
                this.renderer.propagate('keydown', event)
            },
            'keypress': event => {
                if (!this.is_active || !this.renderer) return
                this.renderer.propagate('keypress', event)
            },
        }

        // List of all possible overlays (builtin + custom)
        this._list = [
            Spline, Splines, Range, Trades, Channel, Segment,
            Candles, Volume, Splitters, LineTool, RangeTool,
            StepLine, Histogram, Bar, Zones
        ]
        .concat(this.$props.overlays || [])
        this._registry = {}

        // We need to know which components we will use.
        // Custom overlay components overwrite built-ins:
        let tools = []
        this._list.forEach((x, i) => {
            if (!x || !x.methods || !x.methods.use_for) return
            let use_for = x.methods.use_for()
            if (x.methods.tool) tools.push({
                use_for, info: x.methods.tool()
            })
            use_for.forEach(indicator => {
                this._registry[indicator] = i
            })
        })
        this.$emit('custom-event', {
            event: 'register-tools', args: tools
        })
        // Note: $on removed in Vue 3, handle custom events via layer_events callback
    },
    beforeUnmount () {
        if (this.renderer) {
            this.renderer.destroy()
            // Nullify renderer so new layers go to pendingLayers during remount
            this.renderer = null
        }
    },
    mounted() {
        const el = this.$refs['canvas']
        if (!el) {
            // Canvas not created yet (render returned loading state)
            return
        }

        // Increment generation to invalidate stale $nextTick callbacks
        this.rendererGeneration++
        const gen = this.rendererGeneration

        // Pass both static and dynamic canvas refs to Grid
        const elDynamic = this.$refs['canvasDynamic']
        this.renderer = new Grid(el, this, elDynamic)

        this.setup()

        // Flush pending layers that were queued before renderer was ready
        if (this.pendingLayers.length > 0) {
            for (const layer of this.pendingLayers) {
                this.renderer.new_layer(layer)
            }
            this.pendingLayers = []
        }

        this.$nextTick(() => {
            // Guard against stale callback from previous mount
            if (this.rendererGeneration !== gen) {
                return
            }
            this.redraw()
        })
    },
    render() {
        const id = this.$props.grid_id
        // Use layout override if available (for resize operations)
        const layout = this.layoutOverride ||
            (this.$props.layout?.grids?.[id])
        // Guard against missing layout during initialization
        if (!layout) {
            return h('div', { class: 'trading-vue-grid-loading' })
        }
        return this.create_canvas(h, `grid-${id}`, {
            position: {
                x: 0,
                y: layout.offset || 0
            },
            attrs: {
                width: layout.width,
                height: layout.height,
                overflow: 'hidden'
            },
            style: {
                backgroundColor: this.$props.colors.back
            },
            hs: [
                h(Crosshair, {
                    ...this.common_props(),
                    'onNewGridLayer': this.layer_events['new-grid-layer'],
                    'onDeleteGridLayer': this.layer_events['delete-grid-layer'],
                    'onShowGridLayer': this.layer_events['show-grid-layer'],
                    'onRedrawGrid': this.layer_events['redraw-grid'],
                    'onLayerMetaProps': this.layer_events['layer-meta-props'],
                    'onCustomEvent': this.layer_events['custom-event']
                }),
                h(KeyboardListener, {
                    'onRegisterKbListener': this.keyboard_events['register-kb-listener'],
                    'onRemoveKbListener': this.keyboard_events['remove-kb-listener'],
                    onKeyup: this.keyboard_events['keyup'],
                    onKeydown: this.keyboard_events['keydown'],
                    onKeypress: this.keyboard_events['keypress']
                }),
                h(UxLayer, {
                    id, tv_id: this.$props.tv_id,
                    uxs: this.uxs,
                    colors: this.$props.colors,
                    config: this.$props.config,
                    // PERFORMANCE: Use deterministic key instead of Math.random()
                    // Math.random() caused unnecessary re-renders on every frame
                    updater: this.renderKey,
                    'onCustomEvent': this.emit_ux_event
                })
            ].concat(this.get_overlays())
        })
    },
    methods: {
        new_layer(layer) {
            if (!this.renderer) {
                // Queue layer until renderer is ready
                this.pendingLayers.push(layer)
                return
            }
            // Synchronous when renderer ready - no $nextTick to avoid race condition
            // where canvas setup completes before layer registration
            this.renderer.new_layer(layer)
        },
        del_layer(layer) {
            // Call synchronously - do NOT use $nextTick here!
            // $nextTick causes the deletion to execute AFTER new components mount,
            // deleting layers from the wrong (new) renderer instance.
            if (this.renderer) {
                this.renderer.del_layer(layer)
            }
            const grid_id = this.$props.grid_id
            this.$emit('custom-event', {
                event: 'remove-shaders',
                args: [grid_id, layer]
            })
            // TODO: close all interfaces
            this.$emit('custom-event', {
                event: 'remove-layer-meta',
                args: [grid_id, layer]
            })
            this.remove_all_ux(layer)
        },
        // Handle double-click to minimize off-chart grids or minimize all (main chart)
        on_dblclick(e) {
            const grid_id = this.$props.grid_id
            if (grid_id === 0) {
                // Double-click on main chart minimizes all off-chart grids
                this.$emit('custom-event', {
                    event: 'minimize-all-offcharts',
                    args: []
                })
            } else {
                // Double-click on off-chart grid toggles its minimize state
                this.$emit('custom-event', {
                    event: 'grid-dblclick',
                    args: [grid_id]
                })
            }
        },
        get_overlays() {
            // Distributes overlay data & settings according
            // to this._registry; returns compo list
            let comp_list = [], count = {}

            for (let d of this.$props.data) {
                let comp = this._list[this._registry[d.type]]
                if (comp) {
                    if(comp.methods.calc) {
                        comp = this.inject_renderer(comp)
                    }
                    comp_list.push({
                        cls: comp,
                        type: d.type,
                        data: d.data,
                        settings: d.settings,
                        i0: d.i0,
                        tf: d.tf,
                        last: d.last
                    })
                    count[d.type] = 0
                }
            }
            return comp_list.map((x, i) => h(x.cls, {
                    'onNewGridLayer': this.layer_events['new-grid-layer'],
                    'onDeleteGridLayer': this.layer_events['delete-grid-layer'],
                    'onShowGridLayer': this.layer_events['show-grid-layer'],
                    'onRedrawGrid': this.layer_events['redraw-grid'],
                    'onLayerMetaProps': this.layer_events['layer-meta-props'],
                    'onCustomEvent': this.layer_events['custom-event'],
                    ...this.common_props(),
                    id: `${x.type}_${count[x.type]++}`,
                    type: x.type,
                    data: x.data,
                    settings: x.settings,
                    i0: x.i0,
                    tf: x.tf,
                    num: i,
                    grid_id: this.$props.grid_id,
                    meta: this.$props.meta,
                    last: x.last
                })
            )
        },
        common_props() {
            // Use layout override if available (for resize operations)
            const layout = this.layoutOverride ||
                (this.$props.layout?.grids?.[this.$props.grid_id])
            return {
                cursor: this.$props.cursor,
                colors: this.$props.colors,
                layout: layout,
                interval: this.$props.interval,
                sub: this.$props.sub,
                font: this.$props.font,
                config: this.$props.config,
            }
        },
        emit_ux_event(e) {
            let e_pass = this.on_ux_event(e, 'grid')
            if (e_pass) this.$emit('custom-event', e)
        },
        // Replace the current comp with 'renderer'
        inject_renderer(comp) {
            let src = comp.methods.calc()
            if (!src.conf || !src.conf.renderer || comp.__renderer__) {
                return comp
            }

            // Search for an overlay with the target 'name'
            let f = this._list.find(x => x.name === src.conf.renderer)
            if (!f) return comp

            comp.mixins.push(f)
            comp.__renderer__ = src.conf.renderer

            return comp
        },
        // Force resize canvas based on provided layout (for drag resize)
        resize_from_layout(layout) {
            const id = this.$props.grid_id
            const grid = layout ? layout.grids[id] : null
            if (grid && this._attrs) {
                this._attrs.width = grid.width
                this._attrs.height = grid.height
                // Store layout override for common_props() and overlays
                this.layoutOverride = grid
                // Update wrapper div position
                const wrapper = this.$el
                if (wrapper) {
                    wrapper.style.top = (grid.offset || 0) + 'px'
                }
                // Update renderer's layout reference for correct Y-scale
                if (this.renderer) {
                    this.renderer.layout = grid
                }
                // Trigger re-render via reactive key (replaces $forceUpdate)
                this.renderKey++
                nextTick(() => {
                    this.setup()
                })
            }
        }
    },
    computed: {
        is_active() {
            return this.$props.cursor.t !== undefined &&
            this.$props.cursor.grid_id === this.$props.grid_id
        },
        // Computed hash keys for efficient change detection (replaces deep watchers)
        rangeKey() {
            const r = this.$props.range
            if (!r || r.length < 2) return ''
            return `${r[0]},${r[1]}`
        },
        layoutKey() {
            const id = this.$props.grid_id
            const layout = this.$props.layout
            const grid = layout?.grids?.[id]
            if (!grid) return ''
            return `${grid.height},${grid.offset},${grid.width}`
        },
        dataKey() {
            const data = this.$props.data
            if (!data) return ''
            // Use length and first/last timestamps for efficient change detection
            const len = data.length
            if (len === 0) return '0'
            const first = data[0]?.data?.[0]?.[0] ?? ''
            // PERF: Direct index access instead of slice(-1)[0] which allocates a new array
            const lastOvData = data[len - 1]?.data
            const last = lastOvData?.[lastOvData.length - 1]?.[0] ?? ''
            return `${len},${first},${last}`
        },
        yTransformKey() {
            const yt = this.$props.y_transform
            if (!yt) return ''
            return `${yt.zoom},${yt.auto},${yt.range?.[0]},${yt.range?.[1]}`
        }
    },
    watch: {
        // Initialize renderer when layout becomes available (deferred init)
        // Use layoutKey computed instead of deep watch
        layoutKey: {
            handler(newKey, oldKey) {
                const id = this.$props.grid_id
                const layout = this.$props.layout
                if (!this.renderer && layout?.grids?.[id]) {
                    // Increment generation to invalidate stale callbacks
                    this.rendererGeneration++
                    const gen = this.rendererGeneration

                    // Wait for Vue to re-render with canvas element
                    nextTick(() => {
                        // Guard against stale callback
                        if (this.rendererGeneration !== gen) {
                            return
                        }
                        if (this.renderer) {
                            return  // Already initialized
                        }
                        const el = this.$refs['canvas']
                        if (!el) {
                            return  // Canvas still not ready
                        }

                        const elDynamic = this.$refs['canvasDynamic']
                        this.renderer = new Grid(el, this, elDynamic)
                        this.setup()
                        // Flush pending layers that were queued before renderer was ready
                        for (const layer of this.pendingLayers) {
                            this.renderer.new_layer(layer)
                        }
                        this.pendingLayers = []
                        nextTick(() => {
                            // Guard again for the inner callback
                            if (this.rendererGeneration !== gen) return
                            this.redraw()
                        })
                    })
                } else if (this.renderer && newKey !== oldKey) {
                    // Layout dimensions changed - resize
                    nextTick(() => {
                        this.setup()
                        this.redraw()
                    })
                }
            },
            immediate: false
        },
        // Watch range changes using computed hash key
        rangeKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            this.renderKey++
            nextTick(() => this.redraw())
        },
        // Watch cursor changes for redraw - use RAF to batch updates
        'cursor.x': function(newX) {
            if (this._cursorRafPending) return
            this._cursorRafPending = true
            requestAnimationFrame(() => {
                this._cursorRafPending = false
                if (this.$props.cursor?.locked) return
                this.redraw()
            })
        },
        overlays: {
            // Track changes in calc() functions
            handler: function(ovs) {
                // Note: $children removed in Vue 3, use renderer's overlays instead
                if (!this.renderer || !this.renderer.overlays || !ovs) return
                // PERF: Build name → renderers lookup map O(M+N) instead of O(M×N)
                let layerMap = new Map()
                for (let layer of this.renderer.overlays) {
                    let comp = layer.renderer
                    if (!comp || typeof comp.id !== 'string') continue
                    let tuple = comp.id.split('_')
                    tuple.pop()
                    let name = tuple.join('_')
                    let arr = layerMap.get(name)
                    if (!arr) {
                        arr = []
                        layerMap.set(name, arr)
                    }
                    arr.push(comp)
                }
                for (let ov of ovs) {
                    if (!ov || !ov.methods) continue
                    let comps = layerMap.get(ov.name)
                    if (!comps) continue
                    for (let comp of comps) {
                        comp.calc = ov.methods.calc
                        if (!comp.calc) continue
                        let calc = comp.calc.toString()
                        if (calc !== ov.__prevscript__) {
                            comp.exec_script()
                        }
                        ov.__prevscript__ = calc
                    }
                }
            },
            deep: true  // Keep deep for calc() function tracking - necessary
        },
        // Redraw on the shader list change
        shaders(n, p) { this.redraw() },
        // Watch data changes using computed hash key
        dataKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            this.renderKey++
            nextTick(() => this.redraw())
        },
        // Watch y-axis transform changes (sidebar zoom/drag)
        yTransformKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            this.renderKey++
            nextTick(() => this.redraw())
        }
    },
    data() {
        return {
            // Override layout for resize operations (bypassing Vue reactivity)
            layoutOverride: null,
            // Reactive key for triggering re-renders (replaces $forceUpdate)
            renderKey: 0,
            // Queue layers registered before renderer is ready
            pendingLayers: [],
            // Generation counter to guard against stale $nextTick callbacks
            rendererGeneration: 0
            // Note: layer_events and keyboard_events are initialized in created()
        }
    }
}

</script>
