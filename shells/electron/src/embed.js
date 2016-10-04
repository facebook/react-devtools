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

var globalHook = require('../../../backend/installGlobalHook');
globalHook(window);
var websocketConnect = require('../../../backend/websocketConnect');
var setupHighlighter = require('../../../frontend/Highlighter/setup');

websocketConnect('ws://localhost:8097/');
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('react-devtools', agent => {
  setupHighlighter(agent);
});
