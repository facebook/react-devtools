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

  ensureInView() {
    var node = this.props.isBottomTagSelected ? this._tail : this._head;
    if (!node) {
      return;
    }
    this.context.scrollTo(node.offsetTop, node.offsetHeight);
  }

  render() {
    var node = this.props.node;
    if (!node) {
      return <span>Node was deleted</span>;
    }
    var children = node.get('children');

    if (node.get('nodeType') === 'Wrapper') {
      return (
        <div style={styles.wrappedNodeContainer}>
          {children.map(child =>
            <WrappedNode key={child} id={child} />
          )}
        </div>
      );
    }

    if (node.get('nodeType') === 'NativeWrapper') {
      children = this.props.wrappedChildren;
    }

    var collapsed = node.get('collapsed');

    var leftPad = {
      paddingLeft: 12,
    };

    var backgroundStyles = assign(
      {},
      styles.fill,
      this.props.hovered && styles.fillHover,
      this.props.selected && (collapsed || !this.props.isBottomTagSelected) && styles.fillSelect,
    );

    var containerStyles = assign(
      {},
      styles.container,
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
        <div style={containerStyles}>
          <div style={styles.head} ref={h => this._head = h} {...tagEvents}>
            {tag}
            <div style={backgroundStyles}></div>
          </div>
        </div>
      );
    }

    var isCustom = nodeType === 'Composite';

    var tagStyle = isCustom ? styles.customTagName : styles.tagName;
    var openTagStyle = isCustom ? styles.customOpenTag : styles.openTag;
    var closeTagStyle = isCustom ? styles.customCloseTag : styles.closeTag;

    // Single-line tag (collapsed / simple content / no content)
    if (!children || typeof children === 'string' || !children.length) {
      var name = node.get('name');
      var content = children;
      return (
        <div style={containerStyles}>
          <div style={styles.head} ref={h => this._head = h} {...tagEvents}>
            <span style={styles.tagText}>
              <span style={openTagStyle}>
                &lt;
                <span style={tagStyle}>{name}</span>
                {node.get('key') && <Props key="key" props={{'key': node.get('key')}}/>}
                {node.get('ref') && <Props key="ref" props={{'ref': node.get('ref')}}/>}
                {node.get('props') && <Props key="props" props={node.get('props')}/>}
                {!content && '/'}
                <span style={tagStyle}></span>
                &gt;
              </span>
              {content && [
                <span key="content" style={styles.textContent}>{content}</span>,
                <span key="close" style={closeTagStyle}>
                  &lt;
                  <span style={tagStyle}>/{name}</span>
                  &gt;
                </span>,
              ]}
            </span>
            <div style={backgroundStyles}></div>
          </div>
        </div>
      );
    }

    var closeTag = (
      <span style={closeTagStyle}>
         &lt;
        <span style={tagStyle}>
         /{'' + node.get('name')}
        </span>
        &gt;
      </span>
    );

    var hasState = !!node.get('state') || !!node.get('context');

    var arrowStyle = node.get('collapsed') ?
      assign(
        {},
        styles.collapsedArrow,
        hasState && styles.collapsedArrowStateful
      ) :
      assign(
        {},
        styles.expandedArrow,
        hasState && styles.expandedArrowStateful
      );

    var collapser =
      <div
        title={hasState ? 'This component is stateful.' : null}
        onClick={this.props.onToggleCollapse} style={styles.collapser}
      >
        <div style={arrowStyle}/>
      </div>;

    var head = (
      <div ref={h => this._head = h} style={styles.head} {...tagEvents}>
        {collapser}
        <span style={styles.tagText}>
          <span style={openTagStyle}>
            &lt;
            <span style={tagStyle}>{'' + node.get('name')}</span>
            {node.get('key') && <Props key="key" props={{'key': node.get('key')}}/>}
            {node.get('ref') && <Props key="ref" props={{'ref': node.get('ref')}}/>}
            {node.get('props') && <Props key="props" props={node.get('props')}/>}
            <span style={tagStyle}></span>
            &gt;
          </span>
          {collapsed && '…'}
          {collapsed && closeTag}
        </span>
        <div style={backgroundStyles}></div>
      </div>
    );
    if (collapsed) {
      return (
        <div style={containerStyles}>
          {head}
        </div>
      );
    }

    var tailBackgroundStyles = assign(
      {},
      styles.fill,
      this.props.hovered && styles.fillHover,
      this.props.selected && this.props.isBottomTagSelected && styles.fillSelect,
    );

    var guidelineStyles = assign(
      {},
      styles.guideline,
      this.props.selected && styles.selectedGuideline,
    );

    return (
      <div style={containerStyles}>
        {head}
        <div style={styles.children}>
          {children.map(id => <WrappedNode key={id} id={id}/>)}
        </div>
        <div ref={t => this._tail = t} style={styles.tail} {...tagEvents} onMouseDown={this.props.onSelectBottom}>
          {closeTag}
          <div style={tailBackgroundStyles}></div>
        </div>
        <div style={guidelineStyles}></div>
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
    position: 'relative',
  },

  wrappedNodeContainer: {
    flexGrow: 1,
  },

  children: {
  },

  textContent: {
  },

  falseyLiteral: {
    fontStyle: 'italic',
  },

  customCloseTag: {
    color: 'rgb(168, 148, 166)',
  },

  customOpenTag: {
    color: 'rgb(168, 148, 166)',
  },

  closeTag: {
    color: '#ccc',
  },

  guideline: {
    position: 'absolute',
    width: '1px',
    background: 'rgba(0,0,0,0.025)',
    top: '17px',
    left: '18px',
    bottom: '15px',
  },

  selectedGuideline: {
    background: '#a9c5ef',
  },

  head: {
    cursor: 'default',
    padding: '1px 0',
    borderTop: '1px solid #fff',
    position: 'relative',
    display: 'flex',
    zIndex: 0,
  },

  tail: {
    padding: '1px 0',
    borderTop: '1px solid #fff',
    cursor: 'default',
    position: 'relative',
    zIndex: 0,
  },

  tagName: {
    color: '#777',
  },

  customTagName: {
    color: 'rgb(136, 18, 128)',
  },

  openTag: {
    color: '#ccc',
  },

  tagText: {
    flex: 1,
    whiteSpace: 'nowrap',
  },

  headSelect: {
    backgroundColor: '#ccc',
  },

  collapser: {
    padding: 2,
    left: -12,
  },

  collapsedArrow: {
    borderColor: 'transparent transparent transparent rgb(110, 110, 110)',
    borderStyle: 'solid',
    borderWidth: '4px 0 4px 7px',
    marginLeft: 1,
  },
  collapsedArrowStateful: {
    borderColor: 'transparent transparent transparent #e55',
  },

  expandedArrow: {
    borderColor: '#555 transparent transparent transparent',
    borderStyle: 'solid',
    borderWidth: '7px 4px 0 4px',
    marginTop: 1,
  },
  expandedArrowStateful: {
    borderColor: '#e55 transparent transparent transparent',
  },

  headHover: {
    backgroundColor: '#eee',
  },

  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    marginLeft: '-1000px',
    right: '-3px',
    bottom: 0,
    pointerEvents: 'none',
    zIndex: -1,
  },

  fillHover: {
    background: '#eee',
  },

  fillSelect: {
    background: '#e1ebfb',
  },
};

module.exports = WrappedNode;
