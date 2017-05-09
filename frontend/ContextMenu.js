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
var ReactDOM = require('react-dom');
var HighlightHover = require('./HighlightHover');

var decorate = require('./decorate');

import type {Base16Theme} from './Themes/Themes';

export type MenuItem = {
  key: string,
  title: string,
  action: () => void
};

class ContextMenu extends React.Component {
  _clickout: (evt: Object) => void;

  context: {
    theme: Base16Theme,
  };

  props: {
    open: boolean,
    hideContextMenu: () => void,
    items: Array<MenuItem>,
    pos: {
      x: number,
      y: number,
    },
  };

  componentWillMount() {
    this._clickout = this.onMouseDown.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      window.addEventListener('mousedown', this._clickout, true);
    } else if (prevProps.open && !this.props.open) {
      window.removeEventListener('mousedown', this._clickout, true);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this._clickout, true);
  }

  onMouseDown(evt) {
    var n = evt.target;
    var container = ReactDOM.findDOMNode(this);
    while (n) {
      if (n === container) {
        return;
      }
      n = n.offsetParent;
    }

    evt.preventDefault();
    this.props.hideContextMenu();
  }

  onClick(i, evt) {
    evt.preventDefault();
    this.props.items[i].action();
    this.props.hideContextMenu();
  }

  render() {
    const {theme} = this.context;
    const {items, open, pos} = this.props;

    if (!open) {
      return <div style={styles.hidden} />;
    }

    return (
      <ul style={containerStyle(pos.x, pos.y, theme)}>
        {!items.length && (
          <li style={emptyStyle(theme)}>No actions</li>
        )}
        {items.map((item, i) => item && (
          <li style={listItemStyle(theme)} key={item.key} onClick={evt => this.onClick(i, evt)}>
            <HighlightHover style={styles.highlightHoverItem}>
              {item.title}
            </HighlightHover>
          </li>
        ))}
      </ul>
    );
  }
}

ContextMenu.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

var Wrapped = decorate({
  listeners() {
    return ['contextMenu'];
  },
  props(store, props) {
    if (!store.contextMenu) {
      return {open: false};
    }
    var {x, y, type, args} = store.contextMenu;

    var items = [];
    args.push(store);

    props.itemSources.forEach(source => {
      if (!source || !source[type]) {
        return;
      }
      var newItems = source[type](...args);
      if (newItems) {
        items = items.concat(newItems.filter(v => !!v));
      }
    });

    return {
      open: true,
      pos: {x, y},
      hideContextMenu: () => store.hideContextMenu(),
      items,
    };
  },
}, ContextMenu);


const containerStyle = (xPos: number, yPos: number, theme: Base16Theme) => ({
  top: `${yPos}px`,
  left: `${xPos}px`,
  position: 'fixed',
  listStyle: 'none',
  margin: 0,
  padding: '0.25rem 0',
  fontSize: 14,
  borderRadius: '0.25rem',
  overflow: 'hidden',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Ubuntu", "Helvetica Neue", sans-serif',
  zIndex: 1,
  backgroundColor: theme.base01,
});

const emptyStyle = (theme: Base16Theme) => ({
  padding: '0.25rem 0.5rem',
  color: theme.base03,
});

const listItemStyle = (theme: Base16Theme) => ({
  color: theme.base05,
});

var styles = {
  hidden: {
    display: 'none',
  },

  highlightHoverItem: {
    padding: '0.25rem 0.5rem',
    cursor: 'default',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
  },
};

module.exports = Wrapped;
