/**
 * The Fetcher file.
 */

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
  var _callback = callback;

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
    var msg = 'Unable to inject script for "' + uri + '"';
    errorback(msg);
  };

  var xhr = new XMLHttpRequest();
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
  var uri = 'chrome-extension://' +
    chrome.runtime.id + '/js/' + name + '.bundle.js';

  return new Promise(function(resolve, reject) {
    fetchInternal(uri, resolve, reject);
  });;
}

/**
 * @param {string} extensionID
 * @param {string} relPath
 * @return {Object}
 */
function fetchRemote(extensionID, relPath) {
  var uri = 'chrome-extension://' + extensionID + '/' + relPath;
  return new Promise((resolve, reject) => {
    fetchInternal(uri, resolve, reject);
  });;
}

var Fetcher = {
  fetch: fetch,
  fetchRemote: fetchRemote
};

module.exports = Fetcher;
