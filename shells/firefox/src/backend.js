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

var Agent = require('../../../agent/Agent');
var BananaSlugBackendManager = require('../../../plugins/BananaSlug/BananaSlugBackendManager');
var Bridge = require('../../../agent/Bridge');
var setupHighlighter = require('../../../frontend/Highlighter/setup');
var setupRelay = require('../../../plugins/Relay/backend');


var inject = require('../../../agent/inject');

// This is the case when the page has been loaded from cache, and so there's
// already a reactDevtoolsAgent active. We need to kill it before we start.
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent) {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.emit('shutdown');
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent.emit('shutdown');
}

// TODO: check to see if we're in RN before doing this?
setInterval(function() {
  // this is needed to force refresh on react native
}, 100);

window.addEventListener('message', welcome);
function welcome(evt) {
  if (evt.data && evt.data.source !== 'react-devtools-reporter') {
    return;
  }

  window.removeEventListener('message', welcome);
  setup();
}

function setup() {
  var listeners = [];

  var wall = {
    listen(fn) {
      var listener = evt => {
        if (evt.data.source !== 'react-devtools-reporter' || !evt.data.payload) {
          return;
        }
        fn(evt.data.payload);
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

  var bridge = new Bridge(wall);
  var agent = new Agent(window);
  agent.addBridge(bridge);

  var _connectTimeout = setTimeout(function() {
    console.error('react-devtools agent got no connection');
  }, 1000);

  agent.once('connected', () => {
    inject(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent);
    clearTimeout(_connectTimeout);
  });

  agent.on('shutdown', () => {
    listeners.forEach(fn => {
      window.removeEventListener('message', fn);
    });
    listeners = [];
  });

  setupRelay(bridge, agent, window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

  if (window.document && window.document.createElement) {
    setupHighlighter(agent);
  }

  BananaSlugBackendManager.init(agent);
}
