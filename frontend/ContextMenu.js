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
var HighlightHover = require('./HighlightHover');

var assign = require('object-assign');
var decorate = require('./decorate');

export type MenuItem = {
  key: string,
  title: string,
  action: () => void
};

class ContextMenu extends React.Component {
  _clickout: (evt: Object) => void;

  props: {
    open: boolean,
    hideContextMenu: () => void,
    items: Array<MenuItem>,
    pos: {
      x: number,
      y: number,
    }
  };

  handleBackdropClick: () => void;

  constructor(props) {
    super(props);

    this.handleBackdropClick = this.handleBackdropClick.bind(this);
  }

  onClick(i, evt) {
    this.props.items[i].action();
  }

  handleBackdropClick(evt) {
    evt.preventDefault();
    this.props.hideContextMenu();
  }

  render() {
    if (!this.props.open) {
      return <div style={styles.hidden} />;
    }

    var containerStyle = assign({}, styles.container, {
      top: this.props.pos.y + 'px',
      left: this.props.pos.x + 'px',
    });

    return (
      <div style={styles.backdrop} onClick={this.handleBackdropClick}>
        <ul style={containerStyle}>
          {!this.props.items.length && <li style={styles.empty}>No actions</li>}
          {this.props.items.map((item, i) => item && (
            <li key={item.key} onClick={evt => this.onClick(i, evt)}>
              <HighlightHover style={styles.item}>
                {item.title}
              </HighlightHover>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

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

  backdrop: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },

  container: {
    position: 'fixed',
    backgroundColor: 'white',
    boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
    listStyle: 'none',
    margin: 0,
    padding: '4px 0',
    fontSize: 14,
    borderRadius: '3px',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Ubuntu", "Helvetica Neue", sans-serif',
    zIndex: 1,
  },

  item: {
    padding: '3px 10px',
    cursor: 'default',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
  },

  empty: {
    padding: '5px 10px',
    color: '#888',
  },
};

module.exports = Wrapped;
