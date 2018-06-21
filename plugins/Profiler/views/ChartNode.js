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
import { ChartAnimatedNode, ChartLabel, ChartRect } from './SharedProfilerStyles';

type Props = {|
  color: string,
  height: number,
  label: string,
  onClick: Function,
  onDoubleClick: Function,
  placeLabelAboveNode?: boolean,
  style: ?Object,
  theme: Theme,
  width: number,
  x: number,
  y: number,
|};

const minWidthToDisplay = 35;

const ChartNode = ({ color, height, label, onClick, onDoubleClick, style, theme, width, x, y }: Props) => (
  <g
    style={{
      ...ChartAnimatedNode,
      ...style,
    }}
    transform={`translate(${x},${y})`}
  >
    <title>{label}</title>
    <rect
      width={width}
      height={height}
      fill={color}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={ChartRect(theme)}
    />
    {width >= minWidthToDisplay && (
      <foreignObject
        width={width}
        height={height}
        style={{
          ...ChartAnimatedNode,
          display: width < minWidthToDisplay ? 'none' : 'block',
          paddingLeft: x < 0 ? -x : 0,
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

export default ChartNode;
