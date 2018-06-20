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
  maxCommitValue: number,
  parentSnapshot: Snapshot,
  value: number,
|};

type ChartData = {|
  maxValue: number,
  name: string,
  nodes: Array<Node>,
|};

type SelectSnapshot = (snapshot: Snapshot) => void;

type Props = {|
  exitChart: Function,
  nodeID: string,
  selectSnapshot: SelectSnapshot,
  snapshots: Array<Snapshot>,
  theme: Theme,
|};

const FiberRenderDurations = ({exitChart, nodeID, selectSnapshot, snapshots, theme}: Props) => {
  // TODO Memoize this
  const data = convertSnapshotToChartData(nodeID, snapshots);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <RenderDurations
          data={data}
          exitChart={exitChart}
          height={height}
          selectSnapshot={selectSnapshot}
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
  exitChart: Function,
  height: number,
  selectSnapshot: SelectSnapshot,
  theme: Theme,
  width: number,
|};

const RenderDurations = ({ data, exitChart, height, selectSnapshot, theme, width }: RenderDurationsProps) => {
  const { maxValue, name, nodes } = data;

  if (maxValue === 0) {
    return (
      <div style={{ height, width, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div>No render times recorded for <strong>{name}</strong></div>
        <button onClick={exitChart}>Go back</button>
      </div>
    );
  }

  const scaleX = scale(0, nodes.length * barWidth, 0, width);
  const scaleY = scale(0, maxValue, 0, height);

  return (
    <div style={{ height, width, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg height={height} width={width}>
        {nodes.map((node, index) => (
          <ChartNode
            color={getGradientColor(node.value / node.maxCommitValue)}
            height={scaleY(node.value)}
            key={index}
            label={`${node.value.toFixed(3)}ms`}
            onClick={emptyFunction}
            onDoubleClick={() => selectSnapshot(node.parentSnapshot)}
            style={null}
            theme={theme}
            width={scaleX(barWidth)}
            x={scaleX(barWidth * index)}
            y={height - scaleY(node.value)}
          />
        ))}
      </svg>
    </div>
  );
};

const convertSnapshotToChartData = (nodeID: string, snapshots: Array<Snapshot>): ChartData => {
  let maxValue = 0;
  let name = null;

  const nodes: Array<Node> = snapshots
    .filter((snapshot: Snapshot) => snapshot.committedNodes.indexOf(nodeID) >= 0)
    .map((snapshot: Snapshot) => {
      const maxCommitValue = snapshot.committedNodes.reduce((reduced, currentNodeID) =>
        Math.max(reduced, snapshot.nodes.getIn([currentNodeID, 'actualDuration'])),
        0
      );
      const value = snapshot.nodes.getIn([nodeID, 'actualDuration']);

      maxValue = Math.max(maxValue, value);

      if (name === null) {
        name = snapshot.nodes.getIn([nodeID, 'name']) || 'Unknown';
      }

      return { maxCommitValue, parentSnapshot: snapshot, value };
    });

  return {
    maxValue,
    name: name || 'Unknown',
    nodes,
  };
};

module.exports = FiberRenderDurations;
