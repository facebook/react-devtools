import React, { Component, Fragment } from 'react';

const BORDER_THICKNESS = 1;
const HORIZONTAL_TEXT_OFFSET = 4;

// TODO Virtualize to avoid rendering too many expensive nodes.

// TODO Better colors
const getColor = (node, snapshot) => snapshot.committedNodes.includes(node.id) ? '#f75858' : '#cccccc';

const round = number => Math.round(number * 10) / 10;

const FlameRect = ({ horizontalOffset, horizontalScale, node, rowHeight, shouldDim, snapshot, startTime, verticalOffset }) => {
  const x = (horizontalOffset * horizontalScale) + Math.round(horizontalScale * startTime);
  const width = Math.round(horizontalScale * node.treeBaseTime);
  const roundedDuration = snapshot.committedNodes.includes(node.id) ? round(node.actualDuration) : 0;

  if (width <= BORDER_THICKNESS) {
    return null;
  }

  return (
    <g>
      <rect
        data-id={node.id}
        x={x + BORDER_THICKNESS}
        y={verticalOffset + BORDER_THICKNESS}
        height={rowHeight - BORDER_THICKNESS}
        width={width}
        style={{
          fill: getColor(node, snapshot),
          opacity: shouldDim ? 0.35 : 1,
          width: `${width}px`,
          transition: 'all 0.2s ease-in-out',
        }}
      />
      <title>{node.name} - {roundedDuration}ms render time</title>
      <text
        alignmentBaseline="central"
        textAnchor="start"
        x={Math.max(0, x - horizontalOffset) + HORIZONTAL_TEXT_OFFSET}
        y={verticalOffset + rowHeight / 2}
        style={{
          clipPath: `polygon(0 0, ${width - HORIZONTAL_TEXT_OFFSET}px 0, ${width - HORIZONTAL_TEXT_OFFSET}px ${rowHeight}px, 0 ${rowHeight}px)`,
          fontSize: '12px',
          fontWeight: 300,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {node.name}
      </text>
    </g>
  );
};

const Level = ({
  horizontalScale,
  nodeID,
  rowHeight,
  selectedNodeID,
  snapshot,
  width,
}) => {
  // Ignore text children that don't map to Fiber IDs.
  // TODO (bvaughn) Look at what DevTools is doing elsewhere for a cleaner solution.
  if (!snapshot.nodes.has(nodeID)) {
    return null;
  }

  const node = snapshot.nodes.get(nodeID).toJS();
  const depth = snapshot.nodeDepths.get(nodeID);
  const startTime = snapshot.nodeStartTimes.get(nodeID);

  const selectedNode = snapshot.nodes.get(selectedNodeID);
  const selectedNodeStartTime = snapshot.nodeStartTimes.get(selectedNodeID);

  // Filter based on selected node duration to "zoom in" horizontally
  if (
    startTime >= selectedNodeStartTime + selectedNode.treeBaseTime ||
    startTime + node.treeBaseTime <= selectedNodeStartTime
  ) {
    return null;
  }

  let children = null;
  if (node.children) {
    children = Array.isArray(node.children) ? node.children : [node.children];
  }

  return (
    <Fragment>
      {node.treeBaseTime > 0 && (
        <FlameRect
          horizontalOffset={-selectedNodeStartTime}
          horizontalScale={horizontalScale}
          node={node}
          rowHeight={rowHeight}
          shouldDim={depth < snapshot.nodeDepths.get(selectedNodeID)}
          snapshot={snapshot}
          startTime={startTime}
          verticalOffset={depth * rowHeight}
        />
      )}
      {children !== null && children.map(id => (
        <Level
          key={id}
          horizontalScale={horizontalScale}
          nodeID={id}
          rowHeight={rowHeight}
          selectedNodeID={selectedNodeID}
          snapshot={snapshot}
          width={width}
        />
      ))}
    </Fragment>
  );
};

class Flamegraph extends Component {
  state = {};

  static getDerivedStateFromProps(props, state) {
    if (props.snapshot !== state.prevSnapshot) {
      return {
        selectedNodeID: props.rootNodeID,
        prevSnapshot: props.snapshot,
      };
    }
    return null;
  }

  handleClick = event => {
    const id = event.target.getAttribute('data-id');
    if (id) {
      this.setState({ selectedNodeID: id });
    }
  };

  render() {
    const {height, rowHeight = 20, rootNodeID, snapshot, width} = this.props;
    const {selectedNodeID} = this.state;

    const selectedNode = snapshot.nodes.get(selectedNodeID).toJS();
    const horizontalScale = width / selectedNode.treeBaseTime;

    return (
      <svg
        height={height}
        onClick={this.handleClick}
        width={width}
        viewBox={`0 0 ${width} ${snapshot.maxDepth * rowHeight}`}
      >
        <Level
          horizontalScale={horizontalScale}
          nodeID={rootNodeID}
          rowHeight={rowHeight}
          selectedNodeID={selectedNodeID}
          snapshot={snapshot}
          width={width}
        />
      </svg>
    );
  }
}

module.exports = Flamegraph;
