(function() {	try {		if (typeof document != "undefined") {			var elementStyle = document.createElement("style");			elementStyle.appendChild(document.createTextNode(".trading-vue-ux-wrapper {\n        position: absolute;\n        display: flex;\n}\n.tvjs-ux-wrapper-pin {\n        position: absolute;\n        width: 9px;\n        height: 9px;\n        z-index: 100;\n        background-color: #23a776;\n        border-radius: 10px;\n        margin-left: -6px;\n        margin-top: -6px;\n        pointer-events: none;\n}\n.tvjs-ux-wrapper-head {\n        position: absolute;\n        height: 23px;\n        width: 100%;\n}\n.tvjs-ux-wrapper-close {\n        position: absolute;\n        width: 11px;\n        height: 11px;\n        font-size: 1.5em;\n        line-height: 0.5em;\n        padding: 1px 1px 1px 1px;\n        border-radius: 10px;\n        right: 5px;\n        top: 5px;\n        user-select: none;\n        text-align: center;\n        z-index: 100;\n}\n.tvjs-ux-wrapper-close-hb {\n}\n.tvjs-ux-wrapper-close:hover {\n        background-color: #FF605C !important;\n        color: #692324 !important;\n}\n.tvjs-ux-wrapper-full {\n}\n\n.t-vue-lbtn {\n    z-index: 100;\n    pointer-events: all;\n    cursor: pointer;\n}\n\n.t-vue-lbtn-grp {\n    margin-left: 0.5em;\n}\n\n.tvjs-spinner {\n    display: inline-block;\n    position: relative;\n    width: 20px;\n    height: 16px;\n    margin: -4px 0px -1px 0px;\n    opacity: 0.7;\n}\n.tvjs-spinner div {\n    position: absolute;\n    top: 8px;\n    width: 4px;\n    height: 4px;\n    border-radius: 50%;\n    animation-timing-function: cubic-bezier(1, 1, 1, 1);\n}\n.tvjs-spinner div:nth-child(1) {\n    left: 2px;\n    animation: tvjs-spinner1 0.6s infinite;\n    opacity: 0.9;\n}\n.tvjs-spinner div:nth-child(2) {\n    left: 2px;\n    animation: tvjs-spinner2 0.6s infinite;\n}\n.tvjs-spinner div:nth-child(3) {\n    left: 9px;\n    animation: tvjs-spinner2 0.6s infinite;\n}\n.tvjs-spinner div:nth-child(4) {\n    left: 16px;\n    animation: tvjs-spinner3 0.6s infinite;\n    opacity: 0.9;\n}\n@keyframes tvjs-spinner1 {\n0% {\n        transform: scale(0);\n}\n100% {\n        transform: scale(1);\n}\n}\n@keyframes tvjs-spinner3 {\n0% {\n        transform: scale(1);\n}\n100% {\n        transform: scale(0);\n}\n}\n@keyframes tvjs-spinner2 {\n0% {\n        transform: translate(0, 0);\n}\n100% {\n        transform: translate(7px, 0);\n}\n}\n\n.trading-vue-legend {\n    position: relative;\n    z-index: 100;\n    font-size: 1.25em;\n    margin-left: 10px;\n    pointer-events: auto;\n    text-align: left;\n    user-select: none;\n    font-weight: 300;\n    cursor: default;\n}\n@media (min-resolution: 2x) {\n.trading-vue-legend {\n        font-weight: 400;\n}\n}\n.trading-vue-ohlcv {\n    pointer-events: auto;\n    margin-bottom: 0.5em;\n}\n.t-vue-lspan {\n    font-variant-numeric: tabular-nums;\n    font-size: 0.95em;\n    color: #999999; /* TODO: move => params */\n    margin-left: 0.1em;\n    margin-right: 0.2em;\n}\n.t-vue-title {\n    margin-right: 0.25em;\n    font-size: 1.45em;\n}\n.t-vue-ind {\n    margin-left: 0.2em;\n    margin-bottom: 0.5em;\n    font-size: 1.0em;\n    margin-top: 0.3em;\n    display: flex;\n    align-items: center;\n    flex-wrap: wrap;\n    pointer-events: auto;\n}\n.t-vue-settings-btn {\n    background: none;\n    border: none;\n    color: #808a9d;\n    cursor: pointer;\n    padding: 2px 4px;\n    margin-left: 4px;\n    border-radius: 3px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    transition: all 0.15s ease;\n    position: relative;\n    z-index: 10;\n}\n.t-vue-settings-btn:hover {\n    color: #35a776;\n    background: rgba(53, 167, 118, 0.1);\n}\n.t-vue-settings-btn svg {\n    display: block;\n}\n.t-vue-close-btn {\n    background: none;\n    border: none;\n    color: #808a9d;\n    cursor: pointer;\n    padding: 2px 4px;\n    margin-left: 2px;\n    border-radius: 3px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    transition: all 0.15s ease;\n    position: relative;\n    z-index: 10;\n}\n.t-vue-close-btn:hover {\n    color: #e54077;\n    background: rgba(229, 64, 119, 0.1);\n}\n.t-vue-close-btn svg {\n    display: block;\n}\n.t-vue-ivalue {\n    margin-left: 0.5em;\n}\n.t-vue-unknown {\n    color: #999999; /* TODO: move => params */\n}\n.tvjs-appear-enter-active,\n.tvjs-appear-leave-active\n{\n    transition: all .25s ease;\n}\n.tvjs-appear-enter, .tvjs-appear-leave-to\n{\n    opacity: 0;\n}\n\n.trading-vue-section {\n    height: 0;\n    position: absolute;\n}\n\n.trading-vue-botbar {\n    position: relative !important;\n}\n\n.grid-resizer {\n    position: absolute;\n    height: 12px;\n    z-index: 1000;\n    cursor: row-resize;\n    pointer-events: all;\n}\n.resizer-line {\n    position: absolute;\n    top: 5px;\n    left: 0;\n    right: 0;\n    height: 3px;\n    background: #888;\n    pointer-events: none;\n    transition: background 0.15s ease, height 0.15s ease, top 0.15s ease;\n}\n.resizer-hitbox {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    pointer-events: all;\n}\n.grid-resizer:hover .resizer-line {\n    background: #7777ff !important;\n    height: 3px;\n    top: 4.5px;\n}\n.grid-resizer.dragging .resizer-line {\n    background: #9999ff !important;\n    height: 4px;\n    top: 4px;\n}\n\n.tvjs-item-list {\n    position: absolute;\n    user-select: none;\n    margin-top: -5px;\n}\n.tvjs-item-list-item {\n    display: flex;\n    align-items: center;\n    padding-right: 20px;\n    font-size: 1.15em;\n    letter-spacing: 0.05em;\n}\n.tvjs-item-list-item:hover {\n    background-color: #76878319;\n}\n.tvjs-item-list-item * {\n    position: relative !important;\n}\n\n.trading-vue-tbitem {\n}\n.trading-vue-tbitem:hover {\n    background-color: #76878319;\n}\n.trading-vue-tbitem-exp {\n    position: absolute;\n    right: -3px;\n    padding: 18.5px 5px;\n    font-stretch: extra-condensed;\n    transform: scaleX(0.6);\n    font-size: 0.6em;\n    opacity: 0.0;\n    user-select: none;\n    line-height: 0;\n}\n.trading-vue-tbitem:hover\n.trading-vue-tbitem-exp {\n    opacity: 0.5;\n}\n.trading-vue-tbitem-exp:hover {\n    background-color: #76878330;\n    opacity: 0.9 !important;\n}\n.trading-vue-tbicon {\n    position: absolute;\n}\n.trading-vue-tbitem.selected-item > .trading-vue-tbicon,\n.tvjs-item-list-item.selected-item > .trading-vue-tbicon {\n     filter: brightness(1.45) sepia(1) hue-rotate(90deg) saturate(4.5) !important;\n}\n.tvjs-pixelated {\n    -ms-interpolation-mode: nearest-neighbor;\n    image-rendering: -webkit-optimize-contrast;\n    image-rendering: -webkit-crisp-edges;\n    image-rendering: -moz-crisp-edges;\n    image-rendering: -o-crisp-edges;\n    image-rendering: pixelated;\n}\n\n\n.trading-vue-toolbar {\n    position: absolute;\n    border-right: 1px solid black;\n    z-index: 101;\n    padding-top: 3px;\n    user-select: none;\n}\n\n.tvjs-widgets {\n    position: absolute;\n    z-index: 1000;\n    pointer-events: none;\n}\n\n.tvjs-drift-enter-active {\n    transition: all .3s ease;\n}\n.tvjs-drift-leave-active {\n    transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);\n}\n.tvjs-drift-enter, .tvjs-drift-leave-to\n{\n    transform: translateX(10px);\n    opacity: 0;\n}\n.tvjs-the-tip {\n    position: absolute;\n    width: 200px;\n    text-align: center;\n    z-index: 10001;\n    color: #ffffff;\n    font-size: 1.5em;\n    line-height: 1.15em;\n    padding: 10px;\n    border-radius: 3px;\n    right: 70px;\n    top: 10px;\n    text-shadow: 1px 1px black;\n}\n\n/* Visually-hidden screen-reader content (a11y data fallback). */\n.tvjs-sr-only {\n    position: absolute;\n    width: 1px;\n    height: 1px;\n    padding: 0;\n    margin: -1px;\n    overflow: hidden;\n    clip: rect(0, 0, 0, 0);\n    white-space: nowrap;\n    border: 0;\n}\n/* Anit-boostrap tactix */\n.trading-vue *, ::after, ::before {\n    box-sizing: content-box;\n}\n.trading-vue img {\n    vertical-align: initial;\n}\n/*$vite$:1*/"));			document.head.appendChild(elementStyle);		}	} catch (e) {		console.error("vite-plugin-css-injected-by-js", e);	}})();
/*!
TradingVue.JS - v1.0.2
https://github.com/tvjsx/trading-vue-js
Copyright (c) 2019 C451 Code's All Right;
Licensed under the MIT license
*/
import { Fragment, Transition, createBlock, createCommentVNode, createElementBlock, createElementVNode, createTextVNode, createVNode, h, isReactive, isRef, markRaw, mergeProps, nextTick, normalizeClass, normalizeStyle, openBlock, ref, renderList, resolveComponent, resolveDynamicComponent, toDisplayString, toRaw, withCtx, withModifiers } from "vue";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
//#region src/stuff/constants.js
var DEF_LIMIT = 5;
var BUF_INC = 5;
var FDEFS = /(function |)([$A-Z_][0-9A-Z_$\.]*)[\s]*?\((.*?)\)/gim;
var FDEFS1 = /(function |)([$A-Z_][0-9A-Z_$\.]*)[\s]*?\((.*?\s*)\)/im;
var FDEFS2 = /(function |)([$A-Z_][0-9A-Z_$\.]*)[\s]*?\((.*\s*)\)/gims;
var SBRACKETS = /([$A-Z_][0-9A-Z_$\.]*)[\s]*?\[([^"^\[^\]]+?)\]/gim;
var TFSTR = /(\d+)(\w*)/gm;
var SECOND = 1e3;
var MINUTE$1 = SECOND * 60;
var MINUTE3 = MINUTE$1 * 3;
var MINUTE5 = MINUTE$1 * 5;
var MINUTE15$1 = MINUTE$1 * 15;
var MINUTE30 = MINUTE$1 * 30;
var HOUR$2 = MINUTE$1 * 60;
var HOUR4 = HOUR$2 * 4;
var HOUR12 = HOUR$2 * 12;
var DAY$2 = HOUR$2 * 24;
var WEEK$2 = DAY$2 * 7;
var MONTH$2 = WEEK$2 * 4;
var YEAR$2 = DAY$2 * 365;
var MONTHMAP$1 = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
var TIMESCALES$1 = [
	MINUTE$1,
	MINUTE$1 * 2,
	MINUTE5,
	MINUTE$1 * 10,
	MINUTE15$1,
	MINUTE30,
	HOUR$2,
	HOUR$2 * 1.5,
	HOUR$2 * 3,
	HOUR$2 * 6,
	HOUR$2 * 12,
	DAY$2,
	DAY$2 * 2,
	DAY$2 * 3,
	DAY$2 * 5,
	DAY$2 * 7,
	DAY$2 * 10,
	DAY$2 * 15,
	MONTH$2,
	MONTH$2 * 2,
	MONTH$2 * 3,
	MONTH$2 * 4,
	MONTH$2 * 6,
	YEAR$2,
	YEAR$2 * 2,
	YEAR$2 * 3,
	YEAR$2 * 5,
	YEAR$2 * 10
];
var $SCALES$1 = [
	.05,
	.1,
	.2,
	.25,
	.5,
	.8,
	1,
	2,
	5
];
var OVERLAY_COLORS = [
	"#42b28a",
	"#5691ce",
	"#612ff9",
	"#d50b90",
	"#ff2316"
];
var ChartConfig = {
	SBMIN: 60,
	SBMAX: Infinity,
	TOOLBAR: 57,
	RIGHTBAR: 250,
	TB_ICON: 25,
	TB_ITEM_M: 6,
	TB_ICON_BRI: 1,
	TB_ICON_HOLD: 420,
	TB_BORDER: 1,
	TB_B_STYLE: "dotted",
	TOOL_COLL: 7,
	EXPAND: .15,
	CANDLEW: .6,
	GRIDX: 100,
	GRIDY: 47,
	BOTBAR: 28,
	PANHEIGHT: 22,
	DEFAULT_LEN: 50,
	MINIMUM_LEN: 5,
	MIN_ZOOM: 25,
	MAX_ZOOM: 1e3,
	VOLSCALE: .15,
	UX_OPACITY: .9,
	ZOOM_MODE: "tv",
	L_BTN_SIZE: 21,
	L_BTN_MARGIN: "-6px 0 -6px 0",
	SCROLL_WHEEL: "prevent"
};
ChartConfig.FONT = `11px -apple-system,BlinkMacSystemFont,
    Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,
    Fira Sans,Droid Sans,Helvetica Neue,
    sans-serif`;
var constants_default = {
	DEF_LIMIT,
	BUF_INC,
	FDEFS,
	FDEFS1,
	FDEFS2,
	SBRACKETS,
	TFSTR,
	SECOND,
	MINUTE: MINUTE$1,
	MINUTE5,
	MINUTE15: MINUTE15$1,
	MINUTE30,
	HOUR: HOUR$2,
	HOUR4,
	DAY: DAY$2,
	WEEK: WEEK$2,
	MONTH: MONTH$2,
	YEAR: YEAR$2,
	MONTHMAP: MONTHMAP$1,
	TIMESCALES: TIMESCALES$1,
	$SCALES: $SCALES$1,
	ChartConfig,
	map_unit: {
		"1s": SECOND,
		"5s": SECOND * 5,
		"10s": SECOND * 10,
		"20s": SECOND * 20,
		"30s": SECOND * 30,
		"1m": MINUTE$1,
		"3m": MINUTE3,
		"5m": MINUTE5,
		"15m": MINUTE15$1,
		"30m": MINUTE30,
		"1H": HOUR$2,
		"2H": HOUR$2 * 2,
		"3H": HOUR$2 * 3,
		"4H": HOUR4,
		"6H": HOUR$2 * 6,
		"8H": HOUR$2 * 8,
		"12H": HOUR12,
		"1h": HOUR$2,
		"2h": HOUR$2 * 2,
		"3h": HOUR$2 * 3,
		"4h": HOUR4,
		"6h": HOUR$2 * 6,
		"8h": HOUR$2 * 8,
		"12h": HOUR12,
		"1D": DAY$2,
		"1d": DAY$2,
		"1W": WEEK$2,
		"1w": WEEK$2,
		"1M": MONTH$2,
		"1Y": YEAR$2
	},
	IB_TF_WARN: "When using IB mode you should specify timeframe ('tf' filed in 'chart' object),otherwise you can get an unexpected behaviour",
	OVERLAY_COLORS
};
//#endregion
//#region src/stuff/context.js
function Context($p) {
	let ctx = document.createElement("canvas").getContext("2d");
	ctx.font = $p.font;
	return ctx;
}
//#endregion
//#region node_modules/arrayslicer/lib/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Utils module
	*/
	/**
	* Check if an object is an array-like object
	*
	* @credit Javascript: The Definitive Guide, O'Reilly, 2011
	*/
	function isArrayLike(o) {
		if (o && typeof o === "object" && isFinite(o.length) && o.length >= 0 && o.length === Math.floor(o.length) && o.length < 4294967296) return true;
		else return false;
	}
	/**
	* Check for the existence of the sort function in the object
	*/
	function isSortable(o) {
		if (o && typeof o === "object" && typeof o.sort === "function") return true;
		else return false;
	}
	/**
	* Check for sortable-array-like objects
	*/
	module.exports.isSortableArrayLike = function(o) {
		return isArrayLike(o) && isSortable(o);
	};
}));
//#endregion
//#region node_modules/arrayslicer/lib/compare/index.js
var require_compare = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Utility compare functions
	*/
	module.exports = {
		/**
		* Compare two numbers.
		*
		* @param {Number} a
		* @param {Number} b
		* @returns {Number} 1 if a > b, 0 if a = b, -1 if a < b
		*/
		numcmp: function(a, b) {
			return a - b;
		},
		/**
		* Compare two strings.
		*
		* @param {Number|String} a
		* @param {Number|String} b
		* @returns {Number} 1 if a > b, 0 if a = b, -1 if a < b
		*/
		strcmp: function(a, b) {
			return a < b ? -1 : a > b ? 1 : 0;
		}
	};
}));
//#endregion
//#region node_modules/arrayslicer/lib/search/binary.js
var require_binary = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Binary search implementation
	*/
	/**
	* Main search recursive function
	*/
	function loop(data, min, max, index, valpos) {
		var curr = max + min >>> 1;
		var diff = this.compare(data[curr][this.index], index);
		if (!diff) return valpos[index] = {
			"found": true,
			"index": curr,
			"prev": null,
			"next": null
		};
		if (min >= max) return valpos[index] = {
			"found": false,
			"index": null,
			"prev": diff < 0 ? max : max - 1,
			"next": diff < 0 ? max + 1 : max
		};
		if (diff > 0) return loop.call(this, data, min, curr - 1, index, valpos);
		else return loop.call(this, data, curr + 1, max, index, valpos);
	}
	/**
	* Search bootstrap
	* The function has to be executed in the context of the IndexedArray object
	*/
	function search(index) {
		var data = this.data;
		return loop.call(this, data, 0, data.length - 1, index, this.valpos);
	}
	/**
	* Export search function
	*/
	module.exports.search = search;
}));
//#endregion
//#region src/stuff/utils.js
var import_lib = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Indexed Array Binary Search module
	*/
	/**
	* Dependencies
	*/
	var util = require_util(), cmp = require_compare(), bin = require_binary();
	/**
	* Module interface definition
	*/
	module.exports = IndexedArray;
	/**
	* Indexed Array constructor
	*
	* It loads the array data, defines the index field and the comparison function
	* to be used.
	*
	* @param {Array} data is an array of objects
	* @param {String} index is the object's property used to search the array
	*/
	function IndexedArray(data, index) {
		if (!util.isSortableArrayLike(data)) throw new Error("Invalid data");
		if (!index || data.length > 0 && !(index in data[0])) throw new Error("Invalid index");
		this.data = data;
		this.index = index;
		this.setBoundaries();
		this.compare = typeof this.minv === "number" ? cmp.numcmp : cmp.strcmp;
		this.search = bin.search;
		this.valpos = {};
		this.cursor = null;
		this.nextlow = null;
		this.nexthigh = null;
	}
	/**
	* Set the comparison function
	*
	* @param {Function} fn to compare index values that returnes 1, 0, -1
	*/
	IndexedArray.prototype.setCompare = function(fn) {
		if (typeof fn !== "function") throw new Error("Invalid argument");
		this.compare = fn;
		return this;
	};
	/**
	* Set the search function
	*
	* @param {Function} fn to search index values in the array of objects
	*/
	IndexedArray.prototype.setSearch = function(fn) {
		if (typeof fn !== "function") throw new Error("Invalid argument");
		this.search = fn;
		return this;
	};
	/**
	* Sort the data array by its index property
	*/
	IndexedArray.prototype.sort = function() {
		var self = this, index = this.index;
		this.data.sort(function(a, b) {
			return self.compare(a[index], b[index]);
		});
		this.setBoundaries();
		return this;
	};
	/**
	* Inspect and set the boundaries of the internal data array
	*/
	IndexedArray.prototype.setBoundaries = function() {
		var data = this.data, index = this.index;
		this.minv = data.length && data[0][index];
		this.maxv = data.length && data[data.length - 1][index];
		return this;
	};
	/**
	* Get the position of the object corresponding to the given index
	*
	* @param {Number|String} index is the id of the requested object
	* @returns {Number} the position of the object in the array
	*/
	IndexedArray.prototype.fetch = function(value) {
		if (this.data.length === 0) {
			this.cursor = null;
			this.nextlow = null;
			this.nexthigh = null;
			return this;
		}
		if (this.compare(value, this.minv) === -1) {
			this.cursor = null;
			this.nextlow = null;
			this.nexthigh = 0;
			return this;
		}
		if (this.compare(value, this.maxv) === 1) {
			this.cursor = null;
			this.nextlow = this.data.length - 1;
			this.nexthigh = null;
			return this;
		}
		var pos = this.valpos[value];
		if (pos) {
			if (pos.found) {
				this.cursor = pos.index;
				this.nextlow = null;
				this.nexthigh = null;
			} else {
				this.cursor = null;
				this.nextlow = pos.prev;
				this.nexthigh = pos.next;
			}
			return this;
		}
		var result = this.search.call(this, value);
		this.cursor = result.index;
		this.nextlow = result.prev;
		this.nexthigh = result.next;
		return this;
	};
	/**
	* Get the object corresponding to the given index
	*
	* When no value is given, the function will default to the last fetched item.
	*
	* @param {Number|String} [optional] index is the id of the requested object
	* @returns {Object} the found object or null
	*/
	IndexedArray.prototype.get = function(value) {
		if (value) this.fetch(value);
		var pos = this.cursor;
		return pos !== null ? this.data[pos] : null;
	};
	/**
	* Get an slice of the data array
	*
	* Boundaries have to be in order.
	*
	* @param {Number|String} begin index is the id of the requested object
	* @param {Number|String} end index is the id of the requested object
	* @returns {Object} the slice of data array or []
	*/
	IndexedArray.prototype.getRange = function(begin, end) {
		if (this.compare(begin, end) === 1) return [];
		this.fetch(begin);
		var start = this.cursor || this.nexthigh;
		this.fetch(end);
		var finish = this.cursor || this.nextlow;
		if (start === null || finish === null) return [];
		return this.data.slice(start, finish + 1);
	};
})))(), 1);
var utils_default = {
	clamp(num, min, max) {
		return num <= min ? min : num >= max ? max : num;
	},
	add_zero(i) {
		if (i < 10) i = "0" + i;
		return i;
	},
	day_start(t) {
		return new Date(t).setUTCHours(0, 0, 0, 0);
	},
	month_start(t) {
		let date = new Date(t);
		return Date.UTC(date.getFullYear(), date.getMonth(), 1);
	},
	year_start(t) {
		return Date.UTC(new Date(t).getFullYear());
	},
	get_year(t) {
		if (!t) return void 0;
		return new Date(t).getUTCFullYear();
	},
	get_month(t) {
		if (!t) return void 0;
		return new Date(t).getUTCMonth();
	},
	nearest_a(x, array) {
		if (!array || !array.length) return [-1, null];
		if (array.length === 1) return [0, array[0]];
		let lo = 0;
		let hi = array.length - 1;
		if (x <= array[lo]) return [lo, array[lo]];
		if (x >= array[hi]) return [hi, array[hi]];
		while (lo < hi - 1) {
			const mid = lo + hi >> 1;
			if (array[mid] === x) return [mid, array[mid]];
			if (array[mid] < x) lo = mid;
			else hi = mid;
		}
		return Math.abs(array[lo] - x) <= Math.abs(array[hi] - x) ? [lo, array[lo]] : [hi, array[hi]];
	},
	round(num, decimals = 8) {
		return parseFloat(num.toFixed(decimals));
	},
	strip(number) {
		return parseFloat(parseFloat(number).toPrecision(12));
	},
	get_day(t) {
		return t ? new Date(t).getDate() : null;
	},
	overwrite(arr, new_arr) {
		arr.splice(0, arr.length, ...new_arr);
	},
	copy_layout(obj, new_obj) {
		for (let k in obj) if (Array.isArray(obj[k])) {
			if (obj[k].length !== new_obj[k].length) {
				this.overwrite(obj[k], new_obj[k]);
				continue;
			}
			for (let m in obj[k]) Object.assign(obj[k][m], new_obj[k][m]);
		} else Object.assign(obj[k], new_obj[k]);
	},
	detect_interval(ohlcv) {
		let len = Math.min(ohlcv.length - 1, 99);
		let min = Infinity;
		ohlcv.slice(0, len).forEach((x, i) => {
			let d = ohlcv[i + 1][0] - x[0];
			if (d === d && d < min) min = d;
		});
		if (min >= constants_default.MONTH && min <= constants_default.DAY * 30) return constants_default.DAY * 31;
		return min;
	},
	get_num_id(id) {
		return parseInt(id.split("_").pop());
	},
	fast_filter(arr, t1, t2) {
		if (!arr.length) return [arr, void 0];
		if (arr[arr.length - 1][0] < t1 || arr[0][0] > t2) return [[], void 0];
		try {
			let ia = new import_lib.default(arr, "0");
			return [ia.getRange(t1, t2), ia.valpos[t1].next];
		} catch (e) {
			return [arr.filter((x) => x[0] >= t1 && x[0] <= t2), 0];
		}
	},
	fast_filter_i(arr, t1, t2) {
		if (!arr.length) return [arr, void 0];
		let i1 = Math.floor(t1);
		if (i1 < 0) i1 = 0;
		let i2 = Math.floor(t2 + 1);
		return [arr.slice(i1, i2), i1];
	},
	fast_nearest(arr, t1) {
		let ia = new import_lib.default(arr, "0");
		ia.fetch(t1);
		return [ia.nextlow, ia.nexthigh];
	},
	now() {
		return (/* @__PURE__ */ new Date()).getTime();
	},
	pause(delay) {
		return new Promise((rs, rj) => setTimeout(rs, delay));
	},
	smart_wheel(delta) {
		let abs = Math.abs(delta);
		if (abs > 500) return (200 + Math.log(abs)) * Math.sign(delta);
		return delta;
	},
	get_deltaX(event) {
		return event.originalEvent.deltaX / 12;
	},
	get_deltaY(event) {
		return event.originalEvent.deltaY / 12;
	},
	apply_opacity(c, op) {
		if (c.length === 7) {
			let n = Math.floor(op * 255);
			n = this.clamp(n, 0, 255);
			c += n.toString(16).padStart(2, "0");
		}
		return c;
	},
	parse_tf(smth) {
		if (typeof smth === "string") return constants_default.map_unit[smth];
		else return smth;
	},
	index_shift(sub, data) {
		if (!data.length) return 0;
		let first = data[0][0];
		let second;
		let i = 1;
		for (; i < data.length; i++) if (data[i][0] !== first) {
			second = data[i][0];
			break;
		}
		for (let j = 0; j < sub.length; j++) if (sub[j][0] === second) return j - i;
		return 0;
	},
	measureText(ctx, text, tv_id) {
		let m = ctx.measureTextOrg(text);
		if (m.width === 0) {
			const doc = document;
			const id = "tvjs-measure-text";
			let el = doc.getElementById(id);
			if (!el) {
				let base = doc.getElementById(tv_id);
				el = doc.createElement("div");
				el.id = id;
				el.style.position = "absolute";
				el.style.top = "-1000px";
				base.appendChild(el);
			}
			if (ctx.font) el.style.font = ctx.font;
			el.innerText = text.replace(/ /g, ".");
			return { width: el.offsetWidth };
		} else return m;
	},
	uuid(temp = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx") {
		return temp.replace(/[xy]/g, (c) => {
			let r = Math.random() * 16 | 0;
			return (c == "x" ? r : r & 3 | 8).toString(16);
		});
	},
	uuid2() {
		return this.uuid("xxxxxxxxxxxx");
	},
	warn(f, text, delay = 0) {
		setTimeout(() => {
			if (f()) console.warn(text);
		}, delay);
	},
	is_scr_props_upd(n, prev) {
		let p = prev.find((x) => x.v.$uuid === n.v.$uuid);
		if (!p) return false;
		let props = n.p.settings.$props;
		if (!props) return false;
		return props.some((x) => n.v[x] !== p.v[x]);
	},
	delayed_exec(v) {
		if (!v.script || !v.script.execInterval) return true;
		let t = this.now();
		let dt = v.script.execInterval;
		if (!v.settings.$last_exec || t > v.settings.$last_exec + dt) {
			v.settings.$last_exec = t;
			return true;
		}
		return false;
	},
	format_name(ov) {
		if (!ov.name) return void 0;
		let name = ov.name;
		for (let k in ov.settings || {}) {
			let val = ov.settings[k];
			let reg = new RegExp(`\\$${k}`, "g");
			name = name.replace(reg, val);
		}
		return name;
	},
	xmode() {
		return this.is_mobile ? "explore" : "default";
	},
	default_prevented(event) {
		if (event.original) return event.original.defaultPrevented;
		return event.defaultPrevented;
	},
	is_mobile: ((w) => "onorientationchange" in w && (!!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || "ontouchstart" in w || w.DocumentTouch && document instanceof w.DocumentTouch))(typeof window !== "undefined" ? window : {}),
	maxInArray(arr) {
		if (!arr || !arr.length) return -Infinity;
		let max = arr[0];
		for (let i = 1; i < arr.length; i++) if (arr[i] > max) max = arr[i];
		return max;
	},
	minInArray(arr) {
		if (!arr || !arr.length) return Infinity;
		let min = arr[0];
		for (let i = 1; i < arr.length; i++) if (arr[i] < min) min = arr[i];
		return min;
	},
	maxAtIndex(arr, idx) {
		if (!arr || !arr.length) return -Infinity;
		let max = arr[0][idx];
		for (let i = 1; i < arr.length; i++) {
			const val = arr[i][idx];
			if (val > max) max = val;
		}
		return max;
	},
	minAtIndex(arr, idx) {
		if (!arr || !arr.length) return Infinity;
		let min = arr[0][idx];
		for (let i = 1; i < arr.length; i++) {
			const val = arr[i][idx];
			if (val < min) min = val;
		}
		return min;
	},
	rafThrottle(fn) {
		let rafId = null;
		let lastArgs = null;
		let context = null;
		const throttled = function(...args) {
			lastArgs = args;
			context = this;
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				fn.apply(context, lastArgs);
			});
		};
		throttled.cancel = () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		};
		return throttled;
	},
	fastDeepCopy(obj) {
		if (obj === null || typeof obj !== "object") return obj;
		if (Array.isArray(obj)) {
			if (obj.length === 0) return [];
			const first = obj[0];
			if (first === null || typeof first !== "object") return obj.slice();
			const copy = new Array(obj.length);
			for (let i = 0; i < obj.length; i++) copy[i] = this.fastDeepCopy(obj[i]);
			return copy;
		}
		const copy = {};
		for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) copy[key] = this.fastDeepCopy(obj[key]);
		return copy;
	},
	_dateCache: /* @__PURE__ */ new Map(),
	_dateCacheMax: 16,
	getCachedDate(timestamp) {
		let d = this._dateCache.get(timestamp);
		if (d !== void 0) return d;
		d = new Date(timestamp);
		if (this._dateCache.size >= this._dateCacheMax) this._dateCache.delete(this._dateCache.keys().next().value);
		this._dateCache.set(timestamp, d);
		return d;
	}
};
//#endregion
//#region src/components/js/updater.js
var CursorUpdater = class {
	constructor(comp) {
		this.comp = comp;
		this.cursor = comp.cursor;
		this._screenCache = null;
		this._screenCacheKey = null;
	}
	get grids() {
		return this.comp.chartLayout.grids;
	}
	_nearestTimestamp(t, data) {
		if (!data || !data.length) return -1;
		if (data.length === 1) return 0;
		let lo = 0;
		let hi = data.length - 1;
		if (t <= data[lo][0]) return lo;
		if (t >= data[hi][0]) return hi;
		while (lo < hi - 1) {
			const mid = lo + hi >> 1;
			const midT = data[mid][0];
			if (midT === t) return mid;
			if (midT < t) lo = mid;
			else hi = mid;
		}
		return t - data[lo][0] <= data[hi][0] - t ? lo : hi;
	}
	_nearestScreenX(x, data, grid) {
		const cacheKey = `${grid.startx},${grid.px_step},${data.length}`;
		if (this._screenCacheKey !== cacheKey || !this._screenCache) {
			this._screenCache = new Float64Array(data.length);
			for (let i = 0; i < data.length; i++) this._screenCache[i] = grid.t2screen(data[i][0]) + .5;
			this._screenCacheKey = cacheKey;
		}
		const xs = this._screenCache;
		if (!xs.length) return -1;
		if (xs.length === 1) return 0;
		let lo = 0;
		let hi = xs.length - 1;
		if (x <= xs[lo]) return lo;
		if (x >= xs[hi]) return hi;
		while (lo < hi - 1) {
			const mid = lo + hi >> 1;
			if (xs[mid] === x) return mid;
			if (xs[mid] < x) lo = mid;
			else hi = mid;
		}
		return x - xs[lo] <= xs[hi] - x ? lo : hi;
	}
	sync(e) {
		this.cursor.grid_id = e.grid_id;
		let once = true;
		for (var grid of this.grids) {
			const c = this.cursor_data(grid, e);
			if (!this.cursor.locked) {
				if (once) {
					this.cursor.t = this.cursor_time(grid, e, c);
					if (this.cursor.t) once = false;
				}
				if (c.values) this.cursor.values[grid.id] = c.values;
			}
			if (grid.id !== e.grid_id) continue;
			this.cursor.x = grid.t2screen(this.cursor.t);
			this.cursor.y = c.y;
			this.cursor.y$ = c.y$;
		}
	}
	overlay_data(grid, e) {
		const s = grid.id === 0 ? "main_section" : "sub_section";
		let data = this.comp[s].data;
		if (grid.id > 0) {
			let d = [];
			let m = [];
			for (let i = 0; i < data.length; i++) {
				const x = data[i];
				if (x.grid.id === void 0) d.push(x);
				else if (x.grid.id === grid.id) m.push(x);
			}
			data = [d[grid.id - 1]].concat(m);
		}
		const t = grid.screen2t(e.x);
		let ids = {}, res = {};
		for (var d of data) {
			let i = this._nearestTimestamp(t, d.data);
			d.type in ids ? ids[d.type]++ : ids[d.type] = 0;
			res[`${d.type}_${ids[d.type]}`] = d.data[i];
		}
		return res;
	}
	cursor_data(grid, e) {
		const data = this.comp.main_section.sub;
		if (!data || !data.length) return {};
		let i = this._nearestScreenX(e.x, data, grid);
		if (i < 0) return {};
		const screenX = this._screenCache ? this._screenCache[i] : grid.t2screen(data[i][0]) + .5;
		return {
			x: Math.floor(screenX) - .5,
			y: Math.floor(e.y - 2) - .5 - grid.offset,
			y$: grid.screen2$(e.y - 2 - grid.offset),
			t: (data[i] || [])[0],
			values: Object.assign({ ohlcv: grid.id === 0 ? data[i] : void 0 }, this.overlay_data(grid, e))
		};
	}
	cursor_time(grid, mouse, candle) {
		let t = grid.screen2t(mouse.x);
		let r = Math.abs((t - candle.t) / this.comp.interval);
		let sign = Math.sign(t - candle.t);
		if (r >= .5) {
			let n = Math.round(r);
			return candle.t + n * this.comp.interval * sign;
		}
		return candle.t;
	}
};
//#endregion
//#region src/stuff/pool.js
/**
* Simple object pool for reusing event data objects
* Reduces garbage collection during high-frequency operations
*/
var ObjectPool = class {
	constructor(factory, reset, initialSize = 4) {
		this.factory = factory;
		this.reset = reset;
		this.pool = [];
		for (let i = 0; i < initialSize; i++) this.pool.push(this.factory());
	}
	/**
	* Acquire an object from the pool (or create new if empty)
	*/
	acquire() {
		if (this.pool.length > 0) return this.pool.pop();
		return this.factory();
	}
	/**
	* Release an object back to the pool
	*/
	release(obj) {
		if (this.reset) this.reset(obj);
		this.pool.push(obj);
	}
	/**
	* Clear the pool
	*/
	clear() {
		this.pool.length = 0;
	}
};
/**
* Pre-configured pool for cursor-changed event objects
*/
function createCursorEventPool() {
	return new ObjectPool(() => ({
		grid_id: void 0,
		x: void 0,
		y: void 0,
		mode: void 0
	}), (obj) => {
		obj.grid_id = void 0;
		obj.x = void 0;
		obj.y = void 0;
		obj.mode = void 0;
	}, 2);
}
//#endregion
//#region src/components/js/grid/zoom-manager.js
var ZoomManager = class {
	constructor(grid) {
		this.grid = grid;
	}
	get range() {
		return this.grid.range;
	}
	get data() {
		return this.grid.data;
	}
	get layout() {
		return this.grid.layout;
	}
	get interval() {
		return this.grid.interval;
	}
	get canvas() {
		return this.grid.canvas;
	}
	get comp() {
		return this.grid.comp;
	}
	get $p() {
		return this.grid.$p;
	}
	get id() {
		return this.grid.id;
	}
	mousezoom(delta, event) {
		const wmode = this.grid.wmode;
		if (wmode !== "pass") {
			if (wmode === "click" && !this.$p.meta.activated) return;
			event.originalEvent.preventDefault();
			event.preventDefault();
		}
		event.deltaX = event.deltaX || utils_default.get_deltaX(event);
		event.deltaY = event.deltaY || utils_default.get_deltaY(event);
		if (Math.abs(event.deltaX) > 0) {
			this.grid.trackpad = true;
			if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) delta *= .1;
			this.trackpad_scroll(event);
		}
		if (this.grid.trackpad) delta *= .032;
		delta = utils_default.smart_wheel(delta);
		if (delta < 0 && this.data.length <= this.grid.MIN_ZOOM) return;
		if (delta > 0 && this.data.length > this.grid.MAX_ZOOM) return;
		let k = this.interval / 1e3;
		let diff = delta * k * this.data.length;
		let tl = this.$p.config?.ZOOM_MODE === "tl";
		if (event.originalEvent.ctrlKey || tl) {
			let diff1 = event.originalEvent.offsetX / (this.canvas.width - 1) * diff;
			let diff2 = diff - diff1;
			this.range[0] -= diff1;
			this.range[1] += diff2;
		} else this.range[0] -= diff;
		if (tl) {
			let diff1 = event.originalEvent.offsetY / (Math.max(this.canvas.height, 2) - 1) * 2;
			let diff2 = 2 - diff1;
			let z = diff / (this.range[1] - this.range[0]);
			this.comp.$emit("rezoom-range", {
				grid_id: this.id,
				z,
				diff1,
				diff2
			});
		}
		this.grid.change_range();
	}
	pinchzoom(scale) {
		const pinch = this.grid.pinch;
		if (!pinch) return;
		if (scale > 1 && this.data.length <= this.grid.MIN_ZOOM) return;
		if (scale < 1 && this.data.length > this.grid.MAX_ZOOM) return;
		let t = pinch.t;
		let nt = t * 1 / scale;
		this.range[0] = pinch.r[0] - (nt - t) * .5;
		this.range[1] = pinch.r[1] + (nt - t) * .5;
		this.grid.change_range();
	}
	trackpad_scroll(event) {
		let dt = this.range[1] - this.range[0];
		this.range[0] += event.deltaX * dt * .011;
		this.range[1] += event.deltaX * dt * .011;
		this.grid.change_range();
	}
};
//#endregion
//#region src/stuff/frame.js
var FrameAnimation = class {
	constructor(cb) {
		this.t0 = this.t = utils_default.now();
		this.cb = cb;
		this.running = true;
		this.rafId = null;
		this._loop();
	}
	_loop() {
		if (!this.running) return;
		this.rafId = requestAnimationFrame(() => {
			if (!this.running) return;
			const now = utils_default.now();
			if (now - this.t > 100) {
				this.t = now;
				this._loop();
				return;
			}
			if (now - this.t0 > 1200) {
				this.stop();
				return;
			}
			this.cb(this);
			this.t = now;
			this._loop();
		});
	}
	stop() {
		this.running = false;
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}
};
//#endregion
//#region src/stuff/math.js
var math_default = {
	point2line(p1, p2, p3) {
		let { area, base } = this.tri(p1, p2, p3);
		return Math.abs(this.tri_h(area, base));
	},
	point2seg(p1, p2, p3) {
		let { area, base } = this.tri(p1, p2, p3);
		let proj = this.dot_prod(p1, p2, p3) / base;
		let l1 = Math.max(-proj, 0);
		let l2 = Math.max(proj - base, 0);
		let h = Math.abs(this.tri_h(area, base));
		return Math.max(h, l1, l2);
	},
	point2ray(p1, p2, p3) {
		let { area, base } = this.tri(p1, p2, p3);
		let proj = this.dot_prod(p1, p2, p3) / base;
		let l1 = Math.max(-proj, 0);
		let h = Math.abs(this.tri_h(area, base));
		return Math.max(h, l1);
	},
	tri(p1, p2, p3) {
		let area = this.area(p1, p2, p3);
		let dx = p3[0] - p2[0];
		let dy = p3[1] - p2[1];
		let base = Math.sqrt(dx * dx + dy * dy);
		if (base === 0) return {
			area,
			base: 1
		};
		return {
			area,
			base
		};
	},
	area(p1, p2, p3) {
		return p1[0] * (p2[1] - p3[1]) + p2[0] * (p3[1] - p1[1]) + p3[0] * (p1[1] - p2[1]);
	},
	tri_h(area, base) {
		return area / base;
	},
	dot_prod(p1, p2, p3) {
		let v1 = [p3[0] - p2[0], p3[1] - p2[1]];
		let v2 = [p1[0] - p2[0], p1[1] - p2[1]];
		return v1[0] * v2[0] + v1[1] * v2[1];
	},
	log(x) {
		return Math.sign(x) * Math.log(Math.abs(x) + 1);
	},
	exp(x) {
		return Math.sign(x) * (Math.exp(Math.abs(x)) - 1);
	},
	log_mid(r, h) {
		let log_hi = this.log(r[0]);
		let log_lo = this.log(r[1]);
		let gx = log_hi - h / 2 * (log_hi - log_lo) / h;
		return this.exp(gx);
	},
	re_range(r1, hi2, mid) {
		let log_hi1 = this.log(r1[0]);
		let log_lo1 = this.log(r1[1]);
		let log_hi2 = this.log(hi2);
		let log_$ = this.log(mid);
		let W = (log_hi2 - log_$) * (log_hi1 - log_lo1) / (log_hi1 - log_$);
		return this.exp(log_hi2 - W);
	}
};
//#endregion
//#region src/components/js/grid/pan-manager.js
var PanManager = class {
	constructor(grid) {
		this.grid = grid;
		this.fade = null;
	}
	get range() {
		return this.grid.range;
	}
	get layout() {
		return this.grid.layout;
	}
	get comp() {
		return this.grid.comp;
	}
	get $p() {
		return this.grid.$p;
	}
	get id() {
		return this.grid.id;
	}
	mousedrag(x, y) {
		const drug = this.grid.drug;
		if (!drug) return;
		let dt = drug.t * (drug.x - x) / this.layout.width;
		let d$ = this.layout.$_hi - this.layout.$_lo;
		d$ *= (drug.y - y) / this.layout.height;
		let offset = drug.o + d$;
		let ls = this.layout.grid.logScale;
		let range;
		if (ls && drug.y_r) {
			let dy = drug.y - y;
			range = drug.y_r.slice();
			range[0] = math_default.exp((0 - drug.B + dy) / this.layout.A);
			range[1] = math_default.exp((this.layout.height - drug.B + dy) / this.layout.A);
		}
		if (drug.y_r && this.$p.y_transform && !this.$p.y_transform.auto) this.comp.$emit("sidebar-transform", {
			grid_id: this.id,
			range: ls ? range || drug.y_r : [drug.y_r[0] - offset, drug.y_r[1] - offset]
		});
		this.range[0] = drug.r[0] + dt;
		this.range[1] = drug.r[1] + dt;
		this.grid.change_range();
	}
	pan_fade(event) {
		const drug = this.grid.drug;
		if (!drug) return;
		let dt = utils_default.now() - drug.t0;
		let v = 42 * (this.range[1] - drug.r[1]) / dt;
		let v0 = Math.abs(v * .01);
		if (dt > 500) return;
		if (this.fade) this.fade.stop();
		this.fade = new FrameAnimation((self) => {
			v *= .85;
			if (Math.abs(v) < v0) self.stop();
			this.range[0] += v;
			this.range[1] += v;
			this.grid.change_range();
		});
	}
	stopFade() {
		if (this.fade) this.fade.stop();
	}
	destroy() {
		if (this.fade) this.fade.stop();
		this.fade = null;
	}
};
//#endregion
//#region src/helpers/schema/diagnostics.js
/**
* @typedef {Object} Diagnostic
* @property {'error'|'warn'} level
* @property {string} code   - stable machine code, e.g. 'ohlcv.row.shape'
* @property {string} message- human-readable explanation
* @property {string} [path] - location, e.g. 'chart.data[42]'
*/
/** Make a diagnostic. */
function diag(level, code, message, path) {
	return path !== void 0 ? {
		level,
		code,
		message,
		path
	} : {
		level,
		code,
		message
	};
}
var error = (code, message, path) => diag("error", code, message, path);
var warn = (code, message, path) => diag("warn", code, message, path);
/** True if any diagnostic is error-level. */
function hasErrors(diagnostics) {
	for (const d of diagnostics) if (d.level === "error") return true;
	return false;
}
/** One-line human summary of a diagnostic list (capped). */
function formatDiagnostics(diagnostics, cap = 8) {
	const shown = diagnostics.slice(0, cap).map((d) => `  [${d.level}] ${d.code}${d.path ? ` @ ${d.path}` : ""}: ${d.message}`);
	const extra = diagnostics.length > cap ? `\n  …and ${diagnostics.length - cap} more` : "";
	return shown.join("\n") + extra;
}
/**
* Report diagnostics according to `mode`:
*   'off'    - do nothing
*   'warn'   - console.warn errors+warnings (default; non-breaking)
*   'strict' - throw on any error-level diagnostic (after logging)
*
* Returns the (possibly filtered) diagnostics so callers can also surface them
* on an event bus. Never throws in 'warn'/'off'.
*
* @param {Diagnostic[]} diagnostics
* @param {'off'|'warn'|'strict'} mode
* @param {string} context - label for the log line, e.g. 'OHLCV data'
*/
function report(diagnostics, mode = "warn", context = "data") {
	if (!diagnostics || !diagnostics.length || mode === "off") return diagnostics;
	const header = `[trading-vue] ${context}: ${diagnostics.length} validation issue(s)`;
	const body = formatDiagnostics(diagnostics);
	if (mode === "strict" && hasErrors(diagnostics)) {
		if (typeof console !== "undefined") console.error(header + "\n" + body);
		const err = /* @__PURE__ */ new Error(`${header} (strict mode)\n${body}`);
		err.diagnostics = diagnostics;
		throw err;
	}
	if (typeof console !== "undefined") (hasErrors(diagnostics) ? console.error : console.warn)(header + "\n" + body);
	return diagnostics;
}
//#endregion
//#region src/render/canvas-context.js
var CanvasContext = class {
	/**
	* @param {CanvasRenderingContext2D} ctx
	* @param {object} [opts]
	* @param {(d:object, e:Error)=>void} [opts.onError] - diagnostic sink
	* @param {{drawCall:(n?:number)=>void}} [opts.metrics] - RenderMetrics shim
	*/
	constructor(ctx, opts = {}) {
		this.ctx = ctx;
		this.onError = opts.onError || null;
		this.metrics = opts.metrics || null;
		this._errs = /* @__PURE__ */ new Map();
	}
	/** Point the wrapper at the current canvas context (it can change on resize). */
	use(ctx) {
		this.ctx = ctx;
		return this;
	}
	/**
	* Draw one overlay layer inside an isolated boundary.
	* @returns {boolean} true if it drew without throwing
	*/
	drawOverlay(layer) {
		if (!layer || !layer.display) return false;
		const ctx = this.ctx;
		let ok = true;
		ctx.save();
		try {
			const r = layer.renderer;
			if (r.pre_draw) r.pre_draw(ctx);
			r.draw(ctx);
			if (r.post_draw) r.post_draw(ctx);
			if (this._errs.has(layer.id)) this._errs.delete(layer.id);
		} catch (e) {
			ok = false;
			this._report(layer, e);
		} finally {
			ctx.restore();
			if (!ok) ctx.beginPath();
			if (this.metrics) this.metrics.drawCall();
		}
		return ok;
	}
	/** Draw a list of (already z-sorted) layers. Returns count drawn ok. */
	drawOverlays(layers) {
		let ok = 0;
		for (let i = 0; i < layers.length; i++) if (this.drawOverlay(layers[i])) ok++;
		return ok;
	}
	_report(layer, e) {
		const id = layer.id;
		const msg = e && e.message || String(e);
		if (this._errs.get(id) === msg) return;
		this._errs.set(id, msg);
		const diag = error("overlay.draw.throw", `overlay "${layer.name || id}" draw() threw: ${msg}`, String(id));
		if (this.onError) this.onError(diag, e);
		else if (typeof console !== "undefined") console.error(`[trading-vue] ${diag.message}`, e);
	}
};
//#endregion
//#region src/render/render-engine.js
var RenderEngine = class {
	/**
	* @param {object} [opts] forwarded to the CanvasContext (onError, metrics).
	*/
	constructor(opts = {}) {
		this.cc = new CanvasContext(null, opts);
	}
	/**
	* Render the full static canvas.
	* @param {CanvasRenderingContext2D} ctx
	* @param {object} frame
	* @param {{width:number,height:number}} frame.canvas
	* @param {object} frame.layout - resolved grid layout (xs/ys/width/height/ti_map)
	* @param {object} frame.colors - theme colours ({grid, scale, ...})
	* @param {Array}  frame.overlays - PRE-SORTED layer list
	* @param {Array}  [frame.shaders] - shader list
	* @param {object} [frame.shaderProps] - props passed to each shader.draw
	* @param {object} [frame.crosshair] - crosshair layer
	* @param {boolean} [frame.drawCrosshairHere] - draw crosshair on this (static) ctx
	* @param {boolean} [frame.upperBorder] - draw the top scale border
	*/
	renderStatic(ctx, frame) {
		const { canvas, layout } = frame;
		if (!layout || !canvas) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (frame.shaders && frame.shaders.length) this.drawShaders(ctx, frame.shaders, frame.shaderProps);
		this.drawGrid(ctx, layout, frame.colors, frame.upperBorder);
		this.cc.use(ctx).drawOverlays(frame.overlays || []);
		if (frame.drawCrosshairHere && frame.crosshair) frame.crosshair.renderer.draw(ctx);
	}
	/** Render only the dynamic canvas (crosshair). */
	renderDynamic(ctx, canvas, crosshair) {
		if (!crosshair || !canvas) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		crosshair.renderer.draw(ctx);
	}
	/** Grid lines (+ optional top scale border). */
	drawGrid(ctx, layout, colors, upperBorder) {
		ctx.strokeStyle = colors.grid;
		ctx.beginPath();
		const ymax = layout.height;
		for (let [x] of layout.xs) {
			ctx.moveTo(x - .5, 0);
			ctx.lineTo(x - .5, ymax);
		}
		for (let [y] of layout.ys) {
			ctx.moveTo(0, y - .5);
			ctx.lineTo(layout.width, y - .5);
		}
		ctx.stroke();
		if (upperBorder) {
			ctx.strokeStyle = colors.scale;
			ctx.beginPath();
			ctx.moveTo(0, .5);
			ctx.lineTo(layout.width, .5);
			ctx.stroke();
		}
	}
	/** Run grid shaders, each in its own save/restore scope. */
	drawShaders(ctx, shaders, props) {
		for (let s of shaders) {
			ctx.save();
			s.draw(ctx, props);
			ctx.restore();
		}
	}
};
//#endregion
//#region src/components/js/grid/grid-renderer.js
var GridRenderer = class {
	constructor(grid) {
		this.grid = grid;
		this.overlays = [];
		this.crosshair = null;
		this.engine = new RenderEngine();
		this._lastRange = null;
		this._lastCursorX = null;
		this._lastCursorY = null;
		this._staticDirty = true;
		this._overlaysDirty = true;
		this._crosshairOnly = false;
		this._lastDataLength = 0;
		this._lastLayoutRef = null;
		this._sortedOverlays = [];
		this._overlaysSortDirty = true;
	}
	get ctx() {
		return this.grid.ctx;
	}
	get ctxDynamic() {
		return this.grid.ctxDynamic || this.grid.ctx;
	}
	get hasDualCanvas() {
		return !!this.grid.ctxDynamic;
	}
	get layout() {
		return this.grid.layout;
	}
	get $p() {
		return this.grid.$p;
	}
	get data() {
		return this.grid.data;
	}
	get range() {
		return this.grid.range;
	}
	get interval() {
		return this.grid.interval;
	}
	get cursor() {
		return this.grid.cursor;
	}
	get id() {
		return this.grid.id;
	}
	new_layer(layer) {
		if (layer.name === "crosshair") this.crosshair = layer;
		else {
			this.overlays.push(layer);
			this._overlaysSortDirty = true;
		}
		this._overlaysDirty = true;
		this.update();
	}
	del_layer(id) {
		this.overlays = this.overlays.filter((x) => x.id !== id);
		this._overlaysSortDirty = true;
		this._overlaysDirty = true;
		this.update();
	}
	show_hide_layer(event) {
		let l = this.overlays.filter((x) => x.id === event.id);
		if (l.length) l[0].display = event.display;
		this._overlaysDirty = true;
	}
	markStaticDirty() {
		this._staticDirty = true;
		this._overlaysDirty = true;
	}
	_detectCrosshairOnlyUpdate() {
		const layoutRef = this.layout;
		if (this._lastLayoutRef !== layoutRef) {
			this._lastLayoutRef = layoutRef;
			this._staticDirty = true;
			this._overlaysDirty = true;
			return false;
		}
		const range = this.range;
		const cursor = this.cursor;
		const data = this.data;
		const rangeKey = range ? `${range[0]},${range[1]}` : "";
		if (this._lastRange !== rangeKey) {
			this._lastRange = rangeKey;
			this._staticDirty = true;
			this._overlaysDirty = true;
			return false;
		}
		const dataLen = data?.length || 0;
		if (this._lastDataLength !== dataLen) {
			this._lastDataLength = dataLen;
			this._staticDirty = true;
			this._overlaysDirty = true;
			return false;
		}
		const cursorX = cursor?.x;
		const cursorY = cursor?.y;
		if (this._lastCursorX !== cursorX || this._lastCursorY !== cursorY) {
			this._lastCursorX = cursorX;
			this._lastCursorY = cursorY;
			return true;
		}
		return false;
	}
	update() {
		const layout = this.grid.comp.layoutOverride || this.$p.layout?.grids?.[this.id];
		this.grid.layout = layout;
		this.grid.interval = this.$p.interval;
		if (!layout) return;
		this._crosshairOnly = this._detectCrosshairOnlyUpdate();
		if (this.hasDualCanvas && this._crosshairOnly && !this._staticDirty && !this._overlaysDirty) {
			this.updateDynamic();
			return;
		}
		if (this._overlaysSortDirty || this._sortedOverlays.length !== this.overlays.length) {
			this._sortedOverlays = this.overlays.slice();
			this._sortedOverlays.sort((l1, l2) => l1.z - l2.z);
			this._overlaysSortDirty = false;
		}
		this.engine.renderStatic(this.ctx, {
			canvas: this.grid.canvas,
			layout: this.layout,
			colors: this.$p.colors,
			overlays: this._sortedOverlays,
			shaders: this.$p.shaders,
			shaderProps: this.$p.shaders.length ? this._shaderProps() : null,
			crosshair: this.crosshair,
			drawCrosshairHere: !this.hasDualCanvas,
			upperBorder: !!this.$p.grid_id
		});
		if (this.hasDualCanvas) this.updateDynamic();
		this._staticDirty = false;
		this._overlaysDirty = false;
	}
	updateDynamic() {
		const canvas = this.grid.canvasDynamic || this.grid.canvas;
		this.engine.renderDynamic(this.ctxDynamic, canvas, this.crosshair);
	}
	_shaderProps() {
		const layout = this.layout;
		return {
			layout,
			range: this.range,
			interval: this.interval,
			tf: layout.ti_map.tf,
			cursor: this.cursor,
			colors: this.$p.colors,
			sub: this.data,
			font: this.$p.font,
			config: this.$p.config,
			meta: this.$p.meta
		};
	}
	propagate(name, event) {
		for (let layer of this.overlays) {
			if (layer.renderer[name]) layer.renderer[name](event);
			const mouse = layer.renderer.mouse;
			const keys = layer.renderer.keys;
			if (mouse.listeners) mouse.emit(name, event);
			if (keys && keys.listeners) keys.emit(name, event);
		}
	}
};
//#endregion
//#region node_modules/hammerjs/hammer.js
var require_hammer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/*! Hammer.JS - v2.0.7 - 2016-04-22
	* http://hammerjs.github.io/
	*
	* Copyright (c) 2016 Jorik Tangelder;
	* Licensed under the MIT license */
	(function(window, document, exportName, undefined) {
		"use strict";
		var VENDOR_PREFIXES = [
			"",
			"webkit",
			"Moz",
			"MS",
			"ms",
			"o"
		];
		var TEST_ELEMENT = document.createElement("div");
		var TYPE_FUNCTION = "function";
		var round = Math.round;
		var abs = Math.abs;
		var now = Date.now;
		/**
		* set a timeout with a given scope
		* @param {Function} fn
		* @param {Number} timeout
		* @param {Object} context
		* @returns {number}
		*/
		function setTimeoutContext(fn, timeout, context) {
			return setTimeout(bindFn(fn, context), timeout);
		}
		/**
		* if the argument is an array, we want to execute the fn on each entry
		* if it aint an array we don't want to do a thing.
		* this is used by all the methods that accept a single and array argument.
		* @param {*|Array} arg
		* @param {String} fn
		* @param {Object} [context]
		* @returns {Boolean}
		*/
		function invokeArrayArg(arg, fn, context) {
			if (Array.isArray(arg)) {
				each(arg, context[fn], context);
				return true;
			}
			return false;
		}
		/**
		* walk objects and arrays
		* @param {Object} obj
		* @param {Function} iterator
		* @param {Object} context
		*/
		function each(obj, iterator, context) {
			var i;
			if (!obj) return;
			if (obj.forEach) obj.forEach(iterator, context);
			else if (obj.length !== undefined) {
				i = 0;
				while (i < obj.length) {
					iterator.call(context, obj[i], i, obj);
					i++;
				}
			} else for (i in obj) obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
		}
		/**
		* wrap a method with a deprecation warning and stack trace
		* @param {Function} method
		* @param {String} name
		* @param {String} message
		* @returns {Function} A new function wrapping the supplied method.
		*/
		function deprecate(method, name, message) {
			var deprecationMessage = "DEPRECATED METHOD: " + name + "\n" + message + " AT \n";
			return function() {
				var e = /* @__PURE__ */ new Error("get-stack-trace");
				var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, "").replace(/^\s+at\s+/gm, "").replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@") : "Unknown Stack Trace";
				var log = window.console && (window.console.warn || window.console.log);
				if (log) log.call(window.console, deprecationMessage, stack);
				return method.apply(this, arguments);
			};
		}
		/**
		* extend object.
		* means that properties in dest will be overwritten by the ones in src.
		* @param {Object} target
		* @param {...Object} objects_to_assign
		* @returns {Object} target
		*/
		var assign;
		if (typeof Object.assign !== "function") assign = function assign(target) {
			if (target === undefined || target === null) throw new TypeError("Cannot convert undefined or null to object");
			var output = Object(target);
			for (var index = 1; index < arguments.length; index++) {
				var source = arguments[index];
				if (source !== undefined && source !== null) {
					for (var nextKey in source) if (source.hasOwnProperty(nextKey)) output[nextKey] = source[nextKey];
				}
			}
			return output;
		};
		else assign = Object.assign;
		/**
		* extend object.
		* means that properties in dest will be overwritten by the ones in src.
		* @param {Object} dest
		* @param {Object} src
		* @param {Boolean} [merge=false]
		* @returns {Object} dest
		*/
		var extend = deprecate(function extend(dest, src, merge) {
			var keys = Object.keys(src);
			var i = 0;
			while (i < keys.length) {
				if (!merge || merge && dest[keys[i]] === undefined) dest[keys[i]] = src[keys[i]];
				i++;
			}
			return dest;
		}, "extend", "Use `assign`.");
		/**
		* merge the values from src in the dest.
		* means that properties that exist in dest will not be overwritten by src
		* @param {Object} dest
		* @param {Object} src
		* @returns {Object} dest
		*/
		var merge = deprecate(function merge(dest, src) {
			return extend(dest, src, true);
		}, "merge", "Use `assign`.");
		/**
		* simple class inheritance
		* @param {Function} child
		* @param {Function} base
		* @param {Object} [properties]
		*/
		function inherit(child, base, properties) {
			var baseP = base.prototype, childP = child.prototype = Object.create(baseP);
			childP.constructor = child;
			childP._super = baseP;
			if (properties) assign(childP, properties);
		}
		/**
		* simple function bind
		* @param {Function} fn
		* @param {Object} context
		* @returns {Function}
		*/
		function bindFn(fn, context) {
			return function boundFn() {
				return fn.apply(context, arguments);
			};
		}
		/**
		* let a boolean value also be a function that must return a boolean
		* this first item in args will be used as the context
		* @param {Boolean|Function} val
		* @param {Array} [args]
		* @returns {Boolean}
		*/
		function boolOrFn(val, args) {
			if (typeof val == TYPE_FUNCTION) return val.apply(args ? args[0] || undefined : undefined, args);
			return val;
		}
		/**
		* use the val2 when val1 is undefined
		* @param {*} val1
		* @param {*} val2
		* @returns {*}
		*/
		function ifUndefined(val1, val2) {
			return val1 === undefined ? val2 : val1;
		}
		/**
		* addEventListener with multiple events at once
		* @param {EventTarget} target
		* @param {String} types
		* @param {Function} handler
		*/
		function addEventListeners(target, types, handler) {
			each(splitStr(types), function(type) {
				target.addEventListener(type, handler, false);
			});
		}
		/**
		* removeEventListener with multiple events at once
		* @param {EventTarget} target
		* @param {String} types
		* @param {Function} handler
		*/
		function removeEventListeners(target, types, handler) {
			each(splitStr(types), function(type) {
				target.removeEventListener(type, handler, false);
			});
		}
		/**
		* find if a node is in the given parent
		* @method hasParent
		* @param {HTMLElement} node
		* @param {HTMLElement} parent
		* @return {Boolean} found
		*/
		function hasParent(node, parent) {
			while (node) {
				if (node == parent) return true;
				node = node.parentNode;
			}
			return false;
		}
		/**
		* small indexOf wrapper
		* @param {String} str
		* @param {String} find
		* @returns {Boolean} found
		*/
		function inStr(str, find) {
			return str.indexOf(find) > -1;
		}
		/**
		* split string on whitespace
		* @param {String} str
		* @returns {Array} words
		*/
		function splitStr(str) {
			return str.trim().split(/\s+/g);
		}
		/**
		* find if a array contains the object using indexOf or a simple polyFill
		* @param {Array} src
		* @param {String} find
		* @param {String} [findByKey]
		* @return {Boolean|Number} false when not found, or the index
		*/
		function inArray(src, find, findByKey) {
			if (src.indexOf && !findByKey) return src.indexOf(find);
			else {
				var i = 0;
				while (i < src.length) {
					if (findByKey && src[i][findByKey] == find || !findByKey && src[i] === find) return i;
					i++;
				}
				return -1;
			}
		}
		/**
		* convert array-like objects to real arrays
		* @param {Object} obj
		* @returns {Array}
		*/
		function toArray(obj) {
			return Array.prototype.slice.call(obj, 0);
		}
		/**
		* unique array with objects based on a key (like 'id') or just by the array's value
		* @param {Array} src [{id:1},{id:2},{id:1}]
		* @param {String} [key]
		* @param {Boolean} [sort=False]
		* @returns {Array} [{id:1},{id:2}]
		*/
		function uniqueArray(src, key, sort) {
			var results = [];
			var values = [];
			var i = 0;
			while (i < src.length) {
				var val = key ? src[i][key] : src[i];
				if (inArray(values, val) < 0) results.push(src[i]);
				values[i] = val;
				i++;
			}
			if (sort) if (!key) results = results.sort();
			else results = results.sort(function sortUniqueArray(a, b) {
				return a[key] > b[key];
			});
			return results;
		}
		/**
		* get the prefixed property
		* @param {Object} obj
		* @param {String} property
		* @returns {String|Undefined} prefixed
		*/
		function prefixed(obj, property) {
			var prefix, prop;
			var camelProp = property[0].toUpperCase() + property.slice(1);
			var i = 0;
			while (i < VENDOR_PREFIXES.length) {
				prefix = VENDOR_PREFIXES[i];
				prop = prefix ? prefix + camelProp : property;
				if (prop in obj) return prop;
				i++;
			}
			return undefined;
		}
		/**
		* get a unique id
		* @returns {number} uniqueId
		*/
		var _uniqueId = 1;
		function uniqueId() {
			return _uniqueId++;
		}
		/**
		* get the window object of an element
		* @param {HTMLElement} element
		* @returns {DocumentView|Window}
		*/
		function getWindowForElement(element) {
			var doc = element.ownerDocument || element;
			return doc.defaultView || doc.parentWindow || window;
		}
		var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
		var SUPPORT_TOUCH = "ontouchstart" in window;
		var SUPPORT_POINTER_EVENTS = prefixed(window, "PointerEvent") !== undefined;
		var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);
		var INPUT_TYPE_TOUCH = "touch";
		var INPUT_TYPE_PEN = "pen";
		var INPUT_TYPE_MOUSE = "mouse";
		var INPUT_TYPE_KINECT = "kinect";
		var COMPUTE_INTERVAL = 25;
		var INPUT_START = 1;
		var INPUT_MOVE = 2;
		var INPUT_END = 4;
		var INPUT_CANCEL = 8;
		var DIRECTION_NONE = 1;
		var DIRECTION_LEFT = 2;
		var DIRECTION_RIGHT = 4;
		var DIRECTION_UP = 8;
		var DIRECTION_DOWN = 16;
		var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
		var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
		var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;
		var PROPS_XY = ["x", "y"];
		var PROPS_CLIENT_XY = ["clientX", "clientY"];
		/**
		* create new input type manager
		* @param {Manager} manager
		* @param {Function} callback
		* @returns {Input}
		* @constructor
		*/
		function Input(manager, callback) {
			var self = this;
			this.manager = manager;
			this.callback = callback;
			this.element = manager.element;
			this.target = manager.options.inputTarget;
			this.domHandler = function(ev) {
				if (boolOrFn(manager.options.enable, [manager])) self.handler(ev);
			};
			this.init();
		}
		Input.prototype = {
			/**
			* should handle the inputEvent data and trigger the callback
			* @virtual
			*/
			handler: function() {},
			/**
			* bind the events
			*/
			init: function() {
				this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
				this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
				this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
			},
			/**
			* unbind the events
			*/
			destroy: function() {
				this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
				this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
				this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
			}
		};
		/**
		* create new input type manager
		* called by the Manager constructor
		* @param {Hammer} manager
		* @returns {Input}
		*/
		function createInputInstance(manager) {
			var Type;
			var inputClass = manager.options.inputClass;
			if (inputClass) Type = inputClass;
			else if (SUPPORT_POINTER_EVENTS) Type = PointerEventInput;
			else if (SUPPORT_ONLY_TOUCH) Type = TouchInput;
			else if (!SUPPORT_TOUCH) Type = MouseInput;
			else Type = TouchMouseInput;
			return new Type(manager, inputHandler);
		}
		/**
		* handle input events
		* @param {Manager} manager
		* @param {String} eventType
		* @param {Object} input
		*/
		function inputHandler(manager, eventType, input) {
			var pointersLen = input.pointers.length;
			var changedPointersLen = input.changedPointers.length;
			var isFirst = eventType & INPUT_START && pointersLen - changedPointersLen === 0;
			var isFinal = eventType & (INPUT_END | INPUT_CANCEL) && pointersLen - changedPointersLen === 0;
			input.isFirst = !!isFirst;
			input.isFinal = !!isFinal;
			if (isFirst) manager.session = {};
			input.eventType = eventType;
			computeInputData(manager, input);
			manager.emit("hammer.input", input);
			manager.recognize(input);
			manager.session.prevInput = input;
		}
		/**
		* extend the data with some usable properties like scale, rotate, velocity etc
		* @param {Object} manager
		* @param {Object} input
		*/
		function computeInputData(manager, input) {
			var session = manager.session;
			var pointers = input.pointers;
			var pointersLength = pointers.length;
			if (!session.firstInput) session.firstInput = simpleCloneInputData(input);
			if (pointersLength > 1 && !session.firstMultiple) session.firstMultiple = simpleCloneInputData(input);
			else if (pointersLength === 1) session.firstMultiple = false;
			var firstInput = session.firstInput;
			var firstMultiple = session.firstMultiple;
			var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;
			var center = input.center = getCenter(pointers);
			input.timeStamp = now();
			input.deltaTime = input.timeStamp - firstInput.timeStamp;
			input.angle = getAngle(offsetCenter, center);
			input.distance = getDistance(offsetCenter, center);
			computeDeltaXY(session, input);
			input.offsetDirection = getDirection(input.deltaX, input.deltaY);
			var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
			input.overallVelocityX = overallVelocity.x;
			input.overallVelocityY = overallVelocity.y;
			input.overallVelocity = abs(overallVelocity.x) > abs(overallVelocity.y) ? overallVelocity.x : overallVelocity.y;
			input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
			input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;
			input.maxPointers = !session.prevInput ? input.pointers.length : input.pointers.length > session.prevInput.maxPointers ? input.pointers.length : session.prevInput.maxPointers;
			computeIntervalInputData(session, input);
			var target = manager.element;
			if (hasParent(input.srcEvent.target, target)) target = input.srcEvent.target;
			input.target = target;
		}
		function computeDeltaXY(session, input) {
			var center = input.center;
			var offset = session.offsetDelta || {};
			var prevDelta = session.prevDelta || {};
			var prevInput = session.prevInput || {};
			if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
				prevDelta = session.prevDelta = {
					x: prevInput.deltaX || 0,
					y: prevInput.deltaY || 0
				};
				offset = session.offsetDelta = {
					x: center.x,
					y: center.y
				};
			}
			input.deltaX = prevDelta.x + (center.x - offset.x);
			input.deltaY = prevDelta.y + (center.y - offset.y);
		}
		/**
		* velocity is calculated every x ms
		* @param {Object} session
		* @param {Object} input
		*/
		function computeIntervalInputData(session, input) {
			var last = session.lastInterval || input, deltaTime = input.timeStamp - last.timeStamp, velocity, velocityX, velocityY, direction;
			if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
				var deltaX = input.deltaX - last.deltaX;
				var deltaY = input.deltaY - last.deltaY;
				var v = getVelocity(deltaTime, deltaX, deltaY);
				velocityX = v.x;
				velocityY = v.y;
				velocity = abs(v.x) > abs(v.y) ? v.x : v.y;
				direction = getDirection(deltaX, deltaY);
				session.lastInterval = input;
			} else {
				velocity = last.velocity;
				velocityX = last.velocityX;
				velocityY = last.velocityY;
				direction = last.direction;
			}
			input.velocity = velocity;
			input.velocityX = velocityX;
			input.velocityY = velocityY;
			input.direction = direction;
		}
		/**
		* create a simple clone from the input used for storage of firstInput and firstMultiple
		* @param {Object} input
		* @returns {Object} clonedInputData
		*/
		function simpleCloneInputData(input) {
			var pointers = [];
			var i = 0;
			while (i < input.pointers.length) {
				pointers[i] = {
					clientX: round(input.pointers[i].clientX),
					clientY: round(input.pointers[i].clientY)
				};
				i++;
			}
			return {
				timeStamp: now(),
				pointers,
				center: getCenter(pointers),
				deltaX: input.deltaX,
				deltaY: input.deltaY
			};
		}
		/**
		* get the center of all the pointers
		* @param {Array} pointers
		* @return {Object} center contains `x` and `y` properties
		*/
		function getCenter(pointers) {
			var pointersLength = pointers.length;
			if (pointersLength === 1) return {
				x: round(pointers[0].clientX),
				y: round(pointers[0].clientY)
			};
			var x = 0, y = 0, i = 0;
			while (i < pointersLength) {
				x += pointers[i].clientX;
				y += pointers[i].clientY;
				i++;
			}
			return {
				x: round(x / pointersLength),
				y: round(y / pointersLength)
			};
		}
		/**
		* calculate the velocity between two points. unit is in px per ms.
		* @param {Number} deltaTime
		* @param {Number} x
		* @param {Number} y
		* @return {Object} velocity `x` and `y`
		*/
		function getVelocity(deltaTime, x, y) {
			return {
				x: x / deltaTime || 0,
				y: y / deltaTime || 0
			};
		}
		/**
		* get the direction between two points
		* @param {Number} x
		* @param {Number} y
		* @return {Number} direction
		*/
		function getDirection(x, y) {
			if (x === y) return DIRECTION_NONE;
			if (abs(x) >= abs(y)) return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
			return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
		}
		/**
		* calculate the absolute distance between two points
		* @param {Object} p1 {x, y}
		* @param {Object} p2 {x, y}
		* @param {Array} [props] containing x and y keys
		* @return {Number} distance
		*/
		function getDistance(p1, p2, props) {
			if (!props) props = PROPS_XY;
			var x = p2[props[0]] - p1[props[0]], y = p2[props[1]] - p1[props[1]];
			return Math.sqrt(x * x + y * y);
		}
		/**
		* calculate the angle between two coordinates
		* @param {Object} p1
		* @param {Object} p2
		* @param {Array} [props] containing x and y keys
		* @return {Number} angle
		*/
		function getAngle(p1, p2, props) {
			if (!props) props = PROPS_XY;
			var x = p2[props[0]] - p1[props[0]], y = p2[props[1]] - p1[props[1]];
			return Math.atan2(y, x) * 180 / Math.PI;
		}
		/**
		* calculate the rotation degrees between two pointersets
		* @param {Array} start array of pointers
		* @param {Array} end array of pointers
		* @return {Number} rotation
		*/
		function getRotation(start, end) {
			return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
		}
		/**
		* calculate the scale factor between two pointersets
		* no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
		* @param {Array} start array of pointers
		* @param {Array} end array of pointers
		* @return {Number} scale
		*/
		function getScale(start, end) {
			return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
		}
		var MOUSE_INPUT_MAP = {
			mousedown: INPUT_START,
			mousemove: INPUT_MOVE,
			mouseup: INPUT_END
		};
		var MOUSE_ELEMENT_EVENTS = "mousedown";
		var MOUSE_WINDOW_EVENTS = "mousemove mouseup";
		/**
		* Mouse events input
		* @constructor
		* @extends Input
		*/
		function MouseInput() {
			this.evEl = MOUSE_ELEMENT_EVENTS;
			this.evWin = MOUSE_WINDOW_EVENTS;
			this.pressed = false;
			Input.apply(this, arguments);
		}
		inherit(MouseInput, Input, { 
		/**
		* handle mouse events
		* @param {Object} ev
		*/
handler: function MEhandler(ev) {
			var eventType = MOUSE_INPUT_MAP[ev.type];
			if (eventType & INPUT_START && ev.button === 0) this.pressed = true;
			if (eventType & INPUT_MOVE && ev.which !== 1) eventType = INPUT_END;
			if (!this.pressed) return;
			if (eventType & INPUT_END) this.pressed = false;
			this.callback(this.manager, eventType, {
				pointers: [ev],
				changedPointers: [ev],
				pointerType: INPUT_TYPE_MOUSE,
				srcEvent: ev
			});
		} });
		var POINTER_INPUT_MAP = {
			pointerdown: INPUT_START,
			pointermove: INPUT_MOVE,
			pointerup: INPUT_END,
			pointercancel: INPUT_CANCEL,
			pointerout: INPUT_CANCEL
		};
		var IE10_POINTER_TYPE_ENUM = {
			2: INPUT_TYPE_TOUCH,
			3: INPUT_TYPE_PEN,
			4: INPUT_TYPE_MOUSE,
			5: INPUT_TYPE_KINECT
		};
		var POINTER_ELEMENT_EVENTS = "pointerdown";
		var POINTER_WINDOW_EVENTS = "pointermove pointerup pointercancel";
		if (window.MSPointerEvent && !window.PointerEvent) {
			POINTER_ELEMENT_EVENTS = "MSPointerDown";
			POINTER_WINDOW_EVENTS = "MSPointerMove MSPointerUp MSPointerCancel";
		}
		/**
		* Pointer events input
		* @constructor
		* @extends Input
		*/
		function PointerEventInput() {
			this.evEl = POINTER_ELEMENT_EVENTS;
			this.evWin = POINTER_WINDOW_EVENTS;
			Input.apply(this, arguments);
			this.store = this.manager.session.pointerEvents = [];
		}
		inherit(PointerEventInput, Input, { 
		/**
		* handle mouse events
		* @param {Object} ev
		*/
handler: function PEhandler(ev) {
			var store = this.store;
			var removePointer = false;
			var eventType = POINTER_INPUT_MAP[ev.type.toLowerCase().replace("ms", "")];
			var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;
			var isTouch = pointerType == INPUT_TYPE_TOUCH;
			var storeIndex = inArray(store, ev.pointerId, "pointerId");
			if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
				if (storeIndex < 0) {
					store.push(ev);
					storeIndex = store.length - 1;
				}
			} else if (eventType & (INPUT_END | INPUT_CANCEL)) removePointer = true;
			if (storeIndex < 0) return;
			store[storeIndex] = ev;
			this.callback(this.manager, eventType, {
				pointers: store,
				changedPointers: [ev],
				pointerType,
				srcEvent: ev
			});
			if (removePointer) store.splice(storeIndex, 1);
		} });
		var SINGLE_TOUCH_INPUT_MAP = {
			touchstart: INPUT_START,
			touchmove: INPUT_MOVE,
			touchend: INPUT_END,
			touchcancel: INPUT_CANCEL
		};
		var SINGLE_TOUCH_TARGET_EVENTS = "touchstart";
		var SINGLE_TOUCH_WINDOW_EVENTS = "touchstart touchmove touchend touchcancel";
		/**
		* Touch events input
		* @constructor
		* @extends Input
		*/
		function SingleTouchInput() {
			this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
			this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
			this.started = false;
			Input.apply(this, arguments);
		}
		inherit(SingleTouchInput, Input, { handler: function TEhandler(ev) {
			var type = SINGLE_TOUCH_INPUT_MAP[ev.type];
			if (type === INPUT_START) this.started = true;
			if (!this.started) return;
			var touches = normalizeSingleTouches.call(this, ev, type);
			if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) this.started = false;
			this.callback(this.manager, type, {
				pointers: touches[0],
				changedPointers: touches[1],
				pointerType: INPUT_TYPE_TOUCH,
				srcEvent: ev
			});
		} });
		/**
		* @this {TouchInput}
		* @param {Object} ev
		* @param {Number} type flag
		* @returns {undefined|Array} [all, changed]
		*/
		function normalizeSingleTouches(ev, type) {
			var all = toArray(ev.touches);
			var changed = toArray(ev.changedTouches);
			if (type & (INPUT_END | INPUT_CANCEL)) all = uniqueArray(all.concat(changed), "identifier", true);
			return [all, changed];
		}
		var TOUCH_INPUT_MAP = {
			touchstart: INPUT_START,
			touchmove: INPUT_MOVE,
			touchend: INPUT_END,
			touchcancel: INPUT_CANCEL
		};
		var TOUCH_TARGET_EVENTS = "touchstart touchmove touchend touchcancel";
		/**
		* Multi-user touch events input
		* @constructor
		* @extends Input
		*/
		function TouchInput() {
			this.evTarget = TOUCH_TARGET_EVENTS;
			this.targetIds = {};
			Input.apply(this, arguments);
		}
		inherit(TouchInput, Input, { handler: function MTEhandler(ev) {
			var type = TOUCH_INPUT_MAP[ev.type];
			var touches = getTouches.call(this, ev, type);
			if (!touches) return;
			this.callback(this.manager, type, {
				pointers: touches[0],
				changedPointers: touches[1],
				pointerType: INPUT_TYPE_TOUCH,
				srcEvent: ev
			});
		} });
		/**
		* @this {TouchInput}
		* @param {Object} ev
		* @param {Number} type flag
		* @returns {undefined|Array} [all, changed]
		*/
		function getTouches(ev, type) {
			var allTouches = toArray(ev.touches);
			var targetIds = this.targetIds;
			if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
				targetIds[allTouches[0].identifier] = true;
				return [allTouches, allTouches];
			}
			var i, targetTouches, changedTouches = toArray(ev.changedTouches), changedTargetTouches = [], target = this.target;
			targetTouches = allTouches.filter(function(touch) {
				return hasParent(touch.target, target);
			});
			if (type === INPUT_START) {
				i = 0;
				while (i < targetTouches.length) {
					targetIds[targetTouches[i].identifier] = true;
					i++;
				}
			}
			i = 0;
			while (i < changedTouches.length) {
				if (targetIds[changedTouches[i].identifier]) changedTargetTouches.push(changedTouches[i]);
				if (type & (INPUT_END | INPUT_CANCEL)) delete targetIds[changedTouches[i].identifier];
				i++;
			}
			if (!changedTargetTouches.length) return;
			return [uniqueArray(targetTouches.concat(changedTargetTouches), "identifier", true), changedTargetTouches];
		}
		/**
		* Combined touch and mouse input
		*
		* Touch has a higher priority then mouse, and while touching no mouse events are allowed.
		* This because touch devices also emit mouse events while doing a touch.
		*
		* @constructor
		* @extends Input
		*/
		var DEDUP_TIMEOUT = 2500;
		var DEDUP_DISTANCE = 25;
		function TouchMouseInput() {
			Input.apply(this, arguments);
			var handler = bindFn(this.handler, this);
			this.touch = new TouchInput(this.manager, handler);
			this.mouse = new MouseInput(this.manager, handler);
			this.primaryTouch = null;
			this.lastTouches = [];
		}
		inherit(TouchMouseInput, Input, {
			/**
			* handle mouse and touch events
			* @param {Hammer} manager
			* @param {String} inputEvent
			* @param {Object} inputData
			*/
			handler: function TMEhandler(manager, inputEvent, inputData) {
				var isTouch = inputData.pointerType == INPUT_TYPE_TOUCH, isMouse = inputData.pointerType == INPUT_TYPE_MOUSE;
				if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) return;
				if (isTouch) recordTouches.call(this, inputEvent, inputData);
				else if (isMouse && isSyntheticEvent.call(this, inputData)) return;
				this.callback(manager, inputEvent, inputData);
			},
			/**
			* remove the event listeners
			*/
			destroy: function destroy() {
				this.touch.destroy();
				this.mouse.destroy();
			}
		});
		function recordTouches(eventType, eventData) {
			if (eventType & INPUT_START) {
				this.primaryTouch = eventData.changedPointers[0].identifier;
				setLastTouch.call(this, eventData);
			} else if (eventType & (INPUT_END | INPUT_CANCEL)) setLastTouch.call(this, eventData);
		}
		function setLastTouch(eventData) {
			var touch = eventData.changedPointers[0];
			if (touch.identifier === this.primaryTouch) {
				var lastTouch = {
					x: touch.clientX,
					y: touch.clientY
				};
				this.lastTouches.push(lastTouch);
				var lts = this.lastTouches;
				var removeLastTouch = function() {
					var i = lts.indexOf(lastTouch);
					if (i > -1) lts.splice(i, 1);
				};
				setTimeout(removeLastTouch, DEDUP_TIMEOUT);
			}
		}
		function isSyntheticEvent(eventData) {
			var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
			for (var i = 0; i < this.lastTouches.length; i++) {
				var t = this.lastTouches[i];
				var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
				if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) return true;
			}
			return false;
		}
		var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, "touchAction");
		var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;
		var TOUCH_ACTION_COMPUTE = "compute";
		var TOUCH_ACTION_AUTO = "auto";
		var TOUCH_ACTION_MANIPULATION = "manipulation";
		var TOUCH_ACTION_NONE = "none";
		var TOUCH_ACTION_PAN_X = "pan-x";
		var TOUCH_ACTION_PAN_Y = "pan-y";
		var TOUCH_ACTION_MAP = getTouchActionProps();
		/**
		* Touch Action
		* sets the touchAction property or uses the js alternative
		* @param {Manager} manager
		* @param {String} value
		* @constructor
		*/
		function TouchAction(manager, value) {
			this.manager = manager;
			this.set(value);
		}
		TouchAction.prototype = {
			/**
			* set the touchAction value on the element or enable the polyfill
			* @param {String} value
			*/
			set: function(value) {
				if (value == TOUCH_ACTION_COMPUTE) value = this.compute();
				if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
				this.actions = value.toLowerCase().trim();
			},
			/**
			* just re-set the touchAction value
			*/
			update: function() {
				this.set(this.manager.options.touchAction);
			},
			/**
			* compute the value for the touchAction property based on the recognizer's settings
			* @returns {String} value
			*/
			compute: function() {
				var actions = [];
				each(this.manager.recognizers, function(recognizer) {
					if (boolOrFn(recognizer.options.enable, [recognizer])) actions = actions.concat(recognizer.getTouchAction());
				});
				return cleanTouchActions(actions.join(" "));
			},
			/**
			* this method is called on each input cycle and provides the preventing of the browser behavior
			* @param {Object} input
			*/
			preventDefaults: function(input) {
				var srcEvent = input.srcEvent;
				var direction = input.offsetDirection;
				if (this.manager.session.prevented) {
					srcEvent.preventDefault();
					return;
				}
				var actions = this.actions;
				var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
				var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
				var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];
				if (hasNone) {
					var isTapPointer = input.pointers.length === 1;
					var isTapMovement = input.distance < 2;
					var isTapTouchTime = input.deltaTime < 250;
					if (isTapPointer && isTapMovement && isTapTouchTime) return;
				}
				if (hasPanX && hasPanY) return;
				if (hasNone || hasPanY && direction & DIRECTION_HORIZONTAL || hasPanX && direction & DIRECTION_VERTICAL) return this.preventSrc(srcEvent);
			},
			/**
			* call preventDefault to prevent the browser's default behavior (scrolling in most cases)
			* @param {Object} srcEvent
			*/
			preventSrc: function(srcEvent) {
				this.manager.session.prevented = true;
				srcEvent.preventDefault();
			}
		};
		/**
		* when the touchActions are collected they are not a valid value, so we need to clean things up. *
		* @param {String} actions
		* @returns {*}
		*/
		function cleanTouchActions(actions) {
			if (inStr(actions, TOUCH_ACTION_NONE)) return TOUCH_ACTION_NONE;
			var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
			var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
			if (hasPanX && hasPanY) return TOUCH_ACTION_NONE;
			if (hasPanX || hasPanY) return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
			if (inStr(actions, TOUCH_ACTION_MANIPULATION)) return TOUCH_ACTION_MANIPULATION;
			return TOUCH_ACTION_AUTO;
		}
		function getTouchActionProps() {
			if (!NATIVE_TOUCH_ACTION) return false;
			var touchMap = {};
			var cssSupports = window.CSS && window.CSS.supports;
			[
				"auto",
				"manipulation",
				"pan-y",
				"pan-x",
				"pan-x pan-y",
				"none"
			].forEach(function(val) {
				touchMap[val] = cssSupports ? window.CSS.supports("touch-action", val) : true;
			});
			return touchMap;
		}
		/**
		* Recognizer flow explained; *
		* All recognizers have the initial state of POSSIBLE when a input session starts.
		* The definition of a input session is from the first input until the last input, with all it's movement in it. *
		* Example session for mouse-input: mousedown -> mousemove -> mouseup
		*
		* On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
		* which determines with state it should be.
		*
		* If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
		* POSSIBLE to give it another change on the next cycle.
		*
		*               Possible
		*                  |
		*            +-----+---------------+
		*            |                     |
		*      +-----+-----+               |
		*      |           |               |
		*   Failed      Cancelled          |
		*                          +-------+------+
		*                          |              |
		*                      Recognized       Began
		*                                         |
		*                                      Changed
		*                                         |
		*                                  Ended/Recognized
		*/
		var STATE_POSSIBLE = 1;
		var STATE_BEGAN = 2;
		var STATE_CHANGED = 4;
		var STATE_ENDED = 8;
		var STATE_RECOGNIZED = STATE_ENDED;
		var STATE_CANCELLED = 16;
		var STATE_FAILED = 32;
		/**
		* Recognizer
		* Every recognizer needs to extend from this class.
		* @constructor
		* @param {Object} options
		*/
		function Recognizer(options) {
			this.options = assign({}, this.defaults, options || {});
			this.id = uniqueId();
			this.manager = null;
			this.options.enable = ifUndefined(this.options.enable, true);
			this.state = STATE_POSSIBLE;
			this.simultaneous = {};
			this.requireFail = [];
		}
		Recognizer.prototype = {
			/**
			* @virtual
			* @type {Object}
			*/
			defaults: {},
			/**
			* set options
			* @param {Object} options
			* @return {Recognizer}
			*/
			set: function(options) {
				assign(this.options, options);
				this.manager && this.manager.touchAction.update();
				return this;
			},
			/**
			* recognize simultaneous with an other recognizer.
			* @param {Recognizer} otherRecognizer
			* @returns {Recognizer} this
			*/
			recognizeWith: function(otherRecognizer) {
				if (invokeArrayArg(otherRecognizer, "recognizeWith", this)) return this;
				var simultaneous = this.simultaneous;
				otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
				if (!simultaneous[otherRecognizer.id]) {
					simultaneous[otherRecognizer.id] = otherRecognizer;
					otherRecognizer.recognizeWith(this);
				}
				return this;
			},
			/**
			* drop the simultaneous link. it doesnt remove the link on the other recognizer.
			* @param {Recognizer} otherRecognizer
			* @returns {Recognizer} this
			*/
			dropRecognizeWith: function(otherRecognizer) {
				if (invokeArrayArg(otherRecognizer, "dropRecognizeWith", this)) return this;
				otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
				delete this.simultaneous[otherRecognizer.id];
				return this;
			},
			/**
			* recognizer can only run when an other is failing
			* @param {Recognizer} otherRecognizer
			* @returns {Recognizer} this
			*/
			requireFailure: function(otherRecognizer) {
				if (invokeArrayArg(otherRecognizer, "requireFailure", this)) return this;
				var requireFail = this.requireFail;
				otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
				if (inArray(requireFail, otherRecognizer) === -1) {
					requireFail.push(otherRecognizer);
					otherRecognizer.requireFailure(this);
				}
				return this;
			},
			/**
			* drop the requireFailure link. it does not remove the link on the other recognizer.
			* @param {Recognizer} otherRecognizer
			* @returns {Recognizer} this
			*/
			dropRequireFailure: function(otherRecognizer) {
				if (invokeArrayArg(otherRecognizer, "dropRequireFailure", this)) return this;
				otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
				var index = inArray(this.requireFail, otherRecognizer);
				if (index > -1) this.requireFail.splice(index, 1);
				return this;
			},
			/**
			* has require failures boolean
			* @returns {boolean}
			*/
			hasRequireFailures: function() {
				return this.requireFail.length > 0;
			},
			/**
			* if the recognizer can recognize simultaneous with an other recognizer
			* @param {Recognizer} otherRecognizer
			* @returns {Boolean}
			*/
			canRecognizeWith: function(otherRecognizer) {
				return !!this.simultaneous[otherRecognizer.id];
			},
			/**
			* You should use `tryEmit` instead of `emit` directly to check
			* that all the needed recognizers has failed before emitting.
			* @param {Object} input
			*/
			emit: function(input) {
				var self = this;
				var state = this.state;
				function emit(event) {
					self.manager.emit(event, input);
				}
				if (state < STATE_ENDED) emit(self.options.event + stateStr(state));
				emit(self.options.event);
				if (input.additionalEvent) emit(input.additionalEvent);
				if (state >= STATE_ENDED) emit(self.options.event + stateStr(state));
			},
			/**
			* Check that all the require failure recognizers has failed,
			* if true, it emits a gesture event,
			* otherwise, setup the state to FAILED.
			* @param {Object} input
			*/
			tryEmit: function(input) {
				if (this.canEmit()) return this.emit(input);
				this.state = STATE_FAILED;
			},
			/**
			* can we emit?
			* @returns {boolean}
			*/
			canEmit: function() {
				var i = 0;
				while (i < this.requireFail.length) {
					if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) return false;
					i++;
				}
				return true;
			},
			/**
			* update the recognizer
			* @param {Object} inputData
			*/
			recognize: function(inputData) {
				var inputDataClone = assign({}, inputData);
				if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
					this.reset();
					this.state = STATE_FAILED;
					return;
				}
				if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) this.state = STATE_POSSIBLE;
				this.state = this.process(inputDataClone);
				if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) this.tryEmit(inputDataClone);
			},
			/**
			* return the state of the recognizer
			* the actual recognizing happens in this method
			* @virtual
			* @param {Object} inputData
			* @returns {Const} STATE
			*/
			process: function(inputData) {},
			/**
			* return the preferred touch-action
			* @virtual
			* @returns {Array}
			*/
			getTouchAction: function() {},
			/**
			* called when the gesture isn't allowed to recognize
			* like when another is being recognized or it is disabled
			* @virtual
			*/
			reset: function() {}
		};
		/**
		* get a usable string, used as event postfix
		* @param {Const} state
		* @returns {String} state
		*/
		function stateStr(state) {
			if (state & STATE_CANCELLED) return "cancel";
			else if (state & STATE_ENDED) return "end";
			else if (state & STATE_CHANGED) return "move";
			else if (state & STATE_BEGAN) return "start";
			return "";
		}
		/**
		* direction cons to string
		* @param {Const} direction
		* @returns {String}
		*/
		function directionStr(direction) {
			if (direction == DIRECTION_DOWN) return "down";
			else if (direction == DIRECTION_UP) return "up";
			else if (direction == DIRECTION_LEFT) return "left";
			else if (direction == DIRECTION_RIGHT) return "right";
			return "";
		}
		/**
		* get a recognizer by name if it is bound to a manager
		* @param {Recognizer|String} otherRecognizer
		* @param {Recognizer} recognizer
		* @returns {Recognizer}
		*/
		function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
			var manager = recognizer.manager;
			if (manager) return manager.get(otherRecognizer);
			return otherRecognizer;
		}
		/**
		* This recognizer is just used as a base for the simple attribute recognizers.
		* @constructor
		* @extends Recognizer
		*/
		function AttrRecognizer() {
			Recognizer.apply(this, arguments);
		}
		inherit(AttrRecognizer, Recognizer, {
			/**
			* @namespace
			* @memberof AttrRecognizer
			*/
			defaults: { 
			/**
			* @type {Number}
			* @default 1
			*/
pointers: 1 },
			/**
			* Used to check if it the recognizer receives valid input, like input.distance > 10.
			* @memberof AttrRecognizer
			* @param {Object} input
			* @returns {Boolean} recognized
			*/
			attrTest: function(input) {
				var optionPointers = this.options.pointers;
				return optionPointers === 0 || input.pointers.length === optionPointers;
			},
			/**
			* Process the input and return the state for the recognizer
			* @memberof AttrRecognizer
			* @param {Object} input
			* @returns {*} State
			*/
			process: function(input) {
				var state = this.state;
				var eventType = input.eventType;
				var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
				var isValid = this.attrTest(input);
				if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) return state | STATE_CANCELLED;
				else if (isRecognized || isValid) {
					if (eventType & INPUT_END) return state | STATE_ENDED;
					else if (!(state & STATE_BEGAN)) return STATE_BEGAN;
					return state | STATE_CHANGED;
				}
				return STATE_FAILED;
			}
		});
		/**
		* Pan
		* Recognized when the pointer is down and moved in the allowed direction.
		* @constructor
		* @extends AttrRecognizer
		*/
		function PanRecognizer() {
			AttrRecognizer.apply(this, arguments);
			this.pX = null;
			this.pY = null;
		}
		inherit(PanRecognizer, AttrRecognizer, {
			/**
			* @namespace
			* @memberof PanRecognizer
			*/
			defaults: {
				event: "pan",
				threshold: 10,
				pointers: 1,
				direction: DIRECTION_ALL
			},
			getTouchAction: function() {
				var direction = this.options.direction;
				var actions = [];
				if (direction & DIRECTION_HORIZONTAL) actions.push(TOUCH_ACTION_PAN_Y);
				if (direction & DIRECTION_VERTICAL) actions.push(TOUCH_ACTION_PAN_X);
				return actions;
			},
			directionTest: function(input) {
				var options = this.options;
				var hasMoved = true;
				var distance = input.distance;
				var direction = input.direction;
				var x = input.deltaX;
				var y = input.deltaY;
				if (!(direction & options.direction)) if (options.direction & DIRECTION_HORIZONTAL) {
					direction = x === 0 ? DIRECTION_NONE : x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
					hasMoved = x != this.pX;
					distance = Math.abs(input.deltaX);
				} else {
					direction = y === 0 ? DIRECTION_NONE : y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
					hasMoved = y != this.pY;
					distance = Math.abs(input.deltaY);
				}
				input.direction = direction;
				return hasMoved && distance > options.threshold && direction & options.direction;
			},
			attrTest: function(input) {
				return AttrRecognizer.prototype.attrTest.call(this, input) && (this.state & STATE_BEGAN || !(this.state & STATE_BEGAN) && this.directionTest(input));
			},
			emit: function(input) {
				this.pX = input.deltaX;
				this.pY = input.deltaY;
				var direction = directionStr(input.direction);
				if (direction) input.additionalEvent = this.options.event + direction;
				this._super.emit.call(this, input);
			}
		});
		/**
		* Pinch
		* Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
		* @constructor
		* @extends AttrRecognizer
		*/
		function PinchRecognizer() {
			AttrRecognizer.apply(this, arguments);
		}
		inherit(PinchRecognizer, AttrRecognizer, {
			/**
			* @namespace
			* @memberof PinchRecognizer
			*/
			defaults: {
				event: "pinch",
				threshold: 0,
				pointers: 2
			},
			getTouchAction: function() {
				return [TOUCH_ACTION_NONE];
			},
			attrTest: function(input) {
				return this._super.attrTest.call(this, input) && (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
			},
			emit: function(input) {
				if (input.scale !== 1) {
					var inOut = input.scale < 1 ? "in" : "out";
					input.additionalEvent = this.options.event + inOut;
				}
				this._super.emit.call(this, input);
			}
		});
		/**
		* Press
		* Recognized when the pointer is down for x ms without any movement.
		* @constructor
		* @extends Recognizer
		*/
		function PressRecognizer() {
			Recognizer.apply(this, arguments);
			this._timer = null;
			this._input = null;
		}
		inherit(PressRecognizer, Recognizer, {
			/**
			* @namespace
			* @memberof PressRecognizer
			*/
			defaults: {
				event: "press",
				pointers: 1,
				time: 251,
				threshold: 9
			},
			getTouchAction: function() {
				return [TOUCH_ACTION_AUTO];
			},
			process: function(input) {
				var options = this.options;
				var validPointers = input.pointers.length === options.pointers;
				var validMovement = input.distance < options.threshold;
				var validTime = input.deltaTime > options.time;
				this._input = input;
				if (!validMovement || !validPointers || input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime) this.reset();
				else if (input.eventType & INPUT_START) {
					this.reset();
					this._timer = setTimeoutContext(function() {
						this.state = STATE_RECOGNIZED;
						this.tryEmit();
					}, options.time, this);
				} else if (input.eventType & INPUT_END) return STATE_RECOGNIZED;
				return STATE_FAILED;
			},
			reset: function() {
				clearTimeout(this._timer);
			},
			emit: function(input) {
				if (this.state !== STATE_RECOGNIZED) return;
				if (input && input.eventType & INPUT_END) this.manager.emit(this.options.event + "up", input);
				else {
					this._input.timeStamp = now();
					this.manager.emit(this.options.event, this._input);
				}
			}
		});
		/**
		* Rotate
		* Recognized when two or more pointer are moving in a circular motion.
		* @constructor
		* @extends AttrRecognizer
		*/
		function RotateRecognizer() {
			AttrRecognizer.apply(this, arguments);
		}
		inherit(RotateRecognizer, AttrRecognizer, {
			/**
			* @namespace
			* @memberof RotateRecognizer
			*/
			defaults: {
				event: "rotate",
				threshold: 0,
				pointers: 2
			},
			getTouchAction: function() {
				return [TOUCH_ACTION_NONE];
			},
			attrTest: function(input) {
				return this._super.attrTest.call(this, input) && (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
			}
		});
		/**
		* Swipe
		* Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
		* @constructor
		* @extends AttrRecognizer
		*/
		function SwipeRecognizer() {
			AttrRecognizer.apply(this, arguments);
		}
		inherit(SwipeRecognizer, AttrRecognizer, {
			/**
			* @namespace
			* @memberof SwipeRecognizer
			*/
			defaults: {
				event: "swipe",
				threshold: 10,
				velocity: .3,
				direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
				pointers: 1
			},
			getTouchAction: function() {
				return PanRecognizer.prototype.getTouchAction.call(this);
			},
			attrTest: function(input) {
				var direction = this.options.direction;
				var velocity;
				if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) velocity = input.overallVelocity;
				else if (direction & DIRECTION_HORIZONTAL) velocity = input.overallVelocityX;
				else if (direction & DIRECTION_VERTICAL) velocity = input.overallVelocityY;
				return this._super.attrTest.call(this, input) && direction & input.offsetDirection && input.distance > this.options.threshold && input.maxPointers == this.options.pointers && abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
			},
			emit: function(input) {
				var direction = directionStr(input.offsetDirection);
				if (direction) this.manager.emit(this.options.event + direction, input);
				this.manager.emit(this.options.event, input);
			}
		});
		/**
		* A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
		* between the given interval and position. The delay option can be used to recognize multi-taps without firing
		* a single tap.
		*
		* The eventData from the emitted event contains the property `tapCount`, which contains the amount of
		* multi-taps being recognized.
		* @constructor
		* @extends Recognizer
		*/
		function TapRecognizer() {
			Recognizer.apply(this, arguments);
			this.pTime = false;
			this.pCenter = false;
			this._timer = null;
			this._input = null;
			this.count = 0;
		}
		inherit(TapRecognizer, Recognizer, {
			/**
			* @namespace
			* @memberof PinchRecognizer
			*/
			defaults: {
				event: "tap",
				pointers: 1,
				taps: 1,
				interval: 300,
				time: 250,
				threshold: 9,
				posThreshold: 10
			},
			getTouchAction: function() {
				return [TOUCH_ACTION_MANIPULATION];
			},
			process: function(input) {
				var options = this.options;
				var validPointers = input.pointers.length === options.pointers;
				var validMovement = input.distance < options.threshold;
				var validTouchTime = input.deltaTime < options.time;
				this.reset();
				if (input.eventType & INPUT_START && this.count === 0) return this.failTimeout();
				if (validMovement && validTouchTime && validPointers) {
					if (input.eventType != INPUT_END) return this.failTimeout();
					var validInterval = this.pTime ? input.timeStamp - this.pTime < options.interval : true;
					var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;
					this.pTime = input.timeStamp;
					this.pCenter = input.center;
					if (!validMultiTap || !validInterval) this.count = 1;
					else this.count += 1;
					this._input = input;
					if (this.count % options.taps === 0) if (!this.hasRequireFailures()) return STATE_RECOGNIZED;
					else {
						this._timer = setTimeoutContext(function() {
							this.state = STATE_RECOGNIZED;
							this.tryEmit();
						}, options.interval, this);
						return STATE_BEGAN;
					}
				}
				return STATE_FAILED;
			},
			failTimeout: function() {
				this._timer = setTimeoutContext(function() {
					this.state = STATE_FAILED;
				}, this.options.interval, this);
				return STATE_FAILED;
			},
			reset: function() {
				clearTimeout(this._timer);
			},
			emit: function() {
				if (this.state == STATE_RECOGNIZED) {
					this._input.tapCount = this.count;
					this.manager.emit(this.options.event, this._input);
				}
			}
		});
		/**
		* Simple way to create a manager with a default set of recognizers.
		* @param {HTMLElement} element
		* @param {Object} [options]
		* @constructor
		*/
		function Hammer(element, options) {
			options = options || {};
			options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
			return new Manager(element, options);
		}
		/**
		* @const {string}
		*/
		Hammer.VERSION = "2.0.7";
		/**
		* default settings
		* @namespace
		*/
		Hammer.defaults = {
			/**
			* set if DOM events are being triggered.
			* But this is slower and unused by simple implementations, so disabled by default.
			* @type {Boolean}
			* @default false
			*/
			domEvents: false,
			/**
			* The value for the touchAction property/fallback.
			* When set to `compute` it will magically set the correct value based on the added recognizers.
			* @type {String}
			* @default compute
			*/
			touchAction: TOUCH_ACTION_COMPUTE,
			/**
			* @type {Boolean}
			* @default true
			*/
			enable: true,
			/**
			* EXPERIMENTAL FEATURE -- can be removed/changed
			* Change the parent input target element.
			* If Null, then it is being set the to main element.
			* @type {Null|EventTarget}
			* @default null
			*/
			inputTarget: null,
			/**
			* force an input class
			* @type {Null|Function}
			* @default null
			*/
			inputClass: null,
			/**
			* Default recognizer setup when calling `Hammer()`
			* When creating a new Manager these will be skipped.
			* @type {Array}
			*/
			preset: [
				[RotateRecognizer, { enable: false }],
				[
					PinchRecognizer,
					{ enable: false },
					["rotate"]
				],
				[SwipeRecognizer, { direction: DIRECTION_HORIZONTAL }],
				[
					PanRecognizer,
					{ direction: DIRECTION_HORIZONTAL },
					["swipe"]
				],
				[TapRecognizer],
				[
					TapRecognizer,
					{
						event: "doubletap",
						taps: 2
					},
					["tap"]
				],
				[PressRecognizer]
			],
			/**
			* Some CSS properties can be used to improve the working of Hammer.
			* Add them to this method and they will be set when creating a new Manager.
			* @namespace
			*/
			cssProps: {
				/**
				* Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
				* @type {String}
				* @default 'none'
				*/
				userSelect: "none",
				/**
				* Disable the Windows Phone grippers when pressing an element.
				* @type {String}
				* @default 'none'
				*/
				touchSelect: "none",
				/**
				* Disables the default callout shown when you touch and hold a touch target.
				* On iOS, when you touch and hold a touch target such as a link, Safari displays
				* a callout containing information about the link. This property allows you to disable that callout.
				* @type {String}
				* @default 'none'
				*/
				touchCallout: "none",
				/**
				* Specifies whether zooming is enabled. Used by IE10>
				* @type {String}
				* @default 'none'
				*/
				contentZooming: "none",
				/**
				* Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
				* @type {String}
				* @default 'none'
				*/
				userDrag: "none",
				/**
				* Overrides the highlight color shown when the user taps a link or a JavaScript
				* clickable element in iOS. This property obeys the alpha value, if specified.
				* @type {String}
				* @default 'rgba(0,0,0,0)'
				*/
				tapHighlightColor: "rgba(0,0,0,0)"
			}
		};
		var STOP = 1;
		var FORCED_STOP = 2;
		/**
		* Manager
		* @param {HTMLElement} element
		* @param {Object} [options]
		* @constructor
		*/
		function Manager(element, options) {
			this.options = assign({}, Hammer.defaults, options || {});
			this.options.inputTarget = this.options.inputTarget || element;
			this.handlers = {};
			this.session = {};
			this.recognizers = [];
			this.oldCssProps = {};
			this.element = element;
			this.input = createInputInstance(this);
			this.touchAction = new TouchAction(this, this.options.touchAction);
			toggleCssProps(this, true);
			each(this.options.recognizers, function(item) {
				var recognizer = this.add(new item[0](item[1]));
				item[2] && recognizer.recognizeWith(item[2]);
				item[3] && recognizer.requireFailure(item[3]);
			}, this);
		}
		Manager.prototype = {
			/**
			* set options
			* @param {Object} options
			* @returns {Manager}
			*/
			set: function(options) {
				assign(this.options, options);
				if (options.touchAction) this.touchAction.update();
				if (options.inputTarget) {
					this.input.destroy();
					this.input.target = options.inputTarget;
					this.input.init();
				}
				return this;
			},
			/**
			* stop recognizing for this session.
			* This session will be discarded, when a new [input]start event is fired.
			* When forced, the recognizer cycle is stopped immediately.
			* @param {Boolean} [force]
			*/
			stop: function(force) {
				this.session.stopped = force ? FORCED_STOP : STOP;
			},
			/**
			* run the recognizers!
			* called by the inputHandler function on every movement of the pointers (touches)
			* it walks through all the recognizers and tries to detect the gesture that is being made
			* @param {Object} inputData
			*/
			recognize: function(inputData) {
				var session = this.session;
				if (session.stopped) return;
				this.touchAction.preventDefaults(inputData);
				var recognizer;
				var recognizers = this.recognizers;
				var curRecognizer = session.curRecognizer;
				if (!curRecognizer || curRecognizer && curRecognizer.state & STATE_RECOGNIZED) curRecognizer = session.curRecognizer = null;
				var i = 0;
				while (i < recognizers.length) {
					recognizer = recognizers[i];
					if (session.stopped !== FORCED_STOP && (!curRecognizer || recognizer == curRecognizer || recognizer.canRecognizeWith(curRecognizer))) recognizer.recognize(inputData);
					else recognizer.reset();
					if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) curRecognizer = session.curRecognizer = recognizer;
					i++;
				}
			},
			/**
			* get a recognizer by its event name.
			* @param {Recognizer|String} recognizer
			* @returns {Recognizer|Null}
			*/
			get: function(recognizer) {
				if (recognizer instanceof Recognizer) return recognizer;
				var recognizers = this.recognizers;
				for (var i = 0; i < recognizers.length; i++) if (recognizers[i].options.event == recognizer) return recognizers[i];
				return null;
			},
			/**
			* add a recognizer to the manager
			* existing recognizers with the same event name will be removed
			* @param {Recognizer} recognizer
			* @returns {Recognizer|Manager}
			*/
			add: function(recognizer) {
				if (invokeArrayArg(recognizer, "add", this)) return this;
				var existing = this.get(recognizer.options.event);
				if (existing) this.remove(existing);
				this.recognizers.push(recognizer);
				recognizer.manager = this;
				this.touchAction.update();
				return recognizer;
			},
			/**
			* remove a recognizer by name or instance
			* @param {Recognizer|String} recognizer
			* @returns {Manager}
			*/
			remove: function(recognizer) {
				if (invokeArrayArg(recognizer, "remove", this)) return this;
				recognizer = this.get(recognizer);
				if (recognizer) {
					var recognizers = this.recognizers;
					var index = inArray(recognizers, recognizer);
					if (index !== -1) {
						recognizers.splice(index, 1);
						this.touchAction.update();
					}
				}
				return this;
			},
			/**
			* bind event
			* @param {String} events
			* @param {Function} handler
			* @returns {EventEmitter} this
			*/
			on: function(events, handler) {
				if (events === undefined) return;
				if (handler === undefined) return;
				var handlers = this.handlers;
				each(splitStr(events), function(event) {
					handlers[event] = handlers[event] || [];
					handlers[event].push(handler);
				});
				return this;
			},
			/**
			* unbind event, leave emit blank to remove all handlers
			* @param {String} events
			* @param {Function} [handler]
			* @returns {EventEmitter} this
			*/
			off: function(events, handler) {
				if (events === undefined) return;
				var handlers = this.handlers;
				each(splitStr(events), function(event) {
					if (!handler) delete handlers[event];
					else handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
				});
				return this;
			},
			/**
			* emit event to the listeners
			* @param {String} event
			* @param {Object} data
			*/
			emit: function(event, data) {
				if (this.options.domEvents) triggerDomEvent(event, data);
				var handlers = this.handlers[event] && this.handlers[event].slice();
				if (!handlers || !handlers.length) return;
				data.type = event;
				data.preventDefault = function() {
					data.srcEvent.preventDefault();
				};
				var i = 0;
				while (i < handlers.length) {
					handlers[i](data);
					i++;
				}
			},
			/**
			* destroy the manager and unbinds all events
			* it doesn't unbind dom events, that is the user own responsibility
			*/
			destroy: function() {
				this.element && toggleCssProps(this, false);
				this.handlers = {};
				this.session = {};
				this.input.destroy();
				this.element = null;
			}
		};
		/**
		* add/remove the css properties as defined in manager.options.cssProps
		* @param {Manager} manager
		* @param {Boolean} add
		*/
		function toggleCssProps(manager, add) {
			var element = manager.element;
			if (!element.style) return;
			var prop;
			each(manager.options.cssProps, function(value, name) {
				prop = prefixed(element.style, name);
				if (add) {
					manager.oldCssProps[prop] = element.style[prop];
					element.style[prop] = value;
				} else element.style[prop] = manager.oldCssProps[prop] || "";
			});
			if (!add) manager.oldCssProps = {};
		}
		/**
		* trigger dom event
		* @param {String} event
		* @param {Object} data
		*/
		function triggerDomEvent(event, data) {
			var gestureEvent = document.createEvent("Event");
			gestureEvent.initEvent(event, true, true);
			gestureEvent.gesture = data;
			data.target.dispatchEvent(gestureEvent);
		}
		assign(Hammer, {
			INPUT_START,
			INPUT_MOVE,
			INPUT_END,
			INPUT_CANCEL,
			STATE_POSSIBLE,
			STATE_BEGAN,
			STATE_CHANGED,
			STATE_ENDED,
			STATE_RECOGNIZED,
			STATE_CANCELLED,
			STATE_FAILED,
			DIRECTION_NONE,
			DIRECTION_LEFT,
			DIRECTION_RIGHT,
			DIRECTION_UP,
			DIRECTION_DOWN,
			DIRECTION_HORIZONTAL,
			DIRECTION_VERTICAL,
			DIRECTION_ALL,
			Manager,
			Input,
			TouchAction,
			TouchInput,
			MouseInput,
			PointerEventInput,
			TouchMouseInput,
			SingleTouchInput,
			Recognizer,
			AttrRecognizer,
			Tap: TapRecognizer,
			Pan: PanRecognizer,
			Swipe: SwipeRecognizer,
			Pinch: PinchRecognizer,
			Rotate: RotateRecognizer,
			Press: PressRecognizer,
			on: addEventListeners,
			off: removeEventListeners,
			each,
			merge,
			extend,
			assign,
			inherit,
			bindFn,
			prefixed
		});
		var freeGlobal = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
		freeGlobal.Hammer = Hammer;
		if (typeof define === "function" && define.amd) define(function() {
			return Hammer;
		});
		else if (typeof module != "undefined" && module.exports) module.exports = Hammer;
		else window[exportName] = Hammer;
	})(window, document, "Hammer");
}));
//#endregion
//#region node_modules/hamsterjs/hamster.js
var require_hamster = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(window, document) {
		"use strict";
		/**
		* Hamster
		* use this to create instances
		* @returns {Hamster.Instance}
		* @constructor
		*/
		var Hamster = function(element) {
			return new Hamster.Instance(element);
		};
		Hamster.SUPPORT = "wheel";
		Hamster.ADD_EVENT = "addEventListener";
		Hamster.REMOVE_EVENT = "removeEventListener";
		Hamster.PREFIX = "";
		Hamster.READY = false;
		Hamster.Instance = function(element) {
			if (!Hamster.READY) {
				Hamster.normalise.browser();
				Hamster.READY = true;
			}
			this.element = element;
			this.handlers = [];
			return this;
		};
		/**
		* create new hamster instance
		* all methods should return the instance itself, so it is chainable.
		* @param   {HTMLElement}       element
		* @returns {Hamster.Instance}
		* @constructor
		*/
		Hamster.Instance.prototype = {
			/**
			* bind events to the instance
			* @param   {Function}    handler
			* @param   {Boolean}     useCapture
			* @returns {Hamster.Instance}
			*/
			wheel: function onEvent(handler, useCapture) {
				Hamster.event.add(this, Hamster.SUPPORT, handler, useCapture);
				if (Hamster.SUPPORT === "DOMMouseScroll") Hamster.event.add(this, "MozMousePixelScroll", handler, useCapture);
				return this;
			},
			/**
			* unbind events to the instance
			* @param   {Function}    handler
			* @param   {Boolean}     useCapture
			* @returns {Hamster.Instance}
			*/
			unwheel: function offEvent(handler, useCapture) {
				if (handler === void 0 && (handler = this.handlers.slice(-1)[0])) handler = handler.original;
				Hamster.event.remove(this, Hamster.SUPPORT, handler, useCapture);
				if (Hamster.SUPPORT === "DOMMouseScroll") Hamster.event.remove(this, "MozMousePixelScroll", handler, useCapture);
				return this;
			}
		};
		Hamster.event = {
			/**
			* cross-browser 'addWheelListener'
			* @param   {Instance}    hamster
			* @param   {String}      eventName
			* @param   {Function}    handler
			* @param   {Boolean}     useCapture
			*/
			add: function add(hamster, eventName, handler, useCapture) {
				var originalHandler = handler;
				handler = function(originalEvent) {
					if (!originalEvent) originalEvent = window.event;
					var event = Hamster.normalise.event(originalEvent), delta = Hamster.normalise.delta(originalEvent);
					return originalHandler(event, delta[0], delta[1], delta[2]);
				};
				hamster.element[Hamster.ADD_EVENT](Hamster.PREFIX + eventName, handler, useCapture || false);
				hamster.handlers.push({
					original: originalHandler,
					normalised: handler
				});
			},
			/**
			* removeWheelListener
			* @param   {Instance}    hamster
			* @param   {String}      eventName
			* @param   {Function}    handler
			* @param   {Boolean}     useCapture
			*/
			remove: function remove(hamster, eventName, handler, useCapture) {
				var originalHandler = handler, lookup = {}, handlers;
				for (var i = 0, len = hamster.handlers.length; i < len; ++i) lookup[hamster.handlers[i].original] = hamster.handlers[i];
				handlers = lookup[originalHandler];
				handler = handlers.normalised;
				hamster.element[Hamster.REMOVE_EVENT](Hamster.PREFIX + eventName, handler, useCapture || false);
				for (var h in hamster.handlers) if (hamster.handlers[h] == handlers) {
					hamster.handlers.splice(h, 1);
					break;
				}
			}
		};
		/**
		* these hold the lowest deltas,
		* used to normalise the delta values
		* @type {Number}
		*/
		var lowestDelta, lowestDeltaXY;
		Hamster.normalise = {
			/**
			* fix browser inconsistencies
			*/
			browser: function normaliseBrowser() {
				if (!("onwheel" in document || document.documentMode >= 9)) Hamster.SUPPORT = document.onmousewheel !== void 0 ? "mousewheel" : "DOMMouseScroll";
				if (!window.addEventListener) {
					Hamster.ADD_EVENT = "attachEvent";
					Hamster.REMOVE_EVENT = "detachEvent";
					Hamster.PREFIX = "on";
				}
			},
			/**
			* create a normalised event object
			* @param   {Function}    originalEvent
			* @returns {Object}      event
			*/
			event: function normaliseEvent(originalEvent) {
				var event = {
					originalEvent,
					target: originalEvent.target || originalEvent.srcElement,
					type: "wheel",
					deltaMode: originalEvent.type === "MozMousePixelScroll" ? 0 : 1,
					deltaX: 0,
					deltaZ: 0,
					preventDefault: function() {
						if (originalEvent.preventDefault) originalEvent.preventDefault();
						else originalEvent.returnValue = false;
					},
					stopPropagation: function() {
						if (originalEvent.stopPropagation) originalEvent.stopPropagation();
						else originalEvent.cancelBubble = false;
					}
				};
				if (originalEvent.wheelDelta) event.deltaY = -1 / 40 * originalEvent.wheelDelta;
				if (originalEvent.wheelDeltaX) event.deltaX = -1 / 40 * originalEvent.wheelDeltaX;
				if (originalEvent.detail) event.deltaY = originalEvent.detail;
				return event;
			},
			/**
			* normalise 'deltas' of the mouse wheel
			* @param   {Function}    originalEvent
			* @returns {Array}       deltas
			*/
			delta: function normaliseDelta(originalEvent) {
				var delta = 0, deltaX = 0, deltaY = 0, absDelta = 0, absDeltaXY = 0, fn;
				if (originalEvent.deltaY) {
					deltaY = originalEvent.deltaY * -1;
					delta = deltaY;
				}
				if (originalEvent.deltaX) {
					deltaX = originalEvent.deltaX;
					delta = deltaX * -1;
				}
				if (originalEvent.wheelDelta) delta = originalEvent.wheelDelta;
				if (originalEvent.wheelDeltaY) deltaY = originalEvent.wheelDeltaY;
				if (originalEvent.wheelDeltaX) deltaX = originalEvent.wheelDeltaX * -1;
				if (originalEvent.detail) delta = originalEvent.detail * -1;
				if (delta === 0) return [
					0,
					0,
					0
				];
				absDelta = Math.abs(delta);
				if (!lowestDelta || absDelta < lowestDelta) lowestDelta = absDelta;
				absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
				if (!lowestDeltaXY || absDeltaXY < lowestDeltaXY) lowestDeltaXY = absDeltaXY;
				fn = delta > 0 ? "floor" : "ceil";
				delta = Math[fn](delta / lowestDelta);
				deltaX = Math[fn](deltaX / lowestDeltaXY);
				deltaY = Math[fn](deltaY / lowestDeltaXY);
				return [
					delta,
					deltaX,
					deltaY
				];
			}
		};
		if (typeof window.define === "function" && window.define.amd) window.define("hamster", [], function() {
			return Hamster;
		});
		else if (typeof exports === "object") module.exports = Hamster;
		else window.Hamster = Hamster;
	})(window, window.document);
}));
//#endregion
//#region src/stuff/gestures.js
var cache = null;
var inFlight = null;
function loadGestures() {
	if (cache) return Promise.resolve(cache);
	if (inFlight) return inFlight;
	inFlight = Promise.all([Promise.resolve().then(() => /* @__PURE__ */ __toESM(require_hammer(), 1)), Promise.resolve().then(() => /* @__PURE__ */ __toESM(require_hamster(), 1))]).then(([H, Ha]) => {
		cache = {
			Hammer: H && H.Manager ? H : H.default || H,
			Hamster: Ha && Ha.default ? Ha.default : Ha
		};
		inFlight = null;
		return cache;
	}).catch((err) => {
		inFlight = null;
		throw err;
	});
	return inFlight;
}
//#endregion
//#region src/components/js/grid.js
var Grid = class {
	constructor(canvas, comp, canvasDynamic = null) {
		const config = comp.$props.config || {};
		this.MIN_ZOOM = config.MIN_ZOOM || 25;
		this.MAX_ZOOM = config.MAX_ZOOM || 1e5;
		if (utils_default.is_mobile) this.MIN_ZOOM *= .5;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.canvasDynamic = canvasDynamic;
		this.ctxDynamic = canvasDynamic ? canvasDynamic.getContext("2d") : null;
		this.comp = comp;
		this.$p = comp.$props;
		this.data = this.$p.sub;
		this.id = this.$p.grid_id;
		this.layout = this.$p.layout?.grids?.[this.id];
		this.interval = this.$p.interval;
		this.cursor = comp.$props.cursor;
		this.offset_x = 0;
		this.offset_y = 0;
		this.deltas = 0;
		this.wmode = this.$p.config?.SCROLL_WHEEL;
		this.trackpad = false;
		this._offsetCached = false;
		this._offsetCacheTime = 0;
		this.zoomManager = new ZoomManager(this);
		this.panManager = new PanManager(this);
		this.renderer = new GridRenderer(this);
		this._cursorEventPool = createCursorEventPool();
		this._pooledCursorEvent = this._cursorEventPool.acquire();
		this._destroyed = false;
		this.listeners();
	}
	get range() {
		return this.$p.range;
	}
	get overlays() {
		return this.renderer.overlays;
	}
	set overlays(v) {
		this.renderer.overlays = v;
	}
	async listeners() {
		const { Hammer, Hamster } = await loadGestures();
		if (this._destroyed) return;
		this.hm = Hamster(this.canvasDynamic || this.canvas);
		this._throttledWheel = utils_default.rafThrottle((delta, event) => {
			this.zoomManager.mousezoom(-delta * 50, event);
		});
		this.hm.wheel((event, delta) => this._throttledWheel(delta, event));
		let mc = this.mc = new Hammer.Manager(this.canvasDynamic || this.canvas);
		let T = utils_default.is_mobile ? 10 : 0;
		mc.add(new Hammer.Pan({ threshold: T }));
		mc.add(new Hammer.Tap());
		mc.add(new Hammer.Pinch({ threshold: 0 }));
		mc.get("pinch").set({ enable: true });
		if (utils_default.is_mobile) mc.add(new Hammer.Press());
		mc.on("panstart", (event) => {
			if (!this.range || this.range[0] === void 0 || this.range[1] === void 0) return;
			if (this.cursor.scroll_lock) return;
			if (this.cursor.mode === "aim") return this.emit_cursor_coord(event);
			this.calc_offset();
			let tfrm = this.$p.y_transform;
			this.drug = {
				x: event.center.x + this.offset_x,
				y: event.center.y + this.offset_y,
				r: this.range.slice(),
				t: this.range[1] - this.range[0],
				o: tfrm ? tfrm.offset || 0 : 0,
				y_r: tfrm && tfrm.range ? tfrm.range.slice() : void 0,
				B: this.layout.B,
				t0: utils_default.now()
			};
			this._pooledCursorEvent.grid_id = this.id;
			this._pooledCursorEvent.x = event.center.x + this.offset_x;
			this._pooledCursorEvent.y = event.center.y + this.offset_y;
			this._pooledCursorEvent.mode = void 0;
			this.comp.$emit("cursor-changed", this._pooledCursorEvent);
			this.comp.$emit("cursor-locked", true);
		});
		this._throttledPanmove = utils_default.rafThrottle((event) => {
			if (utils_default.is_mobile) {
				this.calc_offset();
				this.renderer.propagate("mousemove", this.touch2mouse(event));
			}
			if (this.drug) {
				this.panManager.mousedrag(this.drug.x + event.deltaX, this.drug.y + event.deltaY);
				this._pooledCursorEvent.grid_id = this.id;
				this._pooledCursorEvent.x = event.center.x + this.offset_x;
				this._pooledCursorEvent.y = event.center.y + this.offset_y;
				this._pooledCursorEvent.mode = void 0;
				this.comp.$emit("cursor-changed", this._pooledCursorEvent);
			} else if (this.cursor.mode === "aim") this.emit_cursor_coord(event);
		});
		mc.on("panmove", (event) => this._throttledPanmove(event));
		mc.on("panend", (event) => {
			if (utils_default.is_mobile && this.drug) this.panManager.pan_fade(event);
			this.drug = null;
			this.comp.$emit("cursor-locked", false);
		});
		mc.on("tap", (event) => {
			if (!utils_default.is_mobile) return;
			this.sim_mousedown(event);
			this.panManager.stopFade();
			this.comp.$emit("cursor-changed", {});
			this.comp.$emit("cursor-changed", { mode: "explore" });
			this.update();
		});
		mc.on("pinchstart", () => {
			this.drug = null;
			this.pinch = {
				t: this.range[1] - this.range[0],
				r: this.range.slice()
			};
		});
		mc.on("pinchend", () => {
			this.pinch = null;
		});
		mc.on("pinch", (event) => {
			if (this.pinch) this.zoomManager.pinchzoom(event.scale);
		});
		mc.on("press", (event) => {
			if (!utils_default.is_mobile) return;
			this.panManager.stopFade();
			this.calc_offset();
			this.emit_cursor_coord(event, { mode: "aim" });
			if (this._pressTimeout) clearTimeout(this._pressTimeout);
			this._pressTimeout = setTimeout(() => this.update());
			this.sim_mousedown(event);
		});
		let add = addEventListener;
		add("gesturestart", this.gesturestart);
		add("gesturechange", this.gesturechange);
		add("gestureend", this.gestureend);
	}
	gesturestart(event) {
		event.preventDefault();
	}
	gesturechange(event) {
		event.preventDefault();
	}
	gestureend(event) {
		event.preventDefault();
	}
	mousemove(event) {
		if (utils_default.is_mobile) return;
		if (!this.layout || !this.renderer) return;
		this.comp.$emit("cursor-changed", {
			grid_id: this.id,
			x: event.layerX,
			y: event.layerY + (this.layout.offset || 0)
		});
		this.calc_offset();
		this.renderer.propagate("mousemove", event);
	}
	mouseout(event) {
		if (utils_default.is_mobile) return;
		if (!this.renderer) return;
		this.comp.$emit("cursor-changed", {});
		this.renderer.propagate("mouseout", event);
	}
	mouseup(event) {
		this.drug = null;
		this.comp.$emit("cursor-locked", false);
		if (this.renderer) this.renderer.propagate("mouseup", event);
	}
	mousedown(event) {
		if (utils_default.is_mobile) return;
		if (!this.renderer) return;
		this.renderer.propagate("mousedown", event);
		this.comp.$emit("cursor-locked", true);
		if (event.defaultPrevented) return;
		this.comp.$emit("custom-event", {
			event: "grid-mousedown",
			args: [this.id, event]
		});
	}
	sim_mousedown(event) {
		if (event.srcEvent.defaultPrevented) return;
		this.comp.$emit("custom-event", {
			event: "grid-mousedown",
			args: [this.id, event]
		});
		this.renderer.propagate("mousemove", this.touch2mouse(event));
		this.update();
		this.renderer.propagate("mousedown", this.touch2mouse(event));
		if (this._clickTimeout) clearTimeout(this._clickTimeout);
		this._clickTimeout = setTimeout(() => {
			this.renderer.propagate("click", this.touch2mouse(event));
		});
	}
	touch2mouse(e) {
		this.calc_offset();
		return {
			original: e.srcEvent,
			layerX: e.center.x + this.offset_x,
			layerY: e.center.y + this.offset_y,
			preventDefault: function() {
				this.original.preventDefault();
			}
		};
	}
	click(event) {
		this.renderer.propagate("click", event);
	}
	emit_cursor_coord(event, add) {
		const base = {
			grid_id: this.id,
			x: event.center.x + this.offset_x,
			y: event.center.y + this.offset_y + this.layout.offset
		};
		this.comp.$emit("cursor-changed", add ? Object.assign(base, add) : base);
	}
	calc_offset(force = false) {
		const now = Date.now();
		if (force || !this._offsetCached || now - this._offsetCacheTime > 100) {
			let rect = this.canvas.getBoundingClientRect();
			this.offset_x = -rect.x;
			this.offset_y = -rect.y;
			this._offsetCached = true;
			this._offsetCacheTime = now;
		}
	}
	invalidate_offset() {
		this._offsetCached = false;
	}
	new_layer(layer) {
		this.renderer.new_layer(layer);
	}
	del_layer(id) {
		this.renderer.del_layer(id);
	}
	show_hide_layer(event) {
		this.renderer.show_hide_layer(event);
	}
	update() {
		this.renderer.update();
	}
	propagate(name, event) {
		this.renderer.propagate(name, event);
	}
	change_range() {
		if (!this.range.length || this.data.length < 2) return;
		let l = this.data.length - 1;
		let data = this.data;
		let range = this.range;
		range[0] = utils_default.clamp(range[0], -Infinity, data[l][0] - this.interval * 5.5);
		range[1] = utils_default.clamp(range[1], data[0][0] + this.interval * 5.5, Infinity);
		this.comp.$emit("range-changed", range);
	}
	destroy() {
		this._destroyed = true;
		let rm = removeEventListener;
		rm("gesturestart", this.gesturestart);
		rm("gesturechange", this.gesturechange);
		rm("gestureend", this.gestureend);
		if (this.mc) this.mc.destroy();
		if (this.hm) this.hm.unwheel();
		if (this._throttledWheel) this._throttledWheel.cancel();
		if (this._throttledPanmove) this._throttledPanmove.cancel();
		if (this._pressTimeout) clearTimeout(this._pressTimeout);
		if (this._clickTimeout) clearTimeout(this._clickTimeout);
		if (this._cursorEventPool && this._pooledCursorEvent) this._cursorEventPool.release(this._pooledCursorEvent);
		if (this.panManager) this.panManager.destroy();
		if (this.renderer) this.renderer = null;
		if (this.zoomManager) this.zoomManager = null;
		this.ctx = null;
		this.ctxDynamic = null;
		this.canvas = null;
		this.canvasDynamic = null;
	}
};
//#endregion
//#region src/mixins/canvas.js
var canvas_default = {
	methods: {
		setup() {
			const id = `${this.$props.tv_id}-${this._id}-canvas`;
			const canvas = document.getElementById(id);
			if (!canvas) return;
			const dynamicCanvas = document.getElementById(`${id}-dynamic`);
			let dpr = window.devicePixelRatio || 1;
			if (dpr < 1) dpr = 1;
			canvas.style.width = `${this._attrs.width}px`;
			canvas.style.height = `${this._attrs.height}px`;
			if (dynamicCanvas) {
				dynamicCanvas.style.width = `${this._attrs.width}px`;
				dynamicCanvas.style.height = `${this._attrs.height}px`;
			}
			this.$nextTick(() => {
				let rect = canvas.getBoundingClientRect();
				canvas.width = rect.width * dpr;
				canvas.height = rect.height * dpr;
				const ctx = canvas.getContext("2d");
				ctx.scale(dpr, dpr);
				if (dynamicCanvas) {
					dynamicCanvas.width = rect.width * dpr;
					dynamicCanvas.height = rect.height * dpr;
					const ctxDynamic = dynamicCanvas.getContext("2d");
					ctxDynamic.scale(dpr, dpr);
					this._ctxDynamic = ctxDynamic;
					this._canvasDynamic = dynamicCanvas;
				}
				if (this.renderer?.renderer?.markStaticDirty) this.renderer.renderer.markStaticDirty();
				this.redraw();
				if (!ctx.measureTextOrg) ctx.measureTextOrg = ctx.measureText;
				ctx.measureText = (text) => utils_default.measureText(ctx, text, this.$props.tv_id);
			});
		},
		create_canvas(h_arg, id, props) {
			this._id = id;
			this._attrs = props.attrs;
			const baseId = `${this.$props.tv_id}-${id}-canvas`;
			return h("div", {
				class: `trading-vue-${id}`,
				style: {
					left: props.position.x + "px",
					top: props.position.y + "px",
					position: "absolute",
					zIndex: 1
				}
			}, [h("canvas", {
				id: baseId,
				width: props.attrs.width,
				height: props.attrs.height,
				ref: "canvas",
				style: Object.assign({}, props.style, {
					position: "absolute",
					left: 0,
					top: 0
				})
			}), h("canvas", {
				onMousemove: (e) => this.renderer && this.renderer.mousemove(e),
				onMouseout: (e) => this.renderer && this.renderer.mouseout(e),
				onMouseup: (e) => this.renderer && this.renderer.mouseup(e),
				onMousedown: (e) => this.renderer && this.renderer.mousedown(e),
				onDblclick: (e) => this.on_dblclick && this.on_dblclick(e),
				id: `${baseId}-dynamic`,
				width: props.attrs.width,
				height: props.attrs.height,
				ref: "canvasDynamic",
				style: {
					position: "absolute",
					left: 0,
					top: 0,
					pointerEvents: "auto",
					backgroundColor: "transparent"
				}
			})].concat(props.hs || []));
		},
		redraw() {
			if (!this.renderer) return;
			this.renderer.update();
		},
		redrawDynamic() {
			if (!this.renderer) return;
			this.renderer.updateDynamic();
		}
	},
	computed: { canvasDimensions() {
		return `${this.width}x${this.height}`;
	} },
	watch: { canvasDimensions(newVal) {
		if (this._attrs) {
			this._attrs.width = this.width;
			this._attrs.height = this.height;
			this.setup();
		}
	} }
};
//#endregion
//#region src/mixins/uxlist.js
var uxlist_default = {
	methods: {
		on_ux_event(d, target) {
			if (d.event === "new-interface") {
				if (d.args[0].target === target) {
					d.args[0].vars = d.args[0].vars || {};
					d.args[0].grid_id = d.args[1];
					d.args[0].overlay_id = d.args[2];
					this.uxs.push(d.args[0]);
				}
			} else if (d.event === "close-interface") this.uxs = this.uxs.filter((x) => x.uuid !== d.args[0]);
			else if (d.event === "modify-interface") {
				let ux = this.uxs.filter((x) => x.uuid === d.args[0]);
				if (ux.length) this.modify(ux[0], d.args[1]);
			} else if (d.event === "hide-interface") {
				let ux = this.uxs.filter((x) => x.uuid === d.args[0]);
				if (ux.length) {
					ux[0].hidden = true;
					this.modify(ux[0], { hidden: true });
				}
			} else if (d.event === "show-interface") {
				let ux = this.uxs.filter((x) => x.uuid === d.args[0]);
				if (ux.length) this.modify(ux[0], { hidden: false });
			} else return d;
		},
		modify(ux, obj = {}) {
			for (var k in obj) if (k in ux) ux[k] = obj[k];
		},
		remove_all_ux(id) {
			this.uxs = this.uxs.filter((x) => x.overlay.id !== id);
		}
	},
	data() {
		return { uxs: [] };
	}
};
//#endregion
//#region src/components/js/crosshair.js
var DASH_PATTERN = [5];
var Crosshair = class {
	constructor(comp) {
		this.comp = comp;
		this.$p = comp.$props;
		this.data = this.$p.sub;
		this._visible = false;
		this.locked = false;
		this.layout = this.$p.layout;
	}
	draw(ctx) {
		this.layout = this.$p.layout;
		const cursor = this.comp.$props.cursor;
		if (!this.visible && cursor.mode === "explore") return;
		this.x = this.$p.cursor.x;
		this.y = this.$p.cursor.y;
		ctx.save();
		ctx.strokeStyle = this.$p.colors.cross;
		ctx.beginPath();
		ctx.setLineDash(DASH_PATTERN);
		if (this.$p.cursor.grid_id === this.layout.id) {
			ctx.moveTo(0, this.y);
			ctx.lineTo(this.layout.width - .5, this.y);
		}
		ctx.moveTo(this.x, 0);
		ctx.lineTo(this.x, this.layout.height);
		ctx.stroke();
		ctx.restore();
	}
	hide() {
		this.visible = false;
		this.x = void 0;
		this.y = void 0;
	}
	get visible() {
		return this._visible;
	}
	set visible(val) {
		this._visible = val;
	}
};
//#endregion
//#region src/components/Crosshair.vue
var _sfc_main$35 = {
	name: "Crosshair",
	props: [
		"cursor",
		"colors",
		"layout",
		"sub"
	],
	methods: {
		create() {
			this.ch = new Crosshair(this);
			this.$emit("new-grid-layer", {
				name: "crosshair",
				renderer: this.ch
			});
		},
		updateCrosshair() {
			if (!this.ch) this.create();
			const cursor = this.$props.cursor;
			const explore = cursor.mode === "explore";
			const wasVisible = this.ch.visible;
			if (!cursor.x || !cursor.y) {
				if (wasVisible) {
					this.ch.hide();
					this.$emit("redraw-grid");
				}
				return;
			}
			this.ch.visible = !explore;
		}
	},
	watch: {
		"cursor.x": function(newX) {
			this.updateCrosshair();
		},
		"cursor.mode": function(newMode) {
			this.updateCrosshair();
		}
	},
	render() {
		return h("span");
	}
};
//#endregion
//#region src/components/KeyboardListener.vue
var uid_counter = 0;
var _sfc_main$34 = {
	name: "KeyboardListener",
	render() {
		return h("span");
	},
	created: function() {
		this._id = "kb_" + uid_counter++;
		this.$emit("register-kb-listener", {
			id: this._id,
			keydown: this.keydown,
			keyup: this.keyup,
			keypress: this.keypress
		});
	},
	beforeUnmount: function() {
		this.$emit("remove-kb-listener", { id: this._id });
	},
	methods: {
		keydown(event) {
			this.$emit("keydown", event);
		},
		keyup(event) {
			this.$emit("keyup", event);
		},
		keypress(event) {
			this.$emit("keypress", event);
		}
	}
};
//#endregion
//#region \0plugin-vue:export-helper
var _plugin_vue_export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};
//#endregion
//#region src/components/UxWrapper.vue
var _sfc_main$33 = {
	name: "UxWrapper",
	props: [
		"ux",
		"updater",
		"colors",
		"config"
	],
	mounted() {
		this.self = document.getElementById(this.uuid);
		if (!this.self) {
			console.warn(`UxWrapper: element with id ${this.uuid} not found`);
			return;
		}
		this.w = this.self.offsetWidth;
		this.h = this.self.offsetHeight;
		this.update_position();
	},
	created() {
		this.mouse.on("mousemove", this.mousemove);
		this.mouse.on("mouseout", this.mouseout);
	},
	beforeUnmount() {
		this.mouse.off("mousemove", this.mousemove);
		this.mouse.off("mouseout", this.mouseout);
	},
	methods: {
		update_position() {
			if (this.uxr.hidden) return;
			let lw = this.layout.width;
			let lh = this.layout.height;
			let pin = this.uxr.pin;
			let x;
			switch (pin[0]) {
				case "cursor":
					x = this.uxr.overlay.cursor.x;
					break;
				case "mouse":
					x = this.mouse.x;
					break;
				default: if (typeof pin[0] === "string") x = this.parse_coord(pin[0], lw);
				else x = this.layout.t2screen(pin[0]);
			}
			let y;
			switch (pin[1]) {
				case "cursor":
					y = this.uxr.overlay.cursor.y;
					break;
				case "mouse":
					y = this.mouse.y;
					break;
				default: if (typeof pin[1] === "string") y = this.parse_coord(pin[1], lh);
				else y = this.layout.$2screen(pin[1]);
			}
			this.x = x + this.ox;
			this.y = y + this.oy;
		},
		parse_coord(str, scale) {
			str = str.trim();
			if (str === "0" || str === "") return 0;
			let plus = str.split("+");
			if (plus.length === 2) return this.parse_coord(plus[0], scale) + this.parse_coord(plus[1], scale);
			let minus = str.split("-");
			if (minus.length === 2) return this.parse_coord(minus[0], scale) - this.parse_coord(minus[1], scale);
			let per = str.split("%");
			if (per.length === 2) return scale * parseInt(per[0]) / 100;
			let px = str.split("px");
			if (px.length === 2) return parseInt(px[0]);
		},
		mousemove() {
			this.update_position();
			this.visible = true;
		},
		mouseout() {
			if (this.uxr.pin.includes("cursor") || this.uxr.pin.includes("mouse")) this.visible = false;
		},
		on_custom_event(event) {
			this.$emit("custom-event", event);
			if (event.event === "modify-interface") {
				if (this.self) {
					this.w = this.self.offsetWidth;
					this.h = this.self.offsetHeight;
				}
				this.update_position();
			}
		},
		close() {
			this.$emit("custom-event", {
				event: "close-interface",
				args: [this.$props.ux.uuid]
			});
		}
	},
	computed: {
		uxr() {
			return this.$props.ux;
		},
		layout() {
			return this.$props.ux.overlay.layout;
		},
		settings() {
			return this.$props.ux.overlay.settings;
		},
		uuid() {
			return `tvjs-ux-wrapper-${this.uxr.uuid}`;
		},
		mouse() {
			return this.uxr.overlay.mouse;
		},
		style() {
			let st = {
				"display": this.uxr.hidden ? "none" : void 0,
				"left": `${this.x}px`,
				"top": `${this.y}px`,
				"pointer-events": this.uxr.pointer_events || "all",
				"z-index": this.z_index
			};
			if (this.uxr.win_styling !== false) st = Object.assign(st, {
				"border": `1px solid ${this.$props.colors.grid}`,
				"border-radius": "3px",
				"background": `${this.background}`
			});
			return st;
		},
		pin_style() {
			return {
				"left": `${-this.ox}px`,
				"top": `${-this.oy}px`,
				"background-color": this.uxr.pin_color
			};
		},
		btn_style() {
			return {
				"background": `${this.inactive_btn_color}`,
				"color": `${this.inactive_btn_color}`
			};
		},
		pin_pos() {
			return this.uxr.pin_position ? this.uxr.pin_position.split(",") : ["0", "0"];
		},
		ox() {
			if (this.pin_pos.length !== 2) return void 0;
			return -this.parse_coord(this.pin_pos[0], this.w);
		},
		oy() {
			if (this.pin_pos.length !== 2) return void 0;
			return -this.parse_coord(this.pin_pos[1], this.h);
		},
		z_index() {
			return (this.settings["z-index"] || this.settings["zIndex"] || 0) + (this.uxr["z_index"] || 0);
		},
		background() {
			let c = this.uxr.background || this.$props.colors.back;
			return utils_default.apply_opacity(c, this.uxr.background_opacity || this.$props.config.UX_OPACITY);
		},
		inactive_btn_color() {
			return this.uxr.inactive_btn_color || this.$props.colors.grid;
		},
		wrapper() {
			return {
				x: this.x,
				y: this.y,
				pin_x: this.x - this.ox,
				pin_y: this.y - this.oy
			};
		}
	},
	watch: { updater() {
		this.update_position();
	} },
	data() {
		return {
			x: 0,
			y: 0,
			w: 0,
			h: 0,
			visible: true
		};
	}
};
var _hoisted_1$7 = ["id"];
var _hoisted_2$2 = {
	key: 1,
	class: "tvjs-ux-wrapper-head"
};
function _sfc_render$14(_ctx, _cache, $props, $setup, $data, $options) {
	return $data.visible ? (openBlock(), createElementBlock("div", {
		key: 0,
		class: "trading-vue-ux-wrapper",
		id: `tvjs-ux-wrapper-${$props.ux.uuid}`,
		style: normalizeStyle($options.style)
	}, [
		(openBlock(), createBlock(resolveDynamicComponent($props.ux.component), {
			onCustomEvent: $options.on_custom_event,
			ux: $props.ux,
			updater: $props.updater,
			wrapper: $options.wrapper,
			colors: $props.colors
		}, null, 40, [
			"onCustomEvent",
			"ux",
			"updater",
			"wrapper",
			"colors"
		])),
		$props.ux.show_pin ? (openBlock(), createElementBlock("div", {
			key: 0,
			style: normalizeStyle($options.pin_style),
			class: "tvjs-ux-wrapper-pin"
		}, null, 4)) : createCommentVNode("", true),
		$props.ux.win_header !== false ? (openBlock(), createElementBlock("div", _hoisted_2$2, [createElementVNode("div", {
			class: "tvjs-ux-wrapper-close",
			onClick: _cache[0] || (_cache[0] = (...args) => $options.close && $options.close(...args)),
			style: normalizeStyle($options.btn_style)
		}, "×", 4)])) : createCommentVNode("", true)
	], 12, _hoisted_1$7)) : createCommentVNode("", true);
}
//#endregion
//#region src/components/UxLayer.vue
var _sfc_main$32 = {
	name: "UxLayer",
	props: [
		"tv_id",
		"id",
		"uxs",
		"updater",
		"colors",
		"config"
	],
	components: { UxWrapper: /* @__PURE__ */ _plugin_vue_export_helper_default(_sfc_main$33, [["render", _sfc_render$14]]) },
	created() {},
	mounted() {},
	beforeUnmount() {},
	methods: { on_custom_event(event) {
		this.$emit("custom-event", event);
	} },
	computed: { style() {
		return {
			"top": this.$props.id !== 0 ? "1px" : 0,
			"left": 0,
			"width": "100%",
			"height": "calc(100% - 2px)",
			"position": "absolute",
			"z-index": "1",
			"pointer-events": "none",
			"overflow": "hidden"
		};
	} }
};
function _sfc_render$13(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_ux_wrapper = resolveComponent("ux-wrapper");
	return openBlock(), createElementBlock("span", {
		class: normalizeClass(`trading-vue-grid-ux-${$props.id}`),
		style: normalizeStyle($options.style)
	}, [(openBlock(true), createElementBlock(Fragment, null, renderList($props.uxs, (ux) => {
		return openBlock(), createBlock(_component_ux_wrapper, {
			onCustomEvent: $options.on_custom_event,
			key: ux.uuid,
			ux,
			updater: $props.updater,
			colors: $props.colors,
			config: $props.config
		}, null, 8, [
			"onCustomEvent",
			"ux",
			"updater",
			"colors",
			"config"
		]);
	}), 128))], 6);
}
var UxLayer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$32, [["render", _sfc_render$13]]);
//#endregion
//#region src/stuff/mouse.js
var Mouse = class {
	constructor(comp) {
		this.comp = comp;
		this.map = {};
		this.listeners = 0;
		this.pressed = false;
		this.x = comp.$props.cursor.x;
		this.y = comp.$props.cursor.y;
		this.t = comp.$props.cursor.t;
		this.y$ = comp.$props.cursor.y$;
	}
	on(name, handler, dir = "unshift") {
		if (!handler) return;
		this.map[name] = this.map[name] || [];
		this.map[name][dir](handler);
		this.listeners++;
	}
	off(name, handler) {
		if (!this.map[name]) return;
		let i = this.map[name].indexOf(handler);
		if (i < 0) return;
		this.map[name].splice(i, 1);
		this.listeners--;
	}
	emit(name, event) {
		const l = this.comp.layout;
		if (name in this.map) for (var f of this.map[name]) f(event);
		if (name === "mousemove") {
			this.x = event.layerX;
			this.y = event.layerY;
			this.t = l.screen2t(this.x);
			this.y$ = l.screen2$(this.y);
		}
		if (name === "mousedown") this.pressed = true;
		if (name === "mouseup") this.pressed = false;
	}
};
//#endregion
//#region src/mixins/overlay.js
var overlay_default = {
	props: [
		"id",
		"num",
		"interval",
		"cursor",
		"colors",
		"layout",
		"sub",
		"data",
		"settings",
		"grid_id",
		"font",
		"config",
		"meta",
		"tf",
		"i0",
		"last"
	],
	mounted() {
		if (!this.draw) this.draw = (ctx) => {
			console.warn("EARLY ADOPTER BUG: reload the browser & enjoy");
		};
		let main = this.$props.sub === this.$props.data;
		this.meta_info();
		this.$emit("new-grid-layer", {
			name: this.$options.name,
			id: this.$props.id,
			renderer: this,
			display: "display" in this.$props.settings ? this.$props.settings["display"] : true,
			z: this.$props.settings["z-index"] || this.$props.settings["zIndex"] || (main ? 0 : -1)
		});
		this.$emit("layer-meta-props", {
			grid_id: this.$props.grid_id,
			layer_id: this.$props.id,
			legend: this.legend,
			data_colors: this.data_colors,
			y_range: this.y_range
		});
		this.exec_script();
		this.mouse = new Mouse(this);
		if (this.init_tool) this.init_tool();
		if (this.init) this.init();
	},
	beforeUnmount() {
		if (this.destroy) this.destroy();
		this.$emit("delete-grid-layer", this.$props.id);
	},
	methods: {
		use_for() {
			console.warn("use_for() should be implemented");
			console.warn(`Format: use_for() {
                  return ['type1', 'type2', ...]
            }`);
		},
		meta_info() {
			let id = this.$props.id;
			console.warn(`${id} meta_info() is req. for publishing`);
			console.warn(`Format: meta_info() {
                author: 'Satoshi Smith',
                version: '1.0.0',
                contact (opt) '<email>'
                github: (opt) '<GitHub Page>',
            }`);
		},
		custom_event(event, ...args) {
			if (event.split(":")[0] === "hook") return;
			if (event === "change-settings" || event === "object-selected" || event === "new-shader" || event === "new-interface" || event === "remove-tool") {
				args.push(this.grid_id, this.id);
				if (this.$props.settings.$uuid) args.push(this.$props.settings.$uuid);
			}
			if (event === "new-interface") {
				args[0].overlay = this;
				args[0].uuid = this.last_ux_id = `${this.grid_id}-${this.id}-${this.uxs_count++}`;
			}
			if (event === "custom-event") return;
			this.$emit("custom-event", {
				event,
				args
			});
		},
		exec_script() {
			if (this.calc) this.custom_event("exec-script", {
				grid_id: this.$props.grid_id,
				layer_id: this.$props.id,
				src: this.calc(),
				use_for: this.use_for()
			});
		}
	},
	watch: { settingsDisplayKey(newKey, oldKey) {
		if (newKey === oldKey) return;
		if (this.watch_uuid) this.watch_uuid(this.$props.settings, {});
		this.$emit("show-grid-layer", {
			id: this.$props.id,
			display: "display" in this.$props.settings ? this.$props.settings["display"] : true
		});
	} },
	computed: {
		sett() {
			return this.$props.settings || {};
		},
		settingsDisplayKey() {
			const s = this.$props.settings || {};
			return `${s.display},${s["z-index"]},${s.zIndex}`;
		}
	},
	data() {
		return {
			uxs_count: 0,
			last_ux_id: null
		};
	},
	render() {
		return h("span");
	}
};
//#endregion
//#region src/mixins/canvas-drawing.js
var canvas_drawing_default = { methods: {
	/**
	* Draw a data line with coordinate transformation and optional NaN skipping
	* @param {CanvasRenderingContext2D} ctx - Canvas context
	* @param {Array} data - Data array [[timestamp, value, ...], ...]
	* @param {number} index - Data index to use for Y values (default: 1)
	* @param {boolean} skipNaN - Whether to skip NaN/null values (default: true)
	*/
	drawDataLine(ctx, data, index = 1, skipNaN = true) {
		const layout = this.$props.layout;
		if (!skipNaN) for (let k = 0, n = data.length; k < n; k++) {
			let p = data[k];
			let x = layout.t2screen(p[0]);
			let y = layout.$2screen(p[index]);
			ctx.lineTo(x, y);
		}
		else {
			let skip = false;
			for (let k = 0, n = data.length; k < n; k++) {
				let p = data[k];
				let x = layout.t2screen(p[0]);
				let y = layout.$2screen(p[index]);
				if (p[index] == null || y !== y) skip = true;
				else {
					if (skip) ctx.moveTo(x, y);
					ctx.lineTo(x, y);
					skip = false;
				}
			}
		}
	},
	/**
	* Draw a step line (horizontal then vertical segments)
	* @param {CanvasRenderingContext2D} ctx - Canvas context
	* @param {Array} data - Data array
	* @param {number} index - Data index for Y values
	*/
	drawStepLine(ctx, data, index = 1) {
		const layout = this.$props.layout;
		let prevX = null;
		let prevY = null;
		for (let k = 0, n = data.length; k < n; k++) {
			let p = data[k];
			let x = layout.t2screen(p[0]);
			let y = layout.$2screen(p[index]);
			if (p[index] == null || y !== y) {
				prevX = null;
				prevY = null;
				continue;
			}
			if (prevX !== null && prevY !== null) {
				ctx.lineTo(x, prevY);
				ctx.lineTo(x, y);
			} else ctx.moveTo(x, y);
			prevX = x;
			prevY = y;
		}
	},
	/**
	* Draw a filled band/channel between two data indices
	* @param {CanvasRenderingContext2D} ctx - Canvas context
	* @param {Array} data - Data array
	* @param {number} topIndex - Data index for top line
	* @param {number} bottomIndex - Data index for bottom line
	*/
	drawBandFill(ctx, data, topIndex, bottomIndex) {
		const layout = this.$props.layout;
		ctx.beginPath();
		for (let i = 0; i < data.length; i++) {
			let p = data[i];
			let x = layout.t2screen(p[0]);
			let y = layout.$2screen(p[topIndex] != null ? p[topIndex] : void 0);
			ctx.lineTo(x, y);
		}
		for (let i = data.length - 1; i >= 0; i--) {
			let p = data[i];
			let x = layout.t2screen(p[0]);
			let y = layout.$2screen(p[bottomIndex] != null ? p[bottomIndex] : void 0);
			ctx.lineTo(x, y);
		}
		ctx.fill();
	},
	/**
	* Draw multiple lines from a single data array
	* @param {CanvasRenderingContext2D} ctx - Canvas context
	* @param {Array} data - Data array
	* @param {Array} indices - Array of data indices to draw
	* @param {boolean} skipNaN - Whether to skip NaN values
	*/
	drawMultiLines(ctx, data, indices, skipNaN = true) {
		for (let idx of indices) {
			ctx.beginPath();
			this.drawDataLine(ctx, data, idx, skipNaN);
			ctx.stroke();
		}
	},
	/**
	* Setup stroke style on canvas context
	* @param {CanvasRenderingContext2D} ctx - Canvas context
	* @param {number} width - Line width
	* @param {string} color - Stroke color
	*/
	setupStroke(ctx, width, color) {
		ctx.lineWidth = width;
		ctx.strokeStyle = color;
	},
	/**
	* Setup fill and stroke style
	* @param {CanvasRenderingContext2D} ctx - Canvas context
	* @param {number} strokeWidth - Line width
	* @param {string} strokeColor - Stroke color
	* @param {string} fillColor - Fill color
	*/
	setupFillAndStroke(ctx, strokeWidth, strokeColor, fillColor) {
		ctx.lineWidth = strokeWidth;
		ctx.strokeStyle = strokeColor;
		ctx.fillStyle = fillColor;
	},
	/**
	* Iterate over data points with coordinate transformation
	* @param {Array} data - Data array
	* @param {Function} callback - Called with (point, x, y, index) for each point
	* @param {Object} options - { index: 1, skipNaN: true }
	*/
	iterateData(data, callback, options = {}) {
		const layout = this.$props.layout;
		const index = options.index || 1;
		const skipNaN = options.skipNaN !== false;
		for (let k = 0, n = data.length; k < n; k++) {
			let p = data[k];
			let x = layout.t2screen(p[0]);
			let y = layout.$2screen(p[index]);
			if (skipNaN && (p[index] == null || y !== y)) continue;
			callback(p, x, y, k);
		}
	},
	/**
	* Transform a single point to screen coordinates
	* @param {Array} point - Data point [timestamp, value, ...]
	* @param {number} index - Data index for Y value
	* @returns {Array} [x, y] screen coordinates
	*/
	pointToScreen(point, index = 1) {
		const layout = this.$props.layout;
		return [layout.t2screen(point[0]), layout.$2screen(point[index])];
	}
} };
//#endregion
//#region src/components/overlays/Spline.vue
var _sfc_main$31 = {
	name: "Spline",
	mixins: [overlay_default, canvas_drawing_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.1.2"
			};
		},
		draw(ctx) {
			this.setupStroke(ctx, this.line_width, this.color);
			ctx.beginPath();
			this.drawDataLine(ctx, this.$props.data, this.data_index, this.skip_nan);
			ctx.stroke();
		},
		use_for() {
			return [
				"Spline",
				"EMA",
				"SMA"
			];
		},
		data_colors() {
			return [this.color];
		}
	},
	computed: {
		line_width() {
			return this.sett.lineWidth || .75;
		},
		color() {
			const n = this.$props.num % 5;
			return this.sett.color || constants_default.OVERLAY_COLORS[n];
		},
		data_index() {
			return this.sett.dataIndex || 1;
		},
		skip_nan() {
			return this.sett.skipNaN;
		}
	}
};
//#endregion
//#region src/components/overlays/Splines.vue
var _sfc_main$30 = {
	name: "Splines",
	mixins: [overlay_default, canvas_drawing_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.1.0"
			};
		},
		draw(ctx) {
			for (let i = 0; i < this.lines_num; i++) {
				let colorIdx = i % this.clrx.length;
				this.setupStroke(ctx, this.widths[i] || this.line_width, this.clrx[colorIdx]);
				ctx.beginPath();
				this.drawDataLine(ctx, this.$props.data, i + 1, this.skip_nan);
				ctx.stroke();
			}
		},
		use_for() {
			return ["Splines", "DMI"];
		},
		data_colors() {
			return this.clrx;
		}
	},
	computed: {
		line_width() {
			return this.sett.lineWidth || .75;
		},
		widths() {
			return this.sett.lineWidths || [];
		},
		clrx() {
			let colors = this.sett.colors || [];
			let n = this.$props.num;
			if (!colors.length) for (let i = 0; i < this.lines_num; i++) colors.push(constants_default.OVERLAY_COLORS[(n + i) % 5]);
			return colors;
		},
		lines_num() {
			if (!this.$props.data[0]) return 0;
			return this.$props.data[0].length - 1;
		},
		skip_nan() {
			return this.sett.skipNaN;
		}
	}
};
//#endregion
//#region src/components/overlays/Range.vue
var _sfc_main$29 = {
	name: "Range",
	mixins: [overlay_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.0.1"
			};
		},
		draw(ctx) {
			const layout = this.$props.layout;
			const upper = layout.$2screen(this.sett.upper || 70);
			const lower = layout.$2screen(this.sett.lower || 30);
			const data = this.$props.data;
			ctx.lineWidth = this.line_width;
			ctx.strokeStyle = this.color;
			ctx.beginPath();
			for (var k = 0, n = data.length; k < n; k++) {
				let p = data[k];
				let x = layout.t2screen(p[0]);
				let y = layout.$2screen(p[1]);
				ctx.lineTo(x, y);
			}
			ctx.stroke();
			ctx.strokeStyle = this.band_color;
			ctx.setLineDash([5]);
			ctx.beginPath();
			ctx.fillStyle = this.back_color;
			ctx.fillRect(0, upper, layout.width, lower - upper);
			ctx.moveTo(0, upper);
			ctx.lineTo(layout.width, upper);
			ctx.moveTo(0, lower);
			ctx.lineTo(layout.width, lower);
			ctx.stroke();
			ctx.setLineDash([]);
		},
		use_for() {
			return ["Range", "RSI"];
		},
		data_colors() {
			return [this.color];
		},
		y_range(hi, lo) {
			return [Math.max(hi, this.sett.upper || 70), Math.min(lo, this.sett.lower || 30)];
		}
	},
	computed: {
		line_width() {
			return this.sett.lineWidth || .75;
		},
		color() {
			return this.sett.color || "#ec206e";
		},
		band_color() {
			return this.sett.bandColor || "#ddd";
		},
		back_color() {
			return this.sett.backColor || "#381e9c16";
		}
	}
};
//#endregion
//#region src/components/overlays/Trades.vue
var _sfc_main$28 = {
	name: "Trades",
	mixins: [overlay_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.0.2"
			};
		},
		draw(ctx) {
			const layout = this.$props.layout;
			const data = this.$props.data;
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = "black";
			for (let k = 0, n = data.length; k < n; k++) {
				let p = data[k];
				ctx.fillStyle = p[1] ? this.buy_color : this.sell_color;
				ctx.beginPath();
				let x = layout.t2screen(p[0]);
				let y = layout.$2screen(p[2]);
				ctx.arc(x, y, this.marker_size + .5, 0, Math.PI * 2, true);
				ctx.fill();
				ctx.stroke();
				if (this.show_label && p[3]) this.draw_label(ctx, x, y, p);
			}
		},
		draw_label(ctx, x, y, p) {
			ctx.fillStyle = this.label_color;
			ctx.font = this.new_font;
			ctx.textAlign = "center";
			ctx.fillText(p[3], x, y - 25);
		},
		use_for() {
			return ["Trades"];
		},
		legend(values) {
			let pos;
			switch (values[1]) {
				case 0:
					pos = "Sell";
					break;
				case 1:
					pos = "Buy";
					break;
				default: pos = "Unknown";
			}
			return [{ value: pos }, {
				value: values[2].toFixed(4),
				color: this.$props.colors.text
			}].concat(values[3] ? [{ value: values[3] }] : []);
		}
	},
	computed: {
		default_font() {
			return "12px " + this.$props.font.split("px").pop();
		},
		buy_color() {
			return this.sett.buyColor || "#63df89";
		},
		sell_color() {
			return this.sett.sellColor || "#ec4662";
		},
		label_color() {
			return this.sett.labelColor || "#999";
		},
		marker_size() {
			return this.sett.markerSize || 5;
		},
		show_label() {
			return this.sett.showLabel !== false;
		},
		new_font() {
			return this.sett.font || this.default_font;
		}
	}
};
//#endregion
//#region src/components/overlays/Channel.vue
var _sfc_main$27 = {
	name: "Channel",
	mixins: [overlay_default, canvas_drawing_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.0.1"
			};
		},
		draw(ctx) {
			const data = this.$props.data;
			ctx.fillStyle = this.back_color;
			this.drawBandFill(ctx, data, 1, 3);
			this.setupStroke(ctx, this.line_width, this.color);
			ctx.beginPath();
			this.drawDataLine(ctx, data, 1, false);
			ctx.stroke();
			ctx.beginPath();
			this.drawDataLine(ctx, data, 3, false);
			ctx.stroke();
			if (this.show_mid) {
				ctx.beginPath();
				this.drawDataLine(ctx, data, 2, false);
				ctx.stroke();
			}
		},
		use_for() {
			return [
				"Channel",
				"KC",
				"BB"
			];
		},
		data_colors() {
			return [
				this.color,
				this.color,
				this.color
			];
		}
	},
	computed: {
		line_width() {
			return this.sett.lineWidth || .75;
		},
		color() {
			const n = this.$props.num % 5;
			return this.sett.color || constants_default.OVERLAY_COLORS[n];
		},
		show_mid() {
			return "showMid" in this.sett ? this.sett.showMid : true;
		},
		back_color() {
			return this.sett.backColor || this.color + "11";
		}
	}
};
//#endregion
//#region src/components/overlays/Segment.vue
var _sfc_main$26 = {
	name: "Segment",
	mixins: [overlay_default, canvas_drawing_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.0.0"
			};
		},
		draw(ctx) {
			if (!this.p1 || !this.p2) return;
			this.setupStroke(ctx, this.line_width, this.color);
			ctx.beginPath();
			let [x1, y1] = this.pointToScreen(this.p1);
			let [x2, y2] = this.pointToScreen(this.p2);
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		},
		use_for() {
			return ["Segment"];
		},
		data_colors() {
			return [this.color];
		}
	},
	computed: {
		p1() {
			return this.$props.settings.p1;
		},
		p2() {
			return this.$props.settings.p2;
		},
		line_width() {
			return this.sett.lineWidth || .9;
		},
		color() {
			const n = this.$props.num % 5;
			return this.sett.color || constants_default.OVERLAY_COLORS[n];
		}
	}
};
//#endregion
//#region src/components/js/layout_cnv.js
function layout_cnv(self) {
	let $p = self.$props;
	let sub = $p.data;
	let t2screen = $p.layout.t2screen;
	let layout = $p.layout;
	let candles = [];
	let volume = [];
	let maxv = utils_default.maxAtIndex(sub, 5);
	let vs = maxv > 0 ? $p.config.VOLSCALE * layout.height / maxv : 0, x1, x2, mid, prev = void 0;
	let [interval2, ratio] = new_interval(layout, $p, sub);
	let px_step2 = layout.px_step * ratio;
	let splitter = px_step2 > 5 ? 1 : 0;
	for (let i = 0; i < sub.length; i++) {
		let p = sub[i];
		mid = t2screen(p[0]) + 1;
		if (sub[i - 1] && p[0] - sub[i - 1][0] > interval2) prev = null;
		x1 = prev || Math.floor(mid - px_step2 * .5);
		x2 = Math.floor(mid + px_step2 * .5) - .5;
		candles.push({
			x: mid,
			w: layout.px_step * $p.config.CANDLEW * ratio,
			o: Math.floor(p[1] * layout.A + layout.B),
			h: Math.floor(p[2] * layout.A + layout.B),
			l: Math.floor(p[3] * layout.A + layout.B),
			c: Math.floor(p[4] * layout.A + layout.B),
			raw: p
		});
		volume.push({
			x1,
			x2,
			h: p[5] * vs,
			green: p[4] >= p[1],
			raw: p
		});
		prev = x2 + splitter;
	}
	return {
		candles,
		volume
	};
}
function layout_vol(self) {
	let $p = self.$props;
	let sub = $p.data;
	let t2screen = $p.layout.t2screen;
	let layout = $p.layout;
	let volume = [];
	let dim = sub[0] ? sub[0].length : 0;
	self._i1 = dim < 6 ? 1 : 5;
	self._i2 = dim < 6 ? ((p) => p[2]) : ((p) => p[4] >= p[1]);
	let maxv = utils_default.maxAtIndex(sub, self._i1);
	let volscale = self.volscale || $p.config.VOLSCALE;
	let vs = maxv > 0 ? volscale * layout.height / maxv : 0;
	let x1, x2, mid, prev = void 0;
	let [interval2, ratio] = new_interval(layout, $p, sub);
	let px_step2 = layout.px_step * ratio;
	let splitter = px_step2 > 5 ? 1 : 0;
	for (let i = 0; i < sub.length; i++) {
		let p = sub[i];
		mid = t2screen(p[0]) + 1;
		if (sub[i - 1] && p[0] - sub[i - 1][0] > interval2) prev = null;
		x1 = prev || Math.floor(mid - px_step2 * .5);
		x2 = Math.floor(mid + px_step2 * .5) - .5;
		volume.push({
			x1,
			x2,
			h: p[self._i1] * vs,
			green: self._i2(p),
			raw: p
		});
		prev = x2 + splitter;
	}
	return volume;
}
function new_interval(layout, $p, sub) {
	let interval2, ratio;
	if (!layout.ti_map.ib) {
		interval2 = $p.tf || $p.interval || utils_default.detect_interval(sub);
		ratio = interval2 / $p.interval;
	} else if ($p.tf) {
		ratio = $p.tf / layout.ti_map.tf;
		interval2 = ratio;
	} else {
		interval2 = $p.interval || utils_default.detect_interval(sub);
		ratio = interval2 / $p.interval;
	}
	return [interval2, ratio];
}
//#endregion
//#region src/components/primitives/candle-draw.js
/**
* Draw a single candle directly to canvas context
* @param {CanvasRenderingContext2D} ctx - Canvas context
* @param {Object} data - Candle data {x, w, o, h, l, c, raw}
* @param {Object} overlay - Overlay component for color settings
*/
function drawCandle(ctx, data, overlay) {
	const raw = data.raw;
	const style = raw[6] || overlay;
	const green = raw[4] >= raw[1];
	const body_color = raw[6] || (green ? style.colorCandleUp || "#23a776" : style.colorCandleDw || "#e54150");
	const wick_color = green ? style.colorWickUp || "#23a776" : style.colorWickDw || "#e54150";
	const w = Math.max(data.w, 1);
	const hw = Math.max(Math.floor(w * .5), 1);
	const h = Math.abs(data.o - data.c);
	const max_h = data.c === data.o ? 1 : 2;
	const xFloor = Math.floor(data.x);
	const x05 = xFloor - .5;
	const hFloor = Math.floor(data.h);
	const lFloor = Math.floor(data.l);
	ctx.strokeStyle = wick_color;
	ctx.beginPath();
	ctx.moveTo(x05, hFloor);
	ctx.lineTo(x05, lFloor);
	ctx.stroke();
	if (data.w > 1.5) {
		ctx.fillStyle = body_color;
		const s = green ? 1 : -1;
		ctx.fillRect(xFloor - hw - 1, data.c, hw * 2 + 1, s * Math.max(h, max_h));
	} else {
		ctx.strokeStyle = body_color;
		ctx.beginPath();
		ctx.moveTo(x05, Math.floor(Math.min(data.o, data.c)));
		ctx.lineTo(x05, Math.floor(Math.max(data.o, data.c)) + (data.o === data.c ? 1 : 0));
		ctx.stroke();
	}
	const value1 = raw[7];
	const value2 = raw[8];
	if (value1 && value1 !== "" || value2 && value2 !== "") {
		ctx.font = `${Math.max(Math.min(Math.floor(data.w * .8), 14), 8)}px sans-serif`;
		ctx.textAlign = "center";
		if (value1 && value1 !== "") {
			ctx.fillStyle = "#00FF00";
			ctx.textBaseline = "top";
			ctx.fillText(value1, xFloor, lFloor + 3);
		}
		if (value2 && value2 !== "") {
			ctx.fillStyle = "#FF0000";
			ctx.textBaseline = "bottom";
			ctx.fillText(value2, xFloor, hFloor - 3);
		}
	}
}
/**
* Draw a single volume bar directly to canvas context
* @param {CanvasRenderingContext2D} ctx - Canvas context
* @param {Object} data - Volume data {x1, x2, h, green, raw}
* @param {Object} overlay - Overlay component for color settings
* @param {number} layoutHeight - Layout height for positioning
*/
function drawVolbar(ctx, data, overlay, layoutHeight) {
	const style = data.raw[6] || overlay;
	const h = Math.floor(data.h);
	ctx.fillStyle = data.green ? style.colorVolUp || "#23a77642" : style.colorVolDw || "#e5415042";
	ctx.fillRect(Math.floor(data.x1), Math.floor(layoutHeight - h - .5), Math.floor(data.x2 - data.x1), h + 1);
}
//#endregion
//#region src/components/primitives/price.js
var Price = class {
	constructor(comp) {
		this.comp = comp;
	}
	init_shader() {
		let layout = this.comp.$props.layout;
		let config = this.comp.$props.config;
		let comp = this.comp;
		let last_bar = () => this.last_bar();
		this.comp.$emit("new-shader", {
			target: "sidebar",
			draw: (ctx) => {
				let bar = last_bar();
				if (!bar) return;
				let w = ctx.canvas.width;
				let h = config.PANHEIGHT;
				let lbl = bar.price.toFixed(layout.prec);
				ctx.fillStyle = bar.color;
				let x = -.5;
				let y = bar.y - h * .5 - .5;
				let a = 7;
				ctx.fillRect(x - .5, y, w + 1, h);
				ctx.fillStyle = comp.$props.colors.textHL;
				ctx.textAlign = "left";
				ctx.fillText(lbl, a, y + 15);
			}
		});
		this.shader = true;
	}
	draw(ctx) {
		if (!this.comp.$props.meta.last) return;
		if (!this.shader) this.init_shader();
		let layout = this.comp.$props.layout;
		let last = this.comp.$props.last;
		let dir = last[4] >= last[1];
		let color = dir ? this.green() : this.red();
		let y = layout.$2screen(last[4]) + (dir ? 1 : 0);
		ctx.strokeStyle = color;
		ctx.setLineDash([1, 1]);
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(layout.width, y);
		ctx.stroke();
		ctx.setLineDash([]);
	}
	last_bar() {
		if (!this.comp.$props.data.length) return void 0;
		let layout = this.comp.$props.layout;
		let last = this.comp.$props.data[this.comp.$props.data.length - 1];
		return {
			y: layout.$2screen(last[4]),
			price: last[4],
			color: last[4] >= last[1] ? this.green() : this.red()
		};
	}
	last_price() {
		return this.comp.$props.meta.last ? this.comp.$props.meta.last[4] : void 0;
	}
	green() {
		return this.comp.colorCandleUp;
	}
	red() {
		return this.comp.colorCandleDw;
	}
};
//#endregion
//#region src/components/overlays/Candles.vue
var _sfc_main$25 = {
	name: "Candles",
	mixins: [overlay_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.2.1"
			};
		},
		init() {
			this.price = new Price(this);
		},
		draw(ctx) {
			const isMainChart = this.$props.sub === this.$props.data;
			let cnv;
			if (isMainChart) cnv = {
				candles: this.$props.layout.candles,
				volume: this.$props.layout.volume
			};
			else cnv = layout_cnv(this);
			if (this.show_volume) {
				let cv = cnv.volume;
				const layoutHeight = this.$props.layout.height;
				for (let i = 0, n = cv.length; i < n; i++) drawVolbar(ctx, cv[i], this, layoutHeight);
			}
			let cc = cnv.candles;
			for (let i = 0, n = cc.length; i < n; i++) drawCandle(ctx, cc[i], this);
			if (this.price_line) this.price.draw(ctx);
		},
		use_for() {
			return ["Candles"];
		},
		y_range() {
			let hi = -Infinity, lo = Infinity;
			for (let i = 0, n = this.$props.sub.length; i < n; i++) {
				let x = this.$props.sub[i];
				if (x[2] > hi) hi = x[2];
				if (x[3] < lo) lo = x[3];
			}
			return [hi, lo];
		}
	},
	computed: {
		show_volume() {
			return "showVolume" in this.sett ? this.sett.showVolume : true;
		},
		price_line() {
			return "priceLine" in this.sett ? this.sett.priceLine : true;
		},
		colorCandleUp() {
			return this.sett.colorCandleUp || this.$props.colors.candleUp;
		},
		colorCandleDw() {
			return this.sett.colorCandleDw || this.$props.colors.candleDw;
		},
		colorWickUp() {
			return this.sett.colorWickUp || this.$props.colors.wickUp;
		},
		colorWickDw() {
			return this.sett.colorWickDw || this.$props.colors.wickDw;
		},
		colorWickSm() {
			return this.sett.colorWickSm || this.$props.colors.wickSm;
		},
		colorVolUp() {
			return this.sett.colorVolUp || this.$props.colors.volUp;
		},
		colorVolDw() {
			return this.sett.colorVolDw || this.$props.colors.volDw;
		}
	},
	data() {
		return { price: {} };
	}
};
//#endregion
//#region src/components/primitives/volbar.js
var VolbarExt = class {
	constructor(overlay, ctx, data) {
		this.ctx = ctx;
		this.$p = overlay.$props;
		this.self = overlay;
		this.style = data.raw[6] || this.self;
		this.draw(data);
	}
	draw(data) {
		let y0 = this.$p.layout.height;
		let w = data.x2 - data.x1;
		let h = Math.floor(data.h);
		const fillStyle = data.green ? this.style.colorVolUp || "#23a77642" : this.style.colorVolDw || "#e5415042";
		this.ctx.fillStyle = fillStyle;
		this.ctx.fillRect(Math.floor(data.x1), Math.floor(y0 - h - .5), Math.floor(w), Math.floor(h + 1));
	}
};
//#endregion
//#region src/components/overlays/Volume.vue
var _sfc_main$24 = {
	name: "Volume",
	mixins: [overlay_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.1.0"
			};
		},
		draw(ctx) {
			for (var v of layout_vol(this)) new VolbarExt(this, ctx, v);
		},
		use_for() {
			return ["Volume"];
		},
		legend(values) {
			const color = (this._i2 ? this._i2(values) : values[2]) ? this.colorVolUpLegend : this.colorVolDwLegend;
			return [{
				value: values[this._i1 || 1],
				color
			}];
		},
		y_range(hi, lo) {
			if (this._i1 === 5) {
				let sub = this.$props.sub;
				return [utils_default.maxAtIndex(sub, this._i1), utils_default.minAtIndex(sub, this._i1)];
			} else return [hi, lo];
		}
	},
	computed: {
		colorVolUp() {
			return this.sett.colorVolUp || this.$props.colors.volUp;
		},
		colorVolDw() {
			return this.sett.colorVolDw || this.$props.colors.volDw;
		},
		colorVolUpLegend() {
			return this.sett.colorVolUpLegend || this.$props.colors.candleUp;
		},
		colorVolDwLegend() {
			return this.sett.colorVolDwLegend || this.$props.colors.candleDw;
		},
		volscale() {
			return this.sett.volscale || (this.$props.grid_id > 0 ? .85 : this.$props.config.VOLSCALE);
		}
	},
	data() {
		return {};
	}
};
//#endregion
//#region src/components/overlays/Splitters.vue
var _sfc_main$23 = {
	name: "Splitters",
	mixins: [overlay_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.0.1"
			};
		},
		draw(ctx) {
			let layout = this.$props.layout;
			ctx.lineWidth = this.line_width;
			ctx.strokeStyle = this.line_color;
			this.$props.data.forEach((p, i) => {
				ctx.beginPath();
				let x = layout.t2screen(p[0]);
				ctx.setLineDash([10, 10]);
				ctx.moveTo(x, 0);
				ctx.lineTo(x, this.layout.height);
				ctx.stroke();
				if (p[1]) this.draw_label(ctx, x, p);
			});
		},
		draw_label(ctx, x, p) {
			let side = p[2] ? 1 : -1;
			x += 2.5 * side;
			ctx.font = this.new_font;
			let pos = p[4] || this.y_position;
			let w = ctx.measureText(p[1]).width + 10;
			let y = this.layout.height * (1 - pos);
			y = Math.floor(y);
			ctx.fillStyle = p[3] || this.flag_color;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + 10 * side, y - 10 * side);
			ctx.lineTo(x + (w + 10) * side, y - 10 * side);
			ctx.lineTo(x + (w + 10) * side, y + 10 * side);
			ctx.lineTo(x + 10 * side, y + 10 * side);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = this.label_color;
			ctx.textAlign = side < 0 ? "right" : "left";
			ctx.fillText(p[1], x + 15 * side, y + 4);
		},
		use_for() {
			return ["Splitters"];
		}
	},
	computed: {
		new_font() {
			return this.sett.font || "12px " + this.$props.font.split("px").pop();
		},
		flag_color() {
			return this.sett.flagColor || "#4285f4";
		},
		label_color() {
			return this.sett.labelColor || "#fff";
		},
		line_color() {
			return this.sett.lineColor || "#4285f4";
		},
		line_width() {
			return this.sett.lineWidth || 1;
		},
		y_position() {
			return this.sett.yPosition || .9;
		}
	},
	data() {
		return {};
	}
};
//#endregion
//#region src/stuff/keys.js
var Keys = class {
	constructor(comp) {
		this.comp = comp;
		this.map = {};
		this.listeners = 0;
		this.keymap = {};
	}
	on(name, handler) {
		if (!handler) return;
		this.map[name] = this.map[name] || [];
		this.map[name].push(handler);
		this.listeners++;
	}
	off(name, handler) {
		if (!this.map[name]) return;
		let i = this.map[name].indexOf(handler);
		if (i < 0) return;
		this.map[name].splice(i, 1);
		this.listeners--;
	}
	emit(name, event) {
		if (name in this.map) for (var f of this.map[name]) f(event);
		if (name === "keydown") {
			if (!this.keymap[event.key]) this.emit(event.key);
			this.keymap[event.key] = true;
		}
		if (name === "keyup") this.keymap[event.key] = false;
	}
	pressed(key) {
		return this.keymap[key];
	}
};
//#endregion
//#region src/mixins/tool.js
var tool_default = {
	methods: {
		init_tool() {
			this.collisions = [];
			this.pins = [];
			this.mouse.on("mousemove", (e) => {
				if (this.collisions.some((f) => f(this.mouse.x, this.mouse.y))) this.show_pins = true;
				else this.show_pins = false;
				if (this.drag) this.drag_update();
			});
			this.mouse.on("mousedown", (e) => {
				if (utils_default.default_prevented(e)) return;
				if (this.collisions.some((f) => f(this.mouse.x, this.mouse.y))) {
					if (!this.selected) this.custom_event("object-selected");
					this.start_drag();
					e.preventDefault();
					this.pins.forEach((x) => x.mousedown(e, true));
				}
			});
			this.mouse.on("mouseup", (e) => {
				this.drag = null;
				this.custom_event("scroll-lock", false);
			});
			this.keys = new Keys(this);
			this.keys.on("Delete", this.remove_tool);
			this.keys.on("Backspace", this.remove_tool);
			this.show_pins = false;
			this.drag = null;
		},
		render_pins(ctx) {
			if (this.selected || this.show_pins) this.pins.forEach((x) => x.draw(ctx));
		},
		set_state(name) {
			this.custom_event("change-settings", { $state: name });
		},
		watch_uuid(n, p) {
			if (n.$uuid !== p.$uuid) {
				for (let pin of this.pins) pin.re_init();
				this.collisions = [];
				this.show_pins = false;
				this.drag = null;
			}
		},
		pre_draw() {
			this.collisions = [];
		},
		remove_tool() {
			if (this.selected) this.custom_event("remove-tool");
		},
		start_drag() {
			this.custom_event("scroll-lock", true);
			let cursor = this.$props.cursor;
			this.drag = {
				t: cursor.t,
				y$: cursor.y$
			};
			this.pins.forEach((x) => x.rec_position());
		},
		drag_update() {
			let dt = this.$props.cursor.t - this.drag.t;
			let dy = this.$props.cursor.y$ - this.drag.y$;
			this.pins.forEach((x) => x.update_from([x.t1 + dt, x.y$1 + dy], true));
		}
	},
	computed: {
		selected() {
			return this.$props.settings.$selected;
		},
		state() {
			return this.$props.settings.$state;
		}
	}
};
//#endregion
//#region src/stuff/icons.json
var icons_default = {
	"extended.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAANElEQVR4nGNggABGEMEEIlhABAeI+AASF0AlHmAqA4kzKAAx8wGQuAMKwd6AoYzBAWonAwAcLwTgNfJ3RQAAAABJRU5ErkJggg==",
	"ray.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAAMklEQVR4nGNgQAJMIIIFRHCACAEQoQAiHICYvQEkjkrwYypjAIkzwk2zAREuqIQFzD4AE3kE4BEmGggAAAAASUVORK5CYII=",
	"segment.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAgMAAAC5h23wAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAlQTFRFAAAATU1NJCQkCxcHIQAAAAN0Uk5TAP8SmutI5AAAACxJREFUeJxjYMACGAMgNAsLdpoVKi8AVe8A1QblQlWRKt0AoULw2w1zGxoAABdiAviQhF/mAAAAAElFTkSuQmCC",
	"add.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAH5QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAACgoKBgYGGxsbKioqPz8/Pj4+BQUFCQkJAQEBZGRkh4eHAgICEBAQNjY2g4ODgYGBAAAAAwMDeXl5d3d3GBgYERERgICAgICANDQ0PDw8Y2NjCAgIhYWFGhoaJycnOjo6YWFhgICAdXV14Y16sQAAACp0Uk5TAAILDxIKESEnJiYoKCgTKSkpKCAnKSkFKCkpJiDl/ycpKSA2JyYpKSkpOkQ+xgAAARdJREFUeJzllNt2gyAQRTWiRsHLoDU0GpPYmMv//2BMS+sgl6Z9bM8bi73gnJkBz/sn8lcBIUHofwtG8TpJKUuTLI6cYF7QEqRKynP71VX9AkhNXVlsbMQrLLQVGyPZLsGHWgPrCxMJwHUPlXa79NBp2et5d9f3u3m1XxatQNn7SagOXCUjCjYUDuqxcWlHj4MSfw12FDJchFViRN8+1qcQoUH6lR1L1mEMEErofB6WzEUwylzomfzOQGiOJdXiWH7mQoUyMa4WXJQWOBvLFvPCGxt6FSr5kyH0qi0YddNG2/pgCsOjff4ZTizXPNwKIzl56OoGg9d9Z/+5cs6On+CFCfevFQ3ZaTycx1YMbvDdRvjkp/lHdAcPXzokxcwfDwAAAABJRU5ErkJggg==",
	"cursor.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAgMAAAC5h23wAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAxQTFRFAAAATU1NTU1NTU1NwlMHHwAAAAR0Uk5TAOvhxbpPrUkAAAAkSURBVHicY2BgYHBggAByabxg1WoGBq2pRCk9AKUbcND43AEAufYHlSuusE4AAAAASUVORK5CYII=",
	"display_off.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAU1QTFRFAAAAh4eHh4eHAAAAAAAAAAAAAwMDAAAAAAAAhoaGGBgYgYGBAAAAPz8/AgICg4ODCQkJhISEh4eHh4eHPj4+NjY2gYGBg4ODgYGBgYGBgoKCAQEBJycngoKChYWFEBAQg4ODCAgIKioqZGRkCgoKBQUFERERd3d3gYGBGxsbNDQ0hISEgYGBPDw8gYGBgYGBh4eHh4eHhYWFh4eHgoKChYWFgYGBgYGBg4ODhoaGg4ODYWFhgoKCBgYGdXV1goKCg4ODgYGBgICAgYGBAAAAg4ODhYWFhISEh4eHgoKChYWFOjo6goKCGhoah4eHh4eHh4eHgoKCh4eHeXl5hoaGgoKChISEgYGBgYGBgoKCY2NjgYGBgoKCh4eHgoKCgYGBhoaGg4ODhoaGhYWFh4eHgYGBhoaGhoaGhoaGg4ODgoKChISEgoKChYWFh4eHfKktUwAAAG90Uk5TACn/AhEFKA8SLCbxCigoVBNKUTYoJ/lh3PyAKSaTNiBtICYpISggKSkmJ0LEKef3lGxA8rn//+pcMSkpnCcptHPJKe0LUjnx5LzKKaMnX73hl64pLnhkzNSgKeLv17LQ+liIzaLe7PfTw5tFpz3K1fXR/gAAAgBJREFUeJzllNdXwjAUxknB0lIoCKVsGTIFQRAZ7r333nuv///R3LZ4mlDQZ/0ekp7b37n5bnITk+mfyDxv5Tir3fwjaElO5BIOKZFLJS1dQVfI0Y809TtEV+elo95RpFPWG+1go4fdQ5QybI8haaNBkM2ANbM09bnrwaPY7iFKrz7EMBdu7CHdVruXIt0M1hb+GKA3LTRKkp5lTA6Dg6xIkhaHhvQ1IlW/UCouQdJNJTRIpk1qO7+wUpcfpl537oBc7VNip3Gi/AmVPBAC1UrL6HXtSGVT+k2Yz0Focad07OMRf3P5BEbd63PFQx7HN+w61JoAm+uBlV48O/0jkLSMmtPCmQ8HwlYdykFV4/LJPp7e3hVyFdapHNehLk6PSjhSkBvwu/cFyJGIYvOyhoc1jjYQFGbygD4CWjoAMla/og3YoSw+KPhjPNoFcim4iFD+pFYA8zZ9WeYU5OBjZ3ORWyCfG03E+47kKpCIJTpGO4KP8XMgtw990xG/PBNTgmPEEXwf7P42oOdFIRAoBCtqTKL6Rcwq4Xsgh5xYC/mmSs6yJKk1YbnVeTq1NaEpmlHbmVn2EORkW2trF2ZzmHGTSUMGl1a9hp4ySRpdQ8yKGURpMmRIYg9pb1YPzg6kO79cLlE6bYFjEtv91bLEUxvhwbWwjY13BxUb9l8+mn9EX8x3Nki8ff5wAAAAAElFTkSuQmCC",
	"display_on.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAR1QTFRFAAAAh4eHgYGBAAAAAAAAgYGBAAAAAwMDAAAAAAAAgYGBg4ODGBgYgYGBhISEAAAAPz8/AgIChoaGCQkJhYWFPj4+NjY2goKCgYGBAQEBJycngYGBgoKCEBAQCAgIhISEKioqZGRkCgoKBQUFERERd3d3gYGBg4ODgYGBGxsbNDQ0hISEgoKCgoKChYWFPDw8gYGBgYGBhoaGgoKCg4ODgoKCgYGBgoKCgoKCgoKCg4ODgoKChoaGgoKCgYGBhoaGg4ODYWFhBgYGdXV1gYGBg4ODgoKCgICAg4ODg4ODhISEAAAAg4ODOjo6gYGBGhoaeXl5goKCgYGBgoKChYWFgoKChISEgoKCY2NjgYGBg4ODgYGBgYGBg4ODgYGBo8n54AAAAF90Uk5TACn/AhH3BSgPEuhUJvFACigoLBM2KCeA6ykm+pMgIEkmKSEoICn9XCkmJ0u6nDop4sUypGuEzLZ6vmCYLZ/dLykpJynUYa8pcllCC1Ip2ycpisl1PadFsintbsPQZdi/bTW7AAAB4UlEQVR4nOWUZ1fCMBSGSSGWFiq0UDbIkr2XbBwMxS0b1P//M0xK9XSiftX7oel585zkvfcmMRj+SRhvzRRlthm/BU3Ry3TYzofTsajpIOjw2iNAjIiddehvHXSdA0mkXEEdG0fkE1DEKXmkSVqVIA6rBmsktUgAWLWHoGp30UNclbtLmwQgoyya91wPTbFy0mQXJ5zJQO6BgXRjfH0iSkX5stHIXr5r0bB/lu8syjR8rzsFbR2SpX+5J2eMP3csLtYsEY2K8BeTFuE2jaVCBw7bHOBuxq16AXmpbui3LtIfbRLUHMY2q4lcFo2WB4KA1SUAlWumNEKCzyxBKZxVHvYGaFguCBx1vM/x0IPzoqQoj5SdP4mns2cCGhBsrgj0uaeUBtzMyxQN8w4mYROTW8+r0oANp8W5mf6WQw5aCYJ2o7ymPaKMi2uVpmWM4TW6tdImgGo1bT4nK6DbbsCc0AZSdmLEFszzHrh6riVvRrNA3/9SE8QLWQu+Gjto9+gE9NBMwr9zi83gFeeFTe11zpm1CHE3HeyVCSknf3MIDcFTbfJKdbR1L4xX49L+/BoillV5uPJqkshD3JWSgpNMXP/lcrD8+hO84MnDr5YpFHv0Fe99VjJ0GBRs2H74aP6R+ACr+TFvZNAQ1wAAAABJRU5ErkJggg==",
	"down.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAKVQTFRFAAAAg4ODgICAAAAAAAAAAAAACAgIAAAAAAAAAAAAAAAAOTk5hYWFEBAQfHx8ODg4dnZ2NDQ0XV1dGxsbKCgogICAFBQUIiIiZGRkgICAgICAFRUVAAAAgICAgICAgICAf39/Li4ugICAcHBwgoKCgICAgoKCgICAg4ODgYGBPj4+goKCgICAhISEgYGBgICAgoKCgICAgYGBgYGBf39/gICAgICAIdPQHAAAADd0Uk5TACn/KAIRIBMFDwooKyApKSknKSYmzCcmKfL7JRCUi2L3J7IpcLUrr0VbKXntNEnkMbxrUcG56CMpi50AAAFZSURBVHic5ZRpf4MgDIeFKFatWm/tfW091u7evv9Hm1Acoujm2y0vFPH5Jf+EEE37J6bblmlatv4jaBCI4rMfR0CMXtAEJ0fccgfM7tAkQHXzArdDxggmqGETGCnJWROkNlOwOqhIhKCtgbSicw1uK/dATSK0aRatIzytA8ik4XSiyJnLSm+VPxULgeyLI3uHRJH+qcB4WZGrKb4c20WwI7b3iUt74OS6XD+xZWrXUCtme0uKTvfcJ65CZFa9VOebqwXmft+oT8yF+/VymT4XeGB+Xx8L+j4gBcoFIDT+oMz6Qp93Y74pCeBpUXaLuW0rUk6r1iv3nP322ewYkgv2nZIvgpSPQDrY5wTjRJDNg9XAE/+uSXIVX812GdKEmtvR2rtWaw+5MAOuofJy79SXu9TgBl4d9DZdI0NjgyiswNCB/qk1J5Bmvp+lQOa9IJNhW4bxm6H5R+wLQYMSQXZNzbcAAAAASUVORK5CYII=",
	"price_range.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAAIUlEQVR4nGNggAPm/w9gTA4QIQMitECEJ1yMEgLNDiAAADfgBMRu78GgAAAAAElFTkSuQmCC",
	"price_time.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAAOklEQVR4nGNggAPm/w9gTA4QIQPEClpMQMITRHCACScQoQQihBgY9P//grKgYk5wdTACYhQHFjuAAABZFAlc4e1fcQAAAABJRU5ErkJggg==",
	"remove.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAK5QTFRFAAAAh4eHgICAAAAAAAAAh4eHAAAAAwMDAAAAAAAAgICAGBgYAAAAPz8/AgICgICACQkJhoaGhoaGgICAPj4+NjY2gYGBg4ODgYGBAQEBJycngoKCEBAQgICAgICACAgIKioqZGRkCgoKBQUFERERd3d3gYGBGxsbNDQ0gICAPDw8YWFhBgYGdXV1gICAg4ODgICAAAAAOjo6GhoaeXl5gICAhYWFY2NjhYWFgICA9O0oCgAAADp0Uk5TACn/AhErBSgPEvEmCigowxMuMcgoJ7hWrCkmdCD6vSAmKSEoICkpJie6KSknKSkp0wspJynCMik11rrLte8AAAFwSURBVHic5ZTXkoIwFIZNAAPSpKkoRQV7Wcva3v/FFiRmEwise7t7bs7MP98k/ylJq/VPQjjKiiJrwo+gON0uxro7XiRTsRHs+voE4JjoRrf+6sD7AFTMvaDGRht9glLMUJtLqmUwD5XDCohHAmBUPQSV27GHtFK7xycBWJab5uPaR+Hlmue7GfZxHwyWFHVMQghXFgD2A8IOZtfssdNJIXcyFEaSfchzp9BuMVP+Fhvr5Qh0nGfqYTGhm3BcYFUaQBKOhMWzRqHyGFRY03ppQ5lCFZ30RloVZGQTaa3QqEt0OyrQnkSkk8I1YJkvAwPCMgY0UpbzXRZhVbosIWGbZTLNQszGMCM42FJEjWDDjIAMtp+xj6x2K+/DqNDc0r4Yc8yGl3uer2aIyT1iyd8sYSuY8cldZbVrH4zPebTvP8OMNSoedj6XzDyk3pwG98u0/ufqGu7tBW5c1PxriXFyHq5PQxXFzeDThvbmp/lH4gt6WxfZ03H8DwAAAABJRU5ErkJggg==",
	"settings.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAW5QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAACgoKBgYGGxsbKioqQEBAPj4+BQUFCAgIAQEBPz8/ZWVlh4eHZGRkAgICCQkJDw8PNjY2g4ODgoKCNTU1EBAQAAAAAwMDeXl5d3d3AAAAGBgYAAAAERERioqKgoKCgoKCgoKCgYGBgoKChISEhoaGNDQ0g4ODgICAgICAgICAgYGBgYGBhYWFgICAgICAPT09AAAAgYGBgICAgICAgICAgICAY2NjCAgIgICAgICAhYWFhYWFgYGBHBwcgICAhYWFGhoagYGBgYGBg4ODhoaGJycnAAAAhISEgICAg4ODPDw8AAAAgoKCgICAhISEOjo6h4eHgoKCgYGBgICAf39/gYGBgoKCgICAGBgYgYGBg4ODg4ODgICACwsLgYGBgICAgYGBgYGBgYGBgICAgYGBYWFhf39/g4ODPj4+gYGBg4ODgICAhYWFgoKCgYGBgICAgYGBgoKCdXV1T0kC9QAAAHp0Uk5TAAILDxMKESEnJiYpKSgTKSgpKSkoEyAnKSknIAYoKSkFJQEgKl94jYVvVC4nU9f/+K8pOu71KBCi3NPq/ikg0e01Nokm1UUnsZVqQSYOT9lrKRJz5lIpK12jyu+sesgnhGVLxCG55a6Um+GaKfJCKKRgKUt8ocergymDQ9knAAABsElEQVR4nOWUV1vCMBSGg1AQpBZrcVdE3KJxo4LgnuCoe4F7orjHv7doTk3bgF7rd5OnX94nZ+SkCP0TWQqsNpuVs/wI2h2FTleR2+XkHfa8YLHgKRGJSj2SN3fosvIKkVJlVXWONGrkWtEgn1zHJP1GMCs/g7XILFIUpXoTWmaKTnIImGovh72Gxqbmlta2dvgOGpsmQO0dnfhTXd3E6JH0pN1DNnr7MFE/HDsQ0qEO6Pxg9sCh4XDkGx2J6sovBD+G8eiYuo5PxLTKeLoJBZNgT2EcnjY0YYajUKsL7Fk1gcjU3PwChcYTFGorAnsRqlpa1tAVhUbdmr+6RtjIOlgbCjMBUdzc2t7ZzbJ7zAQ4p6GSfRVNwkeKLsvCg31w2JBdjlT0GDxZNzEnpcQ+xWfnFxeXVyp6Tay07gq+L/YUOoBvbomV0V8skiq//DutWfeEfJD1JPLCED4+Pb8kX986tApNQ4iqfSJT76bRzvlgBPODQXW/foYqK5lyeBeYJEL1gaoeGnwIBhjRoQ9SZgTAdEbO/9cKRfmZ+MpGPCVHQ3nBzzS4hKIkuNyh/5g+ALiAXSSas9hwAAAAAElFTkSuQmCC",
	"time_range.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAAJElEQVR4nGNgwAsUGJhQCScQoQQihBgY9P//grKgYk4YOvACACOpBKG6Svj+AAAAAElFTkSuQmCC",
	"trash.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAALUlEQVR4nGNgAIN6ENHQACX4//9gYBBgYIESYC4LkA0lPEkmGFAI5v8PILYCAHygDJxlK0RUAAAAAElFTkSuQmCC",
	"up.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAMZQTFRFAAAAh4eHgICAAAAAAAAAAAAAAwMDAAAAAAAAGBgYAAAAPz8/AgICCQkJgICAh4eHPj4+NjY2AQEBJycnEBAQgICAgICACAgIKioqZGRkCgoKBQUFgYGBERERd3d3gYGBGxsbNDQ0gICAgYGBPDw8gYGBh4eHgICAYWFhBgYGgYGBdXV1goKCg4ODhYWFgICAgoKCAAAAhISEOjo6gICAGhoagYGBeXl5hoaGgICAY2Njg4ODgoKCgoKCgYGBgoKCg4ODgoKC64uw1gAAAEJ0Uk5TACn/AhEFKA8SJgooKBP7KignKSYg9c0gJikhKLQgKSkmJ7ywKY8s5SknlClxKTMpXwtFKe0neiku8ClKWmSbbFFjM5GHSgAAAW5JREFUeJzllGd/gjAQxk3AMFWWOHDvVa2rVbu//5cqhJWQQO3b9nkVjv/v7rnLKJX+iYS9JMuSKvwIiu3loKkZzYHXFgvBiqW1QKSWplfySzvmAyDUN50cG2X0DDLqoTKXVLJgIIXDCohHAqCzHhymeuShy/Ru8kkAhtmhWUTvW9fdEnPQaVLU0n8XF0L3kn5P6LTtZPKgNoK+RrUkcGtQ7S9TsgOxxinrkUPYD+LwLCIh7CTsWSVQqRmTuPqpitlZFLQlApXjrsYBc335wOw47ksmUSMMrgKi/gnAE/awCqNHmTUwDf5X34LlBuedsgbUsK15kPMxTIXzzvFSIdsSPBw7nGD1K+7bL3F9xStEnZhoCw71TbpL71GBBbUF1MZmZWTOi97PI3eIJn9zCEtOj0+umaOde2EszqW9/xr6rM54WFtc0vfQNak57Ibd/Jerohu3GFwYqPjVEhve2Z4cbQU1ikFsQ73z0fwj+ga3VBezGuggFQAAAABJRU5ErkJggg=="
};
//#endregion
//#region src/components/primitives/pin.js
var Pin = class {
	constructor(comp, name, params = {}) {
		this.RADIUS = comp.$props.config.PIN_RADIUS || 5.5;
		this.RADIUS_SQ = Math.pow(this.RADIUS + 7, 2);
		if (utils_default.is_mobile) {
			this.RADIUS += 2;
			this.RADIUS_SQ *= 2.5;
		}
		this.COLOR_BACK = comp.$props.colors.back;
		this.COLOR_BR = comp.$props.colors.text;
		this.comp = comp;
		this.layout = comp.layout;
		this.mouse = comp.mouse;
		this.name = name;
		this.state = params.state || "settled";
		this.hidden = params.hidden || false;
		this.on_mousemove = (e) => this.mousemove(e);
		this.on_mousedown = (e) => this.mousedown(e);
		this.on_mouseup = (e) => this.mouseup(e);
		this.mouse.on("mousemove", this.on_mousemove);
		this.mouse.on("mousedown", this.on_mousedown);
		this.mouse.on("mouseup", this.on_mouseup);
		if (comp.state === "finished") {
			this.state = "settled";
			this.update_from(comp.$props.settings[name]);
		} else this.update();
		if (this.state !== "settled") this.comp.$emit("scroll-lock", true);
	}
	re_init() {
		this.update_from(this.comp.$props.settings[this.name]);
	}
	destroy() {
		this.mouse.off("mousemove", this.on_mousemove);
		this.mouse.off("mousedown", this.on_mousedown);
		this.mouse.off("mouseup", this.on_mouseup);
	}
	draw(ctx) {
		if (this.hidden) return;
		switch (this.state) {
			case "tracking": break;
			case "dragging":
				if (!this.moved) this.draw_circle(ctx);
				break;
			case "settled":
				this.draw_circle(ctx);
				break;
		}
	}
	draw_circle(ctx) {
		this.layout = this.comp.layout;
		let r, lw;
		if (this.comp.selected) {
			r = this.RADIUS;
			lw = 1.5;
		} else {
			r = this.RADIUS * .95;
			lw = 1;
		}
		ctx.lineWidth = lw;
		ctx.strokeStyle = this.COLOR_BR;
		ctx.fillStyle = this.COLOR_BACK;
		ctx.beginPath();
		ctx.arc(this.x = this.layout.t2screen(this.t), this.y = this.layout.$2screen(this.y$), r + .5, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.stroke();
	}
	update() {
		this.y$ = this.comp.$props.cursor.y$;
		this.y = this.comp.$props.cursor.y;
		this.t = this.comp.$props.cursor.t;
		this.x = this.comp.$props.cursor.x;
		this.comp.$emit("change-settings", { [this.name]: [this.t, this.y$] });
	}
	update_from(data, emit = false) {
		if (!data) return;
		this.layout = this.comp.layout;
		this.y$ = data[1];
		this.y = this.layout.$2screen(this.y$);
		this.t = data[0];
		this.x = this.layout.t2screen(this.t);
		if (emit) this.comp.$emit("change-settings", { [this.name]: [this.t, this.y$] });
	}
	rec_position() {
		this.t1 = this.t;
		this.y$1 = this.y$;
	}
	mousemove(event) {
		switch (this.state) {
			case "tracking":
			case "dragging":
				this.moved = true;
				this.update();
				break;
		}
	}
	mousedown(event, force = false) {
		if (utils_default.default_prevented(event) && !force) return;
		switch (this.state) {
			case "tracking":
				this.state = "settled";
				if (this.on_settled) this.on_settled();
				this.comp.$emit("scroll-lock", false);
				break;
			case "settled":
				if (this.hidden) return;
				if (this.hover()) {
					this.state = "dragging";
					this.moved = false;
					this.comp.$emit("scroll-lock", true);
					this.comp.$emit("object-selected");
				}
				break;
		}
		if (this.hover()) event.preventDefault();
	}
	mouseup(event) {
		switch (this.state) {
			case "dragging":
				this.state = "settled";
				if (this.on_settled) this.on_settled();
				this.comp.$emit("scroll-lock", false);
				break;
		}
	}
	on(name, handler) {
		switch (name) {
			case "settled":
				this.on_settled = handler;
				break;
		}
	}
	hover() {
		let x = this.x;
		let y = this.y;
		return (x - this.mouse.x) * (x - this.mouse.x) + (y - this.mouse.y) * (y - this.mouse.y) < this.RADIUS_SQ;
	}
};
//#endregion
//#region src/components/primitives/primitive-base.js
var PrimitiveBase = class {
	constructor(overlay, ctx) {
		this.ctx = ctx;
		this.comp = overlay;
		this.T = overlay.$props.config.TOOL_COLL;
		if (utils_default.is_mobile) this.T *= 2;
	}
	get layout() {
		return this.comp.$props.layout;
	}
	toScreen(p) {
		return [this.layout.t2screen(p[0]), this.layout.$2screen(p[1])];
	}
};
//#endregion
//#region src/components/primitives/seg.js
var Seg = class extends PrimitiveBase {
	draw(p1, p2) {
		let [x1, y1] = this.toScreen(p1);
		let [x2, y2] = this.toScreen(p2);
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.comp.collisions.push(this.make([x1, y1], [x2, y2]));
	}
	make(p1, p2) {
		return (x, y) => {
			return math_default.point2seg([x, y], p1, p2) < this.T;
		};
	}
};
//#endregion
//#region src/components/primitives/line.js
var Line = class extends PrimitiveBase {
	draw(p1, p2) {
		const layout = this.layout;
		let [x1, y1] = this.toScreen(p1);
		let [x2, y2] = this.toScreen(p2);
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		let w = layout.width;
		let h = layout.height;
		let k = (y2 - y1) / (x2 - x1);
		let s = Math.sign(x2 - x1 || y2 - y1);
		let dx = w * s * 2;
		let dy = w * k * s * 2;
		if (dy === Infinity) dx = 0, dy = h * s;
		this.ctx.moveTo(x2, y2);
		this.ctx.lineTo(x2 + dx, y2 + dy);
		if (!this.ray) {
			this.ctx.moveTo(x1, y1);
			this.ctx.lineTo(x1 - dx, y1 - dy);
		}
		this.comp.collisions.push(this.make([x1, y1], [x2, y2]));
	}
	make(p1, p2) {
		let f = this.ray ? math_default.point2ray.bind(math_default) : math_default.point2line.bind(math_default);
		return (x, y) => {
			return f([x, y], p1, p2) < this.T;
		};
	}
};
//#endregion
//#region src/components/primitives/ray.js
var Ray = class extends Line {
	constructor(overlay, ctx) {
		super(overlay, ctx);
		this.ray = true;
	}
};
//#endregion
//#region src/components/overlays/LineTool.vue
var _sfc_main$22 = {
	name: "LineTool",
	mixins: [overlay_default, tool_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "1.1.0"
			};
		},
		tool() {
			return {
				group: "Lines",
				icon: icons_default["segment.png"],
				type: "Segment",
				hint: "This hint will be shown on hover",
				data: [],
				settings: {},
				mods: {
					"Extended": {
						settings: { extended: true },
						icon: icons_default["extended.png"]
					},
					"Ray": {
						settings: { ray: true },
						icon: icons_default["ray.png"]
					}
				}
			};
		},
		init() {
			this.pins.push(new Pin(this, "p1"));
			this.pins.push(new Pin(this, "p2", { state: "tracking" }));
			this.pins[1].on("settled", () => {
				this.set_state("finished");
				this.custom_event("drawing-mode-off");
			});
		},
		draw(ctx) {
			if (!this.p1 || !this.p2) return;
			ctx.lineWidth = this.line_width;
			ctx.strokeStyle = this.color;
			ctx.beginPath();
			if (this.sett.ray) new Ray(this, ctx).draw(this.p1, this.p2);
			else if (this.sett.extended) new Line(this, ctx).draw(this.p1, this.p2);
			else new Seg(this, ctx).draw(this.p1, this.p2);
			ctx.stroke();
			this.render_pins(ctx);
		},
		use_for() {
			return ["LineTool"];
		},
		data_colors() {
			return [this.color];
		}
	},
	computed: {
		p1() {
			return this.$props.settings.p1;
		},
		p2() {
			return this.$props.settings.p2;
		},
		line_width() {
			return this.sett.lineWidth || .9;
		},
		color() {
			return this.sett.color || "#42b28a";
		}
	},
	data() {
		return {};
	}
};
//#endregion
//#region src/components/overlays/RangeTool.vue
var _sfc_main$21 = {
	name: "RangeTool",
	mixins: [overlay_default, tool_default],
	methods: {
		meta_info() {
			return {
				author: "C451",
				version: "2.0.1"
			};
		},
		tool() {
			return {
				group: "Measurements",
				icon: icons_default["price_range.png"],
				type: "Price",
				hint: "Price Range",
				data: [],
				settings: {},
				mods: {
					"Time": {
						icon: icons_default["time_range.png"],
						settings: {
							price: false,
							time: true
						}
					},
					"PriceTime": {
						icon: icons_default["price_time.png"],
						settings: {
							price: true,
							time: true
						}
					},
					"ShiftMode": {
						settings: {
							price: true,
							time: true,
							shiftMode: true
						},
						hidden: true
					}
				}
			};
		},
		init() {
			this.pins.push(new Pin(this, "p1", { hidden: this.shift }));
			this.pins.push(new Pin(this, "p2", {
				state: "tracking",
				hidden: this.shift
			}));
			this.pins[1].on("settled", () => {
				this.set_state("finished");
				this.custom_event("drawing-mode-off");
				if (this.shift) this.custom_event("object-selected");
			});
		},
		draw(ctx) {
			if (!this.p1 || !this.p2) return;
			const dir = Math.sign(this.p2[1] - this.p1[1]);
			const layout = this.$props.layout;
			const xm = layout.t2screen((this.p1[0] + this.p2[0]) * .5);
			ctx.lineWidth = this.line_width;
			ctx.strokeStyle = this.color;
			ctx.fillStyle = this.back_color;
			let x1 = layout.t2screen(this.p1[0]);
			let y1 = layout.$2screen(this.p1[1]);
			let x2 = layout.t2screen(this.p2[0]);
			let y2 = layout.$2screen(this.p2[1]);
			ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
			if (this.price) this.vertical(ctx, x1, y1, x2, y2, xm);
			if (this.time) this.horizontal(ctx, x1, y1, x2, y2, xm);
			this.draw_value(ctx, dir, xm, y2);
			this.render_pins(ctx);
		},
		vertical(ctx, x1, y1, x2, y2, xm) {
			this.$props.layout;
			const dir = Math.sign(this.p2[1] - this.p1[1]);
			ctx.beginPath();
			if (!this.shift) {
				new Seg(this, ctx).draw([this.p1[0], this.p2[1]], [this.p2[0], this.p2[1]]);
				new Seg(this, ctx).draw([this.p1[0], this.p1[1]], [this.p2[0], this.p1[1]]);
			}
			ctx.moveTo(xm - 4, y2 + 5 * dir);
			ctx.lineTo(xm, y2);
			ctx.lineTo(xm + 4, y2 + 5 * dir);
			ctx.stroke();
			ctx.beginPath();
			ctx.setLineDash([5, 5]);
			new Seg(this, ctx).draw([(this.p1[0] + this.p2[0]) * .5, this.p2[1]], [(this.p1[0] + this.p2[0]) * .5, this.p1[1]]);
			ctx.stroke();
			ctx.setLineDash([]);
		},
		horizontal(ctx, x1, y1, x2, y2, xm) {
			const layout = this.$props.layout;
			const xdir = Math.sign(this.p2[0] - this.p1[0]);
			const ym = (layout.$2screen(this.p1[1]) + layout.$2screen(this.p2[1])) / 2;
			ctx.beginPath();
			if (!this.shift) {
				new Seg(this, ctx).draw([this.p1[0], this.p1[1]], [this.p1[0], this.p2[1]]);
				new Seg(this, ctx).draw([this.p2[0], this.p1[1]], [this.p2[0], this.p2[1]]);
			}
			ctx.moveTo(x2 - 5 * xdir, ym - 4);
			ctx.lineTo(x2, ym);
			ctx.lineTo(x2 - 5 * xdir, ym + 4);
			ctx.stroke();
			ctx.beginPath();
			ctx.setLineDash([5, 5]);
			ctx.moveTo(x1, ym);
			ctx.lineTo(x2, ym);
			ctx.stroke();
			ctx.setLineDash([]);
		},
		draw_value(ctx, dir, xm, y) {
			ctx.font = this.new_font;
			let d$ = (this.p2[1] - this.p1[1]).toFixed(this.prec);
			let p = this.p1[1] !== 0 ? (100 * (this.p2[1] / this.p1[1] - 1)).toFixed(this.prec) : "N/A";
			let f = (t) => this.layout.ti_map.smth2t(t);
			let dt = f(this.p2[0]) - f(this.p1[0]);
			this.layout.ti_map.tf;
			let f2 = (t) => this.layout.c_magnet_i(t);
			let b = f2(this.p2[0]) - f2(this.p1[0]);
			let dtstr = this.t2str(dt);
			let text = [];
			if (this.price) text.push(`${d$}  (${p}%)`);
			if (this.time) text.push(`${b} bars, ${dtstr}`);
			text = text.join("\n");
			let lines = text.split("\n");
			let w = Math.max(...lines.map((x) => ctx.measureText(x).width + 20), 100);
			let n = lines.length;
			let h = 20 * n;
			ctx.fillStyle = this.value_back;
			ctx.fillRect(xm - w * .5, y - (10 + h) * dir, w, h * dir);
			ctx.fillStyle = this.value_color;
			ctx.textAlign = "center";
			lines.forEach((l, i) => {
				ctx.fillText(l, xm, y + (dir > 0 ? 20 * i - 20 * n + 5 : 20 * i + 25));
			});
		},
		t2str(t) {
			let sign = Math.sign(t);
			let abs = Math.abs(t);
			let tfs = [
				[
					1e3,
					"s",
					60
				],
				[
					6e4,
					"m",
					60
				],
				[
					36e5,
					"h",
					24
				],
				[
					864e5,
					"D",
					7
				],
				[
					6048e5,
					"W",
					4
				],
				[
					2592e6,
					"M",
					12
				],
				[
					31536e6,
					"Y",
					Infinity
				],
				[
					Infinity,
					"Eternity",
					Infinity
				]
			];
			for (var i = 0; i < tfs.length; i++) {
				tfs[i][0] = Math.floor(abs / tfs[i][0]);
				if (tfs[i][0] === 0) {
					let p1 = tfs[i - 1];
					let p2 = tfs[i - 2];
					let txt = sign < 0 ? "-" : "";
					if (p1) txt += p1.slice(0, 2).join("");
					let n2 = p2 ? p2[0] - p1[0] * p2[2] : 0;
					if (p2 && n2) {
						txt += " ";
						txt += `${n2}${p2[1]}`;
					}
					return txt;
				}
			}
		},
		use_for() {
			return ["RangeTool"];
		},
		data_colors() {
			return [this.color];
		}
	},
	computed: {
		p1() {
			return this.$props.settings.p1;
		},
		p2() {
			return this.$props.settings.p2;
		},
		line_width() {
			return this.sett.lineWidth || .9;
		},
		color() {
			return this.sett.color || this.$props.colors.cross;
		},
		back_color() {
			return this.sett.backColor || "#9b9ba316";
		},
		value_back() {
			return this.sett.valueBack || "#9b9ba316";
		},
		value_color() {
			return this.sett.valueColor || this.$props.colors.text;
		},
		prec() {
			return this.sett.precision || 2;
		},
		new_font() {
			return "12px " + this.$props.font.split("px").pop();
		},
		price() {
			return "price" in this.sett ? this.sett.price : true;
		},
		time() {
			return "time" in this.sett ? this.sett.time : false;
		},
		shift() {
			return this.sett.shiftMode;
		}
	},
	data() {
		return {};
	}
};
//#endregion
//#region src/components/overlays/StepLine.vue
var _sfc_main$20 = {
	name: "StepLine",
	mixins: [overlay_default, canvas_drawing_default],
	methods: {
		meta_info() {
			return {
				author: "Custom",
				version: "1.0.0"
			};
		},
		draw(ctx) {
			if (this.$props.data.length < 1) return;
			this.setupStroke(ctx, this.line_width, this.color);
			ctx.beginPath();
			this.drawStepLine(ctx, this.$props.data, this.data_index);
			ctx.stroke();
		},
		use_for() {
			return ["StepLine"];
		},
		data_colors() {
			return [this.color];
		},
		y_range(hi, lo) {
			let data = this.$props.data;
			let i = this.data_index;
			let max = -Infinity;
			let min = Infinity;
			for (let p of data) if (p[i] != null) {
				if (p[i] > max) max = p[i];
				if (p[i] < min) min = p[i];
			}
			if (max === -Infinity) return [hi, lo];
			let pad = (max - min) * .1 || 1;
			return [max + pad, min - pad];
		}
	},
	computed: {
		line_width() {
			return this.sett.lineWidth || 1.5;
		},
		color() {
			const n = this.$props.num % 5;
			return this.sett.color || constants_default.OVERLAY_COLORS[n];
		},
		data_index() {
			return this.sett.dataIndex || 1;
		}
	}
};
//#endregion
//#region src/mixins/bar-chart-base.js
var bar_chart_base_default = {
	methods: {
		meta_info() {
			return {
				author: "Custom",
				version: "1.0.0"
			};
		},
		draw(ctx) {
			const layout = this.$props.layout;
			const data = this.$props.data;
			const i = this.data_index;
			const baseline = this.baseline;
			if (data.length < 1) return;
			const barWidth = Math.max(1, layout.px_step * this.bar_width_ratio);
			for (var k = 0, n = data.length; k < n; k++) {
				let p = data[k];
				if (p[i] == null) continue;
				let x = layout.t2screen(p[0]);
				let y = layout.$2screen(p[i]);
				let y0 = layout.$2screen(baseline);
				ctx.fillStyle = p[i] >= baseline ? this.colorUp : this.colorDown;
				let barX = x - barWidth / 2;
				let barY = Math.min(y, y0);
				let barHeight = Math.abs(y - y0) || 1;
				ctx.fillRect(barX, barY, barWidth, barHeight);
			}
		},
		data_colors() {
			return [this.colorUp, this.colorDown];
		},
		legend(values) {
			let val = values[this.data_index];
			return [{
				value: val,
				color: val >= this.baseline ? this.colorUp : this.colorDown
			}];
		},
		y_range(hi, lo) {
			let data = this.$props.data;
			let i = this.data_index;
			let max = -Infinity;
			let min = Infinity;
			for (let p of data) if (p[i] != null) {
				if (p[i] > max) max = p[i];
				if (p[i] < min) min = p[i];
			}
			if (max === -Infinity) return [hi, lo];
			let baseline = this.baseline;
			if (baseline < min) min = baseline;
			if (baseline > max) max = baseline;
			let pad = (max - min) * .1 || 1;
			return [max + pad, min - pad];
		}
	},
	computed: {
		colorDown() {
			return this.sett.colorDown || "#EF5350";
		},
		baseline() {
			return this.sett.baseline || 0;
		},
		data_index() {
			return this.sett.dataIndex || 1;
		}
	},
	data() {
		return {};
	}
};
//#endregion
//#region src/components/overlays/Histogram.vue
var _sfc_main$19 = {
	name: "Histogram",
	mixins: [overlay_default, bar_chart_base_default],
	methods: { use_for() {
		return ["Histogram"];
	} },
	computed: {
		colorUp() {
			return this.sett.colorUp || this.sett.color || "#26A69A";
		},
		bar_width_ratio() {
			return this.sett.barWidth || .8;
		}
	}
};
//#endregion
//#region src/components/overlays/Bar.vue
var _sfc_main$18 = {
	name: "Bar",
	mixins: [overlay_default, bar_chart_base_default],
	methods: { use_for() {
		return ["Bar"];
	} },
	computed: {
		colorUp() {
			return this.sett.colorUp || this.sett.color || "#612ff9";
		},
		bar_width_ratio() {
			return this.sett.barWidth || .4;
		}
	}
};
//#endregion
//#region src/components/overlays/Zones.vue
var _sfc_main$17 = {
	name: "Zones",
	mixins: [overlay_default],
	methods: {
		meta_info() {
			return {
				author: "qb",
				version: "1.0.0"
			};
		},
		draw(ctx) {
			const layout = this.$props.layout;
			this.$props.data.forEach((p) => {
				if (p.length < 5) return;
				this._drawZone(ctx, layout, p[0], p[1], p[3], p[2], p[4]);
			});
			(this.sett.zones || []).forEach((p) => {
				this._drawZone(ctx, layout, p[0], p[1], p[2], p[3], p[4]);
			});
		},
		_drawZone(ctx, layout, x1_ts, y1_price, x2_ts, y2_price, color) {
			let x1 = layout.t2screen(x1_ts);
			let y1 = layout.$2screen(y1_price);
			let x2 = layout.t2screen(x2_ts);
			let y2 = layout.$2screen(y2_price);
			color = color || this.default_color;
			let left = Math.min(x1, x2);
			let right = Math.max(x1, x2);
			if (right - left < 2) right = left + 2;
			if (right < 0 || left > layout.width) return;
			ctx.fillStyle = color;
			ctx.fillRect(left, Math.min(y1, y2), right - left, Math.abs(y2 - y1));
		},
		use_for() {
			return ["Zones"];
		},
		data_colors() {
			return [this.default_color];
		}
	},
	computed: { default_color() {
		return this.sett.color || "#FF000020";
	} },
	data() {
		return {};
	}
};
//#endregion
//#region src/helpers/schema/validate-overlay.js
var isFn = (v) => typeof v === "function";
/**
* Validate a Vue overlay component (Options object) against OverlayDefinition.
* @param {any} comp - a component options object (has `.methods`, `.name`)
* @returns {{ ok: boolean, diagnostics: import('../../types/diagnostics').Diagnostic[] }}
*   ok:false => the overlay must not be registered (it would fail to render).
*/
function validateOverlayComponent(comp) {
	const out = [];
	const label = comp && (comp.name || comp.__name) || "overlay";
	if (!comp || typeof comp !== "object") {
		out.push(error("overlay.component", "overlay is not a component object", label));
		return {
			ok: false,
			diagnostics: out
		};
	}
	const m = comp.methods;
	if (!m || typeof m !== "object") {
		out.push(error("overlay.methods", `overlay "${label}" has no methods`, label));
		return {
			ok: false,
			diagnostics: out
		};
	}
	const hasMethod = (name) => {
		if (isFn(m[name])) return true;
		for (const mx of comp.mixins || []) if (mx && mx.methods && isFn(mx.methods[name])) return true;
		return false;
	};
	if (!isFn(m.use_for)) {
		out.push(error("overlay.use_for", `overlay "${label}" must implement use_for() returning string[]`, label));
		return {
			ok: false,
			diagnostics: out
		};
	}
	let useFor;
	try {
		useFor = m.use_for();
	} catch (e) {
		out.push(error("overlay.use_for.throw", `overlay "${label}" use_for() threw: ${e && e.message}`, label));
		return {
			ok: false,
			diagnostics: out
		};
	}
	if (!Array.isArray(useFor) || useFor.length === 0 || !useFor.every((t) => typeof t === "string" && t.length > 0)) {
		out.push(error("overlay.use_for.return", `overlay "${label}" use_for() must return a non-empty string[]`, label));
		return {
			ok: false,
			diagnostics: out
		};
	}
	if (!hasMethod("draw")) out.push(warn("overlay.draw", `overlay "${label}" has no draw(ctx) method — it will not render`, label));
	if (m.meta_info !== void 0 && !isFn(m.meta_info)) out.push(warn("overlay.meta_info", `overlay "${label}" meta_info is present but not a function`, label));
	return {
		ok: true,
		diagnostics: out,
		types: useFor
	};
}
//#endregion
//#region src/components/Grid.vue
var _sfc_main$16 = {
	name: "Grid",
	props: [
		"sub",
		"layout",
		"range",
		"interval",
		"cursor",
		"colors",
		"overlays",
		"width",
		"height",
		"data",
		"grid_id",
		"y_transform",
		"font",
		"tv_id",
		"config",
		"meta",
		"shaders",
		"dataVersion"
	],
	mixins: [canvas_default, uxlist_default],
	components: {
		Crosshair: _sfc_main$35,
		KeyboardListener: _sfc_main$34
	},
	created() {
		this.layer_events = {
			"new-grid-layer": (d) => this.new_layer(d),
			"delete-grid-layer": (d) => this.del_layer(d),
			"show-grid-layer": (d) => {
				if (this.renderer) {
					this.renderer.show_hide_layer(d);
					this.redraw();
				}
			},
			"redraw-grid": () => this.redraw(),
			"layer-meta-props": (d) => this.$emit("layer-meta-props", d),
			"custom-event": (d) => this.$emit("custom-event", d)
		};
		this.keyboard_events = {
			"register-kb-listener": (event) => {
				this.$emit("register-kb-listener", event);
			},
			"remove-kb-listener": (event) => {
				this.$emit("remove-kb-listener", event);
			},
			"keyup": (event) => {
				if (!this.is_active || !this.renderer) return;
				this.renderer.propagate("keyup", event);
			},
			"keydown": (event) => {
				if (!this.is_active || !this.renderer) return;
				this.renderer.propagate("keydown", event);
			},
			"keypress": (event) => {
				if (!this.is_active || !this.renderer) return;
				this.renderer.propagate("keypress", event);
			}
		};
		this._list = [
			_sfc_main$31,
			_sfc_main$30,
			_sfc_main$29,
			_sfc_main$28,
			_sfc_main$27,
			_sfc_main$26,
			_sfc_main$25,
			_sfc_main$24,
			_sfc_main$23,
			_sfc_main$22,
			_sfc_main$21,
			_sfc_main$20,
			_sfc_main$19,
			_sfc_main$18,
			_sfc_main$17
		].concat(this.$props.overlays || []);
		this._registry = {};
		let tools = [];
		this._list.forEach((x, i) => {
			if (!x) return;
			const v = validateOverlayComponent(x);
			if (v.diagnostics.length) report(v.diagnostics, "warn", `overlay registration #${i}`);
			if (!v.ok) return;
			let use_for = x.methods.use_for();
			if (x.methods.tool) tools.push({
				use_for,
				info: x.methods.tool()
			});
			use_for.forEach((indicator) => {
				this._registry[indicator] = i;
			});
		});
		this.$emit("custom-event", {
			event: "register-tools",
			args: tools
		});
	},
	beforeUnmount() {
		if (this.renderer) {
			this.renderer.destroy();
			this.renderer = null;
		}
	},
	mounted() {
		const el = this.$refs["canvas"];
		if (!el) return;
		this.rendererGeneration++;
		const gen = this.rendererGeneration;
		const elDynamic = this.$refs["canvasDynamic"];
		this.renderer = new Grid(el, this, elDynamic);
		this.setup();
		if (this.pendingLayers.length > 0) {
			for (const layer of this.pendingLayers) this.renderer.new_layer(layer);
			this.pendingLayers = [];
		}
		this.$nextTick(() => {
			if (this.rendererGeneration !== gen) return;
			this.redraw();
		});
	},
	render() {
		const id = this.$props.grid_id;
		const layout = this.layoutOverride || this.$props.layout?.grids?.[id];
		if (!layout) return h("div", { class: "trading-vue-grid-loading" });
		return this.create_canvas(h, `grid-${id}`, {
			position: {
				x: 0,
				y: layout.offset || 0
			},
			attrs: {
				width: layout.width,
				height: layout.height,
				overflow: "hidden"
			},
			style: { backgroundColor: this.$props.colors.back },
			hs: [
				h(_sfc_main$35, {
					...this.common_props(),
					"onNewGridLayer": this.layer_events["new-grid-layer"],
					"onDeleteGridLayer": this.layer_events["delete-grid-layer"],
					"onShowGridLayer": this.layer_events["show-grid-layer"],
					"onRedrawGrid": this.layer_events["redraw-grid"],
					"onLayerMetaProps": this.layer_events["layer-meta-props"],
					"onCustomEvent": this.layer_events["custom-event"]
				}),
				h(_sfc_main$34, {
					"onRegisterKbListener": this.keyboard_events["register-kb-listener"],
					"onRemoveKbListener": this.keyboard_events["remove-kb-listener"],
					onKeyup: this.keyboard_events["keyup"],
					onKeydown: this.keyboard_events["keydown"],
					onKeypress: this.keyboard_events["keypress"]
				}),
				h(UxLayer_default, {
					id,
					tv_id: this.$props.tv_id,
					uxs: this.uxs,
					colors: this.$props.colors,
					config: this.$props.config,
					updater: this.renderKey,
					"onCustomEvent": this.emit_ux_event
				})
			].concat(this.get_overlays())
		});
	},
	methods: {
		new_layer(layer) {
			if (!this.renderer) {
				this.pendingLayers.push(layer);
				return;
			}
			this.renderer.new_layer(layer);
		},
		del_layer(layer) {
			if (this.renderer) this.renderer.del_layer(layer);
			const grid_id = this.$props.grid_id;
			this.$emit("custom-event", {
				event: "remove-shaders",
				args: [grid_id, layer]
			});
			this.$emit("custom-event", {
				event: "remove-layer-meta",
				args: [grid_id, layer]
			});
			this.remove_all_ux(layer);
		},
		on_dblclick(e) {
			const grid_id = this.$props.grid_id;
			if (grid_id === 0) this.$emit("custom-event", {
				event: "minimize-all-offcharts",
				args: []
			});
			else this.$emit("custom-event", {
				event: "grid-dblclick",
				args: [grid_id]
			});
		},
		get_overlays() {
			let comp_list = [], count = {};
			for (let d of this.$props.data) {
				let comp = this._list[this._registry[d.type]];
				if (comp) {
					if (comp.methods.calc) comp = this.inject_renderer(comp);
					comp_list.push({
						cls: comp,
						type: d.type,
						data: d.data,
						settings: d.settings,
						i0: d.i0,
						tf: d.tf,
						last: d.last
					});
					count[d.type] = 0;
				}
			}
			return comp_list.map((x, i) => h(x.cls, {
				"onNewGridLayer": this.layer_events["new-grid-layer"],
				"onDeleteGridLayer": this.layer_events["delete-grid-layer"],
				"onShowGridLayer": this.layer_events["show-grid-layer"],
				"onRedrawGrid": this.layer_events["redraw-grid"],
				"onLayerMetaProps": this.layer_events["layer-meta-props"],
				"onCustomEvent": this.layer_events["custom-event"],
				...this.common_props(),
				id: `${x.type}_${count[x.type]++}`,
				type: x.type,
				data: x.data,
				settings: x.settings,
				i0: x.i0,
				tf: x.tf,
				num: i,
				grid_id: this.$props.grid_id,
				meta: this.$props.meta,
				last: x.last
			}));
		},
		common_props() {
			const layout = this.layoutOverride || this.$props.layout?.grids?.[this.$props.grid_id];
			return {
				cursor: this.$props.cursor,
				colors: this.$props.colors,
				layout,
				interval: this.$props.interval,
				sub: this.$props.sub,
				font: this.$props.font,
				config: this.$props.config
			};
		},
		emit_ux_event(e) {
			if (this.on_ux_event(e, "grid")) this.$emit("custom-event", e);
		},
		inject_renderer(comp) {
			let src = comp.methods.calc();
			if (!src.conf || !src.conf.renderer || comp.__renderer__) return comp;
			let f = this._list.find((x) => x.name === src.conf.renderer);
			if (!f) return comp;
			comp.mixins.push(f);
			comp.__renderer__ = src.conf.renderer;
			return comp;
		},
		resize_from_layout(layout) {
			const id = this.$props.grid_id;
			const grid = layout ? layout.grids[id] : null;
			if (grid && this._attrs) {
				this._attrs.width = grid.width;
				this._attrs.height = grid.height;
				this.layoutOverride = grid;
				const wrapper = this.$el;
				if (wrapper) wrapper.style.top = (grid.offset || 0) + "px";
				if (this.renderer) this.renderer.layout = grid;
				this.renderKey++;
				nextTick(() => {
					this.setup();
				});
			}
		}
	},
	computed: {
		is_active() {
			return this.$props.cursor.t !== void 0 && this.$props.cursor.grid_id === this.$props.grid_id;
		},
		rangeKey() {
			const r = this.$props.range;
			if (!r || r.length < 2) return "";
			return `${r[0]},${r[1]}`;
		},
		layoutKey() {
			const id = this.$props.grid_id;
			const grid = this.$props.layout?.grids?.[id];
			if (!grid) return "";
			return `${grid.height},${grid.offset},${grid.width}`;
		},
		dataKey() {
			const data = this.$props.data;
			if (!data) return "";
			const len = data.length;
			const dataVersion = this.$props.dataVersion ?? 0;
			if (len === 0) return `0,${dataVersion}`;
			const first = data[0]?.data?.[0]?.[0] ?? "";
			const lastOvData = data[len - 1]?.data;
			return `${len},${first},${lastOvData?.[lastOvData.length - 1]?.[0] ?? ""},${dataVersion}`;
		},
		yTransformKey() {
			const yt = this.$props.y_transform;
			if (!yt) return "";
			return `${yt.zoom},${yt.auto},${yt.range?.[0]},${yt.range?.[1]}`;
		}
	},
	watch: {
		layoutKey: {
			handler(newKey, oldKey) {
				const id = this.$props.grid_id;
				const layout = this.$props.layout;
				if (!this.renderer && layout?.grids?.[id]) {
					this.rendererGeneration++;
					const gen = this.rendererGeneration;
					nextTick(() => {
						if (this.rendererGeneration !== gen) return;
						if (this.renderer) return;
						const el = this.$refs["canvas"];
						if (!el) return;
						const elDynamic = this.$refs["canvasDynamic"];
						this.renderer = new Grid(el, this, elDynamic);
						this.setup();
						for (const layer of this.pendingLayers) this.renderer.new_layer(layer);
						this.pendingLayers = [];
						nextTick(() => {
							if (this.rendererGeneration !== gen) return;
							this.redraw();
						});
					});
				} else if (this.renderer && newKey !== oldKey) nextTick(() => {
					this.setup();
					this.redraw();
				});
			},
			immediate: false
		},
		rangeKey(newKey, oldKey) {
			if (!newKey || newKey === oldKey) return;
			this.renderKey++;
			nextTick(() => this.redraw());
		},
		"cursor.x": function(newX) {
			if (this._cursorRafPending) return;
			this._cursorRafPending = true;
			requestAnimationFrame(() => {
				this._cursorRafPending = false;
				if (this.$props.cursor?.locked) return;
				this.redraw();
			});
		},
		overlays: {
			handler: function(ovs) {
				if (!this.renderer || !this.renderer.overlays || !ovs) return;
				let layerMap = /* @__PURE__ */ new Map();
				for (let layer of this.renderer.overlays) {
					let comp = layer.renderer;
					if (!comp || typeof comp.id !== "string") continue;
					let tuple = comp.id.split("_");
					tuple.pop();
					let name = tuple.join("_");
					let arr = layerMap.get(name);
					if (!arr) {
						arr = [];
						layerMap.set(name, arr);
					}
					arr.push(comp);
				}
				for (let ov of ovs) {
					if (!ov || !ov.methods) continue;
					let comps = layerMap.get(ov.name);
					if (!comps) continue;
					for (let comp of comps) {
						comp.calc = ov.methods.calc;
						if (!comp.calc) continue;
						let calc = comp.calc.toString();
						if (calc !== ov.__prevscript__) comp.exec_script();
						ov.__prevscript__ = calc;
					}
				}
			},
			deep: true
		},
		shaders(n, p) {
			this.redraw();
		},
		dataKey(newKey, oldKey) {
			if (!newKey || newKey === oldKey) return;
			this.renderKey++;
			nextTick(() => this.redraw());
		},
		yTransformKey(newKey, oldKey) {
			if (!newKey || newKey === oldKey) return;
			this.renderKey++;
			nextTick(() => this.redraw());
		}
	},
	data() {
		return {
			layoutOverride: null,
			renderKey: 0,
			pendingLayers: [],
			rendererGeneration: 0
		};
	}
};
//#endregion
//#region src/components/js/sidebar.js
var PANHEIGHT;
var Sidebar = class {
	constructor(canvas, comp, side = "right", canvasDynamic = null) {
		PANHEIGHT = (comp.$props.config || {}).PANHEIGHT || 22;
		this.canvas = canvas;
		this.canvasDynamic = canvasDynamic;
		this.ctx = canvas.getContext("2d");
		this.comp = comp;
		this.$p = comp.$props;
		this.data = this.$p.sub;
		this.range = this.$p.range;
		this.id = this.$p.grid_id;
		this.layout = this.$p.layout?.grids?.[this.id];
		this.side = side;
		this._destroyed = false;
		this.listeners();
	}
	async listeners() {
		const { Hammer, Hamster } = await loadGestures();
		if (this._destroyed) return;
		let eventTarget = this.canvasDynamic || this.canvas;
		this.hm = Hamster(eventTarget);
		this._throttledWheel = utils_default.rafThrottle((delta, event) => {
			this.mousezoom(delta * 50, event);
		});
		this.hm.wheel((event, delta) => this._throttledWheel(delta, event));
		let mc = this.mc = new Hammer.Manager(eventTarget);
		mc.add(new Hammer.Pan({
			direction: Hammer.DIRECTION_VERTICAL,
			threshold: 0
		}));
		mc.add(new Hammer.Tap({
			event: "doubletap",
			taps: 2,
			posThreshold: 50
		}));
		mc.on("panstart", (event) => {
			if (this.$p.y_transform) this.zoom = this.$p.y_transform.zoom;
			else this.zoom = 1;
			this.y_range = [this.layout.$_hi, this.layout.$_lo];
			this.drug = {
				y: event.center.y,
				z: this.zoom,
				mid: math_default.log_mid(this.y_range, this.layout.height),
				A: this.layout.A,
				B: this.layout.B
			};
		});
		this._throttledPanmove = utils_default.rafThrottle((event) => {
			if (this.drug) {
				this.zoom = this.calc_zoom(event);
				this.comp.$emit("sidebar-transform", {
					grid_id: this.id,
					zoom: this.zoom,
					auto: false,
					range: this.calc_range(),
					drugging: true
				});
			}
		});
		mc.on("panmove", (event) => this._throttledPanmove(event));
		mc.on("panend", () => {
			this.drug = null;
			this.comp.$emit("sidebar-transform", {
				grid_id: this.id,
				drugging: false
			});
		});
		mc.on("doubletap", () => {
			this.comp.$emit("sidebar-transform", {
				grid_id: this.id,
				zoom: 1,
				auto: true
			});
			this.zoom = 1;
		});
	}
	update() {
		this.layout = this.comp.layoutOverride || this.$p.layout.grids[this.id];
		let points = this.layout.ys;
		let x, y, w, h, side = this.side;
		let sb = this.layout.sb;
		this.ctx.font = this.$p.font;
		switch (side) {
			case "left":
				x = 0;
				y = 0;
				w = Math.floor(sb);
				h = this.layout.height;
				this.ctx.clearRect(x, y, w, h);
				this.ctx.strokeStyle = this.$p.colors.scale;
				this.ctx.beginPath();
				this.ctx.moveTo(x + .5, 0);
				this.ctx.lineTo(x + .5, h);
				this.ctx.stroke();
				break;
			case "right":
				x = 0;
				y = 0;
				w = Math.floor(sb);
				h = this.layout.height;
				this.ctx.clearRect(x, y, w, h);
				this.ctx.strokeStyle = this.$p.colors.scale;
				this.ctx.beginPath();
				this.ctx.moveTo(x + .5, 0);
				this.ctx.lineTo(x + .5, h);
				this.ctx.stroke();
				break;
		}
		const ctx = this.ctx;
		const layoutHeight = this.layout.height;
		const prec = this.layout.prec;
		const isLeft = side === "left";
		const x1Base = isLeft ? w - .5 : x - .5;
		const x2Offset = isLeft ? -4.5 : 4.5;
		const textOffset = isLeft ? -10 : 10;
		const textAlign = isLeft ? "end" : "start";
		ctx.fillStyle = this.$p.colors.text;
		ctx.beginPath();
		ctx.textAlign = textAlign;
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			if (p[0] > layoutHeight) continue;
			const y = p[0] - .5;
			ctx.moveTo(x1Base, y);
			ctx.lineTo(x1Base + x2Offset, y);
			ctx.fillText(p[1].toFixed(prec), x1Base + textOffset, p[0] + 4);
		}
		ctx.stroke();
		this._labelGeom = {
			x1Base,
			x2Offset,
			textOffset,
			textAlign
		};
		if (this.$p.grid_id) this.upper_border();
		this.apply_shaders();
		if (this.$p.cursor.y && this.$p.cursor.y$) this.panel();
		this._lastPanelY = this.$p.cursor.y;
	}
	updatePanelOnly() {
		if (!this.$p.cursor.y || !this.$p.cursor.y$) {
			if (this._lastPanelY !== void 0) {
				this._clearPanel(this._lastPanelY);
				this._lastPanelY = void 0;
			}
			return;
		}
		if (this._lastPanelY !== void 0 && this._lastPanelY !== this.$p.cursor.y) this._clearPanel(this._lastPanelY);
		this.panel();
		this._lastPanelY = this.$p.cursor.y;
	}
	_clearPanel(panelY) {
		const panwidth = this.layout.sb + 1;
		const x = -.5;
		const y = panelY - PANHEIGHT * .5 - .5 - 1;
		const clearTop = y - 1;
		const clearBottom = y - 1 + (PANHEIGHT + 2);
		this.ctx.clearRect(x - 1, clearTop, panwidth + 2, PANHEIGHT + 2);
		this.ctx.strokeStyle = this.$p.colors.scale;
		this.ctx.beginPath();
		this.ctx.moveTo(.5, y);
		this.ctx.lineTo(.5, y + PANHEIGHT + 2);
		this.ctx.stroke();
		this._repaintLabels(clearTop, clearBottom);
	}
	_repaintLabels(top, bottom) {
		const geom = this._labelGeom;
		if (!geom || !this.layout) return;
		const points = this.layout.ys;
		if (!points) return;
		const ctx = this.ctx;
		const layoutHeight = this.layout.height;
		const prec = this.layout.prec;
		const { x1Base, x2Offset, textOffset, textAlign } = geom;
		ctx.font = this.$p.font;
		ctx.fillStyle = this.$p.colors.text;
		ctx.textAlign = textAlign;
		ctx.strokeStyle = this.$p.colors.scale;
		ctx.beginPath();
		let stroked = false;
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			if (p[0] > layoutHeight) continue;
			const labelY = p[0] + 4;
			if (labelY < top - PANHEIGHT || labelY > bottom + 4) continue;
			const ty = p[0] - .5;
			ctx.moveTo(x1Base, ty);
			ctx.lineTo(x1Base + x2Offset, ty);
			stroked = true;
			ctx.fillText(p[1].toFixed(prec), x1Base + textOffset, labelY);
		}
		if (stroked) ctx.stroke();
	}
	apply_shaders() {
		let layout = this.layout;
		if (!layout) return;
		let props = {
			layout,
			cursor: this.$p.cursor
		};
		for (let s of this.$p.shaders) {
			this.ctx.save();
			s.draw(this.ctx, props);
			this.ctx.restore();
		}
	}
	upper_border() {
		this.ctx.strokeStyle = this.$p.colors.scale;
		this.ctx.beginPath();
		this.ctx.moveTo(0, .5);
		this.ctx.lineTo(this.layout.width, .5);
		this.ctx.stroke();
	}
	panel() {
		if (this.$p.cursor.grid_id !== this.layout.id) return;
		const y$ = this.$p.cursor.y$;
		const prec = this.layout.prec;
		let lbl;
		if (this._lastY$ === y$ && this._lastPrec === prec && this._lastLbl) lbl = this._lastLbl;
		else {
			lbl = y$.toFixed(prec);
			this._lastY$ = y$;
			this._lastPrec = prec;
			this._lastLbl = lbl;
		}
		this.ctx.fillStyle = this.$p.colors.panel;
		let panwidth = this.layout.sb + 1;
		let x = -.5;
		let y = this.$p.cursor.y - PANHEIGHT * .5 - .5;
		let a = 7;
		this.ctx.fillRect(x - .5, y, panwidth, PANHEIGHT);
		this.ctx.fillStyle = this.$p.colors.textHL;
		this.ctx.textAlign = "left";
		this.ctx.fillText(lbl, a, y + 15);
	}
	calc_zoom(event) {
		let d = this.drug.y - event.center.y;
		let k = 1 + (d > 0 ? 3 : 1) * d / this.layout.height;
		return utils_default.clamp(this.drug.z * k, .005, 100);
	}
	calc_range(diff1 = 1, diff2 = 1) {
		let z = this.zoom / this.drug.z;
		let zk = (1 / z - 1) / 2;
		let range = this.y_range.slice();
		let delta = range[0] - range[1];
		if (!this.layout.grid.logScale) {
			range[0] = range[0] + delta * zk * diff1;
			range[1] = range[1] - delta * zk * diff2;
		} else {
			let px_mid = this.layout.height / 2;
			let new_hi = px_mid - px_mid * (1 / z);
			let new_lo = px_mid + px_mid * (1 / z);
			let f = (y) => math_default.exp((y - this.drug.B) / this.drug.A);
			range.slice();
			range[0] = f(new_hi);
			range[1] = f(new_lo);
		}
		return range;
	}
	mousezoom(delta, event) {
		event.originalEvent.preventDefault();
		event.preventDefault();
		if (this.$p.y_transform) this.zoom = this.$p.y_transform.zoom;
		else this.zoom = 1;
		this.y_range = [this.layout.$_hi, this.layout.$_lo];
		this.drug = {
			y: 0,
			z: this.zoom,
			mid: math_default.log_mid(this.y_range, this.layout.height),
			A: this.layout.A,
			B: this.layout.B
		};
		delta = utils_default.smart_wheel(delta);
		let k = delta * .002;
		this.zoom = utils_default.clamp(this.zoom * (1 + k), .005, 100);
		this.comp.$emit("sidebar-transform", {
			grid_id: this.id,
			zoom: this.zoom,
			auto: false,
			range: this.calc_range(),
			drugging: false
		});
		this.drug = null;
	}
	rezoom_range(delta, diff1, diff2) {
		if (!this.$p.y_transform || this.$p.y_transform.auto) return;
		this.zoom = 1;
		if (delta < 0) delta /= 3.75;
		delta *= .25;
		this.y_range = [this.layout.$_hi, this.layout.$_lo];
		this.drug = {
			y: 0,
			z: this.zoom,
			mid: math_default.log_mid(this.y_range, this.layout.height),
			A: this.layout.A,
			B: this.layout.B
		};
		this.zoom = this.calc_zoom({ center: { y: delta * this.layout.height } });
		this.comp.$emit("sidebar-transform", {
			grid_id: this.id,
			zoom: this.zoom,
			auto: false,
			range: this.calc_range(diff1, diff2),
			drugging: true
		});
		this.drug = null;
		this.comp.$emit("sidebar-transform", {
			grid_id: this.id,
			drugging: false
		});
	}
	destroy() {
		this._destroyed = true;
		if (this.mc) this.mc.destroy();
		if (this.hm) this.hm.unwheel();
		if (this._throttledWheel) this._throttledWheel.cancel();
		if (this._throttledPanmove) this._throttledPanmove.cancel();
		this.canvasDynamic = null;
	}
	mousemove() {}
	mouseout() {}
	mouseup() {}
	mousedown() {}
};
//#endregion
//#region src/components/Sidebar.vue
var _sfc_main$15 = {
	name: "Sidebar",
	props: [
		"sub",
		"layout",
		"range",
		"interval",
		"cursor",
		"colors",
		"font",
		"width",
		"height",
		"grid_id",
		"rerender",
		"y_transform",
		"tv_id",
		"config",
		"shaders"
	],
	mixins: [canvas_default],
	mounted() {
		const el = this.$refs["canvas"];
		if (!el) return;
		const dynEl = this.$refs["canvasDynamic"];
		this.renderer = new Sidebar(el, this, "right", dynEl);
		this.setup();
		this.redraw();
	},
	render() {
		const id = this.$props.grid_id;
		const layout = this.layoutOverride || this.$props.layout?.grids?.[id];
		if (!layout) return h("div", { class: "trading-vue-sidebar-loading" });
		return this.create_canvas(h, `sidebar-${id}`, {
			position: {
				x: layout.width,
				y: layout.offset || 0
			},
			attrs: {
				rerender: this.$props.rerender,
				width: layout.sb,
				height: layout.height
			},
			style: { backgroundColor: this.$props.colors.back }
		});
	},
	methods: { resize_from_layout(layout) {
		const id = this.$props.grid_id;
		const grid = layout ? layout.grids[id] : null;
		if (grid && this._attrs) {
			this._attrs.width = grid.sb;
			this._attrs.height = grid.height;
			this.layoutOverride = grid;
			const wrapper = this.$el;
			if (wrapper) {
				wrapper.style.top = (grid.offset || 0) + "px";
				wrapper.style.left = grid.width + "px";
			}
			if (this.renderer) this.renderer.layout = grid;
			this.renderKey++;
			nextTick(() => {
				this.setup();
			});
		}
	} },
	data() {
		return {
			layoutOverride: null,
			renderKey: 0
		};
	},
	computed: {
		rangeKey() {
			const r = this.$props.range;
			if (!r || r.length < 2) return "";
			return `${r[0]},${r[1]}`;
		},
		layoutKey() {
			const id = this.$props.grid_id;
			const grid = this.$props.layout?.grids?.[id];
			if (!grid) return "";
			return `${grid.sb},${grid.height},${grid.offset},${grid.width}`;
		},
		yTransformKey() {
			const yt = this.$props.y_transform;
			if (!yt) return "";
			return `${yt.zoom},${yt.auto},${yt.range?.[0]},${yt.range?.[1]}`;
		}
	},
	watch: {
		layoutKey: {
			handler(newKey, oldKey) {
				const id = this.$props.grid_id;
				const grid = this.$props.layout?.grids?.[id];
				if (!this.renderer && grid) nextTick(() => {
					if (this.renderer) return;
					const el = this.$refs["canvas"];
					if (!el) return;
					const dynEl = this.$refs["canvasDynamic"];
					this.renderer = new Sidebar(el, this, "right", dynEl);
					this.setup();
					this.redraw();
				});
				else if (this.renderer && newKey !== oldKey) nextTick(() => {
					this.setup();
					this.redraw();
				});
			},
			immediate: false
		},
		rangeKey(newKey, oldKey) {
			if (!newKey || newKey === oldKey) return;
			this.redraw();
		},
		"cursor.y$": function(newY) {
			if (this._cursorRafPending) return;
			this._cursorRafPending = true;
			requestAnimationFrame(() => {
				this._cursorRafPending = false;
				if (this.renderer && this.renderer.updatePanelOnly) this.renderer.updatePanelOnly();
				else this.redraw();
			});
		},
		rerender() {
			nextTick(() => this.redraw());
		},
		renderKey() {
			nextTick(() => this.redraw());
		},
		yTransformKey(newKey, oldKey) {
			if (!newKey || newKey === oldKey) return;
			nextTick(() => this.redraw());
		}
	},
	beforeUnmount() {
		if (this.renderer) this.renderer.destroy();
	}
};
//#endregion
//#region src/components/LegendButton.vue
var _sfc_main$14 = {
	name: "LegendButton",
	props: [
		"id",
		"tv_id",
		"grid_id",
		"ov_id",
		"index",
		"display",
		"icon",
		"config"
	],
	mounted() {},
	computed: {
		base64() {
			return this.icon || icons_default[this.file_name];
		},
		file_name() {
			let id = this.$props.id;
			if (this.$props.id === "display") id = this.$props.display ? "display_on" : "display_off";
			return id + ".png";
		},
		uuid() {
			return `${this.$props.tv_id}-btn-g${this.$props.grid_id}-${this.$props.ov_id}`;
		},
		data_type() {
			return this.$props.grid_id === 0 ? "onchart" : "offchart";
		},
		data_index() {
			return this.$props.index;
		}
	},
	methods: { onclick() {
		this.$emit("legend-button-click", {
			button: this.$props.id,
			type: this.data_type,
			dataIndex: this.data_index,
			grid: this.$props.grid_id,
			overlay: this.$props.ov_id
		});
	} }
};
var _hoisted_1$6 = ["src", "id"];
function _sfc_render$12(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("img", {
		class: "t-vue-lbtn",
		src: $options.base64,
		id: $options.uuid,
		style: normalizeStyle({
			width: $props.config.L_BTN_SIZE + "px",
			height: $props.config.L_BTN_SIZE + "px",
			margin: $props.config.L_BTN_MARGIN
		}),
		onClick: _cache[0] || (_cache[0] = (...args) => $options.onclick && $options.onclick(...args))
	}, null, 12, _hoisted_1$6);
}
//#endregion
//#region src/components/ButtonGroup.vue
var _sfc_main$13 = {
	name: "ButtonGroup",
	props: [
		"buttons",
		"tv_id",
		"ov_id",
		"grid_id",
		"index",
		"display",
		"config"
	],
	components: { LegendButton: /* @__PURE__ */ _plugin_vue_export_helper_default(_sfc_main$14, [["render", _sfc_render$12]]) },
	methods: { button_click(event) {
		this.$emit("legend-button-click", event);
	} }
};
var _hoisted_1$5 = { class: "t-vue-lbtn-grp" };
function _sfc_render$11(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_legend_button = resolveComponent("legend-button");
	return openBlock(), createElementBlock("span", _hoisted_1$5, [(openBlock(true), createElementBlock(Fragment, null, renderList($props.buttons, (b, i) => {
		return openBlock(), createBlock(_component_legend_button, {
			key: i,
			id: b.name || b,
			tv_id: $props.tv_id,
			ov_id: $props.ov_id,
			grid_id: $props.grid_id,
			index: $props.index,
			display: $props.display,
			icon: b.icon,
			config: $props.config,
			onLegendButtonClick: $options.button_click
		}, null, 8, [
			"id",
			"tv_id",
			"ov_id",
			"grid_id",
			"index",
			"display",
			"icon",
			"config",
			"onLegendButtonClick"
		]);
	}), 128))]);
}
var ButtonGroup_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$13, [["render", _sfc_render$11]]);
//#endregion
//#region src/components/Spinner.vue
var _sfc_main$12 = {
	name: "Spinner",
	props: ["colors"]
};
var _hoisted_1$4 = { class: "tvjs-spinner" };
function _sfc_render$10(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", _hoisted_1$4, [(openBlock(), createElementBlock(Fragment, null, renderList(4, (i) => {
		return createElementVNode("div", {
			key: i,
			style: normalizeStyle({ background: $props.colors.text })
		}, null, 4);
	}), 64))]);
}
//#endregion
//#region src/components/Legend.vue
var _sfc_main$11 = {
	name: "ChartLegend",
	props: [
		"common",
		"values",
		"grid_id",
		"meta_props",
		"layout_override"
	],
	components: {
		ButtonGroup: ButtonGroup_default,
		Spinner: /* @__PURE__ */ _plugin_vue_export_helper_default(_sfc_main$12, [["render", _sfc_render$10]])
	},
	created() {
		this._ohlcvCacheKey = null;
		this._ohlcvCache = null;
	},
	computed: {
		ohlcv() {
			if (!this.$props.values || !this.$props.values.ohlcv || !this.layout) return Array(6).fill("n/a");
			const prec = this.layout.prec ?? 2;
			let id = this.main_type + "_0";
			let meta = this.$props.meta_props[id] || {};
			if (meta.legend) return (meta.legend() || []).map((x) => x.value);
			const ohlcv = this.$props.values.ohlcv;
			const cacheKey = `${ohlcv[1]},${ohlcv[2]},${ohlcv[3]},${ohlcv[4]},${ohlcv[5]},${prec}`;
			if (this._ohlcvCacheKey === cacheKey && this._ohlcvCache) return this._ohlcvCache;
			this._ohlcvCacheKey = cacheKey;
			this._ohlcvCache = [
				ohlcv[1].toFixed(prec),
				ohlcv[2].toFixed(prec),
				ohlcv[3].toFixed(prec),
				ohlcv[4].toFixed(prec),
				ohlcv[5] ? ohlcv[5].toFixed(2) : "n/a"
			];
			return this._ohlcvCache;
		},
		_indexMap() {
			const sourceData = this.off_data || this.json_data;
			return new Map(sourceData.map((item, idx) => [item, idx]));
		},
		indicators() {
			const values = this.$props.values;
			const f = this.format;
			let types = {};
			const indexMap = this._indexMap;
			return this.json_data.filter((x) => x.settings.legend !== false && !x.main).map((x) => {
				if (!(x.type in types)) types[x.type] = 0;
				const id = x.type + `_${types[x.type]++}`;
				return {
					v: "display" in x.settings ? x.settings.display : true,
					name: x.name || id,
					index: indexMap.get(x) ?? -1,
					id,
					type: x.type,
					settings: x.settings || {},
					values: values ? f(id, values) : this.n_a(1),
					unk: !(id in (this.$props.meta_props || {})),
					loading: x.loading
				};
			});
		},
		calc_style() {
			if (!this.layout) return {
				top: "10px",
				width: "100px"
			};
			let top = this.layout.height > 150 ? 10 : 5;
			let w = (this.$props.common?.layout?.grids)?.[0]?.width ?? 100;
			return {
				top: `${(this.layout.offset || 0) + top}px`,
				width: `${w - 20}px`
			};
		},
		layout() {
			const id = this.$props.grid_id;
			if (this.$props.layout_override?.grids?.[id]) return this.$props.layout_override.grids[id];
			return this.$props.common?.layout?.grids?.[id];
		},
		json_data() {
			return this.$props.common?.data || [];
		},
		off_data() {
			return this.$props.common?.offchart;
		},
		main_type() {
			let f = this.$props.common?.data?.find((x) => x.main);
			return f ? f.type : void 0;
		},
		show_values() {
			return this.$props.common?.cursor?.mode !== "explore";
		}
	},
	methods: {
		format(id, values) {
			let meta = this.$props.meta_props[id] || {};
			if (!values[id]) return this.n_a(1);
			if (meta.legend) return meta.legend(values[id]);
			const data = values[id];
			const cacheKey = `${id}:${data.join(",")}`;
			if (!this._formatCache) this._formatCache = /* @__PURE__ */ new Map();
			if (this._formatCache.has(cacheKey)) return this._formatCache.get(cacheKey);
			if (this._formatCache.size > 50) {
				const firstKey = this._formatCache.keys().next().value;
				this._formatCache.delete(firstKey);
			}
			const cs = meta.data_colors ? meta.data_colors() : [];
			const result = new Array(data.length - 1);
			for (let i = 1; i < data.length; i++) {
				let x = data[i];
				if (typeof x === "number") x = x.toFixed(Math.abs(x) > .001 ? 4 : 8);
				result[i - 1] = {
					value: x,
					color: cs.length ? cs[(i - 1) % cs.length] : void 0
				};
			}
			this._formatCache.set(cacheKey, result);
			return result;
		},
		n_a(len) {
			return Array(len).fill({ value: "n/a" });
		},
		button_click(event) {
			this.$emit("legend-button-click", event);
		},
		on_dblclick(e) {
			const grid_id = this.$props.grid_id;
			if (grid_id > 0) {
				e.preventDefault();
				e.stopPropagation();
				this.$emit("legend-dblclick", grid_id);
			}
		},
		openSettings(indicator) {
			this.$emit("open-indicator-settings", {
				name: indicator.name,
				type: indicator.type,
				index: indicator.index,
				settings: indicator.settings,
				gridId: this.$props.grid_id
			});
		},
		closeIndicator(indicator) {
			this.$emit("close-indicator", {
				name: indicator.name,
				index: indicator.index,
				gridId: this.$props.grid_id
			});
		}
	}
};
var _hoisted_1$3 = { key: 0 };
var _hoisted_2$1 = { class: "t-vue-lspan" };
var _hoisted_3 = { class: "t-vue-lspan" };
var _hoisted_4 = { class: "t-vue-lspan" };
var _hoisted_5 = { class: "t-vue-lspan" };
var _hoisted_6 = { class: "t-vue-lspan" };
var _hoisted_7 = { class: "t-vue-iname" };
var _hoisted_8 = ["onClick"];
var _hoisted_9 = ["onClick"];
var _hoisted_10 = {
	key: 2,
	class: "t-vue-ivalues"
};
var _hoisted_11 = {
	key: 3,
	class: "t-vue-unknown"
};
function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_button_group = resolveComponent("button-group");
	const _component_spinner = resolveComponent("spinner");
	return $props.common ? (openBlock(), createElementBlock("div", {
		key: 0,
		class: "trading-vue-legend",
		style: normalizeStyle($options.calc_style),
		onDblclick: _cache[0] || (_cache[0] = (...args) => $options.on_dblclick && $options.on_dblclick(...args))
	}, [$props.grid_id === 0 ? (openBlock(), createElementBlock("div", {
		key: 0,
		class: "trading-vue-ohlcv",
		style: normalizeStyle({ "max-width": ($props.common?.layout?.grids?.[0]?.width || 200) + "px" })
	}, [
		createElementVNode("span", {
			class: "t-vue-title",
			style: normalizeStyle({ color: $props.common?.colors?.title })
		}, toDisplayString($props.common.title_txt), 5),
		$options.show_values ? (openBlock(), createElementBlock("span", _hoisted_1$3, [
			_cache[1] || (_cache[1] = createTextVNode(" O", -1)),
			createElementVNode("span", _hoisted_2$1, toDisplayString($options.ohlcv[0]), 1),
			_cache[2] || (_cache[2] = createTextVNode(" H", -1)),
			createElementVNode("span", _hoisted_3, toDisplayString($options.ohlcv[1]), 1),
			_cache[3] || (_cache[3] = createTextVNode(" L", -1)),
			createElementVNode("span", _hoisted_4, toDisplayString($options.ohlcv[2]), 1),
			_cache[4] || (_cache[4] = createTextVNode(" C", -1)),
			createElementVNode("span", _hoisted_5, toDisplayString($options.ohlcv[3]), 1),
			_cache[5] || (_cache[5] = createTextVNode(" V", -1)),
			createElementVNode("span", _hoisted_6, toDisplayString($options.ohlcv[4]), 1)
		])) : createCommentVNode("", true),
		!$options.show_values ? (openBlock(), createElementBlock("span", {
			key: 1,
			class: "t-vue-lspan",
			style: normalizeStyle({ color: $props.common?.colors?.text })
		}, toDisplayString(($props.common.meta.last || [])[4]), 5)) : createCommentVNode("", true)
	], 4)) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(this.indicators, (ind) => {
		return openBlock(), createElementBlock("div", {
			class: "t-vue-ind",
			key: ind.id
		}, [
			createElementVNode("span", _hoisted_7, toDisplayString(ind.name), 1),
			$props.grid_id > 0 ? (openBlock(), createElementBlock("button", {
				key: 0,
				class: "t-vue-settings-btn",
				onClick: withModifiers(($event) => $options.openSettings(ind), ["stop"]),
				title: "Settings"
			}, [..._cache[6] || (_cache[6] = [createElementVNode("svg", {
				viewBox: "0 0 24 24",
				width: "14",
				height: "14"
			}, [createElementVNode("path", {
				fill: "currentColor",
				d: "M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
			})], -1)])], 8, _hoisted_8)) : createCommentVNode("", true),
			$props.grid_id > 0 ? (openBlock(), createElementBlock("button", {
				key: 1,
				class: "t-vue-close-btn",
				onClick: withModifiers(($event) => $options.closeIndicator(ind), ["stop"]),
				title: "Remove indicator"
			}, [..._cache[7] || (_cache[7] = [createElementVNode("svg", {
				viewBox: "0 0 24 24",
				width: "14",
				height: "14"
			}, [createElementVNode("path", {
				fill: "currentColor",
				d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
			})], -1)])], 8, _hoisted_9)) : createCommentVNode("", true),
			createVNode(_component_button_group, {
				buttons: $props.common.buttons,
				config: $props.common.config,
				ov_id: ind.id,
				grid_id: $props.grid_id,
				index: ind.index,
				tv_id: $props.common.tv_id,
				display: ind.v,
				onLegendButtonClick: $options.button_click
			}, null, 8, [
				"buttons",
				"config",
				"ov_id",
				"grid_id",
				"index",
				"tv_id",
				"display",
				"onLegendButtonClick"
			]),
			ind.v ? (openBlock(), createElementBlock("span", _hoisted_10, [$options.show_values ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(ind.values, (v, idx) => {
				return openBlock(), createElementBlock("span", {
					class: "t-vue-lspan t-vue-ivalue",
					key: idx,
					style: normalizeStyle({ color: v.color })
				}, toDisplayString(v.value), 5);
			}), 128)) : createCommentVNode("", true)])) : createCommentVNode("", true),
			ind.unk ? (openBlock(), createElementBlock("span", _hoisted_11, " (Unknown type) ")) : createCommentVNode("", true),
			createVNode(Transition, { name: "tvjs-appear" }, {
				default: withCtx(() => [ind.loading ? (openBlock(), createBlock(_component_spinner, {
					key: 0,
					colors: $props.common?.colors
				}, null, 8, ["colors"])) : createCommentVNode("", true)]),
				_: 2
			}, 1024)
		]);
	}), 128))], 36)) : createCommentVNode("", true);
}
var Legend_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$11, [["render", _sfc_render$9]]);
//#endregion
//#region src/mixins/shaders.js
var shaders_default = {
	methods: {
		init_shaders(skin, prev) {
			if (skin !== prev) {
				if (prev) this.shaders = this.shaders.filter((x) => x.owner !== prev.id);
				for (var Shader of skin.shaders) {
					let shader = new Shader();
					shader.owner = skin.id;
					this.shaders.push(shader);
				}
			}
		},
		on_shader_event(d, target) {
			if (d.event === "new-shader") {
				if (d.args[0].target === target) {
					d.args[0].id = `${d.args[1]}-${d.args[2]}`;
					this.shaders.push(d.args[0]);
					this.rerender++;
				}
			}
			if (d.event === "remove-shaders") {
				let id = d.args.join("-");
				this.shaders = this.shaders.filter((x) => x.id !== id);
			}
		}
	},
	watch: { skin(n, p) {
		this.init_shaders(n, p);
	} },
	data() {
		return { shaders: [] };
	}
};
//#endregion
//#region src/components/Section.vue
var _sfc_main$10 = {
	name: "GridSection",
	props: ["common", "grid_id"],
	mixins: [shaders_default],
	components: {
		Grid: _sfc_main$16,
		Sidebar: _sfc_main$15,
		ChartLegend: Legend_default
	},
	mounted() {
		this.init_shaders(this.$props.common.skin);
	},
	methods: {
		range_changed(r) {
			this.$emit("range-changed", r);
		},
		cursor_changed(c) {
			c.grid_id = this.$props.grid_id;
			this.$emit("cursor-changed", c);
		},
		cursor_locked(state) {
			this.$emit("cursor-locked", state);
		},
		sidebar_transform(s) {
			this.$emit("sidebar-transform", s);
		},
		emit_meta_props(d) {
			this.meta_props[d.layer_id] = d;
			this.$emit("layer-meta-props", d);
		},
		emit_custom_event(d) {
			this.on_shader_event(d, "sidebar");
			this.$emit("custom-event", d);
		},
		button_click(event) {
			this.$emit("legend-button-click", event);
		},
		legend_dblclick(grid_id) {
			this.$emit("custom-event", {
				event: "grid-dblclick",
				args: [grid_id]
			});
		},
		register_kb(event) {
			this.$emit("register-kb-listener", event);
		},
		remove_kb(event) {
			this.$emit("remove-kb-listener", event);
		},
		rezoom_range(event) {
			let id = "sb-" + event.grid_id;
			if (this.$refs[id]) this.$refs[id].renderer.rezoom_range(event.z, event.diff1, event.diff2);
		},
		open_indicator_settings(indicatorInfo) {
			this.$emit("custom-event", {
				event: "open-indicator-settings",
				args: [indicatorInfo]
			});
		},
		close_indicator(indicatorInfo) {
			this.$emit("custom-event", {
				event: "close-indicator",
				args: [indicatorInfo]
			});
		},
		updateLegendPosition(layout) {
			const id = this.$props.grid_id;
			if (layout ? layout.grids[id] : null) {
				this.legendLayoutOverride = layout;
				this.rerender++;
			}
		},
		clearLayoutOverride() {
			this.legendLayoutOverride = null;
		},
		getGridHeightKey(common) {
			const grids = common?.layout?.grids;
			if (!grids) return "";
			return grids.map((g) => g?.height ?? 0).join(",");
		}
	},
	computed: {
		grid_props() {
			const id = this.$props.grid_id;
			const common = this.$props.common;
			const layout = common?.layout;
			let p = { ...common };
			const grid = layout?.grids?.[id];
			if (grid) {
				if (id > 0 && p.data) {
					let all = p.data;
					p.data = [p.data[id - 1]].filter(Boolean);
					p.data.push(...all.filter((x) => x.grid && x.grid.id === id));
				}
				p.width = grid.width;
				p.height = grid.height;
			}
			p.y_transform = p.y_ts?.[id];
			p.shaders = this.grid_shaders;
			return p;
		},
		sidebar_props() {
			const id = this.$props.grid_id;
			const common = this.$props.common;
			const layout = common?.layout;
			let p = { ...common };
			const grid = layout?.grids?.[id];
			if (grid) {
				p.width = grid.sb;
				p.height = grid.height;
			}
			p.y_transform = p.y_ts?.[id];
			p.shaders = this.sb_shaders;
			return p;
		},
		section_values() {
			const id = this.$props.grid_id;
			const common = this.$props.common;
			const layout = common?.layout;
			let p = { ...common };
			const grid = layout?.grids?.[id];
			if (grid) p.width = grid.width;
			return p.cursor?.values?.[id];
		},
		legend_props() {
			const id = this.$props.grid_id;
			const common = this.$props.common;
			common?.layout;
			let p = { ...common };
			if (id > 0 && p.data) {
				let all = p.data;
				p.offchart = all;
				p.data = [p.data[id - 1]].filter(Boolean);
				p.data.push(...all.filter((x) => x.grid && x.grid.id === id));
			}
			return p;
		},
		get_meta_props() {
			return this.meta_props;
		},
		grid_shaders() {
			return (this.shaders || []).filter((x) => x.target === "grid");
		},
		sb_shaders() {
			return (this.shaders || []).filter((x) => x.target === "sidebar");
		},
		layoutKey() {
			const layout = this.$props.common?.layout;
			if (!layout) return "";
			return `${layout.grids?.length ?? 0},${layout.grids?.map((g) => g?.height ?? 0).join(",") ?? ""}`;
		}
	},
	watch: {
		layoutKey(newKey, oldKey) {
			if (!newKey || newKey === oldKey) return;
			this.rerender++;
		},
		"common.data.length": function(newLen, oldLen) {
			if (newLen !== oldLen) this.rerender++;
		}
	},
	data() {
		return {
			meta_props: {},
			rerender: 0,
			legendLayoutOverride: null
		};
	}
};
var _hoisted_1$2 = { class: "trading-vue-section" };
function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_chart_legend = resolveComponent("chart-legend");
	const _component_grid = resolveComponent("grid");
	const _component_sidebar = resolveComponent("sidebar");
	return openBlock(), createElementBlock("div", _hoisted_1$2, [
		createVNode(_component_chart_legend, {
			ref: "legend",
			values: $options.section_values,
			grid_id: $props.grid_id,
			common: $options.legend_props,
			meta_props: $options.get_meta_props,
			layout_override: $data.legendLayoutOverride,
			onLegendButtonClick: $options.button_click,
			onLegendDblclick: $options.legend_dblclick,
			onOpenIndicatorSettings: $options.open_indicator_settings,
			onCloseIndicator: $options.close_indicator
		}, null, 8, [
			"values",
			"grid_id",
			"common",
			"meta_props",
			"layout_override",
			"onLegendButtonClick",
			"onLegendDblclick",
			"onOpenIndicatorSettings",
			"onCloseIndicator"
		]),
		createVNode(_component_grid, mergeProps($options.grid_props, {
			ref: "grid",
			grid_id: $props.grid_id,
			onRegisterKbListener: $options.register_kb,
			onRemoveKbListener: $options.remove_kb,
			onRangeChanged: $options.range_changed,
			onCursorChanged: $options.cursor_changed,
			onCursorLocked: $options.cursor_locked,
			onLayerMetaProps: $options.emit_meta_props,
			onCustomEvent: $options.emit_custom_event,
			onSidebarTransform: $options.sidebar_transform,
			onRezoomRange: $options.rezoom_range
		}), null, 16, [
			"grid_id",
			"onRegisterKbListener",
			"onRemoveKbListener",
			"onRangeChanged",
			"onCursorChanged",
			"onCursorLocked",
			"onLayerMetaProps",
			"onCustomEvent",
			"onSidebarTransform",
			"onRezoomRange"
		]),
		createVNode(_component_sidebar, mergeProps({ ref: "sb-" + $props.grid_id }, $options.sidebar_props, {
			grid_id: $props.grid_id,
			rerender: $data.rerender,
			onSidebarTransform: $options.sidebar_transform
		}), null, 16, [
			"grid_id",
			"rerender",
			"onSidebarTransform"
		])
	]);
}
var Section_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$10, [["render", _sfc_render$8]]);
//#endregion
//#region src/components/js/botbar.js
var { MINUTE15, MINUTE, HOUR: HOUR$1, DAY: DAY$1, WEEK: WEEK$1, MONTH: MONTH$1, YEAR: YEAR$1, MONTHMAP } = constants_default;
var measureTextCache = /* @__PURE__ */ new Map();
var MAX_CACHE_SIZE = 100;
var Botbar = class {
	constructor(canvas, comp, canvasDynamic = null) {
		this.canvas = canvas;
		this.canvasDynamic = canvasDynamic;
		this.ctx = canvas.getContext("2d");
		this.comp = comp;
		this.$p = comp.$props;
		this.data = this.$p.sub;
		this.range = this.$p.range;
		this.layout = this.$p.layout;
		const config = comp.$props.config || {};
		this.MIN_ZOOM = config.MIN_ZOOM || 25;
		this.MAX_ZOOM = config.MAX_ZOOM || 1e5;
		this._destroyed = false;
		this.listeners();
	}
	measureTextCached(text) {
		const key = `${this.ctx.font}|${text}`;
		if (measureTextCache.has(key)) return measureTextCache.get(key);
		if (measureTextCache.size >= MAX_CACHE_SIZE) {
			const firstKey = measureTextCache.keys().next().value;
			measureTextCache.delete(firstKey);
		}
		const result = this.ctx.measureText(text);
		measureTextCache.set(key, result.width);
		return result.width;
	}
	async listeners() {
		const { Hammer, Hamster } = await loadGestures();
		if (this._destroyed) return;
		let eventTarget = this.canvasDynamic || this.canvas;
		this.hm = Hamster(eventTarget);
		this._throttledWheel = utils_default.rafThrottle((delta, event) => {
			this.mousezoom(-delta * 50, event);
		});
		this.hm.wheel((event, delta) => this._throttledWheel(delta, event));
		let mc = this.mc = new Hammer.Manager(eventTarget);
		mc.add(new Hammer.Pan({
			direction: Hammer.DIRECTION_HORIZONTAL,
			threshold: 0
		}));
		mc.on("panstart", (event) => {
			this.drug = {
				x: event.center.x,
				r: this.range.slice()
			};
		});
		this._throttledPanmove = utils_default.rafThrottle((event) => {
			if (this.drug) this.pandrag(event);
		});
		mc.on("panmove", (event) => this._throttledPanmove(event));
		mc.on("panend", () => {
			this.drug = null;
		});
	}
	pandrag(event) {
		let width = this.layout.botbar.width;
		if (!width) return;
		if (!this.$p.interval) return;
		let r = this.drug.r;
		let span = r[1] - r[0];
		let k = (event.center.x - this.drug.x) / (width * .5);
		let factor = utils_default.clamp(1 + k, .1, 10);
		let anchorFrac = this.drug.x / width;
		let anchorT = r[0] + span * anchorFrac;
		let newSpan = span / factor;
		let newRange = [anchorT - newSpan * anchorFrac, anchorT + newSpan * (1 - anchorFrac)];
		let interval = this.$p.interval;
		let minSpan = this.MIN_ZOOM * interval;
		let maxSpan = this.MAX_ZOOM * interval;
		let resultSpan = newRange[1] - newRange[0];
		if (resultSpan < minSpan) newRange = [anchorT - minSpan * anchorFrac, anchorT + minSpan * (1 - anchorFrac)];
		else if (resultSpan > maxSpan) newRange = [anchorT - maxSpan * anchorFrac, anchorT + maxSpan * (1 - anchorFrac)];
		this.range[0] = newRange[0];
		this.range[1] = newRange[1];
		this.comp.$emit("botbar-zoom", this.range);
	}
	mousezoom(delta, event) {
		event.originalEvent.preventDefault();
		event.preventDefault();
		let dominated = this.data.length;
		if (delta < 0 && dominated <= this.MIN_ZOOM) return;
		if (delta > 0 && dominated > this.MAX_ZOOM) return;
		delta = utils_default.smart_wheel(delta);
		let k = this.$p.interval / 1e3;
		let diff = delta * k * dominated;
		this.range[0] -= diff * .5;
		this.range[1] += diff * .5;
		this.comp.$emit("botbar-zoom", this.range);
	}
	destroy() {
		this._destroyed = true;
		if (this.mc) this.mc.destroy();
		if (this.hm) this.hm.unwheel();
		if (this._throttledWheel) this._throttledWheel.cancel();
		if (this._throttledPanmove) this._throttledPanmove.cancel();
		this.canvasDynamic = null;
	}
	update() {
		this.grid_0 = this.layout.grids[0];
		const width = this.layout.botbar.width;
		const height = this.layout.botbar.height;
		const sb = this.layout.grids[0].sb;
		this.ctx.font = this.$p.font;
		this.ctx.clearRect(0, 0, width, height);
		this.ctx.strokeStyle = this.$p.colors.scale;
		this.ctx.beginPath();
		this.ctx.moveTo(0, .5);
		this.ctx.lineTo(Math.floor(width + 1), .5);
		this.ctx.stroke();
		this.ctx.fillStyle = this.$p.colors.text;
		this.ctx.beginPath();
		let dimmed = false;
		this.ctx.textAlign = "center";
		for (let p of this.layout.botbar.xs) {
			let lbl = this.format_date(p);
			if (p[0] > width - sb) continue;
			this.ctx.moveTo(p[0] - .5, 0);
			this.ctx.lineTo(p[0] - .5, 4.5);
			const shouldDim = !this.lbl_highlight(p);
			if (shouldDim !== dimmed) {
				this.ctx.globalAlpha = shouldDim ? .85 : 1;
				dimmed = shouldDim;
			}
			this.ctx.fillText(lbl, p[0], 18);
		}
		if (dimmed) this.ctx.globalAlpha = 1;
		this.ctx.stroke();
		this.apply_shaders();
		if (this.$p.cursor.x && this.$p.cursor.t !== void 0) this.panel();
	}
	apply_shaders() {
		let layout = this.grid_0;
		if (!layout) return;
		let props = {
			layout,
			cursor: this.$p.cursor
		};
		for (let s of this.comp.bot_shaders) {
			this.ctx.save();
			s.draw(this.ctx, props);
			this.ctx.restore();
		}
	}
	panel() {
		let lbl = this.format_cursor_x();
		this.ctx.fillStyle = this.$p.colors.panel;
		let panwidth = Math.floor(this.measureTextCached(lbl + "    "));
		let cursor = this.$p.cursor.x;
		let x = Math.floor(cursor - panwidth * .5);
		let y = -.5;
		let panheight = this.$p.config?.PANHEIGHT || 22;
		this.ctx.fillRect(x, y, panwidth, panheight + .5);
		this.ctx.fillStyle = this.$p.colors.textHL;
		this.ctx.textAlign = "center";
		this.ctx.fillText(lbl, cursor, 15.5);
	}
	format_date(p) {
		let t = p[1][0];
		const ti_map = this.grid_0.ti_map;
		t = ti_map.i2t(t);
		let k = ti_map.tf < DAY$1 ? 1 : 0;
		let tZ = t + k * this.$p.timezone * HOUR$1;
		let d = utils_default.getCachedDate(tZ);
		if (p[2] === YEAR$1 || utils_default.year_start(tZ) === tZ) return d.getUTCFullYear();
		if (p[2] === MONTH$1 || utils_default.month_start(tZ) === tZ) return MONTHMAP[d.getUTCMonth()];
		if (utils_default.day_start(tZ) === tZ) return d.getUTCDate();
		let h = utils_default.add_zero(d.getUTCHours());
		let m = utils_default.add_zero(d.getUTCMinutes());
		return h + ":" + m;
	}
	format_cursor_x() {
		let t = this.$p.cursor.t;
		const ti_map = this.grid_0.ti_map;
		t = ti_map.i2t(t);
		let ti = ti_map.tf;
		let k = ti < DAY$1 ? 1 : 0;
		let d = utils_default.getCachedDate(t + k * this.$p.timezone * HOUR$1);
		if (ti === YEAR$1) return d.getUTCFullYear();
		let yr, mo, dd;
		if (ti < YEAR$1) {
			yr = "`" + `${d.getUTCFullYear()}`.slice(-2);
			mo = MONTHMAP[d.getUTCMonth()];
			dd = "01";
		}
		if (ti <= WEEK$1) dd = d.getUTCDate();
		let date = `${dd} ${mo} ${yr}`;
		let time = "";
		if (ti < DAY$1) {
			let h = utils_default.add_zero(d.getUTCHours());
			let m = utils_default.add_zero(d.getUTCMinutes());
			time = h + ":" + m;
		}
		return `${date}  ${time}`;
	}
	lbl_highlight(p) {
		let ti = this.$p.interval;
		const ti_map = this.grid_0.ti_map;
		let tZ = ti_map.i2t(p[1][0]) + (ti_map.tf < DAY$1 ? 1 : 0) * this.$p.timezone * HOUR$1;
		if (tZ === 0) return true;
		if (utils_default.month_start(tZ) === tZ) return true;
		if (utils_default.day_start(tZ) === tZ) return true;
		if (ti <= MINUTE15 && tZ % HOUR$1 === 0) return true;
		return false;
	}
	mousemove() {}
	mouseout() {}
	mouseup() {}
	mousedown() {}
};
//#endregion
//#region src/components/Botbar.vue
var _sfc_main$9 = {
	name: "Botbar",
	props: [
		"sub",
		"layout",
		"range",
		"interval",
		"cursor",
		"colors",
		"font",
		"width",
		"height",
		"rerender",
		"tv_id",
		"config",
		"shaders",
		"timezone"
	],
	mixins: [canvas_default],
	mounted() {
		const el = this.$refs["canvas"];
		if (!el) return;
		const dynEl = this.$refs["canvasDynamic"];
		this.renderer = new Botbar(el, this, dynEl);
		this.setup();
		this.redraw();
	},
	data() {
		return {
			layoutOverride: null,
			renderKey: 0
		};
	},
	beforeUnmount() {
		if (this.renderer) this.renderer.destroy();
	},
	render() {
		const sett = this.$props.layout?.botbar;
		if (!sett) return h("div", { class: "trading-vue-botbar-loading" });
		return this.create_canvas(h, "botbar", {
			position: {
				x: 0,
				y: sett.offset || 0
			},
			attrs: {
				rerender: this.$props.rerender,
				width: sett.width,
				height: sett.height
			},
			style: { backgroundColor: this.$props.colors?.back }
		});
	},
	computed: {
		bot_shaders() {
			return (this.$props.shaders || []).filter((x) => x.target === "botbar");
		},
		rangeKey() {
			const r = this.$props.range;
			if (!r || r.length < 2) return "";
			return `${r[0]},${r[1]}`;
		},
		layoutKey() {
			const botbar = this.$props.layout?.botbar;
			if (!botbar) return "";
			return `${botbar.width},${botbar.height},${botbar.offset}`;
		}
	},
	watch: {
		layoutKey: {
			handler(newKey, oldKey) {
				const botbar = this.$props.layout?.botbar;
				if (!this.renderer && botbar) nextTick(() => {
					if (this.renderer) return;
					const el = this.$refs["canvas"];
					if (!el) return;
					const dynEl = this.$refs["canvasDynamic"];
					this.renderer = new Botbar(el, this, dynEl);
					this.setup();
					this.redraw();
				});
			},
			immediate: false
		},
		rangeKey(newKey, oldKey) {
			if (!newKey || newKey === oldKey) return;
			this.redraw();
		},
		"cursor.t": function(newT) {
			if (this._cursorRafPending) return;
			this._cursorRafPending = true;
			requestAnimationFrame(() => {
				this._cursorRafPending = false;
				this.redraw();
			});
		},
		rerender() {
			nextTick(() => this.redraw());
		},
		renderKey() {
			nextTick(() => this.redraw());
		}
	}
};
//#endregion
//#region src/components/Keyboard.vue
var _sfc_main$8 = {
	name: "Keyboard",
	created: function() {
		window.addEventListener("keydown", this.keydown);
		window.addEventListener("keyup", this.keyup);
		window.addEventListener("keypress", this.keypress);
		this._listeners = /* @__PURE__ */ new Map();
	},
	beforeUnmount: function() {
		window.removeEventListener("keydown", this.keydown);
		window.removeEventListener("keyup", this.keyup);
		window.removeEventListener("keypress", this.keypress);
		this._listeners.clear();
	},
	render() {
		return h("span");
	},
	methods: {
		keydown(event) {
			for (const [id, l] of this._listeners) if (l && l.keydown) l.keydown(event);
		},
		keyup(event) {
			for (const [id, l] of this._listeners) if (l && l.keyup) l.keyup(event);
		},
		keypress(event) {
			for (const [id, l] of this._listeners) if (l && l.keypress) l.keypress(event);
		},
		register(listener) {
			this._listeners.set(listener.id, listener);
		},
		remove(listener) {
			this._listeners.delete(listener.id);
		}
	}
};
//#endregion
//#region src/components/GridResizer.vue
var _sfc_main$7 = {
	name: "GridResizer",
	props: [
		"grid_id",
		"layout",
		"colors"
	],
	mounted() {
		this._rafId = null;
		this._lastEvent = null;
	},
	data() {
		return {
			dragging: false,
			startY: 0,
			startHeights: []
		};
	},
	computed: {
		resizerStyle() {
			const grid = this.layout.grids[this.grid_id];
			if (!grid) return {};
			return {
				top: grid.offset - 6 + "px",
				left: "0px",
				width: grid.width + "px"
			};
		},
		lineStyle() {
			return { background: this.colors?.scale || "#555" };
		}
	},
	methods: {
		onMouseDown(e) {
			e.preventDefault();
			e.stopPropagation();
			this.dragging = true;
			this.startY = e.clientY;
			const grids = this.layout.grids;
			this.startHeights = grids.map((g) => g.height);
			document.addEventListener("mousemove", this.onMouseMove);
			document.addEventListener("mouseup", this.onMouseUp, { passive: true });
			document.body.style.cursor = "row-resize";
			document.body.style.userSelect = "none";
		},
		onMouseMove(e) {
			if (!this.dragging) return;
			this._lastEvent = e;
			if (this._rafId !== null) return;
			this._rafId = requestAnimationFrame(() => {
				this._rafId = null;
				if (!this._lastEvent || !this.dragging) return;
				const deltaY = this._lastEvent.clientY - this.startY;
				const gridAbove = this.grid_id - 1;
				const gridBelow = this.grid_id;
				const minHeight = 28;
				let newHeightAbove = this.startHeights[gridAbove] + deltaY;
				let newHeightBelow = this.startHeights[gridBelow] - deltaY;
				if (newHeightAbove < minHeight) {
					newHeightBelow = this.startHeights[gridBelow] + (this.startHeights[gridAbove] - minHeight);
					newHeightAbove = minHeight;
				}
				if (newHeightBelow < minHeight) {
					newHeightAbove = this.startHeights[gridAbove] + (this.startHeights[gridBelow] - minHeight);
					newHeightBelow = minHeight;
				}
				this.$emit("resize-grids", {
					gridAbove,
					gridBelow,
					heightAbove: newHeightAbove,
					heightBelow: newHeightBelow
				});
			});
		},
		onMouseUp() {
			this.dragging = false;
			document.removeEventListener("mousemove", this.onMouseMove);
			document.removeEventListener("mouseup", this.onMouseUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			this.$emit("resize-complete");
		},
		onDoubleClick(e) {
			e.preventDefault();
			e.stopPropagation();
			this.$emit("toggle-minimize", this.grid_id);
		}
	},
	beforeUnmount() {
		document.removeEventListener("mousemove", this.onMouseMove);
		document.removeEventListener("mouseup", this.onMouseUp);
		if (this._rafId !== null) {
			cancelAnimationFrame(this._rafId);
			this._rafId = null;
		}
	}
};
function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", {
		class: normalizeClass(["grid-resizer", { dragging: $data.dragging }]),
		style: normalizeStyle($options.resizerStyle),
		onMousedown: _cache[0] || (_cache[0] = (...args) => $options.onMouseDown && $options.onMouseDown(...args)),
		onDblclick: _cache[1] || (_cache[1] = (...args) => $options.onDoubleClick && $options.onDoubleClick(...args))
	}, [createElementVNode("div", {
		class: "resizer-line",
		style: normalizeStyle($options.lineStyle)
	}, null, 4), _cache[2] || (_cache[2] = createElementVNode("div", { class: "resizer-hitbox" }, null, -1))], 38);
}
var GridResizer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$7, [["render", _sfc_render$7]]);
//#endregion
//#region src/mixins/datatrack.js
var datatrack_default = {
	methods: {
		data_changed() {
			let n = this.ohlcv;
			let changed = false;
			if (this._data_n0 !== n[0] && this._data_len !== n.length) changed = true;
			this.check_all_data(changed);
			if (this.ti_map.ib) this.reindex_delta(n[0], this._data_n0);
			this._data_n0 = n[0];
			this._data_len = n.length;
			this.save_data_t();
			return changed;
		},
		check_all_data(changed) {
			let len = this._data_len || 0;
			if (Math.abs(this.ohlcv.length - len) > 1 || this._data_n0 !== this.ohlcv[0]) this.$emit("custom-event", {
				event: "data-len-changed",
				args: []
			});
		},
		reindex_delta(n, p) {
			n = n || [0];
			p = p || [0];
			if (n[0] - p[0] !== 0 && this._data_t) try {
				let nt = this._data_t + .01;
				let res = utils_default.fast_nearest(this.ohlcv, nt);
				let off = (nt - this.ohlcv[res[0]][0]) / this.interval_ms;
				this.goto(res[0] + off);
			} catch (e) {
				this.goto(this.ti_map.t2i(this._data_t));
			}
		},
		save_data_t() {
			this._data_t = this.ti_map.i2t(this.range[1]);
		}
	},
	data() {
		return {
			_data_n0: null,
			_data_len: 0,
			_data_t: 0
		};
	}
};
//#endregion
//#region src/components/js/layout_fn.js
function layout_fn_default(self, range) {
	const ib = self.ti_map.ib;
	const dt = range[1] - range[0];
	const r = self.spacex / dt;
	const ls = self.grid.logScale || false;
	const t2screenCache = /* @__PURE__ */ new Map();
	const $2screenCache = /* @__PURE__ */ new Map();
	const screen2$Cache = /* @__PURE__ */ new Map();
	const MAX_CACHE_SIZE = 2e3;
	let magnetCn = null;
	let magnetTs = null;
	const magnet_ts = (cn) => {
		if (cn !== magnetCn) {
			magnetCn = cn;
			magnetTs = cn.map((x) => x.raw[0]);
		}
		return magnetTs;
	};
	Object.assign(self, {
		t2screen: (t) => {
			let cached = t2screenCache.get(t);
			if (cached !== void 0) return cached;
			let tVal = t;
			if (ib) tVal = self.ti_map.smth2i(t);
			const result = Math.floor((tVal - range[0]) * r) - .5;
			if (t2screenCache.size < MAX_CACHE_SIZE) t2screenCache.set(t, result);
			return result;
		},
		$2screen: (y) => {
			let cached = $2screenCache.get(y);
			if (cached !== void 0) return cached;
			let yVal = y;
			if (ls) yVal = math_default.log(y);
			const result = Math.floor(yVal * self.A + self.B) - .5;
			if ($2screenCache.size < MAX_CACHE_SIZE) $2screenCache.set(y, result);
			return result;
		},
		t_magnet: (t) => {
			if (ib) t = self.ti_map.smth2i(t);
			const cn = self.candles || self.master_grid.candles;
			const arr = magnet_ts(cn);
			const i = utils_default.nearest_a(t, arr)[0];
			if (!cn[i]) return;
			return Math.floor(cn[i].x) - .5;
		},
		screen2$: (y) => {
			let cached = screen2$Cache.get(y);
			if (cached !== void 0) return cached;
			let result;
			if (ls) result = math_default.exp((y - self.B) / self.A);
			else result = (y - self.B) / self.A;
			if (screen2$Cache.size < MAX_CACHE_SIZE) screen2$Cache.set(y, result);
			return result;
		},
		screen2t: (x) => {
			return range[0] + x / r;
		},
		$_magnet: (price) => {},
		c_magnet: (t) => {
			const cn = self.candles || self.master_grid.candles;
			const arr = magnet_ts(cn);
			return cn[utils_default.nearest_a(t, arr)[0]];
		},
		c_magnet_i: (t) => {
			const arr = magnet_ts(self.candles || self.master_grid.candles);
			return utils_default.nearest_a(t, arr)[0];
		},
		data_magnet: (t) => {},
		clearCoordCaches: () => {
			t2screenCache.clear();
			$2screenCache.clear();
			screen2$Cache.clear();
		}
	});
	return self;
}
//#endregion
//#region src/components/js/log_scale.js
var log_scale_default = {
	candle(self, mid, p, $p) {
		return {
			x: mid,
			w: self.px_step * $p.config.CANDLEW,
			o: Math.floor(math_default.log(p[1]) * self.A + self.B),
			h: Math.floor(math_default.log(p[2]) * self.A + self.B),
			l: Math.floor(math_default.log(p[3]) * self.A + self.B),
			c: Math.floor(math_default.log(p[4]) * self.A + self.B),
			raw: p
		};
	},
	expand(self, height) {
		if (math_default.log(self.$_hi) === math_default.log(self.$_lo)) {
			self.$_hi *= 1.05;
			self.$_lo *= .95;
			return;
		}
		let A = -height / (math_default.log(self.$_hi) - math_default.log(self.$_lo));
		let B = -math_default.log(self.$_hi) * A;
		let top = -height * .1;
		let bot = height * 1.1;
		self.$_hi = math_default.exp((top - B) / A);
		self.$_lo = math_default.exp((bot - B) / A);
	}
};
//#endregion
//#region src/components/js/grid_maker.js
var { TIMESCALES, $SCALES, WEEK, MONTH, YEAR, HOUR, DAY } = constants_default;
var MAX_INT = Number.MAX_SAFE_INTEGER;
function getExponent(value) {
	if (value === 0) return 0;
	return Math.floor(Math.log10(Math.abs(value)));
}
function GridMaker(id, params, master_grid = null) {
	let { sub, interval, range, ctx, $p, layers_meta, height, y_t, ti_map, grid, timezone } = params;
	let self = { ti_map };
	let lm = layers_meta[id];
	let y_range_fn = null;
	let ls = grid.logScale;
	if (lm && Object.keys(lm).length) {
		let yrs = Object.values(lm).filter((x) => x.y_range);
		if (yrs.length) y_range_fn = yrs[0].y_range;
	}
	function calc_$range() {
		let hi, lo, exp;
		if (!master_grid) if (y_range_fn) [hi, lo] = y_range_fn(hi, lo);
		else {
			hi = -Infinity, lo = Infinity;
			for (let i = 0, n = sub.length; i < n; i++) {
				let x = sub[i];
				if (x[2] > hi) hi = x[2];
				if (x[3] < lo) lo = x[3];
			}
		}
		else {
			hi = -Infinity, lo = Infinity;
			for (let i = 0; i < sub.length; i++) for (let j = 1; j < sub[i].length; j++) {
				let v = sub[i][j];
				if (v > hi) hi = v;
				if (v < lo) lo = v;
			}
			if (y_range_fn) [hi, lo, exp] = y_range_fn(hi, lo);
		}
		if (y_t && !y_t.auto && y_t.range) {
			self.$_hi = y_t.range[0];
			self.$_lo = y_t.range[1];
		} else {
			if (!ls) {
				exp = exp === false ? 0 : 1;
				self.$_hi = hi + (hi - lo) * $p.config.EXPAND * exp;
				self.$_lo = lo - (hi - lo) * $p.config.EXPAND * exp;
			} else {
				self.$_hi = hi;
				self.$_lo = lo;
				log_scale_default.expand(self, height);
			}
			if (self.$_hi === self.$_lo) {
				if (self.$_hi === 0 && self.$_lo === 0) {
					self.$_hi = 1;
					self.$_lo = -1;
				}
				if (!ls) {
					self.$_hi *= 1.05;
					self.$_lo *= .95;
				} else log_scale_default.expand(self, height);
			}
		}
	}
	function calc_sidebar() {
		if (sub.length < 2) {
			self.prec = 0;
			self.sb = $p.config.SBMIN;
			return;
		}
		self.prec = calc_precision(sub);
		let lens = [];
		lens.push(self.$_hi.toFixed(self.prec).length);
		lens.push(self.$_lo.toFixed(self.prec).length);
		let str = "0".repeat(utils_default.maxInArray(lens)) + "    ";
		self.sb = ctx.measureText(str).width;
		self.sb = Math.max(Math.floor(self.sb), $p.config.SBMIN);
		self.sb = Math.min(self.sb, $p.config.SBMAX);
	}
	function calc_precision(data) {
		let max_r = 0, max_l = 0;
		let min = Infinity;
		let max = -Infinity;
		for (let i = 0, n = data.length; i < n; i++) {
			let x = data[i];
			if (x[1] > max) max = x[1];
			else if (x[1] < min) min = x[1];
		}
		[min, max].forEach((x) => {
			let str = x != null ? x.toString() : "";
			let l, r;
			if (x < 1e-6) {
				let [ls, rs] = str.split("e-");
				[l, r] = ls.split(".");
				if (!r) r = "";
				r = { length: r.length + parseInt(rs) || 0 };
			} else [l, r] = str.split(".");
			if (r && r.length > max_r) max_r = r.length;
			if (l && l.length > max_l) max_l = l.length;
		});
		let even = max_r - max_r % 2 + 2;
		if (max_l === 1) return Math.min(8, Math.max(2, even));
		if (max_l <= 2) return Math.min(4, Math.max(2, even));
		return 2;
	}
	function calc_positions() {
		if (sub.length < 2) return;
		let dt = range[1] - range[0];
		self.spacex = $p.width - self.sb;
		let capacity = dt / interval;
		self.px_step = self.spacex / capacity;
		let r = self.spacex / dt;
		self.startx = (sub[0][0] - range[0]) * r;
		if (!grid.logScale) {
			self.A = -height / (self.$_hi - self.$_lo);
			self.B = -self.$_hi * self.A;
		} else {
			self.A = -height / (math_default.log(self.$_hi) - math_default.log(self.$_lo));
			self.B = -math_default.log(self.$_hi) * self.A;
		}
	}
	function time_step() {
		let k = ti_map.ib ? 6e4 : 1;
		let m = (range[1] - range[0]) * k * ($p.config.GRIDX / $p.width);
		let s = TIMESCALES;
		return utils_default.nearest_a(m, s)[1] / k;
	}
	function dollar_step() {
		let yrange = self.$_hi - self.$_lo;
		let m = yrange * ($p.config.GRIDY / height);
		let p = getExponent(yrange);
		let d = Math.pow(10, p);
		let s = $SCALES.map((x) => x * d);
		return utils_default.strip(utils_default.nearest_a(m, s)[1]);
	}
	function dollar_mult() {
		let mult_hi = dollar_mult_hi();
		let mult_lo = dollar_mult_lo();
		return Math.max(mult_hi, mult_lo);
	}
	function dollar_mult_hi() {
		let h = Math.min(self.B, height);
		if (h < $p.config.GRIDY) return 1;
		let n = h / $p.config.GRIDY;
		let yrange = self.$_hi;
		let yratio;
		if (self.$_lo > 0) yratio = self.$_hi / self.$_lo;
		else yratio = self.$_hi / 1;
		yrange * ($p.config.GRIDY / h);
		return Math.pow(yratio, 1 / n);
	}
	function dollar_mult_lo() {
		let h = Math.min(height - self.B, height);
		if (h < $p.config.GRIDY) return 1;
		let n = h / $p.config.GRIDY;
		let yrange = Math.abs(self.$_lo);
		let yratio;
		if (self.$_hi < 0 && self.$_lo < 0) yratio = Math.abs(self.$_lo / self.$_hi);
		else yratio = Math.abs(self.$_lo) / 1;
		yrange * ($p.config.GRIDY / h);
		return Math.pow(yratio, 1 / n);
	}
	function grid_x() {
		if (!master_grid) {
			self.t_step = time_step();
			self.xs = [];
			const dt = range[1] - range[0];
			const r = self.spacex / dt;
			for (let i = 0; i < sub.length; i++) {
				let p = sub[i];
				let prev = sub[i - 1] || [];
				let prev_xs = self.xs[self.xs.length - 1] || [0, []];
				insert_line(prev, p, Math.floor((p[0] - range[0]) * r));
				let xs = self.xs[self.xs.length - 1] || [0, []];
				if (prev_xs === xs) continue;
				if (xs[1][0] - prev_xs[1][0] < self.t_step * .8) if (xs[2] <= prev_xs[2]) self.xs.pop();
				else self.xs.splice(self.xs.length - 2, 1);
			}
			if (interval < WEEK && r > 0) {
				extend_left(dt, r);
				extend_right(dt, r);
			}
		} else {
			self.t_step = master_grid.t_step;
			self.px_step = master_grid.px_step;
			self.startx = master_grid.startx;
			self.xs = master_grid.xs;
		}
	}
	function insert_line(prev, p, x, m0) {
		let prev_t = ti_map.ib ? ti_map.i2t(prev[0]) : prev[0];
		let p_t = ti_map.ib ? ti_map.i2t(p[0]) : p[0];
		if (ti_map.tf < DAY) {
			prev_t += timezone * HOUR;
			p_t += timezone * HOUR;
		}
		timezone * HOUR;
		if ((prev[0] || interval === YEAR) && utils_default.get_year(p_t) !== utils_default.get_year(prev_t)) self.xs.push([
			x,
			p,
			YEAR
		]);
		else if (prev[0] && utils_default.get_month(p_t) !== utils_default.get_month(prev_t)) self.xs.push([
			x,
			p,
			MONTH
		]);
		else if (utils_default.day_start(p_t) === p_t) self.xs.push([
			x,
			p,
			DAY
		]);
		else if (p[0] % self.t_step === 0) self.xs.push([
			x,
			p,
			interval
		]);
	}
	function extend_left(dt, r) {
		if (!self.xs.length || !isFinite(r)) return;
		let t = self.xs[0][1][0];
		while (true) {
			t -= self.t_step;
			let x = Math.floor((t - range[0]) * r);
			if (x < 0) break;
			if (t % interval === 0) self.xs.unshift([
				x,
				[t],
				interval
			]);
		}
	}
	function extend_right(dt, r) {
		if (!self.xs.length || !isFinite(r)) return;
		let t = self.xs[self.xs.length - 1][1][0];
		while (true) {
			t += self.t_step;
			let x = Math.floor((t - range[0]) * r);
			if (x > self.spacex) break;
			if (t % interval === 0) self.xs.push([
				x,
				[t],
				interval
			]);
		}
	}
	function grid_y() {
		let m = Math.pow(10, -self.prec);
		self.$_step = Math.max(m, dollar_step());
		self.ys = [];
		let y1 = self.$_lo - self.$_lo % self.$_step;
		for (let y$ = y1; y$ <= self.$_hi; y$ += self.$_step) {
			let y = Math.floor(y$ * self.A + self.B);
			if (y > height) continue;
			self.ys.push([y, utils_default.strip(y$)]);
		}
	}
	function grid_y_log() {
		self.$_mult = dollar_mult();
		self.ys = [];
		if (!sub.length) return;
		let v = Math.abs(sub[sub.length - 1][1] || 1);
		let y1 = search_start_pos(v);
		let y2 = search_start_neg(-v);
		let yp = -Infinity;
		let n = height / $p.config.GRIDY;
		let q = 1 + (self.$_mult - 1) / 2;
		for (let y$ = y1; y$ > 0; y$ /= self.$_mult) {
			y$ = log_rounder(y$, q);
			let y = Math.floor(math_default.log(y$) * self.A + self.B);
			self.ys.push([y, utils_default.strip(y$)]);
			if (y > height) break;
			if (y - yp < $p.config.GRIDY * .7) break;
			if (self.ys.length > n + 1) break;
			yp = y;
		}
		yp = Infinity;
		for (let y$ = y2; y$ < 0; y$ /= self.$_mult) {
			y$ = log_rounder(y$, q);
			let y = Math.floor(math_default.log(y$) * self.A + self.B);
			if (yp - y < $p.config.GRIDY * .7) break;
			self.ys.push([y, utils_default.strip(y$)]);
			if (y < 0) break;
			if (self.ys.length > n * 3 + 1) break;
			yp = y;
		}
	}
	function search_start_pos(value) {
		let N = height / $p.config.GRIDY;
		let y = Infinity, y$ = value, count = 0;
		while (y > 0) {
			y = Math.floor(math_default.log(y$) * self.A + self.B);
			y$ *= self.$_mult;
			if (count++ > N * 3) return 0;
		}
		return y$;
	}
	function search_start_neg(value) {
		let N = height / $p.config.GRIDY;
		let y = -Infinity, y$ = value, count = 0;
		while (y < height) {
			y = Math.floor(math_default.log(y$) * self.A + self.B);
			y$ *= self.$_mult;
			if (count++ > N * 3) break;
		}
		return y$;
	}
	function log_rounder(x, quality) {
		let s = Math.sign(x);
		x = Math.abs(x);
		if (x > 10) {
			let div;
			for (div = 10; div < MAX_INT; div *= 10) {
				let nice = Math.floor(x / div) * div;
				if (x / nice > quality) break;
			}
			div /= 10;
			return s * Math.floor(x / div) * div;
		} else if (x < 1) {
			let ro;
			for (ro = 10; ro >= 1; ro--) {
				let nice = utils_default.round(x, ro);
				if (x / nice > quality) break;
			}
			return s * utils_default.round(x, ro + 1);
		} else return s * Math.floor(x);
	}
	function apply_sizes() {
		self.width = $p.width - self.sb;
		self.height = height;
	}
	calc_$range();
	calc_sidebar();
	return {
		create: () => {
			calc_positions();
			grid_x();
			if (grid.logScale) grid_y_log();
			else grid_y();
			apply_sizes();
			if (master_grid) self.master_grid = master_grid;
			self.grid = grid;
			return layout_fn_default(self, range);
		},
		get_layout: () => self,
		set_sidebar: (v) => self.sb = v,
		get_sidebar: () => self.sb
	};
}
//#endregion
//#region src/components/js/layout.js
var layoutCache = {
	key: "",
	candles: null,
	volume: null
};
function hasAnyProperty(obj) {
	for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) return true;
	return false;
}
function Layout(params) {
	let { chart, sub, offsub, interval, range, ctx, layers_meta, ti_map, $props: $p, y_transforms: y_ts, customGridHeights, minimizedGrids } = params;
	const rangeValues = Array.isArray(range) ? [...range] : [range?.[0], range?.[1]];
	if (rangeValues[0] !== void 0 && rangeValues[1] !== void 0) range = rangeValues;
	let mgrid = chart.grid || {};
	offsub = offsub.filter((x, i) => {
		return !(x.grid && x.grid.id);
	});
	const MINIMIZED_HEIGHT = 28;
	function grid_hs() {
		const height = $p.height - $p.config.BOTBAR;
		const hasCustomHeights = customGridHeights && hasAnyProperty(customGridHeights);
		const hasMinimizedGrids = minimizedGrids && hasAnyProperty(minimizedGrids);
		if (hasCustomHeights || hasMinimizedGrids) return custom_hs(height);
		if (mgrid.height || offsub.find((x) => x.grid.height)) return weighted_hs(mgrid, height);
		const n = offsub.length;
		const off_h = 2 * Math.sqrt(n) / 7 / (n || 1);
		const px = Math.floor(height * off_h);
		return [height - px * n].concat(Array(n).fill(px));
	}
	function custom_hs(height) {
		const n = offsub.length + 1;
		let hs = [];
		let minimized = minimizedGrids || {};
		for (let i = 0; i < n; i++) if (minimized[i]) hs.push(MINIMIZED_HEIGHT);
		else if (customGridHeights && customGridHeights[i] !== void 0) hs.push(customGridHeights[i]);
		else hs.push(null);
		let usedHeight = 0;
		let nullCount = 0;
		for (let i = 0; i < hs.length; i++) if (hs[i] !== null) usedHeight += hs[i];
		else nullCount++;
		if (nullCount > 0) {
			let remainingHeight = height - usedHeight;
			let defaultHeight = Math.floor(remainingHeight / nullCount);
			for (let i = 0; i < hs.length; i++) if (hs[i] === null) hs[i] = defaultHeight;
		}
		let total = 0;
		for (let i = 0; i < hs.length; i++) total += hs[i];
		if (total !== height && hs.length > 0) hs[0] += height - total;
		return hs;
	}
	function weighted_hs(grid, height) {
		const sources = [{ grid }, ...offsub];
		const hs = new Array(sources.length);
		let sum = 0;
		for (let i = 0; i < sources.length; i++) {
			hs[i] = sources[i].grid.height || 1;
			sum += hs[i];
		}
		let newSum = 0;
		for (let i = 0; i < hs.length; i++) {
			hs[i] = Math.floor(hs[i] / sum * height);
			newSum += hs[i];
		}
		for (let i = 0; i < height - newSum; i++) hs[i % hs.length]++;
		return hs;
	}
	function candles_n_vol() {
		self.candles = [];
		self.volume = [];
		if (!sub.length || self.A === void 0 || self.B === void 0 || self.px_step === void 0) return;
		const cacheKey = `${range[0]},${range[1]},${sub.length},${interval},${$p.height},${self.A.toFixed(6)},${self.B.toFixed(6)},${self.px_step.toFixed(4)}`;
		if (layoutCache.key === cacheKey && layoutCache.candles && layoutCache.volume) {
			self.candles = layoutCache.candles;
			self.volume = layoutCache.volume;
			return;
		}
		let maxv = utils_default.maxAtIndex(sub, 5);
		let vs = maxv > 0 ? $p.config.VOLSCALE * $p.height / maxv : 0;
		let x1, x2, mid, prev = void 0;
		let splitter = self.px_step > 5 ? 1 : 0;
		let hf_px_step = self.px_step * .5;
		const candleW = self.px_step * $p.config.CANDLEW;
		const A = self.A;
		const B = self.B;
		for (let i = 0; i < sub.length; i++) {
			let p = sub[i];
			mid = self.t2screen(p[0]) + .5;
			self.candles.push(mgrid.logScale ? log_scale_default.candle(self, mid, p, $p) : {
				x: mid,
				w: candleW,
				o: Math.floor(p[1] * A + B),
				h: Math.floor(p[2] * A + B),
				l: Math.floor(p[3] * A + B),
				c: Math.floor(p[4] * A + B),
				z: p[6],
				raw: p
			});
			if (sub[i - 1] && p[0] - sub[i - 1][0] > interval) prev = null;
			x1 = prev || Math.floor(mid - hf_px_step);
			x2 = Math.floor(mid + hf_px_step) - .5;
			self.volume.push({
				x1,
				x2,
				h: p[5] * vs,
				green: p[4] >= p[1],
				z: p[6],
				raw: p
			});
			prev = x2 + splitter;
		}
		layoutCache.key = cacheKey;
		layoutCache.candles = self.candles;
		layoutCache.volume = self.volume;
	}
	const hs = grid_hs();
	let specs = {
		sub,
		interval,
		range,
		ctx,
		$p,
		layers_meta,
		ti_map,
		height: hs[0],
		y_t: y_ts[0],
		grid: mgrid,
		timezone: $p.timezone
	};
	let gms = [new GridMaker(0, specs)];
	for (let [i, { data, grid }] of offsub.entries()) {
		specs.sub = data;
		specs.height = hs[i + 1];
		specs.y_t = y_ts[i + 1];
		specs.grid = grid || {};
		gms.push(new GridMaker(i + 1, specs, gms[0].get_layout()));
	}
	let sb = utils_default.maxInArray(gms.map((x) => x.get_sidebar()));
	let grids = [], offset = 0;
	for (let i = 0; i < gms.length; i++) {
		gms[i].set_sidebar(sb);
		grids.push(gms[i].create());
		grids[i].id = i;
		grids[i].offset = offset;
		offset += grids[i].height;
	}
	let self = grids[0];
	candles_n_vol();
	return {
		grids,
		botbar: {
			width: $p.width,
			height: $p.config.BOTBAR,
			offset,
			xs: grids[0] ? grids[0].xs : []
		}
	};
}
//#endregion
//#region src/components/js/ti_mapping.js
var MAX_ARR = Math.pow(2, 32);
var TI = class {
	constructor() {
		this.ib = false;
	}
	init(params, res) {
		let { sub, interval, meta, $props: $p, interval_ms, sub_start, ib } = params;
		this.ti_map = [];
		this.it_map = [];
		this.sub_i = [];
		this.ib = ib;
		this.sub = res;
		this.ss = sub_start;
		this.tf = interval_ms;
		meta.sub_start;
		if (this.ib) this.map_sub(res);
	}
	map_sub(res) {
		for (var i = 0; i < res.length; i++) {
			let t = res[i][0];
			let _i = this.ss + i;
			this.ti_map[t] = _i;
			this.it_map[_i] = t;
			let copy = res[i].slice();
			copy[0] = _i;
			this.sub_i.push(copy);
		}
	}
	parse(data, mode) {
		if (!this.ib || !this.sub[0] || mode === "data") return data;
		let res = [];
		let k = 0;
		if (mode === "calc") {
			let shift = utils_default.index_shift(this.sub, data);
			for (var i = 0; i < data.length; i++) {
				let _i = this.ss + i;
				let copy = data[i].slice();
				copy[0] = _i + shift;
				res.push(copy);
			}
			return res;
		}
		if (data.length) try {
			let k1 = utils_default.fast_nearest(this.sub, data[0][0])[0];
			if (k1 !== null && k1 >= 0) k = k1;
		} catch (e) {}
		let t0 = this.sub[0][0];
		let tN = this.sub[this.sub.length - 1][0];
		for (var i = 0; i < data.length; i++) {
			let copy = data[i].slice();
			let tk = this.sub[k][0];
			let t = data[i][0];
			let index = this.ti_map[t];
			if (index === void 0) if (t < t0 || t > tN) {
				index = this.ss + k - (tk - t) / this.tf;
				t = data[i + 1] ? data[i + 1][0] : void 0;
			} else {
				let tk2 = this.sub[k + 1][0];
				index = tk === tk2 ? this.ss + k : this.ss + k + (t - tk) / (tk2 - tk);
				t = data[i + 1] ? data[i + 1][0] : void 0;
			}
			while (k + 1 < this.sub.length - 1 && t > this.sub[k + 1][0]) {
				k++;
				tk = this.sub[k][0];
			}
			copy[0] = index;
			res.push(copy);
		}
		return res;
	}
	i2t(i) {
		if (!this.ib || !this.sub.length) return i;
		let res = this.it_map[i];
		if (res !== void 0) return res;
		else if (i >= this.ss + this.sub_i.length) {
			let di = i - (this.ss + this.sub_i.length) + 1;
			return this.sub[this.sub.length - 1][0] + di * this.tf;
		} else if (i < this.ss) {
			let di = i - this.ss;
			return this.sub[0][0] + di * this.tf;
		}
		let i1 = Math.floor(i) - this.ss;
		let i2 = i1 + 1;
		let len = this.sub.length;
		if (i2 >= len) i2 = len - 1;
		let sub1 = this.sub[i1];
		let sub2 = this.sub[i2];
		if (sub1 && sub2) {
			let t1 = sub1[0];
			return t1 + (sub2[0] - t1) * (i - i1 - this.ss);
		}
	}
	i2t_mode(i, mode) {
		return mode === "data" ? i : this.i2t(i);
	}
	t2i(t) {
		if (!this.sub.length) return void 0;
		let res = this.ti_map[t];
		if (res !== void 0) return res;
		let t0 = this.sub[0][0];
		let tN = this.sub[this.sub.length - 1][0];
		if (t < t0) return this.ss - (t0 - t) / this.tf;
		else if (t > tN) {
			let k = this.sub.length - 1;
			return this.ss + k - (tN - t) / this.tf;
		}
		try {
			let i = utils_default.fast_nearest(this.sub, t);
			let tk = this.sub[i[0]][0];
			let tk2 = this.sub[i[1]][0];
			let k = (t - tk) / (tk2 - tk);
			return this.ss + i[0] + k * (i[1] - i[0]);
		} catch (e) {}
	}
	smth2i(smth) {
		if (smth > MAX_ARR) return this.t2i(smth);
		else return smth;
	}
	smth2t(smth) {
		if (smth < MAX_ARR) return this.i2t(smth);
		else return smth;
	}
	gt2i(smth, ohlcv) {
		if (smth > MAX_ARR) {
			let [i1, i2] = utils_default.fast_nearest(ohlcv, smth + .1);
			if (typeof i1 === "number") return i1;
			else return this.t2i(smth);
		} else return smth;
	}
};
//#endregion
//#region src/components/Chart.vue
var _sfc_main$6 = {
	name: "Chart",
	props: [
		"title_txt",
		"data",
		"width",
		"height",
		"font",
		"colors",
		"overlays",
		"tv_id",
		"config",
		"buttons",
		"toolbar",
		"ib",
		"skin",
		"timezone"
	],
	mixins: [
		shaders_default,
		datatrack_default,
		{
			methods: {
				range_changed(r) {
					r = this.clamp_range(r);
					let sub = this.subset(r);
					utils_default.overwrite(this.range, r);
					utils_default.overwrite(this.sub, sub);
					this.update_layout();
					this.$emit("range-changed", r);
					if (this.$props.ib) this.save_data_t();
				},
				clamp_range(r) {
					const ohlcv = this.ohlcv;
					if (!ohlcv || ohlcv.length < 1) return r;
					let t1 = r[0], t2 = r[1];
					if (!Number.isFinite(t1) || !Number.isFinite(t2) || t1 > t2) return r;
					const first = this.$props.ib ? 0 : ohlcv[0][0];
					const last = this.$props.ib ? ohlcv.length - 1 : ohlcv[ohlcv.length - 1][0];
					const span = t2 - t1;
					if (t2 < first) {
						t1 = first - span + this.interval;
						t2 = t1 + span;
					} else if (t1 > last) {
						t2 = last + span - this.interval;
						t1 = t2 - span;
					}
					return [t1, t2];
				},
				goto(t) {
					const dt = this.range[1] - this.range[0];
					this.range_changed([t - dt, t]);
				},
				setRange(t1, t2) {
					this.range_changed([t1, t2]);
				},
				calc_interval() {
					let tf = utils_default.parse_tf(this.forced_tf);
					if (this.ohlcv.length < 2 && !tf) return;
					this.interval_ms = tf || utils_default.detect_interval(this.ohlcv);
					this.interval = this.$props.ib ? 1 : this.interval_ms;
					utils_default.warn(() => this.$props.ib && !this.chart.tf, constants_default.IB_TF_WARN, constants_default.SECOND);
				},
				set_ytransform(s) {
					let existing = this.y_transforms[s.grid_id] || {};
					let obj = Object.assign({}, existing, s);
					if (obj.range) obj.range = [...obj.range];
					this.y_transforms[s.grid_id] = obj;
					this.update_layout();
				},
				default_range() {
					const dl = this.$props.config.DEFAULT_LEN;
					const ml = this.$props.config.MINIMUM_LEN + .5;
					const l = this.ohlcv.length - 1;
					if (this.ohlcv.length < 2) return;
					let s, d;
					if (this.ohlcv.length <= dl) {
						s = 0;
						d = ml;
					} else {
						s = l - dl;
						d = .5;
					}
					if (!this.$props.ib) utils_default.overwrite(this.range, [this.ohlcv[s][0] - this.interval * d, this.ohlcv[l][0] + this.interval * ml]);
					else utils_default.overwrite(this.range, [s - this.interval * d, l + this.interval * ml]);
				},
				subset(range = this.range) {
					let [res, index] = this.filter(this.ohlcv, range[0] - this.interval, range[1]);
					this.ti_map = new TI();
					if (res) {
						this.sub_start = index;
						this.ti_map.init(this, res);
						if (!this.$props.ib) return res || [];
						return this.ti_map.sub_i;
					}
					return [];
				},
				init_range() {
					this.calc_interval();
					this.default_range();
				},
				update_layout(clac_tf, forceResize = false) {
					if (clac_tf) this.calc_interval();
					if (this.range[0] === void 0 || this.range[1] === void 0) if (this.ohlcv && this.ohlcv.length >= 2) {
						this.init_range();
						const sub = this.subset();
						utils_default.overwrite(this.sub, sub);
					} else return;
					const rangeArr = [this.range[0], this.range[1]];
					const subArr = Array.from(this.sub);
					const layoutParams = {
						chart: this.chart,
						sub: subArr,
						offsub: this.offsub,
						interval: this.interval,
						range: rangeArr,
						ctx: this.ctx,
						layers_meta: this.layers_meta,
						ti_map: this.ti_map,
						$props: this.$props,
						y_transforms: this.y_transforms,
						customGridHeights: this.customGridHeights,
						minimizedGrids: this.minimizedGrids
					};
					this.chartLayout = markRaw(new Layout(layoutParams));
					this.rerender++;
					const layout = this.chartLayout;
					if (forceResize) {
						if (this.$refs.sec) this.$refs.sec.forEach((section, i) => {
							const grid = section && section.$refs.grid;
							const sidebar = section && section.$refs["sb-" + i];
							if (grid && grid.resize_from_layout) grid.resize_from_layout(layout);
							if (sidebar && sidebar.resize_from_layout) sidebar.resize_from_layout(layout);
							if (section && section.updateLegendPosition) section.updateLegendPosition(layout);
						});
					} else if (this.$refs.sec) this.$refs.sec.forEach((section, i) => {
						const grid = section && section.$refs.grid;
						const sidebar = section && section.$refs["sb-" + i];
						if (grid) {
							if (grid.layoutOverride) grid.layoutOverride = null;
							if (grid.renderer) grid.renderer.layout = layout.grids[i];
						}
						if (sidebar) {
							if (sidebar.layoutOverride) sidebar.layoutOverride = null;
							if (sidebar.renderer) sidebar.renderer.layout = layout.grids[i];
						}
						if (section && section.clearLayoutOverride) section.clearLayoutOverride();
					});
					if (this._hook_update) this.ce("?chart-update", this.chartLayout);
				},
				common_props() {
					return {
						title_txt: this.chart.name || this.$props.title_txt,
						layout: this.chartLayout,
						sub: this.sub,
						range: this.range,
						interval: this.interval,
						cursor: this.cursor,
						colors: this.$props.colors,
						font: this.$props.font,
						y_ts: this.y_transforms,
						tv_id: this.$props.tv_id,
						config: this.$props.config,
						buttons: this.$props.buttons,
						meta: this.meta,
						skin: this.$props.skin,
						dataVersion: this.$props.data?.$cd?.revision?.() ?? 0
					};
				},
				overlay_subset(source, side) {
					return source.map((d, i) => {
						let res = utils_default.fast_filter(d.data, this.ti_map.i2t_mode(this.range[0] - this.interval, d.indexSrc), this.ti_map.i2t_mode(this.range[1], d.indexSrc));
						return {
							type: d.type,
							name: utils_default.format_name(d),
							data: this.ti_map.parse(res[0] || [], d.indexSrc || "map"),
							settings: d.settings || this.settings_ov,
							grid: d.grid || {},
							tf: utils_default.parse_tf(d.tf),
							i0: res[1],
							loading: d.loading,
							last: (this.last_values[side] || [])[i]
						};
					});
				},
				update_last_values() {
					this.last_candle = this.ohlcv ? this.ohlcv[this.ohlcv.length - 1] : void 0;
					this.last_values = {
						onchart: [],
						offchart: []
					};
					this.onchart.forEach((x, i) => {
						let d = x.data || [];
						this.last_values.onchart[i] = d[d.length - 1];
					});
					this.offchart.forEach((x, i) => {
						let d = x.data || [];
						this.last_values.offchart[i] = d[d.length - 1];
					});
				}
			},
			data() {
				return {
					sub: [],
					range: [],
					interval: 0,
					interval_ms: 0,
					y_transforms: {},
					sub_start: void 0,
					last_candle: [],
					last_values: {},
					rerender: 0,
					chartLayout: null
				};
			},
			computed: {
				dimensions() {
					return `${this.width}x${this.height}`;
				},
				dataHashKey() {
					const data = this.$props.data;
					if (!data) return "";
					const ohlcv = data.ohlcv || data.chart?.data || [];
					const ohlcvLen = ohlcv.length;
					return `${ohlcvLen},${ohlcv[0]?.[0] ?? ""},${ohlcv[ohlcvLen - 1]?.[0] ?? ""},${ohlcv[ohlcvLen - 1]?.[4] ?? ""},${data.scrollLock ? "1" : "0"},${data.$cd?.revision?.() ?? 0}`;
				}
			},
			watch: {
				dimensions() {
					this.update_layout();
					if (this._hook_resize) this.ce("?chart-resize");
				},
				ib(nw) {
					if (!nw) {
						let t1 = this.ti_map.i2t(this.range[0]);
						let t2 = this.ti_map.i2t(this.range[1]);
						utils_default.overwrite(this.range, [t1, t2]);
						this.interval = this.interval_ms;
					} else {
						this.init_range();
						utils_default.overwrite(this.range, this.range);
						this.interval = 1;
					}
					let sub = this.subset();
					utils_default.overwrite(this.sub, sub);
					this.update_layout();
				},
				timezone() {
					this.update_layout();
				},
				colors() {
					utils_default.overwrite(this.range, this.range);
				},
				forced_tf(n, p) {
					this.calc_interval();
					this.update_layout(true);
					this.ce("exec-all-scripts");
				},
				dataHashKey(newKey, oldKey) {
					if (!newKey || newKey === oldKey) return;
					const n = this.$props.data;
					if (!this.sub.length) this.init_range();
					const sub = this.subset();
					if (this.sub.length || sub.length) utils_default.overwrite(this.sub, sub);
					let nw = this.data_changed();
					this.update_layout(nw);
					utils_default.overwrite(this.range, this.range);
					this.cursor.scroll_lock = !!n.scrollLock;
					if (n.scrollLock && this.cursor.locked) this.cursor.locked = false;
					if (this._hook_data) this.ce("?chart-data", nw);
					this.update_last_values();
					this.rerender++;
				}
			}
		},
		{
			methods: {
				on_resize_grids(e) {
					this.isResizing = true;
					this.customGridHeights[e.gridAbove] = e.heightAbove;
					this.customGridHeights[e.gridBelow] = e.heightBelow;
					this._throttledResizeUpdate();
				},
				_throttledResizeUpdate() {
					if (this._resizeThrottleRAF) return;
					this._resizeThrottleRAF = requestAnimationFrame(() => {
						this._resizeThrottleRAF = null;
						this.update_layout(false, true);
					});
				},
				on_resize_complete() {
					this.chartLayout.grids.forEach((g, i) => {
						if (!this.minimizedGrids[i]) this.savedGridHeights[i] = g.height;
					});
					this.isResizing = false;
				},
				on_toggle_minimize(gridId) {
					const isMinimized = this.minimizedGrids[gridId];
					if (isMinimized) {
						this.minimizedGrids[gridId] = false;
						if (this.savedGridHeights[gridId]) this.customGridHeights[gridId] = this.savedGridHeights[gridId];
						else delete this.customGridHeights[gridId];
					} else {
						const currentHeight = this.chartLayout.grids[gridId]?.height;
						if (currentHeight) this.savedGridHeights[gridId] = currentHeight;
						this.minimizedGrids[gridId] = true;
					}
					this.redistribute_heights(gridId, isMinimized);
					this.update_layout(false, true);
				},
				redistribute_heights(changedGridId, wasMinimized) {
					const grids = this.chartLayout.grids;
					const MINIMIZED_HEIGHT = 28;
					const MIN_MAIN_CHART_HEIGHT = 100;
					const MIN_OFFCHART_HEIGHT = 50;
					if (wasMinimized) {
						const restoreHeight = this.savedGridHeights[changedGridId] || 150;
						let remainingDelta = restoreHeight - MINIMIZED_HEIGHT;
						const mainChartHeight = this.customGridHeights[0] || grids[0]?.height || 100;
						const mainAvailable = Math.max(0, mainChartHeight - MIN_MAIN_CHART_HEIGHT);
						const takeFromMain = Math.min(remainingDelta, mainAvailable);
						if (takeFromMain > 0) {
							this.customGridHeights[0] = mainChartHeight - takeFromMain;
							remainingDelta -= takeFromMain;
						}
						if (remainingDelta > 0) for (let i = changedGridId - 1; i >= 1; i--) {
							if (this.minimizedGrids[i]) continue;
							const gridHeight = this.customGridHeights[i] || grids[i]?.height || 100;
							const available = Math.max(0, gridHeight - MIN_OFFCHART_HEIGHT);
							const takeAmount = Math.min(remainingDelta, available);
							if (takeAmount > 0) {
								this.customGridHeights[i] = gridHeight - takeAmount;
								remainingDelta -= takeAmount;
							}
							if (remainingDelta <= 0) break;
						}
						const actualHeight = restoreHeight - remainingDelta;
						if (actualHeight > MINIMIZED_HEIGHT) this.customGridHeights[changedGridId] = actualHeight;
					} else {
						const gridAboveId = changedGridId - 1;
						if (gridAboveId < 0) return;
						let targetGridId = gridAboveId;
						if (this.minimizedGrids[gridAboveId]) {
							for (let i = gridAboveId; i >= 0; i--) if (!this.minimizedGrids[i]) {
								targetGridId = i;
								break;
							}
						}
						const targetHeight = this.customGridHeights[targetGridId] || grids[targetGridId]?.height || 100;
						const heightDelta = (this.savedGridHeights[changedGridId] || 150) - MINIMIZED_HEIGHT;
						this.customGridHeights[targetGridId] = targetHeight + heightDelta;
					}
				},
				minimize_all_offcharts() {
					const grids = this.chartLayout.grids;
					const MINIMIZED_HEIGHT = 28;
					let hasExpandedOffchart = false;
					for (let i = 1; i < grids.length; i++) if (!this.minimizedGrids[i]) {
						hasExpandedOffchart = true;
						break;
					}
					if (hasExpandedOffchart) {
						let totalHeightGained = 0;
						for (let i = 1; i < grids.length; i++) if (!this.minimizedGrids[i]) {
							const currentHeight = this.customGridHeights[i] || grids[i]?.height;
							if (currentHeight) {
								this.savedGridHeights[i] = currentHeight;
								totalHeightGained += currentHeight - MINIMIZED_HEIGHT;
							}
							this.minimizedGrids[i] = true;
						}
						const mainHeight = this.customGridHeights[0] || grids[0]?.height || 100;
						this.customGridHeights[0] = mainHeight + totalHeightGained;
					} else {
						let totalHeightNeeded = 0;
						for (let i = 1; i < grids.length; i++) {
							const restoreHeight = this.savedGridHeights[i] || 150;
							totalHeightNeeded += restoreHeight - MINIMIZED_HEIGHT;
						}
						const mainHeight = this.customGridHeights[0] || grids[0]?.height || 100;
						const available = Math.max(0, mainHeight - 100);
						const takeFromMain = Math.min(totalHeightNeeded, available);
						if (takeFromMain > 0) this.customGridHeights[0] = mainHeight - takeFromMain;
						const ratio = takeFromMain / totalHeightNeeded;
						for (let i = 1; i < grids.length; i++) {
							this.minimizedGrids[i] = false;
							const actualHeight = MINIMIZED_HEIGHT + ((this.savedGridHeights[i] || 150) - MINIMIZED_HEIGHT) * (ratio < 1 ? ratio : 1);
							this.customGridHeights[i] = actualHeight;
						}
					}
					this.update_layout(false, true);
				}
			},
			data() {
				return {
					customGridHeights: {},
					minimizedGrids: {},
					savedGridHeights: {},
					isResizing: false
				};
			},
			beforeUnmount() {
				if (this._resizeThrottleRAF) {
					cancelAnimationFrame(this._resizeThrottleRAF);
					this._resizeThrottleRAF = null;
				}
			}
		},
		{
			methods: {
				cursor_changed(e) {
					if (e.mode) this.cursor.mode = e.mode;
					if (this.cursor.mode !== "explore" && this.updater) this.updater.sync(e);
					if (this._hook_xchanged) this.ce("?x-changed", e);
				},
				cursor_locked(state) {
					if (this.cursor.scroll_lock && state) return;
					this.cursor.locked = state;
					if (this._hook_xlocked) this.ce("?x-locked", state);
				},
				register_kb(event) {
					if (!this.$refs.keyboard) return;
					this.$refs.keyboard.register(event);
				},
				remove_kb(event) {
					if (!this.$refs.keyboard) return;
					this.$refs.keyboard.remove(event);
				}
			},
			data() {
				return { cursor: {
					x: null,
					y: null,
					t: null,
					y$: null,
					grid_id: null,
					locked: false,
					values: {},
					scroll_lock: false,
					mode: utils_default.xmode()
				} };
			}
		},
		{
			methods: {
				emit_custom_event(d) {
					this.on_shader_event(d, "botbar");
					this.$emit("custom-event", d);
					if (d.event === "remove-layer-meta") this.remove_meta_props(...d.args);
					if (d.event === "grid-dblclick") this.on_toggle_minimize(d.args[0]);
					if (d.event === "minimize-all-offcharts") this.minimize_all_offcharts();
					if (d.event === "open-indicator-settings") this.$emit("open-indicator-settings", d.args[0]);
				},
				layer_meta_props(d) {
					if (!(d.grid_id in this.layers_meta)) this.layers_meta[d.grid_id] = {};
					this.layers_meta[d.grid_id][d.layer_id] = d;
					this.update_layout();
				},
				remove_meta_props(grid_id, layer_id) {
					if (grid_id in this.layers_meta) delete this.layers_meta[grid_id][layer_id];
				},
				legend_button_click(event) {
					this.$emit("legend-button-click", event);
				},
				ce(event, ...args) {
					this.emit_custom_event({
						event,
						args
					});
				},
				hooks(...list) {
					list.forEach((x) => this[`_hook_${x}`] = true);
				}
			},
			data() {
				return { layers_meta: {} };
			}
		}
	],
	components: {
		GridSection: Section_default,
		Botbar: _sfc_main$9,
		Keyboard: _sfc_main$8,
		GridResizer: GridResizer_default
	},
	created() {
		this.ctx = new Context(this.$props);
		this.init_range();
		this.sub = this.subset();
		utils_default.overwrite(this.range, this.range);
		const rangeArr = [this.range[0], this.range[1]];
		const subArr = Array.from(this.sub);
		const layoutParams = {
			chart: this.chart,
			sub: subArr,
			offsub: this.offsub,
			interval: this.interval,
			range: rangeArr,
			ctx: this.ctx,
			layers_meta: this.layers_meta,
			ti_map: this.ti_map,
			$props: this.$props,
			y_transforms: this.y_transforms,
			customGridHeights: this.customGridHeights,
			minimizedGrids: this.minimizedGrids
		};
		this.chartLayout = markRaw(new Layout(layoutParams));
		this.updater = new CursorUpdater(this);
		this.update_last_values();
		this.init_shaders(this.skin);
	},
	methods: {
		section_props(i) {
			return i === 0 ? this.main_section : this.sub_section;
		},
		toggleOverlayVisibility(gridId, overlayId, display) {
			const grid = (this.$refs.sec?.[gridId])?.$refs?.grid;
			if (grid?.renderer?.renderer) {
				grid.renderer.renderer.show_hide_layer({
					id: overlayId,
					display
				});
				grid.redraw();
			}
		},
		refreshOffchartOverlays() {
			this.rerender++;
			this.$nextTick(() => this.update_layout());
		}
	},
	computed: {
		main_section() {
			const layout = this.chartLayout;
			let p = Object.assign({}, this.common_props());
			p.layout = layout;
			p.data = this.overlay_subset(this.onchart, "onchart");
			p.data.push({
				type: this.chart.type || "Candles",
				main: true,
				data: this.sub,
				i0: this.sub_start,
				settings: this.chart.settings || this.settings_ohlcv,
				grid: this.chart.grid || {},
				last: this.last_candle
			});
			p.overlays = this.$props.overlays;
			return p;
		},
		sub_section() {
			const layout = this.chartLayout;
			let p = Object.assign({}, this.common_props());
			p.layout = layout;
			p.data = this.overlay_subset(this.offchart, "offchart");
			p.overlays = this.$props.overlays;
			return p;
		},
		botbar_props() {
			const layout = this.chartLayout;
			if (!layout || !layout.botbar) return {};
			let p = Object.assign({}, this.common_props());
			p.layout = layout;
			p.width = layout.botbar.width;
			p.height = layout.botbar.height;
			p.rerender = this.rerender;
			return p;
		},
		offsub() {
			return this.overlay_subset(this.offchart, "offchart");
		},
		ohlcv() {
			return this.$props.data.ohlcv || this.chart.data || [];
		},
		chart() {
			return this.$props.data.chart || { grid: {} };
		},
		onchart() {
			return this.$props.data.onchart || [];
		},
		offchart() {
			return (this.$props.data.offchart || []).filter((x) => {
				if (!x.settings) return true;
				return x.settings.display !== false;
			});
		},
		filter() {
			return this.$props.ib ? utils_default.fast_filter_i : utils_default.fast_filter;
		},
		styles() {
			return {
				"margin-left": `${this.$props.toolbar ? this.$props.config.TOOLBAR : 0}px`,
				"position": "relative"
			};
		},
		meta() {
			return {
				last: this.last_candle,
				sub_start: this.sub_start,
				activated: this.activated
			};
		},
		forced_tf() {
			return this.chart.tf;
		},
		visibleOffchartCount() {
			return this.offchart.length;
		},
		resizerIndices() {
			if (!this.chartLayout || !this.chartLayout.grids) return [];
			const count = this.chartLayout.grids.length;
			let indices = [];
			for (let i = 1; i < count; i++) indices.push(i);
			return indices;
		}
	},
	watch: { visibleOffchartCount() {
		this.update_layout();
		this.update_last_values();
	} },
	data() {
		return {
			settings_ohlcv: {},
			settings_ov: {},
			activated: false
		};
	}
};
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_keyboard = resolveComponent("keyboard");
	const _component_grid_section = resolveComponent("grid-section");
	const _component_grid_resizer = resolveComponent("grid-resizer");
	const _component_botbar = resolveComponent("botbar");
	return openBlock(), createElementBlock("div", {
		class: "trading-vue-chart",
		style: normalizeStyle($options.styles)
	}, [
		createVNode(_component_keyboard, { ref: "keyboard" }, null, 512),
		(openBlock(true), createElementBlock(Fragment, null, renderList(this.chartLayout?.grids || [], (grid, i) => {
			return openBlock(), createBlock(_component_grid_section, {
				key: grid.id,
				ref_for: true,
				ref: "sec",
				common: $options.section_props(i),
				grid_id: i,
				onRegisterKbListener: _ctx.register_kb,
				onRemoveKbListener: _ctx.remove_kb,
				onRangeChanged: _ctx.range_changed,
				onCursorChanged: _ctx.cursor_changed,
				onCursorLocked: _ctx.cursor_locked,
				onSidebarTransform: _ctx.set_ytransform,
				onLayerMetaProps: _ctx.layer_meta_props,
				onCustomEvent: _ctx.emit_custom_event,
				onLegendButtonClick: _ctx.legend_button_click
			}, null, 8, [
				"common",
				"grid_id",
				"onRegisterKbListener",
				"onRemoveKbListener",
				"onRangeChanged",
				"onCursorChanged",
				"onCursorLocked",
				"onSidebarTransform",
				"onLayerMetaProps",
				"onCustomEvent",
				"onLegendButtonClick"
			]);
		}), 128)),
		(openBlock(true), createElementBlock(Fragment, null, renderList($options.resizerIndices, (i) => {
			return openBlock(), createBlock(_component_grid_resizer, {
				key: "resizer-" + i,
				grid_id: i,
				layout: _ctx.chartLayout,
				colors: $props.colors,
				onResizeGrids: _ctx.on_resize_grids,
				onResizeComplete: _ctx.on_resize_complete,
				onToggleMinimize: _ctx.on_toggle_minimize
			}, null, 8, [
				"grid_id",
				"layout",
				"colors",
				"onResizeGrids",
				"onResizeComplete",
				"onToggleMinimize"
			]);
		}), 128)),
		createVNode(_component_botbar, mergeProps($options.botbar_props, {
			shaders: _ctx.shaders,
			timezone: $props.timezone,
			onBotbarZoom: _ctx.range_changed
		}), null, 16, [
			"shaders",
			"timezone",
			"onBotbarZoom"
		])
	], 4);
}
var Chart_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$6, [["render", _sfc_render$6]]);
//#endregion
//#region src/components/ItemList.vue
var _sfc_main$5 = {
	name: "ItemList",
	props: [
		"config",
		"items",
		"colors",
		"dc"
	],
	mounted() {
		window.addEventListener("mousedown", this.onmousedown, { passive: true });
	},
	beforeUnmount() {
		window.removeEventListener("mousedown", this.onmousedown);
	},
	methods: {
		list_style() {
			let w = this.$props.config.TOOLBAR;
			let bstl = `1px solid ${this.colors.tbListBorder || this.colors.grid}`;
			return {
				left: `${w}px`,
				background: this.colors.back,
				borderTop: bstl,
				borderRight: bstl,
				borderBottom: bstl
			};
		},
		item_class(item) {
			if (this.dc.tool === item.type) return "tvjs-item-list-item selected-item";
			return "tvjs-item-list-item";
		},
		item_style(item) {
			let conf = this.$props.config;
			let h = conf.TB_ICON + conf.TB_ITEM_M * 2 + 8;
			let sel = this.dc.tool === item.type;
			return {
				height: `${h}px`,
				color: sel ? void 0 : `#888888`
			};
		},
		icon_style(data) {
			let conf = this.$props.config;
			let br = conf.TB_ICON_BRI;
			let im = conf.TB_ITEM_M;
			return {
				"background-image": `url(${data.icon})`,
				"width": "25px",
				"height": "25px",
				"margin": `${im}px`,
				"filter": `brightness(${br})`
			};
		},
		item_click(e, item) {
			e.cancelBubble = true;
			this.$emit("item-selected", item);
			this.$emit("close-list");
		},
		onmousedown() {
			this.$emit("close-list");
		},
		thismousedown(e) {
			e.stopPropagation();
		}
	},
	computed: {},
	data() {
		return {};
	}
};
var _hoisted_1$1 = ["onClick"];
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", {
		class: "tvjs-item-list",
		style: normalizeStyle($options.list_style()),
		onMousedown: _cache[0] || (_cache[0] = (...args) => $options.thismousedown && $options.thismousedown(...args))
	}, [(openBlock(true), createElementBlock(Fragment, null, renderList($props.items, (item) => {
		return openBlock(), createElementBlock(Fragment, { key: item.type }, [!item.hidden ? (openBlock(), createElementBlock("div", {
			key: 0,
			class: normalizeClass($options.item_class(item)),
			onClick: (e) => $options.item_click(e, item),
			style: normalizeStyle($options.item_style(item))
		}, [createElementVNode("div", {
			class: "trading-vue-tbicon tvjs-pixelated",
			style: normalizeStyle($options.icon_style(item))
		}, null, 4), createElementVNode("div", null, toDisplayString(item.type), 1)], 14, _hoisted_1$1)) : createCommentVNode("", true)], 64);
	}), 128))], 36);
}
//#endregion
//#region src/components/ToolbarItem.vue
var _sfc_main$4 = {
	name: "ToolbarItem",
	props: [
		"data",
		"selected",
		"colors",
		"tv_id",
		"config",
		"dc",
		"subs"
	],
	components: { ItemList: /* @__PURE__ */ _plugin_vue_export_helper_default(_sfc_main$5, [["render", _sfc_render$5]]) },
	mounted() {
		if (this.data.group) {
			let type = this.subs[this.data.group];
			let item = this.data.items.find((x) => x.type === type);
			if (item) this.sub_item = item;
		}
	},
	methods: {
		mousedown(e) {
			this.click_start = utils_default.now();
			this.click_id = setTimeout(() => {
				this.show_exp_list = true;
			}, this.config.TB_ICON_HOLD);
		},
		expmouseover() {
			this.exp_hover = true;
		},
		expmouseleave() {
			this.exp_hover = false;
		},
		expmousedown(e) {
			if (this.show_exp_list) e.stopPropagation();
		},
		emit_selected(src) {
			if (utils_default.now() - this.click_start > this.config.TB_ICON_HOLD) return;
			clearTimeout(this.click_id);
			if (!this.data.group) this.$emit("item-selected", this.data);
			else {
				let item = this.sub_item || this.data.items[0];
				this.$emit("item-selected", item);
			}
		},
		emit_selected_sub(item) {
			this.$emit("item-selected", item);
			this.sub_item = item;
		},
		exp_click(e) {
			if (!this.data.group) return;
			e.stopPropagation();
			this.show_exp_list = !this.show_exp_list;
		},
		close_list() {
			this.show_exp_list = false;
		}
	},
	computed: {
		item_style() {
			if (this.$props.data.type === "System:Splitter") return this.splitter;
			let conf = this.$props.config;
			let im = conf.TB_ITEM_M;
			let m = (conf.TOOLBAR - conf.TB_ICON) * .5 - im;
			let s = conf.TB_ICON + im * 2;
			let b = this.exp_hover ? 0 : 3;
			return {
				"width": `${s}px`,
				"height": `${s}px`,
				"margin": `8px ${m}px 0px ${m}px`,
				"border-radius": `3px ${b}px ${b}px 3px`
			};
		},
		icon_style() {
			if (this.$props.data.type === "System:Splitter") return {};
			let conf = this.$props.config;
			let br = conf.TB_ICON_BRI;
			let sz = conf.TB_ICON;
			let im = conf.TB_ITEM_M;
			return {
				"background-image": `url(${this.sub_item ? this.sub_item.icon : this.$props.data.icon})`,
				"width": `${sz}px`,
				"height": `${sz}px`,
				"margin": `${im}px`,
				"filter": `brightness(${br})`
			};
		},
		exp_style() {
			let conf = this.$props.config;
			let im = conf.TB_ITEM_M;
			let s = conf.TB_ICON * .5 + im;
			return {
				padding: `${s}px ${(conf.TOOLBAR - s * 2) / 4}px`,
				transform: this.show_exp_list ? `scale(-0.6, 1)` : `scaleX(0.6)`
			};
		},
		splitter() {
			let conf = this.$props.config;
			let c = this.$props.colors.grid;
			let im = conf.TB_ITEM_M;
			let m = (conf.TOOLBAR - conf.TB_ICON) * .5 - im;
			return {
				"width": `${conf.TB_ICON + im * 2}px`,
				"height": "1px",
				"margin": `8px ${m}px 8px ${m}px`,
				"background-color": c
			};
		}
	},
	beforeUnmount() {
		clearTimeout(this.click_id);
	},
	data() {
		return {
			exp_hover: false,
			show_exp_list: false,
			sub_item: null
		};
	}
};
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_item_list = resolveComponent("item-list");
	return openBlock(), createElementBlock("div", {
		class: normalizeClass(["trading-vue-tbitem", $props.selected ? "selected-item" : ""]),
		onClick: _cache[4] || (_cache[4] = ($event) => $options.emit_selected("click")),
		onMousedown: _cache[5] || (_cache[5] = (...args) => $options.mousedown && $options.mousedown(...args)),
		onTouchstart: _cache[6] || (_cache[6] = (...args) => $options.mousedown && $options.mousedown(...args)),
		onTouchend: _cache[7] || (_cache[7] = ($event) => $options.emit_selected("touch")),
		style: normalizeStyle($options.item_style)
	}, [
		createElementVNode("div", {
			class: "trading-vue-tbicon tvjs-pixelated",
			style: normalizeStyle($options.icon_style)
		}, null, 4),
		$props.data.group ? (openBlock(), createElementBlock("div", {
			key: 0,
			class: "trading-vue-tbitem-exp",
			style: normalizeStyle($options.exp_style),
			onClick: _cache[0] || (_cache[0] = (...args) => $options.exp_click && $options.exp_click(...args)),
			onMousedown: _cache[1] || (_cache[1] = (...args) => $options.expmousedown && $options.expmousedown(...args)),
			onMouseover: _cache[2] || (_cache[2] = (...args) => $options.expmouseover && $options.expmouseover(...args)),
			onMouseleave: _cache[3] || (_cache[3] = (...args) => $options.expmouseleave && $options.expmouseleave(...args))
		}, " ᐳ ", 36)) : createCommentVNode("", true),
		$data.show_exp_list ? (openBlock(), createBlock(_component_item_list, {
			key: 1,
			config: $props.config,
			items: $props.data.items,
			colors: $props.colors,
			dc: $props.dc,
			onCloseList: $options.close_list,
			onItemSelected: $options.emit_selected_sub
		}, null, 8, [
			"config",
			"items",
			"colors",
			"dc",
			"onCloseList",
			"onItemSelected"
		])) : createCommentVNode("", true)
	], 38);
}
//#endregion
//#region src/components/Toolbar.vue
var _sfc_main$3 = {
	name: "Toolbar",
	props: [
		"data",
		"height",
		"colors",
		"tv_id",
		"config"
	],
	components: { ToolbarItem: /* @__PURE__ */ _plugin_vue_export_helper_default(_sfc_main$4, [["render", _sfc_render$4]]) },
	mounted() {},
	methods: {
		selected(tool) {
			this.$emit("custom-event", {
				event: "tool-selected",
				args: [tool.type]
			});
			if (tool.group) this.sub_map[tool.group] = tool.type;
		},
		is_selected(tool) {
			if (tool.group) return !!tool.items.find((x) => x.type === this.data.tool);
			return tool.type === this.data.tool;
		}
	},
	computed: {
		styles() {
			let colors = this.$props.colors;
			let b = this.$props.config.TB_BORDER;
			let w = this.$props.config.TOOLBAR - b;
			colors.grid;
			let cb = colors.tbBack || colors.back;
			let brd = colors.tbBorder || colors.scale;
			let st = this.$props.config.TB_B_STYLE;
			return {
				"width": `${w}px`,
				"height": `${this.$props.height - 3}px`,
				"background-color": cb,
				"border-right": `${b}px ${st} ${brd}`
			};
		},
		groups() {
			let arr = [];
			for (var tool of this.data.tools || []) {
				if (!tool.group) {
					arr.push(tool);
					continue;
				}
				let g = arr.find((x) => x.group === tool.group);
				if (!g) arr.push({
					group: tool.group,
					icon: tool.icon,
					items: [tool]
				});
				else g.items.push(tool);
			}
			return arr;
		},
		toolsLength() {
			return this.data?.tools?.length ?? 0;
		}
	},
	watch: { toolsLength(newLen) {
		this.tool_count = newLen;
	} },
	data() {
		return {
			tool_count: 0,
			sub_map: {}
		};
	}
};
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_toolbar_item = resolveComponent("toolbar-item");
	return openBlock(), createElementBlock("div", {
		class: "trading-vue-toolbar",
		style: normalizeStyle($options.styles),
		key: $data.tool_count
	}, [(openBlock(true), createElementBlock(Fragment, null, renderList($options.groups, (tool, i) => {
		return openBlock(), createElementBlock(Fragment, { key: i }, [tool.icon && !tool.hidden ? (openBlock(), createBlock(_component_toolbar_item, {
			key: 0,
			onItemSelected: $options.selected,
			data: tool,
			subs: $data.sub_map,
			dc: $props.data,
			config: $props.config,
			colors: $props.colors,
			selected: $options.is_selected(tool)
		}, null, 8, [
			"onItemSelected",
			"data",
			"subs",
			"dc",
			"config",
			"colors",
			"selected"
		])) : createCommentVNode("", true)], 64);
	}), 128))], 4);
}
var Toolbar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$3, [["render", _sfc_render$3]]);
//#endregion
//#region src/components/Widgets.vue
var _sfc_main$2 = {
	name: "Widgets",
	props: [
		"width",
		"height",
		"map",
		"tv",
		"dc"
	],
	methods: { initw(id) {
		return this.$props.map[id].cls;
	} }
};
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", {
		class: "tvjs-widgets",
		style: normalizeStyle({
			width: $props.width + "px",
			height: $props.height + "px"
		})
	}, [(openBlock(true), createElementBlock(Fragment, null, renderList(Object.keys($props.map), (id) => {
		return openBlock(), createBlock(resolveDynamicComponent($options.initw(id)), {
			key: id,
			id,
			main: $props.map[id].ctrl,
			data: $props.map[id].data,
			tv: $props.tv,
			dc: $props.dc
		}, null, 8, [
			"id",
			"main",
			"data",
			"tv",
			"dc"
		]);
	}), 128))], 4);
}
var Widgets_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$2, [["render", _sfc_render$2]]);
//#endregion
//#region src/components/TheTip.vue
var _sfc_main$1 = {
	name: "TheTip",
	props: ["data"],
	mounted() {
		this._timerId = setTimeout(() => this.$emit("remove-me"), 3e3);
	},
	beforeUnmount() {
		clearTimeout(this._timerId);
	},
	computed: { style() {
		return { background: this.data.color };
	} }
};
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", {
		class: "tvjs-the-tip",
		onMousedown: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("remove-me")),
		style: normalizeStyle($options.style)
	}, toDisplayString($props.data.text), 37);
}
var TheTip_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$1, [["render", _sfc_render$1]]);
//#endregion
//#region src/mixins/xcontrol.js
var xcontrol_default = {
	mounted() {
		this.ctrllist();
		this.skin_styles();
	},
	methods: {
		ctrllist() {
			this.ctrl_destroy();
			this.controllers = [];
			for (let x of this.$props.extensions) {
				let name = x.Main.__name__;
				if (!this.xSettings[name]) this.xSettings[name] = {};
				let nc = new x.Main(this, this.data, this.xSettings[name]);
				nc.name = name;
				this.controllers.push(markRaw(nc));
			}
			return this.controllers;
		},
		pre_dc(e) {
			for (let ctrl of this.controllers) if (ctrl.update) ctrl.update(e);
		},
		post_dc(e) {
			for (let ctrl of this.controllers) if (ctrl.post_update) ctrl.post_update(e);
		},
		ctrl_destroy() {
			for (let ctrl of this.controllers) if (ctrl.destroy) ctrl.destroy();
		},
		skin_styles() {
			let id = "tvjs-skin-styles";
			let stbr = document.getElementById(id);
			if (stbr) stbr.parentNode.removeChild(stbr);
			if (this.skin_proto && this.skin_proto.styles) {
				let sheet = document.createElement("style");
				sheet.setAttribute("id", id);
				sheet.textContent = this.skin_proto.styles;
				this.$el.appendChild(sheet);
			}
		}
	},
	computed: {
		ws() {
			let ws = {};
			for (let ctrl of this.controllers) if (ctrl.widgets) for (let id in ctrl.widgets) {
				ws[id] = ctrl.widgets[id];
				ws[id].ctrl = ctrl;
			}
			return ws;
		},
		skins() {
			let sks = {};
			for (let x of this.$props.extensions) for (let id in x.skins || {}) sks[id] = x.skins[id];
			return sks;
		},
		skin_proto() {
			return this.skins[this.$props.skin];
		},
		colorpack() {
			let sel = this.skins[this.$props.skin];
			return sel ? sel.colors : void 0;
		},
		xSettingsKey() {
			const settings = this.xSettings;
			if (!settings) return "";
			let parts = [];
			for (const k in settings) if (Object.prototype.hasOwnProperty.call(settings, k)) {
				const v = settings[k];
				let count = 0;
				if (v && typeof v === "object") {
					for (const _ in v) if (Object.prototype.hasOwnProperty.call(v, _)) count++;
					parts.push(`${k}:${count}`);
				} else parts.push(`${k}:${v}`);
			}
			return parts.sort().join("|");
		}
	},
	watch: {
		skin(n, p) {
			if (n !== p) this.resetChart();
			this.skin_styles();
		},
		extensions() {
			this.ctrllist();
		},
		xSettingsKey(newKey, oldKey) {
			if (!newKey || newKey === oldKey) return;
			for (let ctrl of this.controllers) if (ctrl.onsettings) ctrl.onsettings(this.xSettings, null);
		}
	},
	data() {
		return { controllers: [] };
	}
};
//#endregion
//#region src/helpers/nav.js
/**
* @param {number} t - target timestamp (or index in IB mode)
* @param {[number,number]|null} bounds - [firstTs, lastTs] of the data
* @returns {{ value:number, diagnostics:object[] }}
*/
function clampGoto(t, bounds) {
	const out = [];
	if (bounds && Number.isFinite(t) && (t < bounds[0] || t > bounds[1])) {
		const c = Math.max(bounds[0], Math.min(bounds[1], t));
		out.push(warn("nav.goto.out_of_range", `goto(${t}) is outside the data range [${bounds[0]}, ${bounds[1]}]; clamped to ${c}`));
		t = c;
	}
	return {
		value: t,
		diagnostics: out
	};
}
/**
* @param {number} t1 @param {number} t2
* @param {[number,number]|null} bounds
* @returns {{ t1:number, t2:number, diagnostics:object[] }}
*/
function clampRange(t1, t2, bounds) {
	const out = [];
	if (Number.isFinite(t1) && Number.isFinite(t2) && t1 > t2) {
		out.push(warn("nav.range.reversed", `setRange(${t1}, ${t2}) is reversed; swapping`));
		const tmp = t1;
		t1 = t2;
		t2 = tmp;
	}
	if (bounds && Number.isFinite(t1) && Number.isFinite(t2)) {
		const offLeft = t1 < bounds[0] && t2 < bounds[0];
		const offRight = t1 > bounds[1] && t2 > bounds[1];
		if (offLeft || offRight) out.push(warn("nav.range.off_data", `setRange [${t1}, ${t2}] is entirely outside the data range [${bounds[0]}, ${bounds[1]}]`));
	}
	return {
		t1,
		t2,
		diagnostics: out
	};
}
/** Extract [firstTs, lastTs] from a DataCube (or null if no data). */
function dataBounds(dataCube) {
	const d = dataCube && dataCube.data && dataCube.data.chart && dataCube.data.chart.data;
	if (!Array.isArray(d) || !d.length) return null;
	return [d[0][0], d[d.length - 1][0]];
}
//#endregion
//#region src/stuff/a11y.js
function ohlcvOf(dataCube) {
	const d = dataCube && dataCube.data && dataCube.data.chart && dataCube.data.chart.data;
	return Array.isArray(d) ? d : null;
}
function fmtTs(t) {
	try {
		return new Date(t).toISOString().slice(0, 16).replace("T", " ");
	} catch {
		return String(t);
	}
}
/** Short aria-label for the chart container. */
function chartAriaLabel(dataCube, title = "TradingVue") {
	const o = ohlcvOf(dataCube);
	if (!o || !o.length) return `${title} financial chart (no data)`;
	const last = o[o.length - 1];
	return `${title} financial chart, ${o.length} candles, latest close ${last[4]}`;
}
/** A longer text summary used as the screen-reader data fallback. */
function chartDataSummary(dataCube, title = "TradingVue") {
	const o = ohlcvOf(dataCube);
	if (!o || !o.length) return `${title}: no chart data loaded.`;
	let hi = -Infinity, lo = Infinity;
	for (const c of o) {
		if (c[2] > hi) hi = c[2];
		if (c[3] < lo) lo = c[3];
	}
	const first = o[0], last = o[o.length - 1];
	const parts = [
		`${title} financial chart.`,
		`${o.length} candles from ${fmtTs(first[0])} to ${fmtTs(last[0])}.`,
		`Latest open ${last[1]}, high ${last[2]}, low ${last[3]}, close ${last[4]}.`,
		`Overall high ${hi}, low ${lo}.`
	];
	const d = dataCube.data;
	const names = (side) => (Array.isArray(d[side]) ? d[side] : []).map((x) => x && x.name).filter(Boolean);
	const on = names("onchart"), off = names("offchart");
	if (on.length) parts.push(`On-chart overlays: ${on.join(", ")}.`);
	if (off.length) parts.push(`Off-chart indicators: ${off.join(", ")}.`);
	return parts.join(" ");
}
var NAV_KEYS = new Set([
	"ArrowLeft",
	"ArrowRight",
	"Home",
	"End"
]);
//#endregion
//#region src/TradingVue.vue
var _sfc_main = {
	name: "TradingVue",
	components: {
		Chart: Chart_default,
		Toolbar: Toolbar_default,
		Widgets: Widgets_default,
		TheTip: TheTip_default
	},
	mixins: [xcontrol_default],
	props: {
		titleTxt: {
			type: String,
			default: "TradingVue.js"
		},
		id: {
			type: String,
			default: "trading-vue-js"
		},
		width: {
			type: Number,
			default: 800
		},
		height: {
			type: Number,
			default: 421
		},
		colorTitle: {
			type: String,
			default: "#42b883"
		},
		colorBack: {
			type: String,
			default: "#121826"
		},
		colorGrid: {
			type: String,
			default: "#2f3240"
		},
		colorText: {
			type: String,
			default: "#dedddd"
		},
		colorTextHL: {
			type: String,
			default: "#fff"
		},
		colorScale: {
			type: String,
			default: "#838383"
		},
		colorCross: {
			type: String,
			default: "#8091a0"
		},
		colorCandleUp: {
			type: String,
			default: "#23a776"
		},
		colorCandleDw: {
			type: String,
			default: "#e54150"
		},
		colorWickUp: {
			type: String,
			default: "#23a77688"
		},
		colorWickDw: {
			type: String,
			default: "#e5415088"
		},
		colorWickSm: {
			type: String,
			default: "transparent"
		},
		colorVolUp: {
			type: String,
			default: "#23a77642"
		},
		colorVolDw: {
			type: String,
			default: "#e5415042"
		},
		colorPanel: {
			type: String,
			default: "#565c68"
		},
		colorTbBack: { type: String },
		colorTbBorder: {
			type: String,
			default: "#8282827d"
		},
		colors: { type: Object },
		theme: {
			type: Object,
			default: null
		},
		font: {
			type: String,
			default: constants_default.ChartConfig.FONT
		},
		toolbar: {
			type: Boolean,
			default: false
		},
		data: {
			type: Object,
			required: true
		},
		overlays: {
			type: Array,
			default: function() {
				return [];
			}
		},
		chartConfig: {
			type: Object,
			default: function() {
				return {};
			}
		},
		legendButtons: {
			type: Array,
			default: function() {
				return [];
			}
		},
		indexBased: {
			type: Boolean,
			default: false
		},
		extensions: {
			type: Array,
			default: function() {
				return [];
			}
		},
		xSettings: {
			type: Object,
			default: function() {
				return {};
			}
		},
		skin: { type: String },
		timezone: {
			type: Number,
			default: 0
		},
		a11y: {
			type: Boolean,
			default: true
		}
	},
	computed: {
		chart_props() {
			let offset = this.$props.toolbar ? this.chart_config.TOOLBAR : 0;
			let chart_props = {
				title_txt: this.$props.titleTxt,
				overlays: this.$props.overlays.concat(this.mod_ovs),
				data: this.decubed,
				width: this.$props.width - offset,
				height: this.$props.height,
				font: this.font_comp,
				buttons: this.$props.legendButtons,
				toolbar: this.$props.toolbar,
				ib: this.$props.indexBased || this.index_based || false,
				colors: Object.assign({}, this.$props.colors || this.colorpack),
				skin: this.skin_proto,
				timezone: this.$props.timezone
			};
			this.parse_colors(chart_props.colors);
			if (this.$props.theme) Object.assign(chart_props.colors, this.$props.theme);
			return chart_props;
		},
		a11y_id() {
			return `${this.$props.id}-a11y-desc`;
		},
		a11y_label() {
			return chartAriaLabel(this.$props.data, this.$props.titleTxt);
		},
		a11y_summary() {
			return chartDataSummary(this.$props.data, this.$props.titleTxt);
		},
		chart_config() {
			return Object.assign({}, constants_default.ChartConfig, this.$props.chartConfig);
		},
		decubed() {
			let data = this.$props.data;
			if (data.data !== void 0) {
				data.init_tvjs(this);
				return data.data;
			} else return data;
		},
		index_based() {
			const base = this.$props.data;
			if (base.chart) return base.chart.indexBased;
			else if (base.data) return base.data.chart.indexBased;
			return false;
		},
		mod_ovs() {
			let arr = [];
			for (var x of this.$props.extensions) arr.push(...Object.values(x.overlays));
			return arr;
		},
		font_comp() {
			return this.skin_proto && this.skin_proto.font ? this.skin_proto.font : this.font;
		}
	},
	data() {
		return {
			reset: 0,
			tip: null
		};
	},
	beforeUnmount() {
		this.custom_event({ event: "before-destroy" });
		this.ctrl_destroy();
		if (this.data && this.data.destroy) this.data.destroy();
	},
	methods: {
		resetChart(resetRange = true) {
			let range = this.getRange();
			this.reset++;
			if (!resetRange && range[0] && range[1]) this.$nextTick(() => {
				this.$nextTick(() => {
					this.setRange(...range);
				});
			});
			this.$nextTick(() => this.custom_event({
				event: "chart-reset",
				args: []
			}));
		},
		toggleOverlayVisibility(gridId, overlayId, display) {
			this.$refs.chart?.toggleOverlayVisibility(gridId, overlayId, display);
		},
		updateLayout(forceResize = false) {
			this.$refs.chart?.update_layout(false, forceResize);
		},
		refreshOffchartOverlays() {
			this.$refs.chart?.refreshOffchartOverlays();
		},
		goto(t) {
			const { value, diagnostics } = clampGoto(t, dataBounds(this.$props.data));
			if (diagnostics.length) report(diagnostics, "warn", "goto");
			t = value;
			const chart = this.$refs.chart;
			if (!chart) return {
				ok: false,
				diagnostics
			};
			if (this.chart_props.ib) t = chart.ti_map.gt2i(t, chart.ohlcv);
			chart.goto(t);
			return {
				ok: diagnostics.length === 0,
				diagnostics
			};
		},
		setRange(t1, t2) {
			const r = clampRange(t1, t2, dataBounds(this.$props.data));
			if (r.diagnostics.length) report(r.diagnostics, "warn", "setRange");
			t1 = r.t1;
			t2 = r.t2;
			const chart = this.$refs.chart;
			if (!chart) return {
				ok: false,
				diagnostics: r.diagnostics
			};
			if (this.chart_props.ib) {
				const ti_map = chart.ti_map;
				const ohlcv = chart.ohlcv;
				t1 = ti_map.gt2i(t1, ohlcv);
				t2 = ti_map.gt2i(t2, ohlcv);
			}
			chart.setRange(t1, t2);
			return {
				ok: r.diagnostics.length === 0,
				diagnostics: r.diagnostics
			};
		},
		getRange() {
			if (this.chart_props.ib) {
				const ti_map = this.$refs.chart.ti_map;
				return this.$refs.chart.range.map((x) => ti_map.i2t(x));
			}
			return this.$refs.chart.range;
		},
		getCursor() {
			let cursor = this.$refs.chart.cursor;
			if (this.chart_props.ib) {
				const ti_map = this.$refs.chart.ti_map;
				let copy = Object.assign({}, cursor);
				copy.i = copy.t;
				copy.t = ti_map.i2t(copy.t);
				return copy;
			}
			return cursor;
		},
		showTheTip(text, color = "orange") {
			this.tip = {
				text,
				color
			};
		},
		legend_button(event) {
			this.custom_event({
				event: "legend-button-click",
				args: [event]
			});
		},
		open_indicator_settings(indicatorInfo) {
			this.$emit("open-indicator-settings", indicatorInfo);
		},
		custom_event(d) {
			if ("args" in d) this.$emit(d.event, ...d.args);
			else this.$emit(d.event);
			let data = this.$props.data;
			let ctrl = this.controllers.length !== 0;
			if (ctrl) this.pre_dc(d);
			if (data.tv) data.on_custom_event(d.event, d.args);
			if (ctrl) this.post_dc(d);
		},
		range_changed(r) {
			if (this.chart_props.ib) {
				const ti_map = this.$refs.chart.ti_map;
				r = r.map((x) => ti_map.i2t(x));
			}
			this.$emit("range-changed", r);
			this.custom_event({
				event: "range-changed",
				args: [r]
			});
			if (this.onrange) this.onrange(r);
		},
		set_loader(dc) {
			this.onrange = (r) => {
				let pf = this.chart_props.ib ? "_ms" : "";
				let tf = this.$refs.chart["interval" + pf];
				dc.range_changed(r, tf);
			};
		},
		parse_colors(colors) {
			const defs = this.$options.props;
			let usedFlat = false;
			for (var k in this.$props) if (k.indexOf("color") === 0 && k !== "colors") {
				let k2 = k.replace("color", "");
				k2 = k2[0].toLowerCase() + k2.slice(1);
				if (defs[k] && this.$props[k] !== defs[k].default) usedFlat = true;
				if (colors[k2]) continue;
				colors[k2] = this.$props[k];
			}
			if (usedFlat && !this._flatColorsWarned && typeof console !== "undefined") {
				this._flatColorsWarned = true;
				console.warn("[trading-vue] Flat `colorXxx` props are deprecated; pass a single `theme` object instead, e.g. :theme=\"{ back: '#000', candleUp: '#0f0' }\".");
			}
		},
		a11y_keydown(e) {
			if (!this.a11y || !NAV_KEYS.has(e.key)) return;
			if (!this.$refs.chart) return;
			const r = this.getRange();
			const b = dataBounds(this.$props.data);
			if (e.key === "Home") {
				if (b) this.goto(b[0]);
			} else if (e.key === "End") {
				if (b) this.goto(b[1]);
			} else if (Array.isArray(r)) {
				const step = (r[1] - r[0]) * .1;
				const d = e.key === "ArrowLeft" ? -step : step;
				this.setRange(r[0] + d, r[1] + d);
			}
			e.preventDefault();
		},
		mousedown() {
			this.$refs.chart.activated = true;
		},
		mouseleave() {
			this.$refs.chart.activated = false;
		}
	}
};
var _hoisted_1 = [
	"id",
	"role",
	"aria-roledescription",
	"aria-label",
	"aria-describedby",
	"tabindex"
];
var _hoisted_2 = ["id"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_toolbar = resolveComponent("toolbar");
	const _component_widgets = resolveComponent("widgets");
	const _component_chart = resolveComponent("chart");
	const _component_the_tip = resolveComponent("the-tip");
	return openBlock(), createElementBlock("div", {
		class: "trading-vue",
		id: $props.id,
		onMousedown: _cache[1] || (_cache[1] = (...args) => $options.mousedown && $options.mousedown(...args)),
		onMouseleave: _cache[2] || (_cache[2] = (...args) => $options.mouseleave && $options.mouseleave(...args)),
		role: $props.a11y ? "application" : null,
		"aria-roledescription": $props.a11y ? "interactive financial chart" : null,
		"aria-label": $props.a11y ? $options.a11y_label : null,
		"aria-describedby": $props.a11y ? $options.a11y_id : null,
		tabindex: $props.a11y ? 0 : null,
		onKeydown: _cache[3] || (_cache[3] = (...args) => $options.a11y_keydown && $options.a11y_keydown(...args)),
		style: normalizeStyle({
			color: this.chart_props.colors.text,
			font: this.font_comp,
			width: this.width + "px",
			height: this.height + "px"
		})
	}, [
		$props.a11y ? (openBlock(), createElementBlock("div", {
			key: 0,
			id: $options.a11y_id,
			class: "tvjs-sr-only",
			"aria-live": "polite"
		}, toDisplayString($options.a11y_summary), 9, _hoisted_2)) : createCommentVNode("", true),
		$props.toolbar ? (openBlock(), createBlock(_component_toolbar, mergeProps({
			key: 1,
			ref: "toolbar",
			onCustomEvent: $options.custom_event
		}, $options.chart_props, { config: $options.chart_config }), null, 16, ["onCustomEvent", "config"])) : createCommentVNode("", true),
		_ctx.controllers.length ? (openBlock(), createBlock(_component_widgets, {
			key: 2,
			ref: "widgets",
			map: _ctx.ws,
			width: $props.width,
			height: $props.height,
			tv: this,
			dc: $props.data
		}, null, 8, [
			"map",
			"width",
			"height",
			"dc"
		])) : createCommentVNode("", true),
		(openBlock(), createBlock(_component_chart, mergeProps({
			key: $data.reset,
			ref: "chart"
		}, $options.chart_props, {
			tv_id: $props.id,
			config: $options.chart_config,
			onCustomEvent: $options.custom_event,
			onRangeChanged: $options.range_changed,
			onLegendButtonClick: $options.legend_button,
			onOpenIndicatorSettings: $options.open_indicator_settings
		}), null, 16, [
			"tv_id",
			"config",
			"onCustomEvent",
			"onRangeChanged",
			"onLegendButtonClick",
			"onOpenIndicatorSettings"
		])),
		createVNode(Transition, { name: "tvjs-drift" }, {
			default: withCtx(() => [$data.tip ? (openBlock(), createBlock(_component_the_tip, {
				key: 0,
				data: $data.tip,
				onRemoveMe: _cache[0] || (_cache[0] = ($event) => $data.tip = null)
			}, null, 8, ["data"])) : createCommentVNode("", true)]),
			_: 1
		})
	], 44, _hoisted_1);
}
var TradingVue_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["render", _sfc_render]]);
//#endregion
//#region src/helpers/script_ww.js?worker&inline
var jsContent = "//#region \\0rolldown/runtime.js\nvar __create = Object.create;\nvar __defProp = Object.defineProperty;\nvar __getOwnPropDesc = Object.getOwnPropertyDescriptor;\nvar __getOwnPropNames = Object.getOwnPropertyNames;\nvar __getProtoOf = Object.getPrototypeOf;\nvar __hasOwnProp = Object.prototype.hasOwnProperty;\nvar __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);\nvar __copyProps = (to, from, except, desc) => {\n	if (from && typeof from === \"object\" || typeof from === \"function\") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {\n		key = keys[i];\n		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {\n			get: ((k) => from[k]).bind(null, key),\n			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable\n		});\n	}\n	return to;\n};\nvar __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, \"default\", {\n	value: mod,\n	enumerable: true\n}) : target, mod));\n//#endregion\n//#region src/helpers/script_state.js\nconst state = {\n	t: 0,\n	tf: 0,\n	iter: 0,\n	data: {},\n	shared: {},\n	mods: {},\n	send: null,\n	std_inject: null,\n	match_ds: null\n};\n//#endregion\n//#region src/stuff/constants.js\nconst DEF_LIMIT$3 = 5;\nconst BUF_INC$2 = 5;\nconst FDEFS$1 = /(function |)([$A-Z_][0-9A-Z_$\\.]*)[\\s]*?\\((.*?)\\)/gim;\nconst FDEFS1$1 = /(function |)([$A-Z_][0-9A-Z_$\\.]*)[\\s]*?\\((.*?\\s*)\\)/im;\nconst FDEFS2$1 = /(function |)([$A-Z_][0-9A-Z_$\\.]*)[\\s]*?\\((.*\\s*)\\)/gims;\nconst SBRACKETS$1 = /([$A-Z_][0-9A-Z_$\\.]*)[\\s]*?\\[([^\"^\\[^\\]]+?)\\]/gim;\nconst TFSTR$1 = /(\\d+)(\\w*)/gm;\nconst SECOND = 1e3;\nconst MINUTE = SECOND * 60;\nconst MINUTE3 = MINUTE * 3;\nconst MINUTE5 = MINUTE * 5;\nconst MINUTE15 = MINUTE * 15;\nconst MINUTE30 = MINUTE * 30;\nconst HOUR = MINUTE * 60;\nconst HOUR4 = HOUR * 4;\nconst HOUR12 = HOUR * 12;\nconst DAY = HOUR * 24;\nconst WEEK = DAY * 7;\nconst MONTH = WEEK * 4;\nconst YEAR = DAY * 365;\nconst MONTHMAP = [\n	\"Jan\",\n	\"Feb\",\n	\"Mar\",\n	\"Apr\",\n	\"May\",\n	\"Jun\",\n	\"Jul\",\n	\"Aug\",\n	\"Sep\",\n	\"Oct\",\n	\"Nov\",\n	\"Dec\"\n];\nconst TIMESCALES = [\n	MINUTE,\n	MINUTE * 2,\n	MINUTE5,\n	MINUTE * 10,\n	MINUTE15,\n	MINUTE30,\n	HOUR,\n	HOUR * 1.5,\n	HOUR * 3,\n	HOUR * 6,\n	HOUR * 12,\n	DAY,\n	DAY * 2,\n	DAY * 3,\n	DAY * 5,\n	DAY * 7,\n	DAY * 10,\n	DAY * 15,\n	MONTH,\n	MONTH * 2,\n	MONTH * 3,\n	MONTH * 4,\n	MONTH * 6,\n	YEAR,\n	YEAR * 2,\n	YEAR * 3,\n	YEAR * 5,\n	YEAR * 10\n];\nconst $SCALES = [\n	.05,\n	.1,\n	.2,\n	.25,\n	.5,\n	.8,\n	1,\n	2,\n	5\n];\nconst OVERLAY_COLORS = [\n	\"#42b28a\",\n	\"#5691ce\",\n	\"#612ff9\",\n	\"#d50b90\",\n	\"#ff2316\"\n];\nconst ChartConfig = {\n	SBMIN: 60,\n	SBMAX: Infinity,\n	TOOLBAR: 57,\n	RIGHTBAR: 250,\n	TB_ICON: 25,\n	TB_ITEM_M: 6,\n	TB_ICON_BRI: 1,\n	TB_ICON_HOLD: 420,\n	TB_BORDER: 1,\n	TB_B_STYLE: \"dotted\",\n	TOOL_COLL: 7,\n	EXPAND: .15,\n	CANDLEW: .6,\n	GRIDX: 100,\n	GRIDY: 47,\n	BOTBAR: 28,\n	PANHEIGHT: 22,\n	DEFAULT_LEN: 50,\n	MINIMUM_LEN: 5,\n	MIN_ZOOM: 25,\n	MAX_ZOOM: 1e3,\n	VOLSCALE: .15,\n	UX_OPACITY: .9,\n	ZOOM_MODE: \"tv\",\n	L_BTN_SIZE: 21,\n	L_BTN_MARGIN: \"-6px 0 -6px 0\",\n	SCROLL_WHEEL: \"prevent\"\n};\nChartConfig.FONT = `11px -apple-system,BlinkMacSystemFont,\n    Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,\n    Fira Sans,Droid Sans,Helvetica Neue,\n    sans-serif`;\nvar constants_default = {\n	DEF_LIMIT: DEF_LIMIT$3,\n	BUF_INC: BUF_INC$2,\n	FDEFS: FDEFS$1,\n	FDEFS1: FDEFS1$1,\n	FDEFS2: FDEFS2$1,\n	SBRACKETS: SBRACKETS$1,\n	TFSTR: TFSTR$1,\n	SECOND,\n	MINUTE,\n	MINUTE5,\n	MINUTE15,\n	MINUTE30,\n	HOUR,\n	HOUR4,\n	DAY,\n	WEEK,\n	MONTH,\n	YEAR,\n	MONTHMAP,\n	TIMESCALES,\n	$SCALES,\n	ChartConfig,\n	map_unit: {\n		\"1s\": SECOND,\n		\"5s\": SECOND * 5,\n		\"10s\": SECOND * 10,\n		\"20s\": SECOND * 20,\n		\"30s\": SECOND * 30,\n		\"1m\": MINUTE,\n		\"3m\": MINUTE3,\n		\"5m\": MINUTE5,\n		\"15m\": MINUTE15,\n		\"30m\": MINUTE30,\n		\"1H\": HOUR,\n		\"2H\": HOUR * 2,\n		\"3H\": HOUR * 3,\n		\"4H\": HOUR4,\n		\"6H\": HOUR * 6,\n		\"8H\": HOUR * 8,\n		\"12H\": HOUR12,\n		\"1h\": HOUR,\n		\"2h\": HOUR * 2,\n		\"3h\": HOUR * 3,\n		\"4h\": HOUR4,\n		\"6h\": HOUR * 6,\n		\"8h\": HOUR * 8,\n		\"12h\": HOUR12,\n		\"1D\": DAY,\n		\"1d\": DAY,\n		\"1W\": WEEK,\n		\"1w\": WEEK,\n		\"1M\": MONTH,\n		\"1Y\": YEAR\n	},\n	IB_TF_WARN: \"When using IB mode you should specify timeframe ('tf' filed in 'chart' object),otherwise you can get an unexpected behaviour\",\n	OVERLAY_COLORS\n};\n//#endregion\n//#region src/helpers/script_utils.js\nconst { BUF_INC: BUF_INC$1, FDEFS, SBRACKETS, TFSTR } = constants_default;\nlet tf_cache = {};\nfunction f_args(src) {\n	FDEFS.lastIndex = 0;\n	let m = FDEFS.exec(src);\n	if (m) {\n		m[1].trim();\n		m[2].trim();\n		return m[3].trim().split(\",\").map((x) => x.trim());\n	}\n	return [];\n}\nfunction f_body(src) {\n	return src.slice(src.indexOf(\"{\") + 1, src.lastIndexOf(\"}\"));\n}\nfunction wrap_idxs(src, pre = \"\") {\n	SBRACKETS.lastIndex = 0;\n	let changed = false;\n	let m;\n	do {\n		m = SBRACKETS.exec(src);\n		if (m) {\n			let vname = m[1].trim();\n			let vindex = m[2].trim();\n			if (vindex === \"0\" || parseInt(vindex) < BUF_INC$1) continue;\n			switch (vname) {\n				case \"let\":\n				case \"var\":\n				case \"return\": continue;\n			}\n			let wrap = `${vname}[${pre}_i(${vindex}, ${vname})]`;\n			src = src.replace(m[0], wrap);\n			changed = true;\n		}\n	} while (m);\n	return changed ? src : src;\n}\nfunction make_module_lib(mod) {\n	let lib = {};\n	for (let k in mod) {\n		if (k === \"main\" || k === \"id\") continue;\n		let a = f_args(mod[k]);\n		lib[k] = new Function(a, f_body(mod[k]));\n	}\n	return lib;\n}\nfunction get_raw_src(f) {\n	if (typeof f === \"string\") return f;\n	let src = f.toString();\n	return src.slice(src.indexOf(\"{\") + 1, src.lastIndexOf(\"}\"));\n}\nfunction tf_from_pair(num, pf) {\n	let mult = 1;\n	switch (pf) {\n		case \"s\":\n			mult = constants_default.SECOND;\n			break;\n		case \"m\":\n			mult = constants_default.MINUTE;\n			break;\n		case \"H\":\n			mult = constants_default.HOUR;\n			break;\n		case \"D\":\n			mult = constants_default.DAY;\n			break;\n		case \"W\":\n			mult = constants_default.WEEK;\n			break;\n		case \"M\":\n			mult = constants_default.MONTH;\n			break;\n		case \"Y\":\n			mult = constants_default.YEAR;\n			break;\n	}\n	return parseInt(num) * mult;\n}\nfunction tf_from_str(str) {\n	if (typeof str === \"number\") return str;\n	if (tf_cache[str]) return tf_cache[str];\n	TFSTR.lastIndex = 0;\n	let m = TFSTR.exec(str);\n	if (m) {\n		tf_cache[str] = tf_from_pair(m[1], m[2]);\n		return tf_cache[str];\n	}\n}\nfunction get_fn_id(pre, id) {\n	return pre + \"-\" + id.split(\"<-\").pop();\n}\nfunction ovf(obj, f) {\n	let nw = {};\n	for (let id in obj) {\n		nw[id] = {};\n		for (let k in obj[id]) {\n			if (k === \"data\") continue;\n			nw[id][k] = obj[id][k];\n		}\n		nw[id].data = f(obj[id].data);\n	}\n	return nw;\n}\nfunction nextt(data, t, ti = 0) {\n	let i0 = 0;\n	let iN = data.length - 1;\n	let mid;\n	while (i0 <= iN) {\n		mid = Math.floor((i0 + iN) / 2);\n		if (data[mid][ti] === t) return mid;\n		else if (data[mid][ti] < t) i0 = mid + 1;\n		else iN = mid - 1;\n	}\n	return t < data[mid][ti] ? mid : mid + 1;\n}\nlet _dssSizeCache = {\n	key: \"\",\n	bytes: 0\n};\nfunction size_of_dss(data) {\n	let keyParts = [];\n	for (let id in data) if (data[id].data) keyParts.push(id + \":\" + data[id].data.length);\n	let key = keyParts.join(\",\");\n	if (key === _dssSizeCache.key) return _dssSizeCache.bytes;\n	let bytes = 0;\n	for (let id in data) if (data[id].data && data[id].data[0]) {\n		let s0 = size_of(data[id].data[0]);\n		bytes += s0 * data[id].data.length;\n	}\n	_dssSizeCache = {\n		key,\n		bytes\n	};\n	return bytes;\n}\nfunction size_of(object) {\n	let list = [], stack = [object], bytes = 0;\n	while (stack.length) {\n		let value = stack.pop();\n		let type = typeof value;\n		if (type === \"boolean\") bytes += 4;\n		else if (type === \"string\") bytes += value.length * 2;\n		else if (type === \"number\") bytes += 8;\n		else if (type === \"object\" && list.indexOf(value) === -1) {\n			list.push(value);\n			for (let i in value) stack.push(value[i]);\n		}\n	}\n	return bytes;\n}\nfunction update(data, val) {\n	const i = data.length - 1;\n	const last = data[i];\n	if (!last || val[0] > last[0]) data.push(val);\n	else data[i] = val;\n}\n//#endregion\n//#region src/helpers/std/math.js\nvar math_default = {\n	/** Absolute value\n	* @param {number} x - Input\n	* @return {number} - Absolute value\n	*/\n	abs(x) {\n		return Math.abs(x);\n	},\n	/** Arccosine function\n	* @param {number} x - Input\n	* @return {number} - Arccosine of x\n	*/\n	acos(x) {\n		return Math.acos(x);\n	},\n	/** Arcsine function\n	* @param {number} x - Input\n	* @return {number} - Arcsine of x\n	*/\n	asin(x) {\n		return Math.asin(x);\n	},\n	/** Arctangent function\n	* @param {number} x - Input\n	* @return {number} - Arctangent of x\n	*/\n	atan(x) {\n		return Math.atan(x);\n	},\n	/** Shortcut for Math.ceil()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	ceil(x) {\n		return Math.ceil(x);\n	},\n	/** Cosine function\n	* @param {number} x - Input\n	* @return {number} - Cosine of x\n	*/\n	cos(x) {\n		return Math.cos(x);\n	},\n	/** Shortcut for Math.exp()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	exp(x) {\n		return Math.exp(x);\n	},\n	/** Shortcut for Math.floor()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	floor(x) {\n		return Math.floor(x);\n	},\n	/** Shortcut for Math.log()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	log(x) {\n		return Math.log(x);\n	},\n	/** Shortcut for Math.log10()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	log10(x) {\n		return Math.log10(x);\n	},\n	/** Shortcut for Math.pow()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	pow(x, y) {\n		return Math.pow(x, y);\n	},\n	/** Shortcut for Math.round()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	round(x) {\n		return Math.round(x);\n	},\n	/** Shortcut for Math.sign()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	sign(x) {\n		return Math.sign(x);\n	},\n	/** Sine function\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	sin(x) {\n		return Math.sin(x);\n	},\n	/** Shortcut for Math.sqrt()\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	sqrt(x) {\n		return Math.sqrt(x);\n	},\n	/** Tangent function\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	tan(x) {\n		return Math.tan(x);\n	}\n};\n//#endregion\n//#region src/helpers/std/time.js\nvar time_default = {\n	/** Day of month, literally\n	* @param {number} [time] - Time in ms (current t, if not defined)\n	* @return {number} - Day\n	*/\n	dayofmonth(time) {\n		return new Date(time || state.t).getUTCDate();\n	},\n	/** Day of week, literally\n	* @param {number} [time] - Time in ms (current t, if not defined)\n	* @return {number} - Day\n	*/\n	dayofweek(time) {\n		return new Date(time || state.t).getUTCDay() + 1;\n	},\n	/** Returns hours of a given timestamp\n	* @param {number} [time] - Time in ms (current t, if not defined)\n	* @return {number} - Hour\n	*/\n	hour(time) {\n		return new Date(time || state.t).getUTCHours();\n	},\n	/** Returns minutes of a given timestamp\n	* @param {number} [time] - Time in ms (current t, if not defined)\n	* @return {number} - Minute\n	*/\n	minute(time) {\n		return new Date(time || state.t).getUTCMinutes();\n	},\n	/** Month\n	* @param {number} [time] - Time in ms (current t, if not defined)\n	* @return {number} - Month\n	*/\n	month(time) {\n		return new Date(time || state.t).getUTCMonth();\n	},\n	/** The current time\n	* @return {number} - timestamp\n	*/\n	now() {\n		return Date.now();\n	},\n	/** Returns seconds of a given timestamp\n	* @param {number} [time] - Time in ms (current t, if not defined)\n	* @return {number} - Second\n	*/\n	second(time) {\n		return new Date(time || state.t).getUTCSeconds();\n	},\n	/** Week of year, literally\n	* @param {number} [time] - Time in ms (current t, if not defined)\n	* @return {number} - Week\n	*/\n	weekofyear(time) {\n		let date = new Date(time || state.t);\n		date.setUTCHours(0, 0, 0, 0);\n		date.setDate(date.getUTCDate() + 3 - (date.getUTCDay() + 6) % 7);\n		let week1 = new Date(date.getUTCFullYear(), 0, 4);\n		return 1 + Math.round(((date - week1) / 864e5 - 3 + (week1.getUTCDay() + 6) % 7) / 7);\n	},\n	/** Year\n	* @param {number} [time] - Time in ms (current t, if not defined)\n	* @return {number} - Year\n	*/\n	year(time) {\n		return new Date(time || state.t).getUTCFullYear();\n	}\n};\n//#endregion\n//#region src/helpers/std/chart.js\nvar chart_default = {\n	chart() {},\n	/** Display data point onchart\n	* (create a new overlay in DataCube)\n	* @param {(TS|TS[]|*)} x - Data point / TS / array of TS\n	* @param {string} [name] - Overlay name\n	* @param {Object} [sett] - Object with settings & OV type\n	*/\n	onchart(x, name, sett = {}, _id) {\n		let off = 0;\n		name = name || get_fn_id(\"Onchart\", _id);\n		if (x && x.__id__) {\n			off = x.__offset__ || 0;\n			x = x[0];\n		}\n		if (Array.isArray(x) && x[0] && x[0].__id__) {\n			off = x[0].__offset__ || 0;\n			x = x.map((x) => x[0]);\n		}\n		if (!this.env.onchart[name]) {\n			let type = sett.type;\n			delete sett.type;\n			sett.$synth = true;\n			sett.skipNaN = true;\n			let post = Array.isArray(x) ? \"s\" : \"\";\n			this.env.onchart[name] = {\n				name,\n				type: type || \"Spline\" + post,\n				data: [],\n				settings: sett,\n				scripts: false,\n				grid: sett.grid || {}\n			};\n		}\n		off *= state.tf;\n		let v = Array.isArray(x) ? [state.t + off, ...x] : [state.t + off, x];\n		update(this.env.onchart[name].data, v);\n	},\n	/** Display data point offchart\n	* (create a new overlay in DataCube)\n	* @param {(TS|TS[]|*)} x - Data point / TS / array of TS\n	* @param {string} [name] - Overlay name\n	* @param {Object} [sett] - Object with settings & OV type\n	*/\n	offchart(x, name, sett = {}, _id) {\n		name = name || get_fn_id(\"Offchart\", _id);\n		let off = 0;\n		if (x && x.__id__) {\n			off = x.__offset__ || 0;\n			x = x[0];\n		}\n		if (Array.isArray(x) && x[0] && x[0].__id__) {\n			off = x[0].__offset__ || 0;\n			x = x.map((x) => x[0]);\n		}\n		if (!this.env.offchart[name]) {\n			let type = sett.type;\n			delete sett.type;\n			sett.$synth = true;\n			sett.skipNaN = true;\n			let post = Array.isArray(x) ? \"s\" : \"\";\n			this.env.offchart[name] = {\n				name,\n				type: type || \"Spline\" + post,\n				data: [],\n				settings: sett,\n				scripts: false,\n				grid: sett.grid || {}\n			};\n		}\n		off *= state.tf;\n		let v = Array.isArray(x) ? [state.t + off, ...x] : [state.t + off, x];\n		update(this.env.offchart[name].data, v);\n	},\n	/** Returns true when the candle(<tf>) is being closed\n	* @param {(number|string)} tf - Timeframe in ms or as a string\n	* @return {boolean}\n	*/\n	onclose(tf) {\n		if (!this.env.shared.onclose) return false;\n		if (!tf) tf = state.tf;\n		return (state.t + state.tf) % tf_from_str(tf) === 0;\n	},\n	/** Emits an event to DataCube\n	* @param {string} type - Signal type\n	* @param {*} data - Signal data\n	*/\n	signal(type, data = {}) {\n		if (state.shared.event !== \"update\") return;\n		state.send(\"script-signal\", {\n			type,\n			data\n		});\n	},\n	/** Emits an event if cond === true\n	* @param {(boolean|TS)} cond - The condition\n	* @param {string} type - Signal type\n	* @param {*} data - Signal data\n	*/\n	signalif(cond, type, data = {}) {\n		if (state.shared.event !== \"update\") return;\n		if (cond && cond.__id__) cond = cond[0];\n		if (cond) state.send(\"script-signal\", {\n			type,\n			data\n		});\n	},\n	/** Sends update to some overlay / main chart\n	* @param {string} id - Overlay id\n	* @param {Object} fields - Fields to be overwritten\n	*/\n	modify(id, fields) {\n		state.send(\"modify-overlay\", {\n			uuid: id,\n			fields\n		});\n	},\n	/** Sends settings update\n	* (can be called from init(), update() or post())\n	* @param {Object} upd - Settings update (object to merge)\n	*/\n	settings(upd) {\n		this.env.send_modify({ settings: upd });\n		Object.assign(this.env.src.sett, upd);\n	}\n};\n//#endregion\n//#region src/helpers/std/utils.js\nvar utils_default$1 = {\n	/** Replaces the variable if it's NaN\n	* @param {*} x - The variable\n	* @param {*} [v] - A value to replace with\n	* @return {*} - New value\n	*/\n	nz(x, v) {\n		if (x == void 0 || x !== x) return v || 0;\n		return x;\n	},\n	/** Is the variable NaN ?\n	* @param {*} x - The variable\n	* @return {boolean} - New value\n	*/\n	na(x) {\n		return x == void 0 || x !== x;\n	},\n	/** Replaces the var with NaN if Infinite\n	* @param {*} x - The variable\n	* @param {*} [v] - A value to replace with\n	* @return {*} - New value\n	*/\n	nf(x, v) {\n		if (!isFinite(x)) return v !== void 0 ? v : NaN;\n		return x;\n	},\n	/** Converts the variable to Boolean\n	* @param {number} x The variable\n	* @return {number}\n	*/\n	bool(x) {\n		return !!x;\n	},\n	/** Returns x or y depending on the condition\n	* @param {(boolean|TS)} cond - Condition\n	* @param {*} x - First value\n	* @param {*} y - Second value\n	* @return {*}\n	*/\n	iff(cond, x, y) {\n		if (cond && cond.__id__) cond = cond[0];\n		return cond ? x : y;\n	},\n	/** Sets the reverse buffer size for a given\n	* time-series (default = 5, grows on demand)\n	* @param {TS} src - Input\n	* @param {number} len - New length\n	*/\n	buffsize(src, len) {\n		src.__len__ = len;\n	},\n	/** For a given series replaces NaN values with\n	* previous nearest non-NaN value\n	* @param {TS} src - Input time-series\n	* @return {TS}\n	*/\n	fixnan(src) {\n		if (this.na(src[0])) {\n			for (var i = 1; i < src.length; i++) if (!this.na(src[i])) {\n				src[0] = src[i];\n				break;\n			}\n		}\n		return src;\n	},\n	/** Shifts TS left or right by \"num\" candles\n	* @param {number} num - Offset measured in candles\n	* @return {TS} - New / existing time-series\n	*/\n	offset(src, num, _id) {\n		if (src.__id__) {\n			src.__offset__ = num;\n			return src;\n		}\n		let id = this._tsid(_id, `offset(${num})`);\n		let out = this.ts(src, id);\n		out.__offset__ = num;\n		return out;\n	}\n};\n//#endregion\n//#region src/helpers/std/analysis.js\nvar analysis_default = {\n	/** Adds values / time-series\n	* @param {(TS|*)} x - First input\n	* @param {(TS|*)} y - Second input\n	* @return {TS} - New time-series\n	*/\n	add(x, y, _id) {\n		let id = this._tsid(_id, `add`);\n		let x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;\n		let y0 = this.na(y) ? NaN : y.__id__ ? y[0] : y;\n		return this.ts(x0 + y0, id, x.__tf__);\n	},\n	/** Subtracts values / time-series\n	* @param {(TS|*)} x - First input\n	* @param {(TS|*)} y - Second input\n	* @return {TS} - New time-series\n	*/\n	sub(x, y, _id) {\n		let id = this._tsid(_id, `sub`);\n		let x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;\n		let y0 = this.na(y) ? NaN : y.__id__ ? y[0] : y;\n		return this.ts(x0 - y0, id, x.__tf__);\n	},\n	/** Multiplies values / time-series\n	* @param {(TS|*)} x - First input\n	* @param {(TS|*)} y - Second input\n	* @return {TS} - New time-series\n	*/\n	mult(x, y, _id) {\n		let id = this._tsid(_id, `mult`);\n		let x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;\n		let y0 = this.na(y) ? NaN : y.__id__ ? y[0] : y;\n		return this.ts(x0 * y0, id, x.__tf__);\n	},\n	/** Divides values / time-series\n	* @param {(TS|*)} x - First input\n	* @param {(TS|*)} y - Second input\n	* @return {TS} - New time-series\n	*/\n	div(x, y, _id) {\n		let id = this._tsid(_id, `div`);\n		let x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;\n		let y0 = this.na(y) ? NaN : y.__id__ ? y[0] : y;\n		return this.ts(x0 / y0, id, x.__tf__);\n	},\n	/** Returns a negative value / time-series\n	* @param {(TS|*)} x - Input\n	* @return {TS} - New time-series\n	*/\n	neg(x, _id) {\n		let id = this._tsid(_id, `neg`);\n		let x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;\n		return this.ts(-x0, id, x.__tf__);\n	},\n	/** Average of arguments\n	* @param {...number} args - Numeric values\n	* @return {number}\n	*/\n	avg(...args) {\n		args.pop();\n		let sum = 0;\n		for (var i = 0; i < args.length; i++) sum += args[i];\n		return sum / args.length;\n	},\n	/** Max of arguments\n	* @param {...number} args - Numeric values\n	* @return {number}\n	*/\n	max(...args) {\n		args.pop();\n		return Math.max(...args);\n	},\n	/** Min of arguments\n	* @param {...number} args - Numeric values\n	* @return {number}\n	*/\n	min(...args) {\n		args.pop();\n		return Math.min(...args);\n	},\n	/** Change: x[0] - x[len]\n	* @param {TS} src - Input\n	* @param {number} [len] - Length\n	* @return {TS} - New time-series\n	*/\n	change(src, len = 1, _id) {\n		let id = this._tsid(_id, `change(${len})`);\n		return this.ts(src[0] - src[len], id, src.__tf__);\n	},\n	/** When one time-series crosses another\n	* @param {TS} src1 - TS1\n	* @param {TS} src2 - TS2\n	* @return {TS} - New time-series\n	*/\n	cross(src1, src2, _id) {\n		let id = this._tsid(_id, `cross`);\n		let x = src1[0] > src2[0] !== src1[1] > src2[1];\n		return this.ts(x, id, src1.__tf__);\n	},\n	/** When one time-series goes over another one\n	* @param {TS} src1 - TS1\n	* @param {TS} src2 - TS2\n	* @return {TS} - New time-series\n	*/\n	crossover(src1, src2, _id) {\n		let id = this._tsid(_id, `crossover`);\n		let x = src1[0] > src2[0] && src1[1] <= src2[1];\n		return this.ts(x, id, src1.__tf__);\n	},\n	/** When one time-series goes under another one\n	* @param {TS} src1 - TS1\n	* @param {TS} src2 - TS2\n	* @return {TS} - New time-series\n	*/\n	crossunder(src1, src2, _id) {\n		let id = this._tsid(_id, `crossunder`);\n		let x = src1[0] < src2[0] && src1[1] >= src2[1];\n		return this.ts(x, id, src1.__tf__);\n	},\n	/** Sum of all elements of src\n	* @param {TS} src1 - Input\n	* @return {TS} - New time-series\n	*/\n	cum(src, _id) {\n		let id = this._tsid(_id, `cum`);\n		let res = this.ts(0, id, src.__tf__);\n		res[0] = this.nz(src[0]) + this.nz(res[1]);\n		return res;\n	},\n	/** Test if \"src\" TS is falling for \"len\" candles\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	falling(src, len, _id) {\n		let id = this._tsid(_id, `falling(${len})`);\n		let bot = src[0];\n		for (var i = 1; i < len + 1; i++) if (bot >= src[i]) return this.ts(false, id, src.__tf__);\n		return this.ts(true, id, src.__tf__);\n	},\n	/** Test if \"src\" TS is rising for \"len\" candles\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	rising(src, len, _id) {\n		let id = this._tsid(_id, `rising(${len})`);\n		let top = src[0];\n		for (var i = 1; i < len + 1; i++) if (top <= src[i]) return this.ts(false, id, src.__tf__);\n		return this.ts(true, id, src.__tf__);\n	},\n	/** Highest value for a given number of candles back\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	highest(src, len, _id) {\n		let id = this._tsid(_id, `highest(${len})`);\n		let high = -Infinity;\n		for (var i = 0; i < len; i++) if (src[i] > high) high = src[i];\n		return this.ts(high, id, src.__tf__);\n	},\n	/** Highest value offset for a given number of bars back\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	*/\n	highestbars(src, len, _id) {\n		let id = this._tsid(_id, `highestbars(${len})`);\n		let high = -Infinity;\n		let hi = 0;\n		for (var i = 0; i < len; i++) if (src[i] > high) high = src[i], hi = i;\n		return this.ts(-hi, id, src.__tf__);\n	},\n	/** Lowest value for a given number of candles back\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	lowest(src, len, _id) {\n		let id = this._tsid(_id, `lowest(${len})`);\n		let low = Infinity;\n		for (var i = 0; i < len; i++) if (src[i] < low) low = src[i];\n		return this.ts(low, id, src.__tf__);\n	},\n	/** Lowest value offset for a given number of bars back\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	*/\n	lowestbars(src, len, _id) {\n		let id = this._tsid(_id, `lowestbars(${len})`);\n		let low = Infinity;\n		let li = 0;\n		for (var i = 0; i < len; i++) if (src[i] < low) low = src[i], li = i;\n		return this.ts(-li, id, src.__tf__);\n	},\n	/** Momentum\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	mom(src, len, _id) {\n		let id = this._tsid(_id, `mom(${len})`);\n		return this.ts(src[0] - src[len], id, src.__tf__);\n	},\n	/** Returns price of the pivot high point\n	* Tip: works best with `offset` function\n	* @param {TS} src - Input\n	* @param {number} left - left threshold, candles\n	* @param {number} right - right threshold, candles\n	* @return {TS} - New time-series\n	*/\n	pivothigh(src, left, right, _id) {\n		let id = this._tsid(_id, `pivothigh(${left},${right})`);\n		let len = left + right + 1;\n		let top = src[right];\n		for (var i = 0; i < len; i++) if (top <= src[i] && i !== right) return this.ts(NaN, id, src.__tf__);\n		return this.ts(top, id, src.__tf__);\n	},\n	/** Returns price of the pivot low point\n	* Tip: works best with `offset` function\n	* @param {TS} src - Input\n	* @param {number} left - left threshold, candles\n	* @param {number} right - right threshold, candles\n	* @return {TS} - New time-series\n	*/\n	pivotlow(src, left, right, _id) {\n		let id = this._tsid(_id, `pivotlow(${left},${right})`);\n		let len = left + right + 1;\n		let bot = src[right];\n		for (var i = 0; i < len; i++) if (bot >= src[i] && i !== right) return this.ts(NaN, id, src.__tf__);\n		return this.ts(bot, id, src.__tf__);\n	},\n	/** Candles since the event occured (cond === true)\n	* @param {(boolean|TS)} cond - the condition\n	*/\n	since(cond, _id) {\n		let id = this._tsid(_id, `since()`);\n		if (cond && cond.__id__) cond = cond[0];\n		let s = this.ts(void 0, id);\n		s[0] = cond ? 0 : this.nz(s[1], 0) + 1;\n		return s;\n	},\n	/** Returns the sliding sum of last \"len\" values of the source\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	sum(src, len, _id) {\n		let id = this._tsid(_id, `sum(${len})`);\n		let sum = 0;\n		for (var i = 0; i < len; i++) sum = sum + src[i];\n		return this.ts(sum, id, src.__tf__);\n	}\n};\n//#endregion\n//#region src/stuff/linreg.js\n/**\n* Simple linear regression\n*\n* @param {Array.<number>} data\n* @return {Function}\n*/\nfunction regression(data, len, offset) {\n	data = data.slice(0, len).reverse().map((x, i) => [i, x]);\n	let sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0, count = 0, m, b;\n	for (let i = 0, len = data.length; i < len; i++) {\n		if (!data[i]) return NaN;\n		let point = data[i];\n		sum_x += point[0];\n		sum_y += point[1];\n		sum_xx += point[0] * point[0];\n		sum_xy += point[0] * point[1];\n		count++;\n	}\n	m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);\n	b = sum_y / count - m * sum_x / count;\n	return m * (data.length - 1 - offset) + b;\n}\n//#endregion\n//#region src/helpers/std/indicators.js\nvar indicators_default = {\n	/** Arnaud Legoux Moving Average\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @param {number} offset - Offset\n	* @param {number} sigma - Sigma\n	* @return {TS} - New time-series\n	*/\n	alma(src, len, offset, sigma, _id) {\n		let id = this._tsid(_id, `alma(${len},${offset},${sigma})`);\n		let m = Math.floor(offset * (len - 1));\n		let s = len / sigma;\n		let norm = 0;\n		let sum = 0;\n		for (let i = 0; i < len; i++) {\n			let w = Math.exp(-1 * Math.pow(i - m, 2) / (2 * Math.pow(s, 2)));\n			norm = norm + w;\n			sum = sum + src[len - i - 1] * w;\n		}\n		return this.ts(sum / norm, id, src.__tf__);\n	},\n	/** Average True Range\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	atr(len, _id, _tf) {\n		let tfs = _tf || \"\";\n		let id = this._tsid(_id, `atr(${len})`);\n		let high = this.env.shared[`high${tfs}`];\n		let low = this.env.shared[`low${tfs}`];\n		let close = this.env.shared[`close${tfs}`];\n		let tr = this.ts(0, id, _tf);\n		tr[0] = this.na(high[1]) ? high[0] - low[0] : Math.max(Math.max(high[0] - low[0], Math.abs(high[0] - close[1])), Math.abs(low[0] - close[1]));\n		return this.rma(tr, len, id);\n	},\n	/** Bollinger Bands\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @param {number} mult - Multiplier\n	* @return {TS[]} - Array of new time-series (3 bands)\n	*/\n	bb(src, len, mult, _id) {\n		let id = this._tsid(_id, `bb(${len},${mult})`);\n		let basis = this.sma(src, len, id);\n		let dev = this.stdev(src, len, id)[0] * mult;\n		return [\n			basis,\n			this.ts(basis[0] + dev, id + \"1\", src.__tf__),\n			this.ts(basis[0] - dev, id + \"2\", src.__tf__)\n		];\n	},\n	/** Bollinger Bands Width\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @param {number} mult - Multiplier\n	* @return {TS} - New time-series\n	*/\n	bbw(src, len, mult, _id) {\n		let id = this._tsid(_id, `bbw(${len},${mult})`);\n		let basis = this.sma(src, len, id)[0];\n		let dev = this.stdev(src, len, id)[0] * mult;\n		return this.ts(basis === 0 ? NaN : 2 * dev / basis, id, src.__tf__);\n	},\n	/** Commodity Channel Index\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	cci(src, len, _id) {\n		let id = this._tsid(_id, `cci(${len})`);\n		let ma = this.sma(src, len, id);\n		let dev = this.dev(src, len, id);\n		let cci = dev[0] === 0 ? NaN : (src[0] - ma[0]) / (.015 * dev[0]);\n		return this.ts(cci, id, src.__tf__);\n	},\n	/** Chande Momentum Oscillator\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	cmo(src, len, _id) {\n		let id = this._tsid(_id, `cmo(${len})`);\n		let mom = this.change(src, 1, id);\n		let g = this.ts(mom[0] >= 0 ? mom[0] : 0, id + \"g\", src.__tf__);\n		let l = this.ts(mom[0] >= 0 ? 0 : -mom[0], id + \"l\", src.__tf__);\n		let sm1 = this.sum(g, len, id + \"1\")[0];\n		let sm2 = this.sum(l, len, id + \"2\")[0];\n		return this.ts(sm1 + sm2 === 0 ? NaN : 100 * (sm1 - sm2) / (sm1 + sm2), id, src.__tf__);\n	},\n	/** Center of Gravity\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	cog(src, len, _id) {\n		let id = this._tsid(_id, `cog(${len})`);\n		let sum = this.sum(src, len, id)[0];\n		let num = 0;\n		for (let i = 0; i < len; i++) num += src[i] * (i + 1);\n		return this.ts(sum === 0 ? NaN : -num / sum, id, src.__tf__);\n	},\n	/** Deviation from SMA\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	dev(src, len, _id) {\n		let id = this._tsid(_id, `dev(${len})`);\n		let mean = this.sma(src, len, id)[0];\n		let sum = 0;\n		for (let i = 0; i < len; i++) sum += Math.abs(src[i] - mean);\n		return this.ts(sum / len, id, src.__tf__);\n	},\n	/** Directional Movement Index ADX, +DI, -DI\n	* @param {number} len - Length\n	* @param {number} smooth - Smoothness\n	* @return {TS} - New time-series\n	*/\n	dmi(len, smooth, _id, _tf) {\n		let id = this._tsid(_id, `dmi(${len},${smooth})`);\n		let tfs = _tf || \"\";\n		let high = this.env.shared[`high${tfs}`];\n		let low = this.env.shared[`low${tfs}`];\n		let up = this.change(high, 1, id + \"1\")[0];\n		let down = this.neg(this.change(low, 1, id + \"2\"), id)[0];\n		let plusDM = this.ts(100 * (this.na(up) ? NaN : up > down && up > 0 ? up : 0), id + \"3\", _tf);\n		let minusDM = this.ts(100 * (this.na(down) ? NaN : down > up && down > 0 ? down : 0), id + \"4\", _tf);\n		let trur = this.rma(this.tr(false, id, _tf), len, id + \"5\");\n		let plus = this.div(this.rma(plusDM, len, id + \"6\"), trur, id + \"8\");\n		let minus = this.div(this.rma(minusDM, len, id + \"7\"), trur, id + \"9\");\n		let sum = this.add(plus, minus, id + \"10\")[0];\n		return [\n			this.rma(this.ts(100 * Math.abs(plus[0] - minus[0]) / (sum === 0 ? 1 : sum), id + \"11\", _tf), smooth, id + \"12\"),\n			plus,\n			minus\n		];\n	},\n	/** Exponential Moving Average with alpha = 2 / (y + 1)\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	ema(src, len, _id) {\n		let id = this._tsid(_id, `ema(${len})`);\n		let a = 2 / (len + 1);\n		let ema = this.ts(0, id, src.__tf__);\n		ema[0] = this.na(ema[1]) ? this.sma(src, len, id)[0] : a * src[0] + (1 - a) * this.nz(ema[1]);\n		return ema;\n	},\n	/** Hull Moving Average\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	hma(src, len, _id) {\n		let id = this._tsid(_id, `hma(${len})`);\n		let len2 = Math.floor(len / 2);\n		let len3 = Math.round(Math.sqrt(len));\n		let a = this.mult(this.wma(src, len2, id + \"1\"), 2, id);\n		let b = this.wma(src, len, id + \"2\");\n		let delt = this.sub(a, b, id + \"3\");\n		return this.wma(delt, len3, id + \"4\");\n	},\n	/** Keltner Channels\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @param {number} mult - Multiplier\n	* @param {boolean} [use_tr] - Use true range\n	* @return {TS[]} - Array of new time-series (3 bands)\n	*/\n	kc(src, len, mult, use_tr = true, _id, _tf) {\n		let id = this._tsid(_id, `kc(${len},${mult},${use_tr})`);\n		let tfs = _tf || \"\";\n		let high = this.env.shared[`high${tfs}`];\n		let low = this.env.shared[`low${tfs}`];\n		let basis = this.ema(src, len, id + \"1\");\n		let range = use_tr ? this.tr(false, id + \"2\", _tf) : this.ts(high[0] - low[0], id + \"3\", src.__tf__);\n		let ema = this.ema(range, len, id + \"4\");\n		return [\n			basis,\n			this.ts(basis[0] + ema[0] * mult, id + \"5\", src.__tf__),\n			this.ts(basis[0] - ema[0] * mult, id + \"6\", src.__tf__)\n		];\n	},\n	/** Keltner Channels Width\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @param {number} mult - Multiplier\n	* @param {boolean} [use_tr] - Use true range\n	* @return {TS} - New time-series\n	*/\n	kcw(src, len, mult, use_tr = true, _id, _tf) {\n		let id = this._tsid(_id, `kcw(${len},${mult},${use_tr})`);\n		let kc = this.kc(src, len, mult, use_tr, `kcw`, _tf);\n		return this.ts(kc[0][0] === 0 ? NaN : (kc[1][0] - kc[2][0]) / kc[0][0], id, src.__tf__);\n	},\n	/** Linear Regression\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @param {number} offset - Offset\n	* @return {TS} - New time-series\n	*/\n	linreg(src, len, offset = 0, _id) {\n		let id = this._tsid(_id, `linreg(${len})`);\n		src.__len__ = Math.max(src.__len__ || 0, len);\n		let lr = regression(src, len, offset);\n		return this.ts(lr, id, src.__tf__);\n	},\n	/** Moving Average Convergence/Divergence\n	* @param {TS} src - Input\n	* @param {number} fast - Fast EMA\n	* @param {number} slow - Slow EMA\n	* @param {number} sig - Signal\n	* @return {TS[]} - [macd, signal, hist]\n	*/\n	macd(src, fast, slow, sig, _id) {\n		let id = this._tsid(_id, `macd(${fast}${slow}${sig})`);\n		let fast_ma = this.ema(src, fast, id + \"1\");\n		let slow_ma = this.ema(src, slow, id + \"2\");\n		let macd = this.sub(fast_ma, slow_ma, id + \"3\");\n		let signal = this.ema(macd, sig, id + \"4\");\n		return [\n			macd,\n			signal,\n			this.sub(macd, signal, id + \"5\")\n		];\n	},\n	/** Money Flow Index\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	mfi(src, len, _id) {\n		let id = this._tsid(_id, `mfi(${len})`);\n		let vol = this.env.shared.vol;\n		let ch = this.change(src, 1, id + \"1\")[0];\n		let ts1 = this.mult(vol, ch <= 0 ? 0 : src[0], id + \"2\");\n		let ts2 = this.mult(vol, ch >= 0 ? 0 : src[0], id + \"3\");\n		let upper = this.sum(ts1, len, id + \"4\");\n		let lower = this.sum(ts2, len, id + \"5\");\n		let res = void 0;\n		if (!this.na(lower)) res = this.rsi(upper, lower, id + \"6\")[0];\n		return this.ts(res, id, src.__tf__);\n	},\n	/** Exponentially MA with alpha = 1 / length\n	* Used in RSI\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	rma(src, len, _id) {\n		let id = this._tsid(_id, `rma(${len})`);\n		let a = len;\n		let sum = this.ts(0, id, src.__tf__);\n		sum[0] = this.na(sum[1]) ? this.sma(src, len, id)[0] : (src[0] + (a - 1) * this.nz(sum[1])) / a;\n		return sum;\n	},\n	/** Rate of Change\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	roc(src, len, _id) {\n		let id = this._tsid(_id, `roc(${len})`);\n		return this.ts(100 * (src[0] - src[len]) / src[len], id, src.__tf__);\n	},\n	/** Relative Strength Index\n	* @param {TS} x - First Input\n	* @param {number|TS} y - Second Input\n	* @return {TS} - New time-series\n	*/\n	rsi(x, y, _id) {\n		let id, rsi;\n		if (!this.na(y) && y.__id__) {\n			id = this._tsid(_id, `rsi(x,y)`);\n			rsi = 100 - 100 / (1 + this.div(x, y, id)[0]);\n		} else {\n			id = this._tsid(_id, `rsi(${y})`);\n			let ch = this.change(x, 1, _id)[0];\n			let pc = this.ts(Math.max(ch, 0), id + \"1\", x.__tf__);\n			let nc = this.ts(-Math.min(ch, 0), id + \"2\", x.__tf__);\n			let up = this.rma(pc, y, id + \"3\")[0];\n			let down = this.rma(nc, y, id + \"4\")[0];\n			rsi = down === 0 ? 100 : up === 0 ? 0 : 100 - 100 / (1 + up / down);\n		}\n		return this.ts(rsi, id + \"5\", x.__tf__);\n	},\n	/** Parabolic SAR\n	* @param {number} start - Start\n	* @param {number} inc - Increment\n	* @param {number} max - Maximum\n	* @return {TS} - New time-series\n	*/\n	sar(start, inc, max, _id, _tf) {\n		let id = this._tsid(_id, `sar(${start},${inc},${max})`);\n		let tfs = _tf || \"\";\n		let high = this.env.shared[`high${tfs}`];\n		let low = this.env.shared[`low${tfs}`];\n		let close = this.env.shared[`close${tfs}`];\n		let minTick = 0;\n		let out = this.ts(void 0, id + \"1\", _tf);\n		let pos = this.ts(void 0, id + \"2\", _tf);\n		let maxMin = this.ts(void 0, id + \"3\", _tf);\n		let acc = this.ts(void 0, id + \"4\", _tf);\n		let n = _tf ? out.__len__ - 1 : state.iter;\n		let prev;\n		let outSet = false;\n		if (n >= 1) {\n			prev = out[1];\n			if (n === 1) {\n				if (close[0] > close[1]) {\n					pos[0] = 1;\n					maxMin[0] = Math.max(high[0], high[1]);\n					prev = Math.min(low[0], low[1]);\n				} else {\n					pos[0] = -1;\n					maxMin[0] = Math.min(low[0], low[1]);\n					prev = Math.max(high[0], high[1]);\n				}\n				acc[0] = start;\n			} else {\n				pos[0] = pos[1];\n				acc[0] = acc[1];\n				maxMin[0] = maxMin[1];\n			}\n			if (pos[0] === 1) {\n				if (high[0] > maxMin[0]) {\n					maxMin[0] = high[0];\n					acc[0] = Math.min(acc[0] + inc, max);\n				}\n				if (low[0] <= prev) {\n					pos[0] = -1;\n					out[0] = maxMin[0];\n					maxMin[0] = low[0];\n					acc[0] = start;\n					outSet = true;\n				}\n			} else {\n				if (low[0] < maxMin[0]) {\n					maxMin[0] = low[0];\n					acc[0] = Math.min(acc[0] + inc, max);\n				}\n				if (high[0] >= prev) {\n					pos[0] = 1;\n					out[0] = maxMin[0];\n					maxMin[0] = high[0];\n					acc[0] = start;\n					outSet = true;\n				}\n			}\n			if (!outSet) {\n				out[0] = prev + acc[0] * (maxMin[0] - prev);\n				if (pos[0] === 1) {\n					if (out[0] >= low[0]) out[0] = low[0] - minTick;\n				}\n				if (pos[0] === -1) {\n					if (out[0] <= high[0]) out[0] = high[0] + minTick;\n				}\n			}\n		}\n		return out;\n	},\n	/** Simple Moving Average\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	sma(src, len, _id) {\n		let id = this._tsid(_id, `sma(${len})`);\n		let sum = 0;\n		for (let i = 0; i < len; i++) sum = sum + src[i];\n		return this.ts(sum / len, id, src.__tf__);\n	},\n	/** Standard deviation\n	* @param {TS} src - Input\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	stdev(src, len, _id) {\n		let sumf = (x, y) => {\n			return x + y;\n		};\n		let id = this._tsid(_id, `stdev(${len})`);\n		let avg = this.sma(src, len, id);\n		let sqd = 0;\n		for (let i = 0; i < len; i++) {\n			let sum = sumf(src[i], -avg[0]);\n			sqd += sum * sum;\n		}\n		return this.ts(Math.sqrt(sqd / len), id, src.__tf__);\n	},\n	/** Stochastic\n	* @param {TS} src - Input\n	* @param {TS} high - TS of high\n	* @param {TS} low - TS of low\n	* @param {number} len - Length\n	* @return {TS} - New time-series\n	*/\n	stoch(src, high, low, len, _id) {\n		let id = this._tsid(_id, `sum(${len})`);\n		let x = 100 * (src[0] - this.lowest(low, len)[0]);\n		let y = this.highest(high, len)[0] - this.lowest(low, len)[0];\n		return this.ts(y === 0 ? NaN : x / y, id, src.__tf__);\n	},\n	/** Supertrend Indicator\n	* @param {number} factor - ATR multiplier\n	* @param {number} atrlen - Length of ATR\n	* @return {TS[]} - Supertrend line and direction of trend\n	*/\n	supertrend(factor, atrlen, _id, _tf) {\n		let id = this._tsid(_id, `supertrend(${factor},${atrlen})`);\n		let tfs = _tf || \"\";\n		let high = this.env.shared[`high${tfs}`];\n		let low = this.env.shared[`low${tfs}`];\n		let close = this.env.shared[`close${tfs}`];\n		let hl2 = (high[0] + low[0]) * .5;\n		let atr = factor * this.atr(atrlen, id + \"1\", _tf)[0];\n		let ls = this.ts(hl2 - atr, id + \"2\", _tf);\n		let ls1 = this.nz(ls[1], ls[0]);\n		ls[0] = close[1] > ls1 ? Math.max(ls[0], ls1) : ls[0];\n		let ss = this.ts(hl2 + atr, id + \"3\", _tf);\n		let ss1 = this.nz(ss[1], ss[0]);\n		ss[0] = close[1] < ss1 ? Math.min(ss[0], ss1) : ss[0];\n		let dir = this.ts(1, id + \"4\", _tf);\n		dir[0] = this.nz(dir[1], dir[0]);\n		dir[0] = dir[0] === -1 && close[0] > ss1 ? 1 : dir[0] === 1 && close[0] < ls1 ? -1 : dir[0];\n		return [this.ts(dir[0] === 1 ? ls[0] : ss[0], id + \"5\", _tf), this.neg(dir, id + \"6\")];\n	},\n	/** Symmetrically Weighted Moving Average\n	* @param {TS} src - Input\n	* @return {TS} - New time-series\n	*/\n	swma(src, _id) {\n		let id = this._tsid(_id, `swma`);\n		let sum = src[3] * this.SWMA[0] + src[2] * this.SWMA[1] + src[1] * this.SWMA[2] + src[0] * this.SWMA[3];\n		return this.ts(sum, id, src.__tf__);\n	},\n	/** True Range\n	* @param {TS} fixnan - Fix NaN values\n	* @return {TS} - New time-series\n	*/\n	tr(fixnan = false, _id, _tf) {\n		let id = this._tsid(_id, `tr(${fixnan})`);\n		let tfs = _tf || \"\";\n		let high = this.env.shared[`high${tfs}`];\n		let low = this.env.shared[`low${tfs}`];\n		let close = this.env.shared[`close${tfs}`];\n		let res = 0;\n		if (this.na(close[1]) && fixnan) res = high[0] - low[0];\n		else res = Math.max(high[0] - low[0], Math.abs(high[0] - close[1]), Math.abs(low[0] - close[1]));\n		return this.ts(res, id, _tf);\n	},\n	/** True strength index\n	* @param {TS} src - Input\n	* @param {number} short - Short length\n	* @param {number} long - Long length\n	* @return {TS} - New time-series\n	*/\n	tsi(src, short, long, _id) {\n		let id = this._tsid(_id, `tsi(${short},${long})`);\n		let m = this.change(src, 1, id + \"0\");\n		let m_abs = this.ts(Math.abs(m[0]), id + \"1\", src.__tf__);\n		let tsi = this.ema(this.ema(m, long, id + \"1\"), short, id + \"2\")[0] / this.ema(this.ema(m_abs, long, id + \"3\"), short, id + \"4\")[0];\n		return this.ts(tsi, id, src.__tf__);\n	},\n	/** Volume Weighted Moving Average\n	* @param {TS} src - Input\n	* @param {number} len - length\n	* @return {TS} - New time-series\n	*/\n	vwma(src, len, _id) {\n		let id = this._tsid(_id, `vwma(${len})`);\n		let vol = this.env.shared.vol;\n		let sxv = this.ts(src[0] * vol[0], id + \"1\", src.__tf__);\n		let res = this.sma(sxv, len, id + \"2\")[0] / this.sma(vol, len, id + \"3\")[0];\n		return this.ts(res, id + \"4\", src.__tf__);\n	},\n	/** Weighted moving average\n	* @param {TS} src - Input\n	* @param {number} len - length\n	* @return {TS} - New time-series\n	*/\n	wma(src, len, _id) {\n		let id = this._tsid(_id, `wma(${len})`);\n		let norm = 0;\n		let sum = 0;\n		for (let i = 0; i < len; i++) {\n			let w = (len - i) * len;\n			norm += w;\n			sum += src[i] * w;\n		}\n		return this.ts(sum / norm, id, src.__tf__);\n	},\n	/** Williams %R\n	* @param {number} len - length\n	* @return {TS} - New time-series\n	*/\n	wpr(len, _id, _tf) {\n		let id = this._tsid(_id, `wpr(${len})`);\n		let tfs = _tf || \"\";\n		let high = this.env.shared[`high${tfs}`];\n		let low = this.env.shared[`low${tfs}`];\n		let close = this.env.shared[`close${tfs}`];\n		let hh = this.highest(high, len, id);\n		let ll = this.lowest(low, len, id);\n		let res = hh[0] - ll[0] === 0 ? NaN : (hh[0] - close[0]) / (hh[0] - ll[0]);\n		return this.ts(-res * 100, id, _tf);\n	}\n};\n//#endregion\n//#region src/helpers/sampler.js\nconst { DEF_LIMIT: DEF_LIMIT$2 } = constants_default;\nfunction sampler_default(T, auto = false) {\n	let Ti = [\n		\"high\",\n		\"low\",\n		\"close\",\n		\"vol\"\n	].indexOf(T);\n	return function(x, t) {\n		let tf = this.__tf__;\n		this.__id__;\n		t = t || script_engine_default.t;\n		let val = auto ? script_engine_default[T][0] : x;\n		if (!this.__t0__ || t >= this.__t0__ + tf) {\n			this.unshift(Ti !== 3 ? val : 0);\n			this.__t0__ = t - t % tf;\n		}\n		switch (Ti) {\n			case 0:\n				if (val > this[0]) this[0] = val;\n				break;\n			case 1:\n				if (val < this[0]) this[0] = val;\n				break;\n			case 2:\n				this[0] = val;\n				break;\n			case 3: this[0] += val;\n		}\n		this.length = this.__len__ || DEF_LIMIT$2;\n	};\n}\n//#endregion\n//#region src/helpers/std/timeseries.js\nconst { BUF_INC } = constants_default;\nvar timeseries_default = {\n	/**\n	* Creates a new time-series & records each x.\n	* Returns an array. Id is auto-generated\n	* @param {*} x - A variable to sample from\n	* @return {TS} - New time-series\n	*/\n	ts(x, _id, _tf) {\n		if (_tf) return this.tstf(x, _tf, _id);\n		let ts = this.env.tss[_id];\n		if (!ts) {\n			ts = this.env.tss[_id] = [x];\n			ts.__id__ = _id;\n		} else ts[0] = x;\n		return ts;\n	},\n	/**\n	* Creates a new time-series & records each x.\n	* Uses Sampler to aggregate the values\n	* Return the an array. Id is auto-generated\n	* @param {*} x - A variable to sample from\n	* @param {(number|string)} tf - Timeframe in ms or as a string\n	* @return {TS} - New time-series\n	*/\n	tstf(x, tf, _id) {\n		let ts = this.env.tss[_id];\n		if (!ts) {\n			ts = this.env.tss[_id] = [x];\n			ts.__id__ = _id;\n			ts.__tf__ = tf_from_str(tf);\n			ts.__fn__ = sampler_default(\"close\").bind(ts);\n		} else ts.__fn__(x);\n		return ts;\n	},\n	/**\n	* Creates a new custom sampler.\n	* Return the an array. Id is auto-generated\n	* @param {*} x - A variable to sample from\n	* @param {string} type - Sampler type\n	* @param {(number|string)} tf - Timeframe in ms or as a string\n	* @return {TS} - New time-series\n	*/\n	sample(x, type, tf, _id) {\n		let ts = this.env.tss[_id];\n		if (!ts) {\n			ts = this.env.tss[_id] = [x];\n			ts.__id__ = _id;\n			ts.__tf__ = tf_from_str(tf);\n			ts.__fn__ = sampler_default(type).bind(ts);\n		} else ts.__fn__(x);\n		return ts;\n	},\n	_tsid(prev, next) {\n		return `${prev}<-${next}`;\n	},\n	_i(i, x) {\n		if (x != void 0 && x === x && x.__id__) {\n			if (!x.__len__ || i >= x.__len__) x.__len__ = i + BUF_INC;\n		}\n		return i;\n	},\n	_v(x, i) {\n		if (x != void 0 && x === x && x.__id__) {\n			if (!x.__len__ || i >= x.__len__) x.__len__ = i + BUF_INC;\n		}\n		return x;\n	}\n};\n//#endregion\n//#region src/helpers/script_ts.js\nfunction TS(id, arr, len) {\n	arr.__id__ = id;\n	arr.__len__ = len;\n	return arr;\n}\n//#endregion\n//#region src/helpers/symbol.js\nconst OHLCV = [\n	\"open\",\n	\"high\",\n	\"low\",\n	\"close\",\n	\"vol\"\n];\nvar Sym = class {\n	constructor(data, params) {\n		this.id = params.id;\n		this.tf = tf_from_str(params.tf);\n		this.format = params.format;\n		this.aggtype = params.aggtype || \"ohlcv\";\n		this.window = params.window;\n		this.fillgaps = params.fillgaps;\n		this.data = data;\n		this.data_type = 0;\n		this.main = !!params.main;\n		this.idx = this.data_idx();\n		this.tmap = {};\n		this.tf = this.tf || script_engine_default.tf;\n		if (this.main) this.tf = script_engine_default.tf;\n		if (this.aggtype === \"ohlcv\") for (let id of OHLCV) {\n			this[id] = TS(`${this.id}_${id}`, []);\n			this[id].__fn__ = sampler_default(id).bind(this[id]);\n			this[id].__tf__ = this.tf;\n		}\n		if (this.aggtype === \"copy\") {\n			for (let id of OHLCV) {\n				this[id] = TS(`${this.id}_${id}`, []);\n				this[id].__tf__ = this.tf;\n			}\n			for (let i = 0; i < this.data.length; i++) this.tmap[this.data[i][0]] = i;\n		}\n		if (typeof this.aggtype === \"function\") {\n			this.close = TS(`${this.id}_close`, []);\n			this.close.__fn__ = this.aggtype;\n			this.close.__tf__ = this.tf;\n		}\n		if (this.main) {\n			if (!this.tf) throw \"Main tf should be defined\";\n			if (!this.data || !this.data.length || !this.data[0]) throw \"Main symbol requires non-empty data\";\n			script_engine_default.custom_main = this;\n			let t0 = this.data[0][0];\n			script_engine_default.t = t0 - t0 % this.tf;\n			this.update(null, script_engine_default.t);\n			script_engine_default.data.ohlcv.data.length = 0;\n			script_engine_default.data.ohlcv.data.push([\n				script_engine_default.t,\n				this.open[0],\n				this.high[0],\n				this.low[0],\n				this.close[0],\n				this.vol[0]\n			]);\n		}\n	}\n	update(x, t) {\n		if (this.aggtype === \"ohlcv\") return this.update_ohlcv(x, t);\n		else if (this.aggtype === \"copy\") return this.update_copy(x, t);\n		else if (typeof this.aggtype === \"function\") return this.update_custom(x, t);\n	}\n	update_ohlcv(x, t) {\n		t = t || script_engine_default.t;\n		let idx = this.idx;\n		switch (this.data_type) {\n			case 0:\n				if (t > this.data[this.data.length - 1][0]) return false;\n				let t0 = this.window ? t - this.window + this.tf : t;\n				let dt = t0 % this.tf;\n				t0 -= dt;\n				let i0 = nextt(this.data, t0);\n				if (i0 >= this.data.length) return false;\n				let t1 = t + script_engine_default.tf;\n				if (t < this.vol.__t0__ + this.tf) this.vol[0] = 0;\n				let noevent = true;\n				for (let i = i0; i < this.data.length; i++) {\n					noevent = false;\n					let dp = this.data[i];\n					if (dp[idx.time] >= t1) break;\n					this.open.__fn__(dp[idx.open], t);\n					this.high.__fn__(dp[idx.high], t);\n					this.low.__fn__(dp[idx.low], t);\n					this.close.__fn__(dp[idx.close], t);\n					this.vol.__fn__(dp[idx.vol], t);\n				}\n				if (noevent) {\n					if (this.fillgaps === false && !this.main) return false;\n					let last = this.close[0];\n					this.open.__fn__(last, t);\n					this.high.__fn__(last, t);\n					this.low.__fn__(last, t);\n					this.close.__fn__(last, t);\n					this.vol.__fn__(0, t);\n				}\n				break;\n			case 1: break;\n			case 2: break;\n		}\n		return true;\n	}\n	update_copy(x, t) {\n		t = t || script_engine_default.t;\n		let i = this.tmap[t];\n		let s = this.data[i];\n		let ts0 = this.__t0__;\n		if (!ts0 || t >= ts0 + this.tf) {\n			for (let k = 0; k < 5; k++) {\n				let tsn = OHLCV[k];\n				this[tsn].unshift(void 0);\n			}\n			this.__t0__ = t - t % this.tf;\n			let last = this.data.length - 1;\n			if (this.__t0__ === this.data[last][0]) {\n				this.tmap[this.__t0__] = last;\n				s = this.data[last];\n			}\n		}\n		if (s) for (let k = 0; k < 5; k++) {\n			let tsn = OHLCV[k];\n			this[tsn][0] = s[k + 1];\n		}\n		else if (this.fillgaps) for (let k = 0; k < 5; k++) {\n			let tsn = OHLCV[k];\n			this[tsn][0] = this.close[1];\n		}\n	}\n	update_custom(x, t) {\n		t = t || script_engine_default.t;\n		let idx = this.idx;\n		switch (this.data_type) {\n			case 0:\n				if (!this.data.length) return false;\n				if (t > this.data[this.data.length - 1][0]) return false;\n				let t0 = this.window ? t - this.window + this.tf : t;\n				let dt = t0 % this.tf;\n				t0 -= dt;\n				let i0 = nextt(this.data, t0);\n				if (i0 >= this.data.length) return false;\n				let t1 = t + script_engine_default.tf;\n				let sub = [];\n				for (let i = i0; i < this.data.length; i++) {\n					let dp = this.data[i];\n					if (dp[idx.time] >= t1) break;\n					sub.push(dp);\n				}\n				let val;\n				if (sub.length || this.fillgaps === false) val = this.close.__fn__(sub);\n				else if (this.fillgaps !== false) val = this.close[0];\n				let ts0 = this.close.__t0__;\n				if (!ts0 || t >= ts0 + this.tf) {\n					this.close.unshift(val);\n					this.close.__t0__ = t - t % this.tf;\n				} else this.close[0] = val;\n				break;\n			case 1: break;\n			case 2: break;\n		}\n		return true;\n	}\n	data_idx() {\n		let idx = {};\n		switch (this.aggtype) {\n			case \"ohlcv\":\n				if (!this.format) {\n					let x0 = this.data[0];\n					if (!x0 || x0.length === 6) this.format = \"time:open:high:low:close:vol\";\n					else if (x0.length === 3) this.format = \"time:open,high,low,close:vol\";\n				}\n				break;\n			default:\n				this.format = \"time:close\";\n				break;\n		}\n		this.format.split(\":\").forEach((x, i) => {\n			if (!x.length) return;\n			x.split(\",\").forEach((y) => idx[y] = i);\n		});\n		return idx;\n	}\n};\n//#endregion\n//#region src/helpers/std/symbol.js\nvar symbol_default = { \n/** Creates a new Symbol.\n* @param {*} x - Something, depends on arg variation\n* @param {*} y - Something, depends on arg variation\n* @return {Sym}\n* Argument variations:\n* <data>(Array), [<params>(Object)]\n* <ts>(TS), [<params>(Object)]\n* <point>(Number), [<params>(Object)]\n* <tf>(String) 1m, 5m, 1H, etc. (uses main OHLCV)\n* Params object: {\n*  id: <String>,\n*  tf: <String|Number>,\n*  aggtype: <String> (TODO: Type of aggregation)\n*  format: <String> (Data format, e.g. \"time:price:vol\")\n*  window: <String|Number> (Aggregation window)\n*  main <true|false> (Use as the main chart)\n* }\n*/\nsym(x, y = {}, _id) {\n	let id = y.id || this._tsid(_id, `sym`);\n	y.id = id;\n	if (this.env.syms[id]) {\n		this.env.syms[id].update(x);\n		return this.env.syms[id];\n	}\n	let sym;\n	switch (typeof x) {\n		case \"object\":\n			sym = new Sym(x, y);\n			this.env.syms[id] = sym;\n			if (x.__id__) sym.data_type = 1;\n			else sym.data_type = 0;\n			break;\n		case \"number\":\n			sym = new Sym(null, y);\n			sym.data_type = 2;\n			break;\n		case \"string\":\n			y.tf = x;\n			sym = new Sym(state.data.ohlcv.data, y);\n			sym.data_type = 0;\n			break;\n	}\n	this.env.syms[id] = sym;\n	return sym;\n} };\n//#endregion\n//#region src/helpers/script_std.js\nvar ScriptStd = class {\n	constructor(env) {\n		this.env = env;\n		this.se = state;\n		this.SWMA = [\n			1 / 6,\n			2 / 6,\n			2 / 6,\n			1 / 6\n		];\n		this.STDEV_EPS = 1e-10;\n		this.STDEV_Z = 1e-4;\n		this._index_tracking();\n	}\n	_index_tracking() {\n		let proto = Object.getPrototypeOf(this);\n		for (var k of Object.getOwnPropertyNames(proto)) {\n			switch (k) {\n				case \"constructor\":\n				case \"ts\":\n				case \"tstf\":\n				case \"sample\":\n				case \"_index_tracking\":\n				case \"_tsid\":\n				case \"_i\":\n				case \"_v\":\n				case \"_add_i\":\n				case \"chart\":\n				case \"onchart\":\n				case \"offchart\":\n				case \"sym\": continue;\n			}\n			let f = this._add_i(k, this[k].toString());\n			if (f) this[k] = f;\n		}\n	}\n	_add_i(name, src) {\n		let args = f_args(src);\n		src = f_body(src);\n		let src2 = wrap_idxs(src, \"this.\");\n		if (src2 !== src) return new Function(...args, src2);\n		return null;\n	}\n	corr() {}\n	time(res, sesh) {}\n	timestamp() {}\n	linearint() {}\n	nearestrank() {}\n	percentrank() {}\n	variance(src, len) {}\n	vwap(src) {}\n};\nconst proto = ScriptStd.prototype;\nObject.assign(proto, math_default);\nObject.assign(proto, time_default);\nObject.assign(proto, chart_default);\nObject.assign(proto, utils_default$1);\nObject.assign(proto, analysis_default);\nObject.assign(proto, indicators_default);\nObject.assign(proto, timeseries_default);\nObject.assign(proto, symbol_default);\n//#endregion\n//#region src/helpers/script_env.js\nconst { DEF_LIMIT: DEF_LIMIT$1, FDEFS1, FDEFS2 } = constants_default;\nvar ScriptEnv = class {\n	constructor(s, data) {\n		this.std = state.std_inject(new ScriptStd(this));\n		this.id = s.uuid;\n		this.src = s;\n		this.output = TS(\"output\", []);\n		this.data = [];\n		this.tss = {};\n		this.syms = {};\n		this.shared = data;\n		this.output.box_maker = this.make_box(s.src);\n		this.onchart = {};\n		this.offchart = {};\n	}\n	build() {\n		this.output.box_maker(this, this.shared, state);\n		delete this.output.box_maker;\n	}\n	init() {\n		this.output.init();\n	}\n	step(unshift = true) {\n		if (unshift) this.unshift();\n		let v = this.output.update();\n		this.copy(v, unshift);\n		this.limit();\n	}\n	unshift() {\n		this.output.unshift(void 0);\n		for (let id in this.tss) {\n			if (this.tss[id].__tf__) continue;\n			this.tss[id].unshift(void 0);\n		}\n	}\n	limit() {\n		let out = this.output;\n		out.length = out.__len__ || DEF_LIMIT$1;\n		for (let id in this.tss) {\n			let ts = this.tss[id];\n			ts.length = ts.__len__ || DEF_LIMIT$1;\n		}\n	}\n	copy(v, unshift = true) {\n		let off = this.output.__offset__;\n		if (v != void 0) {\n			this.output[0] = v.__id__ ? v[0] : v;\n			off = off || v.__offset__;\n		}\n		let val = this.output[0];\n		let t = state.t;\n		if (off) t += off * state.tf;\n		let point;\n		if (val == null || !val.length) point = [t, val];\n		else point = [t, ...val];\n		if (unshift) this.data.push(point);\n		else this.data[this.data.length - 1] = point;\n	}\n	make_box(src) {\n		let proto = Object.getPrototypeOf(this.std);\n		let std = ``;\n		for (let k of Object.getOwnPropertyNames(proto)) {\n			if (k === \"constructor\") continue;\n			std += `const std_${k} = self.std.${k}.bind(self.std)\\n`;\n		}\n		let props = ``;\n		for (let k in src.props || {}) {\n			let val;\n			if (src.props[k].val !== void 0) val = src.props[k].val;\n			else if (this.src.sett[k] !== void 0) val = this.src.sett[k];\n			else val = src.props[k].def;\n			props += `var ${k} = ${JSON.stringify(val)}\\n`;\n		}\n		let tss = ``;\n		for (let k in this.shared) if (this.shared[k] && this.shared[k].__id__) tss += `const ${k} = shared.${k}\\n`;\n		let dss = ``;\n		for (let k in src.data || {}) {\n			let id = state.match_ds(this.id, src.data[k].type);\n			if (!this.shared.dss[id]) {\n				let T = src.data[k].type;\n				console.warn(`Dataset '${T}' is undefined`);\n				continue;\n			}\n			dss += `const ${k} = shared.dss['${id}'].data\\n`;\n		}\n		try {\n			return Function(\"self,shared,se\", `\n                'use strict';\n\n                // Built-in functions (aliases)\n                ${std}\n\n                // Modules (API / interfaces)\n                ${this.make_modules()}\n\n                // Timeseries\n                ${tss}\n\n                // Direct data ts\n                const data = self.data\n                const ohlcv = shared.dss.ohlcv.data\n                ${dss}\n\n                // Script's properties (init)\n                ${props}\n\n                // Globals\n                const settings = self.src.sett\n                const tf = shared.tf\n                const range = shared.range\n\n                this.init = (_id = 'root') => {\n                    ${this.prep(src.init_src)}\n                }\n\n                this.update = (_id = 'root') => {\n                    const t = shared.t()\n                    const iter = shared.iter()\n                    ${this.prep(src.upd_src)}\n                }\n\n                this.post = (_id = 'root') => {\n                    ${this.prep(src.post_src)}\n                }\n            `);\n		} catch (e) {\n			if (state && state.send) state.send(\"script-error\", {\n				uuid: this.id,\n				name: this.src && this.src.name,\n				type: this.src && this.src.type,\n				phase: \"build\",\n				message: e && e.message || String(e)\n			});\n			return Function(\"self,shared\", `\n                'use strict';\n                this.init = () => {}\n                this.update = () => {}\n                this.post = () => {}\n            `);\n		}\n	}\n	make_modules() {\n		let s = ``;\n		for (let id in state.mods) {\n			if (!state.mods[id].api) continue;\n			s += `const ${id} = se.mods['${id}'].api[self.id]`;\n			s += \"\\n\";\n		}\n		return s;\n	}\n	prep(src) {\n		src = \"		  let _pref = `${_id}<-\" + this.src.use_for[0] + \"<-`\\n\" + src;\n		FDEFS2.lastIndex = 0;\n		let call_id = 0;\n		let m;\n		do {\n			m = FDEFS2.exec(src);\n			if (m) {\n				let fkeyword = m[1].trim();\n				let fname = m[2];\n				m[3];\n				if (fkeyword === \"function\") {} else {\n					let off = m.index + m[0].indexOf(\"(\");\n					if (this.std[fname]) {\n						src = this.postfix(src, m, ++call_id);\n						off += 4;\n					}\n					FDEFS2.lastIndex = off;\n				}\n			}\n		} while (m);\n		return wrap_idxs(src, \"std_\");\n	}\n	postfix(src, m, call_id) {\n		let target = this.get_args(this.fdef(m[2])).length;\n		let m0 = this.parentheses(m[0]);\n		let args = this.get_args_2(m0);\n		for (let i = args.length; i < target; i++) args.push(\"void 0\");\n		args.push(`_pref+\"f${call_id}\"`);\n		return src.replace(m0, `std_${m[2]}(${args.join(\", \")})`);\n	}\n	parentheses(str) {\n		let count = 0, first = false;\n		for (let i = 0; i < str.length; i++) {\n			if (str[i] === \"(\") {\n				count++;\n				first = true;\n			} else if (str[i] === \")\") count--;\n			if (first && count === 0) return str.substr(0, i + 1);\n		}\n		return str;\n	}\n	fdef(fname) {\n		return this.std[fname].toString();\n	}\n	get_args(src) {\n		let reg = this.regex_clone(FDEFS1);\n		reg.lastIndex = 0;\n		let m = reg.exec(src);\n		if (!m[3].trim().length) return [];\n		return m[3].split(\",\").map((x) => x.trim()).filter((x) => x !== \"_id\" && x !== \"_tf\");\n	}\n	get_args_2(str) {\n		let parts = [];\n		let c = 0;\n		let s = 0;\n		let q1 = false, q2 = false, q3 = false;\n		let part;\n		for (let i = 0; i < str.length; i++) {\n			if (str[i] === \"(\") {\n				c++;\n				if (!part) part = [i + 1];\n			}\n			if (str[i] === \")\") c--;\n			if (str[i] === \"[\") s++;\n			if (str[i] === \"]\") s--;\n			if (str[i] === \"'\") q1 = !q1;\n			if (str[i] === \"\\\"\") q2 = !q2;\n			if (str[i] === \"`\") q3 = !q3;\n			if (str[i] === \",\" && c === 1 && !s && !q1 && !q2 && !q3) {\n				if (part) {\n					part[1] = i;\n					parts.push(part);\n					part = [i + 1];\n				}\n			}\n			if (c === 0 && part) {\n				part[1] = i;\n				parts.push(part);\n				part = null;\n			}\n		}\n		return parts.map((x) => str.slice(...x)).filter((x) => /[^\\s]+/.exec(x));\n	}\n	regex_clone(rex) {\n		return new RegExp(rex.source, rex.flags);\n	}\n	send_modify(upd) {\n		state.send(\"modify-overlay\", {\n			uuid: this.id,\n			fields: upd\n		});\n	}\n};\n//#endregion\n//#region node_modules/arrayslicer/lib/util.js\nvar require_util = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n	/**\n	* Utils module\n	*/\n	/**\n	* Check if an object is an array-like object\n	*\n	* @credit Javascript: The Definitive Guide, O'Reilly, 2011\n	*/\n	function isArrayLike(o) {\n		if (o && typeof o === \"object\" && isFinite(o.length) && o.length >= 0 && o.length === Math.floor(o.length) && o.length < 4294967296) return true;\n		else return false;\n	}\n	/**\n	* Check for the existence of the sort function in the object\n	*/\n	function isSortable(o) {\n		if (o && typeof o === \"object\" && typeof o.sort === \"function\") return true;\n		else return false;\n	}\n	/**\n	* Check for sortable-array-like objects\n	*/\n	module.exports.isSortableArrayLike = function(o) {\n		return isArrayLike(o) && isSortable(o);\n	};\n}));\n//#endregion\n//#region node_modules/arrayslicer/lib/compare/index.js\nvar require_compare = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n	/**\n	* Utility compare functions\n	*/\n	module.exports = {\n		/**\n		* Compare two numbers.\n		*\n		* @param {Number} a\n		* @param {Number} b\n		* @returns {Number} 1 if a > b, 0 if a = b, -1 if a < b\n		*/\n		numcmp: function(a, b) {\n			return a - b;\n		},\n		/**\n		* Compare two strings.\n		*\n		* @param {Number|String} a\n		* @param {Number|String} b\n		* @returns {Number} 1 if a > b, 0 if a = b, -1 if a < b\n		*/\n		strcmp: function(a, b) {\n			return a < b ? -1 : a > b ? 1 : 0;\n		}\n	};\n}));\n//#endregion\n//#region node_modules/arrayslicer/lib/search/binary.js\nvar require_binary = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n	/**\n	* Binary search implementation\n	*/\n	/**\n	* Main search recursive function\n	*/\n	function loop(data, min, max, index, valpos) {\n		var curr = max + min >>> 1;\n		var diff = this.compare(data[curr][this.index], index);\n		if (!diff) return valpos[index] = {\n			\"found\": true,\n			\"index\": curr,\n			\"prev\": null,\n			\"next\": null\n		};\n		if (min >= max) return valpos[index] = {\n			\"found\": false,\n			\"index\": null,\n			\"prev\": diff < 0 ? max : max - 1,\n			\"next\": diff < 0 ? max + 1 : max\n		};\n		if (diff > 0) return loop.call(this, data, min, curr - 1, index, valpos);\n		else return loop.call(this, data, curr + 1, max, index, valpos);\n	}\n	/**\n	* Search bootstrap\n	* The function has to be executed in the context of the IndexedArray object\n	*/\n	function search(index) {\n		var data = this.data;\n		return loop.call(this, data, 0, data.length - 1, index, this.valpos);\n	}\n	/**\n	* Export search function\n	*/\n	module.exports.search = search;\n}));\n//#endregion\n//#region src/stuff/utils.js\nvar import_lib = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {\n	/**\n	* Indexed Array Binary Search module\n	*/\n	/**\n	* Dependencies\n	*/\n	var util = require_util(), cmp = require_compare(), bin = require_binary();\n	/**\n	* Module interface definition\n	*/\n	module.exports = IndexedArray;\n	/**\n	* Indexed Array constructor\n	*\n	* It loads the array data, defines the index field and the comparison function\n	* to be used.\n	*\n	* @param {Array} data is an array of objects\n	* @param {String} index is the object's property used to search the array\n	*/\n	function IndexedArray(data, index) {\n		if (!util.isSortableArrayLike(data)) throw new Error(\"Invalid data\");\n		if (!index || data.length > 0 && !(index in data[0])) throw new Error(\"Invalid index\");\n		this.data = data;\n		this.index = index;\n		this.setBoundaries();\n		this.compare = typeof this.minv === \"number\" ? cmp.numcmp : cmp.strcmp;\n		this.search = bin.search;\n		this.valpos = {};\n		this.cursor = null;\n		this.nextlow = null;\n		this.nexthigh = null;\n	}\n	/**\n	* Set the comparison function\n	*\n	* @param {Function} fn to compare index values that returnes 1, 0, -1\n	*/\n	IndexedArray.prototype.setCompare = function(fn) {\n		if (typeof fn !== \"function\") throw new Error(\"Invalid argument\");\n		this.compare = fn;\n		return this;\n	};\n	/**\n	* Set the search function\n	*\n	* @param {Function} fn to search index values in the array of objects\n	*/\n	IndexedArray.prototype.setSearch = function(fn) {\n		if (typeof fn !== \"function\") throw new Error(\"Invalid argument\");\n		this.search = fn;\n		return this;\n	};\n	/**\n	* Sort the data array by its index property\n	*/\n	IndexedArray.prototype.sort = function() {\n		var self = this, index = this.index;\n		this.data.sort(function(a, b) {\n			return self.compare(a[index], b[index]);\n		});\n		this.setBoundaries();\n		return this;\n	};\n	/**\n	* Inspect and set the boundaries of the internal data array\n	*/\n	IndexedArray.prototype.setBoundaries = function() {\n		var data = this.data, index = this.index;\n		this.minv = data.length && data[0][index];\n		this.maxv = data.length && data[data.length - 1][index];\n		return this;\n	};\n	/**\n	* Get the position of the object corresponding to the given index\n	*\n	* @param {Number|String} index is the id of the requested object\n	* @returns {Number} the position of the object in the array\n	*/\n	IndexedArray.prototype.fetch = function(value) {\n		if (this.data.length === 0) {\n			this.cursor = null;\n			this.nextlow = null;\n			this.nexthigh = null;\n			return this;\n		}\n		if (this.compare(value, this.minv) === -1) {\n			this.cursor = null;\n			this.nextlow = null;\n			this.nexthigh = 0;\n			return this;\n		}\n		if (this.compare(value, this.maxv) === 1) {\n			this.cursor = null;\n			this.nextlow = this.data.length - 1;\n			this.nexthigh = null;\n			return this;\n		}\n		var pos = this.valpos[value];\n		if (pos) {\n			if (pos.found) {\n				this.cursor = pos.index;\n				this.nextlow = null;\n				this.nexthigh = null;\n			} else {\n				this.cursor = null;\n				this.nextlow = pos.prev;\n				this.nexthigh = pos.next;\n			}\n			return this;\n		}\n		var result = this.search.call(this, value);\n		this.cursor = result.index;\n		this.nextlow = result.prev;\n		this.nexthigh = result.next;\n		return this;\n	};\n	/**\n	* Get the object corresponding to the given index\n	*\n	* When no value is given, the function will default to the last fetched item.\n	*\n	* @param {Number|String} [optional] index is the id of the requested object\n	* @returns {Object} the found object or null\n	*/\n	IndexedArray.prototype.get = function(value) {\n		if (value) this.fetch(value);\n		var pos = this.cursor;\n		return pos !== null ? this.data[pos] : null;\n	};\n	/**\n	* Get an slice of the data array\n	*\n	* Boundaries have to be in order.\n	*\n	* @param {Number|String} begin index is the id of the requested object\n	* @param {Number|String} end index is the id of the requested object\n	* @returns {Object} the slice of data array or []\n	*/\n	IndexedArray.prototype.getRange = function(begin, end) {\n		if (this.compare(begin, end) === 1) return [];\n		this.fetch(begin);\n		var start = this.cursor || this.nexthigh;\n		this.fetch(end);\n		var finish = this.cursor || this.nextlow;\n		if (start === null || finish === null) return [];\n		return this.data.slice(start, finish + 1);\n	};\n})))(), 1);\nvar utils_default = {\n	clamp(num, min, max) {\n		return num <= min ? min : num >= max ? max : num;\n	},\n	add_zero(i) {\n		if (i < 10) i = \"0\" + i;\n		return i;\n	},\n	day_start(t) {\n		return new Date(t).setUTCHours(0, 0, 0, 0);\n	},\n	month_start(t) {\n		let date = new Date(t);\n		return Date.UTC(date.getFullYear(), date.getMonth(), 1);\n	},\n	year_start(t) {\n		return Date.UTC(new Date(t).getFullYear());\n	},\n	get_year(t) {\n		if (!t) return void 0;\n		return new Date(t).getUTCFullYear();\n	},\n	get_month(t) {\n		if (!t) return void 0;\n		return new Date(t).getUTCMonth();\n	},\n	nearest_a(x, array) {\n		if (!array || !array.length) return [-1, null];\n		if (array.length === 1) return [0, array[0]];\n		let lo = 0;\n		let hi = array.length - 1;\n		if (x <= array[lo]) return [lo, array[lo]];\n		if (x >= array[hi]) return [hi, array[hi]];\n		while (lo < hi - 1) {\n			const mid = lo + hi >> 1;\n			if (array[mid] === x) return [mid, array[mid]];\n			if (array[mid] < x) lo = mid;\n			else hi = mid;\n		}\n		return Math.abs(array[lo] - x) <= Math.abs(array[hi] - x) ? [lo, array[lo]] : [hi, array[hi]];\n	},\n	round(num, decimals = 8) {\n		return parseFloat(num.toFixed(decimals));\n	},\n	strip(number) {\n		return parseFloat(parseFloat(number).toPrecision(12));\n	},\n	get_day(t) {\n		return t ? new Date(t).getDate() : null;\n	},\n	overwrite(arr, new_arr) {\n		arr.splice(0, arr.length, ...new_arr);\n	},\n	copy_layout(obj, new_obj) {\n		for (let k in obj) if (Array.isArray(obj[k])) {\n			if (obj[k].length !== new_obj[k].length) {\n				this.overwrite(obj[k], new_obj[k]);\n				continue;\n			}\n			for (let m in obj[k]) Object.assign(obj[k][m], new_obj[k][m]);\n		} else Object.assign(obj[k], new_obj[k]);\n	},\n	detect_interval(ohlcv) {\n		let len = Math.min(ohlcv.length - 1, 99);\n		let min = Infinity;\n		ohlcv.slice(0, len).forEach((x, i) => {\n			let d = ohlcv[i + 1][0] - x[0];\n			if (d === d && d < min) min = d;\n		});\n		if (min >= constants_default.MONTH && min <= constants_default.DAY * 30) return constants_default.DAY * 31;\n		return min;\n	},\n	get_num_id(id) {\n		return parseInt(id.split(\"_\").pop());\n	},\n	fast_filter(arr, t1, t2) {\n		if (!arr.length) return [arr, void 0];\n		if (arr[arr.length - 1][0] < t1 || arr[0][0] > t2) return [[], void 0];\n		try {\n			let ia = new import_lib.default(arr, \"0\");\n			return [ia.getRange(t1, t2), ia.valpos[t1].next];\n		} catch (e) {\n			return [arr.filter((x) => x[0] >= t1 && x[0] <= t2), 0];\n		}\n	},\n	fast_filter_i(arr, t1, t2) {\n		if (!arr.length) return [arr, void 0];\n		let i1 = Math.floor(t1);\n		if (i1 < 0) i1 = 0;\n		let i2 = Math.floor(t2 + 1);\n		return [arr.slice(i1, i2), i1];\n	},\n	fast_nearest(arr, t1) {\n		let ia = new import_lib.default(arr, \"0\");\n		ia.fetch(t1);\n		return [ia.nextlow, ia.nexthigh];\n	},\n	now() {\n		return (/* @__PURE__ */ new Date()).getTime();\n	},\n	pause(delay) {\n		return new Promise((rs, rj) => setTimeout(rs, delay));\n	},\n	smart_wheel(delta) {\n		let abs = Math.abs(delta);\n		if (abs > 500) return (200 + Math.log(abs)) * Math.sign(delta);\n		return delta;\n	},\n	get_deltaX(event) {\n		return event.originalEvent.deltaX / 12;\n	},\n	get_deltaY(event) {\n		return event.originalEvent.deltaY / 12;\n	},\n	apply_opacity(c, op) {\n		if (c.length === 7) {\n			let n = Math.floor(op * 255);\n			n = this.clamp(n, 0, 255);\n			c += n.toString(16).padStart(2, \"0\");\n		}\n		return c;\n	},\n	parse_tf(smth) {\n		if (typeof smth === \"string\") return constants_default.map_unit[smth];\n		else return smth;\n	},\n	index_shift(sub, data) {\n		if (!data.length) return 0;\n		let first = data[0][0];\n		let second;\n		let i = 1;\n		for (; i < data.length; i++) if (data[i][0] !== first) {\n			second = data[i][0];\n			break;\n		}\n		for (let j = 0; j < sub.length; j++) if (sub[j][0] === second) return j - i;\n		return 0;\n	},\n	measureText(ctx, text, tv_id) {\n		let m = ctx.measureTextOrg(text);\n		if (m.width === 0) {\n			const doc = document;\n			const id = \"tvjs-measure-text\";\n			let el = doc.getElementById(id);\n			if (!el) {\n				let base = doc.getElementById(tv_id);\n				el = doc.createElement(\"div\");\n				el.id = id;\n				el.style.position = \"absolute\";\n				el.style.top = \"-1000px\";\n				base.appendChild(el);\n			}\n			if (ctx.font) el.style.font = ctx.font;\n			el.innerText = text.replace(/ /g, \".\");\n			return { width: el.offsetWidth };\n		} else return m;\n	},\n	uuid(temp = \"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx\") {\n		return temp.replace(/[xy]/g, (c) => {\n			let r = Math.random() * 16 | 0;\n			return (c == \"x\" ? r : r & 3 | 8).toString(16);\n		});\n	},\n	uuid2() {\n		return this.uuid(\"xxxxxxxxxxxx\");\n	},\n	warn(f, text, delay = 0) {\n		setTimeout(() => {\n			if (f()) console.warn(text);\n		}, delay);\n	},\n	is_scr_props_upd(n, prev) {\n		let p = prev.find((x) => x.v.$uuid === n.v.$uuid);\n		if (!p) return false;\n		let props = n.p.settings.$props;\n		if (!props) return false;\n		return props.some((x) => n.v[x] !== p.v[x]);\n	},\n	delayed_exec(v) {\n		if (!v.script || !v.script.execInterval) return true;\n		let t = this.now();\n		let dt = v.script.execInterval;\n		if (!v.settings.$last_exec || t > v.settings.$last_exec + dt) {\n			v.settings.$last_exec = t;\n			return true;\n		}\n		return false;\n	},\n	format_name(ov) {\n		if (!ov.name) return void 0;\n		let name = ov.name;\n		for (let k in ov.settings || {}) {\n			let val = ov.settings[k];\n			let reg = new RegExp(`\\\\$${k}`, \"g\");\n			name = name.replace(reg, val);\n		}\n		return name;\n	},\n	xmode() {\n		return this.is_mobile ? \"explore\" : \"default\";\n	},\n	default_prevented(event) {\n		if (event.original) return event.original.defaultPrevented;\n		return event.defaultPrevented;\n	},\n	is_mobile: ((w) => \"onorientationchange\" in w && (!!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || \"ontouchstart\" in w || w.DocumentTouch && document instanceof w.DocumentTouch))(typeof window !== \"undefined\" ? window : {}),\n	maxInArray(arr) {\n		if (!arr || !arr.length) return -Infinity;\n		let max = arr[0];\n		for (let i = 1; i < arr.length; i++) if (arr[i] > max) max = arr[i];\n		return max;\n	},\n	minInArray(arr) {\n		if (!arr || !arr.length) return Infinity;\n		let min = arr[0];\n		for (let i = 1; i < arr.length; i++) if (arr[i] < min) min = arr[i];\n		return min;\n	},\n	maxAtIndex(arr, idx) {\n		if (!arr || !arr.length) return -Infinity;\n		let max = arr[0][idx];\n		for (let i = 1; i < arr.length; i++) {\n			const val = arr[i][idx];\n			if (val > max) max = val;\n		}\n		return max;\n	},\n	minAtIndex(arr, idx) {\n		if (!arr || !arr.length) return Infinity;\n		let min = arr[0][idx];\n		for (let i = 1; i < arr.length; i++) {\n			const val = arr[i][idx];\n			if (val < min) min = val;\n		}\n		return min;\n	},\n	rafThrottle(fn) {\n		let rafId = null;\n		let lastArgs = null;\n		let context = null;\n		const throttled = function(...args) {\n			lastArgs = args;\n			context = this;\n			if (rafId !== null) return;\n			rafId = requestAnimationFrame(() => {\n				rafId = null;\n				fn.apply(context, lastArgs);\n			});\n		};\n		throttled.cancel = () => {\n			if (rafId !== null) {\n				cancelAnimationFrame(rafId);\n				rafId = null;\n			}\n		};\n		return throttled;\n	},\n	fastDeepCopy(obj) {\n		if (obj === null || typeof obj !== \"object\") return obj;\n		if (Array.isArray(obj)) {\n			if (obj.length === 0) return [];\n			const first = obj[0];\n			if (first === null || typeof first !== \"object\") return obj.slice();\n			const copy = new Array(obj.length);\n			for (let i = 0; i < obj.length; i++) copy[i] = this.fastDeepCopy(obj[i]);\n			return copy;\n		}\n		const copy = {};\n		for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) copy[key] = this.fastDeepCopy(obj[key]);\n		return copy;\n	},\n	_dateCache: /* @__PURE__ */ new Map(),\n	_dateCacheMax: 16,\n	getCachedDate(timestamp) {\n		let d = this._dateCache.get(timestamp);\n		if (d !== void 0) return d;\n		d = new Date(timestamp);\n		if (this._dateCache.size >= this._dateCacheMax) this._dateCache.delete(this._dateCache.keys().next().value);\n		this._dateCache.set(timestamp, d);\n		return d;\n	}\n};\n//#endregion\n//#region src/helpers/symstd.js\nconst SYMTF = /(open|high|low|close|vol)(\\d+)(\\w*)/gm;\nconst FNSTD = /(a?tr|kcw?|dmi|sar|supertrend|wpr)(\\d+?\\w*)\\s*\\(/gm;\nconst SYMSTD = /(?:hl2|hlc3|ohlc4)/gm;\nvar symstd_default = {\n	parse(s) {\n		let ss = s.src;\n		let all = `${ss.init_src}\\n${ss.upd_src}\\n${ss.post_src}`;\n		SYMTF.lastIndex = 0;\n		FNSTD.lastIndex = 0;\n		SYMSTD.lastIndex = 0;\n		let m;\n		do {\n			m = SYMTF.exec(all);\n			if (m) {\n				if (m[0] in script_engine_default.tss) continue;\n				let ts = script_engine_default.tss[m[0]] = TS(m[0], []);\n				ts.__tf__ = tf_from_pair(m[2], m[3]);\n				ts.__fn__ = sampler_default(m[1], true).bind(ts);\n			}\n		} while (m);\n		do {\n			m = SYMSTD.exec(all);\n			if (m) {\n				if (m[0] in script_engine_default.tss) continue;\n				this.parse_ts_sym(m[0]);\n			}\n		} while (m);\n		do {\n			m = FNSTD.exec(all);\n			if (m) {\n				let fn = m[1] + m[2];\n				let tf = m[2];\n				if (fn in script_engine_default.std_plus) continue;\n				switch (m[1]) {\n					case \"tr\":\n						this.deps([\n							\"high\",\n							\"low\",\n							\"close\"\n						], m[2]);\n						script_engine_default.std_plus[fn] = function(fixnan = false, _id) {\n							return this.tr(fixnan, _id, tf);\n						};\n						break;\n					case \"atr\":\n						this.deps([\n							\"high\",\n							\"low\",\n							\"close\"\n						], m[2]);\n						script_engine_default.std_plus[fn] = function(len, _id) {\n							return this.atr(len, _id, tf);\n						};\n						break;\n					case \"kc\":\n						this.deps([\n							\"high\",\n							\"low\",\n							\"close\"\n						], m[2]);\n						script_engine_default.std_plus[fn] = function(src, len, mult, use_tr = true, _id) {\n							return this.kc(src, len, mult, use_tr, _id, tf);\n						};\n						break;\n					case \"kcw\":\n						this.deps([\n							\"high\",\n							\"low\",\n							\"close\"\n						], m[2]);\n						script_engine_default.std_plus[fn] = function(src, len, mult, use_tr = true, _id) {\n							return this.kcw(src, len, mult, use_tr, _id, tf);\n						};\n						break;\n					case \"dmi\":\n						this.deps([\n							\"high\",\n							\"low\",\n							\"close\"\n						], m[2]);\n						script_engine_default.std_plus[fn] = function(len, smooth, _id) {\n							return this.dmi(len, smooth, _id, tf);\n						};\n						break;\n					case \"sar\":\n						this.deps([\n							\"high\",\n							\"low\",\n							\"close\"\n						], m[2]);\n						script_engine_default.std_plus[fn] = function(start, inc, max, _id) {\n							return this.sar(start, inc, max, _id, tf);\n						};\n						break;\n					case \"supertrend\":\n						this.deps([\n							\"high\",\n							\"low\",\n							\"close\"\n						], m[2]);\n						script_engine_default.std_plus[fn] = function(factor, atrlen, _id) {\n							return this.supertrend(factor, atrlen, _id, tf);\n						};\n						break;\n					case \"wpr\":\n						this.deps([\n							\"high\",\n							\"low\",\n							\"close\"\n						], m[2]);\n						script_engine_default.std_plus[fn] = function(len, _id) {\n							return this.wpr(len, _id, tf);\n						};\n						break;\n				}\n			}\n		} while (m);\n	},\n	parse_ts_sym(sym, tf) {\n		switch (sym) {\n			case \"hl2\":\n				script_engine_default.tss[\"hl2\"] = TS(\"hl2\", []);\n				script_engine_default.tss[\"hl2\"].__fn__ = () => {\n					return (script_engine_default.high[0] + script_engine_default.low[0]) * .5;\n				};\n				break;\n			case \"hlc3\":\n				script_engine_default.tss[\"hlc3\"] = TS(\"hlc3\", []);\n				script_engine_default.tss[\"hlc3\"].__fn__ = () => {\n					return (script_engine_default.high[0] + script_engine_default.low[0] + script_engine_default.close[0]) / 3;\n				};\n				break;\n			case \"ohlc4\":\n				script_engine_default.tss[\"ohlc4\"] = TS(\"ohlc4\", []);\n				script_engine_default.tss[\"ohlc4\"].__fn__ = () => {\n					return (script_engine_default.open[0] + script_engine_default.high[0] + script_engine_default.low[0] + script_engine_default.close[0]) * .25;\n				};\n				break;\n		}\n	},\n	deps(types, tf) {\n		for (let type of types) {\n			let sym = type + tf;\n			if (sym in script_engine_default.tss) continue;\n			let ts = script_engine_default.tss[sym] = TS(sym, []);\n			ts.__tf__ = tf_from_str(tf);\n			ts.__fn__ = sampler_default(type, true).bind(ts);\n		}\n	}\n};\n//#endregion\n//#region src/helpers/script_engine.js\nconst { DEF_LIMIT } = constants_default;\nconst WAIT_EXEC = 10;\nconst DISPLAY_ONLY_SETTINGS = new Set([\n	\"color\",\n	\"lineColor\",\n	\"fillColor\",\n	\"upColor\",\n	\"downColor\",\n	\"wickUpColor\",\n	\"wickDownColor\",\n	\"borderUpColor\",\n	\"borderDownColor\",\n	\"backgroundColor\",\n	\"textColor\",\n	\"labelColor\",\n	\"crossColor\",\n	\"lineWidth\",\n	\"lineStyle\",\n	\"lineDash\",\n	\"opacity\",\n	\"alpha\",\n	\"showLabels\",\n	\"showLegend\",\n	\"showValues\",\n	\"showPrice\",\n	\"visible\",\n	\"display\",\n	\"showBands\",\n	\"showFill\",\n	\"precision\",\n	\"prec\",\n	\"zIndex\",\n	\"z\"\n]);\nfunction fastDeepCopy(obj) {\n	if (obj === null || typeof obj !== \"object\") return obj;\n	if (Array.isArray(obj)) {\n		if (obj.length === 0) return [];\n		const first = obj[0];\n		if (first === null || typeof first !== \"object\") return obj.slice();\n		const copy = new Array(obj.length);\n		for (let i = 0; i < obj.length; i++) copy[i] = fastDeepCopy(obj[i]);\n		return copy;\n	}\n	const copy = {};\n	for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) copy[key] = fastDeepCopy(obj[key]);\n	return copy;\n}\nconst YIELD_FREQUENCY = 2e3;\nvar ScriptEngine = class {\n	constructor() {\n		this.map = {};\n		this.data = {};\n		this.exec_id = null;\n		this.queue = [];\n		this.delta_queue = [];\n		this.update_queue = [];\n		this.sett = {};\n		this.state = {};\n		this.mods = {};\n		this.std_plus = {};\n		this.tf = void 0;\n		this._outputCache = /* @__PURE__ */ new Map();\n		this._dataHash = null;\n		this._hooksCache = {};\n		this._hooksModsKey = null;\n		this._updateTemplate = null;\n		state.send = (...args) => this.send(...args);\n		state.std_inject = (...args) => this.std_inject(...args);\n		state.match_ds = (...args) => this.match_ds(...args);\n	}\n	_computationHash(script) {\n		const props = script.src?.props || {};\n		const sett = script.sett || {};\n		const parts = [];\n		if (script.src?.init) parts.push(\"i:\" + script.src.init.toString().length);\n		if (script.src?.update) parts.push(\"u:\" + script.src.update.toString().length);\n		for (const key in props) if (!DISPLAY_ONLY_SETTINGS.has(key)) {\n			const val = props[key].val !== void 0 ? props[key].val : props[key].def;\n			const sv = val !== null && typeof val === \"object\" ? JSON.stringify(val) : String(val);\n			parts.push(`${key}:${sv}`);\n		}\n		for (const key in sett) if (!DISPLAY_ONLY_SETTINGS.has(key)) {\n			const sv = sett[key] !== null && typeof sett[key] === \"object\" ? JSON.stringify(sett[key]) : String(sett[key]);\n			parts.push(`s.${key}:${sv}`);\n		}\n		return parts.sort().join(\"|\");\n	}\n	_computeDataHash() {\n		const ohlcv = this.data?.ohlcv?.data;\n		if (!ohlcv || !ohlcv.length) return \"\";\n		return `${ohlcv.length}:${ohlcv[0]?.[0]}:${ohlcv[ohlcv.length - 1]?.[0]}`;\n	}\n	_isDisplayOnlyChange(delta, scriptId) {\n		if (!delta || !delta[scriptId]) return false;\n		const changes = delta[scriptId];\n		for (const key in changes) if (!DISPLAY_ONLY_SETTINGS.has(key)) return false;\n		return true;\n	}\n	_restoreFromCache(scriptId) {\n		const cached = this._outputCache.get(scriptId);\n		if (!cached) return false;\n		const script = this.map[scriptId];\n		if (!script || !script.env) return false;\n		script.env.data = cached.data.slice();\n		script.env.onchart = fastDeepCopy(cached.onchart || {});\n		script.env.offchart = fastDeepCopy(cached.offchart || {});\n		return true;\n	}\n	_saveToCache(scriptId) {\n		const script = this.map[scriptId];\n		if (!script || !script.env) return;\n		if (this._outputCache.size > 50) {\n			const firstKey = this._outputCache.keys().next().value;\n			this._outputCache.delete(firstKey);\n		}\n		const hash = this._computationHash(script);\n		this._outputCache.set(scriptId, {\n			hash,\n			dataHash: this._dataHash,\n			data: script.env.data.slice(),\n			onchart: fastDeepCopy(script.env.onchart || {}),\n			offchart: fastDeepCopy(script.env.offchart || {})\n		});\n	}\n	_isCacheValid(scriptId) {\n		const cached = this._outputCache.get(scriptId);\n		if (!cached) return false;\n		const script = this.map[scriptId];\n		if (!script) return false;\n		if (cached.dataHash !== this._dataHash) return false;\n		const currentHash = this._computationHash(script);\n		return cached.hash === currentHash;\n	}\n	syncState() {\n		state.t = this.t;\n		state.tf = this.tf;\n		state.iter = this.iter;\n		state.data = this.data;\n		state.shared = this.shared;\n		state.mods = this.mods;\n	}\n	exec_all() {\n		clearTimeout(this.exec_id);\n		if (!this.data.ohlcv) return;\n		this._dataHash = this._computeDataHash();\n		this.exec_id = setTimeout(async () => {\n			if (!this.init_state(Object.keys(this.map))) return;\n			this.re_init_map();\n			while (this.queue.length) this.exec(this.queue.shift());\n			if (Object.keys(this.map).length) {\n				await this.run();\n				for (let id in this.map) this._saveToCache(id);\n				this.drain_queues();\n			}\n			this.send_state();\n		}, WAIT_EXEC);\n	}\n	async exec_sel(delta) {\n		if (!this.data.ohlcv) return;\n		let sel = Object.keys(delta).filter((x) => x in this.map);\n		const needsReExec = [];\n		const displayOnlyChanges = [];\n		for (let id of sel) {\n			if (!this.map[id]) continue;\n			if (this._isDisplayOnlyChange(delta, id) && this._isCacheValid(id)) displayOnlyChanges.push(id);\n			else needsReExec.push(id);\n			let props = this.map[id].src.props || {};\n			for (let k in props) if (k in delta[id]) props[k].val = delta[id][k];\n		}\n		if (displayOnlyChanges.length > 0) {\n			for (let id of displayOnlyChanges) this._restoreFromCache(id);\n			if (needsReExec.length === 0) {\n				this.send(\"overlay-data\", this.format_map(sel));\n				this.send_state();\n				return;\n			}\n		}\n		if (!this.init_state(needsReExec)) {\n			this.delta_queue.push(delta);\n			return;\n		}\n		for (let id of needsReExec) {\n			if (!this.map[id]) continue;\n			this.exec(this.map[id]);\n		}\n		await this.run(needsReExec);\n		for (let id of needsReExec) this._saveToCache(id);\n		this.drain_queues();\n		this.send_state();\n	}\n	exec(s) {\n		if (!s.src.conf) s.src.conf = {};\n		if (s.src.init) s.src.init_src = get_raw_src(s.src.init);\n		if (s.src.update) s.src.upd_src = get_raw_src(s.src.update);\n		if (s.src.post) s.src.post_src = get_raw_src(s.src.post);\n		symstd_default.parse(s);\n		for (let id in this.mods) if (this.mods[id].pre_env) this.mods[id].pre_env(s.uuid, s);\n		s.env = new ScriptEnv(s, Object.assign(this.shared, {\n			open: this.open,\n			high: this.high,\n			low: this.low,\n			close: this.close,\n			vol: this.vol,\n			dss: this.data,\n			t: () => this.t,\n			iter: () => this.iter,\n			tf: this.tf,\n			range: this.range,\n			onclose: true\n		}, this.tss));\n		this.map[s.uuid] = s;\n		this._updateTemplate = null;\n		for (let id in this.mods) if (this.mods[id].new_env) this.mods[id].new_env(s.uuid, s);\n		s.env.build();\n	}\n	update(candles) {\n		if (!this.data.ohlcv || !this.data.ohlcv.data.length) return;\n		if (this.running) {\n			this.update_queue.push(candles);\n			return;\n		}\n		let mfs1 = this.make_mods_hooks(\"pre_step\");\n		let mfs2 = this.make_mods_hooks(\"post_step\");\n		const hasMods1 = mfs1.length > 0;\n		const hasMods2 = mfs2.length > 0;\n		let step = (sel, unshift) => {\n			if (hasMods1) for (let m = 0; m < mfs1.length; m++) mfs1[m](sel);\n			for (let j = 0; j < sel.length; j++) this.map[sel[j]].env.step(unshift);\n			if (hasMods2) for (let m = 0; m < mfs2.length; m++) mfs2[m](sel);\n		};\n		try {\n			let ohlcv = this.data.ohlcv.data;\n			let i = ohlcv.length - 1;\n			let last = ohlcv[i];\n			let sel = Object.keys(this.map);\n			let unshift = false;\n			this.shared.event = \"update\";\n			for (let candle of candles) if (candle[0] > last[0]) {\n				this.shared.onclose = true;\n				step(sel, false);\n				ohlcv.push(candle);\n				unshift = true;\n				i++;\n			} else if (candle[0] < last[0]) continue;\n			else ohlcv[i] = candle;\n			this.iter = i;\n			this.t = ohlcv[i][0];\n			this.syncState();\n			this.step(ohlcv[i], unshift);\n			this.shared.onclose = false;\n			step(sel, unshift);\n			this.limit();\n			this.send_update();\n			this.send_state();\n		} catch (e) {\n			console.error(\"Script update error:\", e);\n		}\n	}\n	init_state(sel) {\n		let task = sel.join(\",\");\n		if (this.running) {\n			this._restart = task === this.task;\n			return false;\n		}\n		this.open = TS(\"open\", []);\n		this.high = TS(\"high\", []);\n		this.low = TS(\"low\", []);\n		this.close = TS(\"close\", []);\n		this.vol = TS(\"vol\", []);\n		this.tss = {};\n		this.std_plus = {};\n		this.shared = {};\n		this.iter = 0;\n		this.t = 0;\n		this.skip = false;\n		this.running = true;\n		this.task = task;\n		this.syncState();\n		return true;\n	}\n	std_inject(std) {\n		Object.assign(Object.getPrototypeOf(std), this.std_plus);\n		return std;\n	}\n	_onScriptError(id, phase, e) {\n		const scr = this.map[id];\n		const err = {\n			uuid: id,\n			name: scr && scr.name,\n			type: scr && scr.type,\n			phase,\n			message: e && e.message || String(e)\n		};\n		this.send(\"script-error\", err);\n		if (typeof console !== \"undefined\") console.error(`Script \"${err.name || id}\" ${phase} error:`, e);\n	}\n	send_state() {\n		this.send(\"engine-state\", {\n			scripts: Object.keys(this.map).length,\n			last_perf: this.perf,\n			iter: this.iter,\n			last_t: this.t,\n			data_size: this.data_size,\n			running: false\n		});\n	}\n	send_update() {\n		this.send(\"overlay-update\", this.format_update());\n	}\n	re_init_map() {\n		for (let id in this.map) this.exec(this.map[id]);\n	}\n	async run(sel) {\n		this.send(\"engine-state\", { running: true });\n		let t1 = utils_default.now();\n		sel = sel || Object.keys(this.map);\n		this.pre_run_mods(sel);\n		let mfs1 = this.make_mods_hooks(\"pre_step\");\n		let mfs2 = this.make_mods_hooks(\"post_step\");\n		const skip = /* @__PURE__ */ new Set();\n		try {\n			for (let id of sel) try {\n				this.map[id].env.init();\n			} catch (e) {\n				skip.add(id);\n				this._onScriptError(id, \"init\", e);\n			}\n			let ohlcv = this.data.ohlcv.data;\n			let start = this.start(ohlcv);\n			let total = ohlcv.length - start;\n			this.shared.event = \"step\";\n			state.tf = this.tf;\n			state.data = this.data;\n			state.shared = this.shared;\n			state.mods = this.mods;\n			const ohlcvLen = ohlcv.length;\n			const lastIdx = ohlcvLen - 1;\n			const hasMods1 = mfs1.length > 0;\n			const hasMods2 = mfs2.length > 0;\n			const hasCustomMain = !!this.custom_main;\n			const selLen = sel.length;\n			let lastProgress = 0;\n			for (let i = start; i < ohlcvLen; i++) {\n				if (i % YIELD_FREQUENCY === 0) {\n					await utils_default.pause(0);\n					let progress = Math.floor((i - start) / total * 100);\n					if (progress > lastProgress) {\n						lastProgress = progress;\n						this.send(\"engine-state\", {\n							running: true,\n							progress\n						});\n					}\n				}\n				if (this.restarted()) return;\n				const candle = ohlcv[i];\n				this.iter = i - start;\n				this.t = candle[0];\n				state.t = this.t;\n				state.iter = this.iter;\n				this.step(candle);\n				this.shared.onclose = i !== lastIdx;\n				if (hasMods1) for (let m = 0; m < mfs1.length; m++) mfs1[m](sel);\n				for (let j = 0; j < selLen; j++) {\n					const id = sel[j];\n					if (skip.has(id)) continue;\n					try {\n						this.map[id].env.step();\n					} catch (e) {\n						skip.add(id);\n						this._onScriptError(id, \"exec\", e);\n					}\n				}\n				if (hasMods2) for (let m = 0; m < mfs2.length; m++) mfs2[m](sel);\n				if (hasCustomMain) this.make_ohlcv();\n				this.limit();\n			}\n			for (let j = 0; j < selLen; j++) {\n				const id = sel[j];\n				if (skip.has(id)) continue;\n				try {\n					this.map[id].env.output.post();\n				} catch (e) {\n					skip.add(id);\n					this._onScriptError(id, \"post\", e);\n				}\n			}\n		} catch (e) {\n			console.error(\"Script execution error:\", e);\n			this.send(\"script-error\", {\n				uuid: null,\n				phase: \"engine\",\n				message: e && e.message || String(e)\n			});\n		}\n		this.post_run_mods(sel);\n		this.perf = utils_default.now() - t1;\n		this.running = false;\n		this._buildUpdateTemplate();\n		this.send(\"overlay-data\", this.format_map(sel));\n	}\n	step(data, unshift = true) {\n		if (unshift) {\n			this.open.unshift(data[1]);\n			this.high.unshift(data[2]);\n			this.low.unshift(data[3]);\n			this.close.unshift(data[4]);\n			this.vol.unshift(data[5]);\n		} else {\n			this.open[0] = data[1];\n			this.high[0] = data[2];\n			this.low[0] = data[3];\n			this.close[0] = data[4];\n			this.vol[0] = data[5];\n		}\n		for (let id in this.tss) {\n			let ts = this.tss[id];\n			if (ts.__tf__) ts.__fn__();\n			else if (unshift) ts.unshift(ts.__fn__());\n			else ts[0] = ts.__fn__();\n		}\n	}\n	limit() {\n		this.open.length = this.open.__len__ || DEF_LIMIT;\n		this.high.length = this.high.__len__ || DEF_LIMIT;\n		this.low.length = this.low.__len__ || DEF_LIMIT;\n		this.close.length = this.close.__len__ || DEF_LIMIT;\n		this.vol.length = this.vol.__len__ || DEF_LIMIT;\n	}\n	start(ohlcv) {\n		let depth = this.sett.script_depth;\n		return depth ? Math.max(ohlcv.length - depth, 0) : 0;\n	}\n	drain_queues() {\n		if (this.queue.length) this.exec_all();\n		else if (this.delta_queue.length) {\n			this.exec_sel(this.delta_queue.pop());\n			this.delta_queue = [];\n		} else while (this.update_queue.length) {\n			let c = this.update_queue.shift();\n			this.update(c);\n		}\n	}\n	_bsGTE(arr, t) {\n		let lo = 0, hi = arr.length;\n		while (lo < hi) {\n			let mid = lo + hi >> 1;\n			if (arr[mid][0] < t) lo = mid + 1;\n			else hi = mid;\n		}\n		return lo;\n	}\n	_bsGT(arr, t) {\n		let lo = 0, hi = arr.length;\n		while (lo < hi) {\n			let mid = lo + hi >> 1;\n			if (arr[mid][0] <= t) lo = mid + 1;\n			else hi = mid;\n		}\n		return lo;\n	}\n	_rangeSlice(arr, t1, t2) {\n		if (!arr.length) return arr;\n		let lo = this._bsGTE(arr, t1);\n		let hi = this._bsGT(arr, t2);\n		return lo >= hi ? [] : arr.slice(lo, hi);\n	}\n	format_map(sel, range, output) {\n		sel = sel || Object.keys(this.map);\n		let res = [];\n		for (let id of sel) {\n			let x = this.map[id];\n			let f = (x) => x;\n			if ((x.output === false || x.output === \"none\") && !output) {\n				res.push({\n					id,\n					data: null\n				});\n				continue;\n			}\n			if (x.output === \"range\" || range) {\n				let [t1, t2] = range || this.range;\n				f = (arr) => this._rangeSlice(arr, t1, t2);\n			}\n			res.push({\n				id,\n				data: f(x.env.data),\n				new_ovs: {\n					onchart: ovf(x.env.onchart, f),\n					offchart: ovf(x.env.offchart, f)\n				}\n			});\n		}\n		if (this.custom_main) res.push({\n			id: \"chart\",\n			data: this.data.ohlcv.data\n		});\n		return res;\n	}\n	_buildUpdateTemplate() {\n		let tmpl = [];\n		for (let id in this.map) {\n			let x = this.map[id];\n			if (x.output === false) {\n				tmpl.push({\n					id,\n					src: null\n				});\n				continue;\n			}\n			tmpl.push({\n				id,\n				src: x.env.data\n			});\n			for (let side of [\"onchart\", \"offchart\"]) for (let oid in x.env[side]) tmpl.push({\n				id: `${side}.${oid}`,\n				src: x.env[side][oid].data\n			});\n		}\n		this._updateTemplate = tmpl;\n	}\n	format_update() {\n		let tmpl = this._updateTemplate;\n		if (!tmpl) {\n			this._buildUpdateTemplate();\n			tmpl = this._updateTemplate;\n		}\n		let res = new Array(tmpl.length);\n		for (let i = 0; i < tmpl.length; i++) {\n			let entry = tmpl[i];\n			res[i] = {\n				id: entry.id,\n				data: entry.src ? entry.src[entry.src.length - 1] : null\n			};\n		}\n		return res;\n	}\n	restarted() {\n		if (this._restart) {\n			this._restart = false;\n			this.running = false;\n			this.perf = 0;\n			return true;\n		}\n		return false;\n	}\n	remove_scripts(ids) {\n		for (let id of ids) {\n			delete this.map[id];\n			this._outputCache.delete(id);\n		}\n		this._updateTemplate = null;\n		this.send_state();\n	}\n	pre_run_mods(sel) {\n		for (let id in this.mods) if (this.mods[id].pre_run) this.mods[id].pre_run(sel);\n	}\n	post_run_mods(sel) {\n		for (let id in this.mods) if (this.mods[id].post_run) this.mods[id].post_run(sel);\n	}\n	make_mods_hooks(name) {\n		let modsKey = Object.keys(this.mods).join(\",\");\n		if (modsKey === this._hooksModsKey && this._hooksCache[name]) return this._hooksCache[name];\n		this._hooksModsKey = modsKey;\n		let arr = [];\n		for (let id in this.mods) if (this.mods[id][name]) arr.push(this.mods[id][name].bind(this.mods[id]));\n		this._hooksCache[name] = arr;\n		return arr;\n	}\n	data_required(s) {\n		let all = Object.values(this.map);\n		if (s) all.push(s);\n		let types = [{ type: \"OHLCV\" }];\n		for (let sc of all) if (sc.src.data) {\n			let reqs = Object.values(sc.src.data);\n			types.push(...reqs.map((x) => ({\n				id: sc.uuid,\n				type: x.type\n			})));\n		}\n		let existing = new Set(Object.values(this.data).map((y) => y.type));\n		let unf = types.filter((x) => !existing.has(x.type));\n		return unf.length ? unf : null;\n	}\n	match_ds(id, type) {\n		for (let dsId in this.data) if (this.data[dsId].type === type) return dsId;\n	}\n	make_ohlcv() {\n		let sym = this.custom_main;\n		let tNext = this.t + this.tf;\n		if (sym.update(null, tNext)) this.data.ohlcv.data.push([\n			tNext,\n			sym.open[0],\n			sym.high[0],\n			sym.low[0],\n			sym.close[0],\n			sym.vol[0]\n		]);\n	}\n	recalc_size() {\n		let sz = 0;\n		let maxIter = 100;\n		while (maxIter-- > 0) {\n			sz = size_of_dss(this.data) / (1024 * 1024);\n			let lim = this.sett.ww_ram_limit;\n			if (lim && sz > lim) this.limit_size();\n			else break;\n		}\n		this.data_size = +sz.toFixed(2);\n		this.send_state();\n	}\n	limit_size() {\n		let dss = Object.values(this.data).map((x) => ({\n			id: x.id,\n			t: x.last_upd\n		}));\n		dss.sort((a, b) => a.t - b.t);\n		if (dss.length) delete this.data[dss[0].id];\n	}\n};\nvar script_engine_default = new ScriptEngine();\n//#endregion\n//#region src/helpers/dataset.js\nvar DatasetWW = class {\n	constructor(id, data) {\n		this.last_upd = utils_default.now();\n		this.id = id;\n		if (Array.isArray(data)) {\n			this.data = data;\n			if (id === \"ohlcv\") this.type = \"OHLCV\";\n		} else {\n			this.data = data.data;\n			this.type = data.type;\n		}\n	}\n	static update_all(se, data) {\n		for (var k in data) {\n			if (k === \"ohlcv\") continue;\n			let id = k.split(\".\")[1] || k;\n			if (!se.data[id]) continue;\n			let arr = se.data[id].data;\n			let last = arr[arr.length - 1];\n			for (var dp of data[k]) if (!last || dp[0] > last[0]) arr.push(dp);\n			se.data[id].last_upd = utils_default.now();\n		}\n	}\n	merge(data) {\n		let len = this.data.length;\n		if (!len) {\n			this.data = data;\n			return;\n		}\n		let t0 = this.data[0][0];\n		let tN = this.data[len - 1][0];\n		let l = data.filter((x) => x[0] < t0);\n		let r = data.filter((x) => x[0] > tN);\n		this.data = l.concat(this.data, r);\n	}\n	op(se, op) {\n		this.last_upd = utils_default.now();\n		switch (op.type) {\n			case \"set\":\n				this.data = op.data;\n				se.recalc_size();\n				break;\n			case \"del\":\n				delete se.data[this.id];\n				se.recalc_size();\n				break;\n			case \"mrg\":\n				this.merge(op.data);\n				se.recalc_size();\n				break;\n		}\n	}\n};\n//#endregion\n//#region src/helpers/schema/diagnostics.js\n/**\n* @typedef {Object} Diagnostic\n* @property {'error'|'warn'} level\n* @property {string} code   - stable machine code, e.g. 'ohlcv.row.shape'\n* @property {string} message- human-readable explanation\n* @property {string} [path] - location, e.g. 'chart.data[42]'\n*/\n/** Make a diagnostic. */\nfunction diag(level, code, message, path) {\n	return path !== void 0 ? {\n		level,\n		code,\n		message,\n		path\n	} : {\n		level,\n		code,\n		message\n	};\n}\nconst error = (code, message, path) => diag(\"error\", code, message, path);\nconst warn = (code, message, path) => diag(\"warn\", code, message, path);\n/** True if any diagnostic is error-level. */\nfunction hasErrors(diagnostics) {\n	for (const d of diagnostics) if (d.level === \"error\") return true;\n	return false;\n}\n/** One-line human summary of a diagnostic list (capped). */\nfunction formatDiagnostics(diagnostics, cap = 8) {\n	const shown = diagnostics.slice(0, cap).map((d) => `  [${d.level}] ${d.code}${d.path ? ` @ ${d.path}` : \"\"}: ${d.message}`);\n	const extra = diagnostics.length > cap ? `\\n  …and ${diagnostics.length - cap} more` : \"\";\n	return shown.join(\"\\n\") + extra;\n}\n/**\n* Report diagnostics according to `mode`:\n*   'off'    - do nothing\n*   'warn'   - console.warn errors+warnings (default; non-breaking)\n*   'strict' - throw on any error-level diagnostic (after logging)\n*\n* Returns the (possibly filtered) diagnostics so callers can also surface them\n* on an event bus. Never throws in 'warn'/'off'.\n*\n* @param {Diagnostic[]} diagnostics\n* @param {'off'|'warn'|'strict'} mode\n* @param {string} context - label for the log line, e.g. 'OHLCV data'\n*/\nfunction report(diagnostics, mode = \"warn\", context = \"data\") {\n	if (!diagnostics || !diagnostics.length || mode === \"off\") return diagnostics;\n	const header = `[trading-vue] ${context}: ${diagnostics.length} validation issue(s)`;\n	const body = formatDiagnostics(diagnostics);\n	if (mode === \"strict\" && hasErrors(diagnostics)) {\n		if (typeof console !== \"undefined\") console.error(header + \"\\n\" + body);\n		const err = /* @__PURE__ */ new Error(`${header} (strict mode)\\n${body}`);\n		err.diagnostics = diagnostics;\n		throw err;\n	}\n	if (typeof console !== \"undefined\") (hasErrors(diagnostics) ? console.error : console.warn)(header + \"\\n\" + body);\n	return diagnostics;\n}\n//#endregion\n//#region src/helpers/schema/worker-messages.js\nconst DC_TO_WW_TYPES = new Set([\n	\"update-dc-settings\",\n	\"exec-script\",\n	\"exec-all-scripts\",\n	\"upload-data\",\n	\"upload-module\",\n	\"module-event\",\n	\"update-data\",\n	\"get-dataset\",\n	\"dataset-op\",\n	\"update-ov-settings\",\n	\"send-meta-info\",\n	\"remove-scripts\"\n]);\n/**\n* Validate an inbound worker message envelope.\n* Returns { ok, diagnostics }. `ok:false` => caller should NOT dispatch it.\n* An unknown (but well-formed) type is a warning, not a hard error, so the\n* protocol can be extended without bricking older workers.\n*\n* @param {any} data - the `e.data` from onmessage\n*/\nfunction validateWorkerMessage(data) {\n	const out = [];\n	if (data == null || typeof data !== \"object\") {\n		out.push(error(\"ww.msg.shape\", `worker message is not an object: ${typeof data}`));\n		return {\n			ok: false,\n			diagnostics: out\n		};\n	}\n	if (typeof data.type !== \"string\" || !data.type) {\n		out.push(error(\"ww.msg.type\", \"worker message missing string `type`\"));\n		return {\n			ok: false,\n			diagnostics: out\n		};\n	}\n	if (!DC_TO_WW_TYPES.has(data.type)) {\n		out.push(warn(\"ww.msg.unknown\", `unknown worker message type \"${data.type}\"`));\n		return {\n			ok: true,\n			diagnostics: out\n		};\n	}\n	if (data.type !== \"exec-all-scripts\" && data.type !== \"send-meta-info\" && data.type !== \"module-event\" && data.data === void 0) {\n		out.push(error(\"ww.msg.payload\", `message \"${data.type}\" missing \\`data\\` payload`));\n		return {\n			ok: false,\n			diagnostics: out\n		};\n	}\n	return {\n		ok: true,\n		diagnostics: out\n	};\n}\n//#endregion\n//#region src/helpers/script_dispatch.js\n/**\n* Wire engine -> DC events. The engine calls `se.send(type, data)`; we forward\n* the whitelisted event types to `post` as a `{type, data}` envelope.\n* @param {object} se   - a ScriptEngine instance\n* @param {(msg:any)=>void} post - delivers a message to the DC side\n*/\nfunction wireEngineEvents(se, post) {\n	se.send = (type, data) => {\n		switch (type) {\n			case \"overlay-data\":\n			case \"overlay-update\":\n			case \"engine-state\":\n			case \"modify-overlay\":\n			case \"module-data\":\n			case \"script-signal\":\n			case \"script-error\":\n				post({\n					type,\n					data\n				});\n				break;\n		}\n	};\n}\n/**\n* Build the DC -> engine message dispatcher.\n* @param {object} se   - a ScriptEngine instance\n* @param {(msg:any)=>void} post - delivers a message to the DC side\n* @returns {(msg:any)=>Promise<void>} dispatch(msg)\n*/\nfunction makeDispatcher(se, post) {\n	let data_requested = false;\n	return async function dispatch(msg) {\n		const guard = validateWorkerMessage(msg);\n		if (guard.diagnostics.length) report(guard.diagnostics, \"warn\", \"worker message\");\n		if (!guard.ok) return;\n		switch (msg.type) {\n			case \"update-dc-settings\":\n				se.sett = msg.data;\n				break;\n			case \"exec-script\": {\n				let req = se.data_required(msg.data.s);\n				if (req && !data_requested) {\n					data_requested = true;\n					post({\n						type: \"request-data\",\n						data: req\n					});\n				}\n				se.tf = tf_from_str(msg.data.tf);\n				se.range = msg.data.range;\n				se.queue.push(msg.data.s);\n				se.exec_all();\n				break;\n			}\n			case \"exec-all-scripts\": {\n				let req2 = se.data_required(msg.data && msg.data.s);\n				if (req2 && !data_requested) {\n					data_requested = true;\n					post({\n						type: \"request-data\",\n						data: req2\n					});\n				}\n				se.tf = tf_from_str(msg.data && msg.data.tf);\n				se.range = msg.data && msg.data.range;\n				se.exec_all();\n				break;\n			}\n			case \"upload-data\":\n				post({ type: \"data-uploaded\" });\n				await utils_default.pause(1);\n				for (let id in msg.data) {\n					let data = msg.data[id];\n					se.data[id] = new DatasetWW(id, data);\n				}\n				se.recalc_size();\n				data_requested = false;\n				se.exec_all();\n				break;\n			case \"upload-module\": {\n				let lib = make_module_lib(msg.data);\n				se.mods[msg.data.id] = new new Function(\"mod\", \"se\", \"lib\", f_body(msg.data.main))(msg.data.id, se, lib);\n				break;\n			}\n			case \"module-event\": break;\n			case \"update-data\":\n				DatasetWW.update_all(se, msg.data);\n				if (msg.data.ohlcv) se.update(msg.data.ohlcv);\n				break;\n			case \"get-dataset\":\n				post({\n					id: msg.id,\n					data: se.data[msg.data]\n				});\n				break;\n			case \"dataset-op\":\n				await utils_default.pause(1);\n				if (msg.data.id in se.data) se.data[msg.data.id].op(se, msg.data);\n				if (msg.data.exec) se.exec_all();\n				break;\n			case \"update-ov-settings\":\n				se.tf = tf_from_str(msg.data.tf);\n				se.range = msg.data.range;\n				se.exec_sel(msg.data.delta);\n				break;\n			case \"send-meta-info\":\n				se.tf = tf_from_str(msg.data && msg.data.tf);\n				se.range = msg.data && msg.data.range;\n				break;\n			case \"remove-scripts\":\n				se.remove_scripts(msg.data);\n				break;\n		}\n	};\n}\n//#endregion\n//#region src/helpers/script_ww.js\nconst wwGlobal = typeof self !== \"undefined\" ? self : globalThis;\nwireEngineEvents(script_engine_default, (msg) => wwGlobal.postMessage(msg));\nconst dispatch = makeDispatcher(script_engine_default, (msg) => wwGlobal.postMessage(msg));\nwwGlobal.onmessage = (e) => dispatch(e.data).catch((err) => console.error(\"[ScriptWorker] dispatch failed:\", err));\n//#endregion\n\n//# sourceMappingURL=script_ww-BBRMzHUb.js.map";
var blob = typeof self !== "undefined" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", jsContent], { type: "text/javascript;charset=utf-8" });
function WorkerWrapper(options) {
	let objURL;
	try {
		objURL = blob && (self.URL || self.webkitURL).createObjectURL(blob);
		if (!objURL) throw "";
		const worker = new Worker(objURL, {
			type: "module",
			name: options?.name
		});
		worker.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(objURL);
		});
		return worker;
	} catch (e) {
		return new Worker("data:text/javascript;charset=utf-8," + encodeURIComponent(jsContent), {
			type: "module",
			name: options?.name
		});
	}
}
//#endregion
//#region src/helpers/script_ww_api.js
function deepToRaw(obj) {
	if (obj === null || typeof obj !== "object") return obj;
	if (obj instanceof Date || obj instanceof RegExp) return obj;
	if (isReactive(obj) || isRef(obj)) obj = toRaw(obj);
	if (Array.isArray(obj)) return obj.map((item) => deepToRaw(item));
	const result = {};
	for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) result[key] = deepToRaw(obj[key]);
	return result;
}
var WebWork = class {
	constructor(dc) {
		this.dc = dc;
		this.tasks = {};
		this.msg_queue = [];
		this.onevent = () => {};
		this.start();
	}
	start() {
		if (!(typeof window !== "undefined" && typeof Worker !== "undefined")) {
			this.worker = null;
			return;
		}
		if (this.worker) {
			this.worker.onmessage = null;
			this.worker.terminate();
			this.worker = null;
		}
		this.worker = new WorkerWrapper();
		this.worker.onmessage = (e) => this.onmessage(e);
	}
	start_socket() {
		if (!this.dc.sett.node_url) return;
		this.socket = new WebSocket(this.dc.sett.node_url);
		this._socketMessageHandler = (e) => {
			this.onmessage({ data: JSON.parse(e.data) });
		};
		this._socketErrorHandler = (e) => {
			console.warn("WebSocket error:", e);
		};
		this._socketCloseHandler = () => {
			this.socket = null;
		};
		this.socket.addEventListener("message", this._socketMessageHandler);
		this.socket.addEventListener("error", this._socketErrorHandler);
		this.socket.addEventListener("close", this._socketCloseHandler);
		if (!this.msg_queue) this.msg_queue = [];
	}
	send(msg, tx_keys) {
		if (this.dc.sett.node_url) return this.send_node(msg, tx_keys);
		if (!this.worker) return;
		const rawMsg = deepToRaw(msg);
		if (tx_keys) {
			let tx_objs = tx_keys.map((k) => rawMsg.data[k]);
			this.worker.postMessage(rawMsg, tx_objs);
		} else this.worker.postMessage(rawMsg);
	}
	send_node(msg, tx_keys) {
		if (!this.socket) this.start_socket();
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			while (this.msg_queue.length) {
				let m = this.msg_queue.shift();
				this.socket.send(JSON.stringify(m));
			}
			this.socket.send(JSON.stringify(msg));
		} else {
			if (this.msg_queue.length > 100) this.msg_queue.shift();
			this.msg_queue.push(msg);
		}
	}
	onmessage(e) {
		if (e.data.id in this.tasks) {
			this.tasks[e.data.id](e.data.data);
			delete this.tasks[e.data.id];
		} else this.onevent(e);
	}
	async exec(type, data, tx_keys) {
		if (!this.dc.sett.node_url && !this.worker) return null;
		return new Promise((rs, rj) => {
			let id = utils_default.uuid();
			this.send({
				type,
				id,
				data
			}, tx_keys);
			let timeout = setTimeout(() => {
				delete this.tasks[id];
				rj(/* @__PURE__ */ new Error("Worker task timeout"));
			}, 3e4);
			this.tasks[id] = (res) => {
				clearTimeout(timeout);
				rs(res);
			};
		});
	}
	just(type, data, tx_keys) {
		if (!this.dc.sett.node_url && !this.worker) return;
		let id = utils_default.uuid();
		this.send({
			type,
			id,
			data
		}, tx_keys);
	}
	async relay(event, just = false) {
		if (!this.dc.sett.node_url && !this.worker) return null;
		return new Promise((rs, rj) => {
			this.send(event, event.tx_keys);
			if (!just) {
				let timeout = setTimeout(() => {
					delete this.tasks[event.id];
					rj(/* @__PURE__ */ new Error("Relay task timeout"));
				}, 3e4);
				this.tasks[event.id] = (res) => {
					clearTimeout(timeout);
					rs(res);
				};
			}
		});
	}
	destroy() {
		if (this.worker) {
			this.worker.onmessage = null;
			this.worker.terminate();
			this.worker = null;
		}
		if (this.socket) {
			this.socket.removeEventListener("message", this._socketMessageHandler);
			this.socket.removeEventListener("error", this._socketErrorHandler);
			this.socket.removeEventListener("close", this._socketCloseHandler);
			this.socket.close();
			this.socket = null;
		}
		this.tasks = {};
	}
};
//#endregion
//#region src/helpers/dataset.js
var Dataset = class Dataset {
	constructor(dc, desc) {
		this.type = desc.type;
		this.id = desc.id;
		this.dc = dc;
		if (desc.data) {
			this.dc.ww.just("upload-data", { [this.id]: desc });
			delete desc.data;
		}
		let proto = Object.getPrototypeOf(this);
		Object.setPrototypeOf(desc, proto);
		Object.defineProperty(desc, "dc", { get() {
			return dc;
		} });
	}
	static watcher(n, p) {
		const nMap = new Map(n.map((x) => [x.id, x]));
		const pSet = new Set(p.map((x) => x.id));
		const nSet = new Set(nMap.keys());
		for (const [id, ds] of nMap) if (!pSet.has(id)) this.dss[id] = new Dataset(this, ds);
		for (const id of pSet) if (!nSet.has(id) && this.dss[id]) this.dss[id].remove();
	}
	static make_tx(dc, types) {
		let main = dc.data.chart.data;
		let base = {};
		if (types.find((x) => x.type === "OHLCV")) base = { ohlcv: main };
		return base;
	}
	set(data, exec = true) {
		this.dc.ww.just("dataset-op", {
			id: this.id,
			type: "set",
			data,
			exec
		});
	}
	update(arr) {
		this.dc.ww.just("update-data", { [this.id]: arr });
	}
	merge(data, exec = true) {
		this.dc.ww.just("dataset-op", {
			id: this.id,
			type: "mrg",
			data,
			exec
		});
	}
	remove(exec = true) {
		this.dc.del(`datasets.${this.id}`);
		this.dc.ww.just("dataset-op", {
			id: this.id,
			type: "del",
			exec
		});
		delete this.dc.dss[this.id];
	}
	async data() {
		let ds = await this.dc.ww.exec("get-dataset", this.id);
		if (!ds) return;
		return ds.data;
	}
};
//#endregion
//#region src/helpers/dc_events.js
var DCEvents = class {
	constructor() {
		this.ww = new WebWork(this);
		this.ww.onevent = (e) => {
			for (let ctrl of this.tv.controllers) if (ctrl.ww) ctrl.ww(e.data);
			switch (e.data.type) {
				case "request-data":
					if (this.ww._data_uploading) break;
					let data = Dataset.make_tx(this, e.data.data);
					this.send_meta_2_ww();
					this.ww.just("upload-data", data);
					this.ww._data_uploading = true;
					break;
				case "overlay-data":
					this.on_overlay_data(e.data.data);
					break;
				case "overlay-update":
					this.on_overlay_update(e.data.data);
					break;
				case "data-uploaded":
					this.ww._data_uploading = false;
					break;
				case "engine-state":
					this.se_state = Object.assign(this.se_state || {}, e.data.data);
					break;
				case "modify-overlay":
					this.modify_overlay(e.data.data);
					break;
				case "script-signal":
					this.tv.$emit("signal", e.data.data);
					break;
				case "script-error":
					this.tv.$emit("indicator-error", e.data.data);
					break;
			}
			for (let ctrl of this.tv.controllers) if (ctrl.post_ww) ctrl.post_ww(e.data);
		};
	}
	on_custom_event(event, args) {
		switch (event) {
			case "register-tools":
				this.register_tools(args);
				break;
			case "exec-script":
				this.exec_script(args);
				break;
			case "exec-all-scripts":
				this.exec_all_scripts();
				break;
			case "data-len-changed":
				this.data_changed(args);
				break;
			case "tool-selected":
				if (!args[0]) break;
				if (args[0].split(":")[0] === "System") {
					this.system_tool(args[0].split(":")[1]);
					break;
				}
				this.data["tool"] = args[0];
				if (args[0] === "Cursor") this.drawing_mode_off();
				break;
			case "grid-mousedown":
				this.grid_mousedown(args);
				break;
			case "drawing-mode-off":
				this.drawing_mode_off();
				break;
			case "change-settings":
				this.change_settings(args);
				break;
			case "range-changed":
				this.scripts_onrange(...args);
				break;
			case "scroll-lock":
				this.on_scroll_lock(args[0]);
				break;
			case "object-selected":
				this.object_selected(args);
				break;
			case "remove-tool":
				this.system_tool("Remove");
				break;
			case "before-destroy":
				this.before_destroy();
				break;
		}
	}
	on_settings(values, prev) {
		if (!this.sett.scripts) return;
		let delta = {};
		let changed = false;
		for (let i = 0; i < values.length; i++) {
			let n = values[i];
			if (!prev.filter((x) => x.v === n.v).length && n.p.settings.$props) {
				let id = n.p.settings.$uuid;
				if (utils_default.is_scr_props_upd(n, prev) && utils_default.delayed_exec(n.p)) {
					delta[id] = n.v;
					changed = true;
					n.p["loading"] = true;
				}
			}
		}
		if (changed && Object.keys(delta).length) {
			let tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
			let range = this.tv.getRange();
			this.ww.just("update-ov-settings", {
				delta,
				tf,
				range
			});
		}
	}
	on_ids_changed(values, prev) {
		const valuesSet = new Set(values);
		let rem = prev.filter((x) => x !== void 0 && !valuesSet.has(x));
		if (rem.length) this.ww.just("remove-scripts", rem);
	}
	register_tools(tools) {
		let preset = {};
		for (let tool of this.data.tools || []) {
			preset[tool.type] = tool;
			delete tool.type;
		}
		this.data["tools"] = [];
		let list = [{
			type: "Cursor",
			icon: icons_default["cursor.png"]
		}];
		for (let tool of tools) {
			let proto = Object.assign({}, tool.info);
			let type = tool.info.type || "Default";
			proto.type = `${tool.use_for}:${type}`;
			this.merge_presets(proto, preset[tool.use_for]);
			this.merge_presets(proto, preset[proto.type]);
			delete proto.mods;
			list.push(proto);
			for (let mod in tool.info.mods) {
				let mp = Object.assign({}, proto);
				mp = Object.assign(mp, tool.info.mods[mod]);
				mp.type = `${tool.use_for}:${mod}`;
				this.merge_presets(mp, preset[tool.use_for]);
				this.merge_presets(mp, preset[mp.type]);
				list.push(mp);
			}
		}
		this.data["tools"] = list;
		this.data["tool"] = "Cursor";
	}
	exec_script(args) {
		if (args.length && this.sett.scripts) {
			let obj = this.get_overlay(args[0]);
			if (!obj || obj.scripts === false) return;
			if (obj.script && obj.script.src) args[0].src = obj.script.src;
			let s = obj.settings;
			let props = args[0].src.props || {};
			if (!s.$uuid) s.$uuid = `${obj.type}-${utils_default.uuid2()}`;
			args[0].uuid = s.$uuid;
			args[0].sett = s;
			for (let k in props || {}) {
				let proto = props[k];
				if (s[k] !== void 0) {
					proto.val = s[k];
					continue;
				}
				if (proto.def === void 0) {
					console.error(`Overlay ${obj.id}: script prop '${k}' doesn't have a default value`);
					return;
				}
				s[k] = proto.val = proto.def;
			}
			if (s.$props) {
				for (let k in s) if (s.$props.includes(k) && !(k in props)) delete s[k];
			}
			s.$props = Object.keys(args[0].src.props || {});
			obj["loading"] = true;
			let tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
			let range = this.tv.getRange();
			if (obj.script && obj.script.output != null) args[0].output = obj.script.output;
			this.ww.just("exec-script", {
				s: args[0],
				tf,
				range
			});
		}
	}
	exec_all_scripts() {
		if (!this.sett.scripts) return;
		this.set_loading(true);
		let tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
		let range = this.tv.getRange();
		this.ww.just("exec-all-scripts", {
			tf,
			range
		});
	}
	scripts_onrange(r) {
		if (!this.sett.scripts) return;
		let delta = {};
		this.get(".").forEach((v) => {
			if (v.script && v.script.execOnRange && v.settings.$uuid) {
				if (utils_default.delayed_exec(v)) delta[v.settings.$uuid] = v.settings;
			}
		});
		if (Object.keys(delta).length) {
			let tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
			let range = this.tv.getRange();
			this.ww.just("update-ov-settings", {
				delta,
				tf,
				range
			});
		}
	}
	modify_overlay(upd) {
		let obj = this.get_overlay(upd);
		if (obj) for (let k in upd.fields || {}) if (typeof obj[k] === "object") this.merge(`${upd.uuid}.${k}`, upd.fields[k]);
		else obj[k] = upd.fields[k];
	}
	data_changed(args) {
		if (!this.sett.scripts) return;
		if (this.sett.data_change_exec === false) return;
		let main = this.data.chart.data;
		if (this.ww._data_uploading) return;
		if (!this.se_state.scripts) return;
		this.send_meta_2_ww();
		this.ww.just("upload-data", { ohlcv: main });
		this.ww._data_uploading = true;
		this.set_loading(true);
	}
	set_loading(flag) {
		let skrr = this.get(".").filter((x) => x.settings.$props);
		for (let s of skrr) this.merge(`${s.id}`, { loading: flag });
	}
	send_meta_2_ww() {
		let tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
		let range = this.tv.getRange();
		this.ww.just("send-meta-info", {
			tf,
			range
		});
	}
	merge_presets(proto, preset) {
		if (!preset) return;
		for (let k in preset) if (k === "settings") Object.assign(proto[k], preset[k]);
		else proto[k] = preset[k];
	}
	grid_mousedown(args) {
		this.object_selected([]);
		let rem = () => this.get("RangeTool").filter((x) => x.settings.shiftMode).forEach((x) => this.del(x.id));
		if (this.data.tool && this.data.tool !== "Cursor" && !this.data.drawingMode) if (args[1].type !== "tap") {
			this.data["drawingMode"] = true;
			this.build_tool(args[0]);
		} else this.tv.showTheTip("<b>Hodl</b>+<b>Drug</b> to create, <b>Tap</b> to finish a tool");
		else if (this.sett.shift_measure && args[1].shiftKey) {
			rem();
			this.tv.$nextTick(() => this.build_tool(args[0], "RangeTool:ShiftMode"));
		} else rem();
	}
	drawing_mode_off() {
		this.data["drawingMode"] = false;
		this.data["tool"] = "Cursor";
	}
	build_tool(grid_id, type) {
		let list = this.data.tools;
		type = type || this.data.tool;
		let proto = list.find((x) => x.type === type);
		if (!proto) return;
		let sett = Object.assign({}, proto.settings || {});
		let data = (proto.data || []).slice();
		if (!("legend" in sett)) sett.legend = false;
		if (!("z-index" in sett)) sett["z-index"] = 100;
		sett.$selected = true;
		sett.$state = "wip";
		let side = grid_id ? "offchart" : "onchart";
		sett.$uuid = `${this.add(side, {
			name: proto.name,
			type: type.split(":")[0],
			settings: sett,
			data,
			grid: { id: grid_id }
		})}-${utils_default.now()}`;
		this.data["selected"] = sett.$uuid;
		this.add_trash_icon();
	}
	system_tool(type) {
		switch (type) {
			case "Remove":
				if (this.data.selected) {
					this.del(this.data.selected);
					this.remove_trash_icon();
					this.drawing_mode_off();
					this.on_scroll_lock(false);
				}
				break;
		}
	}
	change_settings(args) {
		let settings = args[0];
		delete settings.id;
		args[1];
		this.merge(`${args[3]}.settings`, settings);
	}
	on_scroll_lock(flag) {
		this.data["scrollLock"] = flag;
	}
	object_selected(args) {
		let q = this.data.selected;
		if (q) {
			this.merge(`${q}.settings`, { $selected: false });
			this.remove_trash_icon();
		}
		this.data["selected"] = null;
		if (!args.length) return;
		this.data["selected"] = args[2];
		this.merge(`${args[2]}.settings`, { $selected: true });
		this.add_trash_icon();
	}
	add_trash_icon() {
		const type = "System:Remove";
		if (this.data.tools.find((x) => x.type === type)) return;
		this.data.tools.push({
			type,
			icon: icons_default["trash.png"]
		});
	}
	remove_trash_icon() {
		const type = "System:Remove";
		utils_default.overwrite(this.data.tools, this.data.tools.filter((x) => x.type !== type));
	}
	on_overlay_data(data) {
		this.get(".").forEach((x) => {
			if (x.settings.$synth) this.del(`${x.id}`);
		});
		for (let ov of data) {
			let obj = this.get_one(`${ov.id}`);
			if (obj) {
				obj["loading"] = false;
				if (!ov.data) continue;
				obj.data = ov.data;
			}
			if (!ov.new_ovs) continue;
			for (let id in ov.new_ovs.onchart) if (!this.get_one(`onchart.${id}`)) this.add("onchart", ov.new_ovs.onchart[id]);
			for (let id in ov.new_ovs.offchart) if (!this.get_one(`offchart.${id}`)) this.add("offchart", ov.new_ovs.offchart[id]);
		}
	}
	on_overlay_update(data) {
		for (let ov of data) {
			if (!ov.data) continue;
			let obj = this.get_one(`${ov.id}`);
			if (obj) this.fast_merge(obj.data, ov.data, false);
		}
	}
	before_destroy() {
		let f = (x) => !x.settings.$state || x.settings.$state === "finished";
		this.data.onchart = this.data.onchart.filter(f);
		this.data.offchart = this.data.offchart.filter(f);
		this.drawing_mode_off();
		this.on_scroll_lock(false);
		this.object_selected([]);
		this.ww.destroy();
	}
	get_overlay(obj) {
		let id = obj.id || `g${obj.grid_id}_${obj.layer_id}`;
		let dcid = obj.uuid || this.gldc[id];
		return this.get_one(`${dcid}`);
	}
};
//#endregion
//#region node_modules/mitt/dist/mitt.mjs
function mitt_default(n) {
	return {
		all: n = n || /* @__PURE__ */ new Map(),
		on: function(t, e) {
			var i = n.get(t);
			i ? i.push(e) : n.set(t, [e]);
		},
		off: function(t, e) {
			var i = n.get(t);
			i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []));
		},
		emit: function(t, e) {
			var i = n.get(t);
			i && i.slice().map(function(n) {
				n(e);
			}), (i = n.get("*")) && i.slice().map(function(n) {
				n(t, e);
			});
		}
	};
}
//#endregion
//#region src/stuff/eventBus.js
var emitter = mitt_default();
//#endregion
//#region src/stores/query.js
/**
* @typedef {Object} QueryCtx
* @property {Object} data - the DataCube data object ({chart,onchart,offchart,datasets,...})
* @property {Object} [dss] - dataset proxies keyed by id (for `datasets.*` queries)
*/
/** Resolve a chart.* query into a pivot list. */
function chartAsPiv(data, tuple) {
	let field = tuple[1];
	if (field) return [{
		p: data.chart,
		i: field,
		v: data.chart[field]
	}];
	else return [{
		p: data,
		i: "chart",
		v: data.chart
	}];
}
/** Search onchart/offchart (or datasets) for objects matching the query. */
function querySearch(data, query, tuple) {
	let side = tuple[0];
	let path = tuple[1] || "";
	let field = tuple[2];
	let arr = data[side].filter((x) => x.id === query || x.id && x.id.includes(path) || x.name === query || x.name && x.name.includes(path) || query.includes((x.settings || {}).$uuid));
	if (field) return arr.map((x) => ({
		p: x,
		i: field,
		v: x[field]
	}));
	const sideData = data[side];
	const indexMap = new Map(sideData.map((item, idx) => [item, idx]));
	return arr.map((x) => ({
		p: sideData,
		i: indexMap.get(x),
		v: x
	}));
}
/**
* Resolve a string-path query against the data model.
* @param {QueryCtx} ctx
* @param {string} query  e.g. 'chart.data', 'onchart.EMA', 'RSI', '.settings'
* @param {boolean} [chuck] include locked overlays
* @returns {Array<{p:any,i:any,v:any}>}
*/
function getByQuery(ctx, query, chuck) {
	const data = ctx.data;
	const dss = ctx.dss;
	let tuple = query.split(".");
	let result;
	switch (tuple[0]) {
		case "chart":
			result = chartAsPiv(data, tuple);
			break;
		case "onchart":
		case "offchart":
			result = querySearch(data, query, tuple);
			break;
		case "datasets":
			result = querySearch(data, query, tuple);
			for (let r of result) if (r.i === "data") r.v = dss[r.p.id].data();
			break;
		default:
			let on = querySearch(data, query, [
				"onchart",
				tuple[0],
				tuple[1]
			]);
			let off = querySearch(data, query, [
				"offchart",
				tuple[0],
				tuple[1]
			]);
			result = [...on, ...off];
			break;
	}
	return result.filter((x) => !(x.v || {}).locked || chuck);
}
//#endregion
//#region src/stores/merge.js
/** Reactive object merge: assign over a fresh object so Vue sees the change. */
function mergeObjects(obj, data, new_obj = {}) {
	Object.assign(new_obj, obj.v);
	Object.assign(new_obj, data);
	obj.p[obj.i] = new_obj;
}
/** Binary search: first index where arr[i][0] >= target (-1 if none). */
function binarySearchGTE(arr, target) {
	if (!arr.length) return -1;
	let lo = 0, hi = arr.length - 1;
	while (lo < hi) {
		let mid = lo + hi >> 1;
		if (arr[mid][0] < target) lo = mid + 1;
		else hi = mid;
	}
	return arr[lo][0] >= target ? lo : -1;
}
/** Binary search: last index where arr[i][0] <= target (-1 if none). */
function binarySearchLTE(arr, target) {
	if (!arr.length) return -1;
	let lo = 0, hi = arr.length - 1;
	while (lo < hi) {
		let mid = lo + hi + 1 >> 1;
		if (arr[mid][0] > target) hi = mid - 1;
		else lo = mid;
	}
	return arr[lo][0] <= target ? lo : -1;
}
/** Compute the overlapping region of two sorted series. O(n) via binary search. */
function tsOverlap(arr1, arr2, range) {
	const t1 = range[0];
	const t2 = range[1];
	let ts = /* @__PURE__ */ new Map();
	let id11 = binarySearchGTE(arr1, t1);
	let id12 = binarySearchLTE(arr1, t2);
	let id21 = binarySearchGTE(arr2, t1);
	let id22 = binarySearchLTE(arr2, t2);
	if (id11 === -1 || id12 === -1 || id11 > id12) {
		id11 = 0;
		id12 = -1;
	}
	if (id21 === -1 || id22 === -1 || id21 > id22) {
		id21 = 0;
		id22 = -1;
	}
	for (let i = id11; i <= id12 && i < arr1.length; i++) ts.set(arr1[i][0], arr1[i]);
	for (let i = id21; i <= id22 && i < arr2.length; i++) ts.set(arr2[i][0], arr2[i]);
	return {
		od: Array.from(ts.keys()).sort((a, b) => a - b).map((k) => ts.get(k)),
		d1: [id11, Math.max(0, id12 - id11 + 1)],
		d2: [id21, Math.max(0, id22 - id21 + 1)]
	};
}
/** Combine (destination, overlap, source) parts into one ordered series. */
function combine(dst, o, src) {
	function last(arr) {
		return arr[arr.length - 1][0];
	}
	if (!dst.length) {
		dst = o;
		o = [];
	}
	if (!src.length) {
		src = o;
		o = [];
	}
	if (src[0][0] >= dst[0][0] && last(src) <= last(dst)) return Object.assign(dst, o);
	else if (last(src) > last(dst)) if (o.length < 1e5 && src.length < 1e5) {
		dst.push(...o, ...src);
		return dst;
	} else return dst.concat(o, src);
	else if (src[0][0] < dst[0][0]) if (o.length < 1e5 && src.length < 1e5) {
		src.push(...o, ...dst);
		return src;
	} else return src.concat(o, dst);
	else return [];
}
/** Merge an overlapping source series into the dst pivot (both pre-sorted). */
function mergeTs(obj, data) {
	if (!data.length) return obj.v;
	let r1 = [obj.v[0][0], obj.v[obj.v.length - 1][0]];
	let r2 = [data[0][0], data[data.length - 1][0]];
	let o = [Math.max(r1[0], r2[0]), Math.min(r1[1], r2[1])];
	if (o[1] >= o[0]) {
		let { od, d1, d2 } = tsOverlap(obj.v, data, o);
		obj.v.splice(...d1);
		data.splice(...d2);
		if (!obj.v.length && !data.length) {
			obj.p[obj.i] = od;
			return obj.v;
		}
		if (!data.length) data = obj.v.splice(d1[0]);
		if (!obj.v.length) obj.v = data.splice(d2[0]);
		obj.p[obj.i] = combine(obj.v, od, data);
	} else obj.p[obj.i] = combine(obj.v, [], data);
	return obj.v;
}
//#endregion
//#region src/stores/chart-ui.js
var ChartUI = class {
	/**
	* @param {object} backing - object holding the UI fields (DataCube.data).
	*/
	constructor(backing = {}) {
		this._b = backing;
		if (this._b.tools === void 0) this._b.tools = [];
	}
	/** Active drawing tool type, e.g. 'Cursor' | 'LineTool:Segment'. */
	get tool() {
		return this._b.tool;
	}
	set tool(v) {
		this._b.tool = v;
	}
	/** Whether a tool drawing gesture is in progress. */
	get drawingMode() {
		return !!this._b.drawingMode;
	}
	setDrawingMode(v) {
		this._b.drawingMode = !!v;
	}
	/** Whether chart scrolling is locked (during tool interaction). */
	get scrollLock() {
		return !!this._b.scrollLock;
	}
	setScrollLock(v) {
		this._b.scrollLock = !!v;
	}
	/** $uuid of the currently selected object (or null). */
	get selected() {
		return this._b.selected != null ? this._b.selected : null;
	}
	select(uuid) {
		this._b.selected = uuid;
	}
	deselect() {
		this._b.selected = null;
	}
	/** Registered drawing tools list. */
	get tools() {
		return this._b.tools || [];
	}
	set tools(v) {
		this._b.tools = v;
	}
	hasTool(type) {
		return !!(this._b.tools || []).find((t) => t.type === type);
	}
	/** Reset interaction state to defaults (e.g. on tool finish). */
	resetInteraction() {
		this._b.drawingMode = false;
		this._b.scrollLock = false;
	}
};
//#endregion
//#region src/stores/chart-data.js
var ChartData = class {
	/**
	* @param {object} ctx
	* @param {object} ctx.data - DataCube data object (live ref / getter)
	* @param {object} [ctx.dss] - dataset proxies
	* @param {()=>void} [ctx.updateIds] - rebuild id maps after a structural change
	*/
	constructor(ctx) {
		this._ctx = ctx;
		if (!this._ctx.updateIds) this._ctx.updateIds = () => {};
		const rev = ref(0);
		this.invalidate = () => {
			rev.value++;
		};
		this.revision = () => rev.value;
	}
	get data() {
		return this._ctx.data;
	}
	_q() {
		return {
			data: this._ctx.data,
			dss: this._ctx.dss
		};
	}
	query(query, chuck) {
		return getByQuery(this._q(), query, chuck);
	}
	get(query) {
		return this.query(query).map((x) => x.v);
	}
	getOne(query) {
		return this.query(query).map((x) => x.v)[0];
	}
	set(query, data) {
		for (var obj of this.query(query)) {
			let i = obj.i !== void 0 ? obj.i : obj.p.indexOf(obj.v);
			if (i !== -1) obj.p[i] = data;
		}
		this._ctx.updateIds();
	}
	merge(query, data) {
		for (var obj of this.query(query)) if (Array.isArray(obj.v)) {
			if (!Array.isArray(data)) continue;
			if (obj.v[0] && obj.v[0].length >= 2) mergeTs(obj, data);
			else mergeObjects(obj, data, []);
		} else if (typeof obj.v === "object") mergeObjects(obj, data);
		this._ctx.updateIds();
	}
	del(query) {
		for (var obj of this.query(query)) {
			let i = typeof obj.i !== "number" ? obj.i : obj.p.indexOf(obj.v);
			if (i !== -1) obj.p.splice(i, 1);
		}
		this._ctx.updateIds();
	}
	add(side, overlay) {
		if (side !== "onchart" && side !== "offchart" && side !== "datasets") return;
		this._ctx.data[side].push(overlay);
		this._ctx.updateIds();
		return overlay.id;
	}
	lock(query) {
		this.query(query).forEach((x) => {
			if (x.v && x.v.id && x.v.type) x.v.locked = true;
		});
	}
	unlock(query) {
		this.query(query, true).forEach((x) => {
			if (x.v && x.v.id && x.v.type) x.v.locked = false;
		});
	}
};
//#endregion
//#region src/helpers/dc_core.js
var DCCore = class extends DCEvents {
	init_tvjs($root) {
		if (!this.tv) {
			this.tv = $root;
			this.init_data();
			this.update_ids();
			this._cachedSettings = null;
			this._cachedSettingsKey = null;
			this._settingsUnwatch = this.tv.$watch(() => {
				const settings = this.get_by_query(".settings");
				const key = settings.map((s) => JSON.stringify(s.v)).join("|");
				if (key !== this._cachedSettingsKey) {
					this._cachedSettingsKey = key;
					this._cachedSettings = settings;
				}
				return this._cachedSettings;
			}, (n, p) => {
				this.on_settings(n, p);
				emitter.emit("settings-changed", {
					newVal: n,
					oldVal: p
				});
			});
			this._cachedIds = null;
			this._cachedIdsKey = null;
			this._idsUnwatch = this.tv.$watch(() => {
				const ids = this.get(".").map((x) => x.settings.$uuid);
				const key = ids.join(",");
				if (key !== this._cachedIdsKey) {
					this._cachedIdsKey = key;
					this._cachedIds = ids;
				}
				return this._cachedIds;
			}, (n, p) => this.on_ids_changed(n, p));
			this._datasetsUnwatch = this.tv.$watch(() => this.get("datasets"), Dataset.watcher.bind(this));
		}
	}
	destroy() {
		if (this._settingsUnwatch) this._settingsUnwatch();
		if (this._idsUnwatch) this._idsUnwatch();
		if (this._datasetsUnwatch) this._datasetsUnwatch();
	}
	init_data($root) {
		if (!("chart" in this.data)) this.data["chart"] = {
			type: "Candles",
			data: this.data.ohlcv || []
		};
		if (!("onchart" in this.data)) this.data["onchart"] = [];
		if (!("offchart" in this.data)) this.data["offchart"] = [];
		if (!this.data.chart.settings) this.data.chart["settings"] = {};
		delete this.data.ohlcv;
		if (!("datasets" in this.data)) this.data["datasets"] = [];
		for (let ds of this.data.datasets) {
			if (!this.dss) this.dss = {};
			this.dss[ds.id] = new Dataset(this, ds);
		}
		this.ui = new ChartUI(this.data);
		this.cd;
		Object.defineProperty(this.data, "$cd", {
			value: this.cd,
			enumerable: false,
			configurable: true,
			writable: true
		});
	}
	get cd() {
		if (!this._cd) {
			const self = this;
			this._cd = new ChartData({
				get data() {
					return self.data;
				},
				get dss() {
					return self.dss;
				},
				updateIds: () => self.update_ids()
			});
		}
		return this._cd;
	}
	touchData() {
		this.cd.invalidate();
	}
	async range_changed(range, tf, check = false) {
		if (!this.loader) return;
		if (!this.loading) {
			if (!this.data.chart.data.length) return;
			let first = this.data.chart.data[0][0];
			if (range[0] < first) {
				this.loading = true;
				await utils_default.pause(250);
				range = range.slice();
				range[0] = Math.floor(range[0]);
				range[1] = Math.floor(first);
				let prom = this.loader(range, tf, (d) => {
					this.chunk_loaded(d);
				});
				if (prom && prom.then) this.chunk_loaded(await prom);
			}
		}
		if (!check) this.last_chunk = [range, tf];
	}
	chunk_loaded(data) {
		if (Array.isArray(data)) this.merge("chart.data", data);
		else for (let k in data) this.merge(k, data[k]);
		this.loading = false;
		if (this.last_chunk) {
			this.range_changed(...this.last_chunk, true);
			this.last_chunk = null;
		}
	}
	update_ids() {
		this.data.chart.id = `chart.${this.data.chart.type}`;
		let count = {};
		this.gldc = {}, this.dcgl = {};
		for (let ov of this.data.onchart) {
			if (count[ov.type] === void 0) count[ov.type] = 0;
			let i = count[ov.type]++;
			ov.id = `onchart.${ov.type}${i}`;
			if (!ov.name) ov.name = ov.type + ` ${i}`;
			if (!ov.settings) ov["settings"] = {};
			this.gldc[`g0_${ov.type}_${i}`] = ov.id;
			this.dcgl[ov.id] = `g0_${ov.type}_${i}`;
		}
		count = {};
		let grids = [{}];
		let gid = 0;
		for (let ov of this.data.offchart) {
			if (count[ov.type] === void 0) count[ov.type] = 0;
			let i = count[ov.type]++;
			ov.id = `offchart.${ov.type}${i}`;
			if (!ov.name) ov.name = ov.type + ` ${i}`;
			if (!ov.settings) ov["settings"] = {};
			gid++;
			let rgid = (ov.grid || {}).id || gid;
			if ((ov.grid || {}).id) gid--;
			if (!grids[rgid]) grids[rgid] = {};
			if (grids[rgid][ov.type] === void 0) grids[rgid][ov.type] = 0;
			let ri = grids[rgid][ov.type]++;
			this.gldc[`g${rgid}_${ov.type}_${ri}`] = ov.id;
			this.dcgl[ov.id] = `g${rgid}_${ov.type}_${ri}`;
		}
	}
	update_candle(data) {
		let ohlcv = this.data.chart.data;
		if (!ohlcv.length) return false;
		let last = ohlcv[ohlcv.length - 1];
		let candle = data["candle"];
		let tf = this.tv.$refs.chart.interval_ms;
		let t_next = last[0] + tf;
		let now = data.t || utils_default.now();
		let t = now >= t_next ? now - now % tf : last[0];
		if (candle.length >= 6) t = candle[0];
		else candle = [t, ...candle];
		this.agg.push("ohlcv", candle);
		this.update_overlays(data, t, tf);
		return t >= t_next;
	}
	update_tick(data) {
		let ohlcv = this.data.chart.data;
		let last = ohlcv[ohlcv.length - 1];
		if (!last && !ohlcv.length) return false;
		let tick = data["price"];
		let volume = data["volume"] || 0;
		let tf = this.tv.$refs.chart.interval_ms;
		if (!tf) return console.warn("Define the main timeframe");
		let now = data.t || utils_default.now();
		if (!last) last = [now - now % tf];
		let t_next = last[0] + tf;
		let t = now >= t_next ? now - now % tf : last[0];
		if ((t >= t_next || !ohlcv.length) && tick !== void 0) {
			let nc = [
				t,
				tick,
				tick,
				tick,
				tick,
				volume
			];
			this.agg.push("ohlcv", nc, tf);
			ohlcv.push(nc);
			this.scroll_to(t);
			this.touchData();
		} else if (tick !== void 0) {
			last[2] = Math.max(tick, last[2]);
			last[3] = Math.min(tick, last[3]);
			last[4] = tick;
			last[5] += volume;
			this.agg.push("ohlcv", last, tf);
			this.touchData();
		}
		this.update_overlays(data, t, tf);
		return t >= t_next;
	}
	update_overlays(data, t, tf) {
		for (let k in data) {
			if (k === "price" || k === "volume" || k === "candle" || k === "t") continue;
			if (k.includes("datasets.")) {
				this.agg.push(k, data[k], tf);
				continue;
			}
			let val;
			if (!Array.isArray(data[k])) val = [data[k]];
			else val = data[k];
			if (!k.includes(".data")) k += ".data";
			this.agg.push(k, [t, ...val], tf);
		}
	}
	get_by_query(query, chuck) {
		return getByQuery({
			data: this.data,
			dss: this.dss
		}, query, chuck);
	}
	chart_as_piv(tuple) {
		return chartAsPiv(this.data, tuple);
	}
	query_search(query, tuple) {
		return querySearch(this.data, query, tuple);
	}
	merge_objects(obj, data, new_obj = {}) {
		return mergeObjects(obj, data, new_obj);
	}
	merge_ts(obj, data) {
		return mergeTs(obj, data);
	}
	ts_overlap(arr1, arr2, range) {
		return tsOverlap(arr1, arr2, range);
	}
	binarySearchGTE(arr, target) {
		return binarySearchGTE(arr, target);
	}
	binarySearchLTE(arr, target) {
		return binarySearchLTE(arr, target);
	}
	combine(dst, o, src) {
		return combine(dst, o, src);
	}
	fast_merge(data, point, main = true) {
		if (!data) return;
		let last_t = (data[data.length - 1] || [])[0];
		let upd_t = point[0];
		if (!data.length || upd_t > last_t) {
			data.push(point);
			if (main && this.sett.auto_scroll) this.scroll_to(upd_t);
			this.touchData();
		} else if (upd_t === last_t) {
			data[data.length - 1] = point;
			this.touchData();
		}
	}
	scroll_to(t) {
		if (this.tv.$refs.chart.cursor.locked) return;
		let last = this.tv.$refs.chart.last_candle;
		if (!last) return;
		let tl = last[0];
		let d = this.tv.getRange()[1] - tl;
		if (d > 0) this.tv.goto(t + d);
	}
};
//#endregion
//#region src/helpers/sett_proxy.js
function sett_proxy_default(sett, ww) {
	const h = {
		get: function(sett, k) {
			return sett[k];
		},
		set: function(sett, k, v) {
			sett[k] = v;
			ww.just("update-dc-settings", sett);
			return true;
		}
	};
	ww.just("update-dc-settings", sett);
	return new Proxy(sett, h);
}
//#endregion
//#region src/helpers/agg_tool.js
var AggTool = class {
	constructor(dc, int = 100) {
		this.symbols = {};
		this.int = int;
		this.dc = dc;
		this.st_id = null;
		this.raf_id = null;
		this.data_changed = false;
		this._lastUpdate = 0;
	}
	push(sym, upd, tf) {
		if (!this.st_id) this.st_id = setTimeout(() => this.update());
		tf = parseInt(tf);
		let old = this.symbols[sym];
		let t = utils_default.now();
		let isds = sym.includes("datasets.");
		this.data_changed = true;
		if (!old) this.symbols[sym] = {
			upd,
			t,
			data: []
		};
		else if (upd[0] >= old.upd[0] + tf && !isds) {
			this.refine(sym, old.upd.slice());
			this.symbols[sym] = {
				upd,
				t,
				data: []
			};
		} else {
			this.symbols[sym].upd = upd;
			this.symbols[sym].t = t;
		}
		if (isds) this.symbols[sym].data.push(upd);
	}
	update() {
		let out = {};
		for (let sym in this.symbols) {
			let upd = this.symbols[sym].upd;
			let data;
			switch (sym) {
				case "ohlcv":
					data = this.dc.data.chart.data;
					this.dc.fast_merge(data, upd);
					out.ohlcv = data.slice(-2);
					break;
				default:
					if (sym.includes("datasets.")) {
						this.update_ds(sym, out);
						continue;
					}
					data = this.dc.get_one(`${sym}`);
					if (!data) continue;
					this.dc.fast_merge(data, upd, false);
					break;
			}
		}
		if (this.data_changed) {
			this.dc.ww.just("update-data", out);
			this.data_changed = false;
		}
		this._scheduleNextUpdate();
	}
	_scheduleNextUpdate() {
		const elapsed = Date.now() - this._lastUpdate;
		const remaining = Math.max(0, this.int - elapsed);
		if (this.st_id) {
			clearTimeout(this.st_id);
			this.st_id = null;
		}
		this.st_id = setTimeout(() => {
			this.st_id = null;
			this.raf_id = requestAnimationFrame(() => {
				this.raf_id = null;
				this._lastUpdate = Date.now();
				this.update();
			});
		}, remaining);
	}
	refine(sym, upd) {
		let data;
		if (sym === "ohlcv") {
			data = this.dc.data.chart.data;
			this.dc.fast_merge(data, upd);
		} else {
			data = this.dc.get_one(`${sym}`);
			if (!data) return;
			this.dc.fast_merge(data, upd, false);
		}
	}
	update_ds(sym, out) {
		let data = this.symbols[sym].data;
		if (data.length) {
			out[sym] = data;
			this.symbols[sym].data = [];
		}
	}
	clear() {
		this.symbols = {};
	}
	destroy() {
		if (this.st_id) {
			clearTimeout(this.st_id);
			this.st_id = null;
		}
		if (this.raf_id) {
			cancelAnimationFrame(this.raf_id);
			this.raf_id = null;
		}
		this.symbols = {};
	}
};
//#endregion
//#region src/helpers/schema/validate.js
var isArr = Array.isArray;
var isNum = (v) => typeof v === "number" && Number.isFinite(v);
var isStr = (v) => typeof v === "string" && v.length > 0;
/**
* Validate a single OHLCV candle row: [t, o, h, l, c, v, ...extras].
* `prevTs` (optional) enables ascending-order / duplicate detection for feeds.
* Pushes diagnostics into `out`. Returns nothing.
*/
function validateCandle(row, path, out, prevTs) {
	if (!isArr(row)) {
		out.push(error("ohlcv.row.shape", "candle is not an array", path));
		return;
	}
	if (row.length < 6) {
		out.push(error("ohlcv.row.length", `candle has ${row.length} fields, expected >= 6 [t,o,h,l,c,v]`, path));
		return;
	}
	if (!isNum(row[0])) out.push(error("ohlcv.row.time", `timestamp is not a finite number: ${row[0]}`, path));
	for (let k = 1; k <= 4; k++) if (!isNum(row[k])) out.push(error("ohlcv.row.ohlc", `OHLC field [${k}] is not a finite number: ${row[k]}`, path));
	if (row[5] != null && typeof row[5] !== "number") out.push(warn("ohlcv.row.volume", `volume is not a number: ${row[5]}`, path));
	if (prevTs != null && isNum(row[0])) {
		if (row[0] === prevTs) out.push(warn("ohlcv.order.duplicate", `duplicate timestamp ${row[0]}`, path));
		else if (row[0] < prevTs) out.push(warn("ohlcv.order.descending", `timestamp ${row[0]} < previous ${prevTs} (must be ascending)`, path));
	}
}
/** Validate an OHLCV series. Caps per-issue noise; checks ordering across rows. */
function validateOHLCV(data, basePath, out) {
	if (!isArr(data)) {
		out.push(error("ohlcv.shape", "chart data is not an array", basePath));
		return;
	}
	let prevTs;
	let shapeErrs = 0;
	for (let i = 0; i < data.length; i++) {
		const before = out.length;
		validateCandle(data[i], `${basePath}[${i}]`, out, prevTs);
		if (out.length > before) {
			shapeErrs++;
			if (shapeErrs > 10) {
				out.push(warn("ohlcv.truncated", `further row issues suppressed after ${i + 1} rows`, basePath));
				break;
			}
		}
		const row = data[i];
		if (isArr(row) && isNum(row[0])) prevTs = row[0];
	}
}
/** Validate an onchart/offchart overlay object. */
function validateOverlay(ov, path, out) {
	if (!ov || typeof ov !== "object") {
		out.push(error("overlay.shape", "overlay is not an object", path));
		return;
	}
	if (!isStr(ov.name)) out.push(error("overlay.name", "overlay missing string `name`", path));
	if (!isStr(ov.type)) out.push(error("overlay.type", "overlay missing string `type`", path));
	if (ov.data != null && !isArr(ov.data)) out.push(error("overlay.data", "`data` is present but not an array", path));
}
function validateDataset(ds, path, out) {
	if (!ds || typeof ds !== "object") {
		out.push(error("dataset.shape", "dataset is not an object", path));
		return;
	}
	if (!isStr(ds.id)) out.push(error("dataset.id", "dataset missing string `id`", path));
	if (!isStr(ds.type)) out.push(error("dataset.type", "dataset missing string `type`", path));
	if (ds.data != null && !isArr(ds.data)) out.push(error("dataset.data", "`data` is present but not an array", path));
}
/**
* Validate a full DataCube data object. Accepts both the short form
* ({ ohlcv, onchart, offchart, datasets }) and the chart form
* ({ chart: { data }, ... }). Multi-timeframe maps ({ '1m': {...} }) are
* validated per-timeframe.
*
* @returns {{ ok: boolean, diagnostics: Diagnostic[] }}
*/
function validateData(data) {
	const out = [];
	if (!data || typeof data !== "object") {
		out.push(error("data.shape", "data is not an object", "data"));
		return {
			ok: false,
			diagnostics: out
		};
	}
	if (!("chart" in data || "ohlcv" in data || "onchart" in data || "offchart" in data || "datasets" in data)) {
		const tfs = Object.keys(data);
		let validatedAny = false;
		for (const tf of tfs) {
			const sub = data[tf];
			if (sub && typeof sub === "object" && ("chart" in sub || "ohlcv" in sub)) {
				validatedAny = true;
				const r = validateData(sub);
				for (const d of r.diagnostics) out.push({
					...d,
					path: `${tf}.${d.path || ""}`
				});
			}
		}
		if (!validatedAny) out.push(warn("data.empty", "data has no chart/ohlcv and is not a recognised multi-timeframe map", "data"));
		return {
			ok: !out.some((d) => d.level === "error"),
			diagnostics: out
		};
	}
	const ohlcv = data.ohlcv != null ? data.ohlcv : data.chart && data.chart.data;
	const ohlcvPath = data.ohlcv != null ? "ohlcv" : "chart.data";
	if (ohlcv == null) out.push(error("chart.missing", "no OHLCV series (chart.data / ohlcv)", "chart"));
	else validateOHLCV(ohlcv, ohlcvPath, out);
	for (const side of ["onchart", "offchart"]) {
		const arr = data[side];
		if (arr == null) continue;
		if (!isArr(arr)) {
			out.push(error(`${side}.shape`, `${side} is present but not an array`, side));
			continue;
		}
		arr.forEach((ov, i) => validateOverlay(ov, `${side}[${i}]`, out));
	}
	if (data.datasets != null) if (!isArr(data.datasets)) out.push(error("datasets.shape", "datasets is present but not an array", "datasets"));
	else data.datasets.forEach((ds, i) => validateDataset(ds, `datasets[${i}]`, out));
	return {
		ok: !out.some((d) => d.level === "error"),
		diagnostics: out
	};
}
//#endregion
//#region src/helpers/datacube.js
var DataCube = class extends DCCore {
	constructor(data = {}, sett = {}) {
		sett = Object.assign({
			aggregation: 100,
			script_depth: 0,
			auto_scroll: true,
			scripts: true,
			ww_ram_limit: 0,
			node_url: null,
			shift_measure: true,
			validation: "warn"
		}, sett);
		super();
		this.sett = sett;
		this.data = data;
		if (sett.validation !== "off" && data && Object.keys(data).length) {
			const { diagnostics } = validateData(data);
			if (diagnostics.length) report(diagnostics, sett.validation, "chart data");
		}
		this.sett = sett_proxy_default(sett, this.ww);
		this.agg = new AggTool(this, sett.aggregation);
		this.se_state = {};
	}
	add(side, overlay) {
		return this.cd.add(side, overlay);
	}
	get(query) {
		return this.cd.get(query);
	}
	get_one(query) {
		return this.cd.getOne(query);
	}
	set(query, data) {
		return this.cd.set(query, data);
	}
	merge(query, data) {
		return this.cd.merge(query, data);
	}
	del(query) {
		return this.cd.del(query);
	}
	update(data) {
		if (data["candle"]) return this.update_candle(data);
		else return this.update_tick(data);
	}
	lock(query) {
		return this.cd.lock(query);
	}
	unlock(query) {
		return this.cd.unlock(query);
	}
	show(query) {
		if (query === "offchart" || query === "onchart") query += ".";
		else if (query === ".") query = "";
		this.merge(query + ".settings", { display: true });
	}
	hide(query) {
		if (query === "offchart" || query === "onchart") query += ".";
		else if (query === ".") query = "";
		this.merge(query + ".settings", { display: false });
	}
	onrange(callback) {
		this.loader = callback;
		setTimeout(() => this.tv.set_loader(callback ? this : null), 0);
	}
};
//#endregion
//#region src/mixins/interface.js
var interface_default = {
	props: [
		"ux",
		"updater",
		"colors",
		"wrapper"
	],
	mounted() {
		if (this.init) this.init();
	},
	methods: {
		close() {
			this.custom_event("close-interface", this.$props.ux.uuid);
		},
		modify(obj) {
			this.custom_event("modify-interface", this.$props.ux.uuid, obj);
		},
		custom_event(event, ...args) {
			if (event.split(":")[0] === "hook") return;
			this.$emit("custom-event", {
				event,
				args
			});
		}
	},
	computed: {
		overlay() {
			return this.$props.ux.overlay;
		},
		layout() {
			return this.overlay.layout;
		},
		uxr() {
			return this.$props.ux;
		}
	},
	data() {
		return {};
	}
};
//#endregion
//#region src/components/primitives/candle.js
var CandleExt = class {
	constructor(overlay, ctx, data) {
		this.ctx = ctx;
		this.self = overlay;
		this.style = data.raw[6] || this.self;
		this.draw(data);
	}
	draw(data) {
		const green = data.raw[4] >= data.raw[1];
		const body_color = data.raw[6] || (green ? this.style.colorCandleUp || "#23a776" : this.style.colorCandleDw || "#e54150");
		const wick_color = green ? this.style.colorWickUp || "#23a776" : this.style.colorWickDw || "#e54150";
		let w = Math.max(data.w, 1);
		let hw = Math.max(Math.floor(w * .5), 1);
		let h = Math.abs(data.o - data.c);
		let max_h = data.c === data.o ? 1 : 2;
		let x05 = Math.floor(data.x) - .5;
		this.ctx.strokeStyle = wick_color;
		this.ctx.beginPath();
		this.ctx.moveTo(x05, Math.floor(data.h));
		this.ctx.lineTo(x05, Math.floor(data.l));
		this.ctx.stroke();
		if (data.w > 1.5) {
			this.ctx.fillStyle = body_color;
			let s = green ? 1 : -1;
			this.ctx.fillRect(Math.floor(data.x - hw - 1), data.c, Math.floor(hw * 2 + 1), s * Math.max(h, max_h));
		} else {
			this.ctx.strokeStyle = body_color;
			this.ctx.beginPath();
			this.ctx.moveTo(x05, Math.floor(Math.min(data.o, data.c)));
			this.ctx.lineTo(x05, Math.floor(Math.max(data.o, data.c)) + (data.o === data.c ? 1 : 0));
			this.ctx.stroke();
		}
		const fontSize = Math.max(Math.min(Math.floor(data.w * .8), 14), 8);
		this.ctx.font = `${fontSize}px sans-serif`;
		this.ctx.textAlign = "center";
		const value1 = data.raw[7];
		if (value1 && value1 !== "") {
			this.ctx.fillStyle = "#00FF00";
			this.ctx.textBaseline = "top";
			const textY = Math.floor(data.l) + 3;
			this.ctx.fillText(value1, Math.floor(data.x), textY);
		}
		const value2 = data.raw[8];
		if (value2 && value2 !== "") {
			this.ctx.fillStyle = "#FF0000";
			this.ctx.textBaseline = "bottom";
			const textY = Math.floor(data.h) - 3;
			this.ctx.fillText(value2, Math.floor(data.x), textY);
		}
	}
};
//#endregion
//#region src/api/defineOverlay.js
function assert$1(cond, msg) {
	if (!cond) {
		const e = /* @__PURE__ */ new Error(`[trading-vue] defineOverlay: ${msg}`);
		e.code = "overlay.define";
		throw e;
	}
}
/**
* @param {object} def
* @param {string[]} def.useFor  - chart-data `type`s this overlay renders (required, non-empty)
* @param {(ctx:CanvasRenderingContext2D, $:object)=>void} def.draw - required
* @param {string} [def.name]
* @param {object} [def.meta]    - { author, version, ... }
* @param {object} [def.settings]- default settings merged under the overlay
* @param {(()=>string[])} [def.dataColors]
* @param {(()=>[number,number])} [def.yRange]
* @param {Function} [def.calc]  - engine script object factory (computed overlays)
* @param {object} [def.tool]    - drawing-tool descriptor (see defineTool)
* @param {Function} [def.init] @param {Function} [def.destroy]
* @param {object} [def.computed]@param {object} [def.methods]
* @param {Array} [def.mixins]   - extra mixins (e.g. Tool)
* @returns a Vue overlay component
*/
function defineOverlay(def) {
	assert$1(def && typeof def === "object", "expects a config object");
	assert$1(Array.isArray(def.useFor) && def.useFor.length > 0 && def.useFor.every((t) => typeof t === "string" && t.length > 0), "`useFor` must be a non-empty string[]");
	assert$1(typeof def.draw === "function", "`draw(ctx, $)` is required");
	const HELPERS = [
		"drawDataLine",
		"drawStepLine",
		"drawBandFill",
		"drawMultiLines",
		"setupStroke",
		"setupFillAndStroke",
		"iterateData",
		"pointToScreen"
	];
	function context() {
		const p = this.$props;
		const ctx = {
			layout: p.layout,
			data: p.data,
			sub: p.sub,
			settings: Object.assign({}, def.settings, this.sett),
			colors: p.colors,
			cursor: p.cursor,
			num: p.num,
			interval: p.interval,
			tf: p.tf,
			font: p.font,
			id: p.id,
			grid_id: p.grid_id
		};
		for (const h of HELPERS) if (typeof this[h] === "function") ctx[h] = this[h].bind(this);
		return ctx;
	}
	const methods = {
		...def.methods || {},
		use_for() {
			return def.useFor.slice();
		},
		meta_info() {
			return def.meta || {};
		},
		$ctx: context,
		draw(ctx) {
			return def.draw.call(this, ctx, this.$ctx());
		}
	};
	if (def.dataColors) methods.data_colors = function() {
		return def.dataColors.call(this, this.$ctx());
	};
	if (def.yRange) methods.y_range = function() {
		return def.yRange.call(this, this.$ctx());
	};
	if (def.calc) methods.calc = def.calc;
	if (def.tool) methods.tool = function() {
		return def.tool;
	};
	if (def.init) methods.init = def.init;
	if (def.destroy) methods.destroy = def.destroy;
	return {
		name: def.name || "CustomOverlay",
		mixins: [
			overlay_default,
			canvas_drawing_default,
			...def.mixins || []
		],
		methods,
		computed: { ...def.computed || {} }
	};
}
//#endregion
//#region src/api/defineTool.js
function assert(cond, msg) {
	if (!cond) {
		const e = /* @__PURE__ */ new Error(`[trading-vue] defineTool: ${msg}`);
		e.code = "tool.define";
		throw e;
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
function defineTool(def) {
	assert(def && typeof def === "object", "expects a config object");
	assert(typeof def.type === "string" && def.type, "`type` is required");
	if (!def.icon && typeof console !== "undefined") console.warn(`[trading-vue] defineTool("${def.type}"): no \`icon\` — the tool is registered but will NOT appear in the toolbar.`);
	const toolDescriptor = {
		group: def.group || "Custom",
		icon: def.icon,
		type: def.type,
		hint: def.hint || def.type,
		data: def.data || [],
		settings: def.settings || {},
		...def.mods ? { mods: def.mods } : {}
	};
	let init = def.init;
	if (def.init_tool) {
		if (typeof console !== "undefined") console.warn(`[trading-vue] defineTool("${def.type}"): use \`init\` for pin/anchor setup, not \`init_tool\` (which would override the Tool mixin's drag/select/delete wiring). Routing it to \`init\`.`);
		const userInit = def.init;
		const userInitTool = def.init_tool;
		init = function() {
			if (userInit) userInit.call(this);
			userInitTool.call(this);
		};
	}
	return defineOverlay({
		...def,
		init_tool: void 0,
		init,
		useFor: def.useFor || [def.type],
		tool: toolDescriptor,
		mixins: [tool_default, ...def.mixins || []],
		methods: { ...def.methods || {} }
	});
}
//#endregion
//#region src/composables/useChart.js
function resolve(tvRef) {
	if (!tvRef) return null;
	return typeof tvRef === "object" && "value" in tvRef ? tvRef.value : tvRef;
}
/**
* Imperative chart actions over a TradingVue ref. All are null-safe (no-op /
* null until the chart is mounted).
* @param {import('vue').Ref|object} tvRef
*/
function useChart(tvRef) {
	const tv = () => resolve(tvRef);
	return {
		/** Navigate to a timestamp (out-of-range is clamped). Returns {ok,diagnostics}. */
		goto: (t) => tv()?.goto(t),
		/** Set the visible [t1,t2] range. Returns {ok,diagnostics}. */
		setRange: (t1, t2) => tv()?.setRange(t1, t2),
		/** Current visible range [t1,t2] (or null). */
		getRange: () => {
			const i = tv();
			return i ? i.getRange() : null;
		},
		/** Current cursor (or null). */
		getCursor: () => {
			const i = tv();
			return i ? i.getCursor() : null;
		},
		/** Toggle an overlay's visibility without a full reset. */
		toggleOverlayVisibility: (gridId, overlayId, display) => tv()?.toggleOverlayVisibility(gridId, overlayId, display),
		/** Recompute layout. */
		updateLayout: (force = false) => tv()?.updateLayout(force),
		/** Refresh offchart overlays (after add/remove). */
		refreshOffchartOverlays: () => tv()?.refreshOffchartOverlays(),
		/** The underlying TradingVue instance (escape hatch). */
		instance: tv
	};
}
/**
* Reactive visible range. Wire `onRangeChanged` to `@range-changed`.
* @returns {{ range: import('vue').Ref, setRange:Function, getRange:Function, onRangeChanged:Function }}
*/
function useRange(tvRef) {
	const { setRange, getRange } = useChart(tvRef);
	const range = ref(null);
	return {
		range,
		setRange,
		getRange,
		onRangeChanged: (r) => {
			range.value = r;
		}
	};
}
/**
* Reactive cursor. Wire `onCursorChanged` to the chart's cursor event.
* @returns {{ cursor: import('vue').Ref, getCursor:Function, onCursorChanged:Function }}
*/
function useCursor(tvRef) {
	const { getCursor } = useChart(tvRef);
	const cursor = ref(null);
	return {
		cursor,
		getCursor,
		onCursorChanged: (c) => {
			cursor.value = c;
		}
	};
}
/**
* Typed access to a DataCube's data API (read/mutate), without reaching into
* DataCube internals. Pass the DataCube instance.
* @param {object} dataCube
*/
function useData(dataCube) {
	const dc = () => dataCube;
	return {
		get: (q) => dc()?.get(q),
		getOne: (q) => dc()?.get_one(q),
		set: (q, d) => dc()?.set(q, d),
		merge: (q, d) => dc()?.merge(q, d),
		del: (q) => dc()?.del(q),
		add: (side, ov) => dc()?.add(side, ov),
		update: (d) => dc()?.update(d),
		show: (q) => dc()?.show(q),
		hide: (q) => dc()?.hide(q),
		dc
	};
}
//#endregion
//#region src/stuff/theme.js
var defaultTheme = {
	title: "#42b883",
	back: "#121826",
	grid: "#2f3240",
	text: "#dedddd",
	textHL: "#fff",
	scale: "#838383",
	cross: "#8091a0",
	candleUp: "#23a776",
	candleDw: "#e54150",
	wickUp: "#23a77688",
	wickDw: "#e5415088",
	wickSm: "transparent",
	volUp: "#23a77642",
	volDw: "#e5415042",
	panel: "#565c68",
	tbBorder: "#8282827d"
};
//#endregion
//#region src/index.ts
var primitives = {
	Candle: CandleExt,
	Volbar: VolbarExt,
	Line,
	Pin,
	Price,
	Ray,
	Seg
};
var TV = TradingVue_default;
TV.install = function(Vue) {
	Vue.component(TV.name, TradingVue_default);
};
var src_default = TradingVue_default;
//#endregion
export { CandleExt as Candle, constants_default as Constants, DataCube, interface_default as Interface, overlay_default as Overlay, tool_default as Tool, TradingVue_default as TradingVue, utils_default as Utils, VolbarExt as Volbar, src_default as default, defaultTheme, defineOverlay, defineTool, layout_cnv, layout_vol, primitives, useChart, useCursor, useData, useRange };

//# sourceMappingURL=trading-vue.es.js.map