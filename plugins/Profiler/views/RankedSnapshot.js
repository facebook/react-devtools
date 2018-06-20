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

import React, { Component } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import ChartNode from './ChartNode';
import { barHeight, gradient, scale } from './constants';

import type {Snapshot} from '../ProfilerTypes';

require('./shared-profiler-styles.css');

type Props = {|
  snapshot: Snapshot,
|};

const RankedSnapshot = ({snapshot}: Props) => {
  const data = convertSnapshotToChartData(snapshot);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Ranked width={width} height={height} data={data} />
      )}
    </AutoSizer>
  );
};

type Node = {|
  id: any,
  label: string,
  value: number,
|};

type RankedData = {|
  maxValue: number,
  nodes: Array<Node>,
|};

type RankedProps = {|
  data: RankedData,
  height: number,
  width: number,
|};

type RankedState = {|
  maxValue: number,
  prevData: RankedData,
  selectedNode: Node | null,
|};

class Ranked extends Component<RankedProps, RankedState> {
  state: RankedState = {
    maxValue: this.props.data.maxValue,
    prevData: this.props.data,
    selectedNode: null,
  };

  static getDerivedStateFromProps(props: RankedProps, state: RankedState): $Shape<RankedState> {
    if (state.prevData !== props.data) {
      return {
        maxValue: props.data.maxValue,
        prevData: props.data,
        selectedNode: null,
      };
    }
    return null;
  }

  render() {
    const { height, data, width } = this.props;
    const { maxValue } = this.state;

    const { nodes } = data;

    const scaleX = scale(0, maxValue, 0, width);

    return (
      <div style={{ height, width, overflow: 'auto' }}>
        <svg className="profiler-graph" height={barHeight * nodes.length} width={width}>
          {nodes.map((node, index) => (
            <ChartNode
              className={node.value > maxValue ? 'fade' : ''}
              color={this.getNodeColor(node)}
              height={barHeight}
              key={node.id}
              label={node.label}
              onClick={() => this.selectNode(node)}
              width={scaleX(node.value)}
              x={0}
              y={barHeight * index}
            />
          ))}
        </svg>
      </div>
    );
  }

  getNodeColor = (node: Node): string =>
    gradient[Math.round((node.value / this.props.data.maxValue) * (gradient.length - 1))];

  selectNode = (node: Node) => this.setState({
    maxValue: node.value,
    selectedNode: node,
  });
}

const convertSnapshotToChartData = (snapshot: Snapshot): RankedData => {
  let maxValue = 0;

  const nodes = snapshot.committedNodes
    .filter(nodeID => snapshot.nodes.has(nodeID) && snapshot.nodes.getIn([nodeID, 'actualDuration']) > 0)
    .map(nodeID => {
      const node = snapshot.nodes.get(nodeID).toJSON();
      const name = node.name || 'Unknown';

      maxValue = Math.max(node.actualDuration, maxValue);

      return {
        id: node.id,
        label: `${name} (${node.actualDuration.toFixed(2)}ms)`,
        value: node.actualDuration,
      };
    })
    .sort((a, b) => b.value - a.value);

  return {
    nodes,
    maxValue,
  };
};

module.exports = RankedSnapshot;
