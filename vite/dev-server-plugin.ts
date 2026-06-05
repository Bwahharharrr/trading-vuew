import type { Plugin } from 'vite'
import { createProxyServer } from 'httpxy'
import { readdirSync, existsSync, readFileSync, realpathSync } from 'node:fs'
import { resolve, dirname, sep } from 'node:path'
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
          if (url.length > 10000) {
            res.statusCode = 413
            res.end()
            return
          }
          try {
            const q = new URL(url, 'http://localhost').searchParams.get('argv')
            if (q) console.log(...JSON.parse(q))
          } catch (e: any) {
            console.warn('[debug] malformed payload:', e.message)
          }
          res.end('[OK]')
          return
        }

        if (url.startsWith('/data/')) {
          const file = resolve(DATA_DIR, url.slice('/data/'.length).split('?')[0])
          try {
            const realFile = realpathSync(file)
            const realDataDir = realpathSync(DATA_DIR)
            if (realFile === realDataDir || realFile.startsWith(realDataDir + sep)) {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Cache-Control', 'no-cache')
              res.end(readFileSync(realFile))
              return
            }
          } catch {
            res.statusCode = 404
            res.end()
            return
          }
        }

        next()
      })

      // --- Wildcard live-feed WebSocket proxy (/live-ws/<port>) ---
      // Intercept /live-ws/* upgrades → proxy to ws://127.0.0.1:<port>;
      // delegate every other upgrade (crucially Vite's HMR socket) back to
      // Vite's own listeners.
      //
      // RACE FIX: capture Vite's upgrade listeners LAZILY on 'listening', not
      // synchronously in configureServer. At hook time Vite has not necessarily
      // attached its HMR upgrade listener yet, so an eager capture grabs an
      // EMPTY list and the removeAllListeners() below then silently kills HMR
      // ("[vite] server connection lost. Polling for restart…").
      const wsProxy = createProxyServer({})
      const httpServer = server.httpServer
      // CLI debug output is ON by default (set DEBUG_WS=0 to silence the
      // per-upgrade lines; the startup banner + proxy errors always print).
      const VERBOSE = process.env.DEBUG_WS !== '0'

      const installUpgradeProxy = () => {
        if (!httpServer) return
        const viteUpgradeListeners = httpServer.listeners('upgrade') as Array<
          (...a: unknown[]) => void
        >
        httpServer.removeAllListeners('upgrade')
        console.log(
          `[dev-server] /live-ws WS proxy active — captured ` +
            `${viteUpgradeListeners.length} Vite HMR upgrade listener(s)` +
            (viteUpgradeListeners.length === 0
              ? '  ⚠ NONE captured — HMR delegation is broken (timing). Report this.'
              : '')
        )

        httpServer.on(
          'upgrade',
          (req: IncomingMessage, socket: Socket, head: Buffer) => {
            const url = req.url || ''
            const from = req.socket.remoteAddress || '?'
            const m = url.match(/^\/live-ws\/(\d+)/)
            if (m) {
              const port = m[1]
              const target = `ws://127.0.0.1:${port}`
              // Strip the /live-ws/<port> prefix before forwarding.
              req.url = url.replace(/^\/live-ws\/\d+/, '') || '/'
              if (VERBOSE) {
                console.log(`[live-ws] ⇡ upgrade ${url} (from ${from}) → ${target}${req.url}`)
              }
              socket.on('error', (e: Error) =>
                console.warn(`[live-ws] client socket error → ${target}: ${e.message}`)
              )
              wsProxy
                .ws(req, socket, { target, changeOrigin: true }, head)
                .then(() => { if (VERBOSE) console.log(`[live-ws] ✓ connected upstream ${target}`) })
                .catch((err: Error) => {
                  console.warn(
                    `[live-ws] ✗ proxy error → ${target}: ${err.message}\n` +
                      `           ↳ is something listening on 127.0.0.1:${port}? ` +
                      `(corky gateway / qb-new backend). Try: npm run smoke:gateway`
                  )
                  socket.destroy()
                })
              return
            }
            // Not a live-feed socket: hand back to Vite's HMR upgrade handlers.
            if (VERBOSE) {
              console.log(
                `[live-ws] ↪ delegating non-live upgrade ${url} (from ${from}) to ` +
                  `Vite (${viteUpgradeListeners.length} listener(s))`
              )
            }
            for (const l of viteUpgradeListeners) l(req, socket, head)
          }
        )
      }

      if (httpServer) {
        if (httpServer.listening) installUpgradeProxy()
        else httpServer.once('listening', installUpgradeProxy)
      }
    },
  }
}
