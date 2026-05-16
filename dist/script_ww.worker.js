/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@babel/runtime/helpers/OverloadYield.js"
/*!**************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/OverloadYield.js ***!
  \**************************************************************/
(module) {

function _OverloadYield(e, d) {
  this.v = e, this.k = d;
}
module.exports = _OverloadYield, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js"
/*!*********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayLikeToArray)
/* harmony export */ });
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js"
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js ***!
  \*******************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayWithHoles)
/* harmony export */ });
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js"
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js ***!
  \**********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _arrayWithoutHoles)
/* harmony export */ });
/* harmony import */ var _arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayLikeToArray.js */ "./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js");

function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(r);
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js"
/*!*********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _asyncToGenerator)
/* harmony export */ });
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


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js"
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js ***!
  \*******************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _classCallCheck)
/* harmony export */ });
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/construct.js"
/*!**************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/construct.js ***!
  \**************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _construct)
/* harmony export */ });
/* harmony import */ var _isNativeReflectConstruct_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./isNativeReflectConstruct.js */ "./node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js");
/* harmony import */ var _setPrototypeOf_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./setPrototypeOf.js */ "./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js");


function _construct(t, e, r) {
  if ((0,_isNativeReflectConstruct_js__WEBPACK_IMPORTED_MODULE_0__["default"])()) return Reflect.construct.apply(null, arguments);
  var o = [null];
  o.push.apply(o, e);
  var p = new (t.bind.apply(t, o))();
  return r && (0,_setPrototypeOf_js__WEBPACK_IMPORTED_MODULE_1__["default"])(p, r.prototype), p;
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/createClass.js"
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/createClass.js ***!
  \****************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _createClass)
/* harmony export */ });
/* harmony import */ var _toPropertyKey_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./toPropertyKey.js */ "./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js");

function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, (0,_toPropertyKey_js__WEBPACK_IMPORTED_MODULE_0__["default"])(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js"
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/defineProperty.js ***!
  \*******************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _defineProperty)
/* harmony export */ });
/* harmony import */ var _toPropertyKey_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./toPropertyKey.js */ "./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js");

function _defineProperty(e, r, t) {
  return (r = (0,_toPropertyKey_js__WEBPACK_IMPORTED_MODULE_0__["default"])(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js"
/*!*****************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js ***!
  \*****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _isNativeReflectConstruct)
/* harmony export */ });
function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
  } catch (t) {}
  return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
    return !!t;
  })();
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/iterableToArray.js"
/*!********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/iterableToArray.js ***!
  \********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _iterableToArray)
/* harmony export */ });
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js"
/*!*************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _iterableToArrayLimit)
/* harmony export */ });
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


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js"
/*!********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js ***!
  \********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _nonIterableRest)
/* harmony export */ });
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js"
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js ***!
  \**********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _nonIterableSpread)
/* harmony export */ });
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js"
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js ***!
  \*******************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _setPrototypeOf)
/* harmony export */ });
function _setPrototypeOf(t, e) {
  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
    return t.__proto__ = e, t;
  }, _setPrototypeOf(t, e);
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js"
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js ***!
  \******************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _slicedToArray)
/* harmony export */ });
/* harmony import */ var _arrayWithHoles_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayWithHoles.js */ "./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js");
/* harmony import */ var _iterableToArrayLimit_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./iterableToArrayLimit.js */ "./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js");
/* harmony import */ var _unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./unsupportedIterableToArray.js */ "./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js");
/* harmony import */ var _nonIterableRest_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./nonIterableRest.js */ "./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js");




function _slicedToArray(r, e) {
  return (0,_arrayWithHoles_js__WEBPACK_IMPORTED_MODULE_0__["default"])(r) || (0,_iterableToArrayLimit_js__WEBPACK_IMPORTED_MODULE_1__["default"])(r, e) || (0,_unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(r, e) || (0,_nonIterableRest_js__WEBPACK_IMPORTED_MODULE_3__["default"])();
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js"
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js ***!
  \**********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _toConsumableArray)
/* harmony export */ });
/* harmony import */ var _arrayWithoutHoles_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayWithoutHoles.js */ "./node_modules/@babel/runtime/helpers/esm/arrayWithoutHoles.js");
/* harmony import */ var _iterableToArray_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./iterableToArray.js */ "./node_modules/@babel/runtime/helpers/esm/iterableToArray.js");
/* harmony import */ var _unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./unsupportedIterableToArray.js */ "./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js");
/* harmony import */ var _nonIterableSpread_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./nonIterableSpread.js */ "./node_modules/@babel/runtime/helpers/esm/nonIterableSpread.js");




function _toConsumableArray(r) {
  return (0,_arrayWithoutHoles_js__WEBPACK_IMPORTED_MODULE_0__["default"])(r) || (0,_iterableToArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(r) || (0,_unsupportedIterableToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(r) || (0,_nonIterableSpread_js__WEBPACK_IMPORTED_MODULE_3__["default"])();
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/toPrimitive.js"
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/toPrimitive.js ***!
  \****************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ toPrimitive)
/* harmony export */ });
/* harmony import */ var _typeof_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./typeof.js */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");

function toPrimitive(t, r) {
  if ("object" != (0,_typeof_js__WEBPACK_IMPORTED_MODULE_0__["default"])(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != (0,_typeof_js__WEBPACK_IMPORTED_MODULE_0__["default"])(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js"
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js ***!
  \******************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ toPropertyKey)
/* harmony export */ });
/* harmony import */ var _typeof_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./typeof.js */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");
/* harmony import */ var _toPrimitive_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./toPrimitive.js */ "./node_modules/@babel/runtime/helpers/esm/toPrimitive.js");


function toPropertyKey(t) {
  var i = (0,_toPrimitive_js__WEBPACK_IMPORTED_MODULE_1__["default"])(t, "string");
  return "symbol" == (0,_typeof_js__WEBPACK_IMPORTED_MODULE_0__["default"])(i) ? i : i + "";
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/typeof.js"
/*!***********************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/typeof.js ***!
  \***********************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _typeof)
/* harmony export */ });
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js"
/*!*******************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js ***!
  \*******************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _unsupportedIterableToArray)
/* harmony export */ });
/* harmony import */ var _arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayLikeToArray.js */ "./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js");

function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? (0,_arrayLikeToArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(r, a) : void 0;
  }
}


/***/ },

/***/ "./node_modules/@babel/runtime/helpers/regenerator.js"
/*!************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regenerator.js ***!
  \************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

var regeneratorDefine = __webpack_require__(/*! ./regeneratorDefine.js */ "./node_modules/@babel/runtime/helpers/regeneratorDefine.js");
function _regenerator() {
  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
  var e,
    t,
    r = "function" == typeof Symbol ? Symbol : {},
    n = r.iterator || "@@iterator",
    o = r.toStringTag || "@@toStringTag";
  function i(r, n, o, i) {
    var c = n && n.prototype instanceof Generator ? n : Generator,
      u = Object.create(c.prototype);
    return regeneratorDefine(u, "_invoke", function (r, n, o) {
      var i,
        c,
        u,
        f = 0,
        p = o || [],
        y = !1,
        G = {
          p: 0,
          n: 0,
          v: e,
          a: d,
          f: d.bind(e, 4),
          d: function d(t, r) {
            return i = t, c = 0, u = e, G.n = r, a;
          }
        };
      function d(r, n) {
        for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
          var o,
            i = p[t],
            d = G.p,
            l = i[2];
          r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
        }
        if (o || r > 1) return a;
        throw y = !0, n;
      }
      return function (o, p, l) {
        if (f > 1) throw TypeError("Generator is already running");
        for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
          i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
          try {
            if (f = 2, i) {
              if (c || (o = "next"), t = i[o]) {
                if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
                if (!t.done) return t;
                u = t.value, c < 2 && (c = 0);
              } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
              i = e;
            } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
          } catch (t) {
            i = e, c = 1, u = t;
          } finally {
            f = 1;
          }
        }
        return {
          value: t,
          done: y
        };
      };
    }(r, o, i), !0), u;
  }
  var a = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  t = Object.getPrototypeOf;
  var c = [][n] ? t(t([][n]())) : (regeneratorDefine(t = {}, n, function () {
      return this;
    }), t),
    u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
  function f(e) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, regeneratorDefine(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, regeneratorDefine(u, "constructor", GeneratorFunctionPrototype), regeneratorDefine(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", regeneratorDefine(GeneratorFunctionPrototype, o, "GeneratorFunction"), regeneratorDefine(u), regeneratorDefine(u, o, "Generator"), regeneratorDefine(u, n, function () {
    return this;
  }), regeneratorDefine(u, "toString", function () {
    return "[object Generator]";
  }), (module.exports = _regenerator = function _regenerator() {
    return {
      w: i,
      m: f
    };
  }, module.exports.__esModule = true, module.exports["default"] = module.exports)();
}
module.exports = _regenerator, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/regeneratorAsync.js"
/*!*****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regeneratorAsync.js ***!
  \*****************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

var regeneratorAsyncGen = __webpack_require__(/*! ./regeneratorAsyncGen.js */ "./node_modules/@babel/runtime/helpers/regeneratorAsyncGen.js");
function _regeneratorAsync(n, e, r, t, o) {
  var a = regeneratorAsyncGen(n, e, r, t, o);
  return a.next().then(function (n) {
    return n.done ? n.value : a.next();
  });
}
module.exports = _regeneratorAsync, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/regeneratorAsyncGen.js"
/*!********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regeneratorAsyncGen.js ***!
  \********************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

var regenerator = __webpack_require__(/*! ./regenerator.js */ "./node_modules/@babel/runtime/helpers/regenerator.js");
var regeneratorAsyncIterator = __webpack_require__(/*! ./regeneratorAsyncIterator.js */ "./node_modules/@babel/runtime/helpers/regeneratorAsyncIterator.js");
function _regeneratorAsyncGen(r, e, t, o, n) {
  return new regeneratorAsyncIterator(regenerator().w(r, e, t, o), n || Promise);
}
module.exports = _regeneratorAsyncGen, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/regeneratorAsyncIterator.js"
/*!*************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regeneratorAsyncIterator.js ***!
  \*************************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

var OverloadYield = __webpack_require__(/*! ./OverloadYield.js */ "./node_modules/@babel/runtime/helpers/OverloadYield.js");
var regeneratorDefine = __webpack_require__(/*! ./regeneratorDefine.js */ "./node_modules/@babel/runtime/helpers/regeneratorDefine.js");
function AsyncIterator(t, e) {
  function n(r, o, i, f) {
    try {
      var c = t[r](o),
        u = c.value;
      return u instanceof OverloadYield ? e.resolve(u.v).then(function (t) {
        n("next", t, i, f);
      }, function (t) {
        n("throw", t, i, f);
      }) : e.resolve(u).then(function (t) {
        c.value = t, i(c);
      }, function (t) {
        return n("throw", t, i, f);
      });
    } catch (t) {
      f(t);
    }
  }
  var r;
  this.next || (regeneratorDefine(AsyncIterator.prototype), regeneratorDefine(AsyncIterator.prototype, "function" == typeof Symbol && Symbol.asyncIterator || "@asyncIterator", function () {
    return this;
  })), regeneratorDefine(this, "_invoke", function (t, o, i) {
    function f() {
      return new e(function (e, r) {
        n(t, i, e, r);
      });
    }
    return r = r ? r.then(f, f) : f();
  }, !0);
}
module.exports = AsyncIterator, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/regeneratorDefine.js"
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regeneratorDefine.js ***!
  \******************************************************************/
(module) {

function _regeneratorDefine(e, r, n, t) {
  var i = Object.defineProperty;
  try {
    i({}, "", {});
  } catch (e) {
    i = 0;
  }
  module.exports = _regeneratorDefine = function regeneratorDefine(e, r, n, t) {
    function o(r, n) {
      _regeneratorDefine(e, r, function (e) {
        return this._invoke(r, n, e);
      });
    }
    r ? i ? i(e, r, {
      value: n,
      enumerable: !t,
      configurable: !t,
      writable: !t
    }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _regeneratorDefine(e, r, n, t);
}
module.exports = _regeneratorDefine, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/regeneratorKeys.js"
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regeneratorKeys.js ***!
  \****************************************************************/
(module) {

function _regeneratorKeys(e) {
  var n = Object(e),
    r = [];
  for (var t in n) r.unshift(t);
  return function e() {
    for (; r.length;) if ((t = r.pop()) in n) return e.value = t, e.done = !1, e;
    return e.done = !0, e;
  };
}
module.exports = _regeneratorKeys, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/regeneratorRuntime.js"
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regeneratorRuntime.js ***!
  \*******************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

var OverloadYield = __webpack_require__(/*! ./OverloadYield.js */ "./node_modules/@babel/runtime/helpers/OverloadYield.js");
var regenerator = __webpack_require__(/*! ./regenerator.js */ "./node_modules/@babel/runtime/helpers/regenerator.js");
var regeneratorAsync = __webpack_require__(/*! ./regeneratorAsync.js */ "./node_modules/@babel/runtime/helpers/regeneratorAsync.js");
var regeneratorAsyncGen = __webpack_require__(/*! ./regeneratorAsyncGen.js */ "./node_modules/@babel/runtime/helpers/regeneratorAsyncGen.js");
var regeneratorAsyncIterator = __webpack_require__(/*! ./regeneratorAsyncIterator.js */ "./node_modules/@babel/runtime/helpers/regeneratorAsyncIterator.js");
var regeneratorKeys = __webpack_require__(/*! ./regeneratorKeys.js */ "./node_modules/@babel/runtime/helpers/regeneratorKeys.js");
var regeneratorValues = __webpack_require__(/*! ./regeneratorValues.js */ "./node_modules/@babel/runtime/helpers/regeneratorValues.js");
function _regeneratorRuntime() {
  "use strict";

  var r = regenerator(),
    e = r.m(_regeneratorRuntime),
    t = (Object.getPrototypeOf ? Object.getPrototypeOf(e) : e.__proto__).constructor;
  function n(r) {
    var e = "function" == typeof r && r.constructor;
    return !!e && (e === t || "GeneratorFunction" === (e.displayName || e.name));
  }
  var o = {
    "throw": 1,
    "return": 2,
    "break": 3,
    "continue": 3
  };
  function a(r) {
    var e, t;
    return function (n) {
      e || (e = {
        stop: function stop() {
          return t(n.a, 2);
        },
        "catch": function _catch() {
          return n.v;
        },
        abrupt: function abrupt(r, e) {
          return t(n.a, o[r], e);
        },
        delegateYield: function delegateYield(r, o, a) {
          return e.resultName = o, t(n.d, regeneratorValues(r), a);
        },
        finish: function finish(r) {
          return t(n.f, r);
        }
      }, t = function t(r, _t, o) {
        n.p = e.prev, n.n = e.next;
        try {
          return r(_t, o);
        } finally {
          e.next = n.n;
        }
      }), e.resultName && (e[e.resultName] = n.v, e.resultName = void 0), e.sent = n.v, e.next = n.n;
      try {
        return r.call(this, e);
      } finally {
        n.p = e.prev, n.n = e.next;
      }
    };
  }
  return (module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
    return {
      wrap: function wrap(e, t, n, o) {
        return r.w(a(e), t, n, o && o.reverse());
      },
      isGeneratorFunction: n,
      mark: r.m,
      awrap: function awrap(r, e) {
        return new OverloadYield(r, e);
      },
      AsyncIterator: regeneratorAsyncIterator,
      async: function async(r, e, t, o, u) {
        return (n(e) ? regeneratorAsyncGen : regeneratorAsync)(a(r), e, t, o, u);
      },
      keys: regeneratorKeys,
      values: regeneratorValues
    };
  }, module.exports.__esModule = true, module.exports["default"] = module.exports)();
}
module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/regeneratorValues.js"
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regeneratorValues.js ***!
  \******************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

var _typeof = (__webpack_require__(/*! ./typeof.js */ "./node_modules/@babel/runtime/helpers/typeof.js")["default"]);
function _regeneratorValues(e) {
  if (null != e) {
    var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"],
      r = 0;
    if (t) return t.call(e);
    if ("function" == typeof e.next) return e;
    if (!isNaN(e.length)) return {
      next: function next() {
        return e && r >= e.length && (e = void 0), {
          value: e && e[r++],
          done: !e
        };
      }
    };
  }
  throw new TypeError(_typeof(e) + " is not iterable");
}
module.exports = _regeneratorValues, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/helpers/typeof.js"
/*!*******************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/typeof.js ***!
  \*******************************************************/
(module) {

function _typeof(o) {
  "@babel/helpers - typeof";

  return module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ },

/***/ "./node_modules/@babel/runtime/regenerator/index.js"
/*!**********************************************************!*\
  !*** ./node_modules/@babel/runtime/regenerator/index.js ***!
  \**********************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

// TODO(Babel 8): Remove this file.

var runtime = __webpack_require__(/*! ../helpers/regeneratorRuntime */ "./node_modules/@babel/runtime/helpers/regeneratorRuntime.js")();
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


/***/ },

/***/ "./node_modules/arrayslicer/lib/compare/index.js"
/*!*******************************************************!*\
  !*** ./node_modules/arrayslicer/lib/compare/index.js ***!
  \*******************************************************/
(module) {

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


/***/ },

/***/ "./node_modules/arrayslicer/lib/index.js"
/*!***********************************************!*\
  !*** ./node_modules/arrayslicer/lib/index.js ***!
  \***********************************************/
(module, __unused_webpack_exports, __webpack_require__) {

/**
 * Indexed Array Binary Search module
 */

/**
 * Dependencies
 */
var util = __webpack_require__(/*! ./util */ "./node_modules/arrayslicer/lib/util.js"),
    cmp = __webpack_require__(/*! ./compare */ "./node_modules/arrayslicer/lib/compare/index.js"),
    bin = __webpack_require__(/*! ./search/binary */ "./node_modules/arrayslicer/lib/search/binary.js");

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


/***/ },

/***/ "./node_modules/arrayslicer/lib/search/binary.js"
/*!*******************************************************!*\
  !*** ./node_modules/arrayslicer/lib/search/binary.js ***!
  \*******************************************************/
(module) {

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


/***/ },

/***/ "./node_modules/arrayslicer/lib/util.js"
/*!**********************************************!*\
  !*** ./node_modules/arrayslicer/lib/util.js ***!
  \**********************************************/
(module) {

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


/***/ },

/***/ "./src/helpers/dataset.js"
/*!********************************!*\
  !*** ./src/helpers/dataset.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DatasetWW: () => (/* binding */ DatasetWW),
/* harmony export */   "default": () => (/* binding */ Dataset)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/defineProperty */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime/regenerator */ "./node_modules/@babel/runtime/regenerator/index.js");
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _stuff_utils_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../stuff/utils.js */ "./src/stuff/utils.js");





function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }

// Dataset proxy between vuejs & WebWorker


