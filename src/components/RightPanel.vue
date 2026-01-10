<template>
    <div class="trading-vue-right-panel" :style="panelStyle">
        <div class="right-panel-content">
            <slot>
                <!-- Default content placeholder -->
                <div class="right-panel-placeholder">
                    Right Panel
                </div>
            </slot>
        </div>
    </div>
</template>

<script>
export default {
    name: 'RightPanel',
    props: ['width', 'height', 'colors'],
    computed: {
        panelStyle() {
            return {
                width: this.width + 'px',
                height: this.height + 'px',
                backgroundColor: this.colors?.back || '#1e222d',
                borderLeft: `1px solid ${this.colors?.scale || '#2a2e39'}`
            }
        }
    }
}
</script>

<style>
.trading-vue-right-panel {
    position: absolute;
    right: 0;
    top: 0;
    overflow: hidden;
    box-sizing: border-box;
}
.right-panel-content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
}
.right-panel-placeholder {
    padding: 10px;
    color: #888;
    font-size: 12px;
    text-align: center;
}
</style>
