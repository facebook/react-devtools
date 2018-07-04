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
import React, { Fragment, PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import ChartNode from './ChartNode';
import { barHeight, barWidthThreshold, didNotRender, getGradientColor, scale } from './constants';

// Mapping of depth (i.e. List row index) to flame graph Nodes.
// Flamegraphs may contain a lot of data and pre-processing it all would be expensive.
// This mapping is lazily created, so that we can defer most of the work until a row is needed.
// Each row builds on the values of the previous row, (e.g. initial left offset, child Fiber ids, etc.)
type LazyIDToDepthMap = {[id: string]: number};
type LazyIDToXMap = {[id: string]: number};
type LazyIDsByDepth = Array<Array<string>>;

type FlamegraphData = {|
  // Number of rows in the flamegraph List.
  flameGraphDepth: number,
  // Lazily constructed map of id to the depth of the fiber within the flamegraph.
  // This is used to quickly determine if a given row is "above" a focused Fiber,
  // In which case it should be rendered differently (with a dim color).
  lazyIDToDepthMap: LazyIDToDepthMap,
  // Lazily constructed map of id to the x offset of the fiber within the flamegraph.
  // Each fiber position in the flamegraph is relative to its parent.
  // This mapp enables quick lookup of the x offset of the parent.
  lazyIDToXMap: LazyIDToXMap,
  // Lazily constructed array of ids per row within the flamegraph.
  // This enables quick rendering of all fibers in a specific row.
  lazyIDsByDepth: LazyIDsByDepth,
  // Longest actual duration of all fibers in the current commit.
  // This determines the color of each node in the flamegram.
  maxDuration: number,
  // Native nodes (e.g. div, span) should be included in the flamegraph.
  // If this value is false, these nodes are filtered out of the flamegraph view.
  showNativeNodes: boolean,
|};

type SelectOrInspectFiber = (id: string, name: string) => void;

// List-level data that's cached (memoized) and passed to individual item renderers.
type ItemData = {|
  flamegraphData: FlamegraphData,
  inspectFiber: SelectOrInspectFiber,
  // Tree base time value for either the root fiber in the tree or the current selected fiber.
  // This value determins the horizontal (time) scale,
  // Which in turn determines which fibers are rendered in the flamegraph.
  maxTreeBaseTime: number,
  // Scales horizontal values (left offset and width) based on the selected fiber's tree base time.
  scaleX: (value: number) => number,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  snapshot: Snapshot,
  theme: Theme,
  width: number,
|};

type Props = {|
  cacheDataForSnapshot: CacheDataForSnapshot,
  getCachedDataForSnapshot: GetCachedDataForSnapshot,
  inspectFiber: SelectOrInspectFiber,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  showNativeNodes: boolean,
  snapshot: Snapshot,
  snapshotIndex: number,
  theme: Theme,
|};

const SnapshotFlamegraph = ({
  cacheDataForSnapshot,
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
  const dataKey = showNativeNodes ? 'SnapshotFlamegraphWithNativeNodes' : 'SnapshotFlamegraphWithoutNativeNodes';
  let flamegraphData = getCachedDataForSnapshot(snapshotIndex, snapshot.root, dataKey);
  if (flamegraphData === null) {
    flamegraphData = convertSnapshotToChartData(showNativeNodes, snapshot);
    cacheDataForSnapshot(snapshotIndex, snapshot.root, dataKey, flamegraphData);
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Flamegraph
          flamegraphData={((flamegraphData: any): FlamegraphData)}
          height={height}
          inspectFiber={inspectFiber}
          selectedFiberID={selectedFiberID}
          selectFiber={selectFiber}
          showNativeNodes={showNativeNodes}
          snapshot={snapshot}
          theme={theme}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

type FlamegraphProps = {|
  flamegraphData: FlamegraphData,
  height: number,
  inspectFiber: SelectOrInspectFiber,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  showNativeNodes: boolean,
  snapshot: Snapshot,
  theme: Theme,
  width: number,
|};

const Flamegraph = ({
  flamegraphData,
  height,
  inspectFiber,
  selectedFiberID,
  selectFiber,
  showNativeNodes,
  snapshot,
  theme,
  width,
}: FlamegraphProps) => {
  const { flameGraphDepth, lazyIDToDepthMap, lazyIDsByDepth } = flamegraphData;

  // Initialize enough of the flamegraph to include the focused Fiber.
  // Otherwise the horizontal scale will be off.
  if (selectedFiberID !== null) {
    let index = lazyIDsByDepth.length;
    while (lazyIDToDepthMap[selectedFiberID] === undefined && index < flameGraphDepth) {
      calculateFibersAtDepth(flamegraphData, index, snapshot);
      index++;
    }
  }

  // Pass required contextual data down to the ListItem renderer.
  // (This method is memoized so it's safe to call on every render.)
  const itemData = getItemData(
    flamegraphData,
    inspectFiber,
    selectedFiberID,
    selectFiber,
    snapshot,
    theme,
    width,
  );

  // If a commit is small and fast enough, it's possible for it to contain no base time values > 0.
  // In this case, we could only display an empty graph.
  if (flameGraphDepth === 0 || itemData.maxTreeBaseTime === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        width,
      }}>
        No data for the current selection.
      </div>
    );
  }

  return (
    <List
      containerTagName="svg"
      height={height}
      itemCount={flameGraphDepth}
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
    const { index, style } = this.props;
    const itemData: ItemData = ((this.props.data: any): ItemData);

    const { flamegraphData, scaleX, selectedFiberID, snapshot } = itemData;
    const { lazyIDToDepthMap, lazyIDToXMap, maxDuration } = flamegraphData;
    const { committedNodes, nodes } = snapshot;

    // List items are absolutely positioned using the CSS "top" attribute.
    // The "left" value will always be 0.
    // Since height is fixed, and width is based on the node's duration,
    // We can ignore those values as well.
    const top = parseInt(style.top, 10);

    const ids = calculateFibersAtDepth(flamegraphData, index, snapshot);

    let focusedNodeIndex = 0;
    let focusedNodeX = 0;
    if (selectedFiberID !== null) {
      focusedNodeIndex = lazyIDToDepthMap[selectedFiberID] || 0;
      focusedNodeX = scaleX(lazyIDToXMap[selectedFiberID]) || 0;
    }

    return (
      <Fragment>
        {ids.map(id => {
          const fiber = nodes.get(id);
          const treeBaseTime = fiber.get('treeBaseTime');
          const nodeWidth = scaleX(treeBaseTime);

          // Filter out nodes that are too small to see or click.
          // This also helps render large trees faster.
          if (nodeWidth < barWidthThreshold) {
            return null;
          }

          const nodeX = scaleX(lazyIDToXMap[id]);

          // Filter out nodes that are outside of the horizontal window.
          if (
            nodeX + nodeWidth < focusedNodeX ||
            nodeX > focusedNodeX + itemData.width
          ) {
            return null;
          }

          const actualDuration = fiber.get('actualDuration') || 0;
          const name = fiber.get('name') || 'Unknown';
          const didRender = committedNodes.includes(id);

          return (
            <ChartNode
              color={didRender ? getGradientColor(actualDuration / maxDuration) : didNotRender}
              height={barHeight}
              isDimmed={index < focusedNodeIndex}
              key={id}
              label={didRender ? `${name} (${actualDuration.toFixed(2)}ms)` : name}
              onClick={() => itemData.selectFiber(id, name)}
              onDoubleClick={() => itemData.inspectFiber(id, name)}
              theme={itemData.theme}
              width={nodeWidth}
              x={nodeX - focusedNodeX}
              y={top}
            />
          );
        })}
      </Fragment>
    );
  }
}

const convertSnapshotToChartData = (
  showNativeNodes: boolean,
  snapshot: Snapshot,
): FlamegraphData => {
  const maxDuration = getMaxDurationForSnapshot(snapshot);

  const flamegraphData: FlamegraphData = {
    flameGraphDepth: calculateFlameGraphDepth(showNativeNodes, snapshot),
    lazyIDToDepthMap: {},
    lazyIDToXMap: {},
    lazyIDsByDepth: [],
    maxDuration,
    showNativeNodes,
  };

  // Pre-calculate the first row in the List.
  // Later calls to calculateFibersAtDepth() depend on this being initialized.
  flamegraphData.lazyIDsByDepth[0] = calculateFibersAtDepthCrawler(
    0,
    flamegraphData,
    snapshot.root,
    0,
    [],
    snapshot,
  );

  return flamegraphData;
};

const calculateFlameGraphDepth = (showNativeNodes: boolean, snapshot: Snapshot): number => {
  let maxDepth = 0;

  const walkTree = (nodeID: string, currentDepth: number = 0) => {
    const nodeType = snapshot.nodes.getIn([nodeID, 'nodeType']);

    if (nodeType === undefined) {
      return;
    } else if (nodeType === 'Composite' || showNativeNodes && nodeType === 'Native') {
      currentDepth++;

      maxDepth = Math.max(maxDepth, currentDepth);
    }

    const children = snapshot.nodes.getIn([nodeID, 'children']);
    if (Array.isArray(children)) {
      children.forEach(childID => walkTree(childID, currentDepth));
    } else if (children != null) {
      walkTree(children, currentDepth);
    }
  };

  walkTree(snapshot.root);

  return maxDepth;
};

const getItemData = memoize((
  flamegraphData: FlamegraphData,
  inspectFiber: SelectOrInspectFiber,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  snapshot: Snapshot,
  theme: Theme,
  width: number,
): ItemData => {
  const maxTreeBaseTime = getMaxTreeBaseTime(flamegraphData, selectedFiberID, snapshot);
  return {
    flamegraphData,
    inspectFiber,
    maxTreeBaseTime,
    scaleX: scale(0, maxTreeBaseTime, 0, width),
    selectedFiberID,
    selectFiber,
    snapshot,
    theme,
    width,
  };
});

const getMaxDurationForSnapshot = (snapshot: Snapshot): number => {
  let maxDuration = 0;
  snapshot.committedNodes.forEach(nodeID => {
    const duration = snapshot.nodes.getIn([nodeID, 'actualDuration']);
    if (duration > 0) {
      maxDuration = Math.max(maxDuration, duration);
    }
  });
  return maxDuration;
};

const getMaxTreeBaseTime = (
  flamegraphData: FlamegraphData,
  selectedFiberID: string | null,
  snapshot: Snapshot,
): number => {
  const baseNodeID = flamegraphData.lazyIDsByDepth[0][0];

  // If the selected fiber is in a different root,
  // Just scale everything to the base node in this flamegraph.
  // Even if the root matches, it's possible the Fiber won't be included in this commit though.
  // (For example, it may have been removed.)
  // In that case, we should still fallback to the base node time.
  return snapshot.nodes.getIn([selectedFiberID, 'treeBaseTime']) || snapshot.nodes.getIn([baseNodeID, 'treeBaseTime']);
};

// This method depends on rows being initialized in-order.
const calculateFibersAtDepth = (flamegraphData: FlamegraphData, depth: number, snapshot: Snapshot): Array<string> => {
  const { lazyIDsByDepth, lazyIDToXMap } = flamegraphData;

  for (let index = lazyIDsByDepth.length; index <= depth; index++) {
    const nodesAtPreviousDepth = lazyIDsByDepth[index - 1];
    lazyIDsByDepth[index] = nodesAtPreviousDepth.reduce(
      (nodesAtDepth: Array<string>, parentID: string) =>
        calculateFibersAtDepthCrawler(
          index,
          flamegraphData,
          parentID,
          lazyIDToXMap[parentID],
          nodesAtDepth,
          snapshot,
        ), []
    );
  }

  return lazyIDsByDepth[depth];
};

const calculateFibersAtDepthCrawler = (
  depth: number,
  flamegraphData: FlamegraphData,
  id: string,
  leftOffset: number = 0,
  nodesAtDepth: Array<string>,
  snapshot: Snapshot,
): Array<string> => {
  const { lazyIDToDepthMap, lazyIDToXMap, showNativeNodes } = flamegraphData;
  const { nodes } = snapshot;

  const children = nodes.getIn([id, 'children']);
  let childArray = null;
  if (Array.isArray(children)) {
    childArray = children;
  } else if (children != null) {
    childArray = [children];
  }

  if (childArray !== null) {
    childArray.forEach(childID => {
      const fiber = nodes.get(childID);
      if (fiber === undefined) {
        // Bailout on Text nodes
        return;
      }
      
      const nodeType = fiber.get('nodeType');

      if (nodeType !== 'Composite' && (nodeType !== 'Native' || !showNativeNodes)) {
        // Skip over native fibers if they are being filtered from the view
        calculateFibersAtDepthCrawler(
          depth,
          flamegraphData,
          childID,
          leftOffset,
          nodesAtDepth,
          snapshot,
        );
      } else {
        const prevID = nodesAtDepth.length
          ? nodesAtDepth[nodesAtDepth.length - 1]
          : null;
        const prevNodeTreeBaseTime = nodes.getIn([prevID, 'treeBaseTime']) || 0;
        const prevNodeX = prevID !== null ? lazyIDToXMap[prevID] : 0;

        const x = Math.max(leftOffset, prevNodeX + prevNodeTreeBaseTime);

        nodesAtDepth.push(childID);

        lazyIDToDepthMap[childID] = depth;
        lazyIDToXMap[childID] = x;
      }
    });
  }

  return nodesAtDepth;
};

export default SnapshotFlamegraph;
