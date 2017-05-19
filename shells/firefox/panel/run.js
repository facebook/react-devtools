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

var installGlobalHook = require('../../../backend/installGlobalHook');
installGlobalHook(window);

var Panel = require('../../../frontend/Panel');
var Loading = require('../../../frontend/Loading');
var ReactNotDetected = require('../../../frontend/ReactNotDetected');
var React = require('react');
var ReactDOM = require('react-dom');

var node = document.getElementById('container');
ReactDOM.render(<h2 id="message">Looking for React...</h2>, node);
var port = {};

// TODO (bvaughn) Read default :themeName and switch between 'FirefoxLight' and 'FirefoxDark'
// Refer to 'shells/chrome/src/panel.js' for an example
const themeName = 'FirefoxLight';

function reload() {
  ReactDOM.unmountComponentAtNode(node);
  ReactDOM.render(<Panel alreadyFoundReact={true} themeName={themeName} {...config} />, node);
}

window.addEventListener('message', function(event) {
  port = event.ports[0];
  var metaPort = event.ports[1];
  metaPort.onmessage = evt => {
    if (evt.data === 'show') {
      reload();
    } else if (evt.data === 'unload') {
      ReactDOM.render(<Loading />, node);
    } else if (evt.data.type === 'hasReact') {
      var reactDetected = evt.data.val;
      if (!reactDetected) {
        ReactDOM.render(<ReactNotDetected />, node);
      } else {
        ReactDOM.render(<Panel {...config} alreadyFoundReact={true} />, node);
      }
    }
  };
});

var config = {
  reload,
  // checkForReact,
  inject(done) {
    var disconnected = false;

    var wall = {
      listen(fn) {
        port.onmessage = evt => {
          fn(evt.data);
        };
      },
      send(data) {
        if (disconnected) {
          return;
        }
        port.postMessage(data);
      },
    };
    done(wall);
  },
};
