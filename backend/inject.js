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
import shim from './shim';

module.exports = function (window: Object, backend: Backend): boolean {
  var hook = window.__REACT_DEVTOOLS_BACKEND__;
  if (!hook) {
    return false;
  }
  if (!hook.attachDevTools) {
    var success = shim(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, hook);
    if (!success) {
      return false;
    }
  }

  hook.attachDevTools(backend);
  hook.backend = backend;
  return true;
}


