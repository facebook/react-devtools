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

function websocketConnect(host: string, port: number, resolveRNStyle: Function | null) {
  var messageListeners = [];
  var closeListeners = [];
  var uri = 'ws://' + host + ':' + port;
  var ws = new window.WebSocket(uri);
  // this is accessed by the eval'd backend code
  var FOR_BACKEND = { // eslint-disable-line no-unused-vars
    resolveRNStyle,
    wall: {
      listen(fn) {
        messageListeners.push(fn);
      },
      onClose(fn) {
        closeListeners.push(fn);
      },
      send(data) {
        ws.send(JSON.stringify(data));
      },
    },
  };
  ws.onclose = () => {
    console.warn('devtools socket closed');
    closeListeners.forEach(fn => fn());
  };
  ws.onerror = error => {
    console.warn('devtools socket errored', error);
    closeListeners.forEach(fn => fn());
  };
  ws.onopen = function() {
    tryToConnect();
  };

  function tryToConnect() {
    ws.onmessage = evt => {
      if (evt.data.indexOf('eval:') === 0) {
        initialize(evt.data.slice('eval:'.length));
      }
    };
  }

  function initialize(text) {
    try {
      // FOR_BACKEND is used by the eval'd code
      eval(text); // eslint-disable-line no-eval
    } catch (e) {
      console.error('Failed to eval' + e.message + '\n' + e.stack);
      debugger; // eslint-disable-line no-debugger
      return;
    }
    ws.onmessage = handleMessage;
  }
  function handleMessage(evt) {
    var data;
    try {
      data = JSON.parse(evt.data);
    } catch (e) {
      console.error('failed to parse json: ' + evt.data);
      return;
    }
    // the devtools closed
    if (data.$close || data.$error) {
      closeListeners.forEach(fn => fn());
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.emit('shutdown');
      tryToConnect();
      return;
    }
    if (data.$open) {
      return; // ignore
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

module.exports = websocketConnect;
