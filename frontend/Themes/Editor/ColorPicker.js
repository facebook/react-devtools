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
const {CustomPicker} = require('react-color');
const {Hue, Saturation} = require('react-color/lib/components/common');

import type {DOMEvent, Rectangle, Theme} from '../../types';

type Props = {
  color: string,
  hide: () => void,
  isOpen: boolean,
  targetPos: Rectangle,
  theme: Theme,
  updateColor: (color: string) => void,
};

type State = {
  height: number,
  width: number,
};

class ColorPicker extends React.Component {
  props: Props;
  state: State = {
    height: 0,
    width: 0,
  };

  _ref: any;

  componentDidMount() {
    document.addEventListener('keydown', this._onKeyDown);

    const node = findDOMNode(this._ref);

    this.setState({
      height: node.offsetHeight,
      width: node.offsetWidth,
    });
  }

  componenWillUnmount() {
    document.removeEventListener('keydown', this._onKeyDown);
  }

  render() {
    const {height, width} = this.state;
    const {color, hide, isOpen, targetPos, theme} = this.props;

    if (!isOpen) {
      return null;
    }

    return (
      <div
        onClick={hide}
        style={styles.container}
      >
        <div
          onClick={blockEvent}
          ref={this._setRef}
          style={positionerStyle(targetPos, width, height)}
        >
          <DecoratedCustomColorPicker
            color={color}
            disableAlpha={true}
            onChangeComplete={this._onChangeComplete}
            theme={theme}
          />
        </div>
      </div>
    );
  }

  // $FlowFixMe ^ class property `_onChangeComplete`. Missing annotation
  _onChangeComplete = (color) => {
    this.props.updateColor(color.hex);
  };

  // $FlowFixMe ^ class property `_onClose`. Missing annotation
  _onClose = () => {
    this.props.hide();
  };

  // $FlowFixMe ^ class property `_onKeyDown`. Missing annotation
  _onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.props.hide();
    }
  };

  // $FlowFixMe ^ class property `_setRef`. Missing annotation
  _setRef = (ref) => {
    this._ref = ref;
  };
}

function blockEvent(event: DOMEvent) {
  event.stopPropagation();
}

class CustomColorPicker extends React.Component {
  render() {
    return (
      <div style={customColorPicker(this.props.theme)}>
        <div style={styles.saturation}>
          <Saturation
            {...this.props}
            onChange={ this.props.onChange }
          />
        </div>
        <div style={styles.hue}>
          <Hue
            {...this.props}
            onChange={ this.props.onChange }
            direction="vertical"
          />
        </div>
      </div>
    );
  }
}

const DecoratedCustomColorPicker = CustomPicker(CustomColorPicker);

const customColorPicker = (theme) => ({
  display: 'flex',
  flexDirection: 'row',
  padding: '0.25rem',
  borderRadius: '0.25rem',
  background: theme.base00,
  border: `1px solid ${theme.base03}`,
});

const positionerStyle = (targetPos: Rectangle, width: number, height: number) => {
  let left = targetPos.left + (targetPos.width / 2) - (width / 2);
  let top = targetPos.top + (targetPos.height / 2) - (height / 2);

  left = Math.min(Math.max(10, left), document.body.scrollWidth - width);
  top = Math.min(Math.max(10, top), document.body.scrollHeight - height);

  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 2,
  };
};

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  saturation: {
    position: 'relative',
    width: '10rem',
    height: '10rem',
  },
  hue: {
    position: 'relative',
    width: '1rem',
    height: '10rem',
    marginLeft: '0.25rem',
  },
};

module.exports = ColorPicker;
