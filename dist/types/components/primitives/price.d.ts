export default class Price {
    constructor(comp: any);
    comp: any;
    init_shader(): void;
    shader: boolean | undefined;
    draw(ctx: any): void;
    last_bar(): {
        y: any;
        price: any;
        color: any;
    } | undefined;
    last_price(): any;
    green(): any;
    red(): any;
}
