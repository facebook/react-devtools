/**
 * @require ./Fetcher.js
 *
 * The Presenter file.
 */

var Fetcher = require('./Fetcher');

var _initialized = false;
var _id = 0;
var _accesstoken =
  ('BS_' + Math.random() + '-' + chrome.runtime.id).replace(/[\.-]/g, '_');

/**
 * @param {string} code
 */
function injectScriptDocument(code) {
  var node = document.createElement('script');
  node.textContent = code;
  node.id = 'BananaSlug_id_' + (_id++);
  (document.head || document.documentElement).appendChild(node);
  node.parentNode.removeChild(node);
}

/**
 * @param {string} relPath
 */
function inject(relPath) {
  if (!_initialized) {
    window.addEventListener('message', onInjectedMessage, false);
  }

  return Fetcher
    .fetch(relPath)
    .then((text) => {
      var code = text.replace(/__ACCESS_TOKEN__/g, _accesstoken);
      injectScriptDocument(code);
      return Promise.resolve(true);
    })
    .catch((/*@type {string} */ error) => {
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
    _callbacks[type].forEach((callback) => {
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
  if (typeof str !== 'string') {
    return null
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
  subscribe: subscribe,
};

module.exports = ScriptInjector;
