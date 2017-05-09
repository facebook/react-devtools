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

var assign = require('object-assign');
var decorate = require('./decorate');

import type {Base16Theme} from './Themes/Base16Theme';

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
    if (!this.props.open) {
      return <div style={styles.hidden} />;
    }

    var theme = this.context.theme;
    var containerStyle = assign({}, styles.container, {
      top: this.props.pos.y + 'px',
      left: this.props.pos.x + 'px',
      backgroundColor: theme.base07,
    });
    var emptyStyle = assign({}, styles.empty, {
      color: theme.base03,
    });
    var itemStyle = {
      color: theme.base04,
    };

    return (
      <ul style={containerStyle}>
        {!this.props.items.length && <li style={emptyStyle}>No actions</li>}
        {this.props.items.map((item, i) => item && (
          <li style={itemStyle} key={item.key} onClick={evt => this.onClick(i, evt)}>
            <HighlightHover style={styles.item}>
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

var styles = {
  hidden: {
    display: 'none',
  },

  container: {
    position: 'fixed',
    listStyle: 'none',
    margin: 0,
    padding: '0.25rem 0',
    fontSize: 14,
    borderRadius: '0.25rem',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Ubuntu", "Helvetica Neue", sans-serif',
    zIndex: 1,
  },

  item: {
    padding: '0.25rem 0.5rem',
    cursor: 'default',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
  },

  empty: {
    padding: '0.25rem 0.5rem',
  },
};

module.exports = Wrapped;
