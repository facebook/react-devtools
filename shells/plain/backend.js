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
var ProfileCollector = require('../../plugins/Profiler/ProfileCollector');
var TraceUpdatesBackendManager = require('../../plugins/TraceUpdates/TraceUpdatesBackendManager');
var Bridge = require('../../agent/Bridge');
var setupHighlighter = require('../../frontend/Highlighter/setup');
var setupHooksInspector = require('../../plugins/HooksInspector/backend').default;
var setupProfiler = require('../../plugins/Profiler/backend');
var inject = require('../../agent/inject');

var wall = {
  listen(fn) {
    window.addEventListener('message', evt => {
      if (evt.source === window.parent) {
        fn(evt.data);
      }
    });
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
setupProfiler(bridge, agent, window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
setupHooksInspector(bridge, agent);

ProfileCollector.init(agent);
TraceUpdatesBackendManager.init(agent);
