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

import type {Map} from 'immutable';
import type {Theme} from '../../frontend/types';

const PropTypes = require('prop-types');

var React = require('react');
var DataView = require('../../frontend/DataView/DataView');
var decorate = require('../../frontend/decorate');
var {sansSerif} = require('../../frontend/Themes/Fonts');

type Props = {
  data: Map,
  inspect: (path: Array<string>, cb: () => void) => void,
  storeData: ?{
    nodes: any,
  },
};

class StoreTab extends React.Component<Props> {
  context: {
    theme: Theme,
  };
  render() {
    if (!this.props.storeData) {
      return (
        <div style={styles.container}>
          <h3 style={loadingStyle(this.context.theme)}>Loading...</h3>
        </div>
      );
    }
    return (
      <div style={styles.container}>
        <h1>Default Store</h1>
        <DataView
          data={{nodes: this.props.storeData.nodes}}
          noSort={true}
          readOnly={true}
          showMenu={false}
          startOpen={true}
          inspect={this.props.inspect}
          path={[]}
        />
      </div>
    );
  }
}

StoreTab.contextTypes = {
  theme: PropTypes.object.isRequired,
};

const loadingStyle = (theme: Theme) => ({
  textAlign: 'center',
  color: theme.base03,
});

var styles = {
  container: {
    fontFamily: sansSerif.family,
    fontSize: sansSerif.sizes.normal,
    minHeight: 0,
    flex: 1,
    overflow: 'auto',
    padding: 30,
  },
};

module.exports = decorate({
  store: 'relayStore',
  listeners: () => ['storeData'],
  props(store) {
    return {
      storeData: store.storeData,
      inspect: store.inspect.bind(store, 'relay:store'),
    };
  },
}, StoreTab);
