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

var React = require('react');
var ReactDOM = require('react-dom');

class InnerContent extends React.Component {
  render() {
    return (
      <div>Inner content</div>
    );
  }
}

class OuterWrapper extends React.Component {
  componentDidMount() {
    const node = document.createElement('div');
    this.frame.contentDocument.body.appendChild(node);
    ReactDOM.render(<InnerContent />, node);
  }

  render() {
    return (
      <div>
        <div>Iframe below</div>
        <iframe ref={(frame) => this.frame = frame} />
      </div>
    );
  }
}

var node = document.createElement('div');
document.body.appendChild(node);
ReactDOM.render(<OuterWrapper />, node);
