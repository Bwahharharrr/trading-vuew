declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<{
    grid_id?: any;
    colors?: any;
    layout?: any;
}, {}, {
    dragging: boolean;
    startY: number;
    startHeights: never[];
}, {
    resizerStyle(): {
        top?: undefined;
        left?: undefined;
        width?: undefined;
    } | {
        top: string;
        left: string;
        width: string;
    };
    lineStyle(): {
        background: any;
    };
}, {
    onMouseDown(e: any): void;
    onMouseMove(e: any): void;
    onMouseUp(): void;
    onDoubleClick(e: any): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
    grid_id?: any;
    colors?: any;
    layout?: any;
}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
