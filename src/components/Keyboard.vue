
<!-- Listens to native keyboard events,
     propagates to all KeyboardListeners -->
<!-- Optimized for Vue 3: uses Map for O(1) operations -->

<script>
import { h } from 'vue'

export default {
    name: 'Keyboard',
    created: function () {
        window.addEventListener('keydown', this.keydown)
        window.addEventListener('keyup', this.keyup)
        window.addEventListener('keypress', this.keypress)
        // Use Map for efficient listener management
        this._listeners = new Map()
    },
    beforeUnmount: function () {
        window.removeEventListener('keydown', this.keydown)
        window.removeEventListener('keyup', this.keyup)
        window.removeEventListener('keypress', this.keypress)
        this._listeners.clear()
    },
    render() { return h('span') },
    methods: {
        keydown (event) {
            for (const [id, l] of this._listeners) {
                if (l && l.keydown) {
                    l.keydown(event)
                }
            }
        },
        keyup (event) {
            for (const [id, l] of this._listeners) {
                if (l && l.keyup) {
                    l.keyup(event)
                }
            }
        },
        keypress (event) {
            for (const [id, l] of this._listeners) {
                if (l && l.keypress) {
                    l.keypress(event)
                }
            }
        },
        register(listener) {
            this._listeners.set(listener.id, listener)
        },
        remove(listener) {
            this._listeners.delete(listener.id)
        },
    }
}

</script>
