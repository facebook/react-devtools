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
};

type DefaultProps = {};

type State = {
  moving: boolean,
  width: number,
};

class SplitPane extends React.Component {
  props: Props;
  defaultProps: DefaultProps;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      moving: false,
      width: props.initialWidth,
    };
  }

  onMove(x: number) {
    var node = ReactDOM.findDOMNode(this);
    this.setState({
      width: (node.offsetLeft + node.offsetWidth) - x,
    });
  }

  render() {
    var dragStyle = styles.dragger;
    if (this.state.moving) {
      dragStyle = assign({}, dragStyle, styles.draggerMoving);
    }
    var rightStyle = assign({}, styles.rightPane, {
      width: this.state.width,
    });
    return (
      <div style={styles.container}>
        <div style={styles.leftPane}>
          {this.props.left()}
        </div>
        <Draggable
          style={dragStyle}
          onStart={() => this.setState({moving: true})}
          onMove={x => this.onMove(x)}
          onStop={() => this.setState({moving: false})}
        />
        <div style={rightStyle}>
          {this.props.right()}
        </div>
      </div>
    );
  }
}

var styles = {
  container: {
    display: 'flex',
    minWidth: 0,
    flex: 1,
  },

  dragger: {
    cursor: 'ew-resize',
    borderWidth: '0 5px',
    backgroundColor: '#ccc',
    width: 1,
    borderStyle: 'solid',
    borderColor: 'white',
  },

  draggerMoving: {
    backgroundColor: '#aaf',
  },

  rightPane: {
    display: 'flex',
  },

  leftPane: {
    display: 'flex',
    minWidth: 0,
    flex: 1,
  },
};

module.exports = SplitPane;
