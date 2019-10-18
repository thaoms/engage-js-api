'use strict';

var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger
var toInteger = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
var requireObjectCoercible = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = String(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

var stringMultibyte = {
  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var O = 'object';
var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global_1 =
  // eslint-disable-next-line no-undef
  check(typeof globalThis == O && globalThis) ||
  check(typeof window == O && window) ||
  check(typeof self == O && self) ||
  check(typeof commonjsGlobal == O && commonjsGlobal) ||
  // eslint-disable-next-line no-new-func
  Function('return this')();

var fails = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var descriptors = !fails(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

var isObject = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

var document = global_1.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

var documentCreateElement = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

// Thank's IE8 for his funny defineProperty
var ie8DomDefine = !descriptors && !fails(function () {
  return Object.defineProperty(documentCreateElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

var anObject = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

// `ToPrimitive` abstract operation
// https://tc39.github.io/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var toPrimitive = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

var nativeDefineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
var f = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (ie8DomDefine) try {
    return nativeDefineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var objectDefineProperty = {
	f: f
};

var createPropertyDescriptor = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var hide = descriptors ? function (object, key, value) {
  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var setGlobal = function (key, value) {
  try {
    hide(global_1, key, value);
  } catch (error) {
    global_1[key] = value;
  } return value;
};

var isPure = false;

var shared = createCommonjsModule(function (module) {
var SHARED = '__core-js_shared__';
var store = global_1[SHARED] || setGlobal(SHARED, {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.2.1',
  mode:  'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});
});

var functionToString = shared('native-function-to-string', Function.toString);

var WeakMap = global_1.WeakMap;

var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(functionToString.call(WeakMap));

var hasOwnProperty = {}.hasOwnProperty;

var has = function (it, key) {
  return hasOwnProperty.call(it, key);
};

var id = 0;
var postfix = Math.random();

var uid = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

var keys = shared('keys');

var sharedKey = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

var hiddenKeys = {};

var WeakMap$1 = global_1.WeakMap;
var set, get, has$1;

var enforce = function (it) {
  return has$1(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (nativeWeakMap) {
  var store = new WeakMap$1();
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;
  set = function (it, metadata) {
    wmset.call(store, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store, it) || {};
  };
  has$1 = function (it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    hide(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return has(it, STATE) ? it[STATE] : {};
  };
  has$1 = function (it) {
    return has(it, STATE);
  };
}

var internalState = {
  set: set,
  get: get,
  has: has$1,
  enforce: enforce,
  getterFor: getterFor
};

var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
var f$1 = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable;

var objectPropertyIsEnumerable = {
	f: f$1
};

var toString = {}.toString;

var classofRaw = function (it) {
  return toString.call(it).slice(8, -1);
};

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var indexedObject = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

// toObject with fallback for non-array-like ES3 strings



var toIndexedObject = function (it) {
  return indexedObject(requireObjectCoercible(it));
};

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
var f$2 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (ie8DomDefine) try {
    return nativeGetOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
};

var objectGetOwnPropertyDescriptor = {
	f: f$2
};

var redefine = createCommonjsModule(function (module) {
var getInternalState = internalState.get;
var enforceInternalState = internalState.enforce;
var TEMPLATE = String(functionToString).split('toString');

shared('inspectSource', function (it) {
  return functionToString.call(it);
});

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) hide(value, 'name', key);
    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
  }
  if (O === global_1) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else hide(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || functionToString.call(this);
});
});

var path = global_1;

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

var getBuiltIn = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
    : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
};

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength
var toLength = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

var max = Math.max;
var min$1 = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).
var toAbsoluteIndex = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
};

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod$1 = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var arrayIncludes = {
  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  includes: createMethod$1(true),
  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod$1(false)
};

var indexOf = arrayIncludes.indexOf;


var objectKeysInternal = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};

// IE8- don't enum bug keys
var enumBugKeys = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return objectKeysInternal(O, hiddenKeys$1);
};

var objectGetOwnPropertyNames = {
	f: f$3
};

var f$4 = Object.getOwnPropertySymbols;

var objectGetOwnPropertySymbols = {
	f: f$4
};

// all object keys, includes non-enumerable and symbols
var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = objectGetOwnPropertyNames.f(anObject(it));
  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

var copyConstructorProperties = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = objectDefineProperty.f;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

var isForced_1 = isForced;

var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
var _export = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global_1;
  } else if (STATIC) {
    target = global_1[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global_1[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor$1(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      hide(sourceProperty, 'sham', true);
    }
    // extend global
    redefine(target, key, sourceProperty, options);
  }
};

// `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject
var toObject = function (argument) {
  return Object(requireObjectCoercible(argument));
};

var correctPrototypeGetter = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

var IE_PROTO = sharedKey('IE_PROTO');
var ObjectPrototype = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.getprototypeof
var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectPrototype : null;
};

var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
  // Chrome 38 Symbol has incorrect toString conversion
  // eslint-disable-next-line no-undef
  return !String(Symbol());
});

var Symbol$1 = global_1.Symbol;
var store$1 = shared('wks');

var wellKnownSymbol = function (name) {
  return store$1[name] || (store$1[name] = nativeSymbol && Symbol$1[name]
    || (nativeSymbol ? Symbol$1 : uid)('Symbol.' + name));
};

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

var returnThis = function () { return this; };

// `%IteratorPrototype%` object
// https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

if (IteratorPrototype == undefined) IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
if ( !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);

var iteratorsCore = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
var objectKeys = Object.keys || function keys(O) {
  return objectKeysInternal(O, enumBugKeys);
};

// `Object.defineProperties` method
// https://tc39.github.io/ecma262/#sec-object.defineproperties
var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
  return O;
};

var html = getBuiltIn('document', 'documentElement');

var IE_PROTO$1 = sharedKey('IE_PROTO');

var PROTOTYPE = 'prototype';
var Empty = function () { /* empty */ };

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var length = enumBugKeys.length;
  var lt = '<';
  var script = 'script';
  var gt = '>';
  var js = 'java' + script + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  iframe.src = String(js);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + script + gt + 'document.F=Object' + lt + '/' + script + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (length--) delete createDict[PROTOTYPE][enumBugKeys[length]];
  return createDict();
};

// `Object.create` method
// https://tc39.github.io/ecma262/#sec-object.create
var objectCreate = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO$1] = O;
  } else result = createDict();
  return Properties === undefined ? result : objectDefineProperties(result, Properties);
};

hiddenKeys[IE_PROTO$1] = true;

var defineProperty = objectDefineProperty.f;



var TO_STRING_TAG = wellKnownSymbol('toStringTag');

var setToStringTag = function (it, TAG, STATIC) {
  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
    defineProperty(it, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};

var iterators = {};

var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;





var returnThis$1 = function () { return this; };

var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(1, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
  iterators[TO_STRING_TAG] = returnThis$1;
  return IteratorConstructor;
};

var aPossiblePrototype = function (it) {
  if (!isObject(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  } return it;
};

// `Object.setPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter.call(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);

var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR$1 = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis$2 = function () { return this; };

var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    } return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR$1]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {
      if ( objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2) {
        if (objectSetPrototypeOf) {
          objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2);
        } else if (typeof CurrentIteratorPrototype[ITERATOR$1] != 'function') {
          hide(CurrentIteratorPrototype, ITERATOR$1, returnThis$2);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
    }
  }

  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    INCORRECT_VALUES_NAME = true;
    defaultIterator = function values() { return nativeIterator.call(this); };
  }

  // define iterator
  if ( IterablePrototype[ITERATOR$1] !== defaultIterator) {
    hide(IterablePrototype, ITERATOR$1, defaultIterator);
  }
  iterators[NAME] = defaultIterator;

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        redefine(IterablePrototype, KEY, methods[KEY]);
      }
    } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
  }

  return methods;
};

var charAt = stringMultibyte.charAt;



var STRING_ITERATOR = 'String Iterator';
var setInternalState = internalState.set;
var getInternalState = internalState.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState(this, {
    type: STRING_ITERATOR,
    string: String(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return { value: undefined, done: true };
  point = charAt(string, index);
  state.index += point.length;
  return { value: point, done: false };
});

var ITERATOR$2 = wellKnownSymbol('iterator');

var nativeUrl = !fails(function () {
  var url = new URL('b?e=1', 'http://a');
  var searchParams = url.searchParams;
  url.pathname = 'c%20d';
  return (isPure && !url.toJSON)
    || !searchParams.sort
    || url.href !== 'http://a/c%20d?e=1'
    || searchParams.get('e') !== '1'
    || String(new URLSearchParams('?a=1')) !== 'a=1'
    || !searchParams[ITERATOR$2]
    // throws in Edge
    || new URL('https://a@b').username !== 'a'
    || new URLSearchParams(new URLSearchParams('a=b')).get('a') !== 'b'
    // not punycoded in Edge
    || new URL('http://тест').host !== 'xn--e1aybc'
    // not escaped in Chrome 62-
    || new URL('http://a#б').hash !== '#%D0%B1';
});

var anInstance = function (it, Constructor, name) {
  if (!(it instanceof Constructor)) {
    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
  } return it;
};

var nativeAssign = Object.assign;

// `Object.assign` method
// https://tc39.github.io/ecma262/#sec-object.assign
// should work with symbols and should have deterministic property order (V8 bug)
var objectAssign = !nativeAssign || fails(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var symbol = Symbol();
  var alphabet = 'abcdefghijklmnopqrst';
  A[symbol] = 7;
  alphabet.split('').forEach(function (chr) { B[chr] = chr; });
  return nativeAssign({}, A)[symbol] != 7 || objectKeys(nativeAssign({}, B)).join('') != alphabet;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var argumentsLength = arguments.length;
  var index = 1;
  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
  var propertyIsEnumerable = objectPropertyIsEnumerable.f;
  while (argumentsLength > index) {
    var S = indexedObject(arguments[index++]);
    var keys = getOwnPropertySymbols ? objectKeys(S).concat(getOwnPropertySymbols(S)) : objectKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) {
      key = keys[j++];
      if (!descriptors || propertyIsEnumerable.call(S, key)) T[key] = S[key];
    }
  } return T;
} : nativeAssign;

var aFunction$1 = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};

// optional / simple context binding
var bindContext = function (fn, that, length) {
  aFunction$1(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

// call something on iterator step with safe closing on error
var callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (error) {
    var returnMethod = iterator['return'];
    if (returnMethod !== undefined) anObject(returnMethod.call(iterator));
    throw error;
  }
};

var ITERATOR$3 = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
var isArrayIteratorMethod = function (it) {
  return it !== undefined && (iterators.Array === it || ArrayPrototype[ITERATOR$3] === it);
};

var createProperty = function (object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
  else object[propertyKey] = value;
};

var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
var classof = function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$1)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

var ITERATOR$4 = wellKnownSymbol('iterator');

var getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR$4]
    || it['@@iterator']
    || iterators[classof(it)];
};

// `Array.from` method implementation
// https://tc39.github.io/ecma262/#sec-array.from
var arrayFrom = function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
  var O = toObject(arrayLike);
  var C = typeof this == 'function' ? this : Array;
  var argumentsLength = arguments.length;
  var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
  var mapping = mapfn !== undefined;
  var index = 0;
  var iteratorMethod = getIteratorMethod(O);
  var length, result, step, iterator;
  if (mapping) mapfn = bindContext(mapfn, argumentsLength > 2 ? arguments[2] : undefined, 2);
  // if the target is not iterable or it's an array with the default iterator - use a simple case
  if (iteratorMethod != undefined && !(C == Array && isArrayIteratorMethod(iteratorMethod))) {
    iterator = iteratorMethod.call(O);
    result = new C();
    for (;!(step = iterator.next()).done; index++) {
      createProperty(result, index, mapping
        ? callWithSafeIterationClosing(iterator, mapfn, [step.value, index], true)
        : step.value
      );
    }
  } else {
    length = toLength(O.length);
    result = new C(length);
    for (;length > index; index++) {
      createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
    }
  }
  result.length = index;
  return result;
};

// based on https://github.com/bestiejs/punycode.js/blob/master/punycode.js
var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1
var base = 36;
var tMin = 1;
var tMax = 26;
var skew = 38;
var damp = 700;
var initialBias = 72;
var initialN = 128; // 0x80
var delimiter = '-'; // '\x2D'
var regexNonASCII = /[^\0-\u007E]/; // non-ASCII chars
var regexSeparators = /[.\u3002\uFF0E\uFF61]/g; // RFC 3490 separators
var OVERFLOW_ERROR = 'Overflow: input needs wider integers to process';
var baseMinusTMin = base - tMin;
var floor$1 = Math.floor;
var stringFromCharCode = String.fromCharCode;

/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 */
var ucs2decode = function (string) {
  var output = [];
  var counter = 0;
  var length = string.length;
  while (counter < length) {
    var value = string.charCodeAt(counter++);
    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
      // It's a high surrogate, and there is a next character.
      var extra = string.charCodeAt(counter++);
      if ((extra & 0xFC00) == 0xDC00) { // Low surrogate.
        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
      } else {
        // It's an unmatched surrogate; only append this code unit, in case the
        // next code unit is the high surrogate of a surrogate pair.
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
};

/**
 * Converts a digit/integer into a basic code point.
 */
var digitToBasic = function (digit) {
  //  0..25 map to ASCII a..z or A..Z
  // 26..35 map to ASCII 0..9
  return digit + 22 + 75 * (digit < 26);
};

/**
 * Bias adaptation function as per section 3.4 of RFC 3492.
 * https://tools.ietf.org/html/rfc3492#section-3.4
 */
var adapt = function (delta, numPoints, firstTime) {
  var k = 0;
  delta = firstTime ? floor$1(delta / damp) : delta >> 1;
  delta += floor$1(delta / numPoints);
  for (; delta > baseMinusTMin * tMax >> 1; k += base) {
    delta = floor$1(delta / baseMinusTMin);
  }
  return floor$1(k + (baseMinusTMin + 1) * delta / (delta + skew));
};

/**
 * Converts a string of Unicode symbols (e.g. a domain name label) to a
 * Punycode string of ASCII-only symbols.
 */
// eslint-disable-next-line  max-statements
var encode = function (input) {
  var output = [];

  // Convert the input in UCS-2 to an array of Unicode code points.
  input = ucs2decode(input);

  // Cache the length.
  var inputLength = input.length;

  // Initialize the state.
  var n = initialN;
  var delta = 0;
  var bias = initialBias;
  var i, currentValue;

  // Handle the basic code points.
  for (i = 0; i < input.length; i++) {
    currentValue = input[i];
    if (currentValue < 0x80) {
      output.push(stringFromCharCode(currentValue));
    }
  }

  var basicLength = output.length; // number of basic code points.
  var handledCPCount = basicLength; // number of code points that have been handled;

  // Finish the basic string with a delimiter unless it's empty.
  if (basicLength) {
    output.push(delimiter);
  }

  // Main encoding loop:
  while (handledCPCount < inputLength) {
    // All non-basic code points < n have been handled already. Find the next larger one:
    var m = maxInt;
    for (i = 0; i < input.length; i++) {
      currentValue = input[i];
      if (currentValue >= n && currentValue < m) {
        m = currentValue;
      }
    }

    // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>, but guard against overflow.
    var handledCPCountPlusOne = handledCPCount + 1;
    if (m - n > floor$1((maxInt - delta) / handledCPCountPlusOne)) {
      throw RangeError(OVERFLOW_ERROR);
    }

    delta += (m - n) * handledCPCountPlusOne;
    n = m;

    for (i = 0; i < input.length; i++) {
      currentValue = input[i];
      if (currentValue < n && ++delta > maxInt) {
        throw RangeError(OVERFLOW_ERROR);
      }
      if (currentValue == n) {
        // Represent delta as a generalized variable-length integer.
        var q = delta;
        for (var k = base; /* no condition */; k += base) {
          var t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
          if (q < t) break;
          var qMinusT = q - t;
          var baseMinusT = base - t;
          output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT)));
          q = floor$1(qMinusT / baseMinusT);
        }

        output.push(stringFromCharCode(digitToBasic(q)));
        bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
        delta = 0;
        ++handledCPCount;
      }
    }

    ++delta;
    ++n;
  }
  return output.join('');
};

