/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Flash the background of a dom node to a different color and then fade back
 * to a base color.
 *
 * @flow
 */
'use strict';

type DOMElement = {
  style: Object,
  offsetTop: number;
};

function flash(node: DOMElement, flashColor: string, baseColor: string, duration: number) {
  node.style.transition = 'none';
  node.style.backgroundColor = flashColor;
  // force recalc
  void node.offsetTop;
  node.style.transition = `background-color ${duration}s ease`;
  node.style.backgroundColor = baseColor;
}

module.exports = flash;
