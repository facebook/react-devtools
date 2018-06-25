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
import React, { Fragment, PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import ChartNode from './ChartNode';
import { barHeight, barWidthThreshold, didNotRender, getGradientColor, scale } from './constants';

export type Node = {|
  color: string,
  id: string,
  label: string,
  name: string,
  treeBaseTime: number,
  x: number,
|};

// Mapping of depth (i.e. List row index) to flame graph Nodes.
// Flamegraphs may contain a lot of data and pre-processing it all would be expensive.
// This mapping is lazily created, so that we can defer most of the work until a row is needed.
// Each row builds on the values of the previous row, (e.g. initial left offset, child Fiber ids, etc.)
type LazyNodesByDepth = Array<Array<Node>>;
type LazyIdToNodeMap = {[id: string]: Node};
type LazyIdToDepthMap = {[id: string]: number};

type SelectOrInspectFiber = (id: string, name: string) => void;

type Props = {|
  inspectFiber: SelectOrInspectFiber,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  showNativeNodes: boolean,
  snapshot: Snapshot,
  theme: Theme,
|};

const SnapshotFlamegraph = ({inspectFiber, selectedFiberID, selectFiber, showNativeNodes, snapshot, theme}: Props) => {
  return (
    <AutoSizer>
      {({ height, width }) => (
        <Flamegraph
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
  height,
  inspectFiber,
  selectedFiberID,
  selectFiber,
  showNativeNodes,
  snapshot,
  theme,
  width,
}: FlamegraphProps) => {
  const rootNode = snapshot.nodes.get(snapshot.root);
  const children = rootNode.get('children');
  const rootNodeID = Array.isArray(children) ? children[0] : children;

  // The following conversion methods are memoized,
  // So it's okay to call them on every render.
  // Expensive things (like lazyNodesByDepth) should only depend on the snapshot.
  // TODO Cache values in ProfilerStore so we only have to compute them the first time a Snapshot is shown.
  const flameGraphDepth = calculateFlameGraphDepth(snapshot, rootNodeID, showNativeNodes);
  const maxDuration = getMaxDurationForSnapshot(snapshot);
  const maxTreeBaseTime = getMaxTreeBaseTime(snapshot, selectedFiberID, rootNodeID);
  const lazyNodesByDepth = initLazyNodesByDepth(snapshot, rootNodeID, maxDuration, showNativeNodes);
  const lazyIdToDepthMap = initLazyIdToDepthMap(lazyNodesByDepth, showNativeNodes);
  const lazyIdToNodeMap = initLazyIdToNodeMap(lazyNodesByDepth, showNativeNodes);

  // Create enough of the flamegraph to include the focused Fiber.
  // Otherwise the horizontal scale will be off.
  if (selectedFiberID !== null) {
    let index = lazyNodesByDepth.length;
    while (lazyIdToNodeMap[selectedFiberID] === undefined && index < flameGraphDepth) {
      findOrCreateNodesForDepth(
        index,
        lazyIdToDepthMap,
        lazyIdToNodeMap,
        lazyNodesByDepth,
        maxDuration,
        snapshot,
        showNativeNodes,
      );
      index++;
    }
  }

  const itemData = getItemData(
    inspectFiber,
    lazyIdToDepthMap,
    lazyIdToNodeMap,
    lazyNodesByDepth,
    maxDuration,
    maxTreeBaseTime,
    rootNodeID,
    selectedFiberID,
    selectFiber,
    showNativeNodes,
    snapshot,
    theme,
    width,
  );

  return (
    <List
      containerTag="svg"
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
    const { data, index, style } = this.props;

    const {
      lazyIdToDepthMap,
      lazyIdToNodeMap,
      lazyNodesByDepth,
      maxDuration,
      selectedFiberID,
      showNativeNodes,
      snapshot,
    } = data;

    // List items are absolutely positioned using the CSS "top" attribute.
    // The "left" value will always be 0.
    // Since height is fixed, and width is based on the node's duration,
    // We can ignore those values as well.
    const top = parseInt(style.top, 10);

    const nodes = findOrCreateNodesForDepth(
      index,
      lazyIdToDepthMap,
      lazyIdToNodeMap,
      lazyNodesByDepth,
      maxDuration,
      snapshot,
      showNativeNodes,
    );

    const focusedNodeIndex = lazyIdToDepthMap[selectedFiberID] || 0;
    const focusedNode = lazyIdToNodeMap[selectedFiberID];
    const focusedNodeX = focusedNode && data.scaleX(focusedNode.x) || 0;

    return (
      <Fragment>
        {nodes.map(node => {
          const nodeX = data.scaleX(node.x);
          const nodeWidth = data.scaleX(node.treeBaseTime);

          // Filter out nodes that are too small to see or click.
          // This also helps render large trees faster.
          if (nodeWidth < barWidthThreshold) {
            return null;
          }

          // Filter out nodes that are outside of the horizontal window.
          if (
            nodeX + nodeWidth < focusedNodeX ||
            nodeX > focusedNodeX + data.width
          ) {
            return null;
          }

          return (
            <ChartNode
              color={node.color}
              height={barHeight}
              isDimmed={index < focusedNodeIndex}
              key={node.id}
              label={node.label}
              onClick={() => data.selectFiber(node.id, node.name)}
              onDoubleClick={() => data.inspectFiber(node.id, node.name)}
              theme={data.theme}
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

const calculateFlameGraphDepth = memoize((snapshot: Snapshot, rootNodeID: string, showNativeNodes: boolean): number => {
  let maxDepth = 0;

  const walkTree = (nodeID: string, currentDepth: number = 0) => {
    const nodeType = snapshot.nodes.getIn([nodeID, 'nodeType']);

    if (nodeType === undefined) {
      return;
    } else if (showNativeNodes || nodeType !== 'Native') {
      currentDepth++;
    }

    maxDepth = Math.max(maxDepth, currentDepth);

    const children = snapshot.nodes.getIn([nodeID, 'children']);
    if (Array.isArray(children)) {
      children.forEach(childID => walkTree(childID, currentDepth));
    } else if (children != null) {
      walkTree(children, currentDepth);
    }
  };

  walkTree(rootNodeID);

  return maxDepth;
});

const getItemData = memoize((
  inspectFiber: SelectOrInspectFiber,
  lazyIdToDepthMap: LazyIdToDepthMap,
  lazyIdToNodeMap: LazyIdToNodeMap,
  lazyNodesByDepth: LazyNodesByDepth,
  maxDuration: number,
  maxTreeBaseTime: number,
  rootNodeID: string,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  showNativeNodes: boolean,
  snapshot: Snapshot,
  theme: Theme,
  width: number,
) => {
  return {
    inspectFiber,
    lazyIdToDepthMap,
    lazyIdToNodeMap,
    lazyNodesByDepth,
    maxDuration,
    scaleX: scale(0, maxTreeBaseTime, 0, width),
    selectedFiberID,
    selectFiber,
    showNativeNodes,
    snapshot,
    theme,
    width,
  };
});

const initLazyIdToDepthMap = memoize((lazyNodesByDepth: LazyNodesByDepth, showNativeNodes: boolean): LazyIdToDepthMap =>
  lazyNodesByDepth.reduce((lazyIdToDepthMap: LazyIdToDepthMap, nodes: Array<Node>, index: number) => {
    nodes.forEach(node => {
      lazyIdToDepthMap[node.id] = index;
    });
    return lazyIdToDepthMap;
  }, {}));

const initLazyIdToNodeMap = memoize((lazyNodesByDepth: LazyNodesByDepth, showNativeNodes: boolean): LazyIdToNodeMap =>
  lazyNodesByDepth.reduce((lazyIdToNodeMap: LazyIdToNodeMap, nodes: Array<Node>, index: number) => {
    nodes.forEach(node => {
      lazyIdToNodeMap[node.id] = node;
    });
    return lazyIdToNodeMap;
  }, {}));

const initLazyNodesByDepth = memoize((
  snapshot: Snapshot,
  rootNodeID: string,
  maxDuration: number,
  showNativeNodes: boolean,
): LazyNodesByDepth => {
  const fiber = snapshot.nodes.get(rootNodeID);
  const actualDuration = fiber.get('actualDuration') || 0;
  const name = fiber.get('name') || 'Unknown';
  const didRender = snapshot.committedNodes.includes(rootNodeID);

  // Only initialize the first row.
  // All other rows will derive from this one.
  return [[{
    color: didRender
      ? getGradientColor(actualDuration / maxDuration)
      : didNotRender,
    id: rootNodeID,
    label: didRender
      ? `${name} (${actualDuration.toFixed(2)}ms)`
      : name,
    name,
    treeBaseTime: fiber.get('treeBaseTime'),
    x: 0,
  }]];
});

const getMaxDurationForSnapshot = memoize((snapshot: Snapshot): number => {
  let maxDuration = 0;
  snapshot.committedNodes.forEach(nodeID => {
    const duration = snapshot.nodes.getIn([nodeID, 'actualDuration']);
    if (duration > 0) {
      maxDuration = Math.max(maxDuration, duration);
    }
  });
  return maxDuration;
});

// TODO This doesn't work when you have multiple roots.
// The scale gets messed up because the Fiber may be in the snapshot map, but not in the rendered graph.
const getMaxTreeBaseTime = memoize((snapshot: Snapshot, selectedFiberID: string | null, rootNodeID: string): number =>
  snapshot.nodes.getIn([selectedFiberID, 'treeBaseTime']) ||
  snapshot.nodes.getIn([rootNodeID, 'treeBaseTime']));

// This method depends on rows being initialized in-order.
const findOrCreateNodesForDepth = (
  depth: number,
  lazyIdToDepthMap: LazyIdToDepthMap,
  lazyIdToNodeMap: LazyIdToNodeMap,
  lazyNodesByDepth: LazyNodesByDepth,
  maxDuration: number,
  snapshot: Snapshot,
  showNativeNodes: boolean,
): Array<Node> => {
  for (let index = lazyNodesByDepth.length; index <= depth; index++) {
    const nodesAtPreviousDepth = lazyNodesByDepth[index - 1];
    lazyNodesByDepth[index] = nodesAtPreviousDepth.reduce(
      (nodesAtDepth: Array<Node>, parentNode: Node) =>
        findOrCreateNodesForDepthCrawler(
          snapshot,
          maxDuration,
          lazyIdToDepthMap,
          lazyIdToNodeMap,
          nodesAtDepth,
          parentNode.id,
          index,
          parentNode.x,
          showNativeNodes,
        ), []
    );
  }

  return lazyNodesByDepth[depth];
};

const findOrCreateNodesForDepthCrawler = (
  snapshot: Snapshot,
  maxDuration: number,
  lazyIdToDepthMap: LazyIdToDepthMap,
  lazyIdToNodeMap: LazyIdToNodeMap,
  nodesAtDepth: Array<Node>,
  fiberID: string,
  depth: number,
  leftOffset: number = 0,
  showNativeNodes: boolean,
): Array<Node> => {
  const { committedNodes, nodes } = snapshot;

  const children = nodes.getIn([fiberID, 'children']);
  let childArray = null;
  if (Array.isArray(children)) {
    childArray = children;
  } else if (children != null) {
    childArray = [children];
  }

  if (childArray !== null) {
    childArray.forEach(id => {
      const fiber = nodes.get(id);
      if (fiber === undefined) {
        // Bailout on Text nodes
        return;
      } if (!showNativeNodes && fiber.get('nodeType') === 'Native') {
        // Skip over native fibers if they are being filtered from the view
        findOrCreateNodesForDepthCrawler(
          snapshot,
          maxDuration,
          lazyIdToDepthMap,
          lazyIdToNodeMap,
          nodesAtDepth,
          id,
          depth,
          leftOffset,
          showNativeNodes,
        );
      } else {
        const actualDuration = fiber.get('actualDuration') || 0;
        const treeBaseTime = fiber.get('treeBaseTime');
        const name = fiber.get('name') || 'Unknown';
        const didRender = committedNodes.includes(id);

        const prevNode = nodesAtDepth.length
          ? nodesAtDepth[nodesAtDepth.length - 1]
          : null;

        const node = {
          color: didRender
            ? getGradientColor(actualDuration / maxDuration)
            : didNotRender,
          id,
          label: didRender
            ? `${name} (${actualDuration.toFixed(2)}ms)`
            : name,
          name,
          treeBaseTime,
          x: Math.max(leftOffset, (prevNode !== null ? prevNode.x + prevNode.treeBaseTime : 0)),
        };

        nodesAtDepth.push(node);

        lazyIdToDepthMap[id] = depth;
        lazyIdToNodeMap[id] = node;
      }
    });
  }

  return nodesAtDepth;
};

export default SnapshotFlamegraph;
