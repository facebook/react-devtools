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

type StateType = {
  isWindowFocused: boolean,
};

class Node extends React.Component {
  _head: ?HTMLElement;
  _tail: ?HTMLElement;
  _ownerWindow: any;

  context: Object;
  props: PropsType;
  state: StateType = {
    isWindowFocused: true,
  };

  static contextTypes: Object;

  shouldComponentUpdate(nextProps: PropsType, nextState: StateType) {
    return (
      nextProps !== this.props ||
      nextState.isWindowFocused !== this.state.isWindowFocused
    );
  }

  componentDidMount() {
    if (this.props.selected) {
      this.ensureInView();
      // This is done lazily so we only have one subscription at a time at most.
      // We'll unsubscribe and resubscribe depending on props.selected in componentDidUpdate().
      this.subscribeToWindowFocus();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.selected && !prevProps.selected) {
      // Gaining selection.
      this.ensureInView();
      this.subscribeToWindowFocus();
    } else if (!this.props.selected && prevProps.selected) {
      // Losing selection.
      this.unsubscribeFromWindowFocus();
    }
  }

  componentWillUnmount() {
    if (this.props.selected) {
      this.unsubscribeFromWindowFocus();
    }
    this._ownerWindow = null;
  }

  findOwnerWindow() {
    if (!this._head) {
      return null;
    }
    var doc = this._head.ownerDocument;
    if (!doc) {
      return null;
    }
    var win = doc.defaultView;
    if (!win) {
      return null;
    }
    return win;
  }

  subscribeToWindowFocus() {
    if (!this._ownerWindow) {
      // Lazily find the window first time we subscribed.
      this._ownerWindow = this.findOwnerWindow();
      if (!this._ownerWindow) {
        return;
      }
    }
    var win = this._ownerWindow;
    win.addEventListener('focus', this._handleWindowFocus);
    win.addEventListener('blur', this._handleWindowBlur);
    // Make sure our initial state is right.
    if (this.props.selected) {
      this.setState({
        isWindowFocused: win.document.hasFocus(),
      });
    }
  }

  unsubscribeFromWindowFocus() {
    if (!this._ownerWindow) {
      return;
    }
    var win = this._ownerWindow;
    win.removeEventListener('focus', this._handleWindowFocus);
    win.removeEventListener('blur', this._handleWindowBlur);
  }

  _handleWindowFocus = () => {
    // We're coming from a global window event handler so React
    // hasn't processed the events yet. We likely have a click
    // selecting another node, which would cause flicker if we update
    // right now. So instead we wait just enough for UI to process
    // events and update the selected note. (I know it's not pretty.)
    setTimeout(() => {
      if (!this._ownerWindow) {
        return;
      }
      var doc = this._ownerWindow.document;
      this.setState({isWindowFocused: doc.hasFocus()});
    }, 50);
  };

  _handleWindowBlur = () => {
    this.setState({isWindowFocused: false});
  };

  ensureInView() {
    var node = this.props.isBottomTagSelected ? this._tail : this._head;
    if (!node) {
      return;
    }
    this.context.scrollTo(node);
  }

