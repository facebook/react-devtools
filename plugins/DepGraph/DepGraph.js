/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @ xx flow unused at the moment
 */
'use strict';

var React = require('react');
var decorate = require('../../frontend/decorate');
var crawlChildren = require('./crawlChildren');
var dagre = require('dagre');
var {sansSerif} = require('../../Themes/Fonts');

class DepGraph extends React.Component {
  constructor(props: Object) {
    super(props);
    this.state = {renderCount: 0};
  }
  render() {
    if (this.state.renderCount > 0) {
      return (
        <DepWrapper
          renderCount={this.state.renderCount}
          onClose={() => this.setState({renderCount: 0})}
          onReload={() => this.setState({renderCount: this.state.renderCount + 1})}
        />
      );
    }
    return <button onClick={() => this.setState({renderCount: 1})}>Calculate DepGraph</button>;
  }
}

class DisplayDeps extends React.Component {
  props: Object;
  componentWillReceiveProps(nextProps) {
    if (nextProps.selected !== this.props.selected) {
      this.props.onClose();
    }
  }
  render() {
    return (
      <div style={styles.container}>
        <div style={styles.scrollParent}>
          <SvgGraph
            onHover={this.props.onHover}
            onClick={this.props.onClick}
            graph={this.props.graph}
          />
        </div>
        <div style={styles.buttons}>
          <button onClick={this.props.onReload}>Reload</button>
          <button onClick={this.props.onClose}>&times;</button>
        </div>
      </div>
    );
  }
}

class SvgGraph extends React.Component {
  props: Object;
  render() {
    var graph = this.props.graph;
    if (!graph) {
      return <em>No graph to display. Select something else</em>;
    }
    var transform = 'translate(10, 10)';
    return (
      <svg style={styles.svg} width={graph.graph().width + 20} height={graph.graph().height + 20}>
        <g transform={transform}>
          {graph.edges().map(n => {
            var edge = graph.edge(n);
            return (
              <polyline
                points={edge.points.map(p => p.x + ',' + p.y).join(' ')}
                fill="none"
                stroke="orange"
                strokeWidth="2"
              />
            );
          })}
        </g>
        <g transform={transform}>
          {graph.nodes().map(n => {
            var node = graph.node(n);
            return (
              <rect
                onMouseOver={this.props.onHover.bind(null, node.label)}
                onMouseOut={this.props.onHover.bind(null, null)}
                onClick={this.props.onClick.bind(null, node.label)}
                height={node.height}
                width={node.width}
                x={node.x - node.width / 2}
                y={node.y - node.height / 2}
                style={styles.rect}
                fill="white"
                stroke="black"
                strokeWidth="1"
              />
            );
          })}
        </g>
        <g transform={transform}>
          {graph.nodes().map(n => {
            var node = graph.node(n);
            return (
              <text
                style={{pointerEvents: 'none'}}
                x={node.x}
                y={node.y + node.height / 4}
                textAnchor="middle"
                fontSize="10"
                fontFamily={sansSerif.family}
              >{node.label + ' ' + node.count}</text>
            );
          })}
        </g>
      </svg>
    );
  }
}

var styles = {
  container: {
    border: '1px solid red',
    position: 'relative',
    minWidth: 0,
    minHeight: 0,
    flex: 1,
  },

  scrollParent: {
    overflow: 'auto',
    top: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
  },

  rect: {
    cursor: 'pointer',
  },

  svg: {
    flexShrink: 0,
  },

  buttons: {
    position: 'absolute',
    bottom: 3,
    right: 3,
  },
};

function dagrize(graph) {
  var g = new dagre.graphlib.Graph();
  g.setGraph({
    nodesep: 20,
    ranksep: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));
  var hasNodes = false;
  for (var nodeName in graph.nodes) {
    hasNodes = true;
    g.setNode(nodeName, {
      label: nodeName,
      count: graph.nodes[nodeName],
      width: nodeName.length * 7 + 20,
      height: 20,
    });
  }
  if (!hasNodes) {
    return false;
  }

  for (var edgeName in graph.edges) {
    var parts = edgeName.split('\x1f');
    if (parts[0] === '$root') {
      continue;
    }
    g.setEdge(parts[0], parts[1], {label: graph[edgeName]});
  }

  dagre.layout(g);
  return g;
}

var DepWrapper = decorate({
  listeners: () => ['selected'],
  shouldUpdate(nextProps, props) {
    return nextProps.renderCount !== props.renderCount;
  },
  props(store) {
    var graph = {
      edges: {},
      nodes: {},
    };
    crawlChildren('$root', [store.selected], store._nodes, 0, graph);
    return {
      selected: store.selected,
      graph: dagrize(graph),
      onHover: name => store.hoverClass(name),
      onClick: name => store.selectFirstOfClass(name),
    };
  },
}, DisplayDeps);

module.exports = DepGraph;
