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

import memoize from 'memoize-one';
import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import ChartNode from './ChartNode';
import { barWidth, minBarHeight, getGradientColor, scale } from './constants';

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
  selectedFiberID: string,
  selectSnapshot: SelectSnapshot,
  snapshots: Array<Snapshot>,
  stopInspecting: Function,
  theme: Theme,
|};

const FiberRenderDurations = ({selectedFiberID, selectSnapshot, snapshots, stopInspecting, theme}: Props) => {
  // The following conversion methods are memoized,
  // So it's okay to call them on every render.
  const data = convertSnapshotToChartData(selectedFiberID, snapshots);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <RenderDurations
          data={data}
          stopInspecting={stopInspecting}
          height={height}
          selectSnapshot={selectSnapshot}
          theme={theme}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

type RenderDurationsProps = {|
  data: ChartData,
  height: number,
  selectSnapshot: SelectSnapshot,
  stopInspecting: Function,
  theme: Theme,
  width: number,
|};

const RenderDurations = ({ data, height, selectSnapshot, stopInspecting, theme, width }: RenderDurationsProps) => {
  const { maxValue, name, nodes } = data;

  if (maxValue === 0) {
    return (
      <div style={{ height, width, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div>No render times recorded for <strong>{name}</strong></div>
        <button onClick={stopInspecting}>Go back</button>
      </div>
    );
  }

  const scaleX = scale(0, nodes.length * barWidth, 0, width);
  const scaleY = scale(0, maxValue, 0, height);

  return (
    <div style={{ height, width, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg height={height} width={width}>
        {nodes.map((node, index) => {
          const safeHeight = Math.max(minBarHeight, scaleY(node.value));
          return (
            <ChartNode
              color={getGradientColor(node.value / node.maxCommitValue)}
              height={safeHeight}
              key={index}
              label={`${node.value.toFixed(3)}ms`}
              onClick={() => selectSnapshot(node.parentSnapshot)}
              theme={theme}
              width={scaleX(barWidth)}
              x={scaleX(barWidth * index)}
              y={height - safeHeight}
            />
          );
        })}
      </svg>
    </div>
  );
};

const convertSnapshotToChartData = memoize((nodeID: string, snapshots: Array<Snapshot>): ChartData => {
  let maxValue = 0;
  let name = null;

  const nodes: Array<Node> = snapshots
    .filter((snapshot: Snapshot) => snapshot.committedNodes.indexOf(nodeID) >= 0)
    .map((snapshot: Snapshot) => {
      // TODO Why are some durations undefined?
      const maxCommitValue = snapshot.committedNodes.reduce((reduced, currentNodeID) =>
        Math.max(reduced, snapshot.nodes.getIn([currentNodeID, 'actualDuration']) || 0),
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
});

export default FiberRenderDurations;