var punycodeToAscii = function (input) {
  var encoded = [];
  var labels = input.toLowerCase().replace(regexSeparators, '\u002E').split('.');
  var i, label;
  for (i = 0; i < labels.length; i++) {
    label = labels[i];
    encoded.push(regexNonASCII.test(label) ? 'xn--' + encode(label) : label);
  }
  return encoded.join('.');
};

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype$1 = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype$1[UNSCOPABLES] == undefined) {
  hide(ArrayPrototype$1, UNSCOPABLES, objectCreate(null));
}

// add a key to Array.prototype[@@unscopables]
var addToUnscopables = function (key) {
  ArrayPrototype$1[UNSCOPABLES][key] = true;
};

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState$1 = internalState.set;
var getInternalState$1 = internalState.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.github.io/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.github.io/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.github.io/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.github.io/ecma262/#sec-createarrayiterator
var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState$1(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState$1(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return { value: undefined, done: true };
  }
  if (kind == 'keys') return { value: index, done: false };
  if (kind == 'values') return { value: target[index], done: false };
  return { value: [index, target[index]], done: false };
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
// https://tc39.github.io/ecma262/#sec-createmappedargumentsobject
iterators.Arguments = iterators.Array;

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

var redefineAll = function (target, src, options) {
  for (var key in src) redefine(target, key, src[key], options);
  return target;
};

var getIterator = function (it) {
  var iteratorMethod = getIteratorMethod(it);
  if (typeof iteratorMethod != 'function') {
    throw TypeError(String(it) + ' is not iterable');
  } return anObject(iteratorMethod.call(it));
};

// TODO: in core-js@4, move /modules/ dependencies to public entries for better optimization by tools like `preset-env`

















var ITERATOR$5 = wellKnownSymbol('iterator');
var URL_SEARCH_PARAMS = 'URLSearchParams';
var URL_SEARCH_PARAMS_ITERATOR = URL_SEARCH_PARAMS + 'Iterator';
var setInternalState$2 = internalState.set;
var getInternalParamsState = internalState.getterFor(URL_SEARCH_PARAMS);
var getInternalIteratorState = internalState.getterFor(URL_SEARCH_PARAMS_ITERATOR);

var plus = /\+/g;
var sequences = Array(4);

var percentSequence = function (bytes) {
  return sequences[bytes - 1] || (sequences[bytes - 1] = RegExp('((?:%[\\da-f]{2}){' + bytes + '})', 'gi'));
};

var percentDecode = function (sequence) {
  try {
    return decodeURIComponent(sequence);
  } catch (error) {
    return sequence;
  }
};

var deserialize = function (it) {
  var result = it.replace(plus, ' ');
  var bytes = 4;
  try {
    return decodeURIComponent(result);
  } catch (error) {
    while (bytes) {
      result = result.replace(percentSequence(bytes--), percentDecode);
    }
    return result;
  }
};

var find = /[!'()~]|%20/g;

var replace = {
  '!': '%21',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '~': '%7E',
  '%20': '+'
};

var replacer = function (match) {
  return replace[match];
};

var serialize = function (it) {
  return encodeURIComponent(it).replace(find, replacer);
};

var parseSearchParams = function (result, query) {
  if (query) {
    var attributes = query.split('&');
    var index = 0;
    var attribute, entry;
    while (index < attributes.length) {
      attribute = attributes[index++];
      if (attribute.length) {
        entry = attribute.split('=');
        result.push({
          key: deserialize(entry.shift()),
          value: deserialize(entry.join('='))
        });
      }
    }
  }
};

var updateSearchParams = function (query) {
  this.entries.length = 0;
  parseSearchParams(this.entries, query);
};

var validateArgumentsLength = function (passed, required) {
  if (passed < required) throw TypeError('Not enough arguments');
};

var URLSearchParamsIterator = createIteratorConstructor(function Iterator(params, kind) {
  setInternalState$2(this, {
    type: URL_SEARCH_PARAMS_ITERATOR,
    iterator: getIterator(getInternalParamsState(params).entries),
    kind: kind
  });
}, 'Iterator', function next() {
  var state = getInternalIteratorState(this);
  var kind = state.kind;
  var step = state.iterator.next();
  var entry = step.value;
  if (!step.done) {
    step.value = kind === 'keys' ? entry.key : kind === 'values' ? entry.value : [entry.key, entry.value];
  } return step;
});

// `URLSearchParams` constructor
// https://url.spec.whatwg.org/#interface-urlsearchparams
var URLSearchParamsConstructor = function URLSearchParams(/* init */) {
  anInstance(this, URLSearchParamsConstructor, URL_SEARCH_PARAMS);
  var init = arguments.length > 0 ? arguments[0] : undefined;
  var that = this;
  var entries = [];
  var iteratorMethod, iterator, step, entryIterator, first, second, key;

  setInternalState$2(that, {
    type: URL_SEARCH_PARAMS,
    entries: entries,
    updateURL: function () { /* empty */ },
    updateSearchParams: updateSearchParams
  });

  if (init !== undefined) {
    if (isObject(init)) {
      iteratorMethod = getIteratorMethod(init);
      if (typeof iteratorMethod === 'function') {
        iterator = iteratorMethod.call(init);
        while (!(step = iterator.next()).done) {
          entryIterator = getIterator(anObject(step.value));
          if (
            (first = entryIterator.next()).done ||
            (second = entryIterator.next()).done ||
            !entryIterator.next().done
          ) throw TypeError('Expected sequence with length 2');
          entries.push({ key: first.value + '', value: second.value + '' });
        }
      } else for (key in init) if (has(init, key)) entries.push({ key: key, value: init[key] + '' });
    } else {
      parseSearchParams(entries, typeof init === 'string' ? init.charAt(0) === '?' ? init.slice(1) : init : init + '');
    }
  }
};

var URLSearchParamsPrototype = URLSearchParamsConstructor.prototype;

redefineAll(URLSearchParamsPrototype, {
  // `URLSearchParams.prototype.appent` method
  // https://url.spec.whatwg.org/#dom-urlsearchparams-append
  append: function append(name, value) {
    validateArgumentsLength(arguments.length, 2);
    var state = getInternalParamsState(this);
    state.entries.push({ key: name + '', value: value + '' });
    state.updateURL();
  },
  // `URLSearchParams.prototype.delete` method
  // https://url.spec.whatwg.org/#dom-urlsearchparams-delete
  'delete': function (name) {
    validateArgumentsLength(arguments.length, 1);
    var state = getInternalParamsState(this);
    var entries = state.entries;
    var key = name + '';
    var index = 0;
    while (index < entries.length) {
      if (entries[index].key === key) entries.splice(index, 1);
      else index++;
    }
    state.updateURL();
  },
  // `URLSearchParams.prototype.get` method
  // https://url.spec.whatwg.org/#dom-urlsearchparams-get
  get: function get(name) {
    validateArgumentsLength(arguments.length, 1);
    var entries = getInternalParamsState(this).entries;
    var key = name + '';
    var index = 0;
    for (; index < entries.length; index++) {
      if (entries[index].key === key) return entries[index].value;
    }
    return null;
  },
  // `URLSearchParams.prototype.getAll` method
  // https://url.spec.whatwg.org/#dom-urlsearchparams-getall
  getAll: function getAll(name) {
    validateArgumentsLength(arguments.length, 1);
    var entries = getInternalParamsState(this).entries;
    var key = name + '';
    var result = [];
    var index = 0;
    for (; index < entries.length; index++) {
      if (entries[index].key === key) result.push(entries[index].value);
    }
    return result;
  },
  // `URLSearchParams.prototype.has` method
  // https://url.spec.whatwg.org/#dom-urlsearchparams-has
  has: function has(name) {
    validateArgumentsLength(arguments.length, 1);
    var entries = getInternalParamsState(this).entries;
    var key = name + '';
    var index = 0;
    while (index < entries.length) {
      if (entries[index++].key === key) return true;
    }
    return false;
  },
  // `URLSearchParams.prototype.set` method
  // https://url.spec.whatwg.org/#dom-urlsearchparams-set
  set: function set(name, value) {
    validateArgumentsLength(arguments.length, 1);
    var state = getInternalParamsState(this);
    var entries = state.entries;
    var found = false;
    var key = name + '';
    var val = value + '';
    var index = 0;
    var entry;
    for (; index < entries.length; index++) {
      entry = entries[index];
      if (entry.key === key) {
        if (found) entries.splice(index--, 1);
        else {
          found = true;
          entry.value = val;
        }
      }
    }
    if (!found) entries.push({ key: key, value: val });
    state.updateURL();
  },
  // `URLSearchParams.prototype.sort` method
  // https://url.spec.whatwg.org/#dom-urlsearchparams-sort
  sort: function sort() {
    var state = getInternalParamsState(this);
    var entries = state.entries;
    // Array#sort is not stable in some engines
    var slice = entries.slice();
    var entry, entriesIndex, sliceIndex;
    entries.length = 0;
    for (sliceIndex = 0; sliceIndex < slice.length; sliceIndex++) {
      entry = slice[sliceIndex];
      for (entriesIndex = 0; entriesIndex < sliceIndex; entriesIndex++) {
        if (entries[entriesIndex].key > entry.key) {
          entries.splice(entriesIndex, 0, entry);
          break;
        }
      }
      if (entriesIndex === sliceIndex) entries.push(entry);
    }
    state.updateURL();
  },
  // `URLSearchParams.prototype.forEach` method
  forEach: function forEach(callback /* , thisArg */) {
    var entries = getInternalParamsState(this).entries;
    var boundFunction = bindContext(callback, arguments.length > 1 ? arguments[1] : undefined, 3);
    var index = 0;
    var entry;
    while (index < entries.length) {
      entry = entries[index++];
      boundFunction(entry.value, entry.key, this);
    }
  },
  // `URLSearchParams.prototype.keys` method
  keys: function keys() {
    return new URLSearchParamsIterator(this, 'keys');
  },
  // `URLSearchParams.prototype.values` method
  values: function values() {
    return new URLSearchParamsIterator(this, 'values');
  },
  // `URLSearchParams.prototype.entries` method
  entries: function entries() {
    return new URLSearchParamsIterator(this, 'entries');
  }
}, { enumerable: true });

// `URLSearchParams.prototype[@@iterator]` method
redefine(URLSearchParamsPrototype, ITERATOR$5, URLSearchParamsPrototype.entries);

// `URLSearchParams.prototype.toString` method
// https://url.spec.whatwg.org/#urlsearchparams-stringification-behavior
redefine(URLSearchParamsPrototype, 'toString', function toString() {
  var entries = getInternalParamsState(this).entries;
  var result = [];
  var index = 0;
  var entry;
  while (index < entries.length) {
    entry = entries[index++];
    result.push(serialize(entry.key) + '=' + serialize(entry.value));
  } return result.join('&');
}, { enumerable: true });

setToStringTag(URLSearchParamsConstructor, URL_SEARCH_PARAMS);

_export({ global: true, forced: !nativeUrl }, {
  URLSearchParams: URLSearchParamsConstructor
});

var web_urlSearchParams = {
  URLSearchParams: URLSearchParamsConstructor,
  getState: getInternalParamsState
};

// TODO: in core-js@4, move /modules/ dependencies to public entries for better optimization by tools like `preset-env`











var codeAt = stringMultibyte.codeAt;





var NativeURL = global_1.URL;
var URLSearchParams$1 = web_urlSearchParams.URLSearchParams;
var getInternalSearchParamsState = web_urlSearchParams.getState;
var setInternalState$3 = internalState.set;
var getInternalURLState = internalState.getterFor('URL');
var floor$2 = Math.floor;
var pow = Math.pow;

var INVALID_AUTHORITY = 'Invalid authority';
var INVALID_SCHEME = 'Invalid scheme';
var INVALID_HOST = 'Invalid host';
var INVALID_PORT = 'Invalid port';

var ALPHA = /[A-Za-z]/;
var ALPHANUMERIC = /[\d+\-.A-Za-z]/;
var DIGIT = /\d/;
var HEX_START = /^(0x|0X)/;
var OCT = /^[0-7]+$/;
var DEC = /^\d+$/;
var HEX = /^[\dA-Fa-f]+$/;
// eslint-disable-next-line no-control-regex
var FORBIDDEN_HOST_CODE_POINT = /[\u0000\u0009\u000A\u000D #%/:?@[\\]]/;
// eslint-disable-next-line no-control-regex
var FORBIDDEN_HOST_CODE_POINT_EXCLUDING_PERCENT = /[\u0000\u0009\u000A\u000D #/:?@[\\]]/;
// eslint-disable-next-line no-control-regex
var LEADING_AND_TRAILING_C0_CONTROL_OR_SPACE = /^[\u0000-\u001F ]+|[\u0000-\u001F ]+$/g;
// eslint-disable-next-line no-control-regex
var TAB_AND_NEW_LINE = /[\u0009\u000A\u000D]/g;
var EOF;

var parseHost = function (url, input) {
  var result, codePoints, index;
  if (input.charAt(0) == '[') {
    if (input.charAt(input.length - 1) != ']') return INVALID_HOST;
    result = parseIPv6(input.slice(1, -1));
    if (!result) return INVALID_HOST;
    url.host = result;
  // opaque host
  } else if (!isSpecial(url)) {
    if (FORBIDDEN_HOST_CODE_POINT_EXCLUDING_PERCENT.test(input)) return INVALID_HOST;
    result = '';
    codePoints = arrayFrom(input);
    for (index = 0; index < codePoints.length; index++) {
      result += percentEncode(codePoints[index], C0ControlPercentEncodeSet);
    }
    url.host = result;
  } else {
    input = punycodeToAscii(input);
    if (FORBIDDEN_HOST_CODE_POINT.test(input)) return INVALID_HOST;
    result = parseIPv4(input);
    if (result === null) return INVALID_HOST;
    url.host = result;
  }
};

var parseIPv4 = function (input) {
  var parts = input.split('.');
  var partsLength, numbers, index, part, radix, number, ipv4;
  if (parts.length && parts[parts.length - 1] == '') {
    parts.pop();
  }
  partsLength = parts.length;
  if (partsLength > 4) return input;
  numbers = [];
  for (index = 0; index < partsLength; index++) {
    part = parts[index];
    if (part == '') return input;
    radix = 10;
    if (part.length > 1 && part.charAt(0) == '0') {
      radix = HEX_START.test(part) ? 16 : 8;
      part = part.slice(radix == 8 ? 1 : 2);
    }
    if (part === '') {
      number = 0;
    } else {
      if (!(radix == 10 ? DEC : radix == 8 ? OCT : HEX).test(part)) return input;
      number = parseInt(part, radix);
    }
    numbers.push(number);
  }
  for (index = 0; index < partsLength; index++) {
    number = numbers[index];
    if (index == partsLength - 1) {
      if (number >= pow(256, 5 - partsLength)) return null;
    } else if (number > 255) return null;
  }
  ipv4 = numbers.pop();
  for (index = 0; index < numbers.length; index++) {
    ipv4 += numbers[index] * pow(256, 3 - index);
  }
  return ipv4;
};

// eslint-disable-next-line max-statements
var parseIPv6 = function (input) {
  var address = [0, 0, 0, 0, 0, 0, 0, 0];
  var pieceIndex = 0;
  var compress = null;
  var pointer = 0;
  var value, length, numbersSeen, ipv4Piece, number, swaps, swap;

  var char = function () {
    return input.charAt(pointer);
  };

  if (char() == ':') {
    if (input.charAt(1) != ':') return;
    pointer += 2;
    pieceIndex++;
    compress = pieceIndex;
  }
  while (char()) {
    if (pieceIndex == 8) return;
    if (char() == ':') {
      if (compress !== null) return;
      pointer++;
      pieceIndex++;
      compress = pieceIndex;
      continue;
    }
    value = length = 0;
    while (length < 4 && HEX.test(char())) {
      value = value * 16 + parseInt(char(), 16);
      pointer++;
      length++;
    }
    if (char() == '.') {
      if (length == 0) return;
      pointer -= length;
      if (pieceIndex > 6) return;
      numbersSeen = 0;
      while (char()) {
        ipv4Piece = null;
        if (numbersSeen > 0) {
          if (char() == '.' && numbersSeen < 4) pointer++;
          else return;
        }
        if (!DIGIT.test(char())) return;
        while (DIGIT.test(char())) {
          number = parseInt(char(), 10);
          if (ipv4Piece === null) ipv4Piece = number;
          else if (ipv4Piece == 0) return;
          else ipv4Piece = ipv4Piece * 10 + number;
          if (ipv4Piece > 255) return;
          pointer++;
        }
        address[pieceIndex] = address[pieceIndex] * 256 + ipv4Piece;
        numbersSeen++;
        if (numbersSeen == 2 || numbersSeen == 4) pieceIndex++;
      }
      if (numbersSeen != 4) return;
      break;
    } else if (char() == ':') {
      pointer++;
      if (!char()) return;
    } else if (char()) return;
    address[pieceIndex++] = value;
  }
  if (compress !== null) {
    swaps = pieceIndex - compress;
    pieceIndex = 7;
    while (pieceIndex != 0 && swaps > 0) {
      swap = address[pieceIndex];
      address[pieceIndex--] = address[compress + swaps - 1];
      address[compress + --swaps] = swap;
    }
  } else if (pieceIndex != 8) return;
  return address;
};

var findLongestZeroSequence = function (ipv6) {
  var maxIndex = null;
  var maxLength = 1;
  var currStart = null;
  var currLength = 0;
  var index = 0;
  for (; index < 8; index++) {
    if (ipv6[index] !== 0) {
      if (currLength > maxLength) {
        maxIndex = currStart;
        maxLength = currLength;
      }
      currStart = null;
      currLength = 0;
    } else {
      if (currStart === null) currStart = index;
      ++currLength;
    }
  }
  if (currLength > maxLength) {
    maxIndex = currStart;
    maxLength = currLength;
  }
  return maxIndex;
};

var serializeHost = function (host) {
  var result, index, compress, ignore0;
  // ipv4
  if (typeof host == 'number') {
    result = [];
    for (index = 0; index < 4; index++) {
      result.unshift(host % 256);
      host = floor$2(host / 256);
    } return result.join('.');
  // ipv6
  } else if (typeof host == 'object') {
    result = '';
    compress = findLongestZeroSequence(host);
    for (index = 0; index < 8; index++) {
      if (ignore0 && host[index] === 0) continue;
      if (ignore0) ignore0 = false;
      if (compress === index) {
        result += index ? ':' : '::';
        ignore0 = true;
      } else {
        result += host[index].toString(16);
        if (index < 7) result += ':';
      }
    }
    return '[' + result + ']';
  } return host;
};

var C0ControlPercentEncodeSet = {};
var fragmentPercentEncodeSet = objectAssign({}, C0ControlPercentEncodeSet, {
  ' ': 1, '"': 1, '<': 1, '>': 1, '`': 1
});
var pathPercentEncodeSet = objectAssign({}, fragmentPercentEncodeSet, {
  '#': 1, '?': 1, '{': 1, '}': 1
});
var userinfoPercentEncodeSet = objectAssign({}, pathPercentEncodeSet, {
  '/': 1, ':': 1, ';': 1, '=': 1, '@': 1, '[': 1, '\\': 1, ']': 1, '^': 1, '|': 1
});

var percentEncode = function (char, set) {
  var code = codeAt(char, 0);
  return code > 0x20 && code < 0x7F && !has(set, char) ? char : encodeURIComponent(char);
};

var specialSchemes = {
  ftp: 21,
  file: null,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443
};

var isSpecial = function (url) {
  return has(specialSchemes, url.scheme);
};

var includesCredentials = function (url) {
  return url.username != '' || url.password != '';
};

var cannotHaveUsernamePasswordPort = function (url) {
  return !url.host || url.cannotBeABaseURL || url.scheme == 'file';
};

var isWindowsDriveLetter = function (string, normalized) {
  var second;
  return string.length == 2 && ALPHA.test(string.charAt(0))
    && ((second = string.charAt(1)) == ':' || (!normalized && second == '|'));
};

var startsWithWindowsDriveLetter = function (string) {
  var third;
  return string.length > 1 && isWindowsDriveLetter(string.slice(0, 2)) && (
    string.length == 2 ||
    ((third = string.charAt(2)) === '/' || third === '\\' || third === '?' || third === '#')
  );
};

var shortenURLsPath = function (url) {
  var path = url.path;
  var pathSize = path.length;
  if (pathSize && (url.scheme != 'file' || pathSize != 1 || !isWindowsDriveLetter(path[0], true))) {
    path.pop();
  }
};

var isSingleDot = function (segment) {
  return segment === '.' || segment.toLowerCase() === '%2e';
};

var isDoubleDot = function (segment) {
  segment = segment.toLowerCase();
  return segment === '..' || segment === '%2e.' || segment === '.%2e' || segment === '%2e%2e';
};

// States:
var SCHEME_START = {};
var SCHEME = {};
var NO_SCHEME = {};
var SPECIAL_RELATIVE_OR_AUTHORITY = {};
var PATH_OR_AUTHORITY = {};
var RELATIVE = {};
var RELATIVE_SLASH = {};
var SPECIAL_AUTHORITY_SLASHES = {};
var SPECIAL_AUTHORITY_IGNORE_SLASHES = {};
var AUTHORITY = {};
var HOST = {};
var HOSTNAME = {};
var PORT = {};
var FILE = {};
var FILE_SLASH = {};
var FILE_HOST = {};
var PATH_START = {};
var PATH = {};
var CANNOT_BE_A_BASE_URL_PATH = {};
var QUERY = {};
var FRAGMENT = {};

// eslint-disable-next-line max-statements
var parseURL = function (url, input, stateOverride, base) {
  var state = stateOverride || SCHEME_START;
  var pointer = 0;
  var buffer = '';
  var seenAt = false;
  var seenBracket = false;
  var seenPasswordToken = false;
  var codePoints, char, bufferCodePoints, failure;

  if (!stateOverride) {
    url.scheme = '';
    url.username = '';
    url.password = '';
    url.host = null;
    url.port = null;
    url.path = [];
    url.query = null;
    url.fragment = null;
    url.cannotBeABaseURL = false;
    input = input.replace(LEADING_AND_TRAILING_C0_CONTROL_OR_SPACE, '');
  }

  input = input.replace(TAB_AND_NEW_LINE, '');

  codePoints = arrayFrom(input);

  while (pointer <= codePoints.length) {
    char = codePoints[pointer];
    switch (state) {
      case SCHEME_START:
        if (char && ALPHA.test(char)) {
          buffer += char.toLowerCase();
          state = SCHEME;
        } else if (!stateOverride) {
          state = NO_SCHEME;
          continue;
        } else return INVALID_SCHEME;
        break;

      case SCHEME:
        if (char && (ALPHANUMERIC.test(char) || char == '+' || char == '-' || char == '.')) {
          buffer += char.toLowerCase();
        } else if (char == ':') {
          if (stateOverride && (
            (isSpecial(url) != has(specialSchemes, buffer)) ||
            (buffer == 'file' && (includesCredentials(url) || url.port !== null)) ||
            (url.scheme == 'file' && !url.host)
          )) return;
          url.scheme = buffer;
          if (stateOverride) {
            if (isSpecial(url) && specialSchemes[url.scheme] == url.port) url.port = null;
            return;
          }
          buffer = '';
          if (url.scheme == 'file') {
            state = FILE;
          } else if (isSpecial(url) && base && base.scheme == url.scheme) {
            state = SPECIAL_RELATIVE_OR_AUTHORITY;
          } else if (isSpecial(url)) {
            state = SPECIAL_AUTHORITY_SLASHES;
          } else if (codePoints[pointer + 1] == '/') {
            state = PATH_OR_AUTHORITY;
            pointer++;
          } else {
            url.cannotBeABaseURL = true;
            url.path.push('');
            state = CANNOT_BE_A_BASE_URL_PATH;
          }
        } else if (!stateOverride) {
          buffer = '';
          state = NO_SCHEME;
          pointer = 0;
          continue;
        } else return INVALID_SCHEME;
        break;

      case NO_SCHEME:
        if (!base || (base.cannotBeABaseURL && char != '#')) return INVALID_SCHEME;
        if (base.cannotBeABaseURL && char == '#') {
          url.scheme = base.scheme;
          url.path = base.path.slice();
          url.query = base.query;
          url.fragment = '';
          url.cannotBeABaseURL = true;
          state = FRAGMENT;
          break;
        }
        state = base.scheme == 'file' ? FILE : RELATIVE;
        continue;

      case SPECIAL_RELATIVE_OR_AUTHORITY:
        if (char == '/' && codePoints[pointer + 1] == '/') {
          state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
          pointer++;
        } else {
          state = RELATIVE;
          continue;
        } break;

      case PATH_OR_AUTHORITY:
        if (char == '/') {
          state = AUTHORITY;
          break;
        } else {
          state = PATH;
          continue;
        }

      case RELATIVE:
        url.scheme = base.scheme;
        if (char == EOF) {
          url.username = base.username;
          url.password = base.password;
          url.host = base.host;
          url.port = base.port;
          url.path = base.path.slice();
          url.query = base.query;
        } else if (char == '/' || (char == '\\' && isSpecial(url))) {
          state = RELATIVE_SLASH;
        } else if (char == '?') {
          url.username = base.username;
          url.password = base.password;
          url.host = base.host;
          url.port = base.port;
          url.path = base.path.slice();
          url.query = '';
          state = QUERY;
        } else if (char == '#') {
          url.username = base.username;
          url.password = base.password;
          url.host = base.host;
          url.port = base.port;
          url.path = base.path.slice();
          url.query = base.query;
          url.fragment = '';
          state = FRAGMENT;
        } else {
          url.username = base.username;
          url.password = base.password;
          url.host = base.host;
          url.port = base.port;
          url.path = base.path.slice();
          url.path.pop();
          state = PATH;
          continue;
        } break;

      case RELATIVE_SLASH:
        if (isSpecial(url) && (char == '/' || char == '\\')) {
          state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
        } else if (char == '/') {
          state = AUTHORITY;
        } else {
          url.username = base.username;
          url.password = base.password;
          url.host = base.host;
          url.port = base.port;
          state = PATH;
          continue;
        } break;

      case SPECIAL_AUTHORITY_SLASHES:
        state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
        if (char != '/' || buffer.charAt(pointer + 1) != '/') continue;
        pointer++;
        break;

      case SPECIAL_AUTHORITY_IGNORE_SLASHES:
        if (char != '/' && char != '\\') {
          state = AUTHORITY;
          continue;
        } break;

      case AUTHORITY:
        if (char == '@') {
          if (seenAt) buffer = '%40' + buffer;
          seenAt = true;
          bufferCodePoints = arrayFrom(buffer);
          for (var i = 0; i < bufferCodePoints.length; i++) {
            var codePoint = bufferCodePoints[i];
            if (codePoint == ':' && !seenPasswordToken) {
              seenPasswordToken = true;
              continue;
            }
            var encodedCodePoints = percentEncode(codePoint, userinfoPercentEncodeSet);
            if (seenPasswordToken) url.password += encodedCodePoints;
            else url.username += encodedCodePoints;
          }
          buffer = '';
        } else if (
          char == EOF || char == '/' || char == '?' || char == '#' ||
          (char == '\\' && isSpecial(url))
        ) {
          if (seenAt && buffer == '') return INVALID_AUTHORITY;
          pointer -= arrayFrom(buffer).length + 1;
          buffer = '';
          state = HOST;
        } else buffer += char;
        break;

      case HOST:
      case HOSTNAME:
        if (stateOverride && url.scheme == 'file') {
          state = FILE_HOST;
          continue;
        } else if (char == ':' && !seenBracket) {
          if (buffer == '') return INVALID_HOST;
          failure = parseHost(url, buffer);
          if (failure) return failure;
          buffer = '';
          state = PORT;
          if (stateOverride == HOSTNAME) return;
        } else if (
          char == EOF || char == '/' || char == '?' || char == '#' ||
          (char == '\\' && isSpecial(url))
        ) {
          if (isSpecial(url) && buffer == '') return INVALID_HOST;
          if (stateOverride && buffer == '' && (includesCredentials(url) || url.port !== null)) return;
          failure = parseHost(url, buffer);
          if (failure) return failure;
          buffer = '';
          state = PATH_START;
          if (stateOverride) return;
          continue;
        } else {
          if (char == '[') seenBracket = true;
          else if (char == ']') seenBracket = false;
          buffer += char;
        } break;

      case PORT:
        if (DIGIT.test(char)) {
          buffer += char;
        } else if (
          char == EOF || char == '/' || char == '?' || char == '#' ||
          (char == '\\' && isSpecial(url)) ||
          stateOverride
        ) {
          if (buffer != '') {
            var port = parseInt(buffer, 10);
            if (port > 0xFFFF) return INVALID_PORT;
            url.port = (isSpecial(url) && port === specialSchemes[url.scheme]) ? null : port;
            buffer = '';
          }
          if (stateOverride) return;
          state = PATH_START;
          continue;
        } else return INVALID_PORT;
        break;

      case FILE:
        url.scheme = 'file';
        if (char == '/' || char == '\\') state = FILE_SLASH;
        else if (base && base.scheme == 'file') {
          if (char == EOF) {
            url.host = base.host;
            url.path = base.path.slice();
            url.query = base.query;
          } else if (char == '?') {
            url.host = base.host;
            url.path = base.path.slice();
            url.query = '';
            state = QUERY;
          } else if (char == '#') {
            url.host = base.host;
            url.path = base.path.slice();
            url.query = base.query;
            url.fragment = '';
            state = FRAGMENT;
          } else {
            if (!startsWithWindowsDriveLetter(codePoints.slice(pointer).join(''))) {
              url.host = base.host;
              url.path = base.path.slice();
              shortenURLsPath(url);
            }
            state = PATH;
            continue;
          }
        } else {
          state = PATH;
          continue;
        } break;

      case FILE_SLASH:
        if (char == '/' || char == '\\') {
          state = FILE_HOST;
          break;
        }
        if (base && base.scheme == 'file' && !startsWithWindowsDriveLetter(codePoints.slice(pointer).join(''))) {
          if (isWindowsDriveLetter(base.path[0], true)) url.path.push(base.path[0]);
          else url.host = base.host;
        }
        state = PATH;
        continue;

      case FILE_HOST:
        if (char == EOF || char == '/' || char == '\\' || char == '?' || char == '#') {
          if (!stateOverride && isWindowsDriveLetter(buffer)) {
            state = PATH;
          } else if (buffer == '') {
            url.host = '';
            if (stateOverride) return;
            state = PATH_START;
          } else {
            failure = parseHost(url, buffer);
            if (failure) return failure;
            if (url.host == 'localhost') url.host = '';
            if (stateOverride) return;
            buffer = '';
            state = PATH_START;
          } continue;
        } else buffer += char;
        break;

      case PATH_START:
        if (isSpecial(url)) {
          state = PATH;
          if (char != '/' && char != '\\') continue;
        } else if (!stateOverride && char == '?') {
          url.query = '';
          state = QUERY;
        } else if (!stateOverride && char == '#') {
          url.fragment = '';
          state = FRAGMENT;
        } else if (char != EOF) {
          state = PATH;
          if (char != '/') continue;
        } break;

      case PATH:
        if (
          char == EOF || char == '/' ||
          (char == '\\' && isSpecial(url)) ||
          (!stateOverride && (char == '?' || char == '#'))
        ) {
          if (isDoubleDot(buffer)) {
            shortenURLsPath(url);
            if (char != '/' && !(char == '\\' && isSpecial(url))) {
              url.path.push('');
            }
          } else if (isSingleDot(buffer)) {
            if (char != '/' && !(char == '\\' && isSpecial(url))) {
              url.path.push('');
            }
          } else {
            if (url.scheme == 'file' && !url.path.length && isWindowsDriveLetter(buffer)) {
              if (url.host) url.host = '';
              buffer = buffer.charAt(0) + ':'; // normalize windows drive letter
            }
            url.path.push(buffer);
          }
          buffer = '';
          if (url.scheme == 'file' && (char == EOF || char == '?' || char == '#')) {
            while (url.path.length > 1 && url.path[0] === '') {
              url.path.shift();
            }
          }
          if (char == '?') {
            url.query = '';
            state = QUERY;
          } else if (char == '#') {
            url.fragment = '';
            state = FRAGMENT;
          }
        } else {
          buffer += percentEncode(char, pathPercentEncodeSet);
        } break;

      case CANNOT_BE_A_BASE_URL_PATH:
        if (char == '?') {
          url.query = '';
          state = QUERY;
        } else if (char == '#') {
          url.fragment = '';
          state = FRAGMENT;
        } else if (char != EOF) {
          url.path[0] += percentEncode(char, C0ControlPercentEncodeSet);
        } break;

      case QUERY:
        if (!stateOverride && char == '#') {
          url.fragment = '';
          state = FRAGMENT;
        } else if (char != EOF) {
          if (char == "'" && isSpecial(url)) url.query += '%27';
          else if (char == '#') url.query += '%23';
          else url.query += percentEncode(char, C0ControlPercentEncodeSet);
        } break;

      case FRAGMENT:
        if (char != EOF) url.fragment += percentEncode(char, fragmentPercentEncodeSet);
        break;
    }

    pointer++;
  }
};

// `URL` constructor
// https://url.spec.whatwg.org/#url-class
var URLConstructor = function URL(url /* , base */) {
  var that = anInstance(this, URLConstructor, 'URL');
  var base = arguments.length > 1 ? arguments[1] : undefined;
  var urlString = String(url);
  var state = setInternalState$3(that, { type: 'URL' });
  var baseState, failure;
  if (base !== undefined) {
    if (base instanceof URLConstructor) baseState = getInternalURLState(base);
    else {
      failure = parseURL(baseState = {}, String(base));
      if (failure) throw TypeError(failure);
    }
  }
  failure = parseURL(state, urlString, null, baseState);
  if (failure) throw TypeError(failure);
  var searchParams = state.searchParams = new URLSearchParams$1();
  var searchParamsState = getInternalSearchParamsState(searchParams);
  searchParamsState.updateSearchParams(state.query);
  searchParamsState.updateURL = function () {
    state.query = String(searchParams) || null;
  };
  if (!descriptors) {
    that.href = serializeURL.call(that);
    that.origin = getOrigin.call(that);
    that.protocol = getProtocol.call(that);
    that.username = getUsername.call(that);
    that.password = getPassword.call(that);
    that.host = getHost.call(that);
    that.hostname = getHostname.call(that);
    that.port = getPort.call(that);
    that.pathname = getPathname.call(that);
    that.search = getSearch.call(that);
    that.searchParams = getSearchParams.call(that);
    that.hash = getHash.call(that);
  }
};

var URLPrototype = URLConstructor.prototype;

var serializeURL = function () {
  var url = getInternalURLState(this);
  var scheme = url.scheme;
  var username = url.username;
  var password = url.password;
  var host = url.host;
  var port = url.port;
  var path = url.path;
  var query = url.query;
  var fragment = url.fragment;
  var output = scheme + ':';
  if (host !== null) {
    output += '//';
    if (includesCredentials(url)) {
      output += username + (password ? ':' + password : '') + '@';
    }
    output += serializeHost(host);
    if (port !== null) output += ':' + port;
  } else if (scheme == 'file') output += '//';
  output += url.cannotBeABaseURL ? path[0] : path.length ? '/' + path.join('/') : '';
  if (query !== null) output += '?' + query;
  if (fragment !== null) output += '#' + fragment;
  return output;
};

var getOrigin = function () {
  var url = getInternalURLState(this);
  var scheme = url.scheme;
  var port = url.port;
  if (scheme == 'blob') try {
    return new URL(scheme.path[0]).origin;
  } catch (error) {
    return 'null';
  }
  if (scheme == 'file' || !isSpecial(url)) return 'null';
  return scheme + '://' + serializeHost(url.host) + (port !== null ? ':' + port : '');
};

var getProtocol = function () {
  return getInternalURLState(this).scheme + ':';
};

var getUsername = function () {
  return getInternalURLState(this).username;
};

var getPassword = function () {
  return getInternalURLState(this).password;
};

var getHost = function () {
  var url = getInternalURLState(this);
  var host = url.host;
  var port = url.port;
  return host === null ? ''
    : port === null ? serializeHost(host)
    : serializeHost(host) + ':' + port;
};

var getHostname = function () {
  var host = getInternalURLState(this).host;
  return host === null ? '' : serializeHost(host);
};

var getPort = function () {
  var port = getInternalURLState(this).port;
  return port === null ? '' : String(port);
};

var getPathname = function () {
  var url = getInternalURLState(this);
  var path = url.path;
  return url.cannotBeABaseURL ? path[0] : path.length ? '/' + path.join('/') : '';
};

var getSearch = function () {
  var query = getInternalURLState(this).query;
  return query ? '?' + query : '';
};

var getSearchParams = function () {
  return getInternalURLState(this).searchParams;
};

var getHash = function () {
  var fragment = getInternalURLState(this).fragment;
  return fragment ? '#' + fragment : '';
};

var accessorDescriptor = function (getter, setter) {
  return { get: getter, set: setter, configurable: true, enumerable: true };
};

if (descriptors) {
  objectDefineProperties(URLPrototype, {
    // `URL.prototype.href` accessors pair
    // https://url.spec.whatwg.org/#dom-url-href
    href: accessorDescriptor(serializeURL, function (href) {
      var url = getInternalURLState(this);
      var urlString = String(href);
      var failure = parseURL(url, urlString);
      if (failure) throw TypeError(failure);
      getInternalSearchParamsState(url.searchParams).updateSearchParams(url.query);
    }),
    // `URL.prototype.origin` getter
    // https://url.spec.whatwg.org/#dom-url-origin
    origin: accessorDescriptor(getOrigin),
    // `URL.prototype.protocol` accessors pair
    // https://url.spec.whatwg.org/#dom-url-protocol
    protocol: accessorDescriptor(getProtocol, function (protocol) {
      var url = getInternalURLState(this);
      parseURL(url, String(protocol) + ':', SCHEME_START);
    }),
    // `URL.prototype.username` accessors pair
    // https://url.spec.whatwg.org/#dom-url-username
    username: accessorDescriptor(getUsername, function (username) {
      var url = getInternalURLState(this);
      var codePoints = arrayFrom(String(username));
      if (cannotHaveUsernamePasswordPort(url)) return;
      url.username = '';
      for (var i = 0; i < codePoints.length; i++) {
        url.username += percentEncode(codePoints[i], userinfoPercentEncodeSet);
      }
    }),
    // `URL.prototype.password` accessors pair
    // https://url.spec.whatwg.org/#dom-url-password
    password: accessorDescriptor(getPassword, function (password) {
      var url = getInternalURLState(this);
      var codePoints = arrayFrom(String(password));
      if (cannotHaveUsernamePasswordPort(url)) return;
      url.password = '';
      for (var i = 0; i < codePoints.length; i++) {
        url.password += percentEncode(codePoints[i], userinfoPercentEncodeSet);
      }
    }),
    // `URL.prototype.host` accessors pair
    // https://url.spec.whatwg.org/#dom-url-host
    host: accessorDescriptor(getHost, function (host) {
      var url = getInternalURLState(this);
      if (url.cannotBeABaseURL) return;
      parseURL(url, String(host), HOST);
    }),
    // `URL.prototype.hostname` accessors pair
    // https://url.spec.whatwg.org/#dom-url-hostname
    hostname: accessorDescriptor(getHostname, function (hostname) {
      var url = getInternalURLState(this);
      if (url.cannotBeABaseURL) return;
      parseURL(url, String(hostname), HOSTNAME);
    }),
    // `URL.prototype.port` accessors pair
    // https://url.spec.whatwg.org/#dom-url-port
    port: accessorDescriptor(getPort, function (port) {
      var url = getInternalURLState(this);
      if (cannotHaveUsernamePasswordPort(url)) return;
      port = String(port);
      if (port == '') url.port = null;
      else parseURL(url, port, PORT);
    }),
    // `URL.prototype.pathname` accessors pair
    // https://url.spec.whatwg.org/#dom-url-pathname
    pathname: accessorDescriptor(getPathname, function (pathname) {
      var url = getInternalURLState(this);
      if (url.cannotBeABaseURL) return;
      url.path = [];
      parseURL(url, pathname + '', PATH_START);
    }),
    // `URL.prototype.search` accessors pair
    // https://url.spec.whatwg.org/#dom-url-search
    search: accessorDescriptor(getSearch, function (search) {
      var url = getInternalURLState(this);
      search = String(search);
      if (search == '') {
        url.query = null;
      } else {
        if ('?' == search.charAt(0)) search = search.slice(1);
        url.query = '';
        parseURL(url, search, QUERY);
      }
      getInternalSearchParamsState(url.searchParams).updateSearchParams(url.query);
    }),
    // `URL.prototype.searchParams` getter
    // https://url.spec.whatwg.org/#dom-url-searchparams
    searchParams: accessorDescriptor(getSearchParams),
    // `URL.prototype.hash` accessors pair
    // https://url.spec.whatwg.org/#dom-url-hash
    hash: accessorDescriptor(getHash, function (hash) {
      var url = getInternalURLState(this);
      hash = String(hash);
      if (hash == '') {
        url.fragment = null;
        return;
      }
      if ('#' == hash.charAt(0)) hash = hash.slice(1);
      url.fragment = '';
      parseURL(url, hash, FRAGMENT);
    })
  });
}

// `URL.prototype.toJSON` method
// https://url.spec.whatwg.org/#dom-url-tojson
redefine(URLPrototype, 'toJSON', function toJSON() {
  return serializeURL.call(this);
}, { enumerable: true });

// `URL.prototype.toString` method
// https://url.spec.whatwg.org/#URL-stringification-behavior
redefine(URLPrototype, 'toString', function toString() {
  return serializeURL.call(this);
}, { enumerable: true });

if (NativeURL) {
  var nativeCreateObjectURL = NativeURL.createObjectURL;
  var nativeRevokeObjectURL = NativeURL.revokeObjectURL;
  // `URL.createObjectURL` method
  // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
  // eslint-disable-next-line no-unused-vars
  if (nativeCreateObjectURL) redefine(URLConstructor, 'createObjectURL', function createObjectURL(blob) {
    return nativeCreateObjectURL.apply(NativeURL, arguments);
  });
  // `URL.revokeObjectURL` method
  // https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
  // eslint-disable-next-line no-unused-vars
  if (nativeRevokeObjectURL) redefine(URLConstructor, 'revokeObjectURL', function revokeObjectURL(url) {
    return nativeRevokeObjectURL.apply(NativeURL, arguments);
  });
}

setToStringTag(URLConstructor, 'URL');

_export({ global: true, forced: !nativeUrl, sham: !descriptors }, {
  URL: URLConstructor
});

// `URL.prototype.toJSON` method
// https://url.spec.whatwg.org/#dom-url-tojson
_export({ target: 'URL', proto: true, enumerable: true }, {
  toJSON: function toJSON() {
    return URL.prototype.toString.call(this);
  }
});

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

/**
 * The Engage API
 * @author Thomas Van Kerckvoorde <thomas.vankerckvoorde@clarabridge.com>
 * @namespace
 */
var EngageApi =
/** @constant
 * @private
 * @type {string}
 * @default
 */

/** @constant
 * @private
 * @type {string}
 * @default
 */

/** @constant
 * @private
 * @type {string}
 * @default
 */

/**
 * Engage API
 * @constructor
 * @param {httpclient} httpClient - a http client (HttpClientAxios is included)
 * @param {string} accessToken
 */
function EngageApi(httpClient, accessToken) {
  var _this = this;

  _classCallCheck(this, EngageApi);

  _defineProperty(this, "request",
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(url, method) {
      var headers,
          body,
          _args = arguments;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              headers = _args.length > 2 && _args[2] !== undefined ? _args[2] : null;
              body = _args.length > 3 && _args[3] !== undefined ? _args[3] : null;
              url.searchParams.set('access_token', _this.accessToken);
              _context.next = 5;
              return _this.httpClient.request(url.toString(), method, headers, body);

            case 5:
              return _context.abrupt("return", _context.sent);

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());

  _defineProperty(this, "addQueryParams", function (url, queryParams) {
    for (var _i = 0, _Object$entries = Object.entries(queryParams); _i < _Object$entries.length; _i++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
          index = _Object$entries$_i[0],
          value = _Object$entries$_i[1];

      if (index && value) {
        url.searchParams.set(index, value);
      }
    }

    return url;
  });

  _defineProperty(this, "getUsersForAccount",
  /*#__PURE__*/
  function () {
    var _ref2 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(accountId) {
      var limit,
          pageToken,
          url,
          _args2 = arguments;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              limit = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : null;
              pageToken = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : null;

              if (accountId) {
                _context2.next = 4;
                break;
              }

              throw 'Please give an account ID';

            case 4:
              url = new URL("/".concat(accountId, "/settings/users"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context2.next = 8;
              return _this.request(url);

            case 8:
              return _context2.abrupt("return", _context2.sent);

            case 9:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function (_x3) {
      return _ref2.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getUserRolesForAccount",
  /*#__PURE__*/
  function () {
    var _ref3 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee3(accountId) {
      var limit,
          pageToken,
          url,
          _args3 = arguments;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              limit = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : null;
              pageToken = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : null;

              if (accountId) {
                _context3.next = 4;
                break;
              }

              throw 'Please give an account ID';

            case 4:
              url = new URL("/".concat(accountId, "/settings/userroles"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context3.next = 8;
              return _this.request(url.toString());

            case 8:
              return _context3.abrupt("return", _context3.sent);

            case 9:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    return function (_x4) {
      return _ref3.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getUserForAccount",
  /*#__PURE__*/
  function () {
    var _ref4 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee4(accountId, userId) {
      var url;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (accountId) {
                _context4.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (userId) {
                _context4.next = 4;
                break;
              }

              throw 'Please give a user ID';

            case 4:
              url = new URL("/".concat(accountId, "/settings/user/").concat(userId), EngageApi.baseUrl);
              _context4.next = 7;
              return _this.request(url);

            case 7:
              return _context4.abrupt("return", _context4.sent);

            case 8:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));

    return function (_x5, _x6) {
      return _ref4.apply(this, arguments);
    };
  }());

  _defineProperty(this, "updateUserForAccount",
  /*#__PURE__*/
  function () {
    var _ref5 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee5(accountId, userId, updates) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (accountId) {
                _context5.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (userId) {
                _context5.next = 4;
                break;
              }

              throw 'Please give a user ID';

            case 4:
              if (updates) {
                _context5.next = 6;
                break;
              }

              throw 'Please give the a valid JSON encoded array of updates. See docs for more info.';

            case 6:
              url = new URL("/".concat(accountId, "/settings/user/").concat(userId), EngageApi.baseUrl);
              body = {
                updates: JSON.stringify(updates)
              };
              _context5.next = 10;
              return _this.request(url, 'post', null, body);

            case 10:
              return _context5.abrupt("return", _context5.sent);

            case 11:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    }));

    return function (_x7, _x8, _x9) {
      return _ref5.apply(this, arguments);
    };
  }());

  _defineProperty(this, "deleteUserForAccount",
  /*#__PURE__*/
  function () {
    var _ref6 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee6(accountId, userId) {
      var url;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              if (accountId) {
                _context6.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (userId) {
                _context6.next = 4;
                break;
              }

              throw 'Please give a user ID';

            case 4:
              url = new URL("/".concat(accountId, "/settings/user/").concat(userId), EngageApi.baseUrl);
              _context6.next = 7;
              return _this.request(url, 'delete');

            case 7:
              return _context6.abrupt("return", _context6.sent);

            case 8:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6);
    }));

    return function (_x10, _x11) {
      return _ref6.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getTopicsForAccount",
  /*#__PURE__*/
  function () {
    var _ref7 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee7(accountId, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              if (accountId) {
                _context7.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/settings/topics/"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context7.next = 6;
              return _this.request(url);

            case 6:
              return _context7.abrupt("return", _context7.sent);

            case 7:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7);
    }));

    return function (_x12, _x13, _x14) {
      return _ref7.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getTeamsForAccount",
  /*#__PURE__*/
  function () {
    var _ref8 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee8(accountId, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              if (accountId) {
                _context8.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/settings/teams/"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context8.next = 6;
              return _this.request(url);

            case 6:
              return _context8.abrupt("return", _context8.sent);

            case 7:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8);
    }));

    return function (_x15, _x16, _x17) {
      return _ref8.apply(this, arguments);
    };
  }());

  _defineProperty(this, "addTeamForAccount",
  /*#__PURE__*/
  function () {
    var _ref9 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee9(accountId, team) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              if (accountId) {
                _context9.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (team) {
                _context9.next = 4;
                break;
              }

              throw 'Please give the JSON encoded array of a Team you want to make. See docs for more info.';

            case 4:
              url = new URL("/".concat(accountId, "/settings/teams/"), EngageApi.baseUrl);
              body = {
                team: JSON.stringify(team)
              };
              _context9.next = 8;
              return _this.request(url, 'post', null, body);

            case 8:
              return _context9.abrupt("return", _context9.sent);

            case 9:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9);
    }));

    return function (_x18, _x19) {
      return _ref9.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getTeamForAccount",
  /*#__PURE__*/
  function () {
    var _ref10 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee10(accountId, teamId) {
      var url;
      return regeneratorRuntime.wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              if (accountId) {
                _context10.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (teamId) {
                _context10.next = 4;
                break;
              }

              throw 'Please give a team ID';

            case 4:
              url = new URL("/".concat(accountId, "/settings/team/").concat(teamId), EngageApi.baseUrl);
              _context10.next = 7;
              return _this.request(url);

            case 7:
              return _context10.abrupt("return", _context10.sent);

            case 8:
            case "end":
              return _context10.stop();
          }
        }
      }, _callee10);
    }));

    return function (_x20, _x21) {
      return _ref10.apply(this, arguments);
    };
  }());

  _defineProperty(this, "updateTeamForAccount",
  /*#__PURE__*/
  function () {
    var _ref11 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee11(accountId, teamId, updates) {
      var options,
          url,
          body,
          _args11 = arguments;
      return regeneratorRuntime.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              options = _args11.length > 3 && _args11[3] !== undefined ? _args11[3] : null;

              if (accountId) {
                _context11.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              if (teamId) {
                _context11.next = 5;
                break;
              }

              throw 'Please give a team ID';

            case 5:
              if (updates) {
                _context11.next = 7;
                break;
              }

              throw 'Please give a JSON encoded array of changes you want to make.';

            case 7:
              url = new URL("/".concat(accountId, "/settings/team/").concat(teamId), EngageApi.baseUrl);
              body = {
                updates: JSON.stringify(updates),
                options: options ? JSON.stringify(options) : null
              };
              _context11.next = 11;
              return _this.request(url, 'post', null, body);

            case 11:
              return _context11.abrupt("return", _context11.sent);

            case 12:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11);
    }));

    return function (_x22, _x23, _x24) {
      return _ref11.apply(this, arguments);
    };
  }());

  _defineProperty(this, "deleteTeamForAccount",
  /*#__PURE__*/
  function () {
    var _ref12 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee12(accountId, teamId) {
      var url;
      return regeneratorRuntime.wrap(function _callee12$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              if (accountId) {
                _context12.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (teamId) {
                _context12.next = 4;
                break;
              }

              throw 'Please give a team ID';

            case 4:
              url = new URL("/".concat(accountId, "/settings/team/").concat(teamId), EngageApi.baseUrl);
              _context12.next = 7;
              return _this.request(url, 'delete');

            case 7:
              return _context12.abrupt("return", _context12.sent);

            case 8:
            case "end":
              return _context12.stop();
          }
        }
      }, _callee12);
    }));

    return function (_x25, _x26) {
      return _ref12.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getTagsForAccount",
  /*#__PURE__*/
  function () {
    var _ref13 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee13(accountId, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              if (accountId) {
                _context13.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/settings/tags"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context13.next = 6;
              return _this.request(url);

            case 6:
              return _context13.abrupt("return", _context13.sent);

            case 7:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13);
    }));

    return function (_x27, _x28, _x29) {
      return _ref13.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getPublishingGuidelinesForAccount",
  /*#__PURE__*/
  function () {
    var _ref14 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee14(accountId, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              if (accountId) {
                _context14.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/settings/publishing_guidelines"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context14.next = 6;
              return _this.request(url);

            case 6:
              return _context14.abrupt("return", _context14.sent);

            case 7:
            case "end":
              return _context14.stop();
          }
        }
      }, _callee14);
    }));

    return function (_x30, _x31, _x32) {
      return _ref14.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getSocialProfileGroupsForAccount",
  /*#__PURE__*/
  function () {
    var _ref15 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee15(accountId, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee15$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              if (accountId) {
                _context15.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/settings/profilegroups"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context15.next = 6;
              return _this.request(url);

            case 6:
              return _context15.abrupt("return", _context15.sent);

            case 7:
            case "end":
              return _context15.stop();
          }
        }
      }, _callee15);
    }));

    return function (_x33, _x34, _x35) {
      return _ref15.apply(this, arguments);
    };
  }());

  _defineProperty(this, "addSocialProfileGroupForAccount",
  /*#__PURE__*/
  function () {
    var _ref16 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee16(accountId, profileGroup) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee16$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              if (accountId) {
                _context16.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (profileGroup) {
                _context16.next = 4;
                break;
              }

              throw 'Please give a JSON encoded array of a Social Profile Group';

            case 4:
              url = new URL("/".concat(accountId, "/settings/profilegroups"), EngageApi.baseUrl);
              body = {
                profile_group: JSON.stringify(profileGroup)
              };
              _context16.next = 8;
              return _this.request(url, 'post', null, body);

            case 8:
              return _context16.abrupt("return", _context16.sent);

            case 9:
            case "end":
              return _context16.stop();
          }
        }
      }, _callee16);
    }));

    return function (_x36, _x37) {
      return _ref16.apply(this, arguments);
    };
  }());

  _defineProperty(this, "addSocialProfileGroupForAccount",
  /*#__PURE__*/
  function () {
    var _ref17 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee17(accountId, groupId, updates) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee17$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              if (accountId) {
                _context17.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (groupId) {
                _context17.next = 4;
                break;
              }

              throw 'Please give a valid group id';

            case 4:
              if (updates) {
                _context17.next = 6;
                break;
              }

              throw 'Please give a JSON encoded array of changes you want to make';

            case 6:
              url = new URL("/".concat(accountId, "/settings/profilegroup/").concat(groupId), EngageApi.baseUrl);
              body = {
                updates: JSON.stringify(updates)
              };
              _context17.next = 10;
              return _this.request(url, 'post', null, body);

            case 10:
              return _context17.abrupt("return", _context17.sent);

            case 11:
            case "end":
              return _context17.stop();
          }
        }
      }, _callee17);
    }));

    return function (_x38, _x39, _x40) {
      return _ref17.apply(this, arguments);
    };
  }());

  _defineProperty(this, "deleteSocialProfileGroupForAccount",
  /*#__PURE__*/
  function () {
    var _ref18 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee18(accountId, groupId) {
      var url;
      return regeneratorRuntime.wrap(function _callee18$(_context18) {
        while (1) {
          switch (_context18.prev = _context18.next) {
            case 0:
              if (accountId) {
                _context18.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (groupId) {
                _context18.next = 4;
                break;
              }

              throw 'Please give a valid group id';

            case 4:
              url = new URL("/".concat(accountId, "/settings/profilegroup/").concat(groupId), EngageApi.baseUrl);
              _context18.next = 7;
              return _this.request(url, 'delete');

            case 7:
              return _context18.abrupt("return", _context18.sent);

            case 8:
            case "end":
              return _context18.stop();
          }
        }
      }, _callee18);
    }));

    return function (_x41, _x42) {
      return _ref18.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getAuditLogSettingsChangesForAccount",
  /*#__PURE__*/
  function () {
    var _ref19 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee19(accountId) {
      var dateFrom,
          dateTo,
          types,
          topicIds,
          userId,
          pageToken,
          limit,
          url,
          _args19 = arguments;
      return regeneratorRuntime.wrap(function _callee19$(_context19) {
        while (1) {
          switch (_context19.prev = _context19.next) {
            case 0:
              dateFrom = _args19.length > 1 && _args19[1] !== undefined ? _args19[1] : null;
              dateTo = _args19.length > 2 && _args19[2] !== undefined ? _args19[2] : null;
              types = _args19.length > 3 && _args19[3] !== undefined ? _args19[3] : '';
              topicIds = _args19.length > 4 && _args19[4] !== undefined ? _args19[4] : '';
              userId = _args19.length > 5 && _args19[5] !== undefined ? _args19[5] : '';
              pageToken = _args19.length > 6 && _args19[6] !== undefined ? _args19[6] : '';
              limit = _args19.length > 7 && _args19[7] !== undefined ? _args19[7] : '';

              if (accountId) {
                _context19.next = 9;
                break;
              }

              throw 'Please give an account ID';

            case 9:
              url = new URL("/".concat(accountId, "/settings/history"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                date_from: dateFrom,
                date_to: dateTo,
                types: types,
                topic_ids: topicIds,
                user_id: userId,
                page_token: pageToken,
                limit: limit
              });
              _context19.next = 13;
              return _this.request(url);

            case 13:
              return _context19.abrupt("return", _context19.sent);

            case 14:
            case "end":
              return _context19.stop();
          }
        }
      }, _callee19);
    }));

    return function (_x43) {
      return _ref19.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getCustomFieldsForAccount",
  /*#__PURE__*/
  function () {
    var _ref20 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee20(accountId, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee20$(_context20) {
        while (1) {
          switch (_context20.prev = _context20.next) {
            case 0:
              if (accountId) {
                _context20.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/settings/customattributes"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context20.next = 6;
              return _this.request(url);

            case 6:
              return _context20.abrupt("return", _context20.sent);

            case 7:
            case "end":
              return _context20.stop();
          }
        }
      }, _callee20);
    }));

    return function (_x44, _x45, _x46) {
      return _ref20.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getCannedReponsesFoldersForAccount",
  /*#__PURE__*/
  function () {
    var _ref21 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee21(accountId, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee21$(_context21) {
        while (1) {
          switch (_context21.prev = _context21.next) {
            case 0:
              if (accountId) {
                _context21.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/settings/canned_responses_folders"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context21.next = 6;
              return _this.request(url);

            case 6:
              return _context21.abrupt("return", _context21.sent);

            case 7:
            case "end":
              return _context21.stop();
          }
        }
      }, _callee21);
    }));

    return function (_x47, _x48, _x49) {
      return _ref21.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getCannedResponsesForAccount",
  /*#__PURE__*/
  function () {
    var _ref22 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee22(accountId, limit, pageToken) {
      var topicId,
          ymid,
          query,
          folderIds,
          order,
          replyType,
          serviceType,
          serviceId,
          url,
          _args22 = arguments;
      return regeneratorRuntime.wrap(function _callee22$(_context22) {
        while (1) {
          switch (_context22.prev = _context22.next) {
            case 0:
              topicId = _args22.length > 3 && _args22[3] !== undefined ? _args22[3] : '';
              ymid = _args22.length > 4 && _args22[4] !== undefined ? _args22[4] : '';
              query = _args22.length > 5 && _args22[5] !== undefined ? _args22[5] : '';
              folderIds = _args22.length > 6 && _args22[6] !== undefined ? _args22[6] : {};
              order = _args22.length > 7 && _args22[7] !== undefined ? _args22[7] : '';
              replyType = _args22.length > 8 && _args22[8] !== undefined ? _args22[8] : '';
              serviceType = _args22.length > 9 && _args22[9] !== undefined ? _args22[9] : '';
              serviceId = _args22.length > 10 && _args22[10] !== undefined ? _args22[10] : '';

              if (accountId) {
                _context22.next = 10;
                break;
              }

              throw 'Please give an account ID';

            case 10:
              url = new URL("/".concat(accountId, "/settings/canned_responses"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken,
                topic_id: topicId,
                ymid: ymid,
                query: query,
                folder_ids: folderIds,
                order: order,
                reply_type: replyType,
                service_type: serviceType,
                service_id: serviceId
              });
              _context22.next = 14;
              return _this.request(url);

            case 14:
              return _context22.abrupt("return", _context22.sent);

            case 15:
            case "end":
              return _context22.stop();
          }
        }
      }, _callee22);
    }));

    return function (_x50, _x51, _x52) {
      return _ref22.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getBusinessHoursScheduleForAccount",
  /*#__PURE__*/
  function () {
    var _ref23 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee23(accountId, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee23$(_context23) {
        while (1) {
          switch (_context23.prev = _context23.next) {
            case 0:
              if (accountId) {
                _context23.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/settings/businesshoursschedules"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context23.next = 6;
              return _this.request(url);

            case 6:
              return _context23.abrupt("return", _context23.sent);

            case 7:
            case "end":
              return _context23.stop();
          }
        }
      }, _callee23);
    }));

    return function (_x53, _x54, _x55) {
      return _ref23.apply(this, arguments);
    };
  }());

  _defineProperty(this, "addBusinessHoursScheduleForAccount",
  /*#__PURE__*/
  function () {
    var _ref24 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee24(accountId, businessHoursSchedule) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee24$(_context24) {
        while (1) {
          switch (_context24.prev = _context24.next) {
            case 0:
              if (accountId) {
                _context24.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (businessHoursSchedule) {
                _context24.next = 4;
                break;
              }

              throw 'Please give a valid JSON encoded array of a Business Hours Schedule you want to make.';

            case 4:
              url = new URL("/".concat(accountId, "/settings/businesshoursschedules"), EngageApi.baseUrl);
              body = {
                business_hours_schedule: JSON.stringify(businessHoursSchedule)
              };
              _context24.next = 8;
              return _this.request(url, 'post', null, body);

            case 8:
              return _context24.abrupt("return", _context24.sent);

            case 9:
            case "end":
              return _context24.stop();
          }
        }
      }, _callee24);
    }));

    return function (_x56, _x57) {
      return _ref24.apply(this, arguments);
    };
  }());

  _defineProperty(this, "editBusinessHoursScheduleForAccount",
  /*#__PURE__*/
  function () {
    var _ref25 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee25(accountId, id, updates) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee25$(_context25) {
        while (1) {
          switch (_context25.prev = _context25.next) {
            case 0:
              if (accountId) {
                _context25.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (id) {
                _context25.next = 4;
                break;
              }

              throw 'Please give a valid Business Hours Schedule ID.';

            case 4:
              if (updates) {
                _context25.next = 6;
                break;
              }

              throw 'Please give a valid JSON encoded array of changes you want to make.';

            case 6:
              url = new URL("/".concat(accountId, "/settings/businesshoursschedules/").concat(id), EngageApi.baseUrl);
              body = {
                updates: JSON.stringify(updates)
              };
              _context25.next = 10;
              return _this.request(url, 'post', null, body);

            case 10:
              return _context25.abrupt("return", _context25.sent);

            case 11:
            case "end":
              return _context25.stop();
          }
        }
      }, _callee25);
    }));

    return function (_x58, _x59, _x60) {
      return _ref25.apply(this, arguments);
    };
  }());

  _defineProperty(this, "deleteBusinessHoursScheduleForAccount",
  /*#__PURE__*/
  function () {
    var _ref26 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee26(accountId, id) {
      var url;
      return regeneratorRuntime.wrap(function _callee26$(_context26) {
        while (1) {
          switch (_context26.prev = _context26.next) {
            case 0:
              if (accountId) {
                _context26.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (id) {
                _context26.next = 4;
                break;
              }

              throw 'Please give a valid Business Hours Schedule ID.';

            case 4:
              url = new URL("/".concat(accountId, "/settings/businesshoursschedules/").concat(id), EngageApi.baseUrl);
              _context26.next = 7;
              return _this.request(url, 'delete');

            case 7:
              return _context26.abrupt("return", _context26.sent);

            case 8:
            case "end":
              return _context26.stop();
          }
        }
      }, _callee26);
    }));

    return function (_x61, _x62) {
      return _ref26.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getDashboardWidgetData",
  /*#__PURE__*/
  function () {
    var _ref27 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee27(accountId, dashboardId, componentId, filter, dateFrom, dateTo) {
      var url;
      return regeneratorRuntime.wrap(function _callee27$(_context27) {
        while (1) {
          switch (_context27.prev = _context27.next) {
            case 0:
              if (accountId) {
                _context27.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (dashboardId) {
                _context27.next = 4;
                break;
              }

              throw 'Please give a dashboard ID';

            case 4:
              if (componentId) {
                _context27.next = 6;
                break;
              }

              throw 'Please give a component ID';

            case 6:
              url = new URL("/".concat(accountId, "/dashboards/component/").concat(dashboardId, "/").concat(componentId), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                filter: filter,
                date_from: dateFrom,
                date_to: dateTo
              });
              _context27.next = 10;
              return _this.request(url);

            case 10:
              return _context27.abrupt("return", _context27.sent);

            case 11:
            case "end":
              return _context27.stop();
          }
        }
      }, _callee27);
    }));

    return function (_x63, _x64, _x65, _x66, _x67, _x68) {
      return _ref27.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getWidgetDataFromDashboard",
  /*#__PURE__*/
  function () {
    var _ref28 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee28(accountId, dashboardId, filter, dateFrom, dateTo) {
      var url;
      return regeneratorRuntime.wrap(function _callee28$(_context28) {
        while (1) {
          switch (_context28.prev = _context28.next) {
            case 0:
              if (accountId) {
                _context28.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (dashboardId) {
                _context28.next = 4;
                break;
              }

              throw 'Please give a dashboard ID';

            case 4:
              url = new URL("/".concat(accountId, "/dashboards/export/").concat(dashboardId), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                filter: filter,
                date_from: dateFrom,
                date_to: dateTo
              });
              _context28.next = 8;
              return _this.request(url);

            case 8:
              return _context28.abrupt("return", _context28.sent);

            case 9:
            case "end":
              return _context28.stop();
          }
        }
      }, _callee28);
    }));

    return function (_x69, _x70, _x71, _x72, _x73) {
      return _ref28.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getDashboards",
  /*#__PURE__*/
  function () {
    var _ref29 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee29(accountId, filter, dateFrom, dateTo) {
      var url;
      return regeneratorRuntime.wrap(function _callee29$(_context29) {
        while (1) {
          switch (_context29.prev = _context29.next) {
            case 0:
              if (accountId) {
                _context29.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/dashboards/overview"), EngageApi.baseUrl);
              _context29.next = 5;
              return _this.request(url);

            case 5:
              return _context29.abrupt("return", _context29.sent);

            case 6:
            case "end":
              return _context29.stop();
          }
        }
      }, _callee29);
    }));

    return function (_x74, _x75, _x76, _x77) {
      return _ref29.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getFilterOptions",
  /*#__PURE__*/
  function () {
    var _ref30 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee30(accountId, query, limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee30$(_context30) {
        while (1) {
          switch (_context30.prev = _context30.next) {
            case 0:
              if (accountId) {
                _context30.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/filter/suggestions"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken,
                query: query
              });
              _context30.next = 6;
              return _this.request(url);

            case 6:
              return _context30.abrupt("return", _context30.sent);

            case 7:
            case "end":
              return _context30.stop();
          }
        }
      }, _callee30);
    }));

    return function (_x78, _x79, _x80, _x81) {
      return _ref30.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getInsights",
  /*#__PURE__*/
  function () {
    var _ref31 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee31(accountId, facetDefinitions, filter, dateFrom, dateTo, topicIds, profileIds) {
      var url;
      return regeneratorRuntime.wrap(function _callee31$(_context31) {
        while (1) {
          switch (_context31.prev = _context31.next) {
            case 0:
              if (accountId) {
                _context31.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (facetDefinitions) {
                _context31.next = 4;
                break;
              }

              throw 'Please give a json encoded array of facetdefinition objects.';

            case 4:
              url = new URL("/".concat(accountId, "/insights/facets"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                facetdefinitions: JSON.stringify(facetDefinitions),
                filter: filter,
                date_from: dateFrom,
                date_to: dateTo,
                topic_ids: topicIds,
                profile_ids: profileIds
              });
              _context31.next = 8;
              return _this.request(url);

            case 8:
              return _context31.abrupt("return", _context31.sent);

            case 9:
            case "end":
              return _context31.stop();
          }
        }
      }, _callee31);
    }));

    return function (_x82, _x83, _x84, _x85, _x86, _x87, _x88) {
      return _ref31.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getSecurityLogsForAccount",
  /*#__PURE__*/
  function () {
    var _ref32 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee32(accountId, dateFrom, dateTo, events, userId, pageToken, limit) {
      var url;
      return regeneratorRuntime.wrap(function _callee32$(_context32) {
        while (1) {
          switch (_context32.prev = _context32.next) {
            case 0:
              if (accountId) {
                _context32.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/security/audit"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                date_from: dateFrom,
                date_to: dateTo,
                events: events,
                user_id: userId,
                page_token: pageToken,
                limit: limit
              });
              _context32.next = 6;
              return _this.request(url);

            case 6:
              return _context32.abrupt("return", _context32.sent);

            case 7:
            case "end":
              return _context32.stop();
          }
        }
      }, _callee32);
    }));

    return function (_x89, _x90, _x91, _x92, _x93, _x94, _x95) {
      return _ref32.apply(this, arguments);
    };
  }());

  _defineProperty(this, "toggleCrisisPlan",
  /*#__PURE__*/
  function () {
    var _ref33 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee33(accountId, planId, activate) {
      var crisis_name,
          url,
          body,
          _args33 = arguments;
      return regeneratorRuntime.wrap(function _callee33$(_context33) {
        while (1) {
          switch (_context33.prev = _context33.next) {
            case 0:
              crisis_name = _args33.length > 3 && _args33[3] !== undefined ? _args33[3] : '';

              if (accountId) {
                _context33.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              if (planId) {
                _context33.next = 5;
                break;
              }

              throw 'Please give a valid Crisis plan ID';

            case 5:
              if (!(typeof activate === 'undefined')) {
                _context33.next = 7;
                break;
              }

              throw 'Please indicate whether you want to activate the Crisis plan or not';

            case 7:
              url = new URL("/".concat(accountId, "/crisis/event/"), EngageApi.baseUrl);
              body = {
                id: planId,
                activate: activate,
                crisis_name: crisis_name
              };
              _context33.next = 11;
              return _this.request(url, 'post', null, body);

            case 11:
              return _context33.abrupt("return", _context33.sent);

            case 12:
            case "end":
              return _context33.stop();
          }
        }
      }, _callee33);
    }));

    return function (_x96, _x97, _x98) {
      return _ref33.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getCrisisPlanForAccount",
  /*#__PURE__*/
  function () {
    var _ref34 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee34(accountId, activeOnly) {
      var url;
      return regeneratorRuntime.wrap(function _callee34$(_context34) {
        while (1) {
          switch (_context34.prev = _context34.next) {
            case 0:
              if (accountId) {
                _context34.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/crisis/plans"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                active_only: activeOnly
              });
              _context34.next = 6;
              return _this.request(url);

            case 6:
              return _context34.abrupt("return", _context34.sent);

            case 7:
            case "end":
              return _context34.stop();
          }
        }
      }, _callee34);
    }));

    return function (_x99, _x100) {
      return _ref34.apply(this, arguments);
    };
  }());

  _defineProperty(this, "toggleTodoForAccount",
  /*#__PURE__*/
  function () {
    var _ref35 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee35(accountId, planId, todoId, done) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee35$(_context35) {
        while (1) {
          switch (_context35.prev = _context35.next) {
            case 0:
              if (accountId) {
                _context35.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (planId) {
                _context35.next = 4;
                break;
              }

              throw 'Please give a valid Crisis plan ID';

            case 4:
              if (todoId) {
                _context35.next = 6;
                break;
              }

              throw 'Please give a valid Crisis plan ID';

            case 6:
              if (!(typeof done === 'undefined')) {
                _context35.next = 8;
                break;
              }

              throw 'Please indicate whether you want to set the Todo as done';

            case 8:
              url = new URL("/".concat(accountId, "/crisis/todo/"), EngageApi.baseUrl);
              body = {
                plan_id: planId,
                todo_id: todoId,
                done: done
              };
              _context35.next = 12;
              return _this.request(url, 'post', null, body);

            case 12:
              return _context35.abrupt("return", _context35.sent);

            case 13:
            case "end":
              return _context35.stop();
          }
        }
      }, _callee35);
    }));

    return function (_x101, _x102, _x103, _x104) {
      return _ref35.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getGeoLocationsFromString",
  /*#__PURE__*/
  function () {
    var _ref36 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee36(string) {
      var url;
      return regeneratorRuntime.wrap(function _callee36$(_context36) {
        while (1) {
          switch (_context36.prev = _context36.next) {
            case 0:
              url = new URL("/tools/geocode", EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                string: string
              });
              _context36.next = 4;
              return _this.request(url);

            case 4:
              return _context36.abrupt("return", _context36.sent);

            case 5:
            case "end":
              return _context36.stop();
          }
        }
      }, _callee36);
    }));

    return function (_x105) {
      return _ref36.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getLanguageFromString",
  /*#__PURE__*/
  function () {
    var _ref37 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee37(string) {
      var url;
      return regeneratorRuntime.wrap(function _callee37$(_context37) {
        while (1) {
          switch (_context37.prev = _context37.next) {
            case 0:
              url = new URL("/tools/geocode", EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                string: string
              });
              _context37.next = 4;
              return _this.request(url);

            case 4:
              return _context37.abrupt("return", _context37.sent);

            case 5:
            case "end":
              return _context37.stop();
          }
        }
      }, _callee37);
    }));

    return function (_x106) {
      return _ref37.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getSentimentFromString",
  /*#__PURE__*/
  function () {
    var _ref38 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee38(string) {
      var language,
          url,
          _args38 = arguments;
      return regeneratorRuntime.wrap(function _callee38$(_context38) {
        while (1) {
          switch (_context38.prev = _context38.next) {
            case 0:
              language = _args38.length > 1 && _args38[1] !== undefined ? _args38[1] : '';
              url = new URL("/tools/geocode", EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                string: string,
                language: language
              });
              _context38.next = 5;
              return _this.request(url);

            case 5:
              return _context38.abrupt("return", _context38.sent);

            case 6:
            case "end":
              return _context38.stop();
          }
        }
      }, _callee38);
    }));

    return function (_x107) {
      return _ref38.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getCurrentlyLoggedInUser",
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee39() {
    var url;
    return regeneratorRuntime.wrap(function _callee39$(_context39) {
      while (1) {
        switch (_context39.prev = _context39.next) {
          case 0:
            url = new URL("/me", EngageApi.baseUrl);
            _context39.next = 3;
            return _this.request(url);

          case 3:
            return _context39.abrupt("return", _context39.sent);

          case 4:
          case "end":
            return _context39.stop();
        }
      }
    }, _callee39);
  })));

  _defineProperty(this, "getCurrentlyLoggedInUserAccounts",
  /*#__PURE__*/
  function () {
    var _ref40 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee40(limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee40$(_context40) {
        while (1) {
          switch (_context40.prev = _context40.next) {
            case 0:
              url = new URL("/me/accounts", EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context40.next = 4;
              return _this.request(url);

            case 4:
              return _context40.abrupt("return", _context40.sent);

            case 5:
            case "end":
              return _context40.stop();
          }
        }
      }, _callee40);
    }));

    return function (_x108, _x109) {
      return _ref40.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getCurrentlyLoggedInUserConnectedProfiles",
  /*#__PURE__*/
  function () {
    var _ref41 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee41(limit, pageToken) {
      var url;
      return regeneratorRuntime.wrap(function _callee41$(_context41) {
        while (1) {
          switch (_context41.prev = _context41.next) {
            case 0:
              url = new URL("/me/connectedprofiles", EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                limit: limit,
                page_token: pageToken
              });
              _context41.next = 4;
              return _this.request(url);

            case 4:
              return _context41.abrupt("return", _context41.sent);

            case 5:
            case "end":
              return _context41.stop();
          }
        }
      }, _callee41);
    }));

    return function (_x110, _x111) {
      return _ref41.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getCurrentlyLoggedInUserPermissions",
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee42() {
    var url;
    return regeneratorRuntime.wrap(function _callee42$(_context42) {
      while (1) {
        switch (_context42.prev = _context42.next) {
          case 0:
            url = new URL("/me/permissions", EngageApi.baseUrl);
            _context42.next = 3;
            return _this.request(url);

          case 3:
            return _context42.abrupt("return", _context42.sent);

          case 4:
          case "end":
            return _context42.stop();
        }
      }
    }, _callee42);
  })));

  _defineProperty(this, "addMentionsToTopicForAccount",
  /*#__PURE__*/
  function () {
    var _ref43 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee43(accountId, mentions) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee43$(_context43) {
        while (1) {
          switch (_context43.prev = _context43.next) {
            case 0:
              if (accountId) {
                _context43.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (mentions) {
                _context43.next = 4;
                break;
              }

              throw 'Please give an account ID';

            case 4:
              url = new URL("/".concat(accountId, "/inbox/add"), EngageApi.baseUrl);
              body = {
                mentions: JSON.stringify(mentions)
              };
              _context43.next = 8;
              return _this.request(url, 'post', null, body);

            case 8:
              return _context43.abrupt("return", _context43.sent);

            case 9:
            case "end":
              return _context43.stop();
          }
        }
      }, _callee43);
    }));

    return function (_x112, _x113) {
      return _ref43.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getSocialProfileForAccount",
  /*#__PURE__*/
  function () {
    var _ref44 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee44(accountId, contactId) {
      var topicIds,
          url,
          _args44 = arguments;
      return regeneratorRuntime.wrap(function _callee44$(_context44) {
        while (1) {
          switch (_context44.prev = _context44.next) {
            case 0:
              topicIds = _args44.length > 2 && _args44[2] !== undefined ? _args44[2] : null;

              if (accountId) {
                _context44.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              if (contactId) {
                _context44.next = 5;
                break;
              }

              throw 'Please give an account ID';

            case 5:
              url = new URL("/".concat(accountId, "/inbox/contact/").concat(contactId), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                topics_ids: topicIds
              });
              _context44.next = 9;
              return _this.request(url);

            case 9:
              return _context44.abrupt("return", _context44.sent);

            case 10:
            case "end":
              return _context44.stop();
          }
        }
      }, _callee44);
    }));

    return function (_x114, _x115) {
      return _ref44.apply(this, arguments);
    };
  }());

  _defineProperty(this, "updateSocialProfileForAccount",
  /*#__PURE__*/
  function () {
    var _ref45 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee45(accountId, contactId, updates) {
      var options,
          url,
          body,
          _args45 = arguments;
      return regeneratorRuntime.wrap(function _callee45$(_context45) {
        while (1) {
          switch (_context45.prev = _context45.next) {
            case 0:
              options = _args45.length > 3 && _args45[3] !== undefined ? _args45[3] : null;

              if (accountId) {
                _context45.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              if (contactId) {
                _context45.next = 5;
                break;
              }

              throw 'Please give an account ID';

            case 5:
              if (updates) {
                _context45.next = 7;
                break;
              }

              throw 'Please give a JSON encoded array of changes you want to make.';

            case 7:
              url = new URL("/".concat(accountId, "/inbox/contact/").concat(contactId), EngageApi.baseUrl);
              body = {
                updates: JSON.stringify(updates),
                options: options ? JSON.stringify(options) : null
              };
              _context45.next = 11;
              return _this.request(url, 'post', null, body);

            case 11:
              return _context45.abrupt("return", _context45.sent);

            case 12:
            case "end":
              return _context45.stop();
          }
        }
      }, _callee45);
    }));

    return function (_x116, _x117, _x118) {
      return _ref45.apply(this, arguments);
    };
  }());

  _defineProperty(this, "deleteSocialProfileForAccount",
  /*#__PURE__*/
  function () {
    var _ref46 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee46(accountId, contactId, updates) {
      var url;
      return regeneratorRuntime.wrap(function _callee46$(_context46) {
        while (1) {
          switch (_context46.prev = _context46.next) {
            case 0:

              if (accountId) {
                _context46.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              if (contactId) {
                _context46.next = 5;
                break;
              }

              throw 'Please give an account ID';

            case 5:
              if (updates) {
                _context46.next = 7;
                break;
              }

              throw 'Please give a JSON encoded array of changes you want to make.';

            case 7:
              url = new URL("/".concat(accountId, "/inbox/contact/").concat(contactId), EngageApi.baseUrl);
              _context46.next = 10;
              return _this.request(url, 'delete');

            case 10:
              return _context46.abrupt("return", _context46.sent);

            case 11:
            case "end":
              return _context46.stop();
          }
        }
      }, _callee46);
    }));

    return function (_x119, _x120, _x121) {
      return _ref46.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getSocialProfileForAccountByService",
  /*#__PURE__*/
  function () {
    var _ref47 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee47(accountId, service, serviceId, topicIds) {
      var url;
      return regeneratorRuntime.wrap(function _callee47$(_context47) {
        while (1) {
          switch (_context47.prev = _context47.next) {
            case 0:
              if (accountId) {
                _context47.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (service) {
                _context47.next = 4;
                break;
              }

              throw 'Please give a valid service';

            case 4:
              if (serviceId) {
                _context47.next = 6;
                break;
              }

              throw 'Please give a valid service id';

            case 6:
              url = new URL("/".concat(accountId, "/inbox/contact/").concat(service, "/").concat(serviceId), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                topics_ids: topicIds
              });
              _context47.next = 10;
              return _this.request(url);

            case 10:
              return _context47.abrupt("return", _context47.sent);

            case 11:
            case "end":
              return _context47.stop();
          }
        }
      }, _callee47);
    }));

    return function (_x122, _x123, _x124, _x125) {
      return _ref47.apply(this, arguments);
    };
  }());

  _defineProperty(this, "updateSocialProfileForAccountByService",
  /*#__PURE__*/
  function () {
    var _ref48 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee48(accountId, service, serviceId, updates, options) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee48$(_context48) {
        while (1) {
          switch (_context48.prev = _context48.next) {
            case 0:
              if (accountId) {
                _context48.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (service) {
                _context48.next = 4;
                break;
              }

              throw 'Please give a valid service';

            case 4:
              if (serviceId) {
                _context48.next = 6;
                break;
              }

              throw 'Please give a valid service id';

            case 6:
              if (updates) {
                _context48.next = 8;
                break;
              }

              throw 'Please give a JSON encoded array of changes you want to make.';

            case 8:
              url = new URL("/".concat(accountId, "/inbox/contact/").concat(service, "/").concat(serviceId), EngageApi.baseUrl);
              body = {
                updates: JSON.stringify(updates),
                options: options ? JSON.stringify(options) : null
              };
              _context48.next = 12;
              return _this.request(url, 'post', null, body);

            case 12:
              return _context48.abrupt("return", _context48.sent);

            case 13:
            case "end":
              return _context48.stop();
          }
        }
      }, _callee48);
    }));

    return function (_x126, _x127, _x128, _x129, _x130) {
      return _ref48.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getContactsForAccount",
  /*#__PURE__*/
  function () {
    var _ref49 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee49(accountId) {
      var requiredFields,
          filter,
          updatedSince,
          pageToken,
          limit,
          sort,
          url,
          _args49 = arguments;
      return regeneratorRuntime.wrap(function _callee49$(_context49) {
        while (1) {
          switch (_context49.prev = _context49.next) {
            case 0:
              requiredFields = _args49.length > 1 && _args49[1] !== undefined ? _args49[1] : null;
              filter = _args49.length > 2 && _args49[2] !== undefined ? _args49[2] : '';
              updatedSince = _args49.length > 3 ? _args49[3] : undefined;
              pageToken = _args49.length > 4 ? _args49[4] : undefined;
              limit = _args49.length > 5 ? _args49[5] : undefined;
              sort = _args49.length > 6 ? _args49[6] : undefined;

              if (accountId) {
                _context49.next = 8;
                break;
              }

              throw 'Please give an account ID';

            case 8:
              url = new URL("/".concat(accountId, "/inbox/contacts"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                required_fields: requiredFields,
                filter: filter,
                updated_since: updatedSince,
                page_token: pageToken,
                limit: limit,
                sort: sort
              });
              _context49.next = 12;
              return _this.request(url);

            case 12:
              return _context49.abrupt("return", _context49.sent);

            case 13:
            case "end":
              return _context49.stop();
          }
        }
      }, _callee49);
    }));

    return function (_x131) {
      return _ref49.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getContextHistoryOfMentionForAccount",
  /*#__PURE__*/
  function () {
    var _ref50 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee50(accountId, topicId, id, dateFrom, dateTo) {
      var contextType,
          url,
          _args50 = arguments;
      return regeneratorRuntime.wrap(function _callee50$(_context50) {
        while (1) {
          switch (_context50.prev = _context50.next) {
            case 0:
              contextType = _args50.length > 5 && _args50[5] !== undefined ? _args50[5] : 'conversation';

              if (accountId) {
                _context50.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              if (topicId) {
                _context50.next = 5;
                break;
              }

              throw 'Please give a valid topic ID';

            case 5:
              if (id) {
                _context50.next = 7;
                break;
              }

              throw 'Please give a valid ID';

            case 7:
              url = new URL("/".concat(accountId, "/inbox/context/").concat(topicId, "/").concat(id), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                date_from: dateFrom,
                date_to: dateTo,
                context_type: contextType
              });
              _context50.next = 11;
              return _this.request(url);

            case 11:
              return _context50.abrupt("return", _context50.sent);

            case 12:
            case "end":
              return _context50.stop();
          }
        }
      }, _callee50);
    }));

    return function (_x132, _x133, _x134, _x135, _x136) {
      return _ref50.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getMailboxesConfiguration",
  /*#__PURE__*/
  function () {
    var _ref51 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee51(accountId, pageToken) {
      var limit,
          url,
          _args51 = arguments;
      return regeneratorRuntime.wrap(function _callee51$(_context51) {
        while (1) {
          switch (_context51.prev = _context51.next) {
            case 0:
              limit = _args51.length > 2 && _args51[2] !== undefined ? _args51[2] : '20';

              if (accountId) {
                _context51.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              url = new URL("/".concat(accountId, "/inbox/mailboxes"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                page_token: pageToken,
                limit: limit
              });
              _context51.next = 7;
              return _this.request(url);

            case 7:
              return _context51.abrupt("return", _context51.sent);

            case 8:
            case "end":
              return _context51.stop();
          }
        }
      }, _callee51);
    }));

    return function (_x137, _x138) {
      return _ref51.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getMention",
  /*#__PURE__*/
  function () {
    var _ref52 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee52(accountId, topicId, id) {
      var url;
      return regeneratorRuntime.wrap(function _callee52$(_context52) {
        while (1) {
          switch (_context52.prev = _context52.next) {
            case 0:
              if (accountId) {
                _context52.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (topicId) {
                _context52.next = 4;
                break;
              }

              throw 'Please give a valid topic ID';

            case 4:
              if (id) {
                _context52.next = 6;
                break;
              }

              throw 'Please give a valid ID';

            case 6:
              url = new URL("/".concat(accountId, "/inbox/mention/").concat(topicId, "/").concat(id), EngageApi.baseUrl);
              _context52.next = 9;
              return _this.request(url);

            case 9:
              return _context52.abrupt("return", _context52.sent);

            case 10:
            case "end":
              return _context52.stop();
          }
        }
      }, _callee52);
    }));

    return function (_x139, _x140, _x141) {
      return _ref52.apply(this, arguments);
    };
  }());

  _defineProperty(this, "updateMention",
  /*#__PURE__*/
  function () {
    var _ref53 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee53(accountId, topicId, id) {
      var updates,
          listFilter,
          options,
          url,
          body,
          _args53 = arguments;
      return regeneratorRuntime.wrap(function _callee53$(_context53) {
        while (1) {
          switch (_context53.prev = _context53.next) {
            case 0:
              updates = _args53.length > 3 && _args53[3] !== undefined ? _args53[3] : null;
              listFilter = _args53.length > 4 && _args53[4] !== undefined ? _args53[4] : '';
              options = _args53.length > 5 && _args53[5] !== undefined ? _args53[5] : null;

              if (accountId) {
                _context53.next = 5;
                break;
              }

              throw 'Please give an account ID';

            case 5:
              url = new URL("/".concat(accountId, "/inbox/mention/").concat(topicId, "/").concat(id), EngageApi.baseUrl);
              body = {
                updates: updates ? JSON.stringify(updates) : null,
                list_filter: listFilter,
                options: options ? JSON.stringify(options) : null
              };
              _context53.next = 9;
              return _this.request(url, 'post', null, body);

            case 9:
              return _context53.abrupt("return", _context53.sent);

            case 10:
            case "end":
              return _context53.stop();
          }
        }
      }, _callee53);
    }));

    return function (_x142, _x143, _x144) {
      return _ref53.apply(this, arguments);
    };
  }());

  _defineProperty(this, "deleteMention",
  /*#__PURE__*/
  function () {
    var _ref54 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee54(accountId, topicId, id) {
      var options,
          url,
          body,
          _args54 = arguments;
      return regeneratorRuntime.wrap(function _callee54$(_context54) {
        while (1) {
          switch (_context54.prev = _context54.next) {
            case 0:
              options = _args54.length > 3 && _args54[3] !== undefined ? _args54[3] : null;

              if (accountId) {
                _context54.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              if (topicId) {
                _context54.next = 5;
                break;
              }

              throw 'Please give a valid topic ID';

            case 5:
              if (id) {
                _context54.next = 7;
                break;
              }

              throw 'Please give a valid ID';

            case 7:
              url = new URL("/".concat(accountId, "/inbox/mention/").concat(topicId, "/").concat(id), EngageApi.baseUrl);
              body = {
                options: options ? JSON.stringify(options) : null
              };
              _context54.next = 11;
              return _this.request(url, 'delete', null, body);

            case 11:
              return _context54.abrupt("return", _context54.sent);

            case 12:
            case "end":
              return _context54.stop();
          }
        }
      }, _callee54);
    }));

    return function (_x145, _x146, _x147) {
      return _ref54.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getMentionsForAccount",
  /*#__PURE__*/
  function () {
    var _ref55 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee55(accountId, filter, dateFrom, dateTo, topicIds, pageToken, limit, sort) {
      var url;
      return regeneratorRuntime.wrap(function _callee55$(_context55) {
        while (1) {
          switch (_context55.prev = _context55.next) {
            case 0:
              if (accountId) {
                _context55.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/inbox/mentions"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                filter: filter,
                date_from: dateFrom,
                date_to: dateTo,
                topic_ids: topicIds,
                page_token: pageToken,
                limit: limit,
                sort: sort
              });
              _context55.next = 6;
              return _this.request(url);

            case 6:
              return _context55.abrupt("return", _context55.sent);

            case 7:
            case "end":
              return _context55.stop();
          }
        }
      }, _callee55);
    }));

    return function (_x148, _x149, _x150, _x151, _x152, _x153, _x154, _x155) {
      return _ref55.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getPublisherServicesAndOptions",
  /*#__PURE__*/
  function () {
    var _ref56 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee56(accountId, type, topicId, mentionId) {
      var url;
      return regeneratorRuntime.wrap(function _callee56$(_context56) {
        while (1) {
          switch (_context56.prev = _context56.next) {
            case 0:
              if (accountId) {
                _context56.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/publisher/add"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                type: type,
                topic_id: topicId,
                mention_id: mentionId
              });
              _context56.next = 6;
              return _this.request(url);

            case 6:
              return _context56.abrupt("return", _context56.sent);

            case 7:
            case "end":
              return _context56.stop();
          }
        }
      }, _callee56);
    }));

    return function (_x156, _x157, _x158, _x159) {
      return _ref56.apply(this, arguments);
    };
  }());

  _defineProperty(this, "updatePublisherServicesAndOptions",
  /*#__PURE__*/
  function () {
    var _ref57 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee57(accountId, services, to, subject, message, status, datePublish, type, topicId, mentionId, media, cannedResponseId) {
      var url, body;
      return regeneratorRuntime.wrap(function _callee57$(_context57) {
        while (1) {
          switch (_context57.prev = _context57.next) {
            case 0:
              if (accountId) {
                _context57.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (services) {
                _context57.next = 4;
                break;
              }

              throw "Please give a JSON encoded array of items with properties 'type' and 'service_id'.";

            case 4:
              url = new URL("/".concat(accountId, "/publisher/add"), EngageApi.baseUrl);
              body = {
                type: type,
                services: services,
                to: to,
                subject: subject,
                message: message,
                status: status,
                date_publish: datePublish,
                topic_id: topicId,
                mention_id: mentionId,
                media: media,
                canned_response_id: cannedResponseId
              };
              _context57.next = 8;
              return _this.request(url, 'post', null, body);

            case 8:
              return _context57.abrupt("return", _context57.sent);

            case 9:
            case "end":
              return _context57.stop();
          }
        }
      }, _callee57);
    }));

    return function (_x160, _x161, _x162, _x163, _x164, _x165, _x166, _x167, _x168, _x169, _x170, _x171) {
      return _ref57.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getPublisherMention",
  /*#__PURE__*/
  function () {
    var _ref58 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee58(accountId, id) {
      var url;
      return regeneratorRuntime.wrap(function _callee58$(_context58) {
        while (1) {
          switch (_context58.prev = _context58.next) {
            case 0:
              if (accountId) {
                _context58.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              if (id) {
                _context58.next = 4;
                break;
              }

              throw 'Please give an publisher mention ID';

            case 4:
              url = new URL("/".concat(accountId, "/publisher/mention/").concat(id), EngageApi.baseUrl);
              _context58.next = 7;
              return _this.request(url);

            case 7:
              return _context58.abrupt("return", _context58.sent);

            case 8:
            case "end":
              return _context58.stop();
          }
        }
      }, _callee58);
    }));

    return function (_x172, _x173) {
      return _ref58.apply(this, arguments);
    };
  }());

  _defineProperty(this, "updatePublisherMention",
  /*#__PURE__*/
  function () {
    var _ref59 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee59(accountId, id, updates) {
      var options,
          url,
          body,
          _args59 = arguments;
      return regeneratorRuntime.wrap(function _callee59$(_context59) {
        while (1) {
          switch (_context59.prev = _context59.next) {
            case 0:
              options = _args59.length > 3 && _args59[3] !== undefined ? _args59[3] : null;

              if (accountId) {
                _context59.next = 3;
                break;
              }

              throw 'Please give an account ID';

            case 3:
              if (id) {
                _context59.next = 5;
                break;
              }

              throw 'Please give an publisher mention ID';

            case 5:
              if (updates) {
                _context59.next = 7;
                break;
              }

              throw 'Please give a JSON encoded array of changes you want to make.';

            case 7:
              url = new URL("/".concat(accountId, "/publisher/mention/").concat(id), EngageApi.baseUrl);
              body = {
                updates: JSON.stringify(updates),
                options: options ? JSON.stringify(options) : null
              };
              _context59.next = 11;
              return _this.request(url, 'post', null, body);

            case 11:
              return _context59.abrupt("return", _context59.sent);

            case 12:
            case "end":
              return _context59.stop();
          }
        }
      }, _callee59);
    }));

    return function (_x174, _x175, _x176) {
      return _ref59.apply(this, arguments);
    };
  }());

  _defineProperty(this, "getPublisherMentions",
  /*#__PURE__*/
  function () {
    var _ref60 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee60(accountId, filter, topicIds, dateFrom, dateTo, pageToken, limit) {
      var url;
      return regeneratorRuntime.wrap(function _callee60$(_context60) {
        while (1) {
          switch (_context60.prev = _context60.next) {
            case 0:
              if (accountId) {
                _context60.next = 2;
                break;
              }

              throw 'Please give an account ID';

            case 2:
              url = new URL("/".concat(accountId, "/publisher/mentions"), EngageApi.baseUrl);
              url = _this.addQueryParams(url, {
                type: filter,
                topic_ids: topicIds,
                date_from: dateFrom,
                date_to: dateTo,
                page_token: pageToken,
                limit: limit
              });
              _context60.next = 6;
              return _this.request(url);

            case 6:
              return _context60.abrupt("return", _context60.sent);

            case 7:
            case "end":
              return _context60.stop();
          }
        }
      }, _callee60);
    }));

    return function (_x177, _x178, _x179, _x180, _x181, _x182, _x183) {
      return _ref60.apply(this, arguments);
    };
  }());

  if (!accessToken) {
    throw 'Access Token is required';
  }

  if (!httpClient) {
    throw 'A valid Http Client is required, use ours, or make one based on ours';
  }

  this.httpClient = httpClient;
  this.accessToken = accessToken;
}
/**
 * Returns the authorization url.
 * @function getAuthorizationUrl
 * @memberOf EngageApi
 * @static
 * @param {object} config - Configuration object
 * @param {string} config.clientId
 * @param {array} config.scope - ex. ['accounts_read', 'accounts_write']
 * @param {string} config.state
 * @returns {string}
 */

