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

var consts = require('../backend/consts');

import type MenuItem from './ContextMenu';

class Container {
  props: {
    reload: () => void,
    extraPanes: Array<Object>,
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
  };

  render(): ReactElement {
    var defaultItems = {
      tree: (id, node, store) => {
        var items = [];
        if (node.get('name')) {
          items.push({
            title: 'Show all ' + node.get('name'),
            action: () => store.onChangeSearch(node.get('name')),
          });
        }
        if (store.capabilities.scroll) {
          items.push({
            title: 'Scroll to node',
            action: () => store.scrollToNode(id),
          });
        }
        return items;
      },
      attr: (id, node, val, path, name, store) => {
        var items = [{
          title: 'Store as global variable',
          action: () => store.makeGlobal(id, path),
        }];
        return items;
      },
    };

    return (
      <div style={styles.container}>
        <SplitPane
          initialWidth={300}
          left={() => <SearchPane reload={this.props.reload} />}
          right={() => <PropState extraPanes={this.props.extraPanes} />}
        />
        <ContextMenu itemSources={[defaultItems, this.props.menuItems]} />
      </div>
    );
  }
}

var styles = {
  container: {
    flex: 1,
    display: 'flex',
  },
}

module.exports = Container;
