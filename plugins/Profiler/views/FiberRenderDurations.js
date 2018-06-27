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
          height={height}
          selectSnapshot={selectSnapshot}
          stopInspecting={stopInspecting}
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

// TODO (bvaughn) Horizontally window and used a fixed size.
// If too little data, then center align.
// Verify that horizontal scroling works properly within DevTools first.
const RenderDurations = ({ data, height, selectSnapshot, stopInspecting, theme, width }: RenderDurationsProps) => {
  const { maxValue, nodes } = data;

  if (maxValue === 0) {
    return (
      <div style={{ height, width, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={stopInspecting}>No render times recorded</button>
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
              label={`${node.value.toFixed(2)}ms`}
              onClick={() => selectSnapshot(node.parentSnapshot)}
              onDoubleClick={stopInspecting}
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

  const nodes: Array<Node> = snapshots
    .filter((snapshot: Snapshot) => snapshot.committedNodes.indexOf(nodeID) >= 0)
    .map((snapshot: Snapshot) => {
      // Filter out Text nodes; they won't have durations.
      const maxCommitValue = snapshot.committedNodes.reduce((reduced, currentNodeID) =>
        Math.max(reduced, snapshot.nodes.getIn([currentNodeID, 'actualDuration']) || 0),
        0
      );
      const value = snapshot.nodes.getIn([nodeID, 'actualDuration']);

      maxValue = Math.max(maxValue, value);

      return { maxCommitValue, parentSnapshot: snapshot, value };
    });

  return {
    maxValue,
    nodes,
  };
});

export default FiberRenderDurations;
