/**
 * Validate a Vue overlay component (Options object) against OverlayDefinition.
 * @param {any} comp - a component options object (has `.methods`, `.name`)
 * @returns {{ ok: boolean, diagnostics: import('../../types/diagnostics').Diagnostic[] }}
 *   ok:false => the overlay must not be registered (it would fail to render).
 */
export function validateOverlayComponent(comp: any): {
    ok: boolean;
    diagnostics: import("../../types/diagnostics").Diagnostic[];
};
