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

import type {Theme, DOMEvent, DOMNode} from '../types';

const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');

const Input = require('../Input');
const flash = require('../flash');
const {monospace} = require('../Themes/Fonts');

type Props = {
  data: any,
  path: Array<string>,
  readOnly: ?boolean,
}

type State = {
  editing: boolean,
  text: string,
};

class Simple extends React.Component<Props, State> {
  context: {
    onChange: (path: Array<any>, value: any) => void,
    theme: Theme,
  };
  input: DOMNode;

  constructor(props: Object) {
    super(props);
    this.state = {
      text: '',
      editing: false,
    };
  }

  onChange(e: DOMEvent) {
    this.setState({
      text: e.target.value,
    });
  }

  onKeyDown(e: DOMEvent) {
    if (e.key === 'Enter') {
      this.onSubmit(true);
      this.setState({
        editing: false,
      });
    }
    if (e.key === 'Escape') {
      this.setState({
        editing: false,
      });
    }
  }

  onSubmit(editing: boolean) {
    if (this.state.text === valueToText(this.props.data)) {
      this.setState({
        editing: editing,
      });
      return;
    }
    var value = textToValue(this.state.text);
    if (value === BAD_INPUT) {
      this.setState({
        text: valueToText(this.props.data),
        editing: editing,
      });
      return;
    }
    this.context.onChange(this.props.path, value);
    this.setState({
      editing: editing,
    });
  }

  startEditing() {
    if (this.props.readOnly) {
      return;
    }
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
      // $FlowFixMe replace with root ref
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
  data: PropTypes.any,
  path: PropTypes.array,
  readOnly: PropTypes.bool,
};

Simple.contextTypes = {
  onChange: PropTypes.func,
  theme: PropTypes.object.isRequired,
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

const simpleStyle = (readOnly: ?boolean, theme: Theme) => ({
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
