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

type Panel = { // eslint-disable-line no-unused-vars
  onShown: {
    addListener: (cb: (window: Object) => void) => void,
  }
};

declare var chrome: {
  devtools: {
    panels: {
      create: (title: string, icon: string, filename: string, cb: (panel: Panel) => void) => void,
    },
    inspectedWindow: {
      eval: (code: string, cb?: (res: any, err: ?Object) => any) => void,
    },
  },
};

chrome.devtools.inspectedWindow.eval(`!!(
  Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__._renderers).length || window.React || (window.require && (require('react') || require('React')))
)`, function (pageHasReact, err) {
  if (!pageHasReact) {
    return;
  }

  chrome.devtools.panels.create('React', '', 'panel.html', function (panel) {
    panel.onShown.addListener(function (window) {
      // when the user switches to the panel, check for an elements tab
      // selection
      window.panel.getNewSelection();
    });
  });
});

