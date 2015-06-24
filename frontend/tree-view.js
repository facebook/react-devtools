
var React = require('react');
var Node = require('./node');

var decorate = require('./decorate');

class TreeView extends React.Component {
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
