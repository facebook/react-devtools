/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * A Kitchen Sink of examples
 *
 */
'use strict';

var React = require('react/addons');
var assign = require('object-assign');

// Different test things

class LongRender {
  render() {
    var t = Date.now();
    while (Date.now() - t < 50) {
    }
    return <div>That took a long time</div>;
  }
}

class DeepTree {
  render() {
    var child = <span>At the bottom</span>;
    for (var i = 0; i < 20; i++) {
      child = <span>({i}{child}</span>;
    }
    return child;
  }
}

class Nester extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    var depth = this.props.depth || 0;
    if (depth > 10) {
      return <span>bottom</span>;
    }
    return (
      <div>
        <button onClick={() => this.setState({click: 1})}>Rerender</button>
        <Nester depth={depth + 1} />
        <Nester depth={depth + 1} />
      </div>
    );
  }
}

class SymbolProp {
  render() {
    return (
      <div sym={Symbol('name')}>
        This tests that dehydration + inspection works with symbols
        {Symbol('child')}
      </div>
    );
  }
}

class BadUnmount {
  render() {
    return (
      <div>
        <button>Make a bad unmount</button>
        <button>Clean things up</button>
      </div>
    );
  }
}

class Mounty {
  render() {
    return <h1>{this.props.name} {this.props.val}</h1>;
  }
}

class LotsOfMounts {
  componentDidMount() {
    this.roots = [];
    this.make('Rock');
    this.make('Solid');
    this.mounty('One');
    this.mounty('Two');
    this.mounty('Three');
  }

  componentWillUnmount() {
    this.roots.forEach(div => React.unmountComponentAtNode(div));
  }

  make(name) {
    var node = React.findDOMNode(this.node);
    if (!node) {
      return null;
    }
    var val = Math.random().toString(0x0f).slice(0, 20);
    var div = document.createElement('div');

    node.appendChild(div);
    this.roots.push(div);
    React.render(<Mounty name={name} val={val} />, div);
    return div;
  }

  mounty(name) {
    var div = this.make(name);
    if (!div) {
      return;
    }
    setTimeout(() => {
      if (this.roots.indexOf(div) === -1) {
        return;
      }
      React.unmountComponentAtNode(div);
      var ix = this.roots.indexOf(div);
      this.roots.splice(ix, 1);
      this.mounty(name);
    }, Math.random() * 1000 + 1000);
  }

  render() {
    return <div ref={node => this.node = node} />;
  }
}

// Render the list of tests

class Sink {
  render() {
    var examples = {
      SymbolProp,
      LongRender,
      DeepTree,
      BadUnmount,
      Nester,
      LotsOfMounts,
    };

    var view = Comp => run(View, {Comp});

    return (
      <ul style={styles.sinkList}>
        {Object.keys(examples).map(name => (
          <li onClick={() => view(examples[name])}>
            <HighlightHover style={styles.sinkItem}>
              {name}
            </HighlightHover>
          </li>
        ))}
      </ul>
    );
  }
}

class HighlightHover extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hover: null};
  }

  isMe(evt) {
    var node = React.findDOMNode(this.node);
    return evt.target === node;
  }

  onOver(evt) {
    if (!this.isMe(evt)) {
      return;
    }
    this.setState({hover: true});
  }

  onOut(evt) {
    if (!this.isMe(evt)) {
      return;
    }
    this.setState({hover: false});
  }

  render() {
    var style = this.props.style;
    if (this.state.hover) {
      style = assign({}, style, {
        backgroundColor: '#eee',
      });
    }

    return (
      <div
        ref={d => this.node = d}
        onMouseOver={this.onOver.bind(this)}
        onMouseOut={this.onOut.bind(this)}
        style={style}
      >
        {this.props.children}
      </div>
    );
  }
}

class View {
  render() {
    var Comp = this.props.Comp;
    return (
      <div>
        <button onClick={() => run(Sink)}>Back to Sink</button>
        <Comp />
      </div>
    );
  }
}

function run(Comp, props) {
  props = props || {};
  React.unmountComponentAtNode(node);
  React.render(<Comp {...props} />, node);
}

var node = document.createElement('div');
document.body.appendChild(node);

var styles = {
};

window.React = React;

run(Sink);
