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
React.render(<h1 id="message">Looking for React...</h1>, node);
var port = {};

function reload() {
  React.unmountComponentAtNode(node);
  React.render(<Panel alreadyFoundReact={true} {...config} />, node);
}

window.addEventListener('message', function(event) {
  port = event.ports[0];
  var metaPort = event.ports[1];
  metaPort.onmessage = evt => {
    if (evt.data === 'show') {
      reload();
    } else if (evt.data === 'unload') {
      React.render(<h1 id="message">Looking for React...</h1>, node);
    } else if (evt.data.type === 'hasReact') {
      if (evt.data.val) {
        React.render(<Panel alreadyFoundReact={true} {...config} />, node);
      } else {
        // TODO: Does this actually show up? It seems like either the "Looking
        // for React..." at the top of this file shows, or (when navigating
        // from a React page to a non-React one) Panel renders the same text.
        React.render(
          <h1 id="message">Unable to find React on the page.</h1>,
          node
        );
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
