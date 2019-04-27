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
  isAppActive?: () => boolean,
  websocket?: ?WebSocket,
};

var Agent = require('../../../agent/Agent');
var Bridge = require('../../../agent/Bridge');
var ProfileCollector = require('../../../plugins/Profiler/ProfileCollector');
var installGlobalHook = require('../../../backend/installGlobalHook');
var inject = require('../../../agent/inject');
var invariant = require('assert');
var setupRNStyle = require('../../../plugins/ReactNativeStyle/setupBackend');
var setupHooksInspector = require('../../../plugins/HooksInspector/backend').default;
var setupProfiler = require('../../../plugins/Profiler/backend');

installGlobalHook(window);

if (window.document) {
  // This shell is universal, and might be used inside a web app.
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('react-devtools', agent => {
    var setupHighlighter = require('../../../frontend/Highlighter/setup');
    setupHighlighter(agent);
  });
}

function connectToDevTools(options: ?ConnectOptions) {
  var {
    host = 'localhost',
    port = 8097,
    websocket,
    resolveRNStyle = null,
    isAppActive = () => true,
  } = options || {};

  function scheduleRetry() {
    // Two seconds because RN had issues with too fast retries.
    setTimeout(() => connectToDevTools(options), 2000);
  }

  if (!isAppActive()) {
    // If the app is in background, maybe retry later.
    // Don't actually attempt to connect until we're in foreground.
    scheduleRetry();
    return;
  }

  var messageListeners = [];
  var closeListeners = [];
  var uri = 'ws://' + host + ':' + port;
  // If existing websocket is passed, use it.
  // This is necessary to support our custom integrations.
  // See D6251744.
  var ws = websocket ? websocket : new window.WebSocket(uri);
  ws.onclose = handleClose;
  ws.onerror = handleFailed;
  ws.onmessage = handleMessage;
  ws.onopen = function() {
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
      scheduleRetry();
      closeListeners.forEach(fn => fn());
    }
  }
  function handleFailed() {
    if (!hasClosed) {
      hasClosed = true;
      closeListeners.forEach(fn => fn());
    }
  }

  function handleMessage(evt) {
    var data;
    try {
      invariant(typeof evt.data === 'string');
      data = JSON.parse(evt.data);
    } catch (e) {
      console.error('failed to parse json: ' + String(evt.data));
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
    // This appears necessary for plugin cleanup.
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.emit('shutdown');
    bridge = null;
    agent = null;
    console.log('closing devtools');
  });

  var bridge = new Bridge(wall);
  var agent = new Agent(window, {
    rnStyle: !!resolveRNStyle,
    rnStyleMeasure: !!resolveRNStyle,
  });
  agent.addBridge(bridge);

  if (resolveRNStyle) {
    setupRNStyle(bridge, agent, resolveRNStyle);
  }

  setupProfiler(bridge, agent, window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  setupHooksInspector(bridge, agent);

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

  ProfileCollector.init(agent);
}

module.exports = { connectToDevTools };
