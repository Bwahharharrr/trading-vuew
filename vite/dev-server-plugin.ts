import type { Plugin } from 'vite'
import { createProxyServer } from 'httpxy'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage } from 'node:http'
import type { Socket } from 'node:net'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../data')

/**
 * Faithful port of the custom behaviour that lived in webpack/dev.config.js:
 *
 *  1. Wildcard live-feed WS proxy: /live-ws/<port> -> ws://127.0.0.1:<port>.
 *     Each qb-new backend binds an ephemeral port and advertises it in the
 *     chart file's _meta.ws.port; the FE (ws-helpers.buildWsUrl) connects to
 *     the single dev-server port and we forward per-connection. This keeps
 *     multi-instance + container port-forward setups working through one port.
 *  2. GET /data-files  -> picker-loadable chart files in /data.
 *  3. GET /debug?argv= -> relays mobile console output to the terminal.
 *  4. Static /data      -> serves the data directory (read-only).
 *
 * Page full-reload suppression on data/*.json rewrites is handled in
 * vite.config.ts via server.watch.ignored, replacing the old WebSocket
 * message-interception preboot hack (which was webpack-HMR specific).
 */
export function devServerPlugin(): Plugin {
  return {
    name: 'trading-vue-dev-server',
    apply: 'serve',
    configureServer(server) {
      // --- /data-files + /debug + static /data (HTTP middleware) ---
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        if (req.method === 'GET' && url.startsWith('/data-files')) {
          try {
            const files = readdirSync(DATA_DIR)
              .filter(
                (f) =>
                  f.endsWith('.json') &&
                  !f.startsWith('bak') &&
                  !f.startsWith('indicators_') &&
                  f !== 'indicators.json'
              )
              .sort()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(files))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }

        if (req.method === 'GET' && url.startsWith('/debug')) {
          try {
            const q = new URL(url, 'http://localhost').searchParams.get('argv')
            if (q) console.log(...JSON.parse(q))
          } catch {
            /* ignore malformed debug payloads */
          }
          res.end('[OK]')
          return
        }

        if (url.startsWith('/data/')) {
          const file = resolve(DATA_DIR, url.slice('/data/'.length).split('?')[0])
          if (file.startsWith(DATA_DIR) && existsSync(file)) {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(readFileSync(file))
            return
          }
        }

        next()
      })

      // --- Wildcard live-feed WebSocket proxy ---
      // Vite's built-in server.proxy uses node http-proxy which has no
      // per-request `router`, so we attach our own upgrade handler. We must
      // run before Vite's own HMR upgrade handler: only intercept /live-ws/*,
      // let everything else (including Vite HMR) fall through untouched.
      const wsProxy = createProxyServer({})
      const httpServer = server.httpServer
      if (httpServer) {
        // Capture Vite's own upgrade listeners, then take over so we can
        // route /live-ws/* ourselves and delegate the rest back to them.
        const viteUpgradeListeners = httpServer.listeners('upgrade')
        httpServer.removeAllListeners('upgrade')
        httpServer.on(
          'upgrade',
          (req: IncomingMessage, socket: Socket, head: Buffer) => {
            const m = (req.url || '').match(/^\/live-ws\/(\d+)/)
            if (m) {
              const port = m[1]
              // Strip the /live-ws/<port> prefix before forwarding.
              req.url = (req.url || '').replace(/^\/live-ws\/\d+/, '') || '/'
              wsProxy.ws(req, socket, {
                target: `ws://127.0.0.1:${port}`,
                changeOrigin: true,
              }, head).catch((err: Error) => {
                console.warn('[live-ws] proxy error:', err.message)
                socket.destroy()
              })
              return
            }
            // Not a live-feed socket: hand back to Vite's HMR upgrade handlers.
            for (const l of viteUpgradeListeners) {
              ;(l as (...a: any[]) => void)(req, socket, head)
            }
          }
        )
      }
    },
  }
}
