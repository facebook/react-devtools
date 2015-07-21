/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

module.exports = function () {
  var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
  });

  return {
    listen(fn) {
      backgroundPageConnection.onMessage.addListener(message => {
      });
    },
    send(data) {
      backgroundPageConnection.sendMessage({
        tabId: chrome.devtools.inspectedWindow.tabId,
        data,
      });
    },
  };
};
