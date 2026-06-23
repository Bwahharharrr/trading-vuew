// indicator-catalog public parsers — edge/error branch coverage.
//
// Targets the marker-symbol rule parsers (markerSymbolRule / markerSymbolOf)
// plus the style/overlay/palette/colour helpers, focusing on the null gates,
// default-vs-override paths, id-truncation, and clamping branches that the
// scmr/crup feed tests don't exercise. Pure helpers → node environment.
import { describe, test, expect } from 'vitest'
import {
  markerSymbolRule,
  markerSymbolOf,
  styleToSettings,
  layerKindToOverlay,
  candleColorPalette,
  paletteColorOf,
  paletteLabelOf,
  hexToRgba,
  detectionBoxRule,
} from '../../src/helpers/feed/indicator-catalog.js'

describe('markerSymbolRule null gates', () => {
  test('null when style missing entirely', () => {
    expect(markerSymbolRule()).toBeNull()
    expect(markerSymbolRule(undefined)).toBeNull()
  })

  test('null when no marker_rule', () => {
    expect(markerSymbolRule({ value_field: 'sig', symbol_1: 'up' })).toBeNull()
  })

  test('null when marker_rule but no value_field', () => {
    expect(markerSymbolRule({ marker_rule: 'scmr', symbol_1: 'up' })).toBeNull()
  })

  test('null when no symbol_{id} even with color_{id}/placement_{id} present', () => {
    expect(markerSymbolRule({
      marker_rule: 'scmr', value_field: 'sig',
      color_1: '#fff', placement_1: 'above_candle',
    })).toBeNull()
  })
})

describe('markerSymbolRule scan + defaults + overrides', () => {
  test('scans symbol/color/placement into id-keyed maps; applies defaults', () => {
    const rule = markerSymbolRule({
      marker_rule: 'scmr_reversal', value_field: 'sig',
      symbol_1: 'up', symbol_2: 'dn',
      color_1: '#0f0',
      placement_1: 'below_candle',
    })
    expect(rule.rule).toBe('scmr_reversal')
    expect(rule.valueField).toBe('sig')
    expect(rule.symbols).toEqual({ 1: 'up', 2: 'dn' })
    expect(rule.colors).toEqual({ 1: '#0f0' })
    expect(rule.placements).toEqual({ 1: 'below_candle' })
    // defaults when omitted
    expect(rule.labelField).toBeNull()
    expect(rule.zeroValue).toBe('0')
    expect(rule.hideZero).toBe(true)
    expect(rule.aboveAnchor).toBe('candle_high')
    expect(rule.belowAnchor).toBe('candle_low')
  })

  test('honours zero_value / hide_zero / anchors / label_field overrides', () => {
    const rule = markerSymbolRule({
      marker_rule: 'scmr', value_field: 'sig', symbol_1: 'up',
      zero_value: '5', hide_zero: 'false',
      above_anchor: 'AH', below_anchor: 'BL', label_field: 'LF',
    })
    expect(rule.zeroValue).toBe('5')
    expect(rule.hideZero).toBe(false)
    expect(rule.aboveAnchor).toBe('AH')
    expect(rule.belowAnchor).toBe('BL')
    expect(rule.labelField).toBe('LF')
  })

  test('hide_zero boolean false also disables hideZero', () => {
    const rule = markerSymbolRule({
      marker_rule: 'scmr', value_field: 'sig', symbol_1: 'up', hide_zero: false,
    })
    expect(rule.hideZero).toBe(false)
  })
})

