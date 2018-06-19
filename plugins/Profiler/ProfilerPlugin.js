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

var ProfilerStore = require('./ProfilerStore');
var ProfilerTab = require('./views/ProfilerTab');
var StoreWrapper = provideStore('profilerStore');

class ProfilerPlugin {
  hasProfiler: bool;
  bridge: Bridge;
  store: Store;
  profilerStore: ProfilerStore;

  constructor(store: Store, bridge: Bridge, refresh: () => void) {
    this.bridge = bridge;
    this.store = store;
    this.hasProfiler = false;
    this.profilerStore = new ProfilerStore(bridge, store);

    // Wait until roots have been initialized...
    // The 1s delay follows the precedent used by the Relay plug-in.
    setTimeout(() => {
      bridge.call('profiler:check', [], hasProfiler => {
        this.hasProfiler = hasProfiler;
        if (hasProfiler) {
          refresh();
        }
      });
    }, 1000);
  }

  panes(): Array<(node: Object, id: string) => React$Element<any>> {
    return [];
  }

  teardown() {
  }

  tabs(): ?{[key: string]: () => React$Element<any>} {
    if (!this.hasProfiler) {
      return null;
    }

    return {
      Profiler: () => (
        <StoreWrapper store={this.profilerStore}>
          {() => <ProfilerTab />}
        </StoreWrapper>
      ),
    };
  }
}

module.exports = ProfilerPlugin;
