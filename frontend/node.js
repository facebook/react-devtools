
var React = require('react');
var assign = require('object-assign');

var decorate = require('./decorate');

function previewProp(name) {
}

class Node {
  renderProps() {
    var node = this.props.node;
    var props = node.get('props');
    if (!props || 'object' !== typeof props) {
      return null;
    }

    var names = Object.keys(props).filter(name => {
      if (name[0] === '_') return false;
      if (name === 'children') return false;
      return true;
    });

    var items = [];
    names.slice(0, 3).forEach(name => {
      items.push((
        <span key={name} style={styles.prop}>
          <span style={styles.propName}>{name}</span>
          =
          {previewProp(props[name])}
        </span>
      ));
    });

    if (names.length > 3) {
      items.push('...');
    }
    return items;
  }

  render() {
    var node = this.props.node;
    var children = node.get('children');

    if (node.get('nodeType') === 'Wrapper') {
      return <WrappedNode id={children[0]} depth={this.props.depth} />;
    }

    var leftPad = {
      paddingLeft: (this.props.depth + 1) * 15,
    };
    var headStyles = assign(
      {},
      styles.head,
      this.props.hovered && styles.headHover,
      this.props.selected && styles.headSelect,
      leftPad
    );

    var tagEvents = {
      onMouseOver: () => this.props.onHover(true),
      onMouseOut: () => this.props.onHover(false),
      onDoubleClick: this.props.onToggleCollapse,
      onMouseDown: this.props.onSelect,
    };

    if (!children || 'string' === typeof children) {
      var name = node.get('name') || 'span';
      var content = children || node.get('text');
      return (
        <div style={headStyles} {...tagEvents}>
          <span style={styles.openTag}>
            <span style={styles.angle}>&lt;</span>
            <span style={styles.tagName}>{name}</span>
            {this.renderProps()}
            {!content && '/'}
            <span style={styles.angle}>&gt;</span>
          </span>
          {content && [
            <span key='content' style={styles.textContent}>{content}</span>,
            <span key='close' style={styles.closeTag}>
              <span style={styles.angle}>&lt;/</span>
              <span style={styles.tagName}>{name}</span>
              <span style={styles.angle}>&gt;</span>
            </span>
          ]}
        </div>
      );
    }

    if ('string' === typeof children) {
      return <div style={leftPad}>{children}</div>;
    }

    var collapsed = node.get('collapsed');

    var closeTag = (
      <span style={styles.closeTag}>
        <span style={styles.angle}>&lt;/</span>
        <span style={styles.tagName}>
          {node.get('name')}
        </span>
        <span style={styles.angle}>&gt;</span>
      </span>
    );

    var collapserStyle = assign(
      {},
      styles.collapser,
      {left: leftPad.paddingLeft - 15}
    );

    var head = (
      <div style={headStyles} {...tagEvents}>
        <span onClick={this.props.onToggleCollapse} style={collapserStyle}>
          {node.get('collapsed') ? <span>&#9654;</span> : <span>&#9660;</span>}
        </span>
        <span style={styles.openTag}>
          <span style={styles.angle}>&lt;</span>
          <span style={styles.tagName}>{node.get('name')}</span>
          {this.renderProps()}
          <span style={styles.angle}>&gt;</span>
        </span>
        {collapsed && '...'}
        {collapsed && closeTag}
      </div>
    );

    if (collapsed) {
      return (
        <div style={styles.container}>
          {head}
        </div>
      );
    }

    var tailStyles = assign(
      {},
      styles.tail,
      this.props.hovered && styles.headHover,
      leftPad
    );

    return (
      <div style={styles.container}>
        {head}
        <div style={styles.children}>
          {children.map(id => <WrappedNode key={id} depth={this.props.depth + 1} id={id} />)}
        </div>
        <div style={tailStyles} {...tagEvents}>
          {closeTag}
        </div>
      </div>
    );
  }
}

function shouldElide(node, store) {
  if ('string' !== typeof node.type) {
    return false;
  }
  if (!node.children || node.children.length !== 1) {
    return false;
  }
  var child = store.get(node.children[0]);
  return child && 'string' === typeof child.type;
}

var WrappedNode = decorate({
  listeners(props) {
    return [props.id];
  },
  props(store, props) {
    var node = store.get(props.id)
    return {
      node,
      elide: shouldElide(node, store),
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

var tagColor = 'rgb(184, 0, 161)';

var styles = {
  container: {
  },

  head: {
    cursor: 'pointer',
    position: 'relative',
  },

  tail: {
    cursor: 'pointer',
  },

  angle: {
    color: tagColor,
  },

  tagName: {
    color: tagColor,
  },

  openTag: {
    // 
  },

  prop: {
    paddingLeft: 5,
  },

  propName: {
    color: 'rgb(165, 103, 42)',
  },

  headSelect: {
    backgroundColor: '#ccc'
  },

  collapser: {
    fontSize: 10,
    color: '#555',
    marginRight: 5,
    position: 'absolute',
    padding: 2,
  },

  headHover: {
    backgroundColor: '#eee'
  },
};

module.exports = WrappedNode;
