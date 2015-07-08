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

var Panel = require('./Panel');
var React = require('react');

var node = document.getElementById('container');
node.innerHTML = '<h1>Connecting to devtools</h1>';
var port;

function reload() {
  React.unmountComponentAtNode(node);
  node.innerHTML = '';
  React.render(<Panel port={port} reload={reload} />, node);
}

window.addEventListener('message', function (evt) {
  port = evt.ports[0];
  React.render(<Panel port={port} reload={reload} />, node);
});

document.addEventListener('visibilitychange', function () {
  console.log('visibility change');
  if (!document.hidden) {
    port.postMessage('panel show');
  }
});

