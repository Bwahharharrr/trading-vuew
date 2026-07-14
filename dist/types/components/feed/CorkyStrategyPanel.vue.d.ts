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
    operations: {
        type: ObjectConstructor;
        default: () => {};
    };
    overlayVisibility: {
        type: ObjectConstructor;
        default: () => {};
    };
    money: {
        type: ObjectConstructor;
        default: () => {};
    };
    administration: {
        type: ObjectConstructor;
        default: () => {};
    };
    administrationEnabledFlag: {
        type: BooleanConstructor;
        default: boolean;
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
    maximized: {
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
    ACTIVITY_RENDER_BATCH: number;
    activeTab: string | null;
    selectedTicker: string;
    selectedAuditTicker: string;
    activitySource: string;
    activityKind: string;
    activityTicker: string;
    overlayKinds: string[];
    reason: string;
    unlockCurrency: string;
    unlockAmount: string;
    adoptPositionId: string;
    controlValidation: string;
    allocationPolicyJson: string;
    adminActor: string;
    adminIdempotencyKey: string;
    adminReason: string;
    allocationScope: string;
    allocationAccountId: string;
    allocationStrategyInstanceId: string;
    allocationDesiredState: string;
    approvalStatement: string;
    adminValidation: string;
    activityVisibleLimit: number;
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
    selectedNodeTickers(): any;
    selectedTickerId(): string;
    controlEnabled(): boolean;
    controlUnavailableReason(): any;
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
    runtimeSemantics(): {
        health: {
            state: string;
            ready: boolean;
            tone: string;
        };
        mode: {
            raw: string;
            label: string;
        };
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
    automaticAllocation(): any;
    administrationEnabled(): boolean;
    administrationUnavailableReason(): any;
    administrationPending(): any;
    administrationError(): any;
    allocationComparison(): any;
    operationPreview(): any;
    operationResult(): any;
    requiredApprovalStatement(): string;
    previewExpired(): boolean;
    previewRevisionCurrent(): boolean;
    approvalReady(): boolean;
    lineageLink(): {
        runId: any;
        runIndex: any;
        rank: any;
    } | null;
    lineageRawLabel(): any;
    lineageReasons(): any[];
    canonicalParamsDisplay(): string;
    candidateMetricRows(): {
        key: string;
        value: any;
    }[];
    pendingAuthReasons(): any[];
    pendingAllocationReasons(): any[];
    recentDecisionRows(): any[];
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
    tickerOrderRows(): any[];
    staleOrderForensics(): any;
    submittedOrderBlockers(): any[];
    moneyData(): any;
    moneyTotalRows(): {
        key: string;
        label: string;
        value: any;
    }[];
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
    activityBaseRows(): {
        id: string;
        type: string;
        ts_ms: any;
        source: any;
        kind: any;
        ticker_id: any;
        order_id: any;
        reason: any;
        payload: any;
        count: number;
    }[];
    activitySources(): any[];
    activityKinds(): any[];
    activityTickers(): any[];
    filteredActivityRows(): {
        id: string;
        type: string;
        ts_ms: any;
        source: any;
        kind: any;
        ticker_id: any;
        order_id: any;
        reason: any;
        payload: any;
        count: number;
    }[];
    activityRows(): {
        id: string;
        type: string;
        ts_ms: any;
        source: any;
        kind: any;
        ticker_id: any;
        order_id: any;
        reason: any;
        payload: any;
        count: number;
    }[];
    activityHasMore(): boolean;
    lifecycleIntervals(): any;
}, {
    setActiveTab(id: any): void;
    onTaskTabKeydown(event: any, index: any): void;
    overlayEnabled(kind: any): boolean;
    openLineage(): void;
    parseAllocationPolicy(): any;
    compareAllocationPolicy(): void;
    administrationIdentity(): {
        actor: string;
        idempotency_key: string;
        reason: string;
    } | null;
    previewPolicyProposal(proposal: any): void;
    automaticAllocationScope(): {
        scope: string;
        account_id?: undefined;
        strategy_instance_id?: undefined;
    } | {
        scope: string;
        account_id: string;
        strategy_instance_id?: undefined;
    } | {
        scope: string;
        strategy_instance_id: string;
        account_id?: undefined;
    } | null;
    previewAllocationToggle(): void;
    approvePreview(): void;
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
    decisionReason(decision: any): any;
    operationReason(event: any): any;
    prettyPayload(payload: any): string;
    lifecycleKey(interval: any): string;
    lifecycleClass(state: any): "sts-attention" | "sts-muted-grey";
    outcomeClass(outcome: any): "" | "neg" | "act";
    shortFp(fp: any): string;
    shortSha(sha: any): string;
    symbolOf(id: any): any;
    _tickerOrdersMap(rt: any): Map<any, any>;
    fmtTime(ms: any): string;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("cancel-ticker-orders" | "resume-ticker" | "unlock-ticker" | "adopt-position" | "pause-ticker" | "select-runtime" | "refresh" | "load-more-operations" | "toggle-overlay" | "compare-allocation" | "preview-operation" | "approve-operation" | "clear-preview" | "open-lineage-run")[], "cancel-ticker-orders" | "resume-ticker" | "unlock-ticker" | "adopt-position" | "pause-ticker" | "select-runtime" | "refresh" | "load-more-operations" | "toggle-overlay" | "compare-allocation" | "preview-operation" | "approve-operation" | "clear-preview" | "open-lineage-run", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
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
    operations: {
        type: ObjectConstructor;
        default: () => {};
    };
    overlayVisibility: {
        type: ObjectConstructor;
        default: () => {};
    };
    money: {
        type: ObjectConstructor;
        default: () => {};
    };
    administration: {
        type: ObjectConstructor;
        default: () => {};
    };
    administrationEnabledFlag: {
        type: BooleanConstructor;
        default: boolean;
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
    maximized: {
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
    "onLoad-more-operations"?: ((...args: any[]) => any) | undefined;
    "onToggle-overlay"?: ((...args: any[]) => any) | undefined;
    "onCompare-allocation"?: ((...args: any[]) => any) | undefined;
    "onPreview-operation"?: ((...args: any[]) => any) | undefined;
    "onApprove-operation"?: ((...args: any[]) => any) | undefined;
    "onClear-preview"?: ((...args: any[]) => any) | undefined;
    "onOpen-lineage-run"?: ((...args: any[]) => any) | undefined;
}>, {
    error: string;
    loading: boolean;
    money: Record<string, any>;
    streaming: boolean;
    control: Record<string, any>;
    runtimes: unknown[];
    selectedRuntimeId: string;
    decisions: unknown[];
    operations: Record<string, any>;
    overlayVisibility: Record<string, any>;
    administration: Record<string, any>;
    administrationEnabledFlag: boolean;
    maximized: boolean;
    now: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