var Dataset = /*#__PURE__*/function () {
  function Dataset(dc, desc) {
    (0,_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_3__["default"])(this, Dataset);
    // TODO: dataset url arrow fn tells WW
    // to load the ds directly from web

    this.type = desc.type;
    this.id = desc.id;
    this.dc = dc;

    // Send the data to WW
    if (desc.data) {
      this.dc.ww.just('upload-data', (0,_babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])({}, this.id, desc));
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
  return (0,_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_4__["default"])(Dataset, [{
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
      this.dc.ww.just('update-data', (0,_babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])({}, this.id, arr));
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
      var _data = (0,_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_5___default().mark(function _callee() {
        var ds;
        return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_5___default().wrap(function (_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 1;
              return this.dc.ww.exec('get-dataset', this.id);
            case 1:
              ds = _context.sent;
              if (ds) {
                _context.next = 2;
                break;
              }
              return _context.abrupt("return");
            case 2:
              return _context.abrupt("return", ds.data);
            case 3:
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
      // PERFORMANCE: Use Sets and Maps for O(1) lookups instead of includes()+filter()
      // This changes O(n²) to O(n) for the entire operation
      var nMap = new Map(n.map(function (x) {
        return [x.id, x];
      }));
      var pSet = new Set(p.map(function (x) {
        return x.id;
      }));
      var nSet = new Set(nMap.keys());

      // Find newly added datasets
      var _iterator = _createForOfIteratorHelper(nMap),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = (0,_babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_0__["default"])(_step.value, 2),
            id = _step$value[0],
            ds = _step$value[1];
          if (!pSet.has(id)) {
            this.dss[id] = new Dataset(this, ds);
          }
        }

        // Find removed datasets
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var _iterator2 = _createForOfIteratorHelper(pSet),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _id = _step2.value;
          if (!nSet.has(_id) && this.dss[_id]) {
            this.dss[_id].remove();
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

var DatasetWW = /*#__PURE__*/function () {
  function DatasetWW(id, data) {
    (0,_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_3__["default"])(this, DatasetWW);
    this.last_upd = _stuff_utils_js__WEBPACK_IMPORTED_MODULE_6__["default"].now();
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
  return (0,_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_4__["default"])(DatasetWW, [{
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
      this.last_upd = _stuff_utils_js__WEBPACK_IMPORTED_MODULE_6__["default"].now();
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
        var _iterator3 = _createForOfIteratorHelper(data[k]),
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
        se.data[id].last_upd = _stuff_utils_js__WEBPACK_IMPORTED_MODULE_6__["default"].now();
      }
    }
  }]);
}();

/***/ },

/***/ "./src/helpers/sampler.js"
/*!********************************!*\
  !*** ./src/helpers/sampler.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _script_engine_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./script_engine.js */ "./src/helpers/script_engine.js");
/* harmony import */ var _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stuff/constants.js */ "./src/stuff/constants.js");
// Resamples candles



var DEF_LIMIT = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].DEF_LIMIT;
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(T, auto) {
  if (auto === void 0) {
    auto = false;
  }
  // Define a TS type (part of the candle)
  var Ti = ['high', 'low', 'close', 'vol'].indexOf(T);
  return function (x, t) {
    var tf = this.__tf__;
    var id = this.__id__;
    t = t || _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].t;
    var val = auto ? _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"][T][0] : x;
    // TODO: closing at a specific time
    // (timezone, end of the month...)
    if (!this.__t0__ || t >= this.__t0__ + tf) {
      this.unshift(Ti !== 3 ? val : 0);
      this.__t0__ = t - t % tf;
      // TODO: new candle signal
    }

    // Update prices
    switch (Ti) {
      case 0:
        if (val > this[0]) this[0] = val;
        break;
      case 1:
        if (val < this[0]) this[0] = val;
        break;
      case 2:
        this[0] = val;
        break;
      case 3:
        this[0] += val;
    }

    // Limit size of vector
    this.length = this.__len__ || DEF_LIMIT;
  };
}

/***/ },

/***/ "./src/helpers/script_engine.js"
/*!**************************************!*\
  !*** ./src/helpers/script_engine.js ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/slicedToArray */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime/helpers/typeof */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime/regenerator */ "./node_modules/@babel/runtime/regenerator/index.js");
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _script_env_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./script_env.js */ "./src/helpers/script_env.js");
/* harmony import */ var _stuff_utils_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../stuff/utils.js */ "./src/stuff/utils.js");
/* harmony import */ var _script_utils_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./script_utils.js */ "./src/helpers/script_utils.js");
/* harmony import */ var _symstd_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./symstd.js */ "./src/helpers/symstd.js");
/* harmony import */ var _script_ts_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./script_ts.js */ "./src/helpers/script_ts.js");
/* harmony import */ var _stuff_constants_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../stuff/constants.js */ "./src/stuff/constants.js");
/* harmony import */ var _script_state_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./script_state.js */ "./src/helpers/script_state.js");






function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }

// Script engine, Fuck yeah








var DEF_LIMIT = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_12__["default"].DEF_LIMIT;
var WAIT_EXEC = 10; // merge script execs, ms

// Display-only settings that don't affect indicator computation
// Changes to these should NOT trigger full re-execution
var DISPLAY_ONLY_SETTINGS = new Set([
// Colors
'color', 'lineColor', 'fillColor', 'upColor', 'downColor', 'wickUpColor', 'wickDownColor', 'borderUpColor', 'borderDownColor', 'backgroundColor', 'textColor', 'labelColor', 'crossColor',
// Line styles
'lineWidth', 'lineStyle', 'lineDash', 'opacity', 'alpha',
// Display toggles
'showLabels', 'showLegend', 'showValues', 'showPrice', 'visible', 'display', 'showBands', 'showFill',
// Visual formatting
'precision', 'prec', 'zIndex', 'z']);

// PERFORMANCE: Fast deep copy for script cache data
// Much faster than JSON.parse(JSON.stringify()) for typical indicator data structures
function fastDeepCopy(obj) {
  if (obj === null || (0,_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_5__["default"])(obj) !== 'object') return obj;
  if (Array.isArray(obj)) {
    // For arrays, use slice for shallow arrays or map for nested
    if (obj.length === 0) return [];
    // Check if first element is primitive (common case for indicator data)
    var first = obj[0];
    if (first === null || (0,_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_5__["default"])(first) !== 'object') {
      return obj.slice(); // Fast path for primitive arrays
    }
    // Nested array - recurse
    var _copy = new Array(obj.length);
    for (var i = 0; i < obj.length; i++) {
      _copy[i] = fastDeepCopy(obj[i]);
    }
    return _copy;
  }
  // Object - copy properties
  var copy = {};
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = fastDeepCopy(obj[key]);
    }
  }
  return copy;
}

