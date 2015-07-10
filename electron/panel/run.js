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

var wall = null;

function reload() {
  React.unmountComponentAtNode(node);
  node.innerHTML = '';
  setTimeout(() => {
    React.render(<Panel wall={wall} reload={reload} />, node);
  }, 100);
}

// set in port.js
window.onConnected = function (_wall) {
  console.log('connected');
  wall = _wall;
  React.render(<Panel wall={wall} reload={reload} />, node);
}

