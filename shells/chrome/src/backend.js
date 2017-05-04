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
var TraceUpdatesBackendManager = require('../../../plugins/TraceUpdates/TraceUpdatesBackendManager');
var Bridge = require('../../../agent/Bridge');
var inject = require('../../../agent/inject');
var setupRNStyle = require('../../../plugins/ReactNativeStyle/setupBackend');
var setupHighlighter = require('../../../frontend/Highlighter/setup');
var setupRelay = require('../../../plugins/Relay/backend');

window.addEventListener('message', welcome);
function welcome(evt) {
  if (evt.source !== window || evt.data.source !== 'react-devtools-content-script') {
    return;
  }

  window.removeEventListener('message', welcome);
  setup(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
}

function setup(hook) {
  var listeners = [];

  var wall = {
    listen(fn) {
      var listener = evt => {
        if (evt.source !== window || !evt.data || evt.data.source !== 'react-devtools-content-script' || !evt.data.payload) {
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

  // Note: this is only useful for react-native-web (and equivalents).
  // They would have to set this field directly on the hook.
  var isRNStyleEnabled = !!hook.resolveRNStyle;

  var bridge = new Bridge(wall);
  var agent = new Agent(window, {
    rnStyle: isRNStyleEnabled,
  });
  agent.addBridge(bridge);

  agent.once('connected', () => {
    inject(hook, agent);
  });

  if (isRNStyleEnabled) {
    setupRNStyle(bridge, agent, hook.resolveRNStyle);
  }

  setupRelay(bridge, agent, hook);

  agent.on('shutdown', () => {
    hook.emit('shutdown');
    listeners.forEach(fn => {
      window.removeEventListener('message', fn);
    });
    listeners = [];
  });

  setupHighlighter(agent);
  TraceUpdatesBackendManager.init(agent);
}
