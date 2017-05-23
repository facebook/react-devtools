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

/* globals chrome */

// Inject a `__REACT_DEVTOOLS_GLOBAL_HOOK__` global so that React can detect that the
// devtools are installed (and skip its suggestion to install the devtools).

var installGlobalHook = require('../../../backend/installGlobalHook.js');
var installRelayHook = require('../../../plugins/Relay/installRelayHook.js');

// We want to detect when a renderer attaches, and notify the "background
// page" (which is shared between tabs and can highlight the React icon).
// Currently we are in "content script" context, so we can't listen
// to the hook directly (it will be injected directly into the page).
// So instead, the hook will use postMessage() to pass message to us here.
// And when this happens, we'll send a message to the "background page".
window.addEventListener('message', function(evt) {
  if (evt.source === window && evt.data && evt.data.source === 'react-devtools-detector') {
    chrome.runtime.sendMessage({
      hasDetectedReact: true,
      reactBuildType: evt.data.reactBuildType,
    });
  }
});

var detectReact = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('renderer', function(evt) {
  window.postMessage({
    source: 'react-devtools-detector',
    reactBuildType: evt.reactBuildType,
  }, '*');
});
`;
var saveNativeValues = `
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeObjectCreate = Object.create;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeMap = Map;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeWeakMap = WeakMap;
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeSet = Set;
`;

var js = (
  ';(' + installGlobalHook.toString() + '(window))' +
  ';(' + installRelayHook.toString() + '(window))' +
  saveNativeValues +
  detectReact
);

// This script runs before the <head> element is created, so we add the script
// to <html> instead.
var script = document.createElement('script');
script.textContent = js;
if (document.documentElement !== null) {
  document.documentElement.appendChild(script);
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
}

