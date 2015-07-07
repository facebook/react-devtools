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

/*::
type Port = {
  name: string,
  sender: {
    tab: {
      id: number,
    },
  },
};

declare var chrome: {
  tabs: {
    executeScript: (tabId: number, options: Object, fn: () => void) => void,
  },
  runtime: {
    onConnect: {
      addListener: (fn: (port: Port) => void) => void,
    },
  },
};
*/

var ports = {};

chrome.runtime.onConnect.addListener(function (port) {
  var tab = null;
  var name = null;
  if (isNumeric(port.name)) {
    tab = port.name;
    name = 'devtools';
    installReporter(+port.name);
  } else {
    tab = port.sender.tab.id;
    name = 'reporter';
  }

  if (!ports[tab]) {
    ports[tab] = {
      devtools: null,
      reporter: null,
    };
  }
  ports[tab][name] = port;

  if (ports[tab]['devtools'] && ports[tab]['reporter']) {
    doublePipe(ports[tab]['devtools'], ports[tab]['reporter']);
  }
});

function isNumeric(str/*: string*/)/*: boolean*/ {
  return +str + '' === str;
}

function installReporter(tabId/*: number*/) {
  chrome.tabs.executeScript(tabId, {file: 'reporter.js'}, function () {
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

