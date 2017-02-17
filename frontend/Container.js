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

var ContextMenu = require('./ContextMenu');
var PropState = require('./PropState');
var React = require('react');
var SearchPane = require('./SearchPane');
var SplitPane = require('./SplitPane');
var TabbedPane = require('./TabbedPane');

import type MenuItem from './ContextMenu';

type Props = {};

type State = {
  isVertical: boolean,
};

var IS_VERTICAL_BREAKPOINT = 500;
var resizeTimeout = null;

class Container extends React.Component {
  props: {
    reload: () => void,
    extraPanes: Array<(node: Object) => React$Element>,
    extraTabs: ?{[key: string]: () => React$Element},
    menuItems: {
      tree?: (id: string, node: Object, store: Object) => ?Array<MenuItem>,
      attr?: (
        id: string,
        node: Object,
        val: any,
        path: Array<string>,
        name: string,
        store: Object
      ) => ?Array<MenuItem>,
    },
    extraTabs: {[key: string]: () => React$Element},
  };
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {
      isVertical: (window.innerWidth < IS_VERTICAL_BREAKPOINT),
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize, false);
    this.setState({
      isVertical: (window.innerWidth < IS_VERTICAL_BREAKPOINT),
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = (e: Event) => {
    if (!resizeTimeout) {
      resizeTimeout = setTimeout(this.handleResizeTimeout, 50, this, e);
    }
  }

  handleResizeTimeout(scope: Container, e: Event) {
    resizeTimeout = null;

    scope.setState({
      isVertical: (e.target.innerWidth < IS_VERTICAL_BREAKPOINT),
    });
  }

  render() {
    var tabs = {
      Elements: () => (
        <SplitPane
          initialWidth={300}
          initialHeight={300}
          left={() => <SearchPane reload={this.props.reload} />}
          right={() => <PropState extraPanes={this.props.extraPanes} />}
          isVertical={this.state.isVertical}
        />
      ),
      ...this.props.extraTabs,
    };
    return (
      <div style={styles.container}>
        <TabbedPane tabs={tabs} />
        <ContextMenu itemSources={[DEFAULT_MENU_ITEMS, this.props.menuItems]} />
      </div>
    );
  }
}

var DEFAULT_MENU_ITEMS = {
  tree: (id, node, store) => {
    var items = [];
    if (node.get('name')) {
      items.push({
        key: 'showNodesOfType',
        title: 'Show all ' + node.get('name'),
        action: () => store.changeSearch(node.get('name')),
      });
    }
    if (store.capabilities.scroll) {
      items.push({
        key: 'scrollToNode',
        title: 'Scroll to Node',
        action: () => store.scrollToNode(id),
      });
    }
    return items;
  },
  attr: (id, node, val, path, name, store) => {
    var items = [{
      key: 'storeAsGlobal',
      title: 'Store as global variable',
      action: () => store.makeGlobal(id, path),
    }];
    return items;
  },
};

var styles = {
  container: {
    flex: 1,
    display: 'flex',
    minWidth: 0,
    backgroundColor: '#fff',
  },
};

module.exports = Container;
