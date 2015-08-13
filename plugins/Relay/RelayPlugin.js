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

import type Bridge from '../../agent/Bridge';
import type Store from '../../frontend/Store';

var React = require('react');
var provideStore = require('../../frontend/provideStore');

var RelayStore = require('./Store');
var QueriesTab = require('./QueriesTab');

var StoreWrapper = provideStore('relayStore');

class RelayPlugin {
  hasRelay: bool;
  bridge: Bridge;
  store: Store;
  relayStore: RelayStore;

  constructor(store: Store, bridge: Bridge, refresh: () => void) {
    this.bridge = bridge;
    this.store = store;
    this.hasRelay = false;
    this.relayStore = new RelayStore(bridge);
    bridge.call('relay:check', [], hasRelay => {
      this.hasRelay = hasRelay;
      refresh();
    });
  }

  teardown() {
  }

  tabs(): ?{[key: string]: () => ReactElement} {
    if (!this.hasRelay) {
      return;
    }
    return {
      Relay: () => {
        return (
          <StoreWrapper store={this.relayStore}>
            {() => <QueriesTab />}
          </StoreWrapper>
        );
      },
    };
  }
}

module.exports = RelayPlugin;
