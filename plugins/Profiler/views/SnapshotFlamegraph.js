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

import React, { Component, Fragment } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
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

  // TODO Memoize this
  const data = convertSnapshotToChartData(snapshot, rootNodeID);

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
  maxValue: number,
  prevData: Node,
|};

class Flamegraph extends Component<FlamegraphProps, FlamegraphState> {
  state: FlamegraphState = {
    focusedNode: this.props.data,
    maxValue: this.props.data.value,
    prevData: this.props.data,
  };

  static getDerivedStateFromProps(props: FlamegraphProps, state: FlamegraphState): $Shape<FlamegraphState> {
    if (state.prevData !== props.data) {
      return {
        maxValue: props.data.value,
        prevData: props.data,
        focusedNode: props.data,
      };
    }
    return null;
  }

  render() {
    const { data, height, selectNode, theme, width } = this.props;
    const { maxValue, focusedNode } = this.state;

    // TODO: Memoize
    const depth = preprocessData(data);

    const scaleX = scale(0, maxValue, 0, width);

    return (
      <div style={{ height, width, overflow: 'auto' }}>
        <svg height={barHeight * depth} width={width}>
          <RecursiveNode
            focusedNode={focusedNode}
            focusNode={this.focusNode}
            maxValue={maxValue}
            node={data}
            scaleX={scaleX}
            selectNode={selectNode}
            theme={theme}
          />
        </svg>
      </div>
    );
  }

  focusNode = (node: Node) => this.setState({
    focusedNode: node,
    maxValue: node.value,
  });
}

const preprocessData = (node: Node) => {
  let maxDepth = 0;

  const processNode = (currentNode: Node, currentDepth: number = 0, currentX = 0) => {
    maxDepth = Math.max(maxDepth, currentDepth);

    currentNode.x = currentX;

    let relativeX = 0;

    currentNode.children.map(childNode => {
      processNode(childNode, currentDepth + 1, currentX + relativeX);
      relativeX += childNode.value;
    });
  };

  processNode(node);

  return maxDepth;
};

type RecursiveNodeProps = {|
  depth?: number,
  focusedNode: Node,
  focusNode: (nodee: Node) => void,
  maxValue: number,
  node: Node,
  scaleX: Function,
  selectNode: SelectNode,
  theme: Theme,
  x?: number,
|};
const RecursiveNode = ({ depth = 0, focusedNode, focusNode, maxValue, node, scaleX, selectNode, theme, x = 0 }: RecursiveNodeProps) => (
  <Fragment>
    <ChartNode
      color={node.color}
      height={barHeight}
      label={node.label}
      onClick={() => focusNode(node)}
      onDoubleClick={() => selectNode(node.id, node.name)}
      style={node.value > maxValue ? ChartNodeDimmed : null}
      theme={theme}
      width={scaleX(node.value)}
      x={scaleX(x) - scaleX(focusedNode.x)}
      y={barHeight * depth}
    />
    {node.children.map((childNode, index) => (
      <RecursiveNode
        key={index}
        depth={depth + 1}
        focusedNode={focusedNode}
        focusNode={focusNode}
        maxValue={maxValue}
        node={childNode}
        scaleX={scaleX}
        selectNode={selectNode}
        theme={theme}
        x={childNode.x}
      />
    ))} 
  </Fragment>
);

const convertSnapshotToChartData = (snapshot, rootNodeID) => {
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
};

module.exports = SnapshotFlamegraph;
