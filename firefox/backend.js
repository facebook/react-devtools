/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @ xx flow see $FlowFixMe
 */
'use strict';


var Backend = require('../backend/Backend');
var Bridge = require('../backend/Bridge');
var Highlighter = require('../frontend/Highlighter');

var inject = require('../backend/inject');

// TODO: check to see if we're in RN before doing this?
setInterval(function () {
  // this is needed to force refresh on react native
}, 100);

window.addEventListener('message', welcome);
function welcome(evt) {
  if (evt.data && evt.data.source !== 'react-devtools-reporter') {
    return;
  }

  window.removeEventListener('message', welcome);
  setup()
}

function setup() {
  var listeners = [];

  var wall = {
    listen(fn) {
      var listener = evt => {
        if (evt.data.source !== 'react-devtools-reporter' || !evt.data.payload) {
          return;
        }
        fn(evt.data.payload)
      };
      listeners.push(listener);
      window.addEventListener('message', listener);
    },
    send(data) {
      window.postMessage({
        source: 'react-devtools-bridge',
        payload: data,
      }, '*');
    },
  };

  var bridge = new Bridge();
  bridge.attach(wall);
  var backend = new Backend(window);
  backend.addBridge(bridge);
  var hl;

  var _connectTimeout = setTimeout(function () {
    console.error('react-devtools backend got no connection');
  }, 1000);

  backend.once('connected', () => {
    inject(window, backend);
    clearTimeout(_connectTimeout);
  });

  backend.on('shutdown', () => {
    listeners.forEach(fn => {
      window.removeEventListener('message', fn);
    });
    listeners = [];
    if (hl) {
      hl.stopInspecting();
    }
  });

  if (window.document && window.document.createElement) {
    hl = new Highlighter(window, node => {
      backend.selectFromDOMNode(node);
    });
    // $FlowFixMe flow things hl might be undefined
    backend.on('highlight', data => hl.highlight(data.node, data.name));
    backend.on('hideHighlight', () => hl.hideHighlight());
  }
}

