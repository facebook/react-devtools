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

const React = require('react');
const provideStore = require('../../frontend/provideStore');
const ProfilerStore = require('./ProfilerStore');
const ProfilerTab = require('./views/ProfilerTab').default;
const StoreWrapper = provideStore('profilerStore');

class ProfilerPlugin {
  bridge: Bridge;
  profilingIsSupported: boolean;
  store: Store;
  profilerStore: ProfilerStore;

  constructor(store: Store, bridge: Bridge, refresh: () => void) {
    this.bridge = bridge;
    this.store = store;
    this.profilingIsSupported = false;
    this.profilerStore = new ProfilerStore(bridge, store);

    // The Profiler backend will notify us if/when it detects a profiling capable React build.
    // This is an async check, because roots may not have been registered yet at this time.
    bridge.onCall('profiler:update', (profilingIsSupported: boolean) => {
      if (this.profilingIsSupported !== profilingIsSupported) {
        this.profilingIsSupported = profilingIsSupported;
        refresh();
      }
    });
  }

  panes(): Array<(node: Object, id: string) => React$Element<any>> {
    return [];
  }

  teardown() {
  }

  tabs(): ?{[key: string]: () => React$Element<any>} {
    if (!this.profilingIsSupported) {
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
