/**
 * Copyright (c) 2013-2014, Facebook, Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name Facebook nor the names of its contributors may be used to
 *    endorse or promote products derived from this software without specific
 *    prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * The ScriptInjector file.
 */

var Fetcher = require('./Fetcher');

var {
  chrome,
  document,
  window,
} = global;

var _callbacks = {};
var _id = 0;
var _initialized = false;
var _accesstoken = `_bs_${Date.now()}_${chrome.runtime.id}`.replace(/[\.-]/g, '_');

/**
 * @param {*} str
 * @return {?Object}
 */
function parseJSON(str) {
  if (typeof str !== 'string') {
    return null;
  }
  try {
    return JSON.parse(str);
  } catch (ex) {
    return null;
  }
}

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
