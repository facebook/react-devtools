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

var decorate = require('./decorate');
var Props = require('./Props');

import type {Map} from 'immutable';
import type {Base16Theme} from './Themes/Themes';

type PropsType = {
  hovered: boolean,
  selected: boolean,
  node: Map,
  depth: number,
  isBottomTagHovered: boolean,
  isBottomTagSelected: boolean,
  searchRegExp: ?RegExp,
  wrappedChildren: ?Array<any>,
  onHover: (isHovered: boolean) => void,
  onHoverBottom: (isHovered: boolean) => void,
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

  context: {
    scrollTo: (node: HTMLElement) => void,
    theme: Base16Theme,
  };
  props: PropsType;
  state: StateType = {
    isWindowFocused: true,
  };

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
    const {theme} = this.context;
    const {
      depth,
      hovered, 
      isBottomTagHovered,
      isBottomTagSelected,
      node,
      onContextMenu,
      onHover,
      onHoverBottom,
      onSelect,
      onSelectBottom,
      onToggleCollapse,
      searchRegExp,
      selected,
      wrappedChildren,
    } = this.props;
    const {isWindowFocused} = this.state;

    if (!node) {
      return <span>Node was deleted</span>;
    }

    let children = node.get('children');

    if (node.get('nodeType') === 'Wrapper') {
      return (
        <span>
          {children.map(child =>
            <WrappedNode key={child} id={child} depth={depth}/>
          )}
        </span>
      );
    }

    if (node.get('nodeType') === 'NativeWrapper') {
      children = wrappedChildren;
    }

    const collapsed = node.get('collapsed');
    const inverted = selected && isWindowFocused;

    const sharedHeadStyle = headStyle(depth, hovered, selected, theme);

    const headEvents = {
      onContextMenu: onContextMenu,
      onDoubleClick: onToggleCollapse,
      onMouseOver: () => onHover(true),
      onMouseOut: () => onHover(false),
      onMouseDown: onSelect,
    };
    const tailEvents = {
      onContextMenu: onContextMenu,
      onDoubleClick: onToggleCollapse,
      onMouseOver: () => onHoverBottom(true),
      onMouseOut: () => onHoverBottom(false),
      onMouseDown: onSelectBottom,
    };

    const nodeType = node.get('nodeType');
    if (nodeType === 'Text' || nodeType === 'Empty') {
      let tag;
      if (nodeType === 'Text') {
        const text = node.get('text');
        tag =
          <span style={tagTextStyle(theme)}>
            "{text}"
          </span>;
      } else if (nodeType === 'Empty') {
        tag =
          <span style={tagTextStyle(theme)}>
            <span style={styles.falseyLiteral}>null</span>
          </span>;
      }
      return (
        <div style={styles.container}>
          <div
            ref={h => this._head = h}
            style={sharedHeadStyle}
            {...headEvents}
          >
            {tag}
          </div>
        </div>
      );
    }

    // TODO (bvaughn) Was this dropped? Is it important?
    // var isCustom = nodeType === 'Composite';

    let name = node.get('name') + '';

    // If the user's filtering then highlight search terms in the tag name.
    // This will serve as a visual reminder that the visible tree is filtered.
    if (searchRegExp) {
      const unmatched = name.split(searchRegExp);
      const matched = name.match(searchRegExp);
      const pieces = [
        <span key={0}>{unmatched.shift()}</span>,
      ];
      while (unmatched.length > 0) {
        pieces.push(
          <span key={pieces.length} style={highlightStyle(theme)}>{matched.shift()}</span> // TODO (bvaughn) Search highlight
        );
        pieces.push(
          <span key={pieces.length}>{unmatched.shift()}</span>
        );
      }

      name = <span>{pieces}</span>;
    }

    const sharedJSXTagStyle = jsxTagStyle(theme);

    // Single-line tag (collapsed / simple content / no content)
    if (!children || typeof children === 'string' || !children.length) {
      const content = children;
      const isCollapsed = content === null || content === undefined;
      return (
        <div style={styles.container}>
          <div style={sharedHeadStyle} ref={h => this._head = h} {...headEvents}>
            <span>
              <span>
                <span>&lt;</span>
                <span style={sharedJSXTagStyle}>{name}</span>
                {node.get('key') &&
                  <Props key="key" props={{'key': node.get('key')}} inverted={inverted}/>
                }
                {node.get('ref') &&
                  <Props key="ref" props={{'ref': node.get('ref')}} inverted={inverted}/>
                }
                {node.get('props') &&
                  <Props key="props" props={node.get('props')} inverted={inverted}/>
                }
                <span>{isCollapsed ? ' />' : '>'}</span>
              </span>
              {!isCollapsed && [
                <span key="content">
                  {content}
                </span>,
                <span key="close">
                  <span>&lt;</span>
                  <span style={sharedJSXTagStyle}>{name}</span>
                  <span>&gt;</span>
                </span>,
              ]}
            </span>
          </div>
        </div>
      );
    }

    const closeTag = (
      <span>
        <span>&lt;/</span>
        <span style={sharedJSXTagStyle}>{name}</span>
        <span>&gt;</span>
      </span>
    );

    const hasState = !!node.get('state') || !!node.get('context');
    const headInverted = inverted && !isBottomTagSelected;

    const collapser =
      <span
        title={hasState ? 'This component is stateful.' : null}
        onClick={onToggleCollapse} style={collapserStyle(depth)}
      >
        <span style={arrowStyle(collapsed, hasState, headInverted, theme)}/>
      </span>;

    const head = (
      <div ref={h => this._head = h} style={sharedHeadStyle} {...headEvents}>
        {collapser}
        <span>
          <span>&lt;</span>
          <span style={sharedJSXTagStyle}>{name}</span>
          {node.get('key') &&
            <Props key="key" props={{'key': node.get('key')}} inverted={headInverted}/>
          }
          {node.get('ref') &&
            <Props key="ref" props={{'ref': node.get('ref')}} inverted={headInverted}/>
          }
          {node.get('props') &&
            <Props key="props" props={node.get('props')} inverted={headInverted}/>
          }
          <span>&gt;</span>
        </span>
        {collapsed && <span>…</span>}
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

    const isTailHovered = hovered && isBottomTagHovered;
    const isTailSelected = selected && isBottomTagSelected;

    return (
      <div style={styles.container}>
        {head}
        <div style={guidelineStyle(depth, selected, hovered, isBottomTagHovered, theme)} />
        <div>
          {children.map(id => <WrappedNode key={id} depth={depth + 1} id={id}/>)}
        </div>
        <div ref={t => this._tail = t} style={tailStyle(depth, isTailHovered, isTailSelected, theme)} {...tailEvents}>
          {closeTag}
        </div>
      </div>
    );
  }
}