// Yield frequency for long-running script execution (in iterations)
var YIELD_FREQUENCY = 2000; // Yield every 2000 candles for better responsiveness
var ScriptEngine = /*#__PURE__*/function () {
  function ScriptEngine() {
    var _this = this;
    (0,_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_3__["default"])(this, ScriptEngine);
    this.map = {};
    this.data = {};
    this.exec_id = null;
    this.queue = []; // Script exec queue
    this.delta_queue = []; // Settings queue
    this.update_queue = []; // Live update queue
    this.sett = {};
    this.state = {};
    this.mods = {}; // Modules (extensions)
    this.std_plus = {}; // Functions to inject
    this.tf = undefined; // Main chart TF

    // === PERFORMANCE OPTIMIZATION: Script output cache ===
    // Caches computed outputs to avoid re-execution when only display settings change
    this._outputCache = new Map(); // scriptId -> { hash, data, onchart, offchart }
    this._dataHash = null; // Hash of current OHLCV data for cache invalidation

    // PERF: Cache for make_mods_hooks() bound functions
    this._hooksCache = {}; // hookName -> bound function array
    this._hooksModsKey = null; // Serialized mods keys for invalidation

    // PERF: Pre-built template for format_update() fast path
    this._updateTemplate = null; // Flat array of { id, src } for fast tick updates

    // Set up function references in shared state (breaks circular deps)
    // Use arrow functions to defer method lookup until call time,
    // since this.send is defined externally after construction
    _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].send = function () {
      return _this.send.apply(_this, arguments);
    };
    _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].std_inject = function () {
      return _this.std_inject.apply(_this, arguments);
    };
    _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].match_ds = function () {
      return _this.match_ds.apply(_this, arguments);
    };
  }

  // === PERFORMANCE: Compute hash for computation-affecting settings ===
  // Only settings NOT in DISPLAY_ONLY_SETTINGS affect computation
  return (0,_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_4__["default"])(ScriptEngine, [{
    key: "_computationHash",
    value: function _computationHash(script) {
      var _script$src, _script$src2, _script$src3;
      var props = ((_script$src = script.src) === null || _script$src === void 0 ? void 0 : _script$src.props) || {};
      var sett = script.sett || {};
      var parts = [];

      // Include script source code hash (if code changes, must recompute)
      if ((_script$src2 = script.src) !== null && _script$src2 !== void 0 && _script$src2.init) parts.push('i:' + script.src.init.toString().length);
      if ((_script$src3 = script.src) !== null && _script$src3 !== void 0 && _script$src3.update) parts.push('u:' + script.src.update.toString().length);

      // Include only computation-affecting props
      for (var key in props) {
        if (!DISPLAY_ONLY_SETTINGS.has(key)) {
          var val = props[key].val !== undefined ? props[key].val : props[key].def;
          // PERF: Avoid JSON.stringify for primitives
          var sv = val !== null && (0,_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_5__["default"])(val) === 'object' ? JSON.stringify(val) : String(val);
          parts.push("".concat(key, ":").concat(sv));
        }
      }

      // Include computation-affecting settings
      for (var _key in sett) {
        if (!DISPLAY_ONLY_SETTINGS.has(_key)) {
          var _sv = sett[_key] !== null && (0,_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_5__["default"])(sett[_key]) === 'object' ? JSON.stringify(sett[_key]) : String(sett[_key]);
          parts.push("s.".concat(_key, ":").concat(_sv));
        }
      }
      return parts.sort().join('|');
    }

    // === PERFORMANCE: Compute hash of OHLCV data for cache invalidation ===
  }, {
    key: "_computeDataHash",
    value: function _computeDataHash() {
      var _this$data, _ohlcv$, _ohlcv;
      var ohlcv = (_this$data = this.data) === null || _this$data === void 0 || (_this$data = _this$data.ohlcv) === null || _this$data === void 0 ? void 0 : _this$data.data;
      if (!ohlcv || !ohlcv.length) return '';
      // Hash based on length and first/last timestamps
      return "".concat(ohlcv.length, ":").concat((_ohlcv$ = ohlcv[0]) === null || _ohlcv$ === void 0 ? void 0 : _ohlcv$[0], ":").concat((_ohlcv = ohlcv[ohlcv.length - 1]) === null || _ohlcv === void 0 ? void 0 : _ohlcv[0]);
    }

    // === PERFORMANCE: Check if only display settings changed ===
  }, {
    key: "_isDisplayOnlyChange",
    value: function _isDisplayOnlyChange(delta, scriptId) {
      if (!delta || !delta[scriptId]) return false;
      var changes = delta[scriptId];
      for (var key in changes) {
        if (!DISPLAY_ONLY_SETTINGS.has(key)) {
          return false; // Found a computation-affecting change
        }
      }
      return true; // All changes are display-only
    }

    // === PERFORMANCE: Restore script output from cache ===
  }, {
    key: "_restoreFromCache",
    value: function _restoreFromCache(scriptId) {
      var cached = this._outputCache.get(scriptId);
      if (!cached) return false;
      var script = this.map[scriptId];
      if (!script || !script.env) return false;

      // Restore cached data using fast deep copy
      script.env.data = cached.data.slice(); // Shallow copy is sufficient
      script.env.onchart = fastDeepCopy(cached.onchart || {});
      script.env.offchart = fastDeepCopy(cached.offchart || {});
      return true;
    }

    // === PERFORMANCE: Save script output to cache ===
  }, {
    key: "_saveToCache",
    value: function _saveToCache(scriptId) {
      var script = this.map[scriptId];
      if (!script || !script.env) return;

      // Evict oldest entries if cache exceeds max size
      if (this._outputCache.size > 50) {
        var firstKey = this._outputCache.keys().next().value;
        this._outputCache["delete"](firstKey);
      }
      var hash = this._computationHash(script);
      this._outputCache.set(scriptId, {
        hash: hash,
        dataHash: this._dataHash,
        data: script.env.data.slice(),
        // Shallow copy
        onchart: fastDeepCopy(script.env.onchart || {}),
        offchart: fastDeepCopy(script.env.offchart || {})
      });
    }

    // === PERFORMANCE: Check if cache is valid for a script ===
  }, {
    key: "_isCacheValid",
    value: function _isCacheValid(scriptId) {
      var cached = this._outputCache.get(scriptId);
      if (!cached) return false;
      var script = this.map[scriptId];
      if (!script) return false;

      // Check if data changed
      if (cached.dataHash !== this._dataHash) return false;

      // Check if computation settings changed
      var currentHash = this._computationHash(script);
      return cached.hash === currentHash;
    }

    // Sync runtime state to shared module (for script_env and script_std)
  }, {
    key: "syncState",
    value: function syncState() {
      _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].t = this.t;
      _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].tf = this.tf;
      _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].iter = this.iter;
      _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].data = this.data;
      _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].shared = this.shared;
      _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].mods = this.mods;
    }
  }, {
    key: "exec_all",
    value: function exec_all() {
      var _this2 = this;
      clearTimeout(this.exec_id);

      // Wait for the data
      if (!this.data.ohlcv) return;

      // === PERFORMANCE: Update data hash for cache invalidation ===
      this._dataHash = this._computeDataHash();

      // Execute queue after all scripts & data are loaded
      this.exec_id = setTimeout(/*#__PURE__*/(0,_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6___default().mark(function _callee() {
        var id;
        return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6___default().wrap(function (_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (_this2.init_state(Object.keys(_this2.map))) {
                _context.next = 1;
                break;
              }
              return _context.abrupt("return");
            case 1:
              _this2.re_init_map();
              while (_this2.queue.length) {
                _this2.exec(_this2.queue.shift());
              }
              if (!Object.keys(_this2.map).length) {
                _context.next = 3;
                break;
              }
              _context.next = 2;
              return _this2.run();
            case 2:
              // === PERFORMANCE: Cache all script outputs ===
              for (id in _this2.map) {
                _this2._saveToCache(id);
              }
              _this2.drain_queues();
            case 3:
              _this2.send_state();
            case 4:
            case "end":
              return _context.stop();
          }
        }, _callee);
      })), WAIT_EXEC);
    }

    // Exec selected
  }, {
    key: "exec_sel",
    value: function () {
      var _exec_sel = (0,_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6___default().mark(function _callee2(delta) {
        var _this3 = this;
        var sel, needsReExec, displayOnlyChanges, _iterator, _step, _id3, props, k, _iterator2, _step2, id, _i, _needsReExec, _id, _i2, _needsReExec2, _id2, _t;
        return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6___default().wrap(function (_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              if (this.data.ohlcv) {
                _context2.next = 1;
                break;
              }
              return _context2.abrupt("return");
            case 1:
              sel = Object.keys(delta).filter(function (x) {
                return x in _this3.map;
              }); // === PERFORMANCE: Check which scripts actually need re-execution ===
              needsReExec = [];
              displayOnlyChanges = [];
              _iterator = _createForOfIteratorHelper(sel);
              _context2.prev = 2;
              _iterator.s();
            case 3:
              if ((_step = _iterator.n()).done) {
                _context2.next = 6;
                break;
              }
              _id3 = _step.value;
              if (this.map[_id3]) {
                _context2.next = 4;
                break;
              }
              return _context2.abrupt("continue", 5);
            case 4:
              // Check if this is a display-only change
              if (this._isDisplayOnlyChange(delta, _id3) && this._isCacheValid(_id3)) {
                displayOnlyChanges.push(_id3);
              } else {
                needsReExec.push(_id3);
              }

              // Apply the delta to props regardless
              props = this.map[_id3].src.props || {};
              for (k in props) {
                if (k in delta[_id3]) {
                  props[k].val = delta[_id3][k];
                }
              }
            case 5:
              _context2.next = 3;
              break;
            case 6:
              _context2.next = 8;
              break;
            case 7:
              _context2.prev = 7;
              _t = _context2["catch"](2);
              _iterator.e(_t);
            case 8:
              _context2.prev = 8;
              _iterator.f();
              return _context2.finish(8);
            case 9:
              if (!(displayOnlyChanges.length > 0)) {
                _context2.next = 10;
                break;
              }
              // Restore from cache and send updated data
              _iterator2 = _createForOfIteratorHelper(displayOnlyChanges);
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  id = _step2.value;
                  this._restoreFromCache(id);
                }

                // If ALL changes are display-only, skip expensive re-execution
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              if (!(needsReExec.length === 0)) {
                _context2.next = 10;
                break;
              }
              this.send('overlay-data', this.format_map(sel));
              this.send_state();
              return _context2.abrupt("return");
            case 10:
              if (this.init_state(needsReExec)) {
                _context2.next = 11;
                break;
              }
              this.delta_queue.push(delta);
              return _context2.abrupt("return");
            case 11:
              _i = 0, _needsReExec = needsReExec;
            case 12:
              if (!(_i < _needsReExec.length)) {
                _context2.next = 15;
                break;
              }
              _id = _needsReExec[_i];
              if (this.map[_id]) {
                _context2.next = 13;
                break;
              }
              return _context2.abrupt("continue", 14);
            case 13:
              this.exec(this.map[_id]);
            case 14:
              _i++;
              _context2.next = 12;
              break;
            case 15:
              _context2.next = 16;
              return this.run(needsReExec);
            case 16:
              // === PERFORMANCE: Cache the results for future use ===
              for (_i2 = 0, _needsReExec2 = needsReExec; _i2 < _needsReExec2.length; _i2++) {
                _id2 = _needsReExec2[_i2];
                this._saveToCache(_id2);
              }
              this.drain_queues();
              this.send_state();
            case 17:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[2, 7, 8, 9]]);
      }));
      function exec_sel(_x) {
        return _exec_sel.apply(this, arguments);
      }
      return exec_sel;
    }() // Exec script (create a new ScriptEnv, add to the map)
  }, {
    key: "exec",
    value: function exec(s) {
      var _this4 = this;
      if (!s.src.conf) s.src.conf = {};
      if (s.src.init) {
        s.src.init_src = _script_utils_js__WEBPACK_IMPORTED_MODULE_9__.get_raw_src(s.src.init);
      }
      if (s.src.update) {
        s.src.upd_src = _script_utils_js__WEBPACK_IMPORTED_MODULE_9__.get_raw_src(s.src.update);
      }
      if (s.src.post) {
        s.src.post_src = _script_utils_js__WEBPACK_IMPORTED_MODULE_9__.get_raw_src(s.src.post);
      }

      // Parse non-default symbols
      _symstd_js__WEBPACK_IMPORTED_MODULE_10__["default"].parse(s);
      for (var id in this.mods) {
        if (this.mods[id].pre_env) {
          this.mods[id].pre_env(s.uuid, s);
        }
      }
      s.env = new _script_env_js__WEBPACK_IMPORTED_MODULE_7__["default"](s, Object.assign(this.shared, {
        open: this.open,
        high: this.high,
        low: this.low,
        close: this.close,
        vol: this.vol,
        dss: this.data,
        t: function t() {
          return _this4.t;
        },
        iter: function iter() {
          return _this4.iter;
        },
        tf: this.tf,
        range: this.range,
        onclose: true
      }, this.tss));
      this.map[s.uuid] = s;
      this._updateTemplate = null; // Invalidate update template

      for (var _id4 in this.mods) {
        if (this.mods[_id4].new_env) {
          this.mods[_id4].new_env(s.uuid, s);
        }
      }

      // Build te box after mod's interfaces injected
      s.env.build();
    }

    // Live update
  }, {
    key: "update",
    value: function update(candles) {
      var _this5 = this;
      if (!this.data.ohlcv || !this.data.ohlcv.data.length) {
        return;
      }
      if (this.running) {
        this.update_queue.push(candles);
        return;
      }
      var mfs1 = this.make_mods_hooks('pre_step');
      var mfs2 = this.make_mods_hooks('post_step');

      // PERF: Cache mod-hook presence checks
      var hasMods1 = mfs1.length > 0;
      var hasMods2 = mfs2.length > 0;
      var step = function step(sel, unshift) {
        if (hasMods1) {
          for (var m = 0; m < mfs1.length; m++) mfs1[m](sel);
        }

        // PERF: Indexed loop avoids iterator protocol overhead
        for (var j = 0; j < sel.length; j++) {
          _this5.map[sel[j]].env.step(unshift);
        }
        if (hasMods2) {
          for (var _m = 0; _m < mfs2.length; _m++) mfs2[_m](sel);
        }
      };
      try {
        var ohlcv = this.data.ohlcv.data;
        var i = ohlcv.length - 1;
        var last = ohlcv[i];
        var sel = Object.keys(this.map);
        var unshift = false;
        this.shared.event = 'update';
        var _iterator3 = _createForOfIteratorHelper(candles),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var candle = _step3.value;
            if (candle[0] > last[0]) {
              this.shared.onclose = true;
              step(sel, false); // On candle close
              ohlcv.push(candle);
              unshift = true;
              i++;
            } else if (candle[0] < last[0]) {
              continue;
            } else {
              ohlcv[i] = candle;
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        this.iter = i;
        this.t = ohlcv[i][0];
        this.syncState();
        this.step(ohlcv[i], unshift);
        this.shared.onclose = false;
        step(sel, unshift);
        this.limit();
        this.send_update();
        this.send_state();
      } catch (e) {
        console.error('Script update error:', e);
      }
    }
  }, {
    key: "init_state",
    value: function init_state(sel) {
      var task = sel.join(',');

      // Stop previous run only if the task is the same
      if (this.running) {
        this._restart = task === this.task;
        return false;
      }

      // Inverted arrays
      this.open = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_11__["default"])('open', []);
      this.high = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_11__["default"])('high', []);
      this.low = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_11__["default"])('low', []);
      this.close = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_11__["default"])('close', []);
      this.vol = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_11__["default"])('vol', []);

      // Shared TSs & user vars
      this.tss = {};
      this.std_plus = {};
      this.shared = {};

      // Engine state
      this.iter = 0;
      this.t = 0;
      this.skip = false; // skip the step
      this.running = true;
      this.task = task;
      this.syncState();
      return true;
    }

    // Inject/override functions in the std lib object
  }, {
    key: "std_inject",
    value: function std_inject(std) {
      var proto = Object.getPrototypeOf(std);
      Object.assign(proto, this.std_plus);
      return std;
    }
  }, {
    key: "send_state",
    value: function send_state() {
      this.send('engine-state', {
        scripts: Object.keys(this.map).length,
        last_perf: this.perf,
        iter: this.iter,
        last_t: this.t,
        data_size: this.data_size,
        running: false
      });
    }
  }, {
    key: "send_update",
    value: function send_update() {
      this.send('overlay-update', this.format_update());
    }
  }, {
    key: "re_init_map",
    value: function re_init_map() {
      for (var id in this.map) {
        this.exec(this.map[id]);
      }
    }
  }, {
    key: "run",
    value: function () {
      var _run = (0,_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6___default().mark(function _callee3(sel) {
        var t1, mfs1, mfs2, _iterator4, _step4, id, ohlcv, start, total, ohlcvLen, lastIdx, hasMods1, hasMods2, hasCustomMain, selLen, lastProgress, i, progress, candle, m, j, _m2, _j, _t2;
        return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_6___default().wrap(function (_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              this.send('engine-state', {
                running: true
              });
              t1 = _stuff_utils_js__WEBPACK_IMPORTED_MODULE_8__["default"].now();
              sel = sel || Object.keys(this.map);
              this.pre_run_mods(sel);
              mfs1 = this.make_mods_hooks('pre_step');
              mfs2 = this.make_mods_hooks('post_step');
              _context3.prev = 1;
              _iterator4 = _createForOfIteratorHelper(sel);
              try {
                for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                  id = _step4.value;
                  this.map[id].env.init();
                }
              } catch (err) {
                _iterator4.e(err);
              } finally {
                _iterator4.f();
              }
              ohlcv = this.data.ohlcv.data;
              start = this.start(ohlcv);
              total = ohlcv.length - start;
              this.shared.event = 'step';

              // PERF: Set non-changing scriptState fields once before the loop
              _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].tf = this.tf;
              _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].data = this.data;
              _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].shared = this.shared;
              _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].mods = this.mods;

              // PERF: Cache loop-invariant values outside hot loop
              ohlcvLen = ohlcv.length;
              lastIdx = ohlcvLen - 1;
              hasMods1 = mfs1.length > 0;
              hasMods2 = mfs2.length > 0;
              hasCustomMain = !!this.custom_main;
              selLen = sel.length;
              lastProgress = 0;
              i = start;
            case 2:
              if (!(i < ohlcvLen)) {
                _context3.next = 7;
                break;
              }
              if (!(i % YIELD_FREQUENCY === 0)) {
                _context3.next = 4;
                break;
              }
              _context3.next = 3;
              return _stuff_utils_js__WEBPACK_IMPORTED_MODULE_8__["default"].pause(0);
            case 3:
              progress = Math.floor((i - start) / total * 100);
              if (progress > lastProgress) {
                lastProgress = progress;
                this.send('engine-state', {
                  running: true,
                  progress: progress
                });
              }
            case 4:
              if (!this.restarted()) {
                _context3.next = 5;
                break;
              }
              return _context3.abrupt("return");
            case 5:
              // PERF: Cache candle ref, avoid repeated ohlcv[i] indexing
              candle = ohlcv[i];
              this.iter = i - start;
              this.t = candle[0];
              _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].t = this.t;
              _script_state_js__WEBPACK_IMPORTED_MODULE_13__["default"].iter = this.iter;
              this.step(candle);
              this.shared.onclose = i !== lastIdx;

              // PERF: Skip empty mod-hooks loops entirely
              if (hasMods1) {
                for (m = 0; m < mfs1.length; m++) mfs1[m](sel);
              }

              // PERF: Indexed loop avoids iterator protocol overhead
              for (j = 0; j < selLen; j++) this.map[sel[j]].env.step();
              if (hasMods2) {
                for (_m2 = 0; _m2 < mfs2.length; _m2++) mfs2[_m2](sel);
              }
              if (hasCustomMain) this.make_ohlcv();
              this.limit();
            case 6:
              i++;
              _context3.next = 2;
              break;
            case 7:
              for (_j = 0; _j < selLen; _j++) {
                this.map[sel[_j]].env.output.post();
              }
              _context3.next = 9;
              break;
            case 8:
              _context3.prev = 8;
              _t2 = _context3["catch"](1);
              console.error('Script execution error:', _t2);
            case 9:
              this.post_run_mods(sel);
              this.perf = _stuff_utils_js__WEBPACK_IMPORTED_MODULE_8__["default"].now() - t1;
              this.running = false;

              // PERF: Pre-build flat template for fast per-tick format_update()
              this._buildUpdateTemplate();
              this.send('overlay-data', this.format_map(sel));
            case 10:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[1, 8]]);
      }));
      function run(_x2) {
        return _run.apply(this, arguments);
      }
      return run;
    }()
  }, {
    key: "step",
    value: function step(data, unshift) {
      if (unshift === void 0) {
        unshift = true;
      }
      if (unshift) {
        this.open.unshift(data[1]);
        this.high.unshift(data[2]);
        this.low.unshift(data[3]);
        this.close.unshift(data[4]);
        this.vol.unshift(data[5]);
      } else {
        this.open[0] = data[1];
        this.high[0] = data[2];
        this.low[0] = data[3];
        this.close[0] = data[4];
        this.vol[0] = data[5];
      }
      for (var id in this.tss) {
        var ts = this.tss[id];
        if (ts.__tf__) ts.__fn__();else if (unshift) ts.unshift(ts.__fn__());else ts[0] = ts.__fn__();
      }
    }
  }, {
    key: "limit",
    value: function limit() {
      this.open.length = this.open.__len__ || DEF_LIMIT;
      this.high.length = this.high.__len__ || DEF_LIMIT;
      this.low.length = this.low.__len__ || DEF_LIMIT;
      this.close.length = this.close.__len__ || DEF_LIMIT;
      this.vol.length = this.vol.__len__ || DEF_LIMIT;
    }
  }, {
    key: "start",
    value: function start(ohlcv) {
      var depth = this.sett.script_depth;
      return depth ? Math.max(ohlcv.length - depth, 0) : 0;
    }
  }, {
    key: "drain_queues",
    value: function drain_queues() {
      // Check if there are any new scripts (recieved during
      // the current run)
      if (this.queue.length) {
        this.exec_all();
      }
      // Check if there are any new settings deltas (...)
      else if (this.delta_queue.length) {
        this.exec_sel(this.delta_queue.pop());
        this.delta_queue = [];
      } else {
        while (this.update_queue.length) {
          var c = this.update_queue.shift();
          this.update(c);
        }
      }
    }

    // Binary search: first index where arr[i][0] >= t
  }, {
    key: "_bsGTE",
    value: function _bsGTE(arr, t) {
      var lo = 0,
        hi = arr.length;
      while (lo < hi) {
        var mid = lo + hi >> 1;
        if (arr[mid][0] < t) lo = mid + 1;else hi = mid;
      }
      return lo;
    }

    // Binary search: last index where arr[i][0] <= t (exclusive upper bound)
  }, {
    key: "_bsGT",
    value: function _bsGT(arr, t) {
      var lo = 0,
        hi = arr.length;
      while (lo < hi) {
        var mid = lo + hi >> 1;
        if (arr[mid][0] <= t) lo = mid + 1;else hi = mid;
      }
      return lo;
    }

    // Binary range slice: returns arr.slice for elements where t1 <= arr[i][0] <= t2
  }, {
    key: "_rangeSlice",
    value: function _rangeSlice(arr, t1, t2) {
      if (!arr.length) return arr;
      var lo = this._bsGTE(arr, t1);
      var hi = this._bsGT(arr, t2);
      return lo >= hi ? [] : arr.slice(lo, hi);
    }
  }, {
    key: "format_map",
    value: function format_map(sel, range, output) {
      var _this6 = this;
      sel = sel || Object.keys(this.map);
      var res = [];
      var _iterator5 = _createForOfIteratorHelper(sel),
        _step5;
      try {
        var _loop = function _loop() {
          var id = _step5.value;
          var x = _this6.map[id];
          var f = function f(x) {
            return x;
          };
          if ((x.output === false || x.output === 'none') && !output) {
            res.push({
              id: id,
              data: null
            });
            return 1; // continue
          }
          if (x.output === 'range' || range) {
            var _ref2 = range || _this6.range,
              _ref3 = (0,_babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_1__["default"])(_ref2, 2),
              t1 = _ref3[0],
              t2 = _ref3[1];
            f = function f(arr) {
              return _this6._rangeSlice(arr, t1, t2);
            };
          }
          res.push({
            id: id,
            data: f(x.env.data),
            new_ovs: {
              onchart: _script_utils_js__WEBPACK_IMPORTED_MODULE_9__.ovf(x.env.onchart, f),
              offchart: _script_utils_js__WEBPACK_IMPORTED_MODULE_9__.ovf(x.env.offchart, f)
            }
          });
        };
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          if (_loop()) continue;
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
      if (this.custom_main) {
        res.push({
          id: 'chart',
          data: this.data.ohlcv.data
        });
      }
      return res;
    }

    // PERF: Build a flat template for fast per-tick updates
  }, {
    key: "_buildUpdateTemplate",
    value: function _buildUpdateTemplate() {
      var tmpl = [];
      for (var id in this.map) {
        var x = this.map[id];
        if (x.output === false) {
          tmpl.push({
            id: id,
            src: null
          });
          continue;
        }
        tmpl.push({
          id: id,
          src: x.env.data
        });
        for (var _i3 = 0, _arr = ['onchart', 'offchart']; _i3 < _arr.length; _i3++) {
          var side = _arr[_i3];
          for (var oid in x.env[side]) {
            tmpl.push({
              id: "".concat(side, ".").concat(oid),
              src: x.env[side][oid].data
            });
          }
        }
      }
      this._updateTemplate = tmpl;
    }
  }, {
    key: "format_update",
    value: function format_update() {
      var tmpl = this._updateTemplate;
      if (!tmpl) {
        // Fallback: build on first call
        this._buildUpdateTemplate();
        tmpl = this._updateTemplate;
      }
      var res = new Array(tmpl.length);
      for (var i = 0; i < tmpl.length; i++) {
        var entry = tmpl[i];
        res[i] = {
          id: entry.id,
          data: entry.src ? entry.src[entry.src.length - 1] : null
        };
      }
      return res;
    }
  }, {
    key: "restarted",
    value: function restarted() {
      if (this._restart) {
        this._restart = false;
        this.running = false;
        this.perf = 0;
        //console.log('Restarted')
        return true;
      }
      return false;
    }
  }, {
    key: "remove_scripts",
    value: function remove_scripts(ids) {
      var _iterator6 = _createForOfIteratorHelper(ids),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var id = _step6.value;
          delete this.map[id];
          this._outputCache["delete"](id);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      this._updateTemplate = null; // Invalidate update template
      this.send_state();
    }
  }, {
    key: "pre_run_mods",
    value: function pre_run_mods(sel) {
      for (var id in this.mods) {
        if (this.mods[id].pre_run) {
          this.mods[id].pre_run(sel);
        }
      }
    }
  }, {
    key: "post_run_mods",
    value: function post_run_mods(sel) {
      for (var id in this.mods) {
        if (this.mods[id].post_run) {
          this.mods[id].post_run(sel);
        }
      }
    }
  }, {
    key: "make_mods_hooks",
    value: function make_mods_hooks(name) {
      // PERF: Cache bound functions, only rebuild when mods keys change
      var modsKey = Object.keys(this.mods).join(',');
      if (modsKey === this._hooksModsKey && this._hooksCache[name]) {
        return this._hooksCache[name];
      }
      this._hooksModsKey = modsKey;
      var arr = [];
      for (var id in this.mods) {
        if (this.mods[id][name]) {
          arr.push(this.mods[id][name].bind(this.mods[id]));
        }
      }
      this._hooksCache[name] = arr;
      return arr;
    }
  }, {
    key: "data_required",
    value: function data_required(s) {
      var all = Object.values(this.map);
      if (s) all.push(s);
      var types = [{
        type: 'OHLCV'
      }];
      var _loop2 = function _loop2() {
        var sc = _all[_i4];
        if (sc.src.data) {
          var reqs = Object.values(sc.src.data);
          types.push.apply(types, (0,_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__["default"])(reqs.map(function (x) {
            return {
              id: sc.uuid,
              type: x.type
            };
          })));
        }
      };
      for (var _i4 = 0, _all = all; _i4 < _all.length; _i4++) {
        _loop2();
      }
      // PERF: Set-based lookup O(n) instead of nested filter+find O(n²)
      var existing = new Set(Object.values(this.data).map(function (y) {
        return y.type;
      }));
      var unf = types.filter(function (x) {
        return !existing.has(x.type);
      });
      return unf.length ? unf : null;
    }

    // Match dataset id using script id & required type
  }, {
    key: "match_ds",
    value: function match_ds(id, type) {
      // TODO: develop further
      for (var _id5 in this.data) {
        if (this.data[_id5].type === type) {
          return _id5;
        }
      }
    }

    // Make a ohlcv data point if there is a symbol
    // with { main: true } props (overwrites ohlcv).
  }, {
    key: "make_ohlcv",
    value: function make_ohlcv() {
      var sym = this.custom_main;
      var tNext = this.t + this.tf;
      if (sym.update(null, tNext)) {
        this.data.ohlcv.data.push([tNext, sym.open[0], sym.high[0], sym.low[0], sym.close[0], sym.vol[0]]);
      }
    }

    // Calculate data size
  }, {
    key: "recalc_size",
    value: function recalc_size() {
      var sz = 0;
      var maxIter = 100;
      while (maxIter-- > 0) {
        sz = _script_utils_js__WEBPACK_IMPORTED_MODULE_9__.size_of_dss(this.data) / (1024 * 1024);
        var lim = this.sett.ww_ram_limit;
        if (lim && sz > lim) {
          this.limit_size();
        } else break;
      }
      this.data_size = +sz.toFixed(2);
      this.send_state();
    }

    // Limit data size by throwing out the least
    // active datasets (measured by 'last_upd')
  }, {
    key: "limit_size",
    value: function limit_size() {
      var dss = Object.values(this.data).map(function (x) {
        return {
          id: x.id,
          t: x.last_upd
        };
      });
      dss.sort(function (a, b) {
        return a.t - b.t;
      });
      if (dss.length) {
        delete this.data[dss[0].id];
      }
    }
  }]);
}();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new ScriptEngine());

/***/ },

/***/ "./src/helpers/script_env.js"
/*!***********************************!*\
  !*** ./src/helpers/script_env.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ScriptEnv)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _script_std_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./script_std.js */ "./src/helpers/script_std.js");
/* harmony import */ var _script_state_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./script_state.js */ "./src/helpers/script_state.js");
/* harmony import */ var _script_utils_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./script_utils.js */ "./src/helpers/script_utils.js");
/* harmony import */ var _script_ts_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./script_ts.js */ "./src/helpers/script_ts.js");
/* harmony import */ var _stuff_constants_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../stuff/constants.js */ "./src/stuff/constants.js");



function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Script environment. Packs everything that
// needed for a script execution together:
// script src, standart functions, input data,
// other overlays & dependencies






var DEF_LIMIT = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_7__["default"].DEF_LIMIT,
  FDEFS1 = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_7__["default"].FDEFS1,
  FDEFS2 = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_7__["default"].FDEFS2;
