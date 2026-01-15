/*!
 * TradingVue.JS - v1.0.2 - Thu Jan 15 2026
 *     https://github.com/tvjsx/trading-vue-js
 *     Copyright (c) 2019 C451 Code's All Right;
 *     Licensed under the MIT license
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["TradingVueJs"] = factory();
	else
		root["TradingVueJs"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 62:
/***/ ((module) => {

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
    numcmp: function (a, b) {
        return a - b;
    },

    /**
     * Compare two strings.
     *
     * @param {Number|String} a
     * @param {Number|String} b
     * @returns {Number} 1 if a > b, 0 if a = b, -1 if a < b
     */
    strcmp: function (a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

};


/***/ }),

/***/ 64:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.tvjs-drift-enter-active {\n    transition: all .3s ease;\n}\n.tvjs-drift-leave-active {\n    transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);\n}\n.tvjs-drift-enter, .tvjs-drift-leave-to\n{\n    transform: translateX(10px);\n    opacity: 0;\n}\n.tvjs-the-tip {\n    position: absolute;\n    width: 200px;\n    text-align: center;\n    z-index: 10001;\n    color: #ffffff;\n    font-size: 1.5em;\n    line-height: 1.15em;\n    padding: 10px;\n    border-radius: 3px;\n    right: 70px;\n    top: 10px;\n    text-shadow: 1px 1px black;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 74:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Indexed Array Binary Search module
 */

/**
 * Dependencies
 */
var util = __webpack_require__(396),
    cmp = __webpack_require__(62),
    bin = __webpack_require__(874);

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

    // is data sortable array or array-like object?
    if (!util.isSortableArrayLike(data))
        throw new Error("Invalid data");

    // is index a valid property?
    if (!index || data.length > 0 && !(index in data[0]))
        throw new Error("Invalid index");

    // data array
    this.data = data;

    // name of the index property
    this.index = index;

    // set index boundary values
    this.setBoundaries();

    // default comparison function
    this.compare = typeof this.minv === "number" ? cmp.numcmp : cmp.strcmp;

    // default search function
    this.search = bin.search;

    // cache of index values to array positions
    // each value stores an object as { found: true|false, index: array-index }
    this.valpos = {};

    // cursor and adjacent positions
    this.cursor = null;
    this.nextlow = null;
    this.nexthigh = null;
}

/**
 * Set the comparison function
 *
 * @param {Function} fn to compare index values that returnes 1, 0, -1
 */
IndexedArray.prototype.setCompare = function (fn) {
    if (typeof fn !== "function")
        throw new Error("Invalid argument");

    this.compare = fn;
    return this;
};

/**
 * Set the search function
 *
 * @param {Function} fn to search index values in the array of objects
 */
IndexedArray.prototype.setSearch = function (fn) {
    if (typeof fn !== "function")
        throw new Error("Invalid argument");

    this.search = fn;
    return this;
};

/**
 * Sort the data array by its index property
 */
IndexedArray.prototype.sort = function () {
    var self = this,
        index = this.index;

    // sort the array
    this.data.sort(function (a, b) {
        return self.compare(a[index], b[index]);
    });

    // recalculate boundary values
    this.setBoundaries();

    return this;
};

/**
 * Inspect and set the boundaries of the internal data array
 */
IndexedArray.prototype.setBoundaries = function () {
    var data = this.data,
        index = this.index;

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
IndexedArray.prototype.fetch = function (value) {
    // check data has objects
    if (this.data.length === 0) {
        this.cursor = null;
        this.nextlow = null;
        this.nexthigh = null;
        return this;
    }

    // check the request is within range
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

    var valpos = this.valpos,
        pos = valpos[value];

    // if the request is memorized, just give it back
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

    // if not, do the search
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
IndexedArray.prototype.get = function (value) {
    if (value)
        this.fetch(value);

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
IndexedArray.prototype.getRange = function (begin, end) {
    // check if boundaries are in order
    if (this.compare(begin, end) === 1) {
        return [];
    }

    // fetch start and default to the next index above
    this.fetch(begin);
    var start = this.cursor || this.nexthigh;

    // fetch finish and default to the next index below
    this.fetch(end);
    var finish = this.cursor || this.nextlow;

    // if any boundary is not set, return no range
    if (start === null || finish === null) {
        return [];
    }

    // return range
    return this.data.slice(start, finish + 1);
};


/***/ }),

/***/ 108:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-tbitem {\n}\n.trading-vue-tbitem:hover {\n    background-color: #76878319;\n}\n.trading-vue-tbitem-exp {\n    position: absolute;\n    right: -3px;\n    padding: 18.5px 5px;\n    font-stretch: extra-condensed;\n    transform: scaleX(0.6);\n    font-size: 0.6em;\n    opacity: 0.0;\n    user-select: none;\n    line-height: 0;\n}\n.trading-vue-tbitem:hover\n.trading-vue-tbitem-exp {\n    opacity: 0.5;\n}\n.trading-vue-tbitem-exp:hover {\n    background-color: #76878330;\n    opacity: 0.9 !important;\n}\n.trading-vue-tbicon {\n    position: absolute;\n}\n.trading-vue-tbitem.selected-item > .trading-vue-tbicon,\n.tvjs-item-list-item.selected-item > .trading-vue-tbicon {\n     filter: brightness(1.45) sepia(1) hue-rotate(90deg) saturate(4.5) !important;\n}\n.tvjs-pixelated {\n    -ms-interpolation-mode: nearest-neighbor;\n    image-rendering: -webkit-optimize-contrast;\n    image-rendering: -webkit-crisp-edges;\n    image-rendering: -moz-crisp-edges;\n    image-rendering: -o-crisp-edges;\n    image-rendering: pixelated;\n}\n\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 152:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(673);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("a00d5c4c", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 156:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(841);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("6a14b67c", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 168:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/*! Hammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

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

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
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
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

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
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
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
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
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
        if (node == parent) {
            return true;
        }
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
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
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
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

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
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
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
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

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

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

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

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

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

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
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
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

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

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

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
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
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
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
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
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
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
        pointers: pointers,
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

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

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
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
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
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
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

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down
        if (!this.pressed) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
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

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

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

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

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

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
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
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
        }

        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
        if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
        }

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
    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
        setLastTouch.call(this, eventData);
    }
}

function setLastTouch(eventData) {
    var touch = eventData.changedPointers[0];

    if (touch.identifier === this.primaryTouch) {
        var lastTouch = {x: touch.clientX, y: touch.clientY};
        this.lastTouches.push(lastTouch);
        var lts = this.lastTouches;
        var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
                lts.splice(i, 1);
            }
        };
        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
    }
}

function isSyntheticEvent(eventData) {
    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
    for (var i = 0; i < this.lastTouches.length; i++) {
        var t = this.lastTouches[i];
        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
        }
    }
    return false;
}

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';
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
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
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
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
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
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

function getTouchActionProps() {
    if (!NATIVE_TOUCH_ACTION) {
        return false;
    }
    var touchMap = {};
    var cssSupports = window.CSS && window.CSS.supports;
    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

        // If css.supports is not supported but there is native touch-action assume it supports
        // all values. This is the case for IE 10 and 11.
        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
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

    // default is enable true
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

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

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
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

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
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

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
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
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

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
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
        pointers: 1
    },

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

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
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
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
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
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
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
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
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

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
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
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
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
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

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

    // previous time and center,
    // used for tap counting
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
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
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

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
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
Hammer.VERSION = '2.0.7';

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
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
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
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
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
        var recognizer = this.add(new (item[0])(item[1]));
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

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
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
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

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
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
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
        if (events === undefined) {
            return;
        }
        if (handler === undefined) {
            return;
        }

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
        if (events === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

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
    if (!element.style) {
        return;
    }
    var prop;
    each(manager.options.cssProps, function(value, name) {
        prop = prefixed(element.style, name);
        if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
        } else {
            element.style[prop] = manager.oldCssProps[prop] || '';
        }
    });
    if (!add) {
        manager.oldCssProps = {};
    }
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (true) {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
        return Hammer;
    }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
} else // removed by dead control flow
{}

})(window, document, 'Hammer');


/***/ }),

/***/ 175:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.tvjs-widgets {\n    position: absolute;\n    z-index: 1000;\n    pointer-events: none;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 183:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(628);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("03ed0336", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 194:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(413);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("73cb7019", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 197:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(882);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("32d743bb", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 240:
/***/ ((module) => {

/*
 * Hamster.js v1.1.2
 * (c) 2013 Monospaced http://monospaced.com
 * License: MIT
 */

(function(window, document){
'use strict';

/**
 * Hamster
 * use this to create instances
 * @returns {Hamster.Instance}
 * @constructor
 */
var Hamster = function(element) {
  return new Hamster.Instance(element);
};

// default event name
Hamster.SUPPORT = 'wheel';

// default DOM methods
Hamster.ADD_EVENT = 'addEventListener';
Hamster.REMOVE_EVENT = 'removeEventListener';
Hamster.PREFIX = '';

// until browser inconsistencies have been fixed...
Hamster.READY = false;

Hamster.Instance = function(element){
  if (!Hamster.READY) {
    // fix browser inconsistencies
    Hamster.normalise.browser();

    // Hamster is ready...!
    Hamster.READY = true;
  }

  this.element = element;

  // store attached event handlers
  this.handlers = [];

  // return instance
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
  wheel: function onEvent(handler, useCapture){
    Hamster.event.add(this, Hamster.SUPPORT, handler, useCapture);

    // handle MozMousePixelScroll in older Firefox
    if (Hamster.SUPPORT === 'DOMMouseScroll') {
      Hamster.event.add(this, 'MozMousePixelScroll', handler, useCapture);
    }

    return this;
  },

  /**
   * unbind events to the instance
   * @param   {Function}    handler
   * @param   {Boolean}     useCapture
   * @returns {Hamster.Instance}
   */
  unwheel: function offEvent(handler, useCapture){
    // if no handler argument,
    // unbind the last bound handler (if exists)
    if (handler === undefined && (handler = this.handlers.slice(-1)[0])) {
      handler = handler.original;
    }

    Hamster.event.remove(this, Hamster.SUPPORT, handler, useCapture);

    // handle MozMousePixelScroll in older Firefox
    if (Hamster.SUPPORT === 'DOMMouseScroll') {
      Hamster.event.remove(this, 'MozMousePixelScroll', handler, useCapture);
    }

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
  add: function add(hamster, eventName, handler, useCapture){
    // store the original handler
    var originalHandler = handler;

    // redefine the handler
    handler = function(originalEvent){

      if (!originalEvent) {
        originalEvent = window.event;
      }

      // create a normalised event object,
      // and normalise "deltas" of the mouse wheel
      var event = Hamster.normalise.event(originalEvent),
          delta = Hamster.normalise.delta(originalEvent);

      // fire the original handler with normalised arguments
      return originalHandler(event, delta[0], delta[1], delta[2]);

    };

    // cross-browser addEventListener
    hamster.element[Hamster.ADD_EVENT](Hamster.PREFIX + eventName, handler, useCapture || false);

    // store original and normalised handlers on the instance
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
  remove: function remove(hamster, eventName, handler, useCapture){
    // find the normalised handler on the instance
    var originalHandler = handler,
        lookup = {},
        handlers;
    for (var i = 0, len = hamster.handlers.length; i < len; ++i) {
      lookup[hamster.handlers[i].original] = hamster.handlers[i];
    }
    handlers = lookup[originalHandler];
    handler = handlers.normalised;

    // cross-browser removeEventListener
    hamster.element[Hamster.REMOVE_EVENT](Hamster.PREFIX + eventName, handler, useCapture || false);

    // remove original and normalised handlers from the instance
    for (var h in hamster.handlers) {
      if (hamster.handlers[h] == handlers) {
        hamster.handlers.splice(h, 1);
        break;
      }
    }
  }
};

/**
 * these hold the lowest deltas,
 * used to normalise the delta values
 * @type {Number}
 */
var lowestDelta,
    lowestDeltaXY;

Hamster.normalise = {
  /**
   * fix browser inconsistencies
   */
  browser: function normaliseBrowser(){
    // detect deprecated wheel events
    if (!('onwheel' in document || document.documentMode >= 9)) {
      Hamster.SUPPORT = document.onmousewheel !== undefined ?
                        'mousewheel' : // webkit and IE < 9 support at least "mousewheel"
                        'DOMMouseScroll'; // assume remaining browsers are older Firefox
    }

    // detect deprecated event model
    if (!window.addEventListener) {
      // assume IE < 9
      Hamster.ADD_EVENT = 'attachEvent';
      Hamster.REMOVE_EVENT = 'detachEvent';
      Hamster.PREFIX = 'on';
    }

  },

  /**
   * create a normalised event object
   * @param   {Function}    originalEvent
   * @returns {Object}      event
   */
   event: function normaliseEvent(originalEvent){
    var event = {
          // keep a reference to the original event object
          originalEvent: originalEvent,
          target: originalEvent.target || originalEvent.srcElement,
          type: 'wheel',
          deltaMode: originalEvent.type === 'MozMousePixelScroll' ? 0 : 1,
          deltaX: 0,
          deltaZ: 0,
          preventDefault: function(){
            if (originalEvent.preventDefault) {
              originalEvent.preventDefault();
            } else {
              originalEvent.returnValue = false;
            }
          },
          stopPropagation: function(){
            if (originalEvent.stopPropagation) {
              originalEvent.stopPropagation();
            } else {
              originalEvent.cancelBubble = false;
            }
          }
        };

    // calculate deltaY (and deltaX) according to the event

    // 'mousewheel'
    if (originalEvent.wheelDelta) {
      event.deltaY = - 1/40 * originalEvent.wheelDelta;
    }
    // webkit
    if (originalEvent.wheelDeltaX) {
      event.deltaX = - 1/40 * originalEvent.wheelDeltaX;
    }

    // 'DomMouseScroll'
    if (originalEvent.detail) {
      event.deltaY = originalEvent.detail;
    }

    return event;
  },

  /**
   * normalise 'deltas' of the mouse wheel
   * @param   {Function}    originalEvent
   * @returns {Array}       deltas
   */
  delta: function normaliseDelta(originalEvent){
    var delta = 0,
      deltaX = 0,
      deltaY = 0,
      absDelta = 0,
      absDeltaXY = 0,
      fn;

    // normalise deltas according to the event

    // 'wheel' event
    if (originalEvent.deltaY) {
      deltaY = originalEvent.deltaY * -1;
      delta  = deltaY;
    }
    if (originalEvent.deltaX) {
      deltaX = originalEvent.deltaX;
      delta  = deltaX * -1;
    }

    // 'mousewheel' event
    if (originalEvent.wheelDelta) {
      delta = originalEvent.wheelDelta;
    }
    // webkit
    if (originalEvent.wheelDeltaY) {
      deltaY = originalEvent.wheelDeltaY;
    }
    if (originalEvent.wheelDeltaX) {
      deltaX = originalEvent.wheelDeltaX * -1;
    }

    // 'DomMouseScroll' event
    if (originalEvent.detail) {
      delta = originalEvent.detail * -1;
    }

    // Don't return NaN
    if (delta === 0) {
      return [0, 0, 0];
    }

    // look for lowest delta to normalize the delta values
    absDelta = Math.abs(delta);
    if (!lowestDelta || absDelta < lowestDelta) {
      lowestDelta = absDelta;
    }
    absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
    if (!lowestDeltaXY || absDeltaXY < lowestDeltaXY) {
      lowestDeltaXY = absDeltaXY;
    }

    // convert deltas to whole numbers
    fn = delta > 0 ? 'floor' : 'ceil';
    delta  = Math[fn](delta / lowestDelta);
    deltaX = Math[fn](deltaX / lowestDeltaXY);
    deltaY = Math[fn](deltaY / lowestDeltaXY);

    return [delta, deltaX, deltaY];
  }
};

if (typeof window.define === 'function' && window.define.amd) {
  // AMD
  window.define('hamster', [], function(){
    return Hamster;
  });
} else if (true) {
  // CommonJS
  module.exports = Hamster;
} else // removed by dead control flow
{}

})(window, window.document);


/***/ }),

/***/ 268:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-toolbar {\n    position: absolute;\n    border-right: 1px solid black;\n    z-index: 101;\n    padding-top: 3px;\n    user-select: none;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 314:
/***/ ((module) => {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (useSourceMap) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item, useSourceMap);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join('');
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === 'string') {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, '']];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

function cssWithMappingToString(item, useSourceMap) {
  var content = item[1] || ''; // eslint-disable-next-line prefer-destructuring

  var cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (useSourceMap && typeof btoa === 'function') {
    var sourceMapping = toComment(cssMapping);
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || '').concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
  }

  return [content].join('\n');
} // Adapted from convert-source-map (MIT)


function toComment(sourceMap) {
  // eslint-disable-next-line no-undef
  var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
  var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
  return "/*# ".concat(data, " */");
}

/***/ }),

/***/ 396:
/***/ ((module) => {

/**
 * Utils module
 */

/**
 * Check if an object is an array-like object
 *
 * @credit Javascript: The Definitive Guide, O'Reilly, 2011
 */
function isArrayLike(o) {
    if (o &&                                 // o is not null, undefined, etc.
        typeof o === "object" &&             // o is an object
        isFinite(o.length) &&                // o.length is a finite number
        o.length >= 0 &&                     // o.length is non-negative
        o.length === Math.floor(o.length) && // o.length is an integer
        o.length < 4294967296)               // o.length < 2^32
        return true;                         // Then o is array-like
    else
        return false;                        // Otherwise it is not
}

/**
 * Check for the existence of the sort function in the object
 */
function isSortable(o) {
    if (o &&                                 // o is not null, undefined, etc.
        typeof o === "object" &&             // o is an object
        typeof o.sort === "function")        // o.sort is a function
        return true;                         // Then o is array-like
    else
        return false;                        // Otherwise it is not
}

/**
 * Check for sortable-array-like objects
 */
module.exports.isSortableArrayLike = function (o) {
    return isArrayLike(o) && isSortable(o);
};


/***/ }),

/***/ 407:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.tvjs-spinner {\n    display: inline-block;\n    position: relative;\n    width: 20px;\n    height: 16px;\n    margin: -4px 0px -1px 0px;\n    opacity: 0.7;\n}\n.tvjs-spinner div {\n    position: absolute;\n    top: 8px;\n    width: 4px;\n    height: 4px;\n    border-radius: 50%;\n    animation-timing-function: cubic-bezier(1, 1, 1, 1);\n}\n.tvjs-spinner div:nth-child(1) {\n    left: 2px;\n    animation: tvjs-spinner1 0.6s infinite;\n    opacity: 0.9;\n}\n.tvjs-spinner div:nth-child(2) {\n    left: 2px;\n    animation: tvjs-spinner2 0.6s infinite;\n}\n.tvjs-spinner div:nth-child(3) {\n    left: 9px;\n    animation: tvjs-spinner2 0.6s infinite;\n}\n.tvjs-spinner div:nth-child(4) {\n    left: 16px;\n    animation: tvjs-spinner3 0.6s infinite;\n    opacity: 0.9;\n}\n@keyframes tvjs-spinner1 {\n0% {\n        transform: scale(0);\n}\n100% {\n        transform: scale(1);\n}\n}\n@keyframes tvjs-spinner3 {\n0% {\n        transform: scale(1);\n}\n100% {\n        transform: scale(0);\n}\n}\n@keyframes tvjs-spinner2 {\n0% {\n        transform: translate(0, 0);\n}\n100% {\n        transform: translate(7px, 0);\n}\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 413:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n/* Anit-boostrap tactix */\n.trading-vue *, ::after, ::before {\n    box-sizing: content-box;\n}\n.trading-vue img {\n    vertical-align: initial;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 534:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ addStylesClient)
});

;// ./node_modules/vue-style-loader/lib/listToStyles.js
/**
 * Translates the list format produced by css-loader into something
 * easier to manipulate.
 */
function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  return styles
}

;// ./node_modules/vue-style-loader/lib/addStylesClient.js
/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by Evan You @yyx990803
*/



var hasDocument = typeof document !== 'undefined'

if (typeof DEBUG !== 'undefined' && DEBUG) {
  if (!hasDocument) {
    throw new Error(
    'vue-style-loader cannot be used in a non-browser environment. ' +
    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
  ) }
}

/*
type StyleObject = {
  id: number;
  parts: Array<StyleObjectPart>
}

type StyleObjectPart = {
  css: string;
  media: string;
  sourceMap: ?string
}
*/

var stylesInDom = {/*
  [id: number]: {
    id: number,
    refs: number,
    parts: Array<(obj?: StyleObjectPart) => void>
  }
*/}

var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
var singletonElement = null
var singletonCounter = 0
var isProduction = false
var noop = function () {}
var options = null
var ssrIdKey = 'data-vue-ssr-id'

// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
// tags it will allow on a page
var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

function addStylesClient (parentId, list, _isProduction, _options) {
  isProduction = _isProduction

  options = _options || {}

  var styles = listToStyles(parentId, list)
  addStylesToDom(styles)

  return function update (newList) {
    var mayRemove = []
    for (var i = 0; i < styles.length; i++) {
      var item = styles[i]
      var domStyle = stylesInDom[item.id]
      domStyle.refs--
      mayRemove.push(domStyle)
    }
    if (newList) {
      styles = listToStyles(parentId, newList)
      addStylesToDom(styles)
    } else {
      styles = []
    }
    for (var i = 0; i < mayRemove.length; i++) {
      var domStyle = mayRemove[i]
      if (domStyle.refs === 0) {
        for (var j = 0; j < domStyle.parts.length; j++) {
          domStyle.parts[j]()
        }
        delete stylesInDom[domStyle.id]
      }
    }
  }
}

function addStylesToDom (styles /* Array<StyleObject> */) {
  for (var i = 0; i < styles.length; i++) {
    var item = styles[i]
    var domStyle = stylesInDom[item.id]
    if (domStyle) {
      domStyle.refs++
      for (var j = 0; j < domStyle.parts.length; j++) {
        domStyle.parts[j](item.parts[j])
      }
      for (; j < item.parts.length; j++) {
        domStyle.parts.push(addStyle(item.parts[j]))
      }
      if (domStyle.parts.length > item.parts.length) {
        domStyle.parts.length = item.parts.length
      }
    } else {
      var parts = []
      for (var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j]))
      }
      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
    }
  }
}

function createStyleElement () {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  head.appendChild(styleElement)
  return styleElement
}

function addStyle (obj /* StyleObjectPart */) {
  var update, remove
  var styleElement = document.querySelector('style[' + ssrIdKey + '~="' + obj.id + '"]')

  if (styleElement) {
    if (isProduction) {
      // has SSR styles and in production mode.
      // simply do nothing.
      return noop
    } else {
      // has SSR styles but in dev mode.
      // for some reason Chrome can't handle source map in server-rendered
      // style tags - source maps in <style> only works if the style tag is
      // created and inserted dynamically. So we remove the server rendered
      // styles and inject new ones.
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  if (isOldIE) {
    // use singleton mode for IE9.
    var styleIndex = singletonCounter++
    styleElement = singletonElement || (singletonElement = createStyleElement())
    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
  } else {
    // use multi-style-tag mode in all other cases
    styleElement = createStyleElement()
    update = applyToTag.bind(null, styleElement)
    remove = function () {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  update(obj)

  return function updateStyle (newObj /* StyleObjectPart */) {
    if (newObj) {
      if (newObj.css === obj.css &&
          newObj.media === obj.media &&
          newObj.sourceMap === obj.sourceMap) {
        return
      }
      update(obj = newObj)
    } else {
      remove()
    }
  }
}

var replaceText = (function () {
  var textStore = []

  return function (index, replacement) {
    textStore[index] = replacement
    return textStore.filter(Boolean).join('\n')
  }
})()

function applyToSingletonTag (styleElement, index, remove, obj) {
  var css = remove ? '' : obj.css

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = replaceText(index, css)
  } else {
    var cssNode = document.createTextNode(css)
    var childNodes = styleElement.childNodes
    if (childNodes[index]) styleElement.removeChild(childNodes[index])
    if (childNodes.length) {
      styleElement.insertBefore(cssNode, childNodes[index])
    } else {
      styleElement.appendChild(cssNode)
    }
  }
}

function applyToTag (styleElement, obj) {
  var css = obj.css
  var media = obj.media
  var sourceMap = obj.sourceMap

  if (media) {
    styleElement.setAttribute('media', media)
  }
  if (options.ssrId) {
    styleElement.setAttribute(ssrIdKey, obj.id)
  }

  if (sourceMap) {
    // https://developer.chrome.com/devtools/docs/javascript-debugging
    // this makes source maps inside style tags work properly in Chrome
    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
    // http://stackoverflow.com/a/26603875
    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
  }

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css))
  }
}


/***/ }),

/***/ 568:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(661);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("2e151f62", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 608:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(108);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("6fcc5481", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 628:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-section {\n    height: 0;\n    position: absolute;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 633:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _typeof = (__webpack_require__(738)["default"]);
function _regeneratorRuntime() {
  "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
  module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
    return r;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  var t,
    r = {},
    e = Object.prototype,
    n = e.hasOwnProperty,
    o = "function" == typeof Symbol ? Symbol : {},
    i = o.iterator || "@@iterator",
    a = o.asyncIterator || "@@asyncIterator",
    u = o.toStringTag || "@@toStringTag";
  function c(t, r, e, n) {
    return Object.defineProperty(t, r, {
      value: e,
      enumerable: !n,
      configurable: !n,
      writable: !n
    });
  }
  try {
    c({}, "");
  } catch (t) {
    c = function c(t, r, e) {
      return t[r] = e;
    };
  }
  function h(r, e, n, o) {
    var i = e && e.prototype instanceof Generator ? e : Generator,
      a = Object.create(i.prototype);
    return c(a, "_invoke", function (r, e, n) {
      var o = 1;
      return function (i, a) {
        if (3 === o) throw Error("Generator is already running");
        if (4 === o) {
          if ("throw" === i) throw a;
          return {
            value: t,
            done: !0
          };
        }
        for (n.method = i, n.arg = a;;) {
          var u = n.delegate;
          if (u) {
            var c = d(u, n);
            if (c) {
              if (c === f) continue;
              return c;
            }
          }
          if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
            if (1 === o) throw o = 4, n.arg;
            n.dispatchException(n.arg);
          } else "return" === n.method && n.abrupt("return", n.arg);
          o = 3;
          var h = s(r, e, n);
          if ("normal" === h.type) {
            if (o = n.done ? 4 : 2, h.arg === f) continue;
            return {
              value: h.arg,
              done: n.done
            };
          }
          "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg);
        }
      };
    }(r, n, new Context(o || [])), !0), a;
  }
  function s(t, r, e) {
    try {
      return {
        type: "normal",
        arg: t.call(r, e)
      };
    } catch (t) {
      return {
        type: "throw",
        arg: t
      };
    }
  }
  r.wrap = h;
  var f = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var l = {};
  c(l, i, function () {
    return this;
  });
  var p = Object.getPrototypeOf,
    y = p && p(p(x([])));
  y && y !== e && n.call(y, i) && (l = y);
  var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l);
  function g(t) {
    ["next", "throw", "return"].forEach(function (r) {
      c(t, r, function (t) {
        return this._invoke(r, t);
      });
    });
  }
  function AsyncIterator(t, r) {
    function e(o, i, a, u) {
      var c = s(t[o], t, i);
      if ("throw" !== c.type) {
        var h = c.arg,
          f = h.value;
        return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) {
          e("next", t, a, u);
        }, function (t) {
          e("throw", t, a, u);
        }) : r.resolve(f).then(function (t) {
          h.value = t, a(h);
        }, function (t) {
          return e("throw", t, a, u);
        });
      }
      u(c.arg);
    }
    var o;
    c(this, "_invoke", function (t, n) {
      function i() {
        return new r(function (r, o) {
          e(t, n, r, o);
        });
      }
      return o = o ? o.then(i, i) : i();
    }, !0);
  }
  function d(r, e) {
    var n = e.method,
      o = r.i[n];
    if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f;
    var i = s(o, r.i, e.arg);
    if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f;
    var a = i.arg;
    return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f);
  }
  function w(t) {
    this.tryEntries.push(t);
  }
  function m(r) {
    var e = r[4] || {};
    e.type = "normal", e.arg = t, r[4] = e;
  }
  function Context(t) {
    this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0);
  }
  function x(r) {
    if (null != r) {
      var e = r[i];
      if (e) return e.call(r);
      if ("function" == typeof r.next) return r;
      if (!isNaN(r.length)) {
        var o = -1,
          a = function e() {
            for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e;
            return e.value = t, e.done = !0, e;
          };
        return a.next = a;
      }
    }
    throw new TypeError(_typeof(r) + " is not iterable");
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) {
    var r = "function" == typeof t && t.constructor;
    return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name));
  }, r.mark = function (t) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t;
  }, r.awrap = function (t) {
    return {
      __await: t
    };
  }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () {
    return this;
  }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) {
    void 0 === i && (i = Promise);
    var a = new AsyncIterator(h(t, e, n, o), i);
    return r.isGeneratorFunction(e) ? a : a.next().then(function (t) {
      return t.done ? t.value : a.next();
    });
  }, g(v), c(v, u, "Generator"), c(v, i, function () {
    return this;
  }), c(v, "toString", function () {
    return "[object Generator]";
  }), r.keys = function (t) {
    var r = Object(t),
      e = [];
    for (var n in r) e.unshift(n);
    return function t() {
      for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t;
      return t.done = !0, t;
    };
  }, r.values = x, Context.prototype = {
    constructor: Context,
    reset: function reset(r) {
      if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t);
    },
    stop: function stop() {
      this.done = !0;
      var t = this.tryEntries[0][4];
      if ("throw" === t.type) throw t.arg;
      return this.rval;
    },
    dispatchException: function dispatchException(r) {
      if (this.done) throw r;
      var e = this;
      function n(t) {
        a.type = "throw", a.arg = r, e.next = t;
      }
      for (var o = e.tryEntries.length - 1; o >= 0; --o) {
        var i = this.tryEntries[o],
          a = i[4],
          u = this.prev,
          c = i[1],
          h = i[2];
        if (-1 === i[0]) return n("end"), !1;
        if (!c && !h) throw Error("try statement without catch or finally");
        if (null != i[0] && i[0] <= u) {
          if (u < c) return this.method = "next", this.arg = t, n(c), !0;
          if (u < h) return n(h), !1;
        }
      }
    },
    abrupt: function abrupt(t, r) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var n = this.tryEntries[e];
        if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) {
          var o = n;
          break;
        }
      }
      o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null);
      var i = o ? o[4] : {};
      return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i);
    },
    complete: function complete(t, r) {
      if ("throw" === t.type) throw t.arg;
      return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f;
    },
    finish: function finish(t) {
      for (var r = this.tryEntries.length - 1; r >= 0; --r) {
        var e = this.tryEntries[r];
        if (e[2] === t) return this.complete(e[4], e[3]), m(e), f;
      }
    },
    "catch": function _catch(t) {
      for (var r = this.tryEntries.length - 1; r >= 0; --r) {
        var e = this.tryEntries[r];
        if (e[0] === t) {
          var n = e[4];
          if ("throw" === n.type) {
            var o = n.arg;
            m(e);
          }
          return o;
        }
      }
      throw Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(r, e, n) {
      return this.delegate = {
        i: x(r),
        r: e,
        n: n
      }, "next" === this.method && (this.arg = t), f;
    }
  }, r;
}
module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 661:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-botbar {\n    position: relative !important;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 673:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.t-vue-lbtn {\n    z-index: 100;\n    pointer-events: all;\n    cursor: pointer;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 688:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(407);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("0f5b62f0", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 702:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(857);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("5feff967", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 723:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(268);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("4a4b489f", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 727:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-ux-wrapper {\n    position: absolute;\n    display: flex;\n}\n.tvjs-ux-wrapper-pin {\n    position: absolute;\n    width: 9px;\n    height: 9px;\n    z-index: 100;\n    background-color: #23a776;\n    border-radius: 10px;\n    margin-left: -6px;\n    margin-top: -6px;\n    pointer-events: none;\n}\n.tvjs-ux-wrapper-head {\n    position: absolute;\n    height: 23px;\n    width: 100%;\n}\n.tvjs-ux-wrapper-close {\n    position: absolute;\n    width: 11px;\n    height: 11px;\n    font-size: 1.5em;\n    line-height: 0.5em;\n    padding: 1px 1px 1px 1px;\n    border-radius: 10px;\n    right: 5px;\n    top: 5px;\n    user-select: none;\n    text-align: center;\n    z-index: 100;\n}\n.tvjs-ux-wrapper-close-hb {\n}\n.tvjs-ux-wrapper-close:hover {\n    background-color: #FF605C !important;\n    color: #692324 !important;\n}\n.tvjs-ux-wrapper-full {\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 738:
/***/ ((module) => {

function _typeof(o) {
  "@babel/helpers - typeof";

  return module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 756:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// TODO(Babel 8): Remove this file.

var runtime = __webpack_require__(633)();
module.exports = runtime;

// Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}


/***/ }),

/***/ 787:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(175);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("2a395bbc", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 837:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(64);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("171d407e", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 841:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.tvjs-item-list {\n    position: absolute;\n    user-select: none;\n    margin-top: -5px;\n}\n.tvjs-item-list-item {\n    display: flex;\n    align-items: center;\n    padding-right: 20px;\n    font-size: 1.15em;\n    letter-spacing: 0.05em;\n}\n.tvjs-item-list-item:hover {\n    background-color: #76878319;\n}\n.tvjs-item-list-item * {\n    position: relative !important;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 857:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.grid-resizer {\n    position: absolute;\n    height: 12px;\n    z-index: 1000;\n    cursor: row-resize;\n    pointer-events: all;\n}\n.resizer-line {\n    position: absolute;\n    top: 5px;\n    left: 0;\n    right: 0;\n    height: 3px;\n    background: #888;\n    pointer-events: none;\n    transition: background 0.15s ease, height 0.15s ease, top 0.15s ease;\n}\n.resizer-hitbox {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    pointer-events: all;\n}\n.grid-resizer:hover .resizer-line {\n    background: #7777ff !important;\n    height: 3px;\n    top: 4.5px;\n}\n.grid-resizer.dragging .resizer-line {\n    background: #9999ff !important;\n    height: 4px;\n    top: 4px;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 874:
/***/ ((module) => {

/**
 * Binary search implementation
 */

/**
 * Main search recursive function
 */
function loop(data, min, max, index, valpos) {

    // set current position as the middle point between min and max
    var curr = (max + min) >>> 1;

    // compare current index value with the one we are looking for
    var diff = this.compare(data[curr][this.index], index);

    // found?
    if (!diff) {
        return valpos[index] = {
            "found": true,
            "index": curr,
            "prev": null,
            "next": null
        };
    }

    // no more positions available?
    if (min >= max) {
        return valpos[index] = {
            "found": false,
            "index": null,
            "prev": (diff < 0) ? max : max - 1,
            "next": (diff < 0) ? max + 1 : max
        };
    }

    // continue looking for index in one of the remaining array halves
    // current position can be skept as index is not there...
    if (diff > 0)
        return loop.call(this, data, min, curr - 1, index, valpos);
    else
        return loop.call(this, data, curr + 1, max, index, valpos);
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


/***/ }),

/***/ 880:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(727);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("4460a626", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 882:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.t-vue-lbtn-grp {\n    margin-left: 0.5em;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 963:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-legend {\n    position: relative;\n    z-index: 100;\n    font-size: 1.25em;\n    margin-left: 10px;\n    pointer-events: auto;\n    text-align: left;\n    user-select: none;\n    font-weight: 300;\n    cursor: default;\n}\n@media (min-resolution: 2x) {\n.trading-vue-legend {\n        font-weight: 400;\n}\n}\n.trading-vue-ohlcv {\n    pointer-events: auto;\n    margin-bottom: 0.5em;\n}\n.t-vue-lspan {\n    font-variant-numeric: tabular-nums;\n    font-size: 0.95em;\n    color: #999999; /* TODO: move => params */\n    margin-left: 0.1em;\n    margin-right: 0.2em;\n}\n.t-vue-title {\n    margin-right: 0.25em;\n    font-size: 1.45em;\n}\n.t-vue-ind {\n    margin-left: 0.2em;\n    margin-bottom: 0.5em;\n    font-size: 1.0em;\n    margin-top: 0.3em;\n    display: flex;\n    align-items: center;\n    flex-wrap: wrap;\n    pointer-events: auto;\n}\n.t-vue-settings-btn {\n    background: none;\n    border: none;\n    color: #808a9d;\n    cursor: pointer;\n    padding: 2px 4px;\n    margin-left: 4px;\n    border-radius: 3px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    transition: all 0.15s ease;\n    position: relative;\n    z-index: 10;\n}\n.t-vue-settings-btn:hover {\n    color: #35a776;\n    background: rgba(53, 167, 118, 0.1);\n}\n.t-vue-settings-btn svg {\n    display: block;\n}\n.t-vue-ivalue {\n    margin-left: 0.5em;\n}\n.t-vue-unknown {\n    color: #999999; /* TODO: move => params */\n}\n.tvjs-appear-enter-active,\n.tvjs-appear-leave-active\n{\n    transition: all .25s ease;\n}\n.tvjs-appear-enter, .tvjs-appear-leave-to\n{\n    opacity: 0;\n}\n", ""]);
// Exports
module.exports = exports;


/***/ }),

/***/ 990:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(963);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("1b5cbc1a", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 992:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.5
var LZString = (function() {

// private property
var f = String.fromCharCode;
var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
var baseReverseDic = {};

function getBaseValue(alphabet, character) {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (var i=0 ; i<alphabet.length ; i++) {
      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    }
  }
  return baseReverseDic[alphabet][character];
}

var LZString = {
  compressToBase64 : function (input) {
    if (input == null) return "";
    var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
    switch (res.length % 4) { // To produce valid Base64
    default: // When could this happen ?
    case 0 : return res;
    case 1 : return res+"===";
    case 2 : return res+"==";
    case 3 : return res+"=";
    }
  },

  decompressFromBase64 : function (input) {
    if (input == null) return "";
    if (input == "") return null;
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
  },

  compressToUTF16 : function (input) {
    if (input == null) return "";
    return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
  },

  decompressFromUTF16: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
  },

  //compress into uint8array (UCS-2 big endian format)
  compressToUint8Array: function (uncompressed) {
    var compressed = LZString.compress(uncompressed);
    var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

    for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
      var current_value = compressed.charCodeAt(i);
      buf[i*2] = current_value >>> 8;
      buf[i*2+1] = current_value % 256;
    }
    return buf;
  },

  //decompress from uint8array (UCS-2 big endian format)
  decompressFromUint8Array:function (compressed) {
    if (compressed===null || compressed===undefined){
        return LZString.decompress(compressed);
    } else {
        var buf=new Array(compressed.length/2); // 2 bytes per character
        for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
          buf[i]=compressed[i*2]*256+compressed[i*2+1];
        }

        var result = [];
        buf.forEach(function (c) {
          result.push(f(c));
        });
        return LZString.decompress(result.join(''));

    }

  },


  //compress into a string that is already URI encoded
  compressToEncodedURIComponent: function (input) {
    if (input == null) return "";
    return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
  },

  //decompress from an output of compressToEncodedURIComponent
  decompressFromEncodedURIComponent:function (input) {
    if (input == null) return "";
    if (input == "") return null;
    input = input.replace(/ /g, "+");
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
  },

  compress: function (uncompressed) {
    return LZString._compress(uncompressed, 16, function(a){return f(a);});
  },
  _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
    if (uncompressed == null) return "";
    var i, value,
        context_dictionary= {},
        context_dictionaryToCreate= {},
        context_c="",
        context_wc="",
        context_w="",
        context_enlargeIn= 2, // Compensate for the first entry which should not count
        context_dictSize= 3,
        context_numBits= 2,
        context_data=[],
        context_data_val=0,
        context_data_position=0,
        ii;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position ==bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }


        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    // Output the code for w.
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
        if (context_w.charCodeAt(0)<256) {
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<8 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<16 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position == bitsPerChar-1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }


      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    // Mark the end of the stream
    value = 2;
    for (i=0 ; i<context_numBits ; i++) {
      context_data_val = (context_data_val << 1) | (value&1);
      if (context_data_position == bitsPerChar-1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    // Flush the last char
    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar-1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      }
      else context_data_position++;
    }
    return context_data.join('');
  },

  decompress: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
  },

  _decompress: function (length, resetValue, getNextValue) {
    var dictionary = [],
        next,
        enlargeIn = 4,
        dictSize = 4,
        numBits = 3,
        entry = "",
        result = [],
        i,
        w,
        bits, resb, maxpower, power,
        c,
        data = {val:getNextValue(0), position:resetValue, index:1};

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i;
    }

    bits = 0;
    maxpower = Math.pow(2,2);
    power=1;
    while (power!=maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb>0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (next = bits) {
      case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 2:
        return "";
    }
    dictionary[3] = c;
    w = c;
    result.push(c);
    while (true) {
      if (data.index > length) {
        return "";
      }

      bits = 0;
      maxpower = Math.pow(2,numBits);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (c = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 2:
          return result.join('');
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[c]) {
        entry = dictionary[c];
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result.push(entry);

      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

    }
  }
};
  return LZString;
})();

if (true) {
  !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () { return LZString; }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
} else // removed by dead control flow
{}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Candle: () => (/* reexport */ CandleExt),
  Constants: () => (/* reexport */ constants),
  DataCube: () => (/* reexport */ DataCube),
  Interface: () => (/* reexport */ mixins_interface),
  Overlay: () => (/* reexport */ overlay),
  Tool: () => (/* reexport */ tool),
  TradingVue: () => (/* reexport */ TradingVue),
  Utils: () => (/* reexport */ utils),
  Volbar: () => (/* reexport */ VolbarExt),
  "default": () => (/* binding */ src),
  layout_cnv: () => (/* reexport */ layout_cnv),
  layout_vol: () => (/* reexport */ layout_vol),
  primitives: () => (/* binding */ primitives)
});

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/TradingVue.vue?vue&type=template&id=238615ac
var render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "trading-vue",
    style: {
      color: this.chart_props.colors.text,
      font: this.font_comp,
      width: this.width + "px",
      height: this.height + "px"
    },
    attrs: {
      id: _vm.id
    },
    on: {
      mousedown: _vm.mousedown,
      mouseleave: _vm.mouseleave
    }
  }, [_vm.toolbar ? _c("toolbar", _vm._b({
    ref: "toolbar",
    attrs: {
      config: _vm.chart_config
    },
    on: {
      "custom-event": _vm.custom_event
    }
  }, "toolbar", _vm.chart_props, false)) : _vm._e(), _vm._v(" "), _vm.controllers.length ? _c("widgets", {
    ref: "widgets",
    attrs: {
      map: _vm.ws,
      width: _vm.width,
      height: _vm.height,
      tv: this,
      dc: _vm.data
    }
  }) : _vm._e(), _vm._v(" "), _c("chart", _vm._b({
    key: _vm.reset,
    ref: "chart",
    attrs: {
      tv_id: _vm.id,
      config: _vm.chart_config
    },
    on: {
      "custom-event": _vm.custom_event,
      "range-changed": _vm.range_changed,
      "legend-button-click": _vm.legend_button,
      "open-indicator-settings": _vm.open_indicator_settings
    }
  }, "chart", _vm.chart_props, false)), _vm._v(" "), _c("transition", {
    attrs: {
      name: "tvjs-drift"
    }
  }, [_vm.tip ? _c("the-tip", {
    attrs: {
      data: _vm.tip
    },
    on: {
      "remove-me": function removeMe($event) {
        _vm.tip = null;
      }
    }
  }) : _vm._e()], 1)], 1);
};
var staticRenderFns = [];
render._withStripped = true;

;// ./src/TradingVue.vue?vue&type=template&id=238615ac

;// ./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}

;// ./node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js

function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}

;// ./node_modules/@babel/runtime/helpers/esm/iterableToArray.js
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}

;// ./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js

function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

;// ./node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

;// ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js




function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}

;// ./src/stuff/constants.js
var SECOND = 1000;
var MINUTE = SECOND * 60;
var MINUTE3 = MINUTE * 3;
var MINUTE5 = MINUTE * 5;
var MINUTE15 = MINUTE * 15;
var MINUTE30 = MINUTE * 30;
var HOUR = MINUTE * 60;
var HOUR4 = HOUR * 4;
var HOUR12 = HOUR * 12;
var DAY = HOUR * 24;
var WEEK = DAY * 7;
var MONTH = WEEK * 4;
var YEAR = DAY * 365;
var MONTHMAP = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Grid time steps
var TIMESCALES = [YEAR * 10, YEAR * 5, YEAR * 3, YEAR * 2, YEAR, MONTH * 6, MONTH * 4, MONTH * 3, MONTH * 2, MONTH, DAY * 15, DAY * 10, DAY * 7, DAY * 5, DAY * 3, DAY * 2, DAY, HOUR * 12, HOUR * 6, HOUR * 3, HOUR * 1.5, HOUR, MINUTE30, MINUTE15, MINUTE * 10, MINUTE5, MINUTE * 2, MINUTE];

// Grid $ steps
var $SCALES = [0.05, 0.1, 0.2, 0.25, 0.5, 0.8, 1, 2, 5];
var ChartConfig = {
  SBMIN: 60,
  // Minimal sidebar px
  SBMAX: Infinity,
  // Max sidebar, px
  TOOLBAR: 57,
  // Toolbar width px
  RIGHTBAR: 250,
  // Right panel width px
  TB_ICON: 25,
  // Toolbar icon size px
  TB_ITEM_M: 6,
  // Toolbar item margin px
  TB_ICON_BRI: 1,
  // Toolbar icon brightness
  TB_ICON_HOLD: 420,
  // ms, wait to expand
  TB_BORDER: 1,
  // Toolbar border px
  TB_B_STYLE: 'dotted',
  // Toolbar border style
  TOOL_COLL: 7,
  // Tool collision threshold
  EXPAND: 0.15,
  // %/100 of range
  CANDLEW: 0.6,
  // %/100 of step
  GRIDX: 100,
  // px
  GRIDY: 47,
  // px
  BOTBAR: 28,
  // px
  PANHEIGHT: 22,
  // px
  DEFAULT_LEN: 50,
  // candles
  MINIMUM_LEN: 5,
  // candles,
  MIN_ZOOM: 25,
  // candles
  MAX_ZOOM: 1000,
  // candles,
  VOLSCALE: 0.15,
  // %/100 of height
  UX_OPACITY: 0.9,
  // Ux background opacity
  ZOOM_MODE: 'tv',
  // 'tv' or 'tl'
  L_BTN_SIZE: 21,
  // Legend Button size, px
  L_BTN_MARGIN: '-6px 0 -6px 0',
  // css margin
  SCROLL_WHEEL: 'prevent' // 'pass', 'click'
};
ChartConfig.FONT = "11px -apple-system,BlinkMacSystemFont,\n    Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,\n    Fira Sans,Droid Sans,Helvetica Neue,\n    sans-serif";
var IB_TF_WARN = "When using IB mode you should specify " + "timeframe ('tf' filed in 'chart' object)," + "otherwise you can get an unexpected behaviour";
var MAP_UNIT = {
  "1s": SECOND,
  "5s": SECOND * 5,
  "10s": SECOND * 10,
  "20s": SECOND * 20,
  "30s": SECOND * 30,
  "1m": MINUTE,
  "3m": MINUTE3,
  "5m": MINUTE5,
  "15m": MINUTE15,
  "30m": MINUTE30,
  // Uppercase hour formats
  "1H": HOUR,
  "2H": HOUR * 2,
  "3H": HOUR * 3,
  "4H": HOUR4,
  "6H": HOUR * 6,
  "8H": HOUR * 8,
  "12H": HOUR12,
  // Lowercase hour formats
  "1h": HOUR,
  "2h": HOUR * 2,
  "3h": HOUR * 3,
  "4h": HOUR4,
  "6h": HOUR * 6,
  "8h": HOUR * 8,
  "12h": HOUR12,
  // Day/Week/Month/Year (both cases)
  "1D": DAY,
  "1d": DAY,
  "1W": WEEK,
  "1w": WEEK,
  "1M": MONTH,
  "1Y": YEAR
};
/* harmony default export */ const constants = ({
  SECOND: SECOND,
  MINUTE: MINUTE,
  MINUTE5: MINUTE5,
  MINUTE15: MINUTE15,
  MINUTE30: MINUTE30,
  HOUR: HOUR,
  HOUR4: HOUR4,
  DAY: DAY,
  WEEK: WEEK,
  MONTH: MONTH,
  YEAR: YEAR,
  MONTHMAP: MONTHMAP,
  TIMESCALES: TIMESCALES,
  $SCALES: $SCALES,
  ChartConfig: ChartConfig,
  map_unit: MAP_UNIT,
  IB_TF_WARN: IB_TF_WARN
});
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Chart.vue?vue&type=template&id=163321b4
var Chartvue_type_template_id_163321b4_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "trading-vue-chart",
    style: _vm.styles
  }, [_c("keyboard", {
    ref: "keyboard"
  }), _vm._v(" "), _vm._l(this._layout.grids, function (grid, i) {
    return _c("grid-section", {
      key: grid.id,
      ref: "sec",
      refInFor: true,
      attrs: {
        common: _vm.section_props(i),
        grid_id: i
      },
      on: {
        "register-kb-listener": _vm.register_kb,
        "remove-kb-listener": _vm.remove_kb,
        "range-changed": _vm.range_changed,
        "cursor-changed": _vm.cursor_changed,
        "cursor-locked": _vm.cursor_locked,
        "sidebar-transform": _vm.set_ytransform,
        "layer-meta-props": _vm.layer_meta_props,
        "custom-event": _vm.emit_custom_event,
        "legend-button-click": _vm.legend_button_click
      }
    });
  }), _vm._v(" "), _vm._l(_vm.resizerIndices, function (i) {
    return _c("grid-resizer", {
      key: "resizer-" + i,
      attrs: {
        grid_id: i,
        layout: _vm._layout,
        colors: _vm.colors
      },
      on: {
        "resize-grids": _vm.on_resize_grids,
        "resize-complete": _vm.on_resize_complete,
        "toggle-minimize": _vm.on_toggle_minimize
      }
    });
  }), _vm._v(" "), _c("botbar", _vm._b({
    attrs: {
      shaders: _vm.shaders,
      timezone: _vm.timezone
    },
    on: {
      "botbar-zoom": _vm.range_changed
    }
  }, "botbar", _vm.botbar_props, false))], 2);
};
var Chartvue_type_template_id_163321b4_staticRenderFns = [];
Chartvue_type_template_id_163321b4_render._withStripped = true;

;// ./src/components/Chart.vue?vue&type=template&id=163321b4

;// ./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}

;// ./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = !1;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = !0, n = r;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}

;// ./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

;// ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js




function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}

;// ./src/stuff/context.js
// Canvas context for text measurments

function Context($p) {
  var el = document.createElement('canvas');
  var ctx = el.getContext("2d");
  ctx.font = $p.font;
  return ctx;
}
/* harmony default export */ const context = (Context);
// EXTERNAL MODULE: ./node_modules/arrayslicer/lib/index.js
var lib = __webpack_require__(74);
var lib_default = /*#__PURE__*/__webpack_require__.n(lib);
;// ./src/stuff/utils.js



/* harmony default export */ const utils = ({
  clamp: function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
  },
  add_zero: function add_zero(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  },
  // Start of the day (zero millisecond)
  day_start: function day_start(t) {
    var start = new Date(t);
    return start.setUTCHours(0, 0, 0, 0);
  },
  // Start of the month
  month_start: function month_start(t) {
    var date = new Date(t);
    return Date.UTC(date.getFullYear(), date.getMonth(), 1);
  },
  // Start of the year
  year_start: function year_start(t) {
    return Date.UTC(new Date(t).getFullYear());
  },
  get_year: function get_year(t) {
    if (!t) return undefined;
    return new Date(t).getUTCFullYear();
  },
  get_month: function get_month(t) {
    if (!t) return undefined;
    return new Date(t).getUTCMonth();
  },
  // Nearest in array
  nearest_a: function nearest_a(x, array) {
    var dist = Infinity;
    var val = null;
    var index = -1;
    for (var i = 0; i < array.length; i++) {
      var xi = array[i];
      if (Math.abs(xi - x) < dist) {
        dist = Math.abs(xi - x);
        val = xi;
        index = i;
      }
    }
    return [index, val];
  },
  round: function round(num, decimals) {
    if (decimals === void 0) {
      decimals = 8;
    }
    return parseFloat(num.toFixed(decimals));
  },
  // Strip? No, it's ugly floats in js
  strip: function strip(number) {
    return parseFloat(parseFloat(number).toPrecision(12));
  },
  get_day: function get_day(t) {
    return t ? new Date(t).getDate() : null;
  },
  // Update array keeping the same reference
  overwrite: function overwrite(arr, new_arr) {
    arr.splice.apply(arr, [0, arr.length].concat(_toConsumableArray(new_arr)));
  },
  // Copy layout in reactive way
  copy_layout: function copy_layout(obj, new_obj) {
    for (var k in obj) {
      if (Array.isArray(obj[k])) {
        // (some offchart indicators are added/removed)
        // we need to update layout in a reactive way
        if (obj[k].length !== new_obj[k].length) {
          this.overwrite(obj[k], new_obj[k]);
          continue;
        }
        for (var m in obj[k]) {
          Object.assign(obj[k][m], new_obj[k][m]);
        }
      } else {
        Object.assign(obj[k], new_obj[k]);
      }
    }
  },
  // Detects candles interval
  detect_interval: function detect_interval(ohlcv) {
    var len = Math.min(ohlcv.length - 1, 99);
    var min = Infinity;
    ohlcv.slice(0, len).forEach(function (x, i) {
      var d = ohlcv[i + 1][0] - x[0];
      if (d === d && d < min) min = d;
    });
    // This saves monthly chart from being awkward
    if (min >= constants.MONTH && min <= constants.DAY * 30) {
      return constants.DAY * 31;
    }
    return min;
  },
  // Gets numberic part of overlay id (e.g 'EMA_1' = > 1)
  get_num_id: function get_num_id(id) {
    return parseInt(id.split('_').pop());
  },
  // Fast filter. Really fast, like 10X
  fast_filter: function fast_filter(arr, t1, t2) {
    if (!arr.length) return [arr, undefined];
    try {
      var ia = new (lib_default())(arr, "0");
      var res = ia.getRange(t1, t2);
      var i0 = ia.valpos[t1].next;
      return [res, i0];
    } catch (e) {
      // Something wrong with fancy slice lib
      // Fast fix: fallback to filter
      return [arr.filter(function (x) {
        return x[0] >= t1 && x[0] <= t2;
      }), 0];
    }
  },
  // Fast filter (index-based)
  fast_filter_i: function fast_filter_i(arr, t1, t2) {
    if (!arr.length) return [arr, undefined];
    var i1 = Math.floor(t1);
    if (i1 < 0) i1 = 0;
    var i2 = Math.floor(t2 + 1);
    var res = arr.slice(i1, i2);
    return [res, i1];
  },
  // Nearest indexes (left and right)
  fast_nearest: function fast_nearest(arr, t1) {
    var ia = new (lib_default())(arr, "0");
    ia.fetch(t1);
    return [ia.nextlow, ia.nexthigh];
  },
  now: function now() {
    return new Date().getTime();
  },
  pause: function pause(delay) {
    return new Promise(function (rs, rj) {
      return setTimeout(rs, delay);
    });
  },
  // Limit crazy wheel delta values
  smart_wheel: function smart_wheel(delta) {
    var abs = Math.abs(delta);
    if (abs > 500) {
      return (200 + Math.log(abs)) * Math.sign(delta);
    }
    return delta;
  },
  // Parse the original mouse event to find deltaX
  get_deltaX: function get_deltaX(event) {
    return event.originalEvent.deltaX / 12;
  },
  // Parse the original mouse event to find deltaY
  get_deltaY: function get_deltaY(event) {
    return event.originalEvent.deltaY / 12;
  },
  // Apply opacity to a hex color
  apply_opacity: function apply_opacity(c, op) {
    if (c.length === 7) {
      var n = Math.floor(op * 255);
      n = this.clamp(n, 0, 255);
      c += n.toString(16);
    }
    return c;
  },
  // Parse timeframe or return value in ms
  parse_tf: function parse_tf(smth) {
    if (typeof smth === 'string') {
      return constants.map_unit[smth];
    } else {
      return smth;
    }
  },
  // Detect index shift between the main data sub
  // and the overlay's sub (for IB-mode)
  index_shift: function index_shift(sub, data) {
    // Find the second timestamp (by value)
    if (!data.length) return 0;
    var first = data[0][0];
    var second;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== first) {
        second = data[i][0];
        break;
      }
    }
    for (var j = 0; j < sub.length; j++) {
      if (sub[j][0] === second) {
        return j - i;
      }
    }
    return 0;
  },
  // Fallback fix for Brave browser
  // https://github.com/brave/brave-browser/issues/1738
  measureText: function measureText(ctx, text, tv_id) {
    var m = ctx.measureTextOrg(text);
    if (m.width === 0) {
      var doc = document;
      var id = 'tvjs-measure-text';
      var el = doc.getElementById(id);
      if (!el) {
        var base = doc.getElementById(tv_id);
        el = doc.createElement("div");
        el.id = id;
        el.style.position = 'absolute';
        el.style.top = '-1000px';
        base.appendChild(el);
      }
      if (ctx.font) el.style.font = ctx.font;
      el.innerText = text.replace(/ /g, '.');
      return {
        width: el.offsetWidth
      };
    } else {
      return m;
    }
  },
  uuid: function uuid(temp) {
    if (temp === void 0) {
      temp = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    }
    return temp.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  },
  uuid2: function uuid2() {
    return this.uuid('xxxxxxxxxxxx');
  },
  // Delayed warning, f = condition lambda fn
  warn: function warn(f, text, delay) {
    if (delay === void 0) {
      delay = 0;
    }
    setTimeout(function () {
      if (f()) console.warn(text);
    }, delay);
  },
  // Checks if script props updated
  // (and not style settings or something else)
  is_scr_props_upd: function is_scr_props_upd(n, prev) {
    var p = prev.find(function (x) {
      return x.v.$uuid === n.v.$uuid;
    });
    if (!p) return false;
    var props = n.p.settings.$props;
    if (!props) return false;
    return props.some(function (x) {
      return n.v[x] !== p.v[x];
    });
  },
  // Checks if it's time to make a script update
  // (based on execInterval in ms)
  delayed_exec: function delayed_exec(v) {
    if (!v.script || !v.script.execInterval) return true;
    var t = this.now();
    var dt = v.script.execInterval;
    if (!v.settings.$last_exec || t > v.settings.$last_exec + dt) {
      v.settings.$last_exec = t;
      return true;
    }
    return false;
  },
  // Format names such 'RSI, $length', where
  // length - is one of the settings
  format_name: function format_name(ov) {
    if (!ov.name) return undefined;
    var name = ov.name;
    for (var k in ov.settings || {}) {
      var val = ov.settings[k];
      var reg = new RegExp("\\$".concat(k), 'g');
      name = name.replace(reg, val);
    }
    return name;
  },
  // Default cursor mode
  xmode: function xmode() {
    return this.is_mobile ? 'explore' : 'default';
  },
  default_prevented: function default_prevented(event) {
    if (event.original) {
      return event.original.defaultPrevented;
    }
    return event.defaultPrevented;
  },
  // WTF with modern web development
  is_mobile: function (w) {
    return 'onorientationchange' in w && (!!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || 'ontouchstart' in w || w.DocumentTouch && document instanceof w.DocumentTouch);
  }(typeof window !== 'undefined' ? window : {})
});
;// ./src/stuff/math.js
// Math/Geometry

/* harmony default export */ const math = ({
  // Distance from point to line
  // p1 = point, (p2, p3) = line
  point2line: function point2line(p1, p2, p3) {
    var _this$tri = this.tri(p1, p2, p3),
      area = _this$tri.area,
      base = _this$tri.base;
    return Math.abs(this.tri_h(area, base));
  },
  // Distance from point to segment
  // p1 = point, (p2, p3) = segment
  point2seg: function point2seg(p1, p2, p3) {
    var _this$tri2 = this.tri(p1, p2, p3),
      area = _this$tri2.area,
      base = _this$tri2.base;
    // Vector projection
    var proj = this.dot_prod(p1, p2, p3) / base;
    // Distance from left pin
    var l1 = Math.max(-proj, 0);
    // Distance from right pin
    var l2 = Math.max(proj - base, 0);
    // Normal
    var h = Math.abs(this.tri_h(area, base));
    return Math.max(h, l1, l2);
  },
  // Distance from point to ray
  // p1 = point, (p2, p3) = ray
  point2ray: function point2ray(p1, p2, p3) {
    var _this$tri3 = this.tri(p1, p2, p3),
      area = _this$tri3.area,
      base = _this$tri3.base;
    // Vector projection
    var proj = this.dot_prod(p1, p2, p3) / base;
    // Distance from left pin
    var l1 = Math.max(-proj, 0);
    // Normal
    var h = Math.abs(this.tri_h(area, base));
    return Math.max(h, l1);
  },
  tri: function tri(p1, p2, p3) {
    var area = this.area(p1, p2, p3);
    var dx = p3[0] - p2[0];
    var dy = p3[1] - p2[1];
    var base = Math.sqrt(dx * dx + dy * dy);
    return {
      area: area,
      base: base
    };
  },
  /* Area of triangle:
          p1
        /    \
      p2  _  p3
  */
  area: function area(p1, p2, p3) {
    return p1[0] * (p2[1] - p3[1]) + p2[0] * (p3[1] - p1[1]) + p3[0] * (p1[1] - p2[1]);
  },
  // Triangle height
  tri_h: function tri_h(area, base) {
    return area / base;
  },
  // Dot product of (p2, p3) and (p2, p1)
  dot_prod: function dot_prod(p1, p2, p3) {
    var v1 = [p3[0] - p2[0], p3[1] - p2[1]];
    var v2 = [p1[0] - p2[0], p1[1] - p2[1]];
    return v1[0] * v2[0] + v1[1] * v2[1];
  },
  // Symmetrical log
  log: function log(x) {
    // TODO: log for small values
    return Math.sign(x) * Math.log(Math.abs(x) + 1);
  },
  // Symmetrical exp
  exp: function exp(x) {
    return Math.sign(x) * (Math.exp(Math.abs(x)) - 1);
  },
  // Middle line on log scale based on range & px height
  log_mid: function log_mid(r, h) {
    var log_hi = this.log(r[0]);
    var log_lo = this.log(r[1]);
    var px = h / 2;
    var gx = log_hi - px * (log_hi - log_lo) / h;
    return this.exp(gx);
  },
  // Return new adjusted range, based on the previous
  // range, new $_hi, target middle line
  re_range: function re_range(r1, hi2, mid) {
    var log_hi1 = this.log(r1[0]);
    var log_lo1 = this.log(r1[1]);
    var log_hi2 = this.log(hi2);
    var log_$ = this.log(mid);
    var W = (log_hi2 - log_$) * (log_hi1 - log_lo1) / (log_hi1 - log_$);
    return this.exp(log_hi2 - W);
  } // Return new adjusted range, based on the previous
  // range, new $_hi, target middle line + dy (shift)
  // WASTE
  /*range_shift(r1, hi2, mid, dy, h) {
      let log_hi1 = this.log(r1[0])
      let log_lo1 = this.log(r1[1])
      let log_hi2 = this.log(hi2)
      let log_$ = this.log(mid)
       let W = h * (log_hi2 - log_$) /
              (h * (log_hi1 - log_$) / (log_hi1 - log_lo1) + dy)
       return this.exp(log_hi2 - W)
   }*/
});
;// ./src/components/js/layout_fn.js
// Layout functional interface



/* harmony default export */ function layout_fn(self, range) {
  var ib = self.ti_map.ib;
  var dt = range[1] - range[0];
  var r = self.spacex / dt;
  var ls = self.grid.logScale || false;
  Object.assign(self, {
    // Time to screen coordinates
    t2screen: function t2screen(t) {
      if (ib) t = self.ti_map.smth2i(t);
      return Math.floor((t - range[0]) * r) - 0.5;
    },
    // $ to screen coordinates
    $2screen: function $2screen(y) {
      if (ls) y = math.log(y);
      return Math.floor(y * self.A + self.B) - 0.5;
    },
    // Time-axis nearest step
    t_magnet: function t_magnet(t) {
      if (ib) t = self.ti_map.smth2i(t);
      var cn = self.candles || self.master_grid.candles;
      var arr = cn.map(function (x) {
        return x.raw[0];
      });
      var i = utils.nearest_a(t, arr)[0];
      if (!cn[i]) return;
      return Math.floor(cn[i].x) - 0.5;
    },
    // Screen-Y to dollar value (or whatever)
    screen2$: function screen2$(y) {
      if (ls) return math.exp((y - self.B) / self.A);
      return (y - self.B) / self.A;
    },
    // Screen-X to timestamp
    screen2t: function screen2t(x) {
      // TODO: most likely Math.floor not needed
      // return Math.floor(range[0] + x / r)
      return range[0] + x / r;
    },
    // $-axis nearest step
    $_magnet: function $_magnet(price) {},
    // Nearest candlestick
    c_magnet: function c_magnet(t) {
      var cn = self.candles || self.master_grid.candles;
      var arr = cn.map(function (x) {
        return x.raw[0];
      });
      var i = utils.nearest_a(t, arr)[0];
      return cn[i];
    },
    // Nearest data points
    data_magnet: function data_magnet(t) {/* TODO: implement */}
  });
  return self;
}
;// ./src/components/js/log_scale.js
// Log-scale mode helpers

// TODO: all-negative numbers (sometimes wrong scaling)


/* harmony default export */ const log_scale = ({
  candle: function candle(self, mid, p, $p) {
    return {
      x: mid,
      w: self.px_step * $p.config.CANDLEW,
      o: Math.floor(math.log(p[1]) * self.A + self.B),
      h: Math.floor(math.log(p[2]) * self.A + self.B),
      l: Math.floor(math.log(p[3]) * self.A + self.B),
      c: Math.floor(math.log(p[4]) * self.A + self.B),
      raw: p
    };
  },
  expand: function expand(self, height) {
    // expand log scale
    var A = -height / (math.log(self.$_hi) - math.log(self.$_lo));
    var B = -math.log(self.$_hi) * A;
    var top = -height * 0.1;
    var bot = height * 1.1;
    self.$_hi = math.exp((top - B) / A);
    self.$_lo = math.exp((bot - B) / A);
  }
});
;// ./src/components/js/grid_maker.js






var grid_maker_TIMESCALES = constants.TIMESCALES,
  grid_maker_$SCALES = constants.$SCALES,
  grid_maker_WEEK = constants.WEEK,
  grid_maker_MONTH = constants.MONTH,
  grid_maker_YEAR = constants.YEAR,
  grid_maker_HOUR = constants.HOUR,
  grid_maker_DAY = constants.DAY;
var MAX_INT = Number.MAX_SAFE_INTEGER;

// master_grid - ref to the master grid
function GridMaker(id, params, master_grid) {
  if (master_grid === void 0) {
    master_grid = null;
  }
  var sub = params.sub,
    interval = params.interval,
    range = params.range,
    ctx = params.ctx,
    $p = params.$p,
    layers_meta = params.layers_meta,
    height = params.height,
    y_t = params.y_t,
    ti_map = params.ti_map,
    grid = params.grid,
    timezone = params.timezone;
  var self = {
    ti_map: ti_map
  };
  var lm = layers_meta[id];
  var y_range_fn = null;
  var ls = grid.logScale;
  if (lm && Object.keys(lm).length) {
    // Gets last y_range fn()
    var yrs = Object.values(lm).filter(function (x) {
      return x.y_range;
    });
    // The first y_range() determines the range
    if (yrs.length) y_range_fn = yrs[0].y_range;
  }

  // Calc vertical ($/₿) range
  function calc_$range() {
    if (!master_grid) {
      // $ candlestick range
      if (y_range_fn) {
        var _y_range_fn = y_range_fn(hi, lo),
          _y_range_fn2 = _slicedToArray(_y_range_fn, 2),
          hi = _y_range_fn2[0],
          lo = _y_range_fn2[1];
      } else {
        hi = -Infinity, lo = Infinity;
        for (var i = 0, n = sub.length; i < n; i++) {
          var x = sub[i];
          if (x[2] > hi) hi = x[2];
          if (x[3] < lo) lo = x[3];
        }
      }
    } else {
      // Offchart indicator range
      hi = -Infinity, lo = Infinity;
      for (var i = 0; i < sub.length; i++) {
        for (var j = 1; j < sub[i].length; j++) {
          var v = sub[i][j];
          if (v > hi) hi = v;
          if (v < lo) lo = v;
        }
      }
      if (y_range_fn) {
        var _y_range_fn3 = y_range_fn(hi, lo),
          _y_range_fn4 = _slicedToArray(_y_range_fn3, 3),
          hi = _y_range_fn4[0],
          lo = _y_range_fn4[1],
          exp = _y_range_fn4[2];
      }
    }

    // Fixed y-range in non-auto mode
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
        log_scale.expand(self, height);
      }
      if (self.$_hi === self.$_lo) {
        if (!ls) {
          self.$_hi *= 1.05; // Expand if height range === 0
          self.$_lo *= 0.95;
        } else {
          log_scale.expand(self, height);
        }
      }
    }
  }
  function calc_sidebar() {
    if (sub.length < 2) {
      self.prec = 0;
      self.sb = $p.config.SBMIN;
      return;
    }

    // TODO: improve sidebar width calculation
    // at transition point, when one precision is
    // replaced with another

    // Gets formated levels (their lengths),
    // calculates max and measures the sidebar length
    // from it:

    // TODO: add custom formatter f()

    self.prec = calc_precision(sub);
    var lens = [];
    lens.push(self.$_hi.toFixed(self.prec).length);
    lens.push(self.$_lo.toFixed(self.prec).length);
    var str = '0'.repeat(Math.max.apply(Math, lens)) + '    ';
    self.sb = ctx.measureText(str).width;
    self.sb = Math.max(Math.floor(self.sb), $p.config.SBMIN);
    self.sb = Math.min(self.sb, $p.config.SBMAX);
  }

  // Calculate $ precision for the Y-axis
  function calc_precision(data) {
    var max_r = 0,
      max_l = 0;
    var min = Infinity;
    var max = -Infinity;

    // Speed UP
    for (var i = 0, n = data.length; i < n; i++) {
      var x = data[i];
      if (x[1] > max) max = x[1];else if (x[1] < min) min = x[1];
    }
    // Get max lengths of integer and fractional parts
    [min, max].forEach(function (x) {
      // Fix undefined bug
      var str = x != null ? x.toString() : '';
      if (x < 0.000001) {
        // Parsing the exponential form. Gosh this
        // smells trickily
        var _str$split = str.split('e-'),
          _str$split2 = _slicedToArray(_str$split, 2),
          ls = _str$split2[0],
          rs = _str$split2[1];
        var _ls$split = ls.split('.'),
          _ls$split2 = _slicedToArray(_ls$split, 2),
          l = _ls$split2[0],
          r = _ls$split2[1];
        if (!r) r = '';
        r = {
          length: r.length + parseInt(rs) || 0
        };
      } else {
        var _str$split3 = str.split('.'),
          _str$split4 = _slicedToArray(_str$split3, 2),
          l = _str$split4[0],
          r = _str$split4[1];
      }
      if (r && r.length > max_r) {
        max_r = r.length;
      }
      if (l && l.length > max_l) {
        max_l = l.length;
      }
    });

    // Select precision scheme depending
    // on the left and right part lengths
    //
    var even = max_r - max_r % 2 + 2;
    if (max_l === 1) {
      return Math.min(8, Math.max(2, even));
    }
    if (max_l <= 2) {
      return Math.min(4, Math.max(2, even));
    }
    return 2;
  }
  function calc_positions() {
    if (sub.length < 2) return;
    var dt = range[1] - range[0];

    // A pixel space available to draw on (x-axis)
    self.spacex = $p.width - self.sb;

    // Candle capacity
    var capacity = dt / interval;
    self.px_step = self.spacex / capacity;

    // px / time ratio
    var r = self.spacex / dt;
    self.startx = (sub[0][0] - range[0]) * r;

    // Candle Y-transform: (A = scale, B = shift)
    if (!grid.logScale) {
      self.A = -height / (self.$_hi - self.$_lo);
      self.B = -self.$_hi * self.A;
    } else {
      self.A = -height / (math.log(self.$_hi) - math.log(self.$_lo));
      self.B = -math.log(self.$_hi) * self.A;
    }
  }

  // Select nearest good-loking t step (m is target scale)
  function time_step() {
    var k = ti_map.ib ? 60000 : 1;
    var xrange = (range[1] - range[0]) * k;
    var m = xrange * ($p.config.GRIDX / $p.width);
    var s = grid_maker_TIMESCALES;
    return utils.nearest_a(m, s)[1] / k;
  }

  // Select nearest good-loking $ step (m is target scale)
  function dollar_step() {
    var yrange = self.$_hi - self.$_lo;
    var m = yrange * ($p.config.GRIDY / height);
    var p = parseInt(yrange.toExponential().split('e')[1]);
    var d = Math.pow(10, p);
    var s = grid_maker_$SCALES.map(function (x) {
      return x * d;
    });

    // TODO: center the range (look at RSI for example,
    // it looks ugly when "80" is near the top)
    return utils.strip(utils.nearest_a(m, s)[1]);
  }
  function dollar_mult() {
    var mult_hi = dollar_mult_hi();
    var mult_lo = dollar_mult_lo();
    return Math.max(mult_hi, mult_lo);
  }

  // Price step multiplier (for the log-scale mode)
  function dollar_mult_hi() {
    var h = Math.min(self.B, height);
    if (h < $p.config.GRIDY) return 1;
    var n = h / $p.config.GRIDY; // target grid N
    var yrange = self.$_hi;
    if (self.$_lo > 0) {
      var yratio = self.$_hi / self.$_lo;
    } else {
      yratio = self.$_hi / 1; // TODO: small values
    }
    var m = yrange * ($p.config.GRIDY / h);
    var p = parseInt(yrange.toExponential().split('e')[1]);
    return Math.pow(yratio, 1 / n);
  }
  function dollar_mult_lo() {
    var h = Math.min(height - self.B, height);
    if (h < $p.config.GRIDY) return 1;
    var n = h / $p.config.GRIDY; // target grid N
    var yrange = Math.abs(self.$_lo);
    if (self.$_hi < 0 && self.$_lo < 0) {
      var yratio = Math.abs(self.$_lo / self.$_hi);
    } else {
      yratio = Math.abs(self.$_lo) / 1;
    }
    var m = yrange * ($p.config.GRIDY / h);
    var p = parseInt(yrange.toExponential().split('e')[1]);
    return Math.pow(yratio, 1 / n);
  }
  function grid_x() {
    // If this is a subgrid, no need to calc a timeline,
    // we just borrow it from the master_grid
    if (!master_grid) {
      self.t_step = time_step();
      self.xs = [];
      var dt = range[1] - range[0];
      var r = self.spacex / dt;

      /* TODO: remove the left-side glitch
       let year_0 = Utils.get_year(sub[0][0])
      for (var t0 = year_0; t0 < range[0]; t0 += self.t_step) {}
       let m0 = Utils.get_month(t0)*/

      for (var i = 0; i < sub.length; i++) {
        var p = sub[i];
        var prev = sub[i - 1] || [];
        var prev_xs = self.xs[self.xs.length - 1] || [0, []];
        var x = Math.floor((p[0] - range[0]) * r);
        insert_line(prev, p, x);

        // Filtering lines that are too near
        var xs = self.xs[self.xs.length - 1] || [0, []];
        if (prev_xs === xs) continue;
        if (xs[1][0] - prev_xs[1][0] < self.t_step * 0.8) {
          // prev_xs is a higher "rank" label
          if (xs[2] <= prev_xs[2]) {
            self.xs.pop();
          } else {
            // Otherwise
            self.xs.splice(self.xs.length - 2, 1);
          }
        }
      }

      // TODO: fix grid extension for bigger timeframes
      if (interval < grid_maker_WEEK && r > 0) {
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
    var prev_t = ti_map.ib ? ti_map.i2t(prev[0]) : prev[0];
    var p_t = ti_map.ib ? ti_map.i2t(p[0]) : p[0];
    if (ti_map.tf < grid_maker_DAY) {
      prev_t += timezone * grid_maker_HOUR;
      p_t += timezone * grid_maker_HOUR;
    }
    var d = timezone * grid_maker_HOUR;

    // TODO: take this block =========> (see below)
    if ((prev[0] || interval === grid_maker_YEAR) && utils.get_year(p_t) !== utils.get_year(prev_t)) {
      self.xs.push([x, p, grid_maker_YEAR]); // [px, [...], rank]
    } else if (prev[0] && utils.get_month(p_t) !== utils.get_month(prev_t)) {
      self.xs.push([x, p, grid_maker_MONTH]);
    }
    // TODO: should be added if this day !== prev day
    // And the same for 'botbar.js', TODO(*)
    else if (utils.day_start(p_t) === p_t) {
      self.xs.push([x, p, grid_maker_DAY]);
    } else if (p[0] % self.t_step === 0) {
      self.xs.push([x, p, interval]);
    }
  }
  function extend_left(dt, r) {
    if (!self.xs.length || !isFinite(r)) return;
    var t = self.xs[0][1][0];
    while (true) {
      t -= self.t_step;
      var x = Math.floor((t - range[0]) * r);
      if (x < 0) break;
      // TODO: ==========> And insert it here somehow
      if (t % interval === 0) {
        self.xs.unshift([x, [t], interval]);
      }
    }
  }
  function extend_right(dt, r) {
    if (!self.xs.length || !isFinite(r)) return;
    var t = self.xs[self.xs.length - 1][1][0];
    while (true) {
      t += self.t_step;
      var x = Math.floor((t - range[0]) * r);
      if (x > self.spacex) break;
      if (t % interval === 0) {
        self.xs.push([x, [t], interval]);
      }
    }
  }
  function grid_y() {
    // Prevent duplicate levels
    var m = Math.pow(10, -self.prec);
    self.$_step = Math.max(m, dollar_step());
    self.ys = [];
    var y1 = self.$_lo - self.$_lo % self.$_step;
    for (var y$ = y1; y$ <= self.$_hi; y$ += self.$_step) {
      var y = Math.floor(y$ * self.A + self.B);
      if (y > height) continue;
      self.ys.push([y, utils.strip(y$)]);
    }
  }
  function grid_y_log() {
    // TODO: Prevent duplicate levels, is this even
    // a problem here ?
    self.$_mult = dollar_mult();
    self.ys = [];
    if (!sub.length) return;
    var v = Math.abs(sub[sub.length - 1][1] || 1);
    var y1 = search_start_pos(v);
    var y2 = search_start_neg(-v);
    var yp = -Infinity; // Previous y value
    var n = height / $p.config.GRIDY; // target grid N

    var q = 1 + (self.$_mult - 1) / 2;

    // Over 0
    for (var y$ = y1; y$ > 0; y$ /= self.$_mult) {
      y$ = log_rounder(y$, q);
      var y = Math.floor(math.log(y$) * self.A + self.B);
      self.ys.push([y, utils.strip(y$)]);
      if (y > height) break;
      if (y - yp < $p.config.GRIDY * 0.7) break;
      if (self.ys.length > n + 1) break;
      yp = y;
    }

    // Under 0
    yp = Infinity;
    for (var y$ = y2; y$ < 0; y$ /= self.$_mult) {
      y$ = log_rounder(y$, q);
      var _y = Math.floor(math.log(y$) * self.A + self.B);
      if (yp - _y < $p.config.GRIDY * 0.7) break;
      self.ys.push([_y, utils.strip(y$)]);
      if (_y < 0) break;
      if (self.ys.length > n * 3 + 1) break;
      yp = _y;
    }

    // TODO: remove lines near to 0
  }

  // Search a start for the top grid so that
  // the fixed value always included
  function search_start_pos(value) {
    var N = height / $p.config.GRIDY; // target grid N
    var y = Infinity,
      y$ = value,
      count = 0;
    while (y > 0) {
      y = Math.floor(math.log(y$) * self.A + self.B);
      y$ *= self.$_mult;
      if (count++ > N * 3) return 0; // Prevents deadloops
    }
    return y$;
  }
  function search_start_neg(value) {
    var N = height / $p.config.GRIDY; // target grid N
    var y = -Infinity,
      y$ = value,
      count = 0;
    while (y < height) {
      y = Math.floor(math.log(y$) * self.A + self.B);
      y$ *= self.$_mult;
      if (count++ > N * 3) break; // Prevents deadloops
    }
    return y$;
  }

  // Make log scale levels look great again
  function log_rounder(x, quality) {
    var s = Math.sign(x);
    x = Math.abs(x);
    if (x > 10) {
      for (var div = 10; div < MAX_INT; div *= 10) {
        var nice = Math.floor(x / div) * div;
        if (x / nice > quality) {
          // More than 10% off
          break;
        }
      }
      div /= 10;
      return s * Math.floor(x / div) * div;
    } else if (x < 1) {
      for (var ro = 10; ro >= 1; ro--) {
        var _nice = utils.round(x, ro);
        if (x / _nice > quality) {
          // More than 10% off
          break;
        }
      }
      return s * utils.round(x, ro + 1);
    } else {
      return s * Math.floor(x);
    }
  }
  function apply_sizes() {
    self.width = $p.width - self.sb;
    self.height = height;
  }
  calc_$range();
  calc_sidebar();
  return {
    // First we need to calculate max sidebar width
    // (among all grids). Then we can actually make
    // them
    create: function create() {
      calc_positions();
      grid_x();
      if (grid.logScale) {
        grid_y_log();
      } else {
        grid_y();
      }
      apply_sizes();

      // Link to the master grid (candlesticks)
      if (master_grid) {
        self.master_grid = master_grid;
      }
      self.grid = grid; // Grid params

      // Here we add some helpful functions for
      // plugin creators
      return layout_fn(self, range);
    },
    get_layout: function get_layout() {
      return self;
    },
    set_sidebar: function set_sidebar(v) {
      return self.sb = v;
    },
    get_sidebar: function get_sidebar() {
      return self.sb;
    }
  };
}
/* harmony default export */ const grid_maker = (GridMaker);
;// ./src/components/js/layout.js


function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = layout_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function layout_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return layout_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? layout_arrayLikeToArray(r, a) : void 0; } }
function layout_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Calculates all necessary s*it to build the chart
// Heights, widths, transforms, ... = everything
// Why such a mess you ask? Well, that's because
// one components size can depend on other component
// data formatting (e.g. grid width depends on sidebar precision)
// So it's better to calc all in one place.





function Layout(params) {
  var chart = params.chart,
    sub = params.sub,
    offsub = params.offsub,
    interval = params.interval,
    range = params.range,
    ctx = params.ctx,
    layers_meta = params.layers_meta,
    ti_map = params.ti_map,
    $p = params.$props,
    y_ts = params.y_transforms,
    customGridHeights = params.customGridHeights,
    minimizedGrids = params.minimizedGrids;
  var mgrid = chart.grid || {};
  offsub = offsub.filter(function (x, i) {
    // Skip offchart overlays with custom grid id,
    // because they will be mergred with the existing grids
    return !(x.grid && x.grid.id);
  });

  // Minimum height for minimized grids (title bar only)
  var MINIMIZED_HEIGHT = 28;

  // Splits space between main chart
  // and offchart indicator grids
  function grid_hs() {
    var height = $p.height - $p.config.BOTBAR;

    // If custom pixel heights or minimized grids are provided, use custom calculation
    var hasCustomHeights = customGridHeights && Object.keys(customGridHeights).length > 0;
    var hasMinimizedGrids = minimizedGrids && Object.keys(minimizedGrids).length > 0;
    if (hasCustomHeights || hasMinimizedGrids) {
      return custom_hs(height);
    }

    // When at least one height defined (default = 1),
    // Pxs calculated as: (sum of weights) / number
    if (mgrid.height || offsub.find(function (x) {
      return x.grid.height;
    })) {
      return weighted_hs(mgrid, height);
    }
    var n = offsub.length;
    var off_h = 2 * Math.sqrt(n) / 7 / (n || 1);

    // Offchart grid height
    var px = Math.floor(height * off_h);

    // Main grid height
    var m = height - px * n;
    return [m].concat(Array(n).fill(px));
  }

  // Use custom pixel heights directly
  function custom_hs(height) {
    var n = offsub.length + 1; // main + offcharts
    var hs = [];

    // Check for minimized grids
    var minimized = minimizedGrids || {};

    // Calculate heights for each grid
    for (var _i = 0; _i < n; _i++) {
      if (minimized[_i]) {
        hs.push(MINIMIZED_HEIGHT);
      } else if (customGridHeights && customGridHeights[_i] !== undefined) {
        hs.push(customGridHeights[_i]);
      } else {
        hs.push(null); // Will be calculated
      }
    }

    // Calculate total used height and remaining
    var usedHeight = hs.filter(function (h) {
      return h !== null;
    }).reduce(function (a, b) {
      return a + b;
    }, 0);
    var nullCount = hs.filter(function (h) {
      return h === null;
    }).length;
    if (nullCount > 0) {
      var remainingHeight = height - usedHeight;
      var defaultHeight = Math.floor(remainingHeight / nullCount);
      hs = hs.map(function (h) {
        return h === null ? defaultHeight : h;
      });
    }

    // Ensure total matches available height
    var total = hs.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (total !== height && hs.length > 0) {
      hs[0] += height - total;
    }
    return hs;
  }
  function weighted_hs(grid, height) {
    var hs = [{
      grid: grid
    }].concat(_toConsumableArray(offsub)).map(function (x) {
      return x.grid.height || 1;
    });
    var sum = hs.reduce(function (a, b) {
      return a + b;
    }, 0);
    hs = hs.map(function (x) {
      return Math.floor(x / sum * height);
    });

    // Refine the height if Math.floor decreased px sum
    sum = hs.reduce(function (a, b) {
      return a + b;
    }, 0);
    for (var i = 0; i < height - sum; i++) hs[i % hs.length]++;
    return hs;
  }
  function candles_n_vol() {
    self.candles = [];
    self.volume = [];
    var maxv = Math.max.apply(Math, _toConsumableArray(sub.map(function (x) {
      return x[5];
    })));
    var vs = $p.config.VOLSCALE * $p.height / maxv;
    var x1,
      x2,
      mid,
      prev = undefined;
    var splitter = self.px_step > 5 ? 1 : 0;
    var hf_px_step = self.px_step * 0.5;
    for (var i = 0; i < sub.length; i++) {
      var p = sub[i];
      mid = self.t2screen(p[0]) + 0.5;
      self.candles.push(mgrid.logScale ? log_scale.candle(self, mid, p, $p) : {
        x: mid,
        w: self.px_step * $p.config.CANDLEW,
        o: Math.floor(p[1] * self.A + self.B),
        h: Math.floor(p[2] * self.A + self.B),
        l: Math.floor(p[3] * self.A + self.B),
        c: Math.floor(p[4] * self.A + self.B),
        z: p[6],
        raw: p
      });
      // Clear volume bar if there is a time gap
      if (sub[i - 1] && p[0] - sub[i - 1][0] > interval) {
        prev = null;
      }
      x1 = prev || Math.floor(mid - hf_px_step);
      x2 = Math.floor(mid + hf_px_step) - 0.5;
      self.volume.push({
        x1: x1,
        x2: x2,
        h: p[5] * vs,
        /* green: p[4] >= p[1], */
        z: p[6],
        raw: p
      });
      prev = x2 + splitter;
    }
  }

  // Main grid
  var hs = grid_hs();
  var specs = {
    sub: sub,
    interval: interval,
    range: range,
    ctx: ctx,
    $p: $p,
    layers_meta: layers_meta,
    ti_map: ti_map,
    height: hs[0],
    y_t: y_ts[0],
    grid: mgrid,
    timezone: $p.timezone
  };
  var gms = [new grid_maker(0, specs)];

  // Sub grids
  var _iterator = _createForOfIteratorHelper(offsub.entries()),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _slicedToArray(_step.value, 2),
        i = _step$value[0],
        _step$value$ = _step$value[1],
        data = _step$value$.data,
        grid = _step$value$.grid;
      specs.sub = data;
      specs.height = hs[i + 1];
      specs.y_t = y_ts[i + 1];
      specs.grid = grid || {};
      gms.push(new grid_maker(i + 1, specs, gms[0].get_layout()));
    }

    // Max sidebar among all grinds
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var sb = Math.max.apply(Math, _toConsumableArray(gms.map(function (x) {
    return x.get_sidebar();
  })));
  var grids = [],
    offset = 0;
  for (i = 0; i < gms.length; i++) {
    gms[i].set_sidebar(sb);
    grids.push(gms[i].create());
    grids[i].id = i;
    grids[i].offset = offset;
    offset += grids[i].height;
  }
  var self = grids[0];
  candles_n_vol();
  return {
    grids: grids,
    botbar: {
      width: $p.width,
      height: $p.config.BOTBAR,
      offset: offset,
      xs: grids[0] ? grids[0].xs : []
    }
  };
}
/* harmony default export */ const js_layout = (Layout);
;// ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js
function classCallCheck_classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}

;// ./node_modules/@babel/runtime/helpers/esm/typeof.js
function typeof_typeof(o) {
  "@babel/helpers - typeof";

  return typeof_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, typeof_typeof(o);
}

;// ./node_modules/@babel/runtime/helpers/esm/toPrimitive.js

function toPrimitive(t, r) {
  if ("object" != typeof_typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof_typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}

;// ./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js


function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == typeof_typeof(i) ? i : i + "";
}

;// ./node_modules/@babel/runtime/helpers/esm/createClass.js

function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, toPropertyKey(o.key), o);
  }
}
function createClass_createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}

;// ./src/components/js/updater.js



function updater_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = updater_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function updater_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return updater_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? updater_arrayLikeToArray(r, a) : void 0; } }
function updater_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Cursor updater: calculates current values for
// OHLCV and all other indicators


var CursorUpdater = /*#__PURE__*/function () {
  function CursorUpdater(comp) {
    classCallCheck_classCallCheck(this, CursorUpdater);
    this.comp = comp;
    this.cursor = comp.cursor;
  }

  // Get fresh grid references from the current layout
  return createClass_createClass(CursorUpdater, [{
    key: "grids",
    get: function get() {
      return this.comp._layout.grids;
    }
  }, {
    key: "sync",
    value: function sync(e) {
      // TODO: values not displaying if a custom grid id is set:
      // grid: { id: N }
      this.cursor.grid_id = e.grid_id;
      var once = true;
      var _iterator = updater_createForOfIteratorHelper(this.grids),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var grid = _step.value;
          var c = this.cursor_data(grid, e);
          if (!this.cursor.locked) {
            // TODO: find a better fix to invisible cursor prob
            if (once) {
              this.cursor.t = this.cursor_time(grid, e, c);
              if (this.cursor.t) once = false;
            }
            if (c.values) {
              this.comp.$set(this.cursor.values, grid.id, c.values);
            }
          }
          if (grid.id !== e.grid_id) continue;
          this.cursor.x = grid.t2screen(this.cursor.t);
          this.cursor.y = c.y;
          this.cursor.y$ = c.y$;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "overlay_data",
    value: function overlay_data(grid, e) {
      var s = grid.id === 0 ? 'main_section' : 'sub_section';
      var data = this.comp[s].data;

      // Split offchart data between offchart grids
      if (grid.id > 0) {
        // Sequential grids
        var _d = data.filter(function (x) {
          return x.grid.id === undefined;
        });
        // grids with custom ids (for merging)
        var m = data.filter(function (x) {
          return x.grid.id === grid.id;
        });
        data = [_d[grid.id - 1]].concat(_toConsumableArray(m));
      }
      var t = grid.screen2t(e.x);
      var ids = {},
        res = {};
      var _iterator2 = updater_createForOfIteratorHelper(data),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var d = _step2.value;
          var ts = d.data.map(function (x) {
            return x[0];
          });
          var i = utils.nearest_a(t, ts)[0];
          d.type in ids ? ids[d.type]++ : ids[d.type] = 0;
          res["".concat(d.type, "_").concat(ids[d.type])] = d.data[i];
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      return res;
    }

    // Nearest datapoints
  }, {
    key: "cursor_data",
    value: function cursor_data(grid, e) {
      var data = this.comp.main_section.sub;
      var xs = data.map(function (x) {
        return grid.t2screen(x[0]) + 0.5;
      });
      var i = utils.nearest_a(e.x, xs)[0];
      if (!xs[i]) return {};
      return {
        x: Math.floor(xs[i]) - 0.5,
        y: Math.floor(e.y - 2) - 0.5 - grid.offset,
        y$: grid.screen2$(e.y - 2 - grid.offset),
        t: (data[i] || [])[0],
        values: Object.assign({
          ohlcv: grid.id === 0 ? data[i] : undefined
        }, this.overlay_data(grid, e))
      };
    }

    // Get cursor t-position (extended)
  }, {
    key: "cursor_time",
    value: function cursor_time(grid, mouse, candle) {
      var t = grid.screen2t(mouse.x);
      var r = Math.abs((t - candle.t) / this.comp.interval);
      var sign = Math.sign(t - candle.t);
      if (r >= 0.5) {
        // Outside the data range
        var n = Math.round(r);
        return candle.t + n * this.comp.interval * sign;
      }
      // Inside the data range
      return candle.t;
    }
  }]);
}();
/* harmony default export */ const updater = (CursorUpdater);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Section.vue?vue&type=template&id=385f395d
var Sectionvue_type_template_id_385f395d_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "trading-vue-section"
  }, [_c("chart-legend", {
    ref: "legend",
    attrs: {
      values: _vm.section_values,
      grid_id: _vm.grid_id,
      common: _vm.legend_props,
      meta_props: _vm.get_meta_props,
      layout_override: _vm.legendLayoutOverride
    },
    on: {
      "legend-button-click": _vm.button_click,
      "legend-dblclick": _vm.legend_dblclick,
      "open-indicator-settings": _vm.open_indicator_settings
    }
  }), _vm._v(" "), _c("grid", _vm._b({
    ref: "grid",
    attrs: {
      grid_id: _vm.grid_id
    },
    on: {
      "register-kb-listener": _vm.register_kb,
      "remove-kb-listener": _vm.remove_kb,
      "range-changed": _vm.range_changed,
      "cursor-changed": _vm.cursor_changed,
      "cursor-locked": _vm.cursor_locked,
      "layer-meta-props": _vm.emit_meta_props,
      "custom-event": _vm.emit_custom_event,
      "sidebar-transform": _vm.sidebar_transform,
      "rezoom-range": _vm.rezoom_range
    }
  }, "grid", _vm.grid_props, false)), _vm._v(" "), _c("sidebar", _vm._b({
    ref: "sb-" + _vm.grid_id,
    attrs: {
      grid_id: _vm.grid_id,
      rerender: _vm.rerender
    },
    on: {
      "sidebar-transform": _vm.sidebar_transform
    }
  }, "sidebar", _vm.sidebar_props, false))], 1);
};
var Sectionvue_type_template_id_385f395d_staticRenderFns = [];
Sectionvue_type_template_id_385f395d_render._withStripped = true;

;// ./src/components/Section.vue?vue&type=template&id=385f395d

;// ./src/stuff/frame.js


// Annimation frame with a fallback for
// slower devices


var FrameAnimation = /*#__PURE__*/function () {
  function FrameAnimation(cb) {
    var _this = this;
    classCallCheck_classCallCheck(this, FrameAnimation);
    this.t0 = this.t = utils.now();
    this.id = setInterval(function () {
      // The prev frame took too long
      if (utils.now() - _this.t > 100) return;
      if (utils.now() - _this.t0 > 1200) {
        _this.stop();
      }
      if (_this.id) cb(_this);
      _this.t = utils.now();
    }, 16);
  }
  return createClass_createClass(FrameAnimation, [{
    key: "stop",
    value: function stop() {
      clearInterval(this.id);
      this.id = null;
    }
  }]);
}();

// EXTERNAL MODULE: ./node_modules/hammerjs/hammer.js
var hammer = __webpack_require__(168);
// EXTERNAL MODULE: ./node_modules/hamsterjs/hamster.js
var hamster = __webpack_require__(240);
var hamster_default = /*#__PURE__*/__webpack_require__.n(hamster);
;// ./src/components/js/grid.js




function grid_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = grid_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function grid_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return grid_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? grid_arrayLikeToArray(r, a) : void 0; } }
function grid_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Grid.js listens to various user-generated events,
// emits Vue-events if something has changed (e.g. range)
// Think of it as an I/O system for Grid.vue







// Grid is good.
var Grid = /*#__PURE__*/function () {
  function Grid(canvas, comp) {
    classCallCheck_classCallCheck(this, Grid);
    this.MIN_ZOOM = comp.config.MIN_ZOOM;
    this.MAX_ZOOM = comp.config.MAX_ZOOM;
    if (utils.is_mobile) this.MIN_ZOOM *= 0.5;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.comp = comp;
    this.$p = comp.$props;
    this.data = this.$p.sub;
    this.range = this.$p.range;
    this.id = this.$p.grid_id;
    this.layout = this.$p.layout.grids[this.id];
    this.interval = this.$p.interval;
    this.cursor = comp.$props.cursor;
    this.offset_x = 0;
    this.offset_y = 0;
    this.deltas = 0; // Wheel delta events
    this.wmode = this.$p.config.SCROLL_WHEEL;
    this.listeners();
    this.overlays = [];
  }
  return createClass_createClass(Grid, [{
    key: "listeners",
    value: function listeners() {
      var _this = this;
      this.hm = hamster_default()(this.canvas);
      this.hm.wheel(function (event, delta) {
        return _this.mousezoom(-delta * 50, event);
      });
      var mc = this.mc = new hammer.Manager(this.canvas);
      var T = utils.is_mobile ? 10 : 0;
      mc.add(new hammer.Pan({
        threshold: T
      }));
      mc.add(new hammer.Tap());
      mc.add(new hammer.Pinch({
        threshold: 0
      }));
      mc.get('pinch').set({
        enable: true
      });
      if (utils.is_mobile) mc.add(new hammer.Press());
      mc.on('panstart', function (event) {
        if (_this.cursor.scroll_lock) return;
        if (_this.cursor.mode === 'aim') {
          return _this.emit_cursor_coord(event);
        }
        var tfrm = _this.$p.y_transform;
        _this.drug = {
          x: event.center.x + _this.offset_x,
          y: event.center.y + _this.offset_y,
          r: _this.range.slice(),
          t: _this.range[1] - _this.range[0],
          o: tfrm ? tfrm.offset || 0 : 0,
          y_r: tfrm && tfrm.range ? tfrm.range.slice() : undefined,
          B: _this.layout.B,
          t0: utils.now()
        };
        _this.comp.$emit('cursor-changed', {
          grid_id: _this.id,
          x: event.center.x + _this.offset_x,
          y: event.center.y + _this.offset_y
        });
        _this.comp.$emit('cursor-locked', true);
      });
      mc.on('panmove', function (event) {
        if (utils.is_mobile) {
          _this.calc_offset();
          _this.propagate('mousemove', _this.touch2mouse(event));
        }
        if (_this.drug) {
          _this.mousedrag(_this.drug.x + event.deltaX, _this.drug.y + event.deltaY);
          _this.comp.$emit('cursor-changed', {
            grid_id: _this.id,
            x: event.center.x + _this.offset_x,
            y: event.center.y + _this.offset_y
          });
        } else if (_this.cursor.mode === 'aim') {
          _this.emit_cursor_coord(event);
        }
      });
      mc.on('panend', function (event) {
        if (utils.is_mobile && _this.drug) {
          _this.pan_fade(event);
        }
        _this.drug = null;
        _this.comp.$emit('cursor-locked', false);
      });
      mc.on('tap', function (event) {
        if (!utils.is_mobile) return;
        _this.sim_mousedown(event);
        if (_this.fade) _this.fade.stop();
        _this.comp.$emit('cursor-changed', {});
        _this.comp.$emit('cursor-changed', {
          /*grid_id: this.id,
          x: undefined,//event.center.x + this.offset_x,
          y: undefined,//event.center.y + this.offset_y,*/
          mode: 'explore'
        });
        _this.update();
      });
      mc.on('pinchstart', function () {
        _this.drug = null;
        _this.pinch = {
          t: _this.range[1] - _this.range[0],
          r: _this.range.slice()
        };
      });
      mc.on('pinchend', function () {
        _this.pinch = null;
      });
      mc.on('pinch', function (event) {
        if (_this.pinch) _this.pinchzoom(event.scale);
      });
      mc.on('press', function (event) {
        if (!utils.is_mobile) return;
        if (_this.fade) _this.fade.stop();
        _this.calc_offset();
        _this.emit_cursor_coord(event, {
          mode: 'aim'
        });
        setTimeout(function () {
          return _this.update();
        });
        _this.sim_mousedown(event);
      });
      var add = addEventListener;
      add("gesturestart", this.gesturestart);
      add("gesturechange", this.gesturechange);
      add("gestureend", this.gestureend);
    }
  }, {
    key: "gesturestart",
    value: function gesturestart(event) {
      event.preventDefault();
    }
  }, {
    key: "gesturechange",
    value: function gesturechange(event) {
      event.preventDefault();
    }
  }, {
    key: "gestureend",
    value: function gestureend(event) {
      event.preventDefault();
    }
  }, {
    key: "mousemove",
    value: function mousemove(event) {
      if (utils.is_mobile) return;
      this.comp.$emit('cursor-changed', {
        grid_id: this.id,
        x: event.layerX,
        y: event.layerY + this.layout.offset
      });
      this.calc_offset();
      this.propagate('mousemove', event);
    }
  }, {
    key: "mouseout",
    value: function mouseout(event) {
      if (utils.is_mobile) return;
      this.comp.$emit('cursor-changed', {});
      this.propagate('mouseout', event);
    }
  }, {
    key: "mouseup",
    value: function mouseup(event) {
      this.drug = null;
      this.comp.$emit('cursor-locked', false);
      this.propagate('mouseup', event);
    }
  }, {
    key: "mousedown",
    value: function mousedown(event) {
      if (utils.is_mobile) return;
      this.propagate('mousedown', event);
      this.comp.$emit('cursor-locked', true);
      if (event.defaultPrevented) return;
      this.comp.$emit('custom-event', {
        event: 'grid-mousedown',
        args: [this.id, event]
      });
    }

    // Simulated mousedown (for mobile)
  }, {
    key: "sim_mousedown",
    value: function sim_mousedown(event) {
      var _this2 = this;
      if (event.srcEvent.defaultPrevented) return;
      this.comp.$emit('custom-event', {
        event: 'grid-mousedown',
        args: [this.id, event]
      });
      this.propagate('mousemove', this.touch2mouse(event));
      this.update();
      this.propagate('mousedown', this.touch2mouse(event));
      setTimeout(function () {
        _this2.propagate('click', _this2.touch2mouse(event));
      });
    }

    // Convert touch to "mouse" event
  }, {
    key: "touch2mouse",
    value: function touch2mouse(e) {
      this.calc_offset();
      return {
        original: e.srcEvent,
        layerX: e.center.x + this.offset_x,
        layerY: e.center.y + this.offset_y,
        preventDefault: function preventDefault() {
          this.original.preventDefault();
        }
      };
    }
  }, {
    key: "click",
    value: function click(event) {
      this.propagate('click', event);
    }
  }, {
    key: "emit_cursor_coord",
    value: function emit_cursor_coord(event, add) {
      if (add === void 0) {
        add = {};
      }
      this.comp.$emit('cursor-changed', Object.assign({
        grid_id: this.id,
        x: event.center.x + this.offset_x,
        y: event.center.y + this.offset_y + this.layout.offset
      }, add));
    }
  }, {
    key: "pan_fade",
    value: function pan_fade(event) {
      var _this3 = this;
      var dt = utils.now() - this.drug.t0;
      var dx = this.range[1] - this.drug.r[1];
      var v = 42 * dx / dt;
      var v0 = Math.abs(v * 0.01);
      if (dt > 500) return;
      if (this.fade) this.fade.stop();
      this.fade = new FrameAnimation(function (self) {
        v *= 0.85;
        if (Math.abs(v) < v0) {
          self.stop();
        }
        _this3.range[0] += v;
        _this3.range[1] += v;
        _this3.change_range();
      });
    }
  }, {
    key: "calc_offset",
    value: function calc_offset() {
      var rect = this.canvas.getBoundingClientRect();
      this.offset_x = -rect.x;
      this.offset_y = -rect.y;
    }
  }, {
    key: "new_layer",
    value: function new_layer(layer) {
      if (layer.name === 'crosshair') {
        this.crosshair = layer;
      } else {
        this.overlays.push(layer);
      }
      this.update();
    }
  }, {
    key: "del_layer",
    value: function del_layer(id) {
      this.overlays = this.overlays.filter(function (x) {
        return x.id !== id;
      });
      this.update();
    }
  }, {
    key: "show_hide_layer",
    value: function show_hide_layer(event) {
      var l = this.overlays.filter(function (x) {
        return x.id === event.id;
      });
      if (l.length) l[0].display = event.display;
    }
  }, {
    key: "update",
    value: function update() {
      var _this4 = this;
      // Update reference to the grid
      // TODO: check what happens if data changes interval
      // Use layoutOverride if available (for resize operations)
      this.layout = this.comp.layoutOverride || this.$p.layout.grids[this.id];
      this.interval = this.$p.interval;
      if (!this.layout) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.$p.shaders.length) this.apply_shaders();
      this.grid();
      var overlays = [];
      overlays.push.apply(overlays, _toConsumableArray(this.overlays));

      // z-index sorting
      overlays.sort(function (l1, l2) {
        return l1.z - l2.z;
      });
      overlays.forEach(function (l) {
        if (!l.display) return;
        _this4.ctx.save();
        var r = l.renderer;
        if (r.pre_draw) r.pre_draw(_this4.ctx);
        r.draw(_this4.ctx);
        if (r.post_draw) r.post_draw(_this4.ctx);
        _this4.ctx.restore();
      });
      if (this.crosshair) {
        this.crosshair.renderer.draw(this.ctx);
      }
    }
  }, {
    key: "apply_shaders",
    value: function apply_shaders() {
      var layout = this.$p.layout.grids[this.id];
      var props = {
        layout: layout,
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
      var _iterator = grid_createForOfIteratorHelper(this.$p.shaders),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var s = _step.value;
          this.ctx.save();
          s.draw(this.ctx, props);
          this.ctx.restore();
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    // Actually draws the grid (for real)
  }, {
    key: "grid",
    value: function grid() {
      this.ctx.strokeStyle = this.$p.colors.grid;
      this.ctx.beginPath();
      var ymax = this.layout.height;
      var _iterator2 = grid_createForOfIteratorHelper(this.layout.xs),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _step2$value = _slicedToArray(_step2.value, 2),
            x = _step2$value[0],
            p = _step2$value[1];
          this.ctx.moveTo(x - 0.5, 0);
          this.ctx.lineTo(x - 0.5, ymax);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      var _iterator3 = grid_createForOfIteratorHelper(this.layout.ys),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var _step3$value = _slicedToArray(_step3.value, 2),
            y = _step3$value[0],
            y$ = _step3$value[1];
          this.ctx.moveTo(0, y - 0.5);
          this.ctx.lineTo(this.layout.width, y - 0.5);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      this.ctx.stroke();
      if (this.$p.grid_id) this.upper_border();
    }
  }, {
    key: "upper_border",
    value: function upper_border() {
      this.ctx.strokeStyle = this.$p.colors.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0.5);
      this.ctx.lineTo(this.layout.width, 0.5);
      this.ctx.stroke();
    }
  }, {
    key: "mousezoom",
    value: function mousezoom(delta, event) {
      // TODO: for mobile
      if (this.wmode !== 'pass') {
        if (this.wmode === 'click' && !this.$p.meta.activated) {
          return;
        }
        event.originalEvent.preventDefault();
        event.preventDefault();
      }
      event.deltaX = event.deltaX || utils.get_deltaX(event);
      event.deltaY = event.deltaY || utils.get_deltaY(event);
      if (Math.abs(event.deltaX) > 0) {
        this.trackpad = true;
        if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
          delta *= 0.1;
        }
        this.trackpad_scroll(event);
      }
      if (this.trackpad) delta *= 0.032;
      delta = utils.smart_wheel(delta);

      // TODO: mouse zooming is a little jerky,
      // needs to follow f(mouse_wheel_speed) and
      // if speed is low, scroll shoud be slower
      if (delta < 0 && this.data.length <= this.MIN_ZOOM) return;
      if (delta > 0 && this.data.length > this.MAX_ZOOM) return;
      var k = this.interval / 1000;
      var diff = delta * k * this.data.length;
      var tl = this.comp.config.ZOOM_MODE === 'tl';
      if (event.originalEvent.ctrlKey || tl) {
        var offset = event.originalEvent.offsetX;
        var diff1 = offset / (this.canvas.width - 1) * diff;
        var diff2 = diff - diff1;
        this.range[0] -= diff1;
        this.range[1] += diff2;
      } else {
        this.range[0] -= diff;
      }
      if (tl) {
        var _offset = event.originalEvent.offsetY;
        var _diff = _offset / (this.canvas.height - 1) * 2;
        var _diff2 = 2 - _diff;
        var z = diff / (this.range[1] - this.range[0]);
        //rezoom_range(z, diff_x, diff_y)
        this.comp.$emit('rezoom-range', {
          grid_id: this.id,
          z: z,
          diff1: _diff,
          diff2: _diff2
        });
      }
      this.change_range();
    }
  }, {
    key: "mousedrag",
    value: function mousedrag(x, y) {
      var dt = this.drug.t * (this.drug.x - x) / this.layout.width;
      var d$ = this.layout.$_hi - this.layout.$_lo;
      d$ *= (this.drug.y - y) / this.layout.height;
      var offset = this.drug.o + d$;
      var ls = this.layout.grid.logScale;
      if (ls && this.drug.y_r) {
        var dy = this.drug.y - y;
        var range = this.drug.y_r.slice();
        range[0] = math.exp((0 - this.drug.B + dy) / this.layout.A);
        range[1] = math.exp((this.layout.height - this.drug.B + dy) / this.layout.A);
      }
      if (this.drug.y_r && this.$p.y_transform && !this.$p.y_transform.auto) {
        this.comp.$emit('sidebar-transform', {
          grid_id: this.id,
          range: ls ? range || this.drug.y_r : [this.drug.y_r[0] - offset, this.drug.y_r[1] - offset]
        });
      }
      this.range[0] = this.drug.r[0] + dt;
      this.range[1] = this.drug.r[1] + dt;
      this.change_range();
    }
  }, {
    key: "pinchzoom",
    value: function pinchzoom(scale) {
      if (scale > 1 && this.data.length <= this.MIN_ZOOM) return;
      if (scale < 1 && this.data.length > this.MAX_ZOOM) return;
      var t = this.pinch.t;
      var nt = t * 1 / scale;
      this.range[0] = this.pinch.r[0] - (nt - t) * 0.5;
      this.range[1] = this.pinch.r[1] + (nt - t) * 0.5;
      this.change_range();
    }
  }, {
    key: "trackpad_scroll",
    value: function trackpad_scroll(event) {
      var dt = this.range[1] - this.range[0];
      this.range[0] += event.deltaX * dt * 0.011;
      this.range[1] += event.deltaX * dt * 0.011;
      this.change_range();
    }
  }, {
    key: "change_range",
    value: function change_range() {
      // TODO: better way to limit the view. Problem:
      // when you are at the dead end of the data,
      // and keep scrolling,
      // the chart continues to scale down a little.
      // Solution: I don't know yet

      if (!this.range.length || this.data.length < 2) return;
      var l = this.data.length - 1;
      var data = this.data;
      var range = this.range;
      range[0] = utils.clamp(range[0], -Infinity, data[l][0] - this.interval * 5.5);
      range[1] = utils.clamp(range[1], data[0][0] + this.interval * 5.5, Infinity);

      // TODO: IMPORTANT scrolling is jerky The Problem caused
      // by the long round trip of 'range-changed' event.
      // First it propagates up to update layout in Chart.vue,
      // then it moves back as watch() update. It takes 1-5 ms.
      // And because the delay is different each time we see
      // the lag. No smooth movement and it's annoying.
      // Solution: we could try to calc the layout immediatly
      // somewhere here. Still will hurt the sidebar & bottombar
      this.comp.$emit('range-changed', range);
    }

    // Propagate mouse event to overlays
  }, {
    key: "propagate",
    value: function propagate(name, event) {
      var _iterator4 = grid_createForOfIteratorHelper(this.overlays),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var layer = _step4.value;
          if (layer.renderer[name]) {
            layer.renderer[name](event);
          }
          var mouse = layer.renderer.mouse;
          var keys = layer.renderer.keys;
          if (mouse.listeners) {
            mouse.emit(name, event);
          }
          if (keys && keys.listeners) {
            keys.emit(name, event);
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      var rm = removeEventListener;
      rm("gesturestart", this.gesturestart);
      rm("gesturechange", this.gesturechange);
      rm("gestureend", this.gestureend);
      if (this.mc) this.mc.destroy();
      if (this.hm) this.hm.unwheel();
    }
  }]);
}();

;// ./src/mixins/canvas.js
// Interactive canvas-based component
// Should implement: mousemove, mouseout, mouseup, mousedown, click


/* harmony default export */ const canvas = ({
  methods: {
    setup: function setup() {
      var _this = this;
      var id = "".concat(this.$props.tv_id, "-").concat(this._id, "-canvas");
      var canvas = document.getElementById(id);
      var dpr = window.devicePixelRatio || 1;
      canvas.style.width = "".concat(this._attrs.width, "px");
      canvas.style.height = "".concat(this._attrs.height, "px");
      if (dpr < 1) dpr = 1; // Realy ? That's it? Issue #63
      this.$nextTick(function () {
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        var ctx = canvas.getContext('2d', {
          // TODO: test the boost:
          //alpha: false,
          //desynchronized: true,
          //preserveDrawingBuffer: false
        });
        ctx.scale(dpr, dpr);
        _this.redraw();
        // Fallback fix for Brave browser
        // https://github.com/brave/brave-browser/issues/1738
        if (!ctx.measureTextOrg) {
          ctx.measureTextOrg = ctx.measureText;
        }
        ctx.measureText = function (text) {
          return utils.measureText(ctx, text, _this.$props.tv_id);
        };
      });
    },
    create_canvas: function create_canvas(h, id, props) {
      var _this2 = this;
      this._id = id;
      this._attrs = props.attrs;
      return h('div', {
        "class": "trading-vue-".concat(id),
        style: {
          left: props.position.x + 'px',
          top: props.position.y + 'px',
          position: 'absolute',
          zIndex: 1
        }
      }, [h('canvas', {
        on: {
          mousemove: function mousemove(e) {
            return _this2.renderer.mousemove(e);
          },
          mouseout: function mouseout(e) {
            return _this2.renderer.mouseout(e);
          },
          mouseup: function mouseup(e) {
            return _this2.renderer.mouseup(e);
          },
          mousedown: function mousedown(e) {
            return _this2.renderer.mousedown(e);
          },
          dblclick: function dblclick(e) {
            return _this2.on_dblclick && _this2.on_dblclick(e);
          }
        },
        attrs: Object.assign({
          id: "".concat(this.$props.tv_id, "-").concat(id, "-canvas")
        }, props.attrs),
        ref: 'canvas',
        style: props.style
      })].concat(props.hs || []));
    },
    redraw: function redraw() {
      if (!this.renderer) return;
      this.renderer.update();
    }
  },
  watch: {
    width: function width(val) {
      this._attrs.width = val;
      this.setup();
    },
    height: function height(val) {
      this._attrs.height = val;
      this.setup();
    }
  }
});
;// ./src/mixins/uxlist.js
// Manager for Inteerface objects

/* harmony default export */ const uxlist = ({
  methods: {
    on_ux_event: function on_ux_event(d, target) {
      if (d.event === 'new-interface') {
        if (d.args[0].target === target) {
          d.args[0].vars = d.args[0].vars || {};
          d.args[0].grid_id = d.args[1];
          d.args[0].overlay_id = d.args[2];
          this.uxs.push(d.args[0]);
          // this.rerender++
        }
      } else if (d.event === 'close-interface') {
        this.uxs = this.uxs.filter(function (x) {
          return x.uuid !== d.args[0];
        });
      } else if (d.event === 'modify-interface') {
        var ux = this.uxs.filter(function (x) {
          return x.uuid === d.args[0];
        });
        if (ux.length) {
          this.modify(ux[0], d.args[1]);
        }
      } else if (d.event === 'hide-interface') {
        var _ux = this.uxs.filter(function (x) {
          return x.uuid === d.args[0];
        });
        if (_ux.length) {
          _ux[0].hidden = true;
          this.modify(_ux[0], {
            hidden: true
          });
        }
      } else if (d.event === 'show-interface') {
        var _ux2 = this.uxs.filter(function (x) {
          return x.uuid === d.args[0];
        });
        if (_ux2.length) {
          this.modify(_ux2[0], {
            hidden: false
          });
        }
      } else {
        return d;
      }
    },
    modify: function modify(ux, obj) {
      if (obj === void 0) {
        obj = {};
      }
      for (var k in obj) {
        if (k in ux) {
          this.$set(ux, k, obj[k]);
        }
      }
    },
    // Remove all UXs for a given overlay id
    remove_all_ux: function remove_all_ux(id) {
      this.uxs = this.uxs.filter(function (x) {
        return x.overlay.id !== id;
      });
    }
  },
  data: function data() {
    return {
      uxs: []
    };
  }
});
;// ./src/components/js/crosshair.js


var Crosshair = /*#__PURE__*/function () {
  function Crosshair(comp) {
    classCallCheck_classCallCheck(this, Crosshair);
    this.comp = comp;
    this.$p = comp.$props;
    this.data = this.$p.sub;
    this._visible = false;
    this.locked = false;
    this.layout = this.$p.layout;
  }
  return createClass_createClass(Crosshair, [{
    key: "draw",
    value: function draw(ctx) {
      // Update reference to the grid
      this.layout = this.$p.layout;
      var cursor = this.comp.$props.cursor;
      if (!this.visible && cursor.mode === 'explore') return;
      this.x = this.$p.cursor.x;
      // cursor.y is already grid-relative (offset subtracted in updater.js)
      this.y = this.$p.cursor.y;
      ctx.save();
      ctx.strokeStyle = this.$p.colors.cross;
      ctx.beginPath();
      ctx.setLineDash([5]);

      // H
      if (this.$p.cursor.grid_id === this.layout.id) {
        ctx.moveTo(0, this.y);
        ctx.lineTo(this.layout.width - 0.5, this.y);
      }

      // V
      ctx.moveTo(this.x, 0);
      ctx.lineTo(this.x, this.layout.height);
      ctx.stroke();
      ctx.restore();
    }
  }, {
    key: "hide",
    value: function hide() {
      this.visible = false;
      this.x = undefined;
      this.y = undefined;
    }
  }, {
    key: "visible",
    get: function get() {
      return this._visible;
    },
    set: function set(val) {
      this._visible = val;
    }
  }]);
}();

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Crosshair.vue?vue&type=script&lang=js


/* harmony default export */ const Crosshairvue_type_script_lang_js = ({
  name: 'Crosshair',
  props: ['cursor', 'colors', 'layout', 'sub'],
  methods: {
    create: function create() {
      this.ch = new Crosshair(this);

      // New grid overlay-renderer descriptor.
      // Should implement draw() (see Spline.vue)
      this.$emit('new-grid-layer', {
        name: 'crosshair',
        renderer: this.ch
      });
    }
  },
  watch: {
    cursor: {
      handler: function handler() {
        if (!this.ch) this.create();

        // Explore = default mode on mobile
        var cursor = this.$props.cursor;
        var explore = cursor.mode === 'explore';
        if (!cursor.x || !cursor.y) {
          this.ch.hide();
          this.$emit('redraw-grid');
          return;
        }
        this.ch.visible = !explore;
      },
      deep: true
    }
  },
  render: function render(h) {
    return h();
  }
});
;// ./src/components/Crosshair.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Crosshairvue_type_script_lang_js = (Crosshairvue_type_script_lang_js); 
;// ./node_modules/vue-loader/lib/runtime/componentNormalizer.js
/* globals __VUE_SSR_CONTEXT__ */

// IMPORTANT: Do NOT use ES2015 features in this file (except for modules).
// This module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle.

function normalizeComponent(
  scriptExports,
  render,
  staticRenderFns,
  functionalTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier /* server only */,
  shadowMode /* vue-cli only */
) {
  // Vue.extend constructor export interop
  var options =
    typeof scriptExports === 'function' ? scriptExports.options : scriptExports

  // render functions
  if (render) {
    options.render = render
    options.staticRenderFns = staticRenderFns
    options._compiled = true
  }

  // functional template
  if (functionalTemplate) {
    options.functional = true
  }

  // scopedId
  if (scopeId) {
    options._scopeId = 'data-v-' + scopeId
  }

  var hook
  if (moduleIdentifier) {
    // server build
    hook = function (context) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (injectStyles) {
        injectStyles.call(this, context)
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (injectStyles) {
    hook = shadowMode
      ? function () {
          injectStyles.call(
            this,
            (options.functional ? this.parent : this).$root.$options.shadowRoot
          )
        }
      : injectStyles
  }

  if (hook) {
    if (options.functional) {
      // for template-only hot-reload because in that case the render fn doesn't
      // go through the normalizer
      options._injectStyles = hook
      // register for functional component in vue file
      var originalRender = options.render
      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context)
        return originalRender(h, context)
      }
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook]
    }
  }

  return {
    exports: scriptExports,
    options: options
  }
}

;// ./src/components/Crosshair.vue
var Crosshair_render, Crosshair_staticRenderFns
;



/* normalize component */
;
var component = normalizeComponent(
  components_Crosshairvue_type_script_lang_js,
  Crosshair_render,
  Crosshair_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const components_Crosshair = (component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/KeyboardListener.vue?vue&type=script&lang=js
/* harmony default export */ const KeyboardListenervue_type_script_lang_js = ({
  name: 'KeyboardListener',
  render: function render(h) {
    return h();
  },
  created: function created() {
    this.$emit('register-kb-listener', {
      id: this._uid,
      keydown: this.keydown,
      keyup: this.keyup,
      keypress: this.keypress
    });
  },
  beforeDestroy: function beforeDestroy() {
    this.$emit('remove-kb-listener', {
      id: this._uid
    });
  },
  methods: {
    keydown: function keydown(event) {
      this.$emit('keydown', event);
    },
    keyup: function keyup(event) {
      this.$emit('keyup', event);
    },
    keypress: function keypress(event) {
      this.$emit('keypress', event);
    }
  }
});
;// ./src/components/KeyboardListener.vue?vue&type=script&lang=js
 /* harmony default export */ const components_KeyboardListenervue_type_script_lang_js = (KeyboardListenervue_type_script_lang_js); 
;// ./src/components/KeyboardListener.vue
var KeyboardListener_render, KeyboardListener_staticRenderFns
;



/* normalize component */
;
var KeyboardListener_component = normalizeComponent(
  components_KeyboardListenervue_type_script_lang_js,
  KeyboardListener_render,
  KeyboardListener_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const KeyboardListener = (KeyboardListener_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/UxLayer.vue?vue&type=template&id=072774c0
var UxLayervue_type_template_id_072774c0_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("span", {
    "class": "trading-vue-grid-ux-".concat(_vm.id),
    style: _vm.style
  }, _vm._l(_vm.uxs, function (ux) {
    return _c("ux-wrapper", {
      key: ux.uuid,
      attrs: {
        ux: ux,
        updater: _vm.updater,
        colors: _vm.colors,
        config: _vm.config
      },
      on: {
        "custom-event": _vm.on_custom_event
      }
    });
  }), 1);
};
var UxLayervue_type_template_id_072774c0_staticRenderFns = [];
UxLayervue_type_template_id_072774c0_render._withStripped = true;

;// ./src/components/UxLayer.vue?vue&type=template&id=072774c0

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/UxWrapper.vue?vue&type=template&id=26d7be98
var UxWrappervue_type_template_id_26d7be98_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _vm.visible ? _c("div", {
    staticClass: "trading-vue-ux-wrapper",
    style: _vm.style,
    attrs: {
      id: "tvjs-ux-wrapper-".concat(_vm.ux.uuid)
    }
  }, [_c(_vm.ux.component, {
    tag: "component",
    attrs: {
      ux: _vm.ux,
      updater: _vm.updater,
      wrapper: _vm.wrapper,
      colors: _vm.colors
    },
    on: {
      "custom-event": _vm.on_custom_event
    }
  }), _vm._v(" "), _vm.ux.show_pin ? _c("div", {
    staticClass: "tvjs-ux-wrapper-pin",
    style: _vm.pin_style
  }) : _vm._e(), _vm._v(" "), _vm.ux.win_header !== false ? _c("div", {
    staticClass: "tvjs-ux-wrapper-head"
  }, [_c("div", {
    staticClass: "tvjs-ux-wrapper-close",
    style: _vm.btn_style,
    on: {
      click: _vm.close
    }
  }, [_vm._v("×")])]) : _vm._e()], 1) : _vm._e();
};
var UxWrappervue_type_template_id_26d7be98_staticRenderFns = [];
UxWrappervue_type_template_id_26d7be98_render._withStripped = true;

;// ./src/components/UxWrapper.vue?vue&type=template&id=26d7be98

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/UxWrapper.vue?vue&type=script&lang=js

/* harmony default export */ const UxWrappervue_type_script_lang_js = ({
  name: 'UxWrapper',
  props: ['ux', 'updater', 'colors', 'config'],
  mounted: function mounted() {
    this.self = document.getElementById(this.uuid);
    this.w = this.self.offsetWidth; // TODO: => width: "content"
    this.h = this.self.offsetHeight; // TODO: => height: "content"
    this.update_position();
  },
  created: function created() {
    this.mouse.on('mousemove', this.mousemove);
    this.mouse.on('mouseout', this.mouseout);
  },
  beforeDestroy: function beforeDestroy() {
    this.mouse.off('mousemove', this.mousemove);
    this.mouse.off('mouseout', this.mouseout);
  },
  methods: {
    update_position: function update_position() {
      if (this.uxr.hidden) return;
      var lw = this.layout.width;
      var lh = this.layout.height;
      var pin = this.uxr.pin;
      switch (pin[0]) {
        case 'cursor':
          var x = this.uxr.overlay.cursor.x;
          break;
        case 'mouse':
          x = this.mouse.x;
          break;
        default:
          if (typeof pin[0] === 'string') {
            x = this.parse_coord(pin[0], lw);
          } else {
            x = this.layout.t2screen(pin[0]);
          }
      }
      switch (pin[1]) {
        case 'cursor':
          var y = this.uxr.overlay.cursor.y;
          break;
        case 'mouse':
          y = this.mouse.y;
          break;
        default:
          if (typeof pin[1] === 'string') {
            y = this.parse_coord(pin[1], lh);
          } else {
            y = this.layout.$2screen(pin[1]);
          }
      }
      this.x = x + this.ox;
      this.y = y + this.oy;
    },
    parse_coord: function parse_coord(str, scale) {
      str = str.trim();
      if (str === '0' || str === '') return 0;
      var plus = str.split('+');
      if (plus.length === 2) {
        return this.parse_coord(plus[0], scale) + this.parse_coord(plus[1], scale);
      }
      var minus = str.split('-');
      if (minus.length === 2) {
        return this.parse_coord(minus[0], scale) - this.parse_coord(minus[1], scale);
      }
      var per = str.split('%');
      if (per.length === 2) {
        return scale * parseInt(per[0]) / 100;
      }
      var px = str.split('px');
      if (px.length === 2) {
        return parseInt(px[0]);
      }
      return undefined;
    },
    mousemove: function mousemove() {
      this.update_position();
      this.visible = true;
    },
    mouseout: function mouseout() {
      if (this.uxr.pin.includes('cursor') || this.uxr.pin.includes('mouse')) this.visible = false;
    },
    on_custom_event: function on_custom_event(event) {
      this.$emit('custom-event', event);
      if (event.event === 'modify-interface') {
        if (this.self) {
          this.w = this.self.offsetWidth;
          this.h = this.self.offsetHeight;
        }
        this.update_position();
      }
    },
    close: function close() {
      this.$emit('custom-event', {
        event: 'close-interface',
        args: [this.$props.ux.uuid]
      });
    }
  },
  computed: {
    uxr: function uxr() {
      return this.$props.ux; // just a ref
    },
    layout: function layout() {
      return this.$props.ux.overlay.layout;
    },
    settings: function settings() {
      return this.$props.ux.overlay.settings;
    },
    uuid: function uuid() {
      return "tvjs-ux-wrapper-".concat(this.uxr.uuid);
    },
    mouse: function mouse() {
      return this.uxr.overlay.mouse;
    },
    style: function style() {
      var st = {
        'display': this.uxr.hidden ? 'none' : undefined,
        'left': "".concat(this.x, "px"),
        'top': "".concat(this.y, "px"),
        'pointer-events': this.uxr.pointer_events || 'all',
        'z-index': this.z_index
      };
      if (this.uxr.win_styling !== false) st = Object.assign(st, {
        'border': "1px solid ".concat(this.$props.colors.grid),
        'border-radius': '3px',
        'background': "".concat(this.background)
      });
      return st;
    },
    pin_style: function pin_style() {
      return {
        'left': "".concat(-this.ox, "px"),
        'top': "".concat(-this.oy, "px"),
        'background-color': this.uxr.pin_color
      };
    },
    btn_style: function btn_style() {
      return {
        'background': "".concat(this.inactive_btn_color),
        'color': "".concat(this.inactive_btn_color)
      };
    },
    pin_pos: function pin_pos() {
      return this.uxr.pin_position ? this.uxr.pin_position.split(',') : ['0', '0'];
    },
    // Offset x
    ox: function ox() {
      if (this.pin_pos.length !== 2) return undefined;
      var x = this.parse_coord(this.pin_pos[0], this.w);
      return -x;
    },
    // Offset y
    oy: function oy() {
      if (this.pin_pos.length !== 2) return undefined;
      var y = this.parse_coord(this.pin_pos[1], this.h);
      return -y;
    },
    z_index: function z_index() {
      var base_index = this.settings['z-index'] || this.settings['zIndex'] || 0;
      var ux_index = this.uxr['z_index'] || 0;
      return base_index + ux_index;
    },
    background: function background() {
      var c = this.uxr.background || this.$props.colors.back;
      return utils.apply_opacity(c, this.uxr.background_opacity || this.$props.config.UX_OPACITY);
    },
    inactive_btn_color: function inactive_btn_color() {
      return this.uxr.inactive_btn_color || this.$props.colors.grid;
    },
    wrapper: function wrapper() {
      return {
        x: this.x,
        y: this.y,
        pin_x: this.x - this.ox,
        pin_y: this.y - this.oy
      };
    }
  },
  watch: {
    updater: function updater() {
      this.update_position();
    }
  },
  data: function data() {
    return {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      visible: true
    };
  }
});
;// ./src/components/UxWrapper.vue?vue&type=script&lang=js
 /* harmony default export */ const components_UxWrappervue_type_script_lang_js = (UxWrappervue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/UxWrapper.vue?vue&type=style&index=0&id=26d7be98&prod&lang=css
var UxWrappervue_type_style_index_0_id_26d7be98_prod_lang_css = __webpack_require__(880);
;// ./src/components/UxWrapper.vue?vue&type=style&index=0&id=26d7be98&prod&lang=css

;// ./src/components/UxWrapper.vue



;


/* normalize component */

var UxWrapper_component = normalizeComponent(
  components_UxWrappervue_type_script_lang_js,
  UxWrappervue_type_template_id_26d7be98_render,
  UxWrappervue_type_template_id_26d7be98_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const UxWrapper = (UxWrapper_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/UxLayer.vue?vue&type=script&lang=js

/* harmony default export */ const UxLayervue_type_script_lang_js = ({
  name: 'UxLayer',
  props: ['tv_id', 'id', 'uxs', 'updater', 'colors', 'config'],
  components: {
    UxWrapper: UxWrapper
  },
  created: function created() {},
  mounted: function mounted() {},
  beforeDestroy: function beforeDestroy() {},
  methods: {
    on_custom_event: function on_custom_event(event) {
      this.$emit('custom-event', event);
    }
  },
  computed: {
    style: function style() {
      return {
        'top': this.$props.id !== 0 ? '1px' : 0,
        'left': 0,
        'width': '100%',
        'height': 'calc(100% - 2px)',
        'position': 'absolute',
        'z-index': '1',
        'pointer-events': 'none',
        'overflow': 'hidden'
      };
    }
  }
});
;// ./src/components/UxLayer.vue?vue&type=script&lang=js
 /* harmony default export */ const components_UxLayervue_type_script_lang_js = (UxLayervue_type_script_lang_js); 
;// ./src/components/UxLayer.vue





/* normalize component */
;
var UxLayer_component = normalizeComponent(
  components_UxLayervue_type_script_lang_js,
  UxLayervue_type_template_id_072774c0_render,
  UxLayervue_type_template_id_072774c0_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const UxLayer = (UxLayer_component.exports);
;// ./src/stuff/mouse.js


function mouse_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = mouse_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function mouse_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return mouse_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? mouse_arrayLikeToArray(r, a) : void 0; } }
function mouse_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Mouse event handler for overlay
var Mouse = /*#__PURE__*/function () {
  function Mouse(comp) {
    classCallCheck_classCallCheck(this, Mouse);
    this.comp = comp;
    this.map = {};
    this.listeners = 0;
    this.pressed = false;
    this.x = comp.$props.cursor.x;
    this.y = comp.$props.cursor.y;
    this.t = comp.$props.cursor.t;
    this.y$ = comp.$props.cursor.y$;
  }

  // You can choose where to place the handler
  // (beginning or end of the queue)
  return createClass_createClass(Mouse, [{
    key: "on",
    value: function on(name, handler, dir) {
      if (dir === void 0) {
        dir = "unshift";
      }
      if (!handler) return;
      this.map[name] = this.map[name] || [];
      this.map[name][dir](handler);
      this.listeners++;
    }
  }, {
    key: "off",
    value: function off(name, handler) {
      if (!this.map[name]) return;
      var i = this.map[name].indexOf(handler);
      if (i < 0) return;
      this.map[name].splice(i, 1);
      this.listeners--;
    }

    // Called by grid.js
  }, {
    key: "emit",
    value: function emit(name, event) {
      var l = this.comp.layout;
      if (name in this.map) {
        var _iterator = mouse_createForOfIteratorHelper(this.map[name]),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var f = _step.value;
            f(event);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      if (name === 'mousemove') {
        this.x = event.layerX;
        this.y = event.layerY;
        this.t = l.screen2t(this.x);
        this.y$ = l.screen2$(this.y);
      }
      if (name === 'mousedown') {
        this.pressed = true;
      }
      if (name === 'mouseup') {
        this.pressed = false;
      }
    }
  }]);
}();

;// ./src/mixins/overlay.js
// Usuful stuff for creating overlays. Include as mixin


/* harmony default export */ const overlay = ({
  props: ['id', 'num', 'interval', 'cursor', 'colors', 'layout', 'sub', 'data', 'settings', 'grid_id', 'font', 'config', 'meta', 'tf', 'i0', 'last'],
  mounted: function mounted() {
    // TODO(1): when hot reloading, dynamicaly changed mixins
    // dissapear (cuz it's a hack), the only way for now
    // is to reload the browser
    if (!this.draw) {
      this.draw = function (ctx) {
        var text = 'EARLY ADOPTER BUG: reload the browser & enjoy';
        console.warn(text);
      };
    }
    // Main chart?
    var main = this.$props.sub === this.$props.data;
    this.meta_info();

    // TODO(1): quick fix for vue2, in vue3 we use 3rd party emit
    try {
      new Function('return ' + this.$emit)();
      this._$emit = this.$emit;
      this.$emit = this.custom_event;
    } catch (e) {
      return;
    }
    this._$emit('new-grid-layer', {
      name: this.$options.name,
      id: this.$props.id,
      renderer: this,
      display: 'display' in this.$props.settings ? this.$props.settings['display'] : true,
      z: this.$props.settings['z-index'] || this.$props.settings['zIndex'] || (main ? 0 : -1)
    });

    // Overlay meta-props (adjusting behaviour)
    this._$emit('layer-meta-props', {
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
  beforeDestroy: function beforeDestroy() {
    if (this.destroy) this.destroy();
    this._$emit('delete-grid-layer', this.$props.id);
  },
  methods: {
    use_for: function use_for() {
      /* override it (mandatory) */
      console.warn('use_for() should be implemented');
      console.warn("Format: use_for() {\n                  return ['type1', 'type2', ...]\n            }");
    },
    meta_info: function meta_info() {
      /* override it (optional) */
      var id = this.$props.id;
      console.warn("".concat(id, " meta_info() is req. for publishing"));
      console.warn("Format: meta_info() {\n                author: 'Satoshi Smith',\n                version: '1.0.0',\n                contact (opt) '<email>'\n                github: (opt) '<GitHub Page>',\n            }");
    },
    custom_event: function custom_event(event) {
      if (event.split(':')[0] === 'hook') return;
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      if (event === 'change-settings' || event === 'object-selected' || event === 'new-shader' || event === 'new-interface' || event === 'remove-tool') {
        args.push(this.grid_id, this.id);
        if (this.$props.settings.$uuid) {
          args.push(this.$props.settings.$uuid);
        }
      }
      if (event === 'new-interface') {
        args[0].overlay = this;
        args[0].uuid = this.last_ux_id = "".concat(this.grid_id, "-").concat(this.id, "-").concat(this.uxs_count++);
      }
      // TODO: add a namespace to the event name
      // TODO(2): this prevents call overflow, but
      // the root of evil is in (1)
      if (event === 'custom-event') return;
      this._$emit('custom-event', {
        event: event,
        args: args
      });
    },
    // TODO: the event is not firing when the same
    // overlay type is added to the offchart[]
    exec_script: function exec_script() {
      if (this.calc) this.$emit('exec-script', {
        grid_id: this.$props.grid_id,
        layer_id: this.$props.id,
        src: this.calc(),
        use_for: this.use_for()
      });
    }
  },
  watch: {
    settings: {
      handler: function handler(n, p) {
        if (this.watch_uuid) this.watch_uuid(n, p);
        this._$emit('show-grid-layer', {
          id: this.$props.id,
          display: 'display' in this.$props.settings ? this.$props.settings['display'] : true
        });
      },
      deep: true
    }
  },
  data: function data() {
    return {
      uxs_count: 0,
      last_ux_id: null
    };
  },
  render: function render(h) {
    return h();
  }
});
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Spline.vue?vue&type=script&lang=js
// Spline renderer. (SMAs, EMAs, TEMAs...
// you know what I mean)
// TODO: make a real spline, not a bunch of lines...

// Adds all necessary stuff for you.

/* harmony default export */ const Splinevue_type_script_lang_js = ({
  name: 'Spline',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.1.2'
      };
    },
    // Here goes your code. You are provided with:
    // { All stuff is reactive }
    // $props.layout -> positions of all chart elements +
    //  some helper functions (see layout_fn.js)
    // $props.interval -> candlestick time interval
    // $props.sub -> current subset of candlestick data
    // $props.data -> your indicator's data subset.
    //  Comes "as is", should have the following format:
    //  [[<timestamp>, ... ], ... ]
    // $props.colors -> colors (see TradingVue.vue)
    // $props.cursor -> current position of crosshair
    // $props.settings -> indicator's custom settings
    //  E.g. colors, line thickness, etc. You define it.
    // $props.num -> indicator's layer number (of All
    // layers in the current grid)
    // $props.id -> indicator's id (e.g. EMA_0)
    // ~
    // Finally, let's make the canvas dirty!
    draw: function draw(ctx) {
      ctx.lineWidth = this.line_width;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      var layout = this.$props.layout;
      var i = this.data_index;
      var data = this.$props.data;
      if (!this.skip_nan) {
        for (var k = 0, n = data.length; k < n; k++) {
          var p = data[k];
          var x = layout.t2screen(p[0]);
          var y = layout.$2screen(p[i]);
          ctx.lineTo(x, y);
        }
      } else {
        var skip = false;
        for (var k = 0, n = data.length; k < n; k++) {
          var _p = data[k];
          var _x = layout.t2screen(_p[0]);
          var _y = layout.$2screen(_p[i]);
          if (_p[i] == null || _y !== _y) {
            skip = true;
          } else {
            if (skip) ctx.moveTo(_x, _y);
            ctx.lineTo(_x, _y);
            skip = false;
          }
        }
      }
      ctx.stroke();
    },
    // For all data with these types overlay will be
    // added to the renderer list. And '$props.data'
    // will have the corresponding values. If you want to
    // redefine the default behviour for a prticular
    // indicator (let's say EMA),
    // just create a new overlay with the same type:
    // e.g. use_for() { return ['EMA'] }.
    use_for: function use_for() {
      return ['Spline', 'EMA', 'SMA'];
    },
    // Colors for the legend, should have the
    // same dimention as a data point (excl. timestamp)
    data_colors: function data_colors() {
      return [this.color];
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 0.75;
    },
    color: function color() {
      var n = this.$props.num % 5;
      return this.sett.color || this.COLORS[n];
    },
    data_index: function data_index() {
      return this.sett.dataIndex || 1;
    },
    // Don't connect separate parts if true
    skip_nan: function skip_nan() {
      return this.sett.skipNaN;
    }
  },
  data: function data() {
    return {
      COLORS: ['#42b28a', '#5691ce', '#612ff9', '#d50b90', '#ff2316']
    };
  }
});
;// ./src/components/overlays/Spline.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Splinevue_type_script_lang_js = (Splinevue_type_script_lang_js); 
;// ./src/components/overlays/Spline.vue
var Spline_render, Spline_staticRenderFns
;



/* normalize component */
;
var Spline_component = normalizeComponent(
  overlays_Splinevue_type_script_lang_js,
  Spline_render,
  Spline_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Spline = (Spline_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Splines.vue?vue&type=script&lang=js
// Channel renderer. (Keltner, Bollinger)

/* harmony default export */ const Splinesvue_type_script_lang_js = ({
  name: 'Splines',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.1.0'
      };
    },
    draw: function draw(ctx) {
      for (var i = 0; i < this.lines_num; i++) {
        var _i = i % this.clrx.length;
        ctx.strokeStyle = this.clrx[_i];
        ctx.lineWidth = this.widths[i] || this.line_width;
        ctx.beginPath();
        this.draw_spline(ctx, i);
        ctx.stroke();
      }
    },
    draw_spline: function draw_spline(ctx, i) {
      var layout = this.$props.layout;
      var data = this.$props.data;
      if (!this.skip_nan) {
        for (var k = 0, n = data.length; k < n; k++) {
          var p = data[k];
          var x = layout.t2screen(p[0]);
          var y = layout.$2screen(p[i + 1]);
          ctx.lineTo(x, y);
        }
      } else {
        var skip = false;
        for (var k = 0, n = data.length; k < n; k++) {
          var _p = data[k];
          var _x = layout.t2screen(_p[0]);
          var _y = layout.$2screen(_p[i + 1]);
          if (_p[i + 1] == null || _y !== _y) {
            skip = true;
          } else {
            if (skip) ctx.moveTo(_x, _y);
            ctx.lineTo(_x, _y);
            skip = false;
          }
        }
      }
    },
    use_for: function use_for() {
      return ['Splines', 'DMI'];
    },
    data_colors: function data_colors() {
      return this.clrx;
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 0.75;
    },
    widths: function widths() {
      return this.sett.lineWidths || [];
    },
    clrx: function clrx() {
      var colors = this.sett.colors || [];
      var n = this.$props.num;
      if (!colors.length) {
        for (var i = 0; i < this.lines_num; i++) {
          colors.push(this.COLORS[(n + i) % 5]);
        }
      }
      return colors;
    },
    lines_num: function lines_num() {
      if (!this.$props.data[0]) return 0;
      return this.$props.data[0].length - 1;
    },
    // Don't connect separate parts if true
    skip_nan: function skip_nan() {
      return this.sett.skipNaN;
    }
  },
  data: function data() {
    return {
      COLORS: ['#42b28a', '#5691ce', '#612ff9', '#d50b90', '#ff2316']
    };
  }
});
;// ./src/components/overlays/Splines.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Splinesvue_type_script_lang_js = (Splinesvue_type_script_lang_js); 
;// ./src/components/overlays/Splines.vue
var Splines_render, Splines_staticRenderFns
;



/* normalize component */
;
var Splines_component = normalizeComponent(
  overlays_Splinesvue_type_script_lang_js,
  Splines_render,
  Splines_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Splines = (Splines_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Range.vue?vue&type=script&lang=js
// R S I . Because we love it

// Adds all necessary stuff for you.

/* harmony default export */ const Rangevue_type_script_lang_js = ({
  name: 'Range',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.0.1'
      };
    },
    // Here goes your code. You are provided with:
    // { All stuff is reactive }
    // $props.layout -> positions of all chart elements +
    //  some helper functions (see layout_fn.js)
    // $props.interval -> candlestick time interval
    // $props.sub -> current subset of candlestick data
    // $props.data -> your indicator's data subset.
    //  Comes "as is", should have the following format:
    //  [[<timestamp>, ... ], ... ]
    // $props.colors -> colors (see TradingVue.vue)
    // $props.cursor -> current position of crosshair
    // $props.settings -> indicator's custom settings
    //  E.g. colors, line thickness, etc. You define it.
    // $props.num -> indicator's layer number (of All
    // layers in the current grid)
    // $props.id -> indicator's id (e.g. EMA_0)
    // ~
    // Finally, let's make the canvas dirty!
    draw: function draw(ctx) {
      var layout = this.$props.layout;
      var upper = layout.$2screen(this.sett.upper || 70);
      var lower = layout.$2screen(this.sett.lower || 30);
      var data = this.$props.data;

      // RSI values

      ctx.lineWidth = this.line_width;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      for (var k = 0, n = data.length; k < n; k++) {
        var p = data[k];
        var x = layout.t2screen(p[0]);
        var y = layout.$2screen(p[1]);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = this.band_color;
      ctx.setLineDash([5]); // Will be removed after draw()
      ctx.beginPath();

      // Fill the area between the bands
      ctx.fillStyle = this.back_color;
      ctx.fillRect(0, upper, layout.width, lower - upper);

      // Upper band
      ctx.moveTo(0, upper);
      ctx.lineTo(layout.width, upper);

      // Lower band
      ctx.moveTo(0, lower);
      ctx.lineTo(layout.width, lower);
      ctx.stroke();
    },
    // For all data with these types overlay will be
    // added to the renderer list. And '$props.data'
    // will have the corresponding values. If you want to
    // redefine the default behviour for a prticular
    // indicator (let's say EMA),
    // just create a new overlay with the same type:
    // e.g. use_for() { return ['EMA'] }.
    use_for: function use_for() {
      return ['Range', 'RSI'];
    },
    // Colors for the legend, should have the
    // same dimention as a data point (excl. timestamp)
    data_colors: function data_colors() {
      return [this.color];
    },
    // Y-Range tansform. For example you need a fixed
    // Y-range for an indicator, you can do it here!
    // Gets estimated range, @return you favorite range
    y_range: function y_range(hi, lo) {
      return [Math.max(hi, this.sett.upper || 70), Math.min(lo, this.sett.lower || 30)];
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 0.75;
    },
    color: function color() {
      return this.sett.color || '#ec206e';
    },
    band_color: function band_color() {
      return this.sett.bandColor || '#ddd';
    },
    back_color: function back_color() {
      return this.sett.backColor || '#381e9c16';
    }
  }
});
;// ./src/components/overlays/Range.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Rangevue_type_script_lang_js = (Rangevue_type_script_lang_js); 
;// ./src/components/overlays/Range.vue
var Range_render, Range_staticRenderFns
;



/* normalize component */
;
var Range_component = normalizeComponent(
  overlays_Rangevue_type_script_lang_js,
  Range_render,
  Range_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Range = (Range_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Trades.vue?vue&type=script&lang=js

/* harmony default export */ const Tradesvue_type_script_lang_js = ({
  name: 'Trades',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.0.2'
      };
    },
    draw: function draw(ctx) {
      var layout = this.$props.layout;
      var data = this.$props.data;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'black';
      for (var k = 0, n = data.length; k < n; k++) {
        var p = data[k];
        ctx.fillStyle = p[1] ? this.buy_color : this.sell_color;
        ctx.beginPath();
        var x = layout.t2screen(p[0]); // x - Mapping
        var y = layout.$2screen(p[2]); // y - Mapping
        ctx.arc(x, y, this.marker_size + 0.5, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.stroke();
        if (this.show_label && p[3]) {
          this.draw_label(ctx, x, y, p);
        }
      }
    },
    draw_label: function draw_label(ctx, x, y, p) {
      ctx.fillStyle = this.label_color;
      ctx.font = this.new_font;
      ctx.textAlign = 'center';
      ctx.fillText(p[3], x, y - 25);
    },
    use_for: function use_for() {
      return ['Trades'];
    },
    // Defines legend format (values & colors)
    legend: function legend(values) {
      switch (values[1]) {
        case 0:
          var pos = 'Sell';
          break;
        case 1:
          pos = 'Buy';
          break;
        default:
          pos = 'Unknown';
      }
      return [{
        value: pos
      }, {
        value: values[2].toFixed(4),
        color: this.$props.colors.text
      }].concat(values[3] ? [{
        value: values[3]
      }] : []);
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    default_font: function default_font() {
      return '12px ' + this.$props.font.split('px').pop();
    },
    buy_color: function buy_color() {
      return this.sett.buyColor || '#63df89';
    },
    sell_color: function sell_color() {
      return this.sett.sellColor || '#ec4662';
    },
    label_color: function label_color() {
      return this.sett.labelColor || '#999';
    },
    marker_size: function marker_size() {
      return this.sett.markerSize || 5;
    },
    show_label: function show_label() {
      return this.sett.showLabel !== false;
    },
    new_font: function new_font() {
      return this.sett.font || this.default_font;
    }
  }
});
;// ./src/components/overlays/Trades.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Tradesvue_type_script_lang_js = (Tradesvue_type_script_lang_js); 
;// ./src/components/overlays/Trades.vue
var Trades_render, Trades_staticRenderFns
;



/* normalize component */
;
var Trades_component = normalizeComponent(
  overlays_Tradesvue_type_script_lang_js,
  Trades_render,
  Trades_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Trades = (Trades_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Channel.vue?vue&type=script&lang=js
// Channel renderer. (Keltner, Bollinger)
// TODO: allow color transparency
// TODO: improve performance: draw in one solid chunk

/* harmony default export */ const Channelvue_type_script_lang_js = ({
  name: 'Channel',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.0.1'
      };
    },
    /*draw(ctx) {
        ctx.lineWidth = this.line_width
        ctx.strokeStyle = this.color
        ctx.fillStyle = this.back_color
         for (var i = 0; i < this.$props.data.length - 1; i++) {
              let p1 = this.mapp(this.$props.data[i])
            let p2 = this.mapp(this.$props.data[i+1])
             if (!p2) continue
            if (p1.y1 !== p1.y1) continue // Fix NaN
             // Background
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y1)
            ctx.lineTo(p2.x + 0.1, p2.y1)
            ctx.lineTo(p2.x + 0.1, p2.y3)
            ctx.lineTo(p1.x, p1.y3)
            ctx.fill()
             // Lines
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y1)
            ctx.lineTo(p2.x, p2.y1)
            if (this.show_mid) {
                ctx.moveTo(p1.x, p1.y2)
                ctx.lineTo(p2.x, p2.y2)
            }
            ctx.moveTo(p1.x, p1.y3)
            ctx.lineTo(p2.x, p2.y3)
            ctx.stroke()
         }
    },*/
    draw: function draw(ctx) {
      // Background
      var data = this.data;
      var layout = this.layout;
      ctx.beginPath();
      ctx.fillStyle = this.back_color;
      for (var i = 0; i < data.length; i++) {
        var p = data[i];
        var x = layout.t2screen(p[0]);
        var y = layout.$2screen(p[1] || undefined);
        ctx.lineTo(x, y);
      }
      for (var i = data.length - 1; i >= 0; i--) {
        var _p = data[i];
        var _x = layout.t2screen(_p[0]);
        var _y = layout.$2screen(_p[3] || undefined);
        ctx.lineTo(_x, _y);
      }
      ctx.fill();

      // Lines
      ctx.lineWidth = this.line_width;
      ctx.strokeStyle = this.color;

      // Top line
      ctx.beginPath();
      for (var i = 0; i < data.length; i++) {
        var _p2 = data[i];
        var _x2 = layout.t2screen(_p2[0]);
        var _y2 = layout.$2screen(_p2[1] || undefined);
        ctx.lineTo(_x2, _y2);
      }
      ctx.stroke();
      // Bottom line
      ctx.beginPath();
      for (var i = 0; i < data.length; i++) {
        var _p3 = data[i];
        var _x3 = layout.t2screen(_p3[0]);
        var _y3 = layout.$2screen(_p3[3] || undefined);
        ctx.lineTo(_x3, _y3);
      }
      ctx.stroke();
      // Middle line
      if (!this.show_mid) return;
      ctx.beginPath();
      for (var i = 0; i < data.length; i++) {
        var _p4 = data[i];
        var _x4 = layout.t2screen(_p4[0]);
        var _y4 = layout.$2screen(_p4[2] || undefined);
        ctx.lineTo(_x4, _y4);
      }
      ctx.stroke();
    },
    mapp: function mapp(p) {
      var layout = this.$props.layout;
      return p && {
        x: layout.t2screen(p[0]),
        y1: layout.$2screen(p[1]),
        y2: layout.$2screen(p[2]),
        y3: layout.$2screen(p[3])
      };
    },
    use_for: function use_for() {
      return ['Channel', 'KC', 'BB'];
    },
    data_colors: function data_colors() {
      return [this.color, this.color, this.color];
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 0.75;
    },
    color: function color() {
      var n = this.$props.num % 5;
      return this.sett.color || this.COLORS[n];
    },
    show_mid: function show_mid() {
      return 'showMid' in this.sett ? this.sett.showMid : true;
    },
    back_color: function back_color() {
      return this.sett.backColor || this.color + '11';
    }
  },
  data: function data() {
    return {
      COLORS: ['#42b28a', '#5691ce', '#612ff9', '#d50b90', '#ff2316']
    };
  }
});
;// ./src/components/overlays/Channel.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Channelvue_type_script_lang_js = (Channelvue_type_script_lang_js); 
;// ./src/components/overlays/Channel.vue
var Channel_render, Channel_staticRenderFns
;



/* normalize component */
;
var Channel_component = normalizeComponent(
  overlays_Channelvue_type_script_lang_js,
  Channel_render,
  Channel_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Channel = (Channel_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Segment.vue?vue&type=script&lang=js
// Segment renderer.


/* harmony default export */ const Segmentvue_type_script_lang_js = ({
  name: 'Segment',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.0.0'
      };
    },
    draw: function draw(ctx) {
      if (!this.p1 || !this.p2) return;
      ctx.lineWidth = this.line_width;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      var layout = this.$props.layout;
      var x1 = layout.t2screen(this.p1[0]);
      var y1 = layout.$2screen(this.p1[1]);
      ctx.moveTo(x1, y1);
      var x2 = layout.t2screen(this.p2[0]);
      var y2 = layout.$2screen(this.p2[1]);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    },
    use_for: function use_for() {
      return ['Segment'];
    },
    data_colors: function data_colors() {
      return [this.color];
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    p1: function p1() {
      return this.$props.settings.p1;
    },
    p2: function p2() {
      return this.$props.settings.p2;
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 0.9;
    },
    color: function color() {
      var n = this.$props.num % 5;
      return this.sett.color || this.COLORS[n];
    }
  },
  data: function data() {
    return {
      COLORS: ['#42b28a', '#5691ce', '#612ff9', '#d50b90', '#ff2316']
    };
  }
});
;// ./src/components/overlays/Segment.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Segmentvue_type_script_lang_js = (Segmentvue_type_script_lang_js); 
;// ./src/components/overlays/Segment.vue
var Segment_render, Segment_staticRenderFns
;



/* normalize component */
;
var Segment_component = normalizeComponent(
  overlays_Segmentvue_type_script_lang_js,
  Segment_render,
  Segment_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Segment = (Segment_component.exports);
;// ./src/components/js/layout_cnv.js


// Claculates postions and sizes for candlestick
// and volume bars for the given subset of data


function layout_cnv(self) {
  var $p = self.$props;
  var sub = $p.data;
  var t2screen = $p.layout.t2screen;
  var layout = $p.layout;
  var candles = [];
  var volume = [];

  // The volume bar height is determined as a percentage of
  // the chart's height (VOLSCALE)
  var maxv = Math.max.apply(Math, _toConsumableArray(sub.map(function (x) {
    return x[5];
  })));
  var vs = $p.config.VOLSCALE * layout.height / maxv;
  var x1,
    x2,
    w,
    avg_w,
    mid,
    prev = undefined;

  // Subset interval against main interval
  var _new_interval = new_interval(layout, $p, sub),
    _new_interval2 = _slicedToArray(_new_interval, 2),
    interval2 = _new_interval2[0],
    ratio = _new_interval2[1];
  var px_step2 = layout.px_step * ratio;
  var splitter = px_step2 > 5 ? 1 : 0;

  // A & B are current chart tranformations:
  // A === scale,  B === Y-axis shift
  for (var i = 0; i < sub.length; i++) {
    var p = sub[i];
    mid = t2screen(p[0]) + 1;

    // Clear volume bar if there is a time gap
    if (sub[i - 1] && p[0] - sub[i - 1][0] > interval2) {
      prev = null;
    }
    x1 = prev || Math.floor(mid - px_step2 * 0.5);
    x2 = Math.floor(mid + px_step2 * 0.5) - 0.5;

    // TODO: add log scale support
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
      x1: x1,
      x2: x2,
      h: p[5] * vs,
      green: p[4] >= p[1],
      raw: p
    });
    prev = x2 + splitter;
  }
  return {
    candles: candles,
    volume: volume
  };
}
function layout_vol(self) {
  var $p = self.$props;
  var sub = $p.data;
  var t2screen = $p.layout.t2screen;
  var layout = $p.layout;
  var volume = [];

  // Detect data second dimention size:
  var dim = sub[0] ? sub[0].length : 0;

  // Support special volume data (see API book), or OHLCV
  // Data indices:
  self._i1 = dim < 6 ? 1 : 5;
  self._i2 = dim < 6 ? function (p) {
    return p[2];
  } : function (p) {
    return p[4] >= p[1];
  };
  var maxv = Math.max.apply(Math, _toConsumableArray(sub.map(function (x) {
    return x[self._i1];
  })));
  var volscale = self.volscale || $p.config.VOLSCALE;
  var vs = volscale * layout.height / maxv;
  var x1,
    x2,
    mid,
    prev = undefined;

  // Subset interval against main interval
  var _new_interval3 = new_interval(layout, $p, sub),
    _new_interval4 = _slicedToArray(_new_interval3, 2),
    interval2 = _new_interval4[0],
    ratio = _new_interval4[1];
  var px_step2 = layout.px_step * ratio;
  var splitter = px_step2 > 5 ? 1 : 0;

  // A & B are current chart tranformations:
  // A === scale,  B === Y-axis shift
  for (var i = 0; i < sub.length; i++) {
    var p = sub[i];
    mid = t2screen(p[0]) + 1;

    // Clear volume bar if there is a time gap
    if (sub[i - 1] && p[0] - sub[i - 1][0] > interval2) {
      prev = null;
    }
    x1 = prev || Math.floor(mid - px_step2 * 0.5);
    x2 = Math.floor(mid + px_step2 * 0.5) - 0.5;
    volume.push({
      x1: x1,
      x2: x2,
      h: p[self._i1] * vs,
      green: self._i2(p),
      raw: p
    });
    prev = x2 + splitter;
  }
  return volume;
}
function new_interval(layout, $p, sub) {
  // Subset interval against main interval
  // Prefer using main chart interval to avoid detection issues with data gaps
  if (!layout.ti_map.ib) {
    // Use overlay's tf, or fall back to main chart interval, then detect
    var interval2 = $p.tf || $p.interval || utils.detect_interval(sub);
    var ratio = interval2 / $p.interval;
  } else {
    if ($p.tf) {
      var ratio = $p.tf / layout.ti_map.tf;
      var interval2 = ratio;
    } else {
      // Use main chart interval if available
      var interval2 = $p.interval || utils.detect_interval(sub);
      var ratio = interval2 / $p.interval;
    }
  }
  return [interval2, ratio];
}
;// ./src/components/primitives/candle.js


// Candle object for Candles overlay
var CandleExt = /*#__PURE__*/function () {
  function CandleExt(overlay, ctx, data) {
    classCallCheck_classCallCheck(this, CandleExt);
    this.ctx = ctx;
    this.self = overlay;
    this.style = data.raw[6] || this.self;
    this.draw(data);
  }
  return createClass_createClass(CandleExt, [{
    key: "draw",
    value: function draw(data) {
      var green = data.raw[4] >= data.raw[1];
      /* const body_color = green ?
          this.style.colorCandleUp :
          this.style.colorCandleDw */
      var body_color = data.raw[6];
      /* const wick_color = data.raw[6] */
      var wick_color = '#7D7D7D';
      var w = Math.max(data.w, 1);
      var hw = Math.max(Math.floor(w * 0.5), 1);
      var h = Math.abs(data.o - data.c);
      var max_h = data.c === data.o ? 1 : 2;
      var x05 = Math.floor(data.x) - 0.5;
      this.ctx.strokeStyle = wick_color;
      this.ctx.beginPath();
      this.ctx.moveTo(x05, Math.floor(data.h));
      this.ctx.lineTo(x05, Math.floor(data.l));
      this.ctx.stroke();
      if (data.w > 1.5) {
        this.ctx.fillStyle = body_color;
        // TODO: Move common calculations to layout.js
        var s = green ? 1 : -1;
        this.ctx.fillRect(Math.floor(data.x - hw - 1), data.c, Math.floor(hw * 2 + 1), s * Math.max(h, max_h));
      } else {
        this.ctx.strokeStyle = body_color;
        this.ctx.beginPath();
        this.ctx.moveTo(x05, Math.floor(Math.min(data.o, data.c)));
        this.ctx.lineTo(x05, Math.floor(Math.max(data.o, data.c)) + (data.o === data.c ? 1 : 0));
        this.ctx.stroke();
      }

      // Calculate font size based on candle width
      var fontSize = Math.max(Math.min(Math.floor(data.w * 0.8), 14), 8);
      this.ctx.font = "".concat(fontSize, "px sans-serif");
      this.ctx.textAlign = 'center';

      // Draw value1 (index 7) below candle in bright green
      var value1 = data.raw[7];
      if (value1 && value1 !== '') {
        this.ctx.fillStyle = '#00FF00';
        this.ctx.textBaseline = 'top';
        var textY = Math.floor(data.l) + 3;
        this.ctx.fillText(value1, Math.floor(data.x), textY);
      }

      // Draw value2 (index 8) above candle in bright red
      var value2 = data.raw[8];
      if (value2 && value2 !== '') {
        this.ctx.fillStyle = '#FF0000';
        this.ctx.textBaseline = 'bottom';
        var _textY = Math.floor(data.h) - 3;
        this.ctx.fillText(value2, Math.floor(data.x), _textY);
      }
    }
  }]);
}();

;// ./src/components/primitives/volbar.js


var VolbarExt = /*#__PURE__*/function () {
  function VolbarExt(overlay, ctx, data) {
    classCallCheck_classCallCheck(this, VolbarExt);
    this.ctx = ctx;
    this.$p = overlay.$props;
    this.self = overlay;
    this.style = data.raw[6] || this.self;
    this.draw(data);
  }
  return createClass_createClass(VolbarExt, [{
    key: "draw",
    value: function draw(data) {
      var y0 = this.$p.layout.height;
      var w = data.x2 - data.x1;
      var h = Math.floor(data.h);
      this.ctx.fillStyle = data.z;
      /* this.ctx.fillStyle = data.green ?
          this.style.colorVolUp :
          this.style.colorVolDw */

      this.ctx.fillRect(Math.floor(data.x1), Math.floor(y0 - h - 0.5), Math.floor(w), Math.floor(h + 1));
    }
  }]);
}();

;// ./src/components/primitives/price.js


// Price bar & price line (shader)
var Price = /*#__PURE__*/function () {
  function Price(comp) {
    classCallCheck_classCallCheck(this, Price);
    this.comp = comp;
  }

  // Defines an inline shader (has access to both
  // target & overlay's contexts)
  return createClass_createClass(Price, [{
    key: "init_shader",
    value: function init_shader() {
      var _this = this;
      var layout = this.comp.$props.layout;
      var config = this.comp.$props.config;
      var comp = this.comp;
      var last_bar = function last_bar() {
        return _this.last_bar();
      };
      this.comp.$emit('new-shader', {
        target: 'sidebar',
        draw: function draw(ctx) {
          var bar = last_bar();
          if (!bar) return;
          var w = ctx.canvas.width;
          var h = config.PANHEIGHT;
          var lbl = bar.price.toFixed(layout.prec);
          ctx.fillStyle = bar.color;
          var x = -0.5;
          var y = bar.y - h * 0.5 - 0.5;
          var a = 7;
          ctx.fillRect(x - 0.5, y, w + 1, h);
          ctx.fillStyle = comp.$props.colors.textHL;
          ctx.textAlign = 'left';
          ctx.fillText(lbl, a, y + 15);
        }
      });
      this.shader = true;
    }

    // Regular draw call for overaly
  }, {
    key: "draw",
    value: function draw(ctx) {
      if (!this.comp.$props.meta.last) return;
      if (!this.shader) this.init_shader();
      var layout = this.comp.$props.layout;
      var last = this.comp.$props.last;
      var dir = last[4] >= last[1];
      var color = dir ? this.green() : this.red();
      var y = layout.$2screen(last[4]) + (dir ? 1 : 0);
      ctx.strokeStyle = color;
      ctx.setLineDash([1, 1]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(layout.width, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, {
    key: "last_bar",
    value: function last_bar() {
      if (!this.comp.data.length) return undefined;
      var layout = this.comp.$props.layout;
      var last = this.comp.data[this.comp.data.length - 1];
      var y = layout.$2screen(last[4]);
      //let cndl = layout.c_magnet(last[0])
      return {
        y: y,
        //Math.floor(cndl.c) - 0.5,
        price: last[4],
        color: last[4] >= last[1] ? this.green() : this.red()
      };
    }
  }, {
    key: "last_price",
    value: function last_price() {
      return this.comp.$props.meta.last ? this.comp.$props.meta.last[4] : undefined;
    }
  }, {
    key: "green",
    value: function green() {
      return this.comp.colorCandleUp;
    }
  }, {
    key: "red",
    value: function red() {
      return this.comp.colorCandleDw;
    }
  }]);
}();

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Candles.vue?vue&type=script&lang=js
// Renedrer for candlesticks + volume (optional)
// It can be used as the main chart or an indicator






/* harmony default export */ const Candlesvue_type_script_lang_js = ({
  name: 'Candles',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.2.1'
      };
    },
    init: function init() {
      this.price = new Price(this);
    },
    draw: function draw(ctx) {
      // If data === main candlestick data
      // render as main chart:
      if (this.$props.sub === this.$props.data) {
        var cnv = {
          candles: this.$props.layout.candles,
          volume: this.$props.layout.volume
        };
        // Else, as offchart / onchart indicator:
      } else {
        cnv = layout_cnv(this);
      }
      if (this.show_volume) {
        var cv = cnv.volume;
        for (var i = 0, n = cv.length; i < n; i++) {
          new VolbarExt(this, ctx, cv[i]);
        }
      }
      var cc = cnv.candles;
      for (var i = 0, n = cc.length; i < n; i++) {
        new CandleExt(this, ctx, cc[i]);
      }
      if (this.price_line) this.price.draw(ctx);
    },
    use_for: function use_for() {
      return ['Candles'];
    },
    // In case it's added as offchart overlay
    y_range: function y_range() {
      var hi = -Infinity,
        lo = Infinity;
      for (var i = 0, n = this.sub.length; i < n; i++) {
        var x = this.sub[i];
        if (x[2] > hi) hi = x[2];
        if (x[3] < lo) lo = x[3];
      }
      return [hi, lo];
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    show_volume: function show_volume() {
      return 'showVolume' in this.sett ? this.sett.showVolume : true;
    },
    price_line: function price_line() {
      return 'priceLine' in this.sett ? this.sett.priceLine : true;
    },
    colorCandleUp: function colorCandleUp() {
      return this.sett.colorCandleUp || this.$props.colors.candleUp;
    },
    colorCandleDw: function colorCandleDw() {
      return this.sett.colorCandleDw || this.$props.colors.candleDw;
    },
    colorWickUp: function colorWickUp() {
      return this.sett.colorWickUp || this.$props.colors.wickUp;
    },
    colorWickDw: function colorWickDw() {
      return this.sett.colorWickDw || this.$props.colors.wickDw;
    },
    colorWickSm: function colorWickSm() {
      return this.sett.colorWickSm || this.$props.colors.wickSm;
    },
    colorVolUp: function colorVolUp() {
      return this.sett.colorVolUp || this.$props.colors.volUp;
    },
    colorVolDw: function colorVolDw() {
      return this.sett.colorVolDw || this.$props.colors.volDw;
    }
  },
  data: function data() {
    return {
      price: {}
    };
  }
});
;// ./src/components/overlays/Candles.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Candlesvue_type_script_lang_js = (Candlesvue_type_script_lang_js); 
;// ./src/components/overlays/Candles.vue
var Candles_render, Candles_staticRenderFns
;



/* normalize component */
;
var Candles_component = normalizeComponent(
  overlays_Candlesvue_type_script_lang_js,
  Candles_render,
  Candles_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Candles = (Candles_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Volume.vue?vue&type=script&lang=js

function Volumevue_type_script_lang_js_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = Volumevue_type_script_lang_js_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function Volumevue_type_script_lang_js_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return Volumevue_type_script_lang_js_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? Volumevue_type_script_lang_js_arrayLikeToArray(r, a) : void 0; } }
function Volumevue_type_script_lang_js_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Standalone renedrer for the volume




/* harmony default export */ const Volumevue_type_script_lang_js = ({
  name: 'Volume',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.1.0'
      };
    },
    draw: function draw(ctx) {
      // TODO: volume average
      // TODO: Y-axis scaling
      var _iterator = Volumevue_type_script_lang_js_createForOfIteratorHelper(layout_vol(this)),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var v = _step.value;
          new VolbarExt(this, ctx, v);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    },
    use_for: function use_for() {
      return ['Volume'];
    },
    // Defines legend format (values & colors)
    // _i2 - detetected data index (see layout_cnv)
    legend: function legend(values) {
      var flag = this._i2 ? this._i2(values) : values[2];
      var color = flag ? this.colorVolUpLegend : this.colorVolDwLegend;
      return [{
        value: values[this._i1 || 1],
        color: color
      }];
    },
    // When added as offchart overlay
    // If data is OHLCV => recalc y-range
    // _i1 - detetected data index (see layout_cnv)
    y_range: function y_range(hi, lo) {
      var _this = this;
      if (this._i1 === 5) {
        var sub = this.$props.sub;
        return [Math.max.apply(Math, _toConsumableArray(sub.map(function (x) {
          return x[_this._i1];
        }))), Math.min.apply(Math, _toConsumableArray(sub.map(function (x) {
          return x[_this._i1];
        })))];
      } else {
        return [hi, lo];
      }
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    colorVolUp: function colorVolUp() {
      return this.sett.colorVolUp || this.$props.colors.volUp;
    },
    colorVolDw: function colorVolDw() {
      return this.sett.colorVolDw || this.$props.colors.volDw;
    },
    colorVolUpLegend: function colorVolUpLegend() {
      return this.sett.colorVolUpLegend || this.$props.colors.candleUp;
    },
    colorVolDwLegend: function colorVolDwLegend() {
      return this.sett.colorVolDwLegend || this.$props.colors.candleDw;
    },
    volscale: function volscale() {
      return this.sett.volscale || this.$props.grid_id > 0 ? 0.85 : this.$props.config.VOLSCALE;
    }
  },
  data: function data() {
    return {};
  }
});
;// ./src/components/overlays/Volume.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Volumevue_type_script_lang_js = (Volumevue_type_script_lang_js); 
;// ./src/components/overlays/Volume.vue
var Volume_render, Volume_staticRenderFns
;



/* normalize component */
;
var Volume_component = normalizeComponent(
  overlays_Volumevue_type_script_lang_js,
  Volume_render,
  Volume_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Volume = (Volume_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Splitters.vue?vue&type=script&lang=js
// Data section splitters (with labels)


/* harmony default export */ const Splittersvue_type_script_lang_js = ({
  name: 'Splitters',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.0.1'
      };
    },
    draw: function draw(ctx) {
      var _this = this;
      var layout = this.$props.layout;
      ctx.lineWidth = this.line_width;
      ctx.strokeStyle = this.line_color;
      this.$props.data.forEach(function (p, i) {
        ctx.beginPath();
        var x = layout.t2screen(p[0]); // x - Mapping
        ctx.setLineDash([10, 10]);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, _this.layout.height);
        ctx.stroke();
        if (p[1]) _this.draw_label(ctx, x, p);
      });
    },
    draw_label: function draw_label(ctx, x, p) {
      var side = p[2] ? 1 : -1;
      x += 2.5 * side;
      ctx.font = this.new_font;
      var pos = p[4] || this.y_position;
      var w = ctx.measureText(p[1]).width + 10;
      var y = this.layout.height * (1.0 - pos);
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
      ctx.textAlign = side < 0 ? 'right' : 'left';
      ctx.fillText(p[1], x + 15 * side, y + 4);
    },
    use_for: function use_for() {
      return ['Splitters'];
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    new_font: function new_font() {
      return this.sett.font || '12px ' + this.$props.font.split('px').pop();
    },
    flag_color: function flag_color() {
      return this.sett.flagColor || '#4285f4';
    },
    label_color: function label_color() {
      return this.sett.labelColor || '#fff';
    },
    line_color: function line_color() {
      return this.sett.lineColor || '#4285f4';
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 1.0;
    },
    y_position: function y_position() {
      return this.sett.yPosition || 0.9;
    }
  },
  data: function data() {
    return {};
  }
});
;// ./src/components/overlays/Splitters.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Splittersvue_type_script_lang_js = (Splittersvue_type_script_lang_js); 
;// ./src/components/overlays/Splitters.vue
var Splitters_render, Splitters_staticRenderFns
;



/* normalize component */
;
var Splitters_component = normalizeComponent(
  overlays_Splittersvue_type_script_lang_js,
  Splitters_render,
  Splitters_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Splitters = (Splitters_component.exports);
;// ./src/stuff/keys.js


function keys_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = keys_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function keys_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return keys_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? keys_arrayLikeToArray(r, a) : void 0; } }
function keys_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Keyboard event handler for overlay
var Keys = /*#__PURE__*/function () {
  function Keys(comp) {
    classCallCheck_classCallCheck(this, Keys);
    this.comp = comp;
    this.map = {};
    this.listeners = 0;
    this.keymap = {};
  }
  return createClass_createClass(Keys, [{
    key: "on",
    value: function on(name, handler) {
      if (!handler) return;
      this.map[name] = this.map[name] || [];
      this.map[name].push(handler);
      this.listeners++;
    }

    // Called by grid.js
  }, {
    key: "emit",
    value: function emit(name, event) {
      if (name in this.map) {
        var _iterator = keys_createForOfIteratorHelper(this.map[name]),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var f = _step.value;
            f(event);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      if (name === 'keydown') {
        if (!this.keymap[event.key]) {
          this.emit(event.key);
        }
        this.keymap[event.key] = true;
      }
      if (name === 'keyup') {
        this.keymap[event.key] = false;
      }
    }
  }, {
    key: "pressed",
    value: function pressed(key) {
      return this.keymap[key];
    }
  }]);
}();

;// ./src/mixins/tool.js
function tool_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = tool_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function tool_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return tool_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? tool_arrayLikeToArray(r, a) : void 0; } }
function tool_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Usuful stuff for creating tools. Include as mixin



/* harmony default export */ const tool = ({
  methods: {
    init_tool: function init_tool() {
      var _this = this;
      // Collision functions (float, float) => bool,
      this.collisions = [];
      this.pins = [];
      this.mouse.on('mousemove', function (e) {
        if (_this.collisions.some(function (f) {
          return f(_this.mouse.x, _this.mouse.y);
        })) {
          _this.show_pins = true;
        } else {
          _this.show_pins = false;
        }
        if (_this.drag) _this.drag_update();
      });
      this.mouse.on('mousedown', function (e) {
        if (utils.default_prevented(e)) return;
        if (_this.collisions.some(function (f) {
          return f(_this.mouse.x, _this.mouse.y);
        })) {
          if (!_this.selected) {
            _this.$emit('object-selected');
          }
          _this.start_drag();
          e.preventDefault();
          _this.pins.forEach(function (x) {
            return x.mousedown(e, true);
          });
        }
      });
      this.mouse.on('mouseup', function (e) {
        _this.drag = null;
        _this.$emit('scroll-lock', false);
      });
      this.keys = new Keys(this);
      this.keys.on('Delete', this.remove_tool);
      this.keys.on('Backspace', this.remove_tool);
      this.show_pins = false;
      this.drag = null;
    },
    render_pins: function render_pins(ctx) {
      if (this.selected || this.show_pins) {
        this.pins.forEach(function (x) {
          return x.draw(ctx);
        });
      }
    },
    set_state: function set_state(name) {
      this.$emit('change-settings', {
        $state: name
      });
    },
    watch_uuid: function watch_uuid(n, p) {
      // If layer $uuid is changed, then re-init
      // pins & collisions
      if (n.$uuid !== p.$uuid) {
        var _iterator = tool_createForOfIteratorHelper(this.pins),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var p = _step.value;
            p.re_init();
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        this.collisions = [];
        this.show_pins = false;
        this.drag = null;
      }
    },
    pre_draw: function pre_draw() {
      // Delete all collision functions before
      // the draw() call and let primitives set
      // them again
      this.collisions = [];
    },
    remove_tool: function remove_tool() {
      if (this.selected) this.$emit('remove-tool');
    },
    start_drag: function start_drag() {
      this.$emit('scroll-lock', true);
      var cursor = this.$props.cursor;
      this.drag = {
        t: cursor.t,
        y$: cursor.y$
      };
      this.pins.forEach(function (x) {
        return x.rec_position();
      });
    },
    drag_update: function drag_update() {
      var dt = this.$props.cursor.t - this.drag.t;
      var dy = this.$props.cursor.y$ - this.drag.y$;
      this.pins.forEach(function (x) {
        return x.update_from([x.t1 + dt, x.y$1 + dy], true);
      });
    }
  },
  computed: {
    // Settings starting with $ are reserved
    selected: function selected() {
      return this.$props.settings.$selected;
    },
    state: function state() {
      return this.$props.settings.$state;
    }
  }
});
;// ./src/stuff/icons.json
const icons_namespaceObject = /*#__PURE__*/JSON.parse('{"extended.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAANElEQVR4nGNggABGEMEEIlhABAeI+AASF0AlHmAqA4kzKAAx8wGQuAMKwd6AoYzBAWonAwAcLwTgNfJ3RQAAAABJRU5ErkJggg==","ray.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAAMklEQVR4nGNgQAJMIIIFRHCACAEQoQAiHICYvQEkjkrwYypjAIkzwk2zAREuqIQFzD4AE3kE4BEmGggAAAAASUVORK5CYII=","segment.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAgMAAAC5h23wAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAlQTFRFAAAATU1NJCQkCxcHIQAAAAN0Uk5TAP8SmutI5AAAACxJREFUeJxjYMACGAMgNAsLdpoVKi8AVe8A1QblQlWRKt0AoULw2w1zGxoAABdiAviQhF/mAAAAAElFTkSuQmCC","add.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAH5QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAACgoKBgYGGxsbKioqPz8/Pj4+BQUFCQkJAQEBZGRkh4eHAgICEBAQNjY2g4ODgYGBAAAAAwMDeXl5d3d3GBgYERERgICAgICANDQ0PDw8Y2NjCAgIhYWFGhoaJycnOjo6YWFhgICAdXV14Y16sQAAACp0Uk5TAAILDxIKESEnJiYoKCgTKSkpKCAnKSkFKCkpJiDl/ycpKSA2JyYpKSkpOkQ+xgAAARdJREFUeJzllNt2gyAQRTWiRsHLoDU0GpPYmMv//2BMS+sgl6Z9bM8bi73gnJkBz/sn8lcBIUHofwtG8TpJKUuTLI6cYF7QEqRKynP71VX9AkhNXVlsbMQrLLQVGyPZLsGHWgPrCxMJwHUPlXa79NBp2et5d9f3u3m1XxatQNn7SagOXCUjCjYUDuqxcWlHj4MSfw12FDJchFViRN8+1qcQoUH6lR1L1mEMEErofB6WzEUwylzomfzOQGiOJdXiWH7mQoUyMa4WXJQWOBvLFvPCGxt6FSr5kyH0qi0YddNG2/pgCsOjff4ZTizXPNwKIzl56OoGg9d9Z/+5cs6On+CFCfevFQ3ZaTycx1YMbvDdRvjkp/lHdAcPXzokxcwfDwAAAABJRU5ErkJggg==","cursor.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAgMAAAC5h23wAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAxQTFRFAAAATU1NTU1NTU1NwlMHHwAAAAR0Uk5TAOvhxbpPrUkAAAAkSURBVHicY2BgYHBggAByabxg1WoGBq2pRCk9AKUbcND43AEAufYHlSuusE4AAAAASUVORK5CYII=","display_off.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAU1QTFRFAAAAh4eHh4eHAAAAAAAAAAAAAwMDAAAAAAAAhoaGGBgYgYGBAAAAPz8/AgICg4ODCQkJhISEh4eHh4eHPj4+NjY2gYGBg4ODgYGBgYGBgoKCAQEBJycngoKChYWFEBAQg4ODCAgIKioqZGRkCgoKBQUFERERd3d3gYGBGxsbNDQ0hISEgYGBPDw8gYGBgYGBh4eHh4eHhYWFh4eHgoKChYWFgYGBgYGBg4ODhoaGg4ODYWFhgoKCBgYGdXV1goKCg4ODgYGBgICAgYGBAAAAg4ODhYWFhISEh4eHgoKChYWFOjo6goKCGhoah4eHh4eHh4eHgoKCh4eHeXl5hoaGgoKChISEgYGBgYGBgoKCY2NjgYGBgoKCh4eHgoKCgYGBhoaGg4ODhoaGhYWFh4eHgYGBhoaGhoaGhoaGg4ODgoKChISEgoKChYWFh4eHfKktUwAAAG90Uk5TACn/AhEFKA8SLCbxCigoVBNKUTYoJ/lh3PyAKSaTNiBtICYpISggKSkmJ0LEKef3lGxA8rn//+pcMSkpnCcptHPJKe0LUjnx5LzKKaMnX73hl64pLnhkzNSgKeLv17LQ+liIzaLe7PfTw5tFpz3K1fXR/gAAAgBJREFUeJzllNdXwjAUxknB0lIoCKVsGTIFQRAZ7r333nuv///R3LZ4mlDQZ/0ekp7b37n5bnITk+mfyDxv5Tir3fwjaElO5BIOKZFLJS1dQVfI0Y809TtEV+elo95RpFPWG+1go4fdQ5QybI8haaNBkM2ANbM09bnrwaPY7iFKrz7EMBdu7CHdVruXIt0M1hb+GKA3LTRKkp5lTA6Dg6xIkhaHhvQ1IlW/UCouQdJNJTRIpk1qO7+wUpcfpl537oBc7VNip3Gi/AmVPBAC1UrL6HXtSGVT+k2Yz0Focad07OMRf3P5BEbd63PFQx7HN+w61JoAm+uBlV48O/0jkLSMmtPCmQ8HwlYdykFV4/LJPp7e3hVyFdapHNehLk6PSjhSkBvwu/cFyJGIYvOyhoc1jjYQFGbygD4CWjoAMla/og3YoSw+KPhjPNoFcim4iFD+pFYA8zZ9WeYU5OBjZ3ORWyCfG03E+47kKpCIJTpGO4KP8XMgtw990xG/PBNTgmPEEXwf7P42oOdFIRAoBCtqTKL6Rcwq4Xsgh5xYC/mmSs6yJKk1YbnVeTq1NaEpmlHbmVn2EORkW2trF2ZzmHGTSUMGl1a9hp4ySRpdQ8yKGURpMmRIYg9pb1YPzg6kO79cLlE6bYFjEtv91bLEUxvhwbWwjY13BxUb9l8+mn9EX8x3Nki8ff5wAAAAAElFTkSuQmCC","display_on.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAR1QTFRFAAAAh4eHgYGBAAAAAAAAgYGBAAAAAwMDAAAAAAAAgYGBg4ODGBgYgYGBhISEAAAAPz8/AgIChoaGCQkJhYWFPj4+NjY2goKCgYGBAQEBJycngYGBgoKCEBAQCAgIhISEKioqZGRkCgoKBQUFERERd3d3gYGBg4ODgYGBGxsbNDQ0hISEgoKCgoKChYWFPDw8gYGBgYGBhoaGgoKCg4ODgoKCgYGBgoKCgoKCgoKCg4ODgoKChoaGgoKCgYGBhoaGg4ODYWFhBgYGdXV1gYGBg4ODgoKCgICAg4ODg4ODhISEAAAAg4ODOjo6gYGBGhoaeXl5goKCgYGBgoKChYWFgoKChISEgoKCY2NjgYGBg4ODgYGBgYGBg4ODgYGBo8n54AAAAF90Uk5TACn/AhH3BSgPEuhUJvFACigoLBM2KCeA6ykm+pMgIEkmKSEoICn9XCkmJ0u6nDop4sUypGuEzLZ6vmCYLZ/dLykpJynUYa8pcllCC1Ip2ycpisl1PadFsintbsPQZdi/bTW7AAAB4UlEQVR4nOWUZ1fCMBSGSSGWFiq0UDbIkr2XbBwMxS0b1P//M0xK9XSiftX7oel585zkvfcmMRj+SRhvzRRlthm/BU3Ry3TYzofTsajpIOjw2iNAjIiddehvHXSdA0mkXEEdG0fkE1DEKXmkSVqVIA6rBmsktUgAWLWHoGp30UNclbtLmwQgoyya91wPTbFy0mQXJ5zJQO6BgXRjfH0iSkX5stHIXr5r0bB/lu8syjR8rzsFbR2SpX+5J2eMP3csLtYsEY2K8BeTFuE2jaVCBw7bHOBuxq16AXmpbui3LtIfbRLUHMY2q4lcFo2WB4KA1SUAlWumNEKCzyxBKZxVHvYGaFguCBx1vM/x0IPzoqQoj5SdP4mns2cCGhBsrgj0uaeUBtzMyxQN8w4mYROTW8+r0oANp8W5mf6WQw5aCYJ2o7ymPaKMi2uVpmWM4TW6tdImgGo1bT4nK6DbbsCc0AZSdmLEFszzHrh6riVvRrNA3/9SE8QLWQu+Gjto9+gE9NBMwr9zi83gFeeFTe11zpm1CHE3HeyVCSknf3MIDcFTbfJKdbR1L4xX49L+/BoillV5uPJqkshD3JWSgpNMXP/lcrD8+hO84MnDr5YpFHv0Fe99VjJ0GBRs2H74aP6R+ACr+TFvZNAQ1wAAAABJRU5ErkJggg==","down.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAKVQTFRFAAAAg4ODgICAAAAAAAAAAAAACAgIAAAAAAAAAAAAAAAAOTk5hYWFEBAQfHx8ODg4dnZ2NDQ0XV1dGxsbKCgogICAFBQUIiIiZGRkgICAgICAFRUVAAAAgICAgICAgICAf39/Li4ugICAcHBwgoKCgICAgoKCgICAg4ODgYGBPj4+goKCgICAhISEgYGBgICAgoKCgICAgYGBgYGBf39/gICAgICAIdPQHAAAADd0Uk5TACn/KAIRIBMFDwooKyApKSknKSYmzCcmKfL7JRCUi2L3J7IpcLUrr0VbKXntNEnkMbxrUcG56CMpi50AAAFZSURBVHic5ZRpf4MgDIeFKFatWm/tfW091u7evv9Hm1Acoujm2y0vFPH5Jf+EEE37J6bblmlatv4jaBCI4rMfR0CMXtAEJ0fccgfM7tAkQHXzArdDxggmqGETGCnJWROkNlOwOqhIhKCtgbSicw1uK/dATSK0aRatIzytA8ik4XSiyJnLSm+VPxULgeyLI3uHRJH+qcB4WZGrKb4c20WwI7b3iUt74OS6XD+xZWrXUCtme0uKTvfcJ65CZFa9VOebqwXmft+oT8yF+/VymT4XeGB+Xx8L+j4gBcoFIDT+oMz6Qp93Y74pCeBpUXaLuW0rUk6r1iv3nP322ewYkgv2nZIvgpSPQDrY5wTjRJDNg9XAE/+uSXIVX812GdKEmtvR2rtWaw+5MAOuofJy79SXu9TgBl4d9DZdI0NjgyiswNCB/qk1J5Bmvp+lQOa9IJNhW4bxm6H5R+wLQYMSQXZNzbcAAAAASUVORK5CYII=","price_range.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAAIUlEQVR4nGNggAPm/w9gTA4QIQMitECEJ1yMEgLNDiAAADfgBMRu78GgAAAAAElFTkSuQmCC","price_time.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAAOklEQVR4nGNggAPm/w9gTA4QIQPEClpMQMITRHCACScQoQQihBgY9P//grKgYk5wdTACYhQHFjuAAABZFAlc4e1fcQAAAABJRU5ErkJggg==","remove.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAK5QTFRFAAAAh4eHgICAAAAAAAAAh4eHAAAAAwMDAAAAAAAAgICAGBgYAAAAPz8/AgICgICACQkJhoaGhoaGgICAPj4+NjY2gYGBg4ODgYGBAQEBJycngoKCEBAQgICAgICACAgIKioqZGRkCgoKBQUFERERd3d3gYGBGxsbNDQ0gICAPDw8YWFhBgYGdXV1gICAg4ODgICAAAAAOjo6GhoaeXl5gICAhYWFY2NjhYWFgICA9O0oCgAAADp0Uk5TACn/AhErBSgPEvEmCigowxMuMcgoJ7hWrCkmdCD6vSAmKSEoICkpJie6KSknKSkp0wspJynCMik11rrLte8AAAFwSURBVHic5ZTXkoIwFIZNAAPSpKkoRQV7Wcva3v/FFiRmEwise7t7bs7MP98k/ylJq/VPQjjKiiJrwo+gON0uxro7XiRTsRHs+voE4JjoRrf+6sD7AFTMvaDGRht9glLMUJtLqmUwD5XDCohHAmBUPQSV27GHtFK7xycBWJab5uPaR+Hlmue7GfZxHwyWFHVMQghXFgD2A8IOZtfssdNJIXcyFEaSfchzp9BuMVP+Fhvr5Qh0nGfqYTGhm3BcYFUaQBKOhMWzRqHyGFRY03ppQ5lCFZ30RloVZGQTaa3QqEt0OyrQnkSkk8I1YJkvAwPCMgY0UpbzXRZhVbosIWGbZTLNQszGMCM42FJEjWDDjIAMtp+xj6x2K+/DqNDc0r4Yc8yGl3uer2aIyT1iyd8sYSuY8cldZbVrH4zPebTvP8OMNSoedj6XzDyk3pwG98u0/ufqGu7tBW5c1PxriXFyHq5PQxXFzeDThvbmp/lH4gt6WxfZ03H8DwAAAABJRU5ErkJggg==","settings.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAW5QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAACgoKBgYGGxsbKioqQEBAPj4+BQUFCAgIAQEBPz8/ZWVlh4eHZGRkAgICCQkJDw8PNjY2g4ODgoKCNTU1EBAQAAAAAwMDeXl5d3d3AAAAGBgYAAAAERERioqKgoKCgoKCgoKCgYGBgoKChISEhoaGNDQ0g4ODgICAgICAgICAgYGBgYGBhYWFgICAgICAPT09AAAAgYGBgICAgICAgICAgICAY2NjCAgIgICAgICAhYWFhYWFgYGBHBwcgICAhYWFGhoagYGBgYGBg4ODhoaGJycnAAAAhISEgICAg4ODPDw8AAAAgoKCgICAhISEOjo6h4eHgoKCgYGBgICAf39/gYGBgoKCgICAGBgYgYGBg4ODg4ODgICACwsLgYGBgICAgYGBgYGBgYGBgICAgYGBYWFhf39/g4ODPj4+gYGBg4ODgICAhYWFgoKCgYGBgICAgYGBgoKCdXV1T0kC9QAAAHp0Uk5TAAILDxMKESEnJiYpKSgTKSgpKSkoEyAnKSknIAYoKSkFJQEgKl94jYVvVC4nU9f/+K8pOu71KBCi3NPq/ikg0e01Nokm1UUnsZVqQSYOT9lrKRJz5lIpK12jyu+sesgnhGVLxCG55a6Um+GaKfJCKKRgKUt8ocergymDQ9knAAABsElEQVR4nOWUV1vCMBSGg1AQpBZrcVdE3KJxo4LgnuCoe4F7orjHv7doTk3bgF7rd5OnX94nZ+SkCP0TWQqsNpuVs/wI2h2FTleR2+XkHfa8YLHgKRGJSj2SN3fosvIKkVJlVXWONGrkWtEgn1zHJP1GMCs/g7XILFIUpXoTWmaKTnIImGovh72Gxqbmlta2dvgOGpsmQO0dnfhTXd3E6JH0pN1DNnr7MFE/HDsQ0qEO6Pxg9sCh4XDkGx2J6sovBD+G8eiYuo5PxLTKeLoJBZNgT2EcnjY0YYajUKsL7Fk1gcjU3PwChcYTFGorAnsRqlpa1tAVhUbdmr+6RtjIOlgbCjMBUdzc2t7ZzbJ7zAQ4p6GSfRVNwkeKLsvCg31w2JBdjlT0GDxZNzEnpcQ+xWfnFxeXVyp6Tay07gq+L/YUOoBvbomV0V8skiq//DutWfeEfJD1JPLCED4+Pb8kX986tApNQ4iqfSJT76bRzvlgBPODQXW/foYqK5lyeBeYJEL1gaoeGnwIBhjRoQ9SZgTAdEbO/9cKRfmZ+MpGPCVHQ3nBzzS4hKIkuNyh/5g+ALiAXSSas9hwAAAAAElFTkSuQmCC","time_range.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAAJElEQVR4nGNgwAsUGJhQCScQoQQihBgY9P//grKgYk4YOvACACOpBKG6Svj+AAAAAElFTkSuQmCC","trash.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAATU1NkJ+rOQAAAAJ0Uk5TAP9bkSK1AAAALUlEQVR4nGNgAIN6ENHQACX4//9gYBBgYIESYC4LkA0lPEkmGFAI5v8PILYCAHygDJxlK0RUAAAAAElFTkSuQmCC","up.png":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAMAAADyHTlpAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAMZQTFRFAAAAh4eHgICAAAAAAAAAAAAAAwMDAAAAAAAAGBgYAAAAPz8/AgICCQkJgICAh4eHPj4+NjY2AQEBJycnEBAQgICAgICACAgIKioqZGRkCgoKBQUFgYGBERERd3d3gYGBGxsbNDQ0gICAgYGBPDw8gYGBh4eHgICAYWFhBgYGgYGBdXV1goKCg4ODhYWFgICAgoKCAAAAhISEOjo6gICAGhoagYGBeXl5hoaGgICAY2Njg4ODgoKCgoKCgYGBgoKCg4ODgoKC64uw1gAAAEJ0Uk5TACn/AhEFKA8SJgooKBP7KignKSYg9c0gJikhKLQgKSkmJ7ywKY8s5SknlClxKTMpXwtFKe0neiku8ClKWmSbbFFjM5GHSgAAAW5JREFUeJzllGd/gjAQxk3AMFWWOHDvVa2rVbu//5cqhJWQQO3b9nkVjv/v7rnLKJX+iYS9JMuSKvwIiu3loKkZzYHXFgvBiqW1QKSWplfySzvmAyDUN50cG2X0DDLqoTKXVLJgIIXDCohHAqCzHhymeuShy/Ru8kkAhtmhWUTvW9fdEnPQaVLU0n8XF0L3kn5P6LTtZPKgNoK+RrUkcGtQ7S9TsgOxxinrkUPYD+LwLCIh7CTsWSVQqRmTuPqpitlZFLQlApXjrsYBc335wOw47ksmUSMMrgKi/gnAE/awCqNHmTUwDf5X34LlBuedsgbUsK15kPMxTIXzzvFSIdsSPBw7nGD1K+7bL3F9xStEnZhoCw71TbpL71GBBbUF1MZmZWTOi97PI3eIJn9zCEtOj0+umaOde2EszqW9/xr6rM54WFtc0vfQNak57Ibd/Jerohu3GFwYqPjVEhve2Z4cbQU1ikFsQ73z0fwj+ga3VBezGuggFQAAAABJRU5ErkJggg=="}');
;// ./node_modules/@babel/runtime/helpers/esm/defineProperty.js

function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}

;// ./src/components/primitives/pin.js



// Semi-automatic pin object. For stretching things.


var Pin = /*#__PURE__*/function () {
  // (Comp reference, a name in overlay settings,
  // pin parameters)
  function Pin(comp, name, params) {
    var _this = this;
    if (params === void 0) {
      params = {};
    }
    classCallCheck_classCallCheck(this, Pin);
    this.RADIUS = comp.$props.config.PIN_RADIUS || 5.5;
    this.RADIUS_SQ = Math.pow(this.RADIUS + 7, 2);
    if (utils.is_mobile) {
      this.RADIUS += 2;
      this.RADIUS_SQ *= 2.5;
    }
    this.COLOR_BACK = comp.$props.colors.back;
    this.COLOR_BR = comp.$props.colors.text;
    this.comp = comp;
    this.layout = comp.layout;
    this.mouse = comp.mouse;
    this.name = name;
    this.state = params.state || 'settled';
    this.hidden = params.hidden || false;
    this.mouse.on('mousemove', function (e) {
      return _this.mousemove(e);
    });
    this.mouse.on('mousedown', function (e) {
      return _this.mousedown(e);
    });
    this.mouse.on('mouseup', function (e) {
      return _this.mouseup(e);
    });
    if (comp.state === 'finished') {
      this.state = 'settled';
      this.update_from(comp.$props.settings[name]);
    } else {
      this.update();
    }
    if (this.state !== 'settled') {
      this.comp.$emit('scroll-lock', true);
    }
  }
  return createClass_createClass(Pin, [{
    key: "re_init",
    value: function re_init() {
      this.update_from(this.comp.$props.settings[this.name]);
    }
  }, {
    key: "draw",
    value: function draw(ctx) {
      if (this.hidden) return;
      switch (this.state) {
        case 'tracking':
          break;
        case 'dragging':
          if (!this.moved) this.draw_circle(ctx);
          break;
        case 'settled':
          this.draw_circle(ctx);
          break;
      }
    }
  }, {
    key: "draw_circle",
    value: function draw_circle(ctx) {
      this.layout = this.comp.layout;
      if (this.comp.selected) {
        var r = this.RADIUS,
          lw = 1.5;
      } else {
        var r = this.RADIUS * 0.95,
          lw = 1;
      }
      ctx.lineWidth = lw;
      ctx.strokeStyle = this.COLOR_BR;
      ctx.fillStyle = this.COLOR_BACK;
      ctx.beginPath();
      ctx.arc(this.x = this.layout.t2screen(this.t), this.y = this.layout.$2screen(this.y$), r + 0.5, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.stroke();
    }
  }, {
    key: "update",
    value: function update() {
      this.y$ = this.comp.$props.cursor.y$;
      this.y = this.comp.$props.cursor.y;
      this.t = this.comp.$props.cursor.t;
      this.x = this.comp.$props.cursor.x;

      // Save pin as time in IB mode
      //if (this.layout.ti_map.ib) {
      //    this.t = this.layout.ti_map.i2t(this.t )
      //}

      // Reset the settings attahed to the pin (position)
      this.comp.$emit('change-settings', _defineProperty({}, this.name, [this.t, this.y$]));
    }
  }, {
    key: "update_from",
    value: function update_from(data, emit) {
      if (emit === void 0) {
        emit = false;
      }
      if (!data) return;
      this.layout = this.comp.layout;
      this.y$ = data[1];
      this.y = this.layout.$2screen(this.y$);
      this.t = data[0];
      this.x = this.layout.t2screen(this.t);

      // TODO: Save pin as time in IB mode
      //if (this.layout.ti_map.ib) {
      //    this.t = this.layout.ti_map.i2t(this.t )
      //}

      if (emit) this.comp.$emit('change-settings', _defineProperty({}, this.name, [this.t, this.y$]));
    }
  }, {
    key: "rec_position",
    value: function rec_position() {
      this.t1 = this.t;
      this.y$1 = this.y$;
    }
  }, {
    key: "mousemove",
    value: function mousemove(event) {
      switch (this.state) {
        case 'tracking':
        case 'dragging':
          this.moved = true;
          this.update();
          break;
      }
    }
  }, {
    key: "mousedown",
    value: function mousedown(event, force) {
      if (force === void 0) {
        force = false;
      }
      if (utils.default_prevented(event) && !force) return;
      switch (this.state) {
        case 'tracking':
          this.state = 'settled';
          if (this.on_settled) this.on_settled();
          this.comp.$emit('scroll-lock', false);
          break;
        case 'settled':
          if (this.hidden) return;
          if (this.hover()) {
            this.state = 'dragging';
            this.moved = false;
            this.comp.$emit('scroll-lock', true);
            this.comp.$emit('object-selected');
          }
          break;
      }
      if (this.hover()) {
        event.preventDefault();
      }
    }
  }, {
    key: "mouseup",
    value: function mouseup(event) {
      switch (this.state) {
        case 'dragging':
          this.state = 'settled';
          if (this.on_settled) this.on_settled();
          this.comp.$emit('scroll-lock', false);
          break;
      }
    }
  }, {
    key: "on",
    value: function on(name, handler) {
      switch (name) {
        case 'settled':
          this.on_settled = handler;
          break;
      }
    }
  }, {
    key: "hover",
    value: function hover() {
      var x = this.x;
      var y = this.y;
      return (x - this.mouse.x) * (x - this.mouse.x) + (y - this.mouse.y) * (y - this.mouse.y) < this.RADIUS_SQ;
    }
  }]);
}();

;// ./src/components/primitives/seg.js


// Draws a segment, adds corresponding collision f-n



var Seg = /*#__PURE__*/function () {
  // Overlay ref, canvas ctx
  function Seg(overlay, ctx) {
    classCallCheck_classCallCheck(this, Seg);
    this.ctx = ctx;
    this.comp = overlay;
    this.T = overlay.$props.config.TOOL_COLL;
    if (utils.is_mobile) this.T *= 2;
  }

  // p1[t, $], p2[t, $] (time-price coordinates)
  return createClass_createClass(Seg, [{
    key: "draw",
    value: function draw(p1, p2) {
      var layout = this.comp.$props.layout;
      var x1 = layout.t2screen(p1[0]);
      var y1 = layout.$2screen(p1[1]);
      var x2 = layout.t2screen(p2[0]);
      var y2 = layout.$2screen(p2[1]);
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.comp.collisions.push(this.make([x1, y1], [x2, y2]));
    }

    // Collision function. x, y - mouse coord.
  }, {
    key: "make",
    value: function make(p1, p2) {
      var _this = this;
      return function (x, y) {
        return math.point2seg([x, y], p1, p2) < _this.T;
      };
    }
  }]);
}();

;// ./src/components/primitives/line.js


// Draws a line, adds corresponding collision f-n



var Line = /*#__PURE__*/function () {
  // Overlay ref, canvas ctx
  function Line(overlay, ctx) {
    classCallCheck_classCallCheck(this, Line);
    this.ctx = ctx;
    this.comp = overlay;
    this.T = overlay.$props.config.TOOL_COLL;
    if (utils.is_mobile) this.T *= 2;
  }

  // p1[t, $], p2[t, $] (time-price coordinates)
  return createClass_createClass(Line, [{
    key: "draw",
    value: function draw(p1, p2) {
      var layout = this.comp.$props.layout;
      var yellow = '#E5B41F';
      var x1 = layout.t2screen(p1[0]);
      var y1 = layout.$2screen(p1[1]);
      var x2 = layout.t2screen(p2[0]);
      var y2 = layout.$2screen(p2[1]);
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      var w = layout.width;
      var h = layout.height;
      // TODO: transform k (angle) to screen ratio
      // (this requires a new a2screen function)
      var k = (y2 - y1) / (x2 - x1);
      var s = Math.sign(x2 - x1 || y2 - y1);
      var dx = w * s * 2;
      var dy = w * k * s * 2;
      if (dy === Infinity) {
        dx = 0, dy = h * s;
      }
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(x2 + dx, y2 + dy);
      if (!this.ray) {
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x1 - dx, y1 - dy);
      }
      this.comp.collisions.push(this.make([x1, y1], [x2, y2]));
    }

    // Collision function. x, y - mouse coord.
  }, {
    key: "make",
    value: function make(p1, p2) {
      var _this = this;
      var f = this.ray ? math.point2ray.bind(math) : math.point2line.bind(math);
      return function (x, y) {
        return f([x, y], p1, p2) < _this.T;
      };
    }
  }]);
}();

;// ./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
function _assertThisInitialized(e) {
  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}

;// ./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js


function _possibleConstructorReturn(t, e) {
  if (e && ("object" == typeof_typeof(e) || "function" == typeof e)) return e;
  if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
  return _assertThisInitialized(t);
}

;// ./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function _getPrototypeOf(t) {
  return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, _getPrototypeOf(t);
}

;// ./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js
function _setPrototypeOf(t, e) {
  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
    return t.__proto__ = e, t;
  }, _setPrototypeOf(t, e);
}

;// ./node_modules/@babel/runtime/helpers/esm/inherits.js

function _inherits(t, e) {
  if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
  t.prototype = Object.create(e && e.prototype, {
    constructor: {
      value: t,
      writable: !0,
      configurable: !0
    }
  }), Object.defineProperty(t, "prototype", {
    writable: !1
  }), e && _setPrototypeOf(t, e);
}

;// ./src/components/primitives/ray.js





function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
// Draws a ray, adds corresponding collision f-n


var Ray = /*#__PURE__*/function (_Line) {
  function Ray(overlay, ctx) {
    var _this;
    classCallCheck_classCallCheck(this, Ray);
    _this = _callSuper(this, Ray, [overlay, ctx]);
    _this.ray = true;
    return _this;
  }
  _inherits(Ray, _Line);
  return createClass_createClass(Ray);
}(Line);

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/LineTool.vue?vue&type=script&lang=js
// Line drawing tool
// TODO: make an angle-snap when "Shift" is pressed








/* harmony default export */ const LineToolvue_type_script_lang_js = ({
  name: 'LineTool',
  mixins: [overlay, tool],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '1.1.0'
      };
    },
    tool: function tool() {
      return {
        // Descriptor for the tool
        group: 'Lines',
        icon: icons_namespaceObject["segment.png"],
        type: 'Segment',
        hint: 'This hint will be shown on hover',
        data: [],
        // Default data
        settings: {},
        // Default settings
        // Modifications
        mods: {
          'Extended': {
            // Rewrites the default setting fields
            settings: {
              extended: true
            },
            icon: icons_namespaceObject["extended.png"]
          },
          'Ray': {
            // Rewrites the default setting fields
            settings: {
              ray: true
            },
            icon: icons_namespaceObject["ray.png"]
          }
        }
      };
    },
    // Called after overlay mounted
    init: function init() {
      var _this = this;
      // First pin is settled at the mouse position
      this.pins.push(new Pin(this, 'p1'));
      // Second one is following mouse until it clicks
      this.pins.push(new Pin(this, 'p2', {
        state: 'tracking'
      }));
      this.pins[1].on('settled', function () {
        // Call when current tool drawing is finished
        // (Optionally) reset the mode back to 'Cursor'
        _this.set_state('finished');
        _this.$emit('drawing-mode-off');
      });
    },
    draw: function draw(ctx) {
      if (!this.p1 || !this.p2) return;
      ctx.lineWidth = this.line_width;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      if (this.sett.ray) {
        new Ray(this, ctx).draw(this.p1, this.p2);
      } else if (this.sett.extended) {
        new Line(this, ctx).draw(this.p1, this.p2);
      } else {
        new Seg(this, ctx).draw(this.p1, this.p2);
      }
      ctx.stroke();
      this.render_pins(ctx);
    },
    use_for: function use_for() {
      return ['LineTool'];
    },
    data_colors: function data_colors() {
      return [this.color];
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    p1: function p1() {
      return this.$props.settings.p1;
    },
    p2: function p2() {
      return this.$props.settings.p2;
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 0.9;
    },
    color: function color() {
      return this.sett.color || '#42b28a';
    }
  },
  data: function data() {
    return {};
  }
});
;// ./src/components/overlays/LineTool.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_LineToolvue_type_script_lang_js = (LineToolvue_type_script_lang_js); 
;// ./src/components/overlays/LineTool.vue
var LineTool_render, LineTool_staticRenderFns
;



/* normalize component */
;
var LineTool_component = normalizeComponent(
  overlays_LineToolvue_type_script_lang_js,
  LineTool_render,
  LineTool_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const LineTool = (LineTool_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/RangeTool.vue?vue&type=script&lang=js

// Price/Time measurment tool






/* harmony default export */ const RangeToolvue_type_script_lang_js = ({
  name: 'RangeTool',
  mixins: [overlay, tool],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'C451',
        version: '2.0.1'
      };
    },
    tool: function tool() {
      return {
        // Descriptor for the tool
        group: 'Measurements',
        icon: icons_namespaceObject["price_range.png"],
        type: 'Price',
        hint: 'Price Range',
        data: [],
        // Default data
        settings: {},
        // Default settings
        mods: {
          'Time': {
            // Rewrites the default setting fields
            icon: icons_namespaceObject["time_range.png"],
            settings: {
              price: false,
              time: true
            }
          },
          'PriceTime': {
            // Rewrites the default setting fields
            icon: icons_namespaceObject["price_time.png"],
            settings: {
              price: true,
              time: true
            }
          },
          'ShiftMode': {
            // Rewrites the default setting fields
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
    // Called after overlay mounted
    init: function init() {
      var _this = this;
      // First pin is settled at the mouse position
      this.pins.push(new Pin(this, 'p1', {
        hidden: this.shift
      }));
      // Second one is following mouse until it clicks
      this.pins.push(new Pin(this, 'p2', {
        state: 'tracking',
        hidden: this.shift
      }));
      this.pins[1].on('settled', function () {
        // Call when current tool drawing is finished
        // (Optionally) reset the mode back to 'Cursor'
        _this.set_state('finished');
        _this.$emit('drawing-mode-off');
        // Deselect the tool in shiftMode
        if (_this.shift) _this._$emit('custom-event', {
          event: 'object-selected',
          args: []
        });
      });
    },
    draw: function draw(ctx) {
      if (!this.p1 || !this.p2) return;
      var dir = Math.sign(this.p2[1] - this.p1[1]);
      var layout = this.$props.layout;
      var xm = layout.t2screen((this.p1[0] + this.p2[0]) * 0.5);
      ctx.lineWidth = this.line_width;
      ctx.strokeStyle = this.color;

      // Background
      ctx.fillStyle = this.back_color;
      var x1 = layout.t2screen(this.p1[0]);
      var y1 = layout.$2screen(this.p1[1]);
      var x2 = layout.t2screen(this.p2[0]);
      var y2 = layout.$2screen(this.p2[1]);
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      if (this.price) this.vertical(ctx, x1, y1, x2, y2, xm);
      if (this.time) this.horizontal(ctx, x1, y1, x2, y2, xm);
      this.draw_value(ctx, dir, xm, y2);
      this.render_pins(ctx);
    },
    vertical: function vertical(ctx, x1, y1, x2, y2, xm) {
      var layout = this.$props.layout;
      var dir = Math.sign(this.p2[1] - this.p1[1]);
      ctx.beginPath();
      if (!this.shift) {
        // Top
        new Seg(this, ctx).draw([this.p1[0], this.p2[1]], [this.p2[0], this.p2[1]]);
        // Bottom
        new Seg(this, ctx).draw([this.p1[0], this.p1[1]], [this.p2[0], this.p1[1]]);
      }

      // Vertical Arrow
      ctx.moveTo(xm - 4, y2 + 5 * dir);
      ctx.lineTo(xm, y2);
      ctx.lineTo(xm + 4, y2 + 5 * dir);
      ctx.stroke();

      // Vertical Line
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      new Seg(this, ctx).draw([(this.p1[0] + this.p2[0]) * 0.5, this.p2[1]], [(this.p1[0] + this.p2[0]) * 0.5, this.p1[1]]);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    horizontal: function horizontal(ctx, x1, y1, x2, y2, xm) {
      var layout = this.$props.layout;
      var xdir = Math.sign(this.p2[0] - this.p1[0]);
      var ym = (layout.$2screen(this.p1[1]) + layout.$2screen(this.p2[1])) / 2;
      ctx.beginPath();
      if (!this.shift) {
        // Left
        new Seg(this, ctx).draw([this.p1[0], this.p1[1]], [this.p1[0], this.p2[1]]);
        // Right
        new Seg(this, ctx).draw([this.p2[0], this.p1[1]], [this.p2[0], this.p2[1]]);
      }

      // Horizontal Arrow
      ctx.moveTo(x2 - 5 * xdir, ym - 4);
      ctx.lineTo(x2, ym);
      ctx.lineTo(x2 - 5 * xdir, ym + 4);
      ctx.stroke();

      // Horizontal Line
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(x1, ym);
      ctx.lineTo(x2, ym);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    // WTF? I know dude, a lot of shitty code here
    draw_value: function draw_value(ctx, dir, xm, y) {
      var _this2 = this;
      ctx.font = this.new_font;
      // Price delta (anf percent)
      var d$ = (this.p2[1] - this.p1[1]).toFixed(this.prec);
      var p = (100 * (this.p2[1] / this.p1[1] - 1)).toFixed(this.prec);
      // Map interval to the actual tf (in ms)
      var f = function f(t) {
        return _this2.layout.ti_map.smth2t(t);
      };
      var dt = f(this.p2[0]) - f(this.p1[0]);
      var tf = this.layout.ti_map.tf;
      // Bars count (through the candle index)
      var f2 = function f2(t) {
        var c = _this2.layout.c_magnet(t);
        var cn = _this2.layout.candles || _this2.layout.master_grid.candles;
        return cn.indexOf(c);
      };
      // Bars count (and handling the negative values)
      var b = f2(this.p2[0]) - f2(this.p1[0]);
      // Format time delta
      // Format time delta
      var dtstr = this.t2str(dt);
      var text = [];
      if (this.price) text.push("".concat(d$, "  (").concat(p, "%)"));
      if (this.time) text.push("".concat(b, " bars, ").concat(dtstr));
      text = text.join('\n');
      // "Multiple" fillText
      var lines = text.split('\n');
      var w = Math.max.apply(Math, _toConsumableArray(lines.map(function (x) {
        return ctx.measureText(x).width + 20;
      })).concat([100]));
      var n = lines.length;
      var h = 20 * n;
      ctx.fillStyle = this.value_back;
      ctx.fillRect(xm - w * 0.5, y - (10 + h) * dir, w, h * dir);
      ctx.fillStyle = this.value_color;
      ctx.textAlign = 'center';
      lines.forEach(function (l, i) {
        ctx.fillText(l, xm, y + (dir > 0 ? 20 * i - 20 * n + 5 : 20 * i + 25));
      });
    },
    // Formats time from ms to `1D 12h` for example
    t2str: function t2str(t) {
      var sign = Math.sign(t);
      var abs = Math.abs(t);
      var tfs = [[1000, 's', 60], [60000, 'm', 60], [3600000, 'h', 24], [86400000, 'D', 7], [604800000, 'W', 4], [2592000000, 'M', 12], [31536000000, 'Y', Infinity], [Infinity, 'Eternity', Infinity]];
      for (var i = 0; i < tfs.length; i++) {
        tfs[i][0] = Math.floor(abs / tfs[i][0]);
        if (tfs[i][0] === 0) {
          var p1 = tfs[i - 1];
          var p2 = tfs[i - 2];
          var txt = sign < 0 ? '-' : '';
          if (p1) {
            txt += p1.slice(0, 2).join('');
          }
          var n2 = p2 ? p2[0] - p1[0] * p2[2] : 0;
          if (p2 && n2) {
            txt += ' ';
            txt += "".concat(n2).concat(p2[1]);
          }
          return txt;
        }
      }
    },
    use_for: function use_for() {
      return ['RangeTool'];
    },
    data_colors: function data_colors() {
      return [this.color];
    }
  },
  // Define internal setting & constants here
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    p1: function p1() {
      return this.$props.settings.p1;
    },
    p2: function p2() {
      return this.$props.settings.p2;
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 0.9;
    },
    color: function color() {
      return this.sett.color || this.$props.colors.cross;
    },
    back_color: function back_color() {
      return this.sett.backColor || '#9b9ba316';
    },
    value_back: function value_back() {
      return this.sett.valueBack || '#9b9ba316';
    },
    value_color: function value_color() {
      return this.sett.valueColor || this.$props.colors.text;
    },
    prec: function prec() {
      return this.sett.precision || 2;
    },
    new_font: function new_font() {
      return '12px ' + this.$props.font.split('px').pop();
    },
    price: function price() {
      return 'price' in this.sett ? this.sett.price : true;
    },
    time: function time() {
      return 'time' in this.sett ? this.sett.time : false;
    },
    shift: function shift() {
      return this.sett.shiftMode;
    }
  },
  data: function data() {
    return {};
  }
});
;// ./src/components/overlays/RangeTool.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_RangeToolvue_type_script_lang_js = (RangeToolvue_type_script_lang_js); 
;// ./src/components/overlays/RangeTool.vue
var RangeTool_render, RangeTool_staticRenderFns
;



/* normalize component */
;
var RangeTool_component = normalizeComponent(
  overlays_RangeToolvue_type_script_lang_js,
  RangeTool_render,
  RangeTool_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const RangeTool = (RangeTool_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/StepLine.vue?vue&type=script&lang=js
function StepLinevue_type_script_lang_js_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = StepLinevue_type_script_lang_js_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function StepLinevue_type_script_lang_js_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return StepLinevue_type_script_lang_js_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? StepLinevue_type_script_lang_js_arrayLikeToArray(r, a) : void 0; } }
function StepLinevue_type_script_lang_js_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// StepLine renderer - draws values as a step/stair pattern
// Horizontal line at each value, vertical line to next value


/* harmony default export */ const StepLinevue_type_script_lang_js = ({
  name: 'StepLine',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'Custom',
        version: '1.0.0'
      };
    },
    draw: function draw(ctx) {
      ctx.lineWidth = this.line_width;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      var layout = this.$props.layout;
      var data = this.$props.data;
      var i = this.data_index;
      if (data.length < 1) return;
      var prevX = null;
      var prevY = null;
      for (var k = 0, n = data.length; k < n; k++) {
        var p = data[k];
        var x = layout.t2screen(p[0]);
        var y = layout.$2screen(p[i]);
        if (p[i] == null || y !== y) {
          prevX = null;
          prevY = null;
          continue;
        }
        if (prevX !== null && prevY !== null) {
          // Draw horizontal line from prev point to current x
          ctx.lineTo(x, prevY);
          // Draw vertical line to current y
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
        }
        prevX = x;
        prevY = y;
      }
      ctx.stroke();
    },
    use_for: function use_for() {
      return ['StepLine'];
    },
    data_colors: function data_colors() {
      return [this.color];
    },
    // Calculate y-range for offchart display
    y_range: function y_range(hi, lo) {
      var data = this.$props.data;
      var i = this.data_index;
      var max = -Infinity;
      var min = Infinity;
      var _iterator = StepLinevue_type_script_lang_js_createForOfIteratorHelper(data),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var p = _step.value;
          if (p[i] != null) {
            if (p[i] > max) max = p[i];
            if (p[i] < min) min = p[i];
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (max === -Infinity) return [hi, lo];
      var pad = (max - min) * 0.1 || 1;
      return [max + pad, min - pad];
    }
  },
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    line_width: function line_width() {
      return this.sett.lineWidth || 1.5;
    },
    color: function color() {
      var n = this.$props.num % 5;
      return this.sett.color || this.COLORS[n];
    },
    data_index: function data_index() {
      return this.sett.dataIndex || 1;
    }
  },
  data: function data() {
    return {
      COLORS: ['#42b28a', '#5691ce', '#612ff9', '#d50b90', '#ff2316']
    };
  }
});
;// ./src/components/overlays/StepLine.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_StepLinevue_type_script_lang_js = (StepLinevue_type_script_lang_js); 
;// ./src/components/overlays/StepLine.vue
var StepLine_render, StepLine_staticRenderFns
;



/* normalize component */
;
var StepLine_component = normalizeComponent(
  overlays_StepLinevue_type_script_lang_js,
  StepLine_render,
  StepLine_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const StepLine = (StepLine_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Histogram.vue?vue&type=script&lang=js
function Histogramvue_type_script_lang_js_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = Histogramvue_type_script_lang_js_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function Histogramvue_type_script_lang_js_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return Histogramvue_type_script_lang_js_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? Histogramvue_type_script_lang_js_arrayLikeToArray(r, a) : void 0; } }
function Histogramvue_type_script_lang_js_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Histogram renderer - draws values as histogram bars
// Bars extend from baseline (0 or min) to data value
// Supports colorUp/colorDown for positive/negative values


/* harmony default export */ const Histogramvue_type_script_lang_js = ({
  name: 'Histogram',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'Custom',
        version: '1.0.0'
      };
    },
    draw: function draw(ctx) {
      var layout = this.$props.layout;
      var data = this.$props.data;
      var i = this.data_index;
      var baseline = this.baseline;
      if (data.length < 1) return;

      // Calculate bar width based on layout
      var barWidth = Math.max(1, layout.px_step * 0.8);
      for (var k = 0, n = data.length; k < n; k++) {
        var p = data[k];
        if (p[i] == null) continue;
        var x = layout.t2screen(p[0]);
        var y = layout.$2screen(p[i]);
        var y0 = layout.$2screen(baseline);

        // Determine color based on value relative to baseline
        var isPositive = p[i] >= baseline;
        ctx.fillStyle = isPositive ? this.colorUp : this.colorDown;

        // Draw bar from baseline to value
        var barX = x - barWidth / 2;
        var barY = Math.min(y, y0);
        var barHeight = Math.abs(y - y0);
        ctx.fillRect(barX, barY, barWidth, barHeight);
      }
    },
    use_for: function use_for() {
      return ['Histogram'];
    },
    data_colors: function data_colors() {
      return [this.colorUp, this.colorDown];
    },
    legend: function legend(values) {
      var val = values[this.data_index];
      var isPositive = val >= this.baseline;
      return [{
        value: val,
        color: isPositive ? this.colorUp : this.colorDown
      }];
    },
    // Calculate y-range for offchart display
    y_range: function y_range(hi, lo) {
      var data = this.$props.data;
      var i = this.data_index;
      var max = -Infinity;
      var min = Infinity;
      var _iterator = Histogramvue_type_script_lang_js_createForOfIteratorHelper(data),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var p = _step.value;
          if (p[i] != null) {
            if (p[i] > max) max = p[i];
            if (p[i] < min) min = p[i];
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (max === -Infinity) return [hi, lo];
      // Include baseline in range
      var baseline = this.baseline;
      if (baseline < min) min = baseline;
      if (baseline > max) max = baseline;
      var pad = (max - min) * 0.1 || 1;
      return [max + pad, min - pad];
    }
  },
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    colorUp: function colorUp() {
      return this.sett.colorUp || this.sett.color || '#26A69A';
    },
    colorDown: function colorDown() {
      return this.sett.colorDown || '#EF5350';
    },
    baseline: function baseline() {
      return this.sett.baseline || 0;
    },
    data_index: function data_index() {
      return this.sett.dataIndex || 1;
    }
  },
  data: function data() {
    return {};
  }
});
;// ./src/components/overlays/Histogram.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Histogramvue_type_script_lang_js = (Histogramvue_type_script_lang_js); 
;// ./src/components/overlays/Histogram.vue
var Histogram_render, Histogram_staticRenderFns
;



/* normalize component */
;
var Histogram_component = normalizeComponent(
  overlays_Histogramvue_type_script_lang_js,
  Histogram_render,
  Histogram_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Histogram = (Histogram_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Bar.vue?vue&type=script&lang=js
function Barvue_type_script_lang_js_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = Barvue_type_script_lang_js_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function Barvue_type_script_lang_js_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return Barvue_type_script_lang_js_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? Barvue_type_script_lang_js_arrayLikeToArray(r, a) : void 0; } }
function Barvue_type_script_lang_js_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Bar renderer - draws each value as an individual thin bar
// Similar to a bar chart visualization


/* harmony default export */ const Barvue_type_script_lang_js = ({
  name: 'Bar',
  mixins: [overlay],
  methods: {
    meta_info: function meta_info() {
      return {
        author: 'Custom',
        version: '1.0.0'
      };
    },
    draw: function draw(ctx) {
      var layout = this.$props.layout;
      var data = this.$props.data;
      var i = this.data_index;
      var baseline = this.baseline;
      if (data.length < 1) return;

      // Bar width - thinner than histogram
      var barWidth = Math.max(1, layout.px_step * this.bar_width_ratio);
      for (var k = 0, n = data.length; k < n; k++) {
        var p = data[k];
        if (p[i] == null) continue;
        var x = layout.t2screen(p[0]);
        var y = layout.$2screen(p[i]);
        var y0 = layout.$2screen(baseline);

        // Determine color based on value relative to baseline
        var isPositive = p[i] >= baseline;
        ctx.fillStyle = isPositive ? this.colorUp : this.colorDown;

        // Draw thin bar from baseline to value
        var barX = x - barWidth / 2;
        var barY = Math.min(y, y0);
        var barHeight = Math.abs(y - y0);
        ctx.fillRect(barX, barY, barWidth, barHeight || 1);
      }
    },
    use_for: function use_for() {
      return ['Bar'];
    },
    data_colors: function data_colors() {
      return [this.colorUp, this.colorDown];
    },
    legend: function legend(values) {
      var val = values[this.data_index];
      var isPositive = val >= this.baseline;
      return [{
        value: val,
        color: isPositive ? this.colorUp : this.colorDown
      }];
    },
    // Calculate y-range for offchart display
    y_range: function y_range(hi, lo) {
      var data = this.$props.data;
      var i = this.data_index;
      var max = -Infinity;
      var min = Infinity;
      var _iterator = Barvue_type_script_lang_js_createForOfIteratorHelper(data),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var p = _step.value;
          if (p[i] != null) {
            if (p[i] > max) max = p[i];
            if (p[i] < min) min = p[i];
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (max === -Infinity) return [hi, lo];
      // Include baseline in range
      var baseline = this.baseline;
      if (baseline < min) min = baseline;
      if (baseline > max) max = baseline;
      var pad = (max - min) * 0.1 || 1;
      return [max + pad, min - pad];
    }
  },
  computed: {
    sett: function sett() {
      return this.$props.settings;
    },
    colorUp: function colorUp() {
      return this.sett.colorUp || this.sett.color || '#612ff9';
    },
    colorDown: function colorDown() {
      return this.sett.colorDown || '#EF5350';
    },
    baseline: function baseline() {
      return this.sett.baseline || 0;
    },
    data_index: function data_index() {
      return this.sett.dataIndex || 1;
    },
    bar_width_ratio: function bar_width_ratio() {
      return this.sett.barWidth || 0.4;
    }
  },
  data: function data() {
    return {};
  }
});
;// ./src/components/overlays/Bar.vue?vue&type=script&lang=js
 /* harmony default export */ const overlays_Barvue_type_script_lang_js = (Barvue_type_script_lang_js); 
;// ./src/components/overlays/Bar.vue
var Bar_render, Bar_staticRenderFns
;



/* normalize component */
;
var Bar_component = normalizeComponent(
  overlays_Barvue_type_script_lang_js,
  Bar_render,
  Bar_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Bar = (Bar_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Grid.vue?vue&type=script&lang=js
function Gridvue_type_script_lang_js_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = Gridvue_type_script_lang_js_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function Gridvue_type_script_lang_js_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return Gridvue_type_script_lang_js_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? Gridvue_type_script_lang_js_arrayLikeToArray(r, a) : void 0; } }
function Gridvue_type_script_lang_js_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Sets up all layers/overlays for the grid with 'grid_id'





















/* harmony default export */ const Gridvue_type_script_lang_js = ({
  name: 'Grid',
  props: ['sub', 'layout', 'range', 'interval', 'cursor', 'colors', 'overlays', 'width', 'height', 'data', 'grid_id', 'y_transform', 'font', 'tv_id', 'config', 'meta', 'shaders'],
  mixins: [canvas, uxlist],
  components: {
    Crosshair: components_Crosshair,
    KeyboardListener: KeyboardListener
  },
  created: function created() {
    var _this = this;
    // List of all possible overlays (builtin + custom)
    this._list = [Spline, Splines, Range, Trades, Channel, Segment, Candles, Volume, Splitters, LineTool, RangeTool, StepLine, Histogram, Bar].concat(this.$props.overlays);
    this._registry = {};

    // We need to know which components we will use.
    // Custom overlay components overwrite built-ins:
    var tools = [];
    this._list.forEach(function (x, i) {
      var use_for = x.methods.use_for();
      if (x.methods.tool) tools.push({
        use_for: use_for,
        info: x.methods.tool()
      });
      use_for.forEach(function (indicator) {
        _this._registry[indicator] = i;
      });
    });
    this.$emit('custom-event', {
      event: 'register-tools',
      args: tools
    });
    this.$on('custom-event', function (e) {
      return _this.on_ux_event(e, 'grid');
    });
  },
  beforeDestroy: function beforeDestroy() {
    if (this.renderer) this.renderer.destroy();
  },
  mounted: function mounted() {
    var _this2 = this;
    var el = this.$refs['canvas'];
    this.renderer = new Grid(el, this);
    this.setup();
    this.$nextTick(function () {
      return _this2.redraw();
    });
  },
  render: function render(h) {
    var id = this.$props.grid_id;
    // Use layout override if available (for resize operations)
    var layout = this.layoutOverride || this.$props.layout.grids[id];
    return this.create_canvas(h, "grid-".concat(id), {
      position: {
        x: 0,
        y: layout.offset || 0
      },
      attrs: {
        width: layout.width,
        height: layout.height,
        overflow: 'hidden'
      },
      style: {
        backgroundColor: this.$props.colors.back
      },
      hs: [h(components_Crosshair, {
        props: this.common_props(),
        on: this.layer_events
      }), h(KeyboardListener, {
        on: this.keyboard_events
      }), h(UxLayer, {
        props: {
          id: id,
          tv_id: this.$props.tv_id,
          uxs: this.uxs,
          colors: this.$props.colors,
          config: this.$props.config,
          updater: Math.random()
        },
        on: {
          'custom-event': this.emit_ux_event
        }
      })].concat(this.get_overlays(h))
    });
  },
  methods: {
    new_layer: function new_layer(layer) {
      var _this3 = this;
      this.$nextTick(function () {
        return _this3.renderer.new_layer(layer);
      });
    },
    del_layer: function del_layer(layer) {
      var _this4 = this;
      this.$nextTick(function () {
        return _this4.renderer.del_layer(layer);
      });
      var grid_id = this.$props.grid_id;
      this.$emit('custom-event', {
        event: 'remove-shaders',
        args: [grid_id, layer]
      });
      // TODO: close all interfaces
      this.$emit('custom-event', {
        event: 'remove-layer-meta',
        args: [grid_id, layer]
      });
      this.remove_all_ux(layer);
    },
    // Handle double-click to minimize off-chart grids or minimize all (main chart)
    on_dblclick: function on_dblclick(e) {
      var grid_id = this.$props.grid_id;
      if (grid_id === 0) {
        // Double-click on main chart minimizes all off-chart grids
        this.$emit('custom-event', {
          event: 'minimize-all-offcharts',
          args: []
        });
      } else {
        // Double-click on off-chart grid toggles its minimize state
        this.$emit('custom-event', {
          event: 'grid-dblclick',
          args: [grid_id]
        });
      }
    },
    get_overlays: function get_overlays(h) {
      var _this5 = this;
      // Distributes overlay data & settings according
      // to this._registry; returns compo list
      var comp_list = [],
        count = {};
      var _iterator = Gridvue_type_script_lang_js_createForOfIteratorHelper(this.$props.data),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var d = _step.value;
          var comp = this._list[this._registry[d.type]];
          if (comp) {
            if (comp.methods.calc) {
              comp = this.inject_renderer(comp);
            }
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
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return comp_list.map(function (x, i) {
        return h(x.cls, {
          on: _this5.layer_events,
          attrs: Object.assign(_this5.common_props(), {
            id: "".concat(x.type, "_").concat(count[x.type]++),
            type: x.type,
            data: x.data,
            settings: x.settings,
            i0: x.i0,
            tf: x.tf,
            num: i,
            grid_id: _this5.$props.grid_id,
            meta: _this5.$props.meta,
            last: x.last
          })
        });
      });
    },
    common_props: function common_props() {
      // Use layout override if available (for resize operations)
      var layout = this.layoutOverride || this.$props.layout.grids[this.$props.grid_id];
      return {
        cursor: this.$props.cursor,
        colors: this.$props.colors,
        layout: layout,
        interval: this.$props.interval,
        sub: this.$props.sub,
        font: this.$props.font,
        config: this.$props.config
      };
    },
    emit_ux_event: function emit_ux_event(e) {
      var e_pass = this.on_ux_event(e, 'grid');
      if (e_pass) this.$emit('custom-event', e);
    },
    // Replace the current comp with 'renderer'
    inject_renderer: function inject_renderer(comp) {
      var src = comp.methods.calc();
      if (!src.conf || !src.conf.renderer || comp.__renderer__) {
        return comp;
      }

      // Search for an overlay with the target 'name'
      var f = this._list.find(function (x) {
        return x.name === src.conf.renderer;
      });
      if (!f) return comp;
      comp.mixins.push(f);
      comp.__renderer__ = src.conf.renderer;
      return comp;
    },
    // Force resize canvas based on provided layout (for drag resize)
    resize_from_layout: function resize_from_layout(layout) {
      var _this6 = this;
      var id = this.$props.grid_id;
      var grid = layout ? layout.grids[id] : null;
      if (grid && this._attrs) {
        this._attrs.width = grid.width;
        this._attrs.height = grid.height;
        // Store layout override for common_props() and overlays
        this.layoutOverride = grid;
        // Update wrapper div position
        var wrapper = this.$el;
        if (wrapper) {
          wrapper.style.top = (grid.offset || 0) + 'px';
        }
        // Update renderer's layout reference for correct Y-scale
        if (this.renderer) {
          this.renderer.layout = grid;
        }
        // Force re-render to update overlay props with new layout
        this.$forceUpdate();
        this.$nextTick(function () {
          _this6.setup();
        });
      }
    }
  },
  computed: {
    is_active: function is_active() {
      return this.$props.cursor.t !== undefined && this.$props.cursor.grid_id === this.$props.grid_id;
    }
  },
  watch: {
    range: {
      handler: function handler() {
        var _this7 = this;
        // TODO: Left-side render lag fix:
        // Overlay data is updated one tick later than
        // the main sub. Fast fix is to delay redraw()
        // call. It will be a solution until a better
        // one comes by.
        // Also force update to ensure overlay data props are refreshed
        this.$forceUpdate();
        this.$nextTick(function () {
          return _this7.redraw();
        });
      },
      deep: true
    },
    cursor: {
      handler: function handler() {
        if (!this.$props.cursor.locked) this.redraw();
      },
      deep: true
    },
    overlays: {
      // Track changes in calc() functions
      handler: function handler(ovs) {
        var _iterator2 = Gridvue_type_script_lang_js_createForOfIteratorHelper(ovs),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var ov = _step2.value;
            var _iterator3 = Gridvue_type_script_lang_js_createForOfIteratorHelper(this.$children),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var comp = _step3.value;
                if (typeof comp.id !== 'string') continue;
                var tuple = comp.id.split('_');
                tuple.pop();
                if (tuple.join('_') === ov.name) {
                  comp.calc = ov.methods.calc;
                  if (!comp.calc) continue;
                  var calc = comp.calc.toString();
                  if (calc !== ov.__prevscript__) {
                    comp.exec_script();
                  }
                  ov.__prevscript__ = calc;
                }
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      },
      deep: true
    },
    // Redraw on the shader list change
    shaders: function shaders(n, p) {
      this.redraw();
    },
    // Watch data changes to ensure overlays are updated
    data: {
      handler: function handler() {
        var _this8 = this;
        // Force update and redraw when data changes
        this.$forceUpdate();
        this.$nextTick(function () {
          return _this8.redraw();
        });
      },
      deep: true
    },
    // Watch layout changes for resize operations
    layout: {
      handler: function handler(newLayout, oldLayout) {
        var _this9 = this;
        var id = this.$props.grid_id;
        var newGrid = newLayout && newLayout.grids && newLayout.grids[id];
        var oldGrid = oldLayout && oldLayout.grids && oldLayout.grids[id];

        // Check if height or offset changed
        if (newGrid && oldGrid && (newGrid.height !== oldGrid.height || newGrid.offset !== oldGrid.offset)) {
          // Force canvas resize and redraw
          this.$nextTick(function () {
            _this9.setup();
            _this9.redraw();
          });
        }
      },
      deep: true
    }
  },
  data: function data() {
    var _this0 = this;
    return {
      // Override layout for resize operations (bypassing Vue reactivity)
      layoutOverride: null,
      layer_events: {
        'new-grid-layer': this.new_layer,
        'delete-grid-layer': this.del_layer,
        'show-grid-layer': function showGridLayer(d) {
          _this0.renderer.show_hide_layer(d);
          _this0.redraw();
        },
        'redraw-grid': this.redraw,
        'layer-meta-props': function layerMetaProps(d) {
          return _this0.$emit('layer-meta-props', d);
        },
        'custom-event': function customEvent(d) {
          return _this0.$emit('custom-event', d);
        }
      },
      keyboard_events: {
        'register-kb-listener': function registerKbListener(event) {
          _this0.$emit('register-kb-listener', event);
        },
        'remove-kb-listener': function removeKbListener(event) {
          _this0.$emit('remove-kb-listener', event);
        },
        'keyup': function keyup(event) {
          if (!_this0.is_active) return;
          _this0.renderer.propagate('keyup', event);
        },
        'keydown': function keydown(event) {
          if (!_this0.is_active) return; // TODO: is this neeeded?
          _this0.renderer.propagate('keydown', event);
        },
        'keypress': function keypress(event) {
          if (!_this0.is_active) return;
          _this0.renderer.propagate('keypress', event);
        }
      }
    };
  }
});
;// ./src/components/Grid.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Gridvue_type_script_lang_js = (Gridvue_type_script_lang_js); 
;// ./src/components/Grid.vue
var Grid_render, Grid_staticRenderFns
;



/* normalize component */
;
var Grid_component = normalizeComponent(
  components_Gridvue_type_script_lang_js,
  Grid_render,
  Grid_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const components_Grid = (Grid_component.exports);
;// ./src/components/js/sidebar.js


function sidebar_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = sidebar_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function sidebar_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return sidebar_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? sidebar_arrayLikeToArray(r, a) : void 0; } }
function sidebar_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }




var PANHEIGHT;
var Sidebar = /*#__PURE__*/function () {
  function Sidebar(canvas, comp, side) {
    if (side === void 0) {
      side = 'right';
    }
    classCallCheck_classCallCheck(this, Sidebar);
    PANHEIGHT = comp.config.PANHEIGHT;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.comp = comp;
    this.$p = comp.$props;
    this.data = this.$p.sub;
    this.range = this.$p.range;
    this.id = this.$p.grid_id;
    this.layout = this.$p.layout.grids[this.id];
    this.side = side;
    this.listeners();
  }
  return createClass_createClass(Sidebar, [{
    key: "listeners",
    value: function listeners() {
      var _this = this;
      // Add wheel zoom for Y-axis
      this.hm = hamster_default()(this.canvas);
      this.hm.wheel(function (event, delta) {
        return _this.mousezoom(-delta * 50, event);
      });
      var mc = this.mc = new hammer.Manager(this.canvas);
      mc.add(new hammer.Pan({
        direction: hammer.DIRECTION_VERTICAL,
        threshold: 0
      }));
      mc.add(new hammer.Tap({
        event: 'doubletap',
        taps: 2,
        posThreshold: 50
      }));
      mc.on('panstart', function (event) {
        if (_this.$p.y_transform) {
          _this.zoom = _this.$p.y_transform.zoom;
        } else {
          _this.zoom = 1.0;
        }
        _this.y_range = [_this.layout.$_hi, _this.layout.$_lo];
        _this.drug = {
          y: event.center.y,
          z: _this.zoom,
          mid: math.log_mid(_this.y_range, _this.layout.height),
          A: _this.layout.A,
          B: _this.layout.B
        };
      });
      mc.on('panmove', function (event) {
        if (_this.drug) {
          _this.zoom = _this.calc_zoom(event);
          _this.comp.$emit('sidebar-transform', {
            grid_id: _this.id,
            zoom: _this.zoom,
            auto: false,
            range: _this.calc_range(),
            drugging: true
          });
          _this.update();
        }
      });
      mc.on('panend', function () {
        _this.drug = null;
        _this.comp.$emit('sidebar-transform', {
          grid_id: _this.id,
          drugging: false
        });
      });
      mc.on('doubletap', function () {
        _this.comp.$emit('sidebar-transform', {
          grid_id: _this.id,
          zoom: 1.0,
          auto: true
        });
        _this.zoom = 1.0;
        _this.update();
      });

      // TODO: Do later for mobile version
    }
  }, {
    key: "update",
    value: function update() {
      // Update reference to the grid
      // Use layoutOverride if available (for resize operations)
      this.layout = this.comp.layoutOverride || this.$p.layout.grids[this.id];
      var points = this.layout.ys;
      var x,
        y,
        w,
        h,
        side = this.side;
      var sb = this.layout.sb;

      //this.ctx.fillStyle = this.$p.colors.back
      this.ctx.font = this.$p.font;
      switch (side) {
        case 'left':
          x = 0;
          y = 0;
          w = Math.floor(sb);
          h = this.layout.height;

          //this.ctx.fillRect(x, y, w, h)
          this.ctx.clearRect(x, y, w, h);
          this.ctx.strokeStyle = this.$p.colors.scale;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 0.5, 0);
          this.ctx.lineTo(x + 0.5, h);
          this.ctx.stroke();
          break;
        case 'right':
          x = 0;
          y = 0;
          w = Math.floor(sb);
          h = this.layout.height;
          //this.ctx.fillRect(x, y, w, h)
          this.ctx.clearRect(x, y, w, h);
          this.ctx.strokeStyle = this.$p.colors.scale;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 0.5, 0);
          this.ctx.lineTo(x + 0.5, h);
          this.ctx.stroke();
          break;
      }
      this.ctx.fillStyle = this.$p.colors.text;
      this.ctx.beginPath();
      var _iterator = sidebar_createForOfIteratorHelper(points),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var p = _step.value;
          if (p[0] > this.layout.height) continue;
          var x1 = side === 'left' ? w - 0.5 : x - 0.5;
          var x2 = side === 'left' ? x1 - 4.5 : x1 + 4.5;
          this.ctx.moveTo(x1, p[0] - 0.5);
          this.ctx.lineTo(x2, p[0] - 0.5);
          var offst = side === 'left' ? -10 : 10;
          this.ctx.textAlign = side === 'left' ? 'end' : 'start';
          var d = this.layout.prec;
          this.ctx.fillText(p[1].toFixed(d), x1 + offst, p[0] + 4);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      this.ctx.stroke();
      if (this.$p.grid_id) this.upper_border();
      this.apply_shaders();
      if (this.$p.cursor.y && this.$p.cursor.y$) this.panel();
    }
  }, {
    key: "apply_shaders",
    value: function apply_shaders() {
      var layout = this.$p.layout.grids[this.id];
      var props = {
        layout: layout,
        cursor: this.$p.cursor
      };
      var _iterator2 = sidebar_createForOfIteratorHelper(this.$p.shaders),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var s = _step2.value;
          this.ctx.save();
          s.draw(this.ctx, props);
          this.ctx.restore();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }, {
    key: "upper_border",
    value: function upper_border() {
      this.ctx.strokeStyle = this.$p.colors.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0.5);
      this.ctx.lineTo(this.layout.width, 0.5);
      this.ctx.stroke();
    }

    // A gray bar behind the current price
  }, {
    key: "panel",
    value: function panel() {
      if (this.$p.cursor.grid_id !== this.layout.id) {
        return;
      }
      var lbl = this.$p.cursor.y$.toFixed(this.layout.prec);
      this.ctx.fillStyle = this.$p.colors.panel;
      var panwidth = this.layout.sb + 1;
      var x = -0.5;
      var y = this.$p.cursor.y - PANHEIGHT * 0.5 - 0.5;
      var a = 7;
      this.ctx.fillRect(x - 0.5, y, panwidth, PANHEIGHT);
      this.ctx.fillStyle = this.$p.colors.textHL;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(lbl, a, y + 15);
    }
  }, {
    key: "calc_zoom",
    value: function calc_zoom(event) {
      var d = this.drug.y - event.center.y;
      var speed = d > 0 ? 3 : 1;
      var k = 1 + speed * d / this.layout.height;
      return utils.clamp(this.drug.z * k, 0.005, 100);
    }

    // Not the best place to calculate y-range but
    // this is the simplest solution I found up to
    // date
  }, {
    key: "calc_range",
    value: function calc_range(diff1, diff2) {
      var _this2 = this;
      if (diff1 === void 0) {
        diff1 = 1;
      }
      if (diff2 === void 0) {
        diff2 = 1;
      }
      var z = this.zoom / this.drug.z;
      var zk = (1 / z - 1) / 2;
      var range = this.y_range.slice();
      var delta = range[0] - range[1];
      if (!this.layout.grid.logScale) {
        range[0] = range[0] + delta * zk * diff1;
        range[1] = range[1] - delta * zk * diff2;
      } else {
        var px_mid = this.layout.height / 2;
        var new_hi = px_mid - px_mid * (1 / z);
        var new_lo = px_mid + px_mid * (1 / z);

        // Use old mapping to get a new range
        var f = function f(y) {
          return math.exp((y - _this2.drug.B) / _this2.drug.A);
        };
        var copy = range.slice();
        range[0] = f(new_hi);
        range[1] = f(new_lo);
      }
      return range;
    }
  }, {
    key: "mousezoom",
    value: function mousezoom(delta, event) {
      event.originalEvent.preventDefault();
      event.preventDefault();

      // Initialize zoom state if needed
      if (this.$p.y_transform) {
        this.zoom = this.$p.y_transform.zoom;
      } else {
        this.zoom = 1.0;
      }
      this.y_range = [this.layout.$_hi, this.layout.$_lo];
      this.drug = {
        y: 0,
        z: this.zoom,
        mid: math.log_mid(this.y_range, this.layout.height),
        A: this.layout.A,
        B: this.layout.B
      };

      // Calculate zoom based on wheel delta
      delta = utils.smart_wheel(delta);
      var k = delta * 0.002;
      this.zoom = utils.clamp(this.zoom * (1 + k), 0.005, 100);
      this.comp.$emit('sidebar-transform', {
        grid_id: this.id,
        zoom: this.zoom,
        auto: false,
        range: this.calc_range(),
        drugging: true
      });
      this.drug = null;
      this.comp.$emit('sidebar-transform', {
        grid_id: this.id,
        drugging: false
      });
      this.update();
    }
  }, {
    key: "rezoom_range",
    value: function rezoom_range(delta, diff1, diff2) {
      if (!this.$p.y_transform || this.$p.y_transform.auto) return;
      this.zoom = 1.0;
      // TODO: further work (improve scaling ratio)
      if (delta < 0) delta /= 3.75; // Btw, idk why 3.75, but it works
      delta *= 0.25;
      this.y_range = [this.layout.$_hi, this.layout.$_lo];
      this.drug = {
        y: 0,
        z: this.zoom,
        mid: math.log_mid(this.y_range, this.layout.height),
        A: this.layout.A,
        B: this.layout.B
      };
      this.zoom = this.calc_zoom({
        center: {
          y: delta * this.layout.height
        }
      });
      this.comp.$emit('sidebar-transform', {
        grid_id: this.id,
        zoom: this.zoom,
        auto: false,
        range: this.calc_range(diff1, diff2),
        drugging: true
      });
      this.drug = null;
      this.comp.$emit('sidebar-transform', {
        grid_id: this.id,
        drugging: false
      });
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.mc) this.mc.destroy();
      if (this.hm) this.hm.unwheel();
    }
  }, {
    key: "mousemove",
    value: function mousemove() {}
  }, {
    key: "mouseout",
    value: function mouseout() {}
  }, {
    key: "mouseup",
    value: function mouseup() {}
  }, {
    key: "mousedown",
    value: function mousedown() {}
  }]);
}();

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Sidebar.vue?vue&type=script&lang=js
// The side bar (yep, that thing with a bunch of $$$)



/* harmony default export */ const Sidebarvue_type_script_lang_js = ({
  name: 'Sidebar',
  props: ['sub', 'layout', 'range', 'interval', 'cursor', 'colors', 'font', 'width', 'height', 'grid_id', 'rerender', 'y_transform', 'tv_id', 'config', 'shaders'],
  mixins: [canvas],
  mounted: function mounted() {
    var el = this.$refs['canvas'];
    this.renderer = new Sidebar(el, this);
    this.setup();
    this.redraw();
  },
  render: function render(h) {
    var id = this.$props.grid_id;
    // Use layout override if available (for resize operations)
    var layout = this.layoutOverride || this.$props.layout.grids[id];
    return this.create_canvas(h, "sidebar-".concat(id), {
      position: {
        x: layout.width,
        y: layout.offset || 0
      },
      attrs: {
        rerender: this.$props.rerender,
        width: layout.sb,
        height: layout.height
      },
      style: {
        backgroundColor: this.$props.colors.back
      }
    });
  },
  methods: {
    // Force resize canvas based on provided layout (for drag resize)
    resize_from_layout: function resize_from_layout(layout) {
      var _this = this;
      var id = this.$props.grid_id;
      var grid = layout ? layout.grids[id] : null;
      if (grid && this._attrs) {
        this._attrs.width = grid.sb;
        this._attrs.height = grid.height;
        // Store layout override
        this.layoutOverride = grid;
        // Update wrapper div position
        var wrapper = this.$el;
        if (wrapper) {
          wrapper.style.top = (grid.offset || 0) + 'px';
          wrapper.style.left = grid.width + 'px';
        }
        // Update renderer's layout reference for correct Y-scale
        if (this.renderer) {
          this.renderer.layout = grid;
        }
        // Force re-render and setup
        this.$forceUpdate();
        this.$nextTick(function () {
          _this.setup();
        });
      }
    }
  },
  data: function data() {
    return {
      // Override layout for resize operations (bypassing Vue reactivity)
      layoutOverride: null
    };
  },
  watch: {
    range: {
      handler: function handler() {
        this.redraw();
      },
      deep: true
    },
    cursor: {
      handler: function handler() {
        this.redraw();
      },
      deep: true
    },
    rerender: function rerender() {
      var _this2 = this;
      this.$nextTick(function () {
        return _this2.redraw();
      });
    }
  },
  beforeDestroy: function beforeDestroy() {
    if (this.renderer) this.renderer.destroy();
  }
});
;// ./src/components/Sidebar.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Sidebarvue_type_script_lang_js = (Sidebarvue_type_script_lang_js); 
;// ./src/components/Sidebar.vue
var Sidebar_render, Sidebar_staticRenderFns
;



/* normalize component */
;
var Sidebar_component = normalizeComponent(
  components_Sidebarvue_type_script_lang_js,
  Sidebar_render,
  Sidebar_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const components_Sidebar = (Sidebar_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Legend.vue?vue&type=template&id=c3c5e6c2
var Legendvue_type_template_id_c3c5e6c2_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "trading-vue-legend",
    style: _vm.calc_style,
    on: {
      dblclick: _vm.on_dblclick
    }
  }, [_vm.grid_id === 0 ? _c("div", {
    staticClass: "trading-vue-ohlcv",
    style: {
      "max-width": _vm.common.width + "px"
    }
  }, [_c("span", {
    staticClass: "t-vue-title",
    style: {
      color: _vm.common.colors.title
    }
  }, [_vm._v("\n              " + _vm._s(_vm.common.title_txt) + "\n        ")]), _vm._v(" "), _vm.show_values ? _c("span", [_vm._v("\n            O"), _c("span", {
    staticClass: "t-vue-lspan"
  }, [_vm._v(_vm._s(_vm.ohlcv[0]))]), _vm._v("\n            H"), _c("span", {
    staticClass: "t-vue-lspan"
  }, [_vm._v(_vm._s(_vm.ohlcv[1]))]), _vm._v("\n            L"), _c("span", {
    staticClass: "t-vue-lspan"
  }, [_vm._v(_vm._s(_vm.ohlcv[2]))]), _vm._v("\n            C"), _c("span", {
    staticClass: "t-vue-lspan"
  }, [_vm._v(_vm._s(_vm.ohlcv[3]))]), _vm._v("\n            V"), _c("span", {
    staticClass: "t-vue-lspan"
  }, [_vm._v(_vm._s(_vm.ohlcv[4]))])]) : _vm._e(), _vm._v(" "), !_vm.show_values ? _c("span", {
    staticClass: "t-vue-lspan",
    style: {
      color: _vm.common.colors.text
    }
  }, [_vm._v("\n            " + _vm._s((_vm.common.meta.last || [])[4]) + "\n        ")]) : _vm._e()]) : _vm._e(), _vm._v(" "), _vm._l(this.indicators, function (ind) {
    return _c("div", {
      key: ind.id,
      staticClass: "t-vue-ind"
    }, [_c("span", {
      staticClass: "t-vue-iname"
    }, [_vm._v(_vm._s(ind.name))]), _vm._v(" "), _vm.grid_id > 0 ? _c("button", {
      staticClass: "t-vue-settings-btn",
      attrs: {
        title: "Settings"
      },
      on: {
        click: function click($event) {
          $event.stopPropagation();
          return _vm.openSettings(ind);
        }
      }
    }, [_c("svg", {
      attrs: {
        viewBox: "0 0 24 24",
        width: "14",
        height: "14"
      }
    }, [_c("path", {
      attrs: {
        fill: "currentColor",
        d: "M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      }
    })])]) : _vm._e(), _vm._v(" "), _c("button-group", {
      attrs: {
        buttons: _vm.common.buttons,
        config: _vm.common.config,
        ov_id: ind.id,
        grid_id: _vm.grid_id,
        index: ind.index,
        tv_id: _vm.common.tv_id,
        display: ind.v
      },
      on: {
        "legend-button-click": _vm.button_click
      }
    }), _vm._v(" "), ind.v ? _c("span", {
      staticClass: "t-vue-ivalues"
    }, _vm._l(ind.values, function (v) {
      return _vm.show_values ? _c("span", {
        staticClass: "t-vue-lspan t-vue-ivalue",
        style: {
          color: v.color
        }
      }, [_vm._v("\n                " + _vm._s(v.value) + "\n            ")]) : _vm._e();
    }), 0) : _vm._e(), _vm._v(" "), ind.unk ? _c("span", {
      staticClass: "t-vue-unknown"
    }, [_vm._v("\n            (Unknown type)\n        ")]) : _vm._e(), _vm._v(" "), _c("transition", {
      attrs: {
        name: "tvjs-appear"
      }
    }, [ind.loading ? _c("spinner", {
      attrs: {
        colors: _vm.common.colors
      }
    }) : _vm._e()], 1)], 1);
  })], 2);
};
var Legendvue_type_template_id_c3c5e6c2_staticRenderFns = [];
Legendvue_type_template_id_c3c5e6c2_render._withStripped = true;

;// ./src/components/Legend.vue?vue&type=template&id=c3c5e6c2

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ButtonGroup.vue?vue&type=template&id=aee8964e
var ButtonGroupvue_type_template_id_aee8964e_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("span", {
    staticClass: "t-vue-lbtn-grp"
  }, _vm._l(_vm.buttons, function (b, i) {
    return _c("legend-button", {
      key: i,
      attrs: {
        id: b.name || b,
        tv_id: _vm.tv_id,
        ov_id: _vm.ov_id,
        grid_id: _vm.grid_id,
        index: _vm.index,
        display: _vm.display,
        icon: b.icon,
        config: _vm.config
      },
      on: {
        "legend-button-click": _vm.button_click
      }
    });
  }), 1);
};
var ButtonGroupvue_type_template_id_aee8964e_staticRenderFns = [];
ButtonGroupvue_type_template_id_aee8964e_render._withStripped = true;

;// ./src/components/ButtonGroup.vue?vue&type=template&id=aee8964e

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/LegendButton.vue?vue&type=template&id=7271720b
var LegendButtonvue_type_template_id_7271720b_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("img", {
    staticClass: "t-vue-lbtn",
    style: {
      width: _vm.config.L_BTN_SIZE + "px",
      height: _vm.config.L_BTN_SIZE + "px",
      margin: _vm.config.L_BTN_MARGIN
    },
    attrs: {
      src: _vm.base64,
      id: _vm.uuid
    },
    on: {
      click: _vm.onclick
    }
  });
};
var LegendButtonvue_type_template_id_7271720b_staticRenderFns = [];
LegendButtonvue_type_template_id_7271720b_render._withStripped = true;

;// ./src/components/LegendButton.vue?vue&type=template&id=7271720b

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/LegendButton.vue?vue&type=script&lang=js

/* harmony default export */ const LegendButtonvue_type_script_lang_js = ({
  name: 'LegendButton',
  props: ['id', 'tv_id', 'grid_id', 'ov_id', 'index', 'display', 'icon', 'config'],
  mounted: function mounted() {},
  computed: {
    base64: function base64() {
      return this.icon || icons_namespaceObject[this.file_name];
    },
    file_name: function file_name() {
      var id = this.$props.id;
      if (this.$props.id === 'display') {
        id = this.$props.display ? 'display_on' : 'display_off';
      }
      return id + '.png';
    },
    uuid: function uuid() {
      var tv = this.$props.tv_id;
      var gr = this.$props.grid_id;
      var ov = this.$props.ov_id;
      return "".concat(tv, "-btn-g").concat(gr, "-").concat(ov);
    },
    data_type: function data_type() {
      return this.$props.grid_id === 0 ? "onchart" : "offchart";
    },
    data_index: function data_index() {
      return this.$props.index;
    }
  },
  methods: {
    onclick: function onclick() {
      this.$emit('legend-button-click', {
        button: this.$props.id,
        type: this.data_type,
        dataIndex: this.data_index,
        grid: this.$props.grid_id,
        overlay: this.$props.ov_id
      });
    }
  }
});
;// ./src/components/LegendButton.vue?vue&type=script&lang=js
 /* harmony default export */ const components_LegendButtonvue_type_script_lang_js = (LegendButtonvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/LegendButton.vue?vue&type=style&index=0&id=7271720b&prod&lang=css
var LegendButtonvue_type_style_index_0_id_7271720b_prod_lang_css = __webpack_require__(152);
;// ./src/components/LegendButton.vue?vue&type=style&index=0&id=7271720b&prod&lang=css

;// ./src/components/LegendButton.vue



;


/* normalize component */

var LegendButton_component = normalizeComponent(
  components_LegendButtonvue_type_script_lang_js,
  LegendButtonvue_type_template_id_7271720b_render,
  LegendButtonvue_type_template_id_7271720b_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const LegendButton = (LegendButton_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ButtonGroup.vue?vue&type=script&lang=js

/* harmony default export */ const ButtonGroupvue_type_script_lang_js = ({
  name: 'ButtonGroup',
  props: ['buttons', 'tv_id', 'ov_id', 'grid_id', 'index', 'display', 'config'],
  components: {
    LegendButton: LegendButton
  },
  methods: {
    button_click: function button_click(event) {
      this.$emit('legend-button-click', event);
    }
  }
});
;// ./src/components/ButtonGroup.vue?vue&type=script&lang=js
 /* harmony default export */ const components_ButtonGroupvue_type_script_lang_js = (ButtonGroupvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ButtonGroup.vue?vue&type=style&index=0&id=aee8964e&prod&lang=css
var ButtonGroupvue_type_style_index_0_id_aee8964e_prod_lang_css = __webpack_require__(197);
;// ./src/components/ButtonGroup.vue?vue&type=style&index=0&id=aee8964e&prod&lang=css

;// ./src/components/ButtonGroup.vue



;


/* normalize component */

var ButtonGroup_component = normalizeComponent(
  components_ButtonGroupvue_type_script_lang_js,
  ButtonGroupvue_type_template_id_aee8964e_render,
  ButtonGroupvue_type_template_id_aee8964e_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const ButtonGroup = (ButtonGroup_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Spinner.vue?vue&type=template&id=a6fff878
var Spinnervue_type_template_id_a6fff878_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "tvjs-spinner"
  }, _vm._l(4, function (i) {
    return _c("div", {
      key: i,
      style: {
        background: _vm.colors.text
      }
    });
  }), 0);
};
var Spinnervue_type_template_id_a6fff878_staticRenderFns = [];
Spinnervue_type_template_id_a6fff878_render._withStripped = true;

;// ./src/components/Spinner.vue?vue&type=template&id=a6fff878

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Spinner.vue?vue&type=script&lang=js
/* harmony default export */ const Spinnervue_type_script_lang_js = ({
  name: 'Spinner',
  props: ['colors']
});
;// ./src/components/Spinner.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Spinnervue_type_script_lang_js = (Spinnervue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Spinner.vue?vue&type=style&index=0&id=a6fff878&prod&lang=css
var Spinnervue_type_style_index_0_id_a6fff878_prod_lang_css = __webpack_require__(688);
;// ./src/components/Spinner.vue?vue&type=style&index=0&id=a6fff878&prod&lang=css

;// ./src/components/Spinner.vue



;


/* normalize component */

var Spinner_component = normalizeComponent(
  components_Spinnervue_type_script_lang_js,
  Spinnervue_type_template_id_a6fff878_render,
  Spinnervue_type_template_id_a6fff878_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Spinner = (Spinner_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Legend.vue?vue&type=script&lang=js


/* harmony default export */ const Legendvue_type_script_lang_js = ({
  name: 'ChartLegend',
  props: ['common', 'values', 'grid_id', 'meta_props', 'layout_override'],
  components: {
    ButtonGroup: ButtonGroup,
    Spinner: Spinner
  },
  computed: {
    ohlcv: function ohlcv() {
      if (!this.$props.values || !this.$props.values.ohlcv) {
        return Array(6).fill('n/a');
      }
      var prec = this.layout.prec;

      // TODO: main the main legend more customizable
      var id = this.main_type + '_0';
      var meta = this.$props.meta_props[id] || {};
      if (meta.legend) {
        return (meta.legend() || []).map(function (x) {
          return x.value;
        });
      }
      return [this.$props.values.ohlcv[1].toFixed(prec), this.$props.values.ohlcv[2].toFixed(prec), this.$props.values.ohlcv[3].toFixed(prec), this.$props.values.ohlcv[4].toFixed(prec), this.$props.values.ohlcv[5] ? this.$props.values.ohlcv[5].toFixed(2) : 'n/a'];
    },
    // TODO: add support for { grid: { id : N }}
    indicators: function indicators() {
      var _this = this;
      var values = this.$props.values;
      var f = this.format;
      var types = {};
      return this.json_data.filter(function (x) {
        return x.settings.legend !== false && !x.main;
      }).map(function (x) {
        if (!(x.type in types)) types[x.type] = 0;
        var id = x.type + "_".concat(types[x.type]++);
        return {
          v: 'display' in x.settings ? x.settings.display : true,
          name: x.name || id,
          index: (_this.off_data || _this.json_data).indexOf(x),
          id: id,
          type: x.type,
          settings: x.settings || {},
          values: values ? f(id, values) : _this.n_a(1),
          unk: !(id in (_this.$props.meta_props || {})),
          loading: x.loading
        };
      });
    },
    calc_style: function calc_style() {
      var top = this.layout.height > 150 ? 10 : 5;
      var grids = this.$props.common.layout.grids;
      var w = grids[0] ? grids[0].width : undefined;
      return {
        top: "".concat(this.layout.offset + top, "px"),
        width: "".concat(w - 20, "px")
      };
    },
    layout: function layout() {
      var id = this.$props.grid_id;
      // Use layout override if available (for resize operations)
      if (this.$props.layout_override) {
        return this.$props.layout_override.grids[id];
      }
      return this.$props.common.layout.grids[id];
    },
    json_data: function json_data() {
      return this.$props.common.data;
    },
    off_data: function off_data() {
      return this.$props.common.offchart;
    },
    main_type: function main_type() {
      var f = this.common.data.find(function (x) {
        return x.main;
      });
      return f ? f.type : undefined;
    },
    show_values: function show_values() {
      return this.common.cursor.mode !== 'explore';
    }
  },
  methods: {
    format: function format(id, values) {
      var meta = this.$props.meta_props[id] || {};
      // Matches Overlay.data_colors with the data values
      // (see Spline.vue)
      if (!values[id]) return this.n_a(1);

      // Custom formatter
      if (meta.legend) return meta.legend(values[id]);
      return values[id].slice(1).map(function (x, i) {
        var cs = meta.data_colors ? meta.data_colors() : [];
        if (typeof x == 'number') {
          // Show 8 digits for small values
          x = x.toFixed(Math.abs(x) > 0.001 ? 4 : 8);
        }
        return {
          value: x,
          color: cs ? cs[i % cs.length] : undefined
        };
      });
    },
    n_a: function n_a(len) {
      return Array(len).fill({
        value: 'n/a'
      });
    },
    button_click: function button_click(event) {
      this.$emit('legend-button-click', event);
    },
    // Handle double-click on legend to minimize/expand off-chart grids
    on_dblclick: function on_dblclick(e) {
      var grid_id = this.$props.grid_id;
      // Only trigger for off-chart grids (grid_id > 0)
      if (grid_id > 0) {
        e.preventDefault();
        e.stopPropagation();
        this.$emit('legend-dblclick', grid_id);
      }
    },
    openSettings: function openSettings(indicator) {
      // Emit event to open settings modal at App.vue level
      this.$emit('open-indicator-settings', {
        name: indicator.name,
        type: indicator.type,
        index: indicator.index,
        settings: indicator.settings,
        gridId: this.$props.grid_id
      });
    }
  }
});
;// ./src/components/Legend.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Legendvue_type_script_lang_js = (Legendvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Legend.vue?vue&type=style&index=0&id=c3c5e6c2&prod&lang=css
var Legendvue_type_style_index_0_id_c3c5e6c2_prod_lang_css = __webpack_require__(990);
;// ./src/components/Legend.vue?vue&type=style&index=0&id=c3c5e6c2&prod&lang=css

;// ./src/components/Legend.vue



;


/* normalize component */

var Legend_component = normalizeComponent(
  components_Legendvue_type_script_lang_js,
  Legendvue_type_template_id_c3c5e6c2_render,
  Legendvue_type_template_id_c3c5e6c2_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Legend = (Legend_component.exports);
;// ./src/mixins/shaders.js
function shaders_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = shaders_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function shaders_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return shaders_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? shaders_arrayLikeToArray(r, a) : void 0; } }
function shaders_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Parser for shader events

/* harmony default export */ const shaders = ({
  methods: {
    // Init shaders from extensions
    init_shaders: function init_shaders(skin, prev) {
      if (skin !== prev) {
        if (prev) this.shaders = this.shaders.filter(function (x) {
          return x.owner !== prev.id;
        });
        var _iterator = shaders_createForOfIteratorHelper(skin.shaders),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var Shader = _step.value;
            var shader = new Shader();
            shader.owner = skin.id;
            this.shaders.push(shader);
          }
          // TODO: Sort by zIndex
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    },
    on_shader_event: function on_shader_event(d, target) {
      if (d.event === 'new-shader') {
        if (d.args[0].target === target) {
          d.args[0].id = "".concat(d.args[1], "-").concat(d.args[2]);
          this.shaders.push(d.args[0]);
          this.rerender++;
        }
      }
      if (d.event === 'remove-shaders') {
        var id = d.args.join('-');
        this.shaders = this.shaders.filter(function (x) {
          return x.id !== id;
        });
      }
    }
  },
  watch: {
    skin: function skin(n, p) {
      this.init_shaders(n, p);
    }
  },
  data: function data() {
    return {
      shaders: []
    };
  }
});
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Section.vue?vue&type=script&lang=js





/* harmony default export */ const Sectionvue_type_script_lang_js = ({
  name: 'GridSection',
  props: ['common', 'grid_id'],
  mixins: [shaders],
  components: {
    Grid: components_Grid,
    Sidebar: components_Sidebar,
    ChartLegend: Legend
  },
  mounted: function mounted() {
    this.init_shaders(this.$props.common.skin);
  },
  methods: {
    range_changed: function range_changed(r) {
      this.$emit('range-changed', r);
    },
    cursor_changed: function cursor_changed(c) {
      c.grid_id = this.$props.grid_id;
      this.$emit('cursor-changed', c);
    },
    cursor_locked: function cursor_locked(state) {
      this.$emit('cursor-locked', state);
    },
    sidebar_transform: function sidebar_transform(s) {
      this.$emit('sidebar-transform', s);
    },
    emit_meta_props: function emit_meta_props(d) {
      this.$set(this.meta_props, d.layer_id, d);
      this.$emit('layer-meta-props', d);
    },
    emit_custom_event: function emit_custom_event(d) {
      this.on_shader_event(d, 'sidebar');
      this.$emit('custom-event', d);
    },
    button_click: function button_click(event) {
      this.$emit('legend-button-click', event);
    },
    legend_dblclick: function legend_dblclick(grid_id) {
      // Emit as custom event to be handled by Chart.vue
      this.$emit('custom-event', {
        event: 'grid-dblclick',
        args: [grid_id]
      });
    },
    register_kb: function register_kb(event) {
      this.$emit('register-kb-listener', event);
    },
    remove_kb: function remove_kb(event) {
      this.$emit('remove-kb-listener', event);
    },
    rezoom_range: function rezoom_range(event) {
      var id = 'sb-' + event.grid_id;
      if (this.$refs[id]) {
        this.$refs[id].renderer.rezoom_range(event.z, event.diff1, event.diff2);
      }
    },
    open_indicator_settings: function open_indicator_settings(indicatorInfo) {
      // Emit as custom event to be handled by Chart.vue -> App.vue
      this.$emit('custom-event', {
        event: 'open-indicator-settings',
        args: [indicatorInfo]
      });
    },
    ghash: function ghash(val) {
      // Measures grid heights configuration
      var hs = val.layout.grids.map(function (x) {
        return x.height;
      });
      return hs.reduce(function (a, b) {
        return a + b;
      }, '');
    },
    // Update legend position during resize using layoutOverride
    updateLegendPosition: function updateLegendPosition(layout) {
      var id = this.$props.grid_id;
      var grid = layout ? layout.grids[id] : null;
      if (grid) {
        // Set layout override so legend_props uses correct layout
        this.legendLayoutOverride = layout;
        this.$forceUpdate();
      }
    },
    // Clear the layout override (called after normal layout update)
    clearLayoutOverride: function clearLayoutOverride() {
      this.legendLayoutOverride = null;
    }
  },
  computed: {
    // Component-specific props subsets:
    grid_props: function grid_props() {
      var id = this.$props.grid_id;
      var p = Object.assign({}, this.$props.common);

      // Split offchart data between offchart grids
      if (id > 0) {
        var _p$data;
        var all = p.data;
        p.data = [p.data[id - 1]];
        // Merge offchart overlays with custom ids with
        // the existing onse (by comparing the grid ids)
        (_p$data = p.data).push.apply(_p$data, _toConsumableArray(all.filter(function (x) {
          return x.grid && x.grid.id === id;
        })));
      }
      p.width = p.layout.grids[id].width;
      p.height = p.layout.grids[id].height;
      p.y_transform = p.y_ts[id];
      p.shaders = this.grid_shaders;
      return p;
    },
    sidebar_props: function sidebar_props() {
      var id = this.$props.grid_id;
      var p = Object.assign({}, this.$props.common);
      p.width = p.layout.grids[id].sb;
      p.height = p.layout.grids[id].height;
      p.y_transform = p.y_ts[id];
      p.shaders = this.sb_shaders;
      return p;
    },
    section_values: function section_values() {
      var id = this.$props.grid_id;
      var p = Object.assign({}, this.$props.common);
      p.width = p.layout.grids[id].width;
      return p.cursor.values[id];
    },
    legend_props: function legend_props() {
      var id = this.$props.grid_id;
      var p = Object.assign({}, this.$props.common);

      // Split offchart data between offchart grids
      if (id > 0) {
        var _p$data2;
        var all = p.data;
        p.offchart = all;
        p.data = [p.data[id - 1]];
        (_p$data2 = p.data).push.apply(_p$data2, _toConsumableArray(all.filter(function (x) {
          return x.grid && x.grid.id === id;
        })));
      }
      return p;
    },
    get_meta_props: function get_meta_props() {
      return this.meta_props;
    },
    grid_shaders: function grid_shaders() {
      return this.shaders.filter(function (x) {
        return x.target === 'grid';
      });
    },
    sb_shaders: function sb_shaders() {
      return this.shaders.filter(function (x) {
        return x.target === 'sidebar';
      });
    }
  },
  watch: {
    common: {
      handler: function handler(val, old_val) {
        var newhash = this.ghash(val);
        if (newhash !== this.last_ghash) {
          this.rerender++;
        }
        if (val.data.length !== old_val.data.length) {
          // Look at this nasty trick!
          this.rerender++;
        }
        this.last_ghash = newhash;
      },
      deep: true
    }
  },
  data: function data() {
    return {
      meta_props: {},
      rerender: 0,
      last_ghash: '',
      legendLayoutOverride: null
    };
  }
});
;// ./src/components/Section.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Sectionvue_type_script_lang_js = (Sectionvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Section.vue?vue&type=style&index=0&id=385f395d&prod&lang=css
var Sectionvue_type_style_index_0_id_385f395d_prod_lang_css = __webpack_require__(183);
;// ./src/components/Section.vue?vue&type=style&index=0&id=385f395d&prod&lang=css

;// ./src/components/Section.vue



;


/* normalize component */

var Section_component = normalizeComponent(
  components_Sectionvue_type_script_lang_js,
  Sectionvue_type_template_id_385f395d_render,
  Sectionvue_type_template_id_385f395d_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Section = (Section_component.exports);
;// ./src/components/js/botbar.js


function botbar_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = botbar_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function botbar_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return botbar_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? botbar_arrayLikeToArray(r, a) : void 0; } }
function botbar_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }



var botbar_MINUTE15 = constants.MINUTE15,
  botbar_MINUTE = constants.MINUTE,
  botbar_HOUR = constants.HOUR,
  botbar_DAY = constants.DAY,
  botbar_WEEK = constants.WEEK,
  botbar_MONTH = constants.MONTH,
  botbar_YEAR = constants.YEAR,
  botbar_MONTHMAP = constants.MONTHMAP;
var Botbar = /*#__PURE__*/function () {
  function Botbar(canvas, comp) {
    classCallCheck_classCallCheck(this, Botbar);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.comp = comp;
    this.$p = comp.$props;
    this.data = this.$p.sub;
    this.range = this.$p.range;
    this.layout = this.$p.layout;
    this.MIN_ZOOM = comp.config.MIN_ZOOM;
    this.MAX_ZOOM = comp.config.MAX_ZOOM;
    this.listeners();
  }
  return createClass_createClass(Botbar, [{
    key: "listeners",
    value: function listeners() {
      var _this = this;
      this.hm = hamster_default()(this.canvas);
      this.hm.wheel(function (event, delta) {
        return _this.mousezoom(-delta * 50, event);
      });
    }
  }, {
    key: "mousezoom",
    value: function mousezoom(delta, event) {
      event.originalEvent.preventDefault();
      event.preventDefault();
      var dominated = this.data.length;
      if (delta < 0 && dominated <= this.MIN_ZOOM) return;
      if (delta > 0 && dominated > this.MAX_ZOOM) return;
      delta = utils.smart_wheel(delta);
      var interval = this.$p.interval;
      var k = interval / 1000;
      var diff = delta * k * dominated;

      // Zoom from center of x-axis
      this.range[0] -= diff * 0.5;
      this.range[1] += diff * 0.5;
      this.comp.$emit('botbar-zoom', this.range);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.hm) this.hm.unwheel();
    }
  }, {
    key: "update",
    value: function update() {
      this.grid_0 = this.layout.grids[0];
      var width = this.layout.botbar.width;
      var height = this.layout.botbar.height;
      var sb = this.layout.grids[0].sb;

      //this.ctx.fillStyle = this.$p.colors.back
      this.ctx.font = this.$p.font;
      //this.ctx.fillRect(0, 0, width, height)
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.strokeStyle = this.$p.colors.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0.5);
      this.ctx.lineTo(Math.floor(width + 1), 0.5);
      this.ctx.stroke();
      this.ctx.fillStyle = this.$p.colors.text;
      this.ctx.beginPath();
      var _iterator = botbar_createForOfIteratorHelper(this.layout.botbar.xs),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var p = _step.value;
          var lbl = this.format_date(p);
          if (p[0] > width - sb) continue;
          this.ctx.moveTo(p[0] - 0.5, 0);
          this.ctx.lineTo(p[0] - 0.5, 4.5);
          if (!this.lbl_highlight(p[1][0])) {
            this.ctx.globalAlpha = 0.85;
          }
          this.ctx.textAlign = 'center';
          this.ctx.fillText(lbl, p[0], 18);
          this.ctx.globalAlpha = 1;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      this.ctx.stroke();
      this.apply_shaders();
      if (this.$p.cursor.x && this.$p.cursor.t !== undefined) this.panel();
    }
  }, {
    key: "apply_shaders",
    value: function apply_shaders() {
      var layout = this.layout.grids[0];
      var props = {
        layout: layout,
        cursor: this.$p.cursor
      };
      var _iterator2 = botbar_createForOfIteratorHelper(this.comp.bot_shaders),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var s = _step2.value;
          this.ctx.save();
          s.draw(this.ctx, props);
          this.ctx.restore();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }, {
    key: "panel",
    value: function panel() {
      var lbl = this.format_cursor_x();
      this.ctx.fillStyle = this.$p.colors.panel;
      var measure = this.ctx.measureText(lbl + '    ');
      var panwidth = Math.floor(measure.width);
      var cursor = this.$p.cursor.x;
      var x = Math.floor(cursor - panwidth * 0.5);
      var y = -0.5;
      var panheight = this.comp.config.PANHEIGHT;
      this.ctx.fillRect(x, y, panwidth, panheight + 0.5);
      this.ctx.fillStyle = this.$p.colors.textHL;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(lbl, cursor, y + 16);
    }
  }, {
    key: "format_date",
    value: function format_date(p) {
      var t = p[1][0];
      t = this.grid_0.ti_map.i2t(t);
      var ti = this.$p.layout.grids[0].ti_map.tf;
      // Enable timezones only for tf < 1D
      var k = ti < botbar_DAY ? 1 : 0;
      var tZ = t + k * this.$p.timezone * botbar_HOUR;

      //t += new Date(t).getTimezoneOffset() * MINUTE
      var d = new Date(tZ);
      if (p[2] === botbar_YEAR || utils.year_start(t) === t) {
        return d.getUTCFullYear();
      }
      if (p[2] === botbar_MONTH || utils.month_start(t) === t) {
        return botbar_MONTHMAP[d.getUTCMonth()];
      }
      // TODO(*) see grid_maker.js
      if (utils.day_start(tZ) === tZ) return d.getUTCDate();
      var h = utils.add_zero(d.getUTCHours());
      var m = utils.add_zero(d.getUTCMinutes());
      return h + ":" + m;
    }
  }, {
    key: "format_cursor_x",
    value: function format_cursor_x() {
      var t = this.$p.cursor.t;
      t = this.grid_0.ti_map.i2t(t);
      //let ti = this.$p.interval
      var ti = this.$p.layout.grids[0].ti_map.tf;
      // Enable timezones only for tf < 1D
      var k = ti < botbar_DAY ? 1 : 0;

      //t += new Date(t).getTimezoneOffset() * MINUTE
      var d = new Date(t + k * this.$p.timezone * botbar_HOUR);
      if (ti === botbar_YEAR) {
        return d.getUTCFullYear();
      }
      if (ti < botbar_YEAR) {
        var yr = '`' + "".concat(d.getUTCFullYear()).slice(-2);
        var mo = botbar_MONTHMAP[d.getUTCMonth()];
        var dd = '01';
      }
      if (ti <= botbar_WEEK) dd = d.getUTCDate();
      var date = "".concat(dd, " ").concat(mo, " ").concat(yr);
      var time = '';
      if (ti < botbar_DAY) {
        var h = utils.add_zero(d.getUTCHours());
        var m = utils.add_zero(d.getUTCMinutes());
        time = h + ":" + m;
      }
      return "".concat(date, "  ").concat(time);
    }

    // Highlights the begining of a time interval
    // TODO: improve. Problem: let's say we have a new month,
    // but if there is no grid line in place, there
    // will be no month name on t-axis. Sad.
    // Solution: manipulate the grid, skew it, you know
  }, {
    key: "lbl_highlight",
    value: function lbl_highlight(t) {
      var ti = this.$p.interval;
      if (t === 0) return true;
      if (utils.month_start(t) === t) return true;
      if (utils.day_start(t) === t) return true;
      if (ti <= botbar_MINUTE15 && t % botbar_HOUR === 0) return true;
      return false;
    }
  }, {
    key: "mousemove",
    value: function mousemove() {}
  }, {
    key: "mouseout",
    value: function mouseout() {}
  }, {
    key: "mouseup",
    value: function mouseup() {}
  }, {
    key: "mousedown",
    value: function mousedown() {}
  }]);
}();

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Botbar.vue?vue&type=script&lang=js
// The bottom bar (yep, that thing with a bunch of dates)



/* harmony default export */ const Botbarvue_type_script_lang_js = ({
  name: 'Botbar',
  props: ['sub', 'layout', 'range', 'interval', 'cursor', 'colors', 'font', 'width', 'height', 'rerender', 'tv_id', 'config', 'shaders', 'timezone'],
  mixins: [canvas],
  mounted: function mounted() {
    var el = this.$refs['canvas'];
    this.renderer = new Botbar(el, this);
    this.setup();
    this.redraw();
  },
  beforeDestroy: function beforeDestroy() {
    if (this.renderer) this.renderer.destroy();
  },
  render: function render(h) {
    var sett = this.$props.layout.botbar;
    return this.create_canvas(h, 'botbar', {
      position: {
        x: 0,
        y: sett.offset || 0
      },
      attrs: {
        rerender: this.$props.rerender,
        width: sett.width,
        height: sett.height
      },
      style: {
        backgroundColor: this.$props.colors.back
      }
    });
  },
  computed: {
    bot_shaders: function bot_shaders() {
      return this.$props.shaders.filter(function (x) {
        return x.target === 'botbar';
      });
    }
  },
  watch: {
    range: {
      handler: function handler() {
        this.redraw();
      },
      deep: true
    },
    cursor: {
      handler: function handler() {
        this.redraw();
      },
      deep: true
    },
    rerender: function rerender() {
      var _this = this;
      this.$nextTick(function () {
        return _this.redraw();
      });
    }
  }
});
;// ./src/components/Botbar.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Botbarvue_type_script_lang_js = (Botbarvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Botbar.vue?vue&type=style&index=0&id=68c14f0e&prod&lang=css
var Botbarvue_type_style_index_0_id_68c14f0e_prod_lang_css = __webpack_require__(568);
;// ./src/components/Botbar.vue?vue&type=style&index=0&id=68c14f0e&prod&lang=css

;// ./src/components/Botbar.vue
var Botbar_render, Botbar_staticRenderFns
;

;


/* normalize component */

var Botbar_component = normalizeComponent(
  components_Botbarvue_type_script_lang_js,
  Botbar_render,
  Botbar_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const components_Botbar = (Botbar_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Keyboard.vue?vue&type=script&lang=js
/* harmony default export */ const Keyboardvue_type_script_lang_js = ({
  name: 'Keyboard',
  created: function created() {
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
    window.addEventListener('keypress', this.keypress);
    this._listeners = {};
  },
  beforeDestroy: function beforeDestroy() {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    window.removeEventListener('keypress', this.keypress);
  },
  render: function render(h) {
    return h();
  },
  methods: {
    keydown: function keydown(event) {
      for (var id in this._listeners) {
        var l = this._listeners[id];
        if (l && l.keydown) {
          l.keydown(event);
        } else {
          console.warn("No 'keydown' listener for ".concat(id));
        }
      }
    },
    keyup: function keyup(event) {
      for (var id in this._listeners) {
        var l = this._listeners[id];
        if (l && l.keyup) {
          l.keyup(event);
        } else {
          console.warn("No 'keyup' listener for ".concat(id));
        }
      }
    },
    keypress: function keypress(event) {
      for (var id in this._listeners) {
        var l = this._listeners[id];
        if (l && l.keypress) {
          l.keypress(event);
        } else {
          console.warn("No 'keypress' listener for ".concat(id));
        }
      }
    },
    register: function register(listener) {
      this._listeners[listener.id] = listener;
    },
    remove: function remove(listener) {
      delete this._listeners[listener.id];
    }
  }
});
;// ./src/components/Keyboard.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Keyboardvue_type_script_lang_js = (Keyboardvue_type_script_lang_js); 
;// ./src/components/Keyboard.vue
var Keyboard_render, Keyboard_staticRenderFns
;



/* normalize component */
;
var Keyboard_component = normalizeComponent(
  components_Keyboardvue_type_script_lang_js,
  Keyboard_render,
  Keyboard_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Keyboard = (Keyboard_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/GridResizer.vue?vue&type=template&id=73b31eb0
var GridResizervue_type_template_id_73b31eb0_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "grid-resizer",
    "class": {
      dragging: _vm.dragging
    },
    style: _vm.resizerStyle,
    on: {
      mousedown: _vm.onMouseDown,
      dblclick: _vm.onDoubleClick
    }
  }, [_c("div", {
    staticClass: "resizer-line",
    style: _vm.lineStyle
  }), _vm._v(" "), _c("div", {
    staticClass: "resizer-hitbox"
  })]);
};
var GridResizervue_type_template_id_73b31eb0_staticRenderFns = [];
GridResizervue_type_template_id_73b31eb0_render._withStripped = true;

;// ./src/components/GridResizer.vue?vue&type=template&id=73b31eb0

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/GridResizer.vue?vue&type=script&lang=js
/* harmony default export */ const GridResizervue_type_script_lang_js = ({
  name: 'GridResizer',
  props: ['grid_id', 'layout', 'colors'],
  mounted: function mounted() {},
  data: function data() {
    return {
      dragging: false,
      startY: 0,
      startHeights: []
    };
  },
  computed: {
    resizerStyle: function resizerStyle() {
      var grid = this.layout.grids[this.grid_id];
      if (!grid) return {};
      return {
        top: grid.offset - 6 + 'px',
        left: '0px',
        width: grid.width + 'px' // Chart area only, not including sidebar
      };
    },
    lineStyle: function lineStyle() {
      var _this$colors;
      var baseColor = ((_this$colors = this.colors) === null || _this$colors === void 0 ? void 0 : _this$colors.scale) || '#555';
      return {
        background: baseColor
      };
    }
  },
  methods: {
    onMouseDown: function onMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      this.dragging = true;
      this.startY = e.clientY;

      // Store starting heights of this grid and the one above
      var grids = this.layout.grids;
      this.startHeights = grids.map(function (g) {
        return g.height;
      });
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    onMouseMove: function onMouseMove(e) {
      if (!this.dragging) return;
      var deltaY = e.clientY - this.startY;
      var gridAbove = this.grid_id - 1;
      var gridBelow = this.grid_id;

      // Calculate new heights
      var minHeight = 28; // Minimum grid height (matches MINIMIZED_HEIGHT)
      var newHeightAbove = this.startHeights[gridAbove] + deltaY;
      var newHeightBelow = this.startHeights[gridBelow] - deltaY;

      // Enforce minimum heights
      if (newHeightAbove < minHeight) {
        newHeightBelow = this.startHeights[gridBelow] + (this.startHeights[gridAbove] - minHeight);
        newHeightAbove = minHeight;
      }
      if (newHeightBelow < minHeight) {
        newHeightAbove = this.startHeights[gridAbove] + (this.startHeights[gridBelow] - minHeight);
        newHeightBelow = minHeight;
      }
      this.$emit('resize-grids', {
        gridAbove: gridAbove,
        gridBelow: gridBelow,
        heightAbove: newHeightAbove,
        heightBelow: newHeightBelow
      });
    },
    onMouseUp: function onMouseUp() {
      this.dragging = false;
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      this.$emit('resize-complete');
    },
    onDoubleClick: function onDoubleClick(e) {
      e.preventDefault();
      e.stopPropagation();
      // Toggle minimize for the grid below this separator
      this.$emit('toggle-minimize', this.grid_id);
    }
  },
  beforeDestroy: function beforeDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
});
;// ./src/components/GridResizer.vue?vue&type=script&lang=js
 /* harmony default export */ const components_GridResizervue_type_script_lang_js = (GridResizervue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/GridResizer.vue?vue&type=style&index=0&id=73b31eb0&prod&lang=css
var GridResizervue_type_style_index_0_id_73b31eb0_prod_lang_css = __webpack_require__(702);
;// ./src/components/GridResizer.vue?vue&type=style&index=0&id=73b31eb0&prod&lang=css

;// ./src/components/GridResizer.vue



;


/* normalize component */

var GridResizer_component = normalizeComponent(
  components_GridResizervue_type_script_lang_js,
  GridResizervue_type_template_id_73b31eb0_render,
  GridResizervue_type_template_id_73b31eb0_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const GridResizer = (GridResizer_component.exports);
;// ./src/mixins/datatrack.js
// Data tracker/watcher


/* harmony default export */ const datatrack = ({
  methods: {
    data_changed: function data_changed() {
      var n = this.ohlcv;
      var changed = false;
      if (this._data_n0 !== n[0] && this._data_len !== n.length) {
        changed = true;
      }
      this.check_all_data(changed);
      if (this.ti_map.ib) {
        this.reindex_delta(n[0], this._data_n0);
      }
      this._data_n0 = n[0];
      this._data_len = n.length;
      this.save_data_t();
      return changed;
    },
    check_all_data: function check_all_data(changed) {
      // If length of data in the Structure changed by > 1 point
      // emit a special event for DC to recalc the scripts
      // TODO: check overlays data too
      var len = this._data_len || 0;
      if (Math.abs(this.ohlcv.length - len) > 1 || this._data_n0 !== this.ohlcv[0]) {
        this.$emit('custom-event', {
          event: 'data-len-changed',
          args: []
        });
      }
    },
    reindex_delta: function reindex_delta(n, p) {
      n = n || [[0]];
      p = p || [[0]];
      var dt = n[0] - p[0];
      if (dt !== 0 && this._data_t) {
        // Convert t back to index
        try {
          // More precise method first
          var nt = this._data_t + 0.01; // fix for the filter lib
          var res = utils.fast_nearest(this.ohlcv, nt);
          var cndl = this.ohlcv[res[0]];
          var off = (nt - cndl[0]) / this.interval_ms;
          this["goto"](res[0] + off);
        } catch (e) {
          this["goto"](this.ti_map.t2i(this._data_t));
        }
      }
    },
    save_data_t: function save_data_t() {
      this._data_t = this.ti_map.i2t(this.range[1]); // save as t
    }
  },
  data: function data() {
    return {
      _data_n0: null,
      _data_len: 0,
      _data_t: 0
    };
  }
});
;// ./src/components/js/ti_mapping.js




// Time-index mapping (for non-linear t-axis)


var MAX_ARR = Math.pow(2, 32);

// 3 MODES of index calculation for overlays/subcharts:
// ::: indexSrc :::
// * "map"      -> use TI mapping functions to detect index
//                 (slowest, for stocks only. DEFAULT)
//
// * "calc"     -> calculate shift between sub & data
//                 (faster, but overlay data should be perfectly
//                  align with the main chart,
//                  1-1 candle/data point. Supports Renko)
//
// * "data"     -> overlay data should come with candle index
//                 (fastest, supports Renko)
var TI = /*#__PURE__*/function () {
  function TI() {
    classCallCheck_classCallCheck(this, TI);
    this.ib = false;
  }
  return createClass_createClass(TI, [{
    key: "init",
    value: function init(params, res) {
      var sub = params.sub,
        interval = params.interval,
        meta = params.meta,
        $p = params.$props,
        interval_ms = params.interval_ms,
        sub_start = params.sub_start,
        ib = params.ib;
      this.ti_map = [];
      this.it_map = [];
      this.sub_i = [];
      this.ib = ib;
      this.sub = res;
      this.ss = sub_start;
      this.tf = interval_ms;
      var start = meta.sub_start;

      // Skip mapping for the regular mode
      if (this.ib) {
        this.map_sub(res);
      }
    }

    // Make maps for the main subset
  }, {
    key: "map_sub",
    value: function map_sub(res) {
      for (var i = 0; i < res.length; i++) {
        var t = res[i][0];
        var _i = this.ss + i;
        this.ti_map[t] = _i;
        this.it_map[_i] = t;

        // Overwrite t with i
        var copy = _toConsumableArray(res[i]);
        copy[0] = _i;
        this.sub_i.push(copy);
      }
    }

    // Map overlay data
    // TODO: parse() called 3 times instead of 2 for 'spx_sample.json'
  }, {
    key: "parse",
    value: function parse(data, mode) {
      if (!this.ib || !this.sub[0] || mode === 'data') return data;
      var res = [];
      var k = 0; // Candlestick index

      if (mode === 'calc') {
        var shift = utils.index_shift(this.sub, data);
        for (var i = 0; i < data.length; i++) {
          var _i = this.ss + i;
          var copy = _toConsumableArray(data[i]);
          copy[0] = _i + shift;
          res.push(copy);
        }
        return res;
      }

      // If indicator data starts after ohlcv, calc the first index
      if (data.length) {
        try {
          var k1 = utils.fast_nearest(this.sub, data[0][0])[0];
          if (k1 !== null && k1 >= 0) k = k1;
        } catch (e) {}
      }
      var t0 = this.sub[0][0];
      var tN = this.sub[this.sub.length - 1][0];
      for (var i = 0; i < data.length; i++) {
        var _copy = _toConsumableArray(data[i]);
        var tk = this.sub[k][0];
        var t = data[i][0];
        var index = this.ti_map[t];
        if (index === undefined) {
          // Linear extrapolation
          if (t < t0 || t > tN) {
            index = this.ss + k - (tk - t) / this.tf;
            t = data[i + 1] ? data[i + 1][0] : undefined;
          }

          // Linear interpolation
          else {
            var tk2 = this.sub[k + 1][0];
            index = tk === tk2 ? this.ss + k : this.ss + k + (t - tk) / (tk2 - tk);
            t = data[i + 1] ? data[i + 1][0] : undefined;
          }
        }
        // Race of data points & sub points (ohlcv)
        // (like turn based increments)
        while (k + 1 < this.sub.length - 1 && t > this.sub[k + 1][0]) {
          k++;
          tk = this.sub[k][0];
        }
        _copy[0] = index;
        res.push(_copy);
      }
      return res;
    }

    // index => time
  }, {
    key: "i2t",
    value: function i2t(i) {
      if (!this.ib || !this.sub.length) return i; // Regular mode

      // Discrete mapping
      var res = this.it_map[i];
      if (res !== undefined) return res;
      // Linear extrapolation
      else if (i >= this.ss + this.sub_i.length) {
        var di = i - (this.ss + this.sub_i.length) + 1;
        var last = this.sub[this.sub.length - 1];
        return last[0] + di * this.tf;
      } else if (i < this.ss) {
        var _di = i - this.ss;
        return this.sub[0][0] + _di * this.tf;
      }

      // Linear Interpolation
      var i1 = Math.floor(i) - this.ss;
      var i2 = i1 + 1;
      var len = this.sub.length;
      if (i2 >= len) i2 = len - 1;
      var sub1 = this.sub[i1];
      var sub2 = this.sub[i2];
      if (sub1 && sub2) {
        var t1 = sub1[0];
        var t2 = sub2[0];
        return t1 + (t2 - t1) * (i - i1 - this.ss);
      }
      return undefined;
    }

    // Map or bypass depending on the mode
  }, {
    key: "i2t_mode",
    value: function i2t_mode(i, mode) {
      return mode === 'data' ? i : this.i2t(i);
    }

    // time => index
    // TODO: when switch from IB mode to regular tools
    // disappear (bc there is no more mapping)
  }, {
    key: "t2i",
    value: function t2i(t) {
      if (!this.sub.length) return undefined;

      // Discrete mapping
      var res = this.ti_map[t];
      if (res !== undefined) return res;
      var t0 = this.sub[0][0];
      var tN = this.sub[this.sub.length - 1][0];

      // Linear extrapolation
      if (t < t0) {
        return this.ss - (t0 - t) / this.tf;
      } else if (t > tN) {
        var k = this.sub.length - 1;
        return this.ss + k - (tN - t) / this.tf;
      }
      try {
        // Linear Interpolation
        var i = utils.fast_nearest(this.sub, t);
        var tk = this.sub[i[0]][0];
        var tk2 = this.sub[i[1]][0];
        var _k = (t - tk) / (tk2 - tk);
        return this.ss + i[0] + _k * (i[1] - i[0]);
      } catch (e) {}
      return undefined;
    }

    // Auto detect: is it time or index?
    // Assuming that index-based mode is ON
  }, {
    key: "smth2i",
    value: function smth2i(smth) {
      if (smth > MAX_ARR) {
        return this.t2i(smth); // it was time
      } else {
        return smth; // it was an index
      }
    }
  }, {
    key: "smth2t",
    value: function smth2t(smth) {
      if (smth < MAX_ARR) {
        return this.i2t(smth); // it was an index
      } else {
        return smth; // it was time
      }
    }

    // Global Time => Index (uses all data, approx. method)
    // Used by tv.goto()
  }, {
    key: "gt2i",
    value: function gt2i(smth, ohlcv) {
      if (smth > MAX_ARR) {
        var E = 0.1; // Fixes the arrayslicer bug
        var _Utils$fast_nearest = utils.fast_nearest(ohlcv, smth + E),
          _Utils$fast_nearest2 = _slicedToArray(_Utils$fast_nearest, 2),
          i1 = _Utils$fast_nearest2[0],
          i2 = _Utils$fast_nearest2[1];
        if (typeof i1 === 'number') {
          return i1;
        } else {
          return this.t2i(smth); // fallback
        }
      } else {
        return smth; // it was an index
      }
    }
  }]);
}();

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Chart.vue?vue&type=script&lang=js














/* harmony default export */ const Chartvue_type_script_lang_js = ({
  name: 'Chart',
  props: ['title_txt', 'data', 'width', 'height', 'font', 'colors', 'overlays', 'tv_id', 'config', 'buttons', 'toolbar', 'ib', 'skin', 'timezone'],
  mixins: [shaders, datatrack],
  components: {
    GridSection: Section,
    Botbar: components_Botbar,
    Keyboard: Keyboard,
    GridResizer: GridResizer
  },
  created: function created() {
    // Context for text measurements
    this.ctx = new context(this.$props);

    // Initial layout (All measurments for the chart)
    this.init_range();
    this.sub = this.subset();
    utils.overwrite(this.range, this.range); // Fix for IB mode
    this._layout = new js_layout(this);

    // Updates current cursor values
    this.updater = new updater(this);
    this.update_last_values();
    this.init_shaders(this.skin);
  },
  methods: {
    range_changed: function range_changed(r) {
      // Overwite & keep the original references
      // Quick fix for IB mode (switch 2 next lines)
      // TODO: wtf?
      var sub = this.subset(r);
      utils.overwrite(this.range, r);
      utils.overwrite(this.sub, sub);
      this.update_layout();
      this.$emit('range-changed', r);
      if (this.$props.ib) this.save_data_t();
    },
    "goto": function goto(t) {
      var dt = this.range[1] - this.range[0];
      this.range_changed([t - dt, t]);
    },
    setRange: function setRange(t1, t2) {
      this.range_changed([t1, t2]);
    },
    cursor_changed: function cursor_changed(e) {
      if (e.mode) this.cursor.mode = e.mode;
      if (this.cursor.mode !== 'explore') {
        this.updater.sync(e);
      }
      if (this._hook_xchanged) this.ce('?x-changed', e);
    },
    cursor_locked: function cursor_locked(state) {
      if (this.cursor.scroll_lock && state) return;
      this.cursor.locked = state;
      if (this._hook_xlocked) this.ce('?x-locked', state);
    },
    calc_interval: function calc_interval() {
      var _this = this;
      var tf = utils.parse_tf(this.forced_tf);
      if (this.ohlcv.length < 2 && !tf) return;
      this.interval_ms = tf || utils.detect_interval(this.ohlcv);
      this.interval = this.$props.ib ? 1 : this.interval_ms;
      utils.warn(function () {
        return _this.$props.ib && !_this.chart.tf;
      }, constants.IB_TF_WARN, constants.SECOND);
    },
    set_ytransform: function set_ytransform(s) {
      var obj = this.y_transforms[s.grid_id] || {};
      Object.assign(obj, s);
      this.$set(this.y_transforms, s.grid_id, obj);
      this.update_layout();
      utils.overwrite(this.range, this.range);
    },
    default_range: function default_range() {
      var dl = this.$props.config.DEFAULT_LEN;
      var ml = this.$props.config.MINIMUM_LEN + 0.5;
      var l = this.ohlcv.length - 1;
      if (this.ohlcv.length < 2) return;
      if (this.ohlcv.length <= dl) {
        var s = 0,
          d = ml;
      } else {
        s = l - dl, d = 0.5;
      }
      if (!this.$props.ib) {
        utils.overwrite(this.range, [this.ohlcv[s][0] - this.interval * d, this.ohlcv[l][0] + this.interval * ml]);
      } else {
        utils.overwrite(this.range, [s - this.interval * d, l + this.interval * ml]);
      }
    },
    subset: function subset(range) {
      if (range === void 0) {
        range = this.range;
      }
      var _this$filter = this.filter(this.ohlcv, range[0] - this.interval, range[1]),
        _this$filter2 = _slicedToArray(_this$filter, 2),
        res = _this$filter2[0],
        index = _this$filter2[1];
      this.ti_map = new TI();
      if (res) {
        this.sub_start = index;
        this.ti_map.init(this, res);
        if (!this.$props.ib) return res || [];
        return this.ti_map.sub_i;
      }
      return [];
    },
    common_props: function common_props() {
      return {
        title_txt: this.chart.name || this.$props.title_txt,
        layout: this._layout,
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
        skin: this.$props.skin
      };
    },
    overlay_subset: function overlay_subset(source, side) {
      var _this2 = this;
      return source.map(function (d, i) {
        var res = utils.fast_filter(d.data, _this2.ti_map.i2t_mode(_this2.range[0] - _this2.interval, d.indexSrc), _this2.ti_map.i2t_mode(_this2.range[1], d.indexSrc));
        return {
          type: d.type,
          name: utils.format_name(d),
          data: _this2.ti_map.parse(res[0] || [], d.indexSrc || 'map'),
          settings: d.settings || _this2.settings_ov,
          grid: d.grid || {},
          tf: utils.parse_tf(d.tf),
          i0: res[1],
          loading: d.loading,
          last: (_this2.last_values[side] || [])[i]
        };
      });
    },
    section_props: function section_props(i) {
      return i === 0 ? this.main_section : this.sub_section;
    },
    init_range: function init_range() {
      this.calc_interval();
      this.default_range();
    },
    layer_meta_props: function layer_meta_props(d) {
      // TODO: check reactivity when layout is changed
      if (!(d.grid_id in this.layers_meta)) {
        this.$set(this.layers_meta, d.grid_id, {});
      }
      this.$set(this.layers_meta[d.grid_id], d.layer_id, d);

      // Rerender
      this.update_layout();
    },
    remove_meta_props: function remove_meta_props(grid_id, layer_id) {
      if (grid_id in this.layers_meta) {
        this.$delete(this.layers_meta[grid_id], layer_id);
      }
    },
    emit_custom_event: function emit_custom_event(d) {
      this.on_shader_event(d, 'botbar');
      this.$emit('custom-event', d);
      if (d.event === 'remove-layer-meta') {
        this.remove_meta_props.apply(this, _toConsumableArray(d.args));
      }
      // Handle double-click on off-chart grid to minimize
      if (d.event === 'grid-dblclick') {
        this.on_toggle_minimize(d.args[0]);
      }
      // Handle double-click on main chart to minimize all off-charts
      if (d.event === 'minimize-all-offcharts') {
        this.minimize_all_offcharts();
      }
      // Handle open indicator settings modal
      if (d.event === 'open-indicator-settings') {
        this.$emit('open-indicator-settings', d.args[0]);
      }
    },
    update_layout: function update_layout(clac_tf, forceResize) {
      if (forceResize === void 0) {
        forceResize = false;
      }
      if (clac_tf) this.calc_interval();
      // Create new layout and assign directly (triggers Vue reactivity)
      this._layout = new js_layout(this);
      this.rerender++;
      var layout = this._layout;
      if (forceResize) {
        // During active resize, force immediate visual updates
        if (this.$refs.sec) {
          this.$refs.sec.forEach(function (section, i) {
            var grid = section && section.$refs.grid;
            var sidebar = section && section.$refs['sb-' + i];
            // Update via resize_from_layout for immediate feedback
            if (grid && grid.resize_from_layout) {
              grid.resize_from_layout(layout);
            }
            if (sidebar && sidebar.resize_from_layout) {
              sidebar.resize_from_layout(layout);
            }
            // Update legend position
            if (section && section.updateLegendPosition) {
              section.updateLegendPosition(layout);
            }
          });
        }
      } else {
        // Normal update - clear any layoutOverride so Vue reactivity takes over
        if (this.$refs.sec) {
          this.$refs.sec.forEach(function (section, i) {
            var grid = section && section.$refs.grid;
            var sidebar = section && section.$refs['sb-' + i];
            if (grid && grid.layoutOverride) {
              grid.layoutOverride = null;
              if (grid.renderer) grid.renderer.layout = layout.grids[i];
            }
            if (sidebar && sidebar.layoutOverride) {
              sidebar.layoutOverride = null;
              if (sidebar.renderer) sidebar.renderer.layout = layout.grids[i];
            }
            // Clear legend layout override
            if (section && section.clearLayoutOverride) {
              section.clearLayoutOverride();
            }
          });
        }
      }
      if (this._hook_update) this.ce('?chart-update', this._layout);
    },
    legend_button_click: function legend_button_click(event) {
      this.$emit('legend-button-click', event);
    },
    register_kb: function register_kb(event) {
      if (!this.$refs.keyboard) return;
      this.$refs.keyboard.register(event);
    },
    remove_kb: function remove_kb(event) {
      if (!this.$refs.keyboard) return;
      this.$refs.keyboard.remove(event);
    },
    update_last_values: function update_last_values() {
      var _this3 = this;
      this.last_candle = this.ohlcv ? this.ohlcv[this.ohlcv.length - 1] : undefined;
      this.last_values = {
        onchart: [],
        offchart: []
      };
      this.onchart.forEach(function (x, i) {
        var d = x.data || [];
        _this3.last_values.onchart[i] = d[d.length - 1];
      });
      this.offchart.forEach(function (x, i) {
        var d = x.data || [];
        _this3.last_values.offchart[i] = d[d.length - 1];
      });
    },
    // Hook events for extensions
    ce: function ce(event) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      this.emit_custom_event({
        event: event,
        args: args
      });
    },
    // Set hooks list (called from an extension)
    hooks: function hooks() {
      var _this4 = this;
      for (var _len2 = arguments.length, list = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        list[_key2] = arguments[_key2];
      }
      list.forEach(function (x) {
        return _this4["_hook_".concat(x)] = true;
      });
    },
    // Grid resize handlers
    on_resize_grids: function on_resize_grids(e) {
      this.isResizing = true;
      this.$set(this.customGridHeights, e.gridAbove, e.heightAbove);
      this.$set(this.customGridHeights, e.gridBelow, e.heightBelow);
      this.update_layout(false, true); // forceResize = true
    },
    on_resize_complete: function on_resize_complete() {
      var _this5 = this;
      // Save heights for restore after minimize
      var grids = this._layout.grids;
      grids.forEach(function (g, i) {
        if (!_this5.minimizedGrids[i]) {
          _this5.$set(_this5.savedGridHeights, i, g.height);
        }
      });
      // End resize mode - layoutOverride stays set until next normal update
      this.isResizing = false;
    },
    on_toggle_minimize: function on_toggle_minimize(gridId) {
      var isMinimized = this.minimizedGrids[gridId];
      if (isMinimized) {
        // Restore from minimized state
        this.$set(this.minimizedGrids, gridId, false);
        // Restore saved height
        if (this.savedGridHeights[gridId]) {
          this.$set(this.customGridHeights, gridId, this.savedGridHeights[gridId]);
        } else {
          this.$delete(this.customGridHeights, gridId);
        }
      } else {
        var _this$_layout$grids$g;
        // Save current height before minimizing
        var currentHeight = (_this$_layout$grids$g = this._layout.grids[gridId]) === null || _this$_layout$grids$g === void 0 ? void 0 : _this$_layout$grids$g.height;
        if (currentHeight) {
          this.$set(this.savedGridHeights, gridId, currentHeight);
        }
        // Minimize
        this.$set(this.minimizedGrids, gridId, true);
      }

      // Redistribute remaining space to other grids
      this.redistribute_heights(gridId, isMinimized);
      // Use forceResize to trigger immediate visual updates
      this.update_layout(false, true);
    },
    redistribute_heights: function redistribute_heights(changedGridId, wasMinimized) {
      var grids = this._layout.grids;
      var MINIMIZED_HEIGHT = 28;
      var MIN_MAIN_CHART_HEIGHT = 100; // Minimum height for main chart
      var MIN_OFFCHART_HEIGHT = 50; // Minimum height for off-charts when donating space

      if (wasMinimized) {
        var _grids$;
        // EXPANDING: first try main chart, then off-charts above
        var restoreHeight = this.savedGridHeights[changedGridId] || 150;
        var remainingDelta = restoreHeight - MINIMIZED_HEIGHT;

        // First, try to take from main chart
        var mainChartHeight = this.customGridHeights[0] || ((_grids$ = grids[0]) === null || _grids$ === void 0 ? void 0 : _grids$.height) || 100;
        var mainAvailable = Math.max(0, mainChartHeight - MIN_MAIN_CHART_HEIGHT);
        var takeFromMain = Math.min(remainingDelta, mainAvailable);
        if (takeFromMain > 0) {
          this.$set(this.customGridHeights, 0, mainChartHeight - takeFromMain);
          remainingDelta -= takeFromMain;
        }

        // If still need more space, take from off-charts above (starting from closest)
        if (remainingDelta > 0) {
          for (var i = changedGridId - 1; i >= 1; i--) {
            var _grids$i;
            if (this.minimizedGrids[i]) continue; // Skip minimized grids

            var gridHeight = this.customGridHeights[i] || ((_grids$i = grids[i]) === null || _grids$i === void 0 ? void 0 : _grids$i.height) || 100;
            var available = Math.max(0, gridHeight - MIN_OFFCHART_HEIGHT);
            var takeAmount = Math.min(remainingDelta, available);
            if (takeAmount > 0) {
              this.$set(this.customGridHeights, i, gridHeight - takeAmount);
              remainingDelta -= takeAmount;
            }
            if (remainingDelta <= 0) break;
          }
        }

        // Set the actual height we could achieve
        var actualHeight = restoreHeight - remainingDelta;
        if (actualHeight > MINIMIZED_HEIGHT) {
          this.$set(this.customGridHeights, changedGridId, actualHeight);
        }
      } else {
        var _grids$targetGridId;
        // MINIMIZING: give space to grid directly above
        // This moves the bar down (grid above expands)
        var gridAboveId = changedGridId - 1;
        if (gridAboveId < 0) return;

        // Find target grid (skip minimized grids)
        var targetGridId = gridAboveId;
        if (this.minimizedGrids[gridAboveId]) {
          for (var _i = gridAboveId; _i >= 0; _i--) {
            if (!this.minimizedGrids[_i]) {
              targetGridId = _i;
              break;
            }
          }
        }
        var targetHeight = this.customGridHeights[targetGridId] || ((_grids$targetGridId = grids[targetGridId]) === null || _grids$targetGridId === void 0 ? void 0 : _grids$targetGridId.height) || 100;
        var savedHeight = this.savedGridHeights[changedGridId] || 150;
        var heightDelta = savedHeight - MINIMIZED_HEIGHT;
        this.$set(this.customGridHeights, targetGridId, targetHeight + heightDelta);
      }
    },
    minimize_all_offcharts: function minimize_all_offcharts() {
      var grids = this._layout.grids;
      var MINIMIZED_HEIGHT = 28;

      // Check if any off-chart is NOT minimized
      var hasExpandedOffchart = false;
      for (var i = 1; i < grids.length; i++) {
        if (!this.minimizedGrids[i]) {
          hasExpandedOffchart = true;
          break;
        }
      }
      if (hasExpandedOffchart) {
        var _grids$2;
        // Minimize all off-charts: save heights and give space to main chart
        var totalHeightGained = 0;
        for (var _i2 = 1; _i2 < grids.length; _i2++) {
          if (!this.minimizedGrids[_i2]) {
            var _grids$_i;
            // Save current height before minimizing
            var currentHeight = this.customGridHeights[_i2] || ((_grids$_i = grids[_i2]) === null || _grids$_i === void 0 ? void 0 : _grids$_i.height);
            if (currentHeight) {
              this.$set(this.savedGridHeights, _i2, currentHeight);
              totalHeightGained += currentHeight - MINIMIZED_HEIGHT;
            }
            // Mark as minimized
            this.$set(this.minimizedGrids, _i2, true);
          }
        }

        // Give all gained space to main chart
        var mainHeight = this.customGridHeights[0] || ((_grids$2 = grids[0]) === null || _grids$2 === void 0 ? void 0 : _grids$2.height) || 100;
        this.$set(this.customGridHeights, 0, mainHeight + totalHeightGained);
      } else {
        var _grids$3;
        // All are minimized - expand all off-charts
        var totalHeightNeeded = 0;

        // Calculate total height needed to restore all
        for (var _i3 = 1; _i3 < grids.length; _i3++) {
          var restoreHeight = this.savedGridHeights[_i3] || 150;
          totalHeightNeeded += restoreHeight - MINIMIZED_HEIGHT;
        }

        // Take space from main chart
        var _mainHeight = this.customGridHeights[0] || ((_grids$3 = grids[0]) === null || _grids$3 === void 0 ? void 0 : _grids$3.height) || 100;
        var MIN_MAIN_CHART_HEIGHT = 100;
        var available = Math.max(0, _mainHeight - MIN_MAIN_CHART_HEIGHT);
        var takeFromMain = Math.min(totalHeightNeeded, available);
        if (takeFromMain > 0) {
          this.$set(this.customGridHeights, 0, _mainHeight - takeFromMain);
        }

        // Expand all off-charts (proportionally if not enough space)
        var ratio = takeFromMain / totalHeightNeeded;
        for (var _i4 = 1; _i4 < grids.length; _i4++) {
          this.$set(this.minimizedGrids, _i4, false);
          var _restoreHeight = this.savedGridHeights[_i4] || 150;
          var actualHeight = MINIMIZED_HEIGHT + (_restoreHeight - MINIMIZED_HEIGHT) * (ratio < 1 ? ratio : 1);
          this.$set(this.customGridHeights, _i4, actualHeight);
        }
      }

      // Update layout with force resize
      this.update_layout(false, true);
    }
  },
  computed: {
    // Component-specific props subsets:
    main_section: function main_section() {
      // Access _layout directly to ensure Vue tracks it as a dependency
      var layout = this._layout;
      var p = Object.assign({}, this.common_props());
      p.layout = layout; // Ensure we use the tracked reference
      p.data = this.overlay_subset(this.onchart, 'onchart');
      p.data.push({
        type: this.chart.type || 'Candles',
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
    sub_section: function sub_section() {
      // Access _layout directly to ensure Vue tracks it as a dependency
      var layout = this._layout;
      var p = Object.assign({}, this.common_props());
      p.layout = layout; // Ensure we use the tracked reference
      p.data = this.overlay_subset(this.offchart, 'offchart');
      p.overlays = this.$props.overlays;
      return p;
    },
    botbar_props: function botbar_props() {
      // Access _layout directly to ensure Vue tracks it as a dependency
      var layout = this._layout;
      var p = Object.assign({}, this.common_props());
      p.layout = layout;
      p.width = layout.botbar.width;
      p.height = layout.botbar.height;
      p.rerender = this.rerender;
      return p;
    },
    offsub: function offsub() {
      return this.overlay_subset(this.offchart, 'offchart');
    },
    // Datasets: candles, onchart, offchart indicators
    ohlcv: function ohlcv() {
      return this.$props.data.ohlcv || this.chart.data || [];
    },
    chart: function chart() {
      return this.$props.data.chart || {
        grid: {}
      };
    },
    onchart: function onchart() {
      return this.$props.data.onchart || [];
    },
    offchart: function offchart() {
      var all = this.$props.data.offchart || [];
      // Filter out hidden indicators (settings.display === false)
      return all.filter(function (x) {
        if (!x.settings) return true;
        return x.settings.display !== false;
      });
    },
    filter: function filter() {
      return this.$props.ib ? utils.fast_filter_i : utils.fast_filter;
    },
    styles: function styles() {
      var w = this.$props.toolbar ? this.$props.config.TOOLBAR : 0;
      return {
        'margin-left': "".concat(w, "px"),
        'position': 'relative' // Ensure GridResizer is positioned relative to chart
      };
    },
    meta: function meta() {
      return {
        last: this.last_candle,
        sub_start: this.sub_start,
        activated: this.activated
      };
    },
    forced_tf: function forced_tf() {
      return this.chart.tf;
    },
    resizerIndices: function resizerIndices() {
      // Returns array of grid indices that need resizers (1, 2, 3, ...)
      // Resizer at index i sits between grid i-1 and grid i
      var count = this._layout.grids.length;
      var indices = [];
      for (var i = 1; i < count; i++) {
        indices.push(i);
      }
      return indices;
    }
  },
  data: function data() {
    return {
      // Current data slice
      sub: [],
      // Time range
      range: [],
      // Candlestick interval
      interval: 0,
      // Crosshair states
      cursor: {
        x: null,
        y: null,
        t: null,
        y$: null,
        grid_id: null,
        locked: false,
        values: {},
        scroll_lock: false,
        mode: utils.xmode()
      },
      // A trick to re-render botbar
      rerender: 0,
      // Layers meta-props (changing behaviour)
      layers_meta: {},
      // Y-transforms (for y-zoom and -shift)
      y_transforms: {},
      // Default OHLCV settings (when using DataStructure v1.0)
      settings_ohlcv: {},
      // Default overlay settings
      settings_ov: {},
      // Meta data
      last_candle: [],
      last_values: {},
      sub_start: undefined,
      activated: false,
      // Grid resize state
      customGridHeights: {},
      minimizedGrids: {},
      savedGridHeights: {},
      isResizing: false,
      // Layout object (needs to be reactive for grid resizing)
      _layout: null
    };
  },
  watch: {
    width: function width() {
      this.update_layout();
      if (this._hook_resize) this.ce('?chart-resize');
    },
    height: function height() {
      this.update_layout();
      if (this._hook_resize) this.ce('?chart-resize');
    },
    ib: function ib(nw) {
      if (!nw) {
        // Change range index => time
        var t1 = this.ti_map.i2t(this.range[0]);
        var t2 = this.ti_map.i2t(this.range[1]);
        utils.overwrite(this.range, [t1, t2]);
        this.interval = this.interval_ms;
      } else {
        this.init_range(); // TODO: calc index range instead
        utils.overwrite(this.range, this.range);
        this.interval = 1;
      }
      var sub = this.subset();
      utils.overwrite(this.sub, sub);
      this.update_layout();
    },
    timezone: function timezone() {
      this.update_layout();
    },
    colors: function colors() {
      utils.overwrite(this.range, this.range);
    },
    forced_tf: function forced_tf(n, p) {
      // Recalculate interval when timeframe changes
      this.calc_interval();
      this.update_layout(true);
      this.ce('exec-all-scripts');
    },
    data: {
      handler: function handler(n, p) {
        if (!this.sub.length) this.init_range();
        var sub = this.subset();
        // Fixes Infinite loop warn, when the subset is empty
        // TODO: Consider removing 'sub' from data entirely
        if (this.sub.length || sub.length) {
          utils.overwrite(this.sub, sub);
        }
        var nw = this.data_changed();
        this.update_layout(nw);
        utils.overwrite(this.range, this.range);
        this.cursor.scroll_lock = !!n.scrollLock;
        if (n.scrollLock && this.cursor.locked) {
          this.cursor.locked = false;
        }
        if (this._hook_data) this.ce('?chart-data', nw);
        this.update_last_values();
        // TODO: update legend values for overalys
        this.rerender++;
      },
      deep: true
    }
  }
});
;// ./src/components/Chart.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Chartvue_type_script_lang_js = (Chartvue_type_script_lang_js); 
;// ./src/components/Chart.vue





/* normalize component */
;
var Chart_component = normalizeComponent(
  components_Chartvue_type_script_lang_js,
  Chartvue_type_template_id_163321b4_render,
  Chartvue_type_template_id_163321b4_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Chart = (Chart_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Toolbar.vue?vue&type=template&id=1d908e28
var Toolbarvue_type_template_id_1d908e28_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    key: _vm.tool_count,
    staticClass: "trading-vue-toolbar",
    style: _vm.styles
  }, _vm._l(_vm.groups, function (tool, i) {
    return tool.icon && !tool.hidden ? _c("toolbar-item", {
      key: i,
      attrs: {
        data: tool,
        subs: _vm.sub_map,
        dc: _vm.data,
        config: _vm.config,
        colors: _vm.colors,
        selected: _vm.is_selected(tool)
      },
      on: {
        "item-selected": _vm.selected
      }
    }) : _vm._e();
  }), 1);
};
var Toolbarvue_type_template_id_1d908e28_staticRenderFns = [];
Toolbarvue_type_template_id_1d908e28_render._withStripped = true;

;// ./src/components/Toolbar.vue?vue&type=template&id=1d908e28

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ToolbarItem.vue?vue&type=template&id=24cfb58a
var ToolbarItemvue_type_template_id_24cfb58a_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    "class": ["trading-vue-tbitem", _vm.selected ? "selected-item" : ""],
    style: _vm.item_style,
    on: {
      click: function click($event) {
        return _vm.emit_selected("click");
      },
      mousedown: _vm.mousedown,
      touchstart: _vm.mousedown,
      touchend: function touchend($event) {
        return _vm.emit_selected("touch");
      }
    }
  }, [_c("div", {
    staticClass: "trading-vue-tbicon tvjs-pixelated",
    style: _vm.icon_style
  }), _vm._v(" "), _vm.data.group ? _c("div", {
    staticClass: "trading-vue-tbitem-exp",
    style: _vm.exp_style,
    on: {
      click: _vm.exp_click,
      mousedown: _vm.expmousedown,
      mouseover: _vm.expmouseover,
      mouseleave: _vm.expmouseleave
    }
  }, [_vm._v("\n        ᐳ\n    ")]) : _vm._e(), _vm._v(" "), _vm.show_exp_list ? _c("item-list", {
    attrs: {
      config: _vm.config,
      items: _vm.data.items,
      colors: _vm.colors,
      dc: _vm.dc
    },
    on: {
      "close-list": _vm.close_list,
      "item-selected": _vm.emit_selected_sub
    }
  }) : _vm._e()], 1);
};
var ToolbarItemvue_type_template_id_24cfb58a_staticRenderFns = [];
ToolbarItemvue_type_template_id_24cfb58a_render._withStripped = true;

;// ./src/components/ToolbarItem.vue?vue&type=template&id=24cfb58a

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ItemList.vue?vue&type=template&id=428f7654
var ItemListvue_type_template_id_428f7654_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "tvjs-item-list",
    style: _vm.list_style(),
    on: {
      mousedown: _vm.thismousedown
    }
  }, _vm._l(_vm.items, function (item) {
    return !item.hidden ? _c("div", {
      "class": _vm.item_class(item),
      style: _vm.item_style(item),
      on: {
        click: function click(e) {
          return _vm.item_click(e, item);
        }
      }
    }, [_c("div", {
      staticClass: "trading-vue-tbicon tvjs-pixelated",
      style: _vm.icon_style(item)
    }), _vm._v(" "), _c("div", [_vm._v(_vm._s(item.type))])]) : _vm._e();
  }), 0);
};
var ItemListvue_type_template_id_428f7654_staticRenderFns = [];
ItemListvue_type_template_id_428f7654_render._withStripped = true;

;// ./src/components/ItemList.vue?vue&type=template&id=428f7654

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ItemList.vue?vue&type=script&lang=js
/* harmony default export */ const ItemListvue_type_script_lang_js = ({
  name: 'ItemList',
  props: ['config', 'items', 'colors', 'dc'],
  mounted: function mounted() {
    window.addEventListener('mousedown', this.onmousedown);
  },
  beforeDestroy: function beforeDestroy() {
    window.removeEventListener('mousedown', this.onmousedown);
  },
  methods: {
    list_style: function list_style() {
      var conf = this.$props.config;
      var w = conf.TOOLBAR;
      var brd = this.colors.tbListBorder || this.colors.grid;
      var bstl = "1px solid ".concat(brd);
      return {
        left: "".concat(w, "px"),
        background: this.colors.back,
        borderTop: bstl,
        borderRight: bstl,
        borderBottom: bstl
      };
    },
    item_class: function item_class(item) {
      if (this.dc.tool === item.type) {
        return "tvjs-item-list-item selected-item";
      }
      return "tvjs-item-list-item";
    },
    item_style: function item_style(item) {
      var conf = this.$props.config;
      var h = conf.TB_ICON + conf.TB_ITEM_M * 2 + 8;
      var sel = this.dc.tool === item.type;
      return {
        height: "".concat(h, "px"),
        color: sel ? undefined : "#888888"
      };
    },
    icon_style: function icon_style(data) {
      var conf = this.$props.config;
      var br = conf.TB_ICON_BRI;
      var im = conf.TB_ITEM_M;
      return {
        'background-image': "url(".concat(data.icon, ")"),
        'width': '25px',
        'height': '25px',
        'margin': "".concat(im, "px"),
        'filter': "brightness(".concat(br, ")")
      };
    },
    item_click: function item_click(e, item) {
      e.cancelBubble = true;
      this.$emit('item-selected', item);
      this.$emit('close-list');
    },
    onmousedown: function onmousedown() {
      this.$emit('close-list');
    },
    thismousedown: function thismousedown(e) {
      e.stopPropagation();
    }
  },
  computed: {},
  data: function data() {
    return {};
  }
});
;// ./src/components/ItemList.vue?vue&type=script&lang=js
 /* harmony default export */ const components_ItemListvue_type_script_lang_js = (ItemListvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ItemList.vue?vue&type=style&index=0&id=428f7654&prod&lang=css
var ItemListvue_type_style_index_0_id_428f7654_prod_lang_css = __webpack_require__(156);
;// ./src/components/ItemList.vue?vue&type=style&index=0&id=428f7654&prod&lang=css

;// ./src/components/ItemList.vue



;


/* normalize component */

var ItemList_component = normalizeComponent(
  components_ItemListvue_type_script_lang_js,
  ItemListvue_type_template_id_428f7654_render,
  ItemListvue_type_template_id_428f7654_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const ItemList = (ItemList_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ToolbarItem.vue?vue&type=script&lang=js


/* harmony default export */ const ToolbarItemvue_type_script_lang_js = ({
  name: 'ToolbarItem',
  props: ['data', 'selected', 'colors', 'tv_id', 'config', 'dc', 'subs'],
  components: {
    ItemList: ItemList
  },
  mounted: function mounted() {
    if (this.data.group) {
      var type = this.subs[this.data.group];
      var item = this.data.items.find(function (x) {
        return x.type === type;
      });
      if (item) this.sub_item = item;
    }
  },
  methods: {
    mousedown: function mousedown(e) {
      var _this = this;
      this.click_start = utils.now();
      this.click_id = setTimeout(function () {
        _this.show_exp_list = true;
      }, this.config.TB_ICON_HOLD);
    },
    expmouseover: function expmouseover() {
      this.exp_hover = true;
    },
    expmouseleave: function expmouseleave() {
      this.exp_hover = false;
    },
    expmousedown: function expmousedown(e) {
      if (this.show_exp_list) e.stopPropagation();
    },
    emit_selected: function emit_selected(src) {
      if (utils.now() - this.click_start > this.config.TB_ICON_HOLD) return;
      clearTimeout(this.click_id);
      //if (Utils.is_mobile && src === 'click') return
      // TODO: double firing
      if (!this.data.group) {
        this.$emit('item-selected', this.data);
      } else {
        var item = this.sub_item || this.data.items[0];
        this.$emit('item-selected', item);
      }
    },
    emit_selected_sub: function emit_selected_sub(item) {
      this.$emit('item-selected', item);
      this.sub_item = item;
    },
    exp_click: function exp_click(e) {
      if (!this.data.group) return;
      e.cancelBubble = true;
      this.show_exp_list = !this.show_exp_list;
    },
    close_list: function close_list() {
      this.show_exp_list = false;
    }
  },
  computed: {
    item_style: function item_style() {
      if (this.$props.data.type === 'System:Splitter') {
        return this.splitter;
      }
      var conf = this.$props.config;
      var im = conf.TB_ITEM_M;
      var m = (conf.TOOLBAR - conf.TB_ICON) * 0.5 - im;
      var s = conf.TB_ICON + im * 2;
      var b = this.exp_hover ? 0 : 3;
      return {
        'width': "".concat(s, "px"),
        'height': "".concat(s, "px"),
        'margin': "8px ".concat(m, "px 0px ").concat(m, "px"),
        'border-radius': "3px ".concat(b, "px ").concat(b, "px 3px")
      };
    },
    icon_style: function icon_style() {
      if (this.$props.data.type === 'System:Splitter') {
        return {};
      }
      var conf = this.$props.config;
      var br = conf.TB_ICON_BRI;
      var sz = conf.TB_ICON;
      var im = conf.TB_ITEM_M;
      var ic = this.sub_item ? this.sub_item.icon : this.$props.data.icon;
      return {
        'background-image': "url(".concat(ic, ")"),
        'width': "".concat(sz, "px"),
        'height': "".concat(sz, "px"),
        'margin': "".concat(im, "px"),
        'filter': "brightness(".concat(br, ")")
      };
    },
    exp_style: function exp_style() {
      var conf = this.$props.config;
      var im = conf.TB_ITEM_M;
      var s = conf.TB_ICON * 0.5 + im;
      var p = (conf.TOOLBAR - s * 2) / 4;
      return {
        padding: "".concat(s, "px ").concat(p, "px"),
        transform: this.show_exp_list ? "scale(-0.6, 1)" : "scaleX(0.6)"
      };
    },
    splitter: function splitter() {
      var conf = this.$props.config;
      var colors = this.$props.colors;
      var c = colors.grid;
      var im = conf.TB_ITEM_M;
      var m = (conf.TOOLBAR - conf.TB_ICON) * 0.5 - im;
      var s = conf.TB_ICON + im * 2;
      return {
        'width': "".concat(s, "px"),
        'height': '1px',
        'margin': "8px ".concat(m, "px 8px ").concat(m, "px"),
        'background-color': c
      };
    }
  },
  data: function data() {
    return {
      exp_hover: false,
      show_exp_list: false,
      sub_item: null
    };
  }
});
;// ./src/components/ToolbarItem.vue?vue&type=script&lang=js
 /* harmony default export */ const components_ToolbarItemvue_type_script_lang_js = (ToolbarItemvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/ToolbarItem.vue?vue&type=style&index=0&id=24cfb58a&prod&lang=css
var ToolbarItemvue_type_style_index_0_id_24cfb58a_prod_lang_css = __webpack_require__(608);
;// ./src/components/ToolbarItem.vue?vue&type=style&index=0&id=24cfb58a&prod&lang=css

;// ./src/components/ToolbarItem.vue



;


/* normalize component */

var ToolbarItem_component = normalizeComponent(
  components_ToolbarItemvue_type_script_lang_js,
  ToolbarItemvue_type_template_id_24cfb58a_render,
  ToolbarItemvue_type_template_id_24cfb58a_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const ToolbarItem = (ToolbarItem_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Toolbar.vue?vue&type=script&lang=js
function Toolbarvue_type_script_lang_js_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = Toolbarvue_type_script_lang_js_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function Toolbarvue_type_script_lang_js_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return Toolbarvue_type_script_lang_js_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? Toolbarvue_type_script_lang_js_arrayLikeToArray(r, a) : void 0; } }
function Toolbarvue_type_script_lang_js_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }

/* harmony default export */ const Toolbarvue_type_script_lang_js = ({
  name: 'Toolbar',
  props: ['data', 'height', 'colors', 'tv_id', 'config'],
  components: {
    ToolbarItem: ToolbarItem
  },
  mounted: function mounted() {},
  methods: {
    selected: function selected(tool) {
      this.$emit('custom-event', {
        event: 'tool-selected',
        args: [tool.type]
      });
      if (tool.group) {
        // TODO: emit the sub map to DC (save)
        this.sub_map[tool.group] = tool.type;
      }
    },
    is_selected: function is_selected(tool) {
      var _this = this;
      if (tool.group) {
        return !!tool.items.find(function (x) {
          return x.type === _this.data.tool;
        });
      }
      return tool.type === this.data.tool;
    }
  },
  computed: {
    styles: function styles() {
      var colors = this.$props.colors;
      var b = this.$props.config.TB_BORDER;
      var w = this.$props.config.TOOLBAR - b;
      var c = colors.grid;
      var cb = colors.tbBack || colors.back;
      var brd = colors.tbBorder || colors.scale;
      var st = this.$props.config.TB_B_STYLE;
      return {
        'width': "".concat(w, "px"),
        'height': "".concat(this.$props.height - 3, "px"),
        'background-color': cb,
        'border-right': "".concat(b, "px ").concat(st, " ").concat(brd)
      };
    },
    groups: function groups() {
      var arr = [];
      var _iterator = Toolbarvue_type_script_lang_js_createForOfIteratorHelper(this.data.tools || []),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var tool = _step.value;
          if (!tool.group) {
            arr.push(tool);
            continue;
          }
          var g = arr.find(function (x) {
            return x.group === tool.group;
          });
          if (!g) {
            arr.push({
              group: tool.group,
              icon: tool.icon,
              items: [tool]
            });
          } else {
            g.items.push(tool);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return arr;
    }
  },
  watch: {
    data: {
      handler: function handler(n) {
        // For some reason Vue.js doesn't want to
        // update 'tools' automatically when new item
        // is pushed/removed. Yo, Vue, I herd you
        // you want more dirty tricks?
        if (n.tools) this.tool_count = n.tools.length;
      },
      deep: true
    }
  },
  data: function data() {
    return {
      tool_count: 0,
      sub_map: {}
    };
  }
});
;// ./src/components/Toolbar.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Toolbarvue_type_script_lang_js = (Toolbarvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Toolbar.vue?vue&type=style&index=0&id=1d908e28&prod&lang=css
var Toolbarvue_type_style_index_0_id_1d908e28_prod_lang_css = __webpack_require__(723);
;// ./src/components/Toolbar.vue?vue&type=style&index=0&id=1d908e28&prod&lang=css

;// ./src/components/Toolbar.vue



;


/* normalize component */

var Toolbar_component = normalizeComponent(
  components_Toolbarvue_type_script_lang_js,
  Toolbarvue_type_template_id_1d908e28_render,
  Toolbarvue_type_template_id_1d908e28_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Toolbar = (Toolbar_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Widgets.vue?vue&type=template&id=00dc0900
var Widgetsvue_type_template_id_00dc0900_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "tvjs-widgets",
    style: {
      width: _vm.width + "px",
      height: _vm.height + "px"
    }
  }, _vm._l(Object.keys(_vm.map), function (id) {
    return _c(_vm.initw(id), {
      key: id,
      tag: "component",
      attrs: {
        id: id,
        main: _vm.map[id].ctrl,
        data: _vm.map[id].data,
        tv: _vm.tv,
        dc: _vm.dc
      }
    });
  }), 1);
};
var Widgetsvue_type_template_id_00dc0900_staticRenderFns = [];
Widgetsvue_type_template_id_00dc0900_render._withStripped = true;

;// ./src/components/Widgets.vue?vue&type=template&id=00dc0900

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Widgets.vue?vue&type=script&lang=js
/* harmony default export */ const Widgetsvue_type_script_lang_js = ({
  name: 'Widgets',
  props: ['width', 'height', 'map', 'tv', 'dc'],
  methods: {
    initw: function initw(id) {
      return this.$props.map[id].cls;
    }
  }
});
;// ./src/components/Widgets.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Widgetsvue_type_script_lang_js = (Widgetsvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Widgets.vue?vue&type=style&index=0&id=00dc0900&prod&lang=css
var Widgetsvue_type_style_index_0_id_00dc0900_prod_lang_css = __webpack_require__(787);
;// ./src/components/Widgets.vue?vue&type=style&index=0&id=00dc0900&prod&lang=css

;// ./src/components/Widgets.vue



;


/* normalize component */

var Widgets_component = normalizeComponent(
  components_Widgetsvue_type_script_lang_js,
  Widgetsvue_type_template_id_00dc0900_render,
  Widgetsvue_type_template_id_00dc0900_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const Widgets = (Widgets_component.exports);
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/TheTip.vue?vue&type=template&id=66c58c8a
var TheTipvue_type_template_id_66c58c8a_render = function render() {
  var _vm = this,
    _c = _vm._self._c;
  return _c("div", {
    staticClass: "tvjs-the-tip",
    style: _vm.style,
    domProps: {
      innerHTML: _vm._s(_vm.data.text)
    },
    on: {
      mousedown: function mousedown($event) {
        return _vm.$emit("remove-me");
      }
    }
  });
};
var TheTipvue_type_template_id_66c58c8a_staticRenderFns = [];
TheTipvue_type_template_id_66c58c8a_render._withStripped = true;

;// ./src/components/TheTip.vue?vue&type=template&id=66c58c8a

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/TheTip.vue?vue&type=script&lang=js
/* harmony default export */ const TheTipvue_type_script_lang_js = ({
  name: 'TheTip',
  props: ['data'],
  mounted: function mounted() {
    var _this = this;
    setTimeout(function () {
      return _this.$emit('remove-me');
    }, 3000);
  },
  computed: {
    style: function style() {
      return {
        background: this.data.color
      };
    }
  }
});
;// ./src/components/TheTip.vue?vue&type=script&lang=js
 /* harmony default export */ const components_TheTipvue_type_script_lang_js = (TheTipvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/TheTip.vue?vue&type=style&index=0&id=66c58c8a&prod&lang=css
var TheTipvue_type_style_index_0_id_66c58c8a_prod_lang_css = __webpack_require__(837);
;// ./src/components/TheTip.vue?vue&type=style&index=0&id=66c58c8a&prod&lang=css

;// ./src/components/TheTip.vue



;


/* normalize component */

var TheTip_component = normalizeComponent(
  components_TheTipvue_type_script_lang_js,
  TheTipvue_type_template_id_66c58c8a_render,
  TheTipvue_type_template_id_66c58c8a_staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const TheTip = (TheTip_component.exports);
;// ./src/mixins/xcontrol.js
function xcontrol_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = xcontrol_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function xcontrol_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return xcontrol_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? xcontrol_arrayLikeToArray(r, a) : void 0; } }
function xcontrol_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// extensions control

/* harmony default export */ const xcontrol = ({
  mounted: function mounted() {
    this.ctrllist();
    this.skin_styles();
  },
  methods: {
    // Build / rebuild component list
    ctrllist: function ctrllist() {
      this.ctrl_destroy();
      this.controllers = [];
      var _iterator = xcontrol_createForOfIteratorHelper(this.$props.extensions),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var x = _step.value;
          var name = x.Main.__name__;
          if (!this.xSettings[name]) {
            this.$set(this.xSettings, name, {});
          }
          var nc = new x.Main(this,
          // tv inst
          this.data,
          // dc
          this.xSettings[name] // settings
          );
          nc.name = name;
          this.controllers.push(nc);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return this.controllers;
    },
    // TODO: preventDefault
    pre_dc: function pre_dc(e) {
      var _iterator2 = xcontrol_createForOfIteratorHelper(this.controllers),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var ctrl = _step2.value;
          if (ctrl.update) {
            ctrl.update(e);
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    },
    post_dc: function post_dc(e) {
      var _iterator3 = xcontrol_createForOfIteratorHelper(this.controllers),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var ctrl = _step3.value;
          if (ctrl.post_update) {
            ctrl.post_update(e);
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    },
    ctrl_destroy: function ctrl_destroy() {
      var _iterator4 = xcontrol_createForOfIteratorHelper(this.controllers),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var ctrl = _step4.value;
          if (ctrl.destroy) ctrl.destroy();
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    },
    skin_styles: function skin_styles() {
      var id = 'tvjs-skin-styles';
      var stbr = document.getElementById(id);
      if (stbr) {
        var parent = stbr.parentNode;
        parent.removeChild(stbr);
      }
      if (this.skin_proto && this.skin_proto.styles) {
        var sheet = document.createElement('style');
        sheet.setAttribute("id", id);
        sheet.innerHTML = this.skin_proto.styles;
        this.$el.appendChild(sheet);
      }
    }
  },
  computed: {
    ws: function ws() {
      var ws = {};
      var _iterator5 = xcontrol_createForOfIteratorHelper(this.controllers),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var ctrl = _step5.value;
          if (ctrl.widgets) {
            for (var id in ctrl.widgets) {
              ws[id] = ctrl.widgets[id];
              ws[id].ctrl = ctrl;
            }
          }
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      return ws;
    },
    skins: function skins() {
      var sks = {};
      var _iterator6 = xcontrol_createForOfIteratorHelper(this.$props.extensions),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var x = _step6.value;
          for (var id in x.skins || {}) {
            sks[id] = x.skins[id];
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      return sks;
    },
    skin_proto: function skin_proto() {
      return this.skins[this.$props.skin];
    },
    colorpack: function colorpack() {
      var sel = this.skins[this.$props.skin];
      return sel ? sel.colors : undefined;
    }
  },
  watch: {
    // TODO: This is fast & dirty fix, need
    // to fix the actual reactivity problem
    skin: function skin(n, p) {
      if (n !== p) this.resetChart();
      this.skin_styles();
    },
    extensions: function extensions() {
      this.ctrllist();
    },
    xSettings: {
      handler: function handler(n, p) {
        var _iterator7 = xcontrol_createForOfIteratorHelper(this.controllers),
          _step7;
        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var ctrl = _step7.value;
            if (ctrl.onsettings) {
              ctrl.onsettings(n, p);
            }
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
      },
      deep: true
    }
  },
  data: function data() {
    return {
      controllers: []
    };
  }
});
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/TradingVue.vue?vue&type=script&lang=js

function TradingVuevue_type_script_lang_js_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = TradingVuevue_type_script_lang_js_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function TradingVuevue_type_script_lang_js_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return TradingVuevue_type_script_lang_js_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? TradingVuevue_type_script_lang_js_arrayLikeToArray(r, a) : void 0; } }
function TradingVuevue_type_script_lang_js_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }






/* harmony default export */ const TradingVuevue_type_script_lang_js = ({
  name: 'TradingVue',
  components: {
    Chart: Chart,
    Toolbar: Toolbar,
    Widgets: Widgets,
    TheTip: TheTip
  },
  mixins: [xcontrol],
  props: {
    titleTxt: {
      type: String,
      "default": 'TradingVue.js'
    },
    id: {
      type: String,
      "default": 'trading-vue-js'
    },
    width: {
      type: Number,
      "default": 800
    },
    height: {
      type: Number,
      "default": 421
    },
    colorTitle: {
      type: String,
      "default": '#42b883'
    },
    colorBack: {
      type: String,
      "default": '#121826'
    },
    colorGrid: {
      type: String,
      "default": '#2f3240'
    },
    colorText: {
      type: String,
      "default": '#dedddd'
    },
    colorTextHL: {
      type: String,
      "default": '#fff'
    },
    colorScale: {
      type: String,
      "default": '#838383'
    },
    colorCross: {
      type: String,
      "default": '#8091a0'
    },
    colorCandleUp: {
      type: String,
      "default": '#23a776'
    },
    colorCandleDw: {
      type: String,
      "default": '#e54150'
    },
    colorWickUp: {
      type: String,
      "default": '#23a77688'
    },
    colorWickDw: {
      type: String,
      "default": '#e5415088'
    },
    colorWickSm: {
      type: String,
      "default": 'transparent' // deprecated
    },
    colorVolUp: {
      type: String,
      "default": '#79999e42'
    },
    colorVolDw: {
      type: String,
      "default": '#ef535042'
    },
    colorPanel: {
      type: String,
      "default": '#565c68'
    },
    colorTbBack: {
      type: String
    },
    colorTbBorder: {
      type: String,
      "default": '#8282827d'
    },
    colors: {
      type: Object
    },
    font: {
      type: String,
      "default": constants.ChartConfig.FONT
    },
    toolbar: {
      type: Boolean,
      "default": false
    },
    data: {
      type: Object,
      required: true
    },
    // Your overlay classes here
    overlays: {
      type: Array,
      "default": function _default() {
        return [];
      }
    },
    // Overwrites ChartConfig values,
    // see constants.js
    chartConfig: {
      type: Object,
      "default": function _default() {
        return {};
      }
    },
    legendButtons: {
      type: Array,
      "default": function _default() {
        return [];
      }
    },
    indexBased: {
      type: Boolean,
      "default": false
    },
    extensions: {
      type: Array,
      "default": function _default() {
        return [];
      }
    },
    xSettings: {
      type: Object,
      "default": function _default() {
        return {};
      }
    },
    skin: {
      type: String // Skin Name
    },
    timezone: {
      type: Number,
      "default": 0
    }
  },
  computed: {
    // Copy a subset of TradingVue props
    chart_props: function chart_props() {
      var offset = this.$props.toolbar ? this.chart_config.TOOLBAR : 0;
      var chart_props = {
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
      return chart_props;
    },
    chart_config: function chart_config() {
      return Object.assign({}, constants.ChartConfig, this.$props.chartConfig);
    },
    decubed: function decubed() {
      var data = this.$props.data;
      if (data.data !== undefined) {
        // DataCube detected
        data.init_tvjs(this);
        return data.data;
      } else {
        return data;
      }
    },
    index_based: function index_based() {
      var base = this.$props.data;
      if (base.chart) {
        return base.chart.indexBased;
      } else if (base.data) {
        return base.data.chart.indexBased;
      }
      return false;
    },
    mod_ovs: function mod_ovs() {
      var arr = [];
      var _iterator = TradingVuevue_type_script_lang_js_createForOfIteratorHelper(this.$props.extensions),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var x = _step.value;
          arr.push.apply(arr, _toConsumableArray(Object.values(x.overlays)));
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return arr;
    },
    font_comp: function font_comp() {
      return this.skin_proto && this.skin_proto.font ? this.skin_proto.font : this.font;
    }
  },
  data: function data() {
    return {
      reset: 0,
      tip: null
    };
  },
  beforeDestroy: function beforeDestroy() {
    this.custom_event({
      event: 'before-destroy'
    });
    this.ctrl_destroy();
  },
  methods: {
    // TODO: reset extensions?
    resetChart: function resetChart(resetRange) {
      var _this = this;
      if (resetRange === void 0) {
        resetRange = true;
      }
      var range = this.getRange();
      this.reset++;
      if (!resetRange && range[0] && range[1]) {
        // Wait for chart to fully initialize before restoring range
        // Double nextTick ensures layout and overlays are created
        this.$nextTick(function () {
          _this.$nextTick(function () {
            _this.setRange.apply(_this, _toConsumableArray(range));
          });
        });
      }
      this.$nextTick(function () {
        return _this.custom_event({
          event: 'chart-reset',
          args: []
        });
      });
    },
    "goto": function goto(t) {
      // TODO: limit goto & setRange (out of data error)
      if (this.chart_props.ib) {
        var ti_map = this.$refs.chart.ti_map;
        t = ti_map.gt2i(t, this.$refs.chart.ohlcv);
      }
      this.$refs.chart["goto"](t);
    },
    setRange: function setRange(t1, t2) {
      if (this.chart_props.ib) {
        var ti_map = this.$refs.chart.ti_map;
        var ohlcv = this.$refs.chart.ohlcv;
        t1 = ti_map.gt2i(t1, ohlcv);
        t2 = ti_map.gt2i(t2, ohlcv);
      }
      this.$refs.chart.setRange(t1, t2);
    },
    getRange: function getRange() {
      if (this.chart_props.ib) {
        var ti_map = this.$refs.chart.ti_map;
        // Time range => index range
        return this.$refs.chart.range.map(function (x) {
          return ti_map.i2t(x);
        });
      }
      return this.$refs.chart.range;
    },
    getCursor: function getCursor() {
      var cursor = this.$refs.chart.cursor;
      if (this.chart_props.ib) {
        var ti_map = this.$refs.chart.ti_map;
        var copy = Object.assign({}, cursor);
        copy.i = copy.t;
        copy.t = ti_map.i2t(copy.t);
        return copy;
      }
      return cursor;
    },
    showTheTip: function showTheTip(text, color) {
      if (color === void 0) {
        color = "orange";
      }
      this.tip = {
        text: text,
        color: color
      };
    },
    legend_button: function legend_button(event) {
      this.custom_event({
        event: 'legend-button-click',
        args: [event]
      });
    },
    open_indicator_settings: function open_indicator_settings(indicatorInfo) {
      this.$emit('open-indicator-settings', indicatorInfo);
    },
    custom_event: function custom_event(d) {
      if ('args' in d) {
        this.$emit.apply(this, [d.event].concat(_toConsumableArray(d.args)));
      } else {
        this.$emit(d.event);
      }
      var data = this.$props.data;
      var ctrl = this.controllers.length !== 0;
      if (ctrl) this.pre_dc(d);
      if (data.tv) {
        // If the data object is DataCube
        data.on_custom_event(d.event, d.args);
      }
      if (ctrl) this.post_dc(d);
    },
    range_changed: function range_changed(r) {
      if (this.chart_props.ib) {
        var ti_map = this.$refs.chart.ti_map;
        r = r.map(function (x) {
          return ti_map.i2t(x);
        });
      }
      this.$emit('range-changed', r);
      this.custom_event({
        event: 'range-changed',
        args: [r]
      });
      if (this.onrange) this.onrange(r);
    },
    set_loader: function set_loader(dc) {
      var _this2 = this;
      this.onrange = function (r) {
        var pf = _this2.chart_props.ib ? '_ms' : '';
        var tf = _this2.$refs.chart['interval' + pf];
        dc.range_changed(r, tf);
      };
    },
    parse_colors: function parse_colors(colors) {
      for (var k in this.$props) {
        if (k.indexOf('color') === 0 && k !== 'colors') {
          var k2 = k.replace('color', '');
          k2 = k2[0].toLowerCase() + k2.slice(1);
          if (colors[k2]) continue;
          colors[k2] = this.$props[k];
        }
      }
    },
    mousedown: function mousedown() {
      this.$refs.chart.activated = true;
    },
    mouseleave: function mouseleave() {
      this.$refs.chart.activated = false;
    }
  }
});
;// ./src/TradingVue.vue?vue&type=script&lang=js
 /* harmony default export */ const src_TradingVuevue_type_script_lang_js = (TradingVuevue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/TradingVue.vue?vue&type=style&index=0&id=238615ac&prod&lang=css
var TradingVuevue_type_style_index_0_id_238615ac_prod_lang_css = __webpack_require__(194);
;// ./src/TradingVue.vue?vue&type=style&index=0&id=238615ac&prod&lang=css

;// ./src/TradingVue.vue



;


/* normalize component */

var TradingVue_component = normalizeComponent(
  src_TradingVuevue_type_script_lang_js,
  render,
  staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* harmony default export */ const TradingVue = (TradingVue_component.exports);
;// ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js
function asyncGeneratorStep(n, t, e, r, o, a, c) {
  try {
    var i = n[a](c),
      u = i.value;
  } catch (n) {
    return void e(n);
  }
  i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
  return function () {
    var t = this,
      e = arguments;
    return new Promise(function (r, o) {
      var a = n.apply(t, e);
      function _next(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
      }
      function _throw(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
      }
      _next(void 0);
    });
  };
}

// EXTERNAL MODULE: ./node_modules/@babel/runtime/regenerator/index.js
var regenerator = __webpack_require__(756);
var regenerator_default = /*#__PURE__*/__webpack_require__.n(regenerator);
;// ./src/helpers/tmp/ww$$$.json
const ww$$$_namespaceObject = /*#__PURE__*/JSON.parse('["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"]');
// EXTERNAL MODULE: ./node_modules/lz-string/libs/lz-string.js
var lz_string = __webpack_require__(992);
var lz_string_default = /*#__PURE__*/__webpack_require__.n(lz_string);
;// ./src/helpers/script_ww_api.js




// Webworker interface

// Compiled webworker (see webpack/ww_plugin.js)



 // For webworker-loader to find the ww
var WebWork = /*#__PURE__*/function () {
  function WebWork(dc) {
    classCallCheck_classCallCheck(this, WebWork);
    this.dc = dc;
    this.tasks = {};
    this.onevent = function () {};
    this.start();
  }
  return createClass_createClass(WebWork, [{
    key: "start",
    value: function start() {
      var _this = this;
      if (this.worker) this.worker.terminate();
      // URL.createObjectURL
      window.URL = window.URL || window.webkitURL;
      var data = lz_string_default().decompressFromBase64(ww$$$_namespaceObject[0]);
      var blob;
      try {
        blob = new Blob([data], {
          type: 'application/javascript'
        });
      } catch (e) {
        // Backwards-compatibility
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(data);
        blob = blob.getBlob();
      }
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = function (e) {
        return _this.onmessage(e);
      };
    }
  }, {
    key: "start_socket",
    value: function start_socket() {
      var _this2 = this;
      if (!this.dc.sett.node_url) return;
      this.socket = new WebSocket(this.dc.sett.node_url);
      this.socket.addEventListener('message', function (e) {
        _this2.onmessage({
          data: JSON.parse(e.data)
        });
      });
      this.msg_queue = [];
    }
  }, {
    key: "send",
    value: function send(msg, tx_keys) {
      if (this.dc.sett.node_url) {
        return this.send_node(msg, tx_keys);
      }
      if (tx_keys) {
        var tx_objs = tx_keys.map(function (k) {
          return msg.data[k];
        });
        this.worker.postMessage(msg, tx_objs);
      } else {
        this.worker.postMessage(msg);
      }
    }

    // Send to node.js via websocket
  }, {
    key: "send_node",
    value: function send_node(msg, tx_keys) {
      if (!this.socket) this.start_socket();
      if (this.socket && this.socket.readyState) {
        // Send the old messages first
        while (this.msg_queue.length) {
          var m = this.msg_queue.shift();
          this.socket.send(JSON.stringify(m));
        }
        this.socket.send(JSON.stringify(msg));
      } else {
        this.msg_queue.push(msg);
      }
    }
  }, {
    key: "onmessage",
    value: function onmessage(e) {
      if (e.data.id in this.tasks) {
        this.tasks[e.data.id](e.data.data);
        delete this.tasks[e.data.id];
      } else {
        this.onevent(e);
      }
    }

    // Execute a task
  }, {
    key: "exec",
    value: function () {
      var _exec = _asyncToGenerator(/*#__PURE__*/regenerator_default().mark(function _callee(type, data, tx_keys) {
        var _this3 = this;
        return regenerator_default().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", new Promise(function (rs, rj) {
                var id = utils.uuid();
                _this3.send({
                  type: type,
                  id: id,
                  data: data
                }, tx_keys);
                _this3.tasks[id] = function (res) {
                  rs(res);
                };
              }));
            case 1:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      function exec(_x, _x2, _x3) {
        return _exec.apply(this, arguments);
      }
      return exec;
    }() // Execute a task, but just fucking do it,
    // do not wait for the result
  }, {
    key: "just",
    value: function just(type, data, tx_keys) {
      var id = utils.uuid();
      this.send({
        type: type,
        id: id,
        data: data
      }, tx_keys);
    }

    // Relay an event from iframe postMessage
    // (for the future)
  }, {
    key: "relay",
    value: function () {
      var _relay = _asyncToGenerator(/*#__PURE__*/regenerator_default().mark(function _callee2(event, just) {
        var _this4 = this;
        return regenerator_default().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              if (just === void 0) {
                just = false;
              }
              return _context2.abrupt("return", new Promise(function (rs, rj) {
                _this4.send(event, event.tx_keys);
                if (!just) {
                  _this4.tasks[event.id] = function (res) {
                    rs(res);
                  };
                }
              }));
            case 2:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));
      function relay(_x4, _x5) {
        return _relay.apply(this, arguments);
      }
      return relay;
    }()
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.worker) this.worker.terminate();
    }
  }]);
}();
/* harmony default export */ const script_ww_api = (WebWork);
;// ./src/helpers/script_utils.js


var FDEFS = /(function |)([$A-Z_][0-9A-Z_$\.]*)[\s]*?\((.*?)\)/gmi;
var SBRACKETS = /([$A-Z_][0-9A-Z_$\.]*)[\s]*?\[([^"^\[^\]]+?)\]/gmi;
var TFSTR = /(\d+)(\w*)/gm;
var BUF_INC = 5;
var tf_cache = {};
function f_args(src) {
  FDEFS.lastIndex = 0;
  var m = FDEFS.exec(src);
  if (m) {
    var fkeyword = m[1].trim();
    var fname = m[2].trim();
    var fargs = m[3].trim();
    return fargs.split(',').map(function (x) {
      return x.trim();
    });
  }
  return [];
}
function f_body(src) {
  return src.slice(src.indexOf("{") + 1, src.lastIndexOf("}"));
}
function wrap_idxs(src, pre) {
  if (pre === void 0) {
    pre = '';
  }
  SBRACKETS.lastIndex = 0;
  var changed = false;
  do {
    var m = SBRACKETS.exec(src);
    if (m) {
      var vname = m[1].trim();
      var vindex = m[2].trim();
      if (vindex === '0' || parseInt(vindex) < BUF_INC) {
        continue;
      }
      switch (vname) {
        case 'let':
        case 'var':
        case 'return':
          continue;
      }

      //let wrap = `${pre}_v(${vname}, ${vindex})[${vindex}]`
      var wrap = "".concat(vname, "[").concat(pre, "_i(").concat(vindex, ", ").concat(vname, ")]");
      src = src.replace(m[0], wrap);
      changed = true;
    }
  } while (m);
  return changed ? src : src;
}

// Get all module helper classes
function make_module_lib(mod) {
  var lib = {};
  for (var k in mod) {
    if (k === 'main' || k === 'id') continue;
    var a = f_args(mod[k]);
    lib[k] = new Function(a, f_body(mod[k]));
  }
  return lib;
}
function get_raw_src(f) {
  if (typeof f === 'string') return f;
  var src = f.toString();
  return src.slice(src.indexOf("{") + 1, src.lastIndexOf("}"));
}

// Get tf in ms from pairs such (`15`, `m`)
function tf_from_pair(num, pf) {
  var mult = 1;
  switch (pf) {
    case 's':
      mult = Const.SECOND;
      break;
    case 'm':
      mult = Const.MINUTE;
      break;
    case 'H':
      mult = Const.HOUR;
      break;
    case 'D':
      mult = Const.DAY;
      break;
    case 'W':
      mult = Const.WEEK;
      break;
    case 'M':
      mult = Const.MONTH;
      break;
    case 'Y':
      mult = Const.YEAR;
      break;
  }
  return parseInt(num) * mult;
}
function tf_from_str(str) {
  if (typeof str === 'number') return str;
  if (tf_cache[str]) return tf_cache[str];
  TFSTR.lastIndex = 0;
  var m = TFSTR.exec(str);
  if (m) {
    tf_cache[str] = tf_from_pair(m[1], m[2]);
    return tf_cache[str];
  }
  return undefined;
}
function get_fn_id(pre, id) {
  return pre + '-' + id.split('<-').pop();
}

// Apply filter for all new overlays
function ovf(obj, f) {
  var nw = {};
  for (var id in obj) {
    nw[id] = {};
    for (var k in obj[id]) {
      if (k === 'data') continue;
      nw[id][k] = obj[id][k];
    }
    nw[id].data = f(obj[id].data);
  }
  return nw;
}

// Return index of the next element in
// dataset (since t). Impl: simple binary search
// TODO: optimize (remember the penultimate
// iteration and start from there)
function nextt(data, t, ti) {
  if (ti === void 0) {
    ti = 0;
  }
  var i0 = 0;
  var iN = data.length - 1;
  while (i0 <= iN) {
    var mid = Math.floor((i0 + iN) / 2);
    if (data[mid][ti] === t) {
      return mid;
    } else if (data[mid][ti] < t) {
      i0 = mid + 1;
    } else {
      iN = mid - 1;
    }
  }
  return t < data[mid][ti] ? mid : mid + 1;
}

// Estimated size of datasets
function size_of_dss(data) {
  var bytes = 0;
  for (var id in data) {
    if (data[id].data && data[id].data[0]) {
      var s0 = size_of(data[id].data[0]);
      bytes += s0 * data[id].data.length;
    }
  }
  return bytes;
}

// Used to measure the size of dataset
function size_of(object) {
  var list = [],
    stack = [object],
    bytes = 0;
  while (stack.length) {
    var value = stack.pop();
    var type = _typeof(value);
    if (type === 'boolean') {
      bytes += 4;
    } else if (type === 'string') {
      bytes += value.length * 2;
    } else if (type === 'number') {
      bytes += 8;
    } else if (type === 'object' && list.indexOf(value) === -1) {
      list.push(value);
      for (var i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
}

// Update onchart/offchart
function update(data, val) {
  var i = data.length - 1;
  var last = data[i];
  if (!last || val[0] > last[0]) {
    data.push(val);
  } else {
    data[i] = val;
  }
}
function script_utils_now() {
  return new Date().getTime();
}
;// ./src/helpers/dataset.js




function dataset_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = dataset_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function dataset_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return dataset_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? dataset_arrayLikeToArray(r, a) : void 0; } }
function dataset_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }

// Dataset proxy between vuejs & WebWorker


var Dataset = /*#__PURE__*/function () {
  function Dataset(dc, desc) {
    classCallCheck_classCallCheck(this, Dataset);
    // TODO: dataset url arrow fn tells WW
    // to load the ds directly from web

    this.type = desc.type;
    this.id = desc.id;
    this.dc = dc;

    // Send the data to WW
    if (desc.data) {
      this.dc.ww.just('upload-data', _defineProperty({}, this.id, desc));
      // Remove the data from the descriptor
      delete desc.data;
    }
    var proto = Object.getPrototypeOf(this);
    Object.setPrototypeOf(desc, proto);
    Object.defineProperty(desc, 'dc', {
      get: function get() {
        return dc;
      }
    });
  }

  // Watch for the changes of descriptors
  return createClass_createClass(Dataset, [{
    key: "set",
    value:
    // Set data (overwrite the whole dataset)
    function set(data, exec) {
      if (exec === void 0) {
        exec = true;
      }
      this.dc.ww.just('dataset-op', {
        id: this.id,
        type: 'set',
        data: data,
        exec: exec
      });
    }

    // Update with new data (array of data points)
  }, {
    key: "update",
    value: function update(arr) {
      this.dc.ww.just('update-data', _defineProperty({}, this.id, arr));
    }

    // Send WW a chunk to merge. The merge algo
    // here is simpler than in DC. It just adds
    // data at the beginning or/and the end of ds
  }, {
    key: "merge",
    value: function merge(data, exec) {
      if (exec === void 0) {
        exec = true;
      }
      this.dc.ww.just('dataset-op', {
        id: this.id,
        type: 'mrg',
        data: data,
        exec: exec
      });
    }

    // Remove the ds from WW
  }, {
    key: "remove",
    value: function remove(exec) {
      if (exec === void 0) {
        exec = true;
      }
      this.dc.del("datasets.".concat(this.id));
      this.dc.ww.just('dataset-op', {
        id: this.id,
        type: 'del',
        exec: exec
      });
      delete this.dc.dss[this.id];
    }

    // Fetch data from WW
  }, {
    key: "data",
    value: function () {
      var _data = _asyncToGenerator(/*#__PURE__*/regenerator_default().mark(function _callee() {
        var ds;
        return regenerator_default().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.dc.ww.exec('get-dataset', this.id);
            case 2:
              ds = _context.sent;
              if (ds) {
                _context.next = 5;
                break;
              }
              return _context.abrupt("return");
            case 5:
              return _context.abrupt("return", ds.data);
            case 6:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function data() {
        return _data.apply(this, arguments);
      }
      return data;
    }()
  }], [{
    key: "watcher",
    value: function watcher(n, p) {
      var nids = n.map(function (x) {
        return x.id;
      });
      var pids = p.map(function (x) {
        return x.id;
      });
      var _iterator = dataset_createForOfIteratorHelper(nids),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var id = _step.value;
          if (!pids.includes(id)) {
            var ds = n.filter(function (x) {
              return x.id === id;
            })[0];
            this.dss[id] = new Dataset(this, ds);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var _iterator2 = dataset_createForOfIteratorHelper(pids),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var id = _step2.value;
          if (!nids.includes(id) && this.dss[id]) {
            this.dss[id].remove();
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }

    // Make an object for data transfer
  }, {
    key: "make_tx",
    value: function make_tx(dc, types) {
      var main = dc.data.chart.data;
      var base = {};
      if (types.find(function (x) {
        return x.type === 'OHLCV';
      })) {
        base = {
          ohlcv: main
        };
      }

      // TODO: add more sophisticated search
      // (using 'script.datasets' paramerter)
      /*for (var req of types) {
          let ds = Object.values(dc.dss || {})
              .find(x => x.type === req.type)
          if (ds && ds.data) {
              base[ds.id] = {
                  id: ds.id,
                  type: ds.type,
                  data: ds.data
              }
          }
      }*/
      // TODO: Data request callback ?

      return base;
    }
  }]);
}(); // Dataset reciever (created on WW)

var DatasetWW = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function DatasetWW(id, data) {
    _classCallCheck(this, DatasetWW);
    this.last_upd = now();
    this.id = id;
    if (Array.isArray(data)) {
      // Regular array
      this.data = data;
      if (id === 'ohlcv') this.type = 'OHLCV';
    } else {
      // Dataset descriptor
      this.data = data.data;
      this.type = data.type;
    }
  }

  // Update from 'update-data' event
  // TODO: ds size limit (in MB / data points)
  return _createClass(DatasetWW, [{
    key: "merge",
    value: function merge(data) {
      var len = this.data.length;
      if (!len) {
        this.data = data;
        return;
      }
      var t0 = this.data[0][0];
      var tN = this.data[len - 1][0];
      var l = data.filter(function (x) {
        return x[0] < t0;
      });
      var r = data.filter(function (x) {
        return x[0] > tN;
      });
      this.data = l.concat(this.data, r);
    }

    // On dataset operation
  }, {
    key: "op",
    value: function op(se, _op) {
      this.last_upd = now();
      switch (_op.type) {
        case 'set':
          this.data = _op.data;
          se.recalc_size();
          break;
        case 'del':
          delete se.data[this.id];
          se.recalc_size();
          break;
        case 'mrg':
          this.merge(_op.data);
          se.recalc_size();
          break;
      }
    }
  }], [{
    key: "update_all",
    value: function update_all(se, data) {
      for (var k in data) {
        if (k === 'ohlcv') continue;
        var id = k.split('.')[1] || k;
        if (!se.data[id]) continue;
        var arr = se.data[id].data;
        var iN = arr.length - 1;
        var last = arr[iN];
        var _iterator3 = dataset_createForOfIteratorHelper(data[k]),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var dp = _step3.value;
            if (!last || dp[0] > last[0]) {
              arr.push(dp);
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        se.data[id].last_upd = now();
      }
    }
  }]);
}()));
;// ./src/helpers/dc_events.js




function dc_events_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = dc_events_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function dc_events_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return dc_events_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? dc_events_arrayLikeToArray(r, a) : void 0; } }
function dc_events_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// DataCube event handlers





var DCEvents = /*#__PURE__*/function () {
  function DCEvents() {
    var _this = this;
    classCallCheck_classCallCheck(this, DCEvents);
    this.ww = new script_ww_api(this);

    // Listen to the web-worker events
    this.ww.onevent = function (e) {
      var _iterator = dc_events_createForOfIteratorHelper(_this.tv.controllers),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var ctrl = _step.value;
          if (ctrl.ww) ctrl.ww(e.data);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      switch (e.data.type) {
        case 'request-data':
          // TODO: DataTunnel class for smarter data transfer
          if (_this.ww._data_uploading) break;
          var data = Dataset.make_tx(_this, e.data.data);
          _this.send_meta_2_ww();
          _this.ww.just('upload-data', data);
          _this.ww._data_uploading = true;
          break;
        case 'overlay-data':
          _this.on_overlay_data(e.data.data);
          break;
        case 'overlay-update':
          _this.on_overlay_update(e.data.data);
          break;
        case 'data-uploaded':
          _this.ww._data_uploading = false;
          break;
        case 'engine-state':
          _this.se_state = Object.assign(_this.se_state || {}, e.data.data);
          break;
        case 'modify-overlay':
          _this.modify_overlay(e.data.data);
          break;
        case 'script-signal':
          _this.tv.$emit('signal', e.data.data);
          break;
      }
      var _iterator2 = dc_events_createForOfIteratorHelper(_this.tv.controllers),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var ctrl = _step2.value;
          if (ctrl.post_ww) ctrl.post_ww(e.data);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    };
  }

  // Called when overalay/tv emits 'custom-event'
  return createClass_createClass(DCEvents, [{
    key: "on_custom_event",
    value: function on_custom_event(event, args) {
      switch (event) {
        case 'register-tools':
          this.register_tools(args);
          break;
        case 'exec-script':
          this.exec_script(args);
          break;
        case 'exec-all-scripts':
          this.exec_all_scripts();
          break;
        case 'data-len-changed':
          this.data_changed(args);
          break;
        case 'tool-selected':
          if (!args[0]) break; // TODO: Quick fix, investigate
          if (args[0].split(':')[0] === 'System') {
            this.system_tool(args[0].split(':')[1]);
            break;
          }
          this.tv.$set(this.data, 'tool', args[0]);
          if (args[0] === 'Cursor') {
            this.drawing_mode_off();
          }
          break;
        case 'grid-mousedown':
          this.grid_mousedown(args);
          break;
        case 'drawing-mode-off':
          this.drawing_mode_off();
          break;
        case 'change-settings':
          this.change_settings(args);
          break;
        case 'range-changed':
          this.scripts_onrange.apply(this, _toConsumableArray(args));
          break;
        case 'scroll-lock':
          this.on_scroll_lock(args[0]);
          break;
        case 'object-selected':
          this.object_selected(args);
          break;
        case 'remove-tool':
          this.system_tool('Remove');
          break;
        case 'before-destroy':
          this.before_destroy();
          break;
      }
    }

    // Triggered when one or multiple settings are changed
    // We select only the changed ones & re-exec them on the
    // web worker
  }, {
    key: "on_settings",
    value: function on_settings(values, prev) {
      var _this2 = this;
      if (!this.sett.scripts) return;
      var delta = {};
      var changed = false;
      var _loop = function _loop() {
        var n = values[i];
        var arr = prev.filter(function (x) {
          return x.v === n.v;
        });
        if (!arr.length && n.p.settings.$props) {
          var id = n.p.settings.$uuid;
          if (utils.is_scr_props_upd(n, prev) && utils.delayed_exec(n.p)) {
            delta[id] = n.v;
            changed = true;
            _this2.tv.$set(n.p, 'loading', true);
          }
        }
      };
      for (var i = 0; i < values.length; i++) {
        _loop();
      }
      if (changed && Object.keys(delta).length) {
        var tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
        var range = this.tv.getRange();
        this.ww.just('update-ov-settings', {
          delta: delta,
          tf: tf,
          range: range
        });
      }
    }

    // When the set of $uuids is changed
  }, {
    key: "on_ids_changed",
    value: function on_ids_changed(values, prev) {
      var rem = prev.filter(function (x) {
        return x !== undefined && !values.includes(x);
      });
      if (rem.length) {
        this.ww.just('remove-scripts', rem);
      }
    }

    // Combine all tools and their mods
  }, {
    key: "register_tools",
    value: function register_tools(tools) {
      var preset = {};
      var _iterator3 = dc_events_createForOfIteratorHelper(this.data.tools || []),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var tool = _step3.value;
          preset[tool.type] = tool;
          delete tool.type;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      this.tv.$set(this.data, 'tools', []);
      var list = [{
        type: 'Cursor',
        icon: icons_namespaceObject["cursor.png"]
      }];
      var _iterator4 = dc_events_createForOfIteratorHelper(tools),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var tool = _step4.value;
          var proto = Object.assign({}, tool.info);
          var type = tool.info.type || 'Default';
          proto.type = "".concat(tool.use_for, ":").concat(type);
          this.merge_presets(proto, preset[tool.use_for]);
          this.merge_presets(proto, preset[proto.type]);
          delete proto.mods;
          list.push(proto);
          for (var mod in tool.info.mods) {
            var mp = Object.assign({}, proto);
            mp = Object.assign(mp, tool.info.mods[mod]);
            mp.type = "".concat(tool.use_for, ":").concat(mod);
            this.merge_presets(mp, preset[tool.use_for]);
            this.merge_presets(mp, preset[mp.type]);
            list.push(mp);
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      this.tv.$set(this.data, 'tools', list);
      this.tv.$set(this.data, 'tool', 'Cursor');
    }
  }, {
    key: "exec_script",
    value: function exec_script(args) {
      if (args.length && this.sett.scripts) {
        var obj = this.get_overlay(args[0]);
        if (!obj || obj.scripts === false) return;
        if (obj.script && obj.script.src) {
          args[0].src = obj.script.src; // opt, override the src
        }
        // Parse script props & get the values from the ov
        // TODO: remove unnecessary script initializations
        var s = obj.settings;
        var props = args[0].src.props || {};
        if (!s.$uuid) s.$uuid = "".concat(obj.type, "-").concat(utils.uuid2());
        args[0].uuid = s.$uuid;
        args[0].sett = s;
        for (var k in props || {}) {
          var proto = props[k];
          if (s[k] !== undefined) {
            proto.val = s[k]; // use the existing val
            continue;
          }
          if (proto.def === undefined) {
            // TODO: add support of info / errors to the legend
            console.error("Overlay ".concat(obj.id, ": script prop '").concat(k, "' ") + "doesn't have a default value");
            return;
          }
          s[k] = proto.val = proto.def; // set the default
        }
        // Remove old props (dropped by the current exec)
        if (s.$props) {
          for (var k in s) {
            if (s.$props.includes(k) && !(k in props)) {
              delete s[k];
            }
          }
        }
        s.$props = Object.keys(args[0].src.props || {});
        this.tv.$set(obj, 'loading', true);
        var tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
        var range = this.tv.getRange();
        if (obj.script && obj.script.output != null) {
          args[0].output = obj.script.output;
        }
        this.ww.just('exec-script', {
          s: args[0],
          tf: tf,
          range: range
        });
      }
    }
  }, {
    key: "exec_all_scripts",
    value: function exec_all_scripts() {
      if (!this.sett.scripts) return;
      this.set_loading(true);
      var tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
      var range = this.tv.getRange();
      this.ww.just('exec-all-scripts', {
        tf: tf,
        range: range
      });
    }
  }, {
    key: "scripts_onrange",
    value: function scripts_onrange(r) {
      if (!this.sett.scripts) return;
      var delta = {};
      this.get('.').forEach(function (v) {
        if (v.script && v.script.execOnRange && v.settings.$uuid) {
          // TODO: execInterrupt flag?
          if (utils.delayed_exec(v)) {
            delta[v.settings.$uuid] = v.settings;
          }
        }
      });
      if (Object.keys(delta).length) {
        var tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
        var range = this.tv.getRange();
        this.ww.just('update-ov-settings', {
          delta: delta,
          tf: tf,
          range: range
        });
      }
    }

    // Overlay modification from WW
  }, {
    key: "modify_overlay",
    value: function modify_overlay(upd) {
      var obj = this.get_overlay(upd);
      if (obj) {
        for (var k in upd.fields || {}) {
          if (typeof_typeof(obj[k]) === 'object') {
            this.merge("".concat(upd.uuid, ".").concat(k), upd.fields[k]);
          } else {
            this.tv.$set(obj, k, upd.fields[k]);
          }
        }
      }
    }
  }, {
    key: "data_changed",
    value: function data_changed(args) {
      if (!this.sett.scripts) return;
      if (this.sett.data_change_exec === false) return;
      var main = this.data.chart.data;
      if (this.ww._data_uploading) return;
      if (!this.se_state.scripts) return;
      this.send_meta_2_ww();
      this.ww.just('upload-data', {
        ohlcv: main
      });
      this.ww._data_uploading = true;
      this.set_loading(true);
    }
  }, {
    key: "set_loading",
    value: function set_loading(flag) {
      var skrr = this.get('.').filter(function (x) {
        return x.settings.$props;
      });
      var _iterator5 = dc_events_createForOfIteratorHelper(skrr),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var s = _step5.value;
          this.merge("".concat(s.id), {
            loading: flag
          });
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
  }, {
    key: "send_meta_2_ww",
    value: function send_meta_2_ww() {
      var tf = this.tv.$refs.chart.interval_ms || this.data.chart.tf;
      var range = this.tv.getRange();
      this.ww.just('send-meta-info', {
        tf: tf,
        range: range
      });
    }
  }, {
    key: "merge_presets",
    value: function merge_presets(proto, preset) {
      if (!preset) return;
      for (var k in preset) {
        if (k === 'settings') {
          Object.assign(proto[k], preset[k]);
        } else {
          proto[k] = preset[k];
        }
      }
    }
  }, {
    key: "grid_mousedown",
    value: function grid_mousedown(args) {
      var _this3 = this;
      // TODO: tool state finished?
      this.object_selected([]);
      // Remove the previous RangeTool
      var rem = function rem() {
        return _this3.get('RangeTool').filter(function (x) {
          return x.settings.shiftMode;
        }).forEach(function (x) {
          return _this3.del(x.id);
        });
      };
      if (this.data.tool && this.data.tool !== 'Cursor' && !this.data.drawingMode) {
        // Prevent from "null" tools (tool created with HODL)
        if (args[1].type !== 'tap') {
          this.tv.$set(this.data, 'drawingMode', true);
          this.build_tool(args[0]);
        } else {
          this.tv.showTheTip("<b>Hodl</b>+<b>Drug</b> to create, " + "<b>Tap</b> to finish a tool");
        }
      } else if (this.sett.shift_measure && args[1].shiftKey) {
        rem();
        this.tv.$nextTick(function () {
          return _this3.build_tool(args[0], 'RangeTool:ShiftMode');
        });
      } else {
        rem();
      }
    }
  }, {
    key: "drawing_mode_off",
    value: function drawing_mode_off() {
      this.tv.$set(this.data, 'drawingMode', false);
      this.tv.$set(this.data, 'tool', 'Cursor');
    }

    // Place a new tool
  }, {
    key: "build_tool",
    value: function build_tool(grid_id, type) {
      var list = this.data.tools;
      type = type || this.data.tool;
      var proto = list.find(function (x) {
        return x.type === type;
      });
      if (!proto) return;
      var sett = Object.assign({}, proto.settings || {});
      var data = (proto.data || []).slice();
      if (!('legend' in sett)) sett.legend = false;
      if (!('z-index' in sett)) sett['z-index'] = 100;
      sett.$selected = true;
      sett.$state = 'wip';
      var side = grid_id ? 'offchart' : 'onchart';
      var id = this.add(side, {
        name: proto.name,
        type: type.split(':')[0],
        settings: sett,
        data: data,
        grid: {
          id: grid_id
        }
      });
      sett.$uuid = "".concat(id, "-").concat(utils.now());
      this.tv.$set(this.data, 'selected', sett.$uuid);
      this.add_trash_icon();
    }

    // Remove selected / Remove all, etc
  }, {
    key: "system_tool",
    value: function system_tool(type) {
      switch (type) {
        case 'Remove':
          if (this.data.selected) {
            this.del(this.data.selected);
            this.remove_trash_icon();
            this.drawing_mode_off();
            this.on_scroll_lock(false);
          }
          break;
      }
    }

    // Apply new overlay settings
  }, {
    key: "change_settings",
    value: function change_settings(args) {
      var settings = args[0];
      delete settings.id;
      var grid_id = args[1];
      this.merge("".concat(args[3], ".settings"), settings);
    }

    // Lock the scrolling mechanism
  }, {
    key: "on_scroll_lock",
    value: function on_scroll_lock(flag) {
      this.tv.$set(this.data, 'scrollLock', flag);
    }

    // When new object is selected / unselected
  }, {
    key: "object_selected",
    value: function object_selected(args) {
      var q = this.data.selected;
      if (q) {
        // Check if current drawing is finished
        //let res = this.get_one(`${q}.settings`)
        //if (res && res.$state !== 'finished') return
        this.merge("".concat(q, ".settings"), {
          $selected: false
        });
        this.remove_trash_icon();
      }
      this.tv.$set(this.data, 'selected', null);
      if (!args.length) return;
      this.tv.$set(this.data, 'selected', args[2]);
      this.merge("".concat(args[2], ".settings"), {
        $selected: true
      });
      this.add_trash_icon();
    }
  }, {
    key: "add_trash_icon",
    value: function add_trash_icon() {
      var type = 'System:Remove';
      if (this.data.tools.find(function (x) {
        return x.type === type;
      })) {
        return;
      }
      this.data.tools.push({
        type: type,
        icon: icons_namespaceObject["trash.png"]
      });
    }
  }, {
    key: "remove_trash_icon",
    value: function remove_trash_icon() {
      // TODO: Does not call Toolbar render (distr version)
      var type = 'System:Remove';
      utils.overwrite(this.data.tools, this.data.tools.filter(function (x) {
        return x.type !== type;
      }));
    }

    // Set overlay data from the web-worker
  }, {
    key: "on_overlay_data",
    value: function on_overlay_data(data) {
      var _this4 = this;
      this.get('.').forEach(function (x) {
        if (x.settings.$synth) _this4.del("".concat(x.id));
      });
      var _iterator6 = dc_events_createForOfIteratorHelper(data),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var ov = _step6.value;
          var obj = this.get_one("".concat(ov.id));
          if (obj) {
            this.tv.$set(obj, 'loading', false);
            if (!ov.data) continue;
            obj.data = ov.data;
          }
          if (!ov.new_ovs) continue;
          for (var id in ov.new_ovs.onchart) {
            if (!this.get_one("onchart.".concat(id))) {
              this.add('onchart', ov.new_ovs.onchart[id]);
            }
          }
          for (var id in ov.new_ovs.offchart) {
            if (!this.get_one("offchart.".concat(id))) {
              this.add('offchart', ov.new_ovs.offchart[id]);
            }
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
    }

    // Push overlay updates from the web-worker
  }, {
    key: "on_overlay_update",
    value: function on_overlay_update(data) {
      var _iterator7 = dc_events_createForOfIteratorHelper(data),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var ov = _step7.value;
          if (!ov.data) continue;
          var obj = this.get_one("".concat(ov.id));
          if (obj) {
            this.fast_merge(obj.data, ov.data, false);
          }
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
    }

    // Clean-up unfinished business (tools)
  }, {
    key: "before_destroy",
    value: function before_destroy() {
      var f = function f(x) {
        return !x.settings.$state || x.settings.$state === 'finished';
      };
      this.data.onchart = this.data.onchart.filter(f);
      this.data.offchart = this.data.offchart.filter(f);
      this.drawing_mode_off();
      this.on_scroll_lock(false);
      this.object_selected([]);
      this.ww.destroy();
    }

    // Get overlay by grid-layer id
  }, {
    key: "get_overlay",
    value: function get_overlay(obj) {
      var id = obj.id || "g".concat(obj.grid_id, "_").concat(obj.layer_id);
      var dcid = obj.uuid || this.gldc[id];
      return this.get_one("".concat(dcid));
    }
  }]);
}();

;// ./src/helpers/dc_core.js








function dc_core_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = dc_core_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function dc_core_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return dc_core_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? dc_core_arrayLikeToArray(r, a) : void 0; } }
function dc_core_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function dc_core_callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, dc_core_isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function dc_core_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (dc_core_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
// DataCube "private" methods




var DCCore = /*#__PURE__*/function (_DCEvents) {
  function DCCore() {
    classCallCheck_classCallCheck(this, DCCore);
    return dc_core_callSuper(this, DCCore, arguments);
  }
  _inherits(DCCore, _DCEvents);
  return createClass_createClass(DCCore, [{
    key: "init_tvjs",
    value:
    // Set TV instance (once). Called by TradingVue itself
    function init_tvjs($root) {
      var _this = this;
      if (!this.tv) {
        this.tv = $root;
        this.init_data();
        this.update_ids();

        // Listen to all setting changes
        // TODO: works only with merge()
        this.tv.$watch(function () {
          return _this.get_by_query('.settings');
        }, function (n, p) {
          return _this.on_settings(n, p);
        });

        // Listen to all indices changes
        this.tv.$watch(function () {
          return _this.get('.').map(function (x) {
            return x.settings.$uuid;
          });
        }, function (n, p) {
          return _this.on_ids_changed(n, p);
        });

        // Watch for all 'datasets' changes
        this.tv.$watch(function () {
          return _this.get('datasets');
        }, Dataset.watcher.bind(this));
      }
    }

    // Init Data Structure v1.1
  }, {
    key: "init_data",
    value: function init_data($root) {
      if (!('chart' in this.data)) {
        this.tv.$set(this.data, 'chart', {
          type: 'Candles',
          data: this.data.ohlcv || []
        });
      }
      if (!('onchart' in this.data)) {
        this.tv.$set(this.data, 'onchart', []);
      }
      if (!('offchart' in this.data)) {
        this.tv.$set(this.data, 'offchart', []);
      }
      if (!this.data.chart.settings) {
        this.tv.$set(this.data.chart, 'settings', {});
      }

      // Remove ohlcv cuz we have Data v1.1^
      delete this.data.ohlcv;
      if (!('datasets' in this.data)) {
        this.tv.$set(this.data, 'datasets', []);
      }

      // Init dataset proxies
      var _iterator = dc_core_createForOfIteratorHelper(this.data.datasets),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var ds = _step.value;
          if (!this.dss) this.dss = {};
          this.dss[ds.id] = new Dataset(this, ds);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    // Range change callback (called by TradingVue)
    // TODO: improve (reliablity + chunk with limited size)
  }, {
    key: "range_changed",
    value: function () {
      var _range_changed = _asyncToGenerator(/*#__PURE__*/regenerator_default().mark(function _callee(range, tf, check) {
        var _this2 = this;
        var first, prom;
        return regenerator_default().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (check === void 0) {
                check = false;
              }
              if (this.loader) {
                _context.next = 3;
                break;
              }
              return _context.abrupt("return");
            case 3:
              if (this.loading) {
                _context.next = 19;
                break;
              }
              first = this.data.chart.data[0][0];
              if (!(range[0] < first)) {
                _context.next = 19;
                break;
              }
              this.loading = true;
              _context.next = 9;
              return utils.pause(250);
            case 9:
              // Load bigger chunks
              range = range.slice(); // copy
              range[0] = Math.floor(range[0]);
              range[1] = Math.floor(first);
              prom = this.loader(range, tf, function (d) {
                // Callback way
                _this2.chunk_loaded(d);
              });
              if (!(prom && prom.then)) {
                _context.next = 19;
                break;
              }
              _context.t0 = this;
              _context.next = 17;
              return prom;
            case 17:
              _context.t1 = _context.sent;
              _context.t0.chunk_loaded.call(_context.t0, _context.t1);
            case 19:
              if (!check) this.last_chunk = [range, tf];
            case 20:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function range_changed(_x, _x2, _x3) {
        return _range_changed.apply(this, arguments);
      }
      return range_changed;
    }() // A new chunk of data is loaded
    // TODO: bulletproof fetch
  }, {
    key: "chunk_loaded",
    value: function chunk_loaded(data) {
      // Updates only candlestick data, or
      if (Array.isArray(data)) {
        this.merge('chart.data', data);
      } else {
        // Bunch of overlays, including chart.data
        for (var k in data) {
          this.merge(k, data[k]);
        }
      }
      this.loading = false;
      if (this.last_chunk) {
        this.range_changed.apply(this, _toConsumableArray(this.last_chunk).concat([true]));
        this.last_chunk = null;
      }
    }

    // Update ids for all overlays
  }, {
    key: "update_ids",
    value: function update_ids() {
      this.data.chart.id = "chart.".concat(this.data.chart.type);
      var count = {};
      // grid_id,layer_id => DC id mapping
      this.gldc = {}, this.dcgl = {};
      var _iterator2 = dc_core_createForOfIteratorHelper(this.data.onchart),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var ov = _step2.value;
          if (count[ov.type] === undefined) {
            count[ov.type] = 0;
          }
          var i = count[ov.type]++;
          ov.id = "onchart.".concat(ov.type).concat(i);
          if (!ov.name) ov.name = ov.type + " ".concat(i);
          if (!ov.settings) this.tv.$set(ov, 'settings', {});

          // grid_id,layer_id => DC id mapping
          this.gldc["g0_".concat(ov.type, "_").concat(i)] = ov.id;
          this.dcgl[ov.id] = "g0_".concat(ov.type, "_").concat(i);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      count = {};
      var grids = [{}];
      var gid = 0;
      var _iterator3 = dc_core_createForOfIteratorHelper(this.data.offchart),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var ov = _step3.value;
          if (count[ov.type] === undefined) {
            count[ov.type] = 0;
          }
          var _i = count[ov.type]++;
          ov.id = "offchart.".concat(ov.type).concat(_i);
          if (!ov.name) ov.name = ov.type + " ".concat(_i);
          if (!ov.settings) this.tv.$set(ov, 'settings', {});

          // grid_id,layer_id => DC id mapping
          gid++;
          var rgid = (ov.grid || {}).id || gid; // real grid_id
          // When we merge grid, skip ++
          if ((ov.grid || {}).id) gid--;
          if (!grids[rgid]) grids[rgid] = {};
          if (grids[rgid][ov.type] === undefined) {
            grids[rgid][ov.type] = 0;
          }
          var ri = grids[rgid][ov.type]++;
          this.gldc["g".concat(rgid, "_").concat(ov.type, "_").concat(ri)] = ov.id;
          this.dcgl[ov.id] = "g".concat(rgid, "_").concat(ov.type, "_").concat(ri);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }

    // TODO: chart refine (from the exchange chart)
  }, {
    key: "update_candle",
    value: function update_candle(data) {
      var ohlcv = this.data.chart.data;
      var last = ohlcv[ohlcv.length - 1];
      var candle = data['candle'];
      var tf = this.tv.$refs.chart.interval_ms;
      var t_next = last[0] + tf;
      var now = data.t || utils.now();
      var t = now >= t_next ? now - now % tf : last[0];

      // Update the entire candle
      if (candle.length >= 6) {
        t = candle[0];
      } else {
        candle = [t].concat(_toConsumableArray(candle));
      }
      this.agg.push('ohlcv', candle);
      this.update_overlays(data, t, tf);
      return t >= t_next;
    }
  }, {
    key: "update_tick",
    value: function update_tick(data) {
      var ohlcv = this.data.chart.data;
      var last = ohlcv[ohlcv.length - 1];
      var tick = data['price'];
      var volume = data['volume'] || 0;
      var tf = this.tv.$refs.chart.interval_ms;
      if (!tf) {
        return console.warn('Define the main timeframe');
      }
      var now = data.t || utils.now();
      if (!last) last = [now - now % tf];
      var t_next = last[0] + tf;
      var t = now >= t_next ? now - now % tf : last[0];
      if ((t >= t_next || !ohlcv.length) && tick !== undefined) {
        // And new zero-height candle
        var nc = [t, tick, tick, tick, tick, volume];
        this.agg.push('ohlcv', nc, tf);
        ohlcv.push(nc);
        this.scroll_to(t);
      } else if (tick !== undefined) {
        // Update an existing one
        // TODO: make a separate class Sampler
        last[2] = Math.max(tick, last[2]);
        last[3] = Math.min(tick, last[3]);
        last[4] = tick;
        last[5] += volume;
        this.agg.push('ohlcv', last, tf);
      }
      this.update_overlays(data, t, tf);
      return t >= t_next;
    }

    // Updates all overlays with given values.
  }, {
    key: "update_overlays",
    value: function update_overlays(data, t, tf) {
      for (var k in data) {
        if (k === 'price' || k === 'volume' || k === 'candle' || k === 't') {
          continue;
        }
        if (k.includes('datasets.')) {
          this.agg.push(k, data[k], tf);
          continue;
        }
        if (!Array.isArray(data[k])) {
          var val = [data[k]];
        } else {
          val = data[k];
        }
        if (!k.includes('.data')) k += '.data';
        this.agg.push(k, [t].concat(_toConsumableArray(val)), tf);
      }
    }

    // Returns array of objects matching query.
    // Object contains { parent, index, value }
    // TODO: query caching
  }, {
    key: "get_by_query",
    value: function get_by_query(query, chuck) {
      var tuple = query.split('.');
      switch (tuple[0]) {
        case 'chart':
          var result = this.chart_as_piv(tuple);
          break;
        case 'onchart':
        case 'offchart':
          result = this.query_search(query, tuple);
          break;
        case 'datasets':
          result = this.query_search(query, tuple);
          var _iterator4 = dc_core_createForOfIteratorHelper(result),
            _step4;
          try {
            for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
              var r = _step4.value;
              if (r.i === 'data') {
                r.v = this.dss[r.p.id].data();
              }
            }
          } catch (err) {
            _iterator4.e(err);
          } finally {
            _iterator4.f();
          }
          break;
        default:
          /* Should get('.') return also the chart? */
          /*let ch = this.chart_as_query([
              'chart',
              tuple[1]
          ])*/
          var on = this.query_search(query, ['onchart', tuple[0], tuple[1]]);
          var off = this.query_search(query, ['offchart', tuple[0], tuple[1]]);
          result = [].concat(_toConsumableArray(on), _toConsumableArray(off));
          break;
      }
      return result.filter(function (x) {
        return !(x.v || {}).locked || chuck;
      });
    }
  }, {
    key: "chart_as_piv",
    value: function chart_as_piv(tuple) {
      var field = tuple[1];
      if (field) return [{
        p: this.data.chart,
        i: field,
        v: this.data.chart[field]
      }];else return [{
        p: this.data,
        i: 'chart',
        v: this.data.chart
      }];
    }
  }, {
    key: "query_search",
    value: function query_search(query, tuple) {
      var _this3 = this;
      var side = tuple[0];
      var path = tuple[1] || '';
      var field = tuple[2];
      var arr = this.data[side].filter(function (x) {
        return x.id === query || x.id && x.id.includes(path) || x.name === query || x.name && x.name.includes(path) || query.includes((x.settings || {}).$uuid);
      });
      if (field) {
        return arr.map(function (x) {
          return {
            p: x,
            i: field,
            v: x[field]
          };
        });
      }
      return arr.map(function (x, i) {
        return {
          p: _this3.data[side],
          i: _this3.data[side].indexOf(x),
          v: x
        };
      });
    }
  }, {
    key: "merge_objects",
    value: function merge_objects(obj, data, new_obj) {
      if (new_obj === void 0) {
        new_obj = {};
      }
      // The only way to get Vue to update all stuff
      // reactively is to create a brand new object.
      // TODO: Is there a simpler approach?
      Object.assign(new_obj, obj.v);
      Object.assign(new_obj, data);
      this.tv.$set(obj.p, obj.i, new_obj);
    }

    // Merge overlapping time series
  }, {
    key: "merge_ts",
    value: function merge_ts(obj, data) {
      // Assume that both arrays are pre-sorted

      if (!data.length) return obj.v;
      var r1 = [obj.v[0][0], obj.v[obj.v.length - 1][0]];
      var r2 = [data[0][0], data[data.length - 1][0]];

      // Overlap
      var o = [Math.max(r1[0], r2[0]), Math.min(r1[1], r2[1])];
      if (o[1] >= o[0]) {
        var _obj$v, _data;
        var _this$ts_overlap = this.ts_overlap(obj.v, data, o),
          od = _this$ts_overlap.od,
          d1 = _this$ts_overlap.d1,
          d2 = _this$ts_overlap.d2;
        (_obj$v = obj.v).splice.apply(_obj$v, _toConsumableArray(d1));
        (_data = data).splice.apply(_data, _toConsumableArray(d2));

        // Dst === Overlap === Src
        if (!obj.v.length && !data.length) {
          this.tv.$set(obj.p, obj.i, od);
          return obj.v;
        }

        // If src is totally contained in dst
        if (!data.length) {
          data = obj.v.splice(d1[0]);
        }

        // If dst is totally contained in src
        if (!obj.v.length) {
          obj.v = data.splice(d2[0]);
        }
        this.tv.$set(obj.p, obj.i, this.combine(obj.v, od, data));
      } else {
        this.tv.$set(obj.p, obj.i, this.combine(obj.v, [], data));
      }
      return obj.v;
    }

    // TODO: review performance, move to worker
  }, {
    key: "ts_overlap",
    value: function ts_overlap(arr1, arr2, range) {
      var t1 = range[0];
      var t2 = range[1];
      var ts = {}; // timestamp map

      var a1 = arr1.filter(function (x) {
        return x[0] >= t1 && x[0] <= t2;
      });
      var a2 = arr2.filter(function (x) {
        return x[0] >= t1 && x[0] <= t2;
      });

      // Indices of segments
      var id11 = arr1.indexOf(a1[0]);
      var id12 = arr1.indexOf(a1[a1.length - 1]);
      var id21 = arr2.indexOf(a2[0]);
      var id22 = arr2.indexOf(a2[a2.length - 1]);
      for (var i = 0; i < a1.length; i++) {
        ts[a1[i][0]] = a1[i];
      }
      for (var i = 0; i < a2.length; i++) {
        ts[a2[i][0]] = a2[i];
      }
      var ts_sorted = Object.keys(ts).sort();
      return {
        od: ts_sorted.map(function (x) {
          return ts[x];
        }),
        d1: [id11, id12 - id11 + 1],
        d2: [id21, id22 - id21 + 1]
      };
    }

    // Combine parts together:
    // (destination, overlap, source)
  }, {
    key: "combine",
    value: function combine(dst, o, src) {
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

      // The overlap right in the middle
      if (src[0][0] >= dst[0][0] && last(src) <= last(dst)) {
        return Object.assign(dst, o);

        // The overlap is on the right
      } else if (last(src) > last(dst)) {
        // Psh(...) is faster but can overflow the stack
        if (o.length < 100000 && src.length < 100000) {
          var _dst;
          (_dst = dst).push.apply(_dst, _toConsumableArray(o).concat(_toConsumableArray(src)));
          return dst;
        } else {
          return dst.concat(o, src);
        }

        // The overlap is on the left
      } else if (src[0][0] < dst[0][0]) {
        // Push(...) is faster but can overflow the stack
        if (o.length < 100000 && src.length < 100000) {
          var _src;
          (_src = src).push.apply(_src, _toConsumableArray(o).concat(_toConsumableArray(dst)));
          return src;
        } else {
          return src.concat(o, dst);
        }
      } else {
        return [];
      }
    }

    // Simple data-point merge (faster)
  }, {
    key: "fast_merge",
    value: function fast_merge(data, point, main) {
      if (main === void 0) {
        main = true;
      }
      if (!data) return;
      var last_t = (data[data.length - 1] || [])[0];
      var upd_t = point[0];
      if (!data.length || upd_t > last_t) {
        data.push(point);
        if (main && this.sett.auto_scroll) {
          this.scroll_to(upd_t);
        }
      } else if (upd_t === last_t) {
        if (main) {
          this.tv.$set(data, data.length - 1, point);
        } else {
          data[data.length - 1] = point;
        }
      }
    }
  }, {
    key: "scroll_to",
    value: function scroll_to(t) {
      if (this.tv.$refs.chart.cursor.locked) return;
      var last = this.tv.$refs.chart.last_candle;
      if (!last) return;
      var tl = last[0];
      var d = this.tv.getRange()[1] - tl;
      if (d > 0) this.tv["goto"](t + d);
    }
  }]);
}(DCEvents);

;// ./src/helpers/sett_proxy.js
// Sends all dc.sett changes to the web-worker

/* harmony default export */ function sett_proxy(sett, ww) {
  var h = {
    get: function get(sett, k) {
      return sett[k];
    },
    set: function set(sett, k, v) {
      sett[k] = v;
      ww.just('update-dc-settings', sett);
      return true;
    }
  };
  ww.just('update-dc-settings', sett);
  return new Proxy(sett, h);
}
;// ./src/helpers/agg_tool.js


// Tick aggregation


var AggTool = /*#__PURE__*/function () {
  function AggTool(dc, _int) {
    if (_int === void 0) {
      _int = 100;
    }
    classCallCheck_classCallCheck(this, AggTool);
    this.symbols = {};
    this["int"] = _int; // Itarval in ms
    this.dc = dc;
    this.st_id = null;
    this.data_changed = false;
  }
  return createClass_createClass(AggTool, [{
    key: "push",
    value: function push(sym, upd, tf) {
      var _this = this;
      // Start auto updates
      if (!this.st_id) {
        this.st_id = setTimeout(function () {
          return _this.update();
        });
      }
      tf = parseInt(tf);
      var old = this.symbols[sym];
      var t = utils.now();
      var isds = sym.includes('datasets.');
      this.data_changed = true;
      if (!old) {
        this.symbols[sym] = {
          upd: upd,
          t: t,
          data: []
        };
      } else if (upd[0] >= old.upd[0] + tf && !isds) {
        // Refine the previous data point
        this.refine(sym, old.upd.slice());
        this.symbols[sym] = {
          upd: upd,
          t: t,
          data: []
        };
      } else {
        // Tick updates the current
        this.symbols[sym].upd = upd;
        this.symbols[sym].t = t;
      }
      if (isds) {
        this.symbols[sym].data.push(upd);
      }
    }
  }, {
    key: "update",
    value: function update() {
      var _this2 = this;
      var out = {};
      for (var sym in this.symbols) {
        var upd = this.symbols[sym].upd;
        switch (sym) {
          case 'ohlcv':
            var data = this.dc.data.chart.data;
            this.dc.fast_merge(data, upd);
            out.ohlcv = data.slice(-2);
            break;
          default:
            if (sym.includes('datasets.')) {
              this.update_ds(sym, out);
              continue;
            }
            var data = this.dc.get_one("".concat(sym));
            if (!data) continue;
            this.dc.fast_merge(data, upd, false);
            break;
        }
      }
      // TODO: fill gaps
      if (this.data_changed) {
        this.dc.ww.just('update-data', out);
        this.data_changed = false;
      }
      setTimeout(function () {
        return _this2.update();
      }, this["int"]);
    }
  }, {
    key: "refine",
    value: function refine(sym, upd) {
      if (sym === 'ohlcv') {
        var data = this.dc.data.chart.data;
        this.dc.fast_merge(data, upd);
      } else {
        var data = this.dc.get_one("".concat(sym));
        if (!data) return;
        this.dc.fast_merge(data, upd, false);
      }
    }
  }, {
    key: "update_ds",
    value: function update_ds(sym, out) {
      var data = this.symbols[sym].data;
      if (data.length) {
        out[sym] = data;
        this.symbols[sym].data = [];
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      this.symbols = {};
    }
  }]);
}();

;// ./src/helpers/datacube.js






function datacube_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = datacube_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function datacube_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return datacube_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? datacube_arrayLikeToArray(r, a) : void 0; } }
function datacube_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function datacube_callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, datacube_isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function datacube_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (datacube_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
// Main DataHelper class. A container for data,
// which works as a proxy and CRUD interface






// Interface methods. Private methods in dc_core.js
var DataCube = /*#__PURE__*/function (_DCCore) {
  function DataCube(data, sett) {
    var _this;
    if (data === void 0) {
      data = {};
    }
    if (sett === void 0) {
      sett = {};
    }
    classCallCheck_classCallCheck(this, DataCube);
    var def_sett = {
      aggregation: 100,
      // Update aggregation interval
      script_depth: 0,
      // 0 === Exec on all data
      auto_scroll: true,
      // Auto scroll to a new candle
      scripts: true,
      // Enable overlays scripts,
      ww_ram_limit: 0,
      // WebWorker RAM limit (MB)
      node_url: null,
      // Use node.js instead of WW
      shift_measure: true // Draw measurment shift+click
    };
    sett = Object.assign(def_sett, sett);
    _this = datacube_callSuper(this, DataCube);
    _this.sett = sett;
    _this.data = data;
    _this.sett = sett_proxy(sett, _this.ww);
    _this.agg = new AggTool(_this, sett.aggregation);
    _this.se_state = {};

    //this.agg.update = this.agg_update.bind(this)
    return _this;
  }

  // Add new overlay
  _inherits(DataCube, _DCCore);
  return createClass_createClass(DataCube, [{
    key: "add",
    value: function add(side, overlay) {
      if (side !== 'onchart' && side !== 'offchart' && side !== 'datasets') {
        return;
      }
      this.data[side].push(overlay);
      this.update_ids();
      return overlay.id;
    }

    // Get all objects matching the query
  }, {
    key: "get",
    value: function get(query) {
      return this.get_by_query(query).map(function (x) {
        return x.v;
      });
    }

    // Get first object matching the query
  }, {
    key: "get_one",
    value: function get_one(query) {
      return this.get_by_query(query).map(function (x) {
        return x.v;
      })[0];
    }

    // Set data (reactively)
  }, {
    key: "set",
    value: function set(query, data) {
      var objects = this.get_by_query(query);
      var _iterator = datacube_createForOfIteratorHelper(objects),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var obj = _step.value;
          var i = obj.i !== undefined ? obj.i : obj.p.indexOf(obj.v);
          if (i !== -1) {
            this.tv.$set(obj.p, i, data);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      this.update_ids();
    }

    // Merge object or array (reactively)
  }, {
    key: "merge",
    value: function merge(query, data) {
      var objects = this.get_by_query(query);
      var _iterator2 = datacube_createForOfIteratorHelper(objects),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var obj = _step2.value;
          if (Array.isArray(obj.v)) {
            if (!Array.isArray(data)) continue;
            // If array is a timeseries, merge it by timestamp
            // else merge by item index
            if (obj.v[0] && obj.v[0].length >= 2) {
              this.merge_ts(obj, data);
            } else {
              this.merge_objects(obj, data, []);
            }
          } else if (typeof_typeof(obj.v) === 'object') {
            this.merge_objects(obj, data);
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      this.update_ids();
    }

    // Remove an overlay by query (id/type/name/...)
  }, {
    key: "del",
    value: function del(query) {
      var objects = this.get_by_query(query);
      var _iterator3 = datacube_createForOfIteratorHelper(objects),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var obj = _step3.value;
          // Find current index of the field (if not defined)
          var i = typeof obj.i !== 'number' ? obj.i : obj.p.indexOf(obj.v);
          if (i !== -1) {
            this.tv.$delete(obj.p, i);
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      this.update_ids();
    }

    // Update/append data point, depending on timestamp
  }, {
    key: "update",
    value: function update(data) {
      if (data['candle']) {
        return this.update_candle(data);
      } else {
        return this.update_tick(data);
      }
    }

    // Lock overlays from being pulled by query_search
    // TODO: subject to review
  }, {
    key: "lock",
    value: function lock(query) {
      var objects = this.get_by_query(query);
      objects.forEach(function (x) {
        if (x.v && x.v.id && x.v.type) {
          x.v.locked = true;
        }
      });
    }

    // Unlock overlays from being pulled by query_search
    //
  }, {
    key: "unlock",
    value: function unlock(query) {
      var objects = this.get_by_query(query, true);
      objects.forEach(function (x) {
        if (x.v && x.v.id && x.v.type) {
          x.v.locked = false;
        }
      });
    }

    // Show indicator
  }, {
    key: "show",
    value: function show(query) {
      if (query === 'offchart' || query === 'onchart') {
        query += '.';
      } else if (query === '.') {
        query = '';
      }
      this.merge(query + '.settings', {
        display: true
      });
    }

    // Hide indicator
  }, {
    key: "hide",
    value: function hide(query) {
      if (query === 'offchart' || query === 'onchart') {
        query += '.';
      } else if (query === '.') {
        query = '';
      }
      this.merge(query + '.settings', {
        display: false
      });
    }

    // Set data loader callback
  }, {
    key: "onrange",
    value: function onrange(callback) {
      var _this2 = this;
      this.loader = callback;
      setTimeout(function () {
        return _this2.tv.set_loader(callback ? _this2 : null);
      }, 0);
    }
  }]);
}(DCCore);

;// ./src/mixins/interface.js
// Html interface, shown on top of the grid.
// Can be static (a tooltip) or interactive,
// e.g. a control panel.

/* harmony default export */ const mixins_interface = ({
  props: ['ux', 'updater', 'colors', 'wrapper'],
  mounted: function mounted() {
    this._$emit = this.$emit;
    this.$emit = this.custom_event;
    if (this.init) this.init();
  },
  methods: {
    close: function close() {
      this.$emit('custom-event', {
        event: 'close-interface',
        args: [this.$props.ux.uuid]
      });
    },
    // TODO: emit all the way to the uxlist
    // add apply the changes there
    modify: function modify(obj) {
      this.$emit('custom-event', {
        event: 'modify-interface',
        args: [this.$props.ux.uuid, obj]
      });
    },
    custom_event: function custom_event(event) {
      if (event.split(':')[0] === 'hook') return;
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      this._$emit('custom-event', {
        event: event,
        args: args
      });
    }
  },
  computed: {
    overlay: function overlay() {
      return this.$props.ux.overlay;
    },
    layout: function layout() {
      return this.overlay.layout;
    },
    uxr: function uxr() {
      return this.$props.ux;
    }
  },
  data: function data() {
    return {};
  }
});
;// ./src/index.js















var primitives = {
  Candle: CandleExt,
  Volbar: VolbarExt,
  Line: Line,
  Pin: Pin,
  Price: Price,
  Ray: Ray,
  Seg: Seg
};
TradingVue.install = function (Vue) {
  Vue.component(TradingVue.name, TradingVue);
};
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(TradingVue);
  window.TradingVueLib = {
    TradingVue: TradingVue,
    Overlay: overlay,
    Utils: utils,
    Constants: constants,
    Candle: CandleExt,
    Volbar: VolbarExt,
    layout_cnv: layout_cnv,
    layout_vol: layout_vol,
    DataCube: DataCube,
    Tool: tool,
    Interface: mixins_interface,
    primitives: primitives
  };
}
/* harmony default export */ const src = (TradingVue);

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=trading-vue.js.map