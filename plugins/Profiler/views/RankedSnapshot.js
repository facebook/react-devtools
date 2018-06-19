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
import { scaleLinear, select } from 'd3';
import { gradient } from './colors';

import type {Snapshot} from '../ProfilerTypes';

require('./d3-graph.css');

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

class Ranked extends Component<RankedProps, void> {
  bar: any = null;
  chart: any = null;
  ref = createRef();
  x: any = null;

  componentDidMount() {
    this.createChart();
  }

  componentDidUpdate(prevProps) {
    const { data, width } = this.props;

    if (data !== prevProps.data) {
      this.createChart();
    } else if (width !== prevProps.width) {
      this.resizeChart();
    }
  }

  render() {
    const { height, width } = this.props;
    return (
      <div style={{ height, width, overflow: 'auto' }}>
        <svg ref={this.ref} className="d3-graph" />
      </div>
    );
  }

  getDataLabel = d => d.label;
  getDataValue = d => this.x(d.value);

  createChart() {
    const { data, width } = this.props;

    this.ref.current.innerHTML = '';

    const {nodes, maxValue} = data;
    const barHeight = 20; // TODO from constants
    const minWidthToDisplay = 35; // TODO from constants

    this.x = scaleLinear()
      .domain([0, maxValue])
      .range([0, width]);

    this.chart = select(this.ref.current)
      .attr('width', width)
      .attr('height', barHeight * nodes.length);

    this.bar = this.chart.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d, i) => 'translate(0,' + barHeight * i + ')');
    
    this.bar.append('rect')
      .attr('fill', d => gradient[Math.round((d.value / maxValue) * (gradient.length - 1))])
      .attr('width', this.getDataValue)
      .attr('height', barHeight);

    this.bar.append('foreignObject').append('xhtml:div');
    this.bar
      .select('foreignObject')
      .style('display', d => this.getDataValue(d) < minWidthToDisplay ? 'none' : 'block')
      .attr('width', this.getDataValue)
      .attr('height', barHeight)
      .select('div')
      .attr('class', 'd3-graph-label')
      .text(this.getDataLabel);
    
    this.bar.append('svg:title');
    this.bar.select('title')
      .text(this.getDataLabel);
  }

  resizeChart() {
    const { width } = this.props;

    const minWidthToDisplay = 35;

    this.x.range([0, width]);

    this.chart.attr('width', width);

    this.bar
      .selectAll('rect')
      .attr('width', this.getDataValue);

    this.bar
      .selectAll('foreignObject')
      .style('display', d => this.getDataValue(d) < minWidthToDisplay ? 'none' : 'block')
      .attr('width', this.getDataValue);
  }
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
