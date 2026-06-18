// Corky chart-client-interface v1 fixtures.
//
// Verbatim copies of the canonical examples shipped in the Corky repo at
//   docs/examples/chart-feed/v1/*.json
// re-exported here as parsed JSON so tests can import a single barrel.
//
// JSON imports are resolved natively by Vite/Vitest (see existing usage such
// as test/tests/Simple.vue: `import Data from '../data/data_btc.json'`).

import candleStatesEvent from './candle-states.event.json'
import controlAckEvent from './control-ack.event.json'
import errorEvent from './error.event.json'
import historicalChunkEvent from './historical-chunk.event.json'
import listCandleStatesRequest from './list-candle-states.request.json'
import liveUpdateEvent from './live-update.event.json'
import subscribeLatestRequest from './subscribe-latest.request.json'
import upsertCandleStateRequest from './upsert-candle-state.request.json'

// Auth-position flows (verbatim from the gateway examples, except
// auth-position-audit-error which is hand-authored — the gateway ships no
// auth-specific error example — to pin the `auth_position_audit_unavailable` path).
import listAuthPositionsRequest from './list-auth-positions.request.json'
import authPositionsEvent from './auth-positions.event.json'
import subscribeAuthPositionsRequest from './subscribe-auth-positions.request.json'
import authPositionsUpdateEvent from './auth-positions-update.event.json'
import listAuthPositionHistoryRequest from './list-auth-position-history.request.json'
import authPositionHistoryEvent from './auth-position-history.event.json'
import getAuthPositionAuditRequest from './get-auth-position-audit.request.json'
import authPositionAuditEvent from './auth-position-audit.event.json'
import subscribeAuthPositionAuditRequest from './subscribe-auth-position-audit.request.json'
import authPositionAuditUpdateEvent from './auth-position-audit-update.event.json'
import authPositionAuditErrorEvent from './auth-position-audit-error.event.json'

// Named exports keyed by a JS-friendly camelCase identifier.
export {
  candleStatesEvent,
  controlAckEvent,
  errorEvent,
  historicalChunkEvent,
  listCandleStatesRequest,
  liveUpdateEvent,
  subscribeLatestRequest,
  upsertCandleStateRequest,
  listAuthPositionsRequest,
  authPositionsEvent,
  subscribeAuthPositionsRequest,
  authPositionsUpdateEvent,
  listAuthPositionHistoryRequest,
  authPositionHistoryEvent,
  getAuthPositionAuditRequest,
  authPositionAuditEvent,
  subscribeAuthPositionAuditRequest,
  authPositionAuditUpdateEvent,
  authPositionAuditErrorEvent,
}

// Map keyed by original on-disk filename, for tests that want to iterate the
// whole corpus or look a fixture up by its canonical name.
export const fixturesByFilename = {
  'candle-states.event.json': candleStatesEvent,
  'control-ack.event.json': controlAckEvent,
  'error.event.json': errorEvent,
  'historical-chunk.event.json': historicalChunkEvent,
  'list-candle-states.request.json': listCandleStatesRequest,
  'live-update.event.json': liveUpdateEvent,
  'subscribe-latest.request.json': subscribeLatestRequest,
  'upsert-candle-state.request.json': upsertCandleStateRequest,
  'list-auth-positions.request.json': listAuthPositionsRequest,
  'auth-positions.event.json': authPositionsEvent,
  'subscribe-auth-positions.request.json': subscribeAuthPositionsRequest,
  'auth-positions-update.event.json': authPositionsUpdateEvent,
  'list-auth-position-history.request.json': listAuthPositionHistoryRequest,
  'auth-position-history.event.json': authPositionHistoryEvent,
  'get-auth-position-audit.request.json': getAuthPositionAuditRequest,
  'auth-position-audit.event.json': authPositionAuditEvent,
  'subscribe-auth-position-audit.request.json': subscribeAuthPositionAuditRequest,
  'auth-position-audit-update.event.json': authPositionAuditUpdateEvent,
  'auth-position-audit-error.event.json': authPositionAuditErrorEvent,
}
