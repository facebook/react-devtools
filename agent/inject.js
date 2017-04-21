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

import type {Hook} from '../backend/types';
import type Agent from './Agent';

var setupBackend = require('../backend/backend');

module.exports = function(hook: Hook, agent: Agent) {
  var subs = [
    hook.sub('renderer-attached', ({id, renderer, helpers}) => {
      agent.setReactInternals(id, helpers);
      helpers.walkTree(agent.onMounted.bind(agent, id), agent.addRoot.bind(agent, id));
    }),
    hook.sub('root', ({renderer, internalInstance}) => agent.addRoot(renderer, internalInstance)),
    hook.sub('mount', ({renderer, internalInstance, data}) => agent.onMounted(renderer, internalInstance, data)),
    hook.sub('update', ({renderer, internalInstance, data}) => agent.onUpdated(internalInstance, data)),
    hook.sub('unmount', ({renderer, internalInstance}) => agent.onUnmounted(internalInstance)),
  ];

  var success = setupBackend(hook);
  if (!success) {
    return;
  }

  hook.emit('react-devtools', agent);
  hook.reactDevtoolsAgent = agent;
  agent.on('shutdown', () => {
    subs.forEach(fn => fn());
    hook.reactDevtoolsAgent = null;
  });
};
