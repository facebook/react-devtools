/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 * This is the chrome devtools
 *
 * 1. Devtools sets the __REACT_DEVTOOLS_GLOBAL_HOOK__ global.
 * 2. React (if present) calls .inject() with the internal renderer
 * 3. Devtools sees the renderer, and then adds this backend, along with the Agent
 *    and whatever else is needed.
 * 4. The agend then calls `.emit('react-devtools', agent)`
 *
 * Now things are hooked up.
 *
 * When devtools closes, it calls `cleanup()` to remove the listeners
 * and any overhead caused by the backend.
 */
'use strict';

import type {Hook} from './types';

var attachRenderer = require('./attachRenderer');

/**
 * Normal names
 */
module.exports = function setupBackend(hook: Hook): boolean {
  for (var id in hook._renderers) {
    hook.helpers[id] = attachRenderer(hook, id, hook._renderers[id]);
    hook.emit('renderer-attached', {id, renderer: hook._renderers[id], helpers: hook.helpers[id]});
  }

  hook.on('renderer', ({id, renderer}) => {
    hook.helpers[id] = attachRenderer(hook, id, renderer);
    hook.emit('renderer-attached', {id, renderer, helpers: hook.helpers[id]});
  });

  var shutdown = () => {
    for (var id in hook.helpers) {
      hook.helpers[id].cleanup();
    }
    hook.off('shutdown', shutdown);
  };
  hook.on('shutdown', shutdown);

  return true;
}
