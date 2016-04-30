/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var React = require('react');

var assign = require('object-assign');
var decorate = require('./decorate');
var Props = require('./Props');

import type {Map} from 'immutable';

type PropsType = {
  hovered: boolean,
  selected: boolean,
  node: Map,
  depth: number,
  isBottomTagSelected: boolean,
  wrappedChildren: ?Array<any>,
  onHover: (isHovered: boolean) => void,
  onContextMenu: () => void,
  onToggleCollapse: () => void,
  onSelectBottom: () => void,
  onSelect: () => void,
};

class Node extends React.Component {
  _head: ?HTMLElement;
  _tail: ?HTMLElement;

  context: Object;
  props: PropsType;
  static contextTypes: Object;

  shouldComponentUpdate(nextProps: PropsType) {
    return nextProps !== this.props;
  }

  componentDidMount() {
    if (this.props.selected) {
      this.ensureInView();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.selected && !prevProps.selected) {
      this.ensureInView();
    }
  }

  ensureInView() {
    var node = this.props.isBottomTagSelected ? this._tail : this._head;
    if (!node) {
      return;
    }
    this.context.scrollTo(node.offsetTop, node.offsetHeight);
  }

  render(): ReactElement {
    var node = this.props.node;
    if (!node) {
      return <span>Node was deleted</span>;
    }
    var children = node.get('children');

    if (node.get('nodeType') === 'Wrapper') {
      return <WrappedNode id={children[0]} depth={this.props.depth} />;
    }

    if (node.get('nodeType') === 'NativeWrapper') {
      children = this.props.wrappedChildren;
    }

    var collapsed = node.get('collapsed');

    var leftPad = {
      paddingLeft: (this.props.depth + 1) * 10,
    };
    var headStyles = assign(
      {},
      styles.head,
      this.props.hovered && styles.headHover,
      this.props.selected && (collapsed || !this.props.isBottomTagSelected) && styles.headSelect,
      leftPad
    );

    var tagEvents = {
      onMouseOver: () => this.props.onHover(true),
      onMouseOut: () => this.props.onHover(false),
      onContextMenu: this.props.onContextMenu,
      onDoubleClick: this.props.onToggleCollapse,
      onMouseDown: this.props.onSelect,
    };

    var nodeType = node.get('nodeType');
    if (nodeType === 'Text' || nodeType === 'Empty') {
      var tag;
      if (nodeType === 'Text') {
        var text = node.get('text');
        tag =
          <span style={styles.tagText}>
            <span style={styles.openTag}>
              "
            </span>
            <span style={styles.textContent}>{text}</span>
            <span style={styles.closeTag}>
              "
            </span>
          </span>;
      } else if (nodeType === 'Empty') {
        tag =
          <span style={styles.tagText}>
            <span style={styles.falseyLiteral}>null</span>
          </span>;
      }
      return (
        <div style={styles.container}>
          <div style={headStyles} ref={h => this._head = h} {...tagEvents}>
            {tag}
          </div>
        </div>
      );
    }

    var isCustom = nodeType === 'Composite';

    var tagStyle = isCustom ? styles.customTagName : styles.tagName;

    // Single-line tag (collapsed / simple content / no content)
    if (!children || typeof children === 'string' || !children.length) {
      var name = node.get('name');
      var content = children;
      return (
        <div style={styles.container}>
          <div style={headStyles} ref={h => this._head = h} {...tagEvents}>
            <span style={styles.tagText}>
              <span style={styles.openTag}>
                <span style={tagStyle}>&lt;{name}</span>
                {node.get('key') && <Props key='key' props={{'key': node.get('key')}}/>}
                {node.get('ref') && <Props key='ref' props={{'ref': node.get('ref')}}/>}
                {node.get('props') && <Props key='props' props={node.get('props')}/>}
                {!content && '/'}
                <span style={tagStyle}>&gt;</span>
              </span>
              {content && [
                <span key="content" style={styles.textContent}>{content}</span>,
                <span key="close" style={styles.closeTag}>
                  <span style={tagStyle}>&lt;/{name}&gt;</span>
                </span>,
              ]}
            </span>
          </div>
        </div>
      );
    }

    var closeTag = (
      <span style={styles.closeTag}>
        <span style={tagStyle}>
          &lt;/{'' + node.get('name')}&gt;
        </span>
      </span>
    );

    var hasState = !!node.get('state') || !!node.get('context');

    var collapserStyle = assign(
      {},
      styles.collapser,
      {left: leftPad.paddingLeft - 12},
      isCustom && styles.customCollapser,
      hasState && {
        color: 'red',
      },
    );

    var head = (
      <div ref={h => this._head = h} style={headStyles} {...tagEvents}>
        <span
          title={hasState && 'This component has state'}
          onClick={this.props.onToggleCollapse} style={collapserStyle}
        >
          {node.get('collapsed') ? <span>&#9654;</span> : <span>&#9660;</span>}
        </span>
        <span style={styles.tagText}>
          <span style={styles.openTag}>
            <span style={tagStyle}>&lt;{'' + node.get('name')}</span>
            {node.get('key') && <Props props={{'key': node.get('key')}}/>}
            {node.get('ref') && <Props props={{'ref': node.get('ref')}}/>}
            {node.get('props') && <Props props={node.get('props')}/>}
            <span style={tagStyle}>&gt;</span>
          </span>
          {collapsed && '…'}
          {collapsed && closeTag}
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
      this.props.selected && this.props.isBottomTagSelected && styles.headSelect,
      leftPad
    );

    return (
      <div style={styles.container}>
        {head}
        <div style={styles.children}>
          {children.map(id => <WrappedNode key={id} depth={this.props.depth + 1} id={id} />)}
        </div>
        <div ref={t => this._tail = t} style={tailStyles} {...tagEvents} onMouseDown={this.props.onSelectBottom}>
          {closeTag}
        </div>
      </div>
    );
  }
}

Node.contextTypes = {
  scrollTo: React.PropTypes.func,
};

var WrappedNode = decorate({
  listeners(props) {
    return [props.id];
  },
  props(store, props) {
    var node = store.get(props.id);
    var wrappedChildren = null;
    if (node && node.get('nodeType') === 'NativeWrapper') {
      var child = store.get(node.get('children')[0]);
      wrappedChildren = child && child.get('children');
    }
    return {
      node,
      wrappedChildren,
      selected: store.selected === props.id,
      isBottomTagSelected: store.isBottomTagSelected,
      hovered: store.hovered === props.id,
      onToggleCollapse: e => {
        e.preventDefault();
        store.toggleCollapse(props.id);
      },
      onHover: isHovered => store.setHover(props.id, isHovered),
      onSelect: e => {
        store.selectTop(props.id);
      },
      onSelectBottom: e => {
        store.selectBottom(props.id);
      },
      onContextMenu: e => {
        store.showContextMenu('tree', e, props.id, node);
      },
    };
  },
  shouldUpdate(nextProps, prevProps) {
    return nextProps.id !== prevProps.id;
  },
}, Node);

var styles = {
  // TODO(jared): how do people feel about empty style rules? I put them here
  // in case we need them later, and the corresponding divs refernce them. But
  // I could remove them if desired.
  container: {
  },

  children: {
  },

  textContent: {
  },

  falseyLiteral: {
    fontStyle: 'italic',
  },

  closeTag: {
  },

  head: {
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
  },

  tail: {
    cursor: 'pointer',
  },

  tagName: {
    color: 'rgb(120, 120, 120)',
  },

  customTagName: {
    color: 'rgb(136, 18, 128)',
  },

  openTag: {
  },

  tagText: {
    flex: 1,
    whiteSpace: 'nowrap',
  },

  headSelect: {
    backgroundColor: '#ccc',
  },

  collapser: {
    fontSize: 7,
    color: '#aaa',
    marginRight: 3,
    position: 'absolute',
    padding: 2,
  },

  customCollapser: {
    color: '#555',
    fontSize: 9,
  },

  headHover: {
    backgroundColor: '#eee',
  },
};

module.exports = WrappedNode;
