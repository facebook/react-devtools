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
import React, { PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import ChartNode from './ChartNode';
import { barHeight, getGradientColor, minBarWidth, scale } from './constants';

type Node = {|
  fiber: Object,
  id: any,
  label: string,
  name: string,
  value: number,
|};

type SelectOrInspectFiber = (fiber: Object) => void;

type Props = {|
  inspectFiber: SelectOrInspectFiber,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  snapshot: Snapshot,
  theme: Theme,
|};

const RankedSnapshot = ({inspectFiber, selectedFiberID, selectFiber, snapshot, theme}: Props) => {
  // The following conversion methods are memoized,
  // So it's okay to call them on every render.
  const data = convertSnapshotToChartData(snapshot);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Ranked
          data={data}
          height={height}
          inspectFiber={inspectFiber}
          selectedFiberID={selectedFiberID}
          selectFiber={selectFiber}
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

type RankedProps = {|
  data: RankedData,
  height: number,
  inspectFiber: SelectOrInspectFiber,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  theme: Theme,
  width: number,
|};

const Ranked = ({ data, height, inspectFiber, selectedFiberID, selectFiber, theme, width }: RankedProps) => {
  // The following conversion methods are memoized,
  // So it's okay to call them on every render.
  const focusedNodeIndex = getNodeIndex(data, selectedFiberID);
  const itemData = getItemData(
    data,
    focusedNodeIndex,
    inspectFiber,
    selectFiber,
    theme,
    width,
  );

  return (
    <List
      containerTag="svg"
      height={height}
      itemCount={data.nodes.length}
      itemData={itemData}
      itemSize={barHeight}
      width={width}
    >
      {ListItem}
    </List>
  );
};

class ListItem extends PureComponent<any, void> {
  render() {
    const { data, index, style } = this.props;

    const node = data.nodes[index];

    const { scaleX } = data;

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
        onClick={() => data.selectFiber(node.fiber)}
        onDoubleClick={() => data.inspectFiber(node.fiber)}
        theme={data.theme}
        width={Math.max(minBarWidth, scaleX(node.value))}
        x={0}
        y={top}
      />
    );
  }
}

const getItemData = memoize((
  data: RankedData,
  focusedNodeIndex: number,
  inspectFiber: SelectOrInspectFiber,
  selectFiber: SelectOrInspectFiber,
  theme: Theme,
  width: number,
) => ({
  focusedNode: data.nodes[focusedNodeIndex],
  focusedNodeIndex,
  inspectFiber,
  nodes: data.nodes,
  maxValue: data.maxValue,
  scaleX: scale(0, data.nodes[focusedNodeIndex].value, 0, width),
  selectFiber,
  theme,
}));

const getNodeIndex = memoize((data: RankedData, id: string | null): number => {
  if (id === null) {
    return 0;
  }
  const { nodes } = data;
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].id === id) {
      return index;
    }
  }
  return 0;
});

const convertSnapshotToChartData = memoize((snapshot: Snapshot): RankedData => {
  let maxValue = 0;

  const nodes = snapshot.committedNodes
    .filter(nodeID => {
      const node = snapshot.nodes.get(nodeID);
      const nodeType = node && node.get('nodeType');
      return (
        node !== undefined &&
        nodeType !== 'Native' &&
        nodeType !== 'Wrapper' &&
        node.get('actualDuration') > 0
      );
    })
    .map((nodeID, index) => {
      const node = snapshot.nodes.get(nodeID).toJSON();
      const name = node.name || 'Unknown';

      maxValue = Math.max(node.actualDuration, maxValue);

      return {
        fiber: node,
        id: node.id,
        label: `${name} (${node.actualDuration.toFixed(2)}ms)`,
        name,
        value: node.actualDuration,
      };
    })
    .sort((a, b) => b.value - a.value);

  return {
    nodes,
    maxValue,
  };
});

export default RankedSnapshot;
