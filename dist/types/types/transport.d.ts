import type { WorkerMessage, WorkerEvent } from './worker-messages';
export interface Transport {
    /** DC -> engine. May resolve asynchronously (some handlers await). */
    send(msg: WorkerMessage | Record<string, unknown>): void | Promise<void>;
    /** engine -> DC. `e.data` is the event message. */
    onevent: (e: {
        data: WorkerEvent | Record<string, unknown>;
    }) => void;
    destroy?(): void;
}
