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

import type * as Backend from './Backend';
import makeCompat from './makeCompat';

module.exports = function (window: Object, backend: Backend): boolean {
  var hook = window.__REACT_DEVTOOLS_BACKEND__;
  if (!hook) {
    return false;
  }
  if (!hook.injectDevTools) {
    var success = makeCompat(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, hook);
    if (!success) {
      return false;
    }
  }

  backend.setReactInternals({
    getNativeFromReactElement: hook.getNativeFromReactElement,
    getReactElementFromNative: hook.getReactElementFromNative,
    removeDevtools: hook.removeDevtools,
  });
  hook.injectDevTools(backend);
  hook.backend = backend;
  return true;
}


