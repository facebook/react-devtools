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
var Input = require('../../frontend/Input');

import type {DOMEvent, DOMNode} from '../../frontend/types';

type Props = {
  onChange: (text: string|number) => any;
  value: string|number;
};
type DefaultProps = {};
type State = {
  text: string;
};

class BlurInput extends React.Component<Props, State> {
  defaultProps: DefaultProps;
  node: ?DOMNode;

  constructor(props: Props) {
    super(props);
    this.state = {text: '' + this.props.value};
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState({text: '' + nextProps.value});
  }

  done() {
    if (this.state.text !== '' + this.props.value) {
      this.props.onChange(this.state.text);
    }
  }

  onKeyDown(e: DOMEvent) {
    if (e.key === 'Enter') {
      this.done();
      return;
    } else if (e.key === 'ArrowUp') {
      if (+this.state.text + '' === this.state.text) {
        this.props.onChange(+this.state.text + 1);
      }
    } else if (e.key === 'ArrowDown') {
      if (+this.state.text + '' === this.state.text) {
        this.props.onChange(+this.state.text - 1);
      }
    }
  }

  render() {
    return (
      <Input
        value={this.state.text}
        innerRef={i => this.node = i}
        onChange={e => this.setState({text: e.target.value})}
        onBlur={this.done.bind(this)}
        onKeyDown={e => this.onKeyDown(e)}
        size={1 /* Allow to shrink */}
        style={styles.input}
      />
    );
  }
}

var styles = {
  input: {
    width: '100%',
  },
};

module.exports = BlurInput;
