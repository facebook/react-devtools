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
var BlurInput = require('./BlurInput');


type Props = {
  style: Object,
  onChange: (attr: string, val: string | number) => void,
  onRename: (oldName: string, newName: string, val: string | number) => void,
};

type DefaultProps = {};

type State = {
  newAttr: string,
  newValue: string|number,
};

class StyleEdit extends React.Component {
  props: Props;
  defaultProps: DefaultProps;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {newAttr: '', newValue: ''};
  }

  onChange(name: string, val: string | number) {
    var num = Number(val);
    this.props.onChange(name, num === val ? num : val);
  }

  onNew(val: string | number) {
    this.onChange(this.state.newAttr, val);
    this.setState({newAttr: '', newValue: ''});
  }

  render() {
    var attrs = Object.keys(this.props.style);
    return (
      <ul style={styles.container}>
        {attrs.map(name => (
          <li key={'style-' + name} style={styles.attr}>
            <BlurInput
              value={name}
              onChange={newName => this.props.onRename(name, '' + newName, this.props.style[name])}
            />
            :
            <BlurInput
              value={this.props.style[name]}
              onChange={val => this.onChange(name, val)}
            />
          </li>
        ))}
        <li style={styles.attr}>
          <BlurInput
            value={this.state.newAttr}
            onChange={newAttr => this.setState({newAttr: '' + newAttr})}
          />
          :
          {this.state.newAttr && <BlurInput
            value={''}
            onChange={val => this.onNew(val)}
          />}
        </li>
      </ul>
    );
  }
}

var styles = {
  container: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  attr: {
    padding: 2,
  },
};

module.exports = StyleEdit;
