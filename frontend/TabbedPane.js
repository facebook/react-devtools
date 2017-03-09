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
var assign = require('object-assign');
var decorate = require('./decorate');

class TabbedPane extends React.Component {
  props: {
    tabs: {[key: string]: () => React$Element<*>},
    selected: string,
    setSelectedTab: (name: string) => void,
  };

  render() {
    var tabs = Object.keys(this.props.tabs);
    if (tabs.length === 1) {
      return this.props.tabs[tabs[0]]();
    }
    return (
      <div style={styles.container}>
        <ul style={styles.tabs}>
          {tabs.map((name, i) => {
            var style = styles.tab;
            if (name === this.props.selected) {
              style = assign({}, style, styles.selectedTab);
            }
            if (i === tabs.length - 1) {
              style = assign({}, style, styles.lastTab);
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
    backgroundColor: '#eee',
    borderBottom: '1px solid rgb(163, 163, 163)',
    margin: 0,
    padding: '0 2px',
  },
  tab: {
    padding: '2px 4px',
    lineHeight: '15px',
    fontSize: 12,
    fontFamily: "'Lucida Grande', sans-serif",
    cursor: 'pointer',
    borderLeft: '1px solid rgb(163, 163, 163)',
  },
  lastTab: {
    borderRight: '1px solid rgb(163, 163, 163)',
  },
  selectedTab: {
    backgroundColor: 'white',
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
