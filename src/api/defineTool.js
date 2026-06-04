
// defineTool (Phase 4.1) — config-based DRAWING-TOOL authoring.
//
// A tool is an overlay that also declares a `tool()` descriptor (toolbar group,
// icon, hint, default data/settings) and mixes in the Tool mixin (pin/anchor
// interaction, delete handling). defineTool is defineOverlay + that wiring:
//
//   const MySeg = defineTool({
//     name: 'MySeg', type: 'MySeg', useFor: ['MySeg'],
//     hint: 'My segment', icon: '...png',
//     draw(ctx, $) { ... },
//     init_tool() { ... },   // optional anchor/pin setup
//   })
//
// Returns a registry-compatible overlay component (legacy mixin authoring still
// works). Additive, non-breaking.

import Tool from '../mixins/tool.js'
import { defineOverlay } from './defineOverlay.js'

function assert(cond, msg) {
    if (!cond) {
        const e = new Error(`[trading-vue] defineTool: ${msg}`)
        e.code = 'tool.define'
        throw e
    }
}

/**
 * @param {object} def - everything defineOverlay accepts, plus:
 * @param {string} def.type   - tool type id (required)
 * @param {string} [def.group]- toolbar group
 * @param {string} [def.icon] - toolbar icon
 * @param {string} [def.hint] - tooltip
 * @param {Array}  [def.data] @param {object} [def.settings] @param {object} [def.mods]
 * @param {Function} [def.init_tool] - anchor/pin setup
 */
export function defineTool(def) {
    assert(def && typeof def === 'object', 'expects a config object')
    assert(typeof def.type === 'string' && def.type, '`type` is required')

    if (!def.icon && typeof console !== 'undefined') {
        console.warn(`[trading-vue] defineTool("${def.type}"): no \`icon\` — ` +
            `the tool is registered but will NOT appear in the toolbar.`)
    }

    const toolDescriptor = {
        group: def.group || 'Custom',
        icon: def.icon,
        type: def.type,
        hint: def.hint || def.type,
        data: def.data || [],
        settings: def.settings || {},
        ...(def.mods ? { mods: def.mods } : {}),
    }

    // CRITICAL: the Tool mixin's own `init_tool` is the SOLE home of the
    // pin/drag/select/delete wiring — overriding it makes the tool inert. So
    // author pin/anchor setup must run through `init` (called AFTER the mixin's
    // init_tool), never by replacing init_tool. We accept def.init_tool for
    // ergonomics but route it to `init` (composed with any def.init) + warn.
    let init = def.init
    if (def.init_tool) {
        if (typeof console !== 'undefined') {
            console.warn(`[trading-vue] defineTool("${def.type}"): use \`init\` ` +
                `for pin/anchor setup, not \`init_tool\` (which would override the ` +
                `Tool mixin's drag/select/delete wiring). Routing it to \`init\`.`)
        }
        const userInit = def.init
        const userInitTool = def.init_tool
        init = function () {
            if (userInit) userInit.call(this)
            userInitTool.call(this)
        }
    }

    return defineOverlay({
        ...def,
        init_tool: undefined,
        init,
        // A tool renders for its own type by default.
        useFor: def.useFor || [def.type],
        tool: toolDescriptor,
        mixins: [Tool, ...(def.mixins || [])],
        methods: { ...(def.methods || {}) },
    })
}

export default defineTool
