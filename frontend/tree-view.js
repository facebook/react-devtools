
var React = require('react');
var Node = require('./node');

var decorate = require('./decorate');

class TreeView extends React.Component {
  getChildContext() {
    return {
      scrollTo: this.scrollTo.bind(this),
    };
  }

  scrollTo(val, height) {
    var node = React.findDOMNode(this);
    var top = node.scrollTop;
    var rel = val - node.offsetTop;
    var margin = 40;
    if (top > rel - margin) {
      node.scrollTop = rel - margin;
    } else if (top + node.offsetHeight < rel + height + margin) {
      node.scrollTop = rel - node.offsetHeight + height + margin;
    }
  }

  render() {
    return (
      <div style={styles.container}>
        {!this.props.roots.count() &&
          <span>Waiting for roots to load...</span>}
        {this.props.roots.map(id => (
          <Node key={id} id={id} depth={0} />
        ))}
      </div>
    );
  }
}

TreeView.childContextTypes = {
  scrollTo: React.PropTypes.func,
}

var styles = {
  container: {
    padding: 3,
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: '12px',
    flex: 1,

    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    MsUserSelect: 'none',
    userSelect: 'none',
  },
};

var WrappedTreeView = decorate({
  listeners(props) {
    return ['roots'];
  },
  props(store, props) {
    return {
      roots: store.roots,
    };
  },
}, TreeView);

module.exports = WrappedTreeView;
