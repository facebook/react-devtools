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

var Harness = require('./Harness');
var Container = require('../frontend/Container');
var React = require('react');

window.React = React;

var node = document.createElement('div')
document.body.appendChild(node)
React.render(
  <Harness backendSrc="./build/backend.js" targetSrc="./build/target.js">
    {/* $FlowFixMe flow thinks Container needs to extend React.Component */}
    <Container/>
  </Harness>,
  node
)


