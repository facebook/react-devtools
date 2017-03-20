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

type Props = {
  style: Object,
  left: number,
  top: number,
  width: number,
  height: number,
  margin: Object,
  padding: Object,
};

type DefaultProps = {};

type BoxProps = {
  title: string,
  box: {
    top: number,
    left: number,
    right: number,
    bottom: number,
  },
  children: React$Element,
};

var Box = (props: BoxProps) => {
  var box = props.box;
  return (
    <div style={styles.box}>
      <div style={styles.row}>
        <span style={styles.label}>{props.title}</span>
        <span style={styles.boxText}>{box.top}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.boxText}>{box.left}</span>
        {props.children}
        <span style={styles.boxText}>{box.right}</span>
      </div>
      <div style={styles.boxText}>{box.bottom}</div>
    </div>
  );
};

class BoxInspector extends React.Component {
  props: Props;
  defaultProps: DefaultProps;

  render() {
    const {left, top, width, height, margin, padding} = this.props;
    return (
      <Box title="margin" box={margin}>
        <Box title="padding" box={padding}>
          <div style={styles.measureLayout}>
            <span style={styles.innerText}>
              ({left}, {top})
            </span>
            <span style={styles.innerText}>
              {width} &times; {height}
            </span>
          </div>
        </Box>
      </Box>
    );
  }
}

var styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    color: 'rgb(255,100,0)',
  },
  measureLayout: {
    display: 'flex',
    flexDirection: 'column',
    margin: 4,
  },
  innerText: {
    color: 'blue',
    textAlign: 'center',
  },
  box: {
    padding: 8,
    margin: 8,
    width: 200,
    border: '1px solid grey',
    alignItems: 'center',
  },
  boxText: {
    textAlign: 'center',
  },
};

module.exports = BoxInspector;
