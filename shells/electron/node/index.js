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

var ws = require('ws');

var installGlobalHook = require('../../../backend/installGlobalHook');
installGlobalHook(window);
var Panel = require('../../../frontend/Panel');
var React = require('react');

var node = document.getElementById('container');
var wall = null;

var config = {
  reload,
  alreadyFoundReact: true,
  inject(done) {
    done(wall);
  },
};

function reload() {
  React.unmountComponentAtNode(node);
  node.innerHTML = '';
  setTimeout(() => {
    React.render(<Panel {...config} />, node);
  }, 100);
}

function onDisconnected() {
  React.unmountComponentAtNode(node);
  node.innerHTML = '<h2 id="waiting">Waiting for a connection from React Native</h2>';
}

function initialize(socket, backendScript) {
  socket.send('eval:' + backendScript);
  var listeners = [];
  socket.onmessage = (evt) => {
    if (evt.data === 'attach:agent') {
      return;
    }
    var data = JSON.parse(evt.data);
    if (data.$close || data.$error) {
      console.log('Closing or Erroring');
      onDisconnected();
      socket.onmessage = (msg) => {
        if (msg.data === 'attach:agent') {
          initialize(socket, backendScript);
        }
      };
      return;
    }
    if (data.$open) {
      return; // ignore
    }
    listeners.forEach((fn) => fn(data));
  };

  wall = {
    listen(fn) {
      listeners.push(fn);
    },
    send(data) {
      socket.send(JSON.stringify(data));
    },
    disconnect() {
      socket.close();
    },
  };

  console.log('connected');
  reload();
}

/**
 * This is the normal mode, where it connects to the react native packager
 */
function connectToSocket(backendScript) {
  var socket = ws.connect('ws://localhost:8081/devtools');
  socket.onmessage = (evt) => {
    if (evt.data === 'attach:agent') {
      initialize(socket, backendScript);
    }
  };
  socket.onerror = (err) => {
    onDisconnected();
    console.log('Error with websocket connection', err);
  };
  socket.onclose = () => {
    onDisconnected();
    console.log('Connection to RN closed');
  };
}

/**
 * When the Electron app is running in "server mode"
 */
function startServer(backendScript) {
  var server = new ws.Server({port: 8097});
  var connected = false;
  server.on('connection', (socket) => {
    if (connected) {
      console.warn('only one connection allowed at a time');
      socket.close();
      return;
    }
    connected = true;
    socket.onerror = (err) => {
      connected = false;
      onDisconnected();
      console.log('Error with websocket connection', err);
    };
    socket.onclose = () => {
      connected = false;
      onDisconnected();
      console.log('Connection to RN closed');
    };
    initialize(socket, backendScript);
  });
}

module.exports = {
  startServer,
  connectToSocket,
};
