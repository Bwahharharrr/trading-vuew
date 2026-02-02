/*!
 * TradingVue.JS - v1.0.2 - Mon Feb 02 2026
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

/***/ 93:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(860);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("35b718fe", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 108:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(484);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("1239fc3f", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

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

/***/ 484:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-section {\n    height: 0;\n    position: absolute;\n}\n", ""]);
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
var content = __webpack_require__(965);
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

/***/ 640:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n/* Anit-boostrap tactix */\n.trading-vue *, ::after, ::before {\n    box-sizing: content-box;\n}\n.trading-vue img {\n    vertical-align: initial;\n}\n", ""]);
// Exports
module.exports = exports;


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

/***/ 860:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-legend {\n    position: relative;\n    z-index: 100;\n    font-size: 1.25em;\n    margin-left: 10px;\n    pointer-events: auto;\n    text-align: left;\n    user-select: none;\n    font-weight: 300;\n    cursor: default;\n}\n@media (min-resolution: 2x) {\n.trading-vue-legend {\n        font-weight: 400;\n}\n}\n.trading-vue-ohlcv {\n    pointer-events: auto;\n    margin-bottom: 0.5em;\n}\n.t-vue-lspan {\n    font-variant-numeric: tabular-nums;\n    font-size: 0.95em;\n    color: #999999; /* TODO: move => params */\n    margin-left: 0.1em;\n    margin-right: 0.2em;\n}\n.t-vue-title {\n    margin-right: 0.25em;\n    font-size: 1.45em;\n}\n.t-vue-ind {\n    margin-left: 0.2em;\n    margin-bottom: 0.5em;\n    font-size: 1.0em;\n    margin-top: 0.3em;\n    display: flex;\n    align-items: center;\n    flex-wrap: wrap;\n    pointer-events: auto;\n}\n.t-vue-settings-btn {\n    background: none;\n    border: none;\n    color: #808a9d;\n    cursor: pointer;\n    padding: 2px 4px;\n    margin-left: 4px;\n    border-radius: 3px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    transition: all 0.15s ease;\n    position: relative;\n    z-index: 10;\n}\n.t-vue-settings-btn:hover {\n    color: #35a776;\n    background: rgba(53, 167, 118, 0.1);\n}\n.t-vue-settings-btn svg {\n    display: block;\n}\n.t-vue-close-btn {\n    background: none;\n    border: none;\n    color: #808a9d;\n    cursor: pointer;\n    padding: 2px 4px;\n    margin-left: 2px;\n    border-radius: 3px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    transition: all 0.15s ease;\n    position: relative;\n    z-index: 10;\n}\n.t-vue-close-btn:hover {\n    color: #e54077;\n    background: rgba(229, 64, 119, 0.1);\n}\n.t-vue-close-btn svg {\n    display: block;\n}\n.t-vue-ivalue {\n    margin-left: 0.5em;\n}\n.t-vue-unknown {\n    color: #999999; /* TODO: move => params */\n}\n.tvjs-appear-enter-active,\n.tvjs-appear-leave-active\n{\n    transition: all .25s ease;\n}\n.tvjs-appear-enter, .tvjs-appear-leave-to\n{\n    opacity: 0;\n}\n", ""]);
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

/***/ 943:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(640);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(534)/* ["default"] */ .A)
var update = add("146efd38", content, false, {});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 965:
/***/ ((module, exports, __webpack_require__) => {

// Imports
var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(314);
exports = ___CSS_LOADER_API_IMPORT___(false);
// Module
exports.push([module.id, "\n.trading-vue-tbitem {\n}\n.trading-vue-tbitem:hover {\n    background-color: #76878319;\n}\n.trading-vue-tbitem-exp {\n    position: absolute;\n    right: -3px;\n    padding: 18.5px 5px;\n    font-stretch: extra-condensed;\n    transform: scaleX(0.6);\n    font-size: 0.6em;\n    opacity: 0.0;\n    user-select: none;\n    line-height: 0;\n}\n.trading-vue-tbitem:hover\n.trading-vue-tbitem-exp {\n    opacity: 0.5;\n}\n.trading-vue-tbitem-exp:hover {\n    background-color: #76878330;\n    opacity: 0.9 !important;\n}\n.trading-vue-tbicon {\n    position: absolute;\n}\n.trading-vue-tbitem.selected-item > .trading-vue-tbicon,\n.tvjs-item-list-item.selected-item > .trading-vue-tbicon {\n     filter: brightness(1.45) sepia(1) hue-rotate(90deg) saturate(4.5) !important;\n}\n.tvjs-pixelated {\n    -ms-interpolation-mode: nearest-neighbor;\n    image-rendering: -webkit-optimize-contrast;\n    image-rendering: -webkit-crisp-edges;\n    image-rendering: -moz-crisp-edges;\n    image-rendering: -o-crisp-edges;\n    image-rendering: pixelated;\n}\n\n", ""]);
// Exports
module.exports = exports;


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

;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/TradingVue.vue?vue&type=template&id=1a7a1650
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

;// ./src/TradingVue.vue?vue&type=template&id=1a7a1650

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
// Script buffer constants
var DEF_LIMIT = 5; // default buffer length
var BUF_INC = 5; // buffer increment for time series

// Function definition regex patterns for script parsing
// FDEFS: Basic function matching (non-greedy, global, multi-line, case-insensitive)
var FDEFS = /(function |)([$A-Z_][0-9A-Z_$\.]*)[\s]*?\((.*?)\)/gmi;
// FDEFS1: Single match with trailing whitespace (non-global)
var FDEFS1 = /(function |)([$A-Z_][0-9A-Z_$\.]*)[\s]*?\((.*?\s*)\)/mi;
// FDEFS2: Multi-line with dotall for spanning across lines
var FDEFS2 = /(function |)([$A-Z_][0-9A-Z_$\.]*)[\s]*?\(([^]*\s*)\)/gmi;
// SBRACKETS: Array bracket access pattern
var SBRACKETS = /([$A-Z_][0-9A-Z_$\.]*)[\s]*?\[([^"^\[^\]]+?)\]/gmi;
// TFSTR: Timeframe string pattern (e.g., "15m", "1h")
var TFSTR = /(\d+)(\w*)/gm;
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
  DEF_LIMIT: DEF_LIMIT,
  BUF_INC: BUF_INC,
  FDEFS: FDEFS,
  FDEFS1: FDEFS1,
  FDEFS2: FDEFS2,
  SBRACKETS: SBRACKETS,
  TFSTR: TFSTR,
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
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Chart.vue?vue&type=template&id=b1f0b6a6
var Chartvue_type_template_id_b1f0b6a6_render = function render() {
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
var Chartvue_type_template_id_b1f0b6a6_staticRenderFns = [];
Chartvue_type_template_id_b1f0b6a6_render._withStripped = true;

;// ./src/components/Chart.vue?vue&type=template&id=b1f0b6a6

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
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}

;// ./node_modules/@babel/runtime/helpers/esm/toPrimitive.js

function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}

;// ./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js


function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
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
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Section.vue?vue&type=template&id=d047b52a
var Sectionvue_type_template_id_d047b52a_render = function render() {
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
      "open-indicator-settings": _vm.open_indicator_settings,
      "close-indicator": _vm.close_indicator
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
var Sectionvue_type_template_id_d047b52a_staticRenderFns = [];
Sectionvue_type_template_id_d047b52a_render._withStripped = true;

;// ./src/components/Section.vue?vue&type=template&id=d047b52a

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
  computed: {
    sett: function sett() {
      return this.$props.settings;
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

;// ./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
function _assertThisInitialized(e) {
  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}

;// ./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js


function _possibleConstructorReturn(t, e) {
  if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
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

;// ./src/components/primitives/primitive-base.js


// Base class for drawing primitives with collision detection


var PrimitiveBase = /*#__PURE__*/function () {
  // Overlay ref, canvas ctx
  function PrimitiveBase(overlay, ctx) {
    classCallCheck_classCallCheck(this, PrimitiveBase);
    this.ctx = ctx;
    this.comp = overlay;
    this.T = overlay.$props.config.TOOL_COLL;
    if (utils.is_mobile) this.T *= 2;
  }

  // Get layout helper
  return createClass_createClass(PrimitiveBase, [{
    key: "layout",
    get: function get() {
      return this.comp.$props.layout;
    }

    // Convert time-price to screen coordinates
  }, {
    key: "toScreen",
    value: function toScreen(p) {
      return [this.layout.t2screen(p[0]), this.layout.$2screen(p[1])];
    }
  }]);
}();

;// ./src/components/primitives/seg.js






function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
// Draws a segment, adds corresponding collision f-n



var Seg = /*#__PURE__*/function (_PrimitiveBase) {
  function Seg() {
    classCallCheck_classCallCheck(this, Seg);
    return _callSuper(this, Seg, arguments);
  }
  _inherits(Seg, _PrimitiveBase);
  return createClass_createClass(Seg, [{
    key: "draw",
    value:
    // p1[t, $], p2[t, $] (time-price coordinates)
    function draw(p1, p2) {
      var _this$toScreen = this.toScreen(p1),
        _this$toScreen2 = _slicedToArray(_this$toScreen, 2),
        x1 = _this$toScreen2[0],
        y1 = _this$toScreen2[1];
      var _this$toScreen3 = this.toScreen(p2),
        _this$toScreen4 = _slicedToArray(_this$toScreen3, 2),
        x2 = _this$toScreen4[0],
        y2 = _this$toScreen4[1];
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
}(PrimitiveBase);

;// ./src/components/primitives/line.js






function line_callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, line_isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function line_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (line_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
// Draws a line, adds corresponding collision f-n



var Line = /*#__PURE__*/function (_PrimitiveBase) {
  function Line() {
    classCallCheck_classCallCheck(this, Line);
    return line_callSuper(this, Line, arguments);
  }
  _inherits(Line, _PrimitiveBase);
  return createClass_createClass(Line, [{
    key: "draw",
    value:
    // p1[t, $], p2[t, $] (time-price coordinates)
    function draw(p1, p2) {
      var layout = this.layout;
      var _this$toScreen = this.toScreen(p1),
        _this$toScreen2 = _slicedToArray(_this$toScreen, 2),
        x1 = _this$toScreen2[0],
        y1 = _this$toScreen2[1];
      var _this$toScreen3 = this.toScreen(p2),
        _this$toScreen4 = _slicedToArray(_this$toScreen3, 2),
        x2 = _this$toScreen4[0],
        y2 = _this$toScreen4[1];
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
}(PrimitiveBase);

;// ./src/components/primitives/ray.js





function ray_callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, ray_isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function ray_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (ray_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
// Draws a ray, adds corresponding collision f-n


var Ray = /*#__PURE__*/function (_Line) {
  function Ray(overlay, ctx) {
    var _this;
    classCallCheck_classCallCheck(this, Ray);
    _this = ray_callSuper(this, Ray, [overlay, ctx]);
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
;// ./src/mixins/bar-chart-base.js
function bar_chart_base_createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = bar_chart_base_unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function bar_chart_base_unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return bar_chart_base_arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? bar_chart_base_arrayLikeToArray(r, a) : void 0; } }
function bar_chart_base_arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Shared mixin for bar-chart style overlays (Histogram, Bar)
// Draws values as vertical bars from a baseline

/* harmony default export */ const bar_chart_base = ({
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
      var barWidth = Math.max(1, layout.px_step * this.bar_width_ratio);
      for (var k = 0, n = data.length; k < n; k++) {
        var p = data[k];
        if (p[i] == null) continue;
        var x = layout.t2screen(p[0]);
        var y = layout.$2screen(p[i]);
        var y0 = layout.$2screen(baseline);
        var isPositive = p[i] >= baseline;
        ctx.fillStyle = isPositive ? this.colorUp : this.colorDown;
        var barX = x - barWidth / 2;
        var barY = Math.min(y, y0);
        var barHeight = Math.abs(y - y0) || 1;
        ctx.fillRect(barX, barY, barWidth, barHeight);
      }
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
    y_range: function y_range(hi, lo) {
      var data = this.$props.data;
      var i = this.data_index;
      var max = -Infinity;
      var min = Infinity;
      var _iterator = bar_chart_base_createForOfIteratorHelper(data),
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
      var baseline = this.baseline;
      if (baseline < min) min = baseline;
      if (baseline > max) max = baseline;
      var pad = (max - min) * 0.1 || 1;
      return [max + pad, min - pad];
    }
  },
  computed: {
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
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/overlays/Histogram.vue?vue&type=script&lang=js
// Histogram renderer - draws values as histogram bars
// Uses wider bars (0.8 ratio) with baseline extension



/* harmony default export */ const Histogramvue_type_script_lang_js = ({
  name: 'Histogram',
  mixins: [overlay, bar_chart_base],
  methods: {
    use_for: function use_for() {
      return ['Histogram'];
    }
  },
  computed: {
    colorUp: function colorUp() {
      return this.sett.colorUp || this.sett.color || '#26A69A';
    },
    bar_width_ratio: function bar_width_ratio() {
      return this.sett.barWidth || 0.8;
    }
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
// Bar renderer - draws each value as an individual thin bar
// Uses thinner bars (0.4 ratio) by default



/* harmony default export */ const Barvue_type_script_lang_js = ({
  name: 'Bar',
  mixins: [overlay, bar_chart_base],
  methods: {
    use_for: function use_for() {
      return ['Bar'];
    }
  },
  computed: {
    colorUp: function colorUp() {
      return this.sett.colorUp || this.sett.color || '#612ff9';
    },
    bar_width_ratio: function bar_width_ratio() {
      return this.sett.barWidth || 0.4;
    }
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
;// ./node_modules/babel-loader/lib/index.js!./node_modules/vue-loader/lib/loaders/templateLoader.js??ruleSet[1].rules[2]!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Legend.vue?vue&type=template&id=8bfdac32
var Legendvue_type_template_id_8bfdac32_render = function render() {
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
    })])]) : _vm._e(), _vm._v(" "), _vm.grid_id > 0 ? _c("button", {
      staticClass: "t-vue-close-btn",
      attrs: {
        title: "Remove indicator"
      },
      on: {
        click: function click($event) {
          $event.stopPropagation();
          return _vm.closeIndicator(ind);
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
        d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
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
var Legendvue_type_template_id_8bfdac32_staticRenderFns = [];
Legendvue_type_template_id_8bfdac32_render._withStripped = true;

;// ./src/components/Legend.vue?vue&type=template&id=8bfdac32

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
    },
    closeIndicator: function closeIndicator(indicator) {
      this.$emit('close-indicator', {
        name: indicator.name,
        index: indicator.index,
        gridId: this.$props.grid_id
      });
    }
  }
});
;// ./src/components/Legend.vue?vue&type=script&lang=js
 /* harmony default export */ const components_Legendvue_type_script_lang_js = (Legendvue_type_script_lang_js); 
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Legend.vue?vue&type=style&index=0&id=8bfdac32&prod&lang=css
var Legendvue_type_style_index_0_id_8bfdac32_prod_lang_css = __webpack_require__(93);
;// ./src/components/Legend.vue?vue&type=style&index=0&id=8bfdac32&prod&lang=css

;// ./src/components/Legend.vue



;


/* normalize component */

var Legend_component = normalizeComponent(
  components_Legendvue_type_script_lang_js,
  Legendvue_type_template_id_8bfdac32_render,
  Legendvue_type_template_id_8bfdac32_staticRenderFns,
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
    close_indicator: function close_indicator(indicatorInfo) {
      // Emit as custom event to be handled by Chart.vue -> App.vue
      this.$emit('custom-event', {
        event: 'close-indicator',
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
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/components/Section.vue?vue&type=style&index=0&id=d047b52a&prod&lang=css
var Sectionvue_type_style_index_0_id_d047b52a_prod_lang_css = __webpack_require__(108);
;// ./src/components/Section.vue?vue&type=style&index=0&id=d047b52a&prod&lang=css

;// ./src/components/Section.vue



;


/* normalize component */

var Section_component = normalizeComponent(
  components_Sectionvue_type_script_lang_js,
  Sectionvue_type_template_id_d047b52a_render,
  Sectionvue_type_template_id_d047b52a_staticRenderFns,
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
      // Note: close-indicator is handled via custom-event mechanism in TradingVue.vue
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
  Chartvue_type_template_id_b1f0b6a6_render,
  Chartvue_type_template_id_b1f0b6a6_staticRenderFns,
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
    // Note: close-indicator is handled via custom_event() below
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
// EXTERNAL MODULE: ./node_modules/vue-style-loader/index.js!./node_modules/css-loader/dist/cjs.js!./node_modules/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/vue-loader/lib/index.js??vue-loader-options!./src/TradingVue.vue?vue&type=style&index=0&id=1a7a1650&prod&lang=css
var TradingVuevue_type_style_index_0_id_1a7a1650_prod_lang_css = __webpack_require__(943);
;// ./src/TradingVue.vue?vue&type=style&index=0&id=1a7a1650&prod&lang=css

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
    this.last_upd = Utils.now();
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
      this.last_upd = Utils.now();
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
        se.data[id].last_upd = Utils.now();
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
          if (_typeof(obj[k]) === 'object') {
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
          } else if (_typeof(obj.v) === 'object') {
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