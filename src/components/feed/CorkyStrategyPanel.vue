<template>
<div class="sr" :class="{ maximized, 'single-runtime': runtimes.length === 1 }">
    <!-- Task-oriented views for the selected runtime. The active task is kept
         across panel remounts so changing dock size does not reset the operator. -->
    <!-- Drilldown view tabs for the SELECTED
         runtime. App owns the feed/subscription; this only renders + emits intents. -->
    <div class="sr-tabs" role="tablist" aria-label="Strategy views">
        <button v-for="(t, index) in TABS" :id="'strategy-task-' + t.id" ref="taskTabs" :key="t.id"
                class="sr-tab" :class="{ active: activeTab === t.id }" role="tab"
                :aria-selected="activeTab === t.id" aria-controls="strategy-task-panel"
                :tabindex="activeTab === t.id ? 0 : -1" @click="setActiveTab(t.id)"
                @keydown="onTaskTabKeydown($event, index)">{{ t.label }}</button>
        <span class="sr-spacer"></span>
        <span v-if="streaming" class="sr-live" title="Live runtime subscription (full-replacement updates)">● live</span>
        <button class="sr-icon" title="Refresh runtimes" aria-label="Refresh strategy runtimes" @click="$emit('refresh')">⟳</button>
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

    <!-- Plain-language strategy identity and operating capability. A stale or
         disconnected stream makes current health unknown; the published health
         remains available only as explicitly last-reported evidence. -->
    <div v-if="selectedRuntime" class="sr-status-banner" :class="'health-' + runtimeSemantics.currentStatus.tone">
        <div class="sr-status-identity">
            <span class="sr-strategy-name">{{ selectedStrategyName }}</span>
            <span class="sr-status-mode" :class="'mode-' + runtimeSemantics.mode.raw">{{ runtimeSemantics.mode.label }}</span>
            <button class="sr-balance-open" type="button"
                    title="Open this strategy's USD-normalized balance history in a chart tab"
                    @click="openBalanceHistory">View balance over time</button>
        </div>
        <div class="sr-status-description">{{ runtimeSemantics.mode.description }}</div>
        <div class="sr-status-meta">
            <span class="sr-service-health" :class="'tone-' + runtimeSemantics.currentStatus.tone">{{ runtimeSemantics.currentStatus.label }}</span>
            <span aria-hidden="true">·</span>
            <span class="sr-status-fresh" :class="'tone-' + runtimeSemantics.freshness.tone">{{ freshnessText }}</span>
            <template v-if="!runtimeSemantics.currentStatus.known">
                <span aria-hidden="true">·</span>
                <span class="sr-last-reported">Last reported: {{ runtimeSemantics.health.label }}</span>
            </template>
            <template v-if="lineageInfo.tone === 'verified'">
                <span aria-hidden="true">·</span>
                <span class="sr-identity-confirmed">Strategy identity verified</span>
            </template>
            <template v-else-if="lineageInfo.tone === 'attention'">
                <span aria-hidden="true">·</span>
                <span class="tone-attention">Strategy identity needs attention</span>
            </template>
        </div>
        <div v-if="runtimeSemantics.primaryReason" class="sr-status-reason" :title="runtimeSemantics.primaryReason">
            <template v-if="!runtimeSemantics.currentStatus.known">Last reported: </template>
            {{ humanReason(runtimeSemantics.primaryReason) }}
        </div>
    </div>

    <!-- A selector is useful only when there is a choice. Internal process and
         runtime ids stay out of this default view. -->
    <div v-if="runtimes.length > 1" class="sr-hier" role="listbox" aria-label="Running strategies">
        <div class="sr-proc-head">
            <span class="sr-proc-kind">Running strategies</span>
            <span class="sr-proc-stat">{{ runtimeFleetSummary }}</span>
        </div>
        <div v-for="node in runtimeNodes" :key="node.rt.runtime_id" class="sr-rt-node">
            <button class="sr-rt" :class="{ active: node.rt.runtime_id === activeRuntimeId }"
                    :data-runtime-id="node.rt.runtime_id" role="option"
                    :aria-selected="node.rt.runtime_id === activeRuntimeId"
                    @click="selectRuntime(node.rt.runtime_id)">
                <span class="sr-rt-strategy">{{ strategyName(node.rt) }}</span>
                <span class="sr-mode" :class="'mode-' + node.semantics.mode.raw">{{ node.semantics.mode.label }}</span>
                <span class="sr-spacer"></span>
                <span class="rt-badge" :class="'tone-' + node.semantics.currentStatus.tone">{{ runtimeStatusLabel(node.semantics.currentStatus) }}</span>
                <span v-if="node.lineage.tone === 'attention'" class="lin-badge lin-attention">Identity issue</span>
                <span v-if="node.rt.runtime_id === activeRuntimeId" class="sr-viewing">Viewing</span>
            </button>
        </div>
    </div>

    <!-- ═══ CONTROLS ═══ per-ticker DIRECT CONTROL for the SELECTED ticker
         (pause / resume / unlock / adopt / cancel submitted orders). RENDERED ONLY
         when a control session is available (control.available) — a session-less or
         control-incapable runtime exposes NOTHING here. Each action requires a
         visible operator reason; unlock/adopt add allocation/position inputs. On
         click the panel EMITS an intent and never mutates local state — App awaits
         the subscription full-replacement to reconcile. -->
    <div v-if="activeTab === 'administration' && controlEnabled && controlTarget" class="sr-controls" role="group" aria-label="Ticker controls">
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
    <div v-else-if="activeTab === 'administration' && selectedTickerId" class="sr-controls sr-controls-off">
        <span class="sr-ctl-title">Controls</span>
        <span class="sr-ctl-unavailable" :title="controlUnavailableReason">unavailable — {{ controlUnavailableReason }}</span>
    </div>

    <!-- ═══ DRILLDOWN ═══ (selected runtime) -->
    <div v-if="!selectedRuntime" id="strategy-task-panel" class="sr-body" role="tabpanel"
         :aria-labelledby="'strategy-task-' + activeTab" tabindex="0">
        <div v-if="!loading" class="sr-msg">No strategy runtime loaded.</div>
    </div>

    <!-- OVERVIEW / ORDERS / CONFIGURATION / ADMINISTRATION share one detail
         scroll owner; sections are assigned to exactly one task. -->
    <div v-else-if="['overview', 'orders', 'configuration', 'administration'].includes(activeTab)"
         id="strategy-task-panel" class="sr-body" role="tabpanel"
         :aria-labelledby="'strategy-task-' + activeTab" tabindex="0">
        <section v-if="activeTab === 'administration'" class="sr-sec">
            <div class="sr-sec-head">Runtime administration</div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">manual control</span><span class="sr-v" :class="controlEnabled ? 'pos' : 'tone-neutral'">{{ controlEnabled ? 'Available' : controlUnavailableReason }}</span></div>
                <div class="sr-field"><span class="sr-k">target ticker</span><span class="sr-v">{{ selectedTickerId || 'Select a ticker from the fleet or Tickers tab' }}</span></div>
            </div>
            <div v-if="administrationEnabledFlag && (administrationEnabled || lifecycleData)" class="sr-admin-identity">
                <label>Actor<input v-model="adminActor" class="sr-ctl-input" type="text" autocomplete="off" placeholder="operator identity" /></label>
                <label>Idempotency key<input v-model="adminIdempotencyKey" class="sr-ctl-input" type="text" autocomplete="off" placeholder="unique key (generated if blank)" /></label>
                <label>Reason<input v-model="adminReason" class="sr-ctl-input" type="text" placeholder="visible operator reason" /></label>
            </div>
            <div v-if="adminValidation" class="sr-ctl-msg validation">{{ adminValidation }}</div>
            <div v-if="administrationError" class="sr-ctl-msg error">{{ administrationError }}</div>
        </section>

        <section v-if="activeTab === 'administration'" class="sr-sec sr-runtime-lifecycle">
            <div class="sr-sec-head">Strategy process <span class="sr-dim">preview → exact approval → reconcile</span></div>
            <div v-if="!administrationEnabledFlag" class="sr-msg sr-msg-sm sr-admin-unavailable">
                Read only — disabled by the rollout flag.
            </div>
            <div v-else-if="lifecycle.loading" class="sr-msg sr-msg-sm">Loading server-approved launch modes…</div>
            <div v-else-if="lifecycle.error" class="sr-ctl-msg error">{{ lifecycle.error }}</div>
            <template v-else-if="lifecycleData">
                <div class="sr-grid">
                    <div class="sr-field"><span class="sr-k">current mode</span><span class="sr-v">{{ dash(lifecycleData.current_mode) }}</span></div>
                    <div class="sr-field"><span class="sr-k">verified process</span><span class="sr-v mono">{{ lifecycleData.observed_pid ? `PID ${lifecycleData.observed_pid}` : 'Not verified' }}</span></div>
                </div>
                <div v-if="lifecycleData.stop_unavailable_reason" class="sr-msg sr-msg-sm">Stop unavailable — {{ lifecycleData.stop_unavailable_reason }}</div>
                <div v-if="lifecycleData.profiles_error" class="sr-ctl-msg error">Launch modes unavailable — {{ lifecycleData.profiles_error }}</div>
                <div class="sr-lifecycle-actions">
                    <button class="sr-ctl-btn danger" :disabled="administrationPending || !lifecycleData.stop_available || !operations.projectionRevision"
                            @click="previewRuntimeStop">Preview stop</button>
                </div>
                <div v-if="lifecycleProfiles.length" class="sr-lifecycle-profile">
                    <label>Launch mode
                        <select v-model="selectedLifecycleProfileId" class="sr-ctl-input">
                            <option v-for="profile in lifecycleProfiles" :key="profile.profile_id" :value="profile.profile_id">
                                {{ profile.display_name }} · {{ profile.mode }}{{ profile.active ? ' · active' : '' }}
                            </option>
                        </select>
                    </label>
                    <template v-if="selectedLifecycleProfile">
                        <div class="sr-grid">
                            <div class="sr-field"><span class="sr-k">mode</span><span class="sr-v">{{ selectedLifecycleProfile.mode }}</span></div>
                            <div class="sr-field"><span class="sr-k">account</span><span class="sr-v">{{ dash(selectedLifecycleProfile.account_id) }}</span></div>
                            <div class="sr-field"><span class="sr-k">network</span><span class="sr-v">{{ dash(selectedLifecycleProfile.network) }}</span></div>
                            <div class="sr-field"><span class="sr-k">max order notional</span><span class="sr-v mono">{{ dash(selectedLifecycleProfile.max_order_notional) }}</span></div>
                        </div>
                        <ul v-if="selectedLifecycleProfile.blockers && selectedLifecycleProfile.blockers.length" class="sr-reasons">
                            <li v-for="(blocker, index) in selectedLifecycleProfile.blockers" :key="index">{{ blocker }}</li>
                        </ul>
                        <div class="sr-lifecycle-actions">
                            <button class="sr-ctl-btn" :disabled="administrationPending || !operations.projectionRevision || selectedLifecycleProfile.active || !selectedLifecycleProfile.launch_ready"
                                    @click="previewRuntimeProfile">
                                {{ lifecycleData.observed_pid ? 'Preview mode switch' : 'Preview launch' }}
                            </button>
                        </div>
                    </template>
                </div>
                <div v-else-if="!lifecycleData.profiles_error" class="sr-msg sr-msg-sm">No server-approved launch modes are configured for this strategy.</div>
                <div class="sr-msg sr-msg-sm">Credentials and executable arguments remain server-side; the browser submits only the selected profile revision.</div>
            </template>
            <div v-else class="sr-msg sr-msg-sm">No lifecycle status has been published for this runtime.</div>
        </section>
        <section v-if="activeTab === 'administration'" class="sr-sec">
            <div class="sr-sec-head">Automatic allocation <span class="sr-dim">published state · read only</span></div>
            <div v-if="automaticAllocation" class="sr-grid">
                <div class="sr-field"><span class="sr-k">effective</span><span class="sr-v" :class="automaticAllocation.enabled ? 'pos' : 'tone-neutral'">{{ automaticAllocation.enabled ? 'Enabled' : 'Disabled' }}</span></div>
                <div class="sr-field"><span class="sr-k">policy configured</span><span class="sr-v">{{ boolText(automaticAllocation.policy_configured) }}</span></div>
                <div class="sr-field"><span class="sr-k">global</span><span class="sr-v">{{ boolText(automaticAllocation.global_enabled) }}</span></div>
                <div class="sr-field"><span class="sr-k">wallet</span><span class="sr-v">{{ boolText(automaticAllocation.wallet_enabled) }}</span></div>
                <div class="sr-field"><span class="sr-k">strategy</span><span class="sr-v">{{ boolText(automaticAllocation.strategy_enabled) }}</span></div>
                <div class="sr-field"><span class="sr-k">policy</span><span class="sr-v">{{ dash(automaticAllocation.policy_id) }} · v{{ dash(automaticAllocation.policy_version) }}</span></div>
                <div class="sr-field"><span class="sr-k">policy hash</span><span class="sr-v mono" :title="automaticAllocation.policy_hash">{{ shortSha(automaticAllocation.policy_hash) }}</span></div>
                <div class="sr-field"><span class="sr-k">approved by</span><span class="sr-v">{{ dash(automaticAllocation.approved_by) }}</span></div>
                <div class="sr-field"><span class="sr-k">approved at</span><span class="sr-v time">{{ fmtTime(automaticAllocation.approved_at_ms) }}</span></div>
                <div class="sr-field"><span class="sr-k">journal</span><span class="sr-v mono" :title="automaticAllocation.journal_path">{{ dash(automaticAllocation.journal_path) }}</span></div>
            </div>
            <div v-else class="sr-msg sr-msg-sm">No automatic-allocation status published.</div>
            <div v-if="automaticAllocation && automaticAllocation.fault" class="sr-lasterr">{{ automaticAllocation.fault }}</div>
            <details v-if="automaticAllocation && (automaticAllocation.last_decision || automaticAllocation.daily_digest)" class="sr-payload sr-auto-raw">
                <summary>Last decision and daily digest</summary>
                <pre>{{ prettyPayload({ last_decision: automaticAllocation.last_decision, daily_digest: automaticAllocation.daily_digest }) }}</pre>
            </details>
        </section>

        <section v-if="activeTab === 'administration'" class="sr-sec">
            <div class="sr-sec-head">Allocation administration <span class="sr-dim">compare → preview → approve</span></div>
            <div v-if="!administrationEnabled" class="sr-msg sr-msg-sm sr-admin-unavailable">
                Read only — {{ administrationUnavailableReason }}
            </div>
            <div v-else class="sr-admin-workflow">
                <div class="sr-admin-form">
                    <label>Policy JSON
                        <textarea v-model="allocationPolicyJson" class="sr-admin-policy" rows="9" spellcheck="false"></textarea>
                    </label>
                    <div class="sr-admin-actions">
                        <button class="sr-ctl-btn" :disabled="administrationPending" @click="compareAllocationPolicy">
                            {{ administrationPending === 'comparison' ? 'Comparing…' : 'Compare policy' }}
                        </button>
                    </div>
                </div>

                <div v-if="allocationComparison" class="sr-comparison">
                    <div class="sr-grid">
                        <div class="sr-field"><span class="sr-k">as of</span><span class="sr-v time">{{ fmtTime(allocationComparison.as_of_ms) }}</span></div>
                        <div class="sr-field"><span class="sr-k">expires</span><span class="sr-v time">{{ fmtTime(allocationComparison.expires_at_ms) }}</span></div>
                        <div class="sr-field"><span class="sr-k">ledger revision</span><span class="sr-v mono" :title="allocationComparison.ledger_revision">{{ shortFp(allocationComparison.ledger_revision) }}</span></div>
                        <div class="sr-field"><span class="sr-k">projection revision</span><span class="sr-v mono" :title="allocationComparison.projection_revision">{{ shortFp(allocationComparison.projection_revision) }}</span></div>
                    </div>
                    <div v-for="(proposal, index) in allocationComparison.proposals || []" :key="proposal.proposal_sha256 || index" class="sr-proposal">
                        <div class="sr-proposal-head">
                            <span class="sym">{{ dash(proposal.input && proposal.input.policy && proposal.input.policy.policy_id) }}</span>
                            <span>v{{ dash(proposal.input && proposal.input.policy && proposal.input.policy.policy_version) }}</span>
                            <span>{{ dash(proposal.input && proposal.input.policy && proposal.input.policy.kind) }}</span>
                            <span class="sr-spacer"></span>
                            <span class="mono" :title="proposal.proposal_sha256">{{ shortFp(proposal.proposal_sha256) }}</span>
                        </div>
                        <div class="sr-money-totals">
                            <div class="sr-money-total"><span class="sr-k">newly unallocated</span><span class="mono">{{ fmt(proposal.total_newly_unallocated) }}</span></div>
                            <div class="sr-money-total"><span class="sr-k">allocated</span><span class="mono">{{ fmt(proposal.allocated_amount) }}</span></div>
                            <div class="sr-money-total"><span class="sr-k">remaining</span><span class="mono">{{ fmt(proposal.remaining_unallocated) }}</span></div>
                            <div class="sr-money-total"><span class="sr-k">fallback</span><span>{{ dash(proposal.fallback_applied) }}</span></div>
                        </div>
                        <table v-if="(proposal.allocations || []).length" class="sr-table sr-proposal-allocations">
                            <thead><tr><th>Ticker</th><th class="num">Amount</th></tr></thead>
                            <tbody><tr v-for="row in proposal.allocations" :key="row.ticker_id"><td class="sym">{{ symbolOf(row.ticker_id) }}</td><td class="num mono">{{ fmt(row.amount) }}</td></tr></tbody>
                        </table>
                        <details v-if="(proposal.ranking || []).length" class="sr-payload"><summary>Ranking evidence</summary><pre>{{ prettyPayload(proposal.ranking) }}</pre></details>
                        <button class="sr-ctl-btn" :disabled="administrationPending" @click="previewPolicyProposal(proposal)">Preview policy approval</button>
                    </div>
                    <div v-if="!(allocationComparison.proposals || []).length" class="sr-msg sr-msg-sm">The gateway returned no policy proposals.</div>
                </div>

                <div class="sr-admin-toggle">
                    <label>Scope
                        <select v-model="allocationScope" class="sr-ctl-input"><option value="global">global</option><option value="wallet">wallet</option><option value="strategy">strategy</option></select>
                    </label>
                    <label v-if="allocationScope === 'wallet'">Account
                        <input v-model="allocationAccountId" class="sr-ctl-input" type="text" placeholder="account_id" />
                    </label>
                    <label v-if="allocationScope === 'strategy'">Strategy instance
                        <input v-model="allocationStrategyInstanceId" class="sr-ctl-input" type="text" placeholder="strategy_instance_id" />
                    </label>
                    <label>Desired state
                        <select v-model="allocationDesiredState" class="sr-ctl-input"><option value="enabled">enabled</option><option value="disabled">disabled</option></select>
                    </label>
                    <button class="sr-ctl-btn" :disabled="administrationPending || !operations.projectionRevision" @click="previewAllocationToggle">Preview state change</button>
                </div>
            </div>
        </section>

        <section v-if="activeTab === 'administration' && operationPreview" class="sr-sec sr-operation-preview">
            <div class="sr-sec-head">Operation preview
                <span v-if="previewExpired" class="sr-stale">expired</span>
                <span v-else class="sr-appr-ok">current</span>
            </div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">actor</span><span class="sr-v">{{ operationPreview.actor }}</span></div>
                <div class="sr-field"><span class="sr-k">idempotency key</span><span class="sr-v mono">{{ operationPreview.idempotency_key }}</span></div>
                <div class="sr-field"><span class="sr-k">expected revision</span><span class="sr-v mono" :title="operationPreview.expected_revision">{{ shortFp(operationPreview.expected_revision) }}</span></div>
                <div class="sr-field"><span class="sr-k">expires</span><span class="sr-v time">{{ fmtTime(operationPreview.expires_at_ms) }}</span></div>
                <div class="sr-field"><span class="sr-k">preview hash</span><span class="sr-v mono" :title="operationPreview.preview_hash">{{ operationPreview.preview_hash }}</span></div>
            </div>
            <pre class="sr-json">{{ prettyPayload(operationPreview.operation) }}</pre>
            <div class="sr-approval-entry">
                <span class="sr-k">Type exactly</span><code>{{ requiredApprovalStatement }}</code>
                <input v-model="approvalStatement" class="sr-ctl-input" type="text" autocomplete="off" :placeholder="requiredApprovalStatement" />
                <button class="sr-ctl-btn danger" :disabled="!approvalReady || administrationPending" @click="approvePreview">Apply exact preview</button>
                <button class="sr-ctl-btn" :disabled="administrationPending" @click="$emit('clear-preview')">Clear</button>
            </div>
        </section>
        <section v-if="activeTab === 'administration' && operationResult" class="sr-sec sr-operation-result">
            <div class="sr-sec-head">Operation result
                <span :class="operationResult.applied ? 'pos' : 'neg'">{{ operationResult.status }}</span>
            </div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">applied</span><span class="sr-v">{{ boolText(operationResult.applied) }}</span></div>
                <div class="sr-field"><span class="sr-k">projection revision</span><span class="sr-v mono" :title="operationResult.projection_revision">{{ shortFp(operationResult.projection_revision) }}</span></div>
                <div class="sr-field"><span class="sr-k">message</span><span class="sr-v">{{ operationResult.message }}</span></div>
            </div>
            <div class="sr-msg sr-msg-sm">Local strategy state was not changed optimistically; live gateway projections will reconcile the approved operation.</div>
        </section>
        <section v-if="activeTab === 'overview'" class="sr-sec">
            <div class="sr-sec-head">
                Strategy <span class="sr-rt-name">{{ selectedStrategyName }}</span>
                <span v-if="selectedRuntime.allocation_strategy_status" class="st-badge"
                      :class="'tone-' + rollupInfo.tone">{{ selectedRuntime.allocation_strategy_status }}</span>
            </div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">Operating mode</span><span class="sr-v">{{ runtimeSemantics.mode.label }}</span></div>
                <div class="sr-field"><span class="sr-k">Trading capability</span><span class="sr-v" :class="'tone-' + runtimeSemantics.authority.tone">{{ runtimeSemantics.authority.label }}</span></div>
                <div class="sr-field">
                    <span class="sr-k">Strategy inputs</span>
                    <span class="sr-v" :class="gateClass(selectedRuntime.features_ready === selectedRuntime.feature_requirements)">
                        {{ dash(selectedRuntime.features_ready) }} / {{ dash(selectedRuntime.feature_requirements) }} ready
                    </span>
                </div>
                <div class="sr-field"><span class="sr-k">Last decision</span><span class="sr-v time">{{ fmtTime(selectedRuntime.last_decision_ms) }}</span></div>
            </div>

            <div class="sr-lineage-source" :class="{ unavailable: !lineageLink }">
                <div>
                    <div class="sr-k">Parameter source</div>
                    <div v-if="lineageLink" class="sr-lineage-source-title">Universe backtest study</div>
                    <div v-else class="sr-lineage-source-title">No verified universe study linked</div>
                    <div v-if="lineageLink" class="sr-lineage-source-meta">
                        Run {{ lineageLink.runId }}
                        <template v-if="lineageLink.rank != null"> · rank {{ lineageLink.rank }}</template>
                        <template v-if="lineageLink.runIndex != null"> · candidate {{ lineageLink.runIndex }}</template>
                    </div>
                    <div v-else class="sr-lineage-source-meta">The runtime has not published verified parameter lineage.</div>
                </div>
                <button v-if="lineageLink" class="sr-lin-open" @click="openLineage">
                    Open universe study ↗
                </button>
            </div>

            <div v-if="selectedRuntime.last_error" class="sr-lasterr">
                <span class="sr-k">last error</span> {{ selectedRuntime.last_error }}
            </div>

            <details class="sr-technical">
                <summary>Technical details</summary>
                <div class="sr-grid">
                    <div class="sr-field"><span class="sr-k">Strategy ID</span><span class="sr-v mono">{{ dash(selectedRuntime.strategy_id || selectedRuntime.strategy) }}</span></div>
                    <div class="sr-field"><span class="sr-k">Runtime ID</span><span class="sr-v mono">{{ selectedRuntime.runtime_id }}</span></div>
                    <div class="sr-field"><span class="sr-k">Strategy instance</span><span class="sr-v mono">{{ dash(strategyInstanceId) }}</span></div>
                    <div class="sr-field"><span class="sr-k">Process type</span><span class="sr-v mono">{{ dash(selectedRuntime.process_kind) }}</span></div>
                    <div class="sr-field"><span class="sr-k">Internal mode</span><span class="sr-v mono">{{ dash(selectedRuntime.mode) }}</span></div>
                    <div class="sr-field"><span class="sr-k">Lineage</span><span class="sr-v mono">{{ lineageRawLabel }}</span></div>
                    <div class="sr-field"><span class="sr-k">Public runtime</span><span class="sr-v mono">{{ dash(summaryDeps.public) }}</span></div>
                    <div class="sr-field"><span class="sr-k">Private runtime</span><span class="sr-v mono">{{ dash(summaryDeps.private) }}</span></div>
                </div>
            </details>
        </section>

        <section v-if="activeTab === 'overview'" class="sr-sec">
            <div class="sr-sec-head">Recent decisions <span class="sr-dim">showing {{ recentDecisionRows.length }} most recent (max 20)</span></div>
            <div v-if="!recentDecisionRows.length" class="sr-msg sr-msg-sm">No recent strategy decisions have been published.</div>
            <div v-for="d in recentDecisionRows" :key="d._displayKey" class="sr-recent-decision">
                <span class="time">{{ fmtTime(d.decision_ts_ms) }}</span>
                <span class="sym">{{ d.symbol }}</span>
                <span class="sr-outcome" :class="'tone-' + d.presentation.tone">{{ d.presentation.label }}</span>
                <span class="sr-decision-reason" :class="'tone-' + d.presentation.tone">{{ d.presentation.detail }}</span>
            </div>
        </section>

        <!-- LINEAGE — verified may present as running; mismatch/unknown must NOT. -->
        <section v-if="activeTab === 'configuration'" class="sr-sec">
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

        <section v-if="activeTab === 'configuration'" class="sr-sec">
            <div class="sr-sec-head">Canonical parameters
                <span class="sr-dim">descriptor schema {{ dash(selectedRuntime.strategy_descriptor_schema_version) }}</span>
            </div>
            <pre v-if="canonicalParamsDisplay" class="sr-json">{{ canonicalParamsDisplay }}</pre>
            <div v-else class="sr-msg sr-msg-sm">No canonical parameter JSON published.</div>
            <div v-if="candidateMetricRows.length" class="sr-money-totals sr-candidate-metrics">
                <div v-for="row in candidateMetricRows" :key="row.key" class="sr-money-total">
                    <span class="sr-k">{{ row.key }}</span><span class="mono">{{ row.value }}</span>
                </div>
            </div>
            <div v-if="selectedRuntime.lineage_note" class="sr-prov"><span class="sr-k">lineage note</span> {{ selectedRuntime.lineage_note }}</div>
            <div v-if="selectedRuntime.candidate_artifact_path" class="sr-prov" :title="selectedRuntime.candidate_artifact_path"><span class="sr-k">candidate artifact</span> {{ selectedRuntime.candidate_artifact_path }}</div>
        </section>

        <section v-if="activeTab === 'configuration'" class="sr-sec">
            <div class="sr-sec-head">Runtime dependencies and control readiness</div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">public snapshots matched</span><span class="sr-v">{{ dash0(selectedRuntime.matching_public_snapshots_seen) }} / {{ dash0(selectedRuntime.public_snapshots_seen) }}</span></div>
                <div class="sr-field"><span class="sr-k">last public snapshot</span><span class="sr-v time">{{ fmtTime(selectedRuntime.last_public_snapshot_ms) }}</span></div>
                <div class="sr-field"><span class="sr-k">features ready</span><span class="sr-v">{{ dash0(selectedRuntime.features_ready) }} / {{ dash0(selectedRuntime.feature_requirements) }}</span></div>
                <div class="sr-field"><span class="sr-k">pending controls</span><span class="sr-v">{{ dash0(selectedRuntime.pending_control_requests) }}</span></div>
                <div class="sr-field"><span class="sr-k">Auth order control</span><span class="sr-v">{{ selectedRuntime.auth_order_control_configured ? dash(selectedRuntime.auth_order_control_status) : 'N/A — not configured' }}</span></div>
                <div class="sr-field"><span class="sr-k">Auth target</span><span class="sr-v">{{ dash(selectedRuntime.auth_order_control_target_runtime_id) }}</span></div>
                <div class="sr-field"><span class="sr-k">registry</span><span class="sr-v">{{ dash(selectedRuntime.auth_order_control_registry_status) }}</span></div>
                <div class="sr-field"><span class="sr-k">session</span><span class="sr-v mono">{{ dash(selectedRuntime.auth_order_control_session_fingerprint) }}</span></div>
            </div>
            <ul v-if="(selectedRuntime.pending_feature_reasons || []).length" class="sr-reasons">
                <li v-for="(reason, index) in selectedRuntime.pending_feature_reasons" :key="index">{{ reason }}</li>
            </ul>
            <div v-if="selectedRuntime.auth_order_control_reason" class="sr-lasterr">{{ selectedRuntime.auth_order_control_reason }}</div>
        </section>

        <!-- APPROVAL — expiry + max notional + STALE flag (expired ⇒ not mutation-ready). -->
        <section v-if="activeTab === 'administration' && approval.present" class="sr-sec">
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
        <section v-if="activeTab === 'configuration'" class="sr-sec">
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

        <!-- ORDERS — local journal (queued) DISTINCT from dispatched; submitted-nonterminal blocker. -->
        <section v-if="activeTab === 'orders'" class="sr-sec">
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

        <section v-if="activeTab === 'orders'" class="sr-sec">
            <div class="sr-sec-head">Ticker order state <span class="sr-dim">{{ tickerOrderRows.length }}</span></div>
            <div v-if="!tickerOrderRows.length" class="sr-msg sr-msg-sm">No per-ticker order state published.</div>
            <div v-for="row in tickerOrderRows" :key="row.ticker_id" class="sr-order-card">
                <div class="sr-order-card-head">
                    <span class="sym">{{ row.symbol || symbolOf(row.ticker_id) }}</span>
                    <span>total {{ dash0(row.orders_total) }}</span>
                    <span>active/pending {{ dash0(row.orders_active_or_pending) }}</span>
                    <span v-if="row.orders_submitted_nonterminal" class="sr-blocker">⚠ {{ row.orders_submitted_nonterminal }} submitted</span>
                    <span class="time">last {{ dash(row.last_event) }} · {{ fmtTime(row.last_event_ts_ms) }}</span>
                </div>
                <div class="sr-order-counts">
                    <span v-for="(value, key) in row.order_status_counts || {}" :key="key" class="sr-chip">{{ key }} {{ value }}</span>
                </div>
                <div v-for="blocker in row.submitted_order_blockers || []" :key="blocker.order_key" class="sr-order-forensic">
                    <span class="mono">{{ blocker.order_key }}</span>
                    <span>{{ blocker.side }} {{ blocker.kind }}</span>
                    <span class="mono">qty {{ fmt(blocker.quantity) }} · remaining {{ fmt(blocker.remaining_quantity) }}</span>
                    <span>auth {{ dash(blocker.auth_order_boundary) }}</span>
                    <span>exchange {{ dash(blocker.exchange_boundary) }}</span>
                    <span class="time">age {{ fmtDur(blocker.age_ms) }}</span>
                    <span class="sr-decision-reason">{{ blocker.reason }}</span>
                    <span>{{ blocker.suggested_action }}</span>
                </div>
            </div>
            <div v-if="submittedOrderBlockers.length" class="sr-order-card">
                <div class="sr-order-card-head"><span class="sr-blocker">Runtime submitted-order blockers</span></div>
                <div v-for="blocker in submittedOrderBlockers" :key="blocker.order_key" class="sr-order-forensic">
                    <span class="mono">{{ blocker.order_key }}</span><span class="sym">{{ blocker.symbol || symbolOf(blocker.ticker_id) }}</span>
                    <span>{{ blocker.side }} {{ blocker.kind }} · {{ blocker.status }}</span>
                    <span class="mono">qty {{ fmt(blocker.quantity) }} · remaining {{ fmt(blocker.remaining_quantity) }}</span>
                    <span>auth {{ dash(blocker.auth_order_boundary) }}</span><span>exchange {{ dash(blocker.exchange_boundary) }}</span>
                    <span class="sr-decision-reason">{{ blocker.reason }}</span><span>{{ blocker.suggested_action }}</span>
                </div>
            </div>
        </section>

        <section v-if="activeTab === 'orders' && staleOrderForensics" class="sr-sec sr-stale-forensics">
            <div class="sr-sec-head">Stale-order forensics
                <span class="st-badge sts-attention">{{ staleOrderForensics.status }}</span>
                <span class="sr-dim">report is not approval</span>
            </div>
            <div class="sr-grid">
                <div class="sr-field"><span class="sr-k">as of</span><span class="sr-v time">{{ fmtTime(staleOrderForensics.as_of_ms) }}</span></div>
                <div class="sr-field"><span class="sr-k">stale / repairable / blocked</span><span class="sr-v">{{ dash0(staleOrderForensics.stale_nonterminal_order_count) }} / {{ dash0(staleOrderForensics.repairable_order_count) }} / {{ dash0(staleOrderForensics.blocked_order_count) }}</span></div>
                <div class="sr-field"><span class="sr-k">live mutation allowed</span><span class="sr-v neg">{{ boolText(staleOrderForensics.live_mutation_allowed_by_this_report) }}</span></div>
                <div class="sr-field"><span class="sr-k">required statement</span><span class="sr-v mono">{{ dash(staleOrderForensics.required_statement_for_repair) }}</span></div>
            </div>
            <div class="sr-lasterr">{{ staleOrderForensics.reason }}</div>
            <div v-if="(staleOrderForensics.forbidden_mutations || []).length" class="sr-prov">
                <span class="sr-k">forbidden mutations</span> {{ staleOrderForensics.forbidden_mutations.join(', ') }}
            </div>
            <div class="sr-prov" :title="staleOrderForensics.report_path"><span class="sr-k">report</span> {{ dash(staleOrderForensics.report_path) }}</div>
            <div class="sr-prov" :title="staleOrderForensics.repair_report_path"><span class="sr-k">repair report</span> {{ dash(staleOrderForensics.repair_report_path) }}</div>
        </section>

        <!-- AUDIT PROVENANCE — display-only pointers; chart clients must NOT fetch these. -->
        <section v-if="activeTab === 'configuration' && auditPointers.length" class="sr-sec">
            <div class="sr-sec-head">Audit provenance <span class="sr-dim">display only — not fetched</span></div>
            <div v-for="p in auditPointers" :key="p.k" class="sr-prov" :title="p.v">
                <span class="sr-k">{{ p.k }}</span> <span class="mono">{{ p.v }}</span>
            </div>
        </section>
    </div>

    <!-- ─── TICKERS ─── selected runtime ticker status and exact reason. -->
    <div v-else-if="activeTab === 'tickers'" id="strategy-task-panel" class="sr-body"
         role="tabpanel" :aria-labelledby="'strategy-task-' + activeTab" tabindex="0">
        <section class="sr-sec">
            <div class="sr-sec-head">Ticker state <span class="sr-dim">{{ selectedNodeTickers.length }}</span></div>
            <div v-if="!selectedNodeTickers.length" class="sr-msg sr-msg-sm">No ticker state published for this runtime.</div>
            <button v-for="tk in selectedNodeTickers" :key="tk.ticker_id" class="sr-ticker-card"
                    :class="{ active: tk.ticker_id === selectedTickerId }"
                    @click="selectTicker(activeRuntimeId, tk.ticker_id)">
                <span class="sym">{{ tk.symbol }}</span>
                <span class="st-badge" :class="tickerBadge(tk.status)">{{ tk.status.status }}</span>
                <span v-if="tk.status.durationMs != null" class="time sr-tk-dur">for {{ fmtDur(tk.status.durationMs) }}</span>
                <span class="sr-ticker-card-reason">{{ tk.status.reason || 'No status reason published.' }}</span>
                <span v-if="tk.blocker.blocked" class="sr-blocker" :title="blockerTitle(tk.blocker)">⚠ submitted order</span>
            </button>
        </section>
    </div>

    <!-- ─── CAPITAL ─── auth wallets by class + wallet allocation tree. -->
    <div v-else-if="activeTab === 'capital'" id="strategy-task-panel" class="sr-body"
         role="tabpanel" :aria-labelledby="'strategy-task-' + activeTab" tabindex="0">
        <section class="sr-sec">
            <div class="sr-sec-head">Strategy money <span class="sr-dim">server-computed projection</span></div>
            <div v-if="runtimeSemantics.observer" class="sr-msg sr-msg-sm">Not available by design — monitoring-only strategies cannot allocate or change money.</div>
            <div v-else-if="money.loading" class="sr-msg sr-msg-sm">Loading strategy money…</div>
            <div v-else-if="money.error" class="sr-ctl-msg error">{{ money.error }}</div>
            <template v-else-if="moneyData">
                <div class="sr-grid">
                    <div class="sr-field"><span class="sr-k">authority</span><span class="sr-v">{{ dash(moneyData.authority_scope) }}</span></div>
                    <div class="sr-field"><span class="sr-k">account</span><span class="sr-v">{{ dash(moneyData.account_id) }}</span></div>
                    <div class="sr-field"><span class="sr-k">quote</span><span class="sr-v">{{ dash(moneyData.quote_currency) }}</span></div>
                    <div class="sr-field"><span class="sr-k">as of</span><span class="sr-v time">{{ fmtTime(moneyData.generated_at_ms) }}</span></div>
                    <div class="sr-field"><span class="sr-k">projection revision</span><span class="sr-v mono" :title="moneyData.projection_revision">{{ shortFp(moneyData.projection_revision) }}</span></div>
                </div>
                <div class="sr-money-totals">
                    <div v-for="row in moneyTotalRows" :key="row.key" class="sr-money-total">
                        <span class="sr-k">{{ row.label }}</span><span class="mono">{{ fmt(row.value) }}</span>
                    </div>
                </div>
                <div v-if="moneyData.valuation" class="sr-valuation">
                    <div class="sr-sec-head">Valuation
                        <span class="st-badge">{{ dash(moneyData.valuation.status) }}</span>
                        <span class="sr-dim">{{ fmtTime(moneyData.valuation.as_of_ms) }} · {{ dash(moneyData.valuation.source) }}</span>
                    </div>
                    <div class="sr-grid">
                        <div class="sr-field"><span class="sr-k">total equity</span><span class="sr-v mono">{{ fmt(moneyData.valuation.total_equity) }}</span></div>
                        <div class="sr-field"><span class="sr-k">unrealized P/L</span><span class="sr-v mono" :class="signClass(moneyData.valuation.total_unrealized_pnl)">{{ fmt(moneyData.valuation.total_unrealized_pnl) }}</span></div>
                        <div v-if="moneyData.valuation.reason" class="sr-field"><span class="sr-k">reason</span><span class="sr-v">{{ moneyData.valuation.reason }}</span></div>
                    </div>
                    <table v-if="(moneyData.valuation.tickers || []).length" class="sr-table">
                        <thead><tr><th>Symbol</th><th class="num">Position</th><th class="num">Entry</th><th class="num">Mark</th><th>Mark source / age</th><th class="num">Unrealized P/L</th><th>Status / reason</th></tr></thead>
                        <tbody><tr v-for="ticker in moneyData.valuation.tickers" :key="ticker.ticker_id">
                            <td class="sym">{{ ticker.symbol || symbolOf(ticker.ticker_id) }}</td>
                            <td class="num mono">{{ fmt(ticker.position_quantity) }}</td>
                            <td class="num mono">{{ fmt(ticker.average_entry_price) }}</td>
                            <td class="num mono">{{ fmt(ticker.mark_price) }}</td>
                            <td>{{ dash(ticker.mark_source) }}<span v-if="ticker.mark_age_ms != null" class="time"> · {{ fmtDur(ticker.mark_age_ms) }}</span></td>
                            <td class="num mono" :class="signClass(ticker.unrealized_pnl)">{{ fmt(ticker.unrealized_pnl) }}</td>
                            <td>{{ ticker.status }}<span v-if="ticker.reason" class="sr-decision-reason"> · {{ ticker.reason }}</span></td>
                        </tr></tbody>
                    </table>
                </div>
                <table v-if="(moneyData.funding || []).length" class="sr-table sr-funding">
                    <thead><tr><th>Time</th><th>Direction</th><th class="num">Amount</th><th>Currency</th><th>Class</th><th>Reason</th></tr></thead>
                    <tbody><tr v-for="event in moneyData.funding" :key="event.event_id">
                        <td class="time">{{ fmtTime(event.ts_ms) }}</td><td>{{ event.direction }}</td>
                        <td class="num mono">{{ fmt(event.amount) }}</td><td>{{ event.currency }}</td>
                        <td>{{ event.classification }}</td><td>{{ event.reason }}</td>
                    </tr></tbody>
                </table>
            </template>
            <div v-else class="sr-msg sr-msg-sm">No strategy money projection published.</div>
        </section>
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

    <!-- ─── ACTIVITY ─── decision evidence + immutable operation history. -->
    <div v-else-if="activeTab === 'activity'" id="strategy-task-panel" class="sr-body"
         role="tabpanel" :aria-labelledby="'strategy-task-' + activeTab" tabindex="0">
        <section class="sr-sec">
            <div class="sr-sec-head">Activity timeline
                <span class="sr-dim">{{ activityRows.length }}</span>
                <span v-if="operations.live" class="sr-live">● live</span>
                <span v-if="operations.projectionRevision" class="sr-dim mono" :title="operations.projectionRevision">rev {{ shortFp(operations.projectionRevision) }}</span>
            </div>
            <div class="sr-activity-filters" aria-label="Activity filters">
                <label>source
                    <select v-model="activitySource"><option value="">all</option><option v-for="value in activitySources" :key="value">{{ value }}</option></select>
                </label>
                <label>kind
                    <select v-model="activityKind"><option value="">all</option><option v-for="value in activityKinds" :key="value" :value="value">{{ activityKindLabel(value) }}</option></select>
                </label>
                <label>ticker
                    <select v-model="activityTicker"><option value="">all</option><option v-for="value in activityTickers" :key="value">{{ value }}</option></select>
                </label>
            </div>
            <div class="sr-layer-toggles" role="group" aria-label="Chart strategy layers">
                <span>chart layers</span>
                <label v-for="kind in overlayKinds" :key="kind">
                    <input type="checkbox" :checked="overlayEnabled(kind)"
                           @change="$emit('toggle-overlay', { kind, enabled: $event.target.checked })" />{{ kind }}
                </label>
            </div>
            <div v-if="lifecycleIntervals.length" class="sr-lifecycle-list" aria-label="Runtime lifecycle intervals">
                <div v-for="interval in lifecycleIntervals" :key="lifecycleKey(interval)" class="sr-lifecycle">
                    <span class="st-badge" :class="lifecycleClass(interval.state)">{{ interval.state }}</span>
                    <span class="time">{{ fmtTime(interval.start_ms) }} → {{ interval.end_ms ? fmtTime(interval.end_ms) : 'now' }}</span>
                    <span>{{ interval.source }}</span>
                    <span v-if="interval.ticker_id" class="sym">{{ symbolOf(interval.ticker_id) }}</span>
                    <span v-if="interval.reason" class="sr-decision-reason">{{ interval.reason }}</span>
                </div>
            </div>
            <div v-if="!activityRows.length" class="sr-msg sr-msg-sm">No activity matches these filters.</div>
            <div v-for="row in activityRows" :key="row.id" class="sr-activity-row" :class="'activity-' + row.type">
                <span class="time">{{ fmtTime(row.ts_ms) }}</span>
                <span class="sr-activity-source">{{ row.source }}</span>
                <span class="sr-activity-kind">{{ row.displayKind }}</span>
                <span class="sym">{{ row.ticker_id ? symbolOf(row.ticker_id) : '—' }}</span>
                <span class="sr-decision-reason">{{ row.displayReason }}</span>
                <span v-if="row.count > 1" class="sr-chip">×{{ row.count }}</span>
                <span v-if="row.order_id" class="mono" :title="row.order_id">order {{ shortFp(row.order_id) }}</span>
                <details class="sr-payload">
                    <summary>Technical event details</summary><pre>{{ prettyPayload(row.payload) }}</pre>
                </details>
            </div>
            <div v-if="operations.error" class="sr-ctl-msg error">{{ operations.error }}</div>
            <button v-if="operations.nextCursor" class="sr-load-more" :disabled="operations.loading"
                    @click="$emit('load-more-operations')">{{ operations.loading ? 'Loading…' : 'Load older operations' }}</button>
            <button v-if="activityHasMore" class="sr-load-more" @click="activityVisibleLimit += ACTIVITY_RENDER_BATCH">
                Show {{ Math.min(ACTIVITY_RENDER_BATCH, filteredActivityRows.length - activityRows.length) }} more loaded events
            </button>
        </section>
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
                                <td><span class="sr-outcome" :class="outcomeClass(d.outcome)" :title="d.outcome">{{ decisionSummary(d).label }}</span></td>
                                <td class="sr-decision-reason" :title="decisionReason(d)">{{ decisionSummary(d).detail }}</td>
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
// process→runtime→ticker+dependency fleet plus a per-runtime task workspace.
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
    strategyDisplayName,
    strategyDecisionPresentation,
    humanizeStrategyReason,
    fmtDecimal,
    fmtDuration,
    DISPATCHED_STATUS_KEYS,
} from '../../helpers/feed/corky-strategy-transforms.js'
import { isNeg } from '../../helpers/feed/corky-positions.js'

