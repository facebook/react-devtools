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

class IframeWrapper extends React.Component {
  componentDidMount() {
    const node = document.createElement('div');
    this.frame.contentDocument.body.appendChild(node);
    ReactDOM.render(this.props.children, node);
  }

  render() {
    var { children, ...props } = this.props; // eslint-disable-line no-unused-vars

    return (
      <div>
        <div>Iframe below</div>
        <iframe ref={(frame) => this.frame = frame} {...props} />
      </div>
    );
  }
}

var node = document.createElement('div');
var node2 = document.createElement('div');
document.body.appendChild(node);
document.body.appendChild(node2);

ReactDOM.render(
  <IframeWrapper>
    <IframeWrapper frameBorder="0">
      <InnerContent />
    </IframeWrapper>
  </IframeWrapper>
, node);

ReactDOM.render(
  <IframeWrapper>
    <InnerContent />
  </IframeWrapper>
, node2);
