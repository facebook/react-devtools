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

type Listenable = {
  addListener: (fn: (message: Object) => void) => void,
}

type Port = { // eslint-disable-line no-unused-vars
  disconnect: () => void,
  onMessage: Listenable,
  onDisconnect: Listenable,
  postMessage: (data: Object) => void,
};

declare var chrome: {
  devtools: {
    network: {
      onNavigated: {
        addListener: (fn: () => void) => void,
      },
    },
    inspectedWindow: {
      eval: (code: string, cb?: (res: any, err: ?Object) => any) => void,
      tabId: number,
    },
  },
  runtime: {
    connect: (config: Object) => Port,
  },
};

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
    payload: message
  }, '*');
}

function handleMessageFromPage(evt) {
  if (evt.data && evt.data.source === 'react-devtools-bridge') {
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

