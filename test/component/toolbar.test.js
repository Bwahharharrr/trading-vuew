// @vitest-environment jsdom
// Toolbar.vue + ItemList.vue — the drawing-tool toolbar (3% covered). Toolbar
// groups tools and tracks selection; ItemList is the fly-out sub-menu.
import { test, expect, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import Toolbar from '../../src/components/Toolbar.vue'
import ItemList from '../../src/components/ItemList.vue'

const CONFIG = { TB_BORDER: 1, TOOLBAR: 57, TB_B_STYLE: 'solid', TB_ICON: 25, TB_ITEM_M: 4 }
const COLORS = { grid: '#222', back: '#111', scale: '#333' }

const TOOLS = [
  { type: 'Cursor', icon: 'c' },
  { type: 'LineTool:seg', group: 'Lines', icon: 'l' },
  { type: 'LineTool:ray', group: 'Lines', icon: 'r' },
]

describe('Toolbar', () => {
  function mountTB(data = { tools: TOOLS, tool: 'Cursor' }) {
    return mount(Toolbar, {
      props: { data, height: 400, colors: COLORS, tv_id: 'tv', config: CONFIG },
      global: { stubs: { ToolbarItem: true } }, // isolate Toolbar's own logic
    })
  }

  test('groups collapses same-group tools into one entry with items[]', () => {
    const w = mountTB()
    const g = w.vm.groups
    expect(g).toHaveLength(2)              // Cursor + Lines group
    expect(g[0].type).toBe('Cursor')
    expect(g[1].group).toBe('Lines')
    expect(g[1].items).toHaveLength(2)
    expect(w.vm.toolsLength).toBe(3)
  })

  test('is_selected matches a plain tool or any member of a group', () => {
    const w = mountTB({ tools: TOOLS, tool: 'LineTool:ray' })
    const g = w.vm.groups
    expect(w.vm.is_selected(g[0])).toBe(false)   // Cursor not active
    expect(w.vm.is_selected(g[1])).toBe(true)    // a Lines member is active
  })

  test('selected() emits tool-selected and records the group sub-choice', () => {
    const w = mountTB()
    w.vm.selected({ type: 'LineTool:ray', group: 'Lines' })
    const ev = w.emitted('custom-event').pop()[0]
    expect(ev).toEqual({ event: 'tool-selected', args: ['LineTool:ray'] })
    expect(w.vm.sub_map.Lines).toBe('LineTool:ray')
  })

  test('styles derive width/height/border from config', () => {
    const w = mountTB()
    expect(w.vm.styles.width).toBe('56px')        // TOOLBAR - TB_BORDER
    expect(w.vm.styles.height).toBe('397px')      // height - 3
  })
})

describe('ItemList (fly-out sub-menu)', () => {
  function mountIL(dc = { tool: 'LineTool:seg' }) {
    return mount(ItemList, {
      props: {
        config: CONFIG, colors: COLORS, dc,
        items: [{ type: 'LineTool:seg', icon: 's' }, { type: 'LineTool:ray', icon: 'r' }],
      },
      attachTo: document.body,
    })
  }

  test('item_click emits item-selected + close-list and stops bubbling', () => {
    const w = mountIL()
    const e = { cancelBubble: false }
    w.vm.item_click(e, { type: 'LineTool:ray' })
    expect(e.cancelBubble).toBe(true)
    expect(w.emitted('item-selected').pop()).toEqual([{ type: 'LineTool:ray' }])
    expect(w.emitted('close-list')).toBeTruthy()
    w.unmount()
  })

  test('item_class flags the currently-active tool', () => {
    const w = mountIL({ tool: 'LineTool:ray' })
    expect(w.vm.item_class({ type: 'LineTool:ray' })).toContain('selected-item')
    expect(w.vm.item_class({ type: 'LineTool:seg' })).not.toContain('selected-item')
    w.unmount()
  })

  test('a window mousedown closes the list', () => {
    const w = mountIL()
    w.vm.onmousedown()
    expect(w.emitted('close-list')).toBeTruthy()
    w.unmount()
  })
})
