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
  maxConnectAttempt?: number
};

var Agent = require('../../../agent/Agent');
var Bridge = require('../../../agent/Bridge');
var installGlobalHook = require('../../../backend/installGlobalHook');
var installRelayHook = require('../../../plugins/Relay/installRelayHook');
var inject = require('../../../agent/inject');
var setupRNStyle = require('../../../plugins/ReactNativeStyle/setupBackend');
var setupRelay = require('../../../plugins/Relay/backend');

installGlobalHook(window);
installRelayHook(window);

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
    resolveRNStyle = null,
    isAppActive = () => true,
    maxConnectAttempt = Number.POSITIVE_INFINITY
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
  var ws = new window.WebSocket(uri);
  ws.onclose = handleClose;
  ws.onerror = handleClose;
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
      if (maxConnectAttempt-- > 0) {
        scheduleRetry();
      }
      closeListeners.forEach(fn => fn());
    }
  }

  function handleMessage(evt) {
    var data;
    // <hack>
    // This branch can be dropped when we don't care about supporting
    // Nuclide Inspector versions before https://github.com/facebook/nuclide/pull/1021.
    // Inspector used to send this message but it is unnecessary now.
    if (evt.data.indexOf('eval:') === 0) {
      return;
    }
    // </hack>
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
    // This appears necessary for plugin (e.g. Relay) cleanup.
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

module.exports = { connectToDevTools };
