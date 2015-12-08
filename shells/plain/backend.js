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
var BananaSlugObserver = require('../../plugins/BananaSlug/BananaSlugObserver');
var Bridge = require('../../agent/Bridge');

var setupHighlighter = require('../../frontend/Highlighter/setup');
var setupRelay = require('../../plugins/Relay/backend');
var inject = require('../../agent/inject');

var wall = {
  listen(fn) {
    window.addEventListener('message', evt => fn(evt.data));
  },
  send(data) {
    window.parent.postMessage(data, '*');
  },
};

var bridge = new Bridge(wall);
var agent = new Agent(window);
agent.addBridge(bridge);

inject(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent);

setupHighlighter(agent);
setupRelay(bridge, agent, window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

BananaSlugObserver.observe(agent);


