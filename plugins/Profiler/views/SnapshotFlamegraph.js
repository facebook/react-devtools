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

import React, { Component, Fragment } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import ChartNode from './ChartNode';
import { barHeight, didNotRender, gradient, scale } from './constants';

require('./shared-profiler-styles.css');

type Props = {|
  snapshot: Snapshot,
|};

const SnapshotFlamegraph = ({snapshot}: Props) => {
  const rootNode = snapshot.nodes.get(snapshot.root);
  const children = rootNode.get('children');
  const rootNodeID = Array.isArray(children) ? children[0] : children;

  const data = convertSnapshotToChartData(snapshot, rootNodeID);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Flamegraph width={width} height={height} data={data} />
      )}
    </AutoSizer>
  );
};

export type Node = {|
  children: Array<Node>,
  color: string,
  id: string,
  label: string,
  value: number,
  x?: number,
|};

type FlamegraphProps = {|
  data: Node,
  height: number,
  width: number,
|};

type FlamegraphState = {|
  maxValue: number,
  prevData: Node,
  selectedNode: Node,
|};

class Flamegraph extends Component<FlamegraphProps, FlamegraphState> {
  state: FlamegraphState = {
    maxValue: this.props.data.value,
    prevData: this.props.data,
    selectedNode: this.props.data,
  };

  static getDerivedStateFromProps(props: FlamegraphProps, state: FlamegraphState): $Shape<FlamegraphState> {
    if (state.prevData !== props.data) {
      return {
        maxValue: props.data.value,
        prevData: props.data,
        selectedNode: props.data,
      };
    }
    return null;
  }

  render() {
    const { data, height, width } = this.props;
    const { maxValue, selectedNode } = this.state;

    // TODO: Memoize
    const depth = preprocessData(data);

    const scaleX = scale(0, maxValue, 0, width);

    return (
      <div style={{ height, width, overflow: 'auto' }}>
        <svg className="profiler-graph" height={barHeight * depth} width={width}>
          <RecursiveNode
            maxValue={maxValue}
            node={data}
            scaleX={scaleX}
            selectedNode={selectedNode}
            selectNode={this.selectNode}
          />
        </svg>
      </div>
    );
  }

  selectNode = (node: Node) => this.setState({
    maxValue: node.value,
    selectedNode: node,
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
  maxValue: number,
  node: Node,
  scaleX: Function,
  selectedNode: Node,
  selectNode: Function,
  x?: number,
|};
const RecursiveNode = ({ depth = 0, maxValue, node, scaleX, selectedNode, selectNode, x = 0 }: RecursiveNodeProps) => (
  <Fragment>
    <ChartNode
      className={node.value > maxValue ? 'profiler-animated-move fade' : 'profiler-animated-move'}
      color={node.color}
      height={barHeight}
      label={node.label}
      onClick={() => selectNode(node)}
      width={scaleX(node.value)}
      x={scaleX(x) - scaleX(selectedNode.x)}
      y={barHeight * depth}
    />
    {node.children.map((childNode, index) => (
      <RecursiveNode
        key={index}
        depth={depth + 1}
        maxValue={maxValue}
        node={childNode}
        scaleX={scaleX}
        selectedNode={selectedNode}
        selectNode={selectNode}
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
        ? gradient[Math.round((node.actualDuration / maxDuration) * (gradient.length - 1))]
        : didNotRender,
      id: node.id,
      label: renderedInCommit
        ? `${name} (${node.actualDuration.toFixed(2)}ms)`
        : name,
      value: node.treeBaseTime,
    };
  };

  return convertNodeToDatum(rootNodeID);
};

module.exports = SnapshotFlamegraph;
