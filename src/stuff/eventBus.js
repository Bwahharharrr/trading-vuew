// Event bus replacement for Vue 3 (replaces Vue 2's $on/$off/$once)
import mitt from 'mitt'

const emitter = mitt()

export default emitter
