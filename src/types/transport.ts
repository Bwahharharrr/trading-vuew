// Transport seam contract (Phase 3.2). Two interchangeable implementations
// drive the ScriptEngine: WorkerTransport (postMessage, production) and
// SyncTransport (in-process, Node/tests). Runtime lives in
// ../helpers/transport/.

import type { WorkerMessage, WorkerEvent } from './worker-messages'

export interface Transport {
  /** DC -> engine. May resolve asynchronously (some handlers await). */
  send(msg: WorkerMessage | Record<string, unknown>): void | Promise<void>
  /** engine -> DC. `e.data` is the event message. */
  onevent: (e: { data: WorkerEvent | Record<string, unknown> }) => void
  destroy?(): void
}