var ScriptEnv = /*#__PURE__*/function () {
  function ScriptEnv(s, data) {
    (0,_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1__["default"])(this, ScriptEnv);
    this.std = _script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"].std_inject(new _script_std_js__WEBPACK_IMPORTED_MODULE_3__["default"](this));
    this.id = s.uuid;
    this.src = s;
    this.output = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_6__["default"])('output', []);
    this.data = [];
    this.tss = {};
    this.syms = {};
    this.shared = data;
    this.output.box_maker = this.make_box(s.src);
    this.onchart = {};
    this.offchart = {};
  }
  return (0,_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_2__["default"])(ScriptEnv, [{
    key: "build",
    value: function build() {
      this.output.box_maker(this, this.shared, _script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"]);
      delete this.output.box_maker;
    }
  }, {
    key: "init",
    value: function init() {
      this.output.init();
    }
  }, {
    key: "step",
    value: function step(unshift) {
      if (unshift === void 0) {
        unshift = true;
      }
      if (unshift) this.unshift();
      var v = this.output.update();
      this.copy(v, unshift);
      this.limit();
    }
  }, {
    key: "unshift",
    value: function unshift() {
      this.output.unshift(undefined);
      // Update all temp symbols
      for (var id in this.tss) {
        if (this.tss[id].__tf__) continue;
        this.tss[id].unshift(undefined);
      }
    }

    // Limit env.output length
  }, {
    key: "limit",
    value: function limit() {
      var out = this.output;
      out.length = out.__len__ || DEF_LIMIT;
      for (var id in this.tss) {
        var ts = this.tss[id];
        ts.length = ts.__len__ || DEF_LIMIT;
      }
    }

    // Copy the recent value to the direct buff
  }, {
    key: "copy",
    value: function copy(v, unshift) {
      if (unshift === void 0) {
        unshift = true;
      }
      var off = this.output.__offset__;
      if (v != undefined) {
        this.output[0] = v.__id__ ? v[0] : v;
        off = off || v.__offset__;
      }
      var val = this.output[0];
      var t = _script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"].t;
      if (off) t += off * _script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"].tf;
      var point;
      if (val == null || !val.length) {
        // Number / object
        point = [t, val];
      } else {
        // Array
        point = [t].concat((0,_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__["default"])(val));
      }
      if (unshift) {
        this.data.push(point);
      } else {
        this.data[this.data.length - 1] = point;
      }
    }

    // A small sandbox for a particular script
    // TODO: add support of 'Source' prop type (open, high, hl2 ...)
  }, {
    key: "make_box",
    value: function make_box(src) {
      var proto = Object.getPrototypeOf(this.std);
      var std = "";
      var _iterator = _createForOfIteratorHelper(Object.getOwnPropertyNames(proto)),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _k3 = _step.value;
          if (_k3 === 'constructor') continue;
          std += "const std_".concat(_k3, " = self.std.").concat(_k3, ".bind(self.std)\n");
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var props = "";
      for (var k in src.props || {}) {
        var val = void 0;
        if (src.props[k].val !== undefined) {
          val = src.props[k].val;
        } else if (this.src.sett[k] !== undefined) {
          val = this.src.sett[k];
        } else {
          val = src.props[k].def;
        }
        props += "var ".concat(k, " = ").concat(JSON.stringify(val), "\n");
      }
      // TODO: add argument values to _id

      var tss = "";
      for (var _k in this.shared) {
        if (this.shared[_k] && this.shared[_k].__id__) {
          tss += "const ".concat(_k, " = shared.").concat(_k, "\n");
        }
      }

      // Datasets
      var dss = "";
      for (var _k2 in src.data || {}) {
        var id = _script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"].match_ds(this.id, src.data[_k2].type);
        if (!this.shared.dss[id]) {
          var T = src.data[_k2].type;
          console.warn("Dataset '".concat(T, "' is undefined"));
          continue;
        }
        dss += "const ".concat(_k2, " = shared.dss['").concat(id, "'].data\n");
      }
      try {
        return Function('self,shared,se', "\n                'use strict';\n\n                // Built-in functions (aliases)\n                ".concat(std, "\n\n                // Modules (API / interfaces)\n                ").concat(this.make_modules(), "\n\n                // Timeseries\n                ").concat(tss, "\n\n                // Direct data ts\n                const data = self.data\n                const ohlcv = shared.dss.ohlcv.data\n                ").concat(dss, "\n\n                // Script's properties (init)\n                ").concat(props, "\n\n                // Globals\n                const settings = self.src.sett\n                const tf = shared.tf\n                const range = shared.range\n\n                this.init = (_id = 'root') => {\n                    ").concat(this.prep(src.init_src), "\n                }\n\n                this.update = (_id = 'root') => {\n                    const t = shared.t()\n                    const iter = shared.iter()\n                    ").concat(this.prep(src.upd_src), "\n                }\n\n                this.post = (_id = 'root') => {\n                    ").concat(this.prep(src.post_src), "\n                }\n            "));
      } catch (e) {
        return Function('self,shared', "\n                'use strict';\n                this.init = () => {}\n                this.update = () => {}\n                this.post = () => {}\n            ");
      }
    }

    // Make definitions for modules
  }, {
    key: "make_modules",
    value: function make_modules() {
      var s = "";
      for (var id in _script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"].mods) {
        if (!_script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"].mods[id].api) continue;
        s += "const ".concat(id, " = se.mods['").concat(id, "'].api[self.id]");
        s += '\n';
      }
      return s;
    }

    // Preprocess the update function.
    // Replace functions with the full arguments list +
    // generate & add tsid
    // TODO: implement recursive prepping (with js syntax parser)
  }, {
    key: "prep",
    value: function prep(src) {
      // console.log('Before -----> \n', src)

      var h = this.src.use_for[0]; // TODO: add props here
      src = '\t\t  let _pref = `${_id}<-' + h + '<-`\n' + src;
      FDEFS2.lastIndex = 0;
      var call_id = 0; // Function call id (to make each call unique)
      var m;
      do {
        m = FDEFS2.exec(src);
        if (m) {
          var fkeyword = m[1].trim();
          var fname = m[2];
          var fargs = m[3];
          if (fkeyword === 'function') {
            // TODO: add _ids to inline functions
          } else {
            var off = m.index + m[0].indexOf('(');
            if (this.std[fname]) {
              src = this.postfix(src, m, ++call_id);
              //console.log(src)
              off += 4; // 'std_'
            }
            // Quick fix
            FDEFS2.lastIndex = off;
          }
        }
      } while (m);

      // console.log('After ----->\n', u.wrap_idxs(src))

      return _script_utils_js__WEBPACK_IMPORTED_MODULE_5__.wrap_idxs(src, 'std_');
    }

    // Postfix function calls with ts _ids
  }, {
    key: "postfix",
    value: function postfix(src, m, call_id) {
      var target = this.get_args(this.fdef(m[2])).length;
      var m0 = this.parentheses(m[0]); // First closed pair
      var args = this.get_args_2(m0);
      for (var i = args.length; i < target; i++) {
        args.push('void 0');
      }

      // Add an unique time-series id
      args.push("_pref+\"f".concat(call_id, "\""));
      return src.replace(m0, "std_".concat(m[2], "(").concat(args.join(', '), ")"));
    }
  }, {
    key: "parentheses",
    value: function parentheses(str) {
      var count = 0,
        first = false;
      for (var i = 0; i < str.length; i++) {
        if (str[i] === '(') {
          count++;
          first = true;
        } else if (str[i] === ')') {
          count--;
        }
        if (first && count === 0) {
          return str.substr(0, i + 1);
        }
      }
      return str;
    }

    // Get the function definition
    // TODO: add support of modules
  }, {
    key: "fdef",
    value: function fdef(fname) {
      return this.std[fname].toString();
    }

    // Get args in the function's definition
  }, {
    key: "get_args",
    value: function get_args(src) {
      var reg = this.regex_clone(FDEFS1);
      reg.lastIndex = 0;
      var m = reg.exec(src);
      if (!m[3].trim().length) return [];
      var arr = m[3].split(',').map(function (x) {
        return x.trim();
      }).filter(function (x) {
        return x !== '_id' && x !== '_tf';
      });
      return arr;
    }
  }, {
    key: "get_args_2",
    value: function get_args_2(str) {
      var parts = [];
      var c = 0;
      var s = 0;
      var q1 = false,
        q2 = false,
        q3 = false;
      var part;
      for (var i = 0; i < str.length; i++) {
        if (str[i] === '(') {
          c++;
          if (!part) part = [i + 1];
        }
        if (str[i] === ')') c--;
        if (str[i] === '[') s++;
        if (str[i] === ']') s--;
        if (str[i] === "'") q1 = !q1;
        if (str[i] === '"') q2 = !q2;
        if (str[i] === '`') q3 = !q3;
        if (str[i] === ',' && c === 1 && !s && !q1 && !q2 && !q3) {
          if (part) {
            part[1] = i;
            parts.push(part);
            part = [i + 1];
          }
        }
        if (c === 0 && part) {
          part[1] = i;
          parts.push(part);
          part = null;
        }
      }
      return parts.map(function (x) {
        return str.slice.apply(str, (0,_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__["default"])(x));
      }).filter(function (x) {
        return /[^\s]+/.exec(x);
      });
    }
  }, {
    key: "regex_clone",
    value: function regex_clone(rex) {
      return new RegExp(rex.source, rex.flags);
    }
  }, {
    key: "send_modify",
    value: function send_modify(upd) {
      _script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"].send('modify-overlay', {
        uuid: this.id,
        fields: upd
      });
    }
  }]);
}();


/***/ },

/***/ "./src/helpers/script_state.js"
/*!*************************************!*\
  !*** ./src/helpers/script_state.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Shared script engine state
// This module breaks circular dependencies between script_engine, script_env, and script_std
// by providing a shared state object that can be populated by script_engine and read by others.

var state = {
  // Runtime values (updated by script_engine during execution)
  t: 0,
  // Current timestamp
  tf: 0,
  // Main chart timeframe
  iter: 0,
  // Current iteration index
  data: {},
  // Data storage (datasets)
  shared: {},
  // Shared variables between scripts
  mods: {},
  // Modules (extensions/plugins)

  // Function references (set by script_engine on init)
  send: null,
  // Send messages to DataCube
  std_inject: null,
  // Inject custom functions into std lib
  match_ds: null // Match dataset id using script id & type
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (state);

/***/ },

/***/ "./src/helpers/script_std.js"
/*!***********************************!*\
  !*** ./src/helpers/script_std.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ScriptStd)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_construct__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/construct */ "./node_modules/@babel/runtime/helpers/esm/construct.js");
/* harmony import */ var _babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _script_state_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./script_state.js */ "./src/helpers/script_state.js");
/* harmony import */ var _script_utils_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./script_utils.js */ "./src/helpers/script_utils.js");
/* harmony import */ var _std_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./std/index.js */ "./src/helpers/std/index.js");




function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Script std-lib (built-in functions)
// This is the main ScriptStd class that composes functions from separate modules




// Import function modules

var ScriptStd = /*#__PURE__*/function () {
  function ScriptStd(env) {
    (0,_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_2__["default"])(this, ScriptStd);
    this.env = env;
    this.se = _script_state_js__WEBPACK_IMPORTED_MODULE_4__["default"];
    this.SWMA = [1 / 6, 2 / 6, 2 / 6, 1 / 6];
    this.STDEV_EPS = 1e-10;
    this.STDEV_Z = 1e-4;
    this._index_tracking();
  }

  // Wrap every index with index-tracking function
  // That way we will know exact index ranges
  return (0,_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_3__["default"])(ScriptStd, [{
    key: "_index_tracking",
    value: function _index_tracking() {
      var proto = Object.getPrototypeOf(this);
      var _iterator = _createForOfIteratorHelper(Object.getOwnPropertyNames(proto)),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var k = _step.value;
          switch (k) {
            case 'constructor':
            case 'ts':
            case 'tstf':
            case 'sample':
            case '_index_tracking':
            case '_tsid':
            case '_i':
            case '_v':
            case '_add_i':
            case 'chart':
            case 'onchart':
            case 'offchart':
            case 'sym':
              continue;
          }
          var f = this._add_i(k, this[k].toString());
          if (f) this[k] = f;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    // Add index tracking to the function
  }, {
    key: "_add_i",
    value: function _add_i(name, src) {
      var args = _script_utils_js__WEBPACK_IMPORTED_MODULE_5__.f_args(src);
      src = _script_utils_js__WEBPACK_IMPORTED_MODULE_5__.f_body(src);
      var src2 = _script_utils_js__WEBPACK_IMPORTED_MODULE_5__.wrap_idxs(src, 'this.');
      if (src2 !== src) {
        return (0,_babel_runtime_helpers_construct__WEBPACK_IMPORTED_MODULE_0__["default"])(Function, (0,_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_1__["default"])(args).concat([src2]));
      }
      return null;
    }

    // Placeholder methods for unimplemented features
  }, {
    key: "corr",
    value: function corr() {
      // TODO: this
    }
  }, {
    key: "time",
    value: function time(res, sesh) {
      // TODO: this
    }
  }, {
    key: "timestamp",
    value: function timestamp() {
      // TODO: this
    }
  }, {
    key: "linearint",
    value: function linearint() {
      // TODO: this
    }
  }, {
    key: "nearestrank",
    value: function nearestrank() {
      // TODO: this
    }
  }, {
    key: "percentrank",
    value: function percentrank() {
      // TODO: this
    }
  }, {
    key: "variance",
    value: function variance(src, len) {
      // TODO: this
    }
  }, {
    key: "vwap",
    value: function vwap(src) {
      // TODO: this
    }
  }]);
}(); // Mix in all the function modules to the prototype

var proto = ScriptStd.prototype;
Object.assign(proto, _std_index_js__WEBPACK_IMPORTED_MODULE_6__.mathFns);
Object.assign(proto, _std_index_js__WEBPACK_IMPORTED_MODULE_6__.timeFns);
Object.assign(proto, _std_index_js__WEBPACK_IMPORTED_MODULE_6__.chartFns);
Object.assign(proto, _std_index_js__WEBPACK_IMPORTED_MODULE_6__.utilsFns);
Object.assign(proto, _std_index_js__WEBPACK_IMPORTED_MODULE_6__.analysisFns);
Object.assign(proto, _std_index_js__WEBPACK_IMPORTED_MODULE_6__.indicatorFns);
Object.assign(proto, _std_index_js__WEBPACK_IMPORTED_MODULE_6__.timeseriesFns);
Object.assign(proto, _std_index_js__WEBPACK_IMPORTED_MODULE_6__.symbolFns);

/***/ },

/***/ "./src/helpers/script_ts.js"
/*!**********************************!*\
  !*** ./src/helpers/script_ts.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TS)
/* harmony export */ });
// Timeseries for scripts

function TS(id, arr, len) {
  arr.__id__ = id;
  arr.__len__ = len;
  return arr;
}

/***/ },

/***/ "./src/helpers/script_utils.js"
/*!*************************************!*\
  !*** ./src/helpers/script_utils.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   f_args: () => (/* binding */ f_args),
/* harmony export */   f_body: () => (/* binding */ f_body),
/* harmony export */   get_fn_id: () => (/* binding */ get_fn_id),
/* harmony export */   get_raw_src: () => (/* binding */ get_raw_src),
/* harmony export */   make_module_lib: () => (/* binding */ make_module_lib),
/* harmony export */   nextt: () => (/* binding */ nextt),
/* harmony export */   ovf: () => (/* binding */ ovf),
/* harmony export */   size_of: () => (/* binding */ size_of),
/* harmony export */   size_of_dss: () => (/* binding */ size_of_dss),
/* harmony export */   tf_from_pair: () => (/* binding */ tf_from_pair),
/* harmony export */   tf_from_str: () => (/* binding */ tf_from_str),
/* harmony export */   update: () => (/* binding */ update),
/* harmony export */   wrap_idxs: () => (/* binding */ wrap_idxs)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/typeof */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");
/* harmony import */ var _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stuff/constants.js */ "./src/stuff/constants.js");


