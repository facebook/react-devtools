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
const { PanelVisibilityListener } = require('./PanelVisibilityListener');

const panelVisibilityListener = new PanelVisibilityListener();

// panel
// for docs, see
// https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/dev_panel
const ReactPanel = Class({
  extends: Panel,
  label: 'React',
  tooltip: 'Debug & Develop React Apps',
  icon: './tool-react.png',
  invertIconForLightTheme: true,
  url: './panel.html',
  setup(options) {
    // Assume we're visible by default because PanelVisibilityListener
    // does not notify us about the initial value.
    this._visible = true;
    panelVisibilityListener.addPanel(this);
  },
  dispose() {
    panelVisibilityListener.removePanel(this);
    this._addonSide = null;
  },
  onReady() {
    const tabs = require('sdk/tabs');
    let worker = makeWorker();

    const { MessageChannel } = require('sdk/messaging');
    const channel = new MessageChannel();
    const addonSide = channel.port1;
    const panelSide = channel.port2;

    function makeWorker() {
      const tmpWorker = tabs.activeTab.attach({
        contentScriptFile: 'build/contentScript.js',
      });
      tmpWorker.port.on('message', function(data) {
        addonSide.postMessage(data);
      });
      tmpWorker.port.on('hasReact', function(hasReact) {
        metaAddonSide.postMessage({type: 'hasReact', val: hasReact});
      });
      tmpWorker.port.on('unload', function() {
        metaAddonSide.postMessage('unload');
      });
      tmpWorker.on('error', function(error) {
        console.log('More Error!!', error);
      });
      tmpWorker.port.on('error', function(error) {
        console.log('Error!!', error);
      });
      return tmpWorker;
    }

    addonSide.onmessage = function(evt) {
      worker.port.emit('message', evt.data);
    };

    const metaChannel = new MessageChannel();
    const metaAddonSide = metaChannel.port1;
    const metaPanelSide = metaChannel.port2;

    tabs.activeTab.on('pageshow', function() {
      metaAddonSide.postMessage('show');
      worker = makeWorker();
    });

    this.postMessage('port', [panelSide, metaPanelSide]);
    this._addonSide = addonSide;

    // Now that we can post messages, rexecute onShow()/onHide() handlers
    // that might have been called before onReady().
    if (this._visible) {
      this.onShow();
    } else {
      this.onHide();
    }
  },
  onShow() {
    this._visible = true;
    if (this._addonSide) {
      this._addonSide.postMessage({type: 'resume'});
    }
  },
  onHide() {
    this._visible = false;
    if (this._addonSide) {
      this._addonSide.postMessage({type: 'pause'});
    }
  },
});

exports.ReactPanel = ReactPanel;
