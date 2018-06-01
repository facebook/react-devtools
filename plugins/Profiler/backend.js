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

module.exports = (bridge: Bridge, agent: Agent, hook: Object) => {
  bridge.onCall('profiler:check', () => {
    let shouldEnable = false;

    // Feature detection for profiling mode.
    // The presence of an "actualDuration" field signifies:
    // 1) This is a new enough version of React
    // 2) This is a profiling capable bundle (e.g. DEV or PROFILING)
    agent.roots.forEach(id => {
      const root = agent.internalInstancesById.get(id);
      if ((root: any).hasOwnProperty('actualDuration')) {
        shouldEnable = true;
      }
    });

    return shouldEnable;
  });
};
