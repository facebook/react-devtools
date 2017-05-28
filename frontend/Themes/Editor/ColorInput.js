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

const React = require('react');
const {monospace} = require('../../Themes/Fonts');
const {isBright} = require('../utils');

import type {Theme} from '../../types';

type Props = {
  customTheme: Theme,
  label: string,
  propertyName: string,
  theme: Theme,
};

type State = {
  color: string,
};

class ColorInput extends React.Component {
  props: Props;
  state: State;

  constructor(props: Props, context: any) {
    super(props, context);

    const {customTheme, propertyName} = props;

    this.state = {
      color: customTheme[propertyName],
    };
  }

  render() {
    const {label, theme} = this.props;
    const {color} = this.state;

    const backgroundIsBright = isBright(theme.base00);
    const chipIsBright = isBright(color);

    return (
      <div style={styles.container}>
        <label style={styles.label}>
          {label}
        </label>
        <div style={inputContainerStyle(theme)}>
          <div style={colorChipStyle(theme, color, backgroundIsBright === chipIsBright)}></div>
          <input
            defaultValue={color.toUpperCase()}
            onChange={this._onChange}
            size={7}
            style={styles.input}
          />
        </div>
      </div>
    );
  }

  // $FlowFixMe Why is Flow saying "class property `_onChange`. Missing annotation"
  _onChange = ({ target }) => {
    const {customTheme, propertyName} = this.props;

    const color = target.value;

    customTheme[propertyName] = color;

    this.setState({color});
  };
}

const colorChipStyle = (theme: Theme, color: string, showBorder: boolean) => ({
  height: '1.5rem',
  width: '1.5rem',
  borderRadius: '2px',
  backgroundColor: color,
  boxSizing: 'border-box',
  border: showBorder ? `1px solid ${theme.base03}` : 'none',
});

const inputContainerStyle = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: '0.25rem',
  backgroundColor: theme.base00,
  color: theme.base05,
  border: `1px solid ${theme.base03}`,
  borderRadius: '0.25rem',
});

const styles = {
  container: {
    margin: '0.25rem',
    minWidth: '7.5rem',
  },
  input: {
    boxSizing: 'border-box',
    background: 'transparent',
    border: 'none',
    marginLeft: '0.25rem',
    outline: 'none',
    color: 'inherit',
    fontFamily: monospace.family,
    fontSize: monospace.sizes.large,
  },
  label: {
    marginBottom: '0.25rem',
    display: 'inline-block',
  },
  small: {
    fontWeight: 'normal',
  },
};

module.exports = ColorInput;
