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

var assign = require('object-assign');

import type {DOMNode} from '../types';

class MultiOverlay {
  win: Object;
  container: DOMNode;
  _currentNodes: ?Array<DOMNode>;

  constructor(window: Object) {
    this.win = window;
    var doc = window.document;
    this.container = doc.createElement('div');
    doc.body.appendChild(this.container);
    this._currentNodes = null;
  }

  highlightMany(nodes: Array<DOMNode>) {
    this._currentNodes = nodes;
    this.container.innerHTML = '';

    nodes.forEach(node => {
      var div = this.win.document.createElement('div');
      if (typeof node.getBoundingClientRect !== 'function') {
        return;
      }
      var box = node.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) {
        return;
      }
      assign(div.style, {
        top: box.top + 'px',
        left: box.left + 'px',
        width: box.width + 'px',
        height: box.height + 'px',
        border: '2px dotted rgba(200, 100, 100, .8)',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(200, 100, 100, .2)',
        position: 'fixed',
        zIndex: 10000000,
        pointerEvents: 'none',
      });
      this.container.appendChild(div);
    });
  }

  refresh() {
    if (this._currentNodes) {
      this.highlightMany(this._currentNodes);
    }
  }

  remove() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this._currentNodes = null;
    }
  }
}

module.exports = MultiOverlay;
