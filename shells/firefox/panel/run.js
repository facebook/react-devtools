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

var globalHook = require('../../../backend/GlobalHook');
globalHook(window);

var Panel = require('../../../frontend/Panel');
var React = require('react');

var node = document.getElementById('container');
node.innerHTML = '<h1>Connecting to devtools</h1>';
var port = {};

function reload() {
  React.unmountComponentAtNode(node);
  node.innerHTML = '';
  React.render(<Panel alreadyFoundReact={true} {...config} />, node);
}

window.addEventListener('message', function (event) {
  port = event.ports[0];
  port.onmessage = evt => {
    if (evt.data.hasReact === true) {
      React.render(<Panel alreadyFoundReact={true} {...config} />, node);
    } else {
      node.innerHTML = '<h1>No react found on page...</h1>';
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

