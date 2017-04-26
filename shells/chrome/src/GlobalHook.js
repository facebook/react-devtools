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

// Inject a `__REACT_DEVTOOLS_GLOBAL_HOOK__` global so that React can detect that the
// devtools are installed (and skip its suggestion to install the devtools).

var installGlobalHook = require('../../../backend/installGlobalHook.js');
var installRelayHook = require('../../../plugins/Relay/installRelayHook.js');

var saveNativeValues = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeObjectCreate = Object.create;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeMap = Map;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeWeakMap = WeakMap;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeSet = Set;
`;

var js = (
  ';(' + installGlobalHook.toString() + '(window))' +
  ';(' + installRelayHook.toString() + '(window))' +
  saveNativeValues
);

// This script runs before the <head> element is created, so we add the script
// to <html> instead.
var script = document.createElement('script');
script.textContent = js;
if (document.documentElement) {
  document.documentElement.appendChild(script);
}
if (script.parentNode) {
  script.parentNode.removeChild(script);
}
