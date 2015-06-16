
var React = require('react');
var assign = require('object-assign');

var decorate = require('./decorate');

class Node extends React.Component {
  render() {
    var node = this.props.node;
    var children = node.get('children');
    var leftPad = {
      paddingLeft: this.props.depth * 20,
    };
    var headStyles = assign(
      {},
      styles.head,
      this.props.hovered && styles.headHover,
      this.props.selected && styles.headSelect,
      leftPad
    )

    if ('string' === typeof children) {
      return <div style={leftPad}>{children}</div>;
    }

    if (!children) {
      return <div style={leftPad}>{node.get('name')}</div>;
    }

    var head = (
      <div
        style={headStyles}
        onMouseOver={() => this.props.onHover(true)}
        onMouseOut={() => this.props.onHover(false)}
        onDoubleClick={this.props.onToggleCollapse}
        onMouseDown={this.props.onSelect}>
        <span onClick={this.props.onToggleCollapse} style={styles.collapser}>
          {node.get('collapsed') ? '+ ' : '- '}
        </span>
        {'<' + node.get('name') + '>'}
      </div>
    );

    if (node.get('collapsed')) {
      return (
        <div style={styles.container}>
          {head}
        </div>
      );
    }

    var tailStyles = assign({}, styles.tail, leftPad);

    return (
      <div style={styles.container}>
        {head}
        <div style={styles.children}>
          {children.map(id => <WrappedNode key={id} depth={this.props.depth + 1} id={id} />)}
        </div>
        <div style={tailStyles}>
          {'</' + node.get('name') + '>'}
        </div>
      </div>
    );
  }
}

var WrappedNode = decorate({
  listeners(props) {
    return [props.id];
  },
  props(store, props) {
    return {
      node: store.get(props.id),
      selected: store.selected === props.id,
      hovered: store.hovered === props.id,
      onToggleCollapse: e => {
        e.preventDefault();
        store.toggleCollapse(props.id);
      },
      onHover: isHovered => store.setHover(props.id, isHovered),
      onSelect: e => {
        e.preventDefault();
        store.select(props.id);
      },
    };
  },
  shouldUpdate(nextProps, prevProps) {
    return nextProps.id !== prevProps.id;
  },
}, Node);

var styles = {
  container: {
  },

  head: {
  },

  tail: {
  },

  headHover: {
    backgroundColor: 'red'
  },

  headSelect: {
    fontWeight: 'bold',
  },
};

module.exports = WrappedNode;
