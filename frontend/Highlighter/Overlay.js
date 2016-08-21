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

class Overlay {
  win: Object;
  container: DOMNode;
  node: DOMNode;
  border: DOMNode;
  padding: DOMNode;
  content: DOMNode;
  tip: DOMNode;
  nameSpan: DOMNode;
  dimSpan: DOMNode;

  constructor(window: Object) {
    var doc = window.document;
    this.win = window;
    this.container = doc.createElement('div');
    this.node = doc.createElement('div');
    this.border = doc.createElement('div');
    this.padding = doc.createElement('div');
    this.content = doc.createElement('div');

    this.border.style.borderColor = overlayStyles.border;
    this.padding.style.borderColor = overlayStyles.padding;
    this.content.style.backgroundColor = overlayStyles.background;

    assign(this.node.style, {
      borderColor: overlayStyles.margin,
      pointerEvents: 'none',
      position: 'fixed',
    });

    this.tip = doc.createElement('div');
    assign(this.tip.style, {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      fontFamily: 'Menlo, Consolas, monospace',
      color: 'orange',
      padding: '6px 8px',
      position: 'fixed',
      fontSize: '11px',
      borderRadius: '2px',
    });

    this.nameSpan = doc.createElement('span');
    this.tip.appendChild(this.nameSpan);
    assign(this.nameSpan.style, {
      color:   '#ce75c3',
      paddingRight: '5px',
      fontWeight: 'bold',
      borderRight: '1px solid #666',
    });
    this.dimSpan = doc.createElement('span');
    this.tip.appendChild(this.dimSpan);
    assign(this.dimSpan.style, {
      paddingLeft: '5px',
      color: '#CCC',
    });

    this.container.style.zIndex = 10000000;
    this.node.style.zIndex = 10000000;
    this.tip.style.zIndex = 10000000;
    this.container.appendChild(this.node);
    this.container.appendChild(this.tip);
    this.node.appendChild(this.border);
    this.border.appendChild(this.padding);
    this.padding.appendChild(this.content);
    doc.body.appendChild(this.container);
  }

  remove() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  inspect(node: DOMNode, name?: ?string) {
    // We can't get the size of text nodes or comment nodes. React as of v15
    // heavily uses comment nodes to delimit text.
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    var box = node.getBoundingClientRect();
    var dims = getElementDimensions(node);

    boxWrap(dims, 'margin', this.node);
    boxWrap(dims, 'border', this.border);
    boxWrap(dims, 'padding', this.padding);

    assign(this.content.style, {
      height: box.height - dims.borderTop - dims.borderBottom - dims.paddingTop - dims.paddingBottom + 'px',
      width: box.width - dims.borderLeft - dims.borderRight - dims.paddingLeft - dims.paddingRight + 'px',
    });

    assign(this.node.style, {
      top: box.top - dims.marginTop + 'px',
      left: box.left - dims.marginLeft + 'px',
    });

    this.nameSpan.textContent = (name || node.nodeName.toLowerCase());
    this.dimSpan.textContent = box.width + ' × ' + box.height;

    var tipPos = findTipPos({
      top: box.top - dims.marginTop,
      left: box.left - dims.marginLeft,
      height: box.height + dims.marginTop + dims.marginBottom,
      width: box.width + dims.marginLeft + dims.marginRight,
    }, this.win);
    assign(this.tip.style, tipPos);
  }
}

function findTipPos(dims, win) {
  var tipHeight = 20;
  var margin = 5;
  var top;
  if (dims.top + dims.height + tipHeight <= win.innerHeight) {
    if (dims.top + dims.height < 0) {
      top = margin;
    } else {
      top = dims.top + dims.height + margin;
    }
  } else if (dims.top - tipHeight <= win.innerHeight) {
    if (dims.top - tipHeight - margin < margin) {
      top = margin;
    } else {
      top = dims.top - tipHeight - margin;
    }
  } else {
    top = win.innerHeight - tipHeight - margin;
  }

  top += 'px';

  if (dims.left < 0) {
    return {top, left: margin};
  }
  if (dims.left + 200 > win.innerWidth) {
    return {top, right: margin};
  }
  return {top, left: dims.left + margin + 'px'};
}

function getElementDimensions(element) {
  var calculatedStyle = window.getComputedStyle(element);

  return {
    borderLeft: +calculatedStyle.borderLeftWidth.match(/[0-9]*/)[0],
    borderRight: +calculatedStyle.borderRightWidth.match(/[0-9]*/)[0],
    borderTop: +calculatedStyle.borderTopWidth.match(/[0-9]*/)[0],
    borderBottom: +calculatedStyle.borderBottomWidth.match(/[0-9]*/)[0],
    marginLeft: +calculatedStyle.marginLeft.match(/[0-9]*/)[0],
    marginRight: +calculatedStyle.marginRight.match(/[0-9]*/)[0],
    marginTop: +calculatedStyle.marginTop.match(/[0-9]*/)[0],
    marginBottom: +calculatedStyle.marginBottom.match(/[0-9]*/)[0],
    paddingLeft: +calculatedStyle.paddingLeft.match(/[0-9]*/)[0],
    paddingRight: +calculatedStyle.paddingRight.match(/[0-9]*/)[0],
    paddingTop: +calculatedStyle.paddingTop.match(/[0-9]*/)[0],
    paddingBottom: +calculatedStyle.paddingBottom.match(/[0-9]*/)[0],
  };
}

function boxWrap(dims, what, node) {
  assign(node.style, {
    borderTopWidth: dims[what + 'Top'] + 'px',
    borderLeftWidth: dims[what + 'Left'] + 'px',
    borderRightWidth: dims[what + 'Right'] + 'px',
    borderBottomWidth: dims[what + 'Bottom'] + 'px',
    borderStyle: 'solid',
  });
}

var overlayStyles = {
  background: 'rgba(120, 170, 210, 0.7)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
};

module.exports = Overlay;
