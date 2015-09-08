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

import type Store from './Store';
import type {ElementID} from './types';

var React = require('react');
var assign = require('object-assign');
var decorate = require('./decorate');

class Breadcrumb extends React.Component {
  render() {
    return (
      <ul style={styles.container}>
        {this.props.path.map(({id, node}) => {
          var isSelected = id === this.props.selected;
          var style = assign(
            {},
            styles.item,
            node.get('nodeType') === 'Composite' && styles.composite,
            isSelected && styles.selected
          );
          return (
            <li
              style={style}
              onMouseOver={() => this.props.hover(id, true)}
              onMouseOut={() => this.props.hover(id, false)}
              onClick={isSelected ? null : () => this.props.select(id)}
            >
              {node.get('name') || '"' + node.get('text') + '"'}
            </li>
          );
        })}
      </ul>
    );
  }
}

var styles = {
  container: {
    borderTop: '1px solid #ccc',
    backgroundColor: 'white',
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  selected: {
    cursor: 'default',
    backgroundColor: 'rgb(56, 121, 217)',
    color: 'white',
  },

  composite: {
    color: 'rgb(136, 18, 128)',
  },

  item: {
    padding: '3px 7px',
    cursor: 'pointer',
    display: 'inline-block',
  },
};

function getBreadcrumbPath(store: Store): Array<{id: ElementID, node: Object}> {
  var path = [];
  var current = store.breadcrumbHead;
  while (current) {
    path.unshift({
      id: current,
      node: store.get(current),
    });
    current = store.skipWrapper(store.getParent(current), true);
  }
  return path;
}

module.exports = decorate({
  listeners: () => ['breadcrumbHead', 'selected'],
  props(store, props) {
    return {
      select: id => store.selectBreadcrumb(id),
      hover: (id, isHovered) => store.setHover(id, isHovered),
      selected: store.selected,
      path: getBreadcrumbPath(store),
    };
  },
}, Breadcrumb);
