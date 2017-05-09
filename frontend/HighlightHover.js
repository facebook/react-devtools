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

import type {Base16Theme} from './types';

type Context = {
  theme: Base16Theme,
};

type Props = {
  style: ?Object,
  children?: any,
};

type State = {
  hover: boolean,
};

class HighlightHover extends React.Component {
  context: Context;
  props: Props;
  defaultProps: {};
  state: State;

  constructor(props: Object) {
    super(props);
    this.state = {hover: false};
  }

  render() {
    const {theme} = this.context;

    return (
      <div
        onMouseOver={() => !this.state.hover && this.setState({hover: true})}
        onMouseOut={() => this.state.hover && this.setState({hover: false})}
        style={assign({}, this.props.style, {
          backgroundColor: this.state.hover ? theme.base02 : 'transparent',
        })}>
        {this.props.children}
      </div>
    );
  }
}

HighlightHover.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

module.exports = HighlightHover;
