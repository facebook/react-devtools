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

const {Class} = require('sdk/core/heritage');
const {Disposable} = require('sdk/core/disposable');
const {emit} = require('sdk/event/core');
const {EventTarget} = require('sdk/event/target');
const {Cu} = require('chrome');
const {gDevTools} = Cu.import('resource://devtools/client/framework/gDevTools.jsm', {});

const toolboxes = new WeakMap();
const toolboxFor = target => toolboxes.get(target);

const ToolboxListener = Class({
  extends: Disposable,
  implements: [EventTarget],

  initialize() {
    this.onToolboxReady = this.onToolboxReady.bind(this);
    this.onToolboxDestroyed = this.onToolboxDestroyed.bind(this);
    this.onSelect = this.onSelect.bind(this);

    gDevTools.on('toolbox-ready', this.onToolboxReady);
    gDevTools.on('toolbox-destroyed', this.onToolboxDestroyed);
  },

  dispose() {
    for (let toolbox of toolboxes.values()) { // eslint-disable-line prefer-const
      toolbox.off('select', this.onSelect);
    }
    gDevTools.off('toolbox-ready', this.onToolboxReady);
    gDevTools.off('toolbox-destroyed', this.onToolboxDestroyed);
  },

  onToolboxReady(evt, toolbox) {
    toolboxes.set(toolbox.target, toolbox);
    toolbox.on('select', this.onSelect);
  },

  onToolboxDestroyed(evt, target) {
    const toolbox = toolboxFor(target);
    if (toolbox) {
      toolbox.off('select', this.onSelect);
    }
  },

  onSelect(evt, id) {
    emit(this, 'panel-selected', id);
  },
});

const toolboxListener = new ToolboxListener();

const PanelVisibilityListener = Class({
  implements: [Disposable],

  initialize() {
    this.panels = new Set();
    this.visiblePanels = new WeakSet();
    this.onPanelSelected = this.onPanelSelected.bind(this);
    toolboxListener.on('panel-selected', this.onPanelSelected);
  },

  dispose() {
    toolboxListener.off('panel-selected', this.onPanelSelected);
    this.panels.clear();
    this.visiblePanels = null;
  },

  onPanelSelected(id) {
    for (let panel of this.panels) { // eslint-disable-line prefer-const
      if (id == panel.id) {
        this.visiblePanels.add(panel);
        emit(panel, 'show');
      } else if (this.visiblePanels.has(panel)) {
        this.visiblePanels.delete(panel);
        emit(panel, 'hide');
      }
    }
  },

  addPanel(panel) {
    this.panels.add(panel);
  },

  removePanel(panel) {
    this.panels.delete(panel);
  },
});

exports.PanelVisibilityListener = PanelVisibilityListener;
