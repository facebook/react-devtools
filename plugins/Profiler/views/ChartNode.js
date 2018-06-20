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

const React = require('react');

type Props = {|
  className: string,
  color: string,
  height: number,
  label: string,
  onClick: Function,
  width: number,
  x: number,
  y: number,
|};

const minWidthToDisplay = 35;

const ChartNode = ({ className, color, height, label, onClick, width, x, y }: Props) => (
  <g
    className={`profiler-animated-node ${className || ''}`}
    transform={`translate(${x},${y})`}
  >
    <title>{label}</title>
    <rect
      className="profiler-animated-node"
      width={width}
      height={height}
      fill={color}
      onClick={onClick}
    />
    <foreignObject
      className="profiler-animated-node"
      width={width}
      height={height}
      style={{
        display: width < minWidthToDisplay ? 'none' : 'block',
        paddingLeft: x < 0 ? -x : 0,
      }}
    >
      <div className="profiler-graph-label">
        {label}
      </div>
    </foreignObject>
  </g>
);

export default ChartNode;
