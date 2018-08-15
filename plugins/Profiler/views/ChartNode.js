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

import type {Theme} from '../../../frontend/types';

import React from 'react';
import { textHeight } from './constants';

type Props = {|
  color: string,
  height: number,
  isDimmed?: boolean,
  label: string,
  onClick: Function,
  onDoubleClick?: Function,
  placeLabelAboveNode?: boolean,
  theme: Theme,
  width: number,
  x: number,
  y: number,
|};

const minWidthToDisplay = 35;

const ChartNode = ({ color, height, isDimmed = false, label, onClick, onDoubleClick, theme, width, x, y }: Props) => (
  <g
    style={ChartAnimatedNode}
    transform={`translate(${x},${y})`}
  >
    <title>{label}</title>
    <rect
      width={width}
      height={height}
      fill={color}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={ChartRect(theme, isDimmed)}
    />
    {width >= minWidthToDisplay && (
      <foreignObject
        width={width}
        height={height}
        style={{
          ...ChartAnimatedNode,
          opacity: isDimmed ? 0.75 : 1,
          display: width < minWidthToDisplay ? 'none' : 'block',
          paddingLeft: x < 0 ? -x : 0,
          pointerEvents: 'none',
        }}
        y={height < textHeight ? -textHeight : 0}
      >
        <div style={ChartLabel}>
          {label}
        </div>
      </foreignObject>
    )}
  </g>
);

const ChartAnimatedNode = {
  transition: 'all ease-in-out 250ms',
};

const ChartRect = (theme: Theme, isDimmed: boolean) => ({
  cursor: 'pointer',
  opacity: isDimmed ? 0.5 : 1,
  stroke: theme.base00,
  ...ChartAnimatedNode,
});

const ChartLabel = {
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontSize: '12px',
  fontFamily: 'sans-serif',
  marginLeft: '4px',
  marginRight: '4px',
  lineHeight: '1.5',
  padding: '0 0 0',
  fontWeight: '400',
  color: 'black',
  textAlign: 'left',
  ...ChartAnimatedNode,
};

export default ChartNode;
