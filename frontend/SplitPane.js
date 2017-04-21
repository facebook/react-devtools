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
  width: number,
  height: number,
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
      height: props.initialHeight,
    };
  }

  componentDidMount() {
    var node = ReactDOM.findDOMNode(this);

    this.setState({
      width: this.props.isVertical ? node.offsetWidth * 0.3 : node.offsetWidth * 0.6,
      height: node.offsetHeight * 0.3,
    });
  }

  onMove(x: number, y: number) {
    var node = ReactDOM.findDOMNode(this);

    // TODO: I don't understand what this is doing.
    // It's probably related to margin and padding but it's necessary to avoid jumps:
    // https://github.com/facebook/react-devtools/issues/611
    // I can live with this for now but we should fix it.
    // How I verify that it works:
    // https://d2ppvlu71ri8gs.cloudfront.net/items/2R3J2I1S2N3s341i3c2R/Screen%20Recording%202017-04-21%20at%2004.43%20PM.gif?v=3410952d
    // (it should be smooth without jumps)
    const MAGIC = 10 + 3;

    this.setState(prevState => ({
      width: !this.props.isVertical ?
        prevState.width :
        (node.offsetLeft + node.offsetWidth - x - MAGIC),
      height: this.props.isVertical ?
        prevState.height :
        (node.offsetTop + node.offsetHeight - y - MAGIC),
    }));
  }

  render() {
    var rightStyle = assign({}, styles.rightPane, {
      width: this.props.isVertical ? this.state.width : '100%',
      height: this.props.isVertical ? '100%' : this.state.height,
      marginLeft: (this.props.isVertical) ? 0 : -3,
    });

    var containerStyles = this.props.isVertical ? styles.container : styles.containerVertical;
    var draggerStyles = this.props.isVertical ? styles.dragger : styles.draggerVertical;

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
    padding: 5,
  },

  leftPane: {
    display: 'flex',
    marginRight: -3,
    minWidth: '50%',
    minHeight: '50%',
    flex: 1,
    borderBottom: '1px solid #ccc',
  },
};

module.exports = SplitPane;
