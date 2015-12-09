/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const BananaSlugAbstractNodeMeasurer = require('./BananaSlugAbstractNodeMeasurer');

const DUMMY = {
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  scrollX: 0,
  scrollY: 0,
  top: 0,
  width: 0,
};

class BananaSlugWebNodeMeasurer extends BananaSlugAbstractNodeMeasurer {
  constructor() {
    super();
  }

  measureImpl(node): ?Object {
    if (!node || typeof node.getBoundingClientRect !== 'function') {
      return DUMMY;
    }

    var rect = node.getBoundingClientRect();
    var scrollX = Math.max(
      document.body ? document.body.scrollLeft : 0,
      document.documentElement.scrollLeft,
      window.pageXOffset || 0,
      window.scrollX || 0,
    );

    var scrollY = Math.max(
      document.body ? document.body.scrollTop : 0,
      document.documentElement.scrollTop,
      window.pageYOffset || 0,
      window.scrollY || 0,
    );

    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
      scrollY,
      scrollX,
    };
  }
}

module.exports = BananaSlugWebNodeMeasurer;