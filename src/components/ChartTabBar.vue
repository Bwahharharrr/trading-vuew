<template>
<div class="chart-tab-bar">
    <div class="ctab-list">
        <div v-for="tab in tabs" :key="tab.id"
             class="ctab" :class="{ active: tab.id === activeId }"
             :title="tab.title"
             role="tab" tabindex="0" :aria-selected="tab.id === activeId ? 'true' : 'false'"
             @click="$emit('select', tab.id)"
             @keydown.enter.prevent="$emit('select', tab.id)"
             @keydown.space.prevent="$emit('select', tab.id)"
             @mousedown.middle.prevent="tabs.length > 1 && $emit('close', tab.id)">
            <span class="ctab-title">{{ tab.title }}</span>
            <button v-if="tabs.length > 1" class="ctab-close" title="Close tab"
                    @click.stop="$emit('close', tab.id)"
                    @mousedown.stop>×</button>
        </div>
    </div>
    <button class="ctab-add" :disabled="tabs.length >= max"
            :title="tabs.length >= max ? `Maximum ${max} chart tabs` : 'New chart tab'"
            @click="$emit('create')">+</button>
</div>
</template>

<script>
// Top-level chart tabs. Each tab is an independent chart (its own DataCube +
// symbol/timeframe). Presentational only — App owns the tab lifecycle
// (create/activate/close); this component just renders + emits intents.
// Middle-click a tab closes it (browser-tab idiom).
export default {
    name: 'ChartTabBar',
    props: {
        tabs: { type: Array, default: () => [] },
        activeId: { type: String, default: null },
        max: { type: Number, default: 8 },
    },
    emits: ['select', 'create', 'close'],
}
</script>

<style scoped>
.chart-tab-bar {
    display: flex; align-items: stretch; height: 34px; flex-shrink: 0;
    background: #0e1422; border-bottom: 1px solid #2a2e39; overflow: hidden;
}
.ctab-list { display: flex; align-items: stretch; overflow-x: auto; flex: 1 1 auto; }
.ctab {
    display: flex; align-items: center; gap: 6px; padding: 0 10px; max-width: 200px;
    border-right: 1px solid #2a2e39; cursor: pointer; color: #8b93a7;
    font: 12px/1 'JetBrains Mono', 'Menlo', monospace; white-space: nowrap; user-select: none;
}
.ctab:hover { background: #161d2e; color: #c4ccda; }
.ctab.active { background: #1b2336; color: #e6ebf2; box-shadow: inset 0 -2px 0 #35a776; }
.ctab-title { overflow: hidden; text-overflow: ellipsis; }
.ctab-close {
    border: 0; background: transparent; color: inherit; cursor: pointer;
    font-size: 14px; line-height: 1; padding: 0 2px; opacity: .55;
}
.ctab-close:hover { opacity: 1; color: #e54077; }
.ctab-add {
    border: 0; background: transparent; color: #8b93a7; cursor: pointer;
    font-size: 18px; width: 34px; flex-shrink: 0;
}
.ctab-add:hover:not(:disabled) { background: #161d2e; color: #35a776; }
.ctab-add:disabled { opacity: .3; cursor: default; }
</style>
