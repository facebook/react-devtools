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
var flash = require('./flash');

import type {Map} from './imm';

type PropsType = {
  hovered: boolean,
  selected: boolean,
  node: Map,
  depth: number,
  isBottomTagSelected: boolean,
  onHover: (isHovered: boolean) => void,
  onContextMenu: () => void,
  onToggleCollapse: () => void,
  onSelectBottom: () => void,
  onSelect: () => void,
};

class Node {
  _head: Object;
  _tail: Object;

  context: Object;
  props: PropsType;
  static contextTypes: Object;

  shouldComponentUpdate(nextProps: PropsType) {
    return nextProps !== this.props
  }

  componentDidMount() {
    if (this.props.selected) {
      this.ensureInView();
    }
  }

  componentDidUpdate() {
    if (this.props.selected) {
      this.ensureInView();
    }
  }

  ensureInView() {
    var node = this.props.isBottomTagSelected ? this._tail : this._head;
    if (!node) {
      return;
    }
    var domnode = React.findDOMNode(node)
    this.context.scrollTo(domnode.offsetTop, domnode.offsetHeight);
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

    if (null === node.get('name')) {
      var content = children || node.get('text');
      return (
        <div style={styles.container}>
          <div style={headStyles} ref={h => this._head = h} {...tagEvents}>
            <span style={styles.tagText}>
              <span style={styles.openTag}>
                "
              </span>
              <span style={styles.textContent}>{content}</span>
              <span style={styles.closeTag}>
                "
              </span>
            </span>
          </div>
        </div>
      );
    }

    var isCustom = node.get('nodeType') === 'Composite';

    var tagStyle = isCustom ? styles.customTagName : styles.tagName;

    // Single-line tag (collapsed / simple content / no content)
    if (!children || 'string' === typeof children || !children.length) {
      var name = node.get('name');
      var content = children || node.get('text');
      return (
        <div style={styles.container}>
          <div style={headStyles} ref={h => this._head = h} {...tagEvents}>
            <span style={styles.tagText}>
              <span style={styles.openTag}>
                <span style={tagStyle}>&lt;{name}</span>
                {/* $FlowFixMe doesn't need to inherit from React.Component */}
                {node.get('props') && <Props props={node.get('props')}/>}
                {!content && '/'}
                <span style={tagStyle}>&gt;</span>
              </span>
              {content && [
                <span key='content' style={styles.textContent}>{content}</span>,
                <span key='close' style={styles.closeTag}>
                  <span style={tagStyle}>&lt;/{name}&gt;</span>
                </span>
              ]}
            </span>
          </div>
        </div>
      );
    }

    // Plain string
    if ('string' === typeof children) {
      return <div style={leftPad}>{children}</div>;
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
            {/* $FlowFixMe doesn't need to inherit from React.Component */}
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
    var node = store.get(props.id)
    return {
      node,
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
    backgroundColor: '#ccc'
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
    backgroundColor: '#eee'
  },
};

module.exports = WrappedNode;
