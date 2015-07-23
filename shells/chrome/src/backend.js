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
var Highlighter = require('../../../frontend/Highlighter/Highlighter');
var setupRNStyle = require('../../../plugins/ReactNativeStyle/setupBackend');

var inject = require('../../../agent/inject');

// TODO: check to see if we're in RN before doing this?
setInterval(function () {
  // this is needed to force refresh on react native
}, 100);

window.addEventListener('message', welcome);
function welcome(evt) {
  if (evt.data.source !== 'react-devtools-content-script') {
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
        if (evt.data.source !== 'react-devtools-content-script' || !evt.data.payload) {
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

  var isReactNative = !!hook.resolveRNStyle;

  var bridge = new Bridge();
  bridge.attach(wall);
  var agent = new Agent(window, {
    rnStyle: isReactNative,
  });
  agent.addBridge(bridge);

  agent.once('connected', () => {
    inject(hook, agent, /* lookForOldReact= */!isReactNative);
  });

  if (isReactNative) {
    setupRNStyle(bridge, agent, hook.resolveRNStyle);
  }

  var hl;
  agent.on('shutdown', () => {
    hook.emit('shutdown');
    listeners.forEach(fn => {
      window.removeEventListener('message', fn);
    });
    listeners = [];
    if (hl) {
      hl.remove();
    }
  });

  if (!isReactNative) {
    hl = new Highlighter(window, node => {
      agent.selectFromDOMNode(node);
    });
    // $FlowFixMe flow thinks hl might be undefined
    agent.on('highlight', data => hl.highlight(data.node, data.name));
    // $FlowFixMe flow thinks hl might be undefined
    agent.on('highlightMany', nodes => hl.highlightMany(nodes));
    // $FlowFixMe flow thinks hl might be undefined
    agent.on('hideHighlight', () => hl.hideHighlight());
  }
}
