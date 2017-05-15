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

var React = require('react');
var ReactDOM = require('react-dom');

var assign = require('object-assign');
var guid = require('../../utils/guid');

// Different test things

class LongRender extends React.Component {
  render() {
    var t = Date.now();
    while (Date.now() - t < 50) {
    }
    return <div>That took a long time</div>;
  }
}

class DeepTree extends React.Component {
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

class SymbolProp extends React.Component {
  render() {
    return (
      <div sym={Symbol('name')}>
        This tests that dehydration + inspection works with symbols
        {Symbol('child')}
      </div>
    );
  }
}

class BadUnmount extends React.Component {
  render() {
    return (
      <div>
        <button>Make a bad unmount</button>
        <button>Clean things up</button>
      </div>
    );
  }
}

class Mounty extends React.Component {
  render() {
    return <h1>{this.props.name} {this.props.val}</h1>;
  }
}

class LotsOfMounts extends React.Component {
  componentDidMount() {
    this.roots = [];
    this.make('Rock');
    this.make('Solid');
    this.mounty('One');
    this.mounty('Two');
    this.mounty('Three');
  }

  componentWillUnmount() {
    this.roots.forEach(div => ReactDOM.unmountComponentAtNode(div));
  }

  make(name) {
    var node = this.node;
    if (!node) {
      return null;
    }
    var val = guid();
    var div = document.createElement('div');

    node.appendChild(div);
    this.roots.push(div);
    ReactDOM.render(<Mounty name={name} val={val} />, div);
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
      ReactDOM.unmountComponentAtNode(div);
      var ix = this.roots.indexOf(div);
      this.roots.splice(ix, 1);
      this.mounty(name);
    }, Math.random() * 1000 + 1000);
  }

  render() {
    return <div ref={node => this.node = node} />;
  }
}

class IframeWrapper extends React.Component {
  componentDidMount() {
    this.root = document.createElement('div');
    this.frame.contentDocument.body.appendChild(this.root);
    ReactDOM.render(this.props.children, this.root);
  }

  componentWillUnmount() {
    ReactDOM.unmountComponentAtNode(this.root);
  }

  render() {
    var { children, ...props } = this.props; // eslint-disable-line no-unused-vars

    return (
      <div>
        <div>Iframe below</div>
        <iframe ref={frame => this.frame = frame} {...props} />
      </div>
    );
  }
}

class InnerContent extends React.Component {
  render() {
    return (
      <div>
        Inner content (highlight should overlap properly)
      </div>
    );
  }
}

class IframeWithMountedChild extends React.Component {
  render() {
    return (
      <IframeWrapper>
        <InnerContent />
      </IframeWrapper>
    );
  }
}

class NestedMountedIframesWithVaryingBorder extends React.Component {
  render() {
    return (
      <IframeWrapper>
        <IframeWrapper frameBorder="0">
          <InnerContent />
        </IframeWrapper>
      </IframeWrapper>
    );
  }
}

// Render the list of tests

class Sink extends React.Component {
  render() {
    var examples = {
      SymbolProp,
      LongRender,
      DeepTree,
      BadUnmount,
      Nester,
      LotsOfMounts,
      IframeWithMountedChild,
      NestedMountedIframesWithVaryingBorder,
    };

    var view = Comp => run(View, {Comp});

    return (
      <ul style={styles.sinkList}>
        {Object.keys(examples).map(name => (
          <li key={name} onClick={() => view(examples[name])}>
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
    var node = this.node;
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

class View extends React.Component {
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
  ReactDOM.unmountComponentAtNode(node);
  ReactDOM.render(<Comp {...props} />, node);
}

var node = document.createElement('div');
document.body.appendChild(node);

var styles = {
};

window.React = React;

run(Sink);
