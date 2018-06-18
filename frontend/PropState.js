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

const BlurInput = require('./BlurInput');
const DataView = require('./DataView/DataView');
const DetailPane = require('./detail_pane/DetailPane');
const DetailPaneSection = require('./detail_pane/DetailPaneSection');
const {sansSerif} = require('./Themes/Fonts');
const PropVal = require('./PropVal');
const PropTypes = require('prop-types');
const React = require('react');

const decorate = require('./decorate');
const invariant = require('./invariant');

import type {Theme} from './types';

type Props = {
  id: string,
  extraPanes: Array<any>,
  inspect: Function,
  showMenu: Function,
  node: Map<string, any>,
  onChange: (path: Array<string>, val: any) => mixed,
  onChangeText: (string) => mixed,
  onViewElementSource?: (id: string, node: ?Object) => mixed,
};

class PropState extends React.Component<Props> {
  context: {
    onChange: () => void,
    theme: Theme,
  };

  getChildContext() {
    return {
      onChange: (path, val) => {
        this.props.onChange(path, val);
      },
    };
  }

  renderSource(): React.Node {
    const {theme} = this.context;
    const {id, node, onViewElementSource} = this.props;
    const source = node.get('source');
    if (!source) {
      return null;
    }

    let onClick;
    if (onViewElementSource) {
      onClick = () => onViewElementSource(id, source);
    }

    return (
      <div
        style={sourceStyle(!!onViewElementSource, theme)}
        onClick={onClick}
      >
        {source.fileName}
        <span style={sourcePosStyle(theme)}>
          :{source.lineNumber}
        </span>
      </div>
    );
  }

  render() {
    var theme = this.context.theme;

    if (!this.props.node) {
      return <span style={emptyStyle(theme)}>No selection</span>;
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
      return <DetailPane header="Text Node"><span style={noPropsStateStyle(theme)}>No props/state.</span></DetailPane>;
    } else if (nodeType === 'Empty') {
      return <DetailPane header="Empty Node"><span style={noPropsStateStyle(theme)}>No props/state.</span></DetailPane>;
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
        theme={theme}>
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

PropState.contextTypes = {
  theme: PropTypes.object.isRequired,
};

PropState.childContextTypes = {
  onChange: PropTypes.func,
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

const emptyStyle = (theme: Theme) => ({
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.large,
  fontStyle: 'italic',
  margin: 'auto',
  color: theme.base04,
});

const sourceStyle = (hasViewElementSource: boolean, theme: Theme) => ({
  padding: '0.25rem 0.5rem',
  color: theme.base05,
  overflowWrap: 'break-word',
  cursor: hasViewElementSource ? 'pointer' : 'default',
});

const sourcePosStyle = (theme: Theme) => ({
  color: theme.base03,
});

const noPropsStateStyle = (theme: Theme) => ({
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
  color: theme.base03,
  textAlign: 'center',
  fontStyle: 'italic',
  padding: '0.5rem',
});

module.exports = WrappedPropState;
