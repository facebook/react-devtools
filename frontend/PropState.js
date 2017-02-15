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

var BlurInput = require('./BlurInput');
var DataView = require('./DataView/DataView');
var DetailPane = require('./detail_pane/DetailPane');
var DetailPaneSection = require('./detail_pane/DetailPaneSection');
var PropVal = require('./PropVal');
var React = require('react');

var decorate = require('./decorate');
var invariant = require('./invariant');


class PropState extends React.Component {
  getChildContext() {
    return {
      onChange: (path, val) => {
        this.props.onChange(path, val);
      },
    };
  }

  renderSource(): ?React.Element {
    var source = this.props.node.get('source');
    if (!source) {
      return null;
    }
    return (
      <div style={styles.source}>
        <div style={styles.sourceName}>
          {source.fileName}
        </div>
        <div style={styles.sourcePos}>
          :{source.lineNumber}
        </div>
      </div>
    );
  }

  render(): React.Element {
    if (!this.props.node) {
      // TODO(jared): style this
      return <span>No selection</span>;
    }

    var nodeType = this.props.node.get('nodeType');

    if (nodeType === 'Text') {
      if (this.props.canEditTextContent) {
        return (
          <DetailPane>
            <BlurInput
              value={this.props.node.get('text')}
              onChange={this.props.onChangeText}
            />
          </DetailPane>
        );
      }
      return <DetailPane header="Text Node">No props/state.</DetailPane>;
    } else if (nodeType === 'Empty') {
      return <DetailPane header="Empty Node">No props/state.</DetailPane>;
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

    var key = this.props.node.get('key');
    var ref = this.props.node.get('ref');
    var state = this.props.node.get('state');
    var context = this.props.node.get('context');
    var propsReadOnly = !this.props.node.get('canUpdate');

    return (
      <DetailPane
        header={'<' + this.props.node.get('name') + '>'}
        hint="($r in the console)">
        {key &&
          <DetailPaneSection
            title="Key"
            key={this.props.id + '-key'}>
            <PropVal
              val={key}
            />
          </DetailPaneSection>
        }
        {ref &&
          <DetailPaneSection
            title="Ref"
            key={this.props.id + '-ref'}>
            <PropVal
              val={ref}
            />
          </DetailPaneSection>
        }
        {editTextContent}
        <DetailPaneSection
          hint={propsReadOnly ? 'read-only' : null}
          title="Props">
          <DataView
            path={['props']}
            readOnly={propsReadOnly}
            inspect={this.props.inspect}
            showMenu={this.props.showMenu}
            key={this.props.id + '-props'}
            data={this.props.node.get('props')}
          />
        </DetailPaneSection>

        {state &&
          <DetailPaneSection title="State">
            <DataView
              data={state}
              path={['state']}
              inspect={this.props.inspect}
              showMenu={this.props.showMenu}
              key={this.props.id + '-state'}
            />
          </DetailPaneSection>}
        {context &&
          <DetailPaneSection title="Context">
            <DataView
              data={context}
              path={['context']}
              inspect={this.props.inspect}
              showMenu={this.props.showMenu}
              key={this.props.id + '-context'}
            />
          </DetailPaneSection>}
        {this.props.extraPanes &&
          this.props.extraPanes.map(fn => fn && fn(this.props.node, this.props.id))}
        <div style={{flex: 1}} />
        {this.renderSource()}
      </DetailPane>
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
  },
}, PropState);

var styles = {
  source: {
    padding: '5px 10px',
    display: 'flex',
    flexDirection: 'row',
  },

  sourceName: {
    color: 'blue',
  },

  sourcePos: {
    color: '#777',
  },
};

module.exports = WrappedPropState;
