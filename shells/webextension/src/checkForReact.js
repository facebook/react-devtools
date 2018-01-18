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

module.exports = function(done: (pageHasReact: boolean) => void) {
  chrome.devtools.inspectedWindow.eval(`!!(
    (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__._renderers).length) || window.React || (window.require && (require('react') || require('React')))
  )`, function(pageHasReact, err) {
    done(pageHasReact);
  });
};
