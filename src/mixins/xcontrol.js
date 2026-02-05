// extensions control
// PERFORMANCE: Uses markRaw to prevent Vue reactivity overhead on controller instances

import { markRaw } from 'vue'

export default {
    mounted() {
        this.ctrllist()
        this.skin_styles()
    },
    methods: {
        // Build / rebuild component list
        ctrllist() {
            this.ctrl_destroy()
            this.controllers = []

            for (let x of this.$props.extensions) {
                let name = x.Main.__name__
                if (!this.xSettings[name]) {
                    this.xSettings[name] = {}
                }
                let nc = new x.Main(
                    this,      // tv inst
                    this.data, // dc
                    this.xSettings[name] // settings
                )
                nc.name = name
                // PERFORMANCE: markRaw prevents Vue from adding reactivity to controller
                // Controllers are complex objects that don't need deep reactivity tracking
                this.controllers.push(markRaw(nc))
            }
            return this.controllers
        },
        // TODO: preventDefault
        pre_dc(e) {
            for (let ctrl of this.controllers) {
                if (ctrl.update) {
                    ctrl.update(e)
                }
            }
        },
        post_dc(e) {
            for (let ctrl of this.controllers) {
                if (ctrl.post_update) {
                    ctrl.post_update(e)
                }
            }
        },
        ctrl_destroy() {
            for (let ctrl of this.controllers) {
                if (ctrl.destroy) ctrl.destroy()
            }
        },
        skin_styles() {
            let id = 'tvjs-skin-styles'
            let stbr = document.getElementById(id)
            if (stbr) {
                let parent = stbr.parentNode
                parent.removeChild(stbr)
            }
            if (this.skin_proto && this.skin_proto.styles) {
                let sheet = document.createElement('style')
                sheet.setAttribute("id", id)
                sheet.textContent = this.skin_proto.styles
                this.$el.appendChild(sheet)
            }
        }
    },
    computed: {
        ws() {
            let ws = {}
            for (let ctrl of this.controllers) {
                if (ctrl.widgets) {
                    for (let id in ctrl.widgets) {
                        ws[id] = ctrl.widgets[id]
                        ws[id].ctrl = ctrl
                    }
                }
            }
            return ws
        },
        skins() {
            let sks = {}
            for (let x of this.$props.extensions) {
                for (let id in x.skins || {}) {
                    sks[id] = x.skins[id]
                }
            }
            return sks
        },
        skin_proto() {
            return this.skins[this.$props.skin]
        },
        colorpack() {
            let sel = this.skins[this.$props.skin]
            return sel ? sel.colors : undefined
        },
        // PERFORMANCE: Hash key for xSettings changes - avoids deep watch
        // Optimized to avoid Object.keys() array allocations
        xSettingsKey() {
            const settings = this.xSettings
            if (!settings) return ''
            // Build key without creating intermediate arrays
            let parts = []
            for (const k in settings) {
                if (Object.prototype.hasOwnProperty.call(settings, k)) {
                    const v = settings[k]
                    // Count nested keys without Object.keys() allocation
                    let count = 0
                    if (v && typeof v === 'object') {
                        for (const _ in v) {
                            if (Object.prototype.hasOwnProperty.call(v, _)) count++
                        }
                        parts.push(`${k}:${count}`)
                    } else {
                        parts.push(`${k}:${v}`)
                    }
                }
            }
            return parts.sort().join('|')
        }
    },
    watch: {
        // TODO: This is fast & dirty fix, need
        // to fix the actual reactivity problem
        skin(n, p) {
            if (n !== p) this.resetChart()
            this.skin_styles()
        },
        extensions() {
            this.ctrllist()
        },
        // PERFORMANCE: Use computed hash key instead of deep watch
        // Deep watching xSettings traverses entire nested object on every change
        xSettingsKey(newKey, oldKey) {
            if (!newKey || newKey === oldKey) return
            for (let ctrl of this.controllers) {
                if (ctrl.onsettings) {
                    ctrl.onsettings(this.xSettings, null)
                }
            }
        }
    },
    data() {
        return {
            controllers: []
        }
    }
}
