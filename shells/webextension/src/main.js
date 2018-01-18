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

var panelCreated = false;

function createPanelIfReactLoaded() {
  if (panelCreated) {
    return;
  }
  chrome.devtools.inspectedWindow.eval(`!!(
    (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__._renderers).length) || window.React
  )`, function(pageHasReact, err) {
    if (!pageHasReact || panelCreated) {
      return;
    }

    clearInterval(loadCheckInterval);
    panelCreated = true;
    chrome.devtools.panels.create('React', '', 'panel.html', function(panel) {
      var reactPanel = null;
      panel.onShown.addListener(function(window) {
        // when the user switches to the panel, check for an elements tab
        // selection
        window.panel.getNewSelection();
        reactPanel = window.panel;
        reactPanel.resumeTransfer();
      });
      panel.onHidden.addListener(function() {
        if (reactPanel) {
          reactPanel.hideHighlight();
          reactPanel.pauseTransfer();
        }
      });
    });
  });
}

chrome.devtools.network.onNavigated.addListener(function() {
  createPanelIfReactLoaded();
});

// Check to see if React has loaded once per second in case React is added
// after page load
var loadCheckInterval = setInterval(function() {
  createPanelIfReactLoaded();
}, 1000);

createPanelIfReactLoaded();
