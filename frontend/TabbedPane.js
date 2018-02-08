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
var PropTypes = require('prop-types');
var decorate = require('./decorate');
var {sansSerif} = require('./Themes/Fonts');

import type {Theme} from './types';

class TabbedPane extends React.Component {
  context: {
    theme: Theme,
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
  theme: PropTypes.object.isRequired,
};

const tabsStyle = (theme: Theme) => ({
  display: 'flex',
  flexShrink: 0,
  listStyle: 'none',
  margin: 0,
  backgroundColor: theme.base00,
  borderBottom: `1px solid ${theme.base03}`,
  padding: '0.25rem 0.25rem 0 0.25rem',
});

const tabStyle = (isSelected: boolean, theme: Theme) => {
  const border = isSelected ? `1px solid ${theme.base03}` : 'none';

  return {
    padding: '0.25rem 0.5rem',
    lineHeight: '15px',
    fontSize: sansSerif.sizes.normal,
    fontFamily: sansSerif.family,
    cursor: 'pointer',
    backgroundColor: isSelected ? theme.base01 : 'transparent',
    borderLeft: border,
    borderRight: border,
    borderTop: border,
  };
};

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
