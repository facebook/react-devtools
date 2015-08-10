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
var Bridge = require('../../../agent/Bridge');
var setupHighlighter = require('../../../frontend/Highlighter/setup');
var setupRNStyle = require('../../../plugins/ReactNativeStyle/setupBackend');

var inject = require('../../../agent/inject');

// TODO: check to see if we're in RN before doing this?
setInterval(function () {
  // this is needed to force refresh on react native
}, 100);

// main window
var parent = window.parent;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = parent.__REACT_DEVTOOLS_GLOBAL_HOOK__;

parent.addEventListener('message', welcome);
function welcome(evt) {
  if (evt.data.source !== 'react-devtools-content-script') {
    return;
  }

  parent.removeEventListener('message', welcome);
  setup(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
}

function setup(hook) {
  var listeners = [];

  var wall = {
    listen(fn) {
      var listener = evt => {
        if (evt.data.source !== 'react-devtools-content-script' || !evt.data.payload) {
          return;
        }
        fn(evt.data.payload);
      };
      listeners.push(listener);
      parent.addEventListener('message', listener);
    },
    send(data) {
      parent.postMessage({
        source: 'react-devtools-bridge',
        payload: data,
      }, '*');
    },
  };

  var isReactNative = !!hook.resolveRNStyle;

  var bridge = new Bridge();
  bridge.attach(wall);
  var agent = new Agent(parent, {
    rnStyle: isReactNative,
  });
  agent.addBridge(bridge);

  agent.once('connected', () => {
    inject(hook, agent);
  });

  if (isReactNative) {
    setupRNStyle(bridge, agent, hook.resolveRNStyle);
  }

  agent.on('shutdown', () => {
    hook.emit('shutdown');
    listeners.forEach(fn => {
      parent.removeEventListener('message', fn);
    });
    listeners = [];
  });

  if (!isReactNative) {
    setupHighlighter(agent, parent);
  }
}
