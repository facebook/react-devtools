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
var {monospace} = require('../Themes/Fonts');

import type {DOMNode, DOMRect, Window} from '../types';

/**
 * Note that this component is not affected by the active Theme,
 * Because it highlights elements in the main Chrome window (outside of devtools).
 * The colors below were chosen to roughly match those used by Chrome devtools.
 */
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
      backgroundColor: '#333740',
      borderRadius: '2px',
      fontFamily: monospace.family,
      fontWeight: 'bold',
      padding: '3px 5px',
      position: 'fixed',
      fontSize: monospace.sizes.normal + 'px',
    });

    this.nameSpan = doc.createElement('span');
    this.tip.appendChild(this.nameSpan);
    assign(this.nameSpan.style, {
      color:   '#ee78e6',
      borderRight: '1px solid #aaaaaa',
      paddingRight: '0.5rem',
      marginRight: '0.5rem',
    });
    this.dimSpan = doc.createElement('span');
    this.tip.appendChild(this.dimSpan);
    assign(this.dimSpan.style, {
      color: '#d7d7d7',
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
    var box = getNestedBoundingClientRect(node, this.win);
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
    this.dimSpan.textContent = box.width + 'px × ' + box.height + 'px';

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

function getElementDimensions(domElement) {
  var calculatedStyle = window.getComputedStyle(domElement);

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

// Get the window object for the document that a node belongs to,
// or return null if it cannot be found (node not attached to DOM,
// etc).
function getOwnerWindow(node: DOMNode): Window | null {
  if (!node.ownerDocument) {
    return null;
  }
  return node.ownerDocument.defaultView;
}

// Get the iframe containing a node, or return null if it cannot
// be found (node not within iframe, etc).
function getOwnerIframe(node: DOMNode): DOMNode | null {
  var nodeWindow = getOwnerWindow(node);
  if (nodeWindow) {
    return nodeWindow.frameElement;
  }
  return null;
}

// Get a bounding client rect for a node, with an
// offset added to compensate for its border.
function getBoundingClientRectWithBorderOffset(node: DOMNode) {
  var dimensions = getElementDimensions(node);

  return mergeRectOffsets([
    node.getBoundingClientRect(),
    {
      top: dimensions.borderTop,
      left: dimensions.borderLeft,
      bottom: dimensions.borderBottom,
      right: dimensions.borderRight,
      // This width and height won't get used by mergeRectOffsets (since this
      // is not the first rect in the array), but we set them so that this
      // object typechecks as a DOMRect.
      width: 0,
      height: 0,
    },
  ]);
}

// Add together the top, left, bottom, and right properties of
// each DOMRect, but keep the width and height of the first one.
function mergeRectOffsets(rects: Array<DOMRect>): DOMRect {
  return rects.reduce((previousRect, rect) => {
    if (previousRect == null) {
      return rect;
    }

    return {
      top: previousRect.top + rect.top,
      left: previousRect.left + rect.left,
      width: previousRect.width,
      height: previousRect.height,
      bottom: previousRect.bottom + rect.bottom,
      right: previousRect.right + rect.right,
    };
  });
}

// Calculate a boundingClientRect for a node relative to boundaryWindow,
// taking into account any offsets caused by intermediate iframes.
function getNestedBoundingClientRect(node: DOMNode, boundaryWindow: Window): DOMRect {
  var ownerIframe = getOwnerIframe(node);
  if (
    ownerIframe &&
    ownerIframe !== boundaryWindow
  ) {
    var rects = [node.getBoundingClientRect()];
    var currentIframe = ownerIframe;
    var onlyOneMore = false;
    while (currentIframe) {
      var rect = getBoundingClientRectWithBorderOffset(currentIframe);
      rects.push(rect);
      currentIframe = getOwnerIframe(currentIframe);

      if (onlyOneMore) {
        break;
      }
      // We don't want to calculate iframe offsets upwards beyond
      // the iframe containing the boundaryWindow, but we
      // need to calculate the offset relative to the boundaryWindow.
      if (currentIframe && getOwnerWindow(currentIframe) === boundaryWindow) {
        onlyOneMore = true;
      }
    }

    return mergeRectOffsets(rects);
  } else {
    return node.getBoundingClientRect();
  }
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
