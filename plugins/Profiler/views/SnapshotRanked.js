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

import type {CacheDataForSnapshot, GetCachedDataForSnapshot, Snapshot} from '../ProfilerTypes';
import type {Theme} from '../../../frontend/types';

import memoize from 'memoize-one';
import React, { PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import ChartNode from './ChartNode';
import NoSnapshotDataMessage from './NoSnapshotDataMessage';
import { barHeight, getGradientColor, minBarWidth, scale } from './constants';

type Node = {|
  id: any,
  label: string,
  name: string,
  title: string,
  value: number,
|};

type SelectOrInspectFiber = (id: string, name: string) => void;

type ItemData = {|
  focusedNode: Node,
  focusedNodeIndex: number,
  inspectFiber: SelectOrInspectFiber,
  nodes: Array<Node>,
  maxValue: number,
  scaleX: (value: number, fallbackValue: number) => number,
  selectFiber: SelectOrInspectFiber,
  snapshot: Snapshot,
  theme: Theme,
  width: number,
|};

type Props = {|
  cacheDataForSnapshot: CacheDataForSnapshot,
  deselectFiber: Function,
  getCachedDataForSnapshot: GetCachedDataForSnapshot,
  inspectFiber: SelectOrInspectFiber,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  showNativeNodes: boolean,
  snapshot: Snapshot,
  snapshotIndex: number,
  theme: Theme,
|};

const SnapshotRanked = ({
  cacheDataForSnapshot,
  deselectFiber,
  getCachedDataForSnapshot,
  inspectFiber,
  selectedFiberID,
  selectFiber,
  showNativeNodes,
  snapshot,
  snapshotIndex,
  theme,
}: Props) => {
  // Cache data in ProfilerStore so we only have to compute it the first time a Snapshot is shown.
  const dataKey = showNativeNodes ? 'SnapshotRankedDataWithNativeNodes' : 'SnapshotRankedDataWithoutNativeNodes';
  let rankedData = getCachedDataForSnapshot(snapshotIndex, snapshot.root, dataKey);
  if (rankedData === null) {
    rankedData = convertSnapshotToChartData(snapshot, showNativeNodes);
    cacheDataForSnapshot(snapshotIndex, snapshot.root, dataKey, rankedData);
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <SnapshotRankedInner
          deselectFiber={deselectFiber}
          height={height}
          inspectFiber={inspectFiber}
          rankedData={((rankedData: any): RankedData)}
          selectedFiberID={selectedFiberID}
          selectFiber={selectFiber}
          snapshot={snapshot}
          theme={theme}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

type RankedData = {|
  maxValue: number,
  nodes: Array<Node>,
|};

type SnapshotRankedInnerProps = {|
  deselectFiber: Function,
  height: number,
  inspectFiber: SelectOrInspectFiber,
  rankedData: RankedData,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  snapshot: Snapshot,
  theme: Theme,
  width: number,
|};

const SnapshotRankedInner = ({
  deselectFiber,
  height,
  inspectFiber,
  rankedData,
  selectedFiberID,
  selectFiber,
  snapshot,
  theme,
  width,
}: SnapshotRankedInnerProps) => {
  // If a commit contains no fibers with an actualDuration > 0,
  // Display a fallback message.
  if (rankedData.nodes.length === 0) {
    return <NoSnapshotDataMessage height={height} width={width} />;
  }

  const focusedNodeIndex = getNodeIndex(rankedData, selectedFiberID);

  // The following conversion methods are memoized,
  // So it's okay to call them on every render.
  const itemData = getItemData(
    focusedNodeIndex,
    inspectFiber,
    rankedData,
    selectFiber,
    snapshot,
    theme,
    width,
  );

  return (
    <div
      onClick={deselectFiber}
      style={{height, width}}
    >
      <List
        height={height}
        innerTagName="svg"
        itemCount={rankedData.nodes.length}
        itemData={itemData}
        itemSize={barHeight}
        width={width}
      >
        {ListItem}
      </List>
    </div>
  );
};

class ListItem extends PureComponent<any, void> {
  handleClick = event => {
    event.stopPropagation();
    const { data, index } = this.props;
    const node = data.nodes[index];
    data.selectFiber(node.id, node.name, data.snapshot.root);
  };

  handleDoubleClick = event => {
    event.stopPropagation();
    const { data, index } = this.props;
    const node = data.nodes[index];
    data.inspectFiber(node.id, node.name, data.snapshot.root);
  };

  render() {
    const { data, index, style } = this.props;

    const node = data.nodes[index];

    const { scaleX, width } = data;

    // List items are absolutely positioned using the CSS "top" attribute.
    // The "left" value will always be 0.
    // Since height is fixed, and width is based on the node's duration,
    // We can ignore those values as well.
    const top = parseInt(style.top, 10);

    return (
      <ChartNode
        color={getGradientColor(node.value / data.maxValue)}
        height={barHeight}
        isDimmed={index < data.focusedNodeIndex}
        key={node.id}
        label={node.label}
        onClick={this.handleClick}
        onDoubleClick={this.handleDoubleClick}
        theme={data.theme}
        title={node.title}
        width={Math.max(minBarWidth, scaleX(node.value, width))}
        x={0}
        y={top}
      />
    );
  }
}

const getItemData = memoize((
  focusedNodeIndex: number,
  inspectFiber: SelectOrInspectFiber,
  rankedData: RankedData,
  selectFiber: SelectOrInspectFiber,
  snapshot: Snapshot,
  theme: Theme,
  width: number,
): ItemData => ({
  focusedNode: rankedData.nodes[focusedNodeIndex],
  focusedNodeIndex,
  inspectFiber,
  nodes: rankedData.nodes,
  maxValue: rankedData.maxValue,
  scaleX: scale(0, rankedData.nodes[focusedNodeIndex].value, 0, width),
  selectFiber,
  snapshot,
  theme,
  width,
}));

const getNodeIndex = memoize((rankedData: RankedData, id: string | null): number => {
  if (id === null) {
    return 0;
  }
  const { nodes } = rankedData;
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].id === id) {
      return index;
    }
  }
  return 0;
});

const convertSnapshotToChartData = (snapshot: Snapshot, showNativeNodes: boolean): RankedData => {
  const nodes = snapshot.committedNodes
    .filter(nodeID => {
      const node = snapshot.nodes.get(nodeID);
      const nodeType = node && node.get('nodeType');
      return (nodeType === 'Composite' || (nodeType === 'Native' && showNativeNodes));
    })
    .map((nodeID, index) => {
      const node = snapshot.nodes.get(nodeID).toJSON();
      const name = node.name || 'Unknown';

      return {
        id: node.id,
        label: `${name} (${node.actualDuration.toFixed(1)}ms)`,
        name,
        title: `${name} (${node.actualDuration.toFixed(3)}ms)`,
        value: node.actualDuration,
      };
    })
    .sort((a, b) => b.value - a.value);

  return {
    maxValue: snapshot.duration,
    nodes,
  };
};

export default SnapshotRanked;