  render() {
    var node = this.props.node;
    if (!node) {
      return <span>Node was deleted</span>;
    }
    var children = node.get('children');

    if (node.get('nodeType') === 'Wrapper') {
      return (
        <span>
          {children.map(child =>
            <WrappedNode key={child} id={child} depth={this.props.depth}/>
          )}
        </span>
      );
    }

    if (node.get('nodeType') === 'NativeWrapper') {
      children = this.props.wrappedChildren;
    }

    var collapsed = node.get('collapsed');
    var selected = this.props.selected;
    var isWindowFocused = this.state.isWindowFocused;
    var inverted = selected && isWindowFocused;

    var leftPad = {
      paddingLeft: 5 + (this.props.depth + 1) * 10,
      paddingRight: 5,
    };

    var headSelectStyle = assign(
      {},
      styles.headSelect,
      isWindowFocused ? styles.headSelectInverted : styles.headSelectInactive
    );

    var headStyles = assign(
      {},
      styles.head,
      this.props.hovered && styles.headHover,
      selected && (collapsed || !this.props.isBottomTagSelected) && headSelectStyle,
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
      const tagTextStyle = assign(
        {},
        styles.tagText,
        inverted && styles.tagTextInverted
      );
      var tag;
      if (nodeType === 'Text') {
        var text = node.get('text');
        tag =
          <span style={tagTextStyle}>
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
          <span style={tagTextStyle}>
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

    var topTagStyle = inverted && !this.props.isBottomTagSelected ?
      styles.invertedTagName :
      (isCustom ? styles.customTagName : styles.tagName);
    var bottomTagStyle = inverted && this.props.isBottomTagSelected ?
      styles.invertedTagName :
      (isCustom ? styles.customTagName : styles.tagName);
    var topTagTextStyle = assign(
      {},
      styles.tagText,
      inverted && !this.props.isBottomTagSelected && styles.tagTextInverted
    );

    // Single-line tag (collapsed / simple content / no content)
    if (!children || typeof children === 'string' || !children.length) {
      var name = node.get('name');
      var content = children;
      var isCollapsed = content === null || content === undefined;
      return (
        <div style={styles.container}>
          <div style={headStyles} ref={h => this._head = h} {...tagEvents}>
            <span style={topTagTextStyle}>
              <span style={styles.openTag}>
                <span style={topTagStyle}>&lt;{name}</span>
                {node.get('key') &&
                  <Props key="key" props={{'key': node.get('key')}} inverted={inverted}/>
                }
                {node.get('ref') &&
                  <Props key="ref" props={{'ref': node.get('ref')}} inverted={inverted}/>
                }
                {node.get('props') &&
                  <Props key="props" props={node.get('props')} inverted={inverted}/>
                }
                {isCollapsed && <span style={topTagStyle}> /</span>}
                <span style={topTagStyle}>&gt;</span>
              </span>
              {!isCollapsed && [
                <span key="content" style={styles.textContent}>
                  {content}
                </span>,
                <span key="close" style={styles.closeTag}>
                  <span style={topTagStyle}>&lt;/{name}&gt;</span>
                </span>,
              ]}
            </span>
          </div>
        </div>
      );
    }

    var closeTag = (
      <span style={styles.closeTag}>
        <span style={collapsed ? topTagStyle : bottomTagStyle}>
          &lt;/{'' + node.get('name')}&gt;
        </span>
      </span>
    );

    var hasState = !!node.get('state') || !!node.get('context');

    var collapserStyle = assign(
      {},
      styles.collapser,
      {left: leftPad.paddingLeft - 12},
    );
    var headInverted = inverted && !this.props.isBottomTagSelected;
    var arrowStyle = node.get('collapsed') ?
      assign(
        {},
        styles.collapsedArrow,
        hasState && styles.collapsedArrowStateful,
        headInverted && styles.collapsedArrowInverted
      ) :
      assign(
        {},
        styles.expandedArrow,
        hasState && styles.expandedArrowStateful,
        headInverted && styles.expandedArrowInverted
      );

    var collapser =
      <span
        title={hasState ? 'This component is stateful.' : null}
        onClick={this.props.onToggleCollapse} style={collapserStyle}
      >
        <span style={arrowStyle}/>
      </span>;

    var head = (
      <div ref={h => this._head = h} style={headStyles} {...tagEvents}>
        {collapser}
        <span style={topTagTextStyle}>
          <span style={styles.openTag}>
            <span style={topTagStyle}>&lt;{'' + node.get('name')}</span>
            {node.get('key') &&
              <Props key="key" props={{'key': node.get('key')}} inverted={headInverted}/>
            }
            {node.get('ref') &&
              <Props key="ref" props={{'ref': node.get('ref')}} inverted={headInverted}/>
            }
            {node.get('props') &&
              <Props key="props" props={node.get('props')} inverted={headInverted}/>
            }
            <span style={topTagStyle}>&gt;</span>
          </span>
          {collapsed && <span style={styles.textContent}>…</span>}
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
      selected && this.props.isBottomTagSelected && headSelectStyle,
      leftPad
    );

    var guidelineStyle = assign(
      {
        left: leftPad.paddingLeft - 7,
      },
      styles.guideline,
      this.props.hovered && styles.guidelineHover,
      selected && styles.guidelineSelect,
    );

    return (
      <div style={styles.container}>
        {head}
        <div style={styles.children}>
          {children.map(id => <WrappedNode key={id} depth={this.props.depth + 1} id={id}/>)}
        </div>
        <div ref={t => this._tail = t} style={tailStyles} {...tagEvents} onMouseDown={this.props.onSelectBottom}>
          {closeTag}
        </div>
        <div style={guidelineStyle} />
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
  container: {
    flexShrink: 0,
    position: 'relative',
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
    cursor: 'default',
    borderTop: '1px solid #fff',
    position: 'relative',
    display: 'flex',
  },
  headHover: {
    backgroundColor: '#ebf2fb',
    borderRadius: 20,
  },
  headSelect: {
    // Bring it in front of the hover guideline on parents.
    zIndex: 1,
    borderRadius: 0,
  },
  headSelectInverted: {
    backgroundColor: 'rgb(56, 121, 217)',
  },
  headSelectInactive: {
    backgroundColor: 'rgb(218, 218, 218)',
  },

  tail: {
    borderTop: '1px solid #fff',
    cursor: 'default',
  },

  tagName: {
    color: '#777',
  },
  customTagName: {
    color: 'rgb(136, 18, 128)',
  },
  invertedTagName: {
    color: 'white',
  },

  openTag: {
  },

  tagText: {
    flex: 1,
    whiteSpace: 'nowrap',
  },
  tagTextInverted: {
    color: 'white',
  },

  collapser: {
    position: 'absolute',
    padding: 2,
  },

  collapsedArrow: {
    borderColor: 'transparent transparent transparent rgb(110, 110, 110)',
    borderStyle: 'solid',
    borderWidth: '4px 0 4px 7px',
    display: 'inline-block',
    marginLeft: 1,
    verticalAlign: 'top',
  },
  collapsedArrowStateful: {
    borderColor: 'transparent transparent transparent #e55',
  },
  collapsedArrowInverted: {
    borderColor: 'transparent transparent transparent white',
  },

  expandedArrow: {
    borderColor: '#555 transparent transparent transparent',
    borderStyle: 'solid',
    borderWidth: '7px 4px 0 4px',
    display: 'inline-block',
    marginTop: 1,
    verticalAlign: 'top',
  },
  expandedArrowStateful: {
    borderColor: '#e55 transparent transparent transparent',
  },
  expandedArrowInverted: {
    borderColor: 'white transparent transparent transparent',
  },

  guideline: {
    position: 'absolute',
    width: '1px',
    backgroundColor: 'rgb(230, 230, 230)',
    top: 16,
    bottom: 0,
    opacity: 0,
    willChange: 'opacity',
  },
  guidelineHover: {
    opacity: 1,
  },
  guidelineSelect: {
    backgroundColor: '#a9c5ef',
    opacity: 1,
  }

};

module.exports = WrappedNode;
