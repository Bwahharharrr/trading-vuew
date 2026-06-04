/** Short aria-label for the chart container. */
export function chartAriaLabel(dataCube: any, title?: string): string;
/** A longer text summary used as the screen-reader data fallback. */
export function chartDataSummary(dataCube: any, title?: string): string;
/** Whether the user requested reduced motion (false when unavailable). */
export function prefersReducedMotion(): boolean;
export const NAV_KEYS: Set<string>;
