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
var React = require('react');

var node = document.getElementById('container');
node.innerHTML = '<h1>Connecting to devtools</h1>';
var port = {};

function reload() {
  React.unmountComponentAtNode(node);
  node.innerHTML = '';
  React.render(<Panel alreadyFoundReact={true} {...config} />, node);
}

window.addEventListener('message', function(event) {
  port = event.ports[0];
  var metaPort = event.ports[1];
  metaPort.onmessage = evt => {
    if (evt.data === 'show') {
      reload();
    } else if (evt.data === 'unload') {
      node.innerHTML = '<h1 id="message">Looking for React</h1>';
    } else if (evt.data.type === 'hasReact') {
      if (evt.data.val) {
        React.render(<Panel alreadyFoundReact={true} {...config} />, node);
      } else {
        node.innerHTML =
          '<h1 id="message">Unable to find React on the page.</h1>';
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
