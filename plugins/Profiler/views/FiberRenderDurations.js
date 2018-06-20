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

import type {Snapshot} from '../ProfilerTypes';
import type {Theme} from '../../../frontend/types';

import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import ChartNode from './ChartNode';
import { barWidth, scale, getGradientColor } from './constants';

type Node = {|
  name: string,
  value: number,
|};

type ChartData = {|
  maxValue: number,
  nodes: Array<Node>,
|};

type Props = {|
  nodeID: string,
  snapshots: Array<Snapshot>,
  theme: Theme,
|};

// TODO Display "no commits found for node X"

const FiberRenderDurations = ({nodeID, snapshots, theme}: Props) => {
  // TODO Memoize this
  const data = convertSnapshotToChartData(nodeID, snapshots);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <RenderDurations
          data={data}
          height={height}
          theme={theme}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

function emptyFunction() {}

type RenderDurationsProps = {|
  data: ChartData,
  height: number,
  theme: Theme,
  width: number,
|};

const RenderDurations = ({ data, height, theme, width }: RenderDurationsProps) => {
  console.log('<RenderDurations>', data);
  const { maxValue, nodes } = data;

  if (maxValue === 0) {
    return (
      <div style={{ height, width, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        No render times for the selected node
      </div>
    );
  }

  const scaleY = scale(0, maxValue, 0, height);

  return (
    <div style={{ height, width, overflow: 'auto' }}>
      <svg height={height} width={barWidth * nodes.length}>
        {nodes.map((node, index) => (
          <ChartNode
            color={getGradientColor(node.value / maxValue)}
            height={scaleY(node.value)}
            key={index}
            label={`${node.value.toFixed(3)}ms`}
            onClick={emptyFunction}
            onDoubleClick={emptyFunction}
            style={null}
            theme={theme}
            width={barWidth}
            x={barWidth * index}
            y={height - scaleY(node.value)}
          />
        ))}
      </svg>
    </div>
  );
};

const convertSnapshotToChartData = (nodeID: string, snapshots: Array<Snapshot>): ChartData => {
  let maxValue = 0;

  const nodes: Array<Node> = snapshots
    .filter((snapshot: Snapshot) => snapshot.committedNodes.indexOf(nodeID) >= 0)
    .map((snapshot: Snapshot) => {
      const name = snapshot.nodes.getIn([nodeID, 'name']) || 'Unknown';
      const value = snapshot.nodes.getIn([nodeID, 'actualDuration']);

      maxValue = Math.max(maxValue, value);

      return { name, value };
    });

  return { maxValue, nodes };
};

module.exports = FiberRenderDurations;
