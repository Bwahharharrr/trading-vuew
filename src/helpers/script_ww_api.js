
// Webworker interface

// Vite inlines the worker as a self-contained module worker (`?worker&inline`)
// instantiated from a text/javascript Blob (data: URI fallback) — no separate
// worker asset and no build-time compile step. Replaces the old
// webpack/ww_plugin.js dance (HTTP-fetch compiled worker -> lz-compress ->
// tmp/ww$$$.json -> Blob).
import ScriptWorker from './script_ww.js?worker&inline'
import Utils from '../stuff/utils.js'
import { toRaw, isReactive, isRef } from 'vue'

// Deep unwrap Vue 3 reactive proxies for postMessage compatibility
function deepToRaw(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    // Keep structured-clone compatible built-ins untouched
    if (obj instanceof Date || obj instanceof RegExp) {
        return obj
    }

    // Unwrap Vue reactive/ref proxies
    if (isReactive(obj) || isRef(obj)) {
        obj = toRaw(obj)
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepToRaw(item))
    }

    const result = {}
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = deepToRaw(obj[key])
        }
    }
    return result
}

class WebWork {

    constructor(dc) {
        this.dc = dc
        this.tasks = {}
        this.msg_queue = []
        this.onevent = () => {}
        this.start()
    }

    start() {
        const hasWorkerSupport =
            typeof window !== 'undefined' &&
            typeof Worker !== 'undefined'

        // Node/tests fallback: allow DataCube core logic without web workers
        if (!hasWorkerSupport) {
            this.worker = null
            return
        }

        if (this.worker) {
            this.worker.onmessage = null
            this.worker.terminate()
            this.worker = null
        }
        // Vite's `?worker&inline` import yields a Worker subclass that wraps
        // the inlined blob; instantiation manages its own object URL.
        this.worker = new ScriptWorker()
        this.worker.onmessage = e => this.onmessage(e)
    }

    start_socket() {
        if (!this.dc.sett.node_url) return
        this.socket = new WebSocket(this.dc.sett.node_url)
        this.socket.addEventListener('message', e => {
            this.onmessage({data: JSON.parse(e.data)})
        })
        this.socket.addEventListener('error', e => {
            console.warn('WebSocket error:', e)
        })
        this.socket.addEventListener('close', () => {
            this.socket = null
        })
        if (!this.msg_queue) this.msg_queue = []
    }

    send(msg, tx_keys) {
        if (this.dc.sett.node_url) {
            return this.send_node(msg, tx_keys)
        }
        if (!this.worker) return
        // Deep unwrap Vue 3 reactive proxies before postMessage.
        // Always deep-copy: nested reactive arrays (e.g. candle data pushed
        // via dc.update()) are not detectable from the top-level object.
        const rawMsg = deepToRaw(msg)
        if (tx_keys) {
            let tx_objs = tx_keys.map(k => rawMsg.data[k])
            this.worker.postMessage(rawMsg, tx_objs)
        } else {
            this.worker.postMessage(rawMsg)
        }
    }

    // Send to node.js via websocket
    send_node(msg, tx_keys) {
        if (!this.socket) this.start_socket()
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // Send the old messages first
            while(this.msg_queue.length) {
                let m = this.msg_queue.shift()
                this.socket.send(JSON.stringify(m))
            }
            this.socket.send(JSON.stringify(msg))
        } else {
            if (this.msg_queue.length > 100) this.msg_queue.shift()
            this.msg_queue.push(msg)
        }
    }

    onmessage(e) {
        if (e.data.id in this.tasks) {
            this.tasks[e.data.id](e.data.data)
            delete this.tasks[e.data.id]
        } else {
            this.onevent(e)
        }
    }

    // Execute a task
    async exec(type, data, tx_keys) {
        if (!this.dc.sett.node_url && !this.worker) return null
        return new Promise((rs, rj) => {
            let id = Utils.uuid()
            this.send({ type, id, data }, tx_keys)
            let timeout = setTimeout(() => {
                delete this.tasks[id]
                rj(new Error('Worker task timeout'))
            }, 30000)
            this.tasks[id] = res => {
                clearTimeout(timeout)
                rs(res)
            }
        })
    }

    // Execute a task, but just fucking do it,
    // do not wait for the result
    just(type, data, tx_keys) {
        if (!this.dc.sett.node_url && !this.worker) return
        let id = Utils.uuid()
        this.send({ type, id, data }, tx_keys)
    }

    // Relay an event from iframe postMessage
    // (for the future)
    async relay(event, just = false) {
        if (!this.dc.sett.node_url && !this.worker) return null
        return new Promise((rs, rj) => {
            this.send(event, event.tx_keys)
            if (!just) {
                let timeout = setTimeout(() => {
                    delete this.tasks[event.id]
                    rj(new Error('Relay task timeout'))
                }, 30000)
                this.tasks[event.id] = res => {
                    clearTimeout(timeout)
                    rs(res)
                }
            }
        })
    }

    destroy() {
        if (this.worker) {
            this.worker.onmessage = null
            this.worker.terminate()
            this.worker = null
        }
        if (this.socket) {
            this.socket.close()
            this.socket = null
        }
        this.tasks = {}
    }
}

export default WebWork
