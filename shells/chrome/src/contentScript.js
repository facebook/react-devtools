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

/* global chrome */

// proxy from main page to devtools (via the background page)
var port = chrome.runtime.connect({
  name: 'content-script',
});

port.onMessage.addListener(handleMessageFromDevtools);
port.onDisconnect.addListener(handleDisconnect);
window.addEventListener('message', handleMessageFromPage);

window.postMessage({
  source: 'react-devtools-content-script',
  hello: true,
}, '*');

function handleMessageFromDevtools(message) {
  window.postMessage({
    source: 'react-devtools-content-script',
    payload: message,
  }, '*');
}

function handleMessageFromPage(evt) {
  if (evt.source === window && evt.data && evt.data.source === 'react-devtools-bridge') {
    // console.log('page -> rep -> dev', evt.data);
    port.postMessage(evt.data.payload);
  }
}

function handleDisconnect() {
  window.removeEventListener('message', handleMessageFromPage);
  window.postMessage({
    source: 'react-devtools-content-script',
    payload: {
      type: 'event',
      evt: 'shutdown',
    },
  }, '*');
}
