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

const PropTypes = require('prop-types');
const React = require('react');
const nullthrows = require('nullthrows').default;

const decorate = require('./decorate');
const Props = require('./Props');
const {monospace} = require('./Themes/Fonts');
const {getInvertedWeak, hexToRgba} = require('./Themes/utils');

import type {Map} from 'immutable';
import type {Theme} from './types';

const {Fragment} = React;

type PropsType = {
  hovered: boolean,
  selected: boolean,
  showCopyableInput: boolean,
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
  onShowCopyableInput: () => void,
};

type StateType = {
  isWindowFocused: boolean,
};

class Node extends React.Component<PropsType, StateType> {
  _head: ?HTMLElement;
  _tail: ?HTMLElement;
  _ownerWindow: any;

  context: {
    scrollTo: (node: HTMLElement) => void,
    theme: Theme,
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

    if (this.props.showCopyableInput && this._head instanceof HTMLInputElement) {
      this._head.select();
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
    if (node != null) {
      if (typeof node.scrollIntoViewIfNeeded === 'function') {
        node.scrollIntoViewIfNeeded();
      } else if (typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({
          // $FlowFixMe Flow does not realize block:"nearest" is a valid option
          block: 'nearest',
          inline: 'start',
        });
      }
    }
  }

  _setTailRef = tail => {
    this._tail = tail;
  };
  _setHeadRef = head => {
    this._head = head;
  };

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
      onShowCopyableInput,
      searchRegExp,
      selected,
      showCopyableInput,
      wrappedChildren,
    } = this.props;
    const {isWindowFocused} = this.state;

    if (!node) {
      return 'Node was deleted';
    }

    let children = node.get('children');

    if (node.get('nodeType') === 'Wrapper') {
      return children.map(child =>
        <WrappedNode key={child} id={child} depth={depth}/>
      );
    }

    if (node.get('nodeType') === 'NativeWrapper') {
      children = wrappedChildren;
    }

    const collapsed = node.get('collapsed');
    const inverted = selected && isWindowFocused;

    const headWrapperStyle = wrapperStyle(depth, inverted && !isBottomTagSelected, theme);

    const sharedHeadStyle = headStyle({
      depth,
      isBottomTagHovered,
      isBottomTagSelected,
      isCollapsed: collapsed,
      isHovered: hovered,
      isSelected: selected,
      isWindowFocused,
      theme,
    });

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

    const onNameDoubleClick = e => {
      if (!collapsed) {
        e.stopPropagation();
      }
      onShowCopyableInput();
    };

    const nodeType = node.get('nodeType');
    if (nodeType === 'Text' || nodeType === 'Empty') {
      let tag;
      if (nodeType === 'Text') {
        const text = node.get('text');
        tag =
          <span style={tagTextStyle(inverted, theme)}>
            "{text}"
          </span>;
      } else if (nodeType === 'Empty') {
        tag =
          <span style={tagTextStyle(inverted, theme)}>
            <span style={styles.falseyLiteral}>null</span>
          </span>;
      }
      return (
        <div
          ref={this._setHeadRef}
          style={sharedHeadStyle}
          {...headEvents}
        >
          {tag}
        </div>
      );
    }

    let name = node.get('name') + '';

