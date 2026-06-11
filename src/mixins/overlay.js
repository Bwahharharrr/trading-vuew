
// Usuful stuff for creating overlays. Include as mixin

import { h } from 'vue'
import Mouse from '../stuff/mouse.js'

export default {
    props: [
        'id', 'num', 'interval', 'cursor', 'colors',
        'layout', 'sub', 'data', 'settings', 'grid_id',
        'font', 'config', 'meta', 'tf', 'i0', 'last'
    ],
    mounted() {
        // TODO(1): when hot reloading, dynamicaly changed mixins
        // dissapear (cuz it's a hack), the only way for now
        // is to reload the browser
        if (!this.draw) {
            this.draw = ctx => {
                let text = 'EARLY ADOPTER BUG: reload the browser & enjoy'
                console.warn(text)
            }
        }
        // Main chart?
        let main = this.$props.sub === this.$props.data

        this.meta_info()

        this.$emit('new-grid-layer', {
            name: this.$options.name,
            id: this.$props.id,
            renderer: this,
            display: 'display' in this.$props.settings ?
               this.$props.settings['display'] : true,
            z: this.$props.settings['z-index'] ||
               this.$props.settings['zIndex'] || (main ? 0 : -1),
        })

        // Overlay meta-props (adjusting behaviour)
        this.$emit('layer-meta-props', {
            grid_id: this.$props.grid_id,
            layer_id: this.$props.id,
            legend: this.legend,
            data_colors: this.data_colors,
            y_range: this.y_range
        })
        this.exec_script()
        this.mouse = new Mouse(this)
        if (this.init_tool) this.init_tool()
        if (this.init) this.init()
    },
    beforeUnmount() {
        if (this.destroy) this.destroy()
        this.$emit('delete-grid-layer', this.$props.id)
    },
    methods: {
        use_for() {
            /* override it (mandatory) */
            console.warn('use_for() should be implemented')
            console.warn(
            `Format: use_for() {
                  return ['type1', 'type2', ...]
            }`)
        },
        meta_info() {
            /* override it (optional) */
            let id = this.$props.id
            console.warn(
                `${id} meta_info() is req. for publishing`)
            console.warn(
            `Format: meta_info() {
                author: 'Satoshi Smith',
                version: '1.0.0',
                contact (opt) '<email>'
                github: (opt) '<GitHub Page>',
            }`)
        },
        custom_event(event, ...args) {
            if (event.split(':')[0] === 'hook') return
            if (event === 'change-settings' ||
                event === 'object-selected' ||
                event === 'new-shader' ||
                event === 'new-interface' ||
                event === 'remove-tool' ||
                event === 'submit-orders' ||
                event === 'cancel-orders') {
                args.push(this.grid_id, this.id)
                if (this.$props.settings.$uuid) {
                    args.push(this.$props.settings.$uuid)
                }
            }
            if (event === 'new-interface') {
                args[0].overlay = this
                args[0].uuid = this.last_ux_id =
                    `${this.grid_id}-${this.id}-${this.uxs_count++}`
            }
            // TODO: add a namespace to the event name
            // TODO(2): this prevents call overflow, but
            // the root of evil is in (1)
            if (event === 'custom-event') return
            this.$emit('custom-event', {event, args})
        },
        // TODO: the event is not firing when the same
        // overlay type is added to the offchart[]
        exec_script() {
            if (this.calc) this.custom_event('exec-script', {
                grid_id: this.$props.grid_id,
                layer_id: this.$props.id,
                src: this.calc(),
                use_for: this.use_for()
            })
        }
    },
    watch: {
        // Optimized watcher: only trigger on display changes instead of deep watching all settings
        settingsDisplayKey(newKey, oldKey) {
            if (newKey === oldKey) return
            // Call watch_uuid ONLY when the uuid actually changed: passing the
            // fake `{}` prev made EVERY display/z-index toggle look like an
            // identity swap — re-initing pins mid-drag and wiping collisions.
            // The key format is `${$uuid},${display},${z-index},${zIndex}`.
            const prevUuid = oldKey != null ? String(oldKey).split(',')[0] : undefined
            const newUuid = newKey != null ? String(newKey).split(',')[0] : undefined
            if (this.watch_uuid && prevUuid !== newUuid) {
                this.watch_uuid(this.$props.settings, { $uuid: prevUuid })
            }
            this.$emit('show-grid-layer', {
                id: this.$props.id,
                display: 'display' in this.$props.settings ?
                    this.$props.settings['display'] : true,
            })
        }
    },
    computed: {
        sett() {
            return this.$props.settings || {}
        },
        // Computed key for efficient display change detection
        settingsDisplayKey() {
            const s = this.$props.settings || {}
            // Track display property and z-index which affect rendering — and
            // $uuid: when an overlay is deleted, Vue REUSES the surviving
            // sibling's component with the other overlay's settings, and only
            // this watcher triggers watch_uuid (Tool pin re-hydration). Without
            // $uuid here the swap is invisible (same display/z-index) and the
            // survivor keeps the DELETED overlay's pin coordinates — e.g. an
            // OrderBox rendering at the removed box's position.
            return `${s.$uuid},${s.display},${s['z-index']},${s.zIndex}`
        }
    },
    data() { return { uxs_count: 0, last_ux_id: null } },
    render() { return h('span') }
}
