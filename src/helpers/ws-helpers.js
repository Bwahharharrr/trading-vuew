// Pure helpers for the WebSocket live-feed manager.
//
// Extracted from ws-manager.js so they can be unit-tested without a Vue
// instance. The mixin imports and calls these; tests import and call them
// directly.

/**
 * Build the WS URL the FE should connect to, given a chart file's _meta.
 *
 * Returns null when:
 *   - meta is missing entirely (legacy file, no live feed)
 *   - meta.ws.port is 0 / falsy (websocket disabled at backend startup)
 *
 * Two modes:
 *
 *   1. Proxy-via-page (default — meta.ws.host empty):
 *      <ws|wss>://<pageHostname>:<pagePort>/live-ws/<meta.ws.port>
 *      The dev-server's wildcard /live-ws/<port> proxy forwards the WS
 *      upgrade to ws://127.0.0.1:<port>. This is the only mode that
 *      works when the browser reaches the dev box through a single
 *      forwarded port (containers, port-mapped VMs, SSH tunnels).
 *      pagePort '' (default 80/443) is preserved as 'host' alone.
 *
 *   2. Direct (meta.ws.host non-empty):
 *      <ws|wss>://<meta.ws.host>:<meta.ws.port><meta.ws.path>
 *      For deployments where the backend is on a different machine that
 *      is directly reachable, or the operator has explicitly mapped the
 *      backend's port into the same address space as the page.
 *      Set [websocket] public_host in qb-new config to enable this mode.
 *
 * pageProtocol / pageHostname / pagePort are passed in (rather than read
 * from window.location) so the helper is unit-testable in node.
 */
export function buildWsUrl(meta, pageProtocol, pageHostname, pagePort) {
    if (!meta || !meta.ws || !meta.ws.port) return null
    const proto = (pageProtocol === 'https:') ? 'wss:' : 'ws:'

    // Mode 2 — explicit host (operator opt-in for direct WS):
    if (meta.ws.host) {
        const path = meta.ws.path || '/'
        return `${proto}//${meta.ws.host}:${meta.ws.port}${path}`
    }

    // Mode 1 — proxy through the dev-server's port:
    const hostPart = pagePort
        ? `${pageHostname}:${pagePort}`
        : `${pageHostname}`
    return `${proto}//${hostPart}/live-ws/${meta.ws.port}`
}

/**
 * Classify a loaded chart filename so the WS handler knows which color
 * field to use from each incoming candle envelope.
 *
 *   'alert'  → data_alerts.json (legacy) or data_alerts_<exch>_<ticker>[_<tf>][_<id>].json
 *               → colour live candles by msg.alert_color, render zone blocks
 *   'scmr'   → data.json (legacy bootstrap), data_scorers_*.json,
 *               or data_<exch>_<ticker>[_<tf>][_<id>].json (new SCMR live file)
 *               → colour live candles by msg.scmr_color
 *   'none'   → anything else (target_*.json, data_tf.json, unknown) — let
 *               trading-vue draw its default OHLC red/green colouring
 *
 * The order of checks matters: data_alerts_* also starts with `data_`,
 * so the alert branch must be tested first.
 */
export function classifyDataFile(filename) {
    const f = filename || ''
    if (f === 'data_alerts.json' || f.startsWith('data_alerts_')) return 'alert'
    if (f === 'data.json') return 'scmr'  // legacy committed bootstrap
    if (f.startsWith('data_') && f.endsWith('.json')) return 'scmr'
    return 'none'
}


/**
 * Check whether an incoming WS message's identity tuple matches the
 * currently-loaded file's _meta. Used to defend against any cross-talk
 * (a misrouted proxy, a bug in backend dispatch, a future shared broker).
 *
 * Strict on all four identity fields. Empty/null fields normalize to ""
 * so an absent instance_id on either side still matches an absent one on
 * the other.
 *
 * Returns false when meta is missing entirely (no file loaded → drop).
 */
export function msgMatchesMeta(msg, meta) {
    if (!meta) return false
    if (!msg) return false
    const norm = (v) => (v == null ? '' : String(v))
    return (
        norm(msg.exchange)    === norm(meta.exchange) &&
        norm(msg.ticker)      === norm(meta.ticker) &&
        norm(msg.tf)          === norm(meta.tf) &&
        norm(msg.instance_id) === norm(meta.instance_id)
    )
}
