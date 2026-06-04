export default WebWork;
declare class WebWork {
    constructor(dc: any);
    dc: any;
    tasks: {};
    msg_queue: any[];
    onevent: () => void;
    start(): void;
    worker: Worker | null | undefined;
    start_socket(): void;
    socket: WebSocket | null | undefined;
    send(msg: any, tx_keys: any): void;
    send_node(msg: any, tx_keys: any): void;
    onmessage(e: any): void;
    exec(type: any, data: any, tx_keys: any): Promise<any>;
    just(type: any, data: any, tx_keys: any): void;
    relay(event: any, just?: boolean): Promise<any>;
    destroy(): void;
}
