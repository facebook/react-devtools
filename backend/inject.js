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

import type * as Agent from './Agent';
import type {DataType, OpaqueReactElement, NativeType} from './types';

var backend = require('./backend');

// This type is entirely opaque to the backend.
type OpaqueReactElement = {
  _rootNodeID: string,
};

type Agent = {
  addRoot: (el: OpaqueReactElement) => void,
  onMounted: (el: OpaqueReactElement, data: DataType) => void,
  onUpdated: (el: OpaqueReactElement, data: DataType) => void,
  onUnmounted: (el: OpaqueReactElement) => void,
};

module.exports = function (window: Object, agent: Agent): boolean {
  var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    return false;
  }

  var subs = [
    hook.sub('renderer-attached', ({id, renderer, helpers}) => {
      // TODO(jared): agent can't handle multiple renderers at the moment
      agent.setReactInternals(helpers);
      helpers.walkTree(agent.onMounted.bind(agent), agent.addRoot.bind(agent));
    }),
    hook.sub('root', ({renderer, element}) => agent.addRoot(element)),
    hook.sub('mount', ({renderer, element, data}) => agent.onMounted(element, data)),
    hook.sub('update', ({renderer, element, data}) => agent.onUpdated(element, data)),
    hook.sub('unmount', ({renderer, element}) => agent.onUnmounted(element)),
  ];

  var success = backend(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, hook);
  if (!success) {
    return false;
  }

  // hook.attachDevTools(backend);
  // hook.backend = backend;
  return subs;
}
