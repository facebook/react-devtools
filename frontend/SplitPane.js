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
var Draggable = require('./Draggable');

import type {Theme} from './types';

type Context = {
  theme: Theme,
};

type Props = {
  style?: {[key: string]: any},
  left: () => React.Element<*>,
  right: () => React.Element<*>,
  initialWidth: number,
  initialHeight: number,
  isVertical: bool,
};

type State = {
  moving: boolean,
  width: number,
  height: number,
};

type DOMOffsetElement = {
  offsetWidth: number,
  offsetHeight: number,
  offsetLeft: number,
  offsetRight: number,
  offsetTop: number
}

class SplitPane extends React.Component {
  context: Context;
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      moving: false,
      width: props.initialWidth,
      height: props.initialHeight,
    };
  }

  componentDidMount() {
    var node: DOMOffsetElement = (ReactDOM.findDOMNode(this): any);

    if (node) {
      this.setState({
        width: Math.floor(node.offsetWidth * (this.props.isVertical ? 0.6 : 0.3)),
        height: Math.floor(node.offsetHeight * 0.3),
      });
    }
  }

  onMove(x: number, y: number) {
    var node: DOMOffsetElement = (ReactDOM.findDOMNode(this): any);

    if (node && node.offsetWidth && node.offsetHeight && node.offsetLeft && node.offsetRight) {
      this.setState(prevState => ({
        width: this.props.isVertical ?
          prevState.width :
          Math.floor(node.offsetLeft + node.offsetWidth - x),
        height: !this.props.isVertical ?
          prevState.height :
          Math.floor(node.offsetTop + node.offsetHeight - y),
      }));
    }
  }

  render() {
    const {theme} = this.context;
    const {isVertical} = this.props;
    const {height, width} = this.state;

    return (
      <div style={containerStyle(isVertical)}>
        <div style={styles.leftPane}>
          {this.props.left()}
        </div>
        <div style={rightStyle(isVertical, width, height)}>
          <Draggable
            style={draggerStyle(isVertical)}
            onStart={() => this.setState({moving: true})}
            onMove={(x, y) => this.onMove(x, y)}
            onStop={() => this.setState({moving: false})}>
            <div style={draggerInnerStyle(isVertical, theme)} />
          </Draggable>
          <div style={styles.rightPane}>
            {this.props.right()}
          </div>
        </div>
      </div>
    );
  }
}

SplitPane.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const containerStyle = (isVertical: boolean) => ({
  display: 'flex',
  minWidth: 0,
  flex: 1,
  flexDirection: isVertical ? 'column' : 'row',
});

const draggerInnerStyle = (isVertical: boolean, theme: Theme) => ({
  height: isVertical ? '1px' : '100%',
  width: isVertical ? '100%' : '1px',
  backgroundColor: theme.base04,
});

const draggerStyle = (isVertical: boolean) => ({
  position: 'relative',
  zIndex: 1,
  padding: isVertical ? '0.25rem 0' : '0 0.25rem',
  margin: isVertical ? '-0.25rem 0' : '0 -0.25rem',
  cursor: isVertical ? 'ns-resize' : 'ew-resize',
});

const rightStyle = (isVertical: boolean, width: number, height: number) => ({
  ...containerStyle(isVertical),
  width: isVertical ? '100%' : width,
  height: isVertical ? height : '100%',
  flex: 'initial',
  minHeight: 120,
  minWidth: 150,
});

const styles = {
  rightPane: {
    display: 'flex',
    width: '100%',
  },
  leftPane: {
    display: 'flex',
    minWidth: '50%',
    minHeight: '50%',
    flex: 1,
  },
};

module.exports = SplitPane;
