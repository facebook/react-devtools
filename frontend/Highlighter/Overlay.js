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

    setStyle(this.node, {
      borderColor: overlayStyles.margin,
      pointerEvents: 'none',
      position: 'fixed',
    });

    this.tip = doc.createElement('div');
    setStyle(this.tip, {
      border: '1px solid #aaa',
      backgroundColor: 'rgb(255, 255, 178)',
      fontFamily: 'sans-serif',
      color: 'orange',
      padding: '3px 5px',
      position: 'fixed',
      fontSize: '10px',
    });

    this.nameSpan = doc.createElement('span');
    this.tip.appendChild(this.nameSpan);
    setStyle(this.nameSpan, {
      color:   'rgb(136, 18, 128)',
      marginRight: '5px',
    });
    this.dimSpan = doc.createElement('span');
    this.tip.appendChild(this.dimSpan);
    setStyle(this.dimSpan, {
      color: '#888',
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
    var pos = nodePos(node);
    var dims = getElementDimensions(node);

    boxWrap(dims, 'margin', this.node);
    boxWrap(dims, 'border', this.border);
    boxWrap(dims, 'padding', this.padding);

    setStyle(this.content, {
      height: node.offsetHeight - dims.borderTop - dims.borderBottom - dims.paddingTop - dims.paddingBottom + 'px',
      width: node.offsetWidth - dims.borderLeft - dims.borderRight - dims.paddingLeft - dims.paddingRight + 'px',
    });

    setStyle(this.node, {
      top: pos.top - dims.marginTop + 'px',
      left: pos.left - dims.marginLeft + 'px',
    });

    this.nameSpan.textContent = (name || node.nodeName.toLowerCase());
    this.dimSpan.textContent = node.offsetWidth + 'px × ' + node.offsetHeight + 'px'

    var tipPos = findTipPos({
      top: pos.top - dims.marginTop,
      left: pos.left - dims.marginLeft,
      height: node.offsetHeight + dims.marginTop + dims.marginBottom,
      width: node.offsetWidth + dims.marginLeft + dims.marginRight,
    }, this.win);
    setStyle(this.tip, tipPos);
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
    return {top, left: 0};
  }
  if (dims.left + 200 > win.innerWidth) {
    return {top, right: 0};
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
    paddingBottom: +calculatedStyle.paddingBottom.match(/[0-9]*/)[0]
  };
}

function boxWrap(dims, what, node) {
  setStyle(node, {
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
