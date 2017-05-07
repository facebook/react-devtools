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

type BoxMeasurements = {
  top: number,
  left: number,
  right: number,
  bottom: number,
}

type BoxProps = BoxMeasurements & {
  title: string,
  children: React$Element,
};

var Box = (props: BoxProps) => {
  var {title, children, top, left, right, bottom} = props;
  return (
    <div style={styles.box}>
      <span style={styles.label}>{title}</span>
      <div style={styles.boxText}>{+top.toFixed(3)}</div>
      <div style={styles.row}>
        <span style={styles.boxText}>{+left.toFixed(3)}</span>
        {children}
        <span style={styles.boxText}>{+right.toFixed(3)}</span>
      </div>
      <div style={styles.boxText}>{+bottom.toFixed(3)}</div>
    </div>
  );
};

class BoxInspector extends React.Component {
  props: {
    left: number,
    top: number,
    width: number,
    height: number,
    margin: BoxMeasurements,
    padding: BoxMeasurements,
  };

  render() {
    const {left, top, width, height, margin, padding} = this.props;
    return (
      <Box title="margin" {...margin}>
        <Box title="padding" {...padding}>
          <div style={styles.measureLayout}>
            <span style={styles.positionText}>
              ({+left.toFixed(3)}, {+top.toFixed(3)})
            </span>
            <span style={styles.dimenText}>
              {+width.toFixed(3)} &times; {+height.toFixed(3)}
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
    position: 'absolute',
    color: '#c41a16',
  },
  measureLayout: {
    display: 'flex',
    flexDirection: 'column',
    margin: 4,
  },
  dimenText: {
    color: '#1c00cf',
    textAlign: 'center',
  },
  positionText: {
    color: '#bbb',
    fontSize: 10,
    textAlign: 'center',
  },
  box: {
    padding: 8,
    margin: 8,
    width: 184,
    border: '1px dashed grey',
    alignItems: 'center',
    alignSelf: 'center',
  },
  boxText: {
    textAlign: 'center',
  },
};

module.exports = BoxInspector;
