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
  children: Array<Node>,
  color: string,
  fiber: Object,
  id: string,
  label: string,
  name: string,
  value: number,
  x?: number,
|};

type SelectOrInspectFiber = (fiber: Object) => void;

type Props = {|
  inspectFiber: SelectOrInspectFiber,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  snapshot: Snapshot,
  theme: Theme,
|};

const SnapshotFlamegraph = ({inspectFiber, selectedFiberID, selectFiber, snapshot, theme}: Props) => {
  const rootNode = snapshot.nodes.get(snapshot.root);
  const children = rootNode.get('children');
  const rootNodeID = Array.isArray(children) ? children[0] : children;

  // The following conversion methods are memoized,
  // So it's okay to call them on every render.
  const data = convertSnapshotToChartData(snapshot, rootNodeID);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Flamegraph
          data={data}
          inspectFiber={inspectFiber}
          height={height}
          selectedFiberID={selectedFiberID}
          selectFiber={selectFiber}
          theme={theme}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

type FlamegraphProps = {|
  data: Node,
  inspectFiber: SelectOrInspectFiber,
  height: number,
  selectedFiberID: string | null,
  selectFiber: SelectOrInspectFiber,
  theme: Theme,
  width: number,
|};

const Flamegraph = ({ data, inspectFiber, height, selectedFiberID, selectFiber, theme, width }: FlamegraphProps) => {
  // The following conversion methods are memoized,
  // So it's okay to call them on every render.
  const {
    focusedNode,
    focusedNodeIndex,
    maxValue,
  } = getFocusedNodeData(data, selectedFiberID);
  const nodesByDepth = getNodesByDepthMap(data);
  const itemData = getItemData(
    focusedNode,
    focusedNodeIndex,
    inspectFiber,
    maxValue,
    nodesByDepth,
    selectFiber,
    theme,
    width,
  );

  return (
    <List
      containerTag="svg"
      height={height}
      itemCount={nodesByDepth.length}
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

    const nodes = data.nodesByDepth[index];

    // List items are absolutely positioned using the CSS "top" attribute.
    // The "left" value will always be 0.
    // Since height is fixed, and width is based on the node's duration,
    // We can ignore those values as well.
    const top = parseInt(style.top, 10);

    return (
      <Fragment>
        {nodes.map(node => {
          const focusedNodeX = data.scaleX(data.focusedNode.x);
          const nodeX = data.scaleX(node.x);
          const nodeWidth = data.scaleX(node.value);

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
              isDimmed={index < data.focusedNodeIndex}
              key={node.id}
              label={node.label}
              onClick={() => data.selectFiber(node.fiber)}
              onDoubleClick={() => data.inspectFiber(node.fiber)}
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

const getFocusedNodeData = memoize((data: Node, selectedFiberID: string | null) => {
  let focusedNode = data;
  let focusedNodeIndex = 0;
  let maxValue = data.value;

  if (selectedFiberID !== null) {
    const findNode = (node: Node, depth: number = 0) => {
      if (node.id === selectedFiberID) {
        // Don't "zoom in" on a node that wasn't part of this commit.
        // This would problems with the scaling logic elsewhere.
        if (node.value > 0) {
          focusedNode = node;
          focusedNodeIndex = depth;
          maxValue = node.value;
        }
      } else {
        node.children.find(childNode => findNode(childNode, depth + 1));
      }
    };

    findNode(data);
  }

  return {
    focusedNode,
    focusedNodeIndex,
    maxValue,
  };
});

const getItemData = memoize((focusedNode, focusedNodeIndex, inspectFiber, maxValue, nodesByDepth, selectFiber, theme, width) => {
  return {
    focusedNode,
    focusedNodeIndex,
    inspectFiber,
    maxValue,
    nodesByDepth,
    scaleX: scale(0, maxValue, 0, width),
    selectFiber,
    theme,
    width,
  };
});

// TODO Combine getNodesByDepthMap() and convertSnapshotToChartData() ?

const getNodesByDepthMap = memoize((node: Node) => {
  const nodesByDepth = [];

  const processNode = (currentNode: Node, currentDepth: number = 0, currentX = 0) => {
    if (nodesByDepth.length === currentDepth) {
      nodesByDepth[currentDepth] = [currentNode];
    } else {
      nodesByDepth[currentDepth].push(currentNode);
    }

    currentNode.x = currentX;

    let relativeX = 0;

    currentNode.children.map(childNode => {
      processNode(childNode, currentDepth + 1, currentX + relativeX);
      relativeX += childNode.value;
    });
  };

  processNode(node);

  return nodesByDepth;
});

const convertSnapshotToChartData = memoize((snapshot, rootNodeID) => {
  let maxDuration = 0;

  snapshot.committedNodes.forEach(nodeID => {
    const duration = snapshot.nodes.getIn([nodeID, 'actualDuration']);
    if (duration > 0) {
      maxDuration = Math.max(maxDuration, duration);
    }
  });

  const convertNodeToDatum = nodeID => {
    const node = snapshot.nodes.get(nodeID).toJSON();
    const renderedInCommit = snapshot.committedNodes.includes(nodeID);
    const name = node.name || 'Unknown';

    return {
      children: node.children
        ? (Array.isArray(node.children) ? node.children : [node.children])
          .filter(childID => snapshot.nodes.has(childID))
          .map(convertNodeToDatum)
        : [],
      color: renderedInCommit
        ? getGradientColor(node.actualDuration / maxDuration)
        : didNotRender,
      fiber: node,
      id: node.id,
      label: renderedInCommit
        ? `${name} (${node.actualDuration.toFixed(2)}ms)`
        : name,
      name,
      value: node.treeBaseTime,
    };
  };

  return convertNodeToDatum(rootNodeID);
});

export default SnapshotFlamegraph;
