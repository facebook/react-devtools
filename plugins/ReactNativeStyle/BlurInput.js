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
import type {DOMEvent, DOMNode} from '../../frontend/types';

type Props = {
  onChange: (text: string|number) => any;
  value: string|number;
};
type DefaultProps = {};
type State = {
  text: string;
};

class BlurInput extends React.Component {
  props: Props;
  defaultProps: DefaultProps;
  state: State;
  node: ?DOMNode;

  constructor(props: Object) {
    super(props);
    this.state = {
      text: '' + this.props.value,
      editing: false,
    };
  }

  componentWillReceiveProps(nextProps: Object) {
    this.setState({text: '' + nextProps.value});
  }

  startEditing() {
    if (this.props.readOnly) {
      return;
    }

    this.setState({
      editing: true,
      text: valueToText(this.props.value),
    });
  }

  onKeyDown(e: DOMEvent) {
    if (e.key === 'Enter') {
      this.onSubmit(true);
      this.setState({
        editing: false,
      });
    } else if (e.key === 'ArrowUp') {
      if (+this.state.text + '' === this.state.text) {
        this.props.onChange(+this.state.text + 1);
      }
    } else if (e.key === 'ArrowDown') {
      if (+this.state.text + '' === this.state.text) {
        this.props.onChange(+this.state.text - 1);
      }
    }
    if (e.key === 'Escape') {
      this.setState({
        editing: false,
      });
    }
  }

  onSubmit(editing: boolean) {
    if (this.state.text === valueToText(this.props.value)) {
      this.setState({
        editing: editing,
      });
      return;
    }
    var value = textToValue(this.state.text);
    if (value === BAD_INPUT) {
      this.setState({
        text: valueToText(this.props.value),
        editing: editing,
      });
      return;
    }
    if (this.state.text !== '' + this.props.value) {
      this.props.onChange(this.state.text);
    }
    this.setState({
      editing: editing,
    });
  }

  selectAll() {
    const node = this.node;
    node.selectionStart = 0;
    node.selectionEnd = node.value.length;
  }

  componentDidUpdate(prevProps: Object, prevState: Object) {
    if (this.state.editing && !prevState.editing) {
      this.selectAll();
    }
  }

  render() {
    if (this.state.editing) {
      return (
        <input
          autoFocus={true}
          size="15"
          value={this.state.text}
          ref={i => this.node = i}
          style={styles.input}
          onChange={e => this.setState({text: e.target.value})}
          onBlur={() => this.onSubmit(false)}
          onKeyDown={e => this.onKeyDown(e)}
        />
      );
    }

    var style = styles.simple;
    var typeStyle;
    if (!this.props.value) {
      typeStyle = valueStyles.empty;
    } else if (this.props.type === 'attr') {
      typeStyle = valueStyles.attr;
    } else if (this.props.type === 'value') {
      typeStyle = valueStyles.value;
    }
    style = assign({}, style, typeStyle);
    if (!this.props.readOnly) {
      assign(style, styles.editable);
    }
    return (
      <div
        onClick={this.startEditing.bind(this)}
        style={style}>
        {!this.props.value ? '...' : valueToText(this.props.value)}
      </div>
    );
  }
}

var styles = {
  simple: {
    display: 'flex',
    marginLeft: 8,
    whiteSpace: 'pre-wrap',
  },

  editable: {
    cursor: 'pointer',
  },

  input: {
    boxSizing: 'border-box',
    border: 'none',
    padding: 0,
    marginLeft: 8,
    outline: 'none',
    boxShadow: '0 0 3px #ccc',
    fontFamily: 'monospace',
    fontSize: 'inherit',
  },
};

var valueStyles = {
  attr: {
    color: '#c41a16',
    wordBreak: 'breakword',
  },

  value: {
    color: '#333',
    wordBreak: 'breakword',
  },

  empty: {
    color: '#bbb',
    fontStyle: 'italic',
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
    return txt;
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
  return value;
}

module.exports = BlurInput;
