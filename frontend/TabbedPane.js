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
var Store = require('./Store');
var assign = require('object-assign');
var decorate = require('./decorate');

import type {Base16Theme} from './theme';

class TabbedPane extends React.Component {
  props: {
    tabs: {[key: string]: () => React$Element},
    selected: string,
    setSelectedTab: (name: string) => void,
    theme: Base16Theme,
  };

  render() {
    var {theme} = this.props;
    var tabs = Object.keys(this.props.tabs);
    if (tabs.length === 1) {
      return this.props.tabs[tabs[0]]();
    }
    var tabsStyle = assign({}, styles.tabs, {
      backgroundColor: theme.base00,
    });
    return (
      <div style={styles.container}>
        <ul style={tabsStyle}>
          {tabs.map((name, i) => {
            var style = assign({}, styles.tab, {
              backgroundColor: theme.base01,
            });

            if (name === this.props.selected) {
              style = assign({}, style, styles.selectedTab, {
                backgroundColor: theme.base02,
              });
            }
            return (
              <li key={name + i} style={style} onClick={() => this.props.setSelectedTab(name)}>
                {name}
              </li>
            );
          })}
          <li style={styles.lastTab}>
            <SettingsMenuIcon onClick={this.props.showPreferencesPanel} />
          </li>
        </ul>
        <div style={styles.body}>
          {this.props.tabs[this.props.selected]()}
        </div>
      </div>
    );
  }
}

const SettingsMenuIcon = ({ onClick }) => (
  <div onClick={onClick}>
    <svg style={styles.settingsMenuIcon} viewBox='0 0 24 24'>
      <path d='
        M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,
        1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,
        11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,
        5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,
        2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,
        4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,
        11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,
        15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,
        18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,
        18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,
        18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z
      '></path>
    </svg>
  </div>
)

var styles = {
  container:{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  tabs: {
    display: 'flex',
    flexShrink: 0,
    listStyle: 'none',
    margin: 0,
    padding: '0',
    marginBottom: '2px',
  },
  tab: {
    padding: '0.25rem 0.5rem',
    lineHeight: '15px',
    fontSize: 12,
    fontFamily: "'Lucida Grande', sans-serif",
    cursor: 'pointer',
    marginRight: '2px',
  },
  lastTab: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  selectedTab: {
  },
  body: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  },
  settingsMenuIcon: {
    width: '16px',
    height: '16px',
    fill: 'currentColor',
    cursor: 'pointer',
    marginRight: '0.25rem',
  }
};

module.exports = decorate({
  listeners: () => ['selectedTab', 'theme'],
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
      showPreferencesPanel() {
        store.showPreferencesPanel();
      },
      theme: store.theme
    };
  },
}, TabbedPane);
