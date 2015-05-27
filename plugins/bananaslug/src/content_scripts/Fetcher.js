/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The Fetcher file.
 */

var {
  XMLHttpRequest,
  chrome,
} = global;

/**
 * @type {object}
 */
var _cache = {};

/**
 * @param {string} uri
 * @param {Function} callback
 * @param {Function} errorback
 */
function fetchInternal(uri, callback, errorback) {
  var xhr = new XMLHttpRequest();

  if (_cache[uri]) {
    callback(_cache[uri]);
    return;
  }

  var onload = () => {
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

  var onerror = () => {
    var msg = `Unable to inject script for "${uri}"`;
    errorback(msg);
  };

  xhr.onload = onload;
  xhr.onerror = onerror;
  xhr.open('GET', uri, true);
  xhr.send();
}

/**
 * @param {string} relPath
 * @return {Object}
 */
function fetch(name) {
  // to be safe, need to escape name.
  name = name.replace(/[^a-zA-Z_0-9-]/g, '_INVALID_');

  var id = chrome.runtime.id;
  var uri =
    `chrome-extension://${id}/plugins/bananaslug/build/${name}.bundle.js`;

  return new Promise(function(resolve, reject) {
    fetchInternal(uri, resolve, reject);
  });
}

var Fetcher = {
  fetch: fetch,
};

module.exports = Fetcher;
