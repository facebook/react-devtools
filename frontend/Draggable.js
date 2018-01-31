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

var React = require('react');
var ReactDOM = require('react-dom');
import type {DOMEvent} from './types';

// $FlowFixMe From the upgrade to Flow 64
class Draggable extends React.Component {
  _onMove: (evt: DOMEvent) => void;
  _onUp: (evt: DOMEvent) => void;
  props: {
    children?: mixed,
    onMove: (x: number, y: number) => void,
    onStart: () => void,
    onStop: () => void,
    style: Object,
  };

  componentDidMount() {
    this._onMove = this.onMove.bind(this);
    this._onUp = this.onUp.bind(this);
  }

  _startDragging(evt: DOMEvent) {
    evt.preventDefault();
    // $FlowFixMe From the upgrade to Flow 64
    var doc = ReactDOM.findDOMNode(this).ownerDocument;
    // $FlowFixMe From the upgrade to Flow 64
    doc.addEventListener('mousemove', this._onMove);
    // $FlowFixMe From the upgrade to Flow 64
    doc.addEventListener('mouseup', this._onUp);
    this.props.onStart();
  }

  onMove(evt: DOMEvent) {
    evt.preventDefault();
    this.props.onMove(evt.pageX, evt.pageY);
  }

  onUp(evt: DOMEvent) {
    evt.preventDefault();
    // $FlowFixMe From the upgrade to Flow 64
    var doc = ReactDOM.findDOMNode(this).ownerDocument;
    // $FlowFixMe From the upgrade to Flow 64
    doc.removeEventListener('mousemove', this._onMove);
    // $FlowFixMe From the upgrade to Flow 64
    doc.removeEventListener('mouseup', this._onUp);
    this.props.onStop();
  }

  render() {
    return (
      // $FlowFixMe From the upgrade to Flow 64
      <div
        style={this.props.style}
        onMouseDown={this._startDragging.bind(this)}
      >
        {this.props.children}
      </div>
    );
  }
}

module.exports = Draggable;
