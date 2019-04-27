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
import type {Theme} from './types';

const {sansSerif} = require('./Themes/Fonts');
const PropTypes = require('prop-types');
const React = require('react');
const decorate = require('./decorate');

type BreadcrumbPath = Array<{id: ElementID, node: Object}>;

type Props = {
  hover: (string, boolean) => void;
  selected: string,
  path: BreadcrumbPath,
  select: string => ElementID,
}

type State ={
  hovered: ?string
}

class Breadcrumb extends React.Component<Props, State> {
  context: {theme: Theme};
  // $FlowFixMe createRef()
  selectedListItem = React.createRef();

  constructor(props) {
    super(props);
    this.state = { hovered: null };
  }

  componentDidMount() {
    if (this.props.selected) {
      this.ensureInView();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.selected !== prevProps.selected) {
      this.ensureInView();
    }
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
    const {theme} = this.context;
    const {path, selected} = this.props;

    return (
      <ul style={containerStyle(theme)}>
        {path.map(({ id, node }) => {
          const isSelected = id === selected;
          const style = itemStyle(
            isSelected,
            node.get('nodeType'),
            theme,
          );

          return (
            <li
              style={style}
              key={id}
              onMouseOver={() => this.handleCrumbMouseOver(id)}
              onMouseOut={() => this.handleCrumbMouseOut(id)}
              onClick={isSelected ? null : () => this.props.select(id)}
              ref={isSelected ? this.selectedListItem : undefined}
            >
              {node.get('name') || '"' + node.get('text') + '"'}
            </li>
          );
        })}
      </ul>
    );
  }

  ensureInView() {
    const selectedListItem = this.selectedListItem.current;
    if (selectedListItem != null) {
      if (typeof selectedListItem.scrollIntoViewIfNeeded === 'function') {
        selectedListItem.scrollIntoViewIfNeeded({
          inline: 'nearest',
        });
      } else if (typeof selectedListItem.scrollIntoView === 'function') {
        selectedListItem.scrollIntoView({
          inline: 'nearest',
        });
      }
    }
  }
}

Breadcrumb.contextTypes = {
  theme: PropTypes.object.isRequired,
};

const containerStyle = (theme: Theme) => ({
  fontFamily: sansSerif.family,
  listStyle: 'none',
  padding: '0 0.5rem',
  margin: 0,
  maxHeight: '80px',
  backgroundColor: theme.base01,
  borderTop: `1px solid ${theme.base03}`,
  whiteSpace: 'nowrap',
  overflow: 'auto',
});

const itemStyle = (isSelected: boolean, nodeType: string, theme: Theme) => {
  let color;
  if (isSelected) {
    color = theme.state02;
  } else if (nodeType === 'Special') {
    color = theme.special01;
  } else if (nodeType === 'Composite') {
    color = theme.special05;
  }

  return {
    backgroundColor: isSelected ? theme.state00 : 'transparent',
    color,
    cursor: isSelected ? 'default' : 'pointer',
    padding: '0.25rem 0.5rem',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
    display: 'inline-block',
  };
};

function getBreadcrumbPath(store: Store): BreadcrumbPath {
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
