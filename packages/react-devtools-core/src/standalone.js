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
var ThemeStore = require('../../../frontend/Themes/Store');
var launchEditor = require('./launchEditor');
var React = require('react');
var ReactDOM = require('react-dom');

var node = null;
var onStatusChange = function noop() {};
var projectRoots = [];
var wall = null;
var panel = null;

var config = {
  reload,
  alreadyFoundReact: true,
  inject(done) {
    done(wall);
  },
  showElementSource(source) {
    launchEditor(source.fileName, source.lineNumber, projectRoots);
  },
};

var log = (...args) => console.log('[React DevTools]', ...args);
log.warn = (...args) => console.warn('[React DevTools]', ...args);
log.error = (...args) => console.error('[React DevTools]', ...args);

function reload() {
  ReactDOM.unmountComponentAtNode(node);
  node.innerHTML = '';
  setTimeout(() => {
    panel = ReactDOM.render(<Panel showHiddenThemes={true} {...config} />, node);
  }, 100);
}

function onDisconnected() {
  panel = null;
  ReactDOM.unmountComponentAtNode(node);
  node.innerHTML = '<div id="waiting"><h2>Waiting for React to connect…</h2></div>';
}

function onError(e) {
  panel = null;
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
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    },
    disconnect() {
      socket.close();
    },
  };

  log('Connected');
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
      log.warn(
        'Only one connection allowed at a time.',
        'Closing the previous connection'
      );
    }
    connected = socket;
    socket.onerror = (err) => {
      connected = false;
      onDisconnected();
      log.error('Error with websocket connection', err);
    };
    socket.onclose = () => {
      connected = false;
      onDisconnected();
      log('Connection to RN closed');
    };
    initialize(socket);
  });

  server.on('error', (e) => {
    onError(e);
    log.error('Failed to start the DevTools server', e);
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
      server.close();
      httpServer.close();
    },
  };
}

var DevtoolsUI = {
  setContentDOMNode(_node) {
    node = _node;
    return DevtoolsUI;
  },

  setProjectRoots(_projectRoots) {
    projectRoots = _projectRoots;
  },

  setStatusListener(_listener) {
    onStatusChange = _listener;
    return DevtoolsUI;
  },

  setDefaultThemeName(themeName) {
    config.themeName = themeName;
    if (panel) {
      var {store} = panel.getChildContext();
      // Change default themeName if panel mounted
      store.setDefaultThemeName(themeName);
      // Change theme with user selected theme,
      // it always wins than default theme
      store.changeTheme(ThemeStore.get());
    }
    return DevtoolsUI;
  },

  startServer,
};

module.exports = DevtoolsUI;