var BUF_INC = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].BUF_INC,
  FDEFS = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].FDEFS,
  SBRACKETS = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].SBRACKETS,
  TFSTR = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].TFSTR;
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
  var m;
  do {
    m = SBRACKETS.exec(src);
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
      mult = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].SECOND;
      break;
    case 'm':
      mult = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].MINUTE;
      break;
    case 'H':
      mult = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].HOUR;
      break;
    case 'D':
      mult = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].DAY;
      break;
    case 'W':
      mult = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].WEEK;
      break;
    case 'M':
      mult = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].MONTH;
      break;
    case 'Y':
      mult = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_1__["default"].YEAR;
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
  var mid;
  while (i0 <= iN) {
    mid = Math.floor((i0 + iN) / 2);
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
// PERFORMANCE: Cache computed sizes, recompute only when data lengths change
var _dssSizeCache = {
  key: '',
  bytes: 0
};
function size_of_dss(data) {
  // Build a cache key from dataset ids and lengths
  var keyParts = [];
  for (var id in data) {
    if (data[id].data) {
      keyParts.push(id + ':' + data[id].data.length);
    }
  }
  var key = keyParts.join(',');
  if (key === _dssSizeCache.key) return _dssSizeCache.bytes;
  var bytes = 0;
  for (var _id in data) {
    if (data[_id].data && data[_id].data[0]) {
      var s0 = size_of(data[_id].data[0]);
      bytes += s0 * data[_id].data.length;
    }
  }
  _dssSizeCache = {
    key: key,
    bytes: bytes
  };
  return bytes;
}

// Used to measure the size of dataset
function size_of(object) {
  var list = [],
    stack = [object],
    bytes = 0;
  while (stack.length) {
    var value = stack.pop();
    var type = (0,_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__["default"])(value);
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

/***/ },

/***/ "./src/helpers/std/analysis.js"
/*!*************************************!*\
  !*** ./src/helpers/std/analysis.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Analysis functions for ScriptStd

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  // Math operators on t-series and numbers
  /** Adds values / time-series
   * @param {(TS|*)} x - First input
   * @param {(TS|*)} y - Second input
   * @return {TS} - New time-series
   */
  add: function add(x, y, _id) {
    var id = this._tsid(_id, "add");
    var x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;
    var y0 = this.na(y) ? NaN : y.__id__ ? y[0] : y;
    return this.ts(x0 + y0, id, x.__tf__);
  },
  /** Subtracts values / time-series
   * @param {(TS|*)} x - First input
   * @param {(TS|*)} y - Second input
   * @return {TS} - New time-series
   */
  sub: function sub(x, y, _id) {
    var id = this._tsid(_id, "sub");
    var x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;
    var y0 = this.na(y) ? NaN : y.__id__ ? y[0] : y;
    return this.ts(x0 - y0, id, x.__tf__);
  },
  /** Multiplies values / time-series
   * @param {(TS|*)} x - First input
   * @param {(TS|*)} y - Second input
   * @return {TS} - New time-series
   */
  mult: function mult(x, y, _id) {
    var id = this._tsid(_id, "mult");
    var x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;
    var y0 = this.na(y) ? NaN : y.__id__ ? y[0] : y;
    return this.ts(x0 * y0, id, x.__tf__);
  },
  /** Divides values / time-series
   * @param {(TS|*)} x - First input
   * @param {(TS|*)} y - Second input
   * @return {TS} - New time-series
   */
  div: function div(x, y, _id) {
    var id = this._tsid(_id, "div");
    var x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;
    var y0 = this.na(y) ? NaN : y.__id__ ? y[0] : y;
    return this.ts(x0 / y0, id, x.__tf__);
  },
  /** Returns a negative value / time-series
   * @param {(TS|*)} x - Input
   * @return {TS} - New time-series
   */
  neg: function neg(x, _id) {
    var id = this._tsid(_id, "neg");
    var x0 = this.na(x) ? NaN : x.__id__ ? x[0] : x;
    return this.ts(-x0, id, x.__tf__);
  },
  /** Average of arguments
   * @param {...number} args - Numeric values
   * @return {number}
   */
  avg: function avg() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    args.pop(); // Remove _id
    var sum = 0;
    for (var i = 0; i < args.length; i++) {
      sum += args[i];
    }
    return sum / args.length;
  },
  /** Max of arguments
   * @param {...number} args - Numeric values
   * @return {number}
   */
  max: function max() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    args.pop(); // Remove _id
    return Math.max.apply(Math, args);
  },
  /** Min of arguments
   * @param {...number} args - Numeric values
   * @return {number}
   */
  min: function min() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    args.pop(); // Remove _id
    return Math.min.apply(Math, args);
  },
  /** Change: x[0] - x[len]
   * @param {TS} src - Input
   * @param {number} [len] - Length
   * @return {TS} - New time-series
   */
  change: function change(src, len, _id) {
    if (len === void 0) {
      len = 1;
    }
    var id = this._tsid(_id, "change(".concat(len, ")"));
    return this.ts(src[0] - src[len], id, src.__tf__);
  },
  /** When one time-series crosses another
   * @param {TS} src1 - TS1
   * @param {TS} src2 - TS2
   * @return {TS} - New time-series
   */
  cross: function cross(src1, src2, _id) {
    var id = this._tsid(_id, "cross");
    var x = src1[0] > src2[0] !== src1[1] > src2[1];
    return this.ts(x, id, src1.__tf__);
  },
  /** When one time-series goes over another one
   * @param {TS} src1 - TS1
   * @param {TS} src2 - TS2
   * @return {TS} - New time-series
   */
  crossover: function crossover(src1, src2, _id) {
    var id = this._tsid(_id, "crossover");
    var x = src1[0] > src2[0] && src1[1] <= src2[1];
    return this.ts(x, id, src1.__tf__);
  },
  /** When one time-series goes under another one
   * @param {TS} src1 - TS1
   * @param {TS} src2 - TS2
   * @return {TS} - New time-series
   */
  crossunder: function crossunder(src1, src2, _id) {
    var id = this._tsid(_id, "crossunder");
    var x = src1[0] < src2[0] && src1[1] >= src2[1];
    return this.ts(x, id, src1.__tf__);
  },
  /** Sum of all elements of src
   * @param {TS} src1 - Input
   * @return {TS} - New time-series
   */
  cum: function cum(src, _id) {
    var id = this._tsid(_id, "cum");
    var res = this.ts(0, id, src.__tf__);
    res[0] = this.nz(src[0]) + this.nz(res[1]);
    return res;
  },
  /** Test if "src" TS is falling for "len" candles
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  falling: function falling(src, len, _id) {
    var id = this._tsid(_id, "falling(".concat(len, ")"));
    var bot = src[0];
    for (var i = 1; i < len + 1; i++) {
      if (bot >= src[i]) {
        return this.ts(false, id, src.__tf__);
      }
    }
    return this.ts(true, id, src.__tf__);
  },
  /** Test if "src" TS is rising for "len" candles
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  rising: function rising(src, len, _id) {
    var id = this._tsid(_id, "rising(".concat(len, ")"));
    var top = src[0];
    for (var i = 1; i < len + 1; i++) {
      if (top <= src[i]) {
        return this.ts(false, id, src.__tf__);
      }
    }
    return this.ts(true, id, src.__tf__);
  },
  /** Highest value for a given number of candles back
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  highest: function highest(src, len, _id) {
    var id = this._tsid(_id, "highest(".concat(len, ")"));
    var high = -Infinity;
    for (var i = 0; i < len; i++) {
      if (src[i] > high) high = src[i];
    }
    return this.ts(high, id, src.__tf__);
  },
  /** Highest value offset for a given number of bars back
   * @param {TS} src - Input
   * @param {number} len - Length
   */
  highestbars: function highestbars(src, len, _id) {
    var id = this._tsid(_id, "highestbars(".concat(len, ")"));
    var high = -Infinity;
    var hi = 0;
    for (var i = 0; i < len; i++) {
      if (src[i] > high) {
        high = src[i], hi = i;
      }
    }
    return this.ts(-hi, id, src.__tf__);
  },
  /** Lowest value for a given number of candles back
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  lowest: function lowest(src, len, _id) {
    var id = this._tsid(_id, "lowest(".concat(len, ")"));
    var low = Infinity;
    for (var i = 0; i < len; i++) {
      if (src[i] < low) low = src[i];
    }
    return this.ts(low, id, src.__tf__);
  },
  /** Lowest value offset for a given number of bars back
   * @param {TS} src - Input
   * @param {number} len - Length
   */
  lowestbars: function lowestbars(src, len, _id) {
    var id = this._tsid(_id, "lowestbars(".concat(len, ")"));
    var low = Infinity;
    var li = 0;
    for (var i = 0; i < len; i++) {
      if (src[i] < low) {
        low = src[i], li = i;
      }
    }
    return this.ts(-li, id, src.__tf__);
  },
  /** Momentum
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  mom: function mom(src, len, _id) {
    var id = this._tsid(_id, "mom(".concat(len, ")"));
    return this.ts(src[0] - src[len], id, src.__tf__);
  },
  /** Returns price of the pivot high point
   * Tip: works best with `offset` function
   * @param {TS} src - Input
   * @param {number} left - left threshold, candles
   * @param {number} right - right threshold, candles
   * @return {TS} - New time-series
   */
  pivothigh: function pivothigh(src, left, right, _id) {
    var id = this._tsid(_id, "pivothigh(".concat(left, ",").concat(right, ")"));
    var len = left + right + 1;
    var top = src[right];
    for (var i = 0; i < len; i++) {
      if (top <= src[i] && i !== right) {
        return this.ts(NaN, id, src.__tf__);
      }
    }
    return this.ts(top, id, src.__tf__);
  },
  /** Returns price of the pivot low point
   * Tip: works best with `offset` function
   * @param {TS} src - Input
   * @param {number} left - left threshold, candles
   * @param {number} right - right threshold, candles
   * @return {TS} - New time-series
   */
  pivotlow: function pivotlow(src, left, right, _id) {
    var id = this._tsid(_id, "pivotlow(".concat(left, ",").concat(right, ")"));
    var len = left + right + 1;
    var bot = src[right];
    for (var i = 0; i < len; i++) {
      if (bot >= src[i] && i !== right) {
        return this.ts(NaN, id, src.__tf__);
      }
    }
    return this.ts(bot, id, src.__tf__);
  },
  /** Candles since the event occured (cond === true)
   * @param {(boolean|TS)} cond - the condition
   */
  since: function since(cond, _id) {
    var id = this._tsid(_id, "since()");
    if (cond && cond.__id__) cond = cond[0];
    var s = this.ts(undefined, id);
    s[0] = cond ? 0 : s[1] + 1;
    return s;
  },
  /** Returns the sliding sum of last "len" values of the source
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  sum: function sum(src, len, _id) {
    var id = this._tsid(_id, "sum(".concat(len, ")"));
    var sum = 0;
    for (var i = 0; i < len; i++) {
      sum = sum + src[i];
    }
    return this.ts(sum, id, src.__tf__);
  }
});

/***/ },

/***/ "./src/helpers/std/chart.js"
/*!**********************************!*\
  !*** ./src/helpers/std/chart.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var _script_state_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../script_state.js */ "./src/helpers/script_state.js");
/* harmony import */ var _script_utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../script_utils.js */ "./src/helpers/script_utils.js");

// Chart output functions for ScriptStd



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  // Display data point as the main chart
  chart: function chart() {
    // TODO: this
  },
  /** Display data point onchart
   * (create a new overlay in DataCube)
   * @param {(TS|TS[]|*)} x - Data point / TS / array of TS
   * @param {string} [name] - Overlay name
   * @param {Object} [sett] - Object with settings & OV type
   */
  onchart: function onchart(x, name, sett, _id) {
    if (sett === void 0) {
      sett = {};
    }
    var off = 0;
    name = name || _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.get_fn_id('Onchart', _id);
    if (x && x.__id__) {
      off = x.__offset__ || 0;
      x = x[0];
    }
    if (Array.isArray(x) && x[0] && x[0].__id__) {
      off = x[0].__offset__ || 0;
      x = x.map(function (x) {
        return x[0];
      });
    }
    if (!this.env.onchart[name]) {
      var type = sett.type;
      delete sett.type;
      sett.$synth = true;
      sett.skipNaN = true;
      var post = Array.isArray(x) ? 's' : '';
      this.env.onchart[name] = {
        name: name,
        type: type || 'Spline' + post,
        data: [],
        settings: sett,
        scripts: false,
        grid: sett.grid || {}
      };
    }
    off *= _script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].tf;
    var v = Array.isArray(x) ? [_script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].t + off].concat((0,_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__["default"])(x)) : [_script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].t + off, x];
    _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.update(this.env.onchart[name].data, v);
  },
  /** Display data point offchart
   * (create a new overlay in DataCube)
   * @param {(TS|TS[]|*)} x - Data point / TS / array of TS
   * @param {string} [name] - Overlay name
   * @param {Object} [sett] - Object with settings & OV type
   */
  offchart: function offchart(x, name, sett, _id) {
    if (sett === void 0) {
      sett = {};
    }
    name = name || _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.get_fn_id('Offchart', _id);
    var off = 0;
    if (x && x.__id__) {
      off = x.__offset__ || 0;
      x = x[0];
    }
    if (Array.isArray(x) && x[0] && x[0].__id__) {
      off = x[0].__offset__ || 0;
      x = x.map(function (x) {
        return x[0];
      });
    }
    if (!this.env.offchart[name]) {
      var type = sett.type;
      delete sett.type;
      sett.$synth = true;
      sett.skipNaN = true;
      var post = Array.isArray(x) ? 's' : '';
      this.env.offchart[name] = {
        name: name,
        type: type || 'Spline' + post,
        data: [],
        settings: sett,
        scripts: false,
        grid: sett.grid || {}
      };
    }
    off *= _script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].tf;
    var v = Array.isArray(x) ? [_script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].t + off].concat((0,_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__["default"])(x)) : [_script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].t + off, x];
    _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.update(this.env.offchart[name].data, v);
  },
  /** Returns true when the candle(<tf>) is being closed
   * @param {(number|string)} tf - Timeframe in ms or as a string
   * @return {boolean}
   */
  onclose: function onclose(tf) {
    if (!this.env.shared.onclose) return false;
    if (!tf) tf = _script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].tf;
    return (_script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].t + _script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].tf) % _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.tf_from_str(tf) === 0;
  },
  /** Emits an event to DataCube
   * @param {string} type - Signal type
   * @param {*} data - Signal data
   */
  signal: function signal(type, data) {
    if (data === void 0) {
      data = {};
    }
    if (_script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].shared.event !== 'update') return;
    _script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].send('script-signal', {
      type: type,
      data: data
    });
  },
  /** Emits an event if cond === true
   * @param {(boolean|TS)} cond - The condition
   * @param {string} type - Signal type
   * @param {*} data - Signal data
   */
  signalif: function signalif(cond, type, data) {
    if (data === void 0) {
      data = {};
    }
    if (_script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].shared.event !== 'update') return;
    if (cond && cond.__id__) cond = cond[0];
    if (cond) {
      _script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].send('script-signal', {
        type: type,
        data: data
      });
    }
  },
  /** Sends update to some overlay / main chart
   * @param {string} id - Overlay id
   * @param {Object} fields - Fields to be overwritten
   */
  modify: function modify(id, fields) {
    _script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].send('modify-overlay', {
      uuid: id,
      fields: fields
    });
  },
  /** Sends settings update
   * (can be called from init(), update() or post())
   * @param {Object} upd - Settings update (object to merge)
   */
  settings: function settings(upd) {
    this.env.send_modify({
      settings: upd
    });
    Object.assign(this.env.src.sett, upd);
  }
});

/***/ },

/***/ "./src/helpers/std/index.js"
/*!**********************************!*\
  !*** ./src/helpers/std/index.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   analysisFns: () => (/* reexport safe */ _analysis_js__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   chartFns: () => (/* reexport safe */ _chart_js__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   indicatorFns: () => (/* reexport safe */ _indicators_js__WEBPACK_IMPORTED_MODULE_5__["default"]),
/* harmony export */   mathFns: () => (/* reexport safe */ _math_js__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   symbolFns: () => (/* reexport safe */ _symbol_js__WEBPACK_IMPORTED_MODULE_7__["default"]),
/* harmony export */   timeFns: () => (/* reexport safe */ _time_js__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   timeseriesFns: () => (/* reexport safe */ _timeseries_js__WEBPACK_IMPORTED_MODULE_6__["default"]),
/* harmony export */   utilsFns: () => (/* reexport safe */ _utils_js__WEBPACK_IMPORTED_MODULE_3__["default"])
/* harmony export */ });
/* harmony import */ var _math_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./math.js */ "./src/helpers/std/math.js");
/* harmony import */ var _time_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./time.js */ "./src/helpers/std/time.js");
/* harmony import */ var _chart_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./chart.js */ "./src/helpers/std/chart.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils.js */ "./src/helpers/std/utils.js");
/* harmony import */ var _analysis_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./analysis.js */ "./src/helpers/std/analysis.js");
/* harmony import */ var _indicators_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./indicators.js */ "./src/helpers/std/indicators.js");
/* harmony import */ var _timeseries_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./timeseries.js */ "./src/helpers/std/timeseries.js");
/* harmony import */ var _symbol_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./symbol.js */ "./src/helpers/std/symbol.js");
// ScriptStd module exports
// These modules contain grouped functions that are mixed into ScriptStd










/***/ },

/***/ "./src/helpers/std/indicators.js"
/*!***************************************!*\
  !*** ./src/helpers/std/indicators.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _stuff_linreg_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../stuff/linreg.js */ "./src/stuff/linreg.js");
