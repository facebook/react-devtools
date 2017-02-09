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
var fs = require('fs');
var path = require('path');

var installGlobalHook = require('../../../backend/installGlobalHook');
installGlobalHook(window);
var Panel = require('../../../frontend/Panel');
var React = require('react');
var ReactDOM = require('react-dom');

var node = null;
var onStatusChange = function noop() {};
var wall = null;

var config = {
  reload,
  alreadyFoundReact: true,
  inject(done) {
    done(wall);
  },
};

function reload() {
  ReactDOM.unmountComponentAtNode(node);
  node.innerHTML = '';
  setTimeout(() => {
    ReactDOM.render(<Panel {...config} />, node);
  }, 100);
}

function onDisconnected() {
  ReactDOM.unmountComponentAtNode(node);
  node.innerHTML = '<div id="waiting"><h2>Waiting for React to connect…</h2></div>';
}

function onError(e) {
  ReactDOM.unmountComponentAtNode(node);
  var message;
  if (e.code === 'EADDRINUSE') {
    message = 'Another instance of DevTools is running';
  } else {
    message = `Unknown error (${e.message})`;
  }
  node.innerHTML = `<div id="waiting"><h2>${message}</h2></div>`;
}

function initialize(socket) {
  var listeners = [];
  var isLegacyRN = false;
  socket.onmessage = (evt) => {
    if (evt.data === 'attach:agent') {
      // <hack>
      // TODO: This branch (and vendor/backend-1.0.6.js) can be removed when we're comfortable dropping
      // support for RN <= 0.42 in Nuclide RN inspector. We used to send backend to RN to `eval`
      // but in newer RN versions we just import the backend from npm package.
      // We use `attach:agent` to detect old RN versions because we don't send it anymore.
      if (!isLegacyRN) {
        isLegacyRN = true;
        socket.send('eval:' + fs.readFileSync(path.join(__dirname, '../vendor/backend-1.0.6.js')));
      }
      // </hack>
      return;
    }
    var data = JSON.parse(evt.data);
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

var restartTimeout = null;
function startServer(port = 8097) {
  var httpServer = require('http').createServer();
  var server = new ws.Server({server: httpServer});
  var connected = false;
  server.on('connection', (socket) => {
    if (connected) {
      connected.close();
      console.warn('only one connection allowed at a time');
      console.warn('closing the previous connection');
    }
    connected = socket;
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
    initialize(socket);
  });

  server.on('error', (e) => {
    onError(e);
    console.error('Failed to start the DevTools server', e);
    restartTimeout = setTimeout(() => startServer(port), 1000);
  });

  var backendFile = fs.readFileSync(
    path.join(__dirname, '../build/backend.js')
  );
  httpServer.on('request', (req, res) => {
    // Serve a file that immediately sets up the connection.
    res.end(backendFile + '\n;ReactDevToolsBackend.connectToDevTools();');
  });

  httpServer.on('error', (e) => {
    onError(e);
    onStatusChange('Failed to start the server.');
    restartTimeout = setTimeout(() => startServer(port), 1000);
  });

  httpServer.listen(port, () => {
    onStatusChange('The server is listening on the port ' + port + '.');
  });

  return {
    close: function() {
      connected = false;
      onDisconnected();
      clearTimeout(restartTimeout);
      httpServer.close();
    },
  };
}

var DevtoolsUI = {
  setContentDOMNode(_node) {
    node = _node;
    return DevtoolsUI;
  },

  setStatusListener(_listener) {
    onStatusChange = _listener;
    return DevtoolsUI;
  },

  startServer,
};

module.exports = DevtoolsUI;
