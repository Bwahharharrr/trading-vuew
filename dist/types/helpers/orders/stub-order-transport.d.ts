export class StubOrderTransport {
    constructor(opts?: {});
    onevent: () => void;
    outcome: any;
    send(msg: any): void;
    destroy(): void;
}
