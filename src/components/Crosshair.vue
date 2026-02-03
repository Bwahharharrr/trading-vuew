<script>
import { h } from 'vue'
import Crosshair from './js/crosshair.js'
import Utils from '../stuff/utils.js'

export default {
    name: 'Crosshair',
    props: [ 'cursor', 'colors', 'layout', 'sub' ],
    methods: {
        create() {
            this.ch = new Crosshair(this)

            // New grid overlay-renderer descriptor.
            // Should implement draw() (see Spline.vue)
            this.$emit('new-grid-layer', {
                name: 'crosshair',
                renderer: this.ch
            })
        },
        updateCrosshair() {
            if (!this.ch) this.create()

            const cursor = this.$props.cursor
            const explore = cursor.mode === 'explore'
            const wasVisible = this.ch.visible

            if (!cursor.x || !cursor.y) {
                if (wasVisible) {
                    this.ch.hide()
                    this.$emit('redraw-grid')
                }
                return
            }
            this.ch.visible = !explore
        }
    },
    watch: {
        // Watch specific cursor properties to avoid deep watching
        'cursor.x': function(newX) {
            this.updateCrosshair()
        },
        'cursor.mode': function(newMode) {
            this.updateCrosshair()
        }
    },
    render() { return h('span') }
}
</script>
