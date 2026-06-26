// Shared "open in a new chart tab" gesture detection.
//
// A plain click loads into the ACTIVE chart tab; ⌘/Ctrl-click or middle-click
// opens the load in a NEW tab — the browser-tab idiom, with no single-vs-double
// click timing tax. Used by the discovery panel, the positions dock, and the
// search-results dock so the gesture is identical everywhere.
export function newTabIntent(ev) {
    return !!(ev && (ev.metaKey || ev.ctrlKey || ev.button === 1))
}
