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

var Breadcrumb = require('./Breadcrumb');
var Node = require('./Node');
var React = require('react');
var SearchUtils = require('./SearchUtils');

var decorate = require('./decorate');

import type {Base16Theme} from './types';

var MAX_SEARCH_ROOTS = 200;

class TreeView extends React.Component {
  node: ?HTMLElement;

  getChildContext() {
    return {
      scrollTo: this.scrollTo.bind(this),
    };
  }

  scrollTo(toNode) {
    if (!this.node) {
      return;
    }
    var val = 0;
    var height = toNode.offsetHeight;
    while (toNode && this.node.contains(toNode)) {
      val += toNode.offsetTop;
      toNode = toNode.offsetParent;
    }
    var top = this.node.scrollTop;
    var rel = val - this.node.offsetTop;
    var margin = 40;
    if (top > rel - margin) {
      this.node.scrollTop = rel - margin;
    } else if (top + this.node.offsetHeight < rel + height + margin) {
      this.node.scrollTop = rel - this.node.offsetHeight + height + margin;
    }
  }

  render() {
    const {theme} = this.context;

    if (!this.props.roots.count()) {
      if (this.props.searching) {
        return (
          <div style={styles.container}>
            <span style={noSearchResultsStyle(theme)}>No search results</span>
          </div>
        );
      } else {
        return (
          <div style={styles.container}>
            <div ref={n => this.node = n} style={styles.scroll}>
              <div style={styles.scrollContents}>
              Waiting for roots to load...
              {this.props.reload &&
                <span>
                  to reload the inspector <button onClick={this.props.reload}> click here</button>
                </span>}
              </div>
            </div>
          </div>
        );
      }
    }

    // Convert search text into a case-insensitive regex for match-highlighting.
    var searchText = this.props.searchText;
    var searchRegExp = SearchUtils.isValidRegex(searchText)
      ? SearchUtils.searchTextToRegExp(searchText)
      : null;

    if (this.props.searching && this.props.roots.count() > MAX_SEARCH_ROOTS) {
      return (
        <div style={styles.container}>
          <div ref={n => this.node = n} style={styles.scroll}>
            <div style={styles.scrollContents}>
              {this.props.roots.slice(0, MAX_SEARCH_ROOTS).map(id => (
                <Node
                  depth={0}
                  id={id}
                  key={id}
                  searchRegExp={searchRegExp}
                />
              )).toJS()}
              <span>Some results not shown. Narrow your search criteria to find them</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div ref={n => this.node = n} style={styles.scroll}>
          <div style={styles.scrollContents}>
            {this.props.roots.map(id => (
              <Node
                depth={0}
                id={id}
                key={id}
                searchRegExp={searchRegExp}
              />
            )).toJS()}
          </div>
        </div>
        <Breadcrumb />
      </div>
    );
  }
}

TreeView.childContextTypes = {
  scrollTo: React.PropTypes.func,
};

TreeView.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const noSearchResultsStyle = (theme: Base16Theme) => ({
  color: theme.base03,
  fontFamily: 'sans-serif',
  fontSize: '14px',
  padding: '0.5rem',
});

var styles = {
  container: {
    fontFamily: 'Menlo, Consolas, monospace',
    fontSize: '11px',
    lineHeight: 1.3,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,

    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
  },

  scroll: {
    overflow: 'auto',
    minHeight: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
  },

  scrollContents: {
    flexDirection: 'column',
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
  },
};

var WrappedTreeView = decorate({
  listeners(props) {
    return ['searchRoots', 'roots'];
  },
  props(store, props) {
    return {
      roots: store.searchRoots || store.roots,
      searching: !!store.searchRoots,
      searchText: store.searchText,
    };
  },
}, TreeView);

module.exports = WrappedTreeView;
