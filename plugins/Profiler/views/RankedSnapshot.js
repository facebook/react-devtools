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

import React, { PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
// TODO import { FixedSizeList as List } from 'react-window';
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
  focusedNodeIndex: number,
  prevData: RankedData,
|};

class Ranked extends PureComponent<RankedProps, RankedState> {
  state: RankedState = {
    focusedNodeIndex: 0,
    prevData: this.props.data,
  };

  static getDerivedStateFromProps(props: RankedProps, state: RankedState): $Shape<RankedState> {
    if (state.prevData !== props.data) {
      return {
        focusedNodeIndex: 0,
        prevData: props.data,
      };
    }
    return null;
  }

  render() {
    const { height, data, selectNode, theme, width } = this.props;
    const { focusedNodeIndex } = this.state;

    const { nodes } = data;

    const scaleX = scale(0, nodes[focusedNodeIndex].value, 0, width);

    // TODO Use react-window
    return (
      <div style={{ height, width, overflow: 'auto' }}>
        <svg height={barHeight * nodes.length} width={width}>
          {nodes.map((node, index) => (
            <ChartNode
              color={getGradientColor(node.value / data.maxValue)}
              height={barHeight}
              key={node.id}
              label={node.label}
              onClick={() => this.focusNode(index)}
              onDoubleClick={() => selectNode(node.id, node.name)}
              style={index < focusedNodeIndex ? ChartNodeDimmed : null}
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

  focusNode = (index: number) => this.setState({
    focusedNodeIndex: index,
  });
}

const convertSnapshotToChartData = (snapshot: Snapshot): RankedData => {
  let maxValue = 0;

  const nodes = snapshot.committedNodes
    .filter(nodeID => snapshot.nodes.has(nodeID) && snapshot.nodes.getIn([nodeID, 'actualDuration']) > 0)
    .map((nodeID, index) => {
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

export default RankedSnapshot;
