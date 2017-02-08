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

type ConnectOptions = {
  host?: string,
  port?: number,
  resolveRNStyle?: (style: number) => ?Object,
};

var globalHook = require('../../../backend/installGlobalHook');
var websocketConnect = require('../../../backend/websocketConnect');

globalHook(window);
if (window.document) {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('react-devtools', agent => {
    var setupHighlighter = require('../../../frontend/Highlighter/setup');
    setupHighlighter(agent);
  });
}

function connectToDevTools(options: ?ConnectOptions) {
  var {
    host = 'localhost',
    port = 8097,
    resolveRNStyle = null,
  } = options || {};
  websocketConnect(host, port, resolveRNStyle);
}

module.exports = {
  connectToDevTools,
};
