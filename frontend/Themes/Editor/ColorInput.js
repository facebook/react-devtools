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
const {findDOMNode} = require('react-dom');
const ColorPicker = require('./ColorPicker');
const {monospace} = require('../../Themes/Fonts');
const {isBright} = require('../utils');

import type {Theme} from '../../types';

type Props = {
  customTheme: Theme,
  label: string,
  propertyName: string,
  theme: Theme,
  udpatePreview: () => void,
};

type State = {
  color: string,
  isColorPickerOpen: boolean,
  maxHeight: ?number,
};

class ColorInput extends React.Component {
  props: Props;
  state: State;

  _containerRef: any;

  constructor(props: Props, context: any) {
    super(props, context);

    const {customTheme, propertyName} = props;

    this.state = {
      color: customTheme[propertyName],
      isColorPickerOpen: false,
      maxHeight: null,
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    const {customTheme, propertyName} = nextProps;

    this.setState({
      color: customTheme[propertyName],
    });
  }

  render() {
    const {label, theme} = this.props;
    const {color, isColorPickerOpen, maxHeight} = this.state;

    const backgroundIsBright = isBright(theme.base00);
    const chipIsBright = isBright(color);

    return (
      <div
        ref={this._setContainerRef}
        style={containerStyle(maxHeight)}
      >
        <label style={styles.label}>
          {label}
        </label>
        {!isColorPickerOpen && (
          <div style={inputContainerStyle(theme)}>
            <div
              onClick={this._onClick}
              style={colorChipStyle(theme, color, backgroundIsBright === chipIsBright)}
            ></div>
            <input
              onChange={this._onChange}
              style={styles.input}
              type="text"
              value={color || ''}
            />
          </div>
        )}
        {isColorPickerOpen && (
          <ColorPicker
            color={color}
            isOpen={isColorPickerOpen}
            hide={this._hideColorPicker}
            theme={theme}
            updateColor={this._updateColor}
          />
        )}
      </div>
    );
  }

  // $FlowFixMe ^ class property `_hideColorPicker`. Missing annotation
  _hideColorPicker = () => {
    this.setState({
      isColorPickerOpen: false,
      maxHeight: null,
    });
  };

  // $FlowFixMe ^ class property `_onChange`. Missing annotation
  _onChange = ({ target }) => {
    this._updateColor(target.value);
  };

  // $FlowFixMe ^ class property `_onClick`. Missing annotation
  _onClick = (event) => {
    const container = findDOMNode(this._containerRef);

    this.setState({
      isColorPickerOpen: true,
      maxHeight: container.offsetHeight,
    });
  };

  // $FlowFixMe ^ class property `_setContainerRef`. Missing annotation
  _setContainerRef = (ref: any) => {
    this._containerRef = ref;
  };

  // $FlowFixMe ^ class property `_onChange`. Missing annotation
  _updateColor = (color: string) => {
    const {customTheme, propertyName, udpatePreview} = this.props;

    customTheme[propertyName] = color;

    this.setState({
      color,
    });

    udpatePreview();
  };
}

const containerStyle = (maxHeight: ?number) => ({
  margin: '0.25rem',
  minWidth: '7.5rem',
  maxHeight,
});

const colorChipStyle = (theme: Theme, color: string = '', showBorder: boolean = false) => ({
  height: '1.25rem',
  width: '1.25rem',
  borderRadius: '2px',
  backgroundColor: color,
  boxSizing: 'border-box',
  cursor: 'pointer',
  border: showBorder ? `1px solid ${theme.base03}` : 'none',
});

const inputContainerStyle = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: '0.125rem',
  flex: '0 0 1.25rem',
  backgroundColor: theme.base00,
  color: theme.base05,
  border: `1px solid ${theme.base03}`,
  borderRadius: '0.25rem',
});

const styles = {
  input: {
    width: '5rem',
    flex: '1 0 auto',
    textTransform: 'lowercase',
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
