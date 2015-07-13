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
var Node = require('./Node');

var decorate = require('./decorate');

var MAX_SEARCH_ROOTS = 200;

class TreeView extends React.Component {
  getChildContext() {
    return {
      scrollTo: this.scrollTo.bind(this),
    };
  }

  scrollTo(val, height) {
    var node = React.findDOMNode(this);
    var top = node.scrollTop;
    var rel = val - node.offsetTop;
    var margin = 40;
    if (top > rel - margin) {
      node.scrollTop = rel - margin;
    } else if (top + node.offsetHeight < rel + height + margin) {
      node.scrollTop = rel - node.offsetHeight + height + margin;
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
        {this.props.roots.map(id => (
          <Node key={id} id={id} depth={0} />
        )).toJS()}
      </div>
    );
  }
}

TreeView.childContextTypes = {
  scrollTo: React.PropTypes.func,
}

var styles = {
  container: {
    padding: 3,
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: '12px',
    flex: 1,

    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    MsUserSelect: 'none',
    userSelect: 'none',
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
