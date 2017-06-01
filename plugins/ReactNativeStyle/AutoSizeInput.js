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
var {monospace} = require('../../frontend/Themes/Fonts');
var Input = require('../../frontend/Input');

type Props = {
  onChange: (text: string|number) => any,
  value: string|number,
  type?: string,
  isNew?: boolean,
};
type DefaultProps = {};
type State = {
  text: string;
  inputWidth: number;
};

class AutoSizeInput extends React.Component {
  props: Props;
  defaultProps: DefaultProps;
  state: State;
  input: HTMLInputElement;
  sizer: HTMLDivElement;

  constructor(props: Object) {
    super(props);
    this.state = {
      text: '' + this.props.value,
      inputWidth: 1,
    };
  }

  componentDidMount() {
    this.copyInputStyles();
    this.updateInputWidth();
    if (this.props.isNew) {
      this.input.focus();
    }
  }

  componentDidUpdate(prevProps: Object, prevState: Object) {
    this.updateInputWidth();
  }

  componentWillReceiveProps(nextProps: Object) {
    this.setState({text: '' + nextProps.value});
  }

  copyInputStyles() {
    if (!window.getComputedStyle) {
      return;
    }
    const inputStyle = this.input && window.getComputedStyle(this.input);
    if (!inputStyle) {
      return;
    }
    const sizerNode = this.sizer;
    sizerNode.style.fontSize = inputStyle.fontSize;
    sizerNode.style.fontFamily = inputStyle.fontFamily;
    sizerNode.style.fontWeight = inputStyle.fontWeight;
    sizerNode.style.fontStyle = inputStyle.fontStyle;
    sizerNode.style.letterSpacing = inputStyle.letterSpacing;
  }

  updateInputWidth() {
    if (!this.sizer || typeof this.sizer.scrollWidth === 'undefined') {
      return;
    }
    const width = this.sizer.scrollWidth + 1;
    if (width !== this.state.inputWidth) {
      this.setState({
        inputWidth: width,
      });
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === 'Escape') {
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

  onFocus() {
    const input = this.input;
    input.selectionStart = 0;
    input.selectionEnd = input.value.length;
    input.style.color = '#333';
    input.style.boxShadow = '0 0 3px #ccc';
    input.style.border = '1px solid #ccc';
    input.style.padding = '0px 1px';
  }

  done() {
    const input = this.input;
    input.style.color = this.getColor();
    input.style.boxShadow = 'none';
    input.style.border = 'none';
    input.style.padding = '1px 2px';
    if (this.state.text !== '' + this.props.value || this.props.isNew) {
      this.props.onChange(this.state.text);
    }
  }

  getColor() {
    return this.props.type === 'attr' ? '#c41a16' : '#333';
  }

  render() {
    const style = inputStyle(this.state.text);
    style.color = this.getColor();
    style.width = this.state.inputWidth + 'px';
    return (
      <div style={styles.wrapper}>
        <Input
          ref={i => this.input = i}
          value={this.state.text}
          style={style}
          onChange={e => this.setState({text: e.target.value})}
          onFocus={() => this.onFocus()}
          onBlur={() => this.done()}
          onKeyDown={e => this.onKeyDown(e)}
        />
        <div ref={el => this.sizer = el} style={styles.sizer}>{this.state.text}</div>
      </div>
    );
  }
}

const inputStyle = (text: ?string) => ({
  fontFamily: monospace.family,
  fontSize: monospace.sizes.normal,
  boxSizing: 'content-box',
  border: 'none',
  padding: '1px 2px',
  marginLeft: 6,
  outline: 'none',
  width: '0px',
  color: '#333',
  minWidth: text ? '0' : '1rem', // Make it easier to click initially
});

var styles = {
  wrapper: {
    display: 'inline-block',
  },
  sizer: {
    position: 'absolute',
    top: 0,
    left: 0,
    visibility: 'hidden',
    height: 0,
    overflow: 'scroll',
    whiteSpace: 'pre',
  },
};

module.exports = AutoSizeInput;
