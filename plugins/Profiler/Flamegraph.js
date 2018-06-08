import React, { Component, Fragment } from 'react';

const BORDER_THICKNESS = 1;
const HORIZONTAL_TEXT_OFFSET = 4;

// TODO Virtualize to avoid rendering too many expensive nodes.

const hashCode = string => {
  let hash = 0, i, chr;
  if (string.length === 0) return hash;
  for (i = 0; i < string.length; i++) {
    chr = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// TODO Better colors
const colors = ['#6ea1e3', '#9b7fe6', '#74b265', '#efc457'];
const getColor = node => colors[Math.abs(hashCode(node.name)) % colors.length];
const round = number => Math.round(number * 10) / 10;

const FlameRect = ({ horizontalScale, node, rowHeight, shouldDim, timeOffset, verticalOffset }) => {
  const x = Math.round(horizontalScale * (node.startTime - timeOffset));
  const width = Math.round(horizontalScale * node.actualDuration);
  const roundedDuration = round(node.actualDuration); '';

  if (width <= BORDER_THICKNESS) {
    return null;
  }

  return (
    <g>
      <rect
        data-id={node.fiberID}
        x={x + BORDER_THICKNESS}
        y={verticalOffset + BORDER_THICKNESS}
        width={width - BORDER_THICKNESS}
        height={rowHeight - BORDER_THICKNESS}
        style={{
          fill: getColor(node),
          opacity: shouldDim ? 0.35 : 1,
        }}
      />
      <title>{node.name} - {roundedDuration}ms</title>
      <text
        alignmentBaseline="central"
        textAnchor="start"
        x={Math.max(0, x) + HORIZONTAL_TEXT_OFFSET}
        y={verticalOffset + rowHeight / 2}
        style={{
          clipPath: `polygon(0 0, ${width - HORIZONTAL_TEXT_OFFSET}px 0, ${width - HORIZONTAL_TEXT_OFFSET}px ${rowHeight}px, 0 ${rowHeight}px)`,
          fontSize: '12px',
          fontWeight: 300,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {node.name} - {roundedDuration}ms
      </text>
    </g>
  );
};

const Level = ({
  horizontalScale,
  level,
  node,
  nodeMap,
  rowHeight,
  selectedNode,
  timeOffset,
  width,
}) => {
  if (
    node.startTime >= selectedNode.startTime + selectedNode.actualDuration ||
    node.startTime + node.actualDuration <= selectedNode.startTime
  ) {
    return null;
  }

  return (
    <Fragment>
      <FlameRect
        horizontalScale={horizontalScale}
        node={node}
        rowHeight={rowHeight}
        shouldDim={level < selectedNode.depth}
        timeOffset={timeOffset}
        verticalOffset={level * rowHeight}
      />
      {node.childIDs.map(id => (
        <Level
          key={id}
          horizontalScale={horizontalScale}
          level={level + 1}
          node={nodeMap[id]}
          nodeMap={nodeMap}
          rowHeight={rowHeight}
          selectedNode={selectedNode}
          timeOffset={timeOffset}
          width={width}
        />
      ))}
    </Fragment>
  );
};

class Flamegraph extends Component {
  state = {};

  static getDerivedStateFromProps(props, state) {
    if (props.nodeMap !== state.prevNodeMap) {
      return {
        selectedNode: props.nodeMap.ROOT,
        prevNodeMap: props.nodeMap,
      };
    }
    return null;
  }

  handleClick = event => {
    const id = event.target.getAttribute('data-id');
    if (id) {
      this.setState({ selectedNode: this.props.nodeMap[id] });
    }
  };

  render() {
    const {depth, height, nodeMap, rowHeight = 20, width} = this.props;
    const {selectedNode} = this.state;

    const rootNode = nodeMap.ROOT;
    const horizontalScale = width / selectedNode.actualDuration;

    return (
      <svg
        height={height}
        onClick={this.handleClick}
        width={width}
        viewBox={`0 0 ${width} ${depth * rowHeight}`}
      >
        <Level
          horizontalScale={horizontalScale}
          level={0}
          node={rootNode}
          nodeMap={nodeMap}
          rowHeight={rowHeight}
          selectedNode={selectedNode}
          timeOffset={selectedNode.startTime}
          width={width}
        />
      </svg>
    );
  }
}

module.exports = Flamegraph;
