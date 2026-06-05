export function isRetryable(code: any, wireRetryable: any): any;
export namespace KNOWN_ERROR_CODES {
    namespace unsupported_schema_version {
        let retryable: boolean;
    }
    namespace invalid_request_json {
        let retryable_1: boolean;
        export { retryable_1 as retryable };
    }
    namespace state_not_found {
        let retryable_2: boolean;
        export { retryable_2 as retryable };
    }
    namespace runtime_not_found {
        let retryable_3: boolean;
        export { retryable_3 as retryable };
    }
    namespace invalid_control_command {
        let retryable_4: boolean;
        export { retryable_4 as retryable };
    }
    namespace control_response_timeout {
        let retryable_5: boolean;
        export { retryable_5 as retryable };
    }
    namespace control_receive_error {
        let retryable_6: boolean;
        export { retryable_6 as retryable };
    }
    namespace historical_query_failed {
        let retryable_7: boolean;
        export { retryable_7 as retryable };
    }
}
export class CorkyError extends Error {
    constructor(code: any, message: any, retryable: any);
    code: any;
    retryable: any;
}
export class CorkyClient {
    constructor({ url, socketFactory, backoff }?: {});
    url: any;
    _socketFactory: any;
    _backoffCfg: any;
    _emitter: import("mitt").Emitter<Record<import("mitt").EventType, unknown>>;
    _pending: Map<any, any>;
    _subscribers: Map<any, any>;
    _reqCounter: number;
    _socket: any;
    _closedByUser: boolean;
    _retries: number;
    _reconnectTimer: any;
    connect(): this;
    _open(): void;
    close(): void;
    _handleClose(ev: any): void;
    _scheduleReconnect(): void;
    on(type: any, cb: any): () => void;
    off(type: any, cb: any): void;
    onSubscription(subscription_id: any, cb: any): () => void;
    listCandleStates(venue: any): Promise<any>;
    subscribeCandles(opts?: {}): Promise<any>;
    unsubscribe(subscription_id: any): Promise<any>;
    upsertCandleState(opts?: {}): Promise<any>;
    patchCandleState(opts?: {}): Promise<any>;
    _nextRequestId(): string;
    _request(command: any, meta?: {}): Promise<any>;
    _send(frame: any): void;
    _handleMessage(ev: any): void;
    _route(envelope: any): void;
    _resultFor(type: any, event: any): any;
    _fanOutSubscription(subscription_id: any, payload: any): void;
    _settleResolve(request_id: any, value: any): void;
    _settleReject(request_id: any, err: any): void;
    _failAllPending(err: any): void;
}
export default CorkyClient;
