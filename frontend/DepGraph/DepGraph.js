/* @flow */

var React = require('react');
var decorate = require('../decorate');
var crawlChildren = require('./crawlChildren');
var dagre = require('dagre');

class DepGraph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {on: false};
  }
  render() {
    if (this.state.on) {
      return <DepGrapher />;
    }
    return <button onClick={() => this.setState({on: true})}>Show DepGraph</button>
  }
}

class DisplagDeps extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    var graph = this.props.graph;
    return (
      <div style={styles.container}>
      {/*<div style={{width: graph.graph().width, height: graph.graph().height}}>*/}
      <svg width={graph.graph().width + 20} height={graph.graph().height + 20}>
        <g transform="translate(10,10)">
          {graph.edges().map(n => {
            var edge = graph.edge(n);
            var dx = 0;
            if (edge.points[edge.points.length-1].y < edge.points[0].y) {
              dx = 10;
            }
            return (
              <polyline
                points={edge.points.map(p => p.x + dx + ',' + p.y).join(' ')}
                fill="none"
                stroke="orange"
                strokeWidth="2"
              />
            );
          })}
        </g>
        <g transform="translate(10,10)">
          {graph.nodes().map(n => {
            var node = graph.node(n);
            return (
              <rect
                height={node.height}
                width={node.width}
                x={node.x - node.width/2}
                y={node.y-node.height/2}
                fill="none"
                stroke="black"
                strokeWidth="1"
              />
            );
          })}
        </g>
        <g transform="translate(10,10)">
          {graph.nodes().map(n => {
            var node = graph.node(n);
            return (
              <text
                x={node.x}
                y={node.y+node.height/4}
                textAnchor="middle"
                fontSize="10"
                fontFamily="sans-serif"
              >{node.label}</text>
            );
          })}
        </g>
        </svg>
      </div>
    );
  }
}

var styles = {
  container: {
    overflow: 'auto',
    border: '1px solid red',
    position: 'relative',
    flex: 1,
  }
}

function dagrize(graph) {
  var g = new dagre.graphlib.Graph();
  g.setGraph({});
  g.setDefaultEdgeLabel(() => ({}));
  var used = {};
  for (var name in graph) {
    var parts = name.split('\x1f');
    if (parts[1] in used) {
      continue;
    }
    g.setNode(parts[1], {label: parts[1], width: parts[1].length * 7, height: 20});
  }

  for (var name in graph) {
    var parts = name.split('\x1f');
    if (parts[0] === '$root') continue;
    g.setEdge(parts[0], parts[1], {label: graph[name]});
  }

  dagre.layout(g, {
    nodesep: 20,
    ranksep: 20,
  });
  window.ggg = g;
  return g;
}

var DepGrapher = decorate({
  listeners: () => [],
  props(store) {
    // todo get the root of the current selection
    // var graph = calcGraph(store.roots.get(0), store.nodes);
    var graph = {};
    crawlChildren('$root', [store.roots.get(0)], store._nodes, 0, graph);
    return {graph: dagrize(graph)};
  }
}, DisplagDeps);

module.exports = DepGraph;
