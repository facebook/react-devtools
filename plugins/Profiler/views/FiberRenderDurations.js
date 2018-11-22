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

import memoize from 'memoize-one';
import React, { PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import ChartNode from './ChartNode';
import { getFilteredSnapshotData, getGradientColor, minBarHeight, minBarWidth, scale } from './constants';
import NoRenderTimesMessage from './NoRenderTimesMessage';

type Node = {|
  maxCommitValue: number,
  parentSnapshot: Snapshot,
  value: number,
|};

type ChartData = {|
  itemSize: number,
  maxValue: number,
  nodes: Array<Node>,
|};

type ItemData = {|
  height: number,
  nodes: Array<Node>,
  scaleY: (value: number, fallbackValue: number) => number,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  stopInspecting: Function,
|};

type SelectSnapshot = (snapshot: Snapshot) => void;

type Props = {|
  commitThreshold: number,
  hideCommitsBelowThreshold: boolean,
  selectedFiberID: string,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  snapshotIndex: number,
  snapshots: Array<Snapshot>,
  stopInspecting: Function,
|};

export default ({
  commitThreshold,
  hideCommitsBelowThreshold,
  selectedFiberID,
  selectedSnapshot,
  selectSnapshot,
  snapshotIndex,
  snapshots,
  stopInspecting,
}: Props) => {
  const filteredData = getFilteredSnapshotData(
    commitThreshold,
    hideCommitsBelowThreshold,
    true, // If we're viewing this component
    selectedFiberID,
    selectedSnapshot,
    snapshotIndex,
    snapshots,
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <RenderDurations
          commitThreshold={commitThreshold}
          height={height}
          hideCommitsBelowThreshold={hideCommitsBelowThreshold}
          selectedFiberID={selectedFiberID}
          selectedSnapshot={selectedSnapshot}
          selectSnapshot={selectSnapshot}
          snapshots={filteredData.snapshots}
          stopInspecting={stopInspecting}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

type RenderDurationsProps = {|
  commitThreshold: number,
  height: number,
  hideCommitsBelowThreshold: boolean,
  selectedFiberID: string,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  snapshots: Array<Snapshot>,
  stopInspecting: Function,
  width: number,
|};

const RenderDurations = ({
  commitThreshold,
  height,
  hideCommitsBelowThreshold,
  selectedFiberID,
  selectedSnapshot,
  selectSnapshot,
  snapshots,
  stopInspecting,
  width,
}: RenderDurationsProps) => {
  // getChartData() is memoized so it's okay to call them on every render.
  const chartData = getChartData(
    selectedFiberID,
    snapshots,
    width,
  );

  const { itemSize, maxValue, nodes } = chartData;

  if (maxValue === 0) {
    return (
      <NoRenderTimesMessage
        commitThreshold={commitThreshold}
        height={height}
        hideCommitsBelowThreshold={hideCommitsBelowThreshold}
        stopInspecting={stopInspecting}
        width={width}
      />
    );
  }

  // Pass required contextual data down to the ListItem renderer.
  // getItemData() is memoized so it's okay to call them on every render.
  const itemData = getItemData(
    height,
    maxValue,
    nodes,
    selectedSnapshot,
    selectSnapshot,
    stopInspecting,
  );

  return (
    <List
      direction="horizontal"
      height={height}
      innerTagName="svg"
      itemCount={nodes.length}
      itemData={itemData}
      itemSize={itemSize}
      width={width}
    >
      {ListItem}
    </List>
  );
};

class ListItem extends PureComponent<any, void> {
  render() {
    const { index, style } = this.props;
    const itemData: ItemData = ((this.props.data: any): ItemData);

    const { height, nodes, scaleY, selectedSnapshot, selectSnapshot, stopInspecting } = itemData;

    const node = nodes[index];
    const safeHeight = Math.max(minBarHeight, scaleY(node.value, minBarHeight));

    // List items are absolutely positioned using the CSS "left" attribute.
    // The "top" value will always be 0.
    // Since the height is based on the node's duration, we can ignore it also.
    const left = parseInt(style.left, 10);
    const width = parseInt(style.width, 10);

    return (
      <ChartNode
        color={getGradientColor(node.maxCommitValue === 0 ? 0 : node.value / node.maxCommitValue)}
        height={safeHeight}
        isDimmed={node.parentSnapshot === selectedSnapshot}
        key={index}
        label={`${node.value.toFixed(1)}ms`}
        onClick={() => selectSnapshot(node.parentSnapshot)}
        onDoubleClick={stopInspecting}
        title={`${node.value.toFixed(3)}ms`}
        width={width}
        x={left}
        y={height - safeHeight}
      />
    );
  }
}

const getChartData = memoize((
  nodeID: string,
  snapshots: Array<Snapshot>,
  width: number
): ChartData => {
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

  const itemSize = Math.max(minBarWidth, width / nodes.length);

  return {
    itemSize,
    maxValue,
    nodes,
  };
});

const getItemData = memoize((
  height: number,
  maxValue: number,
  nodes: Array<Node>,
  selectedSnapshot: Snapshot,
  selectSnapshot: SelectSnapshot,
  stopInspecting: Function,
): ItemData => ({
  height,
  nodes,
  scaleY: scale(0, maxValue, 0, height),
  selectedSnapshot,
  selectSnapshot,
  stopInspecting,
}));
