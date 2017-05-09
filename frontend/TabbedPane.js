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
var decorate = require('./decorate');

import type {Base16Theme} from './types';

class TabbedPane extends React.Component {
  context: {
    theme: Base16Theme,
  };
  props: {
    tabs: {[key: string]: () => React$Element},
    selected: string,
    setSelectedTab: (name: string) => void,
  };

  render() {
    var {theme} = this.context;
    var tabs = Object.keys(this.props.tabs);
    if (tabs.length === 1) {
      return this.props.tabs[tabs[0]]();
    }
    return (
      <div style={styles.container}>
        <ul style={tabsStyle(theme)}>
          {tabs.map((name, i) => (
            <li
              key={name + i}
              onClick={() => this.props.setSelectedTab(name)}
              style={tabStyle(name === this.props.selected, theme)}
            >
              {name}
            </li>
          ))}
        </ul>
        <div style={styles.body}>
          {this.props.tabs[this.props.selected]()}
        </div>
      </div>
    );
  }
}

TabbedPane.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const tabsStyle = (theme: Base16Theme) => ({
  display: 'flex',
  flexShrink: 0,
  listStyle: 'none',
  margin: 0,
  padding: '0',
  marginBottom: '2px',
  backgroundColor: theme.base00,
});

const tabStyle = (isSelected: boolean, theme: Base16Theme) => ({
  padding: '0.25rem 0.5rem',
  lineHeight: '15px',
  fontSize: 12,
  fontFamily: "'Lucida Grande', sans-serif",
  cursor: 'pointer',
  marginRight: '2px',
  backgroundColor: isSelected ? theme.base02 : theme.base01,
});

var styles = {
  container:{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  body: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  },
};

module.exports = decorate({
  listeners: () => ['selectedTab'],
  shouldUpdate: (props, prevProps) => {
    for (var name in props) {
      if (props[name] !== prevProps[name]) {
        return true;
      }
    }
    return false;
  },
  props(store) {
    return {
      selected: store.selectedTab,
      setSelectedTab: name => store.setSelectedTab(name),
    };
  },
}, TabbedPane);