/* harmony import */ var _script_state_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../script_state.js */ "./src/helpers/script_state.js");
// Technical indicators for ScriptStd



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /** Arnaud Legoux Moving Average
   * @param {TS} src - Input
   * @param {number} len - Length
   * @param {number} offset - Offset
   * @param {number} sigma - Sigma
   * @return {TS} - New time-series
   */
  alma: function alma(src, len, offset, sigma, _id) {
    var id = this._tsid(_id, "alma(".concat(len, ",").concat(offset, ",").concat(sigma, ")"));
    var m = Math.floor(offset * (len - 1));
    var s = len / sigma;
    var norm = 0;
    var sum = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.exp(-1 * Math.pow(i - m, 2) / (2 * Math.pow(s, 2)));
      norm = norm + w;
      sum = sum + src[len - i - 1] * w;
    }
    return this.ts(sum / norm, id, src.__tf__);
  },
  /** Average True Range
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  atr: function atr(len, _id, _tf) {
    var tfs = _tf || '';
    var id = this._tsid(_id, "atr(".concat(len, ")"));
    var high = this.env.shared["high".concat(tfs)];
    var low = this.env.shared["low".concat(tfs)];
    var close = this.env.shared["close".concat(tfs)];
    var tr = this.ts(0, id, _tf);
    tr[0] = this.na(high[1]) ? high[0] - low[0] : Math.max(Math.max(high[0] - low[0], Math.abs(high[0] - close[1])), Math.abs(low[0] - close[1]));
    return this.rma(tr, len, id);
  },
  /** Bollinger Bands
   * @param {TS} src - Input
   * @param {number} len - Length
   * @param {number} mult - Multiplier
   * @return {TS[]} - Array of new time-series (3 bands)
   */
  bb: function bb(src, len, mult, _id) {
    var id = this._tsid(_id, "bb(".concat(len, ",").concat(mult, ")"));
    var basis = this.sma(src, len, id);
    var dev = this.stdev(src, len, id)[0] * mult;
    return [basis, this.ts(basis[0] + dev, id + '1', src.__tf__), this.ts(basis[0] - dev, id + '2', src.__tf__)];
  },
  /** Bollinger Bands Width
   * @param {TS} src - Input
   * @param {number} len - Length
   * @param {number} mult - Multiplier
   * @return {TS} - New time-series
   */
  bbw: function bbw(src, len, mult, _id) {
    var id = this._tsid(_id, "bbw(".concat(len, ",").concat(mult, ")"));
    var basis = this.sma(src, len, id)[0];
    var dev = this.stdev(src, len, id)[0] * mult;
    return this.ts(2 * dev / basis, id, src.__tf__);
  },
  /** Commodity Channel Index
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  cci: function cci(src, len, _id) {
    var id = this._tsid(_id, "cci(".concat(len, ")"));
    var ma = this.sma(src, len, id);
    var dev = this.dev(src, len, id);
    var cci = (src[0] - ma[0]) / (0.015 * dev[0]);
    return this.ts(cci, id, src.__tf__);
  },
  /** Chande Momentum Oscillator
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  cmo: function cmo(src, len, _id) {
    var id = this._tsid(_id, "cmo(".concat(len, ")"));
    var mom = this.change(src, 1, id);
    var g = this.ts(mom[0] >= 0 ? mom[0] : 0.0, id + "g", src.__tf__);
    var l = this.ts(mom[0] >= 0 ? 0.0 : -mom[0], id + "l", src.__tf__);
    var sm1 = this.sum(g, len, id + '1')[0];
    var sm2 = this.sum(l, len, id + '2')[0];
    return this.ts(100 * (sm1 - sm2) / (sm1 + sm2), id, src.__tf__);
  },
  /** Center of Gravity
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  cog: function cog(src, len, _id) {
    var id = this._tsid(_id, "cmo(".concat(len, ")"));
    var sum = this.sum(src, len, id)[0];
    var num = 0;
    for (var i = 0; i < len; i++) {
      num += src[i] * (i + 1);
    }
    return this.ts(-num / sum, id, src.__tf__);
  },
  /** Deviation from SMA
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  dev: function dev(src, len, _id) {
    var id = this._tsid(_id, "dev(".concat(len, ")"));
    var mean = this.sma(src, len, id)[0];
    var sum = 0;
    for (var i = 0; i < len; i++) {
      sum += Math.abs(src[i] - mean);
    }
    return this.ts(sum / len, id, src.__tf__);
  },
  /** Directional Movement Index ADX, +DI, -DI
   * @param {number} len - Length
   * @param {number} smooth - Smoothness
   * @return {TS} - New time-series
   */
  dmi: function dmi(len, smooth, _id, _tf) {
    var id = this._tsid(_id, "dmi(".concat(len, ",").concat(smooth, ")"));
    var tfs = _tf || '';
    var high = this.env.shared["high".concat(tfs)];
    var low = this.env.shared["low".concat(tfs)];
    var up = this.change(high, 1, id + '1')[0];
    var down = this.neg(this.change(low, 1, id + '2'), id)[0];
    var plusDM = this.ts(100 * (this.na(up) ? NaN : up > down && up > 0 ? up : 0), id + '3', _tf);
    var minusDM = this.ts(100 * (this.na(down) ? NaN : down > up && down > 0 ? down : 0), id + '4', _tf);
    var trur = this.rma(this.tr(false, id, _tf), len, id + '5');
    var plus = this.div(this.rma(plusDM, len, id + '6'), trur, id + '8');
    var minus = this.div(this.rma(minusDM, len, id + '7'), trur, id + '9');
    var sum = this.add(plus, minus, id + '10')[0];
    var adx = this.rma(this.ts(100 * Math.abs(plus[0] - minus[0]) / (sum === 0 ? 1 : sum), id + '11', _tf), smooth, id + '12');
    return [adx, plus, minus];
  },
  /** Exponential Moving Average with alpha = 2 / (y + 1)
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  ema: function ema(src, len, _id) {
    var id = this._tsid(_id, "ema(".concat(len, ")"));
    var a = 2 / (len + 1);
    var ema = this.ts(0, id, src.__tf__);
    ema[0] = this.na(ema[1]) ? this.sma(src, len, id)[0] : a * src[0] + (1 - a) * this.nz(ema[1]);
    return ema;
  },
  /** Hull Moving Average
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  hma: function hma(src, len, _id) {
    var id = this._tsid(_id, "hma(".concat(len, ")"));
    var len2 = Math.floor(len / 2);
    var len3 = Math.round(Math.sqrt(len));
    var a = this.mult(this.wma(src, len2, id + '1'), 2, id);
    var b = this.wma(src, len, id + '2');
    var delt = this.sub(a, b, id + '3');
    return this.wma(delt, len3, id + '4');
  },
  /** Keltner Channels
   * @param {TS} src - Input
   * @param {number} len - Length
   * @param {number} mult - Multiplier
   * @param {boolean} [use_tr] - Use true range
   * @return {TS[]} - Array of new time-series (3 bands)
   */
  kc: function kc(src, len, mult, use_tr, _id, _tf) {
    if (use_tr === void 0) {
      use_tr = true;
    }
    var id = this._tsid(_id, "kc(".concat(len, ",").concat(mult, ",").concat(use_tr, ")"));
    var tfs = _tf || '';
    var high = this.env.shared["high".concat(tfs)];
    var low = this.env.shared["low".concat(tfs)];
    var basis = this.ema(src, len, id + '1');
    var range = use_tr ? this.tr(false, id + '2', _tf) : this.ts(high[0] - low[0], id + '3', src.__tf__);
    var ema = this.ema(range, len, id + '4');
    return [basis, this.ts(basis[0] + ema[0] * mult, id + '5', src.__tf__), this.ts(basis[0] - ema[0] * mult, id + '6', src.__tf__)];
  },
  /** Keltner Channels Width
   * @param {TS} src - Input
   * @param {number} len - Length
   * @param {number} mult - Multiplier
   * @param {boolean} [use_tr] - Use true range
   * @return {TS} - New time-series
   */
  kcw: function kcw(src, len, mult, use_tr, _id, _tf) {
    if (use_tr === void 0) {
      use_tr = true;
    }
    var id = this._tsid(_id, "kcw(".concat(len, ",").concat(mult, ",").concat(use_tr, ")"));
    var kc = this.kc(src, len, mult, use_tr, "kcw", _tf);
    return this.ts((kc[1][0] - kc[2][0]) / kc[0][0], id, src.__tf__);
  },
  /** Linear Regression
   * @param {TS} src - Input
   * @param {number} len - Length
   * @param {number} offset - Offset
   * @return {TS} - New time-series
   */
  linreg: function linreg(src, len, offset, _id) {
    if (offset === void 0) {
      offset = 0;
    }
    var id = this._tsid(_id, "linreg(".concat(len, ")"));
    src.__len__ = Math.max(src.__len__ || 0, len);
    var lr = (0,_stuff_linreg_js__WEBPACK_IMPORTED_MODULE_0__["default"])(src, len, offset);
    return this.ts(lr, id, src.__tf__);
  },
  /** Moving Average Convergence/Divergence
   * @param {TS} src - Input
   * @param {number} fast - Fast EMA
   * @param {number} slow - Slow EMA
   * @param {number} sig - Signal
   * @return {TS[]} - [macd, signal, hist]
   */
  macd: function macd(src, fast, slow, sig, _id) {
    var id = this._tsid(_id, "macd(".concat(fast).concat(slow).concat(sig, ")"));
    var fast_ma = this.ema(src, fast, id + '1');
    var slow_ma = this.ema(src, slow, id + '2');
    var macd = this.sub(fast_ma, slow_ma, id + '3');
    var signal = this.ema(macd, sig, id + '4');
    var hist = this.sub(macd, signal, id + '5');
    return [macd, signal, hist];
  },
  /** Money Flow Index
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  mfi: function mfi(src, len, _id) {
    var id = this._tsid(_id, "mfi(".concat(len, ")"));
    var vol = this.env.shared.vol;
    var ch = this.change(src, 1, id + '1')[0];
    var ts1 = this.mult(vol, ch <= 0.0 ? 0.0 : src[0], id + '2');
    var ts2 = this.mult(vol, ch >= 0.0 ? 0.0 : src[0], id + '3');
    var upper = this.sum(ts1, len, id + '4');
    var lower = this.sum(ts2, len, id + '5');
    var res = undefined;
    if (!this.na(lower)) {
      res = this.rsi(upper, lower, id + '6')[0];
    }
    return this.ts(res, id, src.__tf__);
  },
  /** Exponentially MA with alpha = 1 / length
   * Used in RSI
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  rma: function rma(src, len, _id) {
    var id = this._tsid(_id, "rma(".concat(len, ")"));
    var a = len;
    var sum = this.ts(0, id, src.__tf__);
    sum[0] = this.na(sum[1]) ? this.sma(src, len, id)[0] : (src[0] + (a - 1) * this.nz(sum[1])) / a;
    return sum;
  },
  /** Rate of Change
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  roc: function roc(src, len, _id) {
    var id = this._tsid(_id, "roc(".concat(len, ")"));
    return this.ts(100 * (src[0] - src[len]) / src[len], id, src.__tf__);
  },
  /** Relative Strength Index
   * @param {TS} x - First Input
   * @param {number|TS} y - Second Input
   * @return {TS} - New time-series
   */
  rsi: function rsi(x, y, _id) {
    var id, rsi;
    // Check if y is a timeseries
    if (!this.na(y) && y.__id__) {
      id = this._tsid(_id, "rsi(x,y)");
      rsi = 100 - 100 / (1 + this.div(x, y, id)[0]);
    } else {
      id = this._tsid(_id, "rsi(".concat(y, ")"));
      var ch = this.change(x, 1, _id)[0];
      var pc = this.ts(Math.max(ch, 0), id + '1', x.__tf__);
      var nc = this.ts(-Math.min(ch, 0), id + '2', x.__tf__);
      var up = this.rma(pc, y, id + '3')[0];
      var down = this.rma(nc, y, id + '4')[0];
      rsi = down === 0 ? 100 : up === 0 ? 0 : 100 - 100 / (1 + up / down);
    }
    return this.ts(rsi, id + '5', x.__tf__);
  },
  /** Parabolic SAR
   * @param {number} start - Start
   * @param {number} inc - Increment
   * @param {number} max - Maximum
   * @return {TS} - New time-series
   */
  sar: function sar(start, inc, max, _id, _tf) {
    var id = this._tsid(_id, "sar(".concat(start, ",").concat(inc, ",").concat(max, ")"));
    var tfs = _tf || '';
    var high = this.env.shared["high".concat(tfs)];
    var low = this.env.shared["low".concat(tfs)];
    var close = this.env.shared["close".concat(tfs)];
    var minTick = 0;
    var out = this.ts(undefined, id + '1', _tf);
    var pos = this.ts(undefined, id + '2', _tf);
    var maxMin = this.ts(undefined, id + '3', _tf);
    var acc = this.ts(undefined, id + '4', _tf);
    var n = _tf ? out.__len__ - 1 : _script_state_js__WEBPACK_IMPORTED_MODULE_1__["default"].iter;
    var prev;
    var outSet = false;
    if (n >= 1) {
      prev = out[1];
      if (n === 1) {
        if (close[0] > close[1]) {
          pos[0] = 1;
          maxMin[0] = Math.max(high[0], high[1]);
          prev = Math.min(low[0], low[1]);
        } else {
          pos[0] = -1;
          maxMin[0] = Math.min(low[0], low[1]);
          prev = Math.max(high[0], high[1]);
        }
        acc[0] = start;
      } else {
        pos[0] = pos[1];
        acc[0] = acc[1];
        maxMin[0] = maxMin[1];
      }
      if (pos[0] === 1) {
        if (high[0] > maxMin[0]) {
          maxMin[0] = high[0];
          acc[0] = Math.min(acc[0] + inc, max);
        }
        if (low[0] <= prev) {
          pos[0] = -1;
          out[0] = maxMin[0];
          maxMin[0] = low[0];
          acc[0] = start;
          outSet = true;
        }
      } else {
        if (low[0] < maxMin[0]) {
          maxMin[0] = low[0];
          acc[0] = Math.min(acc[0] + inc, max);
        }
        if (high[0] >= prev) {
          pos[0] = 1;
          out[0] = maxMin[0];
          maxMin[0] = high[0];
          acc[0] = start;
          outSet = true;
        }
      }
      if (!outSet) {
        out[0] = prev + acc[0] * (maxMin[0] - prev);
        if (pos[0] === 1) if (out[0] >= low[0]) out[0] = low[0] - minTick;
        if (pos[0] === -1) if (out[0] <= high[0]) out[0] = high[0] + minTick;
      }
    }
    return out;
  },
  /** Simple Moving Average
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  sma: function sma(src, len, _id) {
    var id = this._tsid(_id, "sma(".concat(len, ")"));
    var sum = 0;
    for (var i = 0; i < len; i++) {
      sum = sum + src[i];
    }
    return this.ts(sum / len, id, src.__tf__);
  },
  /** Standard deviation
   * @param {TS} src - Input
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  stdev: function stdev(src, len, _id) {
    var sumf = function sumf(x, y) {
      var res = x + y;
      return res;
    };
    var id = this._tsid(_id, "stdev(".concat(len, ")"));
    var avg = this.sma(src, len, id);
    var sqd = 0;
    for (var i = 0; i < len; i++) {
      var sum = sumf(src[i], -avg[0]);
      sqd += sum * sum;
    }
    return this.ts(Math.sqrt(sqd / len), id, src.__tf__);
  },
  /** Stochastic
   * @param {TS} src - Input
   * @param {TS} high - TS of high
   * @param {TS} low - TS of low
   * @param {number} len - Length
   * @return {TS} - New time-series
   */
  stoch: function stoch(src, high, low, len, _id) {
    var id = this._tsid(_id, "sum(".concat(len, ")"));
    var x = 100 * (src[0] - this.lowest(low, len)[0]);
    var y = this.highest(high, len)[0] - this.lowest(low, len)[0];
    return this.ts(x / y, id, src.__tf__);
  },
  /** Supertrend Indicator
   * @param {number} factor - ATR multiplier
   * @param {number} atrlen - Length of ATR
   * @return {TS[]} - Supertrend line and direction of trend
   */
  supertrend: function supertrend(factor, atrlen, _id, _tf) {
    var id = this._tsid(_id, "supertrend(".concat(factor, ",").concat(atrlen, ")"));
    var tfs = _tf || '';
    var high = this.env.shared["high".concat(tfs)];
    var low = this.env.shared["low".concat(tfs)];
    var close = this.env.shared["close".concat(tfs)];
    var hl2 = (high[0] + low[0]) * 0.5;
    var atr = factor * this.atr(atrlen, id + '1', _tf)[0];
    var ls = this.ts(hl2 - atr, id + '2', _tf);
    var ls1 = this.nz(ls[1], ls[0]);
    ls[0] = close[1] > ls1 ? Math.max(ls[0], ls1) : ls[0];
    var ss = this.ts(hl2 + atr, id + '3', _tf);
    var ss1 = this.nz(ss[1], ss);
    ss[0] = close[1] < ss1 ? Math.min(ss[0], ss1) : ss[0];
    var dir = this.ts(1, id + '4', _tf);
    dir[0] = this.nz(dir[1], dir[0]);
    dir[0] = dir[0] === -1 && close[0] > ss1 ? 1 : dir[0] === 1 && close[0] < ls1 ? -1 : dir[0];
    var plot = this.ts(dir[0] === 1 ? ls[0] : ss[0], id + '5', _tf);
    return [plot, this.neg(dir, id + '6')];
  },
  /** Symmetrically Weighted Moving Average
   * @param {TS} src - Input
   * @return {TS} - New time-series
   */
  swma: function swma(src, _id) {
    var id = this._tsid(_id, "swma");
    var sum = src[3] * this.SWMA[0] + src[2] * this.SWMA[1] + src[1] * this.SWMA[2] + src[0] * this.SWMA[3];
    return this.ts(sum, id, src.__tf__);
  },
  /** True Range
   * @param {TS} fixnan - Fix NaN values
   * @return {TS} - New time-series
   */
  tr: function tr(fixnan, _id, _tf) {
    if (fixnan === void 0) {
      fixnan = false;
    }
    var id = this._tsid(_id, "tr(".concat(fixnan, ")"));
    var tfs = _tf || '';
    var high = this.env.shared["high".concat(tfs)];
    var low = this.env.shared["low".concat(tfs)];
    var close = this.env.shared["close".concat(tfs)];
    var res = 0;
    if (this.na(close[1]) && fixnan) {
      res = high[0] - low[0];
    } else {
      res = Math.max(high[0] - low[0], Math.abs(high[0] - close[1]), Math.abs(low[0] - close[1]));
    }
    return this.ts(res, id, _tf);
  },
  /** True strength index
   * @param {TS} src - Input
   * @param {number} short - Short length
   * @param {number} long - Long length
   * @return {TS} - New time-series
   */
  tsi: function tsi(src, _short, _long, _id) {
    var id = this._tsid(_id, "tsi(".concat(_short, ",").concat(_long, ")"));
    var m = this.change(src, 1, id + '0');
    var m_abs = this.ts(Math.abs(m[0]), id + '1', src.__tf__);
    var tsi = this.ema(this.ema(m, _long, id + '1'), _short, id + '2')[0] / this.ema(this.ema(m_abs, _long, id + '3'), _short, id + '4')[0];
    return this.ts(tsi, id, src.__tf__);
  },
  /** Volume Weighted Moving Average
   * @param {TS} src - Input
   * @param {number} len - length
   * @return {TS} - New time-series
   */
  vwma: function vwma(src, len, _id) {
    var id = this._tsid(_id, "vwma(".concat(len, ")"));
    var vol = this.env.shared.vol;
    var sxv = this.ts(src[0] * vol[0], id + '1', src.__tf__);
    var res = this.sma(sxv, len, id + '2')[0] / this.sma(vol, len, id + '3')[0];
    return this.ts(res, id + '4', src.__tf__);
  },
  /** Weighted moving average
   * @param {TS} src - Input
   * @param {number} len - length
   * @return {TS} - New time-series
   */
  wma: function wma(src, len, _id) {
    var id = this._tsid(_id, "wma(".concat(len, ")"));
    var norm = 0;
    var sum = 0;
    for (var i = 0; i < len; i++) {
      var w = (len - i) * len;
      norm += w;
      sum += src[i] * w;
    }
    return this.ts(sum / norm, id, src.__tf__);
  },
  /** Williams %R
   * @param {number} len - length
   * @return {TS} - New time-series
   */
  wpr: function wpr(len, _id, _tf) {
    var id = this._tsid(_id, "wpr(".concat(len, ")"));
    var tfs = _tf || '';
    var high = this.env.shared["high".concat(tfs)];
    var low = this.env.shared["low".concat(tfs)];
    var close = this.env.shared["close".concat(tfs)];
    var hh = this.highest(high, len, id);
    var ll = this.lowest(low, len, id);
    var res = (hh[0] - close[0]) / (hh[0] - ll[0]);
    return this.ts(-res * 100, id, _tf);
  }
});

/***/ },

/***/ "./src/helpers/std/math.js"
/*!*********************************!*\
  !*** ./src/helpers/std/math.js ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Math functions for ScriptStd

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /** Absolute value
   * @param {number} x - Input
   * @return {number} - Absolute value
   */
  abs: function abs(x) {
    return Math.abs(x);
  },
  /** Arccosine function
   * @param {number} x - Input
   * @return {number} - Arccosine of x
   */
  acos: function acos(x) {
    return Math.acos(x);
  },
  /** Arcsine function
   * @param {number} x - Input
   * @return {number} - Arcsine of x
   */
  asin: function asin(x) {
    return Math.asin(x);
  },
  /** Arctangent function
   * @param {number} x - Input
   * @return {number} - Arctangent of x
   */
  atan: function atan(x) {
    return Math.atan(x);
  },
  /** Shortcut for Math.ceil()
   * @param {number} x The variable
   * @return {number}
   */
  ceil: function ceil(x) {
    return Math.ceil(x);
  },
  /** Cosine function
   * @param {number} x - Input
   * @return {number} - Cosine of x
   */
  cos: function cos(x) {
    return Math.cos(x);
  },
  /** Shortcut for Math.exp()
   * @param {number} x The variable
   * @return {number}
   */
  exp: function exp(x) {
    return Math.exp(x);
  },
  /** Shortcut for Math.floor()
   * @param {number} x The variable
   * @return {number}
   */
  floor: function floor(x) {
    return Math.floor(x);
  },
  /** Shortcut for Math.log()
   * @param {number} x The variable
   * @return {number}
   */
  log: function log(x) {
    return Math.log(x);
  },
  /** Shortcut for Math.log10()
   * @param {number} x The variable
   * @return {number}
   */
  log10: function log10(x) {
    return Math.log10(x);
  },
  /** Shortcut for Math.pow()
   * @param {number} x The variable
   * @return {number}
   */
  pow: function pow(x, y) {
    return Math.pow(x, y);
  },
  /** Shortcut for Math.round()
   * @param {number} x The variable
   * @return {number}
   */
  round: function round(x) {
    return Math.round(x);
  },
  /** Shortcut for Math.sign()
   * @param {number} x The variable
   * @return {number}
   */
  sign: function sign(x) {
    return Math.sign(x);
  },
  /** Sine function
   * @param {number} x The variable
   * @return {number}
   */
  sin: function sin(x) {
    return Math.sin(x);
  },
  /** Shortcut for Math.sqrt()
   * @param {number} x The variable
   * @return {number}
   */
  sqrt: function sqrt(x) {
    return Math.sqrt(x);
  },
  /** Tangent function
   * @param {number} x The variable
   * @return {number}
   */
  tan: function tan(x) {
    return Math.tan(x);
  }
});

