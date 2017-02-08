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

type ConnectOptions = {
  host?: string,
  port?: number,
  resolveRNStyle?: (style: number) => ?Object,
};

// TODO: why?
if (!window.performance) {
  window.performance = {
    now: () => Date.now(),
  };
}

var Agent = require('../../../agent/Agent');
var Bridge = require('../../../agent/Bridge');
var installGlobalHook = require('../../../backend/installGlobalHook.js');
var inject = require('../../../agent/inject');
var setupRNStyle = require('../../../plugins/ReactNativeStyle/setupBackend');
var setupRelay = require('../../../plugins/Relay/backend');

installGlobalHook(window);

if (window.document) {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('react-devtools', agent => {
    var setupHighlighter = require('../../../frontend/Highlighter/setup');
    setupHighlighter(agent);
  });
}

function connectToDevTools(options: ?ConnectOptions) {
  var {
    host = 'localhost',
    port = 8097,
    resolveRNStyle = null,
  } = options || {};

  var messageListeners = [];
  var closeListeners = [];
  var uri = 'ws://' + host + ':' + port;
  var ws = new window.WebSocket(uri);
  ws.onclose = handleClose;
  ws.onerror = handleClose;
  ws.onmessage = handleMessage;
  ws.onopen = function () {
    var wall = {
      listen(fn) {
        messageListeners.push(fn);
      },
      onClose(fn) {
        closeListeners.push(fn);
      },
      send(data) {
        ws.send(JSON.stringify(data));
      },
    };
    setupBackend(wall, resolveRNStyle);
  };

  var hasClosed = false;
  function handleClose() {
    if (!hasClosed) {
      hasClosed = true;
      setTimeout(() => {
        connectToDevTools(options);
      }, 2000);
      closeListeners.forEach(fn => fn());
    }
  }

  function handleMessage(evt) {
    var data;
    try {
      data = JSON.parse(evt.data);
    } catch (e) {
      console.error('failed to parse json: ' + evt.data);
      return;
    }
    messageListeners.forEach(fn => {
      try {
        fn(data);
      } catch (e) {
        // jsc doesn't play so well with tracebacks that go into eval'd code,
        // so the stack trace here will stop at the `eval()` call. Getting the
        // message that caused the error is the best we can do for now.
        console.log(data);
        throw e;
      }
    });
  }
}

function setupBackend(wall, resolveRNStyle) {
  wall.onClose(() => {
    if (agent) {
      agent.emit('shutdown');
    }
    bridge = null;
    agent = null;
    console.log('closing devtools');
  });

  var bridge = new Bridge(wall);
  var agent = new Agent(window, {
    rnStyle: !!resolveRNStyle,
  });
  agent.addBridge(bridge);

  if (resolveRNStyle) {
    setupRNStyle(bridge, agent, resolveRNStyle);
  }

  setupRelay(bridge, agent, window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

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
}

module.exports = {
  connectToDevTools,
};
