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

var inject = require('../backend/inject');

// TODO: check to see if we're in RN before doing this?
setInterval(function () {
  // this is needed to force refresh on react native
}, 100);

function setup() {
  var listeners = [];
  var waitingMessages = [];

  global.__REACT_DEVTOOLS_GLOBAL_HOOK__.poll = function (messages) {
    messages.forEach(message => {
      listeners.forEach(fn => fn(message))
    });

    var waiting = waitingMessages;
    waitingMessages = [];
    return waiting;
  }

  var wall = {
    listen(fn) {
      listeners.push(fn);
    },
    send(data) {
      waitingMessages.push(data);
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
      hl.remove();
    }
  });
}

setup();
