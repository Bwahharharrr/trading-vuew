declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    colors?: any;
    config?: any;
    ux?: any;
    updater?: any;
}, {}, {
    x: number;
    y: number;
    w: number;
    h: number;
    visible: boolean;
}, {
    uxr(): any;
    layout(): any;
    settings(): any;
    uuid(): string;
    mouse(): any;
    style(): {
        display: string | undefined;
        left: string;
        top: string;
        'pointer-events': any;
        'z-index': any;
    };
    pin_style(): {
        left: string;
        top: string;
        'background-color': any;
    };
    btn_style(): {
        background: string;
        color: string;
    };
    pin_pos(): any;
    ox(): number | undefined;
    oy(): number | undefined;
    z_index(): any;
    background(): any;
    inactive_btn_color(): any;
    wrapper(): {
        x: number;
        y: number;
        pin_x: number;
        pin_y: number;
    };
}, {
    update_position(): void;
    parse_coord(str: any, scale: any): any;
    mousemove(): void;
    mouseout(): void;
    on_custom_event(event: any): void;
    close(): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    colors?: any;
    config?: any;
    ux?: any;
    updater?: any;
}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
