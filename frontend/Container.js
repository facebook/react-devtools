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

  render() {
    var tabs = {
      Elements: () => (
        <SplitPane
          initialWidth={300}
          left={() => <SearchPane reload={this.props.reload} />}
          right={() => <PropState extraPanes={this.props.extraPanes} />}
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
    if (!store.checkPinnedComponent(id)) {
      items.push({
        key: 'pinComponent',
        title: 'Pin this component',
        action: () => {
          store.pinComponent(id);
        },
      });
    } else {
      items.push({
        key: 'unpinComponent',
        title: 'Unpin this component',
        action: () => {
          store.unpinComponent(id);
        },
      });
    }
    return items;
  },
  attr: (id, node, val, path, name, store) => {
    return [{
      key: 'storeAsGlobal',
      title: 'Store as global variable',
      action: () => store.makeGlobal(id, path),
    }];
  },
};

var styles = {
  container: {
    flex: 1,
    display: 'flex',
    minWidth: 0,
    backgroundColor: 'white',
  },
};

module.exports = Container;
