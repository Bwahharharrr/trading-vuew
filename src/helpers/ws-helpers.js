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
 * Otherwise constructs:
 *   <ws|wss>://<host>:<port><path>
 * where:
 *   - protocol is 'wss:' iff pageProtocol is 'https:'
 *   - host is meta.ws.host if non-empty, else pageHostname
 *   - path defaults to '/'
 *
 * pageProtocol / pageHostname are passed in (rather than read from
 * window.location) so the helper is unit-testable in node.
 */
export function buildWsUrl(meta, pageProtocol, pageHostname) {
    if (!meta || !meta.ws || !meta.ws.port) return null
    const proto = (pageProtocol === 'https:') ? 'wss:' : 'ws:'
    const host = meta.ws.host || pageHostname
    const port = meta.ws.port
    const path = meta.ws.path || '/'
    return `${proto}//${host}:${port}${path}`
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
