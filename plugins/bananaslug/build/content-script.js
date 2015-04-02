/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var Fetcher = __webpack_require__(1);
	var MessageType = __webpack_require__(2);
	var Presenter = __webpack_require__(3);
	var ScriptInjector = __webpack_require__(4);

	function onReactDevToolSuccess() {
	  ScriptInjector.subscribe(MessageType.REACT_RUNERTIME_READY, onReactRuntimeReady);

	  ScriptInjector.subscribe(MessageType.REACT_COMPONENTS_DID_UPDATE, onReactComponentsUpdate);

	  ScriptInjector.inject("injected_scripts_prelude");
	}

	function onReactDevToolFail() {
	  console.info("Please download \"React Developer Tools\" so that this Bunanaslug " + "extension can work properly. " + "http://goo.gl/lOauXS");
	}

	function onReactRuntimeReady() {
	  ScriptInjector.inject("injected_scripts_main");
	}

	/**
	 * @paran {string} type
	 * @param {Object} batchedInfo
	 */
	function onReactComponentsUpdate(type, batchedInfo) {
	  Presenter.batchUpdate(batchedInfo);
	}

	function main() {
	  var REACT_DEV_TOOL_EXTENSION_ID = "fmkadmapgofadopljbjfkapdkoienihi";
	  Fetcher.fetchRemote(REACT_DEV_TOOL_EXTENSION_ID, "views/devpanel.html").then(onReactDevToolSuccess)["catch"](onReactDevToolFail);
	}

	main();

	module.exports = {};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The Fetcher file.
	 */

	/**
	 * @type {object}
	 */
	"use strict";

	var _cache = {};

	/**
	 * @param {string} uri
	 * @param {Function} callback
	 * @param {Function} errorback
	 */
	function fetchInternal(uri, callback, errorback) {
	  var _callback = callback;

	  if (_cache[uri]) {
	    callback(_cache[uri]);
	    return;
	  }

	  var onload = function () {
	    if (xhr.status !== 200) {
	      onerror();
	      return;
	    }

	    var responseText = xhr.responseText;
	    _cache[uri] = responseText;

	    callback(responseText);

	    xhr.onload = null;
	    xhr.onerror = null;
	    xhr = null;
	    callback = null;
	  };

	  var onerror = function () {
	    var msg = "Unable to inject script for \"" + uri + "\"";
	    errorback(msg);
	  };

	  var xhr = new XMLHttpRequest();
	  xhr.onload = onload;
	  xhr.onerror = onerror;
	  xhr.open("GET", uri, true);
	  xhr.send();
	}

	/**
	 * @param {string} relPath
	 * @return {Object}
	 */
	function fetch(name) {
	  var uri = "chrome-extension://" + chrome.runtime.id + "/js/" + name + ".bundle.js";

	  return new Promise(function (resolve, reject) {
	    fetchInternal(uri, resolve, reject);
	  });;
	}

	/**
	 * @param {string} extensionID
	 * @param {string} relPath
	 * @return {Object}
	 */
	function fetchRemote(extensionID, relPath) {
	  var uri = "chrome-extension://" + extensionID + "/" + relPath;
	  return new Promise(function (resolve, reject) {
	    fetchInternal(uri, resolve, reject);
	  });;
	}

	var Fetcher = {
	  fetch: fetch,
	  fetchRemote: fetchRemote
	};

	module.exports = Fetcher;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var MessageType = {
	  REACT_RUNERTIME_READY: "REACT_RUNERTIME_READY",
	  REACT_COMPONENTS_DID_UPDATE: "REACT_COMPONENTS_DID_UPDATE" };

	module.exports = MessageType;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * The Presenter file.
	 */

	"use strict";

	var DURATION = 500;
	var OUTLINE_COLOR = "#f0f0f0";
	var COLORS = [
	// coolest
	"#55cef6", "#55f67b", "#a5f655", "#f4f655", "#f6a555", "#f66855",
	// hottest
	"#ff0000"];
	var LAST_COLOR = COLORS[COLORS.length - 1];

	var _canvas;
	var _queue = {};
	var _isPainting = false;

	/**
	 * @param {Object} batchedInfo
	 */
	function batchUpdate(batchedInfo) {
	  for (var bid in batchedInfo) {
	    if (batchedInfo.hasOwnProperty(bid)) {
	      var info = batchedInfo[bid];
	      var reactid = info.reactid;
	      var meta;
	      if (_queue.hasOwnProperty(reactid)) {
	        meta = _queue[reactid];
	      } else {
	        meta = {
	          update_count: 0
	        };
	      }

	      meta.update_count++;
	      meta.update_info = info;
	      meta.expire_time = Date.now() + DURATION;
	      _queue[reactid] = meta;
	    }
	  }

	  paint();

	  // Clean up expired rect.
	  setTimeout(paint, DURATION + 1);
	}

	function paint() {
	  requestAnimationFrame(paintImmediate);
	}

	function paintImmediate() {
	  if (!_canvas) {
	    _canvas = injectCanvas();
	  }

	  if (_isPainting) {
	    return;
	  }

	  _isPainting = true;

	  var ctx = _canvas.getContext("2d");
	  ctx.clearRect(0, 0, _canvas.width, _canvas.height);

	  var now = Date.now();
	  var meta;

	  for (var reactid in _queue) {
	    if (!_queue.hasOwnProperty(reactid)) {
	      return;
	    }
	    meta = _queue[reactid];
	    if (meta.expire_time > now) {
	      paintMeta(ctx, meta);
	    } else {
	      delete _queue[reactid];
	    }
	  }

	  painIcon(ctx);
	  _isPainting = false;
	}

	/**
	 * @param {Object} ctx
	 */
	function painIcon(ctx) {
	  var info = {
	    height: 20,
	    left: 2,
	    top: 2,
	    width: 20
	  };

	  ctx.lineWidth = 1;
	  ctx.strokeStyle = "#beb821";
	  ctx.fillStyle = "#f6f055";

	  ctx.fillRect(info.left, info.top, info.width, info.height);

	  ctx.strokeStyle = "#beb821";
	  ctx.strokeRect(info.left, info.top, info.width, info.height);

	  ctx.fillStyle = "#444";
	  ctx.font = "12px Verdana";
	  ctx.fillText("B", 7, 16);
	}

	/**
	 * @param {Object} ctx
	 * @param {Object} meta
	 */
	function paintMeta(ctx, meta) {
	  var info = meta.update_info;
	  var color = COLORS[meta.update_count - 1] || LAST_COLOR;
	  paintBorder(ctx, info, 2, color);
	}

	/**
	 * @param {Object} ctx
	 * @param {Object} meta
	 */
	function paintBorder(ctx, info, borderWidth, borderColor) {
	  // outline
	  ctx.lineWidth = 1;
	  ctx.strokeStyle = OUTLINE_COLOR;

	  ctx.strokeRect(info.left - 1, info.top - 1, info.width + 2, info.height + 2);

	  // inset
	  ctx.lineWidth = 1;
	  ctx.strokeStyle = OUTLINE_COLOR;
	  ctx.strokeRect(info.left + borderWidth, info.top + borderWidth, info.width - borderWidth, info.height - borderWidth);
	  ctx.strokeStyle = borderColor;

	  if (info.should_update) {
	    ctx.setLineDash([2]);
	  } else {
	    ctx.setLineDash([0]);
	  }

	  // border
	  ctx.lineWidth = "" + borderWidth;
	  ctx.strokeRect(info.left + Math.floor(borderWidth / 2), info.top + Math.floor(borderWidth / 2), info.width - borderWidth, info.height - borderWidth);

	  ctx.setLineDash([0]);
	}

	/**
	 * @return {Element}
	 */
	function injectCanvas() {
	  var node = document.createElement("canvas");
	  node.width = window.screen.availWidth;
	  node.height = window.screen.availHeight;
	  node.style.cssText =
	  // 'background: green;' +
	  // 'opacity: 0.5' +;
	  "bottom: 0;" + "left: 0;" + "pointer-events: none;" + "position: fixed;" + "right: 0;" + "top: 0;" + "z-index: 1000000000;";
	  document.documentElement.insertBefore(node, document.documentElement.firstChild);
	  return node;
	}

	var Presenter = {
	  batchUpdate: batchUpdate
	};

	module.exports = Presenter;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @require ./Fetcher.js
	 *
	 * The Presenter file.
	 */

	"use strict";

	var Fetcher = __webpack_require__(1);

	var _initialized = false;
	var _id = 0;
	var _accesstoken = ("BS_" + Math.random() + "-" + chrome.runtime.id).replace(/[\.-]/g, "_");

	/**
	 * @param {string} code
	 */
	function injectScriptDocument(code) {
	  var node = document.createElement("script");
	  node.textContent = code;
	  node.id = "BananaSlug_id_" + _id++;
	  (document.head || document.documentElement).appendChild(node);
	  node.parentNode.removeChild(node);
	}

	/**
	 * @param {string} relPath
	 */
	function inject(relPath) {
	  if (!_initialized) {
	    window.addEventListener("message", onInjectedMessage, false);
	  }

	  return Fetcher.fetch(relPath).then(function (text) {
	    var code = text.replace(/__ACCESS_TOKEN__/g, _accesstoken);
	    injectScriptDocument(code);
	    return Promise.resolve(true);
	  })["catch"](function ( /*@type {string} */error) {
	    return Promise.reject(error);
	  });
	}

	/**
	 * @param {Object} event
	 */
	function onInjectedMessage(event) {
	  var eventData = parseJSON(event.data);
	  if (!eventData || eventData.accesstoken !== _accesstoken) {
	    return;
	  }

	  var type = eventData.type;
	  var data = eventData.data;
	  if (_callbacks.hasOwnProperty(type)) {
	    _callbacks[type].forEach(function (callback) {
	      callback(type, data);
	    });
	    type = null;
	  }
	}

	/**
	 * @param {*} str
	 * @return {?Object}
	 */
	function parseJSON(str) {
	  if (typeof str !== "string") {
	    return null;
	  }
	  try {
	    return JSON.parse(str);
	  } catch (ex) {
	    return null;
	  }
	}

	var _callbacks = {};

	/**
	 * @param {string} relPath
	 * @param {Function} callback
	 */
	function subscribe(name, callback) {
	  if (!_callbacks.hasOwnProperty(name)) {
	    _callbacks[name] = [callback];
	  } else if (_callbacks[name].indexOf(callback) < 0) {
	    _callbacks[name].push(callback);
	  }
	}

	var ScriptInjector = {
	  inject: inject,
	  subscribe: subscribe };

	module.exports = ScriptInjector;

/***/ }
/******/ ]);