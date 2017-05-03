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
var ports = {};

chrome.runtime.onConnect.addListener(function(port) {
  var tab = null;
  var name = null;
  if (isNumeric(port.name)) {
    tab = port.name;
    name = 'devtools';
    installContentScript(+port.name);
  } else {
    tab = port.sender.tab.id;
    name = 'content-script';
  }

  if (!ports[tab]) {
    ports[tab] = {
      devtools: null,
      'content-script': null,
    };
  }
  ports[tab][name] = port;

  if (ports[tab].devtools && ports[tab]['content-script']) {
    doublePipe(ports[tab].devtools, ports[tab]['content-script']);
  }
});

function isNumeric(str: string): boolean {
  return +str + '' === str;
}

function installContentScript(tabId: number) {
  chrome.tabs.executeScript(tabId, {file: '/build/contentScript.js'}, function() {
  });
}

function doublePipe(one, two) {
  one.onMessage.addListener(lOne);
  function lOne(message) {
    // console.log('dv -> rep', message);
    two.postMessage(message);
  }
  two.onMessage.addListener(lTwo);
  function lTwo(message) {
    // console.log('rep -> dv', message);
    one.postMessage(message);
  }
  function shutdown() {
    one.onMessage.removeListener(lOne);
    two.onMessage.removeListener(lTwo);
    one.disconnect();
    two.disconnect();
  }
  one.onDisconnect.addListener(shutdown);
  two.onDisconnect.addListener(shutdown);
}

chrome.runtime.onMessage.addListener((req, sender) => {
  // This is sent from the hook content script.
  // It tells us a renderer has attached.
  if (req.hasDetectedReact && sender.tab) {
    // We use browserAction instead of pageAction because this lets us
    // display a custom default popup when React is *not* detected.
    // It is specified in the manifest.
    var reactBuildType = req.reactBuildType;
    if (sender.url.indexOf('facebook.github.io/react') !== -1) {
      // Cheat: We use the development version on the website because
      // it is better for interactive examples. However we're going
      // to get misguided bug reports if the extension highlights it
      // as using the dev version. We're just going to special case
      // our own documentation and cheat. It is acceptable to use dev
      // version of React in React docs, but not in any other case.
      reactBuildType = 'production';
    }
    chrome.browserAction.setIcon({
      tabId: sender.tab.id,
      path: {
        '16': 'icons/16-' + reactBuildType + '.png',
        '32': 'icons/32-' + reactBuildType + '.png',
        '48': 'icons/48-' + reactBuildType + '.png',
        '128': 'icons/128-' + reactBuildType + '.png',
      },
    });
    chrome.browserAction.setPopup({
      tabId: sender.tab.id,
      popup: 'popups/' + reactBuildType + '.html',
    });
  }
});
