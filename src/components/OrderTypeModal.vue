<template>
<!-- No @click.self close on the overlay: a stray click outside the dialog must
     NOT dismiss it (explicit Cancel / ✕ only). -->
<div class="order-modal-overlay">
    <div class="order-modal">
        <div class="modal-header">
            <span class="modal-title">Order Type</span>
            <button class="modal-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="type-buttons">
                <button class="type-btn" @click="$emit('select', 'scaled')">
                    <span class="type-icon" v-html="scaledIcon"></span>
                    <span class="type-name">Scaled</span>
                </button>
                <!-- Distribution: placeholder, not implemented yet (does nothing). -->
                <button class="type-btn soon" type="button" @click="noop">
                    <span class="type-icon" v-html="distIcon"></span>
                    <span class="type-name">Distribution</span>
                    <span class="soon-tag">soon</span>
                </button>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-cancel" @click="$emit('close')">Cancel</button>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'OrderTypeModal',
    props: { geometry: { type: Object, default: null } },
    emits: ['select', 'close'],
    data() {
        return {
            scaledIcon: '<svg viewBox="0 0 24 24" width="26" height="26"><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2"/></svg>',
            distIcon: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 20 Q 8 4, 12 4 T 21 20" stroke="currentColor" fill="none" stroke-width="2"/></svg>'
        }
    },
    methods: {
        noop() { /* Distribution order type — not implemented yet */ }
    }
}
</script>

<style scoped>
.order-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
}
.order-modal {
    background: #1e222d; border: 1px solid #2a2e39; border-radius: 8px;
    min-width: 300px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 15px 20px; border-bottom: 1px solid #2a2e39;
}
.modal-title { color: #d1d4dc; font-size: 14px; font-weight: 600; }
.modal-close { background: none; border: none; color: #808a9d; font-size: 20px; cursor: pointer; line-height: 1; }
.modal-close:hover { color: #d1d4dc; }
.modal-body { padding: 20px; }
.type-buttons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.type-btn {
    position: relative;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 18px 10px; background: #131722; border: 1px solid #2a2e39;
    border-radius: 6px; color: #808a9d; cursor: pointer;
}
.type-btn:hover { border-color: #35a776; color: #d1d4dc; }
.type-btn.soon { cursor: default; opacity: 0.55; }
.type-btn.soon:hover { border-color: #2a2e39; color: #808a9d; }
.type-name { font-size: 12px; }
.soon-tag {
    position: absolute; top: 6px; right: 6px; font-size: 9px;
    text-transform: uppercase; letter-spacing: 0.5px; color: #565c68;
}
.modal-footer { display: flex; justify-content: flex-end; padding: 15px 20px; border-top: 1px solid #2a2e39; }
.btn-cancel { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; border: 1px solid #2a2e39; background: #131722; color: #d1d4dc; }
</style>
