// Chart cursor and keyboard input handling

import Utils from '../../stuff/utils.js'

export default {
    methods: {
        cursor_changed(e) {
            if (e.mode) this.cursor.mode = e.mode
            if (this.cursor.mode !== 'explore' && this.updater) {
                this.updater.sync(e)
            }
            if (this._hook_xchanged) this.ce('?x-changed', e)
        },

        cursor_locked(state) {
            if (this.cursor.scroll_lock && state) return
            this.cursor.locked = state
            if (this._hook_xlocked) this.ce('?x-locked', state)
        },

        register_kb(event) {
            // A grid's KeyboardListener registers during the initial child mount,
            // BEFORE this Chart's `keyboard` ref is populated — bailing here would
            // silently drop it and NO overlay would ever receive keydown (Delete /
            // tool shortcuts dead). Defer to nextTick when the ref isn't ready yet.
            if (this.$refs.keyboard) {
                this.$refs.keyboard.register(event)
                return
            }
            this.$nextTick(() => {
                if (this.$refs.keyboard) this.$refs.keyboard.register(event)
            })
        },

        remove_kb(event) {
            if (!this.$refs.keyboard) return
            this.$refs.keyboard.remove(event)
        }
    },

    data() {
        return {
            cursor: {
                x: null,
                // Raw pointer x (pixel-smooth). `x` is SNAPPED to the nearest
                // candle (drives the botbar time + value look-ups); `xr` follows
                // the pointer exactly so the vertical crosshair line + its botbar
                // label box track smoothly instead of stepping candle-to-candle.
                xr: null,
                y: null,
                t: null,
                y$: null,
                grid_id: null,
                locked: false,
                values: {},
                scroll_lock: false,
                mode: Utils.xmode()
            }
        }
    }
}
