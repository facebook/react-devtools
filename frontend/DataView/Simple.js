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

var assign = require('object-assign');
var flash = require('../flash');
var valueStyles = require('../value-styles');

import type {DOMEvent, DOMNode} from '../types';

type State = {
  editing: boolean,
  text: string,
};

class Simple extends React.Component {
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
      flash(ReactDOM.findDOMNode(this), 'rgba(0, 255, 0, 1)', 'transparent', 1);
    }
  }

  render() {
    if (this.state.editing) {
      return (
        <input
          autoFocus={true}
          ref={i => this.input = i}
          style={styles.input}
          onChange={e => this.onChange(e)}
          onBlur={() => this.onSubmit(false)}
          onKeyDown={this.onKeyDown.bind(this)}
          value={this.state.text}
        />
      );
    }

    var data = this.props.data;
    var type = typeof data;
    var style = styles.simple;
    var typeStyle;
    if (type === 'boolean') {
      typeStyle = valueStyles.bool;
    } else if (!this.props.data) {
      typeStyle = valueStyles.empty;
    } else if (type === 'string') {
      typeStyle = valueStyles.string;
      if (data.length > 200) {
        data = data.slice(0, 200) + '…';
      }
    } else if (type === 'number') {
      typeStyle = valueStyles.number;
    }
    style = assign({}, style, typeStyle);
    if (!this.props.readOnly) {
      assign(style, styles.editable);
    }
    return (
      <div
        onClick={this.startEditing.bind(this)}
        style={style}>
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
};

var styles = {
  simple: {
    display: 'flex',
    flex: 1,
    whiteSpace: 'pre-wrap',
  },

  editable: {
    cursor: 'pointer',
  },

  input: {
    flex: 1,
    minWidth: 50,
    boxSizing: 'border-box',
    border: 'none',
    padding: 0,
    outline: 'none',
    boxShadow: '0 0 3px #ccc',
    fontFamily: 'monospace',
    fontSize: 'inherit',
  },
};

var BAD_INPUT = Symbol('bad input');

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
