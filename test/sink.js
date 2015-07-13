
import React from 'react/addons'
import assign from 'object-assign'

class LongRender {
  render() {
    var t = Date.now();
    while (Date.now() - t < 50) {
    }
    return <div>That took a long time</div>
  }
}

class DeepTree {
  render() {
    var child = <span>At the bottom</span>
    for (var i=0; i<20; i++) {
      child = <span>({i}{child}</span>
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
      return <span>bottom</span>
    }
    return <div>
      <button onClick={() => this.setState({click: 1})}>Rerender</button>
      <Nester depth={depth + 1} />
      <Nester depth={depth + 1} />
    </div>
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

class Sink {
  render() {
    var examples = {
      LongRender,
      DeepTree,
      BadUnmount,
      Nester,
    };

    var view = Comp => run(View, {Comp})

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
    this.state = {hover: null}
  }

  isMe(evt) {
    var node = React.findDOMNode(this.node);
    return evt.target === node
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
    var style = this.props.style
    if (this.state.hover) {
      style = assign({}, style, {
        backgroundColor: '#eee'
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
    var Comp = this.props.Comp
    return (
      <div>
        <button onClick={() => run(Sink)}>Back to Sink</button>
        <Comp />
      </div>
    );
  }
}

function run(Comp, props) {
  props = props || {}
  React.unmountComponentAtNode(node);
  React.render(<Comp {...props} />, node);
}

var node = document.createElement('div');
document.body.appendChild(node);

var styles = {
};

window.React = React;

run(Sink);