Node.contextTypes = {
  scrollTo: React.PropTypes.func,
  theme: React.PropTypes.object.isRequired,
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
      isBottomTagHovered: store.isBottomTagHovered,
      hovered: store.hovered === props.id,
      searchRegExp: props.searchRegExp,
      onToggleCollapse: e => {
        e.preventDefault();
        store.toggleCollapse(props.id);
      },
      onHover: isHovered => store.setHover(props.id, isHovered, false),
      onHoverBottom: isHovered => store.setHover(props.id, isHovered, true),
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
    return (
      nextProps.id !== prevProps.id ||
      nextProps.searchRegExp !== prevProps.searchRegExp
    );
  },
}, Node);

const calcPaddingLeft = (depth: number) => 5 + (depth + 1) * 10;
const paddingRight = 5;

const headStyle = (depth: number, isHovered: boolean, isSelected: boolean, theme: Base16Theme) => ({
  cursor: 'default',
  borderTop: '1px solid transparent',
  position: 'relative',
  display: 'flex',
  paddingLeft: calcPaddingLeft(depth),
  paddingRight,
  backgroundColor: isHovered ? theme.base01 : isSelected ? theme.base02 : 'transparent',
});

const jsxTagStyle = (theme: Base16Theme) => ({
  color: theme.base08,
});

const tagTextStyle = (theme: Base16Theme) => ({
  flex: 1,
  whiteSpace: 'nowrap',
  color: theme.base0F,
});

const collapserStyle = (depth: number) => ({
  position: 'absolute',
  padding: 2,
  left: calcPaddingLeft(depth) - 12,
});

const arrowStyle = (isCollapsed: boolean, hasState: boolean, isHeadInverted: boolean, theme: Base16Theme) => {
  let borderColor = theme.base03;
  if (hasState) {
    borderColor = theme.base08;
  } else if (isHeadInverted) {
    borderColor = theme.base05;
  }

  if (isCollapsed) {
    return {
      borderStyle: 'solid',
      borderWidth: '4px 0 4px 7px',
      borderColor: `transparent transparent transparent ${borderColor}`,
      display: 'inline-block',
      marginLeft: 1,
      verticalAlign: 'top',
    };
  } else {
    return {
      borderStyle: 'solid',
      borderWidth: '7px 4px 0 4px',
      borderColor: `${borderColor} transparent transparent transparent`,
      display: 'inline-block',
      marginTop: 1,
      verticalAlign: 'top',
    };
  }
};

const highlightStyle = (theme: Base16Theme) => ({
  backgroundColor: theme.base02,
});

const tailStyle = (depth: number, isTailHovered: boolean, isTailSelected: boolean, theme: Base16Theme) => ({
  borderTop: '1px solid transparent',
  cursor: 'default',
  paddingLeft: calcPaddingLeft(depth),
  paddingRight,
  backgroundColor: isTailHovered ? theme.base01 : isTailSelected ? theme.base02 : 'transparent',
});

const guidelineStyle = (depth: number, isSelected: boolean, isHovered: boolean, isBottomTagHovered: boolean, theme: Base16Theme) => {
  let borderLeftColor = 'transparent';
  if (isHovered && !isBottomTagHovered) {
    // Only show hover for the top tag, or it gets too noisy.
    borderLeftColor = theme.base03;
  } else if (isSelected) {
    borderLeftColor = theme.base02;
  }

  return {
    position: 'absolute',
    width: '1px',
    borderLeftStyle: 'dotted',
    borderLeftWidth: '1px',
    borderLeftColor,
    top: 16,
    bottom: 0,
    willChange: 'opacity',
    left: calcPaddingLeft(depth) - 7,
    // Bring it in front of the hovered children, but make sure
    // hovering over parents doesn't draw on top of selected
    // guideline even when we've selected the closing tag.
    // When unsure, refer to how Chrome does it (it's subtle!)
    zIndex: isSelected ? 1 : 0,
  };
};

// Static styles
const styles = {
  container: {
    flexShrink: 0,
    position: 'relative',
  },
  falseyLiteral: {
    fontStyle: 'italic',
  },
  headHover: {
    borderRadius: 20,
  },
  headSelect: {
    borderRadius: 0,
  },
};

module.exports = WrappedNode;
