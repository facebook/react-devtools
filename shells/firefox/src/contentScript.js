/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

/* global self */

declare var unsafeWindow: {
  __REACT_DEVTOOLS_GLOBAL_HOOK__: Object,
};

if (Object.keys(unsafeWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__._renderers).length) {
  self.port.emit('hasReact', true);
  injectBackend();
} else {
  self.port.emit('hasReact', false);
}

window.addEventListener('beforeunload', () => {
  self.port.emit('unload');
});

function connectToBackend() {
  self.port.on('message', function(payload) {
    window.postMessage({
      source: 'react-devtools-reporter',
      payload: payload,
    }, '*');
  });

  window.addEventListener('message', function(evt) {
    if (evt.source !== window || !evt.data || evt.data.source !== 'react-devtools-bridge') {
      return;
    }

    self.port.emit('message', evt.data.payload);
  });
}

function injectBackend() {
  var node = document.createElement('script');
  var documentElement = document.documentElement;

  node.onload = function() {
    window.postMessage({source: 'react-devtools-reporter'}, '*');

    connectToBackend();
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  };

  node.src = 'resource://react-devtools/data/build/backend.js';
  if (documentElement) {
    documentElement.appendChild(node);
  }
}
