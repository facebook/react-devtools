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
var PreferencesPanel = require('./PreferencesPanel');
var SplitPane = require('./SplitPane');
var TabbedPane = require('./TabbedPane');

import type MenuItem from './ContextMenu';
import type {Theme} from './types';

type Props = {
  reload: () => void,
  // $FlowFixMe From the upgrade to Flow 64
  extraPanes: Array<(node: Object) => React$Element>,
  // $FlowFixMe From the upgrade to Flow 64
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
  // $FlowFixMe From the upgrade to Flow 64
  extraTabs: {[key: string]: () => React$Element},
  preferencesPanelShown: boolean,
  theme: Theme,
  onViewElementSource: null | (id: string, node: ?Object) => void,
};

type State = {
  isVertical: boolean,
};

var IS_VERTICAL_BREAKPOINT = 500;

function shouldUseVerticalLayout(window) {
  return window.innerWidth < IS_VERTICAL_BREAKPOINT;
}

// $FlowFixMe From the upgrade to Flow 64
class Container extends React.Component {
  props: Props;
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
    // $FlowFixMe From the upgrade to Flow 64
    this.setState({
      isVertical: shouldUseVerticalLayout(window),
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    // $FlowFixMe From the upgrade to Flow 64
    clearTimeout(this.resizeTimeout);
  }

  // $FlowFixMe future versions of Flow can infer this
  handleResize = (e: Event): void => {
    if (!this.resizeTimeout) {
      // $FlowFixMe From the upgrade to Flow 64
      this.resizeTimeout = setTimeout(this.handleResizeTimeout, 50);
    }
  };

  // $FlowFixMe future versions of Flow can infer this
  handleResizeTimeout = (): void => {
    this.resizeTimeout = null;

    // $FlowFixMe From the upgrade to Flow 64
    this.setState({
      isVertical: shouldUseVerticalLayout(window),
    });
  };

  render() {
    const {preferencesPanelShown, theme} = this.props;

    var tabs = {
      Elements: () => (
        <SplitPane
          initialWidth={10}
          initialHeight={10}
          left={() => <LeftPane reload={this.props.reload} />}
          right={() => (
            <PropState
              onViewElementSource={this.props.onViewElementSource}
              extraPanes={this.props.extraPanes}
            />
          )}
          isVertical={this.state.isVertical}
        />
      ),
      ...this.props.extraTabs,
    };

    return (
      <div style={containerStyle(preferencesPanelShown, theme)}>
        <TabbedPane tabs={tabs} />
        <PreferencesPanel />
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
    if (node.get('nodeType') === 'Composite' && node.get('name')) {
      items.push({
        key: 'copyNodeName',
        title: 'Copy element name',
        action: () => store.copyNodeName(node.get('name')),
      });
    }
    const props = node.get('props');
    if (props) {
      const numKeys = Object.keys(props)
        .filter(key => key !== 'children')
        .length;

      if (numKeys > 0) {
        items.push({
          key: 'copyNodeProps',
          title: 'Copy element props',
          action: () => store.copyNodeProps(props),
        });
      }
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

const containerStyle = (preferencesPanelShown: boolean, theme: Theme) => ({
  backgroundColor: theme.base00,
  color: theme.base05,
  flex: 1,
  display: 'flex',
  minWidth: 0,
  position: preferencesPanelShown ? 'relative' : null,
});

module.exports = Container;
