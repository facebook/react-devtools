import React, { createRef, Component } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { scaleLinear, select } from 'd3';
import { gradient } from './colors';

import type {Snapshot} from '../ProfilerTypes';

require('./d3-graph.css');

type Props = {|
  snapshot: Snapshot,
|};

const WeightedSnapshot = ({snapshot}: Props) => {
  const data = convertSnapshotToChartData(snapshot);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Weighted width={width} height={height} data={data} />
      )}
    </AutoSizer>
  );
};

type WeightedData = {|
  maxValue: number,
  nodes: Array<Node>,
|};

type WeightedProps = {|
  data: WeightedData,
  height: number,
  width: number,
|};

class Weighted extends Component<WeightedProps, void> {
  ref = createRef();

  componentDidMount() {
    this.createChart();
  }

  componentDidUpdate(prevProps) {
    const { data, width } = this.props;

    if (data !== prevProps.data) {
      this.createChart();
    } else if (width !== prevProps.width) {
      // TODO
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

  createChart() {
    const { data, width } = this.props;

    this.ref.current.innerHTML = '';

    const {nodes, maxValue} = data;
    const barHeight = 20;

    const x = scaleLinear()
        .domain([0, maxValue])
        .range([0, width]);
    
    const chart = select(this.ref.current)
        .attr('width', width)
        .attr('height', barHeight * nodes.length);

    const bar = chart.selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('transform', (d, i) => 'translate(0,' + barHeight * i + ')');
    
    bar.append('rect')
        .attr('fill', d => gradient[Math.round((d.value / maxValue) * (gradient.length - 1))])
        .attr('width', d => x(d.value))
        .attr('height', barHeight);
    
    bar.append('text')
        .classed('d3-graph-label', true)
        .attr('x', 4)
        .attr('y', barHeight / 2)
        .attr('dy', '.35em')
        .text(d => d.label);
  }
}

const convertSnapshotToChartData = (snapshot: Snapshot): WeightedData => {
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

module.exports = WeightedSnapshot;
