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

class Getter extends React.Component {

  constructor(props: Object) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.context.onEvalGetter(this.props.path);
  }

  render() {
    return (<div style={style} onClick={this.handleClick}>(...)</div>);
  }
}

const style = {
  'cursor': 'pointer',
};

Getter.propTypes = {
  data: React.PropTypes.any,
  path: React.PropTypes.array,
};

Getter.contextTypes = {
  onEvalGetter: React.PropTypes.func,
};

module.exports = Getter;
