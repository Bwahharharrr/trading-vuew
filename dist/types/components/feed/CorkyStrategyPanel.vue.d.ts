declare const _default: typeof __VLS_export;
export default _default;
declare const __VLS_export: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    runtimes: {
        type: ArrayConstructor;
        default: () => never[];
    };
    selectedRuntimeId: {
        type: StringConstructor;
        default: string;
    };
    decisions: {
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
    control: {
        type: ObjectConstructor;
        default: () => {
            available: boolean;
            pending: boolean;
            awaiting: boolean;
            error: null;
        };
    };
}>, {}, {
    TABS: {
        id: string;
        label: string;
    }[];
    activeTab: string;
    selectedTicker: string;
    selectedAuditTicker: string;
    reason: string;
    unlockCurrency: string;
    unlockAmount: string;
    adoptPositionId: string;
    controlValidation: string;
}, {
    nowMs(): number;
    processGroups(): {
        process_kind: any;
        total: any;
        ready: number;
        degraded: number;
        runtimes: any;
    }[];
    activeRuntimeId(): any;
    selectedRuntime(): {} | null;
    selectedTickerId(): string;
    controlEnabled(): boolean;
    controlPending(): boolean;
    controlAwaiting(): boolean;
    summaryDeps(): {
        public: any;
        private: any;
    };
    controlError(): any;
    controlTarget(): {
        runtime_id: any;
        ticker_id: string;
        symbol: any;
        statusInfo: {
            status: string;
            known: boolean;
            style: any;
            attention: boolean;
            position: boolean;
            lockout: boolean;
            durationMs: number | null;
            durationSource: string | null;
            label: string;
            reason: string | null;
            lockoutReason: string | null;
        };
        blocker: {
            blocked: boolean;
            submittedNonterminal: number;
            oldestSubmittedTsMs: number | null;
        };
        actions: ({
            kind: string;
            intent: string;
            label: string;
            reason: boolean;
            danger: boolean;
            allocation?: undefined;
            capital?: undefined;
            position?: undefined;
        } | {
            kind: string;
            intent: string;
            label: string;
            reason: boolean;
            danger?: undefined;
            allocation?: undefined;
            capital?: undefined;
            position?: undefined;
        } | {
            kind: string;
            intent: string;
            label: string;
            reason: boolean;
            allocation: boolean;
            capital: boolean;
            danger?: undefined;
            position?: undefined;
        } | {
            kind: string;
            intent: string;
            label: string;
            reason: boolean;
            position: boolean;
            capital: boolean;
            danger?: undefined;
            allocation?: undefined;
        })[];
        capitalBlocked: boolean;
        lineageRaw: any;
        needsAllocation: boolean;
        needsPosition: boolean;
    } | null;
    readinessInfo(): {
        state: string;
        ready: boolean;
        tone: string;
    };
    rollupInfo(): {
        status: string;
        known: boolean;
        tone: string;
    };
    lineageInfo(): {
        status: string;
        raw: any;
        tone: string;
        running: boolean;
        known: boolean;
    };
    lineageLink(): {
        runId: any;
        runIndex: any;
        rank: any;
    } | null;
    lineageRawLabel(): any;
    lineageReasons(): any[];
    pendingAuthReasons(): any[];
    pendingAllocationReasons(): any[];
    approvalRaw(): any;
    approval(): {
        present: boolean;
        stale: boolean;
        expiresAtMs: any;
        approvedAtMs: any;
        maxOrderNotional: any;
        tradeTimeframe: any;
        contextTimeframes: any;
        symbols: any;
    };
    validationProof(): any;
    orderSplit(): {
        local: {
            queued: number;
        };
        dispatched: {};
        localTotal: number;
        dispatchedTotal: number;
        total: number;
    };
    dispatchedKeys(): string[];
    runtimeBlocker(): {
        blocked: boolean;
        submittedNonterminal: number;
        oldestSubmittedTsMs: number | null;
    };
    walletBalanceGroups(): {
        class: string;
        wallets: any;
    }[];
    totalAuthWallets(): number;
    allocTree(): {
        legacy: boolean;
        wallets: any;
    };
    auditPointers(): {
        k: string;
        v: any;
    }[];
    decisionGroups(): any[];
    auditTickers(): {
        ticker_id: any;
        symbol: any;
        count: any;
    }[];
    activeAuditTicker(): any;
    auditDecisions(): unknown[];
}, {
    openLineage(): void;
    selectRuntime(id: any): void;
    selectTicker(runtimeId: any, tickerId: any): void;
    runControl(action: any): void;
    fmt(v: any): string;
    fmtDur(ms: any): string;
    dash(v: any): any;
    dash0(v: any): any;
    boolText(v: any): "—" | "yes" | "no";
    gateClass(ok: any): "" | "pos" | "neg";
    signClass(dec: any): "" | "pos" | "neg";
    numOr0(v: any): number;
    tickerBadge(info: any): string[];
    blockerTitle(b: any): string;
    walletKey(w: any): string;
    intentsTitle(intents: any): string;
    checksTitle(checks: any): string;
    risksFailed(checks: any): boolean;
    deltasTitle(deltas: any): string;
    claimsTitle(claims: any): string;
    outcomeClass(outcome: any): "" | "neg" | "act";
    shortFp(fp: any): string;
    shortSha(sha: any): string;
    symbolOf(id: any): any;
    _tickerOrdersMap(rt: any): Map<any, any>;
    fmtTime(ms: any): string;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("cancel-ticker-orders" | "resume-ticker" | "unlock-ticker" | "adopt-position" | "pause-ticker" | "select-runtime" | "refresh" | "open-lineage-run")[], "cancel-ticker-orders" | "resume-ticker" | "unlock-ticker" | "adopt-position" | "pause-ticker" | "select-runtime" | "refresh" | "open-lineage-run", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    runtimes: {
        type: ArrayConstructor;
        default: () => never[];
    };
    selectedRuntimeId: {
        type: StringConstructor;
        default: string;
    };
    decisions: {
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
    control: {
        type: ObjectConstructor;
        default: () => {
            available: boolean;
            pending: boolean;
            awaiting: boolean;
            error: null;
        };
    };
}>> & Readonly<{
    "onCancel-ticker-orders"?: ((...args: any[]) => any) | undefined;
    "onResume-ticker"?: ((...args: any[]) => any) | undefined;
    "onUnlock-ticker"?: ((...args: any[]) => any) | undefined;
    "onAdopt-position"?: ((...args: any[]) => any) | undefined;
    "onPause-ticker"?: ((...args: any[]) => any) | undefined;
    "onSelect-runtime"?: ((...args: any[]) => any) | undefined;
    onRefresh?: ((...args: any[]) => any) | undefined;
    "onOpen-lineage-run"?: ((...args: any[]) => any) | undefined;
}>, {
    error: string;
    loading: boolean;
    control: Record<string, any>;
    runtimes: unknown[];
    selectedRuntimeId: string;
    decisions: unknown[];
    streaming: boolean;
    now: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