/** end Inbox API calls **/
;

_defineProperty(EngageApi, "authorizationUrl", 'https://app.engagor.com/oauth/authorize/');

_defineProperty(EngageApi, "tokenUrl", 'https://app.engagor.com/oauth/access_token/');

_defineProperty(EngageApi, "baseUrl", 'https://api.engagor.com');

_defineProperty(EngageApi, "getAuthorizationUrl", function (_ref61) {
  var clientId = _ref61.clientId,
      scope = _ref61.scope,
      state = _ref61.state;
  var requestUrl = "".concat(EngageApi.authorizationUrl, "?client_id=").concat(clientId, "&response_type=code");

  if (state) {
    requestUrl += "&state=".concat(encodeURIComponent(state));
  }

  if (scope && Array.isArray(scope)) {
    var scopeString = scope.join(' ');
    requestUrl += "&scope=".concat(encodeURIComponent(scopeString));
  }

  return requestUrl;
});

_defineProperty(EngageApi, "getAuthorizationTokenUrl", function (_ref62) {
  var clientId = _ref62.clientId,
      clientSecret = _ref62.clientSecret,
      code = _ref62.code;
  return "".concat(EngageApi.tokenUrl, "?client_id=").concat(clientId, "&client_secret=").concat(clientSecret, "&grant_type=authorization_code&code=").concat(code);
});

_defineProperty(EngageApi, "getRefreshAuthorizationTokenUrl", function (_ref63) {
  var clientId = _ref63.clientId,
      clientSecret = _ref63.clientSecret,
      refreshToken = _ref63.refreshToken;
  return "".concat(EngageApi.tokenUrl, "?client_id=").concat(clientId, "&client_secret=").concat(clientSecret, "&grant_type=refresh_token&refresh_token=").concat(refreshToken);
});

module.exports = EngageApi;
