// Based on react-devtools-core@1.0.6/dist/backend.js
// See the note in src/standalone.js for the rationale and when this file can be removed.
!function(modules) {
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) return installedModules[moduleId].exports;
        var module = installedModules[moduleId] = {
            exports: {},
            id: moduleId,
            loaded: !1
        };
        return modules[moduleId].call(module.exports, module, module.exports, __webpack_require__), 
        module.loaded = !0, module.exports;
    }
    var installedModules = {};
    return __webpack_require__.m = modules, __webpack_require__.c = installedModules, 
    __webpack_require__.p = "", __webpack_require__(0);
}([ function(module, exports, __webpack_require__) {
    "use strict";
    window.performance || (window.performance = {
        now: function() {
            return Date.now();
        }
    });
    var installGlobalHook = __webpack_require__(1);
    installGlobalHook(window);
    var Agent = __webpack_require__(2), Bridge = __webpack_require__(6), inject = __webpack_require__(31), setupRNStyle = __webpack_require__(41), setupRelay = __webpack_require__(42);
    FOR_BACKEND.wall.onClose(function() {
        agent && agent.emit("shutdown"), bridge = null, agent = null, console.log("closing devtools");
    });
    var bridge = new Bridge(FOR_BACKEND.wall), agent = new Agent(window, {
        rnStyle: !!FOR_BACKEND.resolveRNStyle
    });
    agent.addBridge(bridge), FOR_BACKEND.resolveRNStyle && setupRNStyle(bridge, agent, FOR_BACKEND.resolveRNStyle), 
    setupRelay(bridge, agent, window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
    var _connectTimeout = setTimeout(function() {
        console.warn("react-devtools agent got no connection");
    }, 2e4);
    agent.once("connected", function() {
        agent && (inject(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent), clearTimeout(_connectTimeout));
    });
}, function(module, exports) {
    "use strict";
    function installGlobalHook(window) {
        if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            var hook = {
                _renderers: {},
                helpers: {},
                inject: function(renderer) {
                    if ("number" == typeof renderer.version && renderer.version > 1) return null;
                    var id = Math.random().toString(16).slice(2);
                    return hook._renderers[id] = renderer, hook.emit("renderer", {
                        id: id,
                        renderer: renderer
                    }), id;
                },
                _listeners: {},
                sub: function(evt, fn) {
                    return hook.on(evt, fn), function() {
                        return hook.off(evt, fn);
                    };
                },
                on: function(evt, fn) {
                    hook._listeners[evt] || (hook._listeners[evt] = []), hook._listeners[evt].push(fn);
                },
                off: function(evt, fn) {
                    if (hook._listeners[evt]) {
                        var ix = hook._listeners[evt].indexOf(fn);
                        ix !== -1 && hook._listeners[evt].splice(ix, 1), hook._listeners[evt].length || (hook._listeners[evt] = null);
                    }
                },
                emit: function(evt, data) {
                    hook._listeners[evt] && hook._listeners[evt].map(function(fn) {
                        return fn(data);
                    });
                },
                supportsFiber: !0,
                _fiberRoots: {},
                getFiberRoots: function(rendererID) {
                    var roots = hook._fiberRoots;
                    return roots[rendererID] || (roots[rendererID] = new Set()), roots[rendererID];
                },
                onCommitFiberUnmount: function(rendererID, fiber) {
                    hook.helpers[rendererID] && hook.helpers[rendererID].handleCommitFiberUnmount(fiber);
                },
                onCommitFiberRoot: function(rendererID, root) {
                    var mountedRoots = hook.getFiberRoots(rendererID), current = root.current, isKnownRoot = mountedRoots.has(root), isUnmounting = null == current.memoizedState || null == current.memoizedState.element;
                    isKnownRoot || isUnmounting ? isKnownRoot && isUnmounting && mountedRoots["delete"](root) : mountedRoots.add(root), 
                    hook.helpers[rendererID] && hook.helpers[rendererID].handleCommitFiberRoot(root);
                }
            };
            Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
                value: hook
            });
        }
    }
    module.exports = installGlobalHook;
}, function(module, exports, __webpack_require__) {
    "use strict";
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    }
    function _possibleConstructorReturn(self, call) {
        if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return !call || "object" != typeof call && "function" != typeof call ? self : call;
    }
    function _inherits(subClass, superClass) {
        if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: !1,
                writable: !0,
                configurable: !0
            }
        }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass);
    }
    function getIn(base, path) {
        return path.reduce(function(obj, attr) {
            return obj ? obj[attr] : null;
        }, base);
    }
    var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, 
                "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), 
            Constructor;
        };
    }(), _require = __webpack_require__(3), EventEmitter = _require.EventEmitter, assign = __webpack_require__(4), guid = __webpack_require__(5), Agent = function(_EventEmitter) {
        function Agent(global, capabilities) {
            _classCallCheck(this, Agent);
            var _this = _possibleConstructorReturn(this, (Agent.__proto__ || Object.getPrototypeOf(Agent)).call(this));
            _this.global = global, _this.reactElements = new Map(), _this.ids = new WeakMap(), 
            _this.renderers = new Map(), _this.elementData = new Map(), _this.roots = new Set(), 
            _this.reactInternals = {}, _this.on("selected", function(id) {
                var data = _this.elementData.get(id);
                data && data.publicInstance && (_this.global.$r = data.publicInstance);
            }), _this._prevSelected = null, _this._scrollUpdate = !1;
            var isReactDOM = window.document && "function" == typeof window.document.createElement;
            return _this.capabilities = assign({
                scroll: isReactDOM && "function" == typeof window.document.body.scrollIntoView,
                dom: isReactDOM,
                editTextContent: !1
            }, capabilities), isReactDOM && (_this._updateScroll = _this._updateScroll.bind(_this), 
            window.addEventListener("scroll", _this._onScroll.bind(_this), !0)), _this;
        }
        return _inherits(Agent, _EventEmitter), _createClass(Agent, [ {
            key: "sub",
            value: function(ev, fn) {
                var _this2 = this;
                return this.on(ev, fn), function() {
                    _this2.removeListener(ev, fn);
                };
            }
        }, {
            key: "setReactInternals",
            value: function(renderer, reactInternals) {
                this.reactInternals[renderer] = reactInternals;
            }
        }, {
            key: "addBridge",
            value: function(bridge) {
                var _this3 = this;
                bridge.on("requestCapabilities", function() {
                    bridge.send("capabilities", _this3.capabilities), _this3.emit("connected");
                }), bridge.on("setState", this._setState.bind(this)), bridge.on("setProps", this._setProps.bind(this)), 
                bridge.on("setContext", this._setContext.bind(this)), bridge.on("makeGlobal", this._makeGlobal.bind(this)), 
                bridge.on("highlight", function(id) {
                    return _this3.highlight(id);
                }), bridge.on("highlightMany", function(id) {
                    return _this3.highlightMany(id);
                }), bridge.on("hideHighlight", function() {
                    return _this3.emit("hideHighlight");
                }), bridge.on("startInspecting", function() {
                    return _this3.emit("startInspecting");
                }), bridge.on("stopInspecting", function() {
                    return _this3.emit("stopInspecting");
                }), bridge.on("selected", function(id) {
                    return _this3.emit("selected", id);
                }), bridge.on("shutdown", function() {
                    return _this3.emit("shutdown");
                }), bridge.on("changeTextContent", function(_ref) {
                    var id = _ref.id, text = _ref.text, node = _this3.getNodeForID(id);
                    node && (node.textContent = text);
                }), bridge.on("putSelectedNode", function(id) {
                    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$node = _this3.getNodeForID(id);
                }), bridge.on("putSelectedInstance", function(id) {
                    var node = _this3.elementData.get(id);
                    node && node.publicInstance ? window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst = node.publicInstance : window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$inst = null;
                }), bridge.on("checkSelection", function() {
                    var newSelected = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$0;
                    if (newSelected !== _this3._prevSelected) {
                        _this3._prevSelected = newSelected;
                        var sentSelected = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.$node;
                        newSelected !== sentSelected && _this3.selectFromDOMNode(newSelected, !0);
                    }
                }), bridge.on("scrollToNode", function(id) {
                    return _this3.scrollToNode(id);
                }), bridge.on("bananaslugchange", function(value) {
                    return _this3.emit("bananaslugchange", value);
                }), bridge.on("colorizerchange", function(value) {
                    return _this3.emit("colorizerchange", value);
                }), this.on("root", function(id) {
                    return bridge.send("root", id);
                }), this.on("mount", function(data) {
                    return bridge.send("mount", data);
                }), this.on("update", function(data) {
                    return bridge.send("update", data);
                }), this.on("unmount", function(id) {
                    bridge.send("unmount", id), bridge.forget(id);
                }), this.on("setSelection", function(data) {
                    return bridge.send("select", data);
                });
            }
        }, {
            key: "scrollToNode",
            value: function(id) {
                var node = this.getNodeForID(id);
                if (!node) return void console.warn("unable to get the node for scrolling");
                var element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
                return element ? ("function" == typeof element.scrollIntoViewIfNeeded ? element.scrollIntoViewIfNeeded() : "function" == typeof element.scrollIntoView && element.scrollIntoView(), 
                void this.highlight(id)) : void console.warn("unable to get the element for scrolling");
            }
        }, {
            key: "highlight",
            value: function(id) {
                var data = this.elementData.get(id), node = this.getNodeForID(id);
                data && node && this.emit("highlight", {
                    node: node,
                    name: data.name,
                    props: data.props
                });
            }
        }, {
            key: "highlightMany",
            value: function(ids) {
                var _this4 = this, nodes = [];
                ids.forEach(function(id) {
                    var node = _this4.getNodeForID(id);
                    node && nodes.push(node);
                }), nodes.length && this.emit("highlightMany", nodes);
            }
        }, {
            key: "getNodeForID",
            value: function(id) {
                var component = this.reactElements.get(id);
                if (!component) return null;
                var renderer = this.renderers.get(id);
                return renderer && this.reactInternals[renderer].getNativeFromReactElement ? this.reactInternals[renderer].getNativeFromReactElement(component) : null;
            }
        }, {
            key: "selectFromDOMNode",
            value: function(node, quiet) {
                var id = this.getIDForNode(node);
                id && this.emit("setSelection", {
                    id: id,
                    quiet: quiet
                });
            }
        }, {
            key: "selectFromReactInstance",
            value: function(instance, quiet) {
                var id = this.getId(instance);
                return id ? void this.emit("setSelection", {
                    id: id,
                    quiet: quiet
                }) : void console.log("no instance id", instance);
            }
        }, {
            key: "getIDForNode",
            value: function(node) {
                if (!this.reactInternals) return null;
                var component;
                for (var renderer in this.reactInternals) {
                    try {
                        component = this.reactInternals[renderer].getReactElementFromNative(node);
                    } catch (e) {}
                    if (component) return this.getId(component);
                }
                return null;
            }
        }, {
            key: "_setProps",
            value: function(_ref2) {
                var id = _ref2.id, path = _ref2.path, value = _ref2.value, data = this.elementData.get(id);
                data && data.updater && data.updater.setInProps ? data.updater.setInProps(path, value) : console.warn("trying to set props on a component that doesn't support it");
            }
        }, {
            key: "_setState",
            value: function(_ref3) {
                var id = _ref3.id, path = _ref3.path, value = _ref3.value, data = this.elementData.get(id);
                data && data.updater && data.updater.setInState ? data.updater.setInState(path, value) : console.warn("trying to set state on a component that doesn't support it");
            }
        }, {
            key: "_setContext",
            value: function(_ref4) {
                var id = _ref4.id, path = _ref4.path, value = _ref4.value, data = this.elementData.get(id);
                data && data.updater && data.updater.setInContext ? data.updater.setInContext(path, value) : console.warn("trying to set state on a component that doesn't support it");
            }
        }, {
            key: "_makeGlobal",
            value: function(_ref5) {
                var id = _ref5.id, path = _ref5.path, data = this.elementData.get(id);
                if (data) {
                    var value;
                    value = "instance" === path ? data.publicInstance : getIn(data, path), this.global.$tmp = value, 
                    console.log("$tmp =", value);
                }
            }
        }, {
            key: "getId",
            value: function(element) {
                return "object" === ("undefined" == typeof element ? "undefined" : _typeof(element)) && element ? (this.ids.has(element) || (this.ids.set(element, guid()), 
                this.reactElements.set(this.ids.get(element), element)), this.ids.get(element)) : element;
            }
        }, {
            key: "addRoot",
            value: function(renderer, element) {
                var id = this.getId(element);
                this.roots.add(id), this.emit("root", id);
            }
        }, {
            key: "onMounted",
            value: function(renderer, component, data) {
                var _this5 = this, id = this.getId(component);
                this.renderers.set(id, renderer), this.elementData.set(id, data);
                var send = assign({}, data);
                send.children && send.children.map && (send.children = send.children.map(function(c) {
                    return _this5.getId(c);
                })), send.id = id, send.canUpdate = send.updater && !!send.updater.forceUpdate, 
                delete send.type, delete send.updater, this.emit("mount", send);
            }
        }, {
            key: "onUpdated",
            value: function(component, data) {
                var _this6 = this, id = this.getId(component);
                this.elementData.set(id, data);
                var send = assign({}, data);
                send.children && send.children.map && (send.children = send.children.map(function(c) {
                    return _this6.getId(c);
                })), send.id = id, send.canUpdate = send.updater && !!send.updater.forceUpdate, 
                delete send.type, delete send.updater, this.emit("update", send);
            }
        }, {
            key: "onUnmounted",
            value: function(component) {
                var id = this.getId(component);
                this.elementData["delete"](id), this.roots["delete"](id), this.renderers["delete"](id), 
                this.emit("unmount", id), this.ids["delete"](component);
            }
        }, {
            key: "_onScroll",
            value: function() {
                this._scrollUpdate || (this._scrollUpdate = !0, window.requestAnimationFrame(this._updateScroll));
            }
        }, {
            key: "_updateScroll",
            value: function() {
                this.emit("refreshMultiOverlay"), this._scrollUpdate = !1;
            }
        } ]), Agent;
    }(EventEmitter);
    module.exports = Agent;
}, function(module, exports) {
    function EventEmitter() {
        this._events = this._events || {}, this._maxListeners = this._maxListeners || void 0;
    }
    function isFunction(arg) {
        return "function" == typeof arg;
    }
    function isNumber(arg) {
        return "number" == typeof arg;
    }
    function isObject(arg) {
        return "object" == typeof arg && null !== arg;
    }
    function isUndefined(arg) {
        return void 0 === arg;
    }
    module.exports = EventEmitter, EventEmitter.EventEmitter = EventEmitter, EventEmitter.prototype._events = void 0, 
    EventEmitter.prototype._maxListeners = void 0, EventEmitter.defaultMaxListeners = 10, 
    EventEmitter.prototype.setMaxListeners = function(n) {
        if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
        return this._maxListeners = n, this;
    }, EventEmitter.prototype.emit = function(type) {
        var er, handler, len, args, i, listeners;
        if (this._events || (this._events = {}), "error" === type && (!this._events.error || isObject(this._events.error) && !this._events.error.length)) {
            if (er = arguments[1], er instanceof Error) throw er;
            var err = new Error('Uncaught, unspecified "error" event. (' + er + ")");
            throw err.context = er, err;
        }
        if (handler = this._events[type], isUndefined(handler)) return !1;
        if (isFunction(handler)) switch (arguments.length) {
          case 1:
            handler.call(this);
            break;

          case 2:
            handler.call(this, arguments[1]);
            break;

          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;

          default:
            args = Array.prototype.slice.call(arguments, 1), handler.apply(this, args);
        } else if (isObject(handler)) for (args = Array.prototype.slice.call(arguments, 1), 
        listeners = handler.slice(), len = listeners.length, i = 0; i < len; i++) listeners[i].apply(this, args);
        return !0;
    }, EventEmitter.prototype.addListener = function(type, listener) {
        var m;
        if (!isFunction(listener)) throw TypeError("listener must be a function");
        return this._events || (this._events = {}), this._events.newListener && this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener), 
        this._events[type] ? isObject(this._events[type]) ? this._events[type].push(listener) : this._events[type] = [ this._events[type], listener ] : this._events[type] = listener, 
        isObject(this._events[type]) && !this._events[type].warned && (m = isUndefined(this._maxListeners) ? EventEmitter.defaultMaxListeners : this._maxListeners, 
        m && m > 0 && this._events[type].length > m && (this._events[type].warned = !0, 
        console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[type].length), 
        "function" == typeof console.trace && console.trace())), this;
    }, EventEmitter.prototype.on = EventEmitter.prototype.addListener, EventEmitter.prototype.once = function(type, listener) {
        function g() {
            this.removeListener(type, g), fired || (fired = !0, listener.apply(this, arguments));
        }
        if (!isFunction(listener)) throw TypeError("listener must be a function");
        var fired = !1;
        return g.listener = listener, this.on(type, g), this;
    }, EventEmitter.prototype.removeListener = function(type, listener) {
        var list, position, length, i;
        if (!isFunction(listener)) throw TypeError("listener must be a function");
        if (!this._events || !this._events[type]) return this;
        if (list = this._events[type], length = list.length, position = -1, list === listener || isFunction(list.listener) && list.listener === listener) delete this._events[type], 
        this._events.removeListener && this.emit("removeListener", type, listener); else if (isObject(list)) {
            for (i = length; i-- > 0; ) if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                position = i;
                break;
            }
            if (position < 0) return this;
            1 === list.length ? (list.length = 0, delete this._events[type]) : list.splice(position, 1), 
            this._events.removeListener && this.emit("removeListener", type, listener);
        }
        return this;
    }, EventEmitter.prototype.removeAllListeners = function(type) {
        var key, listeners;
        if (!this._events) return this;
        if (!this._events.removeListener) return 0 === arguments.length ? this._events = {} : this._events[type] && delete this._events[type], 
        this;
        if (0 === arguments.length) {
            for (key in this._events) "removeListener" !== key && this.removeAllListeners(key);
            return this.removeAllListeners("removeListener"), this._events = {}, this;
        }
        if (listeners = this._events[type], isFunction(listeners)) this.removeListener(type, listeners); else if (listeners) for (;listeners.length; ) this.removeListener(type, listeners[listeners.length - 1]);
        return delete this._events[type], this;
    }, EventEmitter.prototype.listeners = function(type) {
        var ret;
        return ret = this._events && this._events[type] ? isFunction(this._events[type]) ? [ this._events[type] ] : this._events[type].slice() : [];
    }, EventEmitter.prototype.listenerCount = function(type) {
        if (this._events) {
            var evlistener = this._events[type];
            if (isFunction(evlistener)) return 1;
            if (evlistener) return evlistener.length;
        }
        return 0;
    }, EventEmitter.listenerCount = function(emitter, type) {
        return emitter.listenerCount(type);
    };
}, function(module, exports) {
    "use strict";
    function toObject(val) {
        if (null === val || void 0 === val) throw new TypeError("Object.assign cannot be called with null or undefined");
        return Object(val);
    }
    var hasOwnProperty = Object.prototype.hasOwnProperty, propIsEnumerable = Object.prototype.propertyIsEnumerable;
    module.exports = Object.assign || function(target, source) {
        for (var from, symbols, to = toObject(target), s = 1; s < arguments.length; s++) {
            from = Object(arguments[s]);
            for (var key in from) hasOwnProperty.call(from, key) && (to[key] = from[key]);
            if (Object.getOwnPropertySymbols) {
                symbols = Object.getOwnPropertySymbols(from);
                for (var i = 0; i < symbols.length; i++) propIsEnumerable.call(from, symbols[i]) && (to[symbols[i]] = from[symbols[i]]);
            }
        }
        return to;
    };
}, function(module, exports) {
    "use strict";
    function guid() {
        return "g" + Math.random().toString(16).substr(2);
    }
    module.exports = guid;
}, function(module, exports, __webpack_require__) {
    "use strict";
    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];
            return arr2;
        }
        return Array.from(arr);
    }
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    }
    function getIn(base, path) {
        return path.reduce(function(obj, attr) {
            return obj ? obj[attr] : null;
        }, base);
    }
    var _extends = Object.assign || function(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
        }
        return target;
    }, _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, 
                "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), 
            Constructor;
        };
    }(), consts = __webpack_require__(7), hydrate = __webpack_require__(26), dehydrate = __webpack_require__(27), performanceNow = __webpack_require__(28), lastRunTimeMS = 5, cancelIdleCallback = window.cancelIdleCallback || clearTimeout, requestIdleCallback = window.requestIdleCallback || function(cb, options) {
        var delayMS = 3e3 * lastRunTimeMS;
        return delayMS > 500 && (delayMS = 500), setTimeout(function() {
            var startTime = performanceNow();
            cb({
                didTimeout: !1,
                timeRemaining: function() {
                    return 1 / 0;
                }
            });
            var endTime = performanceNow();
            lastRunTimeMS = (endTime - startTime) / 1e3;
        }, delayMS);
    }, Bridge = function() {
        function Bridge(wall) {
            _classCallCheck(this, Bridge), this._cbs = new Map(), this._inspectables = new Map(), 
            this._cid = 0, this._listeners = {}, this._buffer = [], this._flushHandle = null, 
            this._callers = {}, this._paused = !1, this._wall = wall, wall.listen(this._handleMessage.bind(this));
        }
        return _createClass(Bridge, [ {
            key: "inspect",
            value: function(id, path, cb) {
                var _cid = this._cid++;
                this._cbs.set(_cid, function(data, cleaned, proto, protoclean) {
                    cleaned.length && hydrate(data, cleaned), proto && protoclean.length && hydrate(proto, protoclean), 
                    proto && (data[consts.proto] = proto), cb(data);
                }), this._wall.send({
                    type: "inspect",
                    callback: _cid,
                    path: path,
                    id: id
                });
            }
        }, {
            key: "call",
            value: function(name, args, cb) {
                var _cid = this._cid++;
                this._cbs.set(_cid, cb), this._wall.send({
                    type: "call",
                    callback: _cid,
                    args: args,
                    name: name
                });
            }
        }, {
            key: "onCall",
            value: function(name, handler) {
                if (this._callers[name]) throw new Error("only one call handler per call name allowed");
                this._callers[name] = handler;
            }
        }, {
            key: "pause",
            value: function() {
                this._wall.send({
                    type: "pause"
                });
            }
        }, {
            key: "resume",
            value: function() {
                this._wall.send({
                    type: "resume"
                });
            }
        }, {
            key: "setInspectable",
            value: function(id, data) {
                var prev = this._inspectables.get(id);
                return prev ? void this._inspectables.set(id, _extends({}, prev, data)) : void this._inspectables.set(id, data);
            }
        }, {
            key: "send",
            value: function(evt, data) {
                this._buffer.push({
                    evt: evt,
                    data: data
                }), this.scheduleFlush();
            }
        }, {
            key: "scheduleFlush",
            value: function() {
                if (!this._flushHandle && this._buffer.length) {
                    var timeout = this._paused ? 5e3 : 500;
                    this._flushHandle = requestIdleCallback(this.flushBufferWhileIdle.bind(this), {
                        timeout: timeout
                    });
                }
            }
        }, {
            key: "cancelFlush",
            value: function() {
                this._flushHandle && (cancelIdleCallback(this._flushHandle), this._flushHandle = null);
            }
        }, {
            key: "flushBufferWhileIdle",
            value: function(deadline) {
                this._flushHandle = null;
                for (var chunkCount = this._paused ? 20 : 10, chunkSize = Math.round(this._buffer.length / chunkCount), minChunkSize = this._paused ? 50 : 100; this._buffer.length && (deadline.timeRemaining() > 0 || deadline.didTimeout); ) {
                    var take = Math.min(this._buffer.length, Math.max(minChunkSize, chunkSize)), currentBuffer = this._buffer.splice(0, take);
                    this.flushBufferSlice(currentBuffer);
                }
                this._buffer.length && this.scheduleFlush();
            }
        }, {
            key: "flushBufferSlice",
            value: function(bufferSlice) {
                var _this = this, events = bufferSlice.map(function(_ref) {
                    var evt = _ref.evt, data = _ref.data, cleaned = [], san = dehydrate(data, cleaned);
                    return cleaned.length && _this.setInspectable(data.id, data), {
                        type: "event",
                        evt: evt,
                        data: san,
                        cleaned: cleaned
                    };
                });
                this._wall.send({
                    type: "many-events",
                    events: events
                });
            }
        }, {
            key: "forget",
            value: function(id) {
                this._inspectables["delete"](id);
            }
        }, {
            key: "on",
            value: function(evt, fn) {
                this._listeners[evt] ? this._listeners[evt].push(fn) : this._listeners[evt] = [ fn ];
            }
        }, {
            key: "off",
            value: function(evt, fn) {
                if (this._listeners[evt]) {
                    var ix = this._listeners[evt].indexOf(fn);
                    ix !== -1 && this._listeners[evt].splice(ix, 1);
                }
            }
        }, {
            key: "once",
            value: function(evt, fn) {
                var self = this, listener = function listener() {
                    fn.apply(this, arguments), self.off(evt, listener);
                };
                this.on(evt, listener);
            }
        }, {
            key: "_handleMessage",
            value: function(payload) {
                var _this2 = this;
                if ("resume" === payload.type) return this._paused = !1, void this.scheduleFlush();
                if ("pause" === payload.type) return this._paused = !0, void this.cancelFlush();
                if ("callback" === payload.type) {
                    var callback = this._cbs.get(payload.id);
                    return void (callback && (callback.apply(void 0, _toConsumableArray(payload.args)), 
                    this._cbs["delete"](payload.id)));
                }
                if ("call" === payload.type) return void this._handleCall(payload.name, payload.args, payload.callback);
                if ("inspect" === payload.type) return void this._inspectResponse(payload.id, payload.path, payload.callback);
                if ("event" === payload.type) {
                    payload.cleaned && hydrate(payload.data, payload.cleaned);
                    var fns = this._listeners[payload.evt], data = payload.data;
                    fns && fns.forEach(function(fn) {
                        return fn(data);
                    });
                }
                "many-events" === payload.type && payload.events.forEach(function(event) {
                    event.cleaned && hydrate(event.data, event.cleaned);
                    var handlers = _this2._listeners[event.evt];
                    handlers && handlers.forEach(function(fn) {
                        return fn(event.data);
                    });
                });
            }
        }, {
            key: "_handleCall",
            value: function(name, args, callback) {
                if (!this._callers[name]) return void console.warn('unknown call: "' + name + '"');
                args = Array.isArray(args) ? args : [ args ];
                var result;
                try {
                    result = this._callers[name].apply(null, args);
                } catch (e) {
                    return void console.error("Failed to call", e);
                }
                this._wall.send({
                    type: "callback",
                    id: callback,
                    args: [ result ]
                });
            }
        }, {
            key: "_inspectResponse",
            value: function(id, path, callback) {
                var inspectable = this._inspectables.get(id), result = {}, cleaned = [], proto = null, protoclean = [];
                if (inspectable) {
                    var val = getIn(inspectable, path), protod = !1, isFn = "function" == typeof val;
                    if (Object.getOwnPropertyNames(val).forEach(function(name) {
                        "__proto__" === name && (protod = !0), (!isFn || "arguments" !== name && "callee" !== name && "caller" !== name) && (result[name] = dehydrate(val[name], cleaned, [ name ]));
                    }), !protod && val.__proto__ && "Object" !== val.constructor.name) {
                        var newProto = {}, pIsFn = "function" == typeof val.__proto__;
                        Object.getOwnPropertyNames(val.__proto__).forEach(function(name) {
                            (!pIsFn || "arguments" !== name && "callee" !== name && "caller" !== name) && (newProto[name] = dehydrate(val.__proto__[name], protoclean, [ name ]));
                        }), proto = newProto;
                    }
                }
                this._wall.send({
                    type: "callback",
                    id: callback,
                    args: [ result, cleaned, proto, protoclean ]
                });
            }
        } ]), Bridge;
    }();
    module.exports = Bridge;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var _Symbol = __webpack_require__(8);
    module.exports = {
        name: _Symbol("name"),
        type: _Symbol("type"),
        inspected: _Symbol("inspected"),
        meta: _Symbol("meta"),
        proto: _Symbol("proto")
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = __webpack_require__(9)() ? Symbol : __webpack_require__(10);
}, function(module, exports) {
    "use strict";
    module.exports = function() {
        var symbol;
        if ("function" != typeof Symbol) return !1;
        symbol = Symbol("test symbol");
        try {
            String(symbol);
        } catch (e) {
            return !1;
        }
        return "symbol" == typeof Symbol.iterator || "object" == typeof Symbol.isConcatSpreadable && ("object" == typeof Symbol.iterator && ("object" == typeof Symbol.toPrimitive && ("object" == typeof Symbol.toStringTag && "object" == typeof Symbol.unscopables)));
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var NativeSymbol, SymbolPolyfill, HiddenSymbol, d = __webpack_require__(11), validateSymbol = __webpack_require__(24), create = Object.create, defineProperties = Object.defineProperties, defineProperty = Object.defineProperty, objPrototype = Object.prototype, globalSymbols = create(null);
    "function" == typeof Symbol && (NativeSymbol = Symbol);
    var generateName = function() {
        var created = create(null);
        return function(desc) {
            for (var name, ie11BugWorkaround, postfix = 0; created[desc + (postfix || "")]; ) ++postfix;
            return desc += postfix || "", created[desc] = !0, name = "@@" + desc, defineProperty(objPrototype, name, d.gs(null, function(value) {
                ie11BugWorkaround || (ie11BugWorkaround = !0, defineProperty(this, name, d(value)), 
                ie11BugWorkaround = !1);
            })), name;
        };
    }();
    HiddenSymbol = function(description) {
        if (this instanceof HiddenSymbol) throw new TypeError("TypeError: Symbol is not a constructor");
        return SymbolPolyfill(description);
    }, module.exports = SymbolPolyfill = function Symbol(description) {
        var symbol;
        if (this instanceof Symbol) throw new TypeError("TypeError: Symbol is not a constructor");
        return symbol = create(HiddenSymbol.prototype), description = void 0 === description ? "" : String(description), 
        defineProperties(symbol, {
            __description__: d("", description),
            __name__: d("", generateName(description))
        });
    }, defineProperties(SymbolPolyfill, {
        "for": d(function(key) {
            return globalSymbols[key] ? globalSymbols[key] : globalSymbols[key] = SymbolPolyfill(String(key));
        }),
        keyFor: d(function(s) {
            var key;
            validateSymbol(s);
            for (key in globalSymbols) if (globalSymbols[key] === s) return key;
        }),
        hasInstance: d("", NativeSymbol && NativeSymbol.hasInstance || SymbolPolyfill("hasInstance")),
        isConcatSpreadable: d("", NativeSymbol && NativeSymbol.isConcatSpreadable || SymbolPolyfill("isConcatSpreadable")),
        iterator: d("", NativeSymbol && NativeSymbol.iterator || SymbolPolyfill("iterator")),
        match: d("", NativeSymbol && NativeSymbol.match || SymbolPolyfill("match")),
        replace: d("", NativeSymbol && NativeSymbol.replace || SymbolPolyfill("replace")),
        search: d("", NativeSymbol && NativeSymbol.search || SymbolPolyfill("search")),
        species: d("", NativeSymbol && NativeSymbol.species || SymbolPolyfill("species")),
        split: d("", NativeSymbol && NativeSymbol.split || SymbolPolyfill("split")),
        toPrimitive: d("", NativeSymbol && NativeSymbol.toPrimitive || SymbolPolyfill("toPrimitive")),
        toStringTag: d("", NativeSymbol && NativeSymbol.toStringTag || SymbolPolyfill("toStringTag")),
        unscopables: d("", NativeSymbol && NativeSymbol.unscopables || SymbolPolyfill("unscopables"))
    }), defineProperties(HiddenSymbol.prototype, {
        constructor: d(SymbolPolyfill),
        toString: d("", function() {
            return this.__name__;
        })
    }), defineProperties(SymbolPolyfill.prototype, {
        toString: d(function() {
            return "Symbol (" + validateSymbol(this).__description__ + ")";
        }),
        valueOf: d(function() {
            return validateSymbol(this);
        })
    }), defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d("", function() {
        return validateSymbol(this);
    })), defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d("c", "Symbol")), 
    defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag, d("c", SymbolPolyfill.prototype[SymbolPolyfill.toStringTag])), 
    defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive, d("c", SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));
}, function(module, exports, __webpack_require__) {
    "use strict";
    var d, assign = __webpack_require__(12), normalizeOpts = __webpack_require__(19), isCallable = __webpack_require__(20), contains = __webpack_require__(21);
    d = module.exports = function(dscr, value) {
        var c, e, w, options, desc;
        return arguments.length < 2 || "string" != typeof dscr ? (options = value, value = dscr, 
        dscr = null) : options = arguments[2], null == dscr ? (c = w = !0, e = !1) : (c = contains.call(dscr, "c"), 
        e = contains.call(dscr, "e"), w = contains.call(dscr, "w")), desc = {
            value: value,
            configurable: c,
            enumerable: e,
            writable: w
        }, options ? assign(normalizeOpts(options), desc) : desc;
    }, d.gs = function(dscr, get, set) {
        var c, e, options, desc;
        return "string" != typeof dscr ? (options = set, set = get, get = dscr, dscr = null) : options = arguments[3], 
        null == get ? get = void 0 : isCallable(get) ? null == set ? set = void 0 : isCallable(set) || (options = set, 
        set = void 0) : (options = get, get = set = void 0), null == dscr ? (c = !0, e = !1) : (c = contains.call(dscr, "c"), 
        e = contains.call(dscr, "e")), desc = {
            get: get,
            set: set,
            configurable: c,
            enumerable: e
        }, options ? assign(normalizeOpts(options), desc) : desc;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = __webpack_require__(13)() ? Object.assign : __webpack_require__(14);
}, function(module, exports) {
    "use strict";
    module.exports = function() {
        var obj, assign = Object.assign;
        return "function" == typeof assign && (obj = {
            foo: "raz"
        }, assign(obj, {
            bar: "dwa"
        }, {
            trzy: "trzy"
        }), obj.foo + obj.bar + obj.trzy === "razdwatrzy");
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var keys = __webpack_require__(15), value = __webpack_require__(18), max = Math.max;
    module.exports = function(dest, src) {
        var error, i, assign, l = max(arguments.length, 2);
        for (dest = Object(value(dest)), assign = function(key) {
            try {
                dest[key] = src[key];
            } catch (e) {
                error || (error = e);
            }
        }, i = 1; i < l; ++i) src = arguments[i], keys(src).forEach(assign);
        if (void 0 !== error) throw error;
        return dest;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = __webpack_require__(16)() ? Object.keys : __webpack_require__(17);
}, function(module, exports) {
    "use strict";
    module.exports = function() {
        try {
            return Object.keys("primitive"), !0;
        } catch (e) {
            return !1;
        }
    };
}, function(module, exports) {
    "use strict";
    var keys = Object.keys;
    module.exports = function(object) {
        return keys(null == object ? object : Object(object));
    };
}, function(module, exports) {
    "use strict";
    module.exports = function(value) {
        if (null == value) throw new TypeError("Cannot use null or undefined");
        return value;
    };
}, function(module, exports) {
    "use strict";
    var forEach = Array.prototype.forEach, create = Object.create, process = function(src, obj) {
        var key;
        for (key in src) obj[key] = src[key];
    };
    module.exports = function(options) {
        var result = create(null);
        return forEach.call(arguments, function(options) {
            null != options && process(Object(options), result);
        }), result;
    };
}, function(module, exports) {
    "use strict";
    module.exports = function(obj) {
        return "function" == typeof obj;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = __webpack_require__(22)() ? String.prototype.contains : __webpack_require__(23);
}, function(module, exports) {
    "use strict";
    var str = "razdwatrzy";
    module.exports = function() {
        return "function" == typeof str.contains && (str.contains("dwa") === !0 && str.contains("foo") === !1);
    };
}, function(module, exports) {
    "use strict";
    var indexOf = String.prototype.indexOf;
    module.exports = function(searchString) {
        return indexOf.call(this, searchString, arguments[1]) > -1;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var isSymbol = __webpack_require__(25);
    module.exports = function(value) {
        if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
        return value;
    };
}, function(module, exports) {
    "use strict";
    module.exports = function(x) {
        return x && ("symbol" == typeof x || "Symbol" === x["@@toStringTag"]) || !1;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    function hydrate(data, cleaned) {
        cleaned.forEach(function(path) {
            var last = path.pop(), obj = path.reduce(function(obj_, attr) {
                return obj_ ? obj_[attr] : null;
            }, data);
            if (obj && obj[last]) {
                var replace = {};
                replace[consts.name] = obj[last].name, replace[consts.type] = obj[last].type, replace[consts.meta] = obj[last].meta, 
                replace[consts.inspected] = !1, obj[last] = replace;
            }
        });
    }
    var consts = __webpack_require__(7);
    module.exports = hydrate;
}, function(module, exports) {
    "use strict";
    function dehydrate(data, cleaned, path, level) {
        if (level = level || 0, path = path || [], "function" == typeof data) return cleaned.push(path), 
        {
            name: data.name,
            type: "function"
        };
        if (!data || "object" !== ("undefined" == typeof data ? "undefined" : _typeof(data))) {
            if ("string" == typeof data && data.length > 500) return data.slice(0, 500) + "...";
            var type = "undefined" == typeof data ? "undefined" : _typeof(data);
            return "symbol" === type ? (cleaned.push(path), {
                type: "symbol",
                name: data.toString()
            }) : data;
        }
        if (data._reactFragment) return "A react fragment";
        if (level > 2) return cleaned.push(path), {
            type: Array.isArray(data) ? "array" : "object",
            name: data.constructor && "Object" !== data.constructor.name ? data.constructor.name : "",
            meta: Array.isArray(data) ? {
                length: data.length
            } : null
        };
        if (Array.isArray(data)) return data.map(function(item, i) {
            return dehydrate(item, cleaned, path.concat([ i ]), level + 1);
        });
        if (data.constructor && "function" == typeof data.constructor && "Object" !== data.constructor.name) return cleaned.push(path), 
        {
            name: data.constructor.name,
            type: "object"
        };
        var res = {};
        for (var name in data) res[name] = dehydrate(data[name], cleaned, path.concat([ name ]), level + 1);
        return res;
    }
    var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    module.exports = dehydrate;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var performanceNow, performance = __webpack_require__(29);
    performanceNow = performance.now ? function() {
        return performance.now();
    } : function() {
        return Date.now();
    }, module.exports = performanceNow;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var performance, ExecutionEnvironment = __webpack_require__(30);
    ExecutionEnvironment.canUseDOM && (performance = window.performance || window.msPerformance || window.webkitPerformance), 
    module.exports = performance || {};
}, function(module, exports) {
    "use strict";
    var canUseDOM = !("undefined" == typeof window || !window.document || !window.document.createElement), ExecutionEnvironment = {
        canUseDOM: canUseDOM,
        canUseWorkers: "undefined" != typeof Worker,
        canUseEventListeners: canUseDOM && !(!window.addEventListener && !window.attachEvent),
        canUseViewport: canUseDOM && !!window.screen,
        isInWorker: !canUseDOM
    };
    module.exports = ExecutionEnvironment;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var setupBackend = __webpack_require__(32);
    module.exports = function(hook, agent) {
        var subs = [ hook.sub("renderer-attached", function(_ref) {
            var id = _ref.id, helpers = (_ref.renderer, _ref.helpers);
            agent.setReactInternals(id, helpers), helpers.walkTree(agent.onMounted.bind(agent, id), agent.addRoot.bind(agent, id));
        }), hook.sub("root", function(_ref2) {
            var renderer = _ref2.renderer, element = _ref2.element;
            return agent.addRoot(renderer, element);
        }), hook.sub("mount", function(_ref3) {
            var renderer = _ref3.renderer, element = _ref3.element, data = _ref3.data;
            return agent.onMounted(renderer, element, data);
        }), hook.sub("update", function(_ref4) {
            var element = (_ref4.renderer, _ref4.element), data = _ref4.data;
            return agent.onUpdated(element, data);
        }), hook.sub("unmount", function(_ref5) {
            var element = (_ref5.renderer, _ref5.element);
            return agent.onUnmounted(element);
        }) ], success = setupBackend(hook);
        success && (hook.emit("react-devtools", agent), hook.reactDevtoolsAgent = agent, 
        agent.on("shutdown", function() {
            subs.forEach(function(fn) {
                return fn();
            }), hook.reactDevtoolsAgent = null;
        }));
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var attachRenderer = __webpack_require__(33);
    module.exports = function(hook) {
        var oldReact = window.React && window.React.__internals;
        oldReact && 0 === Object.keys(hook._renderers).length && hook.inject(oldReact);
        for (var rid in hook._renderers) hook.helpers[rid] = attachRenderer(hook, rid, hook._renderers[rid]), 
        hook.emit("renderer-attached", {
            id: rid,
            renderer: hook._renderers[rid],
            helpers: hook.helpers[rid]
        });
        hook.on("renderer", function(_ref) {
            var id = _ref.id, renderer = _ref.renderer;
            hook.helpers[id] = attachRenderer(hook, id, renderer), hook.emit("renderer-attached", {
                id: id,
                renderer: renderer,
                helpers: hook.helpers[id]
            });
        });
        var shutdown = function shutdown() {
            for (var id in hook.helpers) hook.helpers[id].cleanup();
            hook.off("shutdown", shutdown);
        };
        return hook.on("shutdown", shutdown), !0;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    function attachRenderer(hook, rid, renderer) {
        var rootNodeIDMap = new Map(), extras = {}, isPre013 = !renderer.Reconciler;
        if ("function" == typeof renderer.findFiberByHostInstance) return attachRendererFiber(hook, rid, renderer);
        renderer.Mount.findNodeHandle && renderer.Mount.nativeTagToRootNodeID ? (extras.getNativeFromReactElement = function(component) {
            return renderer.Mount.findNodeHandle(component);
        }, extras.getReactElementFromNative = function(nativeTag) {
            var id = renderer.Mount.nativeTagToRootNodeID(nativeTag);
            return rootNodeIDMap.get(id);
        }) : renderer.ComponentTree ? (extras.getNativeFromReactElement = function(component) {
            return renderer.ComponentTree.getNodeFromInstance(component);
        }, extras.getReactElementFromNative = function(node) {
            return renderer.ComponentTree.getClosestInstanceFromNode(node);
        }) : renderer.Mount.getID && renderer.Mount.getNode ? (extras.getNativeFromReactElement = function(component) {
            try {
                return renderer.Mount.getNode(component._rootNodeID);
            } catch (e) {
                return;
            }
        }, extras.getReactElementFromNative = function(node) {
            for (var id = renderer.Mount.getID(node); node && node.parentNode && !id; ) node = node.parentNode, 
            id = renderer.Mount.getID(node);
            return rootNodeIDMap.get(id);
        }) : console.warn("Unknown react version (does not have getID), probably an unshimmed React Native");
        var oldMethods, oldRenderComponent, oldRenderRoot;
        return renderer.Mount._renderNewRootComponent ? oldRenderRoot = decorateResult(renderer.Mount, "_renderNewRootComponent", function(element) {
            hook.emit("root", {
                renderer: rid,
                element: element
            });
        }) : renderer.Mount.renderComponent && (oldRenderComponent = decorateResult(renderer.Mount, "renderComponent", function(element) {
            hook.emit("root", {
                renderer: rid,
                element: element._reactInternalInstance
            });
        })), renderer.Component ? (console.error("You are using a version of React with limited support in this version of the devtools.\nPlease upgrade to use at least 0.13, or you can downgrade to use the old version of the devtools:\ninstructions here https://github.com/facebook/react-devtools/tree/devtools-next#how-do-i-use-this-for-react--013"), 
        oldMethods = decorateMany(renderer.Component.Mixin, {
            mountComponent: function() {
                var _this = this;
                rootNodeIDMap.set(this._rootNodeID, this), setTimeout(function() {
                    hook.emit("mount", {
                        element: _this,
                        data: getData012(_this),
                        renderer: rid
                    });
                }, 0);
            },
            updateComponent: function() {
                var _this2 = this;
                setTimeout(function() {
                    hook.emit("update", {
                        element: _this2,
                        data: getData012(_this2),
                        renderer: rid
                    });
                }, 0);
            },
            unmountComponent: function() {
                hook.emit("unmount", {
                    element: this,
                    renderer: rid
                }), rootNodeIDMap["delete"](this._rootNodeID, this);
            }
        })) : renderer.Reconciler && (oldMethods = decorateMany(renderer.Reconciler, {
            mountComponent: function(element, rootID, transaction, context) {
                var data = getData(element);
                rootNodeIDMap.set(element._rootNodeID, element), hook.emit("mount", {
                    element: element,
                    data: data,
                    renderer: rid
                });
            },
            performUpdateIfNecessary: function(element, nextChild, transaction, context) {
                hook.emit("update", {
                    element: element,
                    data: getData(element),
                    renderer: rid
                });
            },
            receiveComponent: function(element, nextChild, transaction, context) {
                hook.emit("update", {
                    element: element,
                    data: getData(element),
                    renderer: rid
                });
            },
            unmountComponent: function(element) {
                hook.emit("unmount", {
                    element: element,
                    renderer: rid
                }), rootNodeIDMap["delete"](element._rootNodeID, element);
            }
        })), extras.walkTree = function(visit, visitRoot) {
            var onMount = function(component, data) {
                rootNodeIDMap.set(component._rootNodeID, component), visit(component, data);
            };
            walkRoots(renderer.Mount._instancesByReactRootID || renderer.Mount._instancesByContainerID, onMount, visitRoot, isPre013);
        }, extras.cleanup = function() {
            oldMethods && (renderer.Component ? restoreMany(renderer.Component.Mixin, oldMethods) : restoreMany(renderer.Reconciler, oldMethods)), 
            oldRenderRoot && (renderer.Mount._renderNewRootComponent = oldRenderRoot), oldRenderComponent && (renderer.Mount.renderComponent = oldRenderComponent), 
            oldMethods = null, oldRenderRoot = null, oldRenderComponent = null;
        }, extras;
    }
    function walkRoots(roots, onMount, onRoot, isPre013) {
        for (var name in roots) walkNode(roots[name], onMount, isPre013), onRoot(roots[name]);
    }
    function walkNode(element, onMount, isPre013) {
        var data = isPre013 ? getData012(element) : getData(element);
        data.children && Array.isArray(data.children) && data.children.forEach(function(child) {
            return walkNode(child, onMount, isPre013);
        }), onMount(element, data);
    }
    function decorateResult(obj, attr, fn) {
        var old = obj[attr];
        return obj[attr] = function(instance) {
            var res = old.apply(this, arguments);
            return fn(res), res;
        }, old;
    }
    function decorate(obj, attr, fn) {
        var old = obj[attr];
        return obj[attr] = function(instance) {
            var res = old.apply(this, arguments);
            return fn.apply(this, arguments), res;
        }, old;
    }
    function decorateMany(source, fns) {
        var olds = {};
        for (var name in fns) olds[name] = decorate(source, name, fns[name]);
        return olds;
    }
    function restoreMany(source, olds) {
        for (var name in olds) source[name] = olds[name];
    }
    var getData = __webpack_require__(34), getData012 = __webpack_require__(37), attachRendererFiber = __webpack_require__(38);
    module.exports = attachRenderer;
}, function(module, exports, __webpack_require__) {
    "use strict";
    function getData(element) {
        var children = null, props = null, state = null, context = null, updater = null, name = null, type = null, key = null, ref = null, source = null, text = null, publicInstance = null, nodeType = "Native";
        if ("object" !== ("undefined" == typeof element ? "undefined" : _typeof(element)) ? (nodeType = "Text", 
        text = element + "") : null === element._currentElement || element._currentElement === !1 ? nodeType = "Empty" : element._renderedComponent ? (nodeType = "NativeWrapper", 
        children = [ element._renderedComponent ], props = element._instance.props, state = element._instance.state, 
        context = element._instance.context, context && 0 === Object.keys(context).length && (context = null)) : element._renderedChildren ? children = childrenList(element._renderedChildren) : element._currentElement && element._currentElement.props && (children = element._currentElement.props.children), 
        !props && element._currentElement && element._currentElement.props && (props = element._currentElement.props), 
        null != element._currentElement && (type = element._currentElement.type, element._currentElement.key && (key = String(element._currentElement.key)), 
        source = element._currentElement._source, ref = element._currentElement.ref, "string" == typeof type ? name = type : element.getName ? (nodeType = "Composite", 
        name = element.getName(), element._renderedComponent && (element._currentElement.props === element._renderedComponent._currentElement || element._currentElement.type.isReactTopLevelWrapper) && (nodeType = "Wrapper"), 
        null === name && (name = "No display name")) : "string" == typeof element._stringText ? (nodeType = "Text", 
        text = element._stringText) : name = getDisplayName(type)), element._instance) {
            var inst = element._instance;
            updater = {
                setState: inst.setState && inst.setState.bind(inst),
                forceUpdate: inst.forceUpdate && inst.forceUpdate.bind(inst),
                setInProps: inst.forceUpdate && setInProps.bind(null, element),
                setInState: inst.forceUpdate && setInState.bind(null, inst),
                setInContext: inst.forceUpdate && setInContext.bind(null, inst)
            }, publicInstance = inst, inst._renderedChildren && (children = childrenList(inst._renderedChildren));
        }
        return {
            nodeType: nodeType,
            type: type,
            key: key,
            ref: ref,
            source: source,
            name: name,
            props: props,
            state: state,
            context: context,
            children: children,
            text: text,
            updater: updater,
            publicInstance: publicInstance
        };
    }
    function setInProps(internalInst, path, value) {
        var element = internalInst._currentElement;
        internalInst._currentElement = _extends({}, element, {
            props: copyWithSet(element.props, path, value)
        }), internalInst._instance.forceUpdate();
    }
    function setInState(inst, path, value) {
        setIn(inst.state, path, value), inst.forceUpdate();
    }
    function setInContext(inst, path, value) {
        setIn(inst.context, path, value), inst.forceUpdate();
    }
    function setIn(obj, path, value) {
        var last = path.pop(), parent = path.reduce(function(obj_, attr) {
            return obj_ ? obj_[attr] : null;
        }, obj);
        parent && (parent[last] = value);
    }
    function childrenList(children) {
        var res = [];
        for (var name in children) res.push(children[name]);
        return res;
    }
    var _extends = Object.assign || function(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
        }
        return target;
    }, _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, copyWithSet = __webpack_require__(35), getDisplayName = __webpack_require__(36);
    module.exports = getData;
}, function(module, exports) {
    "use strict";
    function copyWithSetImpl(obj, path, idx, value) {
        if (idx >= path.length) return value;
        var key = path[idx], updated = Array.isArray(obj) ? obj.slice() : _extends({}, obj);
        return updated[key] = copyWithSetImpl(obj[key], path, idx + 1, value), updated;
    }
    function copyWithSet(obj, path, value) {
        return copyWithSetImpl(obj, path, 0, value);
    }
    var _extends = Object.assign || function(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
        }
        return target;
    };
    module.exports = copyWithSet;
}, function(module, exports) {
    "use strict";
    function getDisplayName(type) {
        if (cachedDisplayNames.has(type)) return cachedDisplayNames.get(type);
        var displayName = type.displayName || type.name || "Unknown", match = displayName.match(FB_MODULE_RE);
        if (match) {
            var componentName = match[1], moduleName = match[2];
            componentName && moduleName && (moduleName === componentName || moduleName.startsWith(componentName + ".")) && (displayName = componentName);
        }
        return cachedDisplayNames.set(type, displayName), displayName;
    }
    var FB_MODULE_RE = /^(.*) \[from (.*)\]$/, cachedDisplayNames = new WeakMap();
    module.exports = getDisplayName;
}, function(module, exports, __webpack_require__) {
    "use strict";
    function getData012(element) {
        var children = null, props = element.props, state = element.state, context = element.context, updater = null, name = null, type = null, key = null, ref = null, text = null, publicInstance = null, nodeType = "Native";
        return element._renderedComponent ? (nodeType = "Wrapper", children = [ element._renderedComponent ], 
        context && 0 === Object.keys(context).length && (context = null)) : element._renderedChildren ? (name = element.constructor.displayName, 
        children = childrenList(element._renderedChildren)) : "string" == typeof props.children && (name = element.constructor.displayName, 
        children = props.children, nodeType = "Native"), !props && element._currentElement && element._currentElement.props && (props = element._currentElement.props), 
        element._currentElement && (type = element._currentElement.type, element._currentElement.key && (key = String(element._currentElement.key)), 
        ref = element._currentElement.ref, "string" == typeof type ? name = type : (nodeType = "Composite", 
        name = type.displayName, name || (name = "No display name"))), name || (name = element.constructor.displayName || "No display name", 
        nodeType = "Composite"), "string" == typeof props && (nodeType = "Text", text = props, 
        props = null, name = null), element.forceUpdate && (updater = {
            setState: element.setState.bind(element),
            forceUpdate: element.forceUpdate.bind(element),
            setInProps: element.forceUpdate && setInProps.bind(null, element),
            setInState: element.forceUpdate && setInState.bind(null, element),
            setInContext: element.forceUpdate && setInContext.bind(null, element)
        }, publicInstance = element), {
            nodeType: nodeType,
            type: type,
            key: key,
            ref: ref,
            source: null,
            name: name,
            props: props,
            state: state,
            context: context,
            children: children,
            text: text,
            updater: updater,
            publicInstance: publicInstance
        };
    }
    function setInProps(inst, path, value) {
        inst.props = copyWithSet(inst.props, path, value), inst.forceUpdate();
    }
    function setInState(inst, path, value) {
        setIn(inst.state, path, value), inst.forceUpdate();
    }
    function setInContext(inst, path, value) {
        setIn(inst.context, path, value), inst.forceUpdate();
    }
    function setIn(obj, path, value) {
        var last = path.pop(), parent = path.reduce(function(obj_, attr) {
            return obj_ ? obj_[attr] : null;
        }, obj);
        parent && (parent[last] = value);
    }
    function childrenList(children) {
        var res = [];
        for (var name in children) res.push(children[name]);
        return res;
    }
    var copyWithSet = __webpack_require__(35);
    module.exports = getData012;
}, function(module, exports, __webpack_require__) {
    "use strict";
    function attachRendererFiber(hook, rid, renderer) {
        function getOpaqueNode(fiber) {
            if (opaqueNodes.has(fiber)) return fiber;
            var alternate = fiber.alternate;
            return null != alternate && opaqueNodes.has(alternate) ? alternate : (opaqueNodes.add(fiber), 
            fiber);
        }
        function hasDataChanged(prevFiber, nextFiber) {
            if (prevFiber.tag === ClassComponent) {
                if (prevFiber.stateNode.context !== nextFiber.stateNode.context) return !0;
                if (null != nextFiber.updateQueue && nextFiber.updateQueue.hasForceUpdate) return !0;
            }
            return prevFiber.memoizedProps !== nextFiber.memoizedProps || prevFiber.memoizedState !== nextFiber.memoizedState || prevFiber.ref !== nextFiber.ref || prevFiber._debugSource !== nextFiber._debugSource;
        }
        function flushPendingEvents() {
            var events = pendingEvents;
            pendingEvents = [];
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                hook.emit(event.type, event);
            }
        }
        function enqueueMount(fiber) {
            pendingEvents.push({
                element: getOpaqueNode(fiber),
                data: getDataFiber(fiber, getOpaqueNode),
                renderer: rid,
                type: "mount"
            });
            var isRoot = fiber.tag === HostRoot;
            isRoot && pendingEvents.push({
                element: getOpaqueNode(fiber),
                renderer: rid,
                type: "root"
            });
        }
        function enqueueUpdateIfNecessary(fiber, hasChildOrderChanged) {
            (hasChildOrderChanged || hasDataChanged(fiber.alternate, fiber)) && pendingEvents.push({
                element: getOpaqueNode(fiber),
                data: getDataFiber(fiber, getOpaqueNode),
                renderer: rid,
                type: "update"
            });
        }
        function enqueueUnmount(fiber) {
            var isRoot = fiber.tag === HostRoot, opaqueNode = getOpaqueNode(fiber), event = {
                element: opaqueNode,
                renderer: rid,
                type: "unmount"
            };
            isRoot ? pendingEvents.push(event) : pendingEvents.unshift(event), opaqueNodes["delete"](opaqueNode);
        }
        function mountFiber(fiber) {
            var node = fiber;
            outer: for (;;) if (node.child) node.child["return"] = node, node = node.child; else {
                if (enqueueMount(node), node == fiber) return;
                if (!node.sibling) {
                    for (;node["return"]; ) {
                        if (node = node["return"], enqueueMount(node), node == fiber) return;
                        if (node.sibling) {
                            node.sibling["return"] = node["return"], node = node.sibling;
                            continue outer;
                        }
                    }
                    return;
                }
                node.sibling["return"] = node["return"], node = node.sibling;
            }
        }
        function updateFiber(nextFiber, prevFiber) {
            var hasChildOrderChanged = !1;
            if (nextFiber.child !== prevFiber.child) {
                for (var nextChild = nextFiber.child, prevChildAtSameIndex = prevFiber.child; nextChild; ) {
                    if (nextChild.alternate) {
                        var prevChild = nextChild.alternate;
                        updateFiber(nextChild, prevChild), hasChildOrderChanged || prevChild === prevChildAtSameIndex || (hasChildOrderChanged = !0);
                    } else mountFiber(nextChild), hasChildOrderChanged || (hasChildOrderChanged = !0);
                    nextChild = nextChild.sibling, hasChildOrderChanged || null == prevChildAtSameIndex || (prevChildAtSameIndex = prevChildAtSameIndex.sibling);
                }
                hasChildOrderChanged || null == prevChildAtSameIndex || (hasChildOrderChanged = !0);
            }
            enqueueUpdateIfNecessary(nextFiber, hasChildOrderChanged);
        }
        function walkTree() {
            hook.getFiberRoots(rid).forEach(function(root) {
                mountFiber(root.current);
            }), flushPendingEvents();
        }
        function cleanup() {}
        function handleCommitFiberUnmount(fiber) {
            enqueueUnmount(fiber);
        }
        function handleCommitFiberRoot(root) {
            var current = root.current, alternate = current.alternate;
            if (alternate) {
                var wasMounted = null != alternate.memoizedState && null != alternate.memoizedState.element, isMounted = null != current.memoizedState && null != current.memoizedState.element;
                !wasMounted && isMounted ? mountFiber(current) : wasMounted && isMounted ? updateFiber(current, alternate) : wasMounted && !isMounted && enqueueUnmount(current);
            } else mountFiber(current);
            flushPendingEvents();
        }
        function getNativeFromReactElement(fiber) {
            try {
                var opaqueNode = fiber, hostInstance = renderer.findHostInstanceByFiber(opaqueNode);
                return hostInstance;
            } catch (err) {
                return null;
            }
        }
        function getReactElementFromNative(hostInstance) {
            var fiber = renderer.findFiberByHostInstance(hostInstance);
            if (null != fiber) {
                var opaqueNode = getOpaqueNode(fiber);
                return opaqueNode;
            }
            return null;
        }
        var opaqueNodes = new Set(), pendingEvents = [];
        return {
            getNativeFromReactElement: getNativeFromReactElement,
            getReactElementFromNative: getReactElementFromNative,
            handleCommitFiberRoot: handleCommitFiberRoot,
            handleCommitFiberUnmount: handleCommitFiberUnmount,
            cleanup: cleanup,
            walkTree: walkTree
        };
    }
    var getDataFiber = __webpack_require__(39), _require = __webpack_require__(40), ClassComponent = _require.ClassComponent, HostRoot = _require.HostRoot;
    module.exports = attachRendererFiber;
}, function(module, exports, __webpack_require__) {
    "use strict";
    function getDataFiber(fiber, getOpaqueNode) {
        var type = fiber.type, key = fiber.key, ref = fiber.ref, source = fiber._debugSource, publicInstance = null, props = null, state = null, children = null, context = null, updater = null, nodeType = null, name = null, text = null;
        switch (fiber.tag) {
          case FunctionalComponent:
          case ClassComponent:
            nodeType = "Composite", name = getDisplayName(fiber.type), publicInstance = fiber.stateNode, 
            props = fiber.memoizedProps, state = fiber.memoizedState, null != publicInstance && (context = publicInstance.context, 
            context && 0 === Object.keys(context).length && (context = null));
            var inst = publicInstance;
            inst && (updater = {
                setState: inst.setState && inst.setState.bind(inst),
                forceUpdate: inst.forceUpdate && inst.forceUpdate.bind(inst),
                setInProps: inst.forceUpdate && setInProps.bind(null, fiber),
                setInState: inst.forceUpdate && setInState.bind(null, inst),
                setInContext: inst.forceUpdate && setInContext.bind(null, inst)
            }), children = [];
            break;

          case HostRoot:
            nodeType = "Wrapper", children = [];
            break;

          case HostPortal:
            nodeType = "Portal", name = "ReactPortal", props = {
                target: fiber.stateNode.containerInfo
            }, children = [];
            break;

          case HostComponent:
            nodeType = "Native", name = fiber.type, props = fiber.memoizedProps, children = "string" == typeof props.children || "number" == typeof props.children ? props.children.toString() : [];
            break;

          case HostText:
            nodeType = "Text", text = fiber.memoizedProps;
            break;

          case Fragment:
            nodeType = "Wrapper", children = [];
            break;

          default:
            nodeType = "Native", props = fiber.memoizedProps, name = "TODO_NOT_IMPLEMENTED_YET", 
            children = [];
        }
        if (Array.isArray(children)) for (var child = fiber.child; child; ) children.push(getOpaqueNode(child)), 
        child = child.sibling;
        return {
            nodeType: nodeType,
            type: type,
            key: key,
            ref: ref,
            source: source,
            name: name,
            props: props,
            state: state,
            context: context,
            children: children,
            text: text,
            updater: updater,
            publicInstance: publicInstance
        };
    }
    function setInProps(fiber, path, value) {
        fiber.pendingProps = copyWithSet(fiber.memoizedProps, path, value), fiber.stateNode.forceUpdate();
    }
    function setInState(inst, path, value) {
        setIn(inst.state, path, value), inst.forceUpdate();
    }
    function setInContext(inst, path, value) {
        setIn(inst.context, path, value), inst.forceUpdate();
    }
    function setIn(obj, path, value) {
        var last = path.pop(), parent = path.reduce(function(obj_, attr) {
            return obj_ ? obj_[attr] : null;
        }, obj);
        parent && (parent[last] = value);
    }
    var copyWithSet = __webpack_require__(35), getDisplayName = __webpack_require__(36), _require = __webpack_require__(40), FunctionalComponent = _require.FunctionalComponent, ClassComponent = _require.ClassComponent, HostRoot = _require.HostRoot, HostPortal = _require.HostPortal, HostComponent = _require.HostComponent, HostText = _require.HostText, Fragment = _require.Fragment;
    module.exports = getDataFiber;
}, function(module, exports) {
    "use strict";
    module.exports = {
        IndeterminateComponent: 0,
        FunctionalComponent: 1,
        ClassComponent: 2,
        HostRoot: 3,
        HostPortal: 4,
        HostComponent: 5,
        HostText: 6,
        CoroutineComponent: 7,
        CoroutineHandlerPhase: 8,
        YieldComponent: 9,
        Fragment: 10
    };
}, function(module, exports) {
    "use strict";
    function _defineProperty(obj, key, value) {
        return key in obj ? Object.defineProperty(obj, key, {
            value: value,
            enumerable: !0,
            configurable: !0,
            writable: !0
        }) : obj[key] = value, obj;
    }
    function shallowClone(obj) {
        var nobj = {};
        for (var n in obj) nobj[n] = obj[n];
        return nobj;
    }
    function renameStyle(agent, id, oldName, newName, val) {
        var data = agent.elementData.get(id), newStyle = _defineProperty({}, newName, val);
        if (!data || !data.updater || !data.updater.setInProps) {
            var el = agent.reactElements.get(id);
            return void (el && el.setNativeProps ? el.setNativeProps({
                style: newStyle
            }) : console.error("Unable to set style for this element... (no forceUpdate or setNativeProps)"));
        }
        var customStyle, style = data && data.props && data.props.style;
        Array.isArray(style) ? "object" !== _typeof(style[style.length - 1]) || Array.isArray(style[style.length - 1]) ? (style = style.concat([ newStyle ]), 
        data.updater.setInProps([ "style" ], style)) : (customStyle = shallowClone(style[style.length - 1]), 
        delete customStyle[oldName], customStyle[newName] = val, data.updater.setInProps([ "style", style.length - 1 ], customStyle)) : "object" === ("undefined" == typeof style ? "undefined" : _typeof(style)) ? (customStyle = shallowClone(style), 
        delete customStyle[oldName], customStyle[newName] = val, data.updater.setInProps([ "style" ], customStyle)) : (style = [ style, newStyle ], 
        data.updater.setInProps([ "style" ], style)), agent.emit("hideHighlight");
    }
    function setStyle(agent, id, attr, val) {
        var data = agent.elementData.get(id), newStyle = _defineProperty({}, attr, val);
        if (!data || !data.updater || !data.updater.setInProps) {
            var el = agent.reactElements.get(id);
            return void (el && el.setNativeProps ? el.setNativeProps({
                style: newStyle
            }) : console.error("Unable to set style for this element... (no forceUpdate or setNativeProps)"));
        }
        var style = data.props && data.props.style;
        Array.isArray(style) ? "object" !== _typeof(style[style.length - 1]) || Array.isArray(style[style.length - 1]) ? (style = style.concat([ newStyle ]), 
        data.updater.setInProps([ "style" ], style)) : data.updater.setInProps([ "style", style.length - 1, attr ], val) : (style = [ style, newStyle ], 
        data.updater.setInProps([ "style" ], style)), agent.emit("hideHighlight");
    }
    var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    module.exports = function(bridge, agent, resolveRNStyle) {
        bridge.onCall("rn-style:get", function(id) {
            var node = agent.elementData.get(id);
            return node && node.props ? resolveRNStyle(node.props.style) : null;
        }), bridge.on("rn-style:rename", function(_ref) {
            var id = _ref.id, oldName = _ref.oldName, newName = _ref.newName, val = _ref.val;
            renameStyle(agent, id, oldName, newName, val);
        }), bridge.on("rn-style:set", function(_ref2) {
            var id = _ref2.id, attr = _ref2.attr, val = _ref2.val;
            setStyle(agent, id, attr, val);
        });
    };
}, function(module, exports) {
    "use strict";
    function decorate(obj, attr, fn) {
        var old = obj[attr];
        return obj[attr] = function() {
            var res = old.apply(this, arguments);
            return fn.apply(this, arguments), res;
        }, function() {
            obj[attr] = old;
        };
    }
    var subscriptionEnabled = !1;
    module.exports = function(bridge, agent, hook) {
        function sendStoreData() {
            subscriptionEnabled && bridge.send("relay:store", {
                id: "relay:store",
                nodes: DefaultStoreData.getNodeData()
            });
        }
        var shouldEnable = !!hook._relayInternals;
        if (bridge.onCall("relay:check", function() {
            return shouldEnable;
        }), shouldEnable) {
            var _hook$_relayInternals = hook._relayInternals, DefaultStoreData = _hook$_relayInternals.DefaultStoreData, setRequestListener = _hook$_relayInternals.setRequestListener;
            bridge.onCall("relay:store:enable", function() {
                subscriptionEnabled = !0, sendStoreData();
            }), bridge.onCall("relay:store:disable", function() {
                subscriptionEnabled = !1;
            }), sendStoreData(), decorate(DefaultStoreData, "handleUpdatePayload", sendStoreData), 
            decorate(DefaultStoreData, "handleQueryPayload", sendStoreData);
            var removeListener = setRequestListener(function(event, data) {
                bridge.send(event, data);
            });
            hook.on("shutdown", removeListener);
        }
    };
} ]);
//# sourceMappingURL=backend.js.map
