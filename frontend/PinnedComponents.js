/* Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var Node = require('./Node');
var React = require('react');

import type {DOMNode} from './types';

var decorate = require('./decorate');

class PinnedComponents extends React.Component {
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
    if (!this.props.nodes.count()) {
      return null;
    }
    return (
      <div style={styles.container}>
        <div style={styles.header}><span>Pinned Components</span></div>
        <div ref={n => this.node = n} style={styles.scroll}>
          <div style={styles.scrollContents}>
            {this.props.nodes.map(id => (
              <Node key={id} id={id} depth={0} />
            )).toJS()}
          </div>
        </div>
      </div>
    );
  }
}

PinnedComponents.childContextTypes = {
  scrollTo: React.PropTypes.func,
};

var styles = {
  header: {
    fontSize: '18px',
    padding: '5px 5px 4px 10px',
    borderBottom: '1px solid #eee',
    fontFamily: 'system-ui',
  },
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
    borderBottom: '1px solid #eee',
  },

  scroll: {
    padding: '3px 0',
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

var WrapPinnedComponents = decorate({
  listeners(props) {
    return ['updatePinnedComponents', 'pinComponent', 'unpinComponent'];
  },
  props(store, props) {
    const pinnedComponentPaths = store.pinnedComponents;
    const pinnedComponents = store._nodes.entrySeq()
      .filter(([key, val]) => {
        return pinnedComponentPaths.includes(store.getPath(key));
      })
      .map(([key, val]) => key)
      .toList();
    return {
      nodes: pinnedComponents,
    };
  },
}, PinnedComponents);

module.exports = WrapPinnedComponents;
