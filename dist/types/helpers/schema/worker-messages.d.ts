/**
 * Validate an inbound worker message envelope.
 * Returns { ok, diagnostics }. `ok:false` => caller should NOT dispatch it.
 * An unknown (but well-formed) type is a warning, not a hard error, so the
 * protocol can be extended without bricking older workers.
 *
 * @param {any} data - the `e.data` from onmessage
 */
export function validateWorkerMessage(data: any): {
    ok: boolean;
    diagnostics: any[];
};
export const DC_TO_WW_TYPES: Set<string>;
