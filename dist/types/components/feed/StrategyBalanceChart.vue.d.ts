declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    history: {
        type: ObjectConstructor;
        default: null;
    };
    loading: {
        type: BooleanConstructor;
        default: boolean;
    };
    error: {
        type: StringConstructor;
        default: null;
    };
    strategyName: {
        type: StringConstructor;
        default: string;
    };
    timeframe: {
        type: StringConstructor;
        default: string;
    };
    width: {
        type: NumberConstructor;
        required: true;
    };
    height: {
        type: NumberConstructor;
        required: true;
    };
    logScale: {
        type: BooleanConstructor;
        default: boolean;
    };
}>, {}, {
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}, {
    points(): any;
    pointCount(): any;
    startingBalance(): any;
    latest(): any;
    partialCount(): any;
    domain(): {
        minimum: number;
        maximum: number;
        useLog: boolean;
        project: (value: any) => any;
    };
    minTime(): any;
    maxTime(): any;
    bookedSegments(): {
        tone: string;
        points: {
            timestamp: any;
            value: any;
        }[];
    }[];
    equitySegments(): {
        tone: string;
        points: {
            timestamp: any;
            value: any;
        }[];
    }[];
    yTicks(): {
        value: number;
        y: number;
    }[];
    xTicks(): {
        value: any;
        x: number;
    }[];
}, {
    resetView(): void;
    x(timestamp: any): number;
    y(value: any): number;
    svgPoints(points: any): any;
    valueTone(value: any): "loss" | "profit";
    money(value: any): string;
    timeLabel(timestamp: any): string;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    history: {
        type: ObjectConstructor;
        default: null;
    };
    loading: {
        type: BooleanConstructor;
        default: boolean;
    };
    error: {
        type: StringConstructor;
        default: null;
    };
    strategyName: {
        type: StringConstructor;
        default: string;
    };
    timeframe: {
        type: StringConstructor;
        default: string;
    };
    width: {
        type: NumberConstructor;
        required: true;
    };
    height: {
        type: NumberConstructor;
        required: true;
    };
    logScale: {
        type: BooleanConstructor;
        default: boolean;
    };
}>> & Readonly<{}>, {
    error: string;
    loading: boolean;
    timeframe: string;
    strategyName: string;
    history: Record<string, any>;
    logScale: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
