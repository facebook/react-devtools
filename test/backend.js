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

var Backend = require('../backend/Backend');
var Bridge = require('../backend/Bridge');
var Highlighter = require('../frontend/Highlighter/Highlighter');

var inject = require('../backend/inject');

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
var backend = new Backend(window);
backend.addBridge(bridge);

inject(window, backend);

var hl = new Highlighter(window, node => {
  backend.selectFromDOMNode(node);
});
hl.injectButton();
backend.on('highlight', data => hl.highlight(data.node, data.name));
backend.on('highlightMany', nodes => hl.highlightMany(nodes));
backend.on('hideHighlight', () => hl.hideHighlight());

