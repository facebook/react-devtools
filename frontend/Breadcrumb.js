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

  constructor(props) {
    super(props);
    this.state = { hovered: null };
  }
  handleCrumbMouseOver(id) {
    this.setState({ hovered: id });
    this.props.hover(id, true);
  }

  handleCrumbMouseOut(id) {
    this.setState({ hovered: null });
    this.props.hover(id, false);
  }

  render() {
    return (
      <ul style={styles.container}>
        {this.props.path.map(({ id, node }) => {
          var isSelected = id === this.props.selected;
          var isHovered = id === this.state.hovered;
          var style = assign(
            {},
            styles.item,
            node.get('nodeType') === 'Composite' && styles.composite,
            isHovered && styles.hovered,
            isSelected && styles.selected,
          );
          return (
            <li
              style={style}
              key={id}
              onMouseOver={() => this.handleCrumbMouseOver(id)}
              onMouseOut={() => this.handleCrumbMouseOut(id)}
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
    fontFamily: 'sans-serif',
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  selected: {
    cursor: 'default',
    backgroundColor: 'rgb(56, 121, 217)',
    color: 'white',
  },

  hovered: {
    backgroundColor: '#d8d8d8',
  },

  composite: {
    color: 'rgb(136, 18, 128)',
  },

  item: {
    padding: '3px 7px',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
    cursor: 'default',
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
