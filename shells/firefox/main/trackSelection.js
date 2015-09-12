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

const { Cu } = require('chrome');
const { gDevTools } = Cu.import('resource:///modules/devtools/gDevTools.jsm', {});

/**
 * Whenever the devtools inspector panel selection changes, pass that node to
 * __REACT_DEVTOOLS_GLOBAL_HOOK__.$0
 */
function trackSelection() {
  var wc;
  gDevTools.on('webconsole-init', function(_, toolbox, panelFrame) {
    toolbox.once('webconsole-ready', (eid, panel) => {
      wc = panel;
    });
  });

  gDevTools.on('inspector-init', (_, toolbox, panelFrame) => {
    toolbox.once('inspector-ready', (eid, panel) => {
      panel.selection.on('new-node-front', (ev, val, reason) => {
        passSelectedNode(wc.hud.ui.jsterm);
      });
    });
  });
}

function passSelectedNode(jsterm) {
  const inspectorSelection = jsterm.hud.owner.getInspectorSelection();
  let selectedNodeActor = null;
  if (inspectorSelection && inspectorSelection.nodeFront) {
    selectedNodeActor = inspectorSelection.nodeFront.actorID;
    jsterm.requestEvaluation('__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent.selectFromDOMNode($0, true)', {
      selectedNodeActor: selectedNodeActor,
    });
  }
}

exports.trackSelection = trackSelection;
