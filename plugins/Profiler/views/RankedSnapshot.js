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

// $FlowFixMe
import React, { createRef, Component } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { scaleLinear } from 'd3'; // TODO Move to utils
import { gradient } from './colors';

import type {Snapshot} from '../ProfilerTypes';

require('./d3-graph.css');

// TODO constants
const minWidthToDisplay = 35;
const barHeight = 20;

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
  bar: any = null;
  chart: any = null;
  ref = createRef();
  x: any = null;

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

    const x = scaleLinear()
      .domain([0, maxValue])
      .range([0, width]);

    return (
      <div style={{ height, width, overflow: 'auto' }}>
        <svg className="d3-graph" height={barHeight * nodes.length} width={width}>
          {nodes.map((node, index) => (
            <g
              key={node.id}
              className={node.value > maxValue ? 'fade' : ''}
              transform={`translate(0,${barHeight * index})`}
            >
              <title>{node.label}</title>
              <rect
                className="d3-animated-resize"
                width={x(node.value)}
                height={barHeight}
                fill={this.getNodeColor(node)}
                onClick={() => this.selectNode(node)}
              />
              <foreignObject
                className="d3-animated-resize"
                width={x(node.value)}
                height={barHeight}
                style={{
                  display: x(node.value) < minWidthToDisplay ? 'none' : 'block',
                }}
              >
                <div className="d3-graph-label">
                  {node.label}
                </div>
              </foreignObject>
            </g>
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
        label: `${name} - ${node.actualDuration.toFixed(2)}ms`,
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