describe('markerSymbolOf', () => {
  const rule = markerSymbolRule({
    marker_rule: 'scmr', value_field: 'sig',
    symbol_1: 'up', color_1: '#0f0', placement_1: 'below_candle',
    symbol_3: 'star',
  })

  test('null for null/undefined/empty/non-numeric/unknown-id', () => {
    expect(markerSymbolOf(null, rule)).toBeNull()
    expect(markerSymbolOf(undefined, rule)).toBeNull()
    expect(markerSymbolOf('', rule)).toBeNull()
    expect(markerSymbolOf('abc', rule)).toBeNull()
    expect(markerSymbolOf('9', rule)).toBeNull() // no symbol_9
    expect(markerSymbolOf('1', null)).toBeNull() // no rule
  })

  test('null at zero value when hideZero, but resolves when hideZero false', () => {
    expect(markerSymbolOf('0', rule)).toBeNull()
    const show = markerSymbolRule({
      marker_rule: 'scmr', value_field: 'sig',
      symbol_0: 'zeroGlyph', hide_zero: 'false',
    })
    expect(markerSymbolOf('0', show)).toEqual({
      id: '0', glyph: 'zeroGlyph', color: null, placement: 'above_candle',
    })
  })

  test('truncates decimal value to integer id and returns full shape', () => {
    // 3.9 → id 3 → symbol_3='star', no color_3, no placement_3 → defaults
    expect(markerSymbolOf('3.9', rule)).toEqual({
      id: '3', glyph: 'star', color: null, placement: 'above_candle',
    })
  })

  test('returns color + placement from descriptor when present', () => {
    expect(markerSymbolOf('1', rule)).toEqual({
      id: '1', glyph: 'up', color: '#0f0', placement: 'below_candle',
    })
  })
})

describe('styleToSettings', () => {
  test('undefined → just the raw (empty) style echo', () => {
    expect(styleToSettings(undefined)).toEqual({ style: {} })
  })

  test('maps colour/colours-split/lineWidth and echoes raw style', () => {
    const raw = {
      color: 'red', colors: 'a, b ,c', line_width: '3',
      color_up: '#0f0', color_dw: '#f00', back_color: '#111', show_mid: '1',
    }
    const out = styleToSettings(raw)
    expect(out.color).toBe('red')
    expect(out.colors).toEqual(['a', 'b', 'c'])
    expect(out.lineWidth).toBe(3)
    expect(out.colorUp).toBe('#0f0')
    expect(out.colorDown).toBe('#f00') // color_dw alias
    expect(out.backColor).toBe('#111')
    expect(out.showMid).toBe(true)
    expect(out.style).toBe(raw) // raw echoed by reference
  })

  test('width is a fallback alias for lineWidth', () => {
    expect(styleToSettings({ width: '2' }).lineWidth).toBe(2)
  })

  test('color_down preferred and show_mid only true for true/1', () => {
    expect(styleToSettings({ color_down: '#abc' }).colorDown).toBe('#abc')
    expect(styleToSettings({ show_mid: 'true' }).showMid).toBe(true)
    expect(styleToSettings({ show_mid: '1' }).showMid).toBe(true)
    expect(styleToSettings({ show_mid: 'yes' }).showMid).toBe(false)
  })
})

describe('layerKindToOverlay', () => {
  test('line/diagnostic split on fieldCount', () => {
    expect(layerKindToOverlay('line', 1)).toBe('Spline')
    expect(layerKindToOverlay('line', 2)).toBe('Splines')
    expect(layerKindToOverlay('diagnostic', 1)).toBe('Spline')
    expect(layerKindToOverlay('diagnostic', 3)).toBe('Splines')
    // default fieldCount = 1
    expect(layerKindToOverlay('line')).toBe('Spline')
  })

  test('fixed overlay kinds', () => {
    expect(layerKindToOverlay('histogram')).toBe('Histogram')
    expect(layerKindToOverlay('band')).toBe('Channel')
    expect(layerKindToOverlay('box')).toBe('Zones')
    expect(layerKindToOverlay('marker')).toBe('Markers')
  })

  test('candle_color and unknown kinds → null', () => {
    expect(layerKindToOverlay('candle_color')).toBeNull()
    expect(layerKindToOverlay('totally_unknown')).toBeNull()
  })
})

describe('candleColorPalette edges', () => {
  test('null without color_field, and null with color_field but no color_{id}', () => {
    expect(candleColorPalette({ color_1: '#f00' })).toBeNull()       // no color_field
    expect(candleColorPalette({ color_field: 'cf' })).toBeNull()     // no color_{id}
  })

  test('collects color/label maps + label_field, ignoring unrelated keys', () => {
    const p = candleColorPalette({
      color_field: 'cf', label_field: 'lf',
      color_2: '#abc', label_2: 'Two',
      unrelated: 'x', color_field2: 'y',
    })
    expect(p).toEqual({
      colorField: 'cf', labelField: 'lf',
      colors: { 2: '#abc' }, labels: { 2: 'Two' },
    })
  })
})

