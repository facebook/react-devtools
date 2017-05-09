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

import type {Base16Theme} from '../../frontend/types';

type BoxMeasurements = {
  top: number,
  left: number,
  right: number,
  bottom: number,
}

type BoxProps = BoxMeasurements & {
  title: string,
  children: React$Element,
  theme: Base16Theme,
};

var Box = (props: BoxProps) => {
  var {title, children, top, left, right, bottom, theme} = props;
  return (
    <div style={boxStyle(theme)}>
      <div style={styles.row}>
        <span style={labelStyle(theme)}>{title}</span>
        <span style={styles.boxText}>{+top.toFixed(3)}</span>
      </div>
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
  context: {
    theme: Base16Theme,
  };
  props: {
    left: number,
    top: number,
    width: number,
    height: number,
    margin: BoxMeasurements,
    padding: BoxMeasurements,
  };

  render() {
    const {theme} = this.context;
    const {left, top, width, height, margin, padding} = this.props;
    return (
      <Box theme={theme} title="margin" {...margin}>
        <Box theme={theme} title="padding" {...padding}>
          <div style={styles.measureLayout}>
            <span style={innerTextStyle(theme)}>
              ({+left.toFixed(3)}, {+top.toFixed(3)})
            </span>
            <span style={innerTextStyle(theme)}>
              {+width.toFixed(3)} &times; {+height.toFixed(3)}
            </span>
          </div>
        </Box>
      </Box>
    );
  }
}

BoxInspector.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const labelStyle = (theme: Base16Theme) => ({
  flex: 1,
  color: theme.base0C,
});

const innerTextStyle = (theme: Base16Theme) => ({
  color: theme.base0B,
  textAlign: 'center',
});

const boxStyle = (theme: Base16Theme) => ({
  padding: 8,
  margin: 8,
  width: 208,
  border: `1px dashed ${theme.base05}`,
  alignItems: 'center',
});

var styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  measureLayout: {
    display: 'flex',
    flexDirection: 'column',
    margin: 4,
  },
  boxText: {
    textAlign: 'center',
  },
};

module.exports = BoxInspector;
