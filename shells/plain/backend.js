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

var Agent = require('../../agent/Agent');
var Bridge = require('../../agent/Bridge');
var Highlighter = require('../../frontend/Highlighter/Highlighter');

var inject = require('../../agent/inject');

var wall = {
  listen(fn) {
    window.addEventListener('message', evt => fn(evt.data));
  },
  send(data) {
    window.parent.postMessage(data, '*');
  },
};

var bridge = new Bridge();
bridge.attach(wall);
var backend = new Agent(window);
backend.addBridge(bridge);

inject(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, backend);

var hl = new Highlighter(window, node => {
  backend.selectFromDOMNode(node);
});
hl.injectButton();
backend.on('highlight', data => hl.highlight(data.node, data.name));
backend.on('highlightMany', nodes => hl.highlightMany(nodes));
backend.on('hideHighlight', () => hl.hideHighlight());

