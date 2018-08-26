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

const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');
const Draggable = require('./Draggable');
const nullthrows = require('nullthrows').default;

import type {Theme} from './types';

type Context = {
  theme: Theme,
};

type Props = {
  style?: {[key: string]: any},
  left: () => React.Node,
  right: () => React.Node,
  initialWidth?: number,
  initialHeight?: number,
  isVertical: bool,
};

type State = {
  moving: boolean,
  width: number,
  height: number,
};

class SplitPane extends React.Component<Props, State> {
  context: Context;

  constructor(props: Props) {
    super(props);
    this.state = {
      moving: false,
      // actual size will be set in cDM
      width: 10,
      height: 10,
    };
  }

  componentDidMount() {
    // $FlowFixMe use a ref on the root
    var node: HTMLDivElement = nullthrows(ReactDOM.findDOMNode(this));

    const { initialWidth, initialHeight } = this.props;

    // come up with a size when initial size values are not provided
    const width = Math.floor(node.offsetWidth * (this.props.isVertical ? 0.6 : 0.3));
    this.setState({
      width: initialWidth || Math.min(250, width),
      height: initialHeight || Math.floor(node.offsetHeight * 0.3),
    });
  }

  onMove(x: number, y: number) {
    // $FlowFixMe use a ref on the root
    var rect = ReactDOM.findDOMNode(this).getBoundingClientRect();

    this.setState(prevState => ({
      width: this.props.isVertical ?
        prevState.width :
        Math.floor(rect.left + rect.width - x),
      height: !this.props.isVertical ?
        prevState.height :
        Math.floor(rect.top + rect.height - y),
    }));
  }

  render() {
    const {theme} = this.context;
    const {isVertical} = this.props;
    const {height, width, moving} = this.state;

    return (
      <div style={containerStyle(isVertical)}>
        <div style={leftPaneStyle(isVertical, moving)}>
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
          <div style={rightPaneStyle(moving)}>
            {this.props.right()}
          </div>
        </div>
      </div>
    );
  }
}

SplitPane.contextTypes = {
  theme: PropTypes.object.isRequired,
};

const containerStyle = (isVertical: boolean) => ({
  display: 'flex',
  minWidth: 0,
  flex: 1,
  flexDirection: isVertical ? 'column' : 'row',
  maxWidth: '100vw',
  minHeight: isVertical ? 30 : null,
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
  width: isVertical ? null : width,
  height: isVertical ? height : null,
  flex: 'initial',
});

const leftPaneStyle = (isVertical: boolean, moving: boolean) => ({
  display: 'flex',
  minWidth: '50%',
  minHeight: isVertical ? '10%' : '50%',
  flex: 1,
  overflow: 'hidden',
  pointerEvents: moving ? 'none' : null,
});

const rightPaneStyle = (moving: boolean) => ({
  display: 'flex',
  width: '100%',
  height: '100%',
  overflow: 'auto',
  pointerEvents: moving ? 'none' : null,
});

module.exports = SplitPane;
