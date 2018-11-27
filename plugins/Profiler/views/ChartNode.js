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
  title: string,
  width: number,
  x: number,
  y: number,
|};

const minWidthToDisplay = 35;

const ChartNode = ({
  color,
  height,
  isDimmed = false,
  label,
  onClick,
  onDoubleClick,
  title,
  width,
  x,
  y,
}: Props) => (
  <g
    style={{
      transition: 'all ease-in-out 250ms',
    }}
    transform={`translate(${x},${y})`}
  >
    <title>{title}</title>
    <rect
      width={width}
      height={height}
      fill={color}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        cursor: 'pointer',
        opacity: isDimmed ? 0.5 : 1,
        stroke: 'var(--theme-base00)',
        transition: 'all ease-in-out 250ms',
      }}
    />
    {width >= minWidthToDisplay && (
      <foreignObject
        width={width}
        height={height}
        style={{
          opacity: isDimmed ? 0.75 : 1,
          display: width < minWidthToDisplay ? 'none' : 'block',
          paddingLeft: x < 0 ? -x : 0,
          pointerEvents: 'none',
          transition: 'all ease-in-out 250ms',
        }}
        y={height < textHeight ? -textHeight : 0}
      >
        <div style={{
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          fontSize: 'var(--font-family-sans)',
          fontFamily: 'var(--font-size-sans-normal)',
          marginLeft: '4px',
          marginRight: '4px',
          lineHeight: '1.5',
          padding: '0 0 0',
          fontWeight: '400',
          color: 'black',
          textAlign: 'left',
          transition: 'all ease-in-out 250ms',
        }}>
          {label}
        </div>
      </foreignObject>
    )}
  </g>
);

export default ChartNode;
