/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

// this is not compiled by babel / webpack
var ws = require('ws');
var fs = require('fs');
var path = require('path');

var socket = ws.connect('ws://localhost:8081/devtools');

socket.onmessage = initialMessage;

function initialMessage(evt) {
  if (evt.data === 'attach:agent') {
    initialize();
  }
}

socket.onerror = function (err) {
  window.onDisconnected();
  console.log('error connection', err);
};
socket.onclose = function () {
  window.onDisconnected();
  console.log('error things');
};

function initialize() {
  fs.readFile(path.join(__dirname, '/../build/backend.js'), function (err, backendScript) {
    if (err) {
      return console.error('failed to load...', err);
    }
    socket.send('eval:' + backendScript.toString('utf8'));
    socket.onmessage = function (evt) {
      // console.log('<<--', evt.data);
      var data = JSON.parse(evt.data);
      if (data.$close || data.$error) {
        console.log('Closing or Erroring');
        window.onDisconnected();
        socket.onmessage = initialMessage;
        return;
      }
      if (data.$open) {
        return; // ignore
      }
      listeners.forEach(function (fn) {fn(data); });
    };
    console.log('connected to react native');
    var listeners = [];

    var wall = {
      listen(fn) {
        listeners.push(fn);
      },
      send(data) {
        // console.log('-->>' + JSON.stringify(data));
        socket.send(JSON.stringify(data));
      },
      disconnect() {
        socket.close();
      },
    };

    window.onConnected(wall);
  });
}

window.onConnected = function () {
  console.error('No onConnected set');
};
window.onDisconnected = function () {
  console.error('No onDisconnected set');
};
