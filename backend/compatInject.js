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

module.exports = function compatInject(window: Object) {
  // 0.13
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
    value: {
      inject: function(runtime) {
        this._reactRuntime = runtime;
      },
      getSelectedInstance: null,
      Overlay: null,
    }
  });

  // vNext
  Object.defineProperty(window, '__REACT_DEVTOOLS_BACKEND__', {
    value: {
      getReactHandleFromNative: null,
      getNativeFromHandle: null,
      attachDevTools: null,
    },
  });
}

