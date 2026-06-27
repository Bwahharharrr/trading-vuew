declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    run: {
        type: ObjectConstructor;
        default: null;
    };
    artifact: {
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
    chartable: {
        type: BooleanConstructor;
        default: boolean;
    };
    selectedRunIndex: {
        type: NumberConstructor;
        default: null;
    };
}>, {}, {
    expanded: number;
    showRaw: boolean;
    candidateFilters: never[];
    candidateHistory: never[];
    copyToast: {
        show: boolean;
        ok: boolean;
        x: number;
        y: number;
    };
}, {
    studyKey(): any;
    candidateCols(): ({
        key: string;
        label: string;
        fmt: string;
        names: string[];
        title?: undefined;
        sign?: undefined;
    } | {
        key: string;
        label: string;
        fmt: string;
        title: string;
        names: string[];
        sign?: undefined;
    } | {
        key: string;
        label: string;
        fmt: string;
        sign: boolean;
        names: string[];
        title?: undefined;
    })[] | ({
        key: string;
        label: string;
        fmt: string;
        names: string[];
        title?: undefined;
        sign?: undefined;
    } | {
        key: string;
        label: string;
        fmt: string;
        title: string;
        names: string[];
        sign?: undefined;
    } | {
        key: string;
        label: string;
        fmt: string;
        sign: boolean;
        title: string;
        names: string[];
    })[];
    perSymbolCols(): ({
        key: string;
        label: string;
        fmt: string;
        sign: boolean;
        names: string[];
    } | {
        key: string;
        label: string;
        fmt: string;
        names: string[];
        sign?: undefined;
    })[];
    study(): any;
    candidates(): {
        _i: number;
        runIndex: any;
        params: any;
        perSymbol: {
            symbol: any;
        }[];
    }[];
    shownCandidates(): {
        _i: number;
        runIndex: any;
        params: any;
        perSymbol: {
            symbol: any;
        }[];
    }[];
    optMetaRows(): {
        key: string;
        label: string;
        value: string;
    }[];
    rawJson(): string;
}, {
    recencyClass: typeof recencyClass;
    copyRaw(e: any): Promise<void>;
    _fallbackCopy(text: any): boolean;
    _showCopyToast(e: any, ok: any): void;
    filterForCandidateCol(key: any): null;
    applyCandidateFilter(filter: any): void;
    clearCandidateFilter(key: any): void;
    clearAllCandidateFilters(): void;
    onRowClick(cand: any, i: any): void;
    _perSymbol(c: any): {
        symbol: any;
    }[];
    signOf(v: any): "" | "pos" | "neg";
    fmtCell(v: any, col: any): string;
    paramStr(params: any): string;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, "select-candidate"[], "select-candidate", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    run: {
        type: ObjectConstructor;
        default: null;
    };
    artifact: {
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
    chartable: {
        type: BooleanConstructor;
        default: boolean;
    };
    selectedRunIndex: {
        type: NumberConstructor;
        default: null;
    };
}>> & Readonly<{
    "onSelect-candidate"?: ((...args: any[]) => any) | undefined;
}>, {
    error: string;
    loading: boolean;
    run: Record<string, any>;
    artifact: Record<string, any>;
    chartable: boolean;
    selectedRunIndex: number;
}, {}, {
    ColumnFilterButton: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        column: {
            type: ObjectConstructor;
            required: true;
        };
        filter: {
            type: ObjectConstructor;
            default: null;
        };
    }>, {}, {
        open: boolean;
        ops: string[];
        draftOp: string;
        draftValue: string;
    }, {
        canApply(): boolean;
    }, {
        toggle(): void;
        openPop(): void;
        close(): void;
        _onDocDown(e: any): void;
        apply(): void;
        remove(): void;
        fmtVal(v: any): string;
    }, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("clear" | "apply")[], "clear" | "apply", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        column: {
            type: ObjectConstructor;
            required: true;
        };
        filter: {
            type: ObjectConstructor;
            default: null;
        };
    }>> & Readonly<{
        onClear?: ((...args: any[]) => any) | undefined;
        onApply?: ((...args: any[]) => any) | undefined;
    }>, {
        filter: Record<string, any>;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
import { recencyClass } from '../../helpers/recency.js';
