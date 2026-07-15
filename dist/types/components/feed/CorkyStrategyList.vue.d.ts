declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    runtimes: {
        type: ArrayConstructor;
        default: () => never[];
    };
    loading: {
        type: BooleanConstructor;
        default: boolean;
    };
    error: {
        type: StringConstructor;
        default: null;
    };
    streaming: {
        type: BooleanConstructor;
        default: boolean;
    };
    now: {
        type: NumberConstructor;
        default: number;
    };
}>, {}, {}, {
    rows(): {
        runtime: unknown;
        name: string;
        tickerCount: any;
        semantics: {
            health: {
                tone: string;
                label: string;
                state: string;
                ready: boolean;
            };
            currentStatus: {
                known: boolean;
                tone: string;
                label: string;
                state: string;
                ready: boolean;
                status?: undefined;
            } | {
                state: string;
                status: string;
                ready: boolean;
                known: boolean;
                tone: string;
                label: string;
            };
            mode: any;
            observer: boolean;
            authority: {
                status: string;
                tone: string;
                label: string;
                reason: any;
            };
            freshness: {
                status: string;
                tone: string;
                label: string;
                ageMs: number | null;
            };
            auth: {
                configured: boolean;
                ready: boolean;
                status: string;
                tone: string;
                label: any;
            };
            allocation: {
                configured: boolean;
                ready: boolean;
                status: string;
                tone: string;
                label: any;
            };
            runtimeControl: {
                available: boolean;
                reason: any;
            };
            primaryReason: any;
        };
    }[];
    summary(): string;
}, {
    humanReason(reason: any, mode: any): any;
    statusLabel(status: any): "Status unknown" | "Healthy" | "Needs attention";
    freshness(value: any): any;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("open-runtime" | "refresh")[], "open-runtime" | "refresh", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    runtimes: {
        type: ArrayConstructor;
        default: () => never[];
    };
    loading: {
        type: BooleanConstructor;
        default: boolean;
    };
    error: {
        type: StringConstructor;
        default: null;
    };
    streaming: {
        type: BooleanConstructor;
        default: boolean;
    };
    now: {
        type: NumberConstructor;
        default: number;
    };
}>> & Readonly<{
    "onOpen-runtime"?: ((...args: any[]) => any) | undefined;
    onRefresh?: ((...args: any[]) => any) | undefined;
}>, {
    error: string;
    loading: boolean;
    streaming: boolean;
    runtimes: unknown[];
    now: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
