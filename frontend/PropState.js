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
var BlurInput = require('./BlurInput');
var DataView = require('./DataView/DataView');
var invariant = require('./invariant');

var decorate = require('./decorate');

class PropState extends React.Component {
  getChildContext() {
    return {
      onChange: (path, val) => {
        this.props.onChange(path, val);
      }
    };
  }

  render() {
    if (!this.props.node) {
      // TODO(jared): style this
      return <span>No selection</span>;
    }

    var nodeType = this.props.node.get('nodeType');

    if (nodeType === 'Text') {
      if (this.props.canEditTextContent) {
        return (
          <div style={styles.container}>
            <BlurInput
              value={this.props.node.get('text')}
              onChange={this.props.onChangeText}
            />
          </div>
        );
      }
      return (
        <div style={styles.container}>
          Text node (no props/state)
        </div>
      );
    } else if (nodeType === 'Empty') {
      return <div style={styles.container}>Empty node (no props/state)</div>;
    }

    var editTextContent = null;
    if (this.props.canEditTextContent) {
      if (typeof this.props.node.get('children') === 'string') {
        editTextContent = (
          <BlurInput
            value={this.props.node.get('children')}
            onChange={this.props.onChangeText}
          />
        );
      }
    }

    var state = this.props.node.get('state');
    var context = this.props.node.get('context');
    var propsReadOnly = !this.props.node.get('canUpdate');

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerName}>
            &lt;{this.props.node.get('name')}&gt;
          </span>
          {nodeType === 'Composite' &&
            <span style={styles.consoleHint}>($r in the console)</span>}
        </div>
        {editTextContent}
        <div style={styles.section}>
          <strong>Props</strong>
          {propsReadOnly && <em> read-only</em>}
          <DataView
            path={['props']}
            readOnly={propsReadOnly}
            inspect={this.props.inspect}
            showMenu={this.props.showMenu}
            key={this.props.id + '-props'}
            data={this.props.node.get('props')}
          />
        </div>
        {state &&
          <div style={styles.section}>
            <strong>State</strong>
            <DataView
              data={state}
              path={['state']}
              inspect={this.props.inspect}
              showMenu={this.props.showMenu}
              key={this.props.id + '-state'}
            />
          </div>}
        {context &&
          <div style={styles.section}>
            <strong>Context</strong>
            <DataView
              data={context}
              path={['context']}
              inspect={this.props.inspect}
              showMenu={this.props.showMenu}
              key={this.props.id + '-context'}
            />
          </div>}
        {this.props.extraPanes &&
          this.props.extraPanes.map(fn => fn && fn(this.props.node, this.props.id))}
      </div>
    );
  }
}

PropState.childContextTypes = {
  onChange: React.PropTypes.func,
};

var WrappedPropState = decorate({
  listeners(props, store) {
    return ['selected', store.selected];
  },

  props(store) {
    var node = store.selected ? store.get(store.selected) : null;
    return {
      id: store.selected,
      node,
      canEditTextContent: store.capabilities.editTextContent,
      onChangeText(text) {
        store.changeTextContent(store.selected, text);
      },
      onChange(path, val) {
        if (path[0] === 'props') {
          store.setProps(store.selected, path.slice(1), val);
        } else if (path[0] === 'state') {
          store.setState(store.selected, path.slice(1), val);
        } else if (path[0] === 'context') {
          store.setContext(store.selected, path.slice(1), val);
        } else {
          invariant(false, 'the path to change() must start wth props, state, or context');
        }
      },
      showMenu(e, val, path, name) {
        store.showContextMenu('attr', e, store.selected, node, val, path, name);
      },
      inspect: store.inspect.bind(store, store.selected),
    };
  }
}, PropState);

var styles = {
  container: {
    padding: 3,
    fontSize: '11px',
    // TODO figure out what font Chrome devtools uses on Windows
    fontFamily: 'Menlo, Consolas, monospace',
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',

    cursor: 'default',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    MsUserSelect: 'none',
    userSelect: 'none',
  },
  header: {
    flexShrink: 0,
  },
  headerName: {
    flex: 1,
    fontSize: 16,
    color: 'rgb(184, 0, 161)',

    cursor: 'text',
    WebkitUserSelect: 'text',
    MozUserSelect: 'text',
    MsUserSelect: 'text',
    userSelect: 'text',
  },
  section: {
    marginBottom: 10,
    flexShrink: 0,
  },
  globalButton: {
    cursor: 'pointer',
  },
  consoleHint: {
    float: 'right',
    fontSize: 11,
  },
};

module.exports = WrappedPropState;
