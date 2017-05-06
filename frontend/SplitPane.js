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

var assign = require('object-assign');

type Props = {
  style?: {[key: string]: any},
  left: () => React$Element,
  right: () => React$Element,
  initialWidth: number,
  initialHeight: number,
  isVertical: bool,
};

type State = {
  moving: boolean,
  width: number,
  height: number,
};

class SplitPane extends React.Component {
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
    var node = ReactDOM.findDOMNode(this);

    this.setState({
      width: Math.floor(node.offsetWidth * (this.props.isVertical ? 0.6 : 0.3)),
      height: Math.floor(node.offsetHeight * 0.3),
    });
  }

  onMove(x: number, y: number) {
    var node = ReactDOM.findDOMNode(this);

    this.setState(prevState => ({
      width: this.props.isVertical ?
        prevState.width :
        Math.floor(node.offsetLeft + node.offsetWidth - x),
      height: !this.props.isVertical ?
        prevState.height :
        Math.floor(node.offsetTop + node.offsetHeight - y),
    }));
  }

  render() {
    var containerStyles = this.props.isVertical ?
      styles.containerVertical : styles.containerHorizontal;
    var draggerStyles = assign({}, styles.dragger,
      this.props.isVertical ?
        styles.draggerVertical :
        styles.draggerHorizontal
    );
    var draggerInnerStyles = assign({}, styles.draggerInner,
      this.props.isVertical ?
        styles.draggerInnerVertical :
        styles.draggerInnerHorizontal
    );
    var rightStyles = assign({}, containerStyles, {
      width: this.props.isVertical ? '100%' : this.state.width,
      height: this.props.isVertical ? this.state.height : '100%',
      flex: 'initial',
      minHeight: 120,
      minWidth: 150,
    });
    return (
      <div style={containerStyles}>
        <div style={styles.leftPane}>
          {this.props.left()}
        </div>
        <div style={rightStyles}>
          <Draggable
            style={draggerStyles}
            onStart={() => this.setState({moving: true})}
            onMove={(x, y) => this.onMove(x, y)}
            onStop={() => this.setState({moving: false})}>
            <div style={draggerInnerStyles} />
          </Draggable>
          <div style={styles.rightPane}>
            {this.props.right()}
          </div>
        </div>
      </div>
    );
  }
}

var styles = {
  containerHorizontal: {
    display: 'flex',
    minWidth: 0,
    flex: 1,
  },

  containerVertical: {
    display: 'flex',
    minWidth: 0,
    flex: 1,
    flexDirection: 'column',
  },

  dragger: {
    position: 'relative',
    zIndex: 1,
  },

  draggerHorizontal: {
    padding: '0 0.25rem',
    margin: '0 -0.25rem',
    cursor: 'ew-resize',
  },

  draggerVertical: {
    padding: '0.25rem 0',
    margin: '-0.25rem 0',
    cursor: 'ns-resize',
  },

  draggerInner: {
  },

  draggerInnerHorizontal: {
    height: '100%',
    width: '1px',
  },

  draggerInnerVertical: {
    height: '1px',
    width: '100%',
  },

  rightPane: {
    display: 'flex',
    width: '100%',
    padding: 4,
  },

  leftPane: {
    display: 'flex',
    minWidth: '50%',
    minHeight: '50%',
    flex: 1,
  },
};

module.exports = SplitPane;
