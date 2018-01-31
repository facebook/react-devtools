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

const React = require('react');
const {Map} = require('immutable');

const consts = require('../../agent/consts');
const Node = require('../Node');
const {monospace} = require('./Fonts');

import type {Theme} from '../types';

type Props = {
  theme: Theme,
};

// $FlowFixMe From the upgrade to Flow 64
class Preview extends React.Component {
  props: Props;

  getChildContext() {
    return {
      scrollTo: () => {},
      store: fauxStore,
    };
  }

  render() {
    const {theme} = this.props;

    return (
      <div style={panelStyle(theme)}>
        <Node
          depth={0}
          node={
            Map({
              children: ['grandparent'],
              name: 'div',
            })
          }
          searchRegExp={/iv/}
        />
      </div>
    );
  }
}

Preview.childContextTypes = {
  scrollTo: React.PropTypes.func,
  store: React.PropTypes.object,
};

const fauxRef = {
  [consts.type]: 'function',
  [consts.name]: 'setRef',
};

const childNode = Map({
  id: 'child',
  children: 'text',
  name: 'div',
  props: {
    style: {color: 'red'},
  },
  ref: fauxRef,
});

const grandparentNode = Map({
  id: 'grandparent',
  children: ['parent'],
  name: 'Grandparent',
  nodeType: 'Composite',
  props: {
    depth: 0,
  },
});

const parentNode = Map({
  id: 'parent',
  children: ['child'],
  name: 'Parent',
  nodeType: 'Composite',
  props: {
    boolean: true,
    integer: 123,
    string: 'foobar',
  },
});

const nodes = {
  child: childNode,
  grandparent: grandparentNode,
  parent: parentNode,
};

const noop = () => {};

const fauxStore = {
  hovered: 'parent',
  selected: 'grandparent',
  get: (id: any) => nodes[id],
  off: noop,
  on: noop,
  onContextMenu: noop,
  onHover: noop,
  onHoverBottom: noop,
  onSelect: noop,
  onSelectBottom: noop,
  onToggleCollapse: noop,
  setHover: noop,
  selectBottom: noop,
  selectTop: noop,
};

const panelStyle = (theme: Theme) => ({
  maxWidth: '100%',
  padding: '0.25rem 0',
  zIndex: 1,
  fontFamily: monospace.family,
  fontSize: monospace.sizes.normal,
  backgroundColor: theme.base00,
  color: theme.base05,
});

module.exports = Preview;
