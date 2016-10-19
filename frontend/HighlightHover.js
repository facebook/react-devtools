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
var assign = require('object-assign');

type Props = {
  style: ?Object,
  children?: any,
};

type State = {
  hover: boolean,
};

class HighlightHover extends React.Component {
  props: Props;
  defaultProps: {};
  state: State;

  constructor(props: Object) {
    super(props);
    this.state = {hover: false};
  }

  render() {
    return (
      <div
        onMouseOver={() => !this.state.hover && this.setState({hover: true})}
        onMouseOut={() => this.state.hover && this.setState({hover: false})}
        style={assign({}, this.props.style, {
          backgroundColor: this.state.hover ? 'rgb(56, 121, 217)' : 'transparent',
          color: this.state.hover ? 'white' : 'rgb(48, 57, 66)',
        })}>
        {this.props.children}
      </div>
    );
  }
}

module.exports = HighlightHover;