describe('paletteColorOf / paletteLabelOf', () => {
  const p = candleColorPalette({
    color_field: 'cf', label_field: 'lf', color_2: '#abc', label_2: 'Two',
  })

  test('null for warmup values and unknown ids', () => {
    expect(paletteColorOf(null, p)).toBeNull()
    expect(paletteColorOf('', p)).toBeNull()
    expect(paletteColorOf('xx', p)).toBeNull() // non-finite
    expect(paletteColorOf('9', p)).toBeNull()  // no color_9
    expect(paletteLabelOf(null, p)).toBeNull()
    expect(paletteLabelOf('9', p)).toBeNull()
  })

  test('truncates fractional id before lookup and returns the value', () => {
    expect(paletteColorOf('2.7', p)).toBe('#abc')
    expect(paletteLabelOf('2.9', p)).toBe('Two')
  })
})

describe('hexToRgba', () => {
  test('expands #RGB then emits rgba; clamps alpha to [0,1]', () => {
    expect(hexToRgba('#0f8', 0.5)).toBe('rgba(0,255,136,0.5)')
    expect(hexToRgba('#00ff88', 1)).toBe('rgba(0,255,136,1)')
    expect(hexToRgba('#000000', -2)).toBe('rgba(0,0,0,0)') // clamp below 0
    expect(hexToRgba('#000000', 5)).toBe('rgba(0,0,0,1)')  // clamp above 1
  })

  test('non-finite alpha defaults to 1; non-hex passes through', () => {
    expect(hexToRgba('#000000', 'nope')).toBe('rgba(0,0,0,1)')
    expect(hexToRgba('red', 0.5)).toBe('red')
  })
})

describe('detectionBoxRule', () => {
  test('null when box_rule is not the detection rule', () => {
    expect(detectionBoxRule({ box_rule: 'other' })).toBeNull()
    expect(detectionBoxRule(undefined)).toBeNull()
  })

  test('prefers MTF field names over legacy fallbacks and keeps valid opacity', () => {
    const r = detectionBoxRule({
      box_rule: 'detection_zone_until_close_breaks',
      bull_open_field: 'tf_2h_bull_open', bull_field: 'legacy_bull',
      bear_open_field: 'tf_2h_bear_open', bear_field: 'legacy_bear',
      source_timeframe: '2h', source_timestamp_field: 'tf_2h_ts',
      fill_opacity: '0.4',
    })
    expect(r.bullField).toBe('tf_2h_bull_open')
    expect(r.bearField).toBe('tf_2h_bear_open')
    expect(r.sourceTimeframe).toBe('2h')
    expect(r.sourceTimestampField).toBe('tf_2h_ts')
    expect(r.fillOpacity).toBe(0.4) // valid (0,1] kept
  })

  test('legacy fallbacks when MTF fields absent; null source for base-tf', () => {
    const r = detectionBoxRule({
      box_rule: 'detection_zone_until_close_breaks',
      bull_field: 'lb', bear_field: 'rb',
    })
    expect(r.bullField).toBe('lb')
    expect(r.bearField).toBe('rb')
    expect(r.sourceTimeframe).toBeNull()
    expect(r.sourceTimestampField).toBeNull()
    // protocol-default field names + count/top/bottom maps
    expect(r.countFields).toEqual({ bull: 'bull_box_count', bear: 'bear_box_count' })
    expect(r.topFields).toEqual({ bull: 'bull_box_top', bear: 'bear_box_top' })
    expect(r.bottomFields).toEqual({ bull: 'bull_box_bottom', bear: 'bear_box_bottom' })
  })

  test('clamps out-of-range / non-finite fill_opacity to the 0.15 default', () => {
    const base = { box_rule: 'detection_zone_until_close_breaks' }
    expect(detectionBoxRule({ ...base, fill_opacity: '0' }).fillOpacity).toBe(0.15)
    expect(detectionBoxRule({ ...base, fill_opacity: '1.5' }).fillOpacity).toBe(0.15)
    expect(detectionBoxRule({ ...base, fill_opacity: 'x' }).fillOpacity).toBe(0.15)
    expect(detectionBoxRule(base).fillOpacity).toBe(0.15) // omitted
  })
})
