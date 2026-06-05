// Chart event dispatch and extension hooks

export default {
    methods: {
        emit_custom_event(d) {
            this.on_shader_event(d, 'botbar')
            this.$emit('custom-event', d)

            if (d.event === 'remove-layer-meta') {
                this.remove_meta_props(...d.args)
            }
            if (d.event === 'grid-dblclick') {
                this.on_toggle_minimize(d.args[0])
            }
            if (d.event === 'minimize-all-offcharts') {
                this.minimize_all_offcharts()
            }
            if (d.event === 'open-indicator-settings') {
                this.$emit('open-indicator-settings', d.args[0])
            }
        },

        layer_meta_props(d) {
            if (!(d.grid_id in this.layers_meta)) {
                this.layers_meta[d.grid_id] = {}
            }
            this.layers_meta[d.grid_id][d.layer_id] = d
            this.update_layout()
        },

        remove_meta_props(grid_id, layer_id) {
            if (grid_id in this.layers_meta) {
                // Vue 3: use delete operator instead of this.$delete
                delete this.layers_meta[grid_id][layer_id]
            }
        },

        legend_button_click(event) {
            // Volume legend row actions are handled in-chart (additive — they
            // mutate the reactive decubed data + re-layout). Everything else
            // bubbles up unchanged.
            if (event && event.overlay === 'Volume') {
                if (event.button === 'volume-detach') {
                    this.toggleVolumeDetach()
                    return
                }
                if (event.button === 'display') {
                    // Eye toggle: flip showVolume on the candle pane.
                    this.setVolumeShown(!this.volumeShown)
                    return
                }
            }
            this.$emit('legend-button-click', event)
        },

        // Hook events for extensions
        ce(event, ...args) {
            this.emit_custom_event({ event, args })
        },

        // Set hooks list (called from an extension)
        hooks(...list) {
            list.forEach(x => this[`_hook_${x}`] = true)
        }
    },

    data() {
        return {
            layers_meta: {}
        }
    }
}
