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

import React, { Component } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import ChartNode from './ChartNode';
import { barHeight, getGradientColor, scale } from './constants';
import { ChartNodeDimmed } from './SharedProfilerStyles';

type Node = {|
  id: any,
  label: string,
  name: string,
  value: number,
|};

type SelectNode = (nodeID: string, name: string) => void;

type Props = {|
  selectNode: SelectNode,
  snapshot: Snapshot,
  theme: Theme,
|};

const RankedSnapshot = ({selectNode, snapshot, theme}: Props) => {
  // TODO Memoize this
  const data = convertSnapshotToChartData(snapshot);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Ranked
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

type RankedData = {|
  maxValue: number,
  nodes: Array<Node>,
|};

type RankedProps = {|
  data: RankedData,
  height: number,
  selectNode: SelectNode,
  theme: Theme,
  width: number,
|};

type RankedState = {|
  focusedNode: Node | null,
  maxValue: number,
  prevData: RankedData,
|};

class Ranked extends Component<RankedProps, RankedState> {
  state: RankedState = {
    focusedNode: null,
    maxValue: this.props.data.maxValue,
    prevData: this.props.data,
  };

  static getDerivedStateFromProps(props: RankedProps, state: RankedState): $Shape<RankedState> {
    if (state.prevData !== props.data) {
      return {
        maxValue: props.data.maxValue,
        prevData: props.data,
        focusedNode: null,
      };
    }
    return null;
  }

  render() {
    const { height, data, selectNode, theme, width } = this.props;
    const { maxValue } = this.state;

    const { nodes } = data;

    const scaleX = scale(0, maxValue, 0, width);

    return (
      <div style={{ height, width, overflow: 'auto' }}>
        <svg height={barHeight * nodes.length} width={width}>
          {nodes.map((node, index) => (
            <ChartNode
              color={getGradientColor(node.value / data.maxValue)}
              height={barHeight}
              key={node.id}
              label={node.label}
              onClick={() => this.focusNode(node)}
              onDoubleClick={() => selectNode(node.id, node.name)}
              style={node.value > maxValue ? ChartNodeDimmed : null}
              theme={theme}
              width={scaleX(node.value)}
              x={0}
              y={barHeight * index}
            />
          ))}
        </svg>
      </div>
    );
  }

  focusNode = (node: Node) => this.setState({
    maxValue: node.value,
    focusedNode: node,
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
        name,
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