    const nameString = name;

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
          <span key={pieces.length} style={highlightStyle(theme)}>{nullthrows(matched).shift()}</span>
        );
        pieces.push(
          <span key={pieces.length}>{unmatched.shift()}</span>
        );
      }

      name = pieces;
    }

    const dollarRStyle = {
      color: isWindowFocused ? getInvertedWeak(theme.state02) : 'inherit',
    };

    // Single-line tag (collapsed / simple content / no content)
    if (!children || typeof children === 'string' || !children.length) {
      const jsxSingleLineTagStyle = jsxTagStyle(inverted, nodeType, theme);
      const content = children;
      const isCollapsed = content === null || content === undefined;
      return (
        <div style={headWrapperStyle}>
          <div style={sharedHeadStyle} {...headEvents}>
            &lt;
            {showCopyableInput ? 
              <input ref={this._setHeadRef} defaultValue={nameString} readOnly="readonly" size={nameString.length} style={copyableElementName} />
              : <span ref={this._setHeadRef} style={jsxSingleLineTagStyle} onDoubleClick={onNameDoubleClick}>{name}</span>
            }
            {node.get('key') &&
              <Props key="key" props={{'key': node.get('key')}} inverted={inverted}/>
            }
            {node.get('props') &&
              <Props key="props" props={node.get('props')} inverted={inverted}/>
            }
            {isCollapsed ? ' />' : '>'}
            {!isCollapsed && [
              <Fragment key="content">
                {content}
              </Fragment>,
              <span key="close">
                &lt;/
                <span style={jsxSingleLineTagStyle}>{name}</span>
                &gt;
              </span>,
            ]}
            {selected && <span style={dollarRStyle}>&nbsp;== $r</span>}
          </div>
        </div>
      );
    }

    const jsxCloseTagStyle = jsxTagStyle(inverted && (isBottomTagSelected || collapsed), nodeType, theme);
    const closeTag = (
      <Fragment>
        &lt;/
        <span ref={this._setTailRef} style={jsxCloseTagStyle}>{name}</span>
        &gt;
        {selected && ((collapsed && !this.props.isBottomTagSelected) || this.props.isBottomTagSelected) &&
          <span style={dollarRStyle}>&nbsp;== $r</span>
        }
      </Fragment>
    );

    const headInverted = inverted && (!isBottomTagSelected || collapsed);

    const jsxOpenTagStyle = jsxTagStyle(inverted && (!isBottomTagSelected || collapsed), nodeType, theme);
    const head = (
      <div style={sharedHeadStyle} {...headEvents}>
        <span
          onClick={onToggleCollapse}
          style={{
            width: '1rem',
            textAlign: 'center',
            marginLeft: '-1rem',
          }}
        >
          {collapsed ? '▶' : '▼'}
        </span>
        &lt;
        {showCopyableInput ? 
          <input ref={this._setHeadRef} defaultValue={nameString} readOnly="readonly" size={nameString.length} style={copyableElementName} />
          : <span ref={this._setHeadRef} style={jsxOpenTagStyle} onDoubleClick={onNameDoubleClick}>{name}</span>
        }

        {node.get('key') &&
          <Props key="key" props={{'key': node.get('key')}} inverted={headInverted}/>
        }
        {node.get('props') &&
          <Props key="props" props={node.get('props')} inverted={headInverted}/>
        }
        &gt;
        {selected && !collapsed && !this.props.isBottomTagSelected &&
          <span style={dollarRStyle}>&nbsp;== $r</span>
        }
        {collapsed && '…'}
        {collapsed && closeTag}
      </div>
    );

    if (collapsed) {
      return head;
    }

    const tailStyleActual = tailStyle({
      depth,
      isBottomTagHovered,
      isBottomTagSelected,
      isHovered: hovered,
      isSelected: selected,
      isWindowFocused,
      theme,
    });

    return (
      <div style={headWrapperStyle}>
        {head}
        <div style={guidelineStyle(depth, selected, hovered, isBottomTagHovered, theme)} />
        <div style={{
          paddingLeft: '1rem',
          color: theme.special07,

          // Ensure children wrap correctly and viewport boundary for narrow trees,
          // But expand to fill the available width for deep trees.
          display: 'inline-flex',
          flexDirection: 'column',
          minWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {children.map(id => <WrappedNode key={id} depth={depth + 1} id={id}/>)}
        </div>
        <div style={tailStyleActual} {...tailEvents}>
          {closeTag}
        </div>
      </div>
    );
  }
}

