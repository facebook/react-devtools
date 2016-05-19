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

import type {DOMNode} from './types';

var decorate = require('./decorate');

var MAX_SEARCH_ROOTS = 200;

class TreeView extends React.Component {
  node: ?DOMNode;

  getChildContext() {
    return {
      scrollTo: this.scrollTo.bind(this),
    };
  }

  scrollTo(val, height) {
    if (!this.node) {
      return;
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
    if (!this.props.roots.count()) {
      if (this.props.searching) {
        return (
          <div style={styles.container}>
            <span>No search results</span>
          </div>
        );
      } else {
        return (
          <div style={styles.container}>
            <span>
              Waiting for roots to load...
              {this.props.reload &&
                <span>
                  to reload the inspector <button onClick={this.props.reload}> click here</button>
                </span>}
            </span>
          </div>
        );
      }
    }

    if (this.props.searching && this.props.roots.count() > MAX_SEARCH_ROOTS) {
      return (
        <div style={styles.container}>
          {this.props.roots.slice(0, MAX_SEARCH_ROOTS).map(id => (
            <Node key={id} id={id} depth={0} />
          )).toJS()}
          <span>Some results not shown. Narrow your search criteria to find them</span>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div ref={n => this.node = n} style={styles.scroll}>
          {this.props.roots.map(id => (
            <Node key={id} id={id} depth={0} />
          )).toJS()}
        </div>
        <Breadcrumb />
      </div>
    );
  }
}

TreeView.childContextTypes = {
  scrollTo: React.PropTypes.func,
};

var styles = {
  container: {
    fontFamily: 'Menlo, monospace',
    fontSize: '11px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,

    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
  },
  scroll: {
    padding: 3,
    overflow: 'auto',
    minHeight: 0,
    flex: 1,
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
    };
  },
}, TreeView);

module.exports = WrappedTreeView;
