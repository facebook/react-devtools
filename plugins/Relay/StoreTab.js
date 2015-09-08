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

var React = require('react');
var DataView = require('../../frontend/DataView/DataView');
var decorate = require('../../frontend/decorate');

class StoreTab {
  props: {
    data: Map,
    inspect: (path: Array<string>, cb: () => void) => void,
  };
  render(): ReactElement {
    if (!this.props.storeData) {
      return (
        <div style={styles.container}>
          <h3 style={styles.loading}>Loading...</h3>
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

var styles = {
  container: {
    fontFamily: 'Menlo, sans-serif',
    minHeight: 0,
    flex: 1,
    overflow: 'auto',
    fontSize: 12,
    padding: 30,
  },
  loading: {
    textAlign: 'center',
    color: '#aaa',
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
