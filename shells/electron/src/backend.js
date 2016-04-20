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

// See https://github.com/facebook/react-native/blob/b00c77af8066cf74f05ccaca2b08c8952e1ae8a6/Libraries/Devtools/setupDevtools.js#L19
declare var FOR_BACKEND: {
  wall: Object;
  resolveRNStyle: () => void;
};

if (!window.performance) {
  window.performance = {
    now: () => Date.now(),
  };
}

var installGlobalHook = require('../../../backend/installGlobalHook.js');
installGlobalHook(window);

var Agent = require('../../../agent/Agent');
var Bridge = require('../../../agent/Bridge');
var inject = require('../../../agent/inject');
var setupRNStyle = require('../../../plugins/ReactNativeStyle/setupBackend');

FOR_BACKEND.wall.onClose(() => {
  if (agent) {
    agent.emit('shutdown');
  }
  bridge = null;
  agent = null;
  console.log('closing devtools');
});

var bridge = new Bridge(FOR_BACKEND.wall);
var agent = new Agent(window, {
  rnStyle: !!FOR_BACKEND.resolveRNStyle,
});
agent.addBridge(bridge);

if (FOR_BACKEND.resolveRNStyle) {
  setupRNStyle(bridge, agent, FOR_BACKEND.resolveRNStyle);
}

var _connectTimeout = setTimeout(() => {
  console.warn('react-devtools agent got no connection');
}, 20000);

agent.once('connected', () => {
  if (!agent) {
    return;
  }
  inject(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent);
  clearTimeout(_connectTimeout);
});

