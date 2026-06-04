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
export function buildWsUrl(meta: any, pageProtocol: any, pageHostname: any, pagePort: any): string | null;
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
export function classifyDataFile(filename: any): "none" | "alert" | "scmr";
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
export function msgMatchesMeta(msg: any, meta: any): boolean;
