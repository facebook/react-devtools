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

type MenuItem = {
  title: string,
  action: () => void
};

export type MenuItem = MenuItem;

class ContextMenu {
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
    var container = React.findDOMNode(this);
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

    var containerStyle = assign({}, styles.container, {
      top: this.props.pos.y + 'px',
      left: this.props.pos.x + 'px',
    });

    return (
      <ul style={containerStyle}>
        {!this.props.items.length && <li style={styles.empty}>No actions</li>}
        {this.props.items.map((item, i) => item && (
          <li onClick={evt => this.onClick(i, evt)}>
            <HighlightHover style={styles.item}>
              {item.title}
            </HighlightHover>
          </li>
        ))}
      </ul>
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
        items = items.concat(newItems.filter(x => !!x));
      }
    });

    return {
      open: true,
      pos: {x, y},
      hideContextMenu: () => store.hideContextMenu(),
      items,
    };
  }
}, ContextMenu);

var styles = {
  hidden: {
    display: 'none',
  },

  container: {
    position: 'fixed',
    backgroundColor: 'white',
    boxShadow: '0 3px 5px #ccc',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    fontFamily: 'sans-serif',
    fontSize: 14,
  },

  item: {
    padding: '5px 10px',
    cursor: 'pointer',
  },

  empty: {
    padding: '5px 10px',
    color: '#888',
  },
}

module.exports = Wrapped;
