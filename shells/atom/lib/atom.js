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

var AtomView = require('./atom-view')
var CompositeDisposable = require('atom').CompositeDisposable;

var isVisible = false;

module.exports = Atom = {
  atomView: null,
  modalPanel: null,
  subscriptions: null,

  activate: function (state) {
    this.atomView = new AtomView(state.atomViewState)

    //  Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    //  Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {'atom:toggle': this.toggle.bind(this)}))
  },

  deactivate: function () {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomView.destroy();
  },

  serialize: function () {
    return {
      atomViewState: this.atomView.serialize()
    }
  },

  toggle: function () {
    console.log('React Devtools was toggled!')

    if (isVisible) {
      isVisible = false
      this.modalPanel.destroy()
      this.atomView.disconnect()
    } else {
      isVisible = true
      this.modalPanel = atom.workspace.addBottomPanel({item: this.atomView.getElement()}) // , visible: false);
      this.atomView.connect()
    }
  },
};
