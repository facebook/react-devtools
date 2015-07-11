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

var source = `
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
      addStartupListener: function (fn) {
        this._startupListeners.push(fn);
      },
      removeStartupListener: function (fn) {
        var ix = this._startupListeners.indexOf(fn);
        if (ix !== -1) {
          this._startupListeners.splice(ix, 1);
        }
      },
      _startupListeners: [],
      getReactHandleFromNative: null,
      getNativeFromHandle: null,
      injectDevTools: null,
    },
  });
`;

var script = document.createElement('script');
script.textContent = source;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);

