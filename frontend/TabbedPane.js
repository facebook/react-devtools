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

const PropTypes = require('prop-types');
const React = require('react');
const decorate = require('./decorate');
const {sansSerif} = require('./Themes/Fonts');

import type {Theme} from './types';

type Props = {
  tabs: {[key: string]: () => React.Node},
  selected: string,
  setSelectedTab: (name: string) => void,
};

class TabbedPane extends React.Component<Props> {
  context: {
    theme: Theme,
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
  backgroundColor: theme.base01,
  borderBottom: `1px solid ${theme.base03}`,
  padding: '0 0.25rem',
});

const tabStyle = (isSelected: boolean, theme: Theme) => {
  return {
    padding: '0.25rem 0.75rem',
    lineHeight: '15px',
    fontSize: sansSerif.sizes.normal,
    fontFamily: sansSerif.family,
    cursor: 'pointer',
    borderTop: '1px solid transparent',
    borderBottom: isSelected ? `2px solid ${theme.state00}` : 'none',
    marginBottom: isSelected ? '-1px' : '1px',
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
