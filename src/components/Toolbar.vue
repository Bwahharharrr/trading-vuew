
<template>
    <div class="trading-vue-toolbar" :style="styles"
        :key="tool_count">
        <template v-for="(tool, i) in groups" :key="i">
            <toolbar-item
                v-if="tool.icon && !tool.hidden"
                @item-selected="selected"
                :data="tool"
                :subs="sub_map"
                :dc="data"
                :config="config"
                :colors="colors"
                :selected="is_selected(tool)">
            </toolbar-item>
        </template>
    </div>
</template>

<script>

import ToolbarItem from './ToolbarItem.vue'

export default {
    name: 'Toolbar',
    props: [
        'data', 'height', 'colors', 'tv_id', 'config'
    ],
    components: { ToolbarItem },
    mounted() {
    },
    methods: {
        selected(tool) {
            this.$emit('custom-event', {
                event:'tool-selected', args: [tool.type]
            })
            if (tool.group) {
                // TODO: emit the sub map to DC (save)
                this.sub_map[tool.group] = tool.type
            }
        },
        is_selected(tool) {
            if (tool.group) {
                return !!tool.items.find(
                    x => x.type === this.data.tool)
            }
            return tool.type === this.data.tool
        }
    },
    computed: {
        styles() {
            let colors = this.$props.colors
            let b = this.$props.config.TB_BORDER
            let w = this.$props.config.TOOLBAR - b
            let c = colors.grid
            let cb = colors.tbBack || colors.back
            let brd = colors.tbBorder || colors.scale
            let st = this.$props.config.TB_B_STYLE
            return {
                'width': `${w}px`,
                'height': `${this.$props.height-3}px`,
                'background-color': cb,
                'border-right': `${b}px ${st} ${brd}`
            }
        },
        groups() {
            let arr = []
            for (var tool of this.data.tools || []) {
                if (!tool.group) {
                    arr.push(tool)
                    continue
                }
                let g = arr.find(x => x.group === tool.group)
                if (!g) {
                    arr.push({
                        group: tool.group,
                        icon: tool.icon,
                        items: [tool]
                    })
                } else {
                    g.items.push(tool)
                }
            }
            return arr
        }
    },
    watch: {
        // PERFORMANCE: Watch only tools.length instead of deep watching entire data object
        toolsLength(newLen) {
            this.tool_count = newLen
        }
    },
    computed: {
        // PERFORMANCE: Computed property for tools length - avoids deep watch
        toolsLength() {
            return this.data?.tools?.length ?? 0
        }
    },
    data() { return { tool_count: 0, sub_map: {} } }
}

</script>

<style>
.trading-vue-toolbar {
    position: absolute;
    border-right: 1px solid black;
    z-index: 101;
    padding-top: 3px;
    user-select: none;
}
</style>
