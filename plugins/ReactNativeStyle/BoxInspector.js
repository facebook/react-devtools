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

var React = require('react');
var {sansSerif} = require('../../frontend/Themes/Fonts');

import type {Theme} from '../../frontend/types';

type BoxMeasurements = {
  top: number,
  left: number,
  right: number,
  bottom: number,
}

type BoxProps = BoxMeasurements & {
  title: string,
  children: React.Node,
  theme: Theme,
};

var Box = (props: BoxProps) => {
  var {title, children, top, left, right, bottom, theme} = props;
  return (
    <div style={boxStyle(theme)}>
      <span style={labelStyle(theme)}>{title}</span>
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

type BoxInspectorProps = {
  left: number,
  top: number,
  width: number,
  height: number,
  margin: BoxMeasurements,
  padding: BoxMeasurements,
}

class BoxInspector extends React.Component<BoxInspectorProps> {
  context: {
    theme: Theme,
  };

  render() {
    const {theme} = this.context;
    const {left, top, width, height, margin, padding} = this.props;
    return (
      <Box theme={theme} title="margin" {...margin}>
        <Box theme={theme} title="padding" {...padding}>
          <div style={styles.measureLayout}>
            <span style={positionTextStyle(theme)}>
              ({+left.toFixed(3)}, {+top.toFixed(3)})
            </span>
            <span style={dimenTextStyle(theme)}>
              {+width.toFixed(3)} &times; {+height.toFixed(3)}
            </span>
          </div>
        </Box>
      </Box>
    );
  }
}

BoxInspector.contextTypes = {
  theme: PropTypes.object.isRequired,
};

const labelStyle = (theme: Theme) => ({
  flex: 1,
  color: theme.special03,
});

const positionTextStyle = (theme: Theme) => ({
  color: theme.base03,
  fontSize: sansSerif.sizes.normal,
  textAlign: 'center',
});

const dimenTextStyle = (theme: Theme) => ({
  color: theme.special02,
  textAlign: 'center',
});

const boxStyle = (theme: Theme) => ({
  position: 'relative',
  padding: 8,
  margin: 8,
  width: 184,
  border: `1px dashed ${theme.base05}`,
  alignItems: 'center',
  alignSelf: 'center',
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
