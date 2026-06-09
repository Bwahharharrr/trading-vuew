// Shared constants for the auto-managed "detached volume" overlay.
//
// Kept in its own module (not Chart.vue) so the Legend can import the marker
// without closing a Chart -> Section -> Legend -> Chart import cycle.

// Settings marker on the auto-managed "detached volume" offchart overlay.
// Survives DataCube.update_ids() (which rewrites .id), so it reliably tags the
// overlay the legend detach toggle created — never a user-added Volume indicator.
export const VOLUME_LEGEND_FLAG = '$volumeLegend'

// Detached-pane volume colours: SOLID. The candle-pane copy keeps its
// intentional ~26% translucency (so volume reads behind the candle bodies),
// but once volume owns its own pane it should render solid.
export const VOLUME_SOLID_UP = '#23a776'
export const VOLUME_SOLID_DW = '#e54150'

// Default visual style for the detached volume bars.
// One of: 'Bar' | 'Histogram' | 'Spline' | 'StepLine'.
export const VOLUME_DEFAULT_STYLE = 'Bar'

// Visual styles that draw a line of the volume series (vs. bars).
export const VOLUME_LINE_STYLES = ['Spline', 'StepLine']
