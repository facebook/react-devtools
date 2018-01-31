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

var Input = require('../Input');
var flash = require('../flash');
var {monospace} = require('../Themes/Fonts');

import type {Theme, DOMEvent, DOMNode} from '../types';

type State = {
  editing: boolean,
  text: string,
};

// $FlowFixMe From the upgrade to Flow 64
class Simple extends React.Component {
  context: {
    onChange: (path: Array<any>, value: any) => void,
    theme: Theme,
  };
  state: State;
  input: DOMNode;

  constructor(props: Object) {
    super(props);
    this.state = {
      text: '',
      editing: false,
    };
  }

  onChange(e: DOMEvent) {
    // $FlowFixMe From the upgrade to Flow 64
    this.setState({
      text: e.target.value,
    });
  }

  onKeyDown(e: DOMEvent) {
    if (e.key === 'Enter') {
      this.onSubmit(true);
      // $FlowFixMe From the upgrade to Flow 64
      this.setState({
        editing: false,
      });
    }
    if (e.key === 'Escape') {
      // $FlowFixMe From the upgrade to Flow 64
      this.setState({
        editing: false,
      });
    }
  }

  onSubmit(editing: boolean) {
    if (this.state.text === valueToText(this.props.data)) {
      // $FlowFixMe From the upgrade to Flow 64
      this.setState({
        editing: editing,
      });
      return;
    }
    var value = textToValue(this.state.text);
    if (value === BAD_INPUT) {
      // $FlowFixMe From the upgrade to Flow 64
      this.setState({
        text: valueToText(this.props.data),
        editing: editing,
      });
      return;
    }
    this.context.onChange(this.props.path, value);
    // $FlowFixMe From the upgrade to Flow 64
    this.setState({
      editing: editing,
    });
  }

  startEditing() {
    if (this.props.readOnly) {
      return;
    }
    // $FlowFixMe From the upgrade to Flow 64
    this.setState({
      editing: true,
      text: valueToText(this.props.data),
    });
  }

  selectAll() {
    const input = this.input;
    input.selectionStart = 0;
    input.selectionEnd = input.value.length;
  }

  componentDidUpdate(prevProps: Object, prevState: Object) {
    if (this.state.editing && !prevState.editing) {
      this.selectAll();
    }
    if (!this.state.editing && this.props.data !== prevProps.data) {
      // $FlowFixMe From the upgrade to Flow 64
      flash(ReactDOM.findDOMNode(this), this.context.theme.state04, 'transparent', 1);
    }
  }

  render() {
    const {theme} = this.context;
    const {readOnly} = this.props;
    const {editing, text} = this.state;

    if (editing) {
      return (
        <Input
          autoFocus={true}
          innerRef={i => this.input = i}
          style={inputStyle(theme)}
          onChange={e => this.onChange(e)}
          onBlur={() => this.onSubmit(false)}
          onKeyDown={this.onKeyDown.bind(this)}
          value={text}
        />
      );
    }

    let {data} = this.props;
    if (typeof data === 'string' && data.length > 200) {
      data = data.slice(0, 200) + '…';
    }

    return (
      <div
        onClick={this.startEditing.bind(this)}
        style={simpleStyle(readOnly, theme)}
      >
        {valueToText(data)}
      </div>
    );
  }
}

Simple.propTypes = {
  data: React.PropTypes.any,
  path: React.PropTypes.array,
  readOnly: React.PropTypes.bool,
};

Simple.contextTypes = {
  onChange: React.PropTypes.func,
  theme: React.PropTypes.object.isRequired,
};

const inputStyle = (theme: Theme) => ({
  flex: 1,
  minWidth: 50,
  boxSizing: 'border-box',
  border: 'none',
  padding: 0,
  outline: 'none',
  boxShadow: `0 0 3px ${theme.base02}`,
  fontFamily: monospace.family,
  fontSize: 'inherit',
});

const simpleStyle = (readOnly: boolean, theme: Theme) => ({
  display: 'flex',
  flex: 1,
  whiteSpace: 'pre-wrap',
  cursor: readOnly ? 'default' : 'pointer',
});

const BAD_INPUT = Symbol('bad input');

function textToValue(txt) {
  if (!txt.length) {
    return BAD_INPUT;
  }
  if (txt === 'undefined') {
    return undefined;
  }
  try {
    return JSON.parse(txt);
  } catch (e) {
    return BAD_INPUT;
  }
}

function valueToText(value) {
  if (value === undefined) {
    return 'undefined';
  } else if (typeof value === 'number') {
    return value.toString();
  }
  return JSON.stringify(value);
}

module.exports = Simple;
