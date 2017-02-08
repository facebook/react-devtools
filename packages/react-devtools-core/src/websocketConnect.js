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

var setupBackend = require('./backend');

function websocketConnect(host: string, port: number, resolveRNStyle: Function | null) {
  var messageListeners = [];
  var closeListeners = [];
  var uri = 'ws://' + host + ':' + port;
  var ws = new window.WebSocket(uri);
  ws.onclose = handleClose;
  ws.onerror = handleClose;
  ws.onmessage = handleMessage;
  ws.onopen = function () {
    setupBackend({
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
    });
  };

  var hasClosed = false;
  function handleClose() {
    if (!hasClosed) {
      hasClosed = true;
      setTimeout(() => {
        websocketConnect(host, port, resolveRNStyle);
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

module.exports = websocketConnect;
