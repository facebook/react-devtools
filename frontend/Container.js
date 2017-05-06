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
var LeftPane = require('./LeftPane');
var SplitPane = require('./SplitPane');
var TabbedPane = require('./TabbedPane');

require('./theme.js');

import type MenuItem from './ContextMenu';

type Props = {};

type State = {
  isVertical: boolean,
};

var IS_VERTICAL_BREAKPOINT = 500;

function shouldUseVerticalLayout(window) {
  return window.innerWidth < IS_VERTICAL_BREAKPOINT;
}

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
  resizeTimeout: ?number;

  constructor(props: Props) {
    super(props);

    this.state = {
      isVertical: shouldUseVerticalLayout(window),
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize, false);
    this.setState({
      isVertical: shouldUseVerticalLayout(window),
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    clearTimeout(this.resizeTimeout);
  }

  // $FlowFixMe future versions of Flow can infer this
  handleResize = (e: Event): void => {
    if (!this.resizeTimeout) {
      this.resizeTimeout = setTimeout(this.handleResizeTimeout, 50);
    }
  };

  // $FlowFixMe future versions of Flow can infer this
  handleResizeTimeout = (): void => {
    this.resizeTimeout = null;

    this.setState({
      isVertical: shouldUseVerticalLayout(window),
    });
  };

  render() {
    var tabs = {
      Elements: () => (
        <SplitPane
          initialWidth={10}
          initialHeight={10}
          left={() => <LeftPane reload={this.props.reload} />}
          right={() => <PropState extraPanes={this.props.extraPanes} />}
          isVertical={this.state.isVertical}
        />
      ),
      ...this.props.extraTabs,
    };
    return (
      <div className='DevTools' style={styles.container}>
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
        title: 'Scroll to node',
        action: () => store.scrollToNode(id),
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
  },
};

module.exports = Container;
