
// Default theme tokens (Phase 4.x). These mirror the flat colorXxx prop
// defaults, surfaced as one object so consumers can start from the defaults and
// override a few keys:
//
//   import { defaultTheme } from 'trading-vue-js'
//   <trading-vue :theme="{ ...defaultTheme, candleUp: '#3fa' }" :data="dc" />
//
// (The flat colorXxx props remain as deprecated pass-throughs.)

export const defaultTheme = {
    title: '#42b883',
    back: '#121826',
    grid: '#2f3240',
    text: '#dedddd',
    textHL: '#fff',
    scale: '#838383',
    cross: '#8091a0',
    candleUp: '#23a776',
    candleDw: '#e54150',
    wickUp: '#23a77688',
    wickDw: '#e5415088',
    wickSm: 'transparent',
    volUp: '#23a77642',
    volDw: '#e5415042',
    panel: '#565c68',
    tbBorder: '#8282827d',
}

export default defaultTheme
