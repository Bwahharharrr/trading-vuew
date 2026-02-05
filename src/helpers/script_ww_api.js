
// Webworker interface

// Compiled webworker (see webpack/ww_plugin.js)
import worker_data from './tmp/ww$$$.json'
import Utils from '../stuff/utils.js'
import lz from 'lz-string'
import { toRaw, isReactive, isRef } from 'vue'
import {} from './script_ww.js' // For webworker-loader to find the ww

// Deep unwrap Vue 3 reactive proxies for postMessage compatibility
function deepToRaw(obj) {
    if (obj === null || typeof obj !== 'object') {
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
        this.onevent = () => {}
        this.start()
    }

    start() {
        if (this.worker) this.worker.terminate()
        // URL.createObjectURL
        window.URL = window.URL || window.webkitURL
        let data = lz.decompressFromBase64(worker_data[0])
        let blob
        try {
            blob = new Blob([data], {type: 'application/javascript'})
        } catch (e) {
            // Backwards-compatibility
            window.BlobBuilder = window.BlobBuilder ||
                window.WebKitBlobBuilder ||
                window.MozBlobBuilder
            blob = new BlobBuilder()
            blob.append(data)
            blob = blob.getBlob()
        }
        this.worker = new Worker(URL.createObjectURL(blob))
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
        this.msg_queue = []
    }

    send(msg, tx_keys) {
        if (this.dc.sett.node_url) {
            return this.send_node(msg, tx_keys)
        }
        // Deep unwrap Vue 3 reactive proxies before postMessage
        // PERFORMANCE: Only deep-copy when message contains reactive objects
        const rawMsg = (isReactive(msg) || isRef(msg)) ? deepToRaw(msg) : msg
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
        if (this.socket && this.socket.readyState) {
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
        let id = Utils.uuid()
        this.send({ type, id, data }, tx_keys)
    }

    // Relay an event from iframe postMessage
    // (for the future)
    async relay(event, just = false) {
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
        if (this.worker) this.worker.terminate()
        if (this.socket) {
            this.socket.close()
            this.socket = null
        }
    }
}

export default WebWork
