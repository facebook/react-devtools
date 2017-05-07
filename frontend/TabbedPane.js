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
        </ul>
        <div style={styles.body}>
          {this.props.tabs[this.props.selected]()}
        </div>
      </div>
    );
  }
}

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
  selectedTab: {
  },
  body: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  },
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
      theme: store.theme
    };
  },
}, TabbedPane);
