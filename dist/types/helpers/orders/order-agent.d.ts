export class OrderAgent {
    constructor({ transport, dataCube }: {
        transport: any;
        dataCube: any;
    });
    transport: any;
    dc: any;
    _pending: {};
    submit(boxSettings: any): string | null;
    cancel(boxSettings: any): string | null;
    _on_event(e: any): void;
    _maybe_remove_box(uuid: any): void;
    _orders_for(uuid: any): any;
    _touch(): void;
    destroy(): void;
}
