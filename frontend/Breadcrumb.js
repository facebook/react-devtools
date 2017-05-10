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
import type {Base16Theme} from './types';

var React = require('react');
var decorate = require('./decorate');

class Breadcrumb extends React.Component {
  context: {theme: Base16Theme};
  state: {hovered: ?string};

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
    var theme = this.context.theme;
    return (
      <ul style={containerStyle(theme)}>
        {this.props.path.map(({ id, node }) => {
          const isSelected = id === this.props.selected;
          const style = itemStyle(
            isSelected,
            node.get('nodeType') === 'Composite',
            theme,
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

Breadcrumb.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const containerStyle = (theme: Base16Theme) => ({
  fontFamily: 'sans-serif',
  listStyle: 'none',
  padding: 0,
  margin: 0,
  maxHeight: '80px',
  overflow: 'auto',
  marginTop: '2px',
  backgroundColor: theme.base01,
  borderTop: `1px solid ${theme.base02}`,
});

const itemStyle = (isSelected: boolean, isComposite: boolean, theme: Base16Theme) => ({
  backgroundColor: isSelected ? theme.base02 : 'transparent',
  color: isComposite ? theme.base0E : 'inherit',
  cursor: isSelected ? 'default' : 'pointer',
  padding: '0.25rem 0.5rem',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  userSelect: 'none',
  display: 'inline-block',
  marginRight: '2px',
});

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
      hover: (id, isHovered) => store.setHover(id, isHovered, false),
      selected: store.selected,
      path: getBreadcrumbPath(store),
    };
  },
}, Breadcrumb);
