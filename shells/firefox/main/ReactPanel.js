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

const { Panel } = require('dev/panel.js');
const { Class } = require('sdk/core/heritage');

// panel
// for docs, see
// https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/dev_panel
const ReactPanel = Class({
  extends: Panel,
  label: 'React',
  tooltip: 'Debug & Develop React Apps',
  icon: './icon.png',
  url: './panel.html',
  setup(options) {
    // this.debuggee = options.debuggee;
  },
  dispose() {
    // this.debuggee = null;
  },
  onReady() {
    var tabs = require('sdk/tabs');
    var worker = tabs.activeTab.attach({
      contentScriptFile: 'build/contentScript.js',
    });

    const { MessageChannel } = require('sdk/messaging');
    const channel = new MessageChannel();
    const addonSide = channel.port1;
    const panelSide = channel.port2;

    addonSide.onmessage = function (evt) {
      worker.port.emit('message', evt.data);
    };
    worker.port.on('message', function (data) {
      addonSide.postMessage(data);
    });
    worker.port.on('hasReact', function (hasReact) {
      addonSide.postMessage({hasReact});
      /*
      addonSide.postMessage({
        type: 'event',
        evt: 'hasReact',
        data: hasReact,
      });
      */
    });
    worker.on('error', function (error) {
      console.log('More Error!!', error);
    });
    worker.port.on('error', function (error) {
      console.log('Error!!', error);
    });

    this.postMessage('port', [panelSide]);
    console.log('Panel ready');
  },
});

exports.ReactPanel = ReactPanel;
