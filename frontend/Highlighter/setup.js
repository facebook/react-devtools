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

var Highlighter = require('./Highlighter');

import type * as Agent from '../../agent/Agent';

module.exports = function setup(agent: Agent, win?: Object) {
  var hl = new Highlighter(win || window, node => {
    agent.selectFromDOMNode(node);
  });
  agent.on('highlight', data => hl.highlight(data.node, data.name));
  agent.on('highlightMany', nodes => hl.highlightMany(nodes));
  agent.on('hideHighlight', () => hl.hideHighlight());
  agent.on('startInspecting', () => hl.startInspecting());
  agent.on('stopInspecting', () => hl.stopInspecting());
  agent.on('shutdown', () => {
    hl.remove();
  });
};

