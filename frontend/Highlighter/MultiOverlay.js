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

var nodePos = require('./nodePos');
var setStyle = require('./setStyle');

class MultiOverlay {
  constructor(window) {
    this.win = window;
    var doc = window.document;
    this.container = doc.createElement('div');
    doc.body.appendChild(this.container);
  }

  highlightMany(nodes) {
    this.container.innerHTML = '';
    nodes.forEach(node => {
      var div = this.win.document.createElement('div');
      var pos = nodePos(node);
      setStyle(div, {
        top: pos.top + 'px',
        left: pos.left + 'px',
        width: node.offsetWidth + 'px',
        height: node.offsetHeight + 'px',
        border: '2px dotted rgba(200, 100, 100, .8)',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(200, 100, 100, .2)',
        position: 'absolute',
        zIndex: 100000,
        pointerEvents: 'none',
      });
      this.container.appendChild(div);
    });
  }

  remove() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

module.exports = MultiOverlay;
