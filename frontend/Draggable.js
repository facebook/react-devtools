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
import type {DOMNode, DOMEvent} from './types'

// $FlowFixMe the "extends React.Component" is just to help flow
class Draggable extends React.Component {
  _onMove: (evt: DOMEvent) => void;
  _onUp: (evt: DOMEvent) => void;
  props: Object;

  componentDidMount() {
    this._onMove = this.onMove.bind(this);
    this._onUp = this.onUp.bind(this);
  }

  _startDragging(evt: DOMEvent) {
    evt.preventDefault();
    var win = this.props.win || window
    win.addEventListener('mousemove', this._onMove);
    win.addEventListener('mouseup', this._onUp);
    this.props.onStart();
  }

  onMove(evt: DOMEvent) {
    evt.preventDefault();
    this.props.onMove(evt.pageX);
  }

  onUp(evt: DOMEvent) {
    evt.preventDefault();
    var win = this.props.win || window
    win.removeEventListener('mousemove', this._onMove);
    win.removeEventListener('mouseup', this._onUp);
    this.props.onStop();
  }

  render(): ReactElement {
    return (
      <div
        style={this.props.style}
        onMouseDown={this._startDragging.bind(this)}
      />
    );
  }
}

module.exports = Draggable;
