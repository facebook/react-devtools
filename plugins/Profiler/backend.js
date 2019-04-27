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
import type Agent from '../../agent/Agent';

const emptyFunction = () => {};

module.exports = (bridge: Bridge, agent: Agent, hook: Object) => {
  const checkIfProfilingIsSupported = () => {
    let profilingIsSupported = false;

    // Feature detection for profiling mode.
    // The presence of an "treeBaseDuration" field signifies:
    // 1) This is a new enough version of React (e.g. > 16.4 which was the initial profiling release)
    // 2) This is a profiling capable bundle (e.g. DEV or PROFILING)
    agent.roots.forEach((rootId: string) => {
      const root = agent.internalInstancesById.get(rootId);
      if ((root: any).hasOwnProperty('treeBaseDuration')) {
        profilingIsSupported = true;
      }
    });

    bridge.call('profiler:update', [profilingIsSupported], emptyFunction);
  };

  // Wait for roots to be registered.
  // They might not yet exist at the time the plugin is initialized.
  // Also while the first root(s) may not be capable of profiling, later ones might.
  agent.on('root', checkIfProfilingIsSupported);
  agent.on('rootUnmounted', checkIfProfilingIsSupported);

  // Check once in case some roots have already been registered:
  checkIfProfilingIsSupported();
};