/***/ },

/***/ "./src/helpers/std/symbol.js"
/*!***********************************!*\
  !*** ./src/helpers/std/symbol.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/typeof */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");
/* harmony import */ var _symbol_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../symbol.js */ "./src/helpers/symbol.js");
/* harmony import */ var _script_state_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../script_state.js */ "./src/helpers/script_state.js");

// Symbol functions for ScriptStd



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /** Creates a new Symbol.
   * @param {*} x - Something, depends on arg variation
   * @param {*} y - Something, depends on arg variation
   * @return {Sym}
   * Argument variations:
   * <data>(Array), [<params>(Object)]
   * <ts>(TS), [<params>(Object)]
   * <point>(Number), [<params>(Object)]
   * <tf>(String) 1m, 5m, 1H, etc. (uses main OHLCV)
   * Params object: {
   *  id: <String>,
   *  tf: <String|Number>,
   *  aggtype: <String> (TODO: Type of aggregation)
   *  format: <String> (Data format, e.g. "time:price:vol")
   *  window: <String|Number> (Aggregation window)
   *  main <true|false> (Use as the main chart)
   * }
   */
  sym: function sym(x, y, _id) {
    if (y === void 0) {
      y = {};
    }
    var id = y.id || this._tsid(_id, "sym");
    y.id = id;
    if (this.env.syms[id]) {
      this.env.syms[id].update(x);
      return this.env.syms[id];
    }
    var sym;
    switch ((0,_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__["default"])(x)) {
      case 'object':
        sym = new _symbol_js__WEBPACK_IMPORTED_MODULE_1__.Sym(x, y);
        this.env.syms[id] = sym;
        if (x.__id__) {
          sym.data_type = _symbol_js__WEBPACK_IMPORTED_MODULE_1__.TSS;
        } else {
          sym.data_type = _symbol_js__WEBPACK_IMPORTED_MODULE_1__.ARR;
        }
        break;
      case 'number':
        sym = new _symbol_js__WEBPACK_IMPORTED_MODULE_1__.Sym(null, y);
        sym.data_type = _symbol_js__WEBPACK_IMPORTED_MODULE_1__.NUM;
        break;
      case 'string':
        y.tf = x;
        sym = new _symbol_js__WEBPACK_IMPORTED_MODULE_1__.Sym(_script_state_js__WEBPACK_IMPORTED_MODULE_2__["default"].data.ohlcv.data, y);
        sym.data_type = _symbol_js__WEBPACK_IMPORTED_MODULE_1__.ARR;
        break;
    }
    this.env.syms[id] = sym;
    return sym;
  }
});

/***/ },

/***/ "./src/helpers/std/time.js"
/*!*********************************!*\
  !*** ./src/helpers/std/time.js ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _script_state_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../script_state.js */ "./src/helpers/script_state.js");
// Time functions for ScriptStd
// Note: These use 'se' from script_state for current timestamp


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /** Day of month, literally
   * @param {number} [time] - Time in ms (current t, if not defined)
   * @return {number} - Day
   */
  dayofmonth: function dayofmonth(time) {
    return new Date(time || _script_state_js__WEBPACK_IMPORTED_MODULE_0__["default"].t).getUTCDate();
  },
  /** Day of week, literally
   * @param {number} [time] - Time in ms (current t, if not defined)
   * @return {number} - Day
   */
  dayofweek: function dayofweek(time) {
    return new Date(time || _script_state_js__WEBPACK_IMPORTED_MODULE_0__["default"].t).getUTCDay() + 1;
  },
  /** Returns hours of a given timestamp
   * @param {number} [time] - Time in ms (current t, if not defined)
   * @return {number} - Hour
   */
  hour: function hour(time) {
    return new Date(time || _script_state_js__WEBPACK_IMPORTED_MODULE_0__["default"].t).getUTCHours();
  },
  /** Returns minutes of a given timestamp
   * @param {number} [time] - Time in ms (current t, if not defined)
   * @return {number} - Minute
   */
  minute: function minute(time) {
    return new Date(time || _script_state_js__WEBPACK_IMPORTED_MODULE_0__["default"].t).getUTCMinutes();
  },
  /** Month
   * @param {number} [time] - Time in ms (current t, if not defined)
   * @return {number} - Month
   */
  month: function month(time) {
    return new Date(time || _script_state_js__WEBPACK_IMPORTED_MODULE_0__["default"].t).getUTCMonth();
  },
  /** The current time
   * @return {number} - timestamp
   */
  now: function now() {
    // PERFORMANCE: Date.now() is 5-10x faster than new Date().getTime()
    return Date.now();
  },
  /** Returns seconds of a given timestamp
   * @param {number} [time] - Time in ms (current t, if not defined)
   * @return {number} - Second
   */
  second: function second(time) {
    return new Date(time || _script_state_js__WEBPACK_IMPORTED_MODULE_0__["default"].t).getUTCSeconds();
  },
  /** Week of year, literally
   * @param {number} [time] - Time in ms (current t, if not defined)
   * @return {number} - Week
   */
  weekofyear: function weekofyear(time) {
    var date = new Date(time || _script_state_js__WEBPACK_IMPORTED_MODULE_0__["default"].t);
    date.setUTCHours(0, 0, 0, 0);
    date.setDate(date.getUTCDate() + 3 - (date.getUTCDay() + 6) % 7);
    var week1 = new Date(date.getUTCFullYear(), 0, 4);
    return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getUTCDay() + 6) % 7) / 7);
  },
  /** Year
   * @param {number} [time] - Time in ms (current t, if not defined)
   * @return {number} - Year
   */
  year: function year(time) {
    return new Date(time || _script_state_js__WEBPACK_IMPORTED_MODULE_0__["default"].t).getUTCFullYear();
  }
});

/***/ },

/***/ "./src/helpers/std/timeseries.js"
/*!***************************************!*\
  !*** ./src/helpers/std/timeseries.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _script_utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../script_utils.js */ "./src/helpers/script_utils.js");
/* harmony import */ var _sampler_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../sampler.js */ "./src/helpers/sampler.js");
/* harmony import */ var _stuff_constants_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../stuff/constants.js */ "./src/stuff/constants.js");
// Timeseries core functions for ScriptStd




var BUF_INC = _stuff_constants_js__WEBPACK_IMPORTED_MODULE_2__["default"].BUF_INC;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /**
   * Creates a new time-series & records each x.
   * Returns an array. Id is auto-generated
   * @param {*} x - A variable to sample from
   * @return {TS} - New time-series
   */
  ts: function ts(x, _id, _tf) {
    if (_tf) return this.tstf(x, _tf, _id);
    var ts = this.env.tss[_id];
    if (!ts) {
      ts = this.env.tss[_id] = [x];
      ts.__id__ = _id;
    } else {
      ts[0] = x;
    }
    return ts;
  },
  /**
   * Creates a new time-series & records each x.
   * Uses Sampler to aggregate the values
   * Return the an array. Id is auto-generated
   * @param {*} x - A variable to sample from
   * @param {(number|string)} tf - Timeframe in ms or as a string
   * @return {TS} - New time-series
   */
  tstf: function tstf(x, tf, _id) {
    var ts = this.env.tss[_id];
    if (!ts) {
      ts = this.env.tss[_id] = [x];
      ts.__id__ = _id;
      ts.__tf__ = _script_utils_js__WEBPACK_IMPORTED_MODULE_0__.tf_from_str(tf);
      ts.__fn__ = (0,_sampler_js__WEBPACK_IMPORTED_MODULE_1__["default"])('close').bind(ts);
    } else {
      ts.__fn__(x);
    }
    return ts;
  },
  /**
   * Creates a new custom sampler.
   * Return the an array. Id is auto-generated
   * @param {*} x - A variable to sample from
   * @param {string} type - Sampler type
   * @param {(number|string)} tf - Timeframe in ms or as a string
   * @return {TS} - New time-series
   */
  sample: function sample(x, type, tf, _id) {
    var ts = this.env.tss[_id];
    if (!ts) {
      ts = this.env.tss[_id] = [x];
      ts.__id__ = _id;
      ts.__tf__ = _script_utils_js__WEBPACK_IMPORTED_MODULE_0__.tf_from_str(tf);
      ts.__fn__ = (0,_sampler_js__WEBPACK_IMPORTED_MODULE_1__["default"])(type).bind(ts);
    } else {
      ts.__fn__(x);
    }
    return ts;
  },
  // Generate the next timeseries id
  _tsid: function _tsid(prev, next) {
    return "".concat(prev, "<-").concat(next);
  },
  // Index-tracker
  _i: function _i(i, x) {
    // If an object is actually a timeseries
    if (x != undefined && x === x && x.__id__) {
      // Increase TS buff length
      if (!x.__len__ || i >= x.__len__) {
        x.__len__ = i + BUF_INC;
      }
    }
    return i;
  },
  // Index-tracker (object-based)
  _v: function _v(x, i) {
    // If an object is actually a timeseries
    if (x != undefined && x === x && x.__id__) {
      // Increase TS buff length
      if (!x.__len__ || i >= x.__len__) {
        x.__len__ = i + BUF_INC;
      }
    }
    return x;
  }
});

/***/ },

/***/ "./src/helpers/std/utils.js"
/*!**********************************!*\
  !*** ./src/helpers/std/utils.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Utility functions for ScriptStd

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /** Replaces the variable if it's NaN
   * @param {*} x - The variable
   * @param {*} [v] - A value to replace with
   * @return {*} - New value
   */
  nz: function nz(x, v) {
    if (x == undefined || x !== x) {
      return v || 0;
    }
    return x;
  },
  /** Is the variable NaN ?
   * @param {*} x - The variable
   * @return {boolean} - New value
   */
  na: function na(x) {
    return x == undefined || x !== x;
  },
  /** Replaces the var with NaN if Infinite
   * @param {*} x - The variable
   * @param {*} [v] - A value to replace with
   * @return {*} - New value
   */
  nf: function nf(x, v) {
    if (!isFinite(x)) {
      return v !== undefined ? v : NaN;
    }
    return x;
  },
  /** Converts the variable to Boolean
   * @param {number} x The variable
   * @return {number}
   */
  bool: function bool(x) {
    return !!x;
  },
  /** Returns x or y depending on the condition
   * @param {(boolean|TS)} cond - Condition
   * @param {*} x - First value
   * @param {*} y - Second value
   * @return {*}
   */
  iff: function iff(cond, x, y) {
    if (cond && cond.__id__) cond = cond[0];
    return cond ? x : y;
  },
  /** Sets the reverse buffer size for a given
   * time-series (default = 5, grows on demand)
   * @param {TS} src - Input
   * @param {number} len - New length
   */
  buffsize: function buffsize(src, len) {
    src.__len__ = len;
  },
  /** For a given series replaces NaN values with
   * previous nearest non-NaN value
   * @param {TS} src - Input time-series
   * @return {TS}
   */
  fixnan: function fixnan(src) {
    if (this.na(src[0])) {
      for (var i = 1; i < src.length; i++) {
        if (!this.na(src[i])) {
          src[0] = src[i];
          break;
        }
      }
    }
    return src;
  },
  /** Shifts TS left or right by "num" candles
   * @param {number} num - Offset measured in candles
   * @return {TS} - New / existing time-series
   */
  offset: function offset(src, num, _id) {
    if (src.__id__) {
      src.__offset__ = num;
      return src;
    }
    var id = this._tsid(_id, "offset(".concat(num, ")"));
    var out = this.ts(src, id);
    out.__offset__ = num;
    return out;
  }
});

/***/ },

/***/ "./src/helpers/symbol.js"
/*!*******************************!*\
  !*** ./src/helpers/symbol.js ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ARR: () => (/* binding */ ARR),
/* harmony export */   NUM: () => (/* binding */ NUM),
/* harmony export */   Sym: () => (/* binding */ Sym),
/* harmony export */   TSS: () => (/* binding */ TSS),
/* harmony export */   "default": () => (/* binding */ Sym)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ "./node_modules/@babel/runtime/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ "./node_modules/@babel/runtime/helpers/esm/createClass.js");
/* harmony import */ var _script_utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./script_utils.js */ "./src/helpers/script_utils.js");
/* harmony import */ var _script_engine_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./script_engine.js */ "./src/helpers/script_engine.js");
/* harmony import */ var _script_ts_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./script_ts.js */ "./src/helpers/script_ts.js");
/* harmony import */ var _sampler_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./sampler.js */ "./src/helpers/sampler.js");


function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Symbol (contains several samplers, e.g. high, low, close...)





var OHLCV = ['open', 'high', 'low', 'close', 'vol'];
var ARR = 0;
var TSS = 1;
var NUM = 2;
var Sym = /*#__PURE__*/function () {
  function Sym(data, params) {
    (0,_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, Sym);
    this.id = params.id;
    this.tf = _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.tf_from_str(params.tf);
    this.format = params.format;
    this.aggtype = params.aggtype || 'ohlcv';
    this.window = params.window;
    this.fillgaps = params.fillgaps;
    this.data = data;
    this.data_type = ARR;
    this.main = !!params.main;
    this.idx = this.data_idx();
    this.tmap = {};
    this.tf = this.tf || _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].tf;
    if (this.main) this.tf = _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].tf;

    // Create a bunch of OHLCV samplers for
    // sparse data
    if (this.aggtype === 'ohlcv') {
      var _iterator = _createForOfIteratorHelper(OHLCV),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var id = _step.value;
          this[id] = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_4__["default"])("".concat(this.id, "_").concat(id), []);
          this[id].__fn__ = (0,_sampler_js__WEBPACK_IMPORTED_MODULE_5__["default"])(id).bind(this[id]);
          this[id].__tf__ = this.tf;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    // Create regular TSs & just feed them with a
    // data points from the dataset
    // TODO: different TS configurations depending
    // on this.format
    if (this.aggtype === 'copy') {
      var _iterator2 = _createForOfIteratorHelper(OHLCV),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _id = _step2.value;
          this[_id] = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_4__["default"])("".concat(this.id, "_").concat(_id), []);
          this[_id].__tf__ = this.tf;
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      for (var i = 0; i < this.data.length; i++) {
        this.tmap[this.data[i][0]] = i;
      }
    }
    // Custom agg function (value calculated for the
    // current window)
    if (typeof this.aggtype === 'function') {
      this.close = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_4__["default"])("".concat(this.id, "_close"), []);
      this.close.__fn__ = this.aggtype;
      this.close.__tf__ = this.tf;
    }
    if (this.main) {
      if (!this.tf) throw 'Main tf should be defined';
      _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].custom_main = this;
      var t0 = this.data[0][0];
      _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].t = t0 - t0 % this.tf;
      this.update(null, _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].t);

      // First candle should be formed before any updates()
      _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].data.ohlcv.data.length = 0;
      _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].data.ohlcv.data.push([_script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].t, this.open[0], this.high[0], this.low[0], this.close[0], this.vol[0]]);
    }
  }
  return (0,_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(Sym, [{
    key: "update",
    value: function update(x, t) {
      if (this.aggtype === 'ohlcv') {
        return this.update_ohlcv(x, t);
      } else if (this.aggtype === 'copy') {
        return this.update_copy(x, t);
      } else if (typeof this.aggtype === 'function') {
        return this.update_custom(x, t);
      }
    }
  }, {
    key: "update_ohlcv",
    value: function update_ohlcv(x, t) {
      // Timestamp of the target candle, can be
      // current or the next (if we are sampling
      // the main chart)
      t = t || _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].t;
      var idx = this.idx;
      switch (this.data_type) {
        case ARR:
          if (t > this.data[this.data.length - 1][0]) return false;
          var t0 = this.window ? t - this.window + this.tf : t;
          var dt = t0 % this.tf;
          t0 -= dt;
          var i0 = _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.nextt(this.data, t0);
          if (i0 >= this.data.length) return false;
          var t1 = t + _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].tf;
          // Flush volume before the next window,
          // but not before a new candle
          if (t < this.vol.__t0__ + this.tf) this.vol[0] = 0;
          var noevent = true;
          for (var i = i0; i < this.data.length; i++) {
            noevent = false;
            var dp = this.data[i];
            if (dp[idx.time] >= t1) break;
            this.open.__fn__(dp[idx.open], t);
            this.high.__fn__(dp[idx.high], t);
            this.low.__fn__(dp[idx.low], t);
            this.close.__fn__(dp[idx.close], t);
            this.vol.__fn__(dp[idx.vol], t);
          }
          if (noevent) {
            if (this.fillgaps === false && !this.main) return false;
            var last = this.close[0];
            this.open.__fn__(last, t);
            this.high.__fn__(last, t);
            this.low.__fn__(last, t);
            this.close.__fn__(last, t);
            this.vol.__fn__(0, t);
          }
          break;
        case TSS:
          // TODO: this
          break;
        case NUM:
          // TODO: this
          break;
      }
      return true;
    }
  }, {
    key: "update_copy",
    value: function update_copy(x, t) {
      t = t || _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].t;

      // Assuming that we got an ohlcv dataset
      var i = this.tmap[t];
      var s = this.data[i];
      var ts0 = this.__t0__;
      if (!ts0 || t >= ts0 + this.tf) {
        for (var k = 0; k < 5; k++) {
          var tsn = OHLCV[k];
          this[tsn].unshift(undefined);
        }
        this.__t0__ = t - t % this.tf;
        var last = this.data.length - 1;
        if (this.__t0__ === this.data[last][0]) {
          this.tmap[this.__t0__] = last;
          s = this.data[last];
        }
      }
      if (s) {
        for (var _k = 0; _k < 5; _k++) {
          var _tsn = OHLCV[_k];
          this[_tsn][0] = s[_k + 1];
        }
      } else if (this.fillgaps) {
        for (var _k2 = 0; _k2 < 5; _k2++) {
          var _tsn2 = OHLCV[_k2];
          this[_tsn2][0] = this.close[1];
        }
      }
    }
  }, {
    key: "update_custom",
    value: function update_custom(x, t) {
      t = t || _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].t;
      var idx = this.idx;
      switch (this.data_type) {
        case ARR:
          if (!this.data.length) return false;
          if (t > this.data[this.data.length - 1][0]) return false;
          var t0 = this.window ? t - this.window + this.tf : t;
          var dt = t0 % this.tf;
          t0 -= dt;
          var i0 = _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.nextt(this.data, t0);
          if (i0 >= this.data.length) return false;
          var t1 = t + _script_engine_js__WEBPACK_IMPORTED_MODULE_3__["default"].tf;
          var sub = [];
          for (var i = i0; i < this.data.length; i++) {
            var dp = this.data[i];
            if (dp[idx.time] >= t1) break;
            sub.push(dp);
          }
          var val;
          if (sub.length || this.fillgaps === false) {
            val = this.close.__fn__(sub); // TODO: prob a bug
          } else if (this.fillgaps !== false) {
            val = this.close[0];
          }
          var ts0 = this.close.__t0__;
          if (!ts0 || t >= ts0 + this.tf) {
            this.close.unshift(val);
            this.close.__t0__ = t - t % this.tf;
          } else {
            this.close[0] = val;
          }
          break;
        case TSS:
          // TODO: this
          break;
        case NUM:
          // TODO: this
          break;
      }
      return true;
    }

    // Calculates data indices from the format
  }, {
    key: "data_idx",
    value: function data_idx() {
      var idx = {};
      switch (this.aggtype) {
        case 'ohlcv':
          // Trying to detect the format from the
          // first data point
          if (!this.format) {
            var x0 = this.data[0];
            if (!x0 || x0.length === 6) {
              this.format = 'time:open:high:low:close:vol';
            } else if (x0.length === 3) {
              this.format = 'time:open,high,low,close:vol';
            }
          }
          break;
        default:
          this.format = 'time:close';
          break;
      }
      this.format.split(':').forEach(function (x, i) {
        if (!x.length) return;
        var list = x.split(',');
        list.forEach(function (y) {
          return idx[y] = i;
        });
      });
      return idx;
    }
  }]);
}();



