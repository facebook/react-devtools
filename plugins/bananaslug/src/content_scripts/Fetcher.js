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
