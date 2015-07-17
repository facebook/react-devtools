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
var StyleEdit = require('./StyleEdit');

class NativeStyler extends React.Component {
  constructor(props: Object) {
    super(props);
    this.state = {style: null};
  }

  componentWillMount() {
    this.props.bridge.call('rn:getStyle', this.props.id, style => {
      this.setState({style});
    });
  }

  componentWillReceiveProps(nextProps: Object) {
    if (nextProps.id === this.props.id) {
      return;
    }
    this.setState({style: null});
    this.props.bridge.call('rn:getStyle', nextProps.id, style => {
      this.setState({style});
    });
  }

  _handleStyleChange(attr: string, val: string | number) {
    this.state.style[attr] = val;
    this.props.bridge.send('rn:setStyle', {id: this.props.id, attr, val});
    this.setState({style: this.state.style});
  }

  render() {
    if (!this.state.style) {
      return <em>loading</em>;
    }
    return (
      // $FlowFixMe doesn't have to inherit from React.Component
      <StyleEdit
        style={this.state.style}
        onChange={this._handleStyleChange.bind(this)}
      />
    );
  }
}

module.exports = NativeStyler;
