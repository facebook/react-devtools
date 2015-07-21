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

require('../../electron/build/panel-el');
var Panel = window.RNPanel;
var React = window.RNReact;
var connect = require('./node');
module.exports = ReactNativeView;

function ReactNativeView(serializedState) {
  // Create root element
  this.element = document.createElement('div');
  this.element.classList.add('atom');
  this.element.innerHTML = 'Loading...';
  setStyle(this.element, {
    display: 'flex',
    backgroundColor: 'white',
    fontFamily: 'sans-serif',
    height: '500px',
  });

}

function setStyle(node, style) {
  for (var name in style) {
    node.style[name] = style[name];
  }
}

ReactNativeView.prototype = {
  connect: function () {
    var self = this;
    connect(function (wall) {
      self.element.innerHTML = '';
      self.iframe = document.createElement('iframe');
      self.iframe.style.flex = 1;
      self.iframe.style.border = 'none';
      self.element.appendChild(self.iframe);
      var el = self.iframe.contentDocument.body;
      setStyle(el, {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
      });
      self.wall = wall;
      React.render(React.createElement(Panel, {wall: wall, win: self.iframe.contentWindow}), el);
    });
  },

  disconnect: function () {
    this.wall.disconnect();
  },

  // Returns an object that can be retrieved when package is activated
  serialize: function () {
  },

  // Tear down any state and detach
  destroy: function () {
    return this.element.remove();
  },

  getElement: function () {
    return this.element;
  },
};
