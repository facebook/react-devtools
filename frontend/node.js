
var React = require('react');
var assign = require('object-assign');

var decorate = require('./decorate');
var Props = require('./props');
var flash = require('./flash');

class Node {
  shouldComponentUpdate(nextProps) {
    return nextProps !== this.props
  }

  render() {
    var node = this.props.node;
    if (!node) {
      return <span>Node deleted</span>;
    }
    var children = node.get('children');

    if (node.get('nodeType') === 'Wrapper') {
      return <WrappedNode id={children[0]} depth={this.props.depth} />;
    }

    var leftPad = {
      paddingLeft: (this.props.depth + 1) * 10,
    };
    var headStyles = assign(
      {},
      styles.head,
      this.props.hovered && styles.headHover,
      this.props.selected && !this.props.selBottom && styles.headSelect,
      leftPad
    );

    var tagEvents = {
      onMouseOver: () => this.props.onHover(true),
      onMouseOut: () => this.props.onHover(false),
      onDoubleClick: this.props.onToggleCollapse,
      onMouseDown: this.props.onSelect,
    };

    if (!children || 'string' === typeof children || !children.length) {
      var name = '' + node.get('name') || 'span';
      var content = children || node.get('text');
      return (
        <div style={styles.container}>
          <div style={headStyles} {...tagEvents}>
            <span style={styles.tagText}>
              <span style={styles.openTag}>
                <span style={styles.angle}>&lt;</span>
                <span style={styles.tagName}>{name}</span>
                {node.get('props') && <Props props={node.get('props')}/>}
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
            </span>
            <span style={styles.renderCount}>
              {node.get('renders')}
            </span>
          </div>
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
          {'' + node.get('name')}
        </span>
        <span style={styles.angle}>&gt;</span>
      </span>
    );

    var collapserStyle = assign(
      {},
      styles.collapser,
      {left: leftPad.paddingLeft - 12},
      node.get('state') && {
        color: 'red',
      },
    );

    var head = (
      <div style={headStyles} {...tagEvents}>
        <span onClick={this.props.onToggleCollapse} style={collapserStyle}>
          {node.get('collapsed') ? <span>&#9654;</span> : <span>&#9660;</span>}
        </span>
        <span style={styles.tagText}>
          <span style={styles.openTag}>
            <span style={styles.angle}>&lt;</span>
            <span style={styles.tagName}>{'' + node.get('name')}</span>
            {node.get('props') && <Props props={node.get('props')}/>}
            <span style={styles.angle}>&gt;</span>
          </span>
          {collapsed && '…'}
          {collapsed && closeTag}
        </span>
        <span style={styles.renderCount}>
          {node.get('renders')}
        </span>
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
      this.props.selected && this.props.selBottom && styles.headSelect,
      leftPad
    );

    return (
      <div style={styles.container}>
        {head}
        <div style={styles.children}>
          {children.map(id => <WrappedNode key={id} depth={this.props.depth + 1} id={id} />)}
        </div>
        <div style={tailStyles} {...tagEvents} onMouseDown={this.props.onSelectBottom} >
          {closeTag}
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
    var node = store.get(props.id)
    return {
      node,
      selected: store.selected === props.id,
      selBottom: store.selBottom,
      hovered: store.hovered === props.id,
      onToggleCollapse: e => {
        e.preventDefault();
        store.toggleCollapse(props.id);
      },
      onHover: isHovered => store.setHover(props.id, isHovered),
      onSelect: e => {
        e.preventDefault();
        store.selectTop(props.id);
      },
      onSelectBottom: e => {
        e.preventDefault();
        store.selectBottom(props.id);
      },
    };
  },
  shouldUpdate(nextProps, prevProps) {
    return nextProps.id !== prevProps.id;
  },
}, Node);

var tagColor = 'rgb(184, 0, 161)';
tagColor = 'rgb(176, 0, 182)';
tagColor = 'rgb(136, 18, 128)';

var styles = {
  container: {
  },

  head: {
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
  },

  renderCount: {
    textAlign: 'right',
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
  },

  tagText: {
    flex: 1,
    wordWrap: 'break-word',
  },

  headSelect: {
    backgroundColor: '#ccc'
  },

  collapser: {
    fontSize: 9,
    color: '#555',
    marginRight: 3,
    position: 'absolute',
    padding: 2,
  },

  headHover: {
    backgroundColor: '#eee'
  },
};

module.exports = WrappedNode;
