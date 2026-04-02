<script>
// The bottom bar (yep, that thing with a bunch of dates)
// Optimized for Vue 3: targeted watchers

import { h, nextTick } from 'vue'
import Botbar from './js/botbar.js'
import Canvas from '../mixins/canvas.js'

export default {
    name: 'Botbar',
    props: [
        'sub', 'layout', 'range', 'interval', 'cursor', 'colors', 'font',
        'width', 'height', 'rerender', 'tv_id', 'config', 'shaders',
        'timezone'
    ],
    mixins: [Canvas],
    mounted() {
        const el = this.$refs['canvas']
        if (!el) {
            // Canvas not created yet (render returned loading state)
            return
        }
        const dynEl = this.$refs['canvasDynamic']
        this.renderer = new Botbar(el, this, dynEl)
        this.setup()
        this.redraw()
    },
    data() {
        return {
            // Override layout for resize operations (bypassing Vue reactivity)
            layoutOverride: null,
            // Reactive key for triggering re-renders (replaces $forceUpdate)
            renderKey: 0
        }
    },
    beforeUnmount() {
        if (this.renderer) this.renderer.destroy()
    },
    render() {
        const sett = this.$props.layout?.botbar
        // Guard against missing layout during initialization
        if (!sett) {
            return h('div', { class: 'trading-vue-botbar-loading' })
        }
        return this.create_canvas(h, 'botbar', {
            position: {
                x: 0,
                y: sett.offset || 0
            },
            attrs: {
                rerender: this.$props.rerender,
                width: sett.width,
                height: sett.height,
            },
            style: {
                backgroundColor: this.$props.colors?.back
            },
        })
    },
    computed: {
        bot_shaders() {
            return (this.$props.shaders || [])
                .filter(x => x.target === 'botbar')
        },
        // Computed hash keys for efficient change detection (replaces deep watchers)
        rangeKey() {
            const r = this.$props.range
            if (!r || r.length < 2) return ''
            return `${r[0]},${r[1]}`
        },
        layoutKey() {
            const botbar = this.$props.layout?.botbar
            if (!botbar) return ''
            return `${botbar.width},${botbar.height},${botbar.offset}`
        }
    },
    watch: {
        // Initialize renderer when layout becomes available (deferred init)
        layoutKey: {
            handler(newKey, oldKey) {
                const botbar = this.$props.layout?.botbar
                if (!this.renderer && botbar) {
                    // Wait for Vue to re-render with canvas element
                    nextTick(() => {
                        if (this.renderer) return  // Already initialized
                        const el = this.$refs['canvas']
                        if (!el) return  // Canvas still not ready
                        const dynEl = this.$refs['canvasDynamic']
                        this.renderer = new Botbar(el, this, dynEl)
                        this.setup()
                        this.redraw()
                    })
                }
            },
            immediate: false
        },
        // Watch range using computed hash key
        rangeKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            this.redraw()
        },
        // Watch cursor t (time) changes only - botbar shows time
        'cursor.t': function(newT) {
            if (this._cursorRafPending) return
            this._cursorRafPending = true
            requestAnimationFrame(() => {
                this._cursorRafPending = false
                this.redraw()
            })
        },
        rerender() {
            nextTick(() => this.redraw())
        },
        renderKey() {
            nextTick(() => this.redraw())
        }
    }
}

</script>
<style>
.trading-vue-botbar {
    position: relative !important;
}
</style>
