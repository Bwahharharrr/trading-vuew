
<!-- Waits for an event from Keyboard.vue
     and converts it to a Vue.js event -->

<script>
import { h } from 'vue'

let uid_counter = 0

export default {
    name: 'KeyboardListener',
    render() { return h('span') },
    created: function () {
        this._id = 'kb_' + (uid_counter++)
        this.$emit('register-kb-listener', {
            id: this._id,
            keydown: this.keydown,
            keyup: this.keyup,
            keypress: this.keypress
        })
    },
    beforeUnmount: function () {
        this.$emit('remove-kb-listener', {
            id: this._id
        })
    },
    methods: {
        keydown (event) {
            this.$emit('keydown', event)
        },
        keyup (event) {
            this.$emit('keyup', event)
        },
        keypress (event) {
            this.$emit('keypress', event)
        },
    }
}

</script>