Node.contextTypes = {
  scrollTo: PropTypes.func,
  theme: PropTypes.object.isRequired,
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
      showCopyableInput: store.showCopyableInput === props.id,
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
      onShowCopyableInput: () => {
        store.setShowCopyableInput(props.id);
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

const paddingRight = 5;

type headStyleParams = {
  depth: number,
  isBottomTagHovered: boolean,
  isBottomTagSelected: boolean,
  isCollapsed: boolean,
  isHovered: boolean,
  isSelected: boolean,
  isWindowFocused: boolean,
  theme: Theme
};

const headStyle = ({
  depth,
  isBottomTagHovered,
  isBottomTagSelected,
  isCollapsed,
  isHovered,
  isSelected,
  isWindowFocused,
  theme,
}: headStyleParams) => {
  let backgroundColor;
  if (isSelected && (isCollapsed || !isBottomTagSelected)) {
    backgroundColor = isWindowFocused
      ? theme.state00
      : theme.state01;
  } else if (isHovered && (isCollapsed || !isBottomTagHovered)) {
    backgroundColor = theme.state03;
  }

  const isInverted = isSelected && isWindowFocused && (isCollapsed || !isBottomTagSelected);
  const color = isInverted ? theme.state02 : undefined;

  return {
    cursor: 'default',
    position: 'relative',
    display: 'flex',
    flexShrink: 0,
    flexWrap: 'wrap',
    borderRadius: '0.125rem',
    paddingLeft: '1rem',
    paddingRight,
    backgroundColor,
    color,
  };
};

const copyableElementName = {
  border: 'none',
  boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)',
  fontFamily: monospace.family,
};

const jsxTagStyle = (inverted: boolean, nodeType: string, theme: Theme) => {
  let color;
  if (inverted) {
    color = theme.state02;
  } else if (nodeType === 'Special') {
    color = theme.special01;
  } else if (nodeType === 'Composite') {
    color = theme.special00;
  } else {
    color = theme.special07;
  }

  return {
    color,
  };
};

const tagTextStyle = (inverted: boolean, theme: Theme) => ({
  flex: 1,
  color: inverted ? getInvertedWeak(theme.state02) : theme.special06,
});

const wrapperStyle = (depth: number, inverted: boolean, theme: Theme) => ({
  position: 'relative',
  color: inverted ? getInvertedWeak(theme.state02) : theme.special07,
});

const highlightStyle = (theme: Theme) => ({
  backgroundColor: theme.state04,
  color: theme.state05,
});

type tailStyleParams = {
  depth: number,
  isBottomTagHovered: boolean,
  isBottomTagSelected: boolean,
  isHovered: boolean,
  isSelected: boolean,
  isWindowFocused: boolean,
  theme: Theme
};

const tailStyle = ({
  depth,
  isBottomTagHovered,
  isBottomTagSelected,
  isHovered,
  isSelected,
  isWindowFocused,
  theme,
}: tailStyleParams) => {
  let backgroundColor;
  if (isSelected && isBottomTagSelected) {
    backgroundColor = isWindowFocused
      ? theme.state00
      : theme.state01;
  } else if (isHovered && isBottomTagHovered) {
    backgroundColor = theme.state03;
  }

  const isInverted = isSelected && isWindowFocused && isBottomTagSelected;
  const color = isInverted ? theme.state02 : theme.base04;

  return {
    cursor: 'default',
    paddingLeft: '1rem',
    paddingRight,
    backgroundColor,
    color,
  };
};

const guidelineStyle = (depth: number, isSelected: boolean, isHovered: boolean, isBottomTagHovered: boolean, theme: Theme) => {
  let borderLeftColor = 'transparent';
  if (isSelected) {
    borderLeftColor = hexToRgba(theme.state00, 0.45);
  } else if (isHovered && !isBottomTagHovered) {
    // Only show hover for the top tag, or it gets too noisy.
    borderLeftColor = hexToRgba(theme.base04, 0.2);
  }

  return {
    position: 'absolute',
    width: '1px',
    borderLeft: `1px solid ${borderLeftColor}`,
    top: '1rem',
    bottom: 0,
    left: '0.5rem',
    // Bring it in front of the hovered children, but make sure
    // hovering over parents doesn't draw on top of selected
    // guideline even when we've selected the closing tag.
    // When unsure, refer to how Chrome does it (it's subtle!)
    zIndex: isSelected ? 1 : 0,
  };
};

// Static styles
const styles = {
  falseyLiteral: {
    fontStyle: 'italic',
  },
};

module.exports = WrappedNode;
