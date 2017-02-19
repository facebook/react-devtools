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

type DefaultProps = {
  isVertical: true,
};

type State = {
  moving: boolean,
  width: string,
  height: string,
};

class SplitPane extends React.Component {
  props: Props;
  defaultProps: DefaultProps;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      moving: false,
      width: (props.isVertical) ? '100%' : props.initialWidth.toString(),
      height: (!props.isVertical) ? '100%' : props.initialHeight.toString(),
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.isVertical && !this.props.isVertical) {
      this.setState({width: '100%'});
    } else if (!nextProps.isVertical && this.props.isVertical) {
      this.setState({height: '100%'});
    }
  }

  onMove(x: number, y: number) {
    var node = ReactDOM.findDOMNode(this);
    this.setState({
      width: (this.props.isVertical) ? '100%' : ((node.offsetLeft + node.offsetWidth) - x).toString(),
      height: (!this.props.isVertical) ? '100%' : ((node.offsetTop + node.offsetHeight) - y).toString(),
    });
  }

  render() {
    var rightStyle = assign({}, styles.rightPane, {
      width: (this.state.width === '100%') ? '100%' : parseInt(this.state.width, 10),
      height: (this.state.height === '100%') ? '100%' : parseInt(this.state.height, 10),
      marginLeft: (this.props.isVertical) ? 0 : -3,
    });

    var containerStyles = (this.props.isVertical) ? styles.containerVertical : styles.container;
    var draggerStyles = (this.props.isVertical) ? styles.draggerVertical : styles.dragger;

    return (
      <div style={containerStyles}>
        <div style={styles.leftPane}>
          {this.props.left()}
        </div>
        <Draggable
          style={draggerStyles}
          onStart={() => this.setState({moving: true})}
          onMove={(x, y) => this.onMove(x, y)}
          onStop={() => this.setState({moving: false})}>
          <div style={styles.draggerInner} />
        </Draggable>
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

  containerVertical: {
    display: 'flex',
    minWidth: 0,
    flex: 1,
    flexDirection: 'column',
  },

  dragger: {
    padding: '0 3px',
    cursor: 'ew-resize',
    position: 'relative',
    zIndex: 1,
  },

  draggerVertical: {
    backgroundColor: '#efefef',
    padding: '3px 0',
    cursor: 'ns-resize',
    position: 'relative',
    zIndex: 1,
  },

  draggerInner: {
    backgroundColor: '#ccc',
    height: '100%',
    width: 1,
  },

  rightPane: {
    display: 'flex',
    marginLeft: -3,
    minWidth: 100,
    minHeight: 100,
  },

  leftPane: {
    display: 'flex',
    marginRight: -3,
    minWidth: 255,
    minHeight: 100,
    flex: 1,
    borderBottom: '1px solid #ccc',
  },
};

module.exports = SplitPane;
