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
