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
import { barHeight, didNotRender, getGradientColor, scale } from './constants';
import { ChartNodeDimmed } from './SharedProfilerStyles';

export type Node = {|
  children: Array<Node>,
  color: string,
  id: string,
  label: string,
  name: string,
  value: number,
  x?: number,
|};

type SelectNode = (nodeID: string, name: string) => void;

type Props = {|
  selectNode: SelectNode,
  snapshot: Snapshot,
  theme: Theme,
|};

const SnapshotFlamegraph = ({selectNode, snapshot, theme}: Props) => {
  const rootNode = snapshot.nodes.get(snapshot.root);
  const children = rootNode.get('children');
  const rootNodeID = Array.isArray(children) ? children[0] : children;

  const data = convertSnapshotToChartData(snapshot, rootNodeID); // (Memoized)

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Flamegraph
          data={data}
          height={height}
          selectNode={selectNode}
          theme={theme}
          width={width}
        />
      )}
    </AutoSizer>
  );
};

type FlamegraphProps = {|
  data: Node,
  height: number,
  selectNode: SelectNode,
  theme: Theme,
  width: number,
|};

type FlamegraphState = {|
  focusedNode: Node,
  focusedNodeIndex: number,
  maxValue: number,
  prevData: Node,
|};

class Flamegraph extends PureComponent<FlamegraphProps, FlamegraphState> {
  state: FlamegraphState = {
    focusedNode: this.props.data,
    focusedNodeIndex: 0,
    maxValue: this.props.data.value,
    prevData: this.props.data,
  };

  static getDerivedStateFromProps(props: FlamegraphProps, state: FlamegraphState): $Shape<FlamegraphState> {
    if (state.prevData !== props.data) {
      return {
        focusedNode: props.data,
        focusedNodeIndex: 0,
        maxValue: props.data.value,
        prevData: props.data,
      };
    }
    return null;
  }

  render() {
    const { data, height, selectNode, theme, width } = this.props;
    const { maxValue, focusedNode, focusedNodeIndex } = this.state;

    const nodesByDepth = preprocessData(data); // Memoized

    const listData = this.getListData(
      focusedNode,
      focusedNodeIndex,
      this.focusNode,
      maxValue,
      nodesByDepth,
      selectNode,
      theme,
      width,
    );

    return (
      <List
        data={listData}
        height={height}
        itemCount={nodesByDepth.length}
        itemSize={barHeight}
        width={width}
      >
        {ListItem}
      </List>
    );
  }

  focusNode = (node: Node, index: number) => this.setState({
    focusedNode: node,
    focusedNodeIndex: index,
    maxValue: node.value,
  });

  getListData = memoize((focusedNode, focusedNodeIndex, focusNode, maxValue, nodesByDepth, selectNode, theme, width) => ({
    focusedNode,
    focusedNodeIndex,
    focusNode,
    maxValue,
    nodesByDepth,
    scaleX: scale(0, maxValue, 0, width),
    selectNode,
    theme,
    width,
  }));
}

class ListItem extends PureComponent<any, void> {
  render() {
    const { data, index, style } = this.props;

    const nodes = data.nodesByDepth[index];

    return (
      <svg style={style}>
        {nodes.map(node => {
          const focusedNodeX = data.scaleX(data.focusedNode.x);
          const nodeX = data.scaleX(node.x);
          const nodeWidth = data.scaleX(node.value);

          // Filter out nodes that are outside of the horizontal window
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
              key={node.id}
              label={node.label}
              onClick={() => data.focusNode(node, index)}
              onDoubleClick={() => data.selectNode(node.id, node.name)}
              style={index < data.focusedNodeIndex ? ChartNodeDimmed : null}
              theme={data.theme}
              width={nodeWidth}
              x={nodeX - focusedNodeX}
              y={0}
            />
          );
        })}
      </svg>
    );
  }
}

// TODO Combine preprocessData() and convertSnapshotToChartData()

const preprocessData = memoize((node: Node) => {
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

module.exports = SnapshotFlamegraph;
