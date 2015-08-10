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

var globalHook = require('../../../backend/GlobalHook.js');

// TODO: remove for release
var checkForOld = `
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.error("REACT DEVTOOLS ERROR\\nYou need to disable the official version of React Devtools in order to use the beta.");
}
`

var saveNativeObjectCreate = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeObjectCreate = Object.create;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeMap = Map;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeWeakMap = WeakMap;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeSet = Set;
`;

var js = (
  ';(' + globalHook.toString() + '(window))'
);

// This script runs before the <head> element is created, so we add the script
// to <html> instead.
var script = document.createElement('script');
script.textContent = checkForOld + js + saveNativeObjectCreate;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);
