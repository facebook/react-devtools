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

function nodePos(node) {
  var left = node.offsetLeft;
  var top = node.offsetTop;
  while (node && node !== document.body && node.offsetParent) {
    var oP = node.offsetParent;
    var p = node.parentNode;
    while (p !== oP) {
      left -= p.scrollLeft;
      top -= p.scrollTop;
      p = p.parentNode;
    }
    left += oP.offsetLeft;
    top += oP.offsetTop;
    left -= oP.scrollLeft;
    top -= oP.scrollTop;
    node = oP;
  }
  // firefox needs this
  if (window.scrollX && window.scrollX !== document.body.scrollLeft) {
    left -= window.scrollX;
  }
  if (window.scrollY && window.scrollY !== document.body.scrollTop) {
    top -= window.scrollY;
  }
  return {left, top};
}

module.exports = nodePos;