/***/ },

/***/ "./src/helpers/symstd.js"
/*!*******************************!*\
  !*** ./src/helpers/symstd.js ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _script_ts_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./script_ts.js */ "./src/helpers/script_ts.js");
/* harmony import */ var _sampler_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sampler.js */ "./src/helpers/sampler.js");
/* harmony import */ var _script_engine_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./script_engine.js */ "./src/helpers/script_engine.js");
/* harmony import */ var _script_utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./script_utils.js */ "./src/helpers/script_utils.js");
/* harmony import */ var _script_std_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./script_std.js */ "./src/helpers/script_std.js");
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// Parse non-default symbols, e.g. close1D, hlc3
// & inject the corresponding TSs or samplers






var SYMTF = /(open|high|low|close|vol)(\d+)(\w*)/gm;
var FNSTD = /(a?tr|kcw?|dmi|sar|supertrend|wpr)(\d+?\w*)\s*\(/gm;
var SYMSTD = /(?:hl2|hlc3|ohlc4)/gm;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  parse: function parse(s) {
    var _this = this;
    var ss = s.src;
    var all = "".concat(ss.init_src, "\n").concat(ss.upd_src, "\n").concat(ss.post_src);
    SYMTF.lastIndex = 0;
    FNSTD.lastIndex = 0;
    SYMSTD.lastIndex = 0;
    var m;
    do {
      m = SYMTF.exec(all);
      if (m) {
        if (m[0] in _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss) continue;
        var ts = _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss[m[0]] = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_0__["default"])(m[0], []);
        ts.__tf__ = _script_utils_js__WEBPACK_IMPORTED_MODULE_3__.tf_from_pair(m[2], m[3]);
        ts.__fn__ = (0,_sampler_js__WEBPACK_IMPORTED_MODULE_1__["default"])(m[1], true).bind(ts);
      }
    } while (m);
    do {
      m = SYMSTD.exec(all);
      if (m) {
        if (m[0] in _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss) continue;
        this.parse_ts_sym(m[0]);
      }
    } while (m);
    var _loop = function _loop() {
      m = FNSTD.exec(all);
      if (m) {
        var fn = m[1] + m[2];
        var tf = m[2];
        if (fn in _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus) return 1; // continue
        switch (m[1]) {
          case 'tr':
            _this.deps(['high', 'low', 'close'], m[2]);
            _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus[fn] = function (fixnan, _id) {
              if (fixnan === void 0) {
                fixnan = false;
              }
              return this.tr(fixnan, _id, tf);
            };
            break;
          case 'atr':
            _this.deps(['high', 'low', 'close'], m[2]);
            _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus[fn] = function (len, _id) {
              return this.atr(len, _id, tf);
            };
            break;
          case 'kc':
            _this.deps(['high', 'low', 'close'], m[2]);
            _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus[fn] = function (src, len, mult, use_tr, _id) {
              if (use_tr === void 0) {
                use_tr = true;
              }
              return this.kc(src, len, mult, use_tr, _id, tf);
            };
            break;
          case 'kcw':
            _this.deps(['high', 'low', 'close'], m[2]);
            _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus[fn] = function (src, len, mult, use_tr, _id) {
              if (use_tr === void 0) {
                use_tr = true;
              }
              return this.kcw(src, len, mult, use_tr, _id, tf);
            };
            break;
          case 'dmi':
            _this.deps(['high', 'low', 'close'], m[2]);
            _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus[fn] = function (len, smooth, _id) {
              return this.dmi(len, smooth, _id, tf);
            };
            break;
          case 'sar':
            _this.deps(['high', 'low', 'close'], m[2]);
            _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus[fn] = function (start, inc, max, _id) {
              return this.sar(start, inc, max, _id, tf);
            };
            break;
          case 'supertrend':
            _this.deps(['high', 'low', 'close'], m[2]);
            _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus[fn] = function (factor, atrlen, _id) {
              return this.supertrend(factor, atrlen, _id, tf);
            };
            break;
          case 'wpr':
            _this.deps(['high', 'low', 'close'], m[2]);
            _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].std_plus[fn] = function (len, _id) {
              return this.wpr(len, _id, tf);
            };
            break;
        }
      }
    };
    do {
      if (_loop()) continue;
    } while (m);
  },
  parse_ts_sym: function parse_ts_sym(sym, tf) {
    switch (sym) {
      // Timeseries
      case 'hl2':
        _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss['hl2'] = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_0__["default"])('hl2', []);
        _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss['hl2'].__fn__ = function () {
          return (_script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].high[0] + _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].low[0]) * 0.5;
        };
        break;
      case 'hlc3':
        _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss['hlc3'] = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_0__["default"])('hlc3', []);
        _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss['hlc3'].__fn__ = function () {
          return (_script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].high[0] + _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].low[0] + _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].close[0]) / 3;
        };
        break;
      case 'ohlc4':
        _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss['ohlc4'] = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_0__["default"])('ohlc4', []);
        _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss['ohlc4'].__fn__ = function () {
          return (_script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].open[0] + _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].high[0] + _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].low[0] + _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].close[0]) * 0.25;
        };
        break;
    }
  },
  deps: function deps(types, tf) {
    var _iterator = _createForOfIteratorHelper(types),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var type = _step.value;
        var sym = type + tf;
        if (sym in _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss) continue;
        var ts = _script_engine_js__WEBPACK_IMPORTED_MODULE_2__["default"].tss[sym] = (0,_script_ts_js__WEBPACK_IMPORTED_MODULE_0__["default"])(sym, []);
        ts.__tf__ = _script_utils_js__WEBPACK_IMPORTED_MODULE_3__.tf_from_str(tf);
        ts.__fn__ = (0,_sampler_js__WEBPACK_IMPORTED_MODULE_1__["default"])(type, true).bind(ts);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
});

/***/ },

/***/ "./src/stuff/constants.js"
/*!********************************!*\
  !*** ./src/stuff/constants.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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

// Grid time steps (ascending order — required by nearest_a() binary search)
var TIMESCALES = [MINUTE, MINUTE * 2, MINUTE5, MINUTE * 10, MINUTE15, MINUTE30, HOUR, HOUR * 1.5, HOUR * 3, HOUR * 6, HOUR * 12, DAY, DAY * 2, DAY * 3, DAY * 5, DAY * 7, DAY * 10, DAY * 15, MONTH, MONTH * 2, MONTH * 3, MONTH * 4, MONTH * 6, YEAR, YEAR * 2, YEAR * 3, YEAR * 5, YEAR * 10];

// Grid $ steps
var $SCALES = [0.05, 0.1, 0.2, 0.25, 0.5, 0.8, 1, 2, 5];

// Default overlay color palette
var OVERLAY_COLORS = ['#42b28a', '#5691ce', '#612ff9', '#d50b90', '#ff2316'];
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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
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
  IB_TF_WARN: IB_TF_WARN,
  OVERLAY_COLORS: OVERLAY_COLORS
});

/***/ },

/***/ "./src/stuff/linreg.js"
/*!*****************************!*\
  !*** ./src/stuff/linreg.js ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ regression)
/* harmony export */ });
/**
 * Simple linear regression
 *
 * @param {Array.<number>} data
 * @return {Function}
 */
function regression(data, len, offset) {
  data = data.slice(0, len).reverse().map(function (x, i) {
    return [i, x];
  });
  var sum_x = 0,
    sum_y = 0,
    sum_xy = 0,
    sum_xx = 0,
    count = 0,
    m,
    b;

  // calculate sums
  for (var i = 0, _len = data.length; i < _len; i++) {
    if (!data[i]) return NaN;
    var point = data[i];
    sum_x += point[0];
    sum_y += point[1];
    sum_xx += point[0] * point[0];
    sum_xy += point[0] * point[1];
    count++;
  }

  // calculate slope (m) and y-intercept (b) for f(x) = m * x + b
  m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
  b = sum_y / count - m * sum_x / count;
  return m * (data.length - 1 - offset) + b;
}

/***/ },

/***/ "./src/stuff/utils.js"
/*!****************************!*\
  !*** ./src/stuff/utils.js ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/typeof */ "./node_modules/@babel/runtime/helpers/esm/typeof.js");
/* harmony import */ var _babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var arrayslicer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! arrayslicer */ "./node_modules/arrayslicer/lib/index.js");
/* harmony import */ var arrayslicer__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(arrayslicer__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./constants.js */ "./src/stuff/constants.js");




/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
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
  // Nearest in array - O(log n) binary search for sorted arrays
  nearest_a: function nearest_a(x, array) {
    if (!array || !array.length) return [-1, null];
    if (array.length === 1) return [0, array[0]];

    // Binary search to find insertion point
    var lo = 0;
    var hi = array.length - 1;

    // Handle edge cases: x outside array bounds
    if (x <= array[lo]) return [lo, array[lo]];
    if (x >= array[hi]) return [hi, array[hi]];

    // Binary search for the closest value
    while (lo < hi - 1) {
      var mid = lo + hi >> 1;
      if (array[mid] === x) return [mid, array[mid]];
      if (array[mid] < x) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    // Compare neighbors to find nearest
    var distLo = Math.abs(array[lo] - x);
    var distHi = Math.abs(array[hi] - x);
    return distLo <= distHi ? [lo, array[lo]] : [hi, array[hi]];
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
  // Vue 3: Use splice as single atomic operation to avoid intermediate empty state
  // (arr.length = 0 followed by push causes renders to see empty array)
  overwrite: function overwrite(arr, new_arr) {
    arr.splice.apply(arr, [0, arr.length].concat((0,_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_1__["default"])(new_arr)));
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
    if (min >= _constants_js__WEBPACK_IMPORTED_MODULE_3__["default"].MONTH && min <= _constants_js__WEBPACK_IMPORTED_MODULE_3__["default"].DAY * 30) {
      return _constants_js__WEBPACK_IMPORTED_MODULE_3__["default"].DAY * 31;
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
    // PERF: Quick bounds check — skip IndexedArray if entirely out of range
    if (arr[arr.length - 1][0] < t1 || arr[0][0] > t2) {
      return [[], undefined];
    }
    try {
      var ia = new (arrayslicer__WEBPACK_IMPORTED_MODULE_2___default())(arr, "0");
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
    var ia = new (arrayslicer__WEBPACK_IMPORTED_MODULE_2___default())(arr, "0");
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
      return _constants_js__WEBPACK_IMPORTED_MODULE_3__["default"].map_unit[smth];
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
    for (var _i = 1; _i < data.length; _i++) {
      if (data[_i][0] !== first) {
        second = data[_i][0];
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
  }(typeof window !== 'undefined' ? window : {}),
  // Performance: Loop-based min/max to avoid stack overflow on large arrays
  // Replaces Math.max(...arr) which can crash with >100k elements
  maxInArray: function maxInArray(arr) {
    if (!arr || !arr.length) return -Infinity;
    var max = arr[0];
    for (var _i2 = 1; _i2 < arr.length; _i2++) {
      if (arr[_i2] > max) max = arr[_i2];
    }
    return max;
  },
  minInArray: function minInArray(arr) {
    if (!arr || !arr.length) return Infinity;
    var min = arr[0];
    for (var _i3 = 1; _i3 < arr.length; _i3++) {
      if (arr[_i3] < min) min = arr[_i3];
    }
    return min;
  },
  // Max value at specific index in array of arrays
  // e.g. maxAtIndex([[1,2,3], [4,5,6]], 1) => 5
  maxAtIndex: function maxAtIndex(arr, idx) {
    if (!arr || !arr.length) return -Infinity;
    var max = arr[0][idx];
    for (var _i4 = 1; _i4 < arr.length; _i4++) {
      var val = arr[_i4][idx];
      if (val > max) max = val;
    }
    return max;
  },
  // Min value at specific index in array of arrays
  minAtIndex: function minAtIndex(arr, idx) {
    if (!arr || !arr.length) return Infinity;
    var min = arr[0][idx];
    for (var _i5 = 1; _i5 < arr.length; _i5++) {
      var val = arr[_i5][idx];
      if (val < min) min = val;
    }
    return min;
  },
  // RAF-based throttle for high-frequency events (wheel, pan, etc.)
  // Limits execution to once per animation frame (~60fps)
  rafThrottle: function rafThrottle(fn) {
    var rafId = null;
    var lastArgs = null;
    var context = null;
    var throttled = function throttled() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      lastArgs = args;
      context = this;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(function () {
        rafId = null;
        fn.apply(context, lastArgs);
      });
    };
    throttled.cancel = function () {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
    return throttled;
  },
  // PERFORMANCE: Fast deep copy - much faster than JSON.parse(JSON.stringify())
  // Optimized for typical chart data structures (arrays of primitives, nested objects)
  fastDeepCopy: function fastDeepCopy(obj) {
    if (obj === null || (0,_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__["default"])(obj) !== 'object') return obj;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return [];
      // Fast path for primitive arrays (common case for OHLCV data)
      var first = obj[0];
      if (first === null || (0,_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__["default"])(first) !== 'object') {
        return obj.slice();
      }
      // Nested array - recurse
      var _copy = new Array(obj.length);
      for (var _i6 = 0; _i6 < obj.length; _i6++) {
        _copy[_i6] = this.fastDeepCopy(obj[_i6]);
      }
      return _copy;
    }
    // Object - copy properties
    var copy = {};
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = this.fastDeepCopy(obj[key]);
      }
    }
    return copy;
  },
  // PERF: LRU date cache — avoids repeated new Date() for visible axis labels
  // Cursor moves and botbar rendering hit multiple unique timestamps per frame
  _dateCache: new Map(),
  _dateCacheMax: 16,
  getCachedDate: function getCachedDate(timestamp) {
    var d = this._dateCache.get(timestamp);
    if (d !== undefined) return d;
    d = new Date(timestamp);
    if (this._dateCache.size >= this._dateCacheMax) {
      // Evict oldest (first inserted)
      this._dateCache["delete"](this._dateCache.keys().next().value);
    }
    this._dateCache.set(timestamp, d);
    return d;
  }
});

/***/ }

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
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
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
/*!**********************************!*\
  !*** ./src/helpers/script_ww.js ***!
  \**********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _script_engine_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./script_engine.js */ "./src/helpers/script_engine.js");
/* harmony import */ var _stuff_utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../stuff/utils.js */ "./src/stuff/utils.js");
/* harmony import */ var _script_utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./script_utils.js */ "./src/helpers/script_utils.js");
/* harmony import */ var _dataset_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./dataset.js */ "./src/helpers/dataset.js");

// Web-worker






let data_requested = false
const wwGlobal = typeof self !== 'undefined' ? self : globalThis

// DC => WW

wwGlobal.onmessage = async e => {
    //console.log('Worker got:', e.data.type)
    switch(e.data.type) {

        case 'update-dc-settings':

            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].sett = e.data.data

            break

        case 'exec-script':

            let req = _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].data_required(e.data.data.s)
            if (req && !data_requested) {
                data_requested = true
                wwGlobal.postMessage({
                    type: 'request-data', data: req
                })
            }
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].tf = _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.tf_from_str(e.data.data.tf)
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].range = e.data.data.range
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].queue.push(e.data.data.s)
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].exec_all()

            break

        case 'exec-all-scripts':

            let req2 = _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].data_required(e.data.data.s)
            if (req2 && !data_requested) {
                data_requested = true
                wwGlobal.postMessage({
                    type: 'request-data', data: req2
                })
            }

            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].tf = _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.tf_from_str(e.data.data.tf)
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].range = e.data.data.range
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].exec_all()

            break

        case 'upload-data':
            wwGlobal.postMessage({ type: 'data-uploaded' })

            await _stuff_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"].pause(1)

            for (let id in e.data.data) {
                let data = e.data.data[id]
                _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].data[id] = new _dataset_js__WEBPACK_IMPORTED_MODULE_3__.DatasetWW(id, data)
            }

            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].recalc_size()
            data_requested = false
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].exec_all()

            break

        case 'upload-module':

            let lib = _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.make_module_lib(e.data.data)
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].mods[e.data.data.id] = new (
                new Function(
                    'mod', 'se', 'lib',
                    _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.f_body(e.data.data.main)
                )
            )(e.data.data.id, _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"], lib)

            break

        case 'module-event':
            // TODO: this
            break

        case 'update-data':

            _dataset_js__WEBPACK_IMPORTED_MODULE_3__.DatasetWW.update_all(_script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"], e.data.data)

            if (e.data.data.ohlcv) {
                _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].update(e.data.data.ohlcv)
            }

            break

        case 'get-dataset':

            wwGlobal.postMessage({
                id: e.data.id,
                data: _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].data[e.data.data]
            })

            break

        case 'dataset-op':

            await _stuff_utils_js__WEBPACK_IMPORTED_MODULE_1__["default"].pause(1)

            if (e.data.data.id in _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].data) {
                _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].data[e.data.data.id].op(_script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"], e.data.data)
            }

            if (e.data.data.exec) _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].exec_all()

            break

        case 'update-ov-settings':

            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].tf = _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.tf_from_str(e.data.data.tf)
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].range = e.data.data.range
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].exec_sel(e.data.data.delta)

            break

        case 'send-meta-info':

            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].tf = _script_utils_js__WEBPACK_IMPORTED_MODULE_2__.tf_from_str(e.data.data.tf)
            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].range = e.data.data.range

            break

        case 'remove-scripts':

            _script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].remove_scripts(e.data.data)

            break
    }

}

// WW => DC

_script_engine_js__WEBPACK_IMPORTED_MODULE_0__["default"].send = (type, data) => {

    switch(type) {

        case 'overlay-data':
        case 'overlay-update':
        case 'engine-state':
        case 'modify-overlay':
        case 'module-data':
        case 'script-signal':

            wwGlobal.postMessage({type, data})

            break

    }

}

})();

/******/ })()
;
//# sourceMappingURL=script_ww.worker.js.map