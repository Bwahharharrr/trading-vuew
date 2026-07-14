<template>
<div class="sr">
    <!-- Drilldown view tabs (Summary / Balances / Decision Audit) for the SELECTED
         runtime. App owns the feed/subscription; this only renders + emits intents. -->
    <div class="sr-tabs" role="tablist" aria-label="Strategy views">
        <button v-for="t in TABS" :key="t.id" class="sr-tab" :class="{ active: activeTab === t.id }"
                role="tab" :aria-selected="activeTab === t.id" @click="activeTab = t.id">{{ t.label }}</button>
        <span class="sr-spacer"></span>
        <span v-if="streaming" class="sr-live" title="Live runtime subscription (full-replacement updates)">● live</span>
        <button class="sr-icon" title="Refresh runtimes" @click="$emit('refresh')">⟳</button>
    </div>

    <!-- Nothing loaded → ONE centered state (vertically + horizontally). A downed
         socket therefore shows a single message instead of the redundant error +
         "No strategy runtimes available." + "No strategy runtime loaded." stack.
         Priority: loading → error (e.g. socket down) → empty. -->
    <div v-if="!runtimes.length" class="sr-empty">
        <div class="sr-empty-inner" :class="{ error: !loading && !!error }">
            <template v-if="loading">Loading runtimes…</template>
            <template v-else-if="error">{{ error }}</template>
            <template v-else>No strategy runtimes available.</template>
        </div>
    </div>

    <!-- Runtimes loaded → the full hierarchy / controls / drilldown. -->
    <template v-else>
    <!-- A transient error while runtimes ARE loaded still shows the top banner. -->
    <div v-if="error" class="sr-error">{{ error }}</div>

    <!-- Persistent selected-runtime truth surface. Health, execution mode,
         mutation authority, and freshness are deliberately separate axes. -->
    <div v-if="selectedRuntime" class="sr-status-banner" :class="'health-' + runtimeSemantics.health.tone">
        <span class="rt-badge" :class="'tone-' + runtimeSemantics.health.tone">{{ runtimeSemantics.health.state }}</span>
        <span class="sr-status-mode">{{ runtimeSemantics.mode.label }}</span>
        <span class="sr-status-authority" :class="'tone-' + runtimeSemantics.authority.tone">{{ runtimeSemantics.authority.label }}</span>
        <span class="sr-status-fresh" :class="'tone-' + runtimeSemantics.freshness.tone">
            {{ runtimeSemantics.freshness.label }}
            <template v-if="runtimeSemantics.freshness.ageMs != null">· {{ fmtDur(runtimeSemantics.freshness.ageMs) }} ago</template>
        </span>
        <span v-if="runtimeSemantics.primaryReason" class="sr-status-reason" :title="runtimeSemantics.primaryReason">
            {{ runtimeSemantics.primaryReason }}
        </span>
    </div>

    <!-- ═══ HIERARCHY ═══ process group → runtime rows (selectable, open the
         drilldown) → child TICKER rows (status + reason) + DEPENDENCY rows. -->
    <div class="sr-hier" role="tree" aria-label="Strategy runtime hierarchy">
        <div v-for="pg in processGroups" :key="pg.process_kind" class="sr-proc" role="group">
            <div class="sr-proc-head">
                <span class="sr-proc-kind">{{ pg.process_kind }}</span>
                <span class="sr-proc-stat">runtimes={{ pg.total }} ready={{ pg.ready }} degraded={{ pg.degraded }}</span>
            </div>
            <div v-for="node in pg.runtimes" :key="node.rt.runtime_id" class="sr-rt-node">
                <button class="sr-rt" :class="{ active: node.rt.runtime_id === activeRuntimeId }"
                        role="treeitem" :aria-selected="node.rt.runtime_id === activeRuntimeId"
                        @click="selectRuntime(node.rt.runtime_id)">
                    <span class="sr-rt-id">{{ node.rt.runtime_id }}</span>
                    <span class="sr-mode" :class="'mode-' + node.rt.mode">{{ node.rt.mode }}</span>
                    <span class="sr-rt-strategy">{{ dash(node.rt.strategy_id || node.rt.strategy) }}</span>
                    <span class="sr-rt-inst" :title="node.rt.strategy_instance_id">{{ dash(node.rt.strategy_instance_id) }}</span>
                    <span class="sr-spacer"></span>
                    <span class="rt-badge" :class="'tone-' + node.readiness.tone">{{ node.readiness.state }}</span>
                    <span class="lin-badge" :class="'lin-' + node.lineage.tone"
                          :title="'lineage ' + node.lineageRaw + (node.lineage.running ? ' — running' : ' — not presented as running')">
                        {{ node.lineageRaw }}
                    </span>
                </button>

                <div class="sr-rt-children">
                    <!-- TICKER child rows: symbol + status + reason (+ submitted-order blocker). -->
                    <div v-if="node.tickers.length" class="sr-child-grp">
                        <button v-for="tk in node.tickers" :key="tk.ticker_id"
                                class="sr-ticker" :class="{ active: tk.ticker_id === selectedTickerId && node.rt.runtime_id === activeRuntimeId }"
                                role="treeitem" :title="tk.ticker_id"
                                @click="selectTicker(node.rt.runtime_id, tk.ticker_id)">
                            <span class="sr-tk-sym">{{ tk.symbol }}</span>
                            <span class="st-badge" :class="tickerBadge(tk.status)">{{ tk.status.status }}</span>
                            <span v-if="tk.status.durationMs != null" class="sr-tk-dur">for {{ fmtDur(tk.status.durationMs) }}</span>
                            <span v-if="tk.status.reason" class="sr-tk-reason">{{ tk.status.reason }}</span>
                            <span v-if="tk.lastDecision" class="sr-tk-decision" :title="tk.lastDecision">decision: {{ tk.lastDecision }}</span>
                            <span v-if="tk.blocker.blocked" class="sr-blocker" :title="blockerTitle(tk.blocker)">⚠ submitted order</span>
                        </button>
                    </div>
                    <!-- DEPENDENCY child rows: public / private runtime. -->
                    <div v-if="node.deps.length" class="sr-child-grp sr-deps">
                        <span class="sr-deps-label">depends on</span>
                        <div v-for="dep in node.deps" :key="dep.kind + ':' + dep.runtime_id" class="sr-dep">
                            <span class="sr-dep-kind">{{ dash(dep.kind) }} runtime</span>
                            <span class="sr-dep-id" :class="{ unknown: !dep.runtime_id }">{{ dep.runtime_id || 'unknown' }}</span>
                            <span v-if="dep.legacy" class="sr-legacy-tag" title="inferred from target_public/private_runtime_id (older payload)">inferred</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ═══ CONTROLS ═══ per-ticker DIRECT CONTROL for the SELECTED ticker
         (pause / resume / unlock / adopt / cancel submitted orders). RENDERED ONLY
         when a control session is available (control.available) — a session-less or
         control-incapable runtime exposes NOTHING here. Each action requires a
         visible operator reason; unlock/adopt add allocation/position inputs. On
         click the panel EMITS an intent and never mutates local state — App awaits
         the subscription full-replacement to reconcile. -->
    <div v-if="controlEnabled && controlTarget" class="sr-controls" role="group" aria-label="Ticker controls">
        <div class="sr-controls-head">
            <span class="sr-ctl-title">Controls</span>
            <span class="sr-ctl-sym sym">{{ controlTarget.symbol }}</span>
            <span class="st-badge" :class="tickerBadge(controlTarget.statusInfo)">{{ controlTarget.statusInfo.status }}</span>
            <span v-if="controlTarget.blocker.blocked" class="sr-blocker" :title="blockerTitle(controlTarget.blocker)">⚠ {{ controlTarget.blocker.submittedNonterminal }} submitted</span>
            <span class="sr-spacer"></span>
            <span v-if="controlPending" class="sr-ctl-state pending">sending…</span>
            <span v-else-if="controlAwaiting" class="sr-ctl-state awaiting"
                  title="Control acknowledged — awaiting the runtime / auth reconciliation update">awaiting reconciliation…</span>
        </div>
        <div v-if="controlTarget.capitalBlocked" class="sr-ctl-msg lineage-blocked"
             :title="'lineage ' + controlTarget.lineageRaw + ' — not verified running'">
            ⚠ lineage {{ controlTarget.lineageRaw }} — capital controls (unlock/adopt) withheld; halt controls only.
        </div>
        <div v-if="!controlTarget.actions.length" class="sr-msg sr-msg-sm">No controls available for this status.</div>
        <template v-else>
            <div class="sr-ctl-inputs">
                <label class="sr-k" for="sr-ctl-reason">reason</label>
                <input id="sr-ctl-reason" v-model="reason" class="sr-ctl-input sr-ctl-reason" type="text"
                       placeholder="visible operator reason (required)" />
                <template v-if="controlTarget.needsAllocation">
                    <input v-model="unlockCurrency" class="sr-ctl-input sr-ctl-cur" type="text" placeholder="currency" />
                    <input v-model="unlockAmount" class="sr-ctl-input sr-ctl-amt" type="text" placeholder="amount (decimal)" />
                </template>
                <input v-if="controlTarget.needsPosition" v-model="adoptPositionId" class="sr-ctl-input sr-ctl-pos"
                       type="text" placeholder="position_id" />
            </div>
            <div class="sr-ctl-actions">
                <button v-for="a in controlTarget.actions" :key="a.kind"
                        class="sr-ctl-btn" :class="{ danger: a.danger }" :disabled="controlPending"
                        @click="runControl(a)">{{ a.label }}</button>
            </div>
            <div v-if="controlValidation" class="sr-ctl-msg validation">{{ controlValidation }}</div>
            <div v-if="controlError" class="sr-ctl-msg error">{{ controlError }}</div>
        </template>
    </div>
    <!-- Control surface OFF (no session) but a ticker is selected: make the gap
         explicit rather than silently dropping the affordance. -->
    <div v-else-if="selectedTickerId" class="sr-controls sr-controls-off">
        <span class="sr-ctl-title">Controls</span>
        <span class="sr-ctl-unavailable" :title="controlUnavailableReason">unavailable — {{ controlUnavailableReason }}</span>
    </div>

    <!-- ═══ DRILLDOWN ═══ (selected runtime) -->
    <div v-if="!selectedRuntime" class="sr-body">
        <div v-if="!loading" class="sr-msg">No strategy runtime loaded.</div>
    </div>

    <!-- ─── SUMMARY ─── identity + lineage + approval + auth + allocation + orders + provenance -->
    <div v-else-if="activeTab === 'summary'" class="sr-body">
        <section class="sr-sec">
            <div class="sr-sec-head">
                Runtime <span class="sr-rt-name">{{ selectedRuntime.runtime_id }}</span>
                <span class="rt-badge" :class="'tone-' + readinessInfo.tone">{{ readinessInfo.state }}</span>
                <span class="sr-mode" :class="'mode-' + selectedRuntime.mode">{{ selectedRuntime.mode }}</span>
                <span v-if="selectedRuntime.allocation_strategy_status" class="st-badge"
                      :class="'tone-' + rollupInfo.tone">{{ selectedRuntime.allocation_strategy_status }}</span>
                <span class="lin-badge" :class="'lin-' + lineageInfo.tone">{{ lineageRawLabel }}</span>
            </div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">strategy</span><span class="sr-v">{{ dash(selectedRuntime.strategy_id || selectedRuntime.strategy) }}</span></div>
                <div class="sr-field"><span class="sr-k">instance</span><span class="sr-v" :title="selectedRuntime.strategy_instance_id">{{ dash(selectedRuntime.strategy_instance_id) }}</span></div>
                <div class="sr-field"><span class="sr-k">public runtime</span><span class="sr-v">{{ dash(summaryDeps.public) }}</span></div>
                <div class="sr-field"><span class="sr-k">private runtime</span><span class="sr-v">{{ dash(summaryDeps.private) }}</span></div>
                <div class="sr-field">
                    <span class="sr-k">features</span>
                    <span class="sr-v" :class="gateClass(selectedRuntime.features_ready === selectedRuntime.feature_requirements)">
                        {{ dash(selectedRuntime.features_ready) }} / {{ dash(selectedRuntime.feature_requirements) }} ready
                    </span>
                </div>
                <div class="sr-field"><span class="sr-k">Auth dependency</span><span class="sr-v" :class="'tone-' + runtimeSemantics.auth.tone">{{ runtimeSemantics.auth.label }}</span></div>
                <div class="sr-field"><span class="sr-k">allocation authority</span><span class="sr-v" :class="'tone-' + runtimeSemantics.allocation.tone">{{ runtimeSemantics.allocation.label }}</span></div>
                <div class="sr-field"><span class="sr-k">last decision</span><span class="sr-v time">{{ fmtTime(selectedRuntime.last_decision_ms) }}</span></div>
                <div class="sr-field"><span class="sr-k">ledger / fills</span><span class="sr-v">{{ dash(selectedRuntime.ledger_events) }} / {{ dash(selectedRuntime.fills) }}</span></div>
            </div>

            <div v-if="selectedRuntime.last_error" class="sr-lasterr">
                <span class="sr-k">last error</span> {{ selectedRuntime.last_error }}
            </div>
        </section>

        <section class="sr-sec">
            <div class="sr-sec-head">Current activity <span class="sr-dim">recent runtime evidence</span></div>
            <div v-if="!recentDecisionRows.length" class="sr-msg sr-msg-sm">No recent decision evidence published.</div>
            <div v-for="d in recentDecisionRows" :key="d.decision_id || (d.decision_ts_ms + ':' + d.ticker_id)" class="sr-recent-decision">
                <span class="time">{{ fmtTime(d.decision_ts_ms) }}</span>
                <span class="sym">{{ d.symbol || symbolOf(d.ticker_id) }}</span>
                <span class="sr-outcome" :class="outcomeClass(d.outcome)">{{ dash(d.outcome) }}</span>
                <span class="sr-decision-reason">{{ decisionReason(d) }}</span>
            </div>
        </section>

        <!-- LINEAGE — verified may present as running; mismatch/unknown must NOT. -->
        <section class="sr-sec">
            <div class="sr-sec-head">Lineage
                <span class="lin-badge" :class="'lin-' + lineageInfo.tone">{{ lineageRawLabel }}</span>
                <span v-if="lineageInfo.running" class="sr-run-tag">running</span>
                <span v-else class="sr-norun-tag" title="lineage not verified — not presented as currently running">not verified</span>
                <span class="sr-spacer"></span>
                <!-- Verified lineage → jump to the exact universe backtest run + candidate. -->
                <button v-if="lineageLink" class="sr-lin-open"
                        :title="'Open backtest run ' + lineageLink.runId + (lineageLink.runIndex != null ? ' · candidate #' + lineageLink.runIndex : '') + ' in the Backtests dock'"
                        @click="openLineage">↗ Open backtest candidate</button>
            </div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">run id</span>
                    <button v-if="lineageLink" class="sr-lin-link sr-v" @click="openLineage"
                            :title="'Open ' + lineageLink.runId + ' in the Backtests dock'">{{ selectedRuntime.universe_backtest_run_id }} ↗</button>
                    <span v-else class="sr-v">{{ dash(selectedRuntime.universe_backtest_run_id) }}</span>
                </div>
                <div class="sr-field"><span class="sr-k">candidate rank</span><span class="sr-v">{{ dash(selectedRuntime.candidate_rank) }}</span></div>
                <div class="sr-field"><span class="sr-k">candidate run index</span>
                    <button v-if="lineageLink && lineageLink.runIndex != null" class="sr-lin-link sr-v" @click="openLineage"
                            title="Open this candidate in the Backtests dock">{{ selectedRuntime.candidate_run_index }} ↗</button>
                    <span v-else class="sr-v">{{ dash(selectedRuntime.candidate_run_index) }}</span>
                </div>
                <div class="sr-field"><span class="sr-k">params hash</span><span class="sr-v mono" :title="selectedRuntime.strategy_params_sha256">{{ shortSha(selectedRuntime.strategy_params_sha256) }}</span></div>
                <div class="sr-field"><span class="sr-k">candidate params</span><span class="sr-v mono" :title="selectedRuntime.candidate_params_sha256">{{ shortSha(selectedRuntime.candidate_params_sha256) }}</span></div>
                <div class="sr-field"><span class="sr-k">trade tf</span><span class="sr-v">{{ dash(selectedRuntime.trade_timeframe) }}</span></div>
                <div class="sr-field"><span class="sr-k">context tf</span><span class="sr-v">{{ (selectedRuntime.context_timeframes || []).join(', ') || '—' }}</span></div>
                <div class="sr-field"><span class="sr-k">config sha</span><span class="sr-v mono" :title="selectedRuntime.strategy_config_sha256">{{ shortSha(selectedRuntime.strategy_config_sha256) }}</span></div>
            </div>
            <div v-if="lineageReasons.length" class="sr-lin-reasons">
                <div v-for="(r, i) in lineageReasons" :key="i" class="sr-lin-reason">{{ r }}</div>
            </div>
            <div v-if="selectedRuntime.strategy_config_path" class="sr-prov" :title="selectedRuntime.strategy_config_path">
                <span class="sr-k">config</span> <span class="mono">{{ selectedRuntime.strategy_config_path }}</span>
            </div>
        </section>

        <!-- APPROVAL — expiry + max notional + STALE flag (expired ⇒ not mutation-ready). -->
        <section v-if="approval.present" class="sr-sec">
            <div class="sr-sec-head">Approval</div>
            <div class="sr-approval" :class="{ stale: approval.stale }">
                <span class="sr-appr-tag">APPROVAL</span>
                <span v-if="approval.stale" class="sr-stale" title="Approval expired (expires_at_ms < now)">⚠ STALE</span>
                <span v-else class="sr-appr-ok">active</span>
                <span v-if="approvalRaw.approval_id" class="sr-appr-f">id {{ approvalRaw.approval_id }}</span>
                <span v-if="approvalRaw.approved_by" class="sr-appr-f">operator {{ approvalRaw.approved_by }}</span>
                <span v-if="approvalRaw.action" class="sr-appr-f">scope {{ approvalRaw.action }}</span>
                <span class="sr-appr-f">max notional <b class="mono">{{ fmt(approval.maxOrderNotional) }}</b></span>
                <span class="sr-appr-f">expires <span class="time">{{ fmtTime(approval.expiresAtMs) }}</span></span>
                <span v-if="approval.approvedAtMs" class="sr-appr-f">approved <span class="time">{{ fmtTime(approval.approvedAtMs) }}</span></span>
                <span v-if="approval.tradeTimeframe" class="sr-appr-f">trade tf {{ approval.tradeTimeframe }}</span>
                <span v-if="approval.contextTimeframes.length" class="sr-appr-f">ctx {{ approval.contextTimeframes.join(', ') }}</span>
                <span v-if="approval.symbols.length" class="sr-appr-f">TEST {{ approval.symbols.join(', ') }}</span>
                <span v-if="validationProof" class="sr-appr-f" :title="validationProof">validated</span>
            </div>
        </section>

        <!-- AUTH READINESS — pending reasons are operator blockers. -->
        <section class="sr-sec">
            <div class="sr-sec-head">Auth readiness
                <span class="sr-v" :class="'tone-' + runtimeSemantics.auth.tone">{{ runtimeSemantics.auth.label }}</span>
            </div>
            <div v-if="runtimeSemantics.auth.configured" class="sr-grid">
                <div class="sr-field"><span class="sr-k">snapshots</span><span class="sr-v">{{ dash(selectedRuntime.matching_auth_snapshots_seen) }} / {{ dash(selectedRuntime.auth_snapshots_seen) }}</span></div>
                <div class="sr-field"><span class="sr-k">last snapshot</span><span class="sr-v time">{{ fmtTime(selectedRuntime.last_auth_snapshot_ms) }}</span></div>
            </div>
            <div v-else class="sr-msg sr-msg-sm">This runtime does not depend on private Auth state.</div>
            <ul v-if="pendingAuthReasons.length" class="sr-reasons">
                <li v-for="(r, i) in pendingAuthReasons" :key="i">{{ r }}</li>
            </ul>
        </section>

        <!-- ALLOCATION POOL — account / quote / wallet type / observed / unallocated. -->
        <section class="sr-sec">
            <div class="sr-sec-head">Allocation pool
                <span class="sr-v" :class="'tone-' + runtimeSemantics.allocation.tone">{{ runtimeSemantics.allocation.label }}</span>
            </div>
            <div v-if="runtimeSemantics.allocation.configured" class="sr-grid">
                <div class="sr-field"><span class="sr-k">account</span><span class="sr-v">{{ dash(selectedRuntime.allocation_account_id) }}</span></div>
                <div class="sr-field"><span class="sr-k">quote</span><span class="sr-v">{{ dash(selectedRuntime.allocation_quote_currency) }}</span></div>
                <div class="sr-field"><span class="sr-k">wallet type</span><span class="sr-v">{{ dash(selectedRuntime.allocation_wallet_type) }}</span></div>
                <div class="sr-field"><span class="sr-k">observed balance</span><span class="sr-v mono">{{ fmt(selectedRuntime.allocation_observed_balance) }}</span></div>
                <div class="sr-field"><span class="sr-k">observed available</span><span class="sr-v mono">{{ fmt(selectedRuntime.allocation_observed_available) }}</span></div>
                <div class="sr-field"><span class="sr-k">unallocated available</span><span class="sr-v mono">{{ fmt(selectedRuntime.allocation_unallocated_available) }}</span></div>
            </div>
            <div v-else class="sr-msg sr-msg-sm">This runtime has no financial allocation authority.</div>
            <ul v-if="pendingAllocationReasons.length" class="sr-reasons">
                <li v-for="(r, i) in pendingAllocationReasons" :key="i">{{ r }}</li>
            </ul>
        </section>

        <!-- ORDERS — local journal (queued) DISTINCT from dispatched; submitted-nonterminal blocker. -->
        <section class="sr-sec">
            <div class="sr-sec-head">Orders
                <span class="sr-dim">total {{ dash(selectedRuntime.orders_total) }} · active/pending {{ dash(selectedRuntime.orders_active_or_pending) }}</span>
                <span v-if="runtimeBlocker.blocked" class="sr-blocker" :title="blockerTitle(runtimeBlocker)">⚠ {{ runtimeBlocker.submittedNonterminal }} submitted</span>
            </div>
            <div class="sr-orders">
                <div class="sr-order-grp sr-order-local" title="Durable LOCAL JOURNAL only — NOT sent to the exchange">
                    <span class="sr-og-label">Local journal only</span>
                    <span class="sr-og-hint">(not sent to exchange)</span>
                    <span class="sr-oc"><span class="sr-oc-k">queued</span><span class="sr-oc-v">{{ orderSplit.local.queued }}</span></span>
                </div>
                <div class="sr-order-grp sr-order-dispatched" title="Dispatched / reconciled — states after the order left the local journal">
                    <span class="sr-og-label">Dispatched / reconciled</span>
                    <span v-for="k in dispatchedKeys" :key="k" class="sr-oc" :class="{ zero: !orderSplit.dispatched[k] }">
                        <span class="sr-oc-k">{{ k }}</span><span class="sr-oc-v">{{ orderSplit.dispatched[k] }}</span>
                    </span>
                </div>
            </div>
            <div v-if="runtimeBlocker.blocked" class="sr-blocker-note">
                Submitted-nonterminal orders are attention blockers until parity/reconciliation clears them.
                <span v-if="runtimeBlocker.oldestSubmittedTsMs">Oldest submitted <span class="time">{{ fmtTime(runtimeBlocker.oldestSubmittedTsMs) }}</span>.</span>
            </div>
        </section>

        <!-- AUDIT PROVENANCE — display-only pointers; chart clients must NOT fetch these. -->
        <section v-if="auditPointers.length" class="sr-sec">
            <div class="sr-sec-head">Audit provenance <span class="sr-dim">display only — not fetched</span></div>
            <div v-for="p in auditPointers" :key="p.k" class="sr-prov" :title="p.v">
                <span class="sr-k">{{ p.k }}</span> <span class="mono">{{ p.v }}</span>
            </div>
        </section>
    </div>

    <!-- ─── BALANCES ─── auth wallets by class + wallet allocation tree. -->
    <div v-else-if="activeTab === 'balances'" class="sr-body">
        <section class="sr-sec">
            <div class="sr-sec-head">Auth wallets<span class="sr-dim">{{ totalAuthWallets }}</span></div>
            <div v-if="!walletBalanceGroups.length" class="sr-msg sr-msg-sm">No auth wallet balances for this runtime.</div>
            <div v-for="g in walletBalanceGroups" :key="g.class" class="sr-wclass-grp">
                <div class="sr-wclass-head">{{ g.class }}<span class="sr-dim">{{ g.wallets.length }}</span></div>
                <table class="sr-table sr-wtable">
                    <thead>
                        <tr><th>Currency</th><th>Wallet type</th><th class="num">Balance</th><th class="num">Available</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="(w, i) in g.wallets" :key="w.currency + ':' + w.wallet_type + ':' + i">
                            <td class="sym">{{ dash(w.currency) }}</td>
                            <td>{{ dash(w.wallet_type) }}</td>
                            <td class="num mono">{{ fmt(w.balance) }}</td>
                            <td class="num mono">{{ fmt(w.available) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- WALLET ALLOCATION TREE — server-computed wallet_allocations[] preferred;
             flat allocation_* fallback is CLEARLY MARKED legacy / inferred. -->
        <section class="sr-sec">
            <div class="sr-sec-head">Wallet allocation tree
                <span v-if="allocTree.legacy" class="sr-legacy-tag"
                      title="wallet_allocations[] absent — inferred from the flat allocation_* pool; allocated_to_strategy not server-computed">legacy / inferred</span>
                <span class="sr-dim">{{ allocTree.wallets.length }}</span>
            </div>
            <div v-if="!allocTree.wallets.length" class="sr-msg sr-msg-sm">No wallet allocations for this runtime.</div>
            <div v-for="w in allocTree.wallets" :key="walletKey(w)" class="sr-wallet alloc">
                <div class="sr-wallet-head">
                    <span class="sym">{{ dash(w.currency) }}</span>
                    <span v-if="w.class" class="sr-wclass">{{ w.class }}</span>
                    <span v-if="w.wallet_type" class="sr-wtype">{{ w.wallet_type }}</span>
                    <span class="sr-spacer"></span>
                    <span class="sr-wbal"><span class="sr-k">allocated</span> <b class="mono">{{ w.legacy ? '—' : fmt(w.allocated_to_strategy) }}</b></span>
                    <span class="sr-wbal"><span class="sr-k">unallocated</span> <b class="mono">{{ fmt(w.unallocated_available) }}</b></span>
                </div>
                <div class="sr-wallet-alloc">
                    <div class="sr-alloc-pool">
                        <span class="sr-appr-tag">POOL</span>
                        <span v-if="w.account_id" class="sr-appr-f">account {{ w.account_id }}</span>
                        <span class="sr-appr-f">observed <b class="mono">{{ fmt(w.observed_balance) }}</b></span>
                        <span class="sr-appr-f">available <b class="mono">{{ fmt(w.observed_available) }}</b></span>
                    </div>
                    <table v-if="w.tickers.length" class="sr-table sr-alloc">
                        <thead>
                            <tr>
                                <th>Symbol</th><th>Status</th>
                                <th class="num">Allocated eq.</th><th class="num">Available</th>
                                <th class="num">Reserved</th><th class="num">Locked</th>
                                <th class="num">Position</th><th class="num">Avg price</th>
                                <th class="num">Realized</th><th class="num">Unreal.</th><th class="num">Fees</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="t in w.tickers" :key="t.ticker_id"
                                :class="{ selected: t.ticker_id === selectedTickerId }">
                                <td class="sym" :title="t.ticker_id">{{ symbolOf(t.ticker_id) }}</td>
                                <td>
                                    <span class="st-badge" :class="tickerBadge(t._status)">{{ t._status.status }}</span>
                                    <span v-if="t._blocker.blocked" class="sr-blocker sr-blocker-sm" :title="blockerTitle(t._blocker)">⚠</span>
                                </td>
                                <td class="num mono">{{ fmt(t.allocated_equity) }}</td>
                                <td class="num mono">{{ fmt(t.available_cash) }}</td>
                                <td class="num mono">{{ fmt(t.reserved_cash) }}</td>
                                <td class="num mono">{{ fmt(t.locked_margin) }}</td>
                                <td class="num mono">{{ fmt(t.position_quantity) }}</td>
                                <td class="num mono">{{ fmt(t.position_avg_price) }}</td>
                                <td class="num mono" :class="signClass(t.realized_pnl)">{{ fmt(t.realized_pnl) }}</td>
                                <td class="num mono" :class="signClass(t.unrealized_pnl)">{{ fmt(t.unrealized_pnl) }}</td>
                                <td class="num mono">{{ fmt(t.fees_paid) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="sr-msg sr-msg-sm">No ticker allocations under this wallet.</div>
                </div>
            </div>
        </section>
    </div>

    <!-- ─── DECISION AUDIT ─── ticker drill-down. -->
    <div v-else-if="activeTab === 'audit'" class="sr-body">
        <section class="sr-sec">
            <div class="sr-sec-head">Decision audit<span class="sr-dim">{{ decisions.length }}</span></div>
            <div v-if="!auditTickers.length" class="sr-msg sr-msg-sm">No decisions loaded for this runtime.</div>
            <div v-else class="sr-audit">
                <div class="sr-audit-list" role="tablist" aria-label="Tickers">
                    <button v-for="tk in auditTickers" :key="tk.ticker_id"
                            class="sr-audit-tk" :class="{ active: tk.ticker_id === activeAuditTicker }"
                            role="tab" :aria-selected="tk.ticker_id === activeAuditTicker"
                            @click="selectedAuditTicker = tk.ticker_id">
                        <span class="sym">{{ tk.symbol }}</span>
                        <span class="sr-dim">{{ tk.count }}</span>
                    </button>
                </div>
                <div class="sr-audit-detail">
                    <table v-if="auditDecisions.length" class="sr-table sr-decisions">
                        <thead>
                            <tr>
                                <th>Time</th><th>TF</th><th>Outcome</th><th>Reason</th>
                                <th class="num">Intents</th><th class="num">Queued</th><th class="num">Rejected</th>
                                <th>Risk checks</th><th>Ledger Δ</th><th>Claims</th><th>Fingerprint</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="d in auditDecisions" :key="d.decision_id || (d.decision_ts_ms + ':' + d.symbol)">
                                <td class="time">{{ fmtTime(d.decision_ts_ms) }}</td>
                                <td>{{ dash(d.timeframe) }}</td>
                                <td><span class="sr-outcome" :class="outcomeClass(d.outcome)">{{ dash(d.outcome) }}</span></td>
                                <td class="sr-decision-reason" :title="decisionReason(d)">{{ decisionReason(d) }}</td>
                                <td class="num" :title="intentsTitle(d.intents)">{{ (d.intents || []).length }}</td>
                                <td class="num" title="Queued order intents (local journal only — NOT sent to the exchange)">{{ dash0(d.queued_order_count) }}</td>
                                <td class="num" :class="{ neg: numOr0(d.rejected_order_count) > 0 }">{{ dash0(d.rejected_order_count) }}</td>
                                <td :title="checksTitle(d.risk_checks)"><span class="sr-chip" :class="{ warn: risksFailed(d.risk_checks) }">{{ (d.risk_checks || []).length }}</span></td>
                                <td :title="deltasTitle(d.ledger_deltas)"><span class="sr-chip">{{ (d.ledger_deltas || []).length }}</span></td>
                                <td :title="claimsTitle(d.claim_states)"><span class="sr-chip">{{ (d.claim_states || []).length }}</span></td>
                                <td class="sr-fp mono" :title="d.feature_fingerprint">{{ shortFp(d.feature_fingerprint) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="sr-msg sr-msg-sm">Select a ticker to view its decisions.</div>
                </div>
            </div>
        </section>
    </div>
    </template>
</div>
</template>

<script>
// CorkyStrategyPanel — presentational Strategy-runtime view (bottom dock): a
// process→runtime→ticker+dependency HIERARCHY plus a per-runtime DRILLDOWN
// (Summary / Balances / Decision Audit). App owns the CorkyStrategyFeed +
// selection/streaming; this renders props + emits intents (select-runtime /
// refresh). Ticker selection (for command routing) is LOCAL UI state.
//
// DECIMAL SAFETY: every money/quantity field is a decimal STRING. fmt() formats
// for display via PURE STRING MANIPULATION (trims trailing zeros, groups
// thousands) — it never Number()-parses, so 28-digit decimals stay exact.
// Number() is only used for colouring / order-COUNT integers.
//
// The three status AXES are kept visually distinct: runtime READINESS (Ready/…),
// the coarse allocation rollup (active/…), and the per-TICKER status
// (waiting/long/short/…) classified via classifyTickerStatus. LINEAGE is its own
// badge: only `verified` may read as running; mismatch/unknown never do.
import {
    classifyRuntimeReadiness,
    classifyRuntimeStrategyRollup,
    classifyTickerStatus,
    classifyLineage,
    lineageCandidateLink,
    buildWalletAllocationTree,
    groupWalletBalancesByClass,
    groupRuntimesByProcess,
    normalizeDependencies,
    orderBlocker,
    strategyTickerControlActions,
    splitOrderStatusCounts,
    approvalStatus,
    strategyRuntimeSemantics,
    fmtDecimal,
    fmtDuration,
    DISPATCHED_STATUS_KEYS,
} from '../../helpers/feed/corky-strategy-transforms.js'
import { isNeg } from '../../helpers/feed/corky-positions.js'

const DEFAULT_RUNTIME_ID = 'v8-tail-repair-live-main'
const TABS = [
    { id: 'summary', label: 'Summary' },
    { id: 'balances', label: 'Balances' },
    { id: 'audit', label: 'Decision Audit' },
]

export default {
    name: 'CorkyStrategyPanel',
    props: {
        runtimes: { type: Array, default: () => [] },
        selectedRuntimeId: { type: String, default: '' },
        decisions: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        streaming: { type: Boolean, default: false },
        now: { type: Number, default: 0 },
        // Direct-control session state (App-owned): { available, pending, awaiting,
        // error }. `available` gates the WHOLE control surface — when false, NO
        // control action renders (there is no valid control session, or the
        // runtime does not advertise direct control). `pending`/`awaiting` drive
        // the in-flight → awaiting-reconciliation hint; `error` surfaces a send
        // failure. Controls MUTATE a live runtime, so this is opt-in and hidden by
        // default.
        control: { type: Object, default: () => ({ available: false, pending: false, awaiting: false, error: null }) },
    },
    emits: [
        'select-runtime', 'refresh',
        // Direct-control intents (App echoes them to the feed's control methods).
        'cancel-ticker-orders', 'pause-ticker', 'resume-ticker', 'unlock-ticker', 'adopt-position',
        // Jump to the runtime's verified universe backtest run + candidate.
        'open-lineage-run',
    ],
    data() {
        return {
            TABS,
            activeTab: 'summary',
            // Which ticker is highlighted (kept for command routing / drilldown focus).
            selectedTicker: '',
            // Decision-audit: which ticker's decisions are shown (local UI state).
            selectedAuditTicker: '',
            // Control inputs (local UI state). `reason` is the MANDATORY visible
            // operator reason; unlock/adopt add their allocation/position inputs.
            reason: '',
            unlockCurrency: '',
            unlockAmount: '',
            adoptPositionId: '',
            controlValidation: '',
        }
    },
    computed: {
        // Injected clock (App-owned) or wall-clock fallback. Only used for DURATION
        // math on PUBLISHED timing fields — never invents a duration when timing is
        // absent (classifyTickerStatus omits it).
        nowMs() { return this.now || Date.now() },

        // Process → runtime hierarchy, each runtime pre-classified (readiness,
        // lineage, rollup) with its ticker + dependency child rows.
        processGroups() {
            const now = this.nowMs
            return groupRuntimesByProcess(this.runtimes).map((g) => {
                let ready = 0
                let degraded = 0
                const runtimes = g.runtimes.map((rt) => {
                    const readiness = classifyRuntimeReadiness(rt.state)
                    if (readiness.ready) ready++
                    if (String(rt.state) === 'Degraded') degraded++
                    const ordersById = this._tickerOrdersMap(rt)
                    // Prefer the published tickers[]; fall back to ticker_allocations[]
                    // (older runtime with no runtime.tickers[]).
                    const src = Array.isArray(rt.tickers) && rt.tickers.length ? rt.tickers
                        : (Array.isArray(rt.ticker_allocations) ? rt.ticker_allocations : [])
                    const tickers = src.filter(Boolean).map((t) => ({
                        ticker_id: t.ticker_id,
                        symbol: t.symbol || this.symbolOf(t.ticker_id),
                        status: classifyTickerStatus(t.status, t, now),
                        lastDecision: typeof t.last_decision_summary === 'string'
                            ? t.last_decision_summary
                            : (t.last_decision_summary && (t.last_decision_summary.reason || t.last_decision_summary.outcome)),
                        blocker: orderBlocker(ordersById.get(t.ticker_id) || t),
                    }))
                    return {
                        rt,
                        readiness,
                        lineage: classifyLineage(rt.lineage_status),
                        lineageRaw: rt.lineage_status != null && rt.lineage_status !== '' ? rt.lineage_status : 'unknown',
                        deps: normalizeDependencies(rt),
                        tickers,
                    }
                })
                return { process_kind: g.process_kind, total: g.runtimes.length, ready, degraded, runtimes }
            })
        },

        activeRuntimeId() {
            const ids = this.runtimes.map((r) => r && r.runtime_id)
            if (this.selectedRuntimeId && ids.includes(this.selectedRuntimeId)) return this.selectedRuntimeId
            if (ids.includes(DEFAULT_RUNTIME_ID)) return DEFAULT_RUNTIME_ID
            return ids[0] || ''
        },
        selectedRuntime() {
            return this.runtimes.find((r) => r && r.runtime_id === this.activeRuntimeId) || null
        },
        selectedTickerId() {
            const rt = this.selectedRuntime
            if (!rt || !this.selectedTicker) return ''
            return this.selectedTicker
        },

        // ── direct-control surface ────────────────────────────────────────────────
        // The whole control surface is gated on `control.available` — a valid
        // control session that offers direct strategy control. When false, NOTHING
        // controllable renders (the operator cannot mutate a session-less runtime).
        controlEnabled() {
            return !!(this.control && this.control.available && this.runtimeSemantics.runtimeControl.available)
        },
        controlUnavailableReason() {
            if (!this.runtimeSemantics.runtimeControl.available) return this.runtimeSemantics.runtimeControl.reason
            if (!(this.control && this.control.available)) return 'no control session'
            return 'control capability unavailable'
        },
        controlPending() { return !!(this.control && this.control.pending) },
        // awaiting is the runtime_id a control was sent to → show the hint only for
        // that runtime (the operator's selected/active runtime).
        controlAwaiting() { return !!this.control && this.control.awaiting === this.activeRuntimeId },
        // Public/private dependency ids from the contract-canonical dependencies[]
        // (falling back, inside normalizeDependencies, to the legacy target_* fields).
        summaryDeps() {
            const deps = normalizeDependencies(this.selectedRuntime)
            const pick = (kind) => { const d = deps.find((x) => x && x.kind === kind); return d ? d.runtime_id : null }
            return { public: pick('public'), private: pick('private') }
        },
        controlError() { return (this.control && this.control.error) || null },

        // The selected ticker resolved for control: its live status + submitted-order
        // blocker + the applicable actions (pause/resume/unlock/adopt/cancel). Null
        // when no ticker is selected or it isn't found on the selected runtime.
        controlTarget() {
            const rt = this.selectedRuntime
            const tid = this.selectedTickerId
            if (!rt || !tid) return null
            const src = Array.isArray(rt.tickers) && rt.tickers.length ? rt.tickers
                : (Array.isArray(rt.ticker_allocations) ? rt.ticker_allocations : [])
            const tk = src.find((t) => t && t.ticker_id === tid)
            if (!tk) return null
            const statusInfo = classifyTickerStatus(tk.status, tk, this.nowMs)
            const blocker = orderBlocker(this._tickerOrdersMap(rt).get(tid) || tk)
            // Unverified (mismatched) lineage → withhold capital/position-committing
            // controls (unlock/adopt); halt/safety controls stay available.
            const lineage = classifyLineage(rt.lineage_status)
            const capitalBlocked = lineage.tone === 'attention'
            const actions = strategyTickerControlActions(statusInfo.status, blocker, { capitalBlocked })
            return {
                runtime_id: rt.runtime_id,
                ticker_id: tid,
                symbol: tk.symbol || this.symbolOf(tid),
                statusInfo,
                blocker,
                actions,
                capitalBlocked,
                lineageRaw: lineage.raw,
                needsAllocation: actions.some((a) => a.allocation),
                needsPosition: actions.some((a) => a.position),
            }
        },

        readinessInfo() { return classifyRuntimeReadiness(this.selectedRuntime && this.selectedRuntime.state) },
        runtimeSemantics() {
            return strategyRuntimeSemantics(this.selectedRuntime, { nowMs: this.nowMs, streaming: this.streaming })
        },
        rollupInfo() { return classifyRuntimeStrategyRollup(this.selectedRuntime && this.selectedRuntime.allocation_strategy_status) },
        lineageInfo() { return classifyLineage(this.selectedRuntime && this.selectedRuntime.lineage_status) },
        // The clickable backtest-candidate link (verified lineage only), or null.
        lineageLink() { return lineageCandidateLink(this.selectedRuntime) },
        lineageRawLabel() {
            const s = this.selectedRuntime && this.selectedRuntime.lineage_status
            return s != null && s !== '' ? s : 'unknown'
        },
        lineageReasons() {
            const r = this.selectedRuntime && this.selectedRuntime.lineage_reasons
            return Array.isArray(r) ? r : []
        },
        pendingAuthReasons() {
            const r = this.selectedRuntime && this.selectedRuntime.pending_auth_reasons
            return Array.isArray(r) ? r : []
        },
        pendingAllocationReasons() {
            const r = this.selectedRuntime && this.selectedRuntime.pending_allocation_reasons
            return Array.isArray(r) ? r : []
        },
        recentDecisionRows() {
            const rows = this.selectedRuntime && this.selectedRuntime.recent_decisions
            return Array.isArray(rows) ? rows.slice(0, 8) : []
        },

        approvalRaw() { return (this.selectedRuntime && this.selectedRuntime.live_operator_approval) || {} },
        approval() { return approvalStatus(this.approvalRaw && this.approvalRaw.approval_id ? this.approvalRaw : null, this.nowMs) },
        validationProof() {
            const p = this.approvalRaw && this.approvalRaw.live_validation_proof
            return p && p.kind ? p.kind : null
        },

        orderSplit() { return splitOrderStatusCounts(this.selectedRuntime && this.selectedRuntime.order_status_counts) },
        dispatchedKeys() { return DISPATCHED_STATUS_KEYS },
        runtimeBlocker() { return orderBlocker(this.selectedRuntime) },

        // Auth wallets grouped by class (exchange/margin/funding/derivative/other),
        // passed through VERBATIM (balances stay decimal strings).
        walletBalanceGroups() { return groupWalletBalancesByClass(this.selectedRuntime && this.selectedRuntime.auth_wallet_balances) },
        totalAuthWallets() {
            const b = this.selectedRuntime && this.selectedRuntime.auth_wallet_balances
            return Array.isArray(b) ? b.length : 0
        },

        // Wallet → strategy → ticker allocation tree from the transform (prefers the
        // server-computed wallet_allocations[]; marks the flat fallback legacy). Each
        // ticker claim gets its status classified + its submitted-order blocker.
        allocTree() {
            const rt = this.selectedRuntime
            if (!rt) return { legacy: false, wallets: [] }
            const now = this.nowMs
            const tree = buildWalletAllocationTree(rt)
            const ordersById = this._tickerOrdersMap(rt)
            return {
                legacy: tree.legacy,
                wallets: tree.wallets.map((w) => ({
                    ...w,
                    tickers: (w.tickers || []).map((t) => ({
                        ...t,
                        _status: classifyTickerStatus(t.status, t, now),
                        _blocker: orderBlocker(ordersById.get(t.ticker_id) || t),
                    })),
                })),
            }
        },

        auditPointers() {
            const rt = this.selectedRuntime || {}
            return [
                { k: 'market data', v: rt.market_data_audit_path },
                { k: 'decisions', v: rt.decision_audit_path },
                { k: 'orders', v: rt.order_journal_path },
                { k: 'controls', v: rt.control_audit_path },
            ].filter((p) => p.v != null && p.v !== '')
        },

        // Decisions grouped by ticker (input order) — feeds the audit ticker list.
        decisionGroups() {
            const groups = []
            const byId = new Map()
            for (const d of this.decisions) {
                if (!d) continue
                const id = d.ticker_id || d.symbol || 'unknown'
                let g = byId.get(id)
                if (!g) { g = { ticker_id: id, symbol: d.symbol || id, decisions: [] }; byId.set(id, g); groups.push(g) }
                g.decisions.push(d)
            }
            return groups
        },
        auditTickers() {
            return this.decisionGroups.map((g) => ({ ticker_id: g.ticker_id, symbol: g.symbol, count: g.decisions.length }))
        },
        activeAuditTicker() {
            const ids = this.auditTickers.map((t) => t.ticker_id)
            if (this.selectedAuditTicker && ids.includes(this.selectedAuditTicker)) return this.selectedAuditTicker
            return ids[0] || ''
        },
        // The selected ticker's decisions, MOST RECENT FIRST (decision_ts_ms is an
        // integer epoch-ms — safe to sort numerically).
        auditDecisions() {
            const id = this.activeAuditTicker
            if (!id) return []
            return this.decisions
                .filter((d) => d && (d.ticker_id || d.symbol) === id)
                .slice()
                .sort((a, b) => (Number(b.decision_ts_ms) || 0) - (Number(a.decision_ts_ms) || 0))
        },
    },
    methods: {
        // Jump to the runtime's verified universe backtest run + selected candidate
        // (the App opens the Backtests dock and drills into that run_index).
        openLineage() {
            const l = this.lineageLink
            if (l) this.$emit('open-lineage-run', { run_id: l.runId, run_index: l.runIndex })
        },
        // ── selection ───────────────────────────────────────────────────────────
        selectRuntime(id) {
            this.selectedTicker = ''
            this.$emit('select-runtime', id)
        },
        selectTicker(runtimeId, tickerId) {
            // Selecting a ticker also selects its parent runtime (so the drilldown
            // reflects it); ticker_id is retained for command routing.
            if (runtimeId !== this.activeRuntimeId) this.$emit('select-runtime', runtimeId)
            // Switching to a DIFFERENT ticker clears any in-progress control inputs
            // so a stale reason / amount / position_id can't be sent for the new one
            // (re-selecting the same ticker keeps an in-progress edit).
            if (tickerId !== this.selectedTicker) {
                this.reason = ''
                this.unlockCurrency = ''
                this.unlockAmount = ''
                this.adoptPositionId = ''
            }
            this.selectedTicker = tickerId
            this.controlValidation = ''
        },

        // ── direct control ──────────────────────────────────────────────────────
        // Validate the required operator reason (+ unlock allocation / adopt
        // position) then EMIT the intent — the panel never mutates local strategy
        // state; App forwards the intent to the feed and waits for the subscription
        // full-replacement to reconcile. runtime_id + ticker_id come from the
        // discovered runtime snapshot (the routing target for the gateway).
        runControl(action) {
            this.controlValidation = ''
            const t = this.controlTarget
            if (!t || !this.controlEnabled) return
            const reason = String(this.reason || '').trim()
            if (!reason) { this.controlValidation = 'A visible operator reason is required.'; return }
            const payload = { runtime_id: t.runtime_id, ticker_id: t.ticker_id, reason }
            if (action.kind === 'unlock') {
                const currency = String(this.unlockCurrency || '').trim()
                const amount = String(this.unlockAmount || '').trim()
                if (!currency || !amount) { this.controlValidation = 'Unlock requires a currency and a decimal amount.'; return }
                // amount stays a DECIMAL STRING (never Number()-parsed).
                payload.new_allocation = { currency, amount }
            } else if (action.kind === 'adopt') {
                const pid = String(this.adoptPositionId || '').trim()
                if (!pid) { this.controlValidation = 'Adoption requires a position_id.'; return }
                // position_id is an integer in the gateway shape — coerce a numeric
                // string; otherwise forward verbatim.
                payload.position_id = /^\d+$/.test(pid) ? Number(pid) : pid
            }
            this.$emit(action.intent, payload)
            // Each control action must carry a freshly-entered operator reason — clear
            // the audited inputs after a successful emit.
            this.reason = ''
            this.unlockAmount = ''
            this.adoptPositionId = ''
        },

        // ── formatting ──────────────────────────────────────────────────────────
        fmt(v) { return fmtDecimal(v) },
        fmtDur(ms) { return fmtDuration(ms) },
        dash(v) { return (v == null || v === '') ? '—' : v },
        dash0(v) { return (v == null || v === '') ? '0' : v },
        boolText(v) { return v === true ? 'yes' : v === false ? 'no' : '—' },
        gateClass(ok) { return ok === true ? 'pos' : ok === false ? 'neg' : '' },
        signClass(dec) {
            if (dec == null || dec === '') return ''
            const s = String(dec).trim()
            if (isNeg(s)) return 'neg'
            return /^0(?:\.0+)?$/.test(s) ? '' : 'pos'
        },
        numOr0(v) { const n = Number(v); return Number.isFinite(n) ? n : 0 },

        // ── classification helpers ──────────────────────────────────────────────
        // Ticker status → badge classes. `style` groups long/short/muted/attention/
        // lockout/transitional/neutral; `attn`/`lockout` layer the attention family.
        tickerBadge(info) {
            return [`sts-${info.style}`, info.attention ? 'attn' : '', info.lockout ? 'lockout' : ''].filter(Boolean)
        },
        blockerTitle(b) {
            let s = `submitted-nonterminal orders: ${b.submittedNonterminal} (attention blocker until reconciliation)`
            if (b.oldestSubmittedTsMs) s += ` — oldest ${this.fmtTime(b.oldestSubmittedTsMs)}`
            return s
        },
        walletKey(w) { return [w.account_id, w.wallet_type, w.currency, w.class].join(':') },

        // ── decision-audit cell summaries (hover titles) ────────────────────────
        intentsTitle(intents) {
            const a = Array.isArray(intents) ? intents : []
            if (!a.length) return 'no order intents'
            return a.map((i) => i && (i.kind || i.side || i.action || JSON.stringify(i))).join('\n')
        },
        checksTitle(checks) {
            return (Array.isArray(checks) ? checks : [])
                .map((c) => `${c.name}: ${c.status}${c.detail ? ' — ' + c.detail : ''}`).join('\n') || 'no risk checks'
        },
        risksFailed(checks) {
            return (Array.isArray(checks) ? checks : []).some((c) => {
                const s = String(c && c.status || '').toLowerCase()
                return s === 'failed' || s === 'rejected' || s === 'error'
            })
        },
        deltasTitle(deltas) {
            return (Array.isArray(deltas) ? deltas : [])
                .map((d) => `${d.kind}${d.detail ? ' — ' + d.detail : ''}`).join('\n') || 'no ledger deltas'
        },
        claimsTitle(claims) {
            return (Array.isArray(claims) ? claims : [])
                .map((c) => `${c.ticker_id || ''}: ${c.status}`).join('\n') || 'no claim states'
        },
        decisionReason(decision) {
            const d = decision || {}
            if (d.reason) return d.reason
            const firstIntent = Array.isArray(d.intents) ? d.intents.find(Boolean) : null
            if (firstIntent && firstIntent.reason) return firstIntent.reason
            if (d.first_intent_reason) return d.first_intent_reason
            const check = Array.isArray(d.risk_checks)
                ? d.risk_checks.find((row) => row && row.detail && ['failed', 'rejected', 'blocked', 'denied'].includes(String(row.status || '').toLowerCase()))
                : null
            return (check && check.detail) || '—'
        },
        outcomeClass(outcome) {
            const s = String(outcome || '').toLowerCase()
            if (s.includes('reject') || s.includes('error') || s.includes('fail')) return 'neg'
            if (s.includes('order') || s.includes('fill') || s.includes('queued')) return 'act'
            return ''
        },
        shortFp(fp) {
            if (!fp) return '—'
            const s = String(fp).replace(/^sha256:/, '')
            return s.length > 10 ? s.slice(0, 10) + '…' : s
        },
        shortSha(sha) {
            if (sha == null || sha === '') return '—'
            const s = String(sha).replace(/^sha256:/, '')
            return s.length > 12 ? 'sha256:' + s.slice(0, 12) + '…' : String(sha)
        },
        symbolOf(id) {
            if (!id) return ''
            const parts = String(id).split(':')
            return parts.length > 2 ? parts.slice(1).join(':') : id
        },
        _tickerOrdersMap(rt) {
            const m = new Map()
            for (const o of ((rt && rt.ticker_orders) || [])) if (o && o.ticker_id) m.set(o.ticker_id, o)
            return m
        },
        fmtTime(ms) {
            if (!(ms > 0)) return '—'
            const d = new Date(ms)
            if (Number.isNaN(d.getTime())) return '—'
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        },
    },
}
</script>

<style scoped>
.sr { display: flex; flex-direction: column; height: 100%; color: #d1d4dc; font-size: 12px; }

/* Tab bar */
.sr-tabs { display: flex; align-items: stretch; gap: 2px; padding: 0 8px; border-bottom: 1px solid #1c212e; background: #121827; }
.sr-tab { background: none; border: none; border-bottom: 2px solid transparent; color: #808a9d; font-size: 12px;
          padding: 9px 12px; cursor: pointer; }
.sr-tab:hover { color: #d1d4dc; }
.sr-tab.active { color: #35a776; border-bottom-color: #35a776; font-weight: 600; }
.sr-spacer { flex: 1 1 auto; }
.sr-live { color: #35a776; font-size: 11px; align-self: center; }
.sr-icon { align-self: center; background: #131722; color: #808a9d; border: 1px solid #2a2e39; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; margin: 0 4px; }
.sr-icon:hover { color: #35a776; border-color: #35a776; }
.sr-error { padding: 8px 12px; color: #e54150; }
.sr-msg { padding: 14px; color: #808a9d; text-align: center; }
.sr-msg-sm { padding: 8px; text-align: left; font-size: 11px; }
/* Single centered state that fills the pane when nothing is loaded (empty /
   loading / socket-down error) — one message, centered both axes. */
.sr-empty { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; padding: 24px; }
.sr-empty-inner { color: #808a9d; text-align: center; max-width: 90%; line-height: 1.5; }
.sr-empty-inner.error { color: #e54150; }

/* Selected-runtime truth surface: independent health/mode/authority/freshness. */
.sr-status-banner { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 7px 12px;
                    border-bottom: 1px solid #1c212e; background: #0f1521; }
.sr-status-mode { color: #b0b6c0; font-weight: 600; }
.sr-status-authority, .sr-status-fresh { font-size: 11px; padding: 1px 7px; border-radius: 9px; background: #202735; }
.sr-status-reason { flex: 1 1 260px; min-width: 0; color: #ff9f40; font-size: 11px;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tone-ready { color: #35a776; }
.tone-attention { color: #ff9f40; }
.tone-neutral { color: #9aa4b2; }

/* ── Hierarchy ─────────────────────────────────────────────────────────────── */
.sr-hier { flex: 0 0 auto; max-height: 44%; overflow: auto; padding: 6px 12px 8px; border-bottom: 1px solid #1c212e; }
.sr-proc { margin-top: 6px; }
.sr-proc-head { display: flex; align-items: baseline; gap: 10px; padding: 4px 0 6px; }
.sr-proc-kind { color: #58a6ff; font-weight: 700; font-size: 11px; letter-spacing: 0.02em; }
.sr-proc-stat { color: #808a9d; font-size: 11px; font-variant-numeric: tabular-nums; }
.sr-rt-node { margin: 0 0 6px; }
.sr-rt { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: #0e1320; color: #d1d4dc;
         border: 1px solid #2a2e39; border-radius: 4px; padding: 6px 10px; cursor: pointer; }
.sr-rt:hover { border-color: #35a776; }
.sr-rt.active { border-color: #35a776; box-shadow: inset 3px 0 0 #35a776; background: rgba(53,167,118,0.08); }
.sr-rt-id { font-weight: 700; color: #fff; }
.sr-rt-strategy { color: #808a9d; }
.sr-rt-inst { color: #5c6470; font-size: 11px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-rt-name { color: #fff; font-weight: 700; text-transform: none; letter-spacing: 0; font-size: 12px; }
.sr-mode { font-size: 10px; text-transform: uppercase; padding: 1px 6px; border-radius: 8px; background: #2a2e39; color: #b0b6c0; }
.sr-mode.mode-live { background: rgba(229,65,80,0.16); color: #e07a85; }
.sr-mode.mode-shadow_live { background: rgba(88,166,255,0.16); color: #58a6ff; }
.sr-mode.mode-paper { background: rgba(129,139,157,0.16); color: #9aa4b2; }

.sr-rt-children { padding: 4px 0 0 18px; display: flex; flex-direction: column; gap: 4px; }
.sr-child-grp { display: flex; flex-direction: column; gap: 3px; }
.sr-ticker { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: transparent; color: #d1d4dc;
             border: 1px solid transparent; border-left: 2px solid #2a2e39; border-radius: 0 4px 4px 0; padding: 3px 8px; cursor: pointer; }
.sr-ticker:hover { background: rgba(255,255,255,0.03); border-left-color: #35a776; }
.sr-ticker.active { background: rgba(53,167,118,0.1); border-left-color: #35a776; }
.sr-tk-sym { color: #fff; font-weight: 600; }
.sr-tk-dur { color: #808a9d; font-size: 11px; }
.sr-tk-reason { color: #808a9d; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-tk-decision { color: #58a6ff; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-deps { padding-top: 2px; }
.sr-deps-label { color: #5c6470; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
.sr-dep { display: flex; align-items: baseline; gap: 8px; padding: 1px 8px; border-left: 2px solid #1c212e; }
.sr-dep-kind { color: #808a9d; font-size: 11px; }
.sr-dep-id { color: #b0b6c0; font-size: 11px; }
.sr-dep-id.unknown { color: #f5c518; font-style: italic; }

/* ── Body / sections ───────────────────────────────────────────────────────── */
.sr-body { flex: 1 1 0; min-height: 0; overflow: auto; padding: 4px 12px 14px; }
.sr-sec { margin-top: 12px; }
.sr-sec-head { display: flex; align-items: center; gap: 8px; color: #35a776; font-weight: 700; font-size: 10px;
              letter-spacing: 0.06em; text-transform: uppercase; padding: 6px 0 4px; border-bottom: 1px solid #1c212e; }
.sr-dim { color: #808a9d; margin-left: 4px; }
.sr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 4px 16px; margin-top: 6px; }
.sr-field { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; }
.sr-k { color: #808a9d; }
.sr-v { color: #d1d4dc; text-align: right; }
.mono { font-variant-numeric: tabular-nums; }
.time { color: #808a9d; }
.sr-lasterr { margin-top: 8px; color: #e07a85; background: rgba(229,65,80,0.08); border: 1px solid rgba(229,65,80,0.3); border-radius: 4px; padding: 6px 8px; }
.sr-reasons { margin: 6px 0 0; padding: 0 0 0 18px; color: #f5c518; font-size: 11px; }
.sr-lin-reasons { margin-top: 6px; }
.sr-lin-reason { color: #808a9d; font-size: 11px; padding: 1px 0; }
.sr-recent-decision { display: grid; grid-template-columns: 120px minmax(120px, 180px) minmax(90px, auto) 1fr;
                      gap: 10px; align-items: baseline; padding: 5px 0; border-bottom: 1px solid #1c212e; }
.sr-decision-reason { color: #ff9f40; max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Verified-lineage → clickable link into the Backtests dock. */
.sr-lin-open { background: rgba(88,166,255,0.12); color: #58a6ff; border: 1px solid rgba(88,166,255,0.4);
               border-radius: 4px; padding: 2px 8px; font-size: 10px; cursor: pointer; white-space: nowrap; }
.sr-lin-open:hover { background: rgba(88,166,255,0.22); }
.sr-lin-link { background: none; border: none; padding: 0; color: #58a6ff; cursor: pointer; text-align: right;
               font: inherit; text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px; }
.sr-lin-link:hover { color: #79b8ff; }
.sr-prov { margin-top: 4px; color: #5c6470; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-prov .mono { color: #6b7686; }

/* Readiness badge (delivery axis) */
.rt-badge { font-size: 10px; text-transform: uppercase; padding: 1px 7px; border-radius: 9px; background: #2a2e39; color: #b0b6c0; }
.rt-badge.tone-ready { background: rgba(53,167,118,0.18); color: #35a776; }
.rt-badge.tone-pending { background: rgba(245,197,24,0.18); color: #f5c518; }
.rt-badge.tone-unknown { background: #2a2e39; color: #808a9d; }

/* Lineage badge — verified / attention (mismatch) / pending / neutral (unknown). */
.lin-badge { font-size: 10px; text-transform: uppercase; padding: 1px 7px; border-radius: 4px; background: #2a2e39; color: #808a9d; white-space: nowrap; }
.lin-badge.lin-verified { background: rgba(53,167,118,0.18); color: #35a776; box-shadow: inset 0 0 0 1px rgba(53,167,118,0.5); }
.lin-badge.lin-attention { background: rgba(229,65,80,0.2); color: #ff6b7a; box-shadow: inset 0 0 0 1px rgba(229,65,80,0.6); }
.lin-badge.lin-pending { background: rgba(245,197,24,0.16); color: #f5c518; }
.lin-badge.lin-neutral { background: #2a2e39; color: #808a9d; }
.sr-run-tag { font-size: 10px; color: #35a776; text-transform: uppercase; letter-spacing: 0.04em; }
.sr-norun-tag { font-size: 10px; color: #808a9d; text-transform: uppercase; letter-spacing: 0.04em; }

/* Legacy / inferred marker */
.sr-legacy-tag { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
                 color: #f5c518; background: rgba(245,197,24,0.14); border: 1px solid rgba(245,197,24,0.4); border-radius: 3px; padding: 0 5px; }

/* Submitted-order blocker overlay */
.sr-blocker { font-size: 10px; font-weight: 700; color: #ff9f40; background: rgba(255,159,64,0.16);
              border: 1px solid rgba(255,159,64,0.5); border-radius: 3px; padding: 0 5px; white-space: nowrap; }
.sr-blocker-sm { padding: 0 3px; }
.sr-blocker-note { margin-top: 6px; color: #ff9f40; font-size: 11px; }

/* Approval + allocation pool chips */
.sr-approval { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 6px;
               border: 1px solid rgba(53,167,118,0.3); border-radius: 4px; padding: 6px 10px; background: rgba(53,167,118,0.05); }
.sr-approval.stale { border-color: rgba(229,65,80,0.5); background: rgba(229,65,80,0.07); }
.sr-appr-tag { font-size: 9px; font-weight: 700; letter-spacing: 0.06em; color: #808a9d; }
.sr-appr-ok { color: #35a776; font-size: 11px; }
.sr-stale { color: #e54150; font-weight: 700; font-size: 11px; }
.sr-appr-f { color: #808a9d; font-size: 11px; }
.sr-appr-f b { color: #d1d4dc; }

/* Orders */
.sr-orders { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.sr-order-grp { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; border: 1px solid #2a2e39; border-radius: 4px; padding: 6px 10px; }
.sr-order-local { border-color: rgba(245,197,24,0.4); background: rgba(245,197,24,0.05); }
.sr-og-label { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #b0b6c0; }
.sr-og-hint { font-size: 10px; color: #f5c518; font-style: italic; }
.sr-oc { display: inline-flex; gap: 4px; align-items: baseline; }
.sr-oc-k { color: #808a9d; font-size: 11px; }
.sr-oc-v { color: #d1d4dc; font-variant-numeric: tabular-nums; }
.sr-oc.zero .sr-oc-k, .sr-oc.zero .sr-oc-v { color: #5c6470; }

/* Balances: auth-wallet class groups */
.sr-wclass-grp { margin-top: 8px; }
.sr-wclass-head { display: flex; align-items: baseline; gap: 6px; color: #b0b6c0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 0; }
.sr-wtable { margin-bottom: 4px; }

/* Balances: wallet allocation cards with a nested claim table */
.sr-wallet { border: 1px solid #2a2e39; border-radius: 5px; margin-top: 8px; overflow: hidden; }
.sr-wallet.alloc { border-color: rgba(53,167,118,0.4); }
.sr-wallet-head { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #131a27; }
.sr-wclass { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #808a9d; }
.sr-wtype { font-size: 10px; color: #6b7686; }
.sr-wbal { font-size: 11px; color: #d1d4dc; }
.sr-wbal .sr-k { margin-right: 4px; }
.sr-wallet-alloc { padding: 8px 10px; border-top: 1px solid #1c212e; }
.sr-alloc-pool { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 8px; }
.sr-alloc tbody tr.selected { background: rgba(53,167,118,0.12); }

/* Decision audit: ticker list + detail */
.sr-audit { display: flex; gap: 10px; margin-top: 8px; align-items: flex-start; }
.sr-audit-list { display: flex; flex-direction: column; gap: 4px; flex: 0 0 200px; }
.sr-audit-tk { display: flex; justify-content: space-between; align-items: center; gap: 8px; text-align: left;
               background: #0e1320; border: 1px solid #2a2e39; border-radius: 4px; color: #d1d4dc; padding: 8px 10px; cursor: pointer; }
.sr-audit-tk:hover { border-color: #35a776; }
.sr-audit-tk.active { border-color: #35a776; box-shadow: inset 3px 0 0 #35a776; background: rgba(53,167,118,0.08); }
.sr-audit-detail { flex: 1 1 0; min-width: 0; overflow: auto; }

/* Tables (shared) */
.sr-table { width: 100%; border-collapse: collapse; }
.sr-table th { text-align: left; padding: 4px 8px; border-bottom: 1px solid #2a2e39; color: #808a9d; font-weight: 500; white-space: nowrap; }
.sr-table td { padding: 4px 8px; border-bottom: 1px solid #1c212e; white-space: nowrap; }
.sr-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.sr-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.025); }
.sym { color: #fff; font-weight: 600; }

/* Status badges — runtime rollup tones + ticker-status style families. */
.st-badge { font-size: 10px; text-transform: uppercase; padding: 1px 7px; border-radius: 9px; background: #2a2e39; color: #b0b6c0; white-space: nowrap; }
.st-badge.tone-idle { background: rgba(129,139,157,0.18); color: #9aa4b2; }
.st-badge.tone-ready { background: rgba(53,167,118,0.18); color: #35a776; }
.st-badge.tone-critical { background: rgba(229,65,80,0.28); color: #ff6b7a; }
.st-badge.tone-warn { background: rgba(245,197,24,0.18); color: #f5c518; }
.st-badge.tone-unknown { background: #2a2e39; color: #808a9d; }
/* ticker-status style vocabulary (classifyTickerStatus): */
.st-badge.sts-muted-grey { background: rgba(129,139,157,0.18); color: #9aa4b2; box-shadow: inset 0 0 0 1px rgba(129,139,157,0.5); }
.st-badge.sts-positive-green { background: rgba(53,167,118,0.18); color: #35a776; box-shadow: inset 0 0 0 1px rgba(53,167,118,0.6); }
.st-badge.sts-short-distinct { background: rgba(229,65,80,0.18); color: #e54150; box-shadow: inset 0 0 0 1px rgba(229,65,80,0.6); border-radius: 3px; }
.st-badge.sts-attention { background: rgba(245,197,24,0.16); color: #f5c518; box-shadow: inset 0 0 0 1px rgba(245,197,24,0.7); }
.st-badge.sts-lockout { background: rgba(229,65,80,0.34); color: #fff; box-shadow: inset 0 0 0 1px rgba(229,65,80,0.9); letter-spacing: 0.04em; }
.st-badge.sts-transitional { background: rgba(88,166,255,0.16); color: #58a6ff; box-shadow: inset 0 0 0 1px rgba(88,166,255,0.6); }
.st-badge.sts-neutral { background: #2a2e39; color: #808a9d; }

/* Decision audit table cells */
.sr-outcome { font-size: 11px; }
.sr-outcome.neg { color: #e54150; }
.sr-outcome.act { color: #35a776; }
.sr-chip { display: inline-block; min-width: 16px; text-align: center; font-size: 10px; padding: 0 5px; border-radius: 8px; background: #2a2e39; color: #b0b6c0; }
.sr-chip.warn { background: rgba(229,65,80,0.2); color: #e54150; }
.sr-fp { color: #5c6470; font-size: 11px; }

.pos { color: #23a776; }
.neg { color: #e54150; }

/* ── Direct-control surface ─────────────────────────────────────────────────── */
.sr-controls { flex: 0 0 auto; padding: 8px 12px; border-bottom: 1px solid #1c212e; background: #10151f; }
.sr-controls-off { display: flex; align-items: center; gap: 10px; }
.sr-controls-head { display: flex; align-items: center; gap: 10px; }
.sr-ctl-title { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #ff9f40; }
.sr-ctl-sym { font-size: 12px; }
.sr-ctl-state { font-size: 11px; }
.sr-ctl-state.pending { color: #f5c518; }
.sr-ctl-state.awaiting { color: #58a6ff; }
.sr-ctl-unavailable { font-size: 11px; color: #5c6470; font-style: italic; }
.sr-ctl-inputs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }
.sr-ctl-input { background: #0e1320; color: #d1d4dc; border: 1px solid #2a2e39; border-radius: 4px; padding: 5px 8px; font-size: 12px; }
.sr-ctl-input:focus { outline: none; border-color: #35a776; }
.sr-ctl-reason { flex: 1 1 220px; min-width: 180px; }
.sr-ctl-cur { width: 90px; }
.sr-ctl-amt { width: 140px; }
.sr-ctl-pos { width: 120px; }
.sr-ctl-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.sr-ctl-btn { background: #131a27; color: #d1d4dc; border: 1px solid #2a2e39; border-radius: 4px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
.sr-ctl-btn:hover:not(:disabled) { border-color: #35a776; color: #35a776; }
.sr-ctl-btn:disabled { opacity: 0.5; cursor: default; }
.sr-ctl-btn.danger { border-color: rgba(229,65,80,0.5); color: #ff6b7a; }
.sr-ctl-btn.danger:hover:not(:disabled) { border-color: #e54150; color: #e54150; background: rgba(229,65,80,0.08); }
.sr-ctl-msg { margin-top: 6px; font-size: 11px; }
.sr-ctl-msg.validation { color: #f5c518; }
.sr-ctl-msg.error { color: #e54150; }
.sr-ctl-msg.lineage-blocked { color: #ff9f40; background: rgba(255,159,64,0.1); border: 1px solid rgba(255,159,64,0.35); border-radius: 4px; padding: 4px 8px; }
</style>