const DEFAULT_RUNTIME_ID = 'v8-tail-repair-live-main'
const ACTIVE_TAB_STORAGE_KEY = 'corky.strategy.active-task.v1'
const ACTIVITY_RENDER_BATCH = 200
const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'tickers', label: 'Tickers' },
    { id: 'activity', label: 'Activity' },
    { id: 'capital', label: 'Capital' },
    { id: 'orders', label: 'Orders' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'administration', label: 'Administration' },
]

function storedActiveTab() {
    try {
        const value = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
        return TABS.some(({ id }) => id === value) ? value : 'overview'
    } catch (_error) {
        return 'overview'
    }
}

export default {
    name: 'CorkyStrategyPanel',
    props: {
        runtimes: { type: Array, default: () => [] },
        selectedRuntimeId: { type: String, default: '' },
        decisions: { type: Array, default: () => [] },
        operations: { type: Object, default: () => ({}) },
        overlayVisibility: { type: Object, default: () => ({}) },
        money: { type: Object, default: () => ({}) },
        lifecycle: { type: Object, default: () => ({}) },
        administration: { type: Object, default: () => ({}) },
        administrationEnabledFlag: { type: Boolean, default: true },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        streaming: { type: Boolean, default: false },
        maximized: { type: Boolean, default: false },
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
        'select-runtime', 'refresh', 'load-more-operations', 'toggle-overlay',
        'compare-allocation', 'preview-operation', 'approve-operation', 'clear-preview',
        // Direct-control intents (App echoes them to the feed's control methods).
        'cancel-ticker-orders', 'pause-ticker', 'resume-ticker', 'unlock-ticker', 'adopt-position',
        // Jump to the runtime's verified universe backtest run + candidate.
        'open-lineage-run', 'view-balance',
    ],
    data() {
        return {
            TABS,
            ACTIVITY_RENDER_BATCH,
            activeTab: storedActiveTab(),
            // Which ticker is highlighted (kept for command routing / drilldown focus).
            selectedTicker: '',
            // Decision-audit: which ticker's decisions are shown (local UI state).
            selectedAuditTicker: '',
            activitySource: '',
            activityKind: '',
            activityTicker: '',
            overlayKinds: ['decision', 'fill', 'order', 'allocation', 'control', 'lifecycle'],
            // Control inputs (local UI state). `reason` is the MANDATORY visible
            // operator reason; unlock/adopt add their allocation/position inputs.
            reason: '',
            unlockCurrency: '',
            unlockAmount: '',
            adoptPositionId: '',
            controlValidation: '',
            allocationPolicyJson: JSON.stringify({
                policy_id: 'equal-v1', policy_version: 1, kind: 'equal',
                min_eligible_tickers: 1, min_quarters: 0, min_total_trades: 0,
                cooldown_ms: 0, fallback: 'leave_unallocated',
            }, null, 2),
            adminActor: '',
            adminIdempotencyKey: '',
            adminReason: '',
            allocationScope: 'strategy',
            allocationAccountId: '',
            allocationStrategyInstanceId: '',
            allocationDesiredState: 'enabled',
            selectedLifecycleProfileId: '',
            approvalStatement: '',
            adminValidation: '',
            activityVisibleLimit: ACTIVITY_RENDER_BATCH,
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
                    const tickers = src.filter(Boolean).map((t) => {
                        const summary = t.last_decision_summary
                        const decision = typeof summary === 'string'
                            ? { outcome: summary.split(':', 1)[0], reason: summary.includes(':') ? summary.slice(summary.indexOf(':') + 1).trim() : '' }
                            : summary
                        return {
                            ticker_id: t.ticker_id,
                            symbol: t.symbol || this.symbolOf(t.ticker_id),
                            status: classifyTickerStatus(t.status, t, now),
                            lastDecision: decision ? strategyDecisionPresentation(decision, rt.mode).label : '',
                            blocker: orderBlocker(ordersById.get(t.ticker_id) || t),
                        }
                    })
                    return {
                        rt,
                        readiness,
                        semantics: strategyRuntimeSemantics(rt, { nowMs: now, streaming: this.streaming }),
                        lineage: classifyLineage(rt.lineage_status),
                        lineageRaw: rt.lineage_status != null && rt.lineage_status !== '' ? rt.lineage_status : 'unknown',
                        deps: normalizeDependencies(rt),
                        tickers,
                    }
                })
                return { process_kind: g.process_kind, total: g.runtimes.length, ready, degraded, runtimes }
            })
        },

        runtimeNodes() { return this.processGroups.flatMap((group) => group.runtimes) },
        runtimeFleetSummary() {
            const known = this.runtimeNodes.filter((node) => node.semantics.currentStatus.known)
            const healthy = known.filter((node) => node.semantics.currentStatus.ready).length
            const attention = known.length - healthy
            const unknown = this.runtimeNodes.length - known.length
            const parts = [`${this.runtimeNodes.length} total`]
            if (healthy) parts.push(`${healthy} healthy`)
            if (attention) parts.push(`${attention} needs attention`)
            if (unknown) parts.push(`${unknown} status unknown`)
            return parts.join(' · ')
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
        selectedStrategyName() { return strategyDisplayName(this.selectedRuntime) },
        strategyInstanceId() {
            const rt = this.selectedRuntime || {}
            return rt.strategy_instance_id || (rt.state_origin && rt.state_origin.strategy_instance_id) || null
        },
        freshnessText() {
            const freshness = this.runtimeSemantics.freshness
            if (freshness.status === 'current') {
                return freshness.ageMs != null && freshness.ageMs < 60_000
                    ? 'Updated just now' : `Updated ${this.fmtDur(freshness.ageMs)} ago`
            }
            if (freshness.status === 'stale') {
                return freshness.ageMs == null ? 'Runtime status update is stale' : `Runtime status update is stale · last update ${this.fmtDur(freshness.ageMs)} ago`
            }
            if (freshness.status === 'disconnected') {
                return freshness.ageMs == null ? 'Updates disconnected' : `Updates disconnected · last update ${this.fmtDur(freshness.ageMs)} ago`
            }
            return freshness.label
        },
        selectedNodeTickers() {
            const node = this.runtimeNodes.find(({ rt }) => rt.runtime_id === this.activeRuntimeId)
            return node ? node.tickers : []
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
        automaticAllocation() {
            return this.selectedRuntime && this.selectedRuntime.automatic_allocation || null
        },
        lifecycleData() { return this.lifecycle && this.lifecycle.data || null },
        lifecycleProfiles() {
            const profiles = this.lifecycleData && this.lifecycleData.profiles
            return Array.isArray(profiles) ? profiles : []
        },
        selectedLifecycleProfile() {
            return this.lifecycleProfiles.find((profile) =>
                profile && profile.profile_id === this.selectedLifecycleProfileId) || null
        },
        administrationEnabled() {
            return this.administrationEnabledFlag && this.controlEnabled &&
                !this.runtimeSemantics.observer && this.lineageInfo.tone === 'verified'
        },
        administrationUnavailableReason() {
            if (!this.administrationEnabledFlag) return 'disabled by the rollout flag'
            if (this.runtimeSemantics.observer) return 'monitoring-only strategies have no allocation authority'
            if (!this.controlEnabled) return this.controlUnavailableReason
            if (this.lineageInfo.tone !== 'verified') return 'verified runtime lineage is required'
            return 'administrative capability unavailable'
        },
        administrationPending() { return this.administration && this.administration.pending || null },
        administrationError() { return this.administration && this.administration.error || null },
        allocationComparison() { return this.administration && this.administration.comparison || null },
        operationPreview() { return this.administration && this.administration.preview || null },
        operationResult() { return this.administration && this.administration.result || null },
        operationIsLifecycle() {
            const type = this.operationPreview && this.operationPreview.operation &&
                this.operationPreview.operation.type
            return ['stop_runtime', 'launch_runtime_profile', 'switch_runtime_profile'].includes(type)
        },
        requiredApprovalStatement() {
            return this.operationPreview ? `APPROVE ${this.operationPreview.preview_hash}` : ''
        },
        previewExpired() {
            return !!this.operationPreview && Number(this.operationPreview.expires_at_ms) <= this.nowMs
        },
        previewRevisionCurrent() {
            if (!this.operationPreview) return false
            const type = this.operationPreview.operation && this.operationPreview.operation.type
            const current = type === 'approve_automatic_allocation_policy'
                ? (this.allocationComparison && this.allocationComparison.projection_revision)
                : this.operations.projectionRevision
            const operationsCurrent = !this.operations.projectionRevision ||
                this.operations.projectionRevision === this.operationPreview.expected_revision
            return !!current && current === this.operationPreview.expected_revision && operationsCurrent
        },
        approvalReady() {
            const workflowEnabled = this.operationIsLifecycle
                ? this.administrationEnabledFlag : this.administrationEnabled
            return workflowEnabled && !this.previewExpired && this.previewRevisionCurrent &&
                !this.operationResult && this.approvalStatement === this.requiredApprovalStatement
        },
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
        canonicalParamsDisplay() {
            const value = this.selectedRuntime && this.selectedRuntime.strategy_params_canonical_json
            return typeof value === 'string' && value ? value : ''
        },
        candidateMetricRows() {
            const metrics = this.selectedRuntime && this.selectedRuntime.candidate_metrics
            if (!metrics || typeof metrics !== 'object') return []
            return Object.entries(metrics).map(([key, value]) => ({ key, value }))
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
            const durableRows = Array.isArray(this.decisions) ? this.decisions.filter(Boolean) : []
            const snapshotRows = this.selectedRuntime && Array.isArray(this.selectedRuntime.recent_decisions)
                ? this.selectedRuntime.recent_decisions.filter(Boolean) : []
            // Snapshot summaries keep the overview useful when one ticker's
            // durable history request fails. Durable rows are applied second so
            // their fuller audit payload wins when both sources describe the
            // same decision.
            const byDecision = new Map()
            const keyOf = (decision) => decision.decision_id || [
                decision.decision_ts_ms, decision.ticker_id, decision.symbol,
                decision.outcome, decision.reason,
            ].join(':')
            for (const decision of snapshotRows) byDecision.set(keyOf(decision), decision)
            for (const decision of durableRows) {
                const key = keyOf(decision)
                byDecision.set(key, { ...(byDecision.get(key) || {}), ...decision })
            }
            const rows = Array.from(byDecision.values())
                .sort((left, right) => (Number(right.decision_ts_ms) || 0) - (Number(left.decision_ts_ms) || 0))
                .slice(0, 20)
            return rows.map((decision, index) => ({
                ...decision,
                _displayKey: decision.decision_id || `${decision.decision_ts_ms}:${decision.ticker_id}:${index}`,
                symbol: decision.symbol || this.symbolOf(decision.ticker_id),
                presentation: strategyDecisionPresentation(decision, this.runtimeSemantics.mode.raw),
            }))
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
        tickerOrderRows() {
            const rows = this.selectedRuntime && this.selectedRuntime.ticker_orders
            return Array.isArray(rows) ? rows : []
        },
        staleOrderForensics() {
            return this.selectedRuntime && this.selectedRuntime.stale_order_forensics || null
        },
        submittedOrderBlockers() {
            const rows = this.selectedRuntime && this.selectedRuntime.submitted_order_blockers
            return Array.isArray(rows) ? rows : []
        },
        moneyData() { return this.money && this.money.data || null },
        moneyTotalRows() {
            const totals = this.moneyData && this.moneyData.totals || {}
            return [
                ['observed_balance', 'observed balance'], ['observed_available', 'observed available'],
                ['allocated', 'allocated'], ['unallocated', 'unallocated'],
                ['gross_exposure', 'gross exposure'], ['realized_pnl', 'realized P/L'],
                ['unrealized_pnl', 'unrealized P/L'], ['fees', 'fees'],
                ['external_deposits', 'external deposits'], ['external_withdrawals', 'external withdrawals'],
            ].map(([key, label]) => ({ key, label, value: totals[key] }))
        },

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
            const money = !this.runtimeSemantics.observer && this.moneyData
            const source = money ? {
                ...rt,
                wallet_allocations: money.wallets,
                ticker_allocations: money.ticker_allocations,
            } : rt
            const tree = buildWalletAllocationTree(source)
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
        activityBaseRows() {
            const rows = []
            for (const event of (this.operations.events || [])) {
                if (!event) continue
                rows.push({
                    id: `operation:${event.event_id}`,
                    type: 'operation',
                    ts_ms: event.ts_ms,
                    source: event.source || 'unknown',
                    kind: event.kind || 'unknown',
                    displayKind: this.activityKindLabel(event.kind),
                    ticker_id: event.ticker_id || '',
                    order_id: event.order_id || '',
                    reason: this.operationReason(event),
                    displayReason: this.humanReason(this.operationReason(event)) || 'No additional explanation was published.',
                    payload: event.payload,
                    count: 1,
                })
            }
            for (const [index, decision] of this.decisions.entries()) {
                if (!decision) continue
                const presentation = strategyDecisionPresentation(decision, this.runtimeSemantics.mode.raw)
                rows.push({
                    id: `decision:${decision.decision_id || index}`,
                    type: 'decision',
                    ts_ms: decision.decision_ts_ms,
                    source: 'decision',
                    kind: decision.outcome || 'unknown',
                    displayKind: presentation.label,
                    ticker_id: decision.ticker_id || '',
                    order_id: '',
                    reason: this.decisionReason(decision),
                    displayReason: presentation.detail,
                    payload: decision,
                    count: 1,
                })
            }
            return rows.sort((a, b) => (Number(b.ts_ms) || 0) - (Number(a.ts_ms) || 0))
        },
        activitySources() { return Array.from(new Set(this.activityBaseRows.map(({ source }) => source))).sort() },
        activityKinds() { return Array.from(new Set(this.activityBaseRows.map(({ kind }) => kind))).sort() },
        activityTickers() {
            return Array.from(new Set(this.activityBaseRows.map(({ ticker_id }) => ticker_id).filter(Boolean))).sort()
        },
        filteredActivityRows() {
            const filtered = this.activityBaseRows.filter((row) =>
                (!this.activitySource || row.source === this.activitySource) &&
                (!this.activityKind || row.kind === this.activityKind) &&
                (!this.activityTicker || row.ticker_id === this.activityTicker))
            const grouped = []
            for (const row of filtered) {
                const previous = grouped[grouped.length - 1]
                const sameDecision = previous && row.type === 'decision' && previous.type === 'decision' &&
                    previous.kind === row.kind && previous.ticker_id === row.ticker_id &&
                    previous.reason === row.reason
                if (sameDecision) previous.count += 1
                else grouped.push({ ...row })
            }
            return grouped
        },
        activityRows() { return this.filteredActivityRows.slice(0, this.activityVisibleLimit) },
        activityHasMore() { return this.activityRows.length < this.filteredActivityRows.length },
        lifecycleIntervals() {
            return (this.operations.lifecycleIntervals || []).filter((interval) =>
                (!this.activitySource || interval.source === this.activitySource) &&
                (!this.activityTicker || interval.ticker_id === this.activityTicker))
        },
    },
    watch: {
        activeRuntimeId() {
            this.approvalStatement = ''
            this.adminValidation = ''
            this.adminIdempotencyKey = ''
            this.selectedLifecycleProfileId = ''
        },
        lifecycleProfiles: {
            immediate: true,
            handler(profiles) {
                if (!Array.isArray(profiles) || !profiles.length) {
                    this.selectedLifecycleProfileId = ''
                    return
                }
                if (profiles.some((profile) =>
                    profile && profile.profile_id === this.selectedLifecycleProfileId)) return
                const preferred = profiles.find((profile) => profile && !profile.active && profile.launch_ready) ||
                    profiles.find((profile) => profile && !profile.active) || profiles[0]
                this.selectedLifecycleProfileId = preferred && preferred.profile_id || ''
            },
        },
        operationPreview() { this.approvalStatement = '' },
        activitySource() { this.activityVisibleLimit = ACTIVITY_RENDER_BATCH },
        activityKind() { this.activityVisibleLimit = ACTIVITY_RENDER_BATCH },
        activityTicker() { this.activityVisibleLimit = ACTIVITY_RENDER_BATCH },
    },
    methods: {
        setActiveTab(id) {
            if (!TABS.some((tab) => tab.id === id)) return
            this.activeTab = id
            try { window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, id) } catch (_error) { /* no storage */ }
        },
        onTaskTabKeydown(event, index) {
            let next = index
            if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
            else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
            else if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = TABS.length - 1
            else return
            event.preventDefault()
            this.setActiveTab(TABS[next].id)
            this.$nextTick(() => {
                const tabs = this.$refs.taskTabs
                if (Array.isArray(tabs) && tabs[next]) tabs[next].focus()
            })
        },
        overlayEnabled(kind) { return this.overlayVisibility[kind] !== false },
        // Jump to the runtime's verified universe backtest run + selected candidate
        // (the App opens the Backtests dock and drills into that run_index).
        openLineage() {
            const l = this.lineageLink
            if (l) this.$emit('open-lineage-run', { run_id: l.runId, run_index: l.runIndex })
        },
        openBalanceHistory() {
            if (!this.selectedRuntime) return
            this.$emit('view-balance', {
                runtime_id: this.selectedRuntime.runtime_id,
                strategy_name: this.selectedStrategyName,
            })
        },
        parseAllocationPolicy() {
            try {
                const policy = JSON.parse(this.allocationPolicyJson)
                if (!policy || typeof policy !== 'object' || Array.isArray(policy)) throw new Error('object required')
                return policy
            } catch (_error) {
                this.adminValidation = 'Policy JSON must contain one valid policy object.'
                return null
            }
        },
        compareAllocationPolicy() {
            this.adminValidation = ''
            if (!this.administrationEnabled) return
            const policy = this.parseAllocationPolicy()
            if (!policy) return
            this.$emit('compare-allocation', {
                as_of_ms: this.nowMs,
                expires_at_ms: this.nowMs + 300000,
                policies: [policy],
                candidate_performance: [],
            })
        },
        administrationIdentity() {
            const actor = String(this.adminActor || '').trim()
            const reason = String(this.adminReason || '').trim()
            if (!actor || !reason) {
                this.adminValidation = 'Actor and visible reason are required.'
                return null
            }
            let idempotencyKey = String(this.adminIdempotencyKey || '').trim()
            if (!idempotencyKey) {
                idempotencyKey = `web-${this.activeRuntimeId}-${this.nowMs}`
                this.adminIdempotencyKey = idempotencyKey
            }
            return { actor, idempotency_key: idempotencyKey, reason }
        },
        lifecycleIdentity() {
            if (!this.administrationEnabledFlag) {
                this.adminValidation = 'Strategy administration is disabled by the rollout flag.'
                return null
            }
            if (!this.operations.projectionRevision) {
                this.adminValidation = 'No authoritative operations projection revision is available.'
                return null
            }
            return this.administrationIdentity()
        },
        previewRuntimeStop() {
            this.adminValidation = ''
            const status = this.lifecycleData
            const identity = this.lifecycleIdentity()
            if (!identity) return
            if (!status || !status.stop_available || !status.observed_pid) {
                this.adminValidation = status && status.stop_unavailable_reason ||
                    'The strategy process cannot be verified for stopping.'
                return
            }
            this.$emit('preview-operation', {
                ...identity,
                expected_revision: this.operations.projectionRevision,
                expires_at_ms: this.nowMs + 300000,
                operation: {
                    type: 'stop_runtime', expected_pid: Number(status.observed_pid),
                    reason: identity.reason,
                },
            })
        },
        previewRuntimeProfile() {
            this.adminValidation = ''
            const status = this.lifecycleData
            const profile = this.selectedLifecycleProfile
            const identity = this.lifecycleIdentity()
            if (!identity) return
            if (!status || !profile) {
                this.adminValidation = 'Select a server-approved launch mode.'
                return
            }
            if (profile.active) {
                this.adminValidation = 'That launch mode is already active.'
                return
            }
            if (!profile.launch_ready) {
                this.adminValidation = (profile.blockers || []).join(' · ') ||
                    'The selected launch mode is not ready.'
                return
            }
            const common = {
                profile_id: profile.profile_id,
                profile_revision: profile.profile_revision,
                reason: identity.reason,
            }
            const operation = status.observed_pid
                ? { type: 'switch_runtime_profile', expected_pid: Number(status.observed_pid), ...common }
                : { type: 'launch_runtime_profile', ...common }
            this.$emit('preview-operation', {
                ...identity,
                expected_revision: this.operations.projectionRevision,
                expires_at_ms: this.nowMs + 300000,
                operation,
            })
        },
        previewPolicyProposal(proposal) {
            this.adminValidation = ''
            if (!this.administrationEnabled || !this.allocationComparison) return
            if (Number(this.allocationComparison.expires_at_ms) <= this.nowMs) {
                this.adminValidation = 'The comparison has expired. Compare the policy again.'
                return
            }
            const identity = this.administrationIdentity()
            const policy = proposal && proposal.input && proposal.input.policy
            if (!identity || !policy) return
            this.$emit('preview-operation', {
                ...identity,
                expected_revision: this.allocationComparison.projection_revision,
                expires_at_ms: this.nowMs + 300000,
                operation: { type: 'approve_automatic_allocation_policy', policy, reason: identity.reason },
            })
        },
        automaticAllocationScope() {
            if (this.allocationScope === 'global') return { scope: 'global' }
            if (this.allocationScope === 'wallet') {
                const accountId = String(this.allocationAccountId ||
                    (this.selectedRuntime && this.selectedRuntime.allocation_account_id) || '').trim()
                if (!accountId) { this.adminValidation = 'Wallet scope requires an account_id.'; return null }
                return { scope: 'wallet', account_id: accountId }
            }
            const strategyInstanceId = String(this.allocationStrategyInstanceId ||
                (this.selectedRuntime && this.selectedRuntime.strategy_instance_id) || '').trim()
            if (!strategyInstanceId) {
                this.adminValidation = 'Strategy scope requires a strategy_instance_id.'
                return null
            }
            return { scope: 'strategy', strategy_instance_id: strategyInstanceId }
        },
        previewAllocationToggle() {
            this.adminValidation = ''
            if (!this.administrationEnabled) return
            if (!this.operations.projectionRevision) {
                this.adminValidation = 'No authoritative operations projection revision is available.'
                return
            }
            const identity = this.administrationIdentity()
            const scope = this.automaticAllocationScope()
            if (!identity || !scope) return
            this.$emit('preview-operation', {
                ...identity,
                expected_revision: this.operations.projectionRevision,
                expires_at_ms: this.nowMs + 300000,
                operation: {
                    type: 'set_automatic_allocation_enabled', scope,
                    enabled: this.allocationDesiredState === 'enabled', reason: identity.reason,
                },
            })
        },
        approvePreview() {
            this.adminValidation = ''
            if (!this.approvalReady) return
            this.$emit('approve-operation', { approval_statement: this.approvalStatement })
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
        strategyName(runtime) { return strategyDisplayName(runtime) },
        runtimeStatusLabel(status) {
            if (!status || !status.known) return 'Status unknown'
            return status.ready ? 'Healthy' : 'Needs attention'
        },
        humanReason(reason) { return humanizeStrategyReason(reason, this.runtimeSemantics.mode.raw) },
        decisionSummary(decision) {
            return strategyDecisionPresentation(decision, this.runtimeSemantics.mode.raw)
        },
        activityKindLabel(kind) {
            const presentation = strategyDecisionPresentation({ outcome: kind }, this.runtimeSemantics.mode.raw)
            return presentation.label
        },

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
        operationReason(event) {
            const payload = event && event.payload
            if (!payload || typeof payload !== 'object') return '—'
            const data = payload.data || (payload.event && payload.event.data) || {}
            return payload.reason || payload.detail || data.reason || data.detail || '—'
        },
        prettyPayload(payload) {
            try { return JSON.stringify(payload, null, 2) } catch (_error) { return String(payload) }
        },
        lifecycleKey(interval) {
            return [interval.source, interval.ticker_id || '', interval.state, interval.start_ms].join(':')
        },
        lifecycleClass(state) {
            const value = String(state || '').toLowerCase()
            return value.includes('degrad') || value.includes('halt') || value.includes('error')
                ? 'sts-attention' : 'sts-muted-grey'
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
.sr { display: flex; flex-direction: column; height: 100%; min-height: 0; color: #d1d4dc; font-size: 12px; }

/* Maximized = fleet pane + task detail pane. Each pane owns its own scroll;
   compact mode keeps the fleet to one glanceable row above the detail. */
.sr.maximized { display: grid; grid-template-columns: minmax(260px, 30%) minmax(0, 1fr);
                grid-template-rows: auto auto auto auto minmax(0, 1fr);
                grid-template-areas: "fleet tabs" "fleet error" "fleet status" "fleet controls" "fleet body"; }
.sr.maximized .sr-tabs { grid-area: tabs; min-width: 0; }
.sr.maximized .sr-error { grid-area: error; }
.sr.maximized .sr-status-banner { grid-area: status; min-width: 0; }
.sr.maximized .sr-hier { grid-area: fleet; min-height: 0; max-height: none; overflow: auto;
                         border-right: 1px solid #1c212e; border-bottom: 0; }
.sr.maximized .sr-controls { grid-area: controls; min-width: 0; }
.sr.maximized .sr-body { grid-area: body; min-width: 0; }
.sr.maximized .sr-empty { grid-column: 1 / -1; grid-row: 2 / -1; }
.sr.maximized.single-runtime { grid-template-columns: minmax(0, 1fr);
                               grid-template-areas: "tabs" "error" "status" "controls" "body"; }
.sr:not(.maximized) .sr-hier { max-height: 88px; }
.sr:not(.maximized) .sr-rt-children { display: none; }
.sr:not(.maximized) .sr-proc-head { padding-top: 0; }

/* Tab bar */
.sr-tabs { display: flex; align-items: stretch; gap: 2px; padding: 0 8px; overflow-x: auto;
           border-bottom: 1px solid #1c212e; background: #121827; }
.sr-tab { background: none; border: none; border-bottom: 2px solid transparent; color: #808a9d; font-size: 12px;
          padding: 9px 10px; cursor: pointer; white-space: nowrap; }
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

/* Selected strategy: capability first, then clearly named health/freshness. */
.sr-status-banner { display: flex; flex-direction: column; align-items: stretch; gap: 5px; padding: 10px 12px;
                    border-bottom: 1px solid #1c212e; background: #0f1521; }
.sr-status-identity { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.sr-strategy-name { color: #fff; font-size: 15px; font-weight: 700; }
.sr-status-mode { color: #79b8ff; font-size: 10px; font-weight: 700; text-transform: uppercase;
                  padding: 2px 7px; border: 1px solid rgba(88,166,255,0.38); border-radius: 9px;
                  background: rgba(88,166,255,0.12); }
.sr-status-mode.mode-paper { color: #b0b6c0; border-color: #3b4352; background: #202735; }
.sr-status-mode.mode-live { color: #ff9f40; border-color: rgba(255,159,64,0.45); background: rgba(255,159,64,0.1); }
.sr-balance-open { color: #c8d3e2; background: #202735; border: 1px solid #465167;
  border-radius: 4px; padding: 3px 8px; font-size: 10px; cursor: pointer; }
.sr-balance-open:hover { color: #fff; border-color: #79b8ff; background: #26334a; }
.sr-status-description { color: #b0b6c0; line-height: 1.45; }
.sr-status-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; color: #6f7989; font-size: 11px; }
.sr-service-health { font-weight: 600; }
.sr-status-fresh { font-size: 11px; }
.sr-identity-confirmed { color: #8b95a5; }
.sr-status-reason { color: #ff9f40; font-size: 11px; line-height: 1.4; }
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
.sr-rt:hover { border-color: #58a6ff; }
.sr-rt.active { border-color: #58a6ff; box-shadow: inset 3px 0 0 #58a6ff; background: rgba(88,166,255,0.08); }
.sr-rt-id { font-weight: 700; color: #fff; }
.sr-rt-strategy { color: #fff; font-weight: 700; }
.sr-rt-inst { color: #5c6470; font-size: 11px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-rt-name { color: #fff; font-weight: 700; text-transform: none; letter-spacing: 0; font-size: 12px; }
.sr-viewing { color: #79b8ff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
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
.sr-lineage-source { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 10px;
                     border: 1px solid rgba(88,166,255,0.35); border-radius: 5px; padding: 9px 10px;
                     background: rgba(88,166,255,0.07); }
.sr-lineage-source.unavailable { border-color: #2a2e39; background: #0e1320; }
.sr-lineage-source-title { margin-top: 2px; color: #d1d4dc; font-weight: 700; }
.sr-lineage-source-meta { margin-top: 2px; color: #808a9d; font-size: 11px; }
.sr-lasterr { margin-top: 8px; color: #e07a85; background: rgba(229,65,80,0.08); border: 1px solid rgba(229,65,80,0.3); border-radius: 4px; padding: 6px 8px; }
.sr-reasons { margin: 6px 0 0; padding: 0 0 0 18px; color: #f5c518; font-size: 11px; }
.sr-lin-reasons { margin-top: 6px; }
.sr-lin-reason { color: #808a9d; font-size: 11px; padding: 1px 0; }
.sr-recent-decision { display: grid; grid-template-columns: 120px minmax(120px, 180px) minmax(110px, auto) 1fr;
                      gap: 10px; align-items: baseline; padding: 5px 0; border-bottom: 1px solid #1c212e; }
.sr-decision-reason { color: #b0b6c0; max-width: 520px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-decision-reason.tone-attention { color: #ff9f40; }
.sr-technical { margin-top: 10px; padding-top: 7px; border-top: 1px solid #1c212e; color: #808a9d; }
.sr-technical summary { width: fit-content; color: #79b8ff; cursor: pointer; font-size: 11px; }
.sr-technical[open] summary { margin-bottom: 4px; }
.sr-ticker-card { display: grid; grid-template-columns: minmax(140px, 220px) auto auto minmax(180px, 1fr) auto;
                  align-items: center; gap: 10px; width: 100%; margin-top: 6px; padding: 8px 10px;
                  color: #d1d4dc; text-align: left; background: #0e1320; border: 1px solid #2a2e39;
                  border-radius: 4px; cursor: pointer; }
.sr-ticker-card:hover, .sr-ticker-card.active { border-color: #35a776; }
.sr-ticker-card-reason { color: #808a9d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-activity-filters { display: flex; flex-wrap: wrap; gap: 10px; padding: 8px 0; }
.sr-activity-filters label { display: flex; align-items: center; gap: 5px; color: #808a9d; font-size: 11px; }
.sr-activity-filters select { min-width: 120px; color: #d1d4dc; background: #131722; border: 1px solid #2a2e39;
                              border-radius: 3px; padding: 3px 6px; }
.sr-layer-toggles { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; padding: 5px 0 9px;
                    color: #808a9d; font-size: 11px; }
.sr-layer-toggles label { display: inline-flex; align-items: center; gap: 3px; color: #b0b6c0; cursor: pointer; }
.sr-lifecycle-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; padding: 7px;
                     border-left: 2px solid #58a6ff; background: rgba(88,166,255,0.05); }
.sr-lifecycle { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 11px; }
.sr-activity-row { display: grid; grid-template-columns: 120px 80px minmax(140px, 220px) minmax(120px, 180px) minmax(180px, 1fr) auto auto;
                   gap: 8px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid #1c212e; }
.sr-activity-source { color: #58a6ff; }
.sr-activity-kind { color: #b0b6c0; font-weight: 600; overflow-wrap: anywhere; }
.sr-payload { grid-column: 1 / -1; color: #808a9d; }
.sr-payload summary { cursor: pointer; }
.sr-payload pre { max-height: 240px; overflow: auto; padding: 8px; color: #b0b6c0; background: #0b0f18;
                  border: 1px solid #1c212e; white-space: pre-wrap; overflow-wrap: anywhere; }
.sr-load-more { margin-top: 10px; padding: 5px 10px; color: #d1d4dc; background: #131722;
                border: 1px solid #2a2e39; border-radius: 4px; cursor: pointer; }
.sr-load-more:hover { border-color: #35a776; }
.sr-json { margin: 7px 0; padding: 8px; color: #b0b6c0; background: #0b0f18; border: 1px solid #1c212e;
           white-space: pre-wrap; overflow-wrap: anywhere; }
.sr-money-totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 6px;
                   margin-top: 9px; }
.sr-money-total { display: flex; flex-direction: column; gap: 3px; padding: 7px 8px;
                  background: #0e1320; border: 1px solid #1c212e; border-radius: 3px; }
.sr-money-total .mono { color: #d1d4dc; font-size: 13px; }
.sr-valuation { margin-top: 12px; }
.sr-funding { margin-top: 10px; }
.sr-order-card { margin-top: 7px; padding: 8px; background: #0e1320; border: 1px solid #2a2e39; border-radius: 4px; }
.sr-order-card-head, .sr-order-counts { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.sr-order-counts { margin-top: 6px; }
.sr-order-forensic { display: grid; grid-template-columns: minmax(180px, 1fr) repeat(5, auto);
                     gap: 7px; margin-top: 7px; padding-top: 7px; border-top: 1px solid #2a2e39; font-size: 11px; }
.sr-order-forensic .sr-decision-reason { grid-column: 1 / -1; }
.sr-stale-forensics { border-left: 2px solid #e54150; padding-left: 9px; }
.sr-auto-raw { margin-top: 7px; }
.sr-admin-unavailable { border-left: 2px solid #808a9d; }
.sr-admin-workflow { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }
.sr-admin-form label, .sr-admin-identity label, .sr-admin-toggle label {
    display: flex; flex-direction: column; gap: 4px; color: #808a9d; font-size: 11px;
}
.sr-admin-policy { width: 100%; box-sizing: border-box; resize: vertical; padding: 8px;
                   color: #d1d4dc; background: #0b0f18; border: 1px solid #2a2e39;
                   border-radius: 4px; font: 11px/1.4 monospace; }
.sr-admin-policy:focus { outline: none; border-color: #35a776; }
.sr-admin-actions, .sr-proposal-head, .sr-admin-toggle, .sr-approval-entry {
    display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px; margin-top: 7px;
}
.sr-admin-identity { display: grid; grid-template-columns: repeat(3, minmax(150px, 1fr)); gap: 8px; }
.sr-sec > .sr-admin-identity { margin-top: 10px; }
.sr-admin-identity .sr-ctl-input { width: 100%; box-sizing: border-box; }
.sr-admin-toggle .sr-ctl-input { min-width: 150px; }
.sr-runtime-lifecycle { border-left: 2px solid #58a6ff; padding-left: 10px; }
.sr-lifecycle-profile { margin-top: 10px; padding: 9px; background: #0e1320;
                        border: 1px solid #2a2e39; border-radius: 4px; }
.sr-lifecycle-profile > label { display: flex; flex-direction: column; gap: 4px;
                               color: #808a9d; font-size: 11px; }
.sr-lifecycle-profile select { width: min(520px, 100%); }
.sr-lifecycle-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 9px; }
.sr-proposal { margin-top: 8px; padding: 8px; border: 1px solid #2a2e39;
               border-radius: 4px; background: #0e1320; }
.sr-proposal-head { margin-top: 0; align-items: center; }
.sr-proposal-allocations { margin: 8px 0; }
.sr-operation-preview { border-left: 2px solid #ff9f40; padding-left: 10px; }
.sr-operation-result { border-left: 2px solid #35a776; padding-left: 10px; }
.sr-approval-entry { align-items: center; }
.sr-approval-entry code { color: #ff9f40; padding: 5px 7px; background: #0b0f18;
                          border: 1px solid #2a2e39; overflow-wrap: anywhere; }
.sr-approval-entry input { flex: 1 1 260px; }
/* Verified-lineage → clickable link into the Backtests dock. */
.sr-lin-open { background: rgba(88,166,255,0.12); color: #58a6ff; border: 1px solid rgba(88,166,255,0.4);
               border-radius: 4px; padding: 2px 8px; font-size: 10px; cursor: pointer; white-space: nowrap; }
.sr-lin-open:hover { background: rgba(88,166,255,0.22); }
.sr-lin-link { background: none; border: none; padding: 0; color: #58a6ff; cursor: pointer; text-align: right;
               font: inherit; text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 2px; }
.sr-lin-link:hover { color: #79b8ff; }
.sr-prov { margin-top: 4px; color: #5c6470; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-prov .mono { color: #6b7686; }

@media (max-width: 760px) {
    .sr.maximized { display: flex; flex-direction: column; }
    .sr.maximized .sr-hier { max-height: 110px; border-right: 0; border-bottom: 1px solid #1c212e; }
    .sr-ticker-card { grid-template-columns: minmax(120px, 1fr) auto auto; }
    .sr-ticker-card-reason { grid-column: 1 / -1; }
    .sr-recent-decision { grid-template-columns: 100px minmax(100px, 1fr) auto; }
    .sr-recent-decision .sr-decision-reason { grid-column: 1 / -1; }
    .sr-activity-row { grid-template-columns: 100px minmax(80px, auto) minmax(120px, 1fr); }
    .sr-activity-row .sr-decision-reason, .sr-payload { grid-column: 1 / -1; }
    .sr-order-forensic { grid-template-columns: 1fr 1fr; }
    .sr-admin-identity { grid-template-columns: 1fr; }
}

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
