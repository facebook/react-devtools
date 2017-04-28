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

/* global chrome */

function detect() {
  setTimeout(() => {
    const selector = '[data-reactroot], [data-reactid]';
    const runningReact = !!document.querySelector(selector);
    if (runningReact) {
      chrome.runtime.sendMessage({
        runningReact: true,
      });
    }
  }, 100);
}

detect();
